import React from 'react'
import BannerSlider from '../components/shared/BannerSlider'
import MovieFilters from '../components/movies/MovieFilters'
import MovieList from "../components/movies/MovieList";

const Movies = () => {
  return (
    <div>
      <BannerSlider />
      <div className='flex flex-col md:flex-row bg-[#f5f5f5] min-h-screen md:px-[100px] pb-10 pt-8'>
        <MovieFilters />
        <MovieList/>
      </div>
    </div>
  )
}

export default Movies