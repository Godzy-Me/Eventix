import React from "react";
import { tabs } from "../utils/constants";
import { IoMdAdd } from "react-icons/io";
import { IoIosLogOut } from "react-icons/io";
import { FiEdit } from "react-icons/fi";

const Profile = () => {
    const [activeTab, setActiveTab] = React.useState("Profile");

    return (
        <>
            <div className="bg-[#e5e5e5]">
                <div className="max-w-7xl mx-auto flex flex-wrap gap-6 py-2 text-sm font-medium">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-1 cursor-pointer ${activeTab === tab
                                ? "text-[#f74565]"
                                : "text-gray-600 hover:text-black"
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            <div className="min-h-screen py-10 px-4 bg-gray-100">
                <div className="max-w-6xl mx-auto">
                    {activeTab === "Profile" && (
                        <>
                            {/* Header */}
                            <div className="bg-gradient-to-r from-gray-800 to-[#f74565] rounded-t-md px-6 py-6 flex items-center gap-6 text-white">
                                <div className="relative w-20 h-20 border-4 border-white rounded-full flex items-center justify-center bg-white text-gray-600">
                                    <IoMdAdd size={24} />
                                </div>

                                <div className="mt-2">
                                    <h2 className="text-2xl font-bold">Hi, Amrit Raj</h2>

                                    <small className="underline cursor-pointer">
                                        <IoIosLogOut size={20} className="inline" /> Logout
                                    </small>
                                </div>
                            </div>

                            {/* Account Details */}
                            <div className="bg-white px-6 py-6 rounded-b-md">
                                <h3 className="text-lg font-semibold mb-4">
                                    Account Details
                                </h3>

                                {/* Email */}
                                <div className="mb-3 flex items-center">
                                    <p className="w-48 text-sm font-normal">
                                        Email Address
                                    </p>

                                    <div className="flex-1 flex justify-center">
                                        <div className="flex items-center gap-2">
                                            <span>testemail@example.com</span>

                                            <span className="text-green-600 text-xs bg-green-100 px-2 rounded">
                                                Verified
                                            </span>
                                        </div>
                                    </div>

                                    <FiEdit className="text-pink-500 cursor-pointer" />
                                </div>

                                {/* Mobile */}
                                <div className="flex items-center">
                                    <p className="w-48 text-sm font-normal">
                                        Mobile Number
                                    </p>

                                    <div className="flex-1 flex justify-center">
                                        <div className="flex items-center gap-2">
                                            <span>+91-6942069420</span>

                                            <span className="text-green-600 text-xs bg-green-100 px-2 rounded">
                                                Verified
                                            </span>
                                        </div>
                                    </div>

                                    <FiEdit className="text-pink-500 cursor-pointer" />
                                </div>
                            </div>

                            {/* Personal Details */}
                            <div className="bg-white p-6 mt-4 rounded-md">
                                <h3 className="text-lg font-semibold mb-4">
                                    Personal Details
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-normal">
                                            Name
                                        </label>

                                        <input
                                            type="text"
                                            value="Amrit Raj"
                                            readOnly
                                            className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm font-normal">
                                            Birthday (Optional)
                                        </label>

                                        <input
                                            type="date"
                                            className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm font-normal">
                                            Identity (Optional)
                                        </label>
                                        <div className="flex gap-2 mt-1">
                                            <button
                                                className={`px-4 py-1 border border-gray-200 rounded-lg bg-white`}
                                            >
                                                Male
                                            </button>

                                            <button
                                                className={`px-4 py-1 border border-gray-200 rounded-lg bg-white`}
                                            >
                                                Female
                                            </button>
                                        </div>
                                    </div>
                                    

                                    <div>
                                        <label className="text-sm font-normal">
                                            Married? (Optional)
                                        </label>
                                        <div className="flex gap-2 mt-1">
                                            <button
                                                className={`px-4 py-1 border border-gray-200 rounded-lg bg-white`}
                                            >
                                                Yes
                                            </button>

                                            <button
                                                className={`px-4 py-1 border border-gray-200 rounded-lg bg-white`}
                                            >
                                                No
                                            </button>
                                        </div>
                                    </div>


                                </div>
                            </div>

                        </>
                    )}

                    {/*Bookings Section*/}

                </div>
            </div>
        </>
    );
};

export default Profile;