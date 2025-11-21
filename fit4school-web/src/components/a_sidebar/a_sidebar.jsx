import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import circleUser from '../../assets/icons/circle-user.svg';
import close from '../../assets/icons/close.svg';
import dashIcon from '../../assets/icons/dash-icon.png';
import orderIcon from '../../assets/icons/order-icon.png';
import uniIcon from '../../assets/icons/uni-icon.png';
import payIcon from '../../assets/icons/pay-icon.png';
import archvIcon from '../../assets/icons/archv-icon.png';
import accntIcon from '../../assets/icons/accnt-icon.png';
import signoutIcon from '../../assets/icons/signout-icon.png';

const ASidebar = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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

        {/* Header Section */}
        <div className={`flex items-center justify-between p-4 border-green-600 ${
          !isSidebarOpen && 'lg:justify-center'
        }`}>
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="FIT4SCHOOL Logo" className="w-8 h-8"/>
            {isSidebarOpen && <h2 className="text-lg font-bold">FIT4SCHOOL</h2>}
          </div>

          {/* Close Button */}
          {isSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 rounded-lg hover:bg-green-600 transition"
            >
              <img src={close} alt="UserDefault Logo" className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* User Info Section */}
        <div className={`p-4 border-green-600 ${!isSidebarOpen && 'lg:flex lg:justify-center'}`}>
          <div className="flex items-center gap-3">
            <img src={circleUser} alt="UserDefault Logo" className="w-9 h-9" />
            {isSidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">Joanna Cruz</p>
                <p className="text-xs text-green-100">Admin</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 p-4 space-y-1">
          {/* Dashboard */}
          <button
            onClick={() => handleNavigation('/a_dashboard')}
            className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 ${
              isActive('/a_dashboard') ? 'bg-green-600 shadow-md' : 'hover:bg-green-600'
            } ${isSidebarOpen ? 'justify-start gap-3' : 'justify-center'}`}
            title={!isSidebarOpen ? "Dashboard" : ""}
          >
            <img src={dashIcon} alt="dashIcon" className="w-5 h-5 flex-shrink-0"/>
            {isSidebarOpen && <span className="text-sm font-medium">Dashboard</span>}
          </button>

          {/* Orders */}
          <button
            onClick={() => handleNavigation('/a_orders')}
            className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 ${
              isActive('/a_orders') ? 'bg-green-600 shadow-md' : 'hover:bg-green-600'
            } ${isSidebarOpen ? 'justify-start gap-3' : 'justify-center'}`}
            title={!isSidebarOpen ? "Orders" : ""}
          >
            <img src={orderIcon} alt="orderIcon" className="w-5 h-5 flex-shrink-0"/>
            {isSidebarOpen && <span className="text-sm font-medium">Orders</span>}
          </button>
          
          {/* Uniforms */}
          <button
            onClick={() => handleNavigation('/a_uniforms')}
            className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 ${
              isActive('/a_uniforms') ? 'bg-green-600 shadow-md' : 'hover:bg-green-600'
            } ${isSidebarOpen ? 'justify-start gap-3' : 'justify-center'}`}
            title={!isSidebarOpen ? "Uniforms" : ""}
          >
            <img src={uniIcon} alt="uniIcon" className="w-5 h-5 flex-shrink-0"/>
            {isSidebarOpen && <span className="text-sm font-medium">Uniforms</span>}
          </button>
          
          {/* Payments */}
          <button
            onClick={() => handleNavigation('/a_payments')}
            className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 ${
              isActive('/a_payments') ? 'bg-green-600 shadow-md' : 'hover:bg-green-600'
            } ${isSidebarOpen ? 'justify-start gap-3' : 'justify-center'}`}
            title={!isSidebarOpen ? "Payments" : ""}
          >
            <img src={payIcon} alt="payIcon" className="w-5 h-5 flex-shrink-0"/>
            {isSidebarOpen && <span className="text-sm font-medium">Payments</span>}
          </button>

          {/* Archived */}
          <button
            onClick={() => handleNavigation('/a_archives')}
            className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 ${
              isActive('/a_archives') ? 'bg-green-600 shadow-md' : 'hover:bg-green-600'
            } ${isSidebarOpen ? 'justify-start gap-3' : 'justify-center'}`}
            title={!isSidebarOpen ? "Archives" : ""}
          >
            <img src={archvIcon} alt="archvIcon" className="w-5 h-5 flex-shrink-0"/>
            {isSidebarOpen && <span className="text-sm font-medium">Archives</span>}
          </button>

          {/* Accounts */}
          <button
            onClick={() => handleNavigation('/a_accounts')}
            className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 ${
              isActive('/a_accounts') ? 'bg-green-600 shadow-md' : 'hover:bg-green-600'
            } ${isSidebarOpen ? 'justify-start gap-3' : 'justify-center'}`}
            title={!isSidebarOpen ? "Accounts" : ""}
          >
            <img src={accntIcon} alt="accntIcon" className="w-5 h-5 flex-shrink-0"/>
            {isSidebarOpen && <span className="text-sm font-medium">Accounts</span>}
          </button>
        </nav>

        {/* Sign Out Section */}
        <div className="p-4 border-green-600">
          <button 
            onClick={() => handleNavigation('/')}
            className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 hover:bg-green-600 ${
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

export default ASidebar;