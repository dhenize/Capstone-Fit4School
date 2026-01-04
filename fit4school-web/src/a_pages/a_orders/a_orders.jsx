import React, { useEffect, useState, useCallback } from 'react';
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase';
import ASidebar from '../../components/a_sidebar/a_sidebar.jsx';
import searchIcon from '../../assets/icons/search.png';
import exportIcon from '../../assets/icons/export-icon.png';
import calendarWIcon from "../../assets/icons/calendar-w.png";


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
const ViewInfoModal = ({ isOpen, orderData, onClose, onManualConfirm }) => {
  if (!isOpen || !orderData) return null;

  const totalQuantity = orderData.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = orderData.orderTotal || orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    if (timestamp.toDate) {
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
    return 'N/A';
  };

  const handleManualConfirm = async () => {
    if (window.confirm('Are you sure you want to manually confirm this order as received?')) {
      await onManualConfirm(orderData.id);
    }
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
                <p className="text-lg text-gray-800">{orderData.userName || 'Loading...'}</p>
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
                <h4 className="text-sm font-semibold text-gray-500 mb-1">PAID AT</h4>
                <p className="text-lg text-gray-800">{formatTimestamp(orderData.paidAt)}</p>
              </div>

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
          <button
            onClick={handleManualConfirm}
            className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition font-semibold"
          >
            Manually Confirm Received
          </button>
        </div>
      </div>
    </div>
  );
};

// QR Scanner Modal (Updated to match View Info Modal design)
const QrScannerModal = ({ isOpen, orderData, onClose, onConfirm }) => {
  if (!isOpen || !orderData) return null;

  const totalQuantity = orderData.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = orderData.orderTotal || orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    if (timestamp.toDate) {
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
    return 'N/A';
  };

  const handleConfirm = async () => {
    if (window.confirm('Are you sure you want to confirm this order as received?')) {
      await onConfirm(orderData.id);
    }
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
            QR Scanner - Confirm Delivery
          </h2>
        </div>

        <div className="p-6">
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-blue-800">QR Code Scanned Successfully!</h3>
                <p className="text-blue-600 text-sm">Order found and ready for delivery confirmation.</p>
              </div>
              <div className="w-10 h-10 flex items-center justify-center bg-green-100 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-500 mb-1">ORDER ID</h4>
                <p className="text-lg font-bold text-blue-600">{orderData.orderId || orderData.id}</p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-500 mb-1">CUSTOMER NAME</h4>
                <p className="text-lg text-gray-800">{orderData.userName || 'Loading...'}</p>
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
                <h4 className="text-sm font-semibold text-gray-500 mb-1">PAID AT</h4>
                <p className="text-lg text-gray-800">{formatTimestamp(orderData.paidAt)}</p>
              </div>

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
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition font-semibold"
          >
            Confirm Delivery
          </button>
        </div>
      </div>
    </div>
  );
};

