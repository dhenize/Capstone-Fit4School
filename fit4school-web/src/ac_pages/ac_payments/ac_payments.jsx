import React, { useEffect, useState, useRef } from 'react';
import {
  collection,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  getDoc,
  getDocs
} from 'firebase/firestore';
import { db } from '../../../firebase';
import AcSidebar from '../../components/ac_sidebar/ac_sidebar.jsx';
import calendarGIcon from '../../assets/icons/calendar-g.png';
import clockGIcon from '../../assets/icons/clock-g.png';

/* ------------------------- PAYMENT CONFIRMATION MODAL ------------------------- */
const PaymentConfirmationModal = ({ isOpen, onClose, onConfirm, orderData }) => {
  if (!isOpen || !orderData) return null;

  const totalPrice = orderData.items
    .reduce((sum, item) => sum + (item.price * item.quantity), 0)
    .toFixed(2);

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
            Confirm Payment
          </h2>
        </div>

        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            Confirm this payment?
          </h3>

          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <p className="font-semibold">Order ID: <span className="text-blue-600">{orderData.id}</span></p>
            <p className="text-sm text-gray-600">Payment Method: <span className="capitalize">{orderData.paymentMethod}</span></p>
          </div>

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

                  return (
                    <tr key={idx}>
                      <td className="border px-4 py-3">{item.itemCode}</td>
                      <td className="border px-4 py-3">{item.category}</td>
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
                    ₱{totalPrice}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="flex justify-center gap-4 p-6 border-t">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-300 rounded hover:bg-gray-400 transition"
          >
            Cancel
          </button>
          <button
            onClick={async () => await onConfirm(orderData.id)}
            className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition font-semibold"
          >
            Confirm Payment
          </button>
        </div>
      </div>
    </div>
  );
};

