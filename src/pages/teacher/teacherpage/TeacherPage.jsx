import React, { useState, useEffect } from 'react';
// import TeacherUserCard from '../components/TeacherUserCard';
import TeacherGradeChart from '../components/TeacherGradeChart';
import TeacherAttendanceChart from '../components/TeacherAttendanceChart';
import AssignmentsTable from '../components/AssignmentsTable';
import AssignedClasses from '../components/AssignedClasses';
import axios from 'axios';
import { LayoutDashboard, Loader2 } from 'lucide-react'; // Lucide icon for dashboard header

// Access API_BASE_URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'; // Fallback for development

function TeacherPage() {
    const userprofileval = JSON.parse(localStorage.getItem('userprofile'));
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Helper function to get auth headers
    const getAuthHeaders = () => {
        const token = JSON.parse(localStorage.getItem('authToken'));
        return token ? { Authorization: `Bearer ${token}` } : {};
    };

    // Fetch dashboard data from backend
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const response = await axios.get(`${API_BASE_URL}/api/teachers/dashboard`, {
                    headers: getAuthHeaders(),
                });
                
                setDashboardData(response.data);
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
                setError(err.response?.data?.message || 'Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="px-0 sm:px-2 md:px-4 lg:p-6 flex flex-col gap-2 sm:gap-4 lg:gap-8">
                <div className="flex items-center justify-center h-64">
                    <div className="flex items-center gap-3 text-gray-600">
                        <Loader2 className="animate-spin" size={24} />
                        <span className="text-lg">Loading dashboard...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="px-0 sm:px-2 md:px-4 lg:p-6 flex flex-col gap-2 sm:gap-4 lg:gap-8">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-red-800">
                        <span className="text-lg font-medium">Error loading dashboard</span>
                    </div>
                    <p className="text-red-600 mt-1">{error}</p>
                </div>
            </div>
        );
    }

    const teacherCardData = [
        {
            type: 'Total Classes',
            value: dashboardData?.statistics?.totalClasses || 0,
        },
        {
            type: 'Total Students',
            value: dashboardData?.statistics?.totalStudents || 0,
        },
        {
            type: 'Total Assignments',
            value: dashboardData?.statistics?.totalAssignments || 0,
        },
        {
            type: 'Attendance Rate',
            value: `${dashboardData?.statistics?.attendancePercentage || 0}%`,
        }
    ];

    return (
        <>
            <div className="px-0 sm:px-2 md:px-4 lg:p-6 flex flex-col gap-2 sm:gap-4 lg:gap-8">
                {/* Dashboard Header */}             
                {/* Charts */}
                <div className="flex gap-4 flex-col lg:flex-row">
                    <div className="w-full lg:w-1/3 h-[450px]">
                        <TeacherGradeChart data={dashboardData?.gradeChart || []} />
                    </div>
                    <div className="w-full lg:w-2/3 h-[450px]">
                        <TeacherAttendanceChart data={dashboardData?.attendanceChart || []} />
                    </div>
                </div>
                
                {/* Assignments Table */}
                <div className="flex gap-4 flex-col lg:flex-row">
                    <div className="w-full lg:w-2/3 ">
                        <AssignmentsTable assignments={dashboardData?.assignments || []} />
                    </div>
                    <div className="w-full lg:w-1/3 h-[650px]">
                        <AssignedClasses />
                    </div>
                </div>
            </div>
        </>
    )
}

export default TeacherPage;