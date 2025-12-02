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

const AcArchives = () => {
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

  useEffect(() => {
    document.title = "Accountant | Archives - Fit4School";

    const handleResize = () => setIsSidebarOpen(window.innerWidth >= 768);
    handleResize();
    window.addEventListener('resize', handleResize);

    // Fetch processed orders from 'cartItems' collection (real-time)
    const unsubscribe = fetchProcessedOrders();

    // Real-time clock
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      window.removeEventListener('resize', handleResize);
      unsubscribe();
      clearInterval(timer);
    };
  }, []);

  // Fetch processed orders from 'cartItems' collection (real-time)
  const fetchProcessedOrders = () => {
    const processedQuery = query(
      collection(db, 'cartItems'),
      where('status', 'in', ['To Receive', 'Completed', 'To Return', 'To Refund', 'Returned', 'Refunded', 'Void', 'Cancelled']),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeProcessed = onSnapshot(processedQuery, async (snapshot) => {
      const fetched = await Promise.all(snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();
        const customerName = await fetchUserName(data.requestedBy);
        return { id: docSnap.id, ...data, customerName };
      }));
      setOrders(fetched);
    });

    return unsubscribeProcessed;
  };

  // Fetch user name
  const fetchUserName = async (userId) => {
    try {
      if (!userId) return 'Unknown';
      
      if (userNames[userId]) return userNames[userId];
      
      const accountsQuery = query(
        collection(db, 'accounts'),
        where('userId', '==', userId)
      );
      
      const accountsSnapshot = await getDocs(accountsQuery);
      if (!accountsSnapshot.empty) {
        const userData = accountsSnapshot.docs[0].data();
        const name = `${userData.fname} ${userData.lname}`;
        setUserNames(prev => ({ ...prev, [userId]: name }));
        return name;
      }
      
      return 'Customer';
    } catch (error) {
      console.error('Error fetching user:', error);
      return 'Unknown';
    }
  };

  // Status badge color
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

  // Filter & search
  const filteredOrders = orders.filter(order => {
    const searchLower = searchText.toLowerCase();
    const matchesSearch = 
      (order.orderId && order.orderId.toLowerCase().includes(searchLower)) ||
      (order.id && order.id.toLowerCase().includes(searchLower)) ||
      (order.customerName && order.customerName.toLowerCase().includes(searchLower)) ||
      (order.items && order.items.some(item => 
        item.itemCode && item.itemCode.toLowerCase().includes(searchLower)
      ));

    const matchesFilter = filterStatus === 'All' || order.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  // Sorting
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];

    // Handle date sorting
    if (sortConfig.key === 'createdAt' || sortConfig.key === 'paidAt') {
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
      return order.items ? order.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
    }
    if (key === 'totalPrice') {
      return order.items ? order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) : 0;
    }
    return order[key];
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

  const handleExport = () => {
    const ordersToExport = selectedOrders.length > 0 
      ? orders.filter(order => selectedOrders.includes(order.id))
      : sortedOrders;

    if (ordersToExport.length === 0) {
      alert('No orders to export');
      return;
    }

    // Create CSV content for processed orders
    const csvContent = [
      ['ORDER ID', 'CUSTOMER NAME', 'ITEMS', 'TOTAL QUANTITY', 'TOTAL AMOUNT', 'PAYMENT METHOD', 'PAID AT', 'STATUS'],
      ...ordersToExport.map(order => {
        const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const paidAt = order.paidAt ? formatDateTime(order.paidAt) : 'N/A';
        const items = order.items.map(item => `${item.itemCode} (${item.size} x${item.quantity})`).join('; ');
        
        return [
          order.orderId || order.id,
          order.customerName,
          items,
          totalQuantity,
          `₱${totalPrice.toFixed(2)}`,
          order.paymentMethod || 'cash',
          paidAt,
          order.status
        ];
      })
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `archives_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Format date time for processed orders
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

  // Calendar functions
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

  const statuses = ['All', 'To Receive', 'Completed', 'To Return', 'To Refund', 'Returned', 'Refunded', 'Void', 'Cancelled'];

  const columns = [
    { key: 'orderId', label: 'ORDER ID', sortable: true },
    { key: 'customerName', label: 'CUSTOMER NAME', sortable: true },
    { key: 'items', label: 'ITEMS', sortable: false },
    { key: 'totalQuantity', label: 'TOTAL QUANTITY', sortable: true },
    { key: 'totalPrice', label: 'TOTAL AMOUNT', sortable: true },
    { key: 'paymentMethod', label: 'PAYMENT METHOD', sortable: true },
    { key: 'paidAt', label: 'PAID AT', sortable: true },
    { key: 'status', label: 'STATUS', sortable: true },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AcSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          <h1 className="text-2xl md:text-3xl font-bold mb-6">Archives</h1>
          
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
            <div className="overflow-x-auto max-h-[600px]">
              <table className="w-full">
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
                  {sortedOrders.length > 0 ? (
                    sortedOrders.map((order) => {
                      const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
                      const totalPrice = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                      const paidAt = order.paidAt ? formatDateTime(order.paidAt) : 'N/A';
                      
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
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {order.items.slice(0, 2).map(item => item.itemCode).join(', ')}
                            {order.items.length > 2 && ` +${order.items.length - 2} more`}
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
                            {paidAt}
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
                      <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-gray-500">
                        No orders found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AcArchives;