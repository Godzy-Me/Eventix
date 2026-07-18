import React from "react";
import { languages, allMovies } from "../../utils/constants";
import MovieCard from "./MovieCard";

const MovieList = () => {
    return (
        <div className="w-full md:w-3/4 p-4">
            <div className="flex flex-wrap gap-2 mb-4">
                {languages.map((lang, i) => (
                    <span
                        key={i}
                        className="bg-white border border-gray-200 text-[#f74362] py-1 px-3 rounded-[24px] text-sm cursor-pointer hover:bg-gray-100"
                    >
                        {lang}
                    </span>
                ))}
            </div>

            <div className="flex justify-between items-center bg-white px-6 py-4 rounded mb-6">
                <h3 className="font-semibold text-xl">Coming Soon</h3>
                <a
                    href="#"
                    className="text-red-500 text-sm font-medium flex items-center"
                >
                    Explore Upcoming Movies <span className="ml-1">&gt;</span>
                </a>
            </div>



            <div className="flex flex-wrap gap-6">
                {/* Movie Card */}
                {allMovies.map((movie, i) => (
                    <MovieCard key={i} movie={movie} />
                ))}
            </div>








        </div>
    );
};

export default MovieList;