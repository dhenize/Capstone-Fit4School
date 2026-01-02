import React, { useEffect, useState } from 'react';
import { getAuth } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from '../../../firebase';
import ASidebar from '../admin_sidebar/a_sidebar';
import eyeIcon from '../../assets/icons/eye.svg';
import eyeOffIcon from '../../assets/icons/eye-closed.svg';

const AdminProfile = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);

  // Format date for display
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (err) {
      return 'Invalid date';
    }
  };

  // Fetch admin data
  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError(null);

      // First check localStorage
      const storedData = localStorage.getItem('adminData');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        
        // If we already have full data in localStorage
        if (parsedData.admin_id || parsedData.userId) {
          setUserData({
            admin_id: parsedData.admin_id || parsedData.userId || 'N/A',
            fname: parsedData.fname || 'N/A',
            lname: parsedData.lname || 'N/A',
            email: parsedData.email || 'N/A',
            temporary_password: parsedData.temporary_password || parsedData.temporary_pass || 'Not Generated',
            gen_roles: parsedData.gen_roles || 'admin',
            status: parsedData.status || 'active',
            createdAt: parsedData.createdAt || parsedData.created_at,
            updatedAt: parsedData.updatedAt || parsedData.updated_at
          });
          setLoading(false);
          return;
        }
      }

      // Fetch from Firebase
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        setError('User not authenticated. Please sign in.');
        setLoading(false);
        return;
      }

      // Find user by email in accounts collection
      const accountsRef = collection(db, "accounts");
      const accountsQuery = query(
        accountsRef, 
        where("email", "==", currentUser.email)
      );
      const querySnapshot = await getDocs(accountsQuery);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        
        const userInfo = {
          id: userDoc.id,
          admin_id: userData.admin_id || userData.userId || 'N/A',
          fname: userData.fname || 'N/A',
          lname: userData.lname || 'N/A',
          email: userData.email || 'N/A',
          temporary_password: userData.temporary_password || userData.temporary_pass || 'Not Generated',
          gen_roles: userData.gen_roles || 'admin',
          status: userData.status || 'active',
          createdAt: userData.createdAt || userData.created_at,
          updatedAt: userData.updatedAt || userData.updated_at
        };
        
        setUserData(userInfo);
        
        // Update localStorage with full data
        localStorage.setItem('adminData', JSON.stringify({
          fname: userData.fname,
          lname: userData.lname,
          gen_roles: userData.gen_roles,
          email: userData.email,
          admin_id: userData.admin_id || userData.userId,
          temporary_password: userData.temporary_password || userData.temporary_pass
        }));
      } else {
        setError('Admin data not found in database');
      }
    } catch (error) {
      console.error("Error fetching admin data:", error);
      setError('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Admin Profile - Fit4School";
    fetchAdminData();

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
        <ASidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
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
        <ASidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={fetchAdminData}
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
      <ASidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          <h1 className="text-2xl md:text-3xl font-bold mb-6">Admin Profile</h1>

          {/* Profile Card */}
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column - Basic Info */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    ADMIN ID
                  </label>
                  <p className="text-lg font-semibold text-gray-800 bg-gray-50 p-3 rounded-lg">
                    {userData?.admin_id || 'N/A'}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    FIRST NAME
                  </label>
                  <p className="text-lg text-gray-800 bg-gray-50 p-3 rounded-lg">
                    {userData?.fname || 'N/A'}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    LAST NAME
                  </label>
                  <p className="text-lg text-gray-800 bg-gray-50 p-3 rounded-lg">
                    {userData?.lname || 'N/A'}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    EMAIL
                  </label>
                  <p className="text-lg text-gray-800 bg-gray-50 p-3 rounded-lg">
                    {userData?.email || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Right Column - Account Details */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    TEMPORARY PASSWORD
                  </label>
                  <div className="flex items-center bg-gray-50 p-3 rounded-lg">
                    <p className="text-lg text-gray-800 font-mono flex-1">
                      {showPassword ? userData?.temporary_password : '•'.repeat(12)}
                    </p>
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 hover:bg-gray-100 rounded transition ml-2"
                      title={showPassword ? "Hide Password" : "Show Password"}
                    >
                      <img 
                        src={showPassword ? eyeOffIcon : eyeIcon} 
                        alt={showPassword ? "Hide Password" : "Show Password"} 
                        className="w-5 h-5" 
                      />
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    ROLE
                  </label>
                  <p className="text-lg text-gray-800 bg-gray-50 p-3 rounded-lg capitalize">
                    {userData?.gen_roles === "admin" ? "Admin" : userData?.gen_roles || 'N/A'}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    STATUS
                  </label>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      userData?.status === 'active' 
                        ? 'bg-green-100 text-green-800 border border-green-300' 
                        : userData?.status === 'deactivated'
                        ? 'bg-red-100 text-red-800 border border-red-300'
                        : 'bg-gray-100 text-gray-800 border border-gray-300'
                    }`}>
                      {userData?.status ? userData.status.charAt(0).toUpperCase() + userData.status.slice(1) : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Timestamps Section */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Account Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    CREATED AT
                  </label>
                  <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">
                    {formatDate(userData?.createdAt)}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    UPDATED AT
                  </label>
                  <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">
                    {formatDate(userData?.updatedAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Note Section */}
            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Note:</h4>
              <p className="text-sm text-blue-700">
                • This profile displays your admin account information as stored in the system.<br/>
                • Your temporary password is generated during account creation.<br/>
                • For security reasons, please change your password regularly.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminProfile;