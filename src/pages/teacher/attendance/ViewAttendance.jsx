// ViewAttendance.jsx
import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Clock, Calendar as CalendarIcon, Ban, CalendarDays, ArrowLeft } from 'lucide-react';
import Calendar from './Calendar';
import PropTypes from 'prop-types'; // Import PropTypes
import axios from 'axios';

// Access API_BASE_URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'; // Fallback for development

const ViewAttendance = ({ onViewChange }) => { // Accept onViewChange as a prop
    // Remove mock data, use fetched data instead
    const [allAttendanceData, setAllAttendanceData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    // Initialize with the current date to show the current month by default
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [monthlyAttendanceData, setMonthlyAttendanceData] = useState([]);
    const [stats, setStats] = useState({
        present: 0,
        absent: 0,
        late: 0,
        halfDays: 0,
        leave: 0 // Holidays stat removed
    });

    // Fetch attendance data from backend using axios directly
    useEffect(() => {
        const fetchAttendance = async () => {
            setLoading(true);
            setError('');
            try {
                let token = localStorage.getItem('authToken');
                if (token) {
                    try {
                        token = JSON.parse(token);
                    } catch (e) {
                        // If parsing fails, use the token as is
                        token = localStorage.getItem('authToken');
                    }
                }
                const headers = token ? { Authorization: `Bearer ${token}` } : {};
                const userprofileval = JSON.parse(localStorage.getItem('userprofile'));
                const teacherId = userprofileval?.user_id;
                const profileRes = await axios.get(`${API_BASE_URL}/api/teachers/by-userid/${teacherId}`, {
                    headers: headers,
                });
                const teacher = profileRes.data;
                if (!teacher) {
                    throw new Error('Teacher ID not found. Please log in again.');
                }
                console.log('Fetching attendance for teacher:', teacher._id);
                const response = await axios.get(`${API_BASE_URL}/api/teacher-attendance/teacher/${teacher._id}/under-my-admin`, { headers });
                console.log('Attendance response:', response.data);
                const normalized = (response.data || []).map(item => ({
                  ...item,
                  date: new Date(item.date).toISOString().slice(0, 10), // 'YYYY-MM-DD'
                  status: (item.status || '').toLowerCase().replace('half day', 'half-day'),
                  reason: item.comment || '', // Map comment to reason
                }));
                setAllAttendanceData(normalized);
            } catch (err) {
                console.error('Error fetching attendance:', err);
                if (err.response) {
                    console.error('Response data:', err.response.data);
                    console.error('Response status:', err.response.status);
                }
                setError(err.response?.data?.message || err.message || 'Failed to fetch attendance data');
            }
            setLoading(false);
        };
        fetchAttendance();
    }, []);

    // Filter attendance data for the current month
    useEffect(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth(); // 0-indexed month

        const filteredData = allAttendanceData.filter(item => {
            const itemDate = new Date(item.date);
            return itemDate.getFullYear() === year && itemDate.getMonth() === month;
        });
        setMonthlyAttendanceData(filteredData);
    }, [currentMonth, allAttendanceData]);

    // Calculate attendance stats for the monthlyAttendanceData
    useEffect(() => {
        const calculateStats = () => {
            const present = monthlyAttendanceData.filter(a => a.status === 'present').length;
            const absent = monthlyAttendanceData.filter(a => a.status === 'absent').length;
            const late = monthlyAttendanceData.filter(a => a.status === 'late').length;
            const halfDays = monthlyAttendanceData.filter(a => a.status === 'half-day').length;
            const leave = monthlyAttendanceData.filter(a => a.status === 'leave').length; // Calculate leave count

            setStats({
                present,
                absent,
                late,
                halfDays,
                leave // Holidays stat removed
            });
        };

        calculateStats();
    }, [monthlyAttendanceData]);

    // Helper function for coloring the status badge in details section
    const getStatusColor = (status) => {
        switch (status) {
            case 'present': return 'bg-green-100 text-green-800';
            case 'absent': return 'bg-red-100 text-red-800';
            case 'late': return 'bg-yellow-100 text-yellow-800';
            case 'half-day': return 'bg-blue-100 text-blue-800';
            case 'leave': return 'bg-orange-100 text-orange-800'; // New case for 'leave'
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // Add loading and error UI
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[200px]">
                <span className="text-lg text-gray-500">Loading attendance data...</span>
            </div>
        );
    }
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[200px]">
                <span className="text-lg text-red-500">{error}</span>
            </div>
        );
    }

    return (
    <div className="px-0 sm:px-2 md:px-4 lg:p-6 flex flex-col gap-2 sm:gap-4 lg:gap-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b border-gray-200">
            <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900 leading-tight mb-4 md:mb-0 flex items-center gap-3">
              <CalendarDays size={32} className="text-indigo-600" />
                My Attendance
            </h1>
            <button
            onClick={() => onViewChange('AttendanceModule')}
            className="px-5 py-2.5 bg-gray-600 text-white rounded-lg text-sm font-semibold hover:bg-gray-700 transition duration-200 shadow-md flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-gray-500 focus:ring-opacity-50 transform hover:-translate-y-0.5"
            >
            <ArrowLeft className="mr-2" size={20} /> Back to Attendance Management
            </button>
        </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 md:grid-cols-5 gap-4 mb-6"> {/* Changed grid-cols to 5 */}
                <div className="bg-white p-4 rounded-lg shadow border border-gray-200 flex flex-col items-center justify-center text-center">
                    <CheckCircle className="text-green-600 mb-1" size={24} />
                    <h3 className="text-sm font-medium text-gray-500">Present</h3>
                    <p className="text-2xl font-bold text-green-600">{stats.present}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow border border-gray-200 flex flex-col items-center justify-center text-center">
                    <XCircle className="text-red-600 mb-1" size={24} />
                    <h3 className="text-sm font-medium text-gray-500">Absent</h3>
                    <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow border border-gray-200 flex flex-col items-center justify-center text-center">
                    <AlertCircle className="text-yellow-600 mb-1" size={24} />
                    <h3 className="text-sm font-medium text-gray-500">Late Arrivals</h3>
                    <p className="text-2xl font-bold text-yellow-600">{stats.late}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow border border-gray-200 flex flex-col items-center justify-center text-center">
                    <Clock className="text-blue-600 mb-1" size={24} />
                    <h3 className="text-sm font-medium text-gray-500">Half Days</h3>
                    <p className="text-2xl font-bold text-blue-600">{stats.halfDays}</p>
                </div>
                {/* New stat card for 'Leave' */}
                <div className="bg-white p-4 rounded-lg shadow border border-gray-200 flex flex-col items-center justify-center text-center">
                    <Ban className="text-orange-600 mb-1" size={24} />
                    <h3 className="text-sm font-medium text-gray-500">Leave</h3>
                    <p className="text-2xl font-bold text-orange-600">{stats.leave}</p>
                </div>
            </div>

            {/* Calendar View Component */}
            <Calendar
                currentMonth={currentMonth}
                monthlyAttendanceData={monthlyAttendanceData}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                setCurrentMonth={setCurrentMonth}
            />

            {/* Attendance Details */}
            <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold">Attendance Details</h2>
                    <p className="text-sm text-gray-500">
                        {selectedDate
                            ? `Details for ${selectedDate.date.toDateString()}`
                            : 'Select a date to view details'}
                    </p>
                </div>

                {selectedDate ? (
                    selectedDate.attendance ? (
                        <div className="p-4">
                            <div className={`flex items-center justify-between p-3 rounded-lg ${getStatusColor(selectedDate.attendance.status)} mb-4`}>
                                <div className="flex items-center">
                                    {/* Icons for the selected date detail */}
                                    {selectedDate.attendance.status === 'present' && <CheckCircle className="text-green-500" size={18} />}
                                    {selectedDate.attendance.status === 'absent' && <XCircle className="text-red-500" size={18} />}
                                    {selectedDate.attendance.status === 'late' && <AlertCircle className="text-yellow-500" size={18} />}
                                    {selectedDate.attendance.status === 'half-day' && <Clock className="text-blue-500" size={18} />}
                                    {selectedDate.attendance.status === 'leave' && <Ban className="text-orange-500" size={18} />} {/* Icon for 'leave' changed to Ban */}
                                    <span className="ml-2 font-medium capitalize">{selectedDate.attendance.status}</span>
                                </div>
                                {selectedDate.attendance.reason && (
                                    <span className="text-sm">{selectedDate.attendance.reason}</span>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Conditional rendering for checkIn */}
                                {selectedDate.attendance.status === 'late' && (
                                    <div className="border rounded-lg p-4">
                                        <h3 className="text-sm font-medium text-gray-500 mb-2">Check In</h3>
                                        <div className="flex items-center">
                                            <Clock className="text-gray-400 mr-2" size={18} />
                                            <span className="text-lg font-medium">
                                                {selectedDate.attendance.checkIn || '--:--'}
                                            </span>
                                        </div>
                                    </div>
                                )}
                                {/* Conditional rendering for checkOut */}
                                {(selectedDate.attendance.status === 'half-day') && (
                                    <div className="border rounded-lg p-4">
                                        <h3 className="text-sm font-medium text-gray-500 mb-2">Check Out</h3>
                                        <div className="flex items-center">
                                            <Clock className="text-gray-400 mr-2" size={18} />
                                            <span className="text-lg font-medium">
                                                {selectedDate.attendance.checkOut || '--:--'}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 text-center text-gray-500">
                            {selectedDate.date.getDay() === 0 ? ( // Check if it's a Sunday
                                <>
                                    <Ban className="mx-auto mb-2 text-gray-400" size={24} />
                                    <p>No attendance recorded on Sundays</p>
                                </>
                            ) : (
                                <>
                                    <CalendarIcon className="mx-auto mb-2 text-gray-400" size={24} />
                                    <p>No attendance record for this date</p>
                                </>
                            )}
                        </div>
                    )
                ) : (
                    <div className="p-4 text-center text-gray-500">
                        <CalendarIcon className="mx-auto mb-2 text-gray-400" size={24} />
                        <p>Select a date to view attendance details</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// Add PropTypes for onViewChange
ViewAttendance.propTypes = {
    onViewChange: PropTypes.func.isRequired,
};

export default ViewAttendance;