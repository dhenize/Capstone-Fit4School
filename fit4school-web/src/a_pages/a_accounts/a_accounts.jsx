import React, { useEffect, useState } from 'react';
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../firebase";

import ASidebar from '../../components/a_sidebar/a_sidebar.jsx';
import ATopbar from '../../components/a_topbar/a_topbar.jsx';

import searchIcon from '../../assets/icons/search.png';
import exportIcon from '../../assets/icons/export-icon.png';
import filterIcon from '../../assets/icons/filter-icon.png';

const AAccounts = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // -----------------------------
  // 🔥 Fetch accounts from Firestore
  // -----------------------------
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        setAccounts(data);
      } catch (error) {
        console.error("Error fetching accounts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, []);

  useEffect(() => {
    document.title = "Admin | Accounts - Fit4School";

    const handleResize = () => {
      if (window.innerWidth >= 768) setIsSidebarOpen(true);
      else setIsSidebarOpen(false);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getStatusColor = (status) => {
    const colors = {
      'Active': 'bg-green-100 text-green-800 border-green-300',
      'Unverified': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  // -----------------------------
  // 🔎 Search + Filter
  // -----------------------------
  const filteredAccounts = accounts.filter((acc) => {
    const search = searchText.toLowerCase();

    const matchesSearch =
      (acc.userId || "").toLowerCase().includes(search) ||
      (acc.studentId || "").toLowerCase().includes(search) ||
      (acc.fullName || "").toLowerCase().includes(search) ||
      (acc.email || "").toLowerCase().includes(search) ||
      (acc.mobile || "").includes(search);

    const matchesFilter =
      filterStatus === "All" || acc.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  // -----------------------------
  // 🔽 Sorting
  // -----------------------------
  const sortedAccounts = [...filteredAccounts].sort((a, b) => {
    if (!sortConfig.key) return 0;

    const aVal = a[sortConfig.key] || "";
    const bVal = b[sortConfig.key] || "";

    if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction:
        sortConfig.key === key && sortConfig.direction === "asc"
          ? "desc"
          : "asc",
    });
  };

  // -----------------------------
  // ✔ Checkbox controls
  // -----------------------------
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedAccounts(sortedAccounts.map((acc) => acc.id));
    } else {
      setSelectedAccounts([]);
    }
  };

  const handleSelectAccount = (id) => {
    if (selectedAccounts.includes(id)) {
      setSelectedAccounts(selectedAccounts.filter((accId) => accId !== id));
    } else {
      setSelectedAccounts([...selectedAccounts, id]);
    }
  };

  // -----------------------------
  // 📤 Export CSV
  // -----------------------------
  const handleExport = () => {
    const csvContent = [
      ["User ID", "Student ID", "Full Name", "Email", "Mobile", "Role", "Status"],
      ...sortedAccounts.map(acc => [
        acc.userId,
        acc.studentId,
        acc.fullName,
        acc.email,
        acc.mobile,
        acc.role,
        acc.status
      ])
    ]
      .map(row => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `accounts_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const statuses = ["All", "Active", "Unverified"];

  if (loading) {
    return <div className="p-10 text-center text-gray-600">Loading accounts...</div>;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <ASidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0">
        <ATopbar
          onMenuClick={() => setIsSidebarOpen((prev) => !prev)}
          title="Accounts"
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-6">Accounts</h1>

          {/* Actions Bar */}
          <div className="bg-white rounded-lg shadow mb-4 p-4">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              
              {/* Filter + Export */}
              <div className="flex flex-wrap gap-2">
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm">
                  <img src={filterIcon} className="w-5 h-5" />
                  Filter
                </button>

                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <img src={exportIcon} className="w-5 h-5" />
                  Export
                </button>

                {selectedAccounts.length > 0 && (
                  <span className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold">
                    {selectedAccounts.length} selected
                  </span>
                )}
              </div>

              {/* Search */}
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Search accounts..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <img src={searchIcon} className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-2 mt-4">
              {statuses.map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                    filterStatus === status
                      ? "bg-cyan-500 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-cyan-500 text-white">
                <tr>
                  <th className="px-4 py-3">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={
                        selectedAccounts.length === sortedAccounts.length &&
                        sortedAccounts.length > 0
                      }
                    />
                  </th>

                  <th className="px-4 py-3 cursor-pointer" onClick={() => handleSort("userId")}>
                    User ID
                  </th>
                  <th className="px-4 py-3 cursor-pointer" onClick={() => handleSort("studentId")}>
                    Student ID
                  </th>
                  <th className="px-4 py-3">Full Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Mobile</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {sortedAccounts.length > 0 ? (
                  sortedAccounts.map((acc) => (
                    <tr key={acc.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedAccounts.includes(acc.id)}
                          onChange={() => handleSelectAccount(acc.id)}
                        />
                      </td>

                      <td className="px-4 py-3">{acc.userId}</td>
                      <td className="px-4 py-3">{acc.studentId}</td>
                      <td className="px-4 py-3">{acc.fullName}</td>
                      <td className="px-4 py-3">{acc.email}</td>
                      <td className="px-4 py-3">{acc.mobile}</td>
                      <td className="px-4 py-3">{acc.role}</td>

                      <td className="px-4 py-3">
                        <span
                          className={`px-3 py-1 rounded-full border text-xs font-semibold ${getStatusColor(
                            acc.status
                          )}`}
                        >
                          {acc.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center py-6 text-gray-500">
                      No accounts found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </main>
      </div>
    </div>
  );
};

export default AAccounts;
