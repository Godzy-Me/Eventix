import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

// 1. Create the Context
const SeatContext = createContext();

// 2. Create the custom hook for easy access
export const useSeatContext = () => {
  const context = useContext(SeatContext);
  if (!context) {
    throw new Error("useSeatContext must be used within a SeatProvider");
  }
  return context;
};

/**
 * selection = {
 *   showId,       // which show these seats belong to
 *   seatIds,      // ["A1","A2"]
 *   expiresAt,    // epoch ms when the Redis hold runs out (set once the seats are locked)
 *   returnTo,     // path of the seat page, so checkout can send the user back
 * }
 */
const EMPTY = { showId: null, seatIds: [], expiresAt: null, returnTo: null };

// 3. Create the Provider component
export const SeatProvider = ({ children }) => {
  const [selection, setSelection] = useState(EMPTY);

  // Backwards compatible API used by the seat page: selectedSeats / setSelectedSeats(updater)
  const selectedSeats = selection.seatIds;
  const setSelectedSeats = useCallback((updater) => {
    setSelection((prev) => ({
      ...prev,
      seatIds: typeof updater === "function" ? updater(prev.seatIds) : updater,
    }));
  }, []);

  const clearSelection = useCallback(() => setSelection(EMPTY), []);

  const value = useMemo(
    () => ({ selection, setSelection, selectedSeats, setSelectedSeats, clearSelection }),
    [selection, selectedSeats, setSelectedSeats, clearSelection]
  );

  return <SeatContext.Provider value={value}>{children}</SeatContext.Provider>;
};
