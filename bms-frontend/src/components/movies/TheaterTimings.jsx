import { useState } from "react";
import dayjs from "dayjs";
import { theatres } from "../../utils/constants";
import { useLocation } from "../../context/LocationContext";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const TheaterTimings = ({ movieId }) => {
  const navigate = useNavigate();
  const { location } = useLocation();
  const { auth, toggleModal } = useAuth();

  const today = dayjs();
  const [selectedDate, setSelectedDate] = useState(today);

  const next7days = Array.from({ length: 7 }, (_, i) =>
    today.add(i, "day")
  );

  return (
    <>
      <hr className="my-2 border-gray-200" />

      {/* Date Selector */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto py-4 px-2">
        {next7days.map((date, i) => {
          const isSelected = selectedDate.isSame(date, "day");

          return (
            <button
              key={i}
              onClick={() => setSelectedDate(date)}
              className={`flex flex-col items-center px-3 py-2 rounded-lg min-w-[50px] border border-gray-200 cursor-pointer ${
                isSelected
                  ? "bg-black text-white font-semibold"
                  : "text-black hover:bg-gray-100"
              }`}
            >
              <span className="text-sm font-black">
                {date.format("D")}
              </span>
              <span className="text-xs">{date.format("ddd")}</span>
              <span className="text-[10px]">
                {date.format("MMM").toUpperCase()}
              </span>
            </button>
          );
        })}
      </div>

      {/* Theatres */}
      <div className="space-y-8 px-4 mb-10">
        {theatres.map((curr, i) => (
          <div key={i}>
            <div className="flex items-start gap-3 mb-2">
              <img
                src={curr.img}
                alt={curr.name}
                className="w-8 h-8 object-contain"
              />

              <div>
                <p className="font-semibold">{curr.name}</p>
                <p className="text-sm text-gray-500">
                  {curr.cancellation}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 ml-11">
              {curr.timings.map((slot, j) => (
                <button
                  key={j}
                  onClick={() => {
                    if (!auth) {
                      toggleModal();
                      return;
                    }

                    // Temporary navigation until backend is ready
                    navigate("#");
                  }}
                  className="border cursor-pointer hover:bg-gray-100 border-gray-300 rounded-[16px] px-12 py-2 text-sm flex flex-col items-center justify-center"
                >
                  <span className="leading-tight font-semibold">
                    {slot.time}
                  </span>

                  <span className="text-[10px] text-gray-500 font-black">
                    {slot.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default TheaterTimings;