import React, { useEffect, useState } from 'react';
import ASidebar from '../../components/a_sidebar/a_sidebar.jsx';
import ATopbar from '../../components/a_topbar/a_topbar.jsx';
import { useNavigate } from 'react-router-dom';
import { db, storage } from '../../../firebase'; 
import { collection, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const AUniforms = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [uniforms, setUniforms] = useState([]);
  const navigate = useNavigate();

  // Fetch uniforms from Firestore
  useEffect(() => {
    document.title = 'Admin | Uniforms - Fit4School';
    const handleResize = () => setIsSidebarOpen(window.innerWidth >= 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    fetchUniforms();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchUniforms = async () => {
    const uniformsCol = collection(db, 'uniforms');
    const uniformSnapshot = await getDocs(uniformsCol);
    const uniformList = uniformSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setUniforms(uniformList);
  };

  // Filter and search
  const filteredUniforms = uniforms.filter(u => {
    const matchesSearch =
      u.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'All' || u.category === filterType;
    return matchesSearch && matchesType;
  });

  // Start editing
  const startEdit = (item) => {
    setEditingItem(item.id);
    setEditForm({ ...item });
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setEditForm({});
  };

  // Save edited item to Firestore
  const saveEdit = async () => {
    if (!editingItem) return;
    const itemRef = doc(db, 'uniforms', editingItem);
    await updateDoc(itemRef, { ...editForm });
    await fetchUniforms();
    setEditingItem(null);
    setEditForm({});
  };

  // Delete item from Firestore
  const deleteItem = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      await deleteDoc(doc(db, 'uniforms', itemId));
      await fetchUniforms();
    }
  };

  // Handle form changes
  const handleEditChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleMeasurementChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      measurements: { ...prev.measurements, [field]: value }
    }));
  };

  // Handle image upload to Firebase Storage
  const handleImageUpload = async (e, itemId) => {
    const file = e.target.files[0];
    if (!file) return;

    const storageRef = ref(storage, `uniforms/${itemId}-${file.name}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);

    setEditForm(prev => ({ ...prev, image_path: downloadURL }));
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <ASidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <ATopbar onMenuClick={() => setIsSidebarOpen(prev => !prev)} title="Uniforms" />
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
                placeholder="Search by item code or type..."
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
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase">Item</th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase">Type & Size</th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase">Stock</th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase">Price</th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase">Measurements</th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredUniforms.map(item => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          {editingItem === item.id ? (
                            <input
                              type="text"
                              value={editForm.itemCode}
                              onChange={e => handleEditChange('itemCode', e.target.value)}
                              className="border border-gray-300 rounded px-2 py-1 w-full"
                            />
                          ) : (
                            item.itemCode
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {editingItem === item.id ? (
                            <input
                              type="text"
                              value={editForm.category}
                              onChange={e => handleEditChange('category', e.target.value)}
                              className="border border-gray-300 rounded px-2 py-1 w-full"
                            />
                          ) : (
                            `${item.category} (${item.sizes})`
                          )}
                        </td>
                        <td className="py-3 px-4">₱{item.price.toFixed(2)}</td>
                        <td className="py-3 px-4">
                          {Object.entries(item.measurements)
                            .map(([key, value]) => `${key}: ${value}cm`)
                            .join(', ')}
                        </td>
                        <td className="py-3 px-4 flex gap-2">
                          {editingItem === item.id ? (
                            <>
                              <button onClick={saveEdit} className="bg-green-600 text-white px-2 py-1 rounded">Save</button>
                              <button onClick={cancelEdit} className="bg-gray-500 text-white px-2 py-1 rounded">Cancel</button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => startEdit(item)} className="bg-cyan-500 text-white px-2 py-1 rounded">Edit</button>
                              <button onClick={() => deleteItem(item.id)} className="bg-red-500 text-white px-2 py-1 rounded">Delete</button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredUniforms.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No uniforms found</p>
                  <button onClick={() => navigate('/a_uniforms_add')} className="mt-2 bg-blue-600 text-white px-4 py-2 rounded">Add New Item</button>
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
