import React from 'react'
import mainLogo from "../../assets/main-icon.png";
import { useNavigate } from 'react-router-dom';
import dayjs from "dayjs"
import UserMenu from "../shared/UserMenu"

const Header = ({ showData, type }) => {
    const navigate = useNavigate();

    // Helper to safely format DD-MM-YYYY or ISO dates
    const formatShowDate = (dateStr) => {
        if (!dateStr) return dayjs(null);
        if (dateStr.includes("-") && dateStr.indexOf("-") === 2) {
            const [day, month, year] = dateStr.split("-");
            return dayjs(`${year}-${month}-${day}`);
        }
        return dayjs(dateStr);
    };

    const parsedDate = formatShowDate(showData?.date);

    return (
        <>
            <div className='border-b border-gray-200 shadow-sm bg-white'>
                {/* Top Bar */}
                <div className='flex items-center justify-between py-4 px-6'>
                    {/* Logo */}
                    <img
                        onClick={() => navigate("/")}
                        src={mainLogo}
                        alt="bookMyScreen"
                        className="h-6 md:h-8 object-contain cursor-pointer"
                    />

                    {
                        type  === "checkout" ? (
                            <div>
                                <h2 className="font-bold text-gray-900 text-lg md:text-xl">Review your booking</h2>
                            </div>
                        ) : (
                            <div className='text-center'>
                        <h2 className='font-bold text-lg md:text-xl'>
                            {showData?.movie?.title || "Loading movie..."}
                        </h2>

                        <p className="text-xs text-gray-500 font-semibold mt-0.5">
                            {parsedDate.isValid() ? parsedDate.format("DD MMM YYYY") : ""}
                            {showData?.startTime && ` • ${showData.startTime}`}
                            {showData?.theater?.name && ` at ${showData.theater.name}, ${showData.theater.city}, ${showData.theater.state}`}
                        </p>
                    </div>
                        )
                    }

                    

                    <UserMenu />
                </div>
            </div>

            {/*SHOW TIMINGS*/}
            {
                type !== "checkout" && (
                    <>
                    <div className="bg-white pt-4">
                <div className="mx-auto px-6 pb-4 flex items-center gap-4 max-w-7xl">
                    <div className="flex flex-col text-gray-700">
                        <p className="text-xs text-gray-500 font-medium">
                            {parsedDate.isValid() ? parsedDate.format("ddd") : ""}
                        </p>

                        <p className="text-sm font-semibold text-gray-700">
                            {parsedDate.isValid() ? parsedDate.format("DD MMM") : ""}
                        </p>
                    </div>

                    <button className="border cursor-pointer rounded-[14px] px-8 py-3 text-sm border-black font-medium bg-gray-200">
                        {showData?.startTime}
                        <p className="text-[10px] text-gray-500 -mt-1">
                            {showData?.audioType?.toUpperCase()}
                        </p>
                    </button>
                </div>
            </div>
            <hr className="my-2 border-grey-300 max-w-7xl mx-auto"/>
            </>
                )
            }
        </>
    )
}

export default Header;