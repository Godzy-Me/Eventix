import React from "react";
import Slider from "react-slick";
import { banners } from "../../utils/constants";

const BannerSlider = () => {

    const settings = {
  centerMode: true,
  centerPadding: "400px", // side-preview space
  slidesToShow: 1,
  infinite: true,
  autoplay: true,
  autoplaySpeed: 3000,
  speed: 800,
  arrows: true,
  dots: true,
};



  return (
    <div className="w-full bg-white py-6">
      <div className="mx-auto px-4">
        <Slider {...settings}>
          {banners.map((banner, i) => (
            <div key={i} className="px-2">
              <img
                src={banner}
                alt={`banner-${banner.id}`}
                className="w-full h-[300px] rounded-xl object-cover"
              />
            </div>
          ))}
        </Slider>
      </div>
    </div>
  );
};

export default BannerSlider;