// SchedulesModule.jsx
import React, { useState, useEffect } from 'react';
import ClassScheduleView from './ClassScheduleView';
import CreateScheduleModal from './CreateScheduleModal';
import { LayoutList, Plus } from 'lucide-react'; // Using Lucide icons for consistency
import axios from 'axios'; // Import axios
import { useAuth } from '../../../contexts/AuthContext';
import { classAPI } from '../../../services/api';

// Access API_BASE_URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'; // Fallback for development

const SchedulesModule = () => {
    const { user } = useAuth();
    const [classOptions, setClassOptions] = useState([]);
    
    useEffect(() => {
        const fetchClasses = async () => {
            const response = await classAPI.getAllClasses();
            const uniqueClasses = Array.from(
                new Map(
                    (response.data || response).map(cls => [
                        cls.class_name || cls.name || cls.label || cls.value,
                        cls
                    ])
                ).values()
            );
            const options = uniqueClasses.map(cls =>
                cls.class_name || cls.name || cls.label || cls.value
            ).filter(Boolean); // Remove any undefined/null values
            setClassOptions(options);
        }
        fetchClasses();
    }, []);

    // State to manage the active tab (selected class)
    const [activeTab, setActiveTab] = useState(classOptions[0]); // Default to Nursery

    // State to manage the visibility of the Create/Edit Schedule modal
    const [showCreateScheduleModal, setShowCreateScheduleModal] = useState(false);

    // State to hold the schedule data when editing an existing schedule
    // This will be null for creating new, and an object { _id, classId, examType, subjectSlots } for editing
    const [editingSchedule, setEditingSchedule] = useState(null);

    // State to store all exam schedules in memory.
    // Each schedule object contains classId, examType, subjectSlots (array of {subject, date, time})
    const [allSchedules, setAllSchedules] = useState([]);

    // State for custom confirmation modal
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [scheduleToDeleteId, setScheduleToDeleteId] = useState(null);

    // Handler for opening the create/edit modal
    const handleCreateOrEditSchedule = (schedule = null) => {
        setEditingSchedule(schedule); // Set null for creating new, set schedule object for editing
        setShowCreateScheduleModal(true); // Open the modal
    };

    // Handler for saving a schedule (add new or update existing)
    const handleSaveSchedule = async (scheduleData) => {
        try {
            const token = JSON.parse(localStorage.getItem('authToken'));
            if (editingSchedule) {
                // Update existing schedule
                const response = await axios.put(
                    `${API_BASE_URL}/api/exam-schedule/${editingSchedule._id}`, // Use API_BASE_URL
                    scheduleData,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setAllSchedules(prevSchedules =>
                    prevSchedules.map(s => s._id === editingSchedule._id ? response.data.data : s)
                );
            } else {
                // Create new schedule
                const response = await axios.post(
                    `${API_BASE_URL}/api/exam-schedule/`, // Use API_BASE_URL
                    scheduleData,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setAllSchedules(prevSchedules => [...prevSchedules, response.data.data]);
            }
            setShowCreateScheduleModal(false);
            setEditingSchedule(null);
        } catch (error) {
            console.error("Error saving schedule:", error);
            // Custom message box for error
            const messageBox = document.createElement('div');
            messageBox.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
            messageBox.innerHTML = `
                <div class="bg-white p-6 rounded-lg shadow-lg text-center">
                    <p class="text-lg font-semibold text-red-800 mb-4">Failed to save schedule. Please try again.</p>
                    <button id="closeMessageBox" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">OK</button>
                </div>
            `;
            document.body.appendChild(messageBox);
            document.getElementById('closeMessageBox').onclick = () => {
                document.body.removeChild(messageBox);
            };
        }
    };

    // Handler for initiating delete confirmation
    const handleDeleteConfirmation = (scheduleId) => {
        setScheduleToDeleteId(scheduleId);
        setShowConfirmModal(true);
    };

    // Handler for deleting a schedule by its ID after confirmation
    const handleDeleteSchedule = async () => {
        setShowConfirmModal(false); // Close the confirmation modal
        if (!scheduleToDeleteId) return;

        try {
            const token = JSON.parse(localStorage.getItem('authToken'));
            await axios.delete(`${API_BASE_URL}/api/exam-schedule/${scheduleToDeleteId}`, { // Use API_BASE_URL
                headers: { Authorization: `Bearer ${token}` }
            });
            setAllSchedules(prevSchedules =>
                prevSchedules.filter(s => s._id !== scheduleToDeleteId)
            );
            setScheduleToDeleteId(null); // Clear the ID after deletion
            console.log("Schedule deleted successfully!");
        } catch (error) {
            console.error("Error deleting schedule:", error);
            // Custom message box for error
            const messageBox = document.createElement('div');
            messageBox.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
            messageBox.innerHTML = `
                <div class="bg-white p-6 rounded-lg shadow-lg text-center">
                    <p class="text-lg font-semibold text-red-800 mb-4">Failed to delete schedule. Please try again.</p>
                    <button id="closeMessageBox" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">OK</button>
                </div>
            `;
            document.body.appendChild(messageBox);
            document.getElementById('closeMessageBox').onclick = () => {
                document.body.removeChild(messageBox);
            };
        }
    };

    // Fetch schedules from backend on mount
    useEffect(() => {
        const fetchSchedules = async () => {
            try {
                const token = JSON.parse(localStorage.getItem('authToken'));
                const response = await axios.get(`${API_BASE_URL}/api/exam-schedule/`, { // Use API_BASE_URL
                    headers: { Authorization: `Bearer ${token}` }
                });
                // The backend returns { success, count, data: [schedules] }
                setAllSchedules(response.data.data);
            } catch (error) {
                console.error("Error fetching schedules:", error);
            }
        };
        fetchSchedules();
    }, []);

    return (
        <div className="px-0 sm:px-2 md:px-4 lg:p-6 flex flex-col gap-2 sm:gap-4 lg:gap-8">
            {/* Header and Create Schedule Button */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b border-gray-200">
                <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900 leading-tight mb-4 md:mb-0 flex items-center gap-3">
                    <LayoutList size={36} className="text-purple-600" />
                    Exam Schedules
                </h1>
                <button
                    onClick={() => handleCreateOrEditSchedule(null)}
                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition duration-200 shadow-md flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50 transform hover:-translate-y-0.5"
                >
                    <Plus className="mr-2" size={20} />
                    Create Schedule
                </button>
            </div>

            {/* Navigation Tabs for Classes */}
            <div className="flex flex-wrap gap-2 sm:gap-3 border-b border-gray-200 mb-8 pb-3 -mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto no-scrollbar">
                {classOptions.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-shrink-0 px-4 py-2 text-sm font-medium focus:outline-none transition-all duration-200 rounded-lg whitespace-nowrap
                            ${activeTab === tab
                                ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700 transform hover:-translate-y-0.5'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Tab Content Area */}
            <div className="bg-white rounded-lg shadow-md p-6 min-h-[400px] border border-gray-200">
                {/* ClassScheduleView displays schedules for the currently active class */}
                <ClassScheduleView
                    allSchedules={allSchedules} // Pass all schedules from the parent state
                    selectedClass={activeTab} // Pass the currently active class
                    onEditSchedule={handleCreateOrEditSchedule} // Pass handler for editing a schedule
                    onDeleteSchedule={handleDeleteConfirmation} // Use the new confirmation handler
                />
            </div>

            {/* Create/Edit Schedule Modal - rendered conditionally based on showCreateScheduleModal state */}
            {showCreateScheduleModal && (
                <CreateScheduleModal
                    initialData={editingSchedule} // Pass current schedule data for editing, null for creating
                    onClose={() => {
                        setShowCreateScheduleModal(false); // Close the modal
                        setEditingSchedule(null); // Reset editing state when modal closes
                    }}
                    onSave={handleSaveSchedule} // Pass the save handler
                    classOptions={classOptions} // Pass the list of class tabs for the dropdown in the modal
                    admin_id={user?.profile?._id || user?.profile?.userId || user?.profile?.user_id || ''} // Add admin ID
                />
            )}

            {/* Custom Confirmation Modal for Delete */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                        <p className="text-lg font-semibold text-gray-800 mb-4">Are you sure you want to delete this schedule?</p>
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={handleDeleteSchedule} // Call the actual delete handler
                                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                            >
                                Delete
                            </button>
                            <button
                                onClick={() => { setShowConfirmModal(false); setScheduleToDeleteId(null); }} // Close modal and clear state
                                className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SchedulesModule;