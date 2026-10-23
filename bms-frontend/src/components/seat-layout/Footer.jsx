import React from "react";

const Footer = ({ selectedCount = 0, totalPrice = 0, onProceed, loading = false }) => {
    const isSelected = selectedCount > 0;

    return (
        <>
            {
                isSelected ? (
                    <div className="bg-white py-3 px-6 flex items-center justify-between z-10">
                        <p className="text-gray-700 font-medium text-base">
                            {selectedCount} Selected
                            <span className="ml-3 font-semibold text-black">₹{totalPrice}</span>
                        </p>

                        <button
                            onClick={onProceed}
                            disabled={loading}
                            className="bg-black cursor-pointer text-white px-6 py-2 rounded-lg font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {loading ? "Holding seats..." : "Proceed"}
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        <p className="text-xs font-bold text-purple-600 tracking-wider">
                            SCREEN THIS WAY
                        </p>

                        <div className="flex gap-4 text-xs mt-3">
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 border rounded-[4px]"></div>
                                <p>Available</p>
                            </div>

                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 bg-gray-200 border rounded-[4px] flex items-center justify-center">
                                    <small className="-mt-1">×</small>
                                </div>
                                Occupied
                            </div>

                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 bg-yellow-100 border border-yellow-400 rounded-[4px]"></div>
                                Being booked
                            </div>

                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 bg-purple-600 rounded-[4px]"></div>
                                Selected
                            </div>
                        </div>
                    </div>
                )
            }
        </>
    );
};

export default Footer;
