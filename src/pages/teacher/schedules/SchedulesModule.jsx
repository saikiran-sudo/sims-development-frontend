import React, { useState, useEffect } from 'react';
import RegularScheduleView from './RegularScheduleView';
import ExamScheduleViewTeacher from './ExamScheduleViewTeacher';
import CreateRegularScheduleModal from './CreateRegularScheduleModal';
import { FiPlus } from 'react-icons/fi';
import { CalendarDays } from 'lucide-react';
import { teacherScheduleAPI, examScheduleAPI } from '../../../services/api';

const SchedulesModule = () => {
  const userprofileval = JSON.parse(localStorage.getItem('userprofile'));
  // Constants
  const TABS = ["Regular Schedule", "Exam Schedule"];
  const CURRENT_TEACHER_ID = userprofileval?.user_id; // Replace with actual auth in production
  
  // Check if user profile is available
  if (!userprofileval || !CURRENT_TEACHER_ID) {
    return (
      <div className="px-0 sm:px-4 lg:px-6 py-4 space-y-6">
        <div className="text-center text-red-500">
          User profile not found. Please log in again.
        </div>
      </div>
    );
  }
  
  console.log('User profile:', userprofileval);
  console.log('Current teacher ID:', CURRENT_TEACHER_ID);

  // State management
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [teacherRegularSchedules, setTeacherRegularSchedules] = useState([]);
  const [adminExamSchedules, setAdminExamSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch teacher regular schedules from backend
  useEffect(() => {
    if (activeTab === TABS[0]) {
      console.log('Fetching schedules for teacher ID:', CURRENT_TEACHER_ID);
      setLoading(true);
      setError(null);
      
      if (!CURRENT_TEACHER_ID) {
        console.error('No teacher ID found');
        setError('No teacher ID found');
        setLoading(false);
        return;
      }
      
      teacherScheduleAPI.getScheduleByTeacher(CURRENT_TEACHER_ID)
        .then(response => {
          // Ensure data is an array
          if (Array.isArray(response.data)) {
            setTeacherRegularSchedules(response.data);
          } else {
            console.error('Expected array but got:', response.data);
            setTeacherRegularSchedules([]);
          }
          setLoading(false);
        })
        .catch(err => {
          console.error('Error fetching schedules:', err);
          setError('Failed to fetch schedules');
          setTeacherRegularSchedules([]);
          setLoading(false);
        });
    }
  }, [activeTab, showCreateModal, CURRENT_TEACHER_ID]);

  // Fetch exam schedules from backend
  useEffect(() => {
    if (activeTab === TABS[1]) {
      setLoading(true);
      examScheduleAPI.getAllExamSchedules()
        .then(response => {
          if (response.data.success) {
            // Flatten subjectSlots for teacher view
            const flat = response.data.data.flatMap(sch =>
              sch.subjectSlots.map(slot => ({
                id: sch._id,
                classId: sch.classId,
                examType: sch.examType,
                date: slot.date,
                time: slot.time,
                subject: slot.subject
              }))
            );
            setAdminExamSchedules(flat);
          } else {
            setAdminExamSchedules([]);
          }
          setLoading(false);
        })
        .catch(err => {
          console.error('Error fetching exam schedules:', err);
          setError('Failed to fetch exam schedules');
          setLoading(false);
        });
    }
  }, [activeTab]);

  // Handlers
  const handleCreateOrEditSchedule = (schedule = null) => {
    setEditingSchedule(schedule);
    setShowCreateModal(true);
  };

  const handleSaveSchedule = (scheduleData) => {
    setLoading(true);
    setError(null);

    // Only send the first subject slot
    const firstSlot = scheduleData.subjectSlots[0];
    if (!firstSlot) {
      setError('At least one subject slot is required.');
      setLoading(false);
      return;
    }

    // Validate all required fields
    if (!scheduleData.weekDay || !scheduleData.period || !firstSlot.subject || !firstSlot.startTime || !firstSlot.endTime) {
      setError('All fields are required: Day of Week, Period, Subject, Start Time, End Time');
      setLoading(false);
      return;
    }

    const payload = {
      teacherId: CURRENT_TEACHER_ID,
      dayOfWeek: scheduleData.weekDay,
      period: scheduleData.period, // Updated from classId to period
      subject: firstSlot.subject,
      startTime: firstSlot.startTime,
      endTime: firstSlot.endTime,
    };
    
    if (editingSchedule) {
      // Update existing schedule
      teacherScheduleAPI.updateTeacherSchedule(editingSchedule._id, payload)
        .then(() => {
          setShowCreateModal(false);
          setEditingSchedule(null);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Error updating schedule:', err);
          const errorMessage = err.response?.data?.error || 'Failed to update schedule';
          setError(errorMessage);
          setLoading(false);
        });
    } else {
      // Create new schedule
      teacherScheduleAPI.createTeacherSchedule(payload)
        .then(() => {
          setShowCreateModal(false);
          setEditingSchedule(null);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Error creating schedule:', err);
          const errorMessage = err.response?.data?.error || 'Failed to create schedule';
          setError(errorMessage);
          setLoading(false);
        });
    }
  };

  const handleDeleteSchedule = (scheduleId) => {
    if (window.confirm("Are you sure you want to delete this schedule?")) {
      setLoading(true);
      setError(null);
      
      teacherScheduleAPI.deleteTeacherSchedule(scheduleId)
        .then(() => {
          setLoading(false);
        })
        .catch((err) => {
          console.error('Error deleting schedule:', err);
          setError('Failed to delete schedule');
          setLoading(false);
        });
    }
  };

  // Filter current teacher's schedules (already filtered by backend)
  const currentTeacherSchedules = teacherRegularSchedules;

  return (
    <div className="px-0 sm:px-4 lg:px-6 py-4 space-y-6">
      {/* Header Section */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <CalendarDays size={32} className="text-blue-600" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Class & Exam Schedules
          </h1>
        </div>
        {activeTab === TABS[0] && (
          <button
            onClick={() => handleCreateOrEditSchedule()}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            aria-label="Create new schedule"
          >
            <FiPlus size={18} />
            <span>Create Regular Schedule</span>
          </button>
        )}
      </header>

      {/* Tab Navigation */}
      <nav className="sticky top-0 z-10 bg-white border-b border-gray-200 -mx-4 sm:-mx-6 px-4 sm:px-6">
        <div className="flex space-x-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium relative transition-colors duration-200
                ${
                  activeTab === tab
                    ? 'text-blue-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="bg-white rounded-lg shadow p-6 min-h-[400px]">
        {loading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : error ? (
          <div className="text-center text-red-500">{error}</div>
        ) : activeTab === TABS[0] ? (
          <RegularScheduleView
            teacherRegularSchedules={currentTeacherSchedules}
            onEditRegularSchedule={handleCreateOrEditSchedule}
            onDeleteRegularSchedule={handleDeleteSchedule}
          />
        ) : (
          <ExamScheduleViewTeacher
            adminExamSchedules={adminExamSchedules}
          />
        )}
      </main>

      {/* Modal */}
      {showCreateModal && (
        <CreateRegularScheduleModal
          initialData={editingSchedule}
          onClose={() => {
            setShowCreateModal(false);
            setEditingSchedule(null);
          }}
          onSave={handleSaveSchedule}
          // The classTabs prop is no longer needed
        />
      )}
    </div>
  );
};

export default SchedulesModule;