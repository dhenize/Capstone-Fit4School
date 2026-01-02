import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { db } from '../../../firebase';
import SupSidebar from '../../components/sup_sidebar/sup_sidebar';
import searchIcon from '../../assets/icons/search.png';
import exportIcon from '../../assets/icons/export-icon.png';
import importIcon from '../../assets/icons/import.png';
import * as XLSX from 'xlsx';

const SupStudent = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [students, setStudents] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [importing, setImporting] = useState(false);

  // Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Confirmation modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState('');

  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Function to generate user ID for parents
  const generateUserId = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const randomNum = Math.floor(100 + Math.random() * 900);
    return `USR${year}${month}@${randomNum}`;
  };

  // Function to generate temporary password for parents
  const generateTemporaryPassword = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const specialChars = '!@#$%^&*';
    const randomSpecialChar = specialChars[Math.floor(Math.random() * specialChars.length)];

    return `${year}${month}USER${randomNum}${randomSpecialChar}`;
  };

  // Fetch students and accounts
  const fetchStudentsAndAccounts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch students
      const studentsCol = collection(db, 'students');
      const studentSnapshot = await getDocs(studentsCol);
      const studentList = studentSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Fetch accounts to get guardian details
      const accountsCol = collection(db, 'accounts');
      const accountSnapshot = await getDocs(accountsCol);
      const accountList = accountSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setStudents(studentList);
      setAccounts(accountList);

    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load student data');
    } finally {
      setLoading(false);
    }
  };

  // Get guardian details for a student
  const getGuardianDetails = (guardianId) => {
    const guardian = accounts.find(acc => acc.userId === guardianId);
    if (guardian) {
      return {
        name: guardian.parent_fullname || 'Unknown',
        role: guardian.role || 'Guardian',
        email: guardian.email || 'N/A'
      };
    }
    return { name: 'Unknown', role: 'Guardian', email: 'N/A' };
  };

  // Show confirmation modal
  const showConfirmation = (action, student, message) => {
    setConfirmAction(() => action);
    setConfirmMessage(message);
    setSelectedStudent(student);
    setShowConfirmModal(true);
  };

  // Show success modal
  const showSuccess = (message) => {
    setSuccessMessage(message);
    setShowSuccessModal(true);
  };

  // Delete student (move to archived)
  const handleDeleteStudent = async (student) => {
    try {
      await updateDoc(doc(db, 'students', student.id), {
        status: 'deleted',
        archivedAt: new Date(),
        updated_at: new Date()
      });

      showSuccess('Student moved to archived successfully');
      await fetchStudentsAndAccounts();
    } catch (err) {
      console.error('Error deleting student:', err);
      showSuccess('Failed to delete student');
    }
  };

  // View student info
  const handleViewStudent = (student) => {
    setSelectedStudent(student);
    setShowViewModal(true);
  };

  // Format date for display
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';

    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (err) {
      return 'Invalid date';
    }
  };

  // Handle import of student data with parent account creation
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
      console.log('Processing file:', file.name);

      const fileExtension = file.name.split('.').pop().toLowerCase();
      let importData = [];

      if (fileExtension === 'csv') {
        importData = await processCSVFile(file);
      } else if (['xlsx', 'xls'].includes(fileExtension)) {
        importData = await processExcelFile(file);
      } else {
        showSuccess('Unsupported file format. Please use CSV or Excel files.');
        return;
      }

      console.log('Raw data from file:', importData);

      if (importData.length === 0) {
        showSuccess('No data found in the file. Please check the file format.');
        return;
      }

      // Process import data and create parent accounts
      await processStudentImport(importData);

    } catch (error) {
      console.error('Error processing import file:', error);
      showSuccess('Error processing file: ' + error.message);
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
          const lines = csvText.split('\n').filter(line => line.trim() !== '');
          if (lines.length === 0) {
            resolve([]);
            return;
          }

          const headers = lines[0].split(',').map(header =>
            header.trim().replace(/^"|"$/g, '').toLowerCase().replace(/\s+/g, '_')
          );

          const data = lines.slice(1).map((line, index) => {
            const values = line.split(',').map(value => value.trim().replace(/^"|"$/g, ''));
            const row = {};
            headers.forEach((header, i) => {
              row[header] = values[i] || '';
            });
            return row;
          }).filter(row => Object.values(row).some(value => value !== ''));

          resolve(data);
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

          // Standardize headers
          const standardizedData = jsonData.map(row => {
            const standardRow = {};
            Object.keys(row).forEach(key => {
              const standardKey = key.toLowerCase().replace(/\s+/g, '_');
              standardRow[standardKey] = row[key];
            });
            return standardRow;
          });

          resolve(standardizedData);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read Excel file'));
      reader.readAsArrayBuffer(file);
    });
  };

  const processStudentImport = async (importData) => {
    try {
      let successCount = 0;
      let errorCount = 0;
      let parentAccountsCreated = 0;

      // Fetch current accounts before processing to check for existing emails
      const accountsCol = collection(db, 'accounts');
      const accountSnapshot = await getDocs(accountsCol);
      const existingAccounts = accountSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Group students by parent email to avoid duplicate account creation
      const studentsByParent = {};

      // First pass: Group students and validate
      for (const row of importData) {
        try {
          // Extract data from row
          const studentId = String(row.student_id || row.studentid || '');
          const fname = row.first_name || row.fname || row.firstname || '';
          const lname = row.last_name || row.lname || row.lastname || '';
          const gradeLevel = row.grade_level || row.gradelevel || '';
          const schoolLevel = row.school_level || row.schlevel || '';
          const gender = row.gender || '';
          const parentFullName = row.parent_fullname || row.parent_name || '';
          const parentEmail = row.parent_email || row.email || '';
          const parentContact = row.parent_contact_number || row.parent_contact || row.contact || '';
          const relationship = row.relationship_to_child || row.relationship || 'Guardian';

          // Validate required fields
          if (!studentId || studentId === 'undefined' || !fname || !lname || !parentEmail) {
            console.warn('Skipping row due to missing required fields:', row);
            errorCount++;
            continue;
          }

          // Check if student already exists
          const existingStudent = students.find(stu => stu.studentId === studentId);
          if (existingStudent) {
            console.warn(`Student ${studentId} already exists, skipping`);
            errorCount++;
            continue;
          }

          // Add to parent group
          if (!studentsByParent[parentEmail]) {
            studentsByParent[parentEmail] = {
              parentFullName,
              parentEmail,
              parentContact,
              relationship,
              students: []
            };
          }

          studentsByParent[parentEmail].students.push({
            studentId,
            fname,
            lname,
            gradeLevel,
            schoolLevel,
            gender
          });

        } catch (error) {
          console.error('Error processing row:', error);
          errorCount++;
        }
      }

      // Second pass: Create parent accounts and student records
      for (const [parentEmail, parentData] of Object.entries(studentsByParent)) {
        try {
          // Find existing account
          const existingAccount = existingAccounts.find(acc => acc.email === parentEmail);
          let parentUserId = '';
          let firebaseUserId = '';

          if (!existingAccount) {
            // Create new parent account
            parentUserId = generateUserId();
            const tempPassword = generateTemporaryPassword();

            // Create Firebase Authentication user
            const auth = getAuth();
            try {
              const userCredential = await createUserWithEmailAndPassword(
                auth,
                parentEmail,
                tempPassword
              );

              firebaseUserId = userCredential.user.uid;

              // Create account in Firestore
              const accountData = {
                userId: parentUserId,
                parent_fullname: parentData.parentFullName,
                email: parentEmail,
                temporary_password: tempPassword,
                contact_number: parentData.parentContact || '',
                role: parentData.relationship,
                gen_roles: 'USER',
                profile_pic: 'https://www.dropbox.com/scl/fi/f16djxz3v0t2frbzhnmnw/user-green.png?rlkey=bus8r53uo7qofi3st9cysjqc0&st=cjlozcp2&raw=1',
                status: 'active',
                createdAt: new Date(),
                updatedAt: new Date(),
                firebase_uid: firebaseUserId
              };

              await addDoc(collection(db, 'accounts'), accountData);
              parentAccountsCreated++;

              // Update existingAccounts array for subsequent lookups
              existingAccounts.push({
                email: parentEmail,
                userId: parentUserId
              });

            } catch (authError) {
              if (authError.code === 'auth/email-already-in-use') {
                // Email already exists in Firebase Auth but not in our accounts collection
                // Find the Firebase user ID
                const auth = getAuth();
                // You'll need to implement a way to get the existing user
                // For now, skip this account or handle differently
                console.log(`Email ${parentEmail} already exists in Firebase Auth`);
                continue;
              } else {
                throw authError;
              }
            }
          } else {
            parentUserId = existingAccount.userId;
          }

          // Create all student records for this parent
          for (const student of parentData.students) {
            // Create student record
            const studentData = {
              studentId: student.studentId,
              fname: student.fname,
              lname: student.lname,
              grd_level: student.gradeLevel,
              sch_level: getSchoolLevelCategory(student.schoolLevel || student.gradeLevel),
              gender: student.gender.toLowerCase(),
              guardian: parentUserId,
              status: 'active',
              created_at: new Date(),
              updated_at: new Date()
            };

            await addDoc(collection(db, 'students'), studentData);
            successCount++;
          }

        } catch (error) {
          console.error('Error processing parent:', parentEmail, error);
          errorCount += parentData.students.length;
        }
      }

      const message = `Import completed!<br><br>
      Success: ${successCount} students<br>
      Parent Accounts Created: ${parentAccountsCreated}<br>
      Failed: ${errorCount} rows`;

      showSuccess(message);
      await fetchStudentsAndAccounts();

    } catch (error) {
      console.error('Error processing student import:', error);
      showSuccess('Failed to import students: ' + error.message);
    }
  };

  // Get school level category
  const getSchoolLevelCategory = (gradeLevel) => {
    if (!gradeLevel) return 'elementary';

    const level = gradeLevel.toString().toLowerCase();

    if (level.includes('pre-k') || level.includes('kinder')) {
      return 'kindergarten';
    } else if (level.includes('grade 1') || level.includes('grade 2') ||
      level.includes('grade 3') || level.includes('grade 4') ||
      level.includes('grade 5') || level.includes('grade 6')) {
      return 'elementary';
    } else if (level.includes('grade 7') || level.includes('grade 8') ||
      level.includes('grade 9') || level.includes('grade 10')) {
      return 'junior highschool';
    }

    return 'elementary';
  };

  // Export data to Excel with multiple sheets
  const handleExport = () => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const year = now.getFullYear();
    const fileName = `Student_Record(${month}-${day}-${year}).xlsx`;

    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Prepare data for each sheet
    const levelCategories = [
      { name: 'Kindergarten', filter: stu => stu.sch_level === 'kindergarten' && stu.status !== 'deleted' },
      { name: 'Elementary', filter: stu => stu.sch_level === 'elementary' && stu.status !== 'deleted' },
      { name: 'Junior Highschool', filter: stu => stu.sch_level === 'junior highschool' && stu.status !== 'deleted' },
      { name: 'Archived', filter: stu => stu.status === 'deleted' }
    ];

    let hasData = false;

    levelCategories.forEach(({ name, filter }) => {
      const filteredStudents = filteredStudentsList.filter(filter);

      if (filteredStudents.length > 0) {
        hasData = true;
        const worksheetData = [
          ['Student ID', 'First Name', 'Last Name', 'Grade Level', 'School Level', 'Gender', 'Parent/Guardian Name', 'Role to Child'],
          ...filteredStudents.map(stu => {
            const guardian = getGuardianDetails(stu.guardian);
            return [
              stu.studentId,
              stu.fname,
              stu.lname,
              stu.grd_level,
              stu.sch_level,
              stu.gender,
              guardian.name,
              guardian.role
            ];
          })
        ];

        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
        XLSX.utils.book_append_sheet(workbook, worksheet, name);
      }
    });

    if (!hasData) {
      showSuccess('No data to export');
      return;
    }

    // Generate Excel file
    XLSX.writeFile(workbook, fileName);
    showSuccess(`Exported successfully to ${fileName}`);
  };

  // Filter students based on active tab
  const getFilteredStudents = () => {
    let filtered = students.filter(stu => {
      const studentIdStr = stu.studentId ? String(stu.studentId) : '';
      const fnameStr = stu.fname ? String(stu.fname) : '';
      const lnameStr = stu.lname ? String(stu.lname) : '';
      const guardianName = stu.guardian ? getGuardianDetails(stu.guardian).name : '';

      return (
        studentIdStr.toLowerCase().includes(searchText.toLowerCase()) ||
        fnameStr.toLowerCase().includes(searchText.toLowerCase()) ||
        lnameStr.toLowerCase().includes(searchText.toLowerCase()) ||
        guardianName.toLowerCase().includes(searchText.toLowerCase())
      );
    });

    switch (activeTab) {
      case 'Kindergarten':
        return filtered.filter(stu => stu.sch_level === 'kindergarten' && stu.status !== 'deleted');
      case 'Elementary':
        return filtered.filter(stu => stu.sch_level === 'elementary' && stu.status !== 'deleted');
      case 'Junior Highschool':
        return filtered.filter(stu => stu.sch_level === 'junior highschool' && stu.status !== 'deleted');
      case 'Archived':
        return filtered.filter(stu => stu.status === 'deleted');
      default:
        return filtered.filter(stu => stu.status !== 'deleted');
    }
  };

  // Get count for each tab - THIS FUNCTION WAS MISSING
  const getTabCount = (tab) => {
    switch (tab) {
      case 'Kindergarten':
        return students.filter(stu => stu.sch_level === 'kindergarten' && stu.status !== 'deleted').length;
      case 'Elementary':
        return students.filter(stu => stu.sch_level === 'elementary' && stu.status !== 'deleted').length;
      case 'Junior Highschool':
        return students.filter(stu => stu.sch_level === 'junior highschool' && stu.status !== 'deleted').length;
      case 'Archived':
        return students.filter(stu => stu.status === 'deleted').length;
      default:
        return students.filter(stu => stu.status !== 'deleted').length;
    }
  };

  useEffect(() => {
    document.title = "Super Admin | Student - Fit4School";
    fetchStudentsAndAccounts();

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
      'deleted': 'bg-gray-100 text-gray-800 border-gray-300',
    };
    return colors[level] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getGradeLevelDisplay = (grdLevel) => {
    if (!grdLevel) return 'N/A';

    const level = grdLevel.toString().trim();
    const gradeMap = {
      'pre-k': 'Pre-Kinder',
      'kinder': 'Kindergarten',
      'grade 1': 'Grade 1',
      'grade 2': 'Grade 2',
      'grade 3': 'Grade 3',
      'grade 4': 'Grade 4',
      'grade 5': 'Grade 5',
      'grade 6': 'Grade 6',
      'grade 7': 'Grade 7',
      'grade 8': 'Grade 8',
      'grade 9': 'Grade 9',
      'grade 10': 'Grade 10'
    };

    return gradeMap[level.toLowerCase()] || level;
  };

  const filteredStudentsList = getFilteredStudents();

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
              onClick={fetchStudentsAndAccounts}
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
                {/* Import Button */}
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <img src={importIcon} alt="Import" className="w-5 h-5" />
                  <span className="font-medium">Import</span>
                </button>

                {/* Export Button */}
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
                >
                  <img src={exportIcon} alt="Export" className="w-5 h-5" />
                  <span className="font-medium">Export</span>
                </button>
              </div>

              {/* Search Bar */}
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

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 mt-4">
              {['All', 'Kindergarten', 'Elementary', 'Junior Highschool', 'Archived'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === tab
                      ? 'bg-cyan-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  {tab} ({getTabCount(tab)})
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
                    <th className="px-4 py-3 text-left text-sm font-semibold">STUDENT ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">FIRST NAME</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">LAST NAME</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">SCHOOL LEVEL</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">GENDER</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredStudentsList.length > 0 ? (
                    filteredStudentsList.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3 text-sm font-semibold text-gray-800">{student.studentId || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{student.fname || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{student.lname || 'N/A'}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getLevelColor(student.sch_level)}`}>
                            {student.sch_level ? student.sch_level.charAt(0).toUpperCase() + student.sch_level.slice(1) : 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getGenderColor(student.gender)}`}>
                            {student.gender ? student.gender.charAt(0).toUpperCase() + student.gender.slice(1) : 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            {/* View Info Button */}
                            <button
                              onClick={() => handleViewStudent(student)}
                              className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 transition"
                            >
                              View Info
                            </button>

                            {/* Delete Button - Only show for non-archived students */}
                            {student.status !== 'deleted' && (
                              <button
                                onClick={() => showConfirmation(
                                  () => handleDeleteStudent(student),
                                  student,
                                  `Are you sure you want to delete ${student.fname} ${student.lname}? This will archive the student record.`
                                )}
                                className="bg-gray-500 text-white px-3 py-1 rounded text-xs hover:bg-gray-600 transition"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                        No students found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* View Student Info Modal */}
      {showViewModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">Student Details</h3>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* Student Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        STUDENT ID
                      </label>
                      <p className="text-lg font-semibold text-gray-800">{selectedStudent.studentId}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        FIRST NAME
                      </label>
                      <p className="text-lg text-gray-800">{selectedStudent.fname}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        LAST NAME
                      </label>
                      <p className="text-lg text-gray-800">{selectedStudent.lname}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        GRADE LEVEL
                      </label>
                      <p className="text-lg text-gray-800">{getGradeLevelDisplay(selectedStudent.grd_level)}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        SCHOOL LEVEL
                      </label>
                      <p className="text-lg text-gray-800">{selectedStudent.sch_level ? selectedStudent.sch_level.charAt(0).toUpperCase() + selectedStudent.sch_level.slice(1) : 'N/A'}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        GENDER
                      </label>
                      <p className="text-lg text-gray-800">{selectedStudent.gender ? selectedStudent.gender.charAt(0).toUpperCase() + selectedStudent.gender.slice(1) : 'N/A'}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        PARENT/GUARDIAN NAME
                      </label>
                      <p className="text-lg text-gray-800">{getGuardianDetails(selectedStudent.guardian).name}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        ROLE TO CHILD
                      </label>
                      <p className="text-lg text-gray-800">{getGuardianDetails(selectedStudent.guardian).role}</p>
                    </div>
                  </div>
                </div>

                {/* Timestamps */}
                <div className="pt-6 border-t border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-700 mb-4">Timestamps</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        CREATED AT
                      </label>
                      <p className="text-gray-800">{formatDate(selectedStudent.created_at)}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        UPDATED AT
                      </label>
                      <p className="text-gray-800">{formatDate(selectedStudent.updated_at)}</p>
                    </div>

                    {selectedStudent.archivedAt && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">
                          ARCHIVED AT
                        </label>
                        <p className="text-gray-800">{formatDate(selectedStudent.archivedAt)}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-6 border-t border-gray-200">
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setShowViewModal(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                    >
                      Close
                    </button>

                    {selectedStudent.status !== 'deleted' && (
                      <button
                        onClick={() => showConfirmation(
                          () => {
                            handleDeleteStudent(selectedStudent);
                            setShowViewModal(false);
                          },
                          selectedStudent,
                          `Are you sure you want to delete ${selectedStudent.fname} ${selectedStudent.lname}? This will archive the student record.`
                        )}
                        className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                      >
                        Delete Student
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="p-6">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                  <span className="text-yellow-600 text-2xl">!</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Confirm Action</h3>
                <p className="text-sm text-gray-500 mb-6" dangerouslySetInnerHTML={{ __html: confirmMessage }}></p>

                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => {
                      setShowConfirmModal(false);
                      setConfirmAction(null);
                      setConfirmMessage('');
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      confirmAction();
                      setShowConfirmModal(false);
                      setConfirmAction(null);
                      setConfirmMessage('');
                    }}
                    className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="p-6">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                  <span className="text-green-600 text-2xl">✓</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Success</h3>
                <p className="text-sm text-gray-500 mb-6" dangerouslySetInnerHTML={{ __html: successMessage }}></p>

                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupStudent;