import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ASidebar from "../../components/a_sidebar/a_sidebar.jsx";
import "../../App.css";
import { db } from "../../../firebase";
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy } from "firebase/firestore";

const AUniformsAdd = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [itemCount, setItemCount] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState('success'); // 'success' or 'error'
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Define category arrays
  const boysCategories = ['Polo', 'Pants', 'Short'];
  const girlsCategories = ['Blouse', 'Skirt'];
  const unisexCategories = ['Full_PE', 'PE_Shirt', 'PE_Pants'];

  const [formData, setFormData] = useState({
    category: "",
    gender: "Boys",
    grdLevel: "Kindergarten",
    sizes: { Small: 200, Medium: 210, Large: 220 },
    measurements: { chest: 60, hips: 0, length: 45 },
    imageUrl: "", // Only using Dropbox URL now
  });

  // Fetch total item count for item code generation
  useEffect(() => {
    const fetchItemCount = async () => {
      try {
        const uniformsCol = collection(db, 'uniforms');
        const q = query(uniformsCol, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        setItemCount(snapshot.size + 1);
      } catch (error) {
        console.error('Error fetching item count:', error);
        showNotification('Failed to fetch item count', 'error');
      }
    };
    fetchItemCount();
  }, []);

  // Show modal notification
  const showNotification = (message, type = 'success') => {
    setModalMessage(message);
    setModalType(type);
    setShowModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setShowCancelConfirm(false);
  };

  // Handle category change with automatic gender assignment
  const handleCategoryChange = (category) => {
    let newGender = formData.gender;
    
    if (boysCategories.includes(category)) {
      newGender = "Boys";
    } else if (girlsCategories.includes(category)) {
      newGender = "Girls";
    } else if (unisexCategories.includes(category)) {
      newGender = "Unisex";
    }
    
    setFormData({
      ...formData,
      category: category,
      gender: newGender
    });
  };

  // Grade Level abbreviations
  const gradeLevelAbbr = {
    "Kindergarten": "Kndr",
    "Elementary": "Elem",
    "Junior High": "Jhs"
  };

  // Generate item code automatically
  const generateItemCode = () => {
    if (!formData.category || !formData.gender || !formData.grdLevel) {
      return "";
    }
    
    const categoryAbbr = formData.category;
    let genderAbbr;
    if (formData.gender === "Boys") {
      genderAbbr = "B";
    } else if (formData.gender === "Girls") {
      genderAbbr = "G";
    } else if (formData.gender === "Unisex") {
      genderAbbr = "Uni";
    } else {
      genderAbbr = formData.gender.substring(0, 1);
    }
    
    const gradeAbbr = gradeLevelAbbr[formData.grdLevel] || formData.grdLevel;
    
    return `${itemCount}-${categoryAbbr}-${genderAbbr}-${gradeAbbr}`;
  };

  const handleSizeChange = (size, price) => {
    setFormData({
      ...formData,
      sizes: {
        ...formData.sizes,
        [size]: parseInt(price) || 0
      }
    });
  };

  const handleMeasurementChange = (key, value) => {
    setFormData({
      ...formData,
      measurements: {
        ...formData.measurements,
        [key]: parseInt(value) || 0
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate Dropbox URL
    if (!formData.imageUrl.includes('dropbox.com')) {
      showNotification("Please use a valid Dropbox URL", 'error');
      return;
    }

    // Ensure the URL ends with ?raw=1 for direct image access
    let imageUrl = formData.imageUrl;
    if (imageUrl.includes('?dl=0')) {
      imageUrl = imageUrl.replace('?dl=0', '?raw=1');
    } else if (!imageUrl.includes('?raw=1')) {
      imageUrl = imageUrl.includes('?') ? 
        imageUrl + '&raw=1' : 
        imageUrl + '?raw=1';
    }

    try {
      // Generate item code
      const itemCode = generateItemCode();

      // Add uniform data to Firestore
      await addDoc(collection(db, "uniforms"), {
        itemCode: itemCode,
        category: formData.category,
        gender: formData.gender,
        grdLevel: formData.grdLevel,
        sizes: formData.sizes,
        measurements: formData.measurements,
        imageUrl: imageUrl,
        createdAt: serverTimestamp(),
      });

      showNotification("Uniform saved successfully!", 'success');
      
      // Navigate back after 2 seconds
      setTimeout(() => {
        navigate("/a_uniforms");
      }, 2000);
    } catch (error) {
      console.error("Error saving uniform:", error);
      showNotification("Failed to save uniform. Please try again.", 'error');
    }
  };

  const handleCancel = () => {
    setShowCancelConfirm(true);
  };

  const confirmCancel = () => {
    navigate("/a_uniforms");
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <ASidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Success/Error Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <div className="text-center">
              <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${modalType === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
                {modalType === 'success' ? (
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <h3 className="mt-3 text-lg font-medium text-gray-900">
                {modalType === 'success' ? 'Success!' : 'Error!'}
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">{modalMessage}</p>
                {modalType === 'success' && (
                  <p className="text-xs text-gray-400 mt-1">Redirecting to uniforms list...</p>
                )}
              </div>
              <div className="mt-5">
                <button
                  onClick={closeModal}
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${modalType === 'success' ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'}`}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-gray-900/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
                <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.954-.833-2.724 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="mt-3 text-lg font-medium text-gray-900">Cancel Confirmation</h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">Are you sure you want to cancel? Any unsaved changes will be lost.</p>
              </div>
              <div className="mt-5 flex gap-3">
                <button
                  onClick={closeModal}
                  className="flex-1 inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Continue Editing
                </button>
                <button
                  onClick={confirmCancel}
                  className="flex-1 inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Yes, Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          isSidebarOpen ? "lg:ml-64" : ""
        }`}
      >

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                Add New Uniform
              </h1>
              <p className="text-gray-600 mt-2">
                Add a new uniform item to your inventory
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-8"
            >
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Uniform Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Category</option>
                      <option value="Polo">Polo</option>
                      <option value="Pants">Pants</option>
                      <option value="Short">Short</option>
                      <option value="Blouse">Blouse</option>
                      <option value="Skirt">Skirt</option>
                      <option value="Full_Uniform">Full_Uniform</option>
                      <option value="Full_PE">Full_PE</option>
                      <option value="PE_Shirt">PE_Shirt</option>
                      <option value="PE_Pants">PE_Pants</option>
                    </select>
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gender <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          gender: e.target.value,
                        })
                      }
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="Boys">Boys</option>
                      <option value="Girls">Girls</option>
                      <option value="Unisex">Unisex</option>
                    </select>
                  </div>

                  {/* Grade Level */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Grade Level <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.grdLevel}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          grdLevel: e.target.value,
                        })
                      }
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="Kindergarten">Kindergarten</option>
                      <option value="Elementary">Elementary</option>
                      <option value="Junior High">Junior High</option>
                    </select>
                  </div>

                  {/* Generated Item Code */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Generated Item Code
                    </label>
                    <input
                      value={generateItemCode()}
                      readOnly
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 text-gray-600 focus:outline-none font-medium font-mono"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Auto-generated: [Number]-[Category]-[Gender]-[Grade Level]
                    </p>
                  </div>
                </div>
              </div>

              {/* Sizes and Prices */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
                  Sizes and Prices (₱)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {Object.entries(formData.sizes).map(([size, price]) => (
                    <div key={size}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Size {size}
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                          ₱
                        </span>
                        <input
                          type="number"
                          value={price}
                          onChange={(e) => handleSizeChange(size, e.target.value)}
                          className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                          min="0"
                          step="1"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Measurements */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
                  Measurements (in centimeters)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {Object.entries(formData.measurements).map(([key, value]) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                        {key}
                      </label>
                      <input
                        type="number"
                        placeholder={`${key} in cm`}
                        value={value}
                        onChange={(e) => handleMeasurementChange(key, e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                        min="0"
                        step="1"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Image Upload - Dropbox Link */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
                  Uniform Image (Dropbox Link)
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dropbox Image URL <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="url"
                      value={formData.imageUrl}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          imageUrl: e.target.value,
                        })
                      }
                      placeholder="Paste your Dropbox direct link here"
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Get a shareable link from Dropbox: 
                      1. Right-click file in Dropbox → Share → Create link
                      2. Change "?dl=0" at the end to "?raw=1"
                      3. Example: https://www.dropbox.com/s/.../filename.jpg?raw=1
                    </p>
                  </div>

                  {/* Image Preview */}
                  {formData.imageUrl && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Image Preview
                      </label>
                      <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-100 max-w-md">
                        <img
                          src={formData.imageUrl}
                          alt="Preview"
                          className="w-full h-64 object-contain"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://via.placeholder.com/400x300?text=Invalid+Image+URL";
                            e.target.alt = "Invalid image URL";
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Current URL: <span className="font-mono text-xs break-all">{formData.imageUrl}</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  className="flex-1 bg-cyan-500 hover:bg-blue-500 text-white px-8 py-4 rounded-lg font-semibold transition-colors shadow-md"
                >
                  Save Uniform Item
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 border border-gray-300 text-gray-700 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AUniformsAdd;