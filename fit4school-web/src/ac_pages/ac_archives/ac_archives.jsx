import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../../firebase';
import AcSidebar from '../../components/ac_sidebar/ac_sidebar.jsx';
import AcTopbar from '../../components/ac_topbar/ac_topbar.jsx';
import searchIcon from '../../assets/icons/search.png';
import exportIcon from '../../assets/icons/export-icon.png';
import filterIcon from '../../assets/icons/filter-icon.png';
import { format } from 'date-fns';

const AcArchives = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    document.title = "Accountant | Archives - Fit4School";

    const handleResize = () => setIsSidebarOpen(window.innerWidth >= 768);
    handleResize();
    window.addEventListener('resize', handleResize);

    fetchOrders();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch orders from Firebase
  const fetchOrders = async () => {
    try {
      const q = query(collection(db, 'orders'), orderBy('orderedTime', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  // Status badge color
  const getStatusColor = (status) => {
    const colors = {
      'Void': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'Refunded': 'bg-orange-100 text-orange-800 border-orange-300',
      'Confirmed': 'bg-blue-100 text-blue-800 border-blue-300',
      'Cancelled': 'bg-pink-100 text-pink-800 border-pink-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  // Filter & search
  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.orderId.toLowerCase().includes(searchText.toLowerCase()) ||
      order.studentId.includes(searchText);

    const matchesFilter = filterStatus === 'All' || order.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  // Sorting
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (!sortConfig.key) return 0;
    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];

    // Format timestamps for comparison
    if (aValue?.toDate) aValue = aValue.toDate();
    if (bValue?.toDate) bValue = bValue.toDate();

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
    if (e.target.checked) setSelectedOrders(sortedOrders.map(order => order.id));
    else setSelectedOrders([]);
  };

  const handleSelectOrder = (id) => {
    if (selectedOrders.includes(id)) setSelectedOrders(selectedOrders.filter(x => x !== id));
    else setSelectedOrders([...selectedOrders, id]);
  };

  const handleExport = () => {
    const csvContent = [
      ['Order ID', 'Student ID', 'Ordered Time', 'Arrival Time', 'Appointment Time', 'Quantity', 'Status'],
      ...sortedOrders.map(order => [
        order.orderId,
        order.studentId,
        order.orderedTime ? format(order.orderedTime.toDate(), 'MMM d yyyy') : '',
        order.arrivalTime ? format(order.arrivalTime.toDate(), 'MMM d yyyy') : '',
        order.appointmentTime ? format(order.appointmentTime.toDate(), 'MMM d yyyy | hh:mm a') : '',
        order.quantity,
        order.status,
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const statuses = ['All', 'Void', 'Cancelled', 'Confirmed', 'Refunded'];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AcSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <AcTopbar onMenuClick={() => setIsSidebarOpen(prev => !prev)} title="Orders" />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          <h1 className="text-2xl md:text-3xl font-bold mb-6">Archives (Payment)</h1>

          {/* Actions Bar */}
          <div className="bg-white rounded-lg shadow mb-4 p-4">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="flex flex-wrap gap-2">
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm">
                  <img src={filterIcon} alt="Filter" className="w-5 h-5" />
                  <span className="font-medium">Filter</span>
                </button>
                <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm">
                  <img src={exportIcon} alt="Export" className="w-5 h-5" />
                  <span className="font-medium">Export</span>
                </button>
                {selectedOrders.length > 0 && (
                  <span className="flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold">
                    {selectedOrders.length} selected
                  </span>
                )}
              </div>

              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                />
                <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <img src={searchIcon} alt="Search" className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex flex-wrap gap-2 mt-4">
              {statuses.map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${filterStatus === status ? 'bg-cyan-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Orders Table */}
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
                    {['orderId', 'studentId', 'orderedTime', 'status'].map(key => (
                      <th
                        key={key}
                        className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-blue-500 transition"
                        onClick={() => handleSort(key)}
                      >
                        <div className="flex items-center gap-1">
                          {key === 'orderId' && 'Order ID'}
                          {key === 'studentId' && 'Student ID'}
                          {key === 'orderedTime' && 'Ordered Time'}
                          {key === 'status' && 'Status'}
                          {sortConfig.key === key && <span>{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>}
                        </div>
                      </th>
                    ))}
                    <th className="px-4 py-3 text-left text-sm font-semibold">Arrival Time</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Appointment Time</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Quantity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sortedOrders.length > 0 ? (
                    sortedOrders.map(order => (
                      <tr key={order.id} className={`hover:bg-gray-50 transition ${selectedOrders.includes(order.id) ? 'bg-blue-50' : ''}`}>
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedOrders.includes(order.id)}
                            onChange={() => handleSelectOrder(order.id)}
                            className="w-4 h-4 rounded cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-800">{order.orderId}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{order.studentId}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{order.orderedTime ? format(order.orderedTime.toDate(), 'MMM d yyyy') : ''}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{order.arrivalTime ? format(order.arrivalTime.toDate(), 'MMM d yyyy') : ''}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{order.appointmentTime ? format(order.appointmentTime.toDate(), 'MMM d yyyy | hh:mm a') : ''}</td>
                        <td className="px-4 py-3 text-sm text-center font-semibold">{order.quantity}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="px-4 py-8 text-center text-gray-500">No orders found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
};

export default AcArchives;
