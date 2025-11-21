import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../../firebase';
import ASidebar from '../../components/a_sidebar/a_sidebar.jsx';
import ATopbar from '../../components/a_topbar/a_topbar.jsx';
import { QrReader } from 'react-qr-reader';

const ConfirmModal = ({ isOpen, orderData, onClose, onConfirm }) => {
  if (!isOpen || !orderData) return null;

  const totalPrice = orderData.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl p-6">
        <h2 className="text-xl font-bold mb-4 text-center">Confirm Completion</h2>

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
            Confirm Completed
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

  // Realtime fetch all orders where status is "claim in cashier"
  useEffect(() => {
    const q = query(
      collection(db, 'cartItems'),
      where('status', '==', 'claim in cashier'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, snapshot => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(data);
    });

    return () => unsubscribe();
  }, []);

  const handleScan = (orderId) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      setModalOrder(order);
      setIsModalOpen(true);
    } else {
      alert("Order not found or not ready at counter.");
    }
  };

  const handleConfirm = async (orderId) => {
    try {
      await updateDoc(doc(db, 'cartItems', orderId), { status: 'completed' });
      setIsModalOpen(false);
      setModalOrder(null);
    } catch (error) {
      console.error('Error confirming order:', error);
      alert('Failed to confirm order.');
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <ASidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <ATopbar onMenuClick={() => setIsSidebarOpen(prev => !prev)} title="Orders Ready at Counter" />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <h1 className="text-2xl font-bold mb-6">Orders Ready at Counter</h1>

          {/* QR Scanner */}
          <div className="mb-6 max-w-sm">
            <h2 className="text-lg font-bold mb-2">Scan QR Code</h2>
            <QrReader
              onResult={(result, error) => {
                if (result) handleScan(result?.text);
                if (error) return;
              }}
              constraints={{ facingMode: 'environment' }}
              style={{ width: '100%' }}
            />
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-4 py-2">Order ID</th>
                  <th className="border px-4 py-2">Item Code</th>
                  <th className="border px-4 py-2">Quantity</th>
                  <th className="border px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.length > 0 ? (
                  orders.map(order =>
                    order.items.map((item, idx) => (
                      <tr
                        key={`${order.id}-${idx}`}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleScan(order.id)}
                      >
                        <td className="border px-4 py-2">{order.id}</td>
                        <td className="border px-4 py-2">{item.itemCode}</td>
                        <td className="border px-4 py-2">{item.quantity}</td>
                        <td className="border px-4 py-2">{order.status}</td>
                      </tr>
                    ))
                  )
                ) : (
                  <tr>
                    <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                      No orders ready at counter
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>

        <ConfirmModal
          isOpen={isModalOpen}
          orderData={modalOrder}
          onClose={() => setIsModalOpen(false)}
          onConfirm={handleConfirm}
        />
      </div>
    </div>
  );
};

export default AOrders;
