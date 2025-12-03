import React, { useEffect, useState, useRef } from 'react';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from "../../../firebase"
import SupSidebar from '../../components/sup_sidebar/sup_sidebar';
import searchIcon from '../../assets/icons/search.png';
import exportIcon from '../../assets/icons/export-icon.png';
import importIcon from '../../assets/icons/import.png';
import filterIcon from '../../assets/icons/filter-icon.png';

const SupAdUser = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [importMessage, setImportMessage] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    document.title = "Super Admin | App User Accounts - Fit4School";

    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    
    
    fetchUsers();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
     
      const accountsRef = collection(db, 'accounts');
      
     
      const q = query(accountsRef);
      const querySnapshot = await getDocs(q);
      
      const users = [];
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        
        
        const transformedUser = {
         
          userId: userData.userId || doc.id,
          studentId: userData.studentId || 'N/A', 
          fullName: `${userData.fname || ''} ${userData.lname || ''}`.trim(),
          email: userData.email || '',
          mobile: userData.contact_number || userData.mobile || '',
          role: userData.roles ? userData.roles.join(', ') : 'User',
          status: formatStatus(userData.status),          
          firebaseData: userData,
          documentId: doc.id
        };
        
        users.push(transformedUser);
      });
      
      setAccounts(users);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again.');
      
      
      setAccounts([
        { userId: '250042', studentId: '12345678', fullName: 'Juan Dela Cruz', email: 'hello@email.com', mobile: '09123456789', role: 'User (Pr)', status: 'Active' },
        { userId: '250043', studentId: '23456789', fullName: 'Maria Santos', email: 'maria@email.com', mobile: '09198765432', role: 'User (Gp)', status: 'Active' },
        { userId: '250044', studentId: '34567890', fullName: 'Carlos Reyes', email: 'carlos@email.com', mobile: '09125678934', role: 'User (Lg)', status: 'Active' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatStatus = (firebaseStatus) => {
    
    const statusMap = {
      'pending-verification': 'Unverified',
      'verified': 'Active',
      'active': 'Active',
      'inactive': 'Inactive',
      'suspended': 'Suspended'
    };
    
    return statusMap[firebaseStatus] || firebaseStatus || 'Unverified';
  };

  const getStatusColor = (status) => {
    const colors = {
      'Active': 'bg-green-100 text-green-800 border-green-300',
      'Unverified': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'Inactive': 'bg-red-100 text-red-800 border-red-300',
      'Suspended': 'bg-gray-100 text-gray-800 border-gray-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  
  const filteredAccounts = accounts.filter((acc) => {
    const matchesSearch =
      acc.userId.toLowerCase().includes(searchText.toLowerCase()) ||
      acc.studentId.toLowerCase().includes(searchText.toLowerCase()) ||
      acc.fullName.toLowerCase().includes(searchText.toLowerCase()) ||
      acc.email.toLowerCase().includes(searchText.toLowerCase()) ||
      acc.mobile.includes(searchText);

    const matchesFilter = filterStatus === 'All' || acc.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  
  const sortedAccounts = [...filteredAccounts].sort((a, b) => {
    if (!sortConfig.key) return 0;

    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc',
    });
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedAccounts(sortedAccounts.map((acc) => acc.userId));
    } else {
      setSelectedAccounts([]);
    }
  };

  const handleSelectAccount = (userId) => {
    if (selectedAccounts.includes(userId)) {
      setSelectedAccounts(selectedAccounts.filter((id) => id !== userId));
    } else {
      setSelectedAccounts([...selectedAccounts, userId]);
    }
  };

  const handleExport = () => {
    const csvContent = [
      ['User ID', 'Student ID', 'Full Name', 'Email', 'Mobile No.', 'Role', 'Status'],
      ...sortedAccounts.map(acc => [
        acc.userId,
        acc.studentId,
        acc.fullName,
        acc.email,
        acc.mobile,
        acc.role,
        acc.status,
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `accounts_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setImportMessage('Please select a CSV file');
      setTimeout(() => setImportMessage(''), 3000);
      return;
    }

    processCSVFile(file);
  };

  const processCSVFile = (file) => {
    setIsImporting(true);
    setImportMessage('Processing file...');

    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const csvContent = e.target.result;
        const lines = csvContent.split('\n');
        
       
        const dataLines = lines.slice(1).filter(line => line.trim());
        
        const newAccounts = dataLines.map((line, index) => {
          const [userId, studentId, fullName, email, mobile, role, status] = line.split(',');
          
          return {
            userId: userId || `auto_${Date.now()}_${index}`,
            studentId: studentId || `stu_${Date.now()}_${index}`,
            fullName: fullName || 'Unknown User',
            email: email || 'unknown@email.com',
            mobile: mobile || '00000000000',
            role: role || 'User (Std)',
            status: status?.trim() || 'Unverified'
          };
        }).filter(account => account.fullName !== 'Unknown User');

        
        setAccounts(prevAccounts => [...prevAccounts, ...newAccounts]);
        
        setImportMessage(`Successfully imported ${newAccounts.length} accounts`);
        setTimeout(() => setImportMessage(''), 5000);
        
      } catch (error) {
        console.error('Error processing CSV:', error);
        setImportMessage('Error processing file. Please check the format.');
        setTimeout(() => setImportMessage(''), 5000);
      } finally {
        setIsImporting(false);
        
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };

    reader.onerror = () => {
      setImportMessage('Error reading file');
      setIsImporting(false);
      setTimeout(() => setImportMessage(''), 3000);
    };

    reader.readAsText(file);
  };

  const statuses = ['All', 'Active', 'Unverified', 'Inactive', 'Suspended'];

 
  const handleRefresh = () => {
    fetchUsers();
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SupSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl md:text-3xl font-bold">App User Accounts</h1>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-medium"
            >
              Refresh Data
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg border border-red-300">
              {error}
            </div>
          )}

          {/* Import Message */}
          {importMessage && (
            <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${
              importMessage.includes('Error') || importMessage.includes('Please select') 
                ? 'bg-red-100 text-red-700 border border-red-300' 
                : 'bg-green-100 text-green-700 border border-green-300'
            }`}>
              {importMessage}
            </div>
          )}

          {/* Actions Bar */}
          <div className="bg-white rounded-lg shadow mb-4 p-4">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm">
                    <img src={filterIcon} alt="Filter" className="w-5 h-5" />
                    <span className="font-medium">Filter</span>
                  </button>
                </div>

                {/* Import Button */}
                <button
                  onClick={handleImportClick}
                  disabled={isImporting}
                  className={`flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg transition text-sm ${
                    isImporting 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <img src={importIcon} alt="Import" className="w-5 h-5" />
                  <span className="font-medium">
                    {isImporting ? 'Importing...' : 'Import'}
                  </span>
                </button>

                {/* Hidden file input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".csv"
                  className="hidden"
                />

                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
                >
                  <img src={exportIcon} alt="Export" className="w-5 h-5" />
                  <span className="font-medium">Export</span>
                </button>

                {selectedAccounts.length > 0 && (
                  <span className="flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold">
                    {selectedAccounts.length} selected
                  </span>
                )}
              </div>

              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Search accounts..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                />
                <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <img src={searchIcon} alt="Search" className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-2 mt-4">
              {statuses.map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                    filterStatus === status
                      ? 'bg-cyan-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-600">Loading users...</p>
            </div>
          ) : (
            /* Table */
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-cyan-500 text-white">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedAccounts.length === sortedAccounts.length && sortedAccounts.length > 0}
                          onChange={handleSelectAll}
                          className="w-4 h-4 rounded cursor-pointer"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-blue-500 transition" onClick={() => handleSort('userId')}>
                        <div className="flex items-center gap-1">
                          User ID
                          {sortConfig.key === 'userId' && <span>{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>}
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-blue-500 transition" onClick={() => handleSort('studentId')}>
                        <div className="flex items-center gap-1">
                          Student ID
                          {sortConfig.key === 'studentId' && <span>{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>}
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Full Name</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Email</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Mobile No.</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Role</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sortedAccounts.length > 0 ? (
                      sortedAccounts.map((acc) => (
                        <tr key={acc.userId} className={`hover:bg-gray-50 transition ${selectedAccounts.includes(acc.userId) ? 'bg-blue-50' : ''}`}>
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedAccounts.includes(acc.userId)}
                              onChange={() => handleSelectAccount(acc.userId)}
                              className="w-4 h-4 rounded cursor-pointer"
                            />
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-800">{acc.userId}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{acc.studentId}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{acc.fullName}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{acc.email}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{acc.mobile}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{acc.role}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(acc.status)}`}>
                              {acc.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                          No accounts found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                <div className="text-sm text-gray-600">
                  Showing {sortedAccounts.length} of {accounts.length} accounts
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 text-sm">
                    Previous
                  </button>
                  <button className="px-3 py-1 bg-cyan-500 text-white rounded text-sm">
                    1
                  </button>
                  <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 text-sm">
                    2
                  </button>
                  <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 text-sm">
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default SupAdUser;