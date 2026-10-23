
import React, { useEffect, useState } from "react";
import { banners } from "../../utils/constants";

const BannerSlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  if (!banners.length) return null;

  const previousSlide = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + banners.length) % banners.length
    );
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const getSlideIndex = (offset) =>
    (currentIndex + offset + banners.length) % banners.length;

  return (
    <div className="w-full overflow-hidden bg-white py-6">
      <div className="relative mx-auto w-full">
        <div className="flex items-center justify-center">
          {[-1, 0, 1].map((offset) => {
            const index = getSlideIndex(offset);
            const isActive = offset === 0;

            return (
              <div
                key={`${index}-${offset}`}
                onClick={() => setCurrentIndex(index)}
                className={`shrink-0 cursor-pointer px-2 transition-all duration-700 ${
                  isActive
                    ? "z-10 w-[78%] opacity-100"
                    : "w-[14%] opacity-60"
                }`}
              >
                <img
                  src={banners[index]}
                  alt={`Banner ${index + 1}`}
                  className={`h-[180px] w-full rounded-xl object-cover sm:h-[240px] md:h-[300px] ${
                    isActive ? "shadow-lg" : ""
                  }`}
                />
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={previousSlide}
          aria-label="Previous banner"
          className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/60 px-3 py-2 text-xl text-white hover:bg-black/80"
        >
          &#8249;
        </button>

        <button
          type="button"
          onClick={nextSlide}
          aria-label="Next banner"
          className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/60 px-3 py-2 text-xl text-white hover:bg-black/80"
        >
          &#8250;
        </button>
      </div>

      <div className="mt-4 flex justify-center gap-2">
        {banners.map((_, index) => (
          <button
            key={index}
            type="button"
            aria-label={`Go to banner ${index + 1}`}
            onClick={() => setCurrentIndex(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? "w-6 bg-red-500"
                : "w-2 bg-gray-300"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default BannerSlider;
