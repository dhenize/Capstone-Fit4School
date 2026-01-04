import React, { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs
} from 'firebase/firestore';
import { db } from '../../../firebase';
import AcSidebar from '../../components/ac_sidebar/ac_sidebar.jsx';
import searchIcon from '../../assets/icons/search.png';
import exportIcon from '../../assets/icons/export-icon.png';
import calendarGIcon from '../../assets/icons/calendar-g.png';
import clockGIcon from '../../assets/icons/clock-g.png';

const ViewInfoModal = ({ isOpen, onClose, orderData }) => {
  if (!isOpen || !orderData) return null;

  const totalQuantity = orderData.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = orderData.orderTotal || orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

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

              <div>
                <h4 className="text-sm font-semibold text-gray-500 mb-1">CREATED AT</h4>
                <p className="text-lg text-gray-800">{formatTimestamp(orderData.createdAt)}</p>
              </div>

              {/* Conditional fields based on status */}
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

              {(orderData.status === 'To Receive' || orderData.status === 'Completed') && (
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
                    const itemTotal = (item.price * item.quantity).toFixed(2);
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

const AcPayments = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [orders, setOrders] = useState([]);
  const [userNames, setUserNames] = useState({});
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(3);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    document.title = "Accountant | Payments - Fit4School";

    const handleResize = () => setIsSidebarOpen(window.innerWidth >= 768);
    handleResize();
    window.addEventListener('resize', handleResize);


    const unsubscribe = fetchProcessedOrders();


    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      window.removeEventListener('resize', handleResize);
      unsubscribe();
      clearInterval(timer);
    };
  }, []);

  const fetchProcessedOrders = () => {
    setIsLoading(true);
    const processedQuery = query(
      collection(db, 'cartItems'),
      where('status', 'in', ['To Pay', 'To Receive', 'Completed', 'Void', 'Cancelled', 'Archived']),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeProcessed = onSnapshot(processedQuery, async (snapshot) => {
      const fetched = await Promise.all(snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();
        const customerName = await fetchUserName(data.requestedBy);
        return {
          id: docSnap.id,
          ...data,
          customerName,
          // Ensure receivedAt is included (use deliveredAt if receivedAt doesn't exist)
          receivedAt: data.receivedAt || data.deliveredAt || null
        };
      }));
      setOrders(fetched);
      setIsLoading(false);
    });

    return unsubscribeProcessed;
  };

  const fetchUserName = async (userId) => {
    try {
      if (!userId) return 'Unknown';

      if (userNames[userId]) return userNames[userId];

      // Query accounts collection using firebase_uid field
      const accountsQuery = query(
        collection(db, 'accounts'),
        where('firebase_uid', '==', userId)
      );

      const accountsSnapshot = await getDocs(accountsQuery);
      if (!accountsSnapshot.empty) {
        const userData = accountsSnapshot.docs[0].data();
        const name = userData.parent_fullname || 'Customer';
        setUserNames(prev => ({ ...prev, [userId]: name }));
        return name;
      }

      return 'Customer';
    } catch (error) {
      console.error('Error fetching user:', error);
      return 'Unknown';
    }
  };


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

  const filteredOrders = orders.filter(order => {
    const searchLower = searchText.toLowerCase();
    const matchesSearch =
      (order.orderId && order.orderId.toLowerCase().includes(searchLower)) ||
      (order.id && order.id.toLowerCase().includes(searchLower)) ||
      (order.customerName && order.customerName.toLowerCase().includes(searchLower));

    const matchesFilter = filterStatus === 'All' || order.status === filterStatus;

    return matchesSearch && matchesFilter;
  });


  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (!sortConfig.key) return 0;

    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];


    if (sortConfig.key === 'createdAt' || sortConfig.key === 'paidAt' || sortConfig.key === 'cancelledAt' || sortConfig.key === 'receivedAt') {
      if (aValue?.toDate) aValue = aValue.toDate();
      if (bValue?.toDate) bValue = bValue.toDate();

      if (!(aValue instanceof Date) && aValue) aValue = new Date(aValue);
      if (!(bValue instanceof Date) && bValue) bValue = new Date(bValue);
    }


    if (sortConfig.key === 'totalQuantity') {
      aValue = orderTotalQuantity(a);
      bValue = orderTotalQuantity(b);
    }

    if (sortConfig.key === 'totalAmount') {
      aValue = orderTotalAmount(a);
      bValue = orderTotalAmount(b);
    }

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });


  const orderTotalQuantity = (order) => {
    return order.items ? order.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
  };

  const orderTotalAmount = (order) => {
    return order.orderTotal || (order.items ? order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) : 0);
  };

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc',
    });
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedOrders(sortedOrders.map(order => order.id));
    else setSelectedOrders([]);
  };

  const handleSelectOrder = (id) => {
    if (selectedOrders.includes(id)) {
      setSelectedOrders(selectedOrders.filter(x => x !== id));
    } else {
      setSelectedOrders([...selectedOrders, id]);
    }
  };

  const handleViewInfo = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleExport = () => {
    const ordersToExport = selectedOrders.length > 0
      ? orders.filter(order => selectedOrders.includes(order.id))
      : sortedOrders;

    if (ordersToExport.length === 0) {
      alert('No orders to export');
      return;
    }

    // Export with same columns as displayed in table
    const csvContent = [
      ['ORDER ID', 'CUSTOMER NAME', 'TOTAL QUANTITY', 'TOTAL AMOUNT', 'STATUS', 'PAYMENT METHOD', 'CREATED AT', 'PAID AT', 'CANCELLATION REASON', 'CANCELLED AT', 'RECEIVED AT'],
      ...ordersToExport.map(order => {
        const totalQuantity = orderTotalQuantity(order);
        const totalAmount = orderTotalAmount(order);
        const createdAt = order.createdAt ? formatDateTime(order.createdAt) : 'N/A';
        const paidAt = order.paidAt ? formatDateTime(order.paidAt) : 'N/A';
        const cancelledAt = order.cancelledAt ? formatDateTime(order.cancelledAt) : 'N/A';
        const receivedAt = order.receivedAt ? formatDateTime(order.receivedAt) : 'N/A';

        return [
          order.orderId || order.id,
          order.customerName,
          totalQuantity,
          `₱${totalAmount.toFixed(2)}`,
          order.status,
          order.paymentMethod || 'cash',
          createdAt,
          paidAt,
          order.cancellationReason || 'N/A',
          cancelledAt,
          receivedAt
        ];
      })
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };


  const formatDateTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };


  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const generateCalendarDays = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days = [];

    for (let i = 0; i < startingDay; i++) {
      const prevDate = new Date(year, month, -i);
      days.unshift({
        date: prevDate.getDate(),
        isCurrentMonth: false,
        isToday: false,
        fullDate: prevDate
      });
    }

    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push({
        date: i,
        isCurrentMonth: true,
        isToday: date.getDate() === today.getDate() &&
          date.getMonth() === today.getMonth() &&
          date.getFullYear() === today.getFullYear(),
        fullDate: date
      });
    }

    const totalCells = 42;
    while (days.length < totalCells) {
      const nextDate = new Date(year, month + 1, days.length - daysInMonth - startingDay + 1);
      days.push({
        date: nextDate.getDate(),
        isCurrentMonth: false,
        isToday: false,
        fullDate: nextDate
      });
    }

    return days;
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setShowCalendar(false);
  };

  const navigateMonth = (direction) => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentOrders = sortedOrders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedOrders.length / itemsPerPage);

  const statuses = ['All', 'To Pay', 'To Receive', 'Completed', 'Void', 'Cancelled', 'Archived'];

  const columns = [
    { key: 'orderId', label: 'ORDER ID', sortable: true },
    { key: 'customerName', label: 'CUSTOMER NAME', sortable: true },
    { key: 'totalQuantity', label: 'TOTAL QUANTITY', sortable: true },
    { key: 'totalAmount', label: 'TOTAL AMOUNT', sortable: true },
    { key: 'status', label: 'STATUS', sortable: true },
    { key: 'actions', label: 'ACTIONS', sortable: false },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AcSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          <h1 className="text-2xl md:text-3xl font-bold mb-6">Payments</h1>

          {/* Date + Time with real-time clock */}
          <div className="flex gap-4 mb-6 relative">
            <div className="relative">
              <button
                onClick={() => setShowCalendar(!showCalendar)}
                className="text-sm flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition"
              >
                <img src={calendarGIcon} className="w-5" alt="Calendar" />
                {formatDate(currentTime)}
              </button>

              {showCalendar && (
                <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 w-72">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <button
                        onClick={() => navigateMonth(-1)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        ‹
                      </button>
                      <h3 className="font-semibold">
                        {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </h3>
                      <button
                        onClick={() => navigateMonth(1)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        ›
                      </button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                          {day}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                      {generateCalendarDays().map((day, index) => (
                        <button
                          key={index}
                          onClick={() => day.isCurrentMonth && handleDateSelect(day.fullDate)}
                          className={`
                            h-8 w-8 rounded-full text-sm flex items-center justify-center
                            ${day.isToday ? 'bg-cyan-500 text-white' : ''}
                            ${day.isCurrentMonth ? 'text-gray-800 hover:bg-gray-100' : 'text-gray-400'}
                            ${day.fullDate.toDateString() === selectedDate.toDateString() && day.isCurrentMonth ? 'bg-blue-100 text-blue-600' : ''}
                          `}
                        >
                          {day.date}
                        </button>
                      ))}
                    </div>

                    <div className="mt-4 pt-4 border-t">
                      <button
                        onClick={() => {
                          const today = new Date();
                          setSelectedDate(today);
                          setShowCalendar(false);
                        }}
                        className="w-full py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600 transition text-sm"
                      >
                        Go to Today
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="text-sm flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-sm border border-gray-200">
              <img src={clockGIcon} className="w-5" alt="Clock" />
              <span className="font-mono">{formatTime(currentTime)}</span>
            </div>
          </div>

          {/* Actions Bar */}
          <div className="bg-white rounded-lg shadow mb-4 p-4">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="flex flex-wrap gap-2">
                <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm">
                  <img src={exportIcon} alt="Export" className="w-5 h-5" />
                  <span className="font-medium">Export</span>
                </button>
                {selectedOrders.length > 0 && (
                  <span className="flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold">
                    {selectedOrders.length} selected
                  </span>
                )}
              </div>

              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                />
                <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <img src={searchIcon} alt="Search" className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex flex-wrap gap-2 mt-4">
              {statuses.map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${filterStatus === status ? 'bg-cyan-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Orders Table - Processed Orders Only */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
              <table className="min-w-full">
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
                    {columns.map(({ key, label, sortable }) => (
                      <th
                        key={key}
                        className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-blue-500 transition"
                        onClick={() => sortable && handleSort(key)}
                      >
                        <div className="flex items-center gap-1">
                          {label}
                          {sortable && sortConfig.key === key && (
                            <span>{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentOrders.length > 0 ? (
                    currentOrders.map((order) => {
                      const totalQuantity = orderTotalQuantity(order);
                      const totalAmount = orderTotalAmount(order);

                      return (
                        <tr key={order.id} className={`hover:bg-gray-50 transition ${selectedOrders.includes(order.id) ? 'bg-blue-50' : ''}`}>
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedOrders.includes(order.id)}
                              onChange={() => handleSelectOrder(order.id)}
                              className="w-4 h-4 rounded cursor-pointer"
                            />
                          </td>
                          <td className="px-4 py-3 font-mono text-xs font-bold">
                            {order.orderId || order.id}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-800 font-medium">
                            {order.customerName}
                          </td>
                          <td className="px-4 py-3 text-center font-semibold text-gray-800">
                            {totalQuantity}
                          </td>
                          <td className="px-4 py-3 font-bold text-green-600">
                            ₱{totalAmount.toFixed(2)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded whitespace-nowrap text-xs ${getStatusColor(order.status)}`}>
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
                      <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-gray-500">
                        {isLoading ? 'Loading payments...' : 'No transactions found'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {sortedOrders.length > 0 && (
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
            )}
          </div>
        </main>
      </div>

      <ViewInfoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        orderData={selectedOrder}
      />
    </div>
  );
};

export default AcPayments;