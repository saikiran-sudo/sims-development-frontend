// SchedulesModule.jsx
import React, { useState, useEffect } from 'react';
import RegularScheduleViewStudent from './RegularScheduleViewStudent';
import ExamScheduleViewStudent from './ExamScheduleViewStudent';
import { CalendarDays } from 'lucide-react'; // Assuming you're using lucide-react for icons
import { examScheduleAPI, regularScheduleAPI, teacherAPI } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

// Access API_BASE_URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'; // Fallback for development

const SchedulesModule = () => {
  // Define tabs for the student panel
  const tabs = ["Regular Schedule", "Exam Schedule"];
  const [activeTab, setActiveTab] = useState(tabs[0]); // Default to "Regular Schedule"

  // Get current user from auth context
  const { user } = useAuth();

  // State for exam schedules data
  const [adminExamSchedules, setAdminExamSchedules] = useState([]);
  const [regularSchedules, setRegularSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get current student's class from user profile - use class_id field
  const studentClassId = user?.profile?.class_id || '';

  // Fetch exam schedules from backend
  const fetchExamSchedules = async () => {
    try {
      setLoading(true);
      setError(null);


      // Use the examScheduleAPI service
      const response = await examScheduleAPI.getAllExamSchedules();

      console.log('Exam schedules response.data:', response.data);

      let examSchedulesData = [];
      if (response && response.data) {
        // Check if response.data has success property and data array
        if (response.data.success && response.data.data && Array.isArray(response.data.data)) {
          examSchedulesData = response.data.data;
        }
        // Check if response.data is directly an array
        else if (Array.isArray(response.data)) {
          examSchedulesData = response.data;
        }
        // Check if response.data has a schedules property
        else if (response.data.schedules && Array.isArray(response.data.schedules)) {
          examSchedulesData = response.data.schedules;
        }
      }

      if (examSchedulesData.length > 0) {
        // Transform the exam schedule data to match the expected format
        const transformedSchedules = examSchedulesData.flatMap(schedule =>
          schedule.subjectSlots.map(slot => ({
            id: `${schedule._id}_${slot.subject}`,
            classId: schedule.classId,
            examType: schedule.examType,
            date: slot.date,
            time: slot.time,
            subject: slot.subject
          }))
        );

        setAdminExamSchedules(transformedSchedules);
      } else {
        console.log('No exam schedules data found');
        setAdminExamSchedules([]);
      }
    } catch (err) {
      console.error('Error fetching exam schedules:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response,
        status: err.response?.status,
        data: err.response?.data
      });
      setError('Failed to fetch exam schedules');
      setAdminExamSchedules([]);
    } finally {
      setLoading(false);
    }
  };


  // Fetch data when component mounts or tab changes
  useEffect(() => {
    if (activeTab === "Exam Schedule") {
      fetchExamSchedules();
    }
  }, [activeTab, user, studentClassId]);

  return (
    <div className="px-0 sm:px-2 md:px-4 lg:p-6 flex flex-col gap-2 sm:gap-4 lg:gap-8">
      <div className="flex items-center gap-3">
        <CalendarDays size={32} className="text-blue-600" />
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Class & Exam Schedules
        </h1>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-gray-200 mb-6 sticky top-0 bg-gray-50 z-10 p-1 -mx-6 w-[calc(100%+3rem)]">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium rounded-t-lg transition duration-200 ease-in-out text-sm md:text-base
              ${activeTab === tab
                ? 'text-blue-600 border-b-2 border-blue-600 bg-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 text-red-700 p-4 rounded-lg shadow-md" role="alert">
          <p className="font-bold text-lg mb-2">Error!</p>
          <p>{error}</p>
        </div>
      )}


      {/* Loading State - only show for exam schedules */}
      {loading && activeTab === "Exam Schedule" && (
        <div className="flex flex-col justify-center items-center h-64 text-gray-700">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-3">Loading exam schedules...</p>
        </div>
      )}

      {/* Tab Content Area */}
      <div className="bg-white rounded-lg shadow p-6 min-h-[400px]">
        {activeTab === "Regular Schedule" && (
          <RegularScheduleViewStudent />
        )}
        {activeTab === "Exam Schedule" && !loading && (
          <ExamScheduleViewStudent
            adminExamSchedules={adminExamSchedules}
            studentClassId={studentClassId}
          />
        )}
      </div>
    </div>
  );
};

export default SchedulesModule;
