import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import circleUser from '../../assets/icons/circle-user.svg';
import close from '../../assets/icons/close.svg';
import barChart from '../../assets/icons/bar-chart.png';
import orderIcon from '../../assets/icons/order-icon.png';
import uniIcon from '../../assets/icons/uni-icon.png';
import archvIcon from '../../assets/icons/archv-icon.png';
import signoutIcon from '../../assets/icons/signout-icon.png';
import { db } from '../../../firebase'; // Adjust path as needed
import { doc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const ASidebar = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  // Fetch admin data on component mount
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        // Method 1: Get from localStorage (if stored during login)
        const storedData = localStorage.getItem('adminData');
        if (storedData) {
          setAdminData(JSON.parse(storedData));
          setLoading(false);
          return;
        }

        // Method 2: Fetch from Firestore using current user
        const auth = getAuth();
        const currentUser = auth.currentUser;
        
        if (currentUser) {
          const userRef = doc(db, "accounts", currentUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const userData = userSnap.data();
            setAdminData({
              fname: userData.fname,
              lname: userData.lname,
              gen_roles: userData.gen_roles,
              email: userData.email
            });
            
            // Store in localStorage for future use
            localStorage.setItem('adminData', JSON.stringify({
              fname: userData.fname,
              lname: userData.lname,
              gen_roles: userData.gen_roles,
              email: userData.email
            }));
          }
        }
      } catch (error) {
        console.error("Error fetching admin data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  const handleNavigation = (path) => {
    navigate(path);
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  const handleSignOutClick = () => {
    // Show confirmation modal
    setShowLogoutConfirm(true);
  };

  const confirmSignOut = () => {
    // Clear stored data on sign out
    localStorage.removeItem('adminData');
    setShowLogoutConfirm(false);
    navigate('/');
  };

  const cancelSignOut = () => {
    setShowLogoutConfirm(false);
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
                {loading ? (
                  <>
                    <p className="text-sm font-semibold truncate animate-pulse bg-green-400 h-4 w-24 rounded"></p>
                    <p className="text-xs text-green-100 mt-1 animate-pulse bg-green-400 h-3 w-16 rounded"></p>
                  </>
                ) : adminData ? (
                  <>
                    <p className="text-sm font-semibold truncate">
                      {adminData.fname} {adminData.lname}
                    </p>
                    <p className="text-xs text-green-100 capitalize">
                      {adminData.gen_roles === "admin" ? "Admin" : adminData.gen_roles}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold truncate">Michael Rhoi</p>
                    <p className="text-xs text-green-100">Admin</p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 p-4 space-y-1">

          {/* Orders */}
          <button
            onClick={() => handleNavigation('/a_orders')}
            className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 ${
              isActive('/a_orders') ? 'bg-blue-500 shadow-md' : 'hover:bg-blue-600'
            } ${isSidebarOpen ? 'justify-start gap-3' : 'justify-center'}`}
            title={!isSidebarOpen ? "Orders" : ""}
          >
            <img src={orderIcon} alt="orderIcon" className="w-5 h-5 flex-shrink-0"/>
            {isSidebarOpen && <span className="text-sm font-medium">Orders</span>}
          </button>

          {/* Reports */}
          <button
            onClick={() => handleNavigation('/a_reports')}
            className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 ${
              isActive('/a_reports') ? 'bg-blue-500 shadow-md' : 'hover:bg-blue-600'
            } ${isSidebarOpen ? 'justify-start gap-3' : 'justify-center'}`}
            title={!isSidebarOpen ? "Reports" : ""}
          >
            <img src={barChart} alt="barChart" className="w-5 h-5 flex-shrink-0"/>
            {isSidebarOpen && <span className="text-sm font-medium">Reports</span>}
          </button>
          
          {/* Uniforms */}
          <button
            onClick={() => handleNavigation('/a_uniforms')}
            className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 ${
              isActive('/a_uniforms') ? 'bg-blue-500 shadow-md' : 'hover:bg-blue-600'
            } ${isSidebarOpen ? 'justify-start gap-3' : 'justify-center'}`}
            title={!isSidebarOpen ? "Uniforms" : ""}
          >
            <img src={uniIcon} alt="uniIcon" className="w-5 h-5 flex-shrink-0"/>
            {isSidebarOpen && <span className="text-sm font-medium">Uniforms</span>}
          </button>

          {/* Archived */}
          <button
            onClick={() => handleNavigation('/a_archives')}
            className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 ${
              isActive('/a_archives') ? 'bg-blue-500 shadow-md' : 'hover:bg-blue-600'
            } ${isSidebarOpen ? 'justify-start gap-3' : 'justify-center'}`}
            title={!isSidebarOpen ? "Archives" : ""}
          >
            <img src={archvIcon} alt="archvIcon" className="w-5 h-5 flex-shrink-0"/>
            {isSidebarOpen && <span className="text-sm font-medium">Archives</span>}
          </button>
        </nav>

        {/* Sign Out Section */}
        <div className="p-4 border-green-600">
          <button 
            onClick={handleSignOutClick}
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

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">
              Confirm Logout
            </h3>
            
            <p className="text-gray-600 mb-6 text-center">
              Are you sure you want to log out?
            </p>

            <div className="flex justify-center gap-4">
              <button
                onClick={cancelSignOut}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmSignOut}
                className="px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition font-medium"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ASidebar;