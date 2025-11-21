import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import circleUser from '../../assets/icons/circle-user.svg';
import dashIcon from '../../assets/icons/dash-icon.png';
import payIcon from '../../assets/icons/pay-icon.png';
import archvIcon from '../../assets/icons/archv-icon.png';
import signoutIcon from '../../assets/icons/signout-icon.png';

const AcSidebar = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <div className={`bg-green-500 text-white flex flex-col transition-all duration-300 ${
      isSidebarOpen ? 'w-64' : 'w-22'
    }`}>

      {/* Menu Icon */}
      <div className={`flex items-center transition-all ${isSidebarOpen ? 'justify-end' : 'justify-center'}`}>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-lg hover:bg-blue-600 transition"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
      </div>

      {/* Logo and User Icon */}
      <div className="p-3 mx-auto">
        <div className="flex items-center mt-1 mb-8 mx-4 gap-2">
          <img src="/logo.png" alt="FIT4SCHOOL Logo" className="w-9 h-9 flex-shrink-0"/>
          {isSidebarOpen && <h2 className="text-xl font-bold">FIT4SCHOOL</h2>}
        </div>

        <div className="flex items-center gap-2 px-4 mb-3">
          <img src={circleUser} alt="UserDefault Logo" className="w-7 h-7 flex-shrink-0" />
          {isSidebarOpen && (
            <div>
              <p className="text-m font-semibold">Jojo Ramos</p>
              <p className="text-xs">Accountant</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 mt-8 p-2">

          {/* Dashboard */}
          <button
            onClick={() => navigate('/ac_dashboard')}
            className={`w-full flex items-center p-2 rounded-xl transition ${
              isActive('/ac_dashboard') ? 'bg-blue-500' : 'hover:bg-blue-600'
            } ${isSidebarOpen ? 'justify-start px-4' : 'justify-center'}`}
            title={!isSidebarOpen ? "AcDashboard" : ""}
          >
            <img src={dashIcon} alt="dashIcon" className="w-4 h-4 flex-shrink-0"/>
            {isSidebarOpen && <p className="ml-3 text-sm">Dashboard</p>}
          </button>
          
          {/* Payments */}
          <button
            onClick={() => navigate('/ac_payments')}
            className={`w-full flex items-center p-2 rounded-xl transition ${
              isActive('/ac_payments') ? 'bg-blue-500' : 'hover:bg-blue-600'
            } ${isSidebarOpen ? 'justify-start px-4' : 'justify-center'}`}
            title={!isSidebarOpen ? "AcPayments" : ""}
          >
            <img src={payIcon} alt="payIcon" className="w-4 h-4 flex-shrink-0"/>
            {isSidebarOpen && <p className="ml-3 text-sm">Payments</p>}
          </button>

          {/* Archives */}
          <button
            onClick={() => navigate('/ac_archives')}
            className={`w-full flex items-center p-2 rounded-xl transition ${
              isActive('/ac_archives') ? 'bg-blue-500' : 'hover:bg-blue-600'
            } ${isSidebarOpen ? 'justify-start px-4' : 'justify-center'}`}
            title={!isSidebarOpen ? "AcArchives" : ""}
          >
            <img src={archvIcon} alt="archvIcon" className="w-4 h-4 flex-shrink-0"/>
            {isSidebarOpen && <p className="ml-3 text-sm">Archives</p>}
          </button>

        </nav>

        {/* Sign Out Button */}
        <div className="mt-36 p-2">
          <button 
            onClick={() => navigate('/')}
            className={`w-full flex items-center p-2 rounded-lg hover:underline transition ${
              isSidebarOpen ? 'justify-start px-4' : 'justify-center'
            }`}
            title={!isSidebarOpen ? "Signout" : ""}
          >
            <img src={signoutIcon} alt="signoutIcon" className="w-4 h-4 flex-shrink-0"/>
            {isSidebarOpen && <p className="ml-3 text-sm">Sign out</p>}
          </button>
        </div>

      </div>
    </div>
  );
};

export default AcSidebar;