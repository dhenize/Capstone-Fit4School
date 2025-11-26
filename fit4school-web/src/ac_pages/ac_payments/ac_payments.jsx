import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../../firebase';
import AcSidebar from '../../components/ac_sidebar/ac_sidebar.jsx';
import AcTopbar from '../../components/ac_topbar/ac_topbar.jsx';

const ConfirmPaymentModal = ({ isOpen, orderData, onClose, onConfirm }) => {
  if (!isOpen || !orderData) return null;

  const totalPrice = orderData.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl p-6">
        <h2 className="text-xl font-bold mb-4 text-center">Confirm Payment Received</h2>

        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <p className="font-semibold">Order ID: <span className="text-blue-600">{orderData.id}</span></p>
          <p className="text-sm text-gray-600">Customer: {orderData.requestedBy}</p>
        </div>

        <div className="overflow-x-auto mb-4">
          <table className="w-full border-collapse border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-4 py-2 text-left">Item Code</th>
                <th className="border px-4 py-2 text-left">Quantity</th>
                <th className="border px-4 py-2 text-left">Price</th>
                <th className="border px-4 py-2 text-left">Total</th>
              </tr>
            </thead>
            <tbody>
              {orderData.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="border px-4 py-2">{item.itemCode}</td>
                  <td className="border px-4 py-2">{item.quantity}</td>
                  <td className="border px-4 py-2">₱{item.price.toFixed(2)}</td>
                  <td className="border px-4 py-2">₱{(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan="3" className="border px-4 py-2 text-right font-semibold">Grand Total:</td>
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
            Confirm Payment Received
          </button>
        </div>
      </div>
    </div>
  );
};

const AcPayments = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [modalOrder, setModalOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scanBuffer, setScanBuffer] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  // Realtime fetch all orders where status is "for payment"
  useEffect(() => {
    const q = query(
      collection(db, 'cartItems'),
      where('status', '==', 'for payment'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, snapshot => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(data);
    });

    return () => unsubscribe();
  }, []);

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
    return () => window.removeEventListener('resize', handleResize);
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
    
    // Find the order by ID with status "for payment"
    const order = orders.find(o => o.id === scannedCode && o.status === 'for payment');
    
    if (order) {
      setModalOrder(order);
      setIsModalOpen(true);
    } else {
      alert(`Order "${scannedCode}" not found or not ready for payment.`);
    }
  };

  const handleConfirmPayment = async (orderId) => {
    try {
      await updateDoc(doc(db, 'cartItems', orderId), { 
        status: 'to receive',
        paidAt: new Date() 
      });
      setIsModalOpen(false);
      setModalOrder(null);
      alert('Payment confirmed! Order status updated to "to receive".');
    } catch (error) {
      console.error('Error confirming payment:', error);
      alert('Failed to confirm payment.');
    }
  };

  const handleManualPayment = (orderId) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      setModalOrder(order);
      setIsModalOpen(true);
    }
  };

  // Calculate statistics
  const paymentStats = {
    pendingPayments: orders.length,
    paidOrders: 879, // You might want to fetch this from completed orders
    onlinePayments: 463,
    onsitePayments: 416,
    cashPayments: orders.filter(o => o.paymentMethod === 'cash').length,
    bankPayments: orders.filter(o => o.paymentMethod === 'bank').length,
    onlinePayments2: 56,
  };

  const totalPayments = paymentStats.onlinePayments + paymentStats.onsitePayments;
  const onlinePercentage = totalPayments > 0 ? Math.round((paymentStats.onlinePayments / totalPayments) * 100) : 0;
  const onsitePercentage = 100 - onlinePercentage;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AcSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <AcTopbar
          onMenuClick={() => setIsSidebarOpen((prev) => !prev)}
          title="Payments"
        />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          <h1 className="text-2xl md:text-3xl font-bold mb-6">Payment Management</h1>
          
          {/* Scanner Status */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-blue-800">QR Payment Scanner Ready</h2>
                <p className="text-blue-600 text-sm">
                  {isScanning ? `Scanning: ${scanBuffer}` : 'Scan customer QR code for payment confirmation'}
                </p>
              </div>
              <div className={`w-3 h-3 rounded-full ${isScanning ? 'bg-green-500 animate-pulse' : 'bg-blue-500'}`}></div>
            </div>
          </div>

          {/* Top Row - Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
            {/* Pending Payments */}
            <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
              <h3 className="text-sm text-gray-600 font-medium mb-2">Pending Payments</h3>
              <p className="text-4xl font-bold text-cyan-500">{paymentStats.pendingPayments}</p>
            </div>

            {/* Paid Orders */}
            <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
              <h3 className="text-sm text-gray-600 font-medium mb-2">Paid Orders</h3>
              <p className="text-4xl font-bold text-cyan-500">{paymentStats.paidOrders}</p>
            </div>

            {/* Payment Method Distribution */}
            <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
              <h3 className="text-sm text-gray-600 font-medium mb-2">Current Payment Methods</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs">Cash:</span>
                  <span className="text-xs font-semibold">{paymentStats.cashPayments}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs">Bank:</span>
                  <span className="text-xs font-semibold">{paymentStats.bankPayments}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
              <h3 className="text-sm text-gray-600 font-medium mb-2">Quick Actions</h3>
              <p className="text-xs text-gray-500">
                Scan QR codes to confirm payments automatically
              </p>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
            <h4 className="text-base font-bold text-gray-800 mb-4">Pending Payments ({orders.length})</h4>
            
            {orders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Order ID</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Items</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Total</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Payment Method</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {orders.map(order => {
                      const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
                      const totalPrice = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
                      
                      return (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-700 font-mono text-xs">{order.id}</td>
                          <td className="px-4 py-3 text-gray-700">
                            {order.items.map(item => item.itemCode).join(', ')} ({totalQuantity} items)
                          </td>
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

          <ConfirmPaymentModal
            isOpen={isModalOpen}
            orderData={modalOrder}
            onClose={() => setIsModalOpen(false)}
            onConfirm={handleConfirmPayment}
          />
        </main>
      </div>
    </div>
  );
};

export default AcPayments;