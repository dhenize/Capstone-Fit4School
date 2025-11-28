import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, deleteDoc, addDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../../firebase';
import SupSidebar from '../../components/sup_sidebar/sup_sidebar';
import searchIcon from '../../assets/icons/search.png';
import exportIcon from '../../assets/icons/export-icon.png';
import filterIcon from '../../assets/icons/filter-icon.png';
import importIcon from '../../assets/icons/import.png'; 
import * as XLSX from 'xlsx'; // Add this import for Excel file handling

// Main Component
const SupStudent = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [importing, setImporting] = useState(false);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const studentsCol = collection(db, 'students'); 
      const studentSnapshot = await getDocs(studentsCol);
      const studentList = studentSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setStudents(studentList);
      setError(null);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Failed to load student data');
    } finally {
      setLoading(false);
    }
  };

  const deleteStudent = async (studentId) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await deleteDoc(doc(db, 'students', studentId));
        await fetchStudents();
        alert('Student deleted successfully');
      } catch (err) {
        console.error('Error deleting student:', err);
        alert('Failed to delete student');
      }
    }
  };

  const deleteSelectedStudents = async () => {
    if (selectedStudents.length === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedStudents.length} selected students?`)) {
      try {
        const deletePromises = selectedStudents.map(studentId => 
          deleteDoc(doc(db, 'students', studentId))
        );
        await Promise.all(deletePromises);
        await fetchStudents();
        setSelectedStudents([]);
        alert('Students deleted successfully');
      } catch (err) {
        console.error('Error deleting students:', err);
        alert('Failed to delete students');
      }
    }
  };

  // Import functionality
  const handleImport = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.csv,.xlsx,.xls';
    
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        await processImportFile(file);
      }
    };
    
    fileInput.click();
  };

  const processImportFile = async (file) => {
    try {
      setImporting(true);
      
      const fileExtension = file.name.split('.').pop().toLowerCase();
      let studentData = [];

      if (fileExtension === 'csv') {
        studentData = await processCSVFile(file);
      } else if (['xlsx', 'xls'].includes(fileExtension)) {
        studentData = await processExcelFile(file);
      } else {
        alert('Unsupported file format. Please use CSV or Excel files.');
        return;
      }

      if (studentData.length === 0) {
        alert('No valid student data found in the file.');
        return;
      }

      // Validate and prepare student data
      const validatedStudents = studentData
        .map((student, index) => {
          // Basic validation
          if (!student.studentId || !student.fname || !student.lname) {
            console.warn(`Skipping row ${index + 1}: Missing required fields`);
            return null;
          }

          return {
            studentId: student.studentId.toString().trim(),
            fname: student.fname.toString().trim(),
            lname: student.lname.toString().trim(),
            gender: student.gender ? student.gender.toString().toLowerCase().trim() : '',
            sch_level: student.sch_level ? 
              (Array.isArray(student.sch_level) ? 
                student.sch_level.map(level => level.toString().toLowerCase().trim()) : 
                [student.sch_level.toString().toLowerCase().trim()]
              ) : [],
            createdAt: new Date()
          };
        })
        .filter(student => student !== null);

      if (validatedStudents.length === 0) {
        alert('No valid student records to import.');
        return;
      }

      // Confirm import with user
      if (!window.confirm(`Are you sure you want to import ${validatedStudents.length} students?`)) {
        return;
      }

      // Import to Firestore
      await importStudentsToFirestore(validatedStudents);

    } catch (error) {
      console.error('Error processing import file:', error);
      alert('Error processing file: ' + error.message);
    } finally {
      setImporting(false);
    }
  };

  const processCSVFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const csvText = e.target.result;
          const lines = csvText.split('\n');
          const headers = lines[0].split(',').map(header => header.trim().toLowerCase());
          
          const students = lines.slice(1).map(line => {
            const values = line.split(',').map(value => value.trim());
            if (values.length !== headers.length) return null;
            
            const student = {};
            headers.forEach((header, index) => {
              student[header] = values[index];
            });
            return student;
          }).filter(student => student !== null);
          
          resolve(students);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read CSV file'));
      reader.readAsText(file);
    });
  };

  const processExcelFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          // Normalize column names
          const normalizedData = jsonData.map(row => {
            const normalizedRow = {};
            Object.keys(row).forEach(key => {
              const normalizedKey = key.trim().toLowerCase().replace(/\s+/g, '_');
              normalizedRow[normalizedKey] = row[key];
            });
            return normalizedRow;
          });
          
          resolve(normalizedData);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read Excel file'));
      reader.readAsArrayBuffer(file);
    });
  };

  const importStudentsToFirestore = async (studentsData) => {
    try {
      const batch = writeBatch(db);
      const studentsCollection = collection(db, 'students');

      // Use individual adds instead of batch if you want automatic IDs
      const addPromises = studentsData.map(student => 
        addDoc(studentsCollection, student)
      );

      await Promise.all(addPromises);
      
      alert(`Successfully imported ${studentsData.length} students!`);
      await fetchStudents(); // Refresh the list
      
    } catch (error) {
      console.error('Error importing students to Firestore:', error);
      alert('Failed to import students: ' + error.message);
    }
  };

  useEffect(() => {
    document.title = "Super Admin | Student - Fit4School";
    fetchStudents();

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

  const getGenderColor = (gender) => {
    const colors = {
      'male': 'bg-blue-100 text-blue-800 border-blue-300',
      'female': 'bg-pink-100 text-pink-800 border-pink-300',
    };
    return colors[gender] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getLevelColor = (level) => {
    const colors = {
      'kindergarten': 'bg-purple-100 text-purple-800 border-purple-300',
      'elementary': 'bg-green-100 text-green-800 border-green-300',
      'junior highschool': 'bg-orange-100 text-orange-800 border-orange-300',
    };
    return colors[level] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.studentId?.toLowerCase().includes(searchText.toLowerCase()) ||
      student.fname?.toLowerCase().includes(searchText.toLowerCase()) ||
      student.lname?.toLowerCase().includes(searchText.toLowerCase()) ||
      student.gender?.toLowerCase().includes(searchText.toLowerCase()) ||
      (Array.isArray(student.sch_level) && 
        student.sch_level.some(level => 
          level.toLowerCase().includes(searchText.toLowerCase())
        )
      );

    let matchesFilter = true;
    if (filterStatus !== 'All') {
      if (Array.isArray(student.sch_level)) {
        matchesFilter = student.sch_level.includes(filterStatus);
      } else {
        matchesFilter = student.sch_level === filterStatus;
      }
    }

    return matchesSearch && matchesFilter;
  });

  const sortedStudents = [...filteredStudents].sort((a, b) => {
    if (!sortConfig.key) return 0;

    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];

    if (Array.isArray(aValue)) {
      aValue = aValue.join(', ');
    }
    if (Array.isArray(bValue)) {
      bValue = bValue.join(', ');
    }

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
    if (e.target.checked) {
      setSelectedStudents(sortedStudents.map((student) => student.id)); // Use Firebase document ID
    } else {
      setSelectedStudents([]);
    }
  };

  const handleSelectStudent = (studentId) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter((id) => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };

  const handleExport = () => {
    const csvContent = [
      ['Student ID', 'First Name', 'Last Name', 'Gender', 'School Level'],
      ...sortedStudents.map(student => [
        student.studentId || 'N/A',
        student.fname || 'N/A',
        student.lname || 'N/A',
        student.gender || 'N/A',
        Array.isArray(student.sch_level) ? student.sch_level.join(', ') : student.sch_level || 'N/A',
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const levels = ['All', 'kindergarten', 'elementary', 'junior highschool'];

  const displaySchoolLevels = (schLevel) => {
    if (Array.isArray(schLevel)) {
      return schLevel.map(level => 
        level.charAt(0).toUpperCase() + level.slice(1).replace(/([A-Z])/g, ' $1')
      ).join(', ');
    }
    return schLevel ? schLevel.charAt(0).toUpperCase() + schLevel.slice(1).replace(/([A-Z])/g, ' $1') : 'N/A';
  };

  if (loading || importing) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <SupSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">
              {importing ? 'Importing students...' : 'Loading students...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <SupSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <button 
              onClick={fetchStudents}
              className="bg-cyan-500 text-white px-4 py-2 rounded-lg hover:bg-cyan-600"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SupSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          <h1 className="text-2xl md:text-3xl font-bold mb-6">Student Records</h1>

          {/* Actions Bar */}
          <div className="bg-white rounded-lg shadow mb-4 p-4">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm">
                    <img src={filterIcon} alt="Filter" className="w-5 h-5" />
                    <span className="font-medium">Filter</span>
                  </button>
                </div>

                {/* Import Button */}
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <img src={importIcon} alt="Import" className="w-5 h-5" />
                  <span className="font-medium">Import</span>
                </button>

                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
                >
                  <img src={exportIcon} alt="Export" className="w-5 h-5" />
                  <span className="font-medium">Export</span>
                </button>

                {/* Delete Selected Button */}
                {selectedStudents.length > 0 && (
                  <>
                    <button
                      onClick={deleteSelectedStudents}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm"
                    >
                      <span>Delete Selected ({selectedStudents.length})</span>
                    </button>
                    <span className="flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold">
                      {selectedStudents.length} selected
                    </span>
                  </>
                )}
              </div>

              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                />
                <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <img src={searchIcon} alt="Search" className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-2 mt-4">
              {levels.map((level) => (
                <button
                  key={level}
                  onClick={() => setFilterStatus(level)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                    filterStatus === level
                      ? 'bg-cyan-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1).replace(/([A-Z])/g, ' $1')}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-cyan-500 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedStudents.length === sortedStudents.length && sortedStudents.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded cursor-pointer"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-blue-500 transition" onClick={() => handleSort('studentId')}>
                      <div className="flex items-center gap-1">
                        Student ID
                        {sortConfig.key === 'studentId' && <span>{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-blue-500 transition" onClick={() => handleSort('fname')}>
                      <div className="flex items-center gap-1">
                        First Name
                        {sortConfig.key === 'fname' && <span>{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-blue-500 transition" onClick={() => handleSort('lname')}>
                      <div className="flex items-center gap-1">
                        Last Name
                        {sortConfig.key === 'lname' && <span>{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-blue-500 transition" onClick={() => handleSort('gender')}>
                      <div className="flex items-center gap-1">
                        Gender
                        {sortConfig.key === 'gender' && <span>{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-blue-500 transition" onClick={() => handleSort('sch_level')}>
                      <div className="flex items-center gap-1">
                        School Level
                        {sortConfig.key === 'sch_level' && <span>{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sortedStudents.length > 0 ? (
                    sortedStudents.map((student) => (
                      <tr key={student.id} className={`hover:bg-gray-50 transition ${selectedStudents.includes(student.id) ? 'bg-blue-50' : ''}`}>
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedStudents.includes(student.id)}
                            onChange={() => handleSelectStudent(student.id)}
                            className="w-4 h-4 rounded cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-800">{student.studentId || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{student.fname || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{student.lname || 'N/A'}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getGenderColor(student.gender)}`}>
                            {student.gender ? student.gender.charAt(0).toUpperCase() + student.gender.slice(1) : 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getLevelColor(Array.isArray(student.sch_level) ? student.sch_level[0] : student.sch_level)}`}>
                            {displaySchoolLevels(student.sch_level)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => deleteStudent(student.id)}
                            className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                        No students found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
              <div className="text-sm text-gray-600">
                Showing {sortedStudents.length} of {students.length} students
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 text-sm">
                  Previous
                </button>
                <button className="px-3 py-1 bg-cyan-500 text-white rounded text-sm">
                  1
                </button>
                <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 text-sm">
                  2
                </button>
                <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 text-sm">
                  Next
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SupStudent;