import React, { useEffect, useState } from 'react';
import { getAuth, updatePassword } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from '../../firebase';
import AcSidebar from './ac_sidebar/ac_sidebar';
import eyeIcon from '../assets/icons/eye.svg';
import eyeOffIcon from '../assets/icons/eye-closed.svg';

const AccProfile = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);
  
  // Change Password Modal States
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState('');

  // Format date for display
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    try {
      let date;
      
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
      } else if (timestamp.seconds && timestamp.nanoseconds) {
        date = new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
      } else if (timestamp instanceof Date) {
        date = timestamp;
      } else if (typeof timestamp === 'string') {
        date = new Date(timestamp);
      } else {
        date = new Date(timestamp);
      }
      
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (err) {
      console.error("Error formatting date:", err, timestamp);
      return 'Invalid date';
    }
  };

  // Fetch accountant data
  const fetchAccountantData = async () => {
    try {
      setLoading(true);
      setError(null);

      const storedData = localStorage.getItem('accountantData');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        
        if (parsedData.acc_id) {
          setUserData({
            acc_id: parsedData.acc_id || 'N/A',
            fname: parsedData.fname || 'N/A',
            lname: parsedData.lname || 'N/A',
            email: parsedData.email || 'N/A',
            temporary_pass: parsedData.temporary_pass || 'Not Generated',
            gen_roles: parsedData.gen_roles || 'accountant',
            status: parsedData.status || 'active',
            created_at: parsedData.created_at,
            updated_at: parsedData.updated_at
          });
          setLoading(false);
          return;
        }
      }

      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        setError('User not authenticated. Please sign in.');
        setLoading(false);
        return;
      }

      const accountsRef = collection(db, "accounts");
      const accountsQuery = query(
        accountsRef, 
        where("firebase_uid", "==", currentUser.uid)
      );
      const querySnapshot = await getDocs(accountsQuery);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        
        const userInfo = {
          id: userDoc.id,
          acc_id: userData.acc_id || 'N/A',
          fname: userData.fname || 'N/A',
          lname: userData.lname || 'N/A',
          email: userData.email || 'N/A',
          temporary_pass: userData.temporary_pass || 'Not Generated',
          gen_roles: userData.gen_roles || 'accountant',
          status: userData.status || 'active',
          created_at: userData.created_at,
          updated_at: userData.updated_at
        };
        
        setUserData(userInfo);
        
        const localStorageData = {
          fname: userData.fname,
          lname: userData.lname,
          gen_roles: userData.gen_roles,
          email: userData.email,
          acc_id: userData.acc_id,
          temporary_pass: userData.temporary_pass,
          status: userData.status,
          created_at: userData.created_at ? {
            seconds: userData.created_at.seconds,
            nanoseconds: userData.created_at.nanoseconds
          } : null,
          updated_at: userData.updated_at ? {
            seconds: userData.updated_at.seconds,
            nanoseconds: userData.updated_at.nanoseconds
          } : null
        };
        
        localStorage.setItem('accountantData', JSON.stringify(localStorageData));
      } else {
        setError('Accountant data not found in database');
      }
    } catch (error) {
      console.error("Error fetching accountant data:", error);
      setError('Failed to load accountant data');
    } finally {
      setLoading(false);
    }
  };

  // Change Password Function
  const handleChangePassword = async () => {
    try {
      setChangingPassword(true);
      setChangePasswordError('');

      if (newPassword.length < 6) {
        setChangePasswordError('Password must be at least 6 characters long');
        return;
      }

      if (newPassword !== confirmPassword) {
        setChangePasswordError('Passwords do not match');
        return;
      }

      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        setChangePasswordError('User not authenticated');
        return;
      }

      await updatePassword(user, newPassword);
      alert('Password changed successfully!');
      
      setNewPassword('');
      setConfirmPassword('');
      setShowChangePasswordModal(false);
      setChangePasswordError('');
      
    } catch (error) {
      console.error("Error changing password:", error);
      
      if (error.code === 'auth/requires-recent-login') {
        setChangePasswordError('For security, please sign out and sign in again before changing password');
      } else if (error.code === 'auth/weak-password') {
        setChangePasswordError('Password is too weak. Please use a stronger password');
      } else {
        setChangePasswordError('Failed to change password. Please try again.');
      }
    } finally {
      setChangingPassword(false);
    }
  };

  const openChangePasswordModal = () => {
    setNewPassword('');
    setConfirmPassword('');
    setChangePasswordError('');
    setShowChangePasswordModal(true);
  };

  const closeChangePasswordModal = () => {
    setShowChangePasswordModal(false);
    setNewPassword('');
    setConfirmPassword('');
    setChangePasswordError('');
  };

  useEffect(() => {
    document.title = "Accountant Profile - Fit4School";
    fetchAccountantData();

    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <AcSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <AcSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={fetchAccountantData}
              className="bg-cyan-500 text-white px-4 py-2 rounded-lg hover:bg-cyan-600"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AcSidebar />

      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <main className="flex-1 p-4 sm:p-4 lg:p-6 overflow-hidden">
          <h1 className="text-xl md:text-2xl font-bold mb-4">Accountant Profile</h1>

          {/* Profile Card - Compact design */}
          <div className="bg-white rounded-lg shadow p-4 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column - Basic Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    ACCOUNTANT ID
                  </label>
                  <p className="text-base font-semibold text-gray-800 bg-gray-50 p-2 rounded">
                    {userData?.acc_id || 'N/A'}
                  </p>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    FIRST NAME
                  </label>
                  <p className="text-base text-gray-800 bg-gray-50 p-2 rounded">
                    {userData?.fname || 'N/A'}
                  </p>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    LAST NAME
                  </label>
                  <p className="text-base text-gray-800 bg-gray-50 p-2 rounded">
                    {userData?.lname || 'N/A'}
                  </p>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    EMAIL
                  </label>
                  <p className="text-base text-gray-800 bg-gray-50 p-2 rounded">
                    {userData?.email || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Right Column - Account Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    TEMPORARY PASSWORD
                  </label>
                  <div className="flex items-center bg-gray-50 p-2 rounded">
                    <p className="text-base text-gray-800 font-mono flex-1">
                      {showPassword ? userData?.temporary_pass : '•'.repeat(12)}
                    </p>
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 hover:bg-gray-100 rounded ml-2"
                      title={showPassword ? "Hide Password" : "Show Password"}
                    >
                      <img 
                        src={showPassword ? eyeOffIcon : eyeIcon} 
                        alt={showPassword ? "Hide Password" : "Show Password"} 
                        className="w-4 h-4" 
                      />
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    ROLE
                  </label>
                  <p className="text-base text-gray-800 bg-gray-50 p-2 rounded capitalize">
                    {userData?.gen_roles === "accountant" ? "Accountant" : userData?.gen_roles || 'N/A'}
                  </p>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    STATUS
                  </label>
                  <div className="bg-gray-50 p-2 rounded">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                      userData?.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : userData?.status === 'deactivated'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {userData?.status ? userData.status.charAt(0).toUpperCase() + userData.status.slice(1) : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Timestamps Section - Compact */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-base font-semibold text-gray-700 mb-3">Account Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    CREATED AT
                  </label>
                  <p className="text-sm text-gray-800 bg-gray-50 p-2 rounded">
                    {formatDate(userData?.created_at)}
                  </p>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    UPDATED AT
                  </label>
                  <p className="text-sm text-gray-800 bg-gray-50 p-2 rounded">
                    {formatDate(userData?.updated_at)}
                  </p>
                </div>
              </div>
            </div>

            {/* Change Password Button */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex justify-center">
                <button
                  onClick={openChangePasswordModal}
                  className="bg-cyan-500 text-white px-4 py-2 rounded hover:bg-cyan-600 transition text-sm font-medium"
                >
                  Change Password
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Change Password Modal - Compact */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-sm">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Change Password</h3>
                <button
                  onClick={closeChangePasswordModal}
                  className="text-gray-400 hover:text-gray-600 text-xl"
                >
                  &times;
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">Enter your new password below</p>
            </div>

            {/* Modal Body */}
            <div className="p-4">
              {changePasswordError && (
                <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded">
                  <p className="text-red-600 text-xs">{changePasswordError}</p>
                </div>
              )}

              {/* New Password Input */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded p-2 pr-8 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    placeholder="Enter new password"
                    disabled={changingPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                    disabled={changingPassword}
                  >
                    <img
                      src={showNewPassword ? eyeOffIcon : eyeIcon}
                      alt="Toggle visibility"
                      className="w-4 h-4"
                    />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Password must be at least 6 characters long
                </p>
              </div>

              {/* Confirm Password Input */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded p-2 pr-8 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    placeholder="Re-enter new password"
                    disabled={changingPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                    disabled={changingPassword}
                  >
                    <img
                      src={showConfirmPassword ? eyeOffIcon : eyeIcon}
                      alt="Toggle visibility"
                      className="w-4 h-4"
                    />
                  </button>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-2">
                <button
                  onClick={closeChangePasswordModal}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300 transition text-sm font-medium"
                  disabled={changingPassword}
                >
                  Cancel
                </button>
                <button
                  onClick={handleChangePassword}
                  className="flex-1 bg-cyan-500 text-white py-2 rounded hover:bg-cyan-600 transition text-sm font-medium disabled:opacity-50"
                  disabled={changingPassword}
                >
                  {changingPassword ? 'Changing...' : 'Change'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccProfile;