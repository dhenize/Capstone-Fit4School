import React from 'react';
import notifIcon from "../../assets/icons/notif.png";
import settingsIcon from "../../assets/icons/settings.png";
import searchIcon from "../../assets/icons/search.png";
import clockIcon from "../../assets/icons/clock.png";

const ATopbar = () => {
  return (
    <div className="w-full h-12 bg-white shadow flex items-center justify-between px-4">

      {/* Left icons */}
      <div className="flex ml-auto gap-4">
        <button className="p-2 hover:bg-gray-100 rounded-full transition">
          <img src={clockIcon} alt="Clock" className="w-5 h-5" />
        </button>
        <button className="p-2 hover:bg-gray-100 rounded-full transition">
          <img src={notifIcon} alt="Notifications" className="w-5 h-5" />
        </button>
        <button className="p-2 hover:bg-gray-100 rounded-full transition">
          <img src={searchIcon} alt="Search" className="w-5 h-5" />
        </button>
        <button className="p-2 hover:bg-gray-100 rounded-full transition">
          <img src={settingsIcon} alt="Settings" className="w-5 h-5" />
        </button>      
       
      </div>
    </div>
  );
};

export default ATopbar;
