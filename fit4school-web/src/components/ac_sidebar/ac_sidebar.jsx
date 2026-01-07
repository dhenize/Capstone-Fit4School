// ACCOUNTANT SIDEBAR - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import circleUser from '../../assets/icons/circle-user.svg';
import close from '../../assets/icons/close.svg';
import dashIcon from '../../assets/icons/dash-icon.png';
import payIcon from '../../assets/icons/pay-icon.png';
import archvIcon from '../../assets/icons/archv-icon.png';
import signoutIcon from '../../assets/icons/signout-icon.png';
import { db } from '../../../firebase';
import { collection, query, where, onSnapshot, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const AcSidebar = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const [accountantData, setAccountantData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    const fetchAccountantData = async () => {
      try {
        const storedData = localStorage.getItem('accountantData');
        if (storedData) {
          setAccountantData(JSON.parse(storedData));
          setLoading(false);
          return;
        }

        const auth = getAuth();
        const currentUser = auth.currentUser;

        if (currentUser) {
          const accountsRef = collection(db, "accounts");
          const q = query(accountsRef, where("firebase_uid", "==", currentUser.uid));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data();

            if (userData.gen_roles !== "accountant") {
              console.error("User is not an accountant, found role:", userData.gen_roles);
              setLoading(false);
              return;
            }

            const accountantInfo = {
              fname: userData.fname,
              lname: userData.lname,
              gen_roles: userData.gen_roles,
              email: userData.email,
              acc_id: userData.acc_id,
              status: userData.status,
              firebase_uid: userData.firebase_uid,
              temporary_pass: userData.temporary_pass, 
              created_at: userData.created_at, 
              updated_at: userData.updated_at 
            };

            setAccountantData(accountantInfo);
            localStorage.setItem('accountantData', JSON.stringify(accountantInfo));
          }
        }
      } catch (error) {
        console.error("Error fetching accountant data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAccountantData();
  }, []);

  useEffect(() => {
    const pendingQuery = query(
      collection(db, 'cartItems'),
      where('status', '==', 'To Pay')
    );

    const cancelledQuery = query(
      collection(db, 'cartItems'),
      where('status', '==', 'Cancelled')
    );

    const refundQuery = query(
      collection(db, 'cartItems'),
      where('status', 'in', ['To Refund', 'Refunded'])
    );

    const recentArchivesQuery = query(
      collection(db, 'cartItems'),
      where('status', 'in', ['To Receive', 'Completed', 'To Return', 'Returned', 'Void'])
    );

    const unsubscribePending = onSnapshot(pendingQuery, (snapshot) => {
      const count = snapshot.size;

    });

    const unsubscribeCancelled = onSnapshot(cancelledQuery, (snapshot) => {
      const count = snapshot.size;
    });

    const unsubscribeRefund = onSnapshot(refundQuery, (snapshot) => {
      const count = snapshot.size;

      
    });

    const unsubscribeArchives = onSnapshot(recentArchivesQuery, (snapshot) => {
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));

      const newOrders = snapshot.docs.filter(doc => {
        const orderData = doc.data();
        const orderDate = orderData.createdAt?.toDate?.() || new Date(orderData.createdAt);
        return orderDate > twentyFourHoursAgo;
      }).length;


    });

    return () => {
      unsubscribePending();
      unsubscribeCancelled();
      unsubscribeRefund();
      unsubscribeArchives();
    };
  }, [location.pathname]);

  const handleNavigation = (path) => {
    navigate(path);
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  const handleSignOutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmSignOut = () => {
    localStorage.removeItem('accountantData');
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      {/* Sidebar */}
      <div className={`bg-green-500 text-white flex flex-col transition-all duration-300 fixed lg:relative z-40 h-screen ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-0 lg:w-20 -translate-x-full lg:translate-x-0 overflow-hidden'
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Header Section */}
        <div className={`flex items-center justify-between p-4 border-green-600 ${!isSidebarOpen && 'lg:justify-center'
          }`}>
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="FIT4SCHOOL Logo" className="w-8 h-8" />
            {isSidebarOpen && <h2 className="text-xl font-bold">FIT4SCHOOL</h2>}
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

        {/* User Info Section - Clickable (Navigates to Profile Page) */}
        <div
          onClick={() => handleNavigation('/acc_profile')}
          className={`p-4 border-green-600 cursor-pointer hover:bg-green-600 transition ${!isSidebarOpen && 'lg:flex lg:justify-center'}`}
        >
          <div className="flex items-center gap-3">
            <img src={circleUser} alt="UserDefault Logo" className="w-9 h-9" />
            {isSidebarOpen && (
              <div className="flex-1 min-w-0">
                {loading ? (
                  <>
                    <p className="text-sm font-semibold truncate animate-pulse bg-green-400 h-4 w-24 rounded"></p>
                    <p className="text-xs text-green-100 mt-1 animate-pulse bg-green-400 h-3 w-16 rounded"></p>
                  </>
                ) : accountantData ? (
                  <>
                    <p className="text-md font-semibold truncate">
                      {accountantData.fname} {accountantData.lname}
                    </p>
                    <p className="text-sm text-green-100 capitalize">
                      {accountantData.gen_roles === "accountant" ? "Accountant" : accountantData.gen_roles}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold truncate">Jojo Ramos</p>
                    <p className="text-xs text-green-100">Accountant</p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 p-4 space-y-1">
          {/* Dashboard */}
          <button
            onClick={() => handleNavigation('/ac_dashboard')}
            className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 ${isActive('/ac_dashboard') ? 'bg-blue-500 shadow-md' : 'hover:bg-blue-600'
              } ${isSidebarOpen ? 'justify-start gap-3' : 'justify-center'}`}
            title={!isSidebarOpen ? "Dashboard" : ""}
          >
            <img src={dashIcon} alt="dashIcon" className="w-5 h-5 flex-shrink-0" />
            {isSidebarOpen && (
              <div className="flex items-center justify-between flex-1">
                <span className="text-lg font-medium">Dashboard</span>
              </div>
            )}
          </button>

          {/* Payments */}
          <button
            onClick={() => handleNavigation('/ac_payments')}
            className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 ${isActive('/ac_payments') ? 'bg-blue-500 shadow-md' : 'hover:bg-blue-600'
              } ${isSidebarOpen ? 'justify-start gap-3' : 'justify-center'}`}
            title={!isSidebarOpen ? "Payments" : ""}
          >
            <img src={payIcon} alt="payIcon" className="w-5 h-5 flex-shrink-0" />
            {isSidebarOpen && (
              <div className="flex items-center justify-between flex-1">
                <span className="text-lg font-medium">Payments</span>
              </div>
            )}     
          </button>
        </nav>

        {/* Sign Out Section */}
        <div className="p-4 border-green-600">
          <button
            onClick={handleSignOutClick}
            className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 ${isSidebarOpen ? 'justify-start gap-3' : 'justify-center'
              }`}
            title={!isSidebarOpen ? "Signout" : ""}
          >
            <img src={signoutIcon} alt="signoutIcon" className="w-5 h-5 flex-shrink-0" />
            {isSidebarOpen && <span className="text-md font-medium">Sign out</span>}
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

export default AcSidebar;