// RegularScheduleViewStudent.jsx
import React, { useState, useEffect } from 'react';
import { teacherScheduleAPI,regularScheduleAPI } from '../../../services/api';

// Define days of the week in order for consistent display
const DaysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const RegularScheduleViewStudent = () => {
  const [groupedSchedules, setGroupedSchedules] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get user_id from localStorage userprofile
        const userProfile = JSON.parse(localStorage.getItem('userprofile'));
        const userId = userProfile?.user_id;
        
        if (!userId) {
          setError('User information not available. Please log in again.');
          setLoading(false);
          return;
        }

        console.log('Fetching schedules for student:', userId);
        
        // Fetch schedules from backend using the new API endpoint
        const response = await regularScheduleAPI.getALlRegularSchedules();
        console.log('regular schedules are good ',response.data);
        
        
        const schedules = response.data || [];

        // Group schedules by day of the week
        const grouped = {};
        DaysOfWeek.forEach(day => {
          grouped[day] = []; // Initialize all days as empty arrays
        });

        // Group schedules by day of the week
        schedules.forEach(schedule => {
          if (grouped[schedule.dayOfWeek]) {
            grouped[schedule.dayOfWeek].push(schedule);
          }
        });

        // Sort schedules within each day by start time
        Object.values(grouped).forEach(daySchedules => {
          daySchedules.sort((a, b) => {
            const timeA = new Date(`1970/01/01 ${a.startTime}`);
            const timeB = new Date(`1970/01/01 ${b.startTime}`);
            return timeA - timeB;
          });
        });

        setGroupedSchedules(grouped);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching schedules:', err);
        setError('Failed to load schedules. Please try again.');
        setLoading(false);
      }
    };

    fetchSchedules();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 text-gray-700">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-3">Loading your regular schedules...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 text-red-800 p-6 rounded-lg shadow-md" role="alert">
        <p className="font-bold text-lg mb-2">Error Loading Schedules</p>
        <p>{error}</p>
      </div>
    );
  }

  const hasAnyRegularSchedules = Object.values(groupedSchedules).some(arr => arr.length > 0);

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">My Regular Class Schedule</h2>

      {!hasAnyRegularSchedules && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 p-6 rounded-lg shadow-md" role="alert">
          <p className="font-bold text-lg mb-2">No Regular Schedules Found!</p>
          <p>There are no regular class schedules available for your enrolled classes.</p>
        </div>
      )}

      {DaysOfWeek.map(day => (
        <div key={day}>
          <h3 className="text-xl font-bold text-gray-800 mb-4">{day}</h3>
          {groupedSchedules[day].length === 0 ? (
            <div className="bg-gray-50 border-l-4 border-gray-300 text-gray-700 p-4 rounded-md">
              <p>No classes scheduled for {day}.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg shadow-md">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                    {/* No Actions column for read-only view */}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {groupedSchedules[day].map(schedule => (
                    <tr key={schedule._id} className="hover:bg-blue-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{schedule.startTime} - {schedule.endTime}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{schedule.subject}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{schedule.period}</td>
                      {/* No buttons for read-only view */}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default RegularScheduleViewStudent;