const ScheduleDeliveryModal = ({ isOpen, order, onClose, onSchedule, scheduleDate, setScheduleDate, scheduleTime, setScheduleTime, isSendingSchedule }) => {
  if (!isOpen || !order) return null;

  const [notes, setNotes] = useState('Please bring a valid ID for verification. Your uniforms are now ready for pick up.');

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold mb-4 text-center">Schedule Pick up/Delivery</h2>

        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <p className="font-semibold">Order ID: <span className="text-blue-600">{order.id}</span></p>
          <p className="text-sm text-gray-600">Customer: {order.userName || order.userEmail}</p>
          <p className="text-sm text-gray-600">Email: {order.userEmail}</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pick up Date *
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
              Pick up Time *
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
              placeholder="E.g., Bring valid ID for pick up. Uniforms are ready for collection."
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
  const [viewInfoModalOpen, setViewInfoModalOpen] = useState(false);
  const [scanBuffer, setScanBuffer] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchText, setSearchText] = useState('');
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });


  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedOrderForSchedule, setSelectedOrderForSchedule] = useState(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [isSendingSchedule, setIsSendingSchedule] = useState(false);
  const [filterMonth, setFilterMonth] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [userDataCache, setUserDataCache] = useState({});

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3; // Set limit to 3 items per page


  useEffect(() => {
    document.title = "Admin | Orders - Fit4School";

    const fetchOrdersWithCustomerData = async () => {
      setIsLoading(true);
      try {
        const q = query(
          collection(db, 'cartItems'),
          where('status', '==', 'To Receive')
        );

        console.log('Starting to fetch orders...');

        const unsubscribe = onSnapshot(q, async (snapshot) => {
          console.log(`Received ${snapshot.docs.length} orders from Firestore`);

          const ordersData = await Promise.all(snapshot.docs.map(async (docSnap) => {
            const data = docSnap.data();
            const docId = docSnap.id;


            console.log(`Order ${docId} data fields:`, Object.keys(data));


            const orderId = data.orderId || docId;


            let customerName = 'Customer';
            let customerEmail = 'N/A';


            if (data.userEmail) {
              customerEmail = data.userEmail;
            } else if (data.email) {
              customerEmail = data.email;
            } else if (data.customerEmail) {
              customerEmail = data.customerEmail;
            }


            if (data.customerName) {
              customerName = data.customerName;
            } else if (data.userName) {
              customerName = data.userName;
            } else if (data.name) {
              customerName = data.name;
            }

            console.log(`Order ${docId}: email=${customerEmail}, name=${customerName}`);


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
                  const q = query(accountsRef, where('firebase_uid', '==', data.requestedBy));
                  const querySnapshot = await getDocs(q);

                  console.log(`Accounts query returned ${querySnapshot.size} results`);

                  if (!querySnapshot.empty) {
                    const userData = querySnapshot.docs[0].data();
                    console.log(`User data from accounts:`, userData);


                    let fullName = '';
                    if (userData.parent_fullname) {
                      fullName = userData.parent_fullname;
                    } else if (userData.fname && userData.lname) {
                      fullName = `${userData.fname} ${userData.lname}`.trim();
                    } else if (userData.fullName) {
                      fullName = userData.fullName;
                    } else if (userData.name) {
                      fullName = userData.name;
                    }

                    if (fullName) {
                      customerName = fullName;
                    }


                    if (userData.email) {
                      customerEmail = userData.email;
                    }


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


                    if (data.requestedBy.includes('@')) {
                      customerEmail = data.requestedBy;
                      customerName = data.requestedBy.split('@')[0];
                    }
                  }
                }
              } catch (error) {
                console.error('Error fetching customer data:', error);

              }
            } else {
              console.log(`Order ${docId} has NO requestedBy field`);
            }

            const orderData = {
              id: orderId,
              docId: docId,
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


  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);


  useEffect(() => {
    const handleKeyPress = (e) => {
      if (isModalOpen || showScheduleModal || viewInfoModalOpen ||
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
  }, [scanBuffer, isModalOpen, showScheduleModal, viewInfoModalOpen]);


  const debouncedSearch = useCallback(
    debounce((value) => {
      setSearchText(value);
    }, 300),
    []
  );

  const handleSearchChange = (e) => {
    debouncedSearch(e.target.value);
  };


  const processScannedCode = (scannedCode) => {
    console.log('Scanned code:', scannedCode);
    console.log('Available orders:', orders.map(o => ({ id: o.id, docId: o.docId, email: o.userEmail, name: o.userName })));


    let order = orders.find(o => o.id === scannedCode);


    if (!order) {
      order = orders.find(o => o.docId === scannedCode);
    }


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
      const order = orders.find(o => o.id === orderId || o.docId === orderId);
      if (!order) {
        alert('Order not found!');
        return;
      }

      const docId = order.docId || orderId;
      const deliveredAt = new Date(); // Current timestamp

      await updateDoc(doc(db, 'cartItems', docId), {
        status: 'Completed',
        deliveredAt: deliveredAt,
        deliveredBy: 'Admin',
        pickupConfirmedAt: deliveredAt,
        receivedAt: deliveredAt, // ADD THIS LINE
        manuallyConfirmed: false
      });

      setIsModalOpen(false);
      setModalOrder(null);
      alert('✅ Delivery confirmed! Order status updated to "Completed".');
    } catch (error) {
      console.error('Error confirming delivery:', error);
      alert('Failed to confirm delivery.');
    }
  };

  // Manual confirmation from View Info modal
  const handleManualConfirmDelivery = async (orderId) => {
    try {
      const order = orders.find(o => o.id === orderId || o.docId === orderId);
      if (!order) {
        alert('Order not found!');
        return;
      }

      const docId = order.docId || orderId;
      const deliveredAt = new Date(); // Current timestamp

      await updateDoc(doc(db, 'cartItems', docId), {
        status: 'Completed',
        deliveredAt: deliveredAt,
        deliveredBy: 'Admin',
        pickupConfirmedAt: deliveredAt,
        receivedAt: deliveredAt, // ADD THIS LINE
        manuallyConfirmed: true
      });

      setViewInfoModalOpen(false);
      setModalOrder(null);
      alert('✅ Order manually confirmed as received! Status updated to "Completed".');
    } catch (error) {
      console.error('Error manually confirming delivery:', error);
      alert('Failed to confirm delivery.');
    }
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

  const handleViewInfo = (order) => {
    setModalOrder(order);
    setViewInfoModalOpen(true);
  };

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


      await updateDoc(doc(db, 'cartItems', order.docId || order.id), {
        scheduledDate: scheduledDateTime,
        scheduledAt: new Date(),
        scheduleNotes: notes,
        notificationSent: true,
        status: 'To Receive'
      });


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


  const sendScheduleEmail = (order, date, time, notes) => {

    const itemsList = order.items.map(item =>
      `• ${item.itemCode} - ${item.category} (${item.size}) x ${item.quantity}`
    ).join('\n');

    const totalPrice = order.orderTotal || order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);


    const subject = `Your Uniform Order #${order.id} is Ready for Pick up!`;
    const body = `
Dear ${order.userName || order.userEmail.split('@')[0]},

Your uniform order is now ready for pick up!
ORDER DETAILS:
• Order ID: ${order.id}
• Pick up Date: ${date}
• Pick up Time: ${time}
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


    const mailtoLink = `mailto:${order.userEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink, '_blank');


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
            'Please bring a valid ID for verification. Your uniforms are now ready for pick up.');

          count++;

          if (count === thisMonthOrders.length) {
            setIsSendingSchedule(false);
            alert(`✅ ${count} schedule emails prepared for sending!`);
          }
        }, index * 1000);
      });
    }
  };


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

  // Pagination calculations
  const totalPages = Math.ceil(sortedOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = sortedOrders.slice(startIndex, endIndex);

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc',
    });
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedOrders(paginatedOrders.map((order) => order.id));
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
    const ordersToExport = selectedOrders.length > 0
      ? orders.filter(order => selectedOrders.includes(order.id))
      : sortedOrders;

    if (ordersToExport.length === 0) {
      alert('No orders to export');
      return;
    }

    // Export with columns matching the table
    const csvContent = [
      ['ORDER ID', 'CUSTOMER NAME', 'TOTAL QUANTITY', 'TOTAL AMOUNT', 'STATUS', 'PAYMENT METHOD', 'PAID AT', 'CREATED AT', 'SCHEDULED DATE'],
      ...ordersToExport.map(order => {
        const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
        const totalAmount = order.orderTotal || order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const paidAt = order.paidAt ? formatTimestamp(order.paidAt) : 'N/A';
        const createdAt = order.createdAt ? formatTimestamp(order.createdAt) : 'N/A';
        const scheduledDate = order.scheduledDate ? formatTimestamp(order.scheduledDate) : 'N/A';

        return [
          order.orderId || order.id,
          order.userName || 'N/A',
          totalQuantity,
          `₱${totalAmount.toFixed(2)}`,
          order.status,
          order.paymentMethod || 'cash',
          paidAt,
          createdAt,
          scheduledDate
        ];
      })
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Pagination controls
  const goToPage = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const renderPaginationNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pageNumbers.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pageNumbers.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pageNumbers.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }

    return pageNumbers.map((pageNum, index) => (
      <button
        key={index}
        onClick={() => typeof pageNum === 'number' && goToPage(pageNum)}
        className={`px-3 py-1 rounded text-sm ${pageNum === currentPage
            ? 'bg-cyan-500 text-white'
            : typeof pageNum === 'number'
              ? 'border border-gray-300 hover:bg-gray-100'
              : 'cursor-default'
          }`}
        disabled={pageNum === '...'}
      >
        {pageNum}
      </button>
    ));
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <ASidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-6">Orders - Ready for Pick up</h1>

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
                  <img src={calendarWIcon} alt="Schedule" className="w-5 h-5" />
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

          {/* Table with fixed height and scroll bar */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <div className="max-h-[500px] overflow-y-auto"> {/* Added scroll bar container */}
                <table className="w-full min-w-full">
                  <thead className="bg-cyan-500 text-white sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedOrders.length === paginatedOrders.length && paginatedOrders.length > 0}
                          onChange={handleSelectAll}
                          className="w-4 h-4 rounded cursor-pointer"
                        />
                      </th>
                      <th
                        className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-blue-500 transition"
                        onClick={() => handleSort('id')}
                      >
                        <div className="flex items-center gap-1">
                          ORDER ID
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
                          CUSTOMER NAME
                          {sortConfig.key === 'userName' && (
                            <span>{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
                          )}
                        </div>
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

                  <tbody className="divide-y divide-gray-200">
                    {paginatedOrders.length > 0 ? (
                      paginatedOrders.map((order) => {
                        const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
                        const totalPrice = order.orderTotal || order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

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
                            <td className="px-4 py-3 text-sm font-semibold text-gray-800 font-mono">
                              {order.id}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {order.userName || (
                                <span className="text-gray-400 italic">No name</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center font-semibold text-gray-800">
                              {totalQuantity}
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-green-600">₱{totalPrice.toFixed(2)}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded whitespace-nowrap text-xs ${order.status === 'To Receive' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleViewInfo(order)}
                                  className="px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition text-sm"
                                >
                                  View Info
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedOrderForSchedule(order);
                                    setShowScheduleModal(true);
                                    const tomorrow = new Date();
                                    tomorrow.setDate(tomorrow.getDate() + 1);
                                    setScheduleDate(tomorrow.toISOString().split('T')[0]);
                                  }}
                                  className="px-7 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition text-sm flex items-center gap-1 pl-3"
                                >
                                  <img src={calendarWIcon} alt="Schedule" className="w-4 h-4" />
                                  Schedule
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
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
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
              <div className="text-sm text-gray-600">
                Showing {startIndex + 1} to {Math.min(endIndex, sortedOrders.length)} of {sortedOrders.length} orders
                {filterMonth !== 'all' && ` (Filtered by ${filterMonth})`}
                {sortedOrders.length > 0 && ` • Page ${currentPage} of ${totalPages}`}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 border border-gray-300 rounded text-sm ${currentPage === 1
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'hover:bg-gray-100'
                    }`}
                >
                  Previous
                </button>

                {renderPaginationNumbers()}

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 border border-gray-300 rounded text-sm ${currentPage === totalPages
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'hover:bg-gray-100'
                    }`}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </main>

        <ViewInfoModal
          isOpen={viewInfoModalOpen}
          orderData={modalOrder}
          onClose={() => setViewInfoModalOpen(false)}
          onManualConfirm={handleManualConfirmDelivery}
        />

        <QrScannerModal
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