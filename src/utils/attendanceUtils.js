import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Get authentication token from localStorage
const getAuthToken = () => {
    let token = localStorage.getItem('authToken');
    if (token) {
        try {
            token = JSON.parse(token);
        } catch (e) {
            token = localStorage.getItem('token');
        }
    }
    if (!token) {
        token = localStorage.getItem('token');
    }
    return token;
};

// Get auth headers
const getAuthHeaders = () => {
    const token = getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// Normalize attendance data from backend format to frontend format
export const normalizeAttendanceData = (data) => {
    return (data || []).map(item => ({
        ...item,
        date: new Date(item.date).toISOString().slice(0, 10), // 'YYYY-MM-DD'
        status: (item.status || '').toLowerCase().replace('half day', 'half-day').replace('halfday', 'half-day'),
        reason: item.comment || '',
        studentName: item.student_id?.full_name || 'Unknown Student',
        admissionNumber: item.student_id?.admission_number || 'N/A'
    }));
};

// Fetch all student attendance data for teachers/admins
export const fetchAllStudentAttendance = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/student-attendance/under-my-admin`, {
            headers: getAuthHeaders()
        });
        return normalizeAttendanceData(response.data);
    } catch (error) {
        console.error('Error fetching all student attendance:', error);
        throw error;
    }
};

// Fetch attendance data for a specific student
export const fetchStudentAttendanceById = async (studentId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/student-attendance/student/${studentId}`, {
            headers: getAuthHeaders()
        });
        return normalizeAttendanceData(response.data);
    } catch (error) {
        console.error('Error fetching student attendance:', error);
        throw error;
    }
};

// Fetch attendance data for students under parent
export const fetchStudentAttendanceUnderParent = async (studentId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/student-attendance/student/${studentId}/under-my-parent`, {
            headers: getAuthHeaders()
        });
        return normalizeAttendanceData(response.data);
    } catch (error) {
        console.error('Error fetching student attendance under parent:', error);
        throw error;
    }
};

// Fetch attendance data for students under admin
export const fetchStudentAttendanceUnderAdmin = async (studentId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/student-attendance/student/${studentId}/under-my-admin`, {
            headers: getAuthHeaders()
        });
        return normalizeAttendanceData(response.data);
    } catch (error) {
        console.error('Error fetching student attendance under admin:', error);
        throw error;
    }
};

// Fetch attendance data by date
export const fetchAttendanceByDate = async (date, classFilter = null, section = null) => {
    try {
        const params = { date };
        if (classFilter) params.class = classFilter;
        if (section) params.section = section;
        
        const response = await axios.get(`${API_BASE_URL}/api/student-attendance/bulk/date`, {
            headers: getAuthHeaders(),
            params
        });
        return normalizeAttendanceData(response.data);
    } catch (error) {
        console.error('Error fetching attendance by date:', error);
        throw error;
    }
};

// Fetch monthly attendance report
export const fetchMonthlyAttendanceReport = async (studentId, month, year) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/student-attendance/monthly-report`, {
            headers: getAuthHeaders(),
            params: { studentId, month, year }
        });
        return {
            records: normalizeAttendanceData(response.data.records),
            summary: response.data.summary
        };
    } catch (error) {
        console.error('Error fetching monthly attendance report:', error);
        throw error;
    }
};

// Calculate attendance statistics
export const calculateAttendanceStats = (attendanceData) => {
    const present = attendanceData.filter(a => a.status === 'present').length;
    const absent = attendanceData.filter(a => a.status === 'absent').length;
    const late = attendanceData.filter(a => a.status === 'late').length;
    const halfDays = attendanceData.filter(a => a.status === 'half-day').length;
    const leave = attendanceData.filter(a => a.status === 'leave').length;
    
    // Get unique students count
    const uniqueStudents = new Set(attendanceData.map(a => a.student_id)).size;
    
    const total = present + absent + late + halfDays + leave;
    const attendancePercentage = total > 0 ? ((present + late + halfDays) / total * 100).toFixed(1) : 0;

    return {
        present,
        absent,
        late,
        halfDays,
        leave,
        totalStudents: uniqueStudents,
        totalRecords: total,
        attendancePercentage
    };
};

// Filter attendance data by month
export const filterAttendanceByMonth = (attendanceData, year, month) => {
    return attendanceData.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate.getFullYear() === year && itemDate.getMonth() === month;
    });
};

// Filter attendance data by search term
export const filterAttendanceBySearch = (attendanceData, searchTerm) => {
    if (!searchTerm) return attendanceData;
    
    return attendanceData.filter(item => 
        item.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
};

// Filter attendance data by status
export const filterAttendanceByStatus = (attendanceData, status) => {
    if (status === 'all') return attendanceData;
    return attendanceData.filter(item => item.status === status);
};

// Get status color for UI
export const getStatusColor = (status) => {
    switch (status) {
        case 'present': return 'bg-green-100 text-green-800';
        case 'absent': return 'bg-red-100 text-red-800';
        case 'late': return 'bg-yellow-100 text-yellow-800';
        case 'half-day': return 'bg-blue-100 text-blue-800';
        case 'leave': return 'bg-orange-100 text-orange-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

// Get status icon for UI
export const getStatusIcon = (status) => {
    switch (status) {
        case 'present': return 'CheckCircle';
        case 'absent': return 'XCircle';
        case 'late': return 'AlertCircle';
        case 'half-day': return 'Clock';
        case 'leave': return 'Ban';
        default: return 'HelpCircle';
    }
};

// Export attendance data to CSV format
export const exportAttendanceToCSV = (attendanceData) => {
    const headers = ['Date', 'Student Name', 'Admission Number', 'Status', 'Check In', 'Check Out', 'Reason'];
    const csvContent = [
        headers.join(','),
        ...attendanceData.map(item => [
            item.date,
            `"${item.studentName}"`,
            item.admissionNumber,
            item.status,
            item.checkIn || '',
            item.checkOut || '',
            `"${item.reason || ''}"`
        ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}; 