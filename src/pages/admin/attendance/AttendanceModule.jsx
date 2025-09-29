// AttendanceModule.jsx
import React, { useState, useEffect } from 'react';
import PropTypes from "prop-types";
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';

// Access API_BASE_URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'; // Fallback for development

// Add token extraction from localStorage
const token = JSON.parse(localStorage.getItem('authToken'));

// Import icons for a consistent look
import { Search, CalendarDays, Users, GraduationCap, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';

const TABS = [
  { label: 'Teachers', value: 'teachers', icon: GraduationCap },
  { label: 'Students', value: 'students', icon: Users },
];

// Define possible attendance statuses for Students - 'Late' is removed for students
// Add "Select Status" as the first option
const studentAttendanceStatuses = ['', 'Present', 'Absent', 'Half Day', 'Leave'];
// Define possible attendance statuses for Teachers
// Add "Select Status" as the first option
const teacherAttendanceStatuses = ['', 'Present', 'Absent', 'Late', 'Half Day', 'Leave'];

// Define predefined comments for 'Leave' and 'Half Day' status
const predefinedComments = [
  "", // Option for no comment selected (displays "Select Comment")
  "Sick Leave",
  "Family Event",
  "Vacation",
  "Emergency",
  "Other"
];

const AttendanceModule = () => {
  const { user } = useAuth();

  // Helper to get today's date in YYYY-mm-dd format
  const getToday = () => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  };
  const [activeTab, setActiveTab] = useState('teachers');
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);

  // Helper to initialize attendance data for a given list of people
  const initialAttendance = (data) =>
    data.reduce((acc, item) => {
      acc[item.id] = { status: '', checkIn: null, checkOut: null, comment: null };
      return acc;
    }, {});

  const [attendanceByDate, setAttendanceByDate] = useState({
    [getToday()]: {
      students: initialAttendance(students),
      teachers: initialAttendance(teachers),
    },
  });
  const [search, setSearch] = useState('');
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [loading, setLoading] = useState(false);

  // Optionally set axios base URL for convenience
  axios.defaults.baseURL = `${API_BASE_URL}/api/`; // Use API_BASE_URL here

  // Fetch students and teachers master data on mount
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [studentsRes, teachersRes] = await Promise.all([
          axios.get('/students', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/teachers', { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        // Map students to expected structure
        const mappedStudents = (studentsRes.data || []).map((s) => ({
          id: s._id || s.user_id || '',
          name: s.full_name || s.name || '',
          studentId: s.admission_number || s.studentId || '',
          class: s.class_id || s.class || '',
          section: s.section || '',
          photo: s.profile_image || s.photo || '',
          ...s,
        }));
        // Map teachers to expected structure
        const mappedTeachers = (teachersRes.data || []).map((t) => ({
          id: t._id || t.user_id || '',
          name: t.full_name || t.name || '',
          teacherId: t.user_id || t.teacherId || '',
          subjects: t.subjects_taught || t.subjects || [],
          photo: t.profile_image || t.photo || '',
          ...t,
        }));
        setStudents(mappedStudents);
        setTeachers(mappedTeachers);
      } catch (err) {
        setStudents([]);
        setTeachers([]);
      }
    };
    fetchMasterData();
  }, []);



  // Update attendanceByDate initialization to use students/teachers from state
  useEffect(() => {
    setAttendanceByDate((prev) => {
      if (!prev[selectedDate]) {
        return {
          ...prev,
          [selectedDate]: {
            students: initialAttendance(students),
            teachers: initialAttendance(teachers),
          },
        };
      }
      return prev;
    });
    // eslint-disable-next-line
  }, [selectedDate, students, teachers]);



  // Define available classes and sections for filtering students
  const classes = Array.from({ length: 10 }, (_, i) => String(i + 1)); // Classes 1 to 10
  const sections = ['A', 'B', 'C', 'D']; // Sections A, B, C, D

  // Fetch attendance from backend when filters change
  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
      try {
        if (activeTab === 'students') {
          const res = await axios.get('/student-attendance/bulk/date', {
            params: {
              date: selectedDate,
              class: selectedClass,
              section: selectedSection,
            },
            headers: { Authorization: `Bearer ${token}` },
          });
          // Map backend data to frontend attendance state
          let backendData = res.data;
          let mappedAttendance = initialAttendance(students);
          if (Array.isArray(backendData)) {
            backendData.forEach((record) => {
              const id = record.student_id?._id || record.student_id || record.id;
              if (id) {
                mappedAttendance[id] = {
                  status: record.status || '',
                  checkIn: record.checkIn || null,
                  checkOut: record.checkOut || null,
                  comment: record.comment || '',
                };
              }
            });
          } else if (backendData && typeof backendData === 'object') {
            // If backend returns an object keyed by studentId
            Object.entries(backendData).forEach(([id, record]) => {
              mappedAttendance[id] = {
                status: record.status || '',
                checkIn: record.checkIn || null,
                checkOut: record.checkOut || null,
                comment: record.comment || '',
              };
            });
          }
          setAttendanceByDate(prev => ({
            ...prev,
            [selectedDate]: {
              ...prev[selectedDate],
              students: mappedAttendance,
              teachers: prev[selectedDate]?.teachers || initialAttendance(teachers),
            }
          }));
        } else {
          const res = await axios.get('/teacher-attendance/bulk/date', {
            params: {
              date: selectedDate,
              // subject: selectedSubject,
            },
            headers: { Authorization: `Bearer ${token}` },
          });
          // Map backend data to frontend attendance state
          let backendData = res.data;
          let mappedAttendance = initialAttendance(teachers);
          if (Array.isArray(backendData)) {
            backendData.forEach((record) => {
              const id = record.teacher_id?._id || record.teacher_id || record.id;
              if (id) {
                mappedAttendance[id] = {
                  status: record.status || '',
                  checkIn: record.checkIn || null,
                  checkOut: record.checkOut || null,
                  comment: record.comment || '',
                };
              }
            });
          } else if (backendData && typeof backendData === 'object') {
            Object.entries(backendData).forEach(([id, record]) => {
              mappedAttendance[id] = {
                status: record.status || '',
                checkIn: record.checkIn || null,
                checkOut: record.checkOut || null,
                comment: record.comment || '',
              };
            });
          }
          setAttendanceByDate(prev => ({
            ...prev,
            [selectedDate]: {
              ...prev[selectedDate],
              teachers: mappedAttendance,
              students: prev[selectedDate]?.students || initialAttendance(students),
            }
          }));
        }
      } catch (error) {
        console.log('No attendance data found for date:', selectedDate);
        // If no data, initialize as before
        setAttendanceByDate(prev => ({
          ...prev,
          [selectedDate]: {
            students: initialAttendance(students),
            teachers: initialAttendance(teachers),
          }
        }));
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
    // eslint-disable-next-line
  }, [selectedDate, selectedClass, selectedSection, selectedSubject, activeTab]);

  // Handle status change for a specific person (student or teacher)
  const handleStatusChange = (type, id, status, providedCheckInTime = null, providedCheckOutTime = null, commentVal = null) => {
    setAttendanceByDate((prev) => {
      const currentPersonData = prev[selectedDate]?.[type]?.[id] || {};
      let newCheckIn = null;
      let newCheckOut = null;
      let newComment = null;

      // Logic based on status
      switch (status) {
        case 'Present':
          // All fields are null for Present
          break;
        case 'Absent':
          newComment = "Not Informed";
          break;
        case 'Late': // Only teachers can be 'Late'
          newCheckIn = providedCheckInTime !== null ? providedCheckInTime : (currentPersonData.checkIn || '09:00');
          break;
        case 'Half Day':
          newCheckOut = providedCheckOutTime !== null ? providedCheckOutTime : (currentPersonData.checkOut || '12:00');
          newComment = commentVal !== null ? commentVal : (currentPersonData.comment || ""); // Add comment for Half Day
          break;
        case 'Leave':
          newComment = commentVal !== null ? commentVal : (currentPersonData.comment || "");
          break;
        case '': // "Select Status" option
          newCheckIn = null;
          newCheckOut = null;
          newComment = null;
          break;
        default:
          break;
      }

      return {
        ...prev,
        [selectedDate]: {
          ...prev[selectedDate],
          [type]: {
            ...prev[selectedDate][type],
            [id]: {
              status: status,
              checkIn: newCheckIn,
              checkOut: newCheckOut,
              comment: newComment,
            },
          },
        },
      };
    });
  };

  // Handle saving attendance data
  const handleSaveAttendance = async () => {
    try {
      if (activeTab === 'students') {
        // Map frontend attendance state to backend format (array of records)
        // Filter out records with empty or invalid status
        const attendanceArray = Object.entries(attendanceByDate[selectedDate].students)
          .filter(([student_id, record]) => record.status && record.status.trim() !== '')
          .map(([student_id, record]) => ({
            student_id,
            status: record.status,
            checkIn: record.checkIn,
            checkOut: record.checkOut,
            comment: record.comment,
            admin_id: user?.profile?._id || user?.profile?.userId || user?.profile?.user_id || '', // Add admin ID
          }));
        
        // Only send if there are valid records
        if (attendanceArray.length > 0) {
          await axios.post(`${API_BASE_URL}/api/student-attendance/bulk`, { // Use API_BASE_URL
            date: selectedDate,
            records: attendanceArray,
          }, {
            headers: { Authorization: `Bearer ${token}` },
          });
        }
      } else {
        // Map frontend attendance state to backend format (array of records)
        // Filter out records with empty or invalid status
        const attendanceArray = Object.entries(attendanceByDate[selectedDate].teachers)
          .filter(([teacher_id, record]) => record.status && record.status.trim() !== '')
          .map(([teacher_id, record]) => ({
            teacher_id,
            status: record.status,
            checkIn: record.checkIn,
            checkOut: record.checkOut,
            comment: record.comment,
            admin_id: user?.profile?._id || user?.profile?.userId || user?.profile?.user_id || '', // Add admin ID
          }));
        
        // Only send if there are valid records
        if (attendanceArray.length > 0) {
          await axios.post(`${API_BASE_URL}/api/teacher-attendance/bulk`, { // Use API_BASE_URL
            date: selectedDate,
            records: attendanceArray,
          }, {
            headers: { Authorization: `Bearer ${token}` },
          });
        }
      }
      // Custom message box instead of alert()
      const messageBox = document.createElement('div');
      messageBox.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      messageBox.innerHTML = `
        <div class="bg-white p-6 rounded-lg shadow-lg text-center">
          <p class="text-lg font-semibold text-gray-800 mb-4">Attendance saved successfully!</p>
          <button id="closeMessageBox" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">OK</button>
        </div>
      `;
      document.body.appendChild(messageBox);
      document.getElementById('closeMessageBox').onclick = () => {
        document.body.removeChild(messageBox);
      };
    } catch (error) {
      // Custom message box instead of alert()
      const messageBox = document.createElement('div');
      messageBox.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      messageBox.innerHTML = `
        <div class="bg-white p-6 rounded-lg shadow-lg text-center">
          <p class="text-lg font-semibold text-red-800 mb-4">Failed to save attendance. Please try again.</p>
          <button id="closeMessageBox" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">OK</button>
        </div>
      `;
      document.body.appendChild(messageBox);
      document.getElementById('closeMessageBox').onclick = () => {
        document.body.removeChild(messageBox);
      };
    }
  };

  // Update filteredStudents and filteredTeachers to use students/teachers from state
  const filteredStudents = students.filter((s) =>
    (selectedClass === '' || s.class === parseInt(selectedClass)) &&
    (selectedSection === '' || s.section === selectedSection) &&
    ((s.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.studentId || '').toLowerCase().includes(search.toLowerCase()))
  );

  const allSubjects = Array.from(new Set(teachers.flatMap(t => t.subjects || [])));

  const filteredTeachers = teachers.filter((t) =>
    (selectedSubject === '' || (t.subjects || []).includes(selectedSubject)) &&
    ((t.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.subjects || []).join(', ').toLowerCase().includes(search.toLowerCase()) ||
      (t.teacherId || '').toLowerCase().includes(search.toLowerCase()))
  );

  // Get current attendance data for the selected date
  const currentAttendance = attendanceByDate[selectedDate] || {
    students: initialAttendance(students),
    teachers: initialAttendance(teachers),
  };

  // Helper function to get status display classes for the dropdown
  const getStatusDisplayClasses = (status) => {
    switch (status) {
      case 'Present': return 'bg-green-50 text-green-800 border-green-300';
      case 'Absent': return 'bg-red-50 text-red-800 border-red-300';
      case 'Late': return 'bg-yellow-50 text-yellow-800 border-yellow-300';
      case 'Half Day': return 'bg-blue-50 text-blue-800 border-blue-300';
      case 'Leave': return 'bg-orange-50 text-orange-800 border-orange-300';
      case '': return 'bg-gray-50 text-gray-800 border-gray-300'; // For "Select Status"
      default: return 'bg-gray-50 text-gray-800 border-gray-300';
    }
  };

  // Helper function to get status icon for the dropdown
  const getStatusIcon = (status) => {
    const size = 16;
    switch (status) {
      case 'Present': return <CheckCircle2 size={size} className="text-green-600" />;
      case 'Absent': return <XCircle size={size} className="text-red-600" />;
      case 'Late': return <Clock size={size} className="text-yellow-600" />;
      case 'Half Day': return <Clock size={size} className="text-blue-600" />;
      case 'Leave': return <AlertCircle size={size} className="text-orange-600" />;
      default: return null;
    }
  };

  // Determine if CheckIn Time column should be shown (only for Teachers tab if Late status is present)
  const showCheckInColumnForTeachers = activeTab === 'teachers' && Object.values(currentAttendance.teachers).some(teacher => teacher.status === 'Late');

  // Determine if CheckOut Time column should be shown for Students
  const showCheckOutColumnForStudents = activeTab === 'students' && Object.values(currentAttendance.students).some(student => student.status === 'Half Day');
  // Determine if CheckOut Time column should be shown for Teachers
  const showCheckOutColumnForTeachers = activeTab === 'teachers' && Object.values(currentAttendance.teachers).some(teacher => teacher.status === 'Half Day');

  // Determine if Comment column should be shown for Students
  const showCommentColumnForStudents = activeTab === 'students' && Object.values(currentAttendance.students).some(
    student => student.status === 'Absent' || student.status === 'Leave' || student.status === 'Half Day' // Added Half Day
  );
  // Determine if Comment column should be shown for Teachers
  const showCommentColumnForTeachers = activeTab === 'teachers' && Object.values(currentAttendance.teachers).some(
    teacher => teacher.status === 'Absent' || teacher.status === 'Leave' || teacher.status === 'Half Day' // Added Half Day
  );

  // Define columns for the student table
  let studentTableColumns = [
    { header: 'Photo', accessor: 'photo', className: 'w-16 px-4 py-3' },
    { header: 'Name', accessor: 'name', className: 'px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider' },
    { header: 'Student ID', accessor: 'studentId', className: 'px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider' },
    { header: 'Class', accessor: 'class', className: 'px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider' },
    { header: 'Section', accessor: 'section', className: 'px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider' },
    { header: 'Status', accessor: 'status', className: 'w-56 px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider' },
  ];
  // Conditionally add CheckOut Time column for students
  if (showCheckOutColumnForStudents) {
    studentTableColumns.push({ header: 'CheckOut Time', accessor: 'checkOut', className: 'px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider' });
  }
  // Conditionally add Comment column for students
  if (showCommentColumnForStudents) {
    studentTableColumns.push({ header: 'Comment', accessor: 'comment', className: 'px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider' });
  }

  // Define columns for the teacher table
  let teacherTableColumns = [
    { header: 'Photo', accessor: 'photo', className: 'w-16 px-4 py-3' },
    { header: 'Name', accessor: 'name', className: 'px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider' },
    { header: 'Emp ID', accessor: 'teacherId', className: 'px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider' },
    { header: 'Status', accessor: 'status', className: 'w-56 px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider' },
  ];
  // Conditionally add CheckIn Time column for teachers
  if (showCheckInColumnForTeachers) {
    teacherTableColumns.push({ header: 'CheckIn Time', accessor: 'checkIn', className: 'px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider' });
  }
  // Conditionally add CheckOut Time column for teachers
  if (showCheckOutColumnForTeachers) {
    teacherTableColumns.push({ header: 'CheckOut Time', accessor: 'checkOut', className: 'px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider' });
  }
  // Conditionally add Comment column for teachers
  if (showCommentColumnForTeachers) {
    teacherTableColumns.push({ header: 'Comment', accessor: 'comment', className: 'px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider' });
  }


  return (
    <div className="px-0 sm:px-2 md:px-4 lg:p-6 flex flex-col gap-2 sm:gap-4 lg:gap-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <CalendarDays size={32} className="text-indigo-600" />
          Attendance Management
        </h1>
        <button
          onClick={() => setShowMobileSearch(!showMobileSearch)}
          className="md:hidden p-2 rounded-full text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Toggle Search"
        >
          <Search size={24} />
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 sm:gap-4 mb-6 border-b border-gray-200 pb-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-t-lg font-medium text-lg transition-colors duration-200
                  ${activeTab === tab.value
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              <Icon size={20} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search Input, Date Selector and Filters (Class/Section or Subject) */}
      <div className="flex flex-col md:flex-row justify-start items-center gap-4 md:gap-8 mb-6">
        {/* Search Input - Desktop */}
        <div className="relative hidden md:block">
          <input
            type="text"
            placeholder={`Search by name, ${activeTab === 'students' ? 'ID' : 'subjects or ID'}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 w-72"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        </div>

        {/* Search Input - Mobile (toggleable) */}
        {showMobileSearch && (
          <div className="relative w-full md:hidden mt-4">
            <input
              type="text"
              placeholder={`Search by name, ${activeTab === 'students' ? 'ID' : 'subjects or ID'}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 w-full"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          </div>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          <label htmlFor="attendance-date" className="font-semibold text-gray-700">Date:</label>
          <input
            id="attendance-date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
          />

          {activeTab === 'students' && (
            <>
              <label htmlFor="attendance-class" className="font-semibold text-gray-700 ml-4">Class:</label>
              <select
                id="attendance-class"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
              >
                <option value="">All Classes</option>
                {classes.map((cls) => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>

              <label htmlFor="attendance-section" className="font-semibold text-gray-700 ml-4">Section:</label>
              <select
                id="attendance-section"
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
              >
                <option value="">All Sections</option>
                {sections.map((sec) => (
                  <option key={sec} value={sec}>{sec}</option>
                ))}
              </select>
            </>
          )}
        </div>
      </div>

      {/* Attendance Table */}
      <div className="overflow-x-auto bg-gray-50 rounded-lg shadow-inner border border-gray-200">
        {activeTab === 'students' ? (
          <Table
            columns={studentTableColumns}
            data={filteredStudents}
            renderRow={(student) => (
              <tr key={student.id} className="border-b border-gray-200 hover:bg-gray-100 transition-colors duration-150">
                <td className="py-3 px-4"><img src={student.photo} alt={student.name} className="w-10 h-10 rounded-full object-cover border border-gray-200 shadow-sm" /></td>
                <td className="py-3 px-4 text-sm text-gray-800 font-medium">{student.name}</td>
                <td className="py-3 px-4 text-sm text-gray-600">{student.studentId}</td>
                <td className="py-3 px-4 text-sm text-gray-600">{student.class}</td>
                <td className="py-3 px-4 text-sm text-gray-600">{student.section}</td>
                <td className="py-3 px-4">
                  <div className="relative flex items-center">
                    <span className="absolute left-3 pointer-events-none">
                      {getStatusIcon(currentAttendance.students[student.id]?.status || '')} {/* Default to empty string for initial state */}
                    </span>
                    <select
                      value={currentAttendance.students[student.id]?.status || ''}
                      onChange={(e) => {
                        const newStatus = e.target.value;
                        const currentCheckIn = currentAttendance.students[student.id]?.checkIn;
                        const currentCheckOut = currentAttendance.students[student.id]?.checkOut;
                        const currentComment = currentAttendance.students[student.id]?.comment;
                        handleStatusChange('students', student.id, newStatus, currentCheckIn, currentCheckOut, currentComment);
                      }}
                      className={`
                          block w-full pl-10 pr-3 py-1.5 rounded-md border text-sm font-medium appearance-none
                          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                          ${getStatusDisplayClasses(currentAttendance.students[student.id]?.status || '')}
                        `}
                    >
                      {/* Use studentAttendanceStatuses for students */}
                      {studentAttendanceStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status === "" ? "Select Status" : status}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
                {showCheckOutColumnForStudents && ( // Use student-specific flag
                  <td className="py-3 px-4">
                    {currentAttendance.students[student.id]?.status === 'Half Day' ? (
                      <input
                        type="time"
                        value={currentAttendance.students[student.id]?.checkOut || '12:00'}
                        onChange={(e) => handleStatusChange('students', student.id, 'Half Day', null, e.target.value, currentAttendance.students[student.id]?.comment)}
                        className="w-24 border rounded px-2 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <span className="text-gray-500 text-sm">--:--</span>
                    )}
                  </td>
                )}
                {showCommentColumnForStudents && ( // Use student-specific flag
                  <td className="py-3 px-4">
                    {currentAttendance.students[student.id]?.status === 'Absent' ? (
                      <span className="text-gray-700 text-sm font-medium">Not Informed</span>
                    ) : (currentAttendance.students[student.id]?.status === 'Leave' || currentAttendance.students[student.id]?.status === 'Half Day') ? ( // Added Half Day
                      <select
                        value={currentAttendance.students[student.id]?.comment || ''}
                        onChange={(e) =>
                          handleStatusChange(
                            'students',
                            student.id,
                            currentAttendance.students[student.id].status,
                            null, // checkIn
                            currentAttendance.students[student.id].checkOut,
                            e.target.value
                          )
                        }
                        className="w-full border rounded px-2 py-1 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        {predefinedComments.map((comment, index) => (
                          <option key={index} value={comment}>
                            {comment === "" ? "Select Comment" : comment}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-gray-500 text-sm">--</span>
                    )}
                  </td>
                )}
              </tr>
            )}
          />
        ) : (
          <Table
            columns={teacherTableColumns}
            data={filteredTeachers}
            renderRow={(teacher) => (
              <tr key={teacher.id} className="border-b border-gray-200 hover:bg-gray-100 transition-colors duration-150">
                <td className="py-3 px-4"><img src={teacher.photo} alt={teacher.name} className="w-10 h-10 rounded-full object-cover border border-gray-200 shadow-sm" /></td>
                <td className="py-3 px-4 text-sm text-gray-800 font-medium">{teacher.name}</td>
                <td className="py-3 px-4 text-sm text-gray-600">{teacher.teacherId}</td>
                <td className="py-3 px-4">
                  <div className="relative flex items-center">
                    <span className="absolute left-3 pointer-events-none">
                      {getStatusIcon(currentAttendance.teachers[teacher.id]?.status || '')} {/* Default to empty string for initial state */}
                    </span>
                    <select
                      value={currentAttendance.teachers[teacher.id]?.status || ''}
                      onChange={(e) => {
                        const newStatus = e.target.value;
                        const currentCheckIn = currentAttendance.teachers[teacher.id]?.checkIn;
                        const currentCheckOut = currentAttendance.teachers[teacher.id]?.checkOut;
                        const currentComment = currentAttendance.teachers[teacher.id]?.comment;
                        handleStatusChange('teachers', teacher.id, newStatus, currentCheckIn, currentCheckOut, currentComment);
                      }}
                      className={`
                          block w-full pl-10 pr-3 py-1.5 rounded-md border text-sm font-medium appearance-none
                          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                          ${getStatusDisplayClasses(currentAttendance.teachers[teacher.id]?.status || '')}
                        `}
                    >
                      {/* Use teacherAttendanceStatuses for teachers */}
                      {teacherAttendanceStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status === "" ? "Select Status" : status}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
                {showCheckInColumnForTeachers && ( // Use teacher-specific flag
                  <td className="py-3 px-4">
                    {currentAttendance.teachers[teacher.id]?.status === 'Late' ? (
                      <input
                        type="time"
                        value={currentAttendance.teachers[teacher.id]?.checkIn || '09:00'}
                        onChange={(e) => handleStatusChange('teachers', teacher.id, 'Late', e.target.value, null, currentAttendance.teachers[teacher.id]?.comment)}
                        className="w-24 border rounded px-2 py-1 text-sm focus:ring-orange-500 focus:border-orange-500"
                      />
                    ) : (
                      <span className="text-gray-500 text-sm">--:--</span>
                    )}
                  </td>
                )}
                {showCheckOutColumnForTeachers && ( // Use teacher-specific flag
                  <td className="py-3 px-4">
                    {currentAttendance.teachers[teacher.id]?.status === 'Half Day' ? (
                      <input
                        type="time"
                        value={currentAttendance.teachers[teacher.id]?.checkOut || '12:00'}
                        onChange={(e) => handleStatusChange('teachers', teacher.id, 'Half Day', null, e.target.value, currentAttendance.teachers[teacher.id]?.comment)}
                        className="w-24 border rounded px-2 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <span className="text-gray-500 text-sm">--:--</span>
                    )}
                  </td>
                )}
                {showCommentColumnForTeachers && ( // Use teacher-specific flag
                  <td className="py-3 px-4">
                    {currentAttendance.teachers[teacher.id]?.status === 'Absent' ? (
                      <span className="text-gray-700 text-sm font-medium">Not Informed</span>
                    ) : (currentAttendance.teachers[teacher.id]?.status === 'Leave' || currentAttendance.teachers[teacher.id]?.status === 'Half Day') ? ( // Added Half Day
                      <select
                        value={currentAttendance.teachers[teacher.id]?.comment || ''}
                        onChange={(e) =>
                          handleStatusChange(
                            'teachers',
                            teacher.id,
                            currentAttendance.teachers[teacher.id].status,
                            currentAttendance.teachers[teacher.id].checkIn,
                            currentAttendance.teachers[teacher.id].checkOut,
                            e.target.value
                          )
                        }
                        className="w-full border rounded px-2 py-1 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        {predefinedComments.map((comment, index) => (
                          <option key={index} value={comment}>
                            {comment === "" ? "Select Comment" : comment}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-gray-500 text-sm">--</span>
                    )}
                  </td>
                )}
              </tr>
            )}
          />
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end mt-6">
        <button
          onClick={handleSaveAttendance}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50 transition duration-200 ease-in-out transform hover:scale-105"
        >
          Save Attendance
        </button>
      </div>
    </div>
  );
};

// Integrated Table Component
function Table({ columns, renderRow, data }) {
  return (
    <table className="w-full mt-4">
      <thead>
        <tr className="text-left text-gray-500 text-sm">
          {columns.map((col) => (
            <th key={col.accessor} className={col.className}>{col.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>{data.map((item) => renderRow(item))}</tbody>
    </table>
  );
}

Table.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.shape({
    header: PropTypes.string.isRequired,
    accessor: PropTypes.string.isRequired,
    className: PropTypes.string
  })).isRequired,
  renderRow: PropTypes.func.isRequired,
  data: PropTypes.array.isRequired
};

export default AttendanceModule;
