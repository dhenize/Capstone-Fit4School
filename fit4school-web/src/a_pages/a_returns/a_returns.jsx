import React, { useEffect, useState } from 'react';
import {
  collection,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  getDoc
} from 'firebase/firestore';
import { db } from '../../../firebase';
import ASidebar from '../../components/a_sidebar/a_sidebar.jsx';
import calendarGIcon from '../../assets/icons/calendar-g.png';
import clockGIcon from '../../assets/icons/clock-g.png';


const ReturnConfirmationModal = ({ isOpen, onClose, onConfirm, returnData }) => {
  if (!isOpen || !returnData) return null;

  const totalPrice = returnData.items
    .reduce((sum, item) => sum + (item.price * item.quantity), 0)
    .toFixed(2);

  const formatDateTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
            Confirm Return
          </h2>
        </div>

        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            Confirm that items were physically returned?
          </h3>

          <div className="mb-4 p-4 bg-orange-50 rounded-lg">
            <p className="font-semibold">Order ID: <span className="text-orange-600">{returnData.id}</span></p>
            <p className="text-sm text-gray-600">Payment Method: <span className="capitalize">{returnData.paymentMethod}</span></p>
            <p className="text-sm text-gray-600">Return Reason: <span className="font-medium">{returnData.returnReason || 'N/A'}</span></p>
            <p className="text-sm text-gray-600">Requested At: <span>{formatDateTime(returnData.returnRequestedAt)}</span></p>
            <p className="text-sm text-gray-600">Return Schedule: <span>{formatDateTime(returnData.returnSchedule)}</span></p>
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
                {returnData.items.map((item, idx) => {
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
                  <td className="border px-4 py-3 text-orange-600 font-bold">
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
            onClick={async () => await onConfirm(returnData.id)}
            className="px-6 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition font-semibold"
          >
            Confirm Return
          </button>
        </div>
      </div>
    </div>
  );
};


const AReturns = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [returns, setReturns] = useState([]);
  const [modalReturn, setModalReturn] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scanBuffer, setScanBuffer] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [userNames, setUserNames] = useState({});

  /* ----------- REALTIME CLOCK ------------ */
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  
  useEffect(() => {
    const q = query(
      collection(db, 'cartItems'),
      where('status', '==', 'Pending Return')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      
      fetched.sort((a, b) => {
        const timeA = a.returnRequestedAt?.toMillis?.() || 0;
        const timeB = b.returnRequestedAt?.toMillis?.() || 0;
        return timeB - timeA; 
      });
      
      setReturns(fetched);
      
      
      for (const returnItem of fetched) {
        if (returnItem.requestedBy && !userNames[returnItem.requestedBy]) {
          await fetchUserName(returnItem.requestedBy);
        }
      }
    });

    return () => unsubscribe();
  }, []);


  
  useEffect(() => {
    document.title = "Admin | Returns - Fit4School";
    
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

 
  const processScannedCode = async (scannedCode) => {
    console.log('Scanned return order ID:', scannedCode);
    
    try {
      const docRef = doc(db, 'cartItems', scannedCode);
      const snap = await getDoc(docRef);

      if (!snap.exists()) {
        alert("Return order not found!");
        return;
      }

      const data = snap.data();

      if (data.status !== "Pending Return") {
        alert("Order not ready for return confirmation. Current status: " + data.status);
        return;
      }

      setModalReturn({ id: snap.id, ...data });
      setIsModalOpen(true);
    } catch (err) {
      console.error('Error fetching return order:', err);
      alert("Error fetching return order data");
    }
  };

  
  const handleConfirmReturn = async (orderId) => {
    try {
      await updateDoc(doc(db, 'cartItems', orderId), { 
        status: 'Returned',
        returnedAt: new Date() 
      });
      
      setIsModalOpen(false);
      setModalReturn(null);
      alert('Return confirmed! Items have been physically returned.');
    } catch (error) {
      console.error('Error confirming return:', error);
      alert('Failed to confirm return.');
    }
  };

 
  const handleManualConfirm = (orderId) => {
    const returnItem = returns.find(r => r.id === orderId);
    if (returnItem) {
      setModalReturn(returnItem);
      setIsModalOpen(true);
    }
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

  const formatDateTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  
  return (
    <div className="flex min-h-screen bg-gray-50">
      <ASidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          <h1 className="text-2xl md:text-3xl font-bold mb-6">Return Management</h1>
          
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
                            ${day.isToday ? 'bg-blue-500 text-white' : ''}
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
                        className="w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition text-sm"
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

          {/* Scanner Status */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-blue-800">QR Return Scanner</h2>
                <p className="text-blue-600 text-sm">
                  {isScanning ? `Scanning: ${scanBuffer}` : 'Scan return QR code here to confirm physical return'}
                </p>
              </div>
              <div className={`w-3 h-3 rounded-full ${isScanning ? 'bg-green-500 animate-pulse' : 'bg-blue-500'}`}></div>
            </div>
          </div>

          {/* Returns Table */}
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
            <h4 className="text-base font-bold text-gray-800 mb-4">Pending Returns ({returns.length})</h4>
            
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-sm">
                <thead className="bg-cyan-500 text-white sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold rounded-tl-lg">Order ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">Items</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">Total Quantity</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">Total Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">Payment Method</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">Return Reason</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">Requested At</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">Return Schedule</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">Returned At</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold rounded-tr-lg">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {returns.length > 0 ? (
                    returns.map(returnItem => {
                      const totalQuantity = returnItem.items.reduce((sum, item) => sum + item.quantity, 0);
                      const totalPrice = returnItem.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                      const customerName = userNames[returnItem.requestedBy] || 'Loading...';
                      
                      return (
                        <tr key={returnItem.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-700 font-mono text-xs">{returnItem.id}</td>
                          <td className="px-4 py-3 text-gray-700">{customerName}</td>
                          <td className="px-4 py-3 text-gray-700">
                            {returnItem.items.map(item => item.itemCode).join(', ')}
                          </td>
                          <td className="px-4 py-3 text-gray-700 text-center">{totalQuantity}</td>
                          <td className="px-4 py-3 text-gray-700 font-semibold">₱{totalPrice.toFixed(2)}</td>
                          <td className="px-4 py-3 text-gray-700 capitalize">{returnItem.paymentMethod}</td>
                          <td className="px-4 py-3 text-gray-700">{returnItem.returnReason || 'N/A'}</td>
                          <td className="px-4 py-3 text-gray-700 text-xs">{formatDateTime(returnItem.returnRequestedAt)}</td>
                          <td className="px-4 py-3 text-gray-700 text-xs">{formatDateTime(returnItem.returnSchedule)}</td>
                          <td className="px-4 py-3 text-gray-700 text-xs">{formatDateTime(returnItem.returnedAt)}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                              {returnItem.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleManualConfirm(returnItem.id)}
                              className="px-3 py-1 bg-orange-500 text-white rounded hover:bg-orange-600 transition text-xs"
                            >
                              Confirm
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="12" className="px-4 py-8 text-center text-gray-500">
                        No pending returns
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <ReturnConfirmationModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onConfirm={handleConfirmReturn}
            returnData={modalReturn}
          />
        </main>
      </div>
    </div>
  );
};

export default AReturns;