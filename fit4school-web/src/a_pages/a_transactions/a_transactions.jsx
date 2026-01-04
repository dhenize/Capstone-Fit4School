import React, { useEffect, useState, useCallback } from 'react';
import ASidebar from '../../components/a_sidebar/a_sidebar.jsx';
import searchIcon from '../../assets/icons/search.png';
import exportIcon from '../../assets/icons/export-icon.png';
import { onSnapshot, collection, query, where, orderBy, getDocs } from 'firebase/firestore'
import { db } from "../../../firebase"


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

// View Info Modal Component
const ViewInfoModal = ({ isOpen, orderData, onClose }) => {
  if (!isOpen || !orderData) return null;

  const totalQuantity = orderData.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const totalPrice = orderData.orderTotal || orderData.items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    // Debug: Log the timestamp to see what format it's in
    console.log('Timestamp received:', timestamp);
    console.log('Timestamp type:', typeof timestamp);
    
    if (timestamp.toDate) {
      console.log('Timestamp has toDate method');
      return timestamp.toDate().toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    }
    if (timestamp.seconds) {
      console.log('Timestamp has seconds property');
      return new Date(timestamp.seconds * 1000).toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    }
    if (timestamp instanceof Date) {
      console.log('Timestamp is Date instance');
      return timestamp.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    }
    // Handle string timestamps
    if (typeof timestamp === 'string') {
      console.log('Timestamp is string');
      try {
        return new Date(timestamp).toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        });
      } catch (e) {
        console.error('Error parsing timestamp string:', e);
        return 'Invalid Date';
      }
    }
    
    console.log('Timestamp fallback');
    return 'N/A';
  };

  // Debug: Log order data to check what fields are available
  React.useEffect(() => {
    if (isOpen && orderData) {
      console.log('Order data in modal:', orderData);
      console.log('paidAt field:', orderData.paidAt);
      console.log('paidAt type:', typeof orderData.paidAt);
    }
  }, [isOpen, orderData]);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition"
          >
            ×
          </button>
          <h2 className="text-xl font-bold text-gray-800 flex-1 text-center mr-8">
            Order Details
          </h2>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-500 mb-1">ORDER ID</h4>
                <p className="text-lg font-bold text-blue-600">{orderData.orderId || orderData.id}</p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-500 mb-1">CUSTOMER NAME</h4>
                <p className="text-lg text-gray-800">{orderData.customerName || 'Loading...'}</p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-500 mb-1">TOTAL QUANTITY</h4>
                <p className="text-lg text-gray-800">{totalQuantity}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-500 mb-1">TOTAL AMOUNT</h4>
                <p className="text-2xl font-bold text-green-600">₱{totalPrice.toFixed(2)}</p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-500 mb-1">PAYMENT METHOD</h4>
                <p className="text-lg text-gray-800 capitalize">{orderData.paymentMethod || 'cash'}</p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-500 mb-1">STATUS</h4>
                <p className="text-lg text-gray-800">{orderData.status}</p>
              </div>

              {orderData.status === 'Cancelled' && (
                <>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 mb-1">CANCELLATION REASON</h4>
                    <p className="text-lg text-gray-800">{orderData.cancellationReason || 'N/A'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 mb-1">CANCELLED AT</h4>
                    <p className="text-lg text-gray-800">{formatTimestamp(orderData.cancelledAt)}</p>
                  </div>
                </>
              )}

              {(orderData.status === 'To Receive' || orderData.status === 'Completed') && orderData.paidAt && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 mb-1">PAID AT</h4>
                  <p className="text-lg text-gray-800">{formatTimestamp(orderData.paidAt)}</p>
                </div>
              )}

              {orderData.status === 'Completed' && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 mb-1">RECEIVED AT</h4>
                  <p className="text-lg text-gray-800">{formatTimestamp(orderData.receivedAt)}</p>
                </div>
              )}

              <div>
                <h4 className="text-sm font-semibold text-gray-500 mb-1">CREATED AT</h4>
                <p className="text-lg text-gray-800">{formatTimestamp(orderData.createdAt)}</p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-500 mb-3">ORDER ITEMS</h4>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border px-4 py-3 text-left">Item Code</th>
                    <th className="border px-4 py-3 text-left">Category</th>
                    <th className="border px-4 py-3 text-left">Size</th>
                    <th className="border px-4 py-3 text-left">Qty</th>
                    <th className="border px-4 py-3 text-left">Price</th>
                    <th className="border px-4 py-3 text-left">Total</th>
                  </tr>
                </thead>

                <tbody>
                  {orderData.items.map((item, idx) => {
                    const itemTotal = ((item.price || 0) * (item.quantity || 0)).toFixed(2);
                    // Extract category from itemCode (first part before dash)
                    const category = item.itemCode ? item.itemCode.split('-')[1] || 'N/A' : 'N/A';

                    return (
                      <tr key={idx}>
                        <td className="border px-4 py-3">{item.itemCode}</td>
                        <td className="border px-4 py-3">{category}</td>
                        <td className="border px-4 py-3">{item.size}</td>
                        <td className="border px-4 py-3">{item.quantity}</td>
                        <td className="border px-4 py-3">₱{item.price}</td>
                        <td className="border px-4 py-3 font-semibold">₱{itemTotal}</td>
                      </tr>
                    );
                  })}
                </tbody>

                <tfoot>
                  <tr>
                    <td colSpan="5" className="border px-4 py-3 text-right font-bold">
                      Grand Total:
                    </td>
                    <td className="border px-4 py-3 text-blue-600 font-bold">
                      ₱{totalPrice.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-4 p-6 border-t">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const ATransactions = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [orders, setOrders] = useState([]);
  const [userNames, setUserNames] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    document.title = "Admin | Transactions - Fit4School";

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
          where('status', 'in', ['To Pay', 'To Receive', 'Completed', 'Void', 'Cancelled', 'Archived']),
          orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(processedQuery, async (snapshot) => {
          console.log(`Fetched ${snapshot.docs.length} orders from Firestore`);
          
          const fetchedOrders = await Promise.all(snapshot.docs.map(async (doc) => {
            const data = doc.data();
            const orderId = doc.id;

            // Debug: Log the data to see what fields are available
            console.log(`Order ${orderId} data:`, data);
            console.log(`Order ${orderId} paidAt:`, data.paidAt);
            console.log(`Order ${orderId} paidAt type:`, typeof data.paidAt);

            // Generate new order ID if needed
            let finalOrderId = data.orderId || orderId;
            if (!finalOrderId.startsWith('ORDR')) {
              finalOrderId = generateOrderId();
            }

            // Fetch customer data from accounts using firebase_uid
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
                    where('firebase_uid', '==', data.requestedBy)
                  );

                  const accountsSnapshot = await getDocs(accountsQuery);
                  if (!accountsSnapshot.empty) {
                    const userData = accountsSnapshot.docs[0].data();

                    // Get customer name from parent_fullname or fname/lname
                    if (userData.parent_fullname) {
                      customerName = userData.parent_fullname;
                    } else if (userData.fname && userData.lname) {
                      customerName = `${userData.fname} ${userData.lname}`.trim();
                    } else if (userData.fullName) {
                      customerName = userData.fullName;
                    } else if (userData.name) {
                      customerName = userData.name;
                    }

                    // Get email
                    if (userData.email) {
                      customerEmail = userData.email;
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
              items: data.items || [],
              // Ensure receivedAt is included (use deliveredAt if receivedAt doesn't exist)
              receivedAt: data.receivedAt || data.deliveredAt || null,
              // Ensure paidAt is explicitly included
              paidAt: data.paidAt || null
            };
          }));

          console.log('All fetched orders:', fetchedOrders);
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
      case 'to pay': return 'bg-orange-100 text-orange-800';
      case 'to receive': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'void': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-pink-100 text-pink-800';
      case 'archived': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewInfo = (order) => {
    console.log('Viewing order info:', order);
    console.log('Order paidAt:', order.paidAt);
    setSelectedOrder(order);
    setIsModalOpen(true);
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
    if (sortConfig.key === 'createdAt' || sortConfig.key === 'cancelledAt' || sortConfig.key === 'paidAt' || sortConfig.key === 'receivedAt') {
      if (aValue?.toDate) aValue = aValue.toDate();
      if (bValue?.toDate) bValue = bValue.toDate();

      if (!(aValue instanceof Date) && aValue) aValue = new Date(aValue);
      if (!(bValue instanceof Date) && bValue) bValue = new Date(bValue);
    }

    // Handle numeric sorting for quantity and price
    if (sortConfig.key === 'totalQuantity' || sortConfig.key === 'orderTotal') {
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
    if (key === 'orderTotal') {
      return order.orderTotal || (order.items ? order.items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0) : 0);
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

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentOrders = sortedOrders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedOrders.length / itemsPerPage);

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

    // Export with columns matching the table
    const csvContent = [
      ['ORDER ID', 'CUSTOMER NAME', 'TOTAL QUANTITY', 'TOTAL AMOUNT', 'STATUS'],
      ...ordersToExport.map(order => {
        const totalQuantity = getSortValue(order, 'totalQuantity');
        const totalAmount = getSortValue(order, 'orderTotal');

        return [
          order.orderId,
          order.customerName,
          totalQuantity,
          `₱${totalAmount.toFixed(2)}`,
          order.status
        ];
      })
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const statuses = ['All', 'To Pay', 'To Receive', 'Completed', 'Void', 'Cancelled', 'Archived'];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <ASidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          <h1 className="text-2xl md:text-3xl font-bold mb-6">Transactions (Orders)</h1>

          {/* Loading Indicator */}
          {isLoading && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-600">Loading all transactions...</p>
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
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${filterStatus === status
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
            <div className="overflow-x-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
              <table className="w-full">
                {/* Table Header */}
                <thead className="bg-cyan-500 text-white sticky top-0 z-10">
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
                      onClick={() => handleSort('orderTotal')}
                    >
                      <div className="flex items-center gap-1">
                        TOTAL AMOUNT
                        {sortConfig.key === 'orderTotal' && (
                          <span>{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
                        )}
                      </div>
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
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      ACTIONS
                    </th>
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody className="divide-y divide-gray-200">
                  {currentOrders.length > 0 ? (
                    currentOrders.map((order) => {
                      const totalQuantity = getSortValue(order, 'totalQuantity');
                      const totalPrice = getSortValue(order, 'orderTotal');

                      return (
                        <tr
                          key={order.id}
                          className={`hover:bg-gray-50 transition ${selectedOrders.includes(order.id) ? 'bg-blue-50' : ''
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
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-800 font-medium">
                            {order.customerName}
                          </td>
                          <td className="px-4 py-3 text-center font-semibold text-gray-800">
                            {totalQuantity}
                          </td>
                          <td className="px-4 py-3 font-bold text-green-600">
                            ₱{totalPrice.toFixed(2)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs whitespace-nowrap ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleViewInfo(order)}
                              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition text-xs font-semibold"
                            >
                              View Info
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                        {isLoading ? 'Loading transactions...' : 'No transactions found'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
              <div className="text-sm text-gray-600">
                Showing <span className="font-semibold">{indexOfFirstItem + 1}-{Math.min(indexOfLastItem, sortedOrders.length)}</span> of <span className="font-semibold">{sortedOrders.length}</span> orders
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                {/* Page numbers */}
                {(() => {
                  const maxVisiblePages = 5;
                  const pages = [];

                  if (totalPages <= maxVisiblePages) {
                    // Show all pages if total is 5 or less
                    for (let i = 1; i <= totalPages; i++) {
                      pages.push(i);
                    }
                  } else {
                    // Show dynamic range
                    let startPage = Math.max(1, currentPage - 2);
                    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

                    // Adjust start if we're near the end
                    if (endPage - startPage + 1 < maxVisiblePages) {
                      startPage = Math.max(1, endPage - maxVisiblePages + 1);
                    }

                    // First page
                    if (startPage > 1) {
                      pages.push(1);
                      if (startPage > 2) {
                        pages.push('...');
                      }
                    }

                    // Middle pages
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(i);
                    }

                    // Last page
                    if (endPage < totalPages) {
                      if (endPage < totalPages - 1) {
                        pages.push('...');
                      }
                      pages.push(totalPages);
                    }
                  }

                  return pages.map((page, index) => (
                    page === '...' ? (
                      <span key={`ellipsis-${index}`} className="px-2 py-1 text-gray-500">
                        ...
                      </span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 rounded text-sm ${currentPage === page
                            ? 'bg-cyan-500 text-white'
                            : 'border border-gray-300 hover:bg-gray-100'
                          }`}
                      >
                        {page}
                      </button>
                    )
                  ));
                })()}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      <ViewInfoModal
        isOpen={isModalOpen}
        orderData={selectedOrder}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default ATransactions;