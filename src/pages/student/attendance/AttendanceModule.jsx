// AttendanceModule.jsx
import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Calendar as CalendarIcon, CalendarDays, AlertCircle, Ban } from 'lucide-react';
import Calendar from './Calendar';
import axios from 'axios';

// Access API_BASE_URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'; // Fallback for development

const AttendanceModule = () => {
    // Backend integration: fetch attendance data for the logged-in student
    const [allAttendanceData, setAllAttendanceData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const userprofileval = JSON.parse(localStorage.getItem('userprofile'));

    // Get student ID from localStorage
    const userProfile = JSON.parse(localStorage.getItem('userprofile'));
    const studentId = userProfile && (userProfile.user_id || userProfile._id || userProfile.id);

    useEffect(() => {
        const fetchAttendance = async () => {
            setLoading(true);
            setError(null);
            try {
                const token = JSON.parse(localStorage.getItem('authToken'));
                const userId = userprofileval.user_id;
                if (!userId) throw new Error('Student user_id not found. Please log in again.');

                const profileRes = await axios.get(`${API_BASE_URL}/api/students/by-userid/${userId}`,
                    token ? { headers: { Authorization: `Bearer ${token}` } } : {}
                );

                const student = profileRes.data;
                if (!student || !student._id) throw new Error('Student profile not found.');

                const response = await axios.get(`${API_BASE_URL}/api/student-attendance/student/${student._id}/under-my-admin`,
                    token ? { headers: { Authorization: `Bearer ${token}` } } : {}
                );
                // Map backend fields to frontend format
                const mapped = (response.data || []).map(item => ({
                    date: item.date ? new Date(item.date).toISOString().slice(0, 10) : '',
                    status: (item.status || '').toLowerCase().replace(' ', '-'), // e.g., 'Half Day' -> 'half-day'
                    reason: item.comment || '',
                    checkOut: item.checkOut || undefined,
                }));
                setAllAttendanceData(mapped);
            } catch (err) {
                setError('Failed to load attendance data.');
                setAllAttendanceData([]);
            }
            setLoading(false);
        };
        if (studentId) fetchAttendance();
    }, [studentId]);

    // Initialize with the current date to show the current month by default
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [monthlyAttendanceData, setMonthlyAttendanceData] = useState([]);
    const [stats, setStats] = useState({
        present: 0,
        absent: 0,
        halfDays: 0,
        leave: 0,
    });

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
            const halfDays = monthlyAttendanceData.filter(a => a.status === 'half-day').length;
            const leave = monthlyAttendanceData.filter(a => a.status === 'leave').length;

            setStats({
                present,
                absent,
                halfDays,
                leave,
            });
        };

        calculateStats();
    }, [monthlyAttendanceData]);

    // Helper function for coloring the status badge in details section
    const getStatusColor = (status) => {
        switch (status) {
            case 'present': return 'bg-green-100 text-green-800';
            case 'absent': return 'bg-red-100 text-red-800';
            case 'half-day': return 'bg-blue-100 text-blue-800';
            case 'leave': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // Loading and error states
    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <span className="text-lg text-gray-500">Loading attendance data...</span>
            </div>
        );
    }
    if (error) {
        return (
            <div className="flex justify-center items-center h-64">
                <span className="text-lg text-red-500">{error}</span>
            </div>
        );
    }

    return (
    <div className="px-0 sm:px-2 md:px-4 lg:p-6 flex flex-col gap-2 sm:gap-4 lg:gap-8">
            <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <CalendarDays size={32} className="text-indigo-600" />
          Attendance
        </h1>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
                    <Clock className="text-blue-600 mb-1" size={24} />
                    <h3 className="text-sm font-medium text-gray-500">Half Days</h3>
                    <p className="text-2xl font-bold text-blue-600">{stats.halfDays}</p>
                </div>
                {/* New card for Leaves */}
                <div className="bg-white p-4 rounded-lg shadow border border-gray-200 flex flex-col items-center justify-center text-center">
                    <AlertCircle className="text-yellow-600 mb-1" size={24} />
                    <h3 className="text-sm font-medium text-gray-500">Leaves</h3>
                    <p className="text-2xl font-bold text-yellow-600">{stats.leave}</p>
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
                        <div className={`p-4`}>
                            <div className={`flex items-center justify-between p-3 rounded-lg ${getStatusColor(selectedDate.attendance.status)} mb-4`}>
                                <div className="flex items-center">
                                    {/* Icons for the selected date detail */}
                                    {selectedDate.attendance.status === 'present' && <CheckCircle className="text-green-500" size={18} />}
                                    {selectedDate.attendance.status === 'absent' && <XCircle className="text-red-500" size={18} />}
                                    {selectedDate.attendance.status === 'half-day' && <Clock className="text-blue-500" size={18} />}
                                    {selectedDate.attendance.status === 'leave' && <AlertCircle className="text-yellow-600" size={18} />}
                                    <span className="ml-2 font-medium capitalize">{selectedDate.attendance.status}</span>
                                </div>
                                {selectedDate.attendance.reason && (
                                    <span className="text-sm">{selectedDate.attendance.reason}</span>
                                )}
                            </div>

                            {selectedDate.attendance.checkOut && ( // Only check for checkOut
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="border rounded-lg p-4">
                                        <h3 className="text-sm font-medium text-gray-500 mb-2">Check Out</h3>
                                        <div className="flex items-center">
                                            <Clock className="text-gray-400 mr-2" size={18} />
                                            <span className="text-lg font-medium">
                                                {selectedDate.attendance.checkOut}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
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

export default AttendanceModule;