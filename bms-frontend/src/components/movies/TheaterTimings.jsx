import { useState } from "react";
import dayjs from "dayjs";
import { hasShowStarted } from "../../utils";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getShowsByMovieAndLocation } from "../../apis";

const TheaterTimings = ({ movieId }) => {
  const navigate = useNavigate();
  const { auth, toggleModal } = useAuth();

  const today = dayjs();
  const [selectedDate, setSelectedDate] = useState(today);

  // Dynamically format selected date to match MongoDB schema (DD-MM-YYYY)
  const formattedDate = selectedDate.format("DD-MM-YYYY");

  const next7days = Array.from({ length: 7 }, (_, i) =>
    today.add(i, "day")
  );

  // 🔒 PERMANENT OVERRIDE: Ignore browser location and lock to West Bengal
  const locationValue = "West Bengal";

  const { data: showData, isLoading, isError, error } = useQuery({
    queryKey: ["show", movieId, locationValue, formattedDate],
    queryFn: async () => await getShowsByMovieAndLocation(movieId, locationValue, formattedDate),
    placeholderData: keepPreviousData,
    enabled: !!movieId && !!locationValue,
  });

  const rawResponse = showData?.data || showData;
  const showsList = Array.isArray(rawResponse) 
    ? rawResponse 
    : Array.isArray(rawResponse?.data) 
      ? rawResponse.data 
      : Array.isArray(rawResponse?.shows) 
        ? rawResponse.shows 
        : [];

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
        {isLoading && (
          <div className="text-center text-gray-500 py-4">Loading shows...</div>
        )}

        {isError && (
          <div className="text-center text-red-500 py-4">
            Error loading shows: {error?.message || "Failed to fetch"}
          </div>
        )}

        {!isLoading && !isError && showsList.length === 0 && (
          <div className="text-center text-gray-500 py-4">
            No shows available for the selected date.
          </div>
        )}

        {showsList.map((curr, i) => (
          <div key={i}>
            <div className="flex items-start gap-3 mb-2">
              {curr.theater?.theaterDetails?.logo?.img && (
                <img
                  src={curr.theater.theaterDetails.logo.img}
                  alt={curr.theater?.theaterDetails?.name || "Theater Logo"}
                  className="w-8 h-8 object-contain"
                />
              )}

              <div>
                <p className="font-semibold">
                  {curr.theater?.theaterDetails?.name || curr.name}
                </p>
                <p className="text-sm text-gray-500">
                  {curr.cancellation || "Allows Cancellation"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 ml-11">
              {curr.theater?.shows?.map((slot, j) => {
                const theaterId = curr.theater.theaterDetails._id;
                const movieName = curr.movie.title;
                const started = hasShowStarted(slot.date, slot.startTime);
                
                return (
                  <button
                    key={j}
                    disabled={started}
                    title={started ? "This show has already started" : ""}
                    onClick={() => {
                      if (!auth) {
                        toggleModal();
                        return;
                      }
                      // ✅ Correct dynamic navigation with parameters
                      navigate(
                        `/movies/${movieId}/${encodeURIComponent(movieName)}/${encodeURIComponent(locationValue)}/theater/${theaterId}/show/${slot._id}/seat-layout`
                      );
                    }}
                    className={`border border-gray-300 rounded-[16px] px-12 py-2 text-sm flex flex-col items-center justify-center ${
                      started ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:bg-gray-100"
                    }`}
                  >
                    <span className="leading-tight font-semibold">
                      {slot.startTime}
                    </span>

                    <span className="text-[10px] text-gray-500 font-black">
                      {slot.audioType ? slot.audioType.toUpperCase() : "DOLBY 7.1"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default TheaterTimings;