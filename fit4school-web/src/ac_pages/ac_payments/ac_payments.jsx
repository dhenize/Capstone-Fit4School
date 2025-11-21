import React, { useEffect, useState } from 'react';
import AcSidebar from '../../components/ac_sidebar/ac_sidebar.jsx';
import AcTopbar from '../../components/ac_topbar/ac_topbar.jsx';

const AcPayments = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [qrCodeImage, setQrCodeImage] = useState(null);
  const [qrCodePreview, setQrCodePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Mock payment data - Replace with API call
  const [paymentStats, setPaymentStats] = useState({
    pendingPayments: 50,
    paidOrders: 879,
    onlinePayments: 463,
    onsitePayments: 416,
    cashPayments: 46,
    bankPayments: 24,
    onlinePayments2: 56,
  });

  useEffect(() => {
    document.title = "Accountant | Payments - Fit4School";
    
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // TODO: Fetch payment stats from database
  // useEffect(() => {
  //   fetchPaymentStats();
  //   fetchQRCode();
  // }, []);

  // const fetchPaymentStats = async () => {
  //   try {
  //     const response = await fetch('/api/payments/stats');
  //     const data = await response.json();
  //     setPaymentStats(data);
  //   } catch (error) {
  //     console.error('Error fetching payment stats:', error);
  //   }
  // };

  // const fetchQRCode = async () => {
  //   try {
  //     const response = await fetch('/api/qrcode');
  //     const data = await response.json();
  //     setQrCodePreview(data.imageUrl);
  //   } catch (error) {
  //     console.error('Error fetching QR code:', error);
  //   }
  // };

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }

      setQrCodeImage(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setQrCodePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle upload to server
  const handleUploadQRCode = async () => {
    if (!qrCodeImage) {
      alert('Please select an image first');
      return;
    }

    setIsUploading(true);

    // TODO: Replace with actual API call
    // const formData = new FormData();
    // formData.append('qrCode', qrCodeImage);

    try {
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // TODO: Actual API call
      // const response = await fetch('/api/qrcode/upload', {
      //   method: 'POST',
      //   body: formData,
      // });
      // const data = await response.json();

      alert('QR Code uploaded successfully!');
      setQrCodeImage(null);
    } catch (error) {
      console.error('Error uploading QR code:', error);
      alert('Failed to upload QR code');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle delete QR code
  const handleDeleteQRCode = () => {
    if (window.confirm('Are you sure you want to remove this QR code?')) {
      setQrCodePreview(null);
      setQrCodeImage(null);
    }
  };

  // Calculate percentages for pie chart (simplified)
  const totalPayments = paymentStats.onlinePayments + paymentStats.onsitePayments;
  const onlinePercentage = Math.round((paymentStats.onlinePayments / totalPayments) * 100);
  const onsitePercentage = 100 - onlinePercentage;

  // Sales chart data (mock)
  const salesData = [
    { day: 'm', height: 35, value: '₱3.2k' },
    { day: 't', height: 50, value: '₱5.1k' },
    { day: 'w', height: 70, value: '₱7.8k' },
    { day: 'th', height: 85, value: '₱9.2k' },
    { day: 'f', height: 95, value: '₱10.5k' },
    { day: 's', height: 60, value: '₱6.4k' },
    { day: 's', height: 45, value: '₱4.8k' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AcSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <AcTopbar
          onMenuClick={() => setIsSidebarOpen((prev) => !prev)}
          title="Payments"
        />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          <h1 className="text-2xl md:text-3xl font-bold mb-6">Payment Management</h1>
          
          {/* Top Row - Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
            {/* Pending Payments */}
            <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
              <h3 className="text-sm text-gray-600 font-medium mb-2">Pending Payments</h3>
              <p className="text-4xl font-bold text-cyan-500">{paymentStats.pendingPayments}</p>
            </div>

            {/* Paid Orders */}
            <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
              <h3 className="text-sm text-gray-600 font-medium mb-2">Paid Orders</h3>
              <p className="text-4xl font-bold text-cyan-500">{paymentStats.paidOrders}</p>
            </div>

            {/* Payment Method Distribution - Pie Chart */}
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
                
                {/* Simple Pie Chart */}
                <div className="relative w-24 h-24">
                  <svg viewBox="0 0 100 100" className="transform -rotate-90">
                    {/* Online - Cyan */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#22d3ee"
                      strokeWidth="20"
                      strokeDasharray={`${onlinePercentage * 2.51} ${(100 - onlinePercentage) * 2.51}`}
                      strokeDashoffset="0"
                    />
                    {/* On-site - Green */}
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

            {/* QR Code Upload */}
            <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
              <div className="text-center">
                <div className="mb-3">
                 
                </div>

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
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <span className="block w-full bg-cyan-500 text-white py-2 px-3 rounded-lg hover:bg-cyan-600 transition cursor-pointer text-xs font-semibold">
                    {qrCodeImage ? 'Change Image' : 'Upload QR Code'}
                  </span>
                </label>

                {qrCodeImage && (
                  <button
                    onClick={handleUploadQRCode}
                    disabled={isUploading}
                    className="w-full mt-2 bg-green-500 text-white py-2 px-3 rounded-lg hover:bg-green-600 transition text-xs font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isUploading ? 'Uploading...' : '✓ Save QR Code'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Middle Row - Sales Chart & Customers Paid Through */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6">
            {/* Sales Chart */}
            <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-base font-bold text-gray-800">Sales</h4>
                <span className="text-xs bg-cyan-100 text-cyan-600 px-2 py-1 rounded font-semibold">+ 7 this week</span>
              </div>
              
              <div className="flex items-end justify-around h-48 gap-2 border-b border-l border-gray-200 pb-2 pl-2">
                {salesData.map((bar, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1 flex-1 group relative">
                    <div
                      className="w-full bg-gradient-to-t from-cyan-500 to-cyan-400 rounded-t hover:from-cyan-600 hover:to-cyan-500 transition cursor-pointer"
                      style={{ height: `${bar.height}%` }}
                    >
                      <div className="hidden group-hover:block absolute bottom-full mb-2 bg-gray-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap left-1/2 transform -translate-x-1/2">
                        {bar.value}
                      </div>
                    </div>
                    <span className="text-xs text-gray-600 font-semibold">{bar.day}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Customers Paid Through */}
            <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
              <h4 className="text-base font-bold text-gray-800 mb-6">Customers Paid Thru</h4>
              
              <div className="space-y-4">
                {/* Cash */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 font-medium">Cash</span>
                  <span className="text-2xl font-bold text-green-500">{paymentStats.cashPayments}</span>
                </div>

                {/* Bank */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 font-medium">Bank</span>
                  <span className="text-2xl font-bold text-green-500">{paymentStats.bankPayments}</span>
                </div>

                {/* Online */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 font-medium">Online</span>
                  <span className="text-2xl font-bold text-cyan-500">{paymentStats.onlinePayments2}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Transactions Table (Optional) */}
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
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700">#TXN001</td>
                    <td className="px-4 py-3 text-gray-700">Maria Santos</td>
                    <td className="px-4 py-3 text-gray-700">GCash</td>
                    <td className="px-4 py-3 text-gray-700 font-semibold">₱1,250</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                        Completed
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700">#TXN002</td>
                    <td className="px-4 py-3 text-gray-700">Juan Dela Cruz</td>
                    <td className="px-4 py-3 text-gray-700">Cash</td>
                    <td className="px-4 py-3 text-gray-700 font-semibold">₱850</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                        Completed
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700">#TXN003</td>
                    <td className="px-4 py-3 text-gray-700">Anna Reyes</td>
                    <td className="px-4 py-3 text-gray-700">Bank Transfer</td>
                    <td className="px-4 py-3 text-gray-700 font-semibold">₱2,100</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
                        Pending
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AcPayments;
