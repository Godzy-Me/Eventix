import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import Header from '../components/seat-layout/Header'
import MockPaymentModal from '../components/checkout/MockPaymentModal'
import dayjs from 'dayjs'
import { groupSeatsByType } from "../utils";
import { FaInfoCircle } from "react-icons/fa";
import { BiSolidOffer } from "react-icons/bi";
import { CiCircleQuestion, CiUser } from "react-icons/ci";
import {
    cancelPendingBooking,
    createPaymentOrder,
    getMyLocks,
    getShowById,
    mockPay,
    reportPaymentFailed,
    verifyPayment,
} from '../apis'
import { getErrorMessage } from '../apis/axiosWrapper'
import { useAuth } from '../context/AuthContext'
import { useSeatContext } from '../context/SeatContext'
import { useDeadline } from '../hooks/useDeadline'
import { loadRazorpay } from '../lib/razorpay'

const TAX_RATE = 0.05;
const round2 = (n) => Math.round(n * 100) / 100;

const Checkout = () => {
    const { showId } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const { selection, setSelection, clearSelection } = useSeatContext();

    const [isPaying, setIsPaying] = useState(false);
    const [mockOrder, setMockOrder] = useState(null); // { orderId, amount, bookingId }
    const [restoring, setRestoring] = useState(false);
    const orderRef = useRef(null); // the gateway order of the payment in progress
    const paidRef = useRef(false);

    const { data: showResponse, isLoading: showLoading } = useQuery({
        queryKey: ['show', showId],
        queryFn: () => getShowById(showId),
    });
    const show = showResponse?.data;

    const seatIds = useMemo(
        () => (selection.showId === showId ? selection.seatIds : []),
        [selection.showId, selection.seatIds, showId]
    );
    const returnTo = selection.returnTo;

    // ---- restore after a page refresh: ask the server which seats I still hold ----
    useEffect(() => {
        if (seatIds.length || restoring) return;
        let cancelled = false;
        setRestoring(true);
        (async () => {
            try {
                const { data } = await getMyLocks(showId);
                if (cancelled) return;
                if (data.seatIds.length) {
                    setSelection({
                        showId,
                        seatIds: data.seatIds,
                        expiresAt: Date.now() + data.ttlSeconds * 1000,
                        returnTo: null,
                    });
                } else {
                    toast.error("Your seat hold has expired. Please select seats again.");
                    navigate("/movies", { replace: true });
                }
            } catch {
                navigate("/movies", { replace: true });
            } finally {
                if (!cancelled) setRestoring(false);
            }
        })();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showId]);

    // ---- price (display only; the server recomputes everything from the DB) ----
    const selectedSeats = useMemo(() => {
        if (!show?.seatLayout) return [];
        const meta = new Map();
        show.seatLayout.forEach((row) => meta.set(row.row, { type: row.type, price: row.price }));
        return seatIds.map((id) => ({ seatNumber: id, ...(meta.get(id.charAt(0)) || { type: "UNKNOWN", price: 0 }) }));
    }, [show, seatIds]);

    const baseAmount = round2(selectedSeats.reduce((sum, s) => sum + s.price, 0));
    const taxAmount = round2(baseAmount * TAX_RATE);
    const totalAmount = round2(baseAmount + taxAmount);

    // ---- seat hold countdown ----
    const { displayTime, isExpired, secondsLeft } = useDeadline(selection.expiresAt);

    const goBackToSeats = useCallback(() => {
        navigate(returnTo || "/movies", { replace: true });
    }, [navigate, returnTo]);

    useEffect(() => {
        // when the hold runs out the seats go back on sale. (Not while a payment is in progress -
        // the server extends the hold for the payment window.)
        if (isExpired && !isPaying && !paidRef.current) {
            toast.error("Time's up! Your seats were released.");
            clearSelection();
            goBackToSeats();
        }
    }, [isExpired, isPaying, clearSelection, goBackToSeats]);

    // ---- payment ----
    const finishPayment = useCallback(async (payload) => {
        try {
            const { data } = await verifyPayment(payload);
            paidRef.current = true;
            clearSelection();
            queryClient.invalidateQueries({ queryKey: ['myBookings'] });
            queryClient.invalidateQueries({ queryKey: ['show', showId] });
            toast.success("Payment successful! Booking confirmed 🎉");
            navigate(`/booking/${data.bookingId}/confirmation`, { replace: true });
        } catch (error) {
            toast.error(getErrorMessage(error, "Payment verification failed"), { duration: 6000 });
            if (error?.response?.status === 409) {
                // seats were taken while paying - the server already started the refund
                clearSelection();
                goBackToSeats();
            }
        } finally {
            setIsPaying(false);
            setMockOrder(null);
        }
    }, [clearSelection, goBackToSeats, navigate, queryClient, showId]);

    const handleFailure = useCallback(async (orderId, reason) => {
        try {
            await reportPaymentFailed({ orderId, reason });
        } catch {
            /* best effort */
        }
        toast.error(reason || "Payment failed. You can try again.");
        setIsPaying(false);
        setMockOrder(null);
    }, []);

    const handleProceedToPay = async () => {
        if (isPaying || !seatIds.length) return;
        setIsPaying(true);

        let order;
        try {
            // server re-validates seats, lock ownership, show time and prices, then creates the order
            const { data } = await createPaymentOrder({ showId, seatIds });
            order = data;
            orderRef.current = order;
        } catch (error) {
            toast.error(getErrorMessage(error, "Could not start payment"));
            setIsPaying(false);
            if (error?.response?.status === 409) {
                clearSelection();
                goBackToSeats();
            }
            return;
        }

        // ---- local mock gateway (no Razorpay keys on the server) ----
        if (order.provider === "mock") {
            setMockOrder(order);
            return;
        }

        // ---- Razorpay Checkout ----
        const loaded = await loadRazorpay();
        if (!loaded) {
            toast.error("Could not load Razorpay. Check your internet connection.");
            setIsPaying(false);
            return;
        }

        const rzp = new window.Razorpay({
            key: order.keyId,
            amount: order.amount,
            currency: order.currency,
            order_id: order.orderId,
            name: "BookMyScreen",
            description: order.description,
            prefill: order.prefill,
            theme: { color: "#f84464" },
            // success: Razorpay hands us the signature, our server verifies it before confirming
            handler: (response) =>
                finishPayment({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                }),
            modal: {
                ondismiss: () => setIsPaying(false),
            },
        });
        rzp.on("payment.failed", (resp) =>
            handleFailure(order.orderId, resp?.error?.description || "Payment failed")
        );
        rzp.open();
    };

    const handleMockPay = async () => {
        try {
            const { data } = await mockPay(mockOrder.orderId);
            await finishPayment({
                razorpay_order_id: data.orderId,
                razorpay_payment_id: data.paymentId,
                razorpay_signature: data.signature,
            });
        } catch (error) {
            toast.error(getErrorMessage(error, "Mock payment failed"));
            setIsPaying(false);
            setMockOrder(null);
        }
    };

    // leaving checkout through the browser back button keeps the hold (you can come back) - but an
    // explicit pending booking is cancelled so it never lingers
    const handleBack = async () => {
        if (orderRef.current?.bookingId && !paidRef.current) {
            try { await cancelPendingBooking(orderRef.current.bookingId); } catch { /* ignore */ }
        }
        goBackToSeats();
    };

    if (showLoading || restoring || !show) {
        return (
            <div className="min-h-screen flex items-center justify-center text-gray-500">
                Loading your booking...
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-white">
            <Header type="checkout" showData={show} />

            {/* Seat hold timer */}
            <div className={`text-center text-sm py-2 font-medium ${secondsLeft !== null && secondsLeft <= 60 ? "bg-red-50 text-red-600" : "bg-yellow-50 text-yellow-800"}`}>
                Your seats are held for <span className="font-bold tabular-nums">{displayTime}</span> — complete the payment before the timer ends.
            </div>

            <div className="max-w-6xl mx-auto px-4 py-6">
                <button onClick={handleBack} className="text-sm text-gray-500 hover:text-black mb-4 cursor-pointer">
                    ← Change seats
                </button>

                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left Section */}
                    <div className="flex-1 space-y-4">
                        {/* Movie Details */}
                        <div className="flex gap-4">
                            <img
                                src={show.movie?.posterUrl}
                                alt={show.movie?.title}
                                className="w-[60px] h-[90px] rounded object-cover"
                            />

                            <div>
                                <h3 className="font-semibold text-lg">
                                    {show.movie?.title}
                                </h3>

                                <p className="text-sm text-gray-600">
                                    {show.movie?.certification} |{" "}
                                    {(show.movie?.languages || []).join(", ")} |{" "}
                                    {show.format}
                                </p>
                                <p className="text-sm text-gray-600">
                                    {show.theater?.name}, {show.theater?.city}, {" "}
                                    {show.theater?.state}
                                </p>
                            </div>
                        </div>

                        {/* Show Details */}
                        <div className="border border-gray-200 rounded-[24px] px-6 py-5">
                            <p className="text-md font-medium border-b pb-5 border-gray-200">
                                {dayjs(show.date, "DD-MM-YYYY").format("ddd, D MMM YYYY")}{" "}
                                <span className="font-semibold">{show.startTime}</span>
                            </p>

                            <div className="flex items-center justify-between mt-4 mb-4">
                                <div>
                                    <p className="text-md mt-2 font-semibold">
                                        {selectedSeats.length} ticket(s)
                                    </p>

                                    <div className="text-sm text-gray-500">
                                        <div className="font-medium">
                                            {groupSeatsByType(selectedSeats.map(s => s.seatNumber)).map(({ type, seats }) => (
                                                <p key={type} className="font-medium">
                                                    {type} - {seats.join(", ")}
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <p className="text-md font-semibold mt-2">
                                    <span className="text-gray-700">₹</span>
                                    {baseAmount}
                                </p>
                            </div>
                        </div>

                        {/*Cancellation notice*/}

                        <div className="bg-white border rounded-[24px] border-gray-200 text-yellow-800 text-sm px-5 py-5 tracking-wide">
                            <span className="font-medium flex items-center gap-2">
                                <FaInfoCircle size={24} /> No cancellation or refund available after payment.
                            </span>
                        </div>

                        {/* Offers */}
                        <div className="flex items-center justify-between border rounded-[24px] border-gray-200 px-6 py-5">
                            <p className="font-medium text-sm flex items-center gap-2">
                                <BiSolidOffer size={20} /> Available Offers
                            </p>

                            <p className="text-sm text-center text-blue-600 font-medium cursor-pointer">
                                View all offers
                            </p>
                        </div>
                    </div>


                    {/* Right Section */}
                    <div className="w-full lg:w-[300px] space-y-4">
                        <h4 className="font-medium text-gray-900 text-lg">
                            Payment Summary
                        </h4>

                        <div className="border border-gray-200 rounded-[24px] px-6 py-7 space-y-2">
                            <div className="flex justify-between text-md">
                                <span className="text-sm text-gray-500">Order amount</span>
                                <span>₹{baseAmount}</span>
                            </div>

                            <div className="flex justify-between text-md pb-4">
                                <span className="font-semibold text-sm">
                                    Taxes & fees (5%)
                                </span>
                                <span>₹{taxAmount}</span>
                            </div>

                            <div className="flex justify-between text-md font-semibold border-t border-gray-200 pt-4">
                                <span>To be paid</span>
                                <span>₹{totalAmount}</span>
                            </div>
                        </div>

                        {/* User details */}
                        <h4 className="text-lg font-medium">Your details</h4>

                        <div className="border flex items-start gap-3 border-gray-200 rounded-[24px] px-6 py-7">
                            <CiUser size={24} />

                            <div className="mt-1">
                                <p className="text-sm font-medium">{user?.name}</p>
                                {user?.phone && <p className="text-sm text-gray-600">+91-{user.phone}</p>}
                                <p className="text-sm text-gray-600">{user?.email}</p>
                                <p className="text-sm text-gray-600">{show.theater?.state}</p>
                            </div>
                        </div>

                        {/* Terms and button */}
                        <div className="border border-gray-200 rounded-[24px] px-6 py-5">
                            <p className="text-sm font-medium cursor-pointer flex items-center gap-2">
                                <CiCircleQuestion size={24} /> Terms and conditions
                            </p>
                        </div>

                        <button
                            onClick={handleProceedToPay}
                            disabled={isPaying}
                            className="w-full flex justify-between items-center bg-black rounded-[24px] px-6 py-4 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            <p className="text-white font-bold">
                                ₹{totalAmount} <span className="text-xs font-medium">TOTAL</span>
                            </p>

                            <p className="text-white font-medium">{isPaying ? "Processing..." : "Proceed To Pay"}</p>
                        </button>
                    </div>

                </div>
            </div>

            {mockOrder && (
                <MockPaymentModal
                    amountPaise={mockOrder.amount}
                    busy={false}
                    onPay={handleMockPay}
                    onFail={() => handleFailure(mockOrder.orderId, "Payment failed (simulated)")}
                    onClose={() => { setMockOrder(null); setIsPaying(false); }}
                />
            )}
        </div>
    );
};

export default Checkout;
