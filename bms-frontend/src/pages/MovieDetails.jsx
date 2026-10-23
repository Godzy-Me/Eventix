import React from "react";
import { useParams } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import TheaterTimings from "../components/movies/TheaterTimings";

import { getMovieById } from "../apis";

const filters = ["Hindi", "English", "IMAX", "3D", "Today"];

const MovieDetails = () => {
  const { id } = useParams();

  const { data: response, isLoading, isError } = useQuery({
    queryKey: ["movie", id],
    queryFn: async () => await getMovieById(id),
    placeholderData: keepPreviousData,
  });

  // Safely extract movie object from API response
  const movieData = response?.data?.movie || response?.data;

  // Helper to safely join arrays or display strings
  const formatList = (items) => {
    if (!items) return "";
    if (Array.isArray(items)) return items.join(", ");
    return items;
  };

  if (isLoading) {
    return (
      <div className="w-full py-20 text-center text-gray-500 font-medium text-lg">
        Loading movie details...
      </div>
    );
  }

  if (isError || !movieData) {
    return (
      <div className="w-full py-20 text-center text-red-500 font-medium text-lg">
        Failed to load movie details.
      </div>
    );
  }

  return (
    <>
      {/* Movie Details Section */}
      <div
        className="relative text-white font-sans px-4 py-10"
        style={{
          backgroundImage: movieData?.posterUrl ? `url(${movieData.posterUrl})` : "none",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black opacity-70"></div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto flex flex-col lg:flex-row gap-10">
          {/* Poster */}
          <div>
            <img
              src={movieData?.posterUrl || movieData?.img}
              alt={movieData?.title}
              className="rounded-xl w-52 shadow-xl"
            />
          </div>

          {/* Details */}
          <div className="flex flex-col flex-1">
            <h1 className="text-4xl font-bold mb-4">{movieData?.title}</h1>

            <div className="flex items-center gap-4 mb-3">
              <div className="bg-[#3a3a3a] px-4 py-2 rounded-md flex items-center gap-2 text-sm">
                <span className="text-pink-500 font-bold">
                  ★ {movieData?.rating}
                </span>

                <span className="text-gray-300">
                  {movieData?.votes} Votes
                </span>

                <button className="ml-6 px-4 py-2 rounded-md bg-[#2f2f2f] hover:bg-[#4a4a4a] cursor-pointer">
                  Rate now
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm mb-4">
              {movieData?.format && (
                <span className="bg-[#3a3a3a] px-3 py-1 rounded">
                  {formatList(movieData.format)}
                </span>
              )}

              {movieData?.languages && (
                <span className="bg-[#3a3a3a] px-3 py-1 rounded">
                  {formatList(movieData.languages)}
                </span>
              )}
            </div>

            <p className="text-sm text-gray-300 mb-4">
              {movieData?.duration} • {formatList(movieData?.genre)} •{" "}
              {movieData?.certification} • {movieData?.releaseDate}
            </p>

            <div>
              <h2 className="text-xl font-bold mb-2">About the Movie</h2>

              <p className="text-sm text-gray-300 leading-relaxed">
                {movieData?.description}
              </p>
            </div>
          </div>

          {/* Share Button */}
          <div className="absolute top-0 right-0">
            <button className="bg-[#3a3a3a] px-4 py-2 rounded text-sm flex items-center gap-2 cursor-pointer">
              <svg
                className="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M18 16.08c-.76 0-1.44.3-1.96.77l-7.13-4.21c.05-.25.09-.51.09-.78s-.03-.53-.09-.78l7.04-4.15c.54.5 1.25.81 2.05.81 1.66 0 3-1.34 3-3S19.66 2 18 2s-3 1.34-3 3c0 .27.04.52.09.78L7.91 9.93C7.38 9.43 6.67 9.12 5.87 9.12 4.21 9.12 2.87 10.46 2.87 12.12s1.34 3 3 3c.8 0 1.51-.31 2.04-.81l7.13 4.21c-.06.24-.1.49-.1.75 0 1.66 1.34 3 3 3s3-1.34 3-3-1.34-3-3-3z" />
              </svg>
              Share
            </button>
          </div>
        </div>
      </div>

      {/* Show Timings */}
      <div className="max-w-7xl mx-auto mt-8 px-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-2">
          {filters.map((filter, i) => (
            <button
              key={i}
              className="border border-gray-300 px-5 py-1 rounded-lg text-sm cursor-pointer hover:bg-gray-100"
            >
              {filter}
            </button>
          ))}
        </div>

        <hr className="my-2 border-gray-200" />

        {/* Availability */}
        <div className="flex items-center gap-6 bg-gray-200 rounded-md px-6 py-3 mb-6 text-sm">
          <span className="flex items-center">
            <span className="w-2 h-2 bg-black rounded-full mr-2"></span>
            <small className="font-semibold text-gray-500">Available</small>
          </span>

          <span className="flex items-center">
            <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
            <small className="font-semibold text-gray-500">
              Filling Fast
            </small>
          </span>

          <span className="flex items-center">
            <span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
            <small className="font-semibold text-gray-500">
              Almost Full
            </small>
          </span>
        </div>

        {/* Theatre Timings */}
        <TheaterTimings movieId={movieData?._id || movieData?.id || id} />
      </div>
    </>
  );
};

export default MovieDetails;