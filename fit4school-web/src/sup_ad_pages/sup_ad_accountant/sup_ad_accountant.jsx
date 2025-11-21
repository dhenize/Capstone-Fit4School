import React, { useEffect, useState, useRef } from 'react';
import { collection, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import SupSidebar from '../../components/sup_sidebar/sup_sidebar';
import searchIcon from '../../assets/icons/search.png';
import exportIcon from '../../assets/icons/export-icon.png';
import importIcon from '../../assets/icons/import.png';
import filterIcon from '../../assets/icons/filter-icon.png';

const SupAdAccountant = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [importMessage, setImportMessage] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const fetchAccountantAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const accountsCol = collection(db, 'accounts');
      const accountSnapshot = await getDocs(accountsCol);
      
      const accountList = accountSnapshot.docs.map(doc => {
        const data = doc.data();
        
        return {
          id: doc.id,
          userId: doc.id.substring(0, 10),
          fullName: `${data.fname || ''} ${data.lname || ''}`.trim(),
          fname: data.fname || '',
          lname: data.lname || '',
          email: data.email || '',
          role: data.gen_roles || 'Accountant',
          status: data.status === 'active' ? 'Active' : 'Unverified',
          created_at: data.created_at,
          acc_id: data.acc_id,
          originalData: data
        };
      });

      const accountantAccounts = accountList.filter(acc => 
        acc.role.toLowerCase() === 'accountant'
      );

      setAccounts(accountantAccounts);
      
    } catch (err) {
      console.error('Error fetching accountant accounts:', err);
      setError('Failed to load accountant accounts data');
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async (accountId) => {
    if (window.confirm('Are you sure you want to delete this accountant account?')) {
      try {
        await deleteDoc(doc(db, 'accounts', accountId));
        await fetchAccountantAccounts();
        alert('Accountant account deleted successfully');
      } catch (err) {
        console.error('Error deleting account:', err);
        alert('Failed to delete accountant account');
      }
    }
  };


  const updateAccountStatus = async (accountId, newStatus) => {
    try {
      const statusValue = newStatus === 'Active' ? 'active' : 'inactive';
      
      await updateDoc(doc(db, 'accounts', accountId), {
        status: statusValue,
        updated_at: new Date()
      });
      
      await fetchAccountantAccounts();
      alert(`Account status updated to ${newStatus}`);
    } catch (err) {
      console.error('Error updating account status:', err);
      alert('Failed to update account status');
    }
  };

  const deleteSelectedAccounts = async () => {
    if (selectedAccounts.length === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedAccounts.length} selected accounts?`)) {
      try {
        const deletePromises = selectedAccounts.map(accountId => 
          deleteDoc(doc(db, 'accounts', accountId))
        );
        
        await Promise.all(deletePromises);
        await fetchAccountantAccounts();
        setSelectedAccounts([]);
        alert('Accounts deleted successfully');
      } catch (err) {
        console.error('Error deleting accounts:', err);
        alert('Failed to delete accounts');
      }
    }
  };

  useEffect(() => {
    document.title = "Super Admin | Accountants - Fit4School";
    fetchAccountantAccounts();

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
      'Active': 'bg-green-100 text-green-800 border-green-300',
      'Unverified': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'Inactive': 'bg-red-100 text-red-800 border-red-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const filteredAccounts = accounts.filter((acc) => {
    const matchesSearch =
      acc.userId?.toLowerCase().includes(searchText.toLowerCase()) ||
      acc.fullName?.toLowerCase().includes(searchText.toLowerCase()) ||
      acc.email?.toLowerCase().includes(searchText.toLowerCase());

    const matchesFilter = filterStatus === 'All' || acc.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const sortedAccounts = [...filteredAccounts].sort((a, b) => {
    if (!sortConfig.key) return 0;

    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];

    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

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
      setSelectedAccounts(sortedAccounts.map((acc) => acc.id));
    } else {
      setSelectedAccounts([]);
    }
  };

  const handleSelectAccount = (accountId) => {
    if (selectedAccounts.includes(accountId)) {
      setSelectedAccounts(selectedAccounts.filter((id) => id !== accountId));
    } else {
      setSelectedAccounts([...selectedAccounts, accountId]);
    }
  };

  const handleExport = () => {
    const csvContent = [
      ['User ID', 'Full Name', 'Email', 'Role', 'Status', 'Created Date'],
      ...sortedAccounts.map(acc => [
        acc.userId,
        acc.fullName,
        acc.email,
        acc.role,
        acc.status,
        acc.created_at ? new Date(acc.created_at.seconds * 1000).toLocaleDateString() : 'N/A'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `accountant_accounts_${new Date().toISOString().split('T')[0]}.csv`;
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
          const [userId, fullName, email, role, status] = line.split(',');
          
          return {
            userId: userId || `auto_${Date.now()}_${index}`,
            fullName: fullName || 'Unknown User',
            email: email || 'unknown@email.com',
            role: role || 'Accountant',
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

  const statuses = ['All', 'Active', 'Unverified'];

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <SupSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading accountant accounts...</p>
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
              onClick={fetchAccountantAccounts}
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
          <h1 className="text-2xl md:text-3xl font-bold mb-6">Accountant Accounts</h1>

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

                {/* Delete Selected Button */}
                {selectedAccounts.length > 0 && (
                  <>
                    <button
                      onClick={deleteSelectedAccounts}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm"
                    >
                      <span>Delete Selected ({selectedAccounts.length})</span>
                    </button>
                    <span className="flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold">
                      {selectedAccounts.length} selected
                    </span>
                  </>
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

          {/* Table */}
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
                    <th className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-blue-500 transition" onClick={() => handleSort('fullName')}>
                      <div className="flex items-center gap-1">
                        Full Name
                        {sortConfig.key === 'fullName' && <span>{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-blue-500 transition" onClick={() => handleSort('email')}>
                      <div className="flex items-center gap-1">
                        Email
                        {sortConfig.key === 'email' && <span>{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Role</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-blue-500 transition" onClick={() => handleSort('status')}>
                      <div className="flex items-center gap-1">
                        Status
                        {sortConfig.key === 'status' && <span>{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sortedAccounts.length > 0 ? (
                    sortedAccounts.map((acc) => (
                      <tr key={acc.id} className={`hover:bg-gray-50 transition ${selectedAccounts.includes(acc.id) ? 'bg-blue-50' : ''}`}>
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedAccounts.includes(acc.id)}
                            onChange={() => handleSelectAccount(acc.id)}
                            className="w-4 h-4 rounded cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-800">{acc.userId}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{acc.fullName}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{acc.email}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{acc.role}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(acc.status)}`}>
                            {acc.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => updateAccountStatus(acc.id, acc.status === 'Active' ? 'Unverified' : 'Active')}
                              className="bg-yellow-500 text-white px-2 py-1 rounded text-xs hover:bg-yellow-600 transition"
                            >
                              Toggle Status
                            </button>
                            <button
                              onClick={() => deleteAccount(acc.id)}
                              className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600 transition"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="px-4 py-8 text-center text-gray-500">
                        No accountant accounts found
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
        </main>
      </div>
    </div>
  );
};

export default SupAdAccountant;