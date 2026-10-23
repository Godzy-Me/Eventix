import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Header from '../components/seat-layout/Header'
import Footer from '../components/seat-layout/Footer'
import { useParams, useNavigate, useLocation as useRouterLocation } from 'react-router-dom';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast';
import { getShowById } from '../apis'
import screenImg from "../assets/screen.png"
import { useSeatContext } from "../context/SeatContext";
import { getSocket, emitAuthed, disconnectSocket } from "../lib/socket";

const MAX_SEATS = 10;

/**
 * status: "available" | "selected" | "booked" | "locked"
 *  booked   -> already sold (from the database)
 *  locked   -> another user is paying for it right now (from Redis, pushed live over Socket.IO)
 *  selected -> picked by you
 */
const Seat = ({ seat, row, status, onSelect }) => {
  const styles = {
    available: "hover:bg-gray-100 border-black cursor-pointer",
    selected: "bg-purple-600 text-white border-purple-600 cursor-pointer",
    booked: "bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed",
    locked: "bg-yellow-100 border-yellow-400 text-yellow-700 cursor-not-allowed animate-pulse",
  };

  const disabled = status === "booked" || status === "locked";

  return (
    <button
      type="button"
      title={
        status === "locked"
          ? "Someone else is booking this seat"
          : status === "booked"
            ? "Already booked"
            : `${row}${seat.number}`
      }
      className={`w-9 h-9 m-[2px] rounded-lg border text-sm transition-colors ${styles[status]}`}
      disabled={disabled}
      onClick={() => onSelect(row, seat.number)}
    >
      {status === "booked" ? "×" : seat.number}
    </button>
  );
};

