import React, { useEffect, useState } from 'react';
import ASidebar from '../../components/a_sidebar/a_sidebar.jsx';
import { useNavigate } from 'react-router-dom';
import { db } from '../../../firebase';
import { collection, getDocs, updateDoc, doc, deleteDoc, query, orderBy, writeBatch } from 'firebase/firestore';

const AUniforms = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [gradeFilter, setGradeFilter] = useState('All');
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [uniforms, setUniforms] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState('success');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  const [selectedImageAlt, setSelectedImageAlt] = useState('');
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(2);
  const [isLoading, setIsLoading] = useState(true);


  const boysCategories = ['Polo', 'Pants', 'Short'];
  const girlsCategories = ['Blouse', 'Skirt'];
  const unisexCategories = ['Full_PE', 'PE_Shirt', 'PE_Pants'];


  const formatDropboxUrl = (url) => {
    if (!url) return '';
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


  useEffect(() => {
    document.title = 'Admin | Uniforms - Fit4School';
    const handleResize = () => setIsSidebarOpen(window.innerWidth >= 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    fetchUniforms();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchUniforms = async () => {
    try {
      setIsLoading(true);
      const uniformsCol = collection(db, 'uniforms');
      const q = query(uniformsCol, orderBy('itemCode', 'asc')); // Changed to sort by itemCode ascending
      const uniformSnapshot = await getDocs(q);
      const uniformList = uniformSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          imageUrl: data.imageUrl || '',
          category: data.category || '',
          gender: data.gender || '',
          grdLevel: data.grdLevel || '',
          sizes: data.sizes || {},
          itemCode: data.itemCode || '',
        }
      });
      setUniforms(uniformList);
      setSelectedItems([]);
    } catch (error) {
      console.error('Error fetching uniforms:', error);
      showNotification('Failed to fetch uniforms', 'error');
    } finally {
      setIsLoading(false);
    }
  };


  const handleImageClick = (imageUrl, altText) => {
    setSelectedImage(formatDropboxUrl(imageUrl));
    setSelectedImageAlt(altText);
    setShowImageModal(true);
  };


  const closeImageModal = () => {
    setShowImageModal(false);
    setSelectedImage('');
    setSelectedImageAlt('');
  };


  const handleSelectItem = (itemId) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter(id => id !== itemId));
    } else {
      setSelectedItems([...selectedItems, itemId]);
    }
  };


  const handleSelectAll = () => {
    if (selectedItems.length === filteredUniforms.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredUniforms.map(item => item.id));
    }
  };


  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) {
      showNotification('No items selected for deletion', 'error');
      return;
    }

    try {
      const batch = writeBatch(db);

      selectedItems.forEach(itemId => {
        const itemRef = doc(db, 'uniforms', itemId);
        batch.delete(itemRef);
      });

      await batch.commit();
      await fetchUniforms();
      setSelectedItems([]);
      setShowBulkDeleteConfirm(false);
      showNotification(`${selectedItems.length} item(s) deleted successfully!`, 'success');
    } catch (error) {
      console.error('Error bulk deleting items:', error);
      showNotification('Failed to delete items', 'error');
    }
  };


  const showNotification = (message, type = 'success') => {
    setModalMessage(message);
    setModalType(type);
    setShowModal(true);
  };


  const closeModal = () => {
    setShowModal(false);
    setConfirmDelete(false);
    setShowBulkDeleteConfirm(false);
    setItemToDelete(null);
    setModalMessage('');
  };

  const filteredUniforms = uniforms.filter(u => {
    const searchTermLower = searchTerm.toLowerCase();
    const itemCode = u.itemCode || '';
    const category = u.category || '';
    const gender = u.gender || '';
    const grdLevel = u.grdLevel || '';

    const matchesSearch =
      itemCode.toLowerCase().includes(searchTermLower) ||
      category.toLowerCase().includes(searchTermLower) ||
      gender.toLowerCase().includes(searchTermLower) ||
      grdLevel.toLowerCase().includes(searchTermLower);

    const matchesType = filterType === 'All' || u.category === filterType;
    const matchesGrade = gradeFilter === 'All' || u.grdLevel === gradeFilter;

    return matchesSearch && matchesType && matchesGrade;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUniforms = filteredUniforms.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUniforms.length / itemsPerPage);

  const startEdit = (item) => {
    setEditingItem(item.id);
    setEditForm({
      ...item,
      sizes: item.sizes ? JSON.stringify(item.sizes) : '{}'
    });
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setEditForm({});
  };


  const saveEdit = async () => {
    if (!editingItem) return;
    try {
      const itemRef = doc(db, 'uniforms', editingItem);

      const updatedData = {
        ...editForm,
        sizes: typeof editForm.sizes === 'string' ? JSON.parse(editForm.sizes) : editForm.sizes,
        imageUrl: editForm.imageUrl || '',
        updatedAt: new Date()
      };

      delete updatedData.id;

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


  const confirmDeleteItem = (itemId) => {
    setItemToDelete(itemId);
    setConfirmDelete(true);
  };


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


  const handleEditChange = (field, value) => {
    const newForm = { ...editForm, [field]: value };

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

  const handleSizeMeasurementChange = (size, field, value) => {
    const sizes = typeof editForm.sizes === 'string' ? JSON.parse(editForm.sizes) : editForm.sizes;
    if (!sizes[size]) {
      sizes[size] = { price: 0, chest: 0, length: 0, hips: 0 };
    }
    sizes[size][field] = parseInt(value) || 0;
    setEditForm(prev => ({ ...prev, sizes: JSON.stringify(sizes) }));
  };

  const handleSizePriceChange = (size, price) => {
    const sizes = typeof editForm.sizes === 'string' ? JSON.parse(editForm.sizes) : editForm.sizes;
    if (!sizes[size]) {
      sizes[size] = { price: 0, chest: 0, length: 0, hips: 0 };
    }
    sizes[size].price = parseInt(price) || 0;
    setEditForm(prev => ({ ...prev, sizes: JSON.stringify(sizes) }));
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <ASidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Success/Error Modal */}
      {showModal && !confirmDelete && !showBulkDeleteConfirm && (
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

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-900/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.954-.833-2.724 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="mt-3 text-lg font-medium text-gray-900">Bulk Delete Items</h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete {selectedItems.length} selected item(s)? This action cannot be undone.
                </p>
              </div>
              <div className="mt-5 flex gap-3">
                <button
                  onClick={closeModal}
                  className="flex-1 inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="flex-1 inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Delete All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image View Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-gray-900/90 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">Uniform Image</h3>
            </div>
            <div className="flex-1 overflow-hidden p-4">
              {selectedImage ? (
                <div className="h-full flex items-center justify-center">
                  <img
                    src={selectedImage}
                    alt={selectedImageAlt}
                    className="max-w-full max-h-[70vh] object-contain"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://via.placeholder.com/800x600/e5e7eb/6b7280?text=No+Image+Available";
                    }}
                  />
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-gray-500">No image available</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t flex justify-between items-center">
              <p className="text-sm text-gray-500 truncate">{selectedImageAlt}</p>
              <button
                onClick={closeImageModal}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main container */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden p-4 sm:p-6 lg:p-8">
          {/* Header & Add button - Responsive */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Uniforms</h1>
            <div className="flex flex-wrap gap-2">
              {selectedItems.length > 0 && (
                <button
                  onClick={() => setShowBulkDeleteConfirm(true)}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 sm:px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 shadow-md text-sm sm:text-base"
                >
                  <span className="text-sm sm:text-base">🗑️</span>
                  <span className="hidden sm:inline">Delete</span> ({selectedItems.length})
                </button>
              )}
              <button
                onClick={() => navigate('/a_uniforms_add')}
                className="bg-cyan-500 hover:bg-blue-500 text-white px-3 sm:px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 shadow-md text-sm sm:text-base"
              >
                <span className="text-sm sm:text-base">+</span>
                <span className="hidden sm:inline">Add New Item</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>
          </div>

          {/* Selection Info Bar */}
          {selectedItems.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-blue-700 font-medium text-sm sm:text-base">
                    {selectedItems.length} item(s) selected
                  </span>
                </div>
                <button
                  onClick={() => setSelectedItems([])}
                  className="text-blue-600 hover:text-blue-800 text-sm sm:text-sm font-medium"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}

          {/* Search & Filter */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search uniforms..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={filterType}
                  onChange={e => setFilterType(e.target.value)}
                  className="w-full sm:w-48 border border-gray-300 rounded-lg px-3 sm:px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                >
                  <option value="All">All Types</option>
                  <option value="Polo">Polo</option>
                  <option value="Pants">Pants</option>
                  <option value="Blouse">Blouse</option>
                  <option value="Skirt">Skirt</option>
                  <option value="Short">Short</option>
                  <option value="Full_PE">Full_PE</option>
                  <option value="PE_Shirt">PE_Shirt</option>
                  <option value="PE_Pants">PE_Pants</option>
                </select>

                {/* Grade Level Filter */}
                <select
                  value={gradeFilter}
                  onChange={e => setGradeFilter(e.target.value)}
                  className="w-full sm:w-48 border border-gray-300 rounded-lg px-3 sm:px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                >
                  <option value="All">All Grades</option>
                  <option value="Kindergarten">Kindergarten</option>
                  <option value="Elementary">Elementary</option>
                  <option value="Junior High">Junior High</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col min-h-0">
            <div className="overflow-x-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
              <table className="min-w-full">
                <thead className="bg-cyan-500 text-white sticky top-0 z-10">
                  <tr>
                    {/* Select All Checkbox */}
                    <th className="py-3 px-2 sm:px-4 text-left text-md font-semibold uppercase w-10 sm:w-12">
                      <input
                        type="checkbox"
                        checked={selectedItems.length === filteredUniforms.length && filteredUniforms.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded cursor-pointer"
                      />
                    </th>

                    {/* Image - Hidden on small screens */}
                    <th className="py-3 px-2 sm:px-4 text-left text-md font-semibold uppercase hidden sm:table-cell w-24">
                      Image
                    </th>

                    {/* Item Code */}
                    <th className="py-3 px-2 sm:px-4 text-left text-md font-semibold uppercase">
                      Item Code
                    </th>

                    {/* Category - Hidden on small screens */}
                    <th className="py-3 px-2 sm:px-4 text-left text-md font-semibold uppercase hidden md:table-cell">
                      Category
                    </th>

                    {/* Gender - Hidden on small screens */}
                    <th className="py-3 px-2 sm:px-4 text-left text-md font-semibold uppercase hidden lg:table-cell">
                      Gender
                    </th>

                    {/* Grade Level - Hidden on small screens */}
                    <th className="py-3 px-2 sm:px-10 text-left text-md font-semibold uppercase hidden lg:table-cell">
                      Grade Level
                    </th>

                    {/* Sizes & Prices (Now includes measurements) */}
                    <th className="py-3 px-2 sm:px-8 text-left text-md font-semibold uppercase">
                      Sizes & Measurements
                    </th>

                    {/* Actions */}
                    <th className="py-3 px-2 sm:px-10 text-left text-md font-semibold uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentUniforms.map(item => (
                    <tr key={item.id} className={`hover:bg-gray-50 ${selectedItems.includes(item.id) ? 'bg-blue-50' : ''}`}>
                      {/* Individual Checkbox */}
                      <td className="py-3 px-2 sm:px-4">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item.id)}
                          onChange={() => handleSelectItem(item.id)}
                          className="w-4 h-4 rounded cursor-pointer"
                        />
                      </td>

                      {/* Image Preview - Hidden on small screens */}
                      <td className="py-3 px-2 sm:px-4 hidden sm:table-cell">
                        {editingItem === item.id ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editForm.imageUrl || ''}
                              onChange={e => handleEditChange('imageUrl', e.target.value)}
                              placeholder="Image URL"
                              className="border border-gray-300 rounded px-2 py-1 w-full text-sm"
                            />
                          </div>
                        ) : (
                          <div className="relative">
                            {item.imageUrl ? (
                              <button
                                onClick={() => handleImageClick(item.imageUrl, item.itemCode || 'Uniform Image')}
                                className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
                              >
                                <img
                                  src={formatDropboxUrl(item.imageUrl)}
                                  alt={item.itemCode || 'Uniform'}
                                  className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "https://via.placeholder.com/80x80/e5e7eb/6b7280?text=No+Image";
                                  }}
                                />
                              </button>
                            ) : (
                              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Item Code */}
                      <td className="py-3 px-2 sm:px-4">
                        {editingItem === item.id ? (
                          <input
                            type="text"
                            value={editForm.itemCode}
                            onChange={e => handleEditChange('itemCode', e.target.value)}
                            className="border border-gray-300 rounded px-2 py-1 w-full text-sm"
                          />
                        ) : (
                          <div className="font-mono text-md font-semibold">{item.itemCode}</div>
                        )}
                      </td>

                      {/* Category - Hidden on small screens */}
                      <td className="py-3 px-2 sm:px-4 hidden md:table-cell">
                        {editingItem === item.id ? (
                          <select
                            value={editForm.category}
                            onChange={e => handleEditChange('category', e.target.value)}
                            className="border border-gray-300 rounded px-2 py-1 w-full text-sm"
                          >
                            <option value="Polo">Polo</option>
                            <option value="Pants">Pants</option>
                            <option value="Short">Short</option>
                            <option value="Blouse">Blouse</option>
                            <option value="Skirt">Skirt</option>
                            <option value="Full_PE">Full_PE</option>
                            <option value="PE_Shirt">PE_Shirt</option>
                            <option value="PE_Pants">PE_Pants</option>
                          </select>
                        ) : (
                          <div className="text-md font-medium">{item.category}</div>
                        )}
                      </td>

                      {/* Gender - Hidden on small screens */}
                      <td className="py-3 px-2 sm:px-4 hidden lg:table-cell">
                        {editingItem === item.id ? (
                          <select
                            value={editForm.gender}
                            onChange={e => handleEditChange('gender', e.target.value)}
                            className="border border-gray-300 rounded px-2 py-1 w-full text-sm"
                          >
                            <option value="Boys">Boys</option>
                            <option value="Girls">Girls</option>
                            <option value="Unisex">Unisex</option>
                          </select>
                        ) : (
                          <div className="text-md font-medium">{item.gender}</div>
                        )}
                      </td>

                      {/* Grade Level - Hidden on small screens */}
                      <td className="py-3 px-2 sm:px-4 hidden lg:table-cell">
                        {editingItem === item.id ? (
                          <select
                            value={editForm.grdLevel}
                            onChange={e => handleEditChange('grdLevel', e.target.value)}
                            className="border border-gray-300 rounded px-2 py-1 w-full text-sm"
                          >
                            <option value="Kindergarten">Kindergarten</option>
                            <option value="Elementary">Elementary</option>
                            <option value="Junior High">Junior High</option>
                          </select>
                        ) : (
                          <div className="text-md font-medium">{item.grdLevel}</div>
                        )}
                      </td>

                      {/* Sizes, Prices & Measurements (Combined column) */}
                      <td className="py-3 px-2 sm:px-4">
                        {editingItem === item.id ? (
                          <div className="space-y-2 max-h-60 overflow-y-auto p-1">
                            {Object.entries(JSON.parse(editForm.sizes || '{}')).map(([size, sizeData]) => (
                              <div key={size} className="border border-gray-200 rounded p-2 bg-gray-50">
                                <div className="font-medium text-sm mb-1">{size}</div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <div className="text-sm text-gray-500">Price</div>
                                    <input
                                      type="number"
                                      value={sizeData.price || 0}
                                      onChange={e => handleSizePriceChange(size, e.target.value)}
                                      className="border border-gray-300 rounded px-2 py-1 w-full text-sm appearance-none"
                                      placeholder="₱"
                                    />
                                  </div>
                                  <div>
                                    <div className="text-sm text-gray-500">Chest</div>
                                    <input
                                      type="number"
                                      value={sizeData.chest || 0}
                                      onChange={e => handleSizeMeasurementChange(size, 'chest', e.target.value)}
                                      className="border border-gray-300 rounded px-2 py-1 w-full text-sm appearance-none"
                                      placeholder="cm"
                                    />
                                  </div>
                                  <div>
                                    <div className="text-sm text-gray-500">Length</div>
                                    <input
                                      type="number"
                                      value={sizeData.length || 0}
                                      onChange={e => handleSizeMeasurementChange(size, 'length', e.target.value)}
                                      className="border border-gray-300 rounded px-2 py-1 w-full text-sm appearance-none"
                                      placeholder="cm"
                                    />
                                  </div>
                                  <div>
                                    <div className="text-sm text-gray-500">Hips</div>
                                    <input
                                      type="number"
                                      value={sizeData.hips || 0}
                                      onChange={e => handleSizeMeasurementChange(size, 'hips', e.target.value)}
                                      className="border border-gray-300 rounded px-2 py-1 w-full text-sm appearance-none"
                                      placeholder="cm"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-1 max-h-60 overflow-y-auto p-1">
                            {Object.entries(item.sizes || {}).map(([size, sizeData]) => (
                              <div key={size} className="border border-gray-200 rounded p-2 bg-gray-50">
                                <div className="flex justify-between items-start">
                                  <div className="font-medium text-sm">{size}</div>
                                  <div className="font-semibold text-green-600 text-sm">₱{sizeData.price || 0}</div>
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                  <div className="grid grid-cols-3 gap-1">
                                    <div>Chest: {sizeData.chest || 0}cm</div>
                                    <div>Length: {sizeData.length || 0}cm</div>
                                    <div>Hips: {sizeData.hips || 0}cm</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-2 sm:px-4">
                        <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                          {editingItem === item.id ? (
                            <>
                              <button
                                onClick={saveEdit}
                                className="bg-green-600 text-white px-2 md:px-3 py-1 rounded text-md md:text-md hover:bg-green-700"
                              >
                                Save
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="bg-gray-500 text-white px-2 md:px-3 py-1 rounded text-md md:text-md hover:bg-gray-600"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEdit(item)}
                                className="bg-green-500 text-white px-2 md:px-3 py-1 rounded text-md md:text-md hover:bg-green-600"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => confirmDeleteItem(item.id)}
                                className="bg-red-500 text-white px-2 md:px-3 py-1 rounded text-md md:text-md hover:bg-red-600"
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

            {/* Pagination */}
            {filteredUniforms.length > 0 && (
              <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                <div className="text-sm text-gray-600">
                  Showing <span className="font-semibold">{indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredUniforms.length)}</span> of <span className="font-semibold">{filteredUniforms.length}</span> uniforms
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>

                  {/* Page numbers */}
                  {(() => {
                    const maxVisiblePages = 5;
                    const pages = [];

                    if (totalPages <= maxVisiblePages) {
                      // Show all pages if total is 5 or less
                      for (let i = 1; i <= totalPages; i++) {
                        pages.push(i);
                      }
                    } else {
                      // Show dynamic range
                      let startPage = Math.max(1, currentPage - 2);
                      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

                      // Adjust start if we're near the end
                      if (endPage - startPage + 1 < maxVisiblePages) {
                        startPage = Math.max(1, endPage - maxVisiblePages + 1);
                      }

                      // First page
                      if (startPage > 1) {
                        pages.push(1);
                        if (startPage > 2) {
                          pages.push('...');
                        }
                      }

                      // Middle pages
                      for (let i = startPage; i <= endPage; i++) {
                        pages.push(i);
                      }

                      // Last page
                      if (endPage < totalPages) {
                        if (endPage < totalPages - 1) {
                          pages.push('...');
                        }
                        pages.push(totalPages);
                      }
                    }

                    return pages.map((page, index) => (
                      page === '...' ? (
                        <span key={`ellipsis-${index}`} className="px-2 py-1 text-gray-500">
                          ...
                        </span>
                      ) : (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1 rounded text-sm ${currentPage === page
                              ? 'bg-cyan-500 text-white'
                              : 'border border-gray-300 hover:bg-gray-100'
                            }`}
                        >
                          {page}
                        </button>
                      )
                    ));
                  })()}

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg mt-30 mb-4">Loading uniforms...</p>
              </div>
            ) : currentUniforms.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg mt-30 mb-4">No uniforms found</p>
                <button
                  onClick={() => navigate('/a_uniforms_add')}
                  className="bg-cyan-500 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
                >
                  Add New Uniform Item
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AUniforms;