import { useEffect, useState } from "react";

/**
 * Counts down to an absolute deadline (epoch ms). Unlike a plain "seconds left" counter it stays
 * correct after tab throttling / sleeping laptops, because it always compares against Date.now().
 */
export const useDeadline = (deadlineMs) => {
    const compute = () => (deadlineMs ? Math.max(0, Math.ceil((deadlineMs - Date.now()) / 1000)) : null);
    const [secondsLeft, setSecondsLeft] = useState(compute);

    useEffect(() => {
        setSecondsLeft(compute());
        if (!deadlineMs) return undefined;
        const id = setInterval(() => setSecondsLeft(compute()), 500);
        return () => clearInterval(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [deadlineMs]);

    const mm = secondsLeft == null ? "--" : String(Math.floor(secondsLeft / 60)).padStart(2, "0");
    const ss = secondsLeft == null ? "--" : String(secondsLeft % 60).padStart(2, "0");

    return {
        secondsLeft,
        displayTime: `${mm}:${ss}`,
        isExpired: secondsLeft !== null && secondsLeft <= 0,
    };
};