const SeatLayout = () => {
  const { showId, state } = useParams();
  const navigate = useNavigate();
  const routerLocation = useRouterLocation();
  const queryClient = useQueryClient();
  const { selection, setSelection, selectedSeats, setSelectedSeats } = useSeatContext();

  // seatId -> { mine, ttl }  (live, from Redis via Socket.IO)
  const [lockedSeats, setLockedSeats] = useState(() => new Map());
  const [isLocking, setIsLocking] = useState(false);
  const restoredMineRef = useRef(false);
  const selectedRef = useRef([]);

  const { data: showResponse } = useQuery({
    queryKey: ['show', showId],
    queryFn: () => getShowById(showId),
    placeholderData: keepPreviousData,
  });

  const showData = showResponse?.data?.show || showResponse?.data || showResponse;

  // always-current copy of the selection for socket callbacks (they are registered once)
  useEffect(() => {
    selectedRef.current = selectedSeats;
  }, [selectedSeats]);

  // A selection belongs to ONE show. Opening another show starts from a clean slate.
  useEffect(() => {
    if (selection.showId !== showId) {
      setSelection({ showId, seatIds: [], expiresAt: null, returnTo: routerLocation.pathname });
    } else if (selection.returnTo !== routerLocation.pathname) {
      setSelection((prev) => ({ ...prev, returnTo: routerLocation.pathname }));
    }
    restoredMineRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showId]);

  // ---- real-time seat state ------------------------------------------------
  useEffect(() => {
    const socket = getSocket();

    // 1. join the show's room; server answers with the current locks ("locked-seats-initial")
    const join = () => socket.emit("join-show", showId);

    const onInitial = ({ showId: id, lockedSeats: list }) => {
      if (id !== showId) return;
      setLockedSeats(new Map(list.map((l) => [l.seatId, l])));

      // coming back from checkout: seats you still hold show up as selected again
      if (!restoredMineRef.current) {
        restoredMineRef.current = true;
        const mine = list.filter((l) => l.mine).map((l) => l.seatId);
        if (mine.length) setSelectedSeats((prev) => (prev.length ? prev : mine));
      }
    };

    const onLocked = ({ showId: id, seatIds }) => {
      if (id !== showId) return;
      setLockedSeats((prev) => {
        const next = new Map(prev);
        seatIds.forEach((s) => next.set(s, { seatId: s, mine: false }));
        return next;
      });
      // someone grabbed a seat you had highlighted
      const lost = selectedRef.current.filter((s) => seatIds.includes(s));
      if (lost.length) {
        toast.error(`${lost.join(", ")} just got taken by another user`);
        setSelectedSeats((prev) => prev.filter((s) => !seatIds.includes(s)));
      }
    };

    const onUnlocked = ({ showId: id, seatIds }) => {
      if (id !== showId) return;
      setLockedSeats((prev) => {
        const next = new Map(prev);
        seatIds.forEach((s) => next.delete(s));
        return next;
      });
    };

    const onBooked = ({ showId: id, seatIds }) => {
      if (id !== showId) return;
      setSelectedSeats((prev) => prev.filter((s) => !seatIds.includes(s)));
      // seat is sold now: refetch so it renders as booked from the DB
      queryClient.invalidateQueries({ queryKey: ['show', showId] });
    };

    const onLockFailed = ({ showId: id, seatIds }) => {
      if (id !== showId) return;
      setSelectedSeats((prev) => prev.filter((s) => !seatIds.includes(s)));
    };

    socket.on("connect", join);
    socket.on("locked-seats-initial", onInitial);
    socket.on("seat-locked", onLocked);
    socket.on("seat-unlocked", onUnlocked);
    socket.on("seat-booked", onBooked);
    socket.on("seat-lock-failed", onLockFailed);

    if (socket.connected) join();
    else socket.connect();

    return () => {
      socket.emit("leave-show", showId);
      socket.off("connect", join);
      socket.off("locked-seats-initial", onInitial);
      socket.off("seat-locked", onLocked);
      socket.off("seat-unlocked", onUnlocked);
      socket.off("seat-booked", onBooked);
      socket.off("seat-lock-failed", onLockFailed);
      // the Redis hold survives a disconnect on purpose: it must outlive this page (checkout, back button)
      disconnectSocket();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showId]);

  // ---- derived data --------------------------------------------------------
  const seatMeta = useMemo(() => {
    const map = new Map();
    (showData?.seatLayout || []).forEach((row) =>
      row.seats.forEach((seat) =>
        map.set(`${row.row}${seat.number}`, { type: row.type, price: row.price })
      )
    );
    return map;
  }, [showData]);

  const totalPrice = useMemo(
    () => selectedSeats.reduce((sum, id) => sum + (seatMeta.get(id)?.price || 0), 0),
    [selectedSeats, seatMeta]
  );

  const getStatus = (row, number, dbStatus) => {
    const seatId = `${row}${number}`;
    if (dbStatus === "BOOKED" || dbStatus === "BLOCKED") return "booked";
    if (selectedSeats.includes(seatId)) return "selected";
    const lock = lockedSeats.get(seatId);
    if (lock && !lock.mine) return "locked";
    return "available";
  };

  const handleSelectSeat = (row, number) => {
    const seatId = `${row}${number}`;

    if (!selectedSeats.includes(seatId) && selectedSeats.length >= MAX_SEATS) {
      toast.error(`You can select up to ${MAX_SEATS} seats at a time`);
      return;
    }

    setSelectedSeats((prev) =>
      prev.includes(seatId) ? prev.filter((existingId) => existingId !== seatId) : [...prev, seatId]
    );
  }

  // 6A. "Proceed": ask the server to lock every selected seat atomically, then go to checkout
  const handleProceed = useCallback(async () => {
    if (!selectedSeats.length || isLocking) return;
    setIsLocking(true);
    try {
      const socket = getSocket();
      const res = await emitAuthed(
        "lock-seats",
        { showId, seatIds: selectedSeats },
        // after a token refresh the connection is new, so re-join the show room
        { onReconnect: () => socket.emit("join-show", showId) }
      );

      if (!res?.success) {
        if (res?.failedSeats?.length) {
          setSelectedSeats((prev) => prev.filter((s) => !res.failedSeats.includes(s)));
        }
        toast.error(res?.message || "Could not hold these seats. Please try again.");
        return;
      }

      setSelection((prev) => ({
        ...prev,
        showId,
        seatIds: selectedSeats,
        expiresAt: res.expiresAt,
        returnTo: routerLocation.pathname,
      }));
      // 6B. go to the checkout page (it shows the countdown)
      navigate(`/shows/${showId}/${encodeURIComponent(state || "West Bengal")}/checkout`);
    } catch (err) {
      console.error(err);
      toast.error("Connection problem. Please try again.");
    } finally {
      setIsLocking(false);
    }
  }, [selectedSeats, isLocking, showId, state, navigate, routerLocation.pathname, setSelection, setSelectedSeats]);

  return (
    <div className='h-screen overflow-y-hidden flex flex-col'>
      {/* Fixed Header */}
      <div className='fixed top-0 left-0 w-full z-10'>
        <Header showData={showData} />
      </div>

      {/* Scrollable Seat Layout */}
      <div className="max-w-7xl mx-auto mt-[210px] px-6 pb-4 bg-white h-[calc(100vh-320px)] overflow-y-scroll scrollbar-hide">
        <div className="flex flex-col items-center justify-center">
          {showData?.seatLayout && (
            <div className="flex flex-col items-center justify-center">
              {Object.entries(
                showData.seatLayout.reduce((acc, curr) => {
                  if (!acc[curr.type])
                    acc[curr.type] = { price: curr.price, rows: [] };
                  acc[curr.type].rows.push(curr);
                  return acc;
                }, {})
              ).map(([type, { price, rows }]) => (
                <div
                  key={type}
                  className="mb-12 w-full flex flex-col items-center justify-center"
                >
                  <h2 className="text-center font-semibold text-lg mb-4">
                    {type} : ₹{price}
                  </h2>
                  <div className="space-y-2">
                    {rows.map((rowObj) => (
                      <div key={rowObj.row} className="flex items-center">
                        <div className="w-6 text-right mr-2 text-sm text-gray-600">
                          {rowObj.row}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {rowObj.seats.map((seat) => (
                            <Seat
                              key={seat.number}
                              seat={seat}
                              row={rowObj.row}
                              status={getStatus(rowObj.row, seat.number, seat.status)}
                              onSelect={handleSelectSeat}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-center mt-5">
            <img
              src={screenImg}
              alt="Screen"
              className="w-[300px] md:w-[400px] object-contain opacity-80"
            />
          </div>
        </div>
      </div>

      {/* Fixed Footer */}
      <div className='fixed bottom-0 left-0 w-full h-[100px] bg-white border-t border-gray-200 py-4 px-4 z-10'>
        <Footer
          selectedCount={selectedSeats.length}
          totalPrice={totalPrice}
          onProceed={handleProceed}
          loading={isLocking}
        />
      </div>
    </div>
  );
};

export default SeatLayout;
