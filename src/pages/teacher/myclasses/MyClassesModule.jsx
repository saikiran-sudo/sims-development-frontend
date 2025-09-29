// src/pages/teacher/classes/MyClassesModule.jsx
import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import { BookOpen, Book } from 'lucide-react'; // Import Lucide icons, removed Plus, Edit, Trash, X
import { useAuth } from '../../../contexts/AuthContext';
import { getAuthHeaders } from '../../../utils/axiosConfig'; // Keep getAuthHeaders for fetch

// Access API_BASE_URL from environment variables
const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'; // Fallback for development
const API_BASE_URL = `${API_URL}/api`; // Use the base URL for the API endpoint

const MyClassesModule = () => {
    const { user } = useAuth();
    
    // Get teacher profile from localStorage
    const teacherProfile = useMemo(() => {
        try {
            return JSON.parse(localStorage.getItem('userprofile'));
        } catch (error) {
            console.error('Error parsing teacher profile:', error);
            return null;
        }
    }, []);

    // State for all classes fetched from backend
    const [allClasses, setAllClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch all classes from backend on mount
    useEffect(() => {
        const fetchClasses = async () => {
            setLoading(true);
            setError(null);
            try {
                const token = JSON.parse(localStorage.getItem('authToken'));
                if (!token) {
                    setError('No authentication token found.');
                    return;
                }

                const res = await axios.get(`${API_BASE_URL}/subjects/under-my-admin`, {
                    headers: {
                        ...getAuthHeaders(),
                        'Content-Type': 'application/json',
                    },
                });
                
                setAllClasses(res.data);
            } catch (err) {
                console.error('Error fetching classes:', err);
                setError('Failed to fetch classes.');
            } finally {
                setLoading(false);
            }
        };

        if (user?.token) {
            fetchClasses();
        }
    }, [user]);

    // Filters classes to only show those assigned to the current teacher (by user_id)
    const teacherClasses = useMemo(() => {
        if (!teacherProfile?.user_id) return [];
        
        return allClasses.filter(cls =>
            Array.isArray(cls.teachers) &&
            cls.teachers.some(t => t.empId === teacherProfile.user_id)
        );
    }, [allClasses, teacherProfile]);

    // Show error state if teacher profile is not available
    if (!teacherProfile) {
        return (
            <div className="px-0 sm:px-2 md:px-4 lg:p-6 flex flex-col gap-2 sm:gap-4 lg:gap-8">
                <div className="text-center text-red-600 py-4">Teacher profile not found. Please log in again.</div>
            </div>
        );
    }

    return (
        <div className="px-0 sm:px-2 md:px-4 lg:p-6 flex flex-col gap-2 sm:gap-4 lg:gap-8">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 pb-4 border-b-2 border-blue-500">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 flex items-center gap-3">
                    <BookOpen size={36} className="text-blue-600" /> My Assigned Subjects
                </h1>
                {/* Removed "Add New Class" button */}
            </div>

            {/* Loading/Error State */}
            {loading && (
                <div className="text-center text-blue-600 py-8">Loading subjects...</div>
            )}
            {error && (
                <div className="text-center text-red-600 py-4">{error}</div>
            )}

            {/* Main Content Area: Table of Classes */}
            <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 min-h-[400px] overflow-x-auto border border-gray-200">
                {(!loading && teacherClasses.length === 0) ? (
                    // Display message if no classes are assigned, without "Add First Class" button
                    <div className="text-center text-gray-500 py-16 flex flex-col items-center justify-center">
                        <Book size={60} className="mb-6 text-gray-300" />
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">No Subjects Assigned Yet!</h3>
                        <p className="text-base text-gray-600 mb-6">
                            It looks like you haven't been assigned any subjects.
                        </p>
                    </div>
                ) : (
                    // Display classes in a table
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    SUBJECT NAME
                                </th>
                                <th scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    CLASS
                                </th>
                                <th scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    SECTION
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {teacherClasses.map(cls => {
                                return (
                                    <tr key={cls._id} className="hover:bg-gray-50 transition-colors duration-150">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {cls.name || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {/* {cls.className.match(/\d+/)[0] || 'N/A'} */}
                                            {cls.className}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {cls.section}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default MyClassesModule;