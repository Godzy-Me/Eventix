import React from 'react'
import mainLogo from "../../assets/main-icon.png"
import { FaSearch } from "react-icons/fa"

const Header = () => {
  return (
    <div className='w-full text-sm bg-white'>
      {/* Top Navbar */}
      <div className='px-4 md:px-8'>
        <div className='max-w-screen-xl mx-auto flex justify-between items-center py-3'>

          {/* Left part */}
          <div className='flex items-center space-x-4'>
            <img
              src={mainLogo}
              alt="logo"
              className='h-8 object-contain cursor-pointer'
            />

            <div className="relative">
              <input
                type="text"
                placeholder="Search for Movies, Events, Plays, Sports and Activities"
                className="border border-gray-300 rounded px-4 py-1.5 w-[400px] text-sm outline-none"
              />
              <FaSearch className="absolute right-2 top-2.5 text-gray-500" />
            </div>
          </div>

          {/* Right part */}
          <div className="flex item-center space-x-6">
            <div className="text-sm font-medium cursor-pointer mt-2">
              Bangalore &nbsp; ▼
            </div>
            <button className="bg-[#f84464] cursor-pointer text-white px-4 py-1.5 text-sm rounded">
              Sign in
            </button>
          </div>

        </div>
      </div>

      {/* Bottom Navbar */}
      <div className="bg-[#f2f2f2] px-4 md:px-8">
        <div className="max-w-screen-xl mx-auto flex justify-between items-center py-2">
          <div className="flex items-center space-x-6 font-medium">
            <span className="cursor-pointer hover:text-red-500">Movies</span>
            <span className="cursor-pointer hover:text-red-500">Stream</span>
            <span className="cursor-pointer hover:text-red-500">Events</span>
            <span className="cursor-pointer hover:text-red-500">Plays</span>
            <span className="cursor-pointer hover:text-red-500">Sports</span>
            <span className="cursor-pointer hover:text-red-500">Activities</span>
          </div>

          <div className="flex items-center space-x-6 text-sm">
            <span className="cursor-pointer hover:text-red-500">
              ListYourShow
            </span>
            <span className="cursor-pointer hover:text-red-500">
              Corporates
            </span>
            <span className="cursor-pointer hover:text-red-500">
              Offers
            </span>
            <span className="cursor-pointer hover:text-red-500">
              Gift Cards
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Header