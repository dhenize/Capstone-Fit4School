import React, { useState, useEffect } from "react";
import ASidebar from "../../components/a_sidebar/a_sidebar.jsx";

import {
  collection,
  doc,
  onSnapshot,
  query,
  orderBy,
  where,
} from "firebase/firestore";
import { db } from "../../../firebase"; // adjust path if necessary

// icons
import packageIcon from "../../assets/icons/package.png";
import hourGlass from "../../assets/icons/hourglass.png";
import checkIcon from "../../assets/icons/check.png";
import customerIcon from "../../assets/icons/customer.png";
import calendarGIcon from "../../assets/icons/calendar-g.png";
import clockGIcon from "../../assets/icons/clock-g.png";

// Confirmation Modal Component
const ConfirmationModal = ({ isOpen, onClose, onConfirm, orderData }) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(orderData);
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header with X button on left */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition"
          >
            ×
          </button>
          <h2 className="text-xl font-bold text-gray-800 flex-1 text-center mr-8">
            Order Confirmation
          </h2>
        </div>

        {/* Confirmation Details */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            Please confirm the following order details:
          </h3>
          
          {/* Order Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-700">Order ID</th>
                  <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                  <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-700">Items ID</th>
                  <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-700">Item List</th>
                  <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-700">Quantity</th>
                  <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-700">Price</th>
                  <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-700">Total</th>
                </tr>
              </thead>
              <tbody>
                {orderData.items?.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700">
                      {index === 0 ? orderData.orderId : ''}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700">
                      {index === 0 ? `${orderData.firstName} ${orderData.lastName}` : ''}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700">
                      {item.itemId}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700">
                      {item.itemName}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700">
                      {item.quantity}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700">
                      ${item.price.toFixed(2)}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700 font-semibold">
                      ${(item.quantity * item.price).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td 
                    colSpan="6" 
                    className="border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 text-right"
                  >
                    Grand Total:
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-sm font-semibold text-blue-600">
                    ${orderData.totalAmount?.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Confirmation Button - Center */}
        <div className="flex justify-center p-6 border-t border-gray-200 bg-gray-50">
          <button 
            onClick={handleConfirm}
            className="px-8 py-3 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition font-semibold text-lg shadow-md hover:shadow-lg"
          >
            Confirm Order
          </button>
        </div>
      </div>
    </div>
  );
};

const ADashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Modal states
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // realtime data
  const [announcements, setAnnouncements] = useState([]);
  const [announcementInput, setAnnouncementInput] = useState("");

  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [queueList, setQueueList] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  const [ordersRaw, setOrdersRaw] = useState([]);
  const [totalCustomers, setTotalCustomers] = useState(0);

  // derived stats
  const [totalOrders, setTotalOrders] = useState(0);
  const [completedOrders, setCompletedOrders] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);

  const [weeklySales, setWeeklySales] = useState([]); // array of 7 numbers for M..Su
  const [gradeDistribution, setGradeDistribution] = useState({
    preschool: 0,
    primary: 0,
    jhs: 0,
  });

  useEffect(() => {
    document.title = "Admin | Dashboard - Fit4School";

    const handleResize = () => setIsSidebarOpen(window.innerWidth >= 768);
    handleResize();
    window.addEventListener("resize", handleResize);

    // Announcements (ordered by date desc where date may be string or Timestamp)
    const qAnnouncements = query(collection(db, "announcements"), orderBy("date", "desc"));
    const unsubAnnouncements = onSnapshot(qAnnouncements, (snap) => {
      const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAnnouncements(arr);
    });

    // Current customer (single doc id "current" in collection currentCustomer)
    const currentDocRef = doc(db, "currentCustomer", "current");
    const unsubCurrent = onSnapshot(currentDocRef, (snap) => {
      setCurrentCustomer(snap.exists() ? snap.data() : null);
    }, (err) => console.error("currentCustomer listener error", err));

    // Queue list
    const unsubQueue = onSnapshot(collection(db, "queueList"), (snap) => {
      setQueueList(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    // Recent activity
    const unsubRecent = onSnapshot(collection(db, "recentActivity"), (snap) => {
      setRecentActivity(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    // Orders (for stats & charts)
    const unsubOrders = onSnapshot(collection(db, "orders"), (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setOrdersRaw(docs);
    }, (err) => console.error("orders listener error", err));

    // Customers count
    const unsubCustomers = onSnapshot(collection(db, "customers"), (snap) => {
      setTotalCustomers(snap.size);
    }, (err) => console.error("customers listener error", err));

    return () => {
      window.removeEventListener("resize", handleResize);
      unsubAnnouncements();
      unsubCurrent();
      unsubQueue();
      unsubRecent();
      unsubOrders();
      unsubCustomers();
    };
  }, []);

  // Auto-open confirmation modal for demo purposes
  useEffect(() => {
    const timer = setTimeout(() => {
      const mockOrderData = {
        orderId: "ORD-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
        firstName: 'John',
        lastName: 'Doe',
        items: [
          {
            itemId: 'ITM-001',
            itemName: 'School Uniform',
            quantity: 2,
            price: 25.50
          },
          {
            itemId: 'ITM-002',
            itemName: 'PE Shirt',
            quantity: 1,
            price: 15.75
          },
          {
            itemId: 'ITM-003',
            itemName: 'School ID Lace',
            quantity: 1,
            price: 5.00
          }
        ],
        totalAmount: 71.75
      };

      setSelectedOrder(mockOrderData);
      setIsConfirmationModalOpen(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Confirmation Modal Handlers
  const handleCloseConfirmationModal = () => {
    setIsConfirmationModalOpen(false);
    setSelectedOrder(null);
  };

  const handleConfirmOrder = (orderData) => {
    console.log('Order confirmed:', orderData);
    alert(`Order ${orderData.orderId} confirmed successfully!`);
    // Add your order confirmation logic here (update database, etc.)
    setIsConfirmationModalOpen(false);
    setSelectedOrder(null);
  };

  // helper: convert Firestore Timestamp or string to readable string
  const formatDateTime = (value) => {
    if (!value) return "";
    // Firestore Timestamp
    if (typeof value === "object" && value !== null && typeof value.toDate === "function") {
      return value.toDate().toLocaleString();
    }
    // plain object with seconds/nanoseconds
    if (value && value.seconds) {
      return new Date(value.seconds * 1000).toLocaleString();
    }
    // ISO string
    if (typeof value === "string") return new Date(value).toLocaleString();
    // fallback
    return String(value);
  };

  // Whenever ordersRaw changes, compute dashboard stats, weekly sales and grade distribution
  useEffect(() => {
    const orders = ordersRaw || [];

    setTotalOrders(orders.length);
    setCompletedOrders(orders.filter((o) => (o.status || "").toLowerCase() === "completed").length);
    setPendingOrders(orders.filter((o) => (o.status || "").toLowerCase() === "pending").length);

    // Grade distribution counts
    const preschool = orders.filter((o) => (o.gradeLevel || "").toLowerCase() === "preschool").length;
    const primary = orders.filter((o) => (o.gradeLevel || "").toLowerCase() === "primary").length;
    const jhs = orders.filter((o) => (o.gradeLevel || "").toLowerCase() === "jhs").length;
    setGradeDistribution({ preschool, primary, jhs });

    // Weekly sales: last 7 days (Sun..Sat or Mon..Sun — we will produce Mon..Sun as your UI uses M T W Th F S Su)
    // Create 7-day buckets (Mon..Sun) for the last 7 calendar days
    const today = new Date();
    // create map keyed by YYYY-MM-DD
    const dayBuckets = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().split("T")[0]; // YYYY-MM-DD
      dayBuckets[key] = 0;
    }

    orders.forEach((o) => {
      // get date object
      let dt = null;
      if (!o.date) {
        // fallback: maybe orderedTime or createdAt
        dt = null;
      } else if (typeof o.date === "object" && typeof o.date.toDate === "function") {
        dt = o.date.toDate();
      } else if (o.date && o.date.seconds) {
        dt = new Date(o.date.seconds * 1000);
      } else if (typeof o.date === "string") {
        dt = new Date(o.date);
      }

      if (!dt || Number.isNaN(dt.getTime())) return;

      const key = dt.toISOString().split("T")[0];
      if (key in dayBuckets) {
        const amount = Number(o.amount || 0);
        dayBuckets[key] += isNaN(amount) ? 0 : amount;
      }
    });

    // Convert dayBuckets into ordered array Mon..Sun
    // Build days labels array relative to today -6..0
    const orderedSales = Object.keys(dayBuckets).map((k) => dayBuckets[k]); // already ordered from oldest to newest
    setWeeklySales(orderedSales);

  }, [ordersRaw]);

  // post announcement (writes to Firestore)
  const handlePostAnnouncement = async () => {
    const text = (announcementInput || "").trim();
    if (!text) return alert("Please enter an announcement");

    try {
      // add document with ISO date string
      await db.collection
        ? db.collection("announcements").add({ text, date: new Date().toISOString().split("T")[0], author: "Admin" })
        : await /* fallback for modular API */ (async () => {
            // We're using modular API in other files; here we'll import addDoc if needed.
            const { addDoc, collection } = await import("firebase/firestore");
            return addDoc(collection(db, "announcements"), { text, date: new Date().toISOString().split("T")[0], author: "Admin" });
          })();
      setAnnouncementInput("");
      alert("Announcement posted!");
    } catch (err) {
      console.error("Error posting announcement", err);
      alert("Failed to post announcement");
    }
  };

  // delete announcement
  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm("Delete this announcement?")) return;
    try {
      const { deleteDoc, doc } = await import("firebase/firestore");
      await deleteDoc(doc(db, "announcements", id));
    } catch (err) {
      console.error("Error deleting announcement", err);
      alert("Failed to delete");
    }
  };

  // compute bar heights for the bar chart (0-100%)
  const computeHeights = (arr) => {
    if (!arr || arr.length === 0) return [0, 0, 0, 0, 0, 0, 0];
    const max = Math.max(...arr, 1);
    return arr.map((v) => Math.round((v / max) * 100));
  };

  const barHeights = computeHeights(weeklySales);
  // label days Mon..Su for display using last 7 days
  const dayLabels = (() => {
    const res = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const short = d.toLocaleDateString(undefined, { weekday: "short" }); // Mon, Tue ...
      res.push(short);
    }
    return res;
  })();

  // status badge helper (same as before)
  const getStatusColor = (status) => {
    const colors = {
      Void: "bg-yellow-100 text-yellow-800 border-red-300",
      Refunded: "bg-orange-100 text-orange-800 border-orange-300",
      Completed: "bg-blue-100 text-blue-800 border-blue-300",
      Returned: "bg-purple-100 text-purple-800 border-purple-300",
      Cancelled: "bg-pink-100 text-pink-800 border-pink-300",
      Active: "bg-green-100 text-green-800 border-green-300",
    };
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-300";
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <ASidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0">

        {/* Main Content */}
        <div className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 overflow-x-hidden">
          {/* Top Info Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-6">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <h3 className="text-xs sm:text-sm font-medium text-gray-700 flex items-center gap-2">
                <img src={calendarGIcon} alt="Calendar" className="w-4 h-4 sm:w-5 sm:h-5" />
                {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              </h3>
              <h3 className="text-xs sm:text-sm font-medium text-gray-700 flex items-center gap-2">
                <img src={clockGIcon} alt="Clock" className="w-4 h-4 sm:w-5 sm:h-5" />
                {new Date().toLocaleTimeString()}
              </h3>
            </div>

            <div className="flex flex-wrap gap-2 sm:gap-3 sm:ml-auto">
              <div className="bg-white rounded-lg shadow px-3 sm:px-4 py-2 hover:shadow-md transition cursor-pointer">
                <p className="text-xs sm:text-sm font-medium whitespace-nowrap">📊 Last 7 days</p>
              </div>
            </div>
          </div>

          {/* Rest of your existing dashboard content remains the same */}
          {/* Top Stats Widgets */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6">
            {/* Total Orders */}
            <div className="bg-white rounded-lg shadow-md p-4 h-30 sm:h-36 md:h-35 transition">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs sm:text-sm font-semibold">Total Orders</h4>
                <img src={packageIcon} alt="Package Icon" className="w-6 h-6 opacity-80" />
              </div>
              <p className="text-2xl text-cyan-500 sm:text-3xl md:text-4xl font-bold">{totalOrders}</p>
              <p className="text-xs text-gray-500 opacity-80 mt-1">Realtime</p>
            </div>

            {/* Customers */}
            <div className="bg-white rounded-lg shadow-md p-4 h-30 sm:h-36 md:h-35 transition">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs sm:text-sm font-semibold">Customers</h4>
                <img src={customerIcon} alt="Customer Icon" className="w-6 h-6 opacity-80" />
              </div>
              <p className="text-2xl text-cyan-500 sm:text-3xl md:text-4xl font-bold">{totalCustomers}</p>
              <p className="text-xs text-gray-500 opacity-80 mt-1">Realtime</p>
            </div>

            {/* Completed */}
            <div className="bg-white rounded-lg shadow-md p-4 h-30 sm:h-36 md:h-35 transition">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs sm:text-sm font-semibold">Completed</h4>
                <img src={checkIcon} alt="Check Icon" className="w-6 h-6 opacity-80" />
              </div>
              <p className="text-2xl text-cyan-500 sm:text-3xl md:text-4xl font-bold">{completedOrders}</p>
              <p className="text-xs text-gray-500 opacity-80 mt-1">{totalOrders ? `${Math.round((completedOrders / totalOrders) * 100)}% completion` : "—"}</p>
            </div>

            {/* Pending */}
            <div className="bg-white rounded-lg shadow-md p-4 h-30 sm:h-36 md:h-35 transition">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs sm:text-sm font-semibold">Pending</h4>
                <img src={hourGlass} alt="Hourglass Icon" className="w-6 h-6 opacity-80" />
              </div>
              <p className="text-2xl text-green-500 sm:text-3xl md:text-4xl font-bold">{pendingOrders}</p>
              <p className="text-xs text-gray-500 opacity-80 mt-1">{totalOrders ? `${Math.round((pendingOrders / totalOrders) * 100)}% of total orders` : "—"}</p>
            </div>
          </div>

          {/* Charts Section - Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {/* Bar Chart - Weekly Sales */}
            <div className="bg-white rounded-lg shadow-md p-4 md:p-6 transition">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm md:text-base font-bold text-gray-800">Weekly Sales</h4>
                <div className="flex gap-2">
                  <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded font-semibold">Realtime</span>
                </div>
              </div>

              <div className="flex items-end justify-around h-48 gap-2 border-b border-l border-gray-200 pb-2 pl-2">
                {barHeights.map((height, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1 flex-1 group relative">
                    <div
                      className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t transition cursor-pointer"
                      style={{ height: `${height}%` }}
                    >
                      <div className="hidden group-hover:block absolute bottom-full mb-2 bg-gray-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap">
                        {Intl.NumberFormat(undefined, { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(weeklySales[idx] || 0)}
                      </div>
                    </div>
                    <span className="text-xs text-gray-600 font-semibold">{dayLabels[idx]}</span>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="flex justify-between mt-4 pt-4 border-t">
                <div>
                  <p className="text-xs text-gray-500">Total This Week</p>
                  <p className="text-lg font-bold text-gray-800">
                    {Intl.NumberFormat(undefined, { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(weeklySales.reduce((s, v) => s + (v || 0), 0))}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Daily Average</p>
                  <p className="text-lg font-bold text-gray-800">
                    {Intl.NumberFormat(undefined, { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(Math.round((weeklySales.reduce((s, v) => s + (v || 0), 0) / 7)))}
                  </p>
                </div>
              </div>
            </div>

            {/* Pie Chart - Grade Level Order Distribution */}
            <div className="bg-white rounded-lg shadow-md p-4 md:p-6 transition">
              <h4 className="text-sm md:text-base font-bold text-gray-800 mb-4">Grade Level Order Distribution</h4>
              <div className="flex flex-col md:flex-row items-center justify-around">
                {/* Doughnut (SVG) */}
                <div className="relative w-40 h-40 md:w-48 md:h-48">
                  {/* simple svg donut using strokeDasharray computed from distribution */}
                  <svg viewBox="0 0 100 100" className="transform -rotate-90">
                    {/* compute circumference segments */}
                    {(() => {
                      const total = gradeDistribution.preschool + gradeDistribution.primary + gradeDistribution.jhs || 1;
                      const p = (gradeDistribution.preschool / total) * 100;
                      const q = (gradeDistribution.primary / total) * 100;
                      const r = (gradeDistribution.jhs / total) * 100;
                      // convert percent to strokeDasharray on circle circumference: circumference ~ 2πr (r=40) -> ~251.2
                      const circumference = 2 * Math.PI * 40;
                      const dash1 = (p / 100) * circumference;
                      const dash2 = (q / 100) * circumference;
                      const dash3 = (r / 100) * circumference;
                      return (
                        <>
                          <circle cx="50" cy="50" r="40" fill="none" stroke="#ef4444" strokeWidth="20" strokeDasharray={`${dash1} ${circumference - dash1}`} strokeDashoffset="0" />
                          <circle cx="50" cy="50" r="40" fill="none" stroke="#0FAFFF" strokeWidth="20" strokeDasharray={`${dash2} ${circumference - dash2}`} strokeDashoffset={`-${dash1}`} />
                          <circle cx="50" cy="50" r="40" fill="none" stroke="#00C951" strokeWidth="20" strokeDasharray={`${dash3} ${circumference - dash3}`} strokeDashoffset={`-${dash1 + dash2}`} />
                        </>
                      );
                    })()}
                  </svg>

                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-2xl md:text-3xl font-bold text-gray-800">{totalOrders}</p>
                      <p className="text-xs text-gray-500">Total</p>
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex flex-col gap-3 mt-4 md:mt-0">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span className="text-sm text-gray-700">Junior High - {gradeDistribution.jhs} ({totalOrders ? Math.round((gradeDistribution.jhs/totalOrders)*100) : 0}%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-cyan-500 rounded"></div>
                    <span className="text-sm text-gray-700">Elementary - {gradeDistribution.primary} ({totalOrders ? Math.round((gradeDistribution.primary/totalOrders)*100) : 0}%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span className="text-sm text-gray-700">Kindergarten - {gradeDistribution.preschool} ({totalOrders ? Math.round((gradeDistribution.preschool/totalOrders)*100) : 0}%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmationModalOpen}
        onClose={handleCloseConfirmationModal}
        onConfirm={handleConfirmOrder}
        orderData={selectedOrder}
      />
    </div>
  );
};

export default ADashboard;