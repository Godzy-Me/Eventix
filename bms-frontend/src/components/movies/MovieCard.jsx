import React from "react";

const MovieCard = ({ movie }) => {
  return (
    <div className="w-40 md:w-52 cursor-pointer">
      <img
        src={movie.img}
        alt={movie.title}
        className="rounded-lg shadow-md"
      />

      <p className="mt-2 font-medium">{movie.title}</p>

      <p className="text-xs text-gray-500">
        {movie.rating} | {movie.votes}
      </p>

      <p className="text-sm text-gray-600">
        {movie.age}
      </p>

      <p className="text-sm text-gray-500 truncate">
        {movie.languages}
      </p>
    </div>
  );
};

export default MovieCard;