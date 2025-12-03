import React, { useEffect, useState, useCallback } from 'react';
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase';
import ASidebar from '../../components/a_sidebar/a_sidebar.jsx';
import clockGIcon from "../../assets/icons/clock-g.png";
import searchIcon from '../../assets/icons/search.png';
import exportIcon from '../../assets/icons/export-icon.png';
import calendarGIcon from "../../assets/icons/calendar-g.png";

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

const ConfirmDeliveryModal = ({ isOpen, orderData, onClose, onConfirm }) => {
  if (!isOpen || !orderData) return null;

  const totalPrice = orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl p-6">
        <h2 className="text-xl font-bold mb-4 text-center">Confirm Order Delivery</h2>

        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <p className="font-semibold">Order ID: <span className="text-blue-600">{orderData.id}</span></p>
          <p className="text-sm text-gray-600">Customer: {orderData.userName || orderData.userEmail}</p>
          <p className="text-sm text-gray-600">Scheduled: {orderData.scheduledDate ? 
            new Date(orderData.scheduledDate.seconds * 1000).toLocaleString() : 'Not scheduled'}
          </p>
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

const ScheduleDeliveryModal = ({ isOpen, order, onClose, onSchedule, scheduleDate, setScheduleDate, scheduleTime, setScheduleTime, isSendingSchedule }) => {
  if (!isOpen || !order) return null;

  const [notes, setNotes] = useState('Please bring a valid ID for verification. Your uniforms are now ready for pickup.');

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold mb-4 text-center">Schedule Pickup/Delivery</h2>
        
        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <p className="font-semibold">Order ID: <span className="text-blue-600">{order.id}</span></p>
          <p className="text-sm text-gray-600">Customer: {order.userName || order.userEmail}</p>
          <p className="text-sm text-gray-600">Email: {order.userEmail}</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pickup Date *
            </label>
            <input
              type="date"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pickup Time *
            </label>
            <select
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="09:00">9:00 AM</option>
              <option value="10:00">10:00 AM</option>
              <option value="11:00">11:00 AM</option>
              <option value="13:00">1:00 PM</option>
              <option value="14:00">2:00 PM</option>
              <option value="15:00">3:00 PM</option>
              <option value="16:00">4:00 PM</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="E.g., Bring valid ID for pickup. Uniforms are ready for collection."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
            />
          </div>
        </div>

        <div className="flex justify-center gap-4 mt-6">
          <button
            onClick={onClose}
            disabled={isSendingSchedule}
            className="px-6 py-2 bg-gray-300 rounded hover:bg-gray-400 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onSchedule(order, scheduleDate, scheduleTime, notes)}
            disabled={!scheduleDate || isSendingSchedule}
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition disabled:opacity-50"
          >
            {isSendingSchedule ? 'Sending...' : 'Send Schedule Email'}
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
  
  // Schedule states
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedOrderForSchedule, setSelectedOrderForSchedule] = useState(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [isSendingSchedule, setIsSendingSchedule] = useState(false);
  const [filterMonth, setFilterMonth] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [userDataCache, setUserDataCache] = useState({});

  // Fetch orders with customer data - DEBUG VERSION
  useEffect(() => {
    document.title = "Admin | Orders - Fit4School";
    
    const fetchOrdersWithCustomerData = async () => {
      setIsLoading(true);
      try {
        const q = query(
          collection(db, 'cartItems'),
          where('status', '==', 'To Receive'),
          orderBy('paidAt', 'desc')
        );

        console.log('Starting to fetch orders...');
        
        const unsubscribe = onSnapshot(q, async (snapshot) => {
          console.log(`Received ${snapshot.docs.length} orders from Firestore`);
          
          const ordersData = await Promise.all(snapshot.docs.map(async (docSnap) => {
            const data = docSnap.data();
            const docId = docSnap.id;
            
            // DEBUG: Log what fields are in the order data
            console.log(`Order ${docId} data fields:`, Object.keys(data));
            console.log(`Order ${docId} full data:`, data);
            
            // Use orderId if exists, otherwise use docId
            const orderId = data.orderId || docId;
            
            // Get customer info - check ALL possible field names
            let customerName = 'Customer';
            let customerEmail = 'N/A';
            
            // Check ALL possible email field names
            if (data.userEmail) {
              customerEmail = data.userEmail;
            } else if (data.email) {
              customerEmail = data.email;
            } else if (data.customerEmail) {
              customerEmail = data.customerEmail;
            }
            
            // Check ALL possible name field names
            if (data.customerName) {
              customerName = data.customerName;
            } else if (data.userName) {
              customerName = data.userName;
            } else if (data.name) {
              customerName = data.name;
            }
            
            console.log(`Order ${docId}: email=${customerEmail}, name=${customerName}`);
            
            // If we have requestedBy, try to get more info from accounts
            if (data.requestedBy) {
              console.log(`Order ${docId} has requestedBy: ${data.requestedBy}`);
              try {
                // Check cache first
                if (userDataCache[data.requestedBy]) {
                  console.log(`Using cached data for user ${data.requestedBy}`);
                  customerName = userDataCache[data.requestedBy].name;
                  customerEmail = userDataCache[data.requestedBy].email || customerEmail;
                } else {
                  console.log(`Fetching from accounts for user ${data.requestedBy}`);
                  const accountsRef = collection(db, 'accounts');
                  const q = query(accountsRef, where('userId', '==', data.requestedBy));
                  const querySnapshot = await getDocs(q);
                  
                  console.log(`Accounts query returned ${querySnapshot.size} results`);
                  
                  if (!querySnapshot.empty) {
                    const userData = querySnapshot.docs[0].data();
                    console.log(`User data from accounts:`, userData);
                    
                    // Check all possible name fields in accounts
                    let fullName = '';
                    if (userData.fname && userData.lname) {
                      fullName = `${userData.fname} ${userData.lname}`.trim();
                    } else if (userData.fullName) {
                      fullName = userData.fullName;
                    } else if (userData.name) {
                      fullName = userData.name;
                    }
                    
                    if (fullName) {
                      customerName = fullName;
                    }
                    
                    // Check all possible email fields in accounts
                    if (userData.email) {
                      customerEmail = userData.email;
                    }
                    
                    // Cache the result
                    setUserDataCache(prev => ({
                      ...prev,
                      [data.requestedBy]: {
                        name: customerName,
                        email: customerEmail
                      }
                    }));
                    
                    console.log(`Cached user data for ${data.requestedBy}: name=${customerName}, email=${customerEmail}`);
                  } else {
                    console.log(`No user found in accounts for userId: ${data.requestedBy}`);
                    
                    // Check if requestedBy IS the email (common pattern)
                    if (data.requestedBy.includes('@')) {
                      customerEmail = data.requestedBy;
                      customerName = data.requestedBy.split('@')[0];
                    }
                  }
                }
              } catch (error) {
                console.error('Error fetching customer data:', error);
                // Keep the default values if error occurs
              }
            } else {
              console.log(`Order ${docId} has NO requestedBy field`);
            }
            
            const orderData = { 
              id: orderId, // Use orderId for display
              docId: docId, // Store original document ID for updates
              ...data, 
              userName: customerName,
              userEmail: customerEmail
            };
            
            console.log(`Final order ${orderId}:`, {
              id: orderData.id,
              userName: orderData.userName,
              userEmail: orderData.userEmail,
              status: orderData.status
            });
            
            return orderData;
          }));
          
          console.log('Final orders data:', ordersData);
          setOrders(ordersData);
          setIsLoading(false);
        }, (error) => {
          console.error('Error in onSnapshot:', error);
          setIsLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error fetching orders:', error);
        setIsLoading(false);
      }
    };

    fetchOrdersWithCustomerData();
  }, []);

  /* ----------- REALTIME CLOCK ------------ */
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Keyboard listener for QR scanner
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (isModalOpen || showScheduleModal || 
          document.activeElement.tagName === 'INPUT' || 
          document.activeElement.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key.length === 1 && e.key !== 'Enter') {
        setScanBuffer(prev => prev + e.key);
        setIsScanning(true);
      } else if (e.key === 'Enter' && scanBuffer) {
        processScannedCode(scanBuffer.trim());
        setScanBuffer('');
        setIsScanning(false);
      }
    };

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
  }, [scanBuffer, isModalOpen, showScheduleModal]);

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

  // QR Scanner function - checks both orderId and docId
  const processScannedCode = (scannedCode) => {
    console.log('Scanned code:', scannedCode);
    console.log('Available orders:', orders.map(o => ({ id: o.id, docId: o.docId, email: o.userEmail, name: o.userName })));
    
    // Try to find order by display ID
    let order = orders.find(o => o.id === scannedCode);
    
    // If not found, try by document ID
    if (!order) {
      order = orders.find(o => o.docId === scannedCode);
    }
    
    // Check if it's a partial match (QR codes might have prefixes)
    if (!order) {
      order = orders.find(o => 
        o.id.includes(scannedCode) || 
        o.docId.includes(scannedCode) ||
        scannedCode.includes(o.id) ||
        scannedCode.includes(o.docId)
      );
    }
    
    if (order) {
      if (order.status === 'To Receive') {
        setModalOrder(order);
        setIsModalOpen(true);
      } else {
        alert(`Order "${scannedCode}" is not in "To Receive" status. Current status: ${order.status}`);
      }
    } else {
      alert(`Order "${scannedCode}" not found in the system. Please check the QR code.`);
    }
  };

  const handleConfirmDelivery = async (orderId) => {
    try {
      // Find the order to get the document ID
      const order = orders.find(o => o.id === orderId || o.docId === orderId);
      if (!order) {
        alert('Order not found!');
        return;
      }
      
      // Use the document ID for Firestore update
      const docId = order.docId || orderId;
      
      await updateDoc(doc(db, 'cartItems', docId), { 
        status: 'Completed',
        deliveredAt: new Date(),
        deliveredBy: 'Admin',
        pickupConfirmedAt: new Date()
      });
      
      setIsModalOpen(false);
      setModalOrder(null);
      alert('✅ Delivery confirmed! Order status updated to "Completed".');
    } catch (error) {
      console.error('Error confirming delivery:', error);
      alert('Failed to confirm delivery.');
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

  /* --------------------------- SCHEDULING FUNCTIONS --------------------------- */
  
  const handleScheduleDelivery = async (order, date, time, notes) => {
    if (!date) {
      alert('Please select a date');
      return;
    }

    setIsSendingSchedule(true);
    
    try {
      const scheduledDateTime = new Date(`${date}T${time}`);
      const formattedDate = scheduledDateTime.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const formattedTime = scheduledDateTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });

      // Update Firestore
      await updateDoc(doc(db, 'cartItems', order.docId || order.id), {
        scheduledDate: scheduledDateTime,
        scheduledAt: new Date(),
        scheduleNotes: notes,
        notificationSent: true,
        status: 'To Receive' // Keep as To Receive
      });

      // Send email by opening default email client
      sendScheduleEmail(order, formattedDate, formattedTime, notes);
      
      setShowScheduleModal(false);
      setSelectedOrderForSchedule(null);
      setScheduleDate('');
      setScheduleTime('09:00');
      
    } catch (error) {
      console.error('Error scheduling delivery:', error);
      alert('Failed to schedule delivery. Please try again.');
    } finally {
      setIsSendingSchedule(false);
    }
  };

  // Function to send email via default email client
  const sendScheduleEmail = (order, date, time, notes) => {
    // Format items list
    const itemsList = order.items.map(item => 
      `• ${item.itemCode} - ${item.category} (${item.size}) x ${item.quantity}`
    ).join('\n');
    
    const totalPrice = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Create email content
    const subject = `Your Uniform Order #${order.id} is Ready for Pickup!`;
    const body = `
Dear ${order.userName || order.userEmail.split('@')[0]},

Your uniform order is now ready for pickup!

ORDER DETAILS:
• Order ID: ${order.id}
• Pickup Date: ${date}
• Pickup Time: ${time}
• Location: School Uniform Office, Main Building, [Your School Name]

ITEMS IN YOUR ORDER:
${itemsList}

TOTAL: ₱${totalPrice.toFixed(2)}

IMPORTANT NOTES:
${notes}

Please bring: Valid ID and this email confirmation.

When you arrive at the school, please present the QR code from your order for scanning.

If you have any questions, please contact us at fit4school.official@gmail.com.

Best regards,
Fit4School Team
`;

    // Open default email client
    const mailtoLink = `mailto:${order.userEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink, '_blank');
    
    // Show confirmation
    setTimeout(() => {
      alert(`✅ Schedule email prepared for ${order.userEmail}!\n\nPlease check your email client to send the message.`);
    }, 500);
  };

  const handleSendMonthlySchedule = () => {
    const currentMonth = new Date().getMonth();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    
    const thisMonthOrders = orders.filter(order => {
      if (!order.paidAt) return false;
      const paidDate = order.paidAt.toDate ? order.paidAt.toDate() : new Date(order.paidAt);
      return paidDate.getMonth() === currentMonth;
    });
    
    if (thisMonthOrders.length === 0) {
      alert(`No orders found for ${monthNames[currentMonth]}.`);
      return;
    }
    
    const confirmSend = window.confirm(
      `Found ${thisMonthOrders.length} orders from ${monthNames[currentMonth]}.\n\n` +
      `Send bulk schedule email to all customers?\n\n` +
      `This will open your email client ${thisMonthOrders.length} times to send individual emails.`
    );
    
    if (confirmSend) {
      setIsSendingSchedule(true);
      
      // Send emails one by one
      let count = 0;
      thisMonthOrders.forEach((order, index) => {
        setTimeout(() => {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          const formattedDate = tomorrow.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
          
          sendScheduleEmail(order, formattedDate, '09:00 AM', 
            'Please bring a valid ID for verification. Your uniforms are now ready for pickup.');
          
          count++;
          
          if (count === thisMonthOrders.length) {
            setIsSendingSchedule(false);
            alert(`✅ ${count} schedule emails prepared for sending!`);
          }
        }, index * 1000); // Stagger the emails by 1 second
      });
    }
  };

  /* --------------------------- TABLE FUNCTIONS --------------------------- */
  const filteredOrders = orders.filter((order) => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchText.toLowerCase()) ||
      (order.userEmail && order.userEmail.toLowerCase().includes(searchText.toLowerCase())) ||
      (order.userName && order.userName.toLowerCase().includes(searchText.toLowerCase())) ||
      (order.docId && order.docId.toLowerCase().includes(searchText.toLowerCase())) ||
      (order.items && order.items.some(item => 
        item.itemCode && item.itemCode.toLowerCase().includes(searchText.toLowerCase())
      ));
    
    let matchesMonth = true;
    if (filterMonth !== 'all' && order.paidAt) {
      const paidDate = order.paidAt.toDate ? order.paidAt.toDate() : new Date(order.paidAt);
      const monthName = paidDate.toLocaleString('en-US', { month: 'long' }).toLowerCase();
      matchesMonth = monthName === filterMonth.toLowerCase();
    }
    
    return matchesSearch && matchesMonth;
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (!sortConfig.key) return 0;

    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];

    // Handle date sorting
    if (sortConfig.key === 'paidAt' || sortConfig.key === 'createdAt' || sortConfig.key === 'scheduledDate') {
      aValue = aValue?.toDate ? aValue.toDate() : new Date(aValue);
      bValue = bValue?.toDate ? bValue.toDate() : new Date(bValue);
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
      setSelectedOrders(sortedOrders.map((order) => order.id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleSelectOrder = (id) => {
    if (selectedOrders.includes(id)) {
      setSelectedOrders(selectedOrders.filter((orderId) => orderId !== id));
    } else {
      setSelectedOrders([...selectedOrders, id]);
    }
  };

  const handleExport = () => {
    const csvContent = [
      ['Order ID', 'Customer Name', 'Customer Email', 'Items', 'Total Quantity', 'Total Amount', 'Payment Method', 'Paid At', 'Scheduled Date', 'Status'],
      ...sortedOrders.map(order => {
        const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const paidAt = order.paidAt ? new Date(order.paidAt.seconds * 1000).toLocaleString() : '-';
        const scheduledDate = order.scheduledDate ? new Date(order.scheduledDate.seconds * 1000).toLocaleString() : '-';
        
        return [
          order.id,
          order.userName || 'N/A',
          order.userEmail || 'N/A',
          order.items.map(item => item.itemCode).join(', '),
          totalQuantity,
          `₱${totalPrice.toFixed(2)}`,
          order.paymentMethod || 'N/A',
          paidAt,
          scheduledDate,
          order.status || 'To Receive'
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

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleString();
    }
    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000).toLocaleString();
    }
    if (timestamp instanceof Date) {
      return timestamp.toLocaleString();
    }
    return timestamp.toString();
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <ASidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-6">Orders - Ready for Pickup</h1>

          {/* Loading Indicator */}
          {isLoading && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-600">Loading orders with customer data...</p>
            </div>
          )}

          {/* Scanner Instructions */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-blue-800">QR Delivery Scanner Ready</h2>
                <p className="text-blue-600 text-sm">
                  {isScanning ? `Scanning: ${scanBuffer}` : 'Scan customer QR code for delivery confirmation'}
                </p>
                <p className="text-blue-500 text-xs mt-1">
                  Note: Orders must be in "To Receive" status.
                </p>
              </div>
              <div className={`w-3 h-3 rounded-full ${isScanning ? 'bg-green-500 animate-pulse' : 'bg-blue-500'}`}></div>
            </div>
          </div>

          {/* Actions Bar */}
          <div className="bg-white rounded-lg shadow mb-4 p-4">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
                >
                  <img src={exportIcon} alt="Export" className="w-5 h-5" />
                  <span className="font-medium">Export</span>
                </button>

                <button 
                  onClick={handleSendMonthlySchedule}
                  disabled={isSendingSchedule}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm disabled:opacity-50"
                >
                  <img src={calendarGIcon} alt="Schedule" className="w-5 h-5" />
                  <span className="font-medium">
                    {isSendingSchedule ? 'Sending...' : 'Send Bulk Schedule'}
                  </span>
                </button>

                {selectedOrders.length > 0 && (
                  <span className="flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold">
                    {selectedOrders.length} selected
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <select 
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-full sm:w-40"
                >
                  <option value="all">All Months</option>
                  <option value="january">January</option>
                  <option value="february">February</option>
                  <option value="march">March</option>
                  <option value="april">April</option>
                  <option value="may">May</option>
                  <option value="june">June</option>
                  <option value="july">July</option>
                  <option value="august">August</option>
                  <option value="september">September</option>
                  <option value="october">October</option>
                  <option value="november">November</option>
                  <option value="december">December</option>
                </select>

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
                      onClick={() => handleSort('userName')}
                    >
                      <div className="flex items-center gap-1">
                        Customer Name
                        {sortConfig.key === 'userName' && (
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
                    <th className="px-4 py-3 text-left text-sm font-semibold">Items</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Total Quantity</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Total Amount</th>
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
                    <th 
                      className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-blue-500 transition"
                      onClick={() => handleSort('scheduledDate')}
                    >
                      <div className="flex items-center gap-1">
                        Scheduled
                        {sortConfig.key === 'scheduledDate' && (
                          <span>{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {sortedOrders.length > 0 ? (
                    sortedOrders.map((order) => {
                      const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
                      const totalPrice = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                      const isScheduled = order.scheduledDate;
                      
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
                          <td className="px-4 py-3 text-sm font-semibold text-gray-800 font-mono">
                            {order.id}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {order.userName || (
                              <span className="text-gray-400 italic">No name</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {order.userEmail || 'N/A'}
                            <div className="text-xs text-gray-500">
                              RequestedBy: {order.requestedBy || 'None'}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 max-w-xs">
                            <div className="flex flex-wrap gap-1">
                              {order.items.slice(0, 3).map((item, idx) => (
                                <span key={idx} className="px-2 py-1 bg-gray-100 rounded text-xs">
                                  {item.itemCode}
                                </span>
                              ))}
                              {order.items.length > 3 && (
                                <span className="px-2 py-1 bg-gray-200 rounded text-xs">
                                  +{order.items.length - 3}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-center font-semibold">{totalQuantity}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-green-600">₱{totalPrice.toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{formatTimestamp(order.paidAt)}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {isScheduled ? (
                              <span className="text-green-600 font-medium">
                                {formatTimestamp(order.scheduledDate)}
                              </span>
                            ) : (
                              <span className="text-yellow-600 italic">Not scheduled</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setSelectedOrderForSchedule(order);
                                  setShowScheduleModal(true);
                                  const tomorrow = new Date();
                                  tomorrow.setDate(tomorrow.getDate() + 1);
                                  setScheduleDate(tomorrow.toISOString().split('T')[0]);
                                }}
                                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition text-sm flex items-center gap-1"
                              >
                                <img src={calendarGIcon} alt="Schedule" className="w-4 h-4" />
                                {isScheduled ? 'Reschedule' : 'Schedule'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="10" className="px-4 py-8 text-center text-gray-500">
                        {isLoading ? 'Loading orders...' : 
                         filterMonth !== 'all' 
                          ? `No orders found for ${filterMonth.charAt(0).toUpperCase() + filterMonth.slice(1)}`
                          : 'No orders ready for delivery'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
              <div className="text-sm text-gray-600">
                Showing {sortedOrders.length} of {orders.length} orders
                {filterMonth !== 'all' && ` (Filtered by ${filterMonth})`}
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

        <ScheduleDeliveryModal
          isOpen={showScheduleModal}
          order={selectedOrderForSchedule}
          onClose={() => {
            setShowScheduleModal(false);
            setSelectedOrderForSchedule(null);
          }}
          onSchedule={handleScheduleDelivery}
          scheduleDate={scheduleDate}
          setScheduleDate={setScheduleDate}
          scheduleTime={scheduleTime}
          setScheduleTime={setScheduleTime}
          isSendingSchedule={isSendingSchedule}
        />
      </div>
    </div>
  );
};

export default AOrders;