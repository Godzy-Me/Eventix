import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useCountdown } from "../../hooks/useCountdown";
import { IoClose } from "react-icons/io5";
import { sendOtp, verifyOtp } from "../../apis";
import { getErrorMessage } from "../../apis/axiosWrapper";
import { useAuth } from "../../context/AuthContext";

const OTP_LENGTH = 4;

const StepOTP = ({ onNext }) => {
    const [otpArray, setOtpArray] = useState(new Array(OTP_LENGTH).fill(""));
    const inputsRef = useRef([]);
    const { otpData, setOtpData, loginSuccess, closeModal } = useAuth();

    const { displayTime, isExpired, reset } = useCountdown({
        initialTimeInSeconds: 2 * 60,
    });

    const focusInput = (index) => inputsRef.current[index]?.focus();

    const handleOtpChange = (e, index) => {
        const value = e.target.value;
        if (value && !/^\d$/.test(value.slice(-1))) return;
        const newOtp = [...otpArray];
        newOtp[index] = value.slice(-1);
        setOtpArray(newOtp);
        if (value && index < OTP_LENGTH - 1) focusInput(index + 1);
    };

    const handleKeyDown = (e, index) => {
        if (e.key === "Backspace" && !otpArray[index] && index > 0) focusInput(index - 1);
    };

    const handlePaste = (e) => {
        const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
        if (!digits) return;
        e.preventDefault();
        const newOtp = new Array(OTP_LENGTH).fill("");
        digits.split("").forEach((d, i) => (newOtp[i] = d));
        setOtpArray(newOtp);
        focusInput(Math.min(digits.length, OTP_LENGTH - 1));
    };

    const clearOtp = () => {
        setOtpArray(new Array(OTP_LENGTH).fill(""));
        focusInput(0);
    };

    const verifyMutation = useMutation({
        mutationFn: () => verifyOtp({ email: otpData.email, hash: otpData.hash, otp: otpArray.join("") }),
        onSuccess: ({ data }) => {
            loginSuccess(data.user);
            if (data.user.activateUser) {
                toast.success(`Welcome back, ${data.user.name}!`);
                closeModal();
            } else {
                // brand new account -> ask for name + phone
                onNext();
            }
        },
        onError: (error) => {
            toast.error(getErrorMessage(error, "Could not verify OTP"));
            clearOtp();
        },
    });

    const resendMutation = useMutation({
        mutationFn: () => sendOtp(otpData.email),
        onSuccess: ({ data }) => {
            setOtpData({ email: data.email, hash: data.hash });
            reset(2 * 60);
            clearOtp();
            toast.success("A new OTP has been sent");
        },
        onError: (error) => toast.error(getErrorMessage(error, "Could not resend OTP")),
    });

    const handleVerifyOtp = (e) => {
        e.preventDefault();
        if (otpArray.some((d) => !d)) return toast.error("Enter the 4 digit code");
        verifyMutation.mutate();
    };

    const handleResendOtp = (e) => {
        e.preventDefault();
        resendMutation.mutate();
    };

    return (
        <form onSubmit={handleVerifyOtp} className="flex flex-col gap-3 px-10 py-6">
            <h2 className="text-center text-lg font-semibold">
                Enter the code we just mailed you
            </h2>

            <p className="text-center text-sm text-gray-500">
                Sent to {otpData?.email}
            </p>

            {/* OTP INPUT */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-center">
                    {otpArray.map((digit, index) => (
                        <input
                            key={index}
                            ref={(el) => (inputsRef.current[index] = el)}
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            name="otp"
                            maxLength={1}
                            value={digit}
                            autoFocus={index === 0}
                            onChange={(e) => handleOtpChange(e, index)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            onPaste={handlePaste}
                            className="w-12 h-12 font-bold text-center rounded-md mx-1 border border-gray-200 text-gray-800 outline-none focus:border-[#f74565]"
                        />
                    ))}

                    <button
                        type="button"
                        onClick={clearOtp}
                        title="Clear"
                        className="w-8 h-8 border border-gray-200 flex items-center justify-center text-[#f74565] ml-1 font-bold rounded-md cursor-pointer"
                    >
                        <IoClose size={24} className="inline" />
                    </button>
                </div>

                {isExpired ? (
                    <p className="text-center text-xs text-indigo-500">
                        OTP expired. Please{" "}
                        <a
                            href=""
                            className="underline cursor-pointer"
                            onClick={handleResendOtp}
                        >
                            {resendMutation.isPending ? "sending..." : "resend OTP"}
                        </a>
                        .
                    </p>
                ) : (
                    <p className="text-center text-sm">
                        OTP expires in {displayTime}
                    </p>
                )}
            </div>

            <button
                type="submit"
                disabled={verifyMutation.isPending || isExpired}
                className="w-full cursor-pointer text-white bg-black py-2 rounded-md text-lg hover:bg-gray-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
                {verifyMutation.isPending ? "Verifying..." : "Continue"}
            </button>

            <p className="text-[#4c5c5] text-center m-auto text-[12px]">
                By entering your email id, you're agreeing to our{" "}
                <a href="" className="text-[#f74565]">Terms of Service</a>{" "}
                and{" "}
                <a href="" className="text-[#f74565]">Privacy Policy</a>. Thanks!
            </p>
        </form>
    );
};

export default StepOTP;
