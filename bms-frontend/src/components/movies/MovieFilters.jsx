import React from "react";
import { languages } from "../../utils/constants";

const MovieFilters = () => {
  return (
    <div className="w-full md:w-1/4 p-4 space-y-6">
      <h2 className="text-2xl font-semibold">Filters</h2>

      {/* Languages */}
      <div className="bg-white p-4 rounded-md">
        <div className="flex justify-between items-center mb-3">
          <span className="font-medium">Languages</span>
          <button className="text-[#f74362] text-sm">Clear</button>
        </div>

        <div className="flex flex-wrap gap-2">
          {languages.map((lang, i) => (
            <span
              key={i}
              className="border border-gray-200 text-[#f74362] px-3 py-1 text-sm rounded hover:bg-gray-100 cursor-pointer"
            >
              {lang}
            </span>
          ))}
        </div>
      </div>

      {/* Genres */}
      <div className="bg-white p-4 rounded-md">
        <div className="flex justify-between items-center mb-3">
          <span className="font-medium">Genres</span>
          <button className="text-[#f74362] text-sm">Clear</button>
        </div>
      </div>

      {/* Format */}
      <div className="bg-white p-4 rounded-md">
        <div className="flex justify-between items-center mb-3">
          <span className="font-medium">Format</span>
          <button className="text-[#f74362] text-sm">Clear</button>
        </div>
      </div>

      {/* Browse Button */}
      <button className="w-full border cursor-pointer border-[#f74362] text-[#f74362] py-2 rounded hover:bg-[#f74362] hover:text-white transition">
        Browse by Cinemas
      </button>
    </div>
  );
};

export default MovieFilters;