import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Clock, Calendar as CalendarIcon, Ban, CalendarDays } from 'lucide-react';
import { FaCheckCircle } from "react-icons/fa"; // Import FaCheckCircle for child selection UI
import Calendar from './Calendar'; // Assuming Calendar.jsx is in the same directory
import { parentAPI, attendanceAPI } from '../../../services/api'; // Import parentAPI and attendanceAPI

const AttendanceModule = () => {
    // State for parent and children
    const [parentInfo, setParentInfo] = useState({ children: [] });
    const [childrenLoading, setChildrenLoading] = useState(true);
    const [childrenError, setChildrenError] = useState(null);

    // Attendance data state
    const [allAttendanceDataByChild, setAllAttendanceDataByChild] = useState({});
    const [attendanceLoading, setAttendanceLoading] = useState(false);
    const [attendanceError, setAttendanceError] = useState(null);

    const [selectedChildId, setSelectedChildId] = useState(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [monthlyAttendanceData, setMonthlyAttendanceData] = useState([]);
    const [stats, setStats] = useState({
        present: 0,
        absent: 0,
        halfDays: 0,
        leave: 0
    });

    // Fetch parent info and children on mount
    useEffect(() => {
        setChildrenLoading(true);
        setChildrenError(null);
        parentAPI.getMyProfile()
            .then(res => {
                const children = (res.data.linkedStudents || []).map(child => ({
                    id: child._id,
                    name: child.full_name,
                    grade: child.class_id?.class_name || child.class_id || '',
                    rollNumber: child.rollNumber || child.admission_number || '',
                    profilePic: child.profile_image || '',
                }));
                setParentInfo({ children });
                if (children.length > 0) setSelectedChildId(children[0].id);
            })
            .catch(err => {
                setChildrenError('Failed to load children.');
            })
            .finally(() => setChildrenLoading(false));
    }, []);

    // Fetch attendance for selected child
    useEffect(() => {
        if (!selectedChildId) return;
        setAttendanceLoading(true);
        setAttendanceError(null);
        attendanceAPI.getAttendanceByStudent(selectedChildId)
            .then(res => {
                console.log('Attendance API response:', res.data); // Debug log
                // Map backend status to frontend status
                const mapped = (res.data || []).map(item => {
                    console.log('Raw item:', item); // Debug log
                    console.log('Raw date:', item.date, 'Type:', typeof item.date); // Debug log
                    
                    let status = (item.status || '').toLowerCase();
                    // Handle different status formats from backend
                    if (status === 'half day') status = 'half-day';
                    if (status === 'late') status = 'leave'; // Map 'late' to 'leave' for frontend
                    
                    // Handle different date formats
                    let dateStr;
                    if (typeof item.date === 'string') {
                        dateStr = item.date.slice(0, 10);
                    } else if (item.date instanceof Date) {
                        dateStr = item.date.toISOString().slice(0, 10);
                    } else {
                        dateStr = new Date(item.date).toISOString().slice(0, 10);
                    }
                    
                    return {
                        date: dateStr,
                        status: status,
                        reason: item.comment || '',
                        checkOut: item.checkOut || undefined,
                    };
                });
                console.log('Mapped attendance data:', mapped); // Debug log
                setAllAttendanceDataByChild(prev => ({ ...prev, [selectedChildId]: mapped }));
            })
            .catch(err => {
                console.error('Attendance API error:', err); // Debug log
                setAttendanceError('Failed to load attendance.');
                setAllAttendanceDataByChild(prev => ({ ...prev, [selectedChildId]: [] }));
            })
            .finally(() => setAttendanceLoading(false));
    }, [selectedChildId]);

    // Filter attendance data for the current month and selected child
    useEffect(() => {
        if (!selectedChildId) {
            setMonthlyAttendanceData([]);
            return;
        }
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const childAttendance = allAttendanceDataByChild[selectedChildId] || [];
        console.log('Child attendance data:', childAttendance); // Debug log
        console.log('Filtering for year:', year, 'month:', month); // Debug log
        const filteredData = childAttendance.filter(item => {
            const itemDate = new Date(item.date);
            const matches = itemDate.getFullYear() === year && itemDate.getMonth() === month;
            console.log('Date:', item.date, 'ItemDate:', itemDate, 'Matches:', matches); // Debug log
            return matches;
        });
        console.log('Filtered monthly data:', filteredData); // Debug log
        setMonthlyAttendanceData(filteredData);
        setSelectedDate(null); // Clear selected date when child or month changes
    }, [currentMonth, selectedChildId, allAttendanceDataByChild]);

    // Calculate attendance stats for the monthlyAttendanceData
    useEffect(() => {
        const calculateStats = () => {
            const present = monthlyAttendanceData.filter(a => a.status === 'present').length;
            const absent = monthlyAttendanceData.filter(a => a.status === 'absent').length;
            const halfDays = monthlyAttendanceData.filter(a => a.status === 'half-day').length;
            const leave = monthlyAttendanceData.filter(a => a.status === 'leave').length;
            setStats({ present, absent, halfDays, leave });
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

    // Handle child selection
    const handleChildSelect = (childId) => {
        setSelectedChildId(childId);
        setCurrentMonth(new Date()); // Reset calendar to current month for new child
    };

    // Get the currently selected child object
    const selectedChild = parentInfo.children.find(child => child.id === selectedChildId);

    return (
        <div className="px-0 sm:px-2 md:px-4 lg:p-6 flex flex-col gap-2 sm:gap-4 lg:gap-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                    <CalendarDays size={32} className="text-indigo-600" />
                    Attendance Records
                </h1>
            </div>

            {/* Children Selector */}
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200 mb-6">
                {childrenLoading ? (
                    <div className="text-center text-gray-500">Loading children...</div>
                ) : childrenError ? (
                    <div className="text-center text-red-500">{childrenError}</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {parentInfo.children.map(child => (
                            <div
                                key={child.id}
                                className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all
                                    ${selectedChildId === child.id ? 'border-blue-500 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}
                                onClick={() => handleChildSelect(child.id)}
                            >
                                <img
                                    src={child.profilePic}
                                    alt={child.name}
                                    className="rounded-full mr-3 border border-gray-200"
                                    style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                />
                                <div className="flex-grow">
                                    <h6 className="mb-0 font-semibold text-gray-800">{child.name}</h6>
                                    <small className="text-gray-500">{child.rollNumber && `Roll No: ${child.rollNumber}`}</small>
                                </div>
                                {selectedChildId === child.id && (
                                    <FaCheckCircle className="text-blue-500 ml-auto" size={20} />
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Display message if no child is selected or no children exist */}
            {!selectedChildId && !childrenLoading && (
                <div className="bg-blue-50 p-4 rounded-lg text-blue-800 flex items-center justify-center mb-6 shadow-sm">
                    <AlertCircle className="mr-2" size={20} />
                    Please select a child to view attendance records.
                </div>
            )}

            {selectedChildId && (
                <>
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
                        <div className="bg-white p-4 rounded-lg shadow border border-gray-200 flex flex-col items-center justify-center text-center">
                            <AlertCircle className="text-yellow-600 mb-1" size={24} />
                            <h3 className="text-sm font-medium text-gray-500">Leaves</h3>
                            <p className="text-2xl font-bold text-yellow-600">{stats.leave}</p>
                        </div>
                    </div>

                    {/* Calendar View Component */}
                    {attendanceLoading ? (
                        <div className="text-center text-gray-500 mb-4">Loading attendance...</div>
                    ) : attendanceError ? (
                        <div className="text-center text-red-500 mb-4">{attendanceError}</div>
                    ) : (
                        <Calendar
                            currentMonth={currentMonth}
                            monthlyAttendanceData={monthlyAttendanceData}
                            selectedDate={selectedDate}
                            setSelectedDate={setSelectedDate}
                            setCurrentMonth={setCurrentMonth}
                        />
                    )}

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
                                            {selectedDate.attendance.status === 'leave' && <AlertCircle className="text-yellow-500" size={18} />}
                                            <span className="ml-2 font-medium capitalize">{selectedDate.attendance.status}</span>
                                        </div>
                                        {selectedDate.attendance.reason && (
                                            <span className="text-sm">{selectedDate.attendance.reason}</span>
                                        )}
                                    </div>

                                    {/* Display Check Out time ONLY if status is 'half-day' */}
                                    {selectedDate.attendance.status === 'half-day' && selectedDate.attendance.checkOut && (
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
                </>
            )}
        </div>
    );
};

export default AttendanceModule;