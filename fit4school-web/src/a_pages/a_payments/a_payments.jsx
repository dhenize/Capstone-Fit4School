import React, { useEffect, useState } from "react";
import ASidebar from "../../components/a_sidebar/a_sidebar.jsx";
import ATopbar from "../../components/a_topbar/a_topbar.jsx";

// Firebase imports
import { db, storage } from "../../../firebase"; // Ensure firebase.js exports db and storage
import { collection, doc, getDoc, setDoc, getDocs, query, orderBy, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

const APayments = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [qrCodePreview, setQrCodePreview] = useState(null);
  const [qrCodeFile, setQrCodeFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const [paymentStats, setPaymentStats] = useState({
    pendingPayments: 0,
    paidOrders: 0,
    onlinePayments: 0,
    onsitePayments: 0,
    cashPayments: 0,
    bankPayments: 0,
    onlinePayments2: 0,
  });

  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    document.title = "Admin | Payments - Fit4School";

    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch payment stats and QR code from Firebase
  useEffect(() => {
    fetchPaymentStats();
    fetchQRCode();
    fetchTransactions();
  }, []);

  const fetchPaymentStats = async () => {
    try {
      const statsDoc = await getDoc(doc(db, "settings", "paymentStats"));
      if (statsDoc.exists()) {
        setPaymentStats(statsDoc.data());
      }
    } catch (error) {
      console.error("Error fetching payment stats:", error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const q = query(collection(db, "transactions"), orderBy("created_at", "desc"));
      const snapshot = await getDocs(q);
      const txnData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setTransactions(txnData);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  const fetchQRCode = async () => {
    try {
      const qrDoc = await getDoc(doc(db, "settings", "qrCode"));
      if (qrDoc.exists()) {
        setQrCodePreview(qrDoc.data().imageUrl);
      }
    } catch (error) {
      console.error("Error fetching QR code:", error);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB");
      return;
    }

    setQrCodeFile(file);

    const reader = new FileReader();
    reader.onloadend = () => setQrCodePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleUploadQRCode = async () => {
    if (!qrCodeFile) {
      alert("Please select an image first");
      return;
    }

    setIsUploading(true);

    try {
      const storageRef = ref(storage, `qrcodes/${Date.now()}_${qrCodeFile.name}`);
      await uploadBytes(storageRef, qrCodeFile);
      const url = await getDownloadURL(storageRef);

      // Save QR code URL to Firestore
      await setDoc(doc(db, "settings", "qrCode"), { imageUrl: url, updated_at: serverTimestamp() });

      alert("QR Code uploaded successfully!");
      setQrCodeFile(null);
    } catch (error) {
      console.error("Error uploading QR code:", error);
      alert("Failed to upload QR code");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteQRCode = async () => {
    if (!qrCodePreview) return;

    if (!window.confirm("Are you sure you want to delete the QR code?")) return;

    try {
      // Delete from storage if it’s a Firebase URL
      if (qrCodePreview.startsWith("https://")) {
        const fileRef = ref(storage, qrCodePreview);
        await deleteObject(fileRef).catch(() => {}); // Ignore if missing
      }

      await setDoc(doc(db, "settings", "qrCode"), { imageUrl: "" }, { merge: true });
      setQrCodePreview(null);
      setQrCodeFile(null);
    } catch (error) {
      console.error("Error deleting QR code:", error);
      alert("Failed to delete QR code");
    }
  };

  const totalPayments = paymentStats.onlinePayments + paymentStats.onsitePayments || 1;
  const onlinePercentage = Math.round((paymentStats.onlinePayments / totalPayments) * 100);
  const onsitePercentage = 100 - onlinePercentage;

  // Mock sales data (can be calculated dynamically from transactions)
  const salesData = [
    { day: "m", height: 35, value: "₱3.2k" },
    { day: "t", height: 50, value: "₱5.1k" },
    { day: "w", height: 70, value: "₱7.8k" },
    { day: "th", height: 85, value: "₱9.2k" },
    { day: "f", height: 95, value: "₱10.5k" },
    { day: "s", height: 60, value: "₱6.4k" },
    { day: "s", height: 45, value: "₱4.8k" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <ASidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <ATopbar onMenuClick={() => setIsSidebarOpen((prev) => !prev)} title="Payments" />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          <h1 className="text-2xl md:text-3xl font-bold mb-6">Payments</h1>

          {/* Top Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
              <h3 className="text-sm text-gray-600 font-medium mb-2">Pending Payments</h3>
              <p className="text-4xl font-bold text-cyan-500">{paymentStats.pendingPayments}</p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
              <h3 className="text-sm text-gray-600 font-medium mb-2">Paid Orders</h3>
              <p className="text-4xl font-bold text-cyan-500">{paymentStats.paidOrders}</p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
                    <span className="text-xs text-gray-600">Online</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <span className="text-xs text-gray-600">On-site</span>
                  </div>
                </div>

                <div className="relative w-24 h-24">
                  <svg viewBox="0 0 100 100" className="transform -rotate-90">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#22d3ee"
                      strokeWidth="20"
                      strokeDasharray={`${onlinePercentage * 2.51} ${(100 - onlinePercentage) * 2.51}`}
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#4ade80"
                      strokeWidth="20"
                      strokeDasharray={`${onsitePercentage * 2.51} ${(100 - onsitePercentage) * 2.51}`}
                      strokeDashoffset={`-${onlinePercentage * 2.51}`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-700">{onlinePercentage}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* QR Code */}
            <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
              <div className="text-center">
                {qrCodePreview ? (
                  <div className="relative">
                    <img
                      src={qrCodePreview}
                      alt="QR Code"
                      className="w-32 h-32 mx-auto border-2 border-gray-200 rounded-lg object-cover"
                    />
                    <button
                      onClick={handleDeleteQRCode}
                      className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full hover:bg-red-600 flex items-center justify-center text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="w-32 h-32 mx-auto border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                    <span className="text-gray-400 text-xs">No QR Code</span>
                  </div>
                )}

                <label className="block mt-3">
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  <span className="block w-full bg-cyan-500 text-white py-2 px-3 rounded-lg hover:bg-blue-500 transition cursor-pointer text-xs font-semibold">
                    {qrCodeFile ? "Change Image" : "Upload QR Code"}
                  </span>
                </label>

                {qrCodeFile && (
                  <button
                    onClick={handleUploadQRCode}
                    disabled={isUploading}
                    className="w-full mt-2 bg-green-500 text-white py-2 px-3 rounded-lg hover:bg-green-600 transition text-xs font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isUploading ? "Uploading..." : "✓ Save QR Code"}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
            <h4 className="text-base font-bold text-gray-800 mb-4">Recent Transactions</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Transaction ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Method</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {transactions.map((txn) => (
                    <tr key={txn.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-700">{txn.id}</td>
                      <td className="px-4 py-3 text-gray-700">{txn.customerName}</td>
                      <td className="px-4 py-3 text-gray-700">{txn.method}</td>
                      <td className="px-4 py-3 text-gray-700 font-semibold">₱{txn.amount}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            txn.status === "Completed"
                              ? "bg-green-100 text-green-700"
                              : txn.status === "Pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {txn.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default APayments;
