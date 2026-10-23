import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { sendOtp } from "../../apis";
import { getErrorMessage } from "../../apis/axiosWrapper";
import { useAuth } from "../../context/AuthContext";

const StepEmail = ({ onNext }) => {
    const [email, setEmail] = useState("");
    const { setOtpData } = useAuth();

    const { mutate, isPending } = useMutation({
        mutationFn: () => sendOtp(email.trim()),
        onSuccess: ({ data }) => {
            // the backend returns hash = HMAC(email.otp.expiry):expiry - we send it back with the OTP to verify
            setOtpData({ email: data.email, hash: data.hash });
            toast.success("OTP sent to your email");
            onNext();
        },
        onError: (error) => toast.error(getErrorMessage(error, "Could not send OTP")),
    });

    const handleSendOtp = (e) => {
        e.preventDefault();
        mutate();
    };

    return (
        <div className="flex flex-col gap-3 px-10 py-6">
            <h2 className="text-center text-lg font-semibold">Enter your email</h2>

            <p className="text-center text-sm text-gray-500">
                If you don't have an account, we'll create one for you.
            </p>

            <form onSubmit={handleSendOtp} className="flex flex-col gap-3">
                <div className="flex items-center border rounded-md border-gray-300 px-4 py-3">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="flex-grow outline-none text-base"
                        required
                        autoFocus
                    />
                </div>

                <button
                    type="submit"
                    disabled={isPending}
                    className="w-full cursor-pointer text-white bg-black py-2 rounded-md text-lg hover:bg-gray-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {isPending ? "Sending OTP..." : "Continue"}
                </button>
            </form>

            <p className="text-[#4c5c5] text-center m-auto text-[12px]">
                By entering your email id, you're agreeing to our{" "}
                <a href="" className="text-[#f74565]">Terms of Service</a> and{" "}
                <a href="" className="text-[#f74565]">Privacy Policy.</a>
            </p>
        </div>
    );
};

export default StepEmail;
