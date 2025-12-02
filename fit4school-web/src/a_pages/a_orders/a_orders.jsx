import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../../firebase';
import ASidebar from '../../components/a_sidebar/a_sidebar.jsx';
import calendarGIcon from "../../assets/icons/calendar-g.png";
import clockGIcon from "../../assets/icons/clock-g.png";
import searchIcon from '../../assets/icons/search.png';
import exportIcon from '../../assets/icons/export-icon.png';

const ConfirmDeliveryModal = ({ isOpen, orderData, onClose, onConfirm }) => {
  if (!isOpen || !orderData) return null;

  const totalPrice = orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl p-6">
        <h2 className="text-xl font-bold mb-4 text-center">Confirm Order Delivery</h2>

        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <p className="font-semibold">Order ID: <span className="text-blue-600">{orderData.id}</span></p>
          <p className="text-sm text-gray-600">Ready for pickup/delivery</p>
        </div>

        <div className="overflow-x-auto mb-4">
          <table className="w-full border-collapse border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-4 py-2 text-left">Item Code</th>
                <th className="border px-4 py-2 text-left">Category</th>
                <th className="border px-4 py-2 text-left">Size</th>
                <th className="border px-4 py-2 text-left">Quantity</th>
                <th className="border px-4 py-2 text-left">Price</th>
                <th className="border px-4 py-2 text-left">Total</th>
              </tr>
            </thead>
            <tbody>
              {orderData.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="border px-4 py-2">{item.itemCode}</td>
                  <td className="border px-4 py-2">{item.category}</td>
                  <td className="border px-4 py-2">{item.size}</td>
                  <td className="border px-4 py-2">{item.quantity}</td>
                  <td className="border px-4 py-2">₱{item.price.toFixed(2)}</td>
                  <td className="border px-4 py-2">₱{(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan="5" className="border px-4 py-2 text-right font-semibold">Grand Total:</td>
                <td className="border px-4 py-2 font-semibold text-blue-600">₱{totalPrice.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-300 rounded hover:bg-gray-400 transition"
          >
            Cancel
          </button>
          <button
            onClick={async () => await onConfirm(orderData.id)}
            className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
          >
            Confirm Received
          </button>
        </div>
      </div>
    </div>
  );
};

const AOrders = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [modalOrder, setModalOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scanBuffer, setScanBuffer] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchText, setSearchText] = useState('');
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Realtime fetch all orders where status is "to receive"
  useEffect(() => {
    document.title = "Admin | Orders - Fit4School";
    const q = query(
      collection(db, 'cartItems'),
      where('status', '==', 'To Receive'),
      orderBy('paidAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, snapshot => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(data);
    });

    return () => unsubscribe();
  }, []);

  /* ----------- REALTIME CLOCK ------------ */
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Global keyboard listener for scanner
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ignore if modal is open or user is manually typing
      if (isModalOpen || document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
        return;
      }

      // Regular characters (build up the scanned code)
      if (e.key.length === 1 && e.key !== 'Enter') {
        setScanBuffer(prev => prev + e.key);
        setIsScanning(true);
      }
      
      // Enter key (scanner finished)
      else if (e.key === 'Enter' && scanBuffer) {
        processScannedCode(scanBuffer.trim());
        setScanBuffer('');
        setIsScanning(false);
      }
    };

    // Clear buffer on escape or if no activity for 2 seconds
    const clearBuffer = () => {
      setScanBuffer('');
      setIsScanning(false);
    };

    const bufferTimeout = setTimeout(clearBuffer, 2000);
    
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      clearTimeout(bufferTimeout);
    };
  }, [scanBuffer, isModalOpen]);

  const processScannedCode = (scannedCode) => {
    console.log('Scanned order ID:', scannedCode);
    
    // Find the order by ID with status "to receive"
    const order = orders.find(o => o.id === scannedCode && o.status === 'To Receive');
    
    if (order) {
      setModalOrder(order);
      setIsModalOpen(true);
    } else {
      alert(`Order "${scannedCode}" not found or not ready for delivery.`);
    }
  };

  const handleConfirmDelivery = async (orderId) => {
    try {
      await updateDoc(doc(db, 'cartItems', orderId), { 
        status: 'Completed',
        deliveredAt: new Date() 
      });
      setIsModalOpen(false);
      setModalOrder(null);
      alert('Delivery confirmed! Order status updated to "Completed".');
    } catch (error) {
      console.error('Error confirming delivery:', error);
      alert('Failed to confirm delivery.');
    }
  };

  const handleManualDelivery = (orderId) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      setModalOrder(order);
      setIsModalOpen(true);
    }
  };

  /* --------------------------- CALENDAR FUNCTIONS --------------------------- */
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
    
    // Previous month days
    for (let i = 0; i < startingDay; i++) {
      const prevDate = new Date(year, month, -i);
      days.unshift({
        date: prevDate.getDate(),
        isCurrentMonth: false,
        isToday: false,
        fullDate: prevDate
      });
    }

    // Current month days
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

    // Next month days
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

  /* --------------------------- TABLE FUNCTIONS --------------------------- */
  // Filter and search logic
  const filteredOrders = orders.filter((order) => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchText.toLowerCase()) ||
      (order.userEmail && order.userEmail.toLowerCase().includes(searchText.toLowerCase()));
    
    return matchesSearch;
  });

  // Sorting logic
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (!sortConfig.key) return 0;

    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

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
    const csvContent = [
      ['Order ID', 'Customer Email', 'Items', 'Total Quantity', 'Total Amount', 'Payment Method', 'Paid At'],
      ...sortedOrders.map(order => {
        const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const paidAt = order.paidAt ? new Date(order.paidAt.seconds * 1000).toLocaleString() : '-';
        
        return [
          order.id,
          order.userEmail || 'N/A',
          order.items.map(item => item.itemCode).join(', '),
          totalQuantity,
          `₱${totalPrice.toFixed(2)}`,
          order.paymentMethod || 'N/A',
          paidAt
        ];
      })
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `delivery_orders_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleString();
    }
    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000).toLocaleString();
    }
    return timestamp.toString();
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <ASidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-6">Orders - Ready for Pickup</h1>

          {/* Date + Time with real-time clock */}
          <div className="flex gap-4 mb-6 relative">
            {/* Date - Clickable */}
            <div className="relative">
              <button
                onClick={() => setShowCalendar(!showCalendar)}
                className="text-sm flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition"
              >
                <img src={calendarGIcon} className="w-5" alt="Calendar" />
                {formatDate(currentTime)}
              </button>

              {/* Calendar Dropdown */}
              {showCalendar && (
                <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 w-72">
                  <div className="p-4">
                    {/* Calendar Header */}
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

                    {/* Calendar Grid */}
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

                    {/* Today Button */}
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

            {/* Time - Real-time updating */}
            <div className="text-sm flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-sm border border-gray-200">
              <img src={clockGIcon} className="w-5" alt="Clock" />
              <span className="font-mono">{formatTime(currentTime)}</span>
            </div>
          </div>

          {/* Scanner Status */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-blue-800">QR Delivery Scanner Ready</h2>
                <p className="text-blue-600 text-sm">
                  {isScanning ? `Scanning: ${scanBuffer}` : 'Scan customer QR code for delivery confirmation'}
                </p>
              </div>
              <div className={`w-3 h-3 rounded-full ${isScanning ? 'bg-green-500 animate-pulse' : 'bg-blue-500'}`}></div>
            </div>
          </div>

          {/* Actions Bar - Archives Design */}
          <div className="bg-white rounded-lg shadow mb-4 p-4">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              {/* Left: Export & Selection */}
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
          </div>

          {/* Table - Archives Design */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                {/* Table Header */}
                <thead className="bg-cyan-500 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedOrders.length === sortedOrders.length && sortedOrders.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded cursor-pointer"
                      />
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-blue-500 transition"
                      onClick={() => handleSort('id')}
                    >
                      <div className="flex items-center gap-1">
                        Order ID
                        {sortConfig.key === 'id' && (
                          <span>{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-blue-500 transition"
                      onClick={() => handleSort('userEmail')}
                    >
                      <div className="flex items-center gap-1">
                        Customer Email
                        {sortConfig.key === 'userEmail' && (
                          <span>{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-blue-500 transition"
                    >
                      Items
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Total Quantity</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Total Amount</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Payment Method</th>
                    <th 
                      className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-blue-500 transition"
                      onClick={() => handleSort('paidAt')}
                    >
                      <div className="flex items-center gap-1">
                        Paid At
                        {sortConfig.key === 'paidAt' && (
                          <span>{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Action</th>
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody className="divide-y divide-gray-200">
                  {sortedOrders.length > 0 ? (
                    sortedOrders.map((order) => {
                      const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
                      const totalPrice = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                      
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
                          <td className="px-4 py-3 text-sm font-semibold text-gray-800 font-mono">{order.id}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{order.userEmail || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-gray-700 max-w-xs">
                            <div className="flex flex-wrap gap-1">
                              {order.items.map((item, idx) => (
                                <span key={idx} className="px-2 py-1 bg-gray-100 rounded text-xs">
                                  {item.itemCode}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-center font-semibold">{totalQuantity}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-green-600">₱{totalPrice.toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm text-gray-700 capitalize">{order.paymentMethod || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{formatTimestamp(order.paidAt)}</td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleManualDelivery(order.id)}
                              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition text-sm"
                            >
                              Confirm
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="9" className="px-4 py-8 text-center text-gray-500">
                        No orders ready for delivery
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

        <ConfirmDeliveryModal
          isOpen={isModalOpen}
          orderData={modalOrder}
          onClose={() => setIsModalOpen(false)}
          onConfirm={handleConfirmDelivery}
        />
      </div>
    </div>
  );
};

export default AOrders;