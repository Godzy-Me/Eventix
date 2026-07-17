import React from "react";
import BannerSlider from "../components/shared/BannerSlider";
import Recommended from "../components/Recommended";
import LiveEvents from "../components/LiveEvents";

const Home = () => {
  return (
    <div>
      <BannerSlider />
      <Recommended/>
      <LiveEvents/>
    </div>
  );
};

export default Home;