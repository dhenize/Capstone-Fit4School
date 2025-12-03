import React, { useEffect, useState, useCallback } from 'react';
import ASidebar from '../../components/a_sidebar/a_sidebar.jsx';
import searchIcon from '../../assets/icons/search.png';
import exportIcon from '../../assets/icons/export-icon.png';
import {onSnapshot, collection, query, where, orderBy, getDocs} from 'firebase/firestore'
import { db } from "../../../firebase"

// Add debounce function for performance
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const AArchives = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [orders, setOrders] = useState([]);
  const [userNames, setUserNames] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Generate new order ID format
  const generateOrderId = () => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `ORDR${year}${month}${day}${randomNum}`;
  };

  useEffect(() => {
    document.title = "Admin | Archives - Fit4School";

    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    // Fetch processed orders with customer data
    const fetchOrdersWithCustomerData = async () => {
      setIsLoading(true);
      try {
        const processedQuery = query(
          collection(db, 'cartItems'),
          where('status', 'in', ['To Receive', 'Completed', 'To Return', 'To Refund', 'Returned', 'Refunded', 'Void', 'Cancelled']),
          orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(processedQuery, async (snapshot) => {
          const fetchedOrders = await Promise.all(snapshot.docs.map(async (doc) => {
            const data = doc.data();
            const orderId = doc.id;
            
            // Generate new order ID if needed
            let finalOrderId = data.orderId || orderId;
            if (!finalOrderId.startsWith('ORDR')) {
              finalOrderId = generateOrderId();
            }
            
            // Fetch customer data from accounts
            let customerName = 'Customer';
            let customerEmail = data.userEmail || 'N/A';
            
            if (data.requestedBy) {
              try {
                // Check cache first
                if (userNames[data.requestedBy]) {
                  customerName = userNames[data.requestedBy];
                } else {
                  const accountsQuery = query(
                    collection(db, 'accounts'),
                    where('userId', '==', data.requestedBy)
                  );
                  
                  const accountsSnapshot = await getDocs(accountsQuery);
                  if (!accountsSnapshot.empty) {
                    const userData = accountsSnapshot.docs[0].data();
                    customerName = `${userData.fname || ''} ${userData.lname || ''}`.trim();
                    
                    if (!customerName) {
                      // Fallback to email username if no name found
                      customerName = customerEmail.split('@')[0] || 'Customer';
                    }
                    
                    // Update cache
                    setUserNames(prev => ({ 
                      ...prev, 
                      [data.requestedBy]: customerName 
                    }));
                  }
                }
              } catch (error) {
                console.error('Error fetching customer data:', error);
                customerName = customerEmail.split('@')[0] || 'Customer';
              }
            }
            
            return {
              id: doc.id,
              orderId: finalOrderId,
              ...data,
              customerName,
              customerEmail,
              // Ensure items is always an array
              items: data.items || []
            };
          }));
          
          setOrders(fetchedOrders);
          setIsLoading(false);
        }, (err) => {
          console.error("Error fetching orders:", err);
          setIsLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error in fetchOrdersWithCustomerData:', error);
        setIsLoading(false);
      }
    };

    fetchOrdersWithCustomerData();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []); // Removed userNames from dependencies

  // Optimized search with debounce
  const debouncedSearch = useCallback(
    debounce((value) => {
      setSearchText(value);
    }, 300),
    []
  );

  const handleSearchChange = (e) => {
    debouncedSearch(e.target.value);
  };

  const formatDate = (ts) => {
    if (!ts) return "";
    if (ts.toDate) return ts.toDate().toLocaleString(); 
    if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleString();
    return ts;
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'to receive': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'to return': return 'bg-orange-100 text-orange-800';
      case 'to refund': return 'bg-red-100 text-red-800';
      case 'returned': return 'bg-purple-100 text-purple-800';
      case 'refunded': return 'bg-indigo-100 text-indigo-800';
      case 'void': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter and search logic
  const filteredOrders = orders.filter((order) => {
    const searchLower = searchText.toLowerCase();
    const matchesSearch = 
      order.orderId.toLowerCase().includes(searchLower) ||
      (order.customerName && order.customerName.toLowerCase().includes(searchLower)) ||
      (order.customerEmail && order.customerEmail.toLowerCase().includes(searchLower)) ||
      (order.items && order.items.some(item => 
        item.itemCode && item.itemCode.toLowerCase().includes(searchLower)
      ));
    
    const matchesFilter = filterStatus === 'All' || order.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  // Sorting logic
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (!sortConfig.key) return 0;

    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];

    // Handle date sorting
    if (sortConfig.key === 'createdAt' || sortConfig.key === 'cancelledAt' || sortConfig.key === 'paidAt') {
      if (aValue?.toDate) aValue = aValue.toDate();
      if (bValue?.toDate) bValue = bValue.toDate();
      
      if (!(aValue instanceof Date) && aValue) aValue = new Date(aValue);
      if (!(bValue instanceof Date) && bValue) bValue = new Date(bValue);
    }

    // Handle numeric sorting for quantity and price
    if (sortConfig.key === 'totalQuantity' || sortConfig.key === 'totalPrice') {
      aValue = getSortValue(a, sortConfig.key);
      bValue = getSortValue(b, sortConfig.key);
    }

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Helper function to get sortable values
  const getSortValue = (order, key) => {
    if (key === 'totalQuantity') {
      return order.items ? order.items.reduce((sum, item) => sum + (item.quantity || 0), 0) : 0;
    }
    if (key === 'totalPrice') {
      return order.items ? order.items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0) : 0;
    }
    return order[key];
  };

  // Handle sorting
  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc',
    });
  };

  // Handle select all
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedOrders(sortedOrders.map((order) => order.id));
    } else {
      setSelectedOrders([]);
    }
  };

  // Handle individual select
  const handleSelectOrder = (id) => {
    if (selectedOrders.includes(id)) {
      setSelectedOrders(selectedOrders.filter((orderId) => orderId !== id));
    } else {
      setSelectedOrders([...selectedOrders, id]);
    }
  };

  // Export to CSV
  const handleExport = () => {
    const ordersToExport = selectedOrders.length > 0 
      ? orders.filter(order => selectedOrders.includes(order.id))
      : sortedOrders;

    if (ordersToExport.length === 0) {
      alert('No orders to export');
      return;
    }

    const csvContent = [
      ['ORDER ID', 'CUSTOMER NAME', 'CUSTOMER EMAIL', 'ITEMS', 'TOTAL QUANTITY', 'TOTAL AMOUNT', 'PAYMENT METHOD', 'STATUS', 'CANCELLATION REASON', 'CANCELLED AT', 'PAID AT'],
      ...ordersToExport.map(order => {
        const totalQuantity = order.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
        const totalPrice = order.items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);
        const items = order.items.map(item => `${item.itemCode || ''} (${item.size || ''} x${item.quantity || 0})`).join('; ');
        const cancelledAt = order.cancelledAt ? formatDate(order.cancelledAt) : 'N/A';
        const paidAt = order.paidAt ? formatDate(order.paidAt) : 'N/A';
        
        return [
          order.orderId,
          order.customerName,
          order.customerEmail,
          items,
          totalQuantity,
          `₱${totalPrice.toFixed(2)}`,
          order.paymentMethod || 'cash',
          order.status,
          order.cancellationReason || 'N/A',
          cancelledAt,
          paidAt
        ];
      })
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin_archives_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const statuses = ['All', 'To Receive', 'Completed', 'To Return', 'To Refund', 'Returned', 'Refunded', 'Void', 'Cancelled'];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <ASidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          <h1 className="text-2xl md:text-3xl font-bold mb-6">Archives (Orders)</h1>
          
          {/* Loading Indicator */}
          {isLoading && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-600">Loading archives with customer data...</p>
            </div>
          )}
          
          {/* Actions Bar */}
          <div className="bg-white rounded-lg shadow mb-4 p-4">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              {/* Left: Filter & Export */}
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
                >
                  <img src={exportIcon} alt="Export" className="w-5 h-5" />
                  <span className="font-medium">Export</span>
                </button>

                {selectedOrders.length > 0 && (
                  <span className="flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold">
                    {selectedOrders.length} selected
                  </span>
                )}
              </div>

              {/* Right: Search */}
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Search orders, names, or emails..."
                  defaultValue={searchText}
                  onChange={handleSearchChange}
                  className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                />
                <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <img src={searchIcon} alt="Search" className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Status Filter Pills */}
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
            <div className="overflow-x-auto max-h-[600px]">
              <table className="w-full">
                {/* Table Header */}
                <thead className="bg-cyan-500 text-white sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left w-10">
                      <input
                        type="checkbox"
                        checked={selectedOrders.length === sortedOrders.length && sortedOrders.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded cursor-pointer"
                      />
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-blue-500 transition"
                      onClick={() => handleSort('orderId')}
                    >
                      <div className="flex items-center gap-1">
                        ORDER ID
                        {sortConfig.key === 'orderId' && (
                          <span>{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      CUSTOMER NAME
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      CUSTOMER EMAIL
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      ITEMS
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-blue-500 transition"
                      onClick={() => handleSort('totalQuantity')}
                    >
                      <div className="flex items-center gap-1">
                        TOTAL QUANTITY
                        {sortConfig.key === 'totalQuantity' && (
                          <span>{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-blue-500 transition"
                      onClick={() => handleSort('totalPrice')}
                    >
                      <div className="flex items-center gap-1">
                        TOTAL AMOUNT
                        {sortConfig.key === 'totalPrice' && (
                          <span>{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      PAYMENT METHOD
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      CANCELLATION REASON
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-blue-500 transition"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center gap-1">
                        STATUS
                        {sortConfig.key === 'status' && (
                          <span>{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
                        )}
                      </div>
                    </th>
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody className="divide-y divide-gray-200">
                  {sortedOrders.length > 0 ? (
                    sortedOrders.map((order) => {
                      const totalQuantity = order.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
                      const totalPrice = order.items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);
                      
                      return (
                        <tr 
                          key={order.id}
                          className={`hover:bg-gray-50 transition ${
                            selectedOrders.includes(order.id) ? 'bg-blue-50' : ''
                          }`}
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedOrders.includes(order.id)}
                              onChange={() => handleSelectOrder(order.id)}
                              className="w-4 h-4 rounded cursor-pointer"
                            />
                          </td>
                          <td className="px-4 py-3 font-mono text-xs font-bold text-gray-800">
                            {order.orderId}
                            {order.orderId.startsWith('ORDR') && (
                              <span className="ml-2 px-1 py-0.5 bg-green-100 text-green-800 text-xs rounded">NEW</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-800 font-medium">
                            {order.customerName}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {order.customerEmail}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {order.items?.slice(0, 2).map(item => item.itemCode || 'N/A').join(', ')}
                            {order.items?.length > 2 && ` +${order.items.length - 2} more`}
                          </td>
                          <td className="px-4 py-3 text-center font-semibold text-gray-800">
                            {totalQuantity}
                          </td>
                          <td className="px-4 py-3 font-bold text-green-600">
                            ₱{totalPrice.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 capitalize">
                            <span className={`px-2 py-1 rounded text-xs ${
                              order.paymentMethod === 'cash' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {order.paymentMethod || 'cash'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {order.cancellationReason || 'N/A'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="10" className="px-4 py-8 text-center text-gray-500">
                        {isLoading ? 'Loading archives...' : 'No orders found'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
              <div className="text-sm text-gray-600">
                Showing {sortedOrders.length} of {orders.length} orders
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

export default AArchives;