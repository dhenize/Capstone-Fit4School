import React, { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs
} from 'firebase/firestore';
import { db } from '../../../firebase.js';
import AcSidebar from '../../components/ac_sidebar/ac_sidebar.jsx';
import calendarGIcon from '../../assets/icons/calendar-g.png';
import clockGIcon from '../../assets/icons/clock-g.png';

const AcPayments = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [cancelledOrders, setCancelledOrders] = useState([]);
  const [userNames, setUserNames] = useState({});
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Real-time clock update
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch cancelled orders
  useEffect(() => {
    const cancelledQuery = query(
      collection(db, 'cartItems'),
      where('status', '==', 'Cancelled'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeCancelled = onSnapshot(cancelledQuery, async (snapshot) => {
      const fetched = await Promise.all(snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();
        const customerName = await fetchUserName(data.requestedBy);
        return { id: docSnap.id, ...data, customerName };
      }));
      setCancelledOrders(fetched);
    });

    return () => {
      unsubscribeCancelled();
    };
  }, []);

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

  // Format date and time
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

  // Calendar functions
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

  // Status color
  const getStatusColor = () => {
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AcSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-6">Cancelled Orders</h1>
          
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

          {/* Cancelled Orders Table */}
          <div className="bg-white rounded-lg shadow">
            <div className="overflow-x-auto max-h-[600px]">
              <table className="w-full text-sm">
                <thead className="bg-cyan-500 text-white sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold">ORDER ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">CUSTOMER NAME</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">ITEMS</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">TOTAL QUANTITY</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">TOTAL AMOUNT</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">PAYMENT METHOD</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">CANCELLATION REASON</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">CANCELLED AT</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {cancelledOrders.length > 0 ? (
                    cancelledOrders.map((order) => {
                      const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
                      const totalPrice = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                      const cancelledAt = order.cancelledAt ? formatDateTime(order.cancelledAt) : 
                                         order.updatedAt ? formatDateTime(order.updatedAt) : 'N/A';
                      
                      return (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-mono text-xs font-bold">
                            {order.orderId || order.id}
                          </td>
                          <td className="px-4 py-3">{order.customerName}</td>
                          <td className="px-4 py-3">
                            {order.items.slice(0, 2).map(item => item.itemCode).join(', ')}
                            {order.items.length > 2 && ` +${order.items.length - 2} more`}
                          </td>
                          <td className="px-4 py-3 text-center font-semibold">{totalQuantity}</td>
                          <td className="px-4 py-3 font-bold">₱{totalPrice.toFixed(2)}</td>
                          <td className="px-4 py-3 capitalize">
                            <span className={`px-2 py-1 rounded text-xs ${
                              order.paymentMethod === 'cash' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {order.paymentMethod}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs">
                            {order.cancellationReason || 'No reason provided'}
                          </td>
                          <td className="px-4 py-3 text-xs">{cancelledAt}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs ${getStatusColor()}`}>
                              Cancelled
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="9" className="text-center py-6 text-gray-500">
                        No cancelled orders
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

export default AcPayments;