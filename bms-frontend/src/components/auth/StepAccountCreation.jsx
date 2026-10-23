import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { activateUser } from "../../apis";
import { getErrorMessage } from "../../apis/axiosWrapper";
import { useAuth } from "../../context/AuthContext";

const StepAccountCreation = () => {
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const { user, setUser, closeModal } = useAuth();

    const { mutate, isPending } = useMutation({
        mutationFn: () => activateUser(user._id, { name: name.trim(), phone: phone.trim() }),
        onSuccess: ({ data }) => {
            setUser(data);
            toast.success("Account created. Enjoy the show!");
            closeModal();
        },
        onError: (error) => {
            const fieldError = error?.response?.data?.errors?.[0]?.message;
            toast.error(fieldError || getErrorMessage(error, "Could not create account"));
        },
    });

    const handleActivateAccount = (e) => {
        e.preventDefault();
        mutate();
    };

    return (
        <form onSubmit={handleActivateAccount} className="flex flex-col gap-3 px-10 py-6">
            <h2 className="text-center text-lg font-semibold">Enter your account details</h2>
            <p className="text-center text-sm text-gray-500">
                Just one more step to finish setting up your account.
            </p>

            <div className="flex items-center border border-gray-300 rounded-md px-4 py-3">
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="flex-grow outline-none text-base"
                    maxLength={60}
                    required
                    autoFocus
                />
            </div>

            <div className="flex items-center border border-gray-300 rounded-md px-4 py-3">
                <span className="text-gray-500 mr-2">+91</span>
                <input
                    type="tel"
                    inputMode="numeric"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="Enter your 10 digit phone number"
                    className="flex-grow outline-none text-base"
                    required
                />
            </div>

            <button
                type="submit"
                disabled={isPending}
                className="w-full cursor-pointer text-white bg-black py-2 rounded-md text-lg hover:bg-gray-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
                {isPending ? "Creating account..." : "Create Account"}
            </button>

            <p className="text-[#4c5c5] text-center m-auto text-[12px]">
                By entering your email id, you're agreeing to our{" "}
                <a href="" className="text-[#f74565]">
                    Terms of Service
                </a>{" "}
                and{" "}
                <a href="" className="text-[#f74565]">
                    Privacy Policy
                </a>
                . Thanks!
            </p>
        </form>
    );
};

export default StepAccountCreation;
