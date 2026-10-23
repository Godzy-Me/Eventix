import { useCallback, useEffect, useState } from "react";

export const useCountdown = ({ initialTimeInSeconds }) => {
    const [timeInSeconds, setTimeInSeconds] = useState(initialTimeInSeconds);
    // bumping this restarts the interval (used by "resend OTP")
    const [runId, setRunId] = useState(0);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setTimeInSeconds((prevTime) => {
                if (prevTime <= 1) {
                    clearInterval(intervalId);
                    return 0;
                }

                return prevTime - 1;
            });
        }, 1000);

        return () => clearInterval(intervalId);
    }, [runId]);

    const reset = useCallback((seconds = initialTimeInSeconds) => {
        setTimeInSeconds(seconds);
        setRunId((id) => id + 1);
    }, [initialTimeInSeconds]);

    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;

    const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
    const displaySeconds = seconds < 10 ? `0${seconds}` : seconds;

    return {
        displayTime: `${displayMinutes}:${displaySeconds}`,
        isExpired: timeInSeconds <= 0,
        reset,
    };
};
