import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import circleUser from '../../assets/icons/circle-user.svg';
import close from '../../assets/icons/close.svg';
import dashIcon from '../../assets/icons/dash-icon.png';
import payIcon from '../../assets/icons/pay-icon.png';
import archvIcon from '../../assets/icons/archv-icon.png';
import signoutIcon from '../../assets/icons/signout-icon.png';

const AcSidebar = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const handleNavigation = (path) => {
    navigate(path);
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <>
      {/* Mobile menu button*/}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-green-500 text-white rounded-lg shadow-lg"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
      )}

      {/* Sidebar */}
      <div className={`bg-green-500 text-white flex flex-col transition-all duration-300 fixed lg:relative z-40 h-screen ${
        isSidebarOpen ? 'w-64 translate-x-0' : 'w-0 lg:w-20 -translate-x-full lg:translate-x-0 overflow-hidden'
      }`}>

        {/* Desktop toggle button - shows on desktop only */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="hidden lg:block absolute top-4 right-[-12px] p-1 bg-green-500 text-white rounded-full shadow-lg z-50 hover:bg-green-600 transition"
        >
          <svg 
            className={`w-5 h-5 transition-transform ${isSidebarOpen ? '' : 'rotate-180'}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
          </svg>
        </button>

        {/* Header Section */}
        <div className={`flex items-center justify-between p-4 border-green-600 ${
          !isSidebarOpen && 'lg:justify-center'
        }`}>
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="FIT4SCHOOL Logo" className="w-8 h-8"/>
            {isSidebarOpen && <h2 className="text-lg font-bold">FIT4SCHOOL</h2>}
          </div>

          {/* Close Button - Mobile only */}
          {isSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-green-600 transition"
            >
              <img src={close} alt="Close" className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* User Info Section */}
        <div className={`p-4 border-green-600 ${!isSidebarOpen && 'lg:flex lg:justify-center'}`}>
          <div className="flex items-center gap-3">
            <img src={circleUser} alt="UserDefault Logo" className="w-9 h-9" />
            {isSidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">Jojo Ramos</p>
                <p className="text-xs text-green-100">Accountant</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 p-4 space-y-1">
          {/* Dashboard */}
          <button
            onClick={() => handleNavigation('/ac_dashboard')}
            className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 ${
              isActive('/ac_dashboard') ? 'bg-blue-500 shadow-md' : 'hover:bg-blue-600'
            } ${isSidebarOpen ? 'justify-start gap-3' : 'justify-center'}`}
            title={!isSidebarOpen ? "AcDashboard" : ""}
          >
            <img src={dashIcon} alt="dashIcon" className="w-5 h-5 flex-shrink-0"/>
            {isSidebarOpen && <span className="text-sm font-medium">Dashboard</span>}
          </button>

          {/* Payments */}
          <button
            onClick={() => handleNavigation('/ac_payments')}
            className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 ${
              isActive('/ac_payments') ? 'bg-blue-500 shadow-md' : 'hover:bg-blue-600'
            } ${isSidebarOpen ? 'justify-start gap-3' : 'justify-center'}`}
            title={!isSidebarOpen ? "AcPayments" : ""}
          >
            <img src={payIcon} alt="payIcon" className="w-5 h-5 flex-shrink-0"/>
            {isSidebarOpen && <span className="text-sm font-medium">Payments</span>}
          </button>

          {/* Archived */}
          <button
            onClick={() => handleNavigation('/ac_archives')}
            className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 ${
              isActive('/ac_archives') ? 'bg-blue-500 shadow-md' : 'hover:bg-blue-600'
            } ${isSidebarOpen ? 'justify-start gap-3' : 'justify-center'}`}
            title={!isSidebarOpen ? "AcArchives" : ""}
          >
            <img src={archvIcon} alt="archvIcon" className="w-5 h-5 flex-shrink-0"/>
            {isSidebarOpen && <span className="text-sm font-medium">Archives</span>}
          </button>
        </nav>

        {/* Sign Out Section */}
        <div className="p-4 border-green-600">
          <button 
            onClick={() => handleNavigation('/')}
            className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 ${
              isSidebarOpen ? 'justify-start gap-3' : 'justify-center'
            }`}
            title={!isSidebarOpen ? "Signout" : ""}
          >
            <img src={signoutIcon} alt="signoutIcon" className="w-5 h-5 flex-shrink-0"/>
            {isSidebarOpen && <span className="text-sm font-medium">Sign out</span>}
          </button>
        </div>
      </div>

      {/* Transparent Overlay - Only show when sidebar is open on mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-transparent z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </>
  );
};

export default AcSidebar;