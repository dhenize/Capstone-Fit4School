import React, { useEffect, useState } from 'react';
import ASidebar from '../../components/a_sidebar/a_sidebar.jsx';
import { useNavigate } from 'react-router-dom';
import { db, storage } from '../../../firebase'; 
import { collection, getDocs, updateDoc, doc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const AUniforms = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [uniforms, setUniforms] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState('success'); // 'success' or 'error'
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const navigate = useNavigate();

  // Define category arrays
  const boysCategories = ['Polo', 'Pants', 'Short'];
  const girlsCategories = ['Blouse', 'Skirt'];
  const unisexCategories = ['Full_PE', 'PE_Shirt', 'PE_Pants'];

  // Helper function to format Dropbox URL
  const formatDropboxUrl = (url) => {
    if (!url) return '';
    // Ensure URL has raw=1 parameter for direct image access
    if (url.includes('dropbox.com') && !url.includes('raw=1')) {
      if (url.includes('?dl=0')) {
        return url.replace('?dl=0', '?raw=1');
      } else if (url.includes('?')) {
        return url + '&raw=1';
      } else {
        return url + '?raw=1';
      }
    }
    return url;
  };

  // Fetch uniforms from Firestore
  useEffect(() => {
    document.title = 'Admin | Uniforms - Fit4School';
    const handleResize = () => setIsSidebarOpen(window.innerWidth >= 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    fetchUniforms();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Debug: Log first uniform data
  useEffect(() => {
    if (uniforms.length > 0) {
      console.log('First uniform data:', uniforms[0]);
      console.log('Image URL:', uniforms[0].imageUrl);
    }
  }, [uniforms]);

  const fetchUniforms = async () => {
    try {
      const uniformsCol = collection(db, 'uniforms');
      const q = query(uniformsCol, orderBy('createdAt', 'desc'));
      const uniformSnapshot = await getDocs(q);
      const uniformList = uniformSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Ensure we have all fields
          imageUrl: data.imageUrl || '',
          category: data.category || '',
          gender: data.gender || '',
          grdLevel: data.grdLevel || '',
          sizes: data.sizes || {},
          measurements: data.measurements || {},
          itemCode: data.itemCode || '',
          // Create display sizes string from sizes object
          sizesDisplay: data.sizes ? Object.entries(data.sizes || {}).map(([size, price]) => `${size}: ₱${price}`).join(', ') : 'No sizes'
        }
      });
      setUniforms(uniformList);
    } catch (error) {
      console.error('Error fetching uniforms:', error);
      showNotification('Failed to fetch uniforms', 'error');
    }
  };

  // Show modal notification
  const showNotification = (message, type = 'success') => {
    setModalMessage(message);
    setModalType(type);
    setShowModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setConfirmDelete(false);
    setItemToDelete(null);
    setModalMessage('');
  };

  // Filter and search
  const filteredUniforms = uniforms.filter(u => {
    const matchesSearch =
      u.itemCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.gender?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.grdLevel?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'All' || u.category === filterType;
    
    return matchesSearch && matchesType;
  });

  // Start editing
  const startEdit = (item) => {
    setEditingItem(item.id);
    setEditForm({ 
      ...item,
      // Flatten sizes object for editing
      sizes: item.sizes ? JSON.stringify(item.sizes) : '{}'
    });
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setEditForm({});
  };

  // Save edited item to Firestore
  const saveEdit = async () => {
    if (!editingItem) return;
    try {
      const itemRef = doc(db, 'uniforms', editingItem);
      
      // Prepare updated data
      const updatedData = {
        ...editForm,
        // Parse sizes back to object if it's a string
        sizes: typeof editForm.sizes === 'string' ? JSON.parse(editForm.sizes) : editForm.sizes,
        // Ensure imageUrl is included
        imageUrl: editForm.imageUrl || '',
        updatedAt: new Date()
      };
      
      // Remove the id field if it exists
      delete updatedData.id;
      
      console.log('Saving data:', updatedData); // Debug log
      
      await updateDoc(itemRef, updatedData);
      await fetchUniforms();
      showNotification('Item updated successfully!', 'success');
      setEditingItem(null);
      setEditForm({});
    } catch (error) {
      console.error('Error updating item:', error);
      showNotification('Failed to update item', 'error');
    }
  };

  // Confirm delete
  const confirmDeleteItem = (itemId) => {
    setItemToDelete(itemId);
    setConfirmDelete(true);
  };

  // Delete item from Firestore
  const deleteItem = async () => {
    if (!itemToDelete) return;
    try {
      await deleteDoc(doc(db, 'uniforms', itemToDelete));
      await fetchUniforms();
      showNotification('Item deleted successfully!', 'success');
      closeModal();
    } catch (error) {
      console.error('Error deleting item:', error);
      showNotification('Failed to delete item', 'error');
      closeModal();
    }
  };

  // Handle form changes with automatic gender assignment
  const handleEditChange = (field, value) => {
    const newForm = { ...editForm, [field]: value };
    
    // Automatically set gender based on category
    if (field === 'category') {
      if (boysCategories.includes(value)) {
        newForm.gender = 'Boys';
      } else if (girlsCategories.includes(value)) {
        newForm.gender = 'Girls';
      } else if (unisexCategories.includes(value)) {
        newForm.gender = 'Unisex';
      }
    }
    
    setEditForm(newForm);
  };

  const handleMeasurementChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      measurements: { ...prev.measurements, [field]: parseInt(value) || 0 }
    }));
  };

  // Handle sizes editing
  const handleSizePriceChange = (size, price) => {
    const sizes = typeof editForm.sizes === 'string' ? JSON.parse(editForm.sizes) : editForm.sizes;
    sizes[size] = parseInt(price) || 0;
    setEditForm(prev => ({ ...prev, sizes: JSON.stringify(sizes) }));
  };

  // Get grade level abbreviation
  const getGradeLevelAbbr = (level) => {
    const abbreviations = {
      'Kindergarten': 'Kndr',
      'Elementary': 'Elem',
      'Junior High': 'Jhs'
    };
    return abbreviations[level] || level;
  };

  // Get gender abbreviation
  const getGenderAbbr = (gender) => {
    if (gender === 'Boys') return 'B';
    if (gender === 'Girls') return 'G';
    if (gender === 'Unisex') return 'Uni';
    return gender;
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <ASidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      {/* Success/Error Modal */}
      {showModal && !confirmDelete && (
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

      {/* Single Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-gray-900/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.954-.833-2.724 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="mt-3 text-lg font-medium text-gray-900">Delete Item</h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">Are you sure you want to delete this item? This action cannot be undone.</p>
              </div>
              <div className="mt-5 flex gap-3">
                <button
                  onClick={closeModal}
                  className="flex-1 inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteItem}
                  className="flex-1 inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <div className="flex-1 flex flex-col min-w-0 md:ml-0 transition-all duration-300">
          <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-auto">
            {/* Header & Add button */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Uniforms</h1>
              <button
                onClick={() => navigate('/a_uniforms_add')}
                className="bg-cyan-500 hover:bg-blue-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 shadow-md"
              >
                <span className="text-lg">+</span> Add New Item
              </button>
            </div>

            {/* Search & Filter */}
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col lg:flex-row gap-4 items-center">
              <input
                type="text"
                placeholder="Search by item code, category, gender, or grade level..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg pl-3 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="w-full lg:w-48 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All Types</option>
                <option value="Polo">Polo</option>
                <option value="Pants">Pants</option>
                <option value="Blouse">Blouse</option>
                <option value="Skirt">Skirt</option>
                <option value="Short">Short</option>
                <option value="Vest">Vest</option>
                <option value="Pckg">Package</option>
                <option value="Full_Uniform">Full_Uniform</option>
                <option value="Full_PE">Full_PE</option>
                <option value="PE_Shirt">PE_Shirt</option>
                <option value="PE_Pants">PE_Pants</option>
              </select>
              <button
                onClick={() => { setSearchTerm(''); setFilterType('All'); }}
                className="w-full lg:w-auto px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Clear Filters
              </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-cyan-500 text-white">
                    <tr>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-white uppercase w-24">Image</th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-white uppercase">Item Code</th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-white uppercase">Category</th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-white uppercase">Gender</th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-white uppercase">Grade Level</th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-white uppercase">Sizes & Prices</th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-white uppercase">Measurements</th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-white uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredUniforms.map(item => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        {/* Image Preview */}
                        <td className="py-3 px-4">
                          {editingItem === item.id ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={editForm.imageUrl || ''}
                                onChange={e => handleEditChange('imageUrl', e.target.value)}
                                placeholder="Dropbox Image URL"
                                className="border border-gray-300 rounded px-2 py-1 w-full text-xs"
                              />
                            </div>
                          ) : (
                            <div className="relative">
                              {item.imageUrl ? (
                                <div className="relative group">
                                  <img
                                    src={formatDropboxUrl(item.imageUrl)}
                                    alt={item.itemCode || 'Uniform'}
                                    className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                                    onError={(e) => {
                                      console.error('Image failed to load:', item.imageUrl, 'Formatted URL:', formatDropboxUrl(item.imageUrl));
                                      e.target.onerror = null;
                                      e.target.src = "https://via.placeholder.com/80x80/e5e7eb/6b7280?text=No+Image";
                                      e.target.alt = "Image failed to load";
                                      e.target.className = "w-20 h-20 rounded-lg border border-gray-200 bg-gray-100";
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 rounded-lg transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <button
                                      onClick={() => window.open(formatDropboxUrl(item.imageUrl), '_blank')}
                                      className="text-white bg-black bg-opacity-70 p-1 rounded-full"
                                      title="View full image"
                                    >
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="w-20 h-20 bg-gray-100 rounded-lg border border-gray-200 flex flex-col items-center justify-center">
                                  <svg className="w-6 h-6 text-gray-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  <span className="text-xs text-gray-400">No Image</span>
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        
                        {/* Item Code */}
                        <td className="py-3 px-4 font-mono text-sm">
                          {editingItem === item.id ? (
                            <input
                              type="text"
                              value={editForm.itemCode}
                              onChange={e => handleEditChange('itemCode', e.target.value)}
                              className="border border-gray-300 rounded px-2 py-1 w-full"
                            />
                          ) : (
                            <span className="font-semibold">{item.itemCode}</span>
                          )}
                        </td>
                        
                        {/* Category */}
                        <td className="py-3 px-4">
                          {editingItem === item.id ? (
                            <select
                              value={editForm.category}
                              onChange={e => handleEditChange('category', e.target.value)}
                              className="border border-gray-300 rounded px-2 py-1 w-full"
                            >
                              <option value="Polo">Polo</option>
                              <option value="Pants">Pants</option>
                              <option value="Short">Short</option>
                              <option value="Blouse">Blouse</option>
                              <option value="Skirt">Skirt</option>
                              <option value="Full_Uniform">Full_Uniform</option>
                              <option value="Vest">Vest</option>
                              <option value="Pckg">Package</option>
                              <option value="Full_PE">Full_PE</option>
                              <option value="PE_Shirt">PE_Shirt</option>
                              <option value="PE_Pants">PE_Pants</option>
                            </select>
                          ) : (
                            item.category
                          )}
                        </td>
                        
                        {/* Gender */}
                        <td className="py-3 px-4">
                          {editingItem === item.id ? (
                            <select
                              value={editForm.gender}
                              onChange={e => handleEditChange('gender', e.target.value)}
                              className="border border-gray-300 rounded px-2 py-1 w-full"
                            >
                              <option value="Boys">Boys</option>
                              <option value="Girls">Girls</option>
                              <option value="Unisex">Unisex</option>
                            </select>
                          ) : (
                            item.gender
                          )}
                        </td>
                        
                        {/* Grade Level */}
                        <td className="py-3 px-4">
                          {editingItem === item.id ? (
                            <select
                              value={editForm.grdLevel}
                              onChange={e => handleEditChange('grdLevel', e.target.value)}
                              className="border border-gray-300 rounded px-2 py-1 w-full"
                            >
                              <option value="Kindergarten">Kindergarten</option>
                              <option value="Elementary">Elementary</option>
                              <option value="Junior High">Junior High</option>
                            </select>
                          ) : (
                            item.grdLevel
                          )}
                        </td>
                        
                        {/* Sizes and Prices */}
                        <td className="py-3 px-4">
                          {editingItem === item.id ? (
                            <div className="space-y-2">
                              {Object.entries(JSON.parse(editForm.sizes || '{}')).map(([size, price]) => (
                                <div key={size} className="flex items-center gap-2">
                                  <span className="text-xs font-medium">{size}:</span>
                                  <input
                                    type="number"
                                    value={price}
                                    onChange={e => handleSizePriceChange(size, e.target.value)}
                                    className="border border-gray-300 rounded px-2 py-1 w-20"
                                  />
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm">
                              {item.sizesDisplay}
                            </div>
                          )}
                        </td>
                        
                        {/* Measurements */}
                        <td className="py-3 px-4">
                          {editingItem === item.id ? (
                            <div className="space-y-2">
                              {Object.entries(editForm.measurements || {}).map(([key, value]) => (
                                <div key={key} className="flex items-center gap-2">
                                  <span className="text-xs font-medium">{key}:</span>
                                  <input
                                    type="number"
                                    value={value}
                                    onChange={e => handleMeasurementChange(key, e.target.value)}
                                    className="border border-gray-300 rounded px-2 py-1 w-20"
                                  />
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm">
                              {Object.entries(item.measurements || {}).map(([key, value]) => (
                                <div key={key}>{key}: {value}cm</div>
                              ))}
                            </div>
                          )}
                        </td>
                        
                        {/* Actions */}
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            {editingItem === item.id ? (
                              <>
                                <button 
                                  onClick={saveEdit} 
                                  className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 min-w-[70px]"
                                >
                                  Save
                                </button>
                                <button 
                                  onClick={cancelEdit} 
                                  className="bg-gray-500 text-white px-4 py-2 rounded text-sm hover:bg-gray-600 min-w-[70px]"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button 
                                  onClick={() => startEdit(item)} 
                                  className="bg-green-500 text-white px-4 py-2 rounded text-sm hover:bg-green-600 min-w-[70px]"
                                >
                                  Edit
                                </button>
                                <button 
                                  onClick={() => confirmDeleteItem(item.id)} 
                                  className="bg-red-500 text-white px-4 py-2 rounded text-sm hover:bg-red-600 min-w-[70px]"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredUniforms.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg mb-4">No uniforms found</p>
                  <button 
                    onClick={() => navigate('/a_uniforms_add')} 
                    className="bg-cyan-500 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
                  >
                    Add New Uniform Item
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AUniforms;