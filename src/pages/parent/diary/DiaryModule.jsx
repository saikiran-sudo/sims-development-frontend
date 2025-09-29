import React, { useState, useMemo, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import axios from 'axios';
import { FaUsers, FaCheckCircle } from "react-icons/fa";
import { AlertCircle, BookOpen } from 'lucide-react';

// Use import.meta.env to access environment variables.
// The variable name must be prefixed with VITE_ for Vite to expose it to the client-side.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const DiaryModule = () => {
    // Real Parent and Children Data - fetched from backend
    const [parentInfo, setParentInfo] = useState({ children: [] });
    const [allHomeworkEntriesByChild, setAllHomeworkEntriesByChild] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedChild, setSelectedChild] = useState(null); // Will be set after fetching children

    // Create axios instance with base configuration
    const api = useMemo(() => {
        const instance = axios.create({
            baseURL: `${API_BASE_URL}/api`, // Use API_BASE_URL here
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Add request interceptor for authentication
        instance.interceptors.request.use(
            (config) => {
                const token = JSON.parse(localStorage.getItem('authToken'));
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        return instance;
    }, []);

    // Fetch parent's children data from backend
    useEffect(() => {
        const fetchParentChildren = async () => {
            try {
                setLoading(true);
                setError(null);
                
                // Get auth token from localStorage
                const token = JSON.parse(localStorage.getItem('authToken'));
                if (!token) {
                    setError('Authentication required');
                    setLoading(false);
                    return;
                }

                // Fetch parent profile with linked students
                // Use the API_BASE_URL variable for the API call
                const parentResponse = await axios.get(`${API_BASE_URL}/api/parents/me`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                const { linkedStudents } = parentResponse.data;
                console.log('Parent children data:', linkedStudents);

                if (!linkedStudents || linkedStudents.length === 0) {
                    setParentInfo({ children: [] });
                    setLoading(false);
                    return;
                }

                // Transform students data to match our component's expected format
                const childrenData = linkedStudents.map(student => ({
                    id: student._id,
                    name: student.full_name,
                    grade: student.class_id?.class_name || student.class_id || 'N/A',
                    rollNo: student.admission_number || student.rollNumber || 'N/A',
                    profilePic: student.profile_image,
                    class_id: student.class_id?.class_name || student.class_id, // Use class name as class_id for API
                    section: student.section || 'A' // Default to 'A' if no section
                }));

                setParentInfo({ children: childrenData });
                
                // Set the first child as selected by default
                if (childrenData.length > 0) {
                    setSelectedChild(childrenData[0].id);
                }

            } catch (error) {
                console.error('Error fetching parent children:', error);
                setError(error.response?.data?.message || 'Failed to load children data');
            } finally {
                setLoading(false);
            }
        };

        fetchParentChildren();
    }, []);

    // Fetch homework data for each child by their class and section
    useEffect(() => {
        const fetchHomeworkForAllChildren = async () => {
            if (parentInfo.children.length === 0) return;

            try {
                setLoading(true);
                setError(null);
                
                // Get auth token from localStorage
                const token = JSON.parse(localStorage.getItem('authToken'));
                if (!token) {
                    setError('Authentication required');
                    setLoading(false);
                    return;
                }

                const homeworkByChild = {};
                
                // Fetch homework for each child using their class_id and section
                for (const child of parentInfo.children) {
                    try {
                        console.log(`Fetching homework for child ${child.name} - Class: ${child.class_id}, Section: ${child.section}`);
                        
                        // Use axios get method directly to fetch homework by class and section
                        // Use the API_BASE_URL variable for the API call
                        const response = await axios.get(
                            `${API_BASE_URL}/api/diary/homework/class/${child.class_id}/section/${child.section}`,
                            {
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json'
                                }
                            }
                        );
                        
                        console.log(`Homework response for ${child.name}:`, response.data);
                        homeworkByChild[child.id] = response.data || [];
                        
                    } catch (childError) {
                        console.error(`Error fetching homework for child ${child.name}:`, childError);
                        // Set empty array for this child if there's an error
                        homeworkByChild[child.id] = [];
                    }
                }
                
                setAllHomeworkEntriesByChild(homeworkByChild);
                
            } catch (error) {
                console.error('Error fetching homework:', error);
                setError(error.response?.data?.message || 'Failed to load homework data');
            } finally {
                setLoading(false);
            }
        };

        fetchHomeworkForAllChildren();
    }, [parentInfo.children]);

    // Update selected child when children data changes
    useEffect(() => {
        if (parentInfo.children.length > 0 && !selectedChild) {
            setSelectedChild(parentInfo.children[0].id);
        }
    }, [parentInfo.children, selectedChild]);

    // Get homework entries for the selected child
    const currentChildHomework = allHomeworkEntriesByChild[selectedChild] || [];

    // Group homework by date for the selected child
    const homeworkByDate = useMemo(() => {
        const grouped = {};
        currentChildHomework.forEach(entry => {
            const dateKey = entry.date;
            if (!grouped[dateKey]) {
                grouped[dateKey] = [];
            }
            grouped[dateKey].push(entry);
        });
        return grouped;
    }, [currentChildHomework]);

    // Get sorted dates
    const sortedDates = useMemo(() => {
        return Object.keys(homeworkByDate).sort((a, b) => new Date(b) - new Date(a));
    }, [homeworkByDate]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg">Loading homework...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-red-500 text-lg">{error}</div>
            </div>
        );
    }

    // Check if parent has children
    if (!loading && parentInfo.children.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
                    <p className="text-gray-500 text-lg">No children found for this parent account.</p>
                    <p className="text-gray-400 text-sm">Please contact the administrator if this is incorrect.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="px-0 sm:px-2 md:px-4 lg:p-6 flex flex-col gap-2 sm:gap-4 lg:gap-8">
                    <div className="flex items-center gap-3 mb-6">
                        <BookOpen className="text-blue-600" size={24} />
                        <h1 className="text-3xl font-bold text-gray-800">Homework Diary</h1>
                    </div>

                    {/* Child Selection */}
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                            <FaUsers className="text-gray-600" />
                            <h2 className="text-lg font-semibold text-gray-700">Select Child</h2>
                        </div>
                        <div className="flex gap-4">
                            {parentInfo.children.map(child => (
                                <div
                                    key={child.id}
                                    onClick={() => setSelectedChild(child.id)}
                                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                        selectedChild === child.id
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <img
                                        src={child.profilePic}
                                        alt={child.name}
                                        className="w-10 h-10 rounded-full object-cover"
                                    />
                                    <div>
                                        <p className="font-medium text-gray-800">{child.name}</p>
                                        <p className="text-sm text-gray-500">{child.grade} - Section {child.section}</p>
                                    </div>
                                    {selectedChild === child.id && (
                                        <FaCheckCircle className="text-blue-500 ml-auto" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Homework Content */}
                    {sortedDates.length === 0 ? (
                        <div className="text-center py-8">
                            <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
                            <p className="text-gray-500 text-lg">No homework assignments found for {parentInfo.children.find(c => c.id === selectedChild)?.name}.</p>
                            <p className="text-gray-400 text-sm">Please contact the administrator if this is incorrect.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {sortedDates.map(date => (
                                <div key={date} className="border border-gray-200 rounded-lg p-4">
                                    <h2 className="text-xl font-semibold text-gray-700 mb-4">
                                        {format(parseISO(date), 'EEEE, MMMM d, yyyy')}
                                    </h2>
                                    
                                    <div className="space-y-4">
                                        {homeworkByDate[date].map(entry => (
                                            <div key={entry._id || entry.id} className="bg-gray-50 rounded-lg p-4">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className="text-lg font-medium text-gray-800">
                                                        {entry.homeworkItems?.[0]?.subject || 'General'}
                                                    </h3>
                                                    <span className="text-sm text-gray-500">
                                                        Teacher: {entry.teacherId || 'Unknown'}
                                                    </span>
                                                </div>
                                                
                                                <div className="space-y-2">
                                                    {entry.homeworkItems?.map((item, index) => (
                                                        <div key={index} className="pl-4 border-l-2 border-blue-200">
                                                            <p className="text-sm font-medium text-gray-600">
                                                                {item.subject}
                                                            </p>
                                                            <p className="text-gray-700">{item.homework}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
        </div>
    );
};

export default DiaryModule;
