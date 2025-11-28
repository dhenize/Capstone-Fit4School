import React, { useEffect, useState, useRef } from 'react';
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
import AcSidebar from '../../components/ac_sidebar/ac_sidebar.jsx';
import calendarGIcon from '../../assets/icons/calendar-g.png';
import clockGIcon from '../../assets/icons/clock-g.png';

/* ------------------------- PAYMENT MODAL ------------------------- */
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

/* ---------------------------- MAIN PAGE ---------------------------- */
const AcDashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [scannedOrder, setScannedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stats, setStats] = useState({
    pendingPayments: 0,
    paidOrders: 0,
    cashPayments: 0,
    bankPayments: 0
  });

  const scanBuffer = useRef("");
  const bufferTimeout = useRef(null);

  /* ----------- REALTIME PENDING ORDERS (status = "To Pay") ------------ */
  useEffect(() => {
    const q = query(
      collection(db, 'cartItems'),
      where('status', '==', 'To Pay'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPendingOrders(fetched);
    });

    return () => unsubscribe();
  }, []);

  /* ----------- REALTIME COMPLETED ORDERS (status = "To Receive" & "Void") ------------ */
  useEffect(() => {
    const q = query(
      collection(db, 'cartItems'),
      where('status', 'in', ['To Receive', 'Void']),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCompletedOrders(fetched);
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
      const pendingPayments = pendingOrders.length;
      const paidOrders = snapshot.size;
      const cashPayments = pendingOrders.filter(o => o.paymentMethod === 'cash').length;
      const bankPayments = pendingOrders.filter(o => o.paymentMethod === 'bank').length;

      setStats({
        pendingPayments,
        paidOrders,
        cashPayments,
        bankPayments
      });
    });

    return () => unsubscribePaid();
  }, [pendingOrders]);

  /* --------------------------- KEYBOARD SCANNER --------------------------- */
  useEffect(() => {
    const handleKeydown = (e) => {
      if (bufferTimeout.current) clearTimeout(bufferTimeout.current);

      // Scanner "types" fast text - capture it
      if (e.key !== "Enter") {
        scanBuffer.current += e.key;
      } else {
        const scannedCode = scanBuffer.current.trim();
        scanBuffer.current = "";

        if (scannedCode.length > 0) {
          handleScan(scannedCode);
        }
      }

      // Reset buffer if typing is slow (means user typed manually)
      bufferTimeout.current = setTimeout(() => {
        scanBuffer.current = "";
      }, 100);
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, []);

  /* --------------------------- HANDLE SCAN --------------------------- */
  const handleScan = async (docId) => {
    try {
      const docRef = doc(db, 'cartItems', docId);
      const snap = await getDoc(docRef);

      if (!snap.exists()) {
        alert("Order not found!");
        return;
      }

      const data = snap.data();

      if (data.status !== "To Pay") {
        alert("Order not for payment. Current status: " + data.status);
        return;
      }

      setScannedOrder({ id: docId, ...data });
      setIsModalOpen(true);
    } catch (err) {
      console.error(err);
      alert("Error fetching order data");
    }
  };

  /* --------------------------- CONFIRM PAYMENT --------------------------- */
  const handleConfirm = async (orderId) => {
    try {
      await updateDoc(doc(db, "cartItems", orderId), {
        status: "To Receive",
        paidAt: new Date()
      });

      alert("Payment Confirmed! Status updated to 'To Receive'");
      setIsModalOpen(false);
      setScannedOrder(null);
    } catch (err) {
      console.error(err);
      alert("Failed to confirm payment");
    }
  };

  /* --------------------------- MANUAL PAYMENT --------------------------- */
  const handleManualPayment = (orderId) => {
    const order = pendingOrders.find(o => o.id === orderId);
    if (order) {
      setScannedOrder(order);
      setIsModalOpen(true);
    }
  };

  /* --------------------------- RENDER PAGE --------------------------- */
  return (
    <div className="flex min-h-screen bg-gray-50">
      <AcSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-6">
          {/* Date + Time */}
          <div className="flex gap-4 mb-6">
            <h3 className="text-sm flex items-center gap-2">
              <img src={calendarGIcon} className="w-5" alt="Calendar" />
              {new Date().toLocaleDateString()}
            </h3>
            <h3 className="text-sm flex items-center gap-2">
              <img src={clockGIcon} className="w-5" alt="Clock" />
              {new Date().toLocaleTimeString()}
            </h3>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Pending Payments */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-sm text-gray-600 font-medium mb-2">Pending Payments</h3>
              <p className="text-3xl font-bold text-cyan-500">{stats.pendingPayments}</p>
              <p className="text-xs text-gray-500">Orders to pay</p>
            </div>

            {/* Paid Orders */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-sm text-gray-600 font-medium mb-2">Paid Orders</h3>
              <p className="text-3xl font-bold text-cyan-500">{stats.paidOrders}</p>
              <p className="text-xs text-gray-500">Ready for pickup</p>
            </div>

            {/* Cash Payments */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-sm text-gray-600 font-medium mb-2">Cash Payments</h3>
              <p className="text-3xl font-bold text-cyan-500">{stats.cashPayments}</p>
              <p className="text-xs text-gray-500">Pending cash orders</p>
            </div>

            {/* Bank Payments */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-sm text-gray-600 font-medium mb-2">Bank Payments</h3>
              <p className="text-3xl font-bold text-cyan-500">{stats.bankPayments}</p>
              <p className="text-xs text-gray-500">Pending bank orders</p>
            </div>
          </div>

          {/* Orders for Payment Table */}
          <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
            <h2 className="text-lg font-bold mb-4">Orders for Payment</h2>

            <div className="overflow-x-auto">
              <table className="w-full border border-gray-300">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border px-4 py-2">Order ID</th>
                    <th className="border px-4 py-2">Items</th>
                    <th className="border px-4 py-2">Total Quantity</th>
                    <th className="border px-4 py-2">Total Amount</th>
                    <th className="border px-4 py-2">Payment Method</th>
                    <th className="border px-4 py-2">Paid At</th>
                    <th className="border px-4 py-2">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {pendingOrders.length > 0 ? (
                    pendingOrders.map((order) => {
                      const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
                      const totalPrice = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                      
                      return (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="border px-4 py-2 font-mono text-sm">{order.id}</td>
                          <td className="border px-4 py-2">
                            {order.items.map(item => item.itemCode).join(', ')}
                          </td>
                          <td className="border px-4 py-2 text-center">{totalQuantity}</td>
                          <td className="border px-4 py-2 font-semibold">₱{totalPrice.toFixed(2)}</td>
                          <td className="border px-4 py-2 capitalize">{order.paymentMethod}</td>
                          <td className="border px-4 py-2 text-center">-</td>
                          <td className="border px-4 py-2 text-center">
                            <button
                              onClick={() => handleManualPayment(order.id)}
                              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition text-xs"
                            >
                              Confirm
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-6 text-gray-500">
                        No orders for payment
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Completed Orders Table */}
          <div className="bg-white rounded-lg shadow-lg p-4">
            <h2 className="text-lg font-bold mb-4">Processed Orders (To Receive & Void)</h2>

            <div className="overflow-x-auto">
              <table className="w-full border border-gray-300">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border px-4 py-2">Order ID</th>
                    <th className="border px-4 py-2">Items</th>
                    <th className="border px-4 py-2">Total Quantity</th>
                    <th className="border px-4 py-2">Total Amount</th>
                    <th className="border px-4 py-2">Status</th>
                    <th className="border px-4 py-2">Payment Method</th>
                    <th className="border px-4 py-2">Paid At</th>
                  </tr>
                </thead>

                <tbody>
                  {completedOrders.length > 0 ? (
                    completedOrders.map((order) => {
                      const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
                      const totalPrice = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                      const paidAt = order.paidAt ? new Date(order.paidAt.seconds * 1000).toLocaleString() : '-';
                      
                      return (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="border px-4 py-2 font-mono text-sm">{order.id}</td>
                          <td className="border px-4 py-2">
                            {order.items.map(item => item.itemCode).join(', ')}
                          </td>
                          <td className="border px-4 py-2 text-center">{totalQuantity}</td>
                          <td className="border px-4 py-2 font-semibold">₱{totalPrice.toFixed(2)}</td>
                          <td className="border px-4 py-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              order.status === 'To Receive' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="border px-4 py-2 capitalize">{order.paymentMethod}</td>
                          <td className="border px-4 py-2 text-sm">{paidAt}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-6 text-gray-500">
                        No processed orders
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Scanner Instructions */}
          <p className="mt-6 text-gray-600 italic">
            Scanner Ready – Use your hardware QR scanner to scan customer tickets.
          </p>
        </main>
      </div>

      <PaymentConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirm}
        orderData={scannedOrder}
      />
    </div>
  );
};

export default AcDashboard;