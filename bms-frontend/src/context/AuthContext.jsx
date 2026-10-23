import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { logoutUser } from "../apis";
import { setSessionFlag } from "../apis/axiosWrapper";
import { disconnectSocket } from "../lib/socket";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const queryClient = useQueryClient();

    // sign-in modal state
    const [step, setStep] = useState(0);
    const [showModal, setShowModal] = useState(false);
    // data carried between the OTP steps: { email, hash }
    const [otpData, setOtpData] = useState(null);

    // session state
    const [user, setUser] = useState(null);
    const [auth, setAuth] = useState(false);

    const toggleModal = useCallback(() => {
        setShowModal((open) => {
            if (!open) setStep(0); // always start the flow from the email step
            return !open;
        });
    }, []);

    const closeModal = useCallback(() => {
        setShowModal(false);
        setStep(0);
        setOtpData(null);
    }, []);

    const loginSuccess = useCallback((userData) => {
        setUser(userData);
        setAuth(true);
        setSessionFlag(true);
    }, []);

    const clearSession = useCallback(() => {
        setUser(null);
        setAuth(false);
        setSessionFlag(false);
        disconnectSocket();
        queryClient.removeQueries({ queryKey: ["myBookings"] });
        queryClient.removeQueries({ queryKey: ["booking"] });
    }, [queryClient]);

    const logout = useCallback(async () => {
        try {
            await logoutUser();
        } catch {
            // even if the request fails we still drop the local session
        }
        clearSession();
        toast.success("Logged out");
    }, [clearSession]);

    // the axios interceptor fires this when the refresh token itself is no longer valid
    useEffect(() => {
        const onForcedLogout = () => {
            clearSession();
            toast.error("Your session expired. Please sign in again.");
        };
        window.addEventListener("auth:logout", onForcedLogout);
        return () => window.removeEventListener("auth:logout", onForcedLogout);
    }, [clearSession]);

    return (
        <AuthContext.Provider
            value={{
                step,
                setStep,
                showModal,
                toggleModal,
                closeModal,
                otpData,
                setOtpData,
                user,
                setUser,
                auth,
                setAuth,
                loginSuccess,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
