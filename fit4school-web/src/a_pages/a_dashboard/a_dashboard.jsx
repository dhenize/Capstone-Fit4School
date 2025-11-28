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
import { db } from "../../../firebase";

// icons
import packageIcon from "../../assets/icons/package.png";
import hourGlass from "../../assets/icons/hourglass.png";
import checkIcon from "../../assets/icons/check.png";
import customerIcon from "../../assets/icons/customer.png";
import calendarGIcon from "../../assets/icons/calendar-g.png";
import clockGIcon from "../../assets/icons/clock-g.png";

const ADashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // realtime data
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [totalCustomers, setTotalCustomers] = useState(0);

  // derived stats
  const [totalOrders, setTotalOrders] = useState(0);
  const [completedOrders, setCompletedOrders] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);

  const [gradeDistribution, setGradeDistribution] = useState({
    Kindergarten: 0,
    Elementary: 0,
    "Junior High": 0,
  });

  useEffect(() => {
    document.title = "Admin | Dashboard - Fit4School";

    const handleResize = () => setIsSidebarOpen(window.innerWidth >= 768);
    handleResize();
    window.addEventListener("resize", handleResize);

    // Orders listener
    const unsubOrders = onSnapshot(collection(db, "cartItems"), (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setOrders(docs);
    }, (err) => console.error("orders listener error", err));

    // Users listener (for customer count)
    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      const userDocs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setUsers(userDocs);
      // Count users with gen_roles "user"
      const customerCount = userDocs.filter(user => user.gen_roles === "user").length;
      setTotalCustomers(customerCount);
    }, (err) => console.error("users listener error", err));

    return () => {
      window.removeEventListener("resize", handleResize);
      unsubOrders();
      unsubUsers();
    };
  }, []);

  // Compute stats whenever orders change
  useEffect(() => {
    const total = orders.length;
    const completed = orders.filter((o) => o.status === "Completed").length;
    const pending = orders.filter((o) => o.status === "To Pay").length;

    setTotalOrders(total);
    setCompletedOrders(completed);
    setPendingOrders(pending);

    // Grade distribution counts
    const kindergarten = orders.filter((o) => 
      o.items && o.items.some(item => item.grdLevel === "Kindergarten")
    ).length;
    
    const elementary = orders.filter((o) => 
      o.items && o.items.some(item => item.grdLevel === "Elementary" || item.grdLevel === "Primary")
    ).length;
    
    const juniorHigh = orders.filter((o) => 
      o.items && o.items.some(item => item.grdLevel === "Junior High" || item.grdLevel === "JHS")
    ).length;

    setGradeDistribution({ 
      Kindergarten: kindergarten, 
      Elementary: elementary, 
      "Junior High": juniorHigh 
    });
  }, [orders]);

  // compute bar heights for the bar chart (0-100%)
  const computeHeights = (arr) => {
    if (!arr || arr.length === 0) return [0, 0, 0, 0, 0, 0, 0];
    const max = Math.max(...arr, 1);
    return arr.map((v) => Math.round((v / max) * 100));
  };

  // Mock weekly sales data (you can replace with real data)
  const weeklySales = [12000, 19000, 15000, 22000, 18000, 14000, 16000];
  const barHeights = computeHeights(weeklySales);
  
  // label days Mon..Su for display
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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

          {/* Top Stats Widgets */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6">
            {/* Total Orders */}
            <div className="bg-white rounded-lg shadow-md p-4 h-30 sm:h-36 md:h-35 transition">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs sm:text-sm font-semibold">Total Orders</h4>
                <img src={packageIcon} alt="Package Icon" className="w-6 h-6 opacity-80" />
              </div>
              <p className="text-2xl text-cyan-500 sm:text-3xl md:text-4xl font-bold">{totalOrders}</p>
              <p className="text-xs text-gray-500 opacity-80 mt-1">All time orders</p>
            </div>

            {/* Customers */}
            <div className="bg-white rounded-lg shadow-md p-4 h-30 sm:h-36 md:h-35 transition">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs sm:text-sm font-semibold">Customers</h4>
                <img src={customerIcon} alt="Customer Icon" className="w-6 h-6 opacity-80" />
              </div>
              <p className="text-2xl text-cyan-500 sm:text-3xl md:text-4xl font-bold">{totalCustomers}</p>
              <p className="text-xs text-gray-500 opacity-80 mt-1">Registered users</p>
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
                  <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded font-semibold">Sample Data</span>
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
                        ₱{(weeklySales[idx] || 0).toLocaleString()}
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
                    ₱{weeklySales.reduce((s, v) => s + (v || 0), 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Daily Average</p>
                  <p className="text-lg font-bold text-gray-800">
                    ₱{Math.round(weeklySales.reduce((s, v) => s + (v || 0), 0) / 7).toLocaleString()}
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
                  <svg viewBox="0 0 100 100" className="transform -rotate-90">
                    {(() => {
                      const total = gradeDistribution.Kindergarten + gradeDistribution.Elementary + gradeDistribution["Junior High"] || 1;
                      const k = (gradeDistribution.Kindergarten / total) * 100;
                      const e = (gradeDistribution.Elementary / total) * 100;
                      const j = (gradeDistribution["Junior High"] / total) * 100;
                      
                      const circumference = 2 * Math.PI * 40;
                      const dash1 = (k / 100) * circumference;
                      const dash2 = (e / 100) * circumference;
                      const dash3 = (j / 100) * circumference;
                      
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
                    <span className="text-sm text-gray-700">Junior High - {gradeDistribution["Junior High"]} ({totalOrders ? Math.round((gradeDistribution["Junior High"]/totalOrders)*100) : 0}%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-cyan-500 rounded"></div>
                    <span className="text-sm text-gray-700">Elementary - {gradeDistribution.Elementary} ({totalOrders ? Math.round((gradeDistribution.Elementary/totalOrders)*100) : 0}%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span className="text-sm text-gray-700">Kindergarten - {gradeDistribution.Kindergarten} ({totalOrders ? Math.round((gradeDistribution.Kindergarten/totalOrders)*100) : 0}%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ADashboard;