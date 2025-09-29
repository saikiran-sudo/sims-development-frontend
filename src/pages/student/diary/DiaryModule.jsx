// src/pages/student/diary/DiaryModule.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import axios from 'axios';

// Access API_BASE_URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'; // Fallback for development

const DiaryModule = () => {
    const [homeworkEntries, setHomeworkEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch homework data from backend
    useEffect(() => {
        const fetchHomework = async () => {
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

                // Get current student's class and section from localStorage
                const userprofileval = JSON.parse(localStorage.getItem('userprofile'));
                const studentClass = userprofileval.class_id;
                const studentSection = userprofileval.section;
                
                
                if (!studentClass || !studentSection) {
                    setError('Class or section not found. Please log in again.');
                    setLoading(false);
                    return;
                }
                
                // Fetch homework diary entries for the student's class and section
                const response = await axios.get(
                    `${API_BASE_URL}/api/diary/homework/by-class`,

                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                console.log('response of homework is ',response.data);
                
                // If the admin-filtered query returns empty, try without admin filter
                let homeworkData = response.data || [];
                
                setHomeworkEntries(homeworkData);
            } catch (error) {
                console.error('Error fetching homework:', error);
                setError(error.response?.data?.message || 'Failed to load homework data');
            } finally {
                setLoading(false);
            }
        };

        fetchHomework();
    }, []);

    // Group homework by date (using entry.date)
    const homeworkByDate = useMemo(() => {
        const grouped = {};
        homeworkEntries.forEach(entry => {
            const dateKey = entry.date ? entry.date : 'No Date';
            if (!grouped[dateKey]) {
                grouped[dateKey] = [];
            }
            grouped[dateKey].push(entry);
        });
        return grouped;
    }, [homeworkEntries]);

    // Get sorted dates
    const sortedDates = useMemo(() => {
        return Object.keys(homeworkByDate).sort((a, b) => {
            if (a === 'No Date') return 1;
            if (b === 'No Date') return -1;
            return new Date(b) - new Date(a);
        });
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

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h1 className="text-3xl font-bold text-gray-800 mb-6">Homework Diary</h1>
                    
                    {sortedDates.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500 text-lg">No homework assignments found.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {sortedDates.map(date => (
                                <div key={date} className="border border-gray-200 rounded-lg p-4">
                                    <h2 className="text-xl font-semibold text-gray-700 mb-4">
                                        {date === 'No Date' ? 'No Date' : format(parseISO(date), 'EEEE, MMMM d, yyyy')}
                                    </h2>
                                    <div className="space-y-4">
                                        {homeworkByDate[date].map(entry => (
                                            <div key={entry._id} className="bg-gray-50 rounded-lg p-4">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-sm text-gray-500">
                                                        Teacher: {entry.teacherId || 'Unknown'}
                                                    </span>
                                                </div>
                                                <div className="space-y-2">
                                                    {Array.isArray(entry.homeworkItems) && entry.homeworkItems.length > 0 ? (
                                                        entry.homeworkItems.map((item, idx) => (
                                                            <div key={idx} className="pl-4 border-l-2 border-blue-200 mb-2">
                                                                <p className="text-sm font-medium text-gray-600">
                                                                    Subject: {item.subject || 'General'}
                                                                </p>
                                                                <p className="text-gray-700">{item.homework}</p>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <p className="text-gray-500">No homework items.</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DiaryModule;