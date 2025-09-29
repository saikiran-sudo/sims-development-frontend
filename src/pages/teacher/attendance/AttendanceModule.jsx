// AttendanceModule.jsx
import React, { useState, useEffect } from 'react';
import PropTypes from "prop-types";
import ViewAttendance from './ViewAttendance';
import { attendanceAPI, studentAPI } from '../../../services/api';
import { Search, CalendarDays, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { classAPI } from '../../../services/api';

// Access API_BASE_URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'; // Fallback for development

// const classes = Array.from({ length: 10 }, (_, i) => String(i + 1));
// const sections = ['A', 'B', 'C', 'D'];
const attendanceStatuses = ['', 'Present', 'Absent', 'Half Day', 'Leave'];
const predefinedComments = [
  "", // Option for no comment selected (displays "Select Comment")
  "Sick Leave",
  "Family Event",
  "Vacation",
  "Emergency",
  "Other"
];

const getToday = () => {
  const d = new Date();
  return d.toISOString().slice(0, 10);
};

const AttendanceModule = () => {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({}); // { student_id: { status, checkOut, comment } }
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [search, setSearch] = useState('');
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [currentView, setCurrentView] = useState('AttendanceModule');
  const [loading, setLoading] = useState(false);
  const [classOptions, setClassOptions] = useState([]);
  const [sectionOptions, setSectionOptions] = useState([]);

  useEffect(()=>{
    const fetchClassOptions = async () => {
      const response = await classAPI.getAllClassesUnderMyAdmin();
        // Assuming response.data is an array of class objects with class_name property
        const uniqueClasses = Array.from(
          new Map(
            (response.data || response).map(cls => [
              cls.class_name || cls.name || cls.label || cls.value,
              cls
            ])
          ).values()
        );
        const uniqueSections = Array.from(
          new Map(
            (response.data || response).map(cls => [
              cls.section || cls.name || cls.label || cls.value,
              cls
            ])
          ).values()
        );
        const sectionOptions = uniqueSections.map(section => ({
          label: section.section || section.name || section.label || section.value,
          value: section.section || section.name || section.label || section.value
        }));
        const options = uniqueClasses.map(cls => ({
          label: cls.class_name || cls.name || cls.label || cls.value,
          value: cls.class_name || cls.name || cls.label || cls.value
        }));
        setClassOptions(options);
        setSectionOptions(sectionOptions);
    };
    fetchClassOptions();
  }, []);

  // Fetch all students on mount
  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      try {
        const token = JSON.parse(localStorage.getItem('authToken'));
        // const res = await studentAPI.getAllStudents();
        const res = await axios.get(`${API_BASE_URL}/api/students/under-my-admin`, { headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        } });
        setStudents(res.data || res);
      } catch (err) {
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  // Fetch attendance for selected date
  useEffect(() => {
    const fetchAttendance = async () => {
      if (!selectedDate) return;
      
      setLoading(true);
      try {
        const token = JSON.parse(localStorage.getItem('authToken'));
        
        // Use the new date-range endpoint with the same date for start and end
        const res = await axios.get(`${API_BASE_URL}/api/student-attendance/date-range/under-my-admin`, {
          params: {
            startDate: selectedDate,
            endDate: selectedDate,
            ...(selectedClass && { class_id: selectedClass }),
            ...(selectedSection && { section: selectedSection })
          },
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        // Convert array to { student_id: { status, checkOut, comment } }
        const attMap = {};
        if (res.data && Array.isArray(res.data)) {
          res.data.forEach((rec) => {
            if (rec.student_id && rec.student_id._id) {
              attMap[rec.student_id._id] = {
                status: rec.status || '',
                checkOut: rec.checkOut || null,
                comment: rec.comment || null,
              };
            }
          });
        }
        setAttendance(attMap);
        console.log('Fetched attendance for date:', selectedDate, 'Data:', attMap);
      } catch (err) {
        console.error('Error fetching attendance:', err);
        setAttendance({});
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, [selectedDate, selectedClass, selectedSection]);

  // Function to refresh attendance data
  const refreshAttendance = async () => {
    if (!selectedDate) return;
    
    setLoading(true);
    try {
      const token = JSON.parse(localStorage.getItem('authToken'));
      
      const res = await axios.get(`${API_BASE_URL}/api/student-attendance/date-range/under-my-admin`, {
        params: {
          startDate: selectedDate,
          endDate: selectedDate,
          ...(selectedClass && { class_id: selectedClass }),
          ...(selectedSection && { section: selectedSection })
        },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const attMap = {};
      if (res.data && Array.isArray(res.data)) {
        res.data.forEach((rec) => {
          if (rec.student_id && rec.student_id._id) {
            attMap[rec.student_id._id] = {
              status: rec.status || '',
              checkOut: rec.checkOut || null,
              comment: rec.comment || null,
            };
          }
        });
      }
      setAttendance(attMap);
    } catch (err) {
      console.error('Error refreshing attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter students by class/section and search
  const filteredStudents = students.filter((s) =>
    (selectedClass === '' || s.class_id === selectedClass || s.class_id === parseInt(selectedClass)) &&
    (selectedSection === '' || s.section === selectedSection) &&
    ((s.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.class_id || '').toString().toLowerCase().includes(search.toLowerCase()) ||
      (s.section || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.user_id || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.admission_number || '').toLowerCase().includes(search.toLowerCase()))
  );

  // Handle status change for a student
  const handleStatusChange = (student_id, status, checkOutTime = null, commentVal = null) => {
    setAttendance((prev) => {
      let newComment = prev[student_id]?.comment;
      if (status === 'Absent') {
        newComment = "Not Informed";
      } else if (status === 'Leave' || status === 'Half Day') {
        newComment = commentVal !== null ? commentVal : (prev[student_id]?.comment || "");
      } else {
        newComment = null;
      }
      return {
        ...prev,
        [student_id]: {
          status,
          checkOut: status === 'Half Day' ? (checkOutTime || '12:00') : null,
          comment: newComment,
        },
      };
    });
  };

  // Save attendance to backend
  const handleSaveAttendance = async () => {
    setLoading(true);
    try {
      const token = JSON.parse(localStorage.getItem('authToken'));
      
      // Process each student's attendance individually
      for (const student of filteredStudents) {
        const att = attendance[student._id] || {};
        
        if (att.status && att.status !== '') {
          const attendanceData = {
            student_id: student._id,
            date: selectedDate,
            status: att.status,
            checkIn: null, // Not handled in UI
            checkOut: att.checkOut || null,
            comment: att.comment || '',
          };

          // Make direct axios POST request to the specified endpoint
          await axios.post(`${API_BASE_URL}/api/student-attendance/under-my-admin`, attendanceData, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
        }
      }
      
      // Refresh attendance data after saving
      await refreshAttendance();
      
      // Show success message
      const messageBox = document.createElement('div');
      messageBox.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      messageBox.innerHTML = `
        <div class="bg-white p-6 rounded-lg shadow-lg text-center">
          <p class="text-lg font-semibold text-gray-800 mb-4">Attendance Saved!</p>
          <button id="closeMessageBox" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">OK</button>
        </div>
      `;
      document.body.appendChild(messageBox);
      document.getElementById('closeMessageBox').onclick = () => {
        document.body.removeChild(messageBox);
      };
    } catch (err) {
      console.error('Error saving attendance:', err);
      alert('Failed to save attendance: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleViewChange = (viewName) => {
    setCurrentView(viewName);
  };

  if (currentView === 'ViewAttendance') {
    return <ViewAttendance onViewChange={handleViewChange} />;
  }

  // Attendance for filtered students
  const currentAttendance = {};
  filteredStudents.forEach((student) => {
    currentAttendance[student._id] = attendance[student._id] || { status: '', checkOut: null, comment: null };
  });

  const showCheckOutColumn = Object.values(currentAttendance).some(student => student.status === 'Half Day');
  const showCommentColumn = Object.values(currentAttendance).some(
    student => student.status === 'Absent' || student.status === 'Leave' || student.status === 'Half Day'
  );

  const getStatusDisplayClasses = (status) => {
    switch (status) {
      case 'Present': return 'bg-green-50 text-green-800 border-green-300';
      case 'Absent': return 'bg-red-50 text-red-800 border-red-300';
      case 'Half Day': return 'bg-blue-50 text-blue-800 border-blue-300';
      case 'Leave': return 'bg-yellow-50 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-50 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status) => {
    const size = 16;
    switch (status) {
      case 'Present': return <CheckCircle2 size={size} className="text-green-600" />;
      case 'Absent': return <XCircle size={size} className="text-red-600" />;
      case 'Half Day': return <Clock size={size} className="text-blue-600" />;
      case 'Leave': return <AlertCircle size={size} className="text-yellow-600" />;
      default: return null;
    }
  };

  let tableColumns = [
    { header: 'Photo', accessor: 'photo', className: 'w-16 px-4 py-3' },
    { header: 'Name', accessor: 'name', className: 'px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider' },
    { header: 'Student ID', accessor: 'studentId', className: 'px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider' },
    { header: 'Class', accessor: 'class', className: 'px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider' },
    { header: 'Section', accessor: 'section', className: 'px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider' },
    { header: 'Status', accessor: 'status', className: 'px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider' },
  ];

  if (showCheckOutColumn) {
    tableColumns.push({ header: 'CheckOut Time', accessor: 'checkOut', className: 'px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider' });
  }
  if (showCommentColumn) {
    tableColumns.push({ header: 'Comment', accessor: 'comment', className: 'px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider' });
  }

  return (
    <div className="px-0 sm:px-2 md:px-4 lg:p-6 flex flex-col gap-2 sm:gap-4 lg:gap-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <CalendarDays size={32} className="text-indigo-600" />
          Attendance Management
        </h1>
        <button
          onClick={() => handleViewChange('ViewAttendance')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-200 ease-in-out font-semibold"
        >
          View My Attendance
        </button>
        <button
          onClick={() => setShowMobileSearch(!showMobileSearch)}
          className="md:hidden p-2 rounded-full text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Toggle Search"
        >
          <Search size={24} />
        </button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
        <div className="relative hidden md:block">
          <input
            type="text"
            placeholder="Search by name, class, section or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 w-72"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        </div>
          <label htmlFor="attendance-date" className="font-semibold text-gray-700">Date:</label>
          <input
            id="attendance-date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
          />

          <label htmlFor="attendance-class" className="font-semibold text-gray-700 ml-4">Class:</label>
          <select
            id="attendance-class"
            value={selectedClass}
            onChange={(e) => {
              setSelectedClass(e.target.value);
              refreshAttendance(); // Trigger refresh when class changes
            }}
            className="border border-gray-300 rounded-lg px-4 py-2 text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
          >
            <option value="">All Classes</option>
            {classOptions.map((cls) => (
              <option key={cls.value} value={cls.value}>{cls.label}</option>
            ))}
          </select>

          <label htmlFor="attendance-section" className="font-semibold text-gray-700 ml-4">Section:</label>
          <select
            id="attendance-section"
            value={selectedSection}
            onChange={(e) => {
              setSelectedSection(e.target.value);
              refreshAttendance(); // Trigger refresh when section changes
            }}
            className="border border-gray-300 rounded-lg px-4 py-2 text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
          >
            <option value="">All Sections</option>
            {sectionOptions.map((sec) => (
              <option key={sec.value} value={sec.value}>{sec.label}</option>
            ))}
          </select>
        </div>

        {showMobileSearch && (
          <div className="relative w-full md:hidden mt-4">
            <input
              type="text"
              placeholder="Search by name, class, section or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 w-full"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          </div>
        )}
      </div>

      {loading && (
        <div className="text-center py-4">
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-lg">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            Loading attendance data for {selectedDate}...
          </div>
        </div>
      )}
      
      <div className="overflow-x-auto bg-gray-50 rounded-lg shadow-inner border border-gray-200">
        <Table
          columns={tableColumns}
          data={filteredStudents}
          renderRow={(student) => (
            <tr key={student._id} className="border-b border-gray-200 hover:bg-gray-100 transition-colors duration-150">
              <td className="py-3 px-4"><img src={student.profile_image || '/default-profile.png'} alt={student.full_name} className="w-10 h-10 rounded-full object-cover border border-gray-200 shadow-sm" /></td>
              <td className="py-3 px-4 text-sm text-gray-800 font-medium">{student.full_name}</td>
              <td className="py-3 px-4 text-sm text-gray-600">{student.admission_number || student.user_id}</td>
              <td className="py-3 px-4 text-sm text-gray-600">{student.class_id}</td>
              <td className="py-3 px-4 text-sm text-gray-600">{student.section}</td>
              <td className="py-3 px-4">
                <div className="relative flex items-center">
                  <span className="absolute left-3">
                    {getStatusIcon(currentAttendance[student._id]?.status)}
                  </span>
                  <select
                    value={currentAttendance[student._id]?.status || ''}
                    onChange={(e) => {
                      const newStatus = e.target.value;
                      const checkOutVal = currentAttendance[student._id]?.checkOut;
                      const commentVal = currentAttendance[student._id]?.comment;
                      handleStatusChange(student._id, newStatus, checkOutVal, commentVal);
                    }}
                    className={`
                      block w-full pl-10 pr-3 py-1.5 rounded-md border text-sm font-medium appearance-none
                      focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                      ${getStatusDisplayClasses(currentAttendance[student._id]?.status || '')}
                    `}
                  >
                    {attendanceStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status === '' ? 'Select Status' : status}
                      </option>
                    ))}
                  </select>
                  {currentAttendance[student._id]?.status && (
                    <div className="ml-2 text-xs text-gray-500">
                      {selectedDate}
                    </div>
                  )}
                </div>
              </td>
              {showCheckOutColumn && (
                <td className="py-3 px-4">
                  {currentAttendance[student._id]?.status === 'Half Day' ? (
                    <input
                      type="time"
                      value={currentAttendance[student._id]?.checkOut || '12:00'}
                      onChange={(e) => handleStatusChange(student._id, 'Half Day', e.target.value, currentAttendance[student._id]?.comment)}
                      className="w-24 border rounded px-2 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <span className="text-gray-500 text-sm">--:--</span>
                  )}
                </td>
              )}
              {showCommentColumn && (
                <td className="py-3 px-4">
                  {currentAttendance[student._id]?.status === 'Absent' ? (
                    <span className="text-gray-700 text-sm font-medium">Not Informed</span>
                  ) : (currentAttendance[student._id]?.status === 'Leave' || currentAttendance[student._id]?.status === 'Half Day') ? (
                    <select
                      value={currentAttendance[student._id]?.comment || ''}
                      onChange={(e) =>
                        handleStatusChange(
                          student._id,
                          currentAttendance[student._id].status,
                          currentAttendance[student._id].checkOut,
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
      </div>

      <div className="flex justify-end mt-6">
        <button
          onClick={handleSaveAttendance}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Attendance'}
        </button>
      </div>
    </div>
  );
};

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