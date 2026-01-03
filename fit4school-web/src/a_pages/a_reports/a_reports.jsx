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
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import packageIcon from "../../assets/icons/package.png";
import hourGlass from "../../assets/icons/hourglass.png";
import checkIcon from "../../assets/icons/check.png";
import customerIcon from "../../assets/icons/customer.png";
import calendarGIcon from "../../assets/icons/calendar-g.png";
import clockGIcon from "../../assets/icons/clock-g.png";

const AReports = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

 
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [totalCustomers, setTotalCustomers] = useState(0);

  
  const [filterDays, setFilterDays] = useState(7); // Default: Last 7 days
  const [filteredOrders, setFilteredOrders] = useState([]);

  
  const [totalOrders, setTotalOrders] = useState(0);
  const [completedOrders, setCompletedOrders] = useState(0);
  const [toPay, setToPay] = useState(0);
  const [stats, setStats] = useState({
    cancelledOrders: 0
  });

  const [gradeDistribution, setGradeDistribution] = useState({
    Kindergarten: 0,
    Elementary: 0,
    "Junior High": 0,
  });

  
    useEffect(() => {
      const timer = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);
  
      return () => clearInterval(timer);
    }, []);

  useEffect(() => {
    document.title = "Admin | Dashboard - Fit4School";

    const handleResize = () => setIsSidebarOpen(window.innerWidth >= 768);
    handleResize();
    window.addEventListener("resize", handleResize);

    
    const unsubOrders = onSnapshot(collection(db, "cartItems"), (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setOrders(docs);
    }, (err) => console.error("orders listener error", err));

   
    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      const userDocs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setUsers(userDocs);
      
      const customerCount = userDocs.filter(user => user.gen_roles === "user").length;
      setTotalCustomers(customerCount);
    }, (err) => console.error("users listener error", err));

    return () => {
      window.removeEventListener("resize", handleResize);
      unsubOrders();
      unsubUsers();
    };
  }, []);

  
  useEffect(() => {
    if (filterDays === null) {
      
      setFilteredOrders(orders);
    } else {
      const now = new Date();
      const cutoffDate = new Date(now.getTime() - filterDays * 24 * 60 * 60 * 1000);
      
      const filtered = orders.filter(order => {
        if (!order.createdAt) return false;
        
        let orderDate;
        if (order.createdAt.toDate) {
          orderDate = order.createdAt.toDate();
        } else if (order.createdAt instanceof Date) {
          orderDate = order.createdAt;
        } else {
          return false;
        }
        
        return orderDate >= cutoffDate;
      });
      
      setFilteredOrders(filtered);
    }
  }, [orders, filterDays]);

  
  useEffect(() => {
    const total = filteredOrders.length;
    const completed = filteredOrders.filter((o) => o.status === "Completed").length;
    const toPay = filteredOrders.filter((o) => o.status === "To Pay").length;

    setTotalOrders(total);
    setCompletedOrders(completed);
    setToPay(toPay);

    
    const completedQuery = query(
      collection(db, 'cartItems'),
      where('status', '==', 'Returned')
    );

    const unsubscribeCompleted = onSnapshot(completedQuery, (snapshot) => {
      const cancelledOrders = snapshot.size;

      setStats({
        cancelledOrders
      });
    });

    
    const kindergarten = filteredOrders.filter((o) => 
      o.items && o.items.some(item => item.grdLevel === "Kindergarten")
    ).length;
    
    const elementary = filteredOrders.filter((o) => 
      o.items && o.items.some(item => item.grdLevel === "Elementary" || item.grdLevel === "Primary")
    ).length;
    
    const juniorHigh = filteredOrders.filter((o) => 
      o.items && o.items.some(item => item.grdLevel === "Junior High" || item.grdLevel === "JHS")
    ).length;

    setGradeDistribution({ 
      Kindergarten: kindergarten, 
      Elementary: elementary, 
      "Junior High": juniorHigh 
    });

    return () => unsubscribeCompleted();
  }, [filteredOrders]);

  
  const generatePDFReport = () => {
    try {
      console.log("Starting PDF generation...");
      
      const doc = new jsPDF();
      
      
      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      doc.text("Fit4School - Sales Report", 14, 22);
      
      
      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      const filterText = filterDays === 30 ? "Last Month" : 
                   filterDays === 7 ? "Last 7 Days" : 
                   filterDays === 3 ? "Last 3 Days" : "All Time";
      doc.text(`Report Period: ${filterText}`, 14, 30);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 36);
      
      
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text("Summary Statistics", 14, 46);
      
      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      const summaryData = [
        ["Total Orders", totalOrders.toString()],
        ["Completed Orders", `${completedOrders} (${totalOrders ? Math.round((completedOrders / totalOrders) * 100) : 0}%)`],
        ["To Pay", `${toPay} (${totalOrders ? Math.round((toPay / totalOrders) * 100) : 0}%)`],
        ["Cancelled Orders", stats.cancelledOrders.toString()],
        ["Total Customers", totalCustomers.toString()]
      ];
      
      autoTable(doc, {
        startY: 50,
        head: [["Metric", "Value"]],
        body: summaryData,
        theme: 'grid',
        headStyles: { fillColor: [15, 175, 255] }
      });
      
      
      let finalY = doc.lastAutoTable.finalY;
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text("Grade Level Distribution", 14, finalY + 10);
      
      const gradeData = [
        ["Junior High", gradeDistribution["Junior High"].toString(), `${totalOrders ? Math.round((gradeDistribution["Junior High"]/totalOrders)*100) : 0}%`],
        ["Elementary", gradeDistribution.Elementary.toString(), `${totalOrders ? Math.round((gradeDistribution.Elementary/totalOrders)*100) : 0}%`],
        ["Kindergarten", gradeDistribution.Kindergarten.toString(), `${totalOrders ? Math.round((gradeDistribution.Kindergarten/totalOrders)*100) : 0}%`]
      ];
      
      autoTable(doc, {
        startY: finalY + 14,
        head: [["Grade Level", "Orders", "Percentage"]],
        body: gradeData,
        theme: 'grid',
        headStyles: { fillColor: [15, 175, 255] }
      });
      
      
      finalY = doc.lastAutoTable.finalY;
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text("Weekly Sales (Sample Data)", 14, finalY + 10);
      
      const weeklySales = [12000, 19000, 15000, 22000, 18000, 14000, 16000];
      const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const salesData = dayLabels.map((day, idx) => [day, `₱${weeklySales[idx].toLocaleString()}`]);
      
      autoTable(doc, {
        startY: finalY + 14,
        head: [["Day", "Sales"]],
        body: salesData,
        theme: 'grid',
        headStyles: { fillColor: [15, 175, 255] }
      });
      
      
      finalY = doc.lastAutoTable.finalY;
      const totalSales = weeklySales.reduce((s, v) => s + v, 0);
      const avgSales = Math.round(totalSales / 7);
      
      doc.setFontSize(11);
      doc.text(`Total This Week: ₱${totalSales.toLocaleString()}`, 14, finalY + 8);
      doc.text(`Daily Average: ₱${avgSales.toLocaleString()}`, 14, finalY + 14);
      
      
      const filename = `Fit4School_Report_${filterText.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      console.log("Saving PDF as:", filename);
      doc.save(filename);
      
      console.log("PDF generated successfully!");
      alert("Report generated successfully!");
      
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating report. Check console for details.");
    }
  };

  
  const computeHeights = (arr) => {
    if (!arr || arr.length === 0) return [0, 0, 0, 0, 0, 0, 0];
    const max = Math.max(...arr, 1);
    return arr.map((v) => Math.round((v / max) * 100));
  };

  
  const weeklySales = [12000, 19000, 15000, 22000, 18000, 14000, 16000];
  const barHeights = computeHeights(weeklySales);
  
 
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  
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

  return (
    <div className="flex min-h-screen bg-gray-100">
      <ASidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Main Content */}
        <div className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 overflow-x-hidden">
          
          {/* Top Info Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-3">
            {/* Date + Time with real-time clock */}
                      <div className="flex gap-4 mb-6 relative">
                        {/* Date - Clickable */}
                        <div className="relative">
                          <button
                            onClick={() => setShowCalendar(!showCalendar)}
                            className="text-sm flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition"
                          >
                            <img src={calendarGIcon} className="w-5" alt="Calendar" />
                            {formatDate(currentTime)}
                          </button>
            
                          {/* Calendar Dropdown */}
                          {showCalendar && (
                            <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 w-72">
                              <div className="p-4">
                                {/* Calendar Header */}
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
            
                                {/* Calendar Grid */}
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
                                        ${day.isToday ? 'bg-cyan-500 text-white' : ''}
                                        ${day.isCurrentMonth ? 'text-gray-800 hover:bg-gray-100' : 'text-gray-400'}
                                        ${day.fullDate.toDateString() === selectedDate.toDateString() && day.isCurrentMonth ? 'bg-blue-100 text-blue-600' : ''}
                                      `}
                                    >
                                      {day.date}
                                    </button>
                                  ))}
                                </div>
            
                                {/* Today Button */}
                                <div className="mt-4 pt-4 border-t">
                                  <button
                                    onClick={() => {
                                      const today = new Date();
                                      setSelectedDate(today);
                                      setShowCalendar(false);
                                    }}
                                    className="w-full py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600 transition text-sm"
                                  >
                                    Go to Today
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
            
                        {/* Time - Real-time updating */}
                        <div className="text-sm flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-sm border border-gray-200">
                          <img src={clockGIcon} className="w-5" alt="Clock" />
                          <span className="font-mono">{formatTime(currentTime)}</span>
                        </div>
                      </div>

            <div className="flex flex-wrap gap-2 sm:gap-3 sm:ml-auto mb-6">
              <div className="relative inline-block">
              <select
                value={filterDays}
                onChange={(e) => setFilterDays(Number(e.target.value))}
                className="appearance-none focus:outline-green-500 bg-white rounded-lg shadow w-40 px-3 sm:px-4 py-2 pr-8 hover:shadow-md transition cursor-pointer text-xs sm:text-sm font-medium border border-gray-300"
              >
                  <option value={3}> Last 3 days</option>
                  <option value={7}> Last 7 days</option>
                  <option value={30}> Last month</option>
              </select>
              
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 text-xs">▼
              </span>
             </div>
            <button 
               onClick={generatePDFReport}
               className="bg-green-500 text-white rounded-lg shadow px-3 sm:px-4 py-2 hover:bg-green-600 hover:shadow-md transition cursor-pointer"
            >
               <p className="text-xs sm:text-sm font-medium whitespace-nowrap">📄 Generate Report</p>
            </button>
           </div>
          </div>

          {/* Top Stats Widgets */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6 mb-6">
            {/* Total Orders */}
            <div className="bg-white rounded-lg shadow-md p-4 h-30 sm:h-36 md:h-35 transition">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs sm:text-sm font-semibold">Total Orders</h4>
                <img src={packageIcon} alt="Package Icon" className="w-6 h-6 opacity-80" />
              </div>
              <p className="text-2xl text-cyan-500 sm:text-3xl md:text-4xl font-bold">{totalOrders}</p>
              <p className="text-xs text-gray-500 opacity-80 mt-1">{filterDays === null ? 'All time orders' : `Last ${filterDays} days`}</p>
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

            {/* To Pay */}
            <div className="bg-white rounded-lg shadow-md p-4 h-30 sm:h-36 md:h-35 transition">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs sm:text-sm font-semibold">To Pay</h4>
                <img src={hourGlass} alt="Hourglass Icon" className="w-6 h-6 opacity-80" />
              </div>
              <p className="text-2xl text-green-500 sm:text-3xl md:text-4xl font-bold">{toPay}</p>
              <p className="text-xs text-gray-500 opacity-80 mt-1">{totalOrders ? `${Math.round((toPay / totalOrders) * 100)}% of total orders` : "—"}</p>
            </div>

            {/* Cancelled */}
            <div className="bg-white rounded-lg shadow-md p-4 h-30 sm:h-36 md:h-35 transition">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs sm:text-sm font-semibold">Cancelled</h4>
                <img src={checkIcon} alt="checkIcon" className="w-6 h-6 opacity-80" />
              </div>
              <p className="text-2xl text-orange-500 sm:text-3xl md:text-4xl font-bold">{stats.cancelledOrders}</p>
              <p className="text-xs text-gray-500 opacity-80 mt-1">Cancelled orders</p>
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
                          <circle cx="50" cy="50" r="40" fill="none" stroke="#00C951" strokeWidth="20" strokeDasharray={`${dash1} ${circumference - dash1}`} strokeDashoffset="0" />
                          <circle cx="50" cy="50" r="40" fill="none" stroke="#0FAFFF" strokeWidth="20" strokeDasharray={`${dash2} ${circumference - dash2}`} strokeDashoffset={`-${dash1}`} />
                          <circle cx="50" cy="50" r="40" fill="none" stroke="#ef4444" strokeWidth="20" strokeDasharray={`${dash3} ${circumference - dash3}`} strokeDashoffset={`-${dash1 + dash2}`} />
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

export default AReports;