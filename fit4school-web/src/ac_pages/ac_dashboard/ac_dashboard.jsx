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
import AcTopbar from '../../components/ac_topbar/ac_topbar.jsx';
import calendarGIcon from '../../assets/icons/calendar-g.png';
import clockGIcon from '../../assets/icons/clock-g.png';

/* ------------------------- PAYMENT MODAL ------------------------- */
const PaymentConfirmationModal = ({ isOpen, onClose, onConfirm, orderData }) => {
  if (!isOpen || !orderData) return null;

  const totalPrice = orderData.items
    .reduce((sum, item) => sum + item.price * item.quantity, 0)
    .toFixed(2);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
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

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-4 py-3 text-left">Item ID</th>
                  <th className="border px-4 py-3 text-left">Item Name</th>
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
                      <td className="border px-4 py-3">{item.id}</td>
                      <td className="border px-4 py-3">{item.itemCode}</td>
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

        <div className="flex justify-center p-6 border-t">
          <button
            onClick={async () => await onConfirm(orderData.id)}
            className="px-8 py-3 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition font-semibold text-lg shadow-md"
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
  const [orders, setOrders] = useState([]);
  const [scannedOrder, setScannedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const scanBuffer = useRef("");
  const bufferTimeout = useRef(null);

  /* ----------- REALTIME ORDERS (status = for payment) ------------ */
  useEffect(() => {
    const q = query(
      collection(db, 'cartItems'),
      where('status', '==', 'for payment'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(fetched);
    });

    return () => unsubscribe();
  }, []);

  /* --------------------------- KEYBOARD SCANNER --------------------------- */
  useEffect(() => {
    const handleKeydown = (e) => {
      if (bufferTimeout.current) clearTimeout(bufferTimeout.current);

      // Scanner “types” fast text — capture it
      if (e.key !== "Enter") {
        scanBuffer.current += e.key;
      } else {
        const scannedCode = scanBuffer.current.trim();
        scanBuffer.current = "";

        if (scannedCode.length > 0) {
          handleScan(scannedCode); // 🔥 trigger scanning
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

      if (data.status !== "for payment") {
        alert("Order not for payment.");
        return;
      }

      setScannedOrder({ id: docId, ...data });
      setIsModalOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  /* --------------------------- CONFIRM PAYMENT --------------------------- */
  const handleConfirm = async (orderId) => {
    try {
      await updateDoc(doc(db, "cartItems", orderId), {
        status: "claim in cashier"
      });

      alert("Payment Confirmed!");
      setIsModalOpen(false);
      setScannedOrder(null);
    } catch (err) {
      console.error(err);
    }
  };

  /* --------------------------- RENDER PAGE --------------------------- */
  return (
    <div className="flex min-h-screen bg-gray-50">
      <AcSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col">
        <AcTopbar
          onMenuClick={() => setIsSidebarOpen(p => !p)}
          title="Dashboard"
        />

        <main className="flex-1 p-6">
          {/* Date + Time */}
          <div className="flex gap-4 mb-6">
            <h3 className="text-sm flex items-center gap-2">
              <img src={calendarGIcon} className="w-5" />
              {new Date().toLocaleDateString()}
            </h3>
            <h3 className="text-sm flex items-center gap-2">
              <img src={clockGIcon} className="w-5" />
              {new Date().toLocaleTimeString()}
            </h3>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-lg shadow-lg p-4">
            <h2 className="text-lg font-bold mb-4">Orders for Payment</h2>

            <div className="overflow-x-auto">
              <table className="w-full border border-gray-300">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border px-4 py-2">Order ID</th>
                    <th className="border px-4 py-2">Name</th>
                    <th className="border px-4 py-2">Items</th>
                    <th className="border px-4 py-2">Total</th>
                  </tr>
                </thead>

                <tbody>
                  {orders.length > 0 ? (
                    orders.map((o) => (
                      <tr
                        key={o.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleScan(o.id)}
                      >
                        <td className="border px-4 py-2">{o.id}</td>
                        <td className="border px-4 py-2">{o.name || o.fullName}</td>
                        <td className="border px-4 py-2">{o.items.length}</td>
                        <td className="border px-4 py-2 font-semibold">₱{o.orderTotal}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center py-6 text-gray-500">
                        No orders for payment
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* No need QR camera */}
          <p className="mt-6 text-gray-600 italic">
            Scanner Ready – Just scan the QR code using your device.
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