/* ---------------------------- MAIN COMPONENT ---------------------------- */
const AcPayments = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [modalOrder, setModalOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scanBuffer, setScanBuffer] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [stats, setStats] = useState({
    pendingPayments: 0,
    paidOrders: 0,
    cashPayments: 0,
    bankPayments: 0
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [userNames, setUserNames] = useState({}); // Store user names for orders

  /* ----------- REALTIME CLOCK ------------ */
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  /* ----------- REALTIME ORDERS (status = "To Pay") ------------ */
  useEffect(() => {
    const q = query(
      collection(db, 'cartItems'),
      where('status', '==', 'To Pay'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(fetched);
      
      // Fetch user names for each order
      for (const order of fetched) {
        if (order.requestedBy && !userNames[order.requestedBy]) {
          await fetchUserName(order.requestedBy);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  /* ----------- REALTIME STATS ------------ */
  useEffect(() => {
    const paidQuery = query(
      collection(db, 'cartItems'),
      where('status', '==', 'To Receive')
    );

    const unsubscribePaid = onSnapshot(paidQuery, (snapshot) => {
      const pendingPayments = orders.length;
      const paidOrders = snapshot.size;
      const cashPayments = orders.filter(o => o.paymentMethod === 'cash').length;
      const bankPayments = orders.filter(o => o.paymentMethod === 'bank').length;

      setStats({
        pendingPayments,
        paidOrders,
        cashPayments,
        bankPayments
      });
    });

    return () => unsubscribePaid();
  }, [orders]);

  /* ----------- SIDEBAR & SCANNER SETUP ------------ */
  useEffect(() => {
    document.title = "Accountant | Payments - Fit4School";
    
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);

    const handleKeyPress = (e) => {
      if (isModalOpen || document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key.length === 1 && e.key !== 'Enter') {
        setScanBuffer(prev => prev + e.key);
        setIsScanning(true);
      }
      else if (e.key === 'Enter' && scanBuffer) {
        processScannedCode(scanBuffer.trim());
        setScanBuffer('');
        setIsScanning(false);
      }
    };

    const bufferTimeout = setTimeout(() => {
      setScanBuffer('');
      setIsScanning(false);
    }, 2000);
    
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      window.removeEventListener('resize', handleResize);
      clearTimeout(bufferTimeout);
    };
  }, [scanBuffer, isModalOpen]);

  /* ----------- FETCH USER NAME ------------ */
  const fetchUserName = async (userId) => {
    try {
      const userRef = doc(db, 'accounts', userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        setUserNames(prev => ({
          ...prev,
          [userId]: `${userData.fname} ${userData.lname}`
        }));
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  /* --------------------------- PROCESS SCANNED CODE --------------------------- */
  const processScannedCode = async (scannedCode) => {
    console.log('Scanned order ID:', scannedCode);
    
    try {
      const docRef = doc(db, 'cartItems', scannedCode);
      const snap = await getDoc(docRef);

      if (!snap.exists()) {
        alert("Order not found!");
        return;
      }

      const data = snap.data();

      if (data.status !== "To Pay") {
        alert("Order not ready for payment. Current status: " + data.status);
        return;
      }

      setModalOrder({ id: snap.id, ...data });
      setIsModalOpen(true);
    } catch (err) {
      console.error('Error fetching order:', err);
      alert("Error fetching order data");
    }
  };

  /* --------------------------- CONFIRM PAYMENT --------------------------- */
  const handleConfirmPayment = async (orderId) => {
    try {
      await updateDoc(doc(db, 'cartItems', orderId), { 
        status: 'To Receive',
        paidAt: new Date() 
      });
      
      setIsModalOpen(false);
      setModalOrder(null);
      alert('Payment confirmed! Order status updated to "To Receive".');
    } catch (error) {
      console.error('Error confirming payment:', error);
      alert('Failed to confirm payment.');
    }
  };

  /* --------------------------- MANUAL PAYMENT --------------------------- */
  const handleManualPayment = (orderId) => {
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

  /* --------------------------- RENDER --------------------------- */
  return (
    <div className="flex min-h-screen bg-gray-50">
      <AcSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          <h1 className="text-2xl md:text-3xl font-bold mb-6">Payment Management</h1>
          
          {/* Date + Time with real-time clock and clickable calendar */}
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

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-sm text-gray-600 font-medium mb-2">Pending Payments</h3>
              <p className="text-3xl font-bold text-cyan-500">{stats.pendingPayments}</p>
              <p className="text-xs text-gray-500">Orders to pay</p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-sm text-gray-600 font-medium mb-2">Paid Orders</h3>
              <p className="text-3xl font-bold text-cyan-500">{stats.paidOrders}</p>
              <p className="text-xs text-gray-500">Ready for pickup</p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-sm text-gray-600 font-medium mb-2">Cash Payments</h3>
              <p className="text-3xl font-bold text-cyan-500">{stats.cashPayments}</p>
              <p className="text-xs text-gray-500">Pending cash orders</p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-sm text-gray-600 font-medium mb-2">Bank Payments</h3>
              <p className="text-3xl font-bold text-cyan-500">{stats.bankPayments}</p>
              <p className="text-xs text-gray-500">Pending bank orders</p>
            </div>
          </div>

          {/* Scanner Status */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-blue-800">QR Payment Scanner</h2>
                <p className="text-blue-600 text-sm">
                  {isScanning ? `Scanning: ${scanBuffer}` : 'Scan customer QR code here for payment confirmation'}
                </p>
              </div>
              <div className={`w-3 h-3 rounded-full ${isScanning ? 'bg-green-500 animate-pulse' : 'bg-blue-500'}`}></div>
            </div>
          </div>

          {/* Orders Table - Scrollable with new design */}
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
            <h4 className="text-base font-bold text-gray-800 mb-4">Pending Payments ({orders.length})</h4>
            
            {orders.length > 0 ? (
              <div className="overflow-x-auto max-h-[500px]"> {/* Added max-height for scrollability */}
                <table className="w-full text-sm">
                  <thead className="bg-cyan-500 text-white sticky top-0"> {/* Added sticky header and cyan background */}
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold">Order ID</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold">Customer</th> {/* Added Customer column */}
                      <th className="px-4 py-3 text-left text-xs font-semibold">Items</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold">Total Quantity</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold">Total Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold">Payment Method</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {orders.map(order => {
                      const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
                      const totalPrice = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                      const customerName = userNames[order.requestedBy] || 'Loading...';
                      
                      return (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-700 font-mono text-xs">{order.id}</td>
                          <td className="px-4 py-3 text-gray-700">{customerName}</td>
                          <td className="px-4 py-3 text-gray-700">
                            {order.items.map(item => item.itemCode).join(', ')}
                          </td>
                          <td className="px-4 py-3 text-gray-700 text-center">{totalQuantity}</td>
                          <td className="px-4 py-3 text-gray-700 font-semibold">₱{totalPrice.toFixed(2)}</td>
                          <td className="px-4 py-3 text-gray-700 capitalize">{order.paymentMethod}</td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleManualPayment(order.id)}
                              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition text-xs"
                            >
                              Manual Confirm
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No pending payments
              </div>
            )}
          </div>

          <PaymentConfirmationModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onConfirm={handleConfirmPayment}
            orderData={modalOrder}
          />
        </main>
      </div>
    </div>
  );
};

export default AcPayments;