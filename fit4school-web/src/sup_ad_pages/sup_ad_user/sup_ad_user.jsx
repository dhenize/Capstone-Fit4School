import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, addDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { db } from "../../../firebase";
import SupSidebar from '../../components/sup_sidebar/sup_sidebar';
import searchIcon from '../../assets/icons/search.png';
import exportIcon from '../../assets/icons/export-icon.png';
import importIcon from '../../assets/icons/import.png';
import * as XLSX from 'xlsx';

const SupAdUser = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [accounts, setAccounts] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  
  // Confirmation modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState('');
  
  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Function to generate user ID
  const generateUserId = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const randomNum = Math.floor(100 + Math.random() * 900);
    return `USR${year}${month}@${randomNum}`;
  };

  // Function to generate temporary password
  const generateTemporaryPassword = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const specialChars = '!@#$%^&*';
    const randomSpecialChar = specialChars[Math.floor(Math.random() * specialChars.length)];
    
    return `${year}${month}USER${randomNum}${randomSpecialChar}`;
  };

  // Fetch user accounts
  const fetchUserAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch accounts with gen_roles = 'user'
      const accountsCol = collection(db, 'accounts');
      const accountSnapshot = await getDocs(accountsCol);
      
      const accountList = accountSnapshot.docs.map(doc => {
        const data = doc.data();
        
        return {
          id: doc.id,
          userId: data.userId || 'N/A',
          fullName: data.parent_fullname || '',
          email: data.email || '',
          temporaryPass: data.temporary_password || 'Not Generated',
          role: data.role || 'Guardian',
          gen_roles: data.gen_roles || 'USER',
          status: data.status || 'active',
          created_at: data.createdAt,
          updated_at: data.updatedAt,
          archivedAt: data.archivedAt,
          profile_pic: data.profile_pic || 'https://www.dropbox.com/scl/fi/f16djxz3v0t2frbzhnmnw/user-green.png?rlkey=bus8r53uo7qofi3st9cysjqc0&st=cjlozcp2&raw=1',
          originalData: data
        };
      });

      // Filter for user accounts only (gen_roles = 'USER')
      const userAccounts = accountList.filter(acc => 
        acc.gen_roles.toLowerCase() === 'user'
      );

      // Fetch students to link children
      const studentsCol = collection(db, 'students');
      const studentSnapshot = await getDocs(studentsCol);
      const studentList = studentSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setStudents(studentList);
      setAccounts(userAccounts);
      
    } catch (err) {
      console.error('Error fetching user accounts:', err);
      setError('Failed to load user accounts data');
    } finally {
      setLoading(false);
    }
  };

  // Get children for a user
  const getChildrenForUser = (userId) => {
    return students
      .filter(student => student.guardian === userId)
      .map(student => `${student.fname || ''} ${student.lname || ''}`.trim())
      .filter(name => name);
  };

  // Show confirmation modal
  const showConfirmation = (action, account, message) => {
    setConfirmAction(() => action);
    setConfirmMessage(message);
    setSelectedAccount(account);
    setShowConfirmModal(true);
  };

  // Show success modal
  const showSuccess = (message) => {
    setSuccessMessage(message);
    setShowSuccessModal(true);
  };

  // Toggle status (Active/Deactivated)
  const handleToggleStatus = async (account) => {
    const currentStatus = account.status;
    const newStatus = currentStatus === 'active' ? 'deactivated' : 'active';
    
    try {
      await updateDoc(doc(db, 'accounts', account.id), {
        status: newStatus,
        updatedAt: new Date()
      });
      
      showSuccess(`Account ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
      await fetchUserAccounts();
    } catch (err) {
      console.error('Error updating status:', err);
      showSuccess('Failed to update account status');
    }
  };

  // Delete account (move to archived)
  const handleDeleteAccount = async (account) => {
    try {
      await updateDoc(doc(db, 'accounts', account.id), {
        status: 'deleted',
        archivedAt: new Date(),
        updatedAt: new Date()
      });
      
      showSuccess('Account moved to archived successfully');
      await fetchUserAccounts();
    } catch (err) {
      console.error('Error deleting account:', err);
      showSuccess('Failed to delete account');
    }
  };

  // View account info
  const handleViewAccount = (account) => {
    setSelectedAccount(account);
    setShowViewModal(true);
  };

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

  // Export data to Excel with multiple sheets
  const handleExport = () => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const year = now.getFullYear();
    const fileName = `User_Accounts(${month}-${day}-${year}).xlsx`;
    
    // Create a new workbook
    const workbook = XLSX.utils.book_new();
    
    // Prepare data for each sheet
    const statusCategories = [
      { name: 'Active', filter: acc => acc.status === 'active' },
      { name: 'Deactivated', filter: acc => acc.status === 'deactivated' },
      { name: 'Archived', filter: acc => acc.status === 'deleted' }
    ];
    
    let hasData = false;
    
    statusCategories.forEach(({ name, filter }) => {
      const filteredAccounts = accounts.filter(filter);
      
      if (filteredAccounts.length > 0) {
        hasData = true;
        const worksheetData = [
          ['User ID', 'Full Name', 'Email', 'Temporary Password', 'Role', 'Status', 'Created At', 'Updated At', 'Archived At'],
          ...filteredAccounts.map(acc => [
            acc.userId,
            acc.fullName,
            acc.email,
            acc.temporaryPass,
            acc.role,
            acc.status,
            formatDate(acc.created_at),
            formatDate(acc.updated_at),
            acc.archivedAt ? formatDate(acc.archivedAt) : 'N/A'
          ])
        ];
        
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
        XLSX.utils.book_append_sheet(workbook, worksheet, name);
      }
    });
    
    if (!hasData) {
      showSuccess('No data to export');
      return;
    }
    
    // Generate Excel file
    XLSX.writeFile(workbook, fileName);
    showSuccess(`Exported successfully to ${fileName}`);
  };

  // Filter accounts based on active tab
  const getFilteredAccounts = () => {
    let filtered = accounts.filter(acc => 
      acc.userId?.toLowerCase().includes(searchText.toLowerCase()) ||
      acc.fullName?.toLowerCase().includes(searchText.toLowerCase()) ||
      acc.email?.toLowerCase().includes(searchText.toLowerCase())
    );

    switch (activeTab) {
      case 'Active':
        return filtered.filter(acc => acc.status === 'active');
      case 'Deactivated':
        return filtered.filter(acc => acc.status === 'deactivated');
      case 'Archived':
        return filtered.filter(acc => acc.status === 'deleted');
      default:
        return filtered;
    }
  };

  // Get count for each tab
  const getTabCount = (tab) => {
    switch (tab) {
      case 'Active':
        return accounts.filter(acc => acc.status === 'active').length;
      case 'Deactivated':
        return accounts.filter(acc => acc.status === 'deactivated').length;
      case 'Archived':
        return accounts.filter(acc => acc.status === 'deleted').length;
      default:
        return accounts.length;
    }
  };

  useEffect(() => {
    document.title = "Super Admin | App User Accounts - Fit4School";
    fetchUserAccounts();

    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getStatusColor = (status) => {
    const colors = {
      'active': 'bg-green-100 text-green-800 border-green-300',
      'deactivated': 'bg-red-100 text-red-800 border-red-300',
      'deleted': 'bg-gray-100 text-gray-800 border-gray-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getStatusText = (status) => {
    const texts = {
      'active': 'Active',
      'deactivated': 'Deactivated',
      'deleted': 'Archived',
    };
    return texts[status] || status;
  };

  const filteredAccounts = getFilteredAccounts();

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <SupSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading user accounts...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <SupSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <button 
              onClick={fetchUserAccounts}
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
      <SupSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          <h1 className="text-2xl md:text-3xl font-bold mb-6">App User Accounts</h1>

          {/* Actions Bar */}
          <div className="bg-white rounded-lg shadow mb-4 p-4">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="flex flex-wrap gap-2">
                {/* Only Export Button - No Import Button */}
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
                >
                  <img src={exportIcon} alt="Export" className="w-5 h-5" />
                  <span className="font-medium">Export</span>
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Search by User ID, Name, or Email..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                />
                <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <img src={searchIcon} alt="Search" className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 mt-4">
              {['All', 'Active', 'Deactivated', 'Archived'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    activeTab === tab
                      ? 'bg-cyan-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tab} ({getTabCount(tab)})
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-cyan-500 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">USER ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">FULL NAME</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">STATUS</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredAccounts.length > 0 ? (
                    filteredAccounts.map((acc) => (
                      <tr key={acc.id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3 text-sm font-semibold text-gray-800">{acc.userId}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{acc.fullName}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(acc.status)}`}>
                            {getStatusText(acc.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            {/* View Info Button */}
                            <button
                              onClick={() => handleViewAccount(acc)}
                              className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 transition"
                            >
                              View Info
                            </button>
                            
                            {/* Toggle Status Button - Only show for active/deactivated accounts */}
                            {acc.status !== 'deleted' && (
                              <button
                                onClick={() => showConfirmation(
                                  () => handleToggleStatus(acc),
                                  acc,
                                  `Are you sure you want to ${acc.status === 'active' ? 'deactivate' : 'activate'} ${acc.fullName}?`
                                )}
                                className={`px-3 py-1 rounded text-xs hover:opacity-90 transition ${
                                  acc.status === 'active' 
                                    ? 'bg-red-500 text-white hover:bg-red-600'
                                    : 'bg-green-500 text-white hover:bg-green-600'
                                }`}
                              >
                                {acc.status === 'active' ? 'Deactivate' : 'Activate'}
                              </button>
                            )}
                            
                            {/* Delete Button - Only show for non-archived accounts */}
                            {acc.status !== 'deleted' && (
                              <button
                                onClick={() => showConfirmation(
                                  () => handleDeleteAccount(acc),
                                  acc,
                                  `Are you sure you want to delete ${acc.fullName}? This will archive the account.`
                                )}
                                className="bg-gray-500 text-white px-3 py-1 rounded text-xs hover:bg-gray-600 transition"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                        No user accounts found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* View Account Info Modal */}
      {showViewModal && selectedAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">User Account Details</h3>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Account Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        USER ID
                      </label>
                      <p className="text-lg font-semibold text-gray-800">{selectedAccount.userId}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        FULL NAME
                      </label>
                      <p className="text-lg text-gray-800">{selectedAccount.fullName}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        EMAIL
                      </label>
                      <p className="text-lg text-gray-800">{selectedAccount.email}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        TEMPORARY PASSWORD
                      </label>
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-mono text-gray-800 bg-gray-100 px-3 py-1 rounded flex-1">
                          {selectedAccount.temporaryPass}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        ROLE
                      </label>
                      <p className="text-lg text-gray-800">{selectedAccount.gen_roles}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        ROLE TO CHILD
                      </label>
                      <p className="text-lg text-gray-800">{selectedAccount.role}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        CHILD(REN)
                      </label>
                      <div className="mt-1">
                        {getChildrenForUser(selectedAccount.userId).length > 0 ? (
                          getChildrenForUser(selectedAccount.userId).map((child, index) => (
                            <p key={index} className="text-gray-800 mb-1">{child}</p>
                          ))
                        ) : (
                          <p className="text-gray-500">No children found</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        STATUS
                      </label>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(selectedAccount.status)}`}>
                        {getStatusText(selectedAccount.status)}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Timestamps */}
                <div className="pt-6 border-t border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-700 mb-4">Timestamps</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        CREATED AT
                      </label>
                      <p className="text-gray-800">{formatDate(selectedAccount.created_at)}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        UPDATED AT
                      </label>
                      <p className="text-gray-800">{formatDate(selectedAccount.updated_at)}</p>
                    </div>
                    
                    {selectedAccount.archivedAt && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">
                          ARCHIVED AT
                        </label>
                        <p className="text-gray-800">{formatDate(selectedAccount.archivedAt)}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="pt-6 border-t border-gray-200">
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setShowViewModal(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                    >
                      Close
                    </button>
                    
                    {selectedAccount.status !== 'deleted' && (
                      <>
                        <button
                          onClick={() => showConfirmation(
                            () => {
                              handleToggleStatus(selectedAccount);
                              setShowViewModal(false);
                            },
                            selectedAccount,
                            `Are you sure you want to ${selectedAccount.status === 'active' ? 'deactivate' : 'activate'} ${selectedAccount.fullName}?`
                          )}
                          className={`px-4 py-2 rounded-lg text-white transition ${
                            selectedAccount.status === 'active' 
                              ? 'bg-red-500 hover:bg-red-600'
                              : 'bg-green-500 hover:bg-green-600'
                          }`}
                        >
                          {selectedAccount.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                        
                        <button
                          onClick={() => showConfirmation(
                            () => {
                              handleDeleteAccount(selectedAccount);
                              setShowViewModal(false);
                            },
                            selectedAccount,
                            `Are you sure you want to delete ${selectedAccount.fullName}? This will archive the account.`
                          )}
                          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                        >
                          Delete Account
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="p-6">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                  <span className="text-yellow-600 text-2xl">!</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Confirm Action</h3>
                <p className="text-sm text-gray-500 mb-6" dangerouslySetInnerHTML={{ __html: confirmMessage }}></p>
                
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => {
                      setShowConfirmModal(false);
                      setConfirmAction(null);
                      setConfirmMessage('');
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      confirmAction();
                      setShowConfirmModal(false);
                      setConfirmAction(null);
                      setConfirmMessage('');
                    }}
                    className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="p-6">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                  <span className="text-green-600 text-2xl">✓</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Success</h3>
                <p className="text-sm text-gray-500 mb-6" dangerouslySetInnerHTML={{ __html: successMessage }}></p>
                
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupAdUser;