import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../../firebase';
import ASidebar from '../../components/a_sidebar/a_sidebar.jsx';

const ConfirmDeliveryModal = ({ isOpen, orderData, onClose, onConfirm }) => {
  if (!isOpen || !orderData) return null;

  const totalPrice = orderData.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

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
            Confirm Delivered
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

  // Realtime fetch all orders where status is "to receive"
  useEffect(() => {
    document.title = "Admin | Orders - Fit4School";
    const q = query(
      collection(db, 'cartItems'),
      where('status', '==', 'to receive'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, snapshot => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(data);
    });

    return () => unsubscribe();
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
    const order = orders.find(o => o.id === scannedCode && o.status === 'to receive');
    
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
        status: 'completed',
        deliveredAt: new Date() 
      });
      setIsModalOpen(false);
      setModalOrder(null);
      alert('Delivery confirmed! Order status updated to "completed".');
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

  return (
    <div className="flex min-h-screen bg-gray-50">
      <ASidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <h1 className="text-2xl font-bold mb-6">Orders Ready for Delivery</h1>

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
            <p className="text-xs text-blue-500 mt-2">
              Scanner mode: <strong>USB Keyboard + Add CR Suffix</strong>
            </p>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-4 py-2">Order ID</th>
                  <th className="border px-4 py-2">Items</th>
                  <th className="border px-4 py-2">Total Quantity</th>
                  <th className="border px-4 py-2">Status</th>
                  <th className="border px-4 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.length > 0 ? (
                  orders.map(order => {
                    const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
                    const itemCodes = order.items.map(item => item.itemCode).join(', ');
                    
                    return (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="border px-4 py-2 font-mono text-sm">{order.id}</td>
                        <td className="border px-4 py-2">{itemCodes}</td>
                        <td className="border px-4 py-2 text-center">{totalQuantity}</td>
                        <td className="border px-4 py-2">
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                            {order.status}
                          </span>
                        </td>
                        <td className="border px-4 py-2 text-center">
                          <button
                            onClick={() => handleManualDelivery(order.id)}
                            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition text-sm"
                          >
                            Manual Confirm
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                      No orders ready for delivery
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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