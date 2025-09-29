// RegularScheduleView.jsx
import React, { useState, useEffect } from 'react';
import { FiEdit, FiTrash2 } from 'react-icons/fi'; // Icons for edit and delete

// Define days of the week in order for consistent display
const DaysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const RegularScheduleView = ({ teacherRegularSchedules, onEditRegularSchedule, onDeleteRegularSchedule }) => {
  const [groupedSchedules, setGroupedSchedules] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    console.log('Processing teacherRegularSchedules:', teacherRegularSchedules);
    
    const grouped = {};
    DaysOfWeek.forEach(day => {
      grouped[day] = []; // Initialize all days as empty arrays
    });

    // Ensure teacherRegularSchedules is an array before processing
    if (Array.isArray(teacherRegularSchedules)) {
      console.log('Processing array with length:', teacherRegularSchedules.length);
      
      // Group schedules by day of the week
      teacherRegularSchedules.forEach((schedule, index) => {
        console.log(`Schedule ${index}:`, schedule);
        console.log(`Day of week: ${schedule.dayOfWeek}`);
        
        if (schedule.dayOfWeek && grouped[schedule.dayOfWeek]) {
          grouped[schedule.dayOfWeek].push(schedule);
          console.log(`Added to ${schedule.dayOfWeek}`);
        } else {
          console.warn(`Invalid day of week: ${schedule.dayOfWeek}`);
        }
      });
    } else {
      console.warn('teacherRegularSchedules is not an array:', teacherRegularSchedules);
    }

    // Sort schedules within each day by start time
    Object.keys(grouped).forEach(day => {
      grouped[day].sort((a, b) => {
        const timeA = new Date(`1970/01/01 ${a.startTime}`);
        const timeB = new Date(`1970/01/01 ${b.startTime}`);
        return timeA - timeB;
      });
      console.log(`${day} has ${grouped[day].length} schedules:`, grouped[day]);
    });

    console.log('Final grouped schedules:', grouped);
    setGroupedSchedules(grouped);
    setLoading(false);
  }, [teacherRegularSchedules]); // Re-run effect when teacherRegularSchedules changes

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 text-gray-700">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-3">Loading your regular schedules...</p>
      </div>
    );
  }

  const hasAnyRegularSchedules = Object.values(groupedSchedules).some(arr => arr.length > 0);

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">My Regular Teaching Schedule</h2>

      {!hasAnyRegularSchedules && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 p-6 rounded-lg shadow-md" role="alert">
          <p className="font-bold text-lg mb-2">No Regular Schedules Found!</p>
          <p>You currently have no regular teaching schedules. Click 'Create Regular Schedule' above to add one.</p>
        </div>
      )}

      {DaysOfWeek.map(day => (
        <div key={day} className="border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="text-2xl font-bold text-blue-600 mb-4 border-b border-gray-200 pb-2">{day}</h3>
          {groupedSchedules[day].length === 0 ? (
            <div className="bg-gray-50 border-l-4 border-gray-300 text-gray-700 p-4 rounded-md">
              <p className="text-lg">No classes scheduled for {day}.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg shadow-md">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th> {/* Updated from Class */}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {groupedSchedules[day].map(schedule => (
                    <tr key={schedule.id} className="hover:bg-blue-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{schedule.startTime} - {schedule.endTime}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{schedule.subject}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{schedule.period}</td> {/* Updated from classId */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => onEditRegularSchedule(schedule)}
                          className="text-blue-600 hover:text-blue-800 mr-4 inline-flex items-center text-sm transition duration-150 ease-in-out transform hover:scale-105 px-2 py-1 border border-blue-600 rounded-md"
                          title="Edit Regular Schedule"
                        >
                          <FiEdit className="mr-1" /> Edit
                        </button>
                        <button
                          onClick={() => onDeleteRegularSchedule(schedule._id)}
                          className="text-red-600 hover:text-red-800 inline-flex items-center text-sm transition duration-150 ease-in-out transform hover:scale-105 px-2 py-1 border border-red-600 rounded-md"
                          title="Delete Regular Schedule"
                        >
                          <FiTrash2 className="mr-1" /> Delete
                        </button>
                      </td>
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

export default RegularScheduleView;