// ClassScheduleView.jsx
import React, { useState, useEffect } from 'react';
import { FiEdit, FiTrash2 } from 'react-icons/fi'; // Icons for edit and delete

// Define all possible individual exam types for consistency
const AllExamTypes = [
  "Formative Assessment 1", "Formative Assessment 2", "Formative Assessment 3",
  "Summative Assessment 1", "Summative Assessment 2", "Summative Assessment 3"
];

// Helper function to categorize and sort schedules based on the simplified data structure
const categorizeAndSortSchedules = (schedules, selectedClass) => {
  const categories = {
    "Formative Assessment": [], // Will hold schedule objects for FA1, FA2, FA3 for the selected class
    "Summative Assessment": [] // Will hold schedule objects for SA1, SA2, SA3 for the selected class
  };

  // 1. Filter schedules relevant to the currently selected class
  const filteredByClass = schedules.filter(
    (schedule) => schedule.classId === selectedClass
  );

  // 2. Assign each filtered schedule to its main category
  filteredByClass.forEach(schedule => {
    // Ensure the examType is one of the predefined types
    if (AllExamTypes.includes(schedule.examType)) {
        if (schedule.examType.includes("Formative Assessment")) {
            categories["Formative Assessment"].push(schedule);
        } else if (schedule.examType.includes("Summative Assessment")) {
            categories["Summative Assessment"].push(schedule);
        }
    }
  });

  // 3. Sort schedules within each category by date and then time for chronological display
  Object.values(categories).forEach(categorySchedules => {
    categorySchedules.sort((a, b) => {
      const dateTimeA = new Date(`${a.date}T${a.time}`);
      const dateTimeB = new Date(`${b.date}T${b.time}`);
      return dateTimeA - dateTimeB;
    });
  });

  return categories;
};

// Helper function to flatten schedules for display
const flattenSchedules = (schedules, selectedClass) => {
  const AllExamTypes = [
    "Formative Assessment 1", "Formative Assessment 2", "Formative Assessment 3",
    "Summative Assessment 1", "Summative Assessment 2", "Summative Assessment 3"
  ];
  const categories = {
    "Formative Assessment": [],
    "Summative Assessment": []
  };
  // Filter and flatten
  schedules.filter(s => s.classId === selectedClass && AllExamTypes.includes(s.examType)).forEach(schedule => {
    if (Array.isArray(schedule.subjectSlots)) {
      schedule.subjectSlots.forEach(slot => {
        const flat = {
          _id: schedule._id,
          classId: schedule.classId,
          examType: schedule.examType,
          subject: slot.subject,
          date: slot.date,
          time: slot.time,
          subjectSlotIndex: schedule.subjectSlots.indexOf(slot),
          fullSchedule: schedule // for edit/delete
        };
        if (schedule.examType.includes("Formative Assessment")) {
          categories["Formative Assessment"].push(flat);
        } else if (schedule.examType.includes("Summative Assessment")) {
          categories["Summative Assessment"].push(flat);
        }
      });
    }
  });
  // Sort by date/time
  Object.values(categories).forEach(arr => arr.sort((a, b) => {
    const dateTimeA = new Date(`${a.date}T${a.time}`);
    const dateTimeB = new Date(`${b.date}T${b.time}`);
    return dateTimeA - dateTimeB;
  }));
  return categories;
};


const ClassScheduleView = ({ allSchedules, selectedClass, onEditSchedule, onDeleteSchedule }) => {
  const [categorizedSchedules, setCategorizedSchedules] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true); // Indicate loading when data processing starts
    setError(null); // Clear any previous errors

    try {
      // Process and categorize the schedules received from the parent
      const categories = flattenSchedules(allSchedules, selectedClass);
      setCategorizedSchedules(categories);
    } catch (err) {
      console.error("Error categorizing schedules:", err);
      setError("Failed to process schedules for display. Please check data format.");
    } finally {
      setLoading(false); // Hide loading indicator once processing is done
    }

  }, [allSchedules, selectedClass]); // Re-run this effect when allSchedules data or selectedClass changes

  // Display loading state
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 text-gray-700">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-3">Loading schedules for {selectedClass}...</p>
      </div>
    );
  }

  // Display error message if processing failed
  if (error) {
    return <div className="text-red-600 text-center py-8 text-lg font-medium">{error}</div>;
  }

  // Determine if there are any schedules at all for the selected class across all categories
  const hasAnySchedules = categorizedSchedules && Object.values(categorizedSchedules).some(arr => arr.length > 0);

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">{selectedClass} Exam Schedule</h2>

      {/* Message displayed if no schedules exist for the current class in any category */}
      {!hasAnySchedules && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 p-6 rounded-lg shadow-md" role="alert">
          <p className="font-bold text-lg mb-2">No Exam Schedules Created!</p>
          <p>There are no exam schedules for <span className="font-semibold">{selectedClass}</span> across any assessment types yet. Click 'Create Schedule' above to add one.</p>
        </div>
      )}

      {/* Formative Assessment Section */}
        <h3 className="text-xl font-bold text-gray-800 mb-4">Formative Assessment</h3>
        {/* Check if there are any formative schedules for the current class */}
        {categorizedSchedules["Formative Assessment"].length === 0 ? (
          <div className="bg-gray-50 border-l-4 border-gray-300 text-gray-700 p-4 rounded-md">
            <p>No available schedules for Formative Assessments in {selectedClass}.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg shadow-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* Iterate over each individual formative schedule */}
                {categorizedSchedules["Formative Assessment"].map((flat, idx) => (
                  <tr key={flat._id + '-' + flat.subjectSlotIndex} className="hover:bg-blue-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{flat.examType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{flat.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{flat.time}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{flat.subject}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => onEditSchedule(flat.fullSchedule)} // Pass the entire schedule object for editing
                        className="text-blue-600 hover:text-blue-800 mr-4 inline-flex items-center text-sm transition duration-150 ease-in-out transform hover:scale-105 px-2 py-1 border border-blue-600 rounded-md"
                        title={`Edit ${flat.examType}`}
                      >
                        <FiEdit className="mr-1" /> Edit
                      </button>
                      <button
                        onClick={() => onDeleteSchedule(flat._id)} // Pass schedule ID for deletion
                        className="text-red-600 hover:text-red-800 inline-flex items-center text-sm transition duration-150 ease-in-out transform hover:scale-105 px-2 py-1 border border-red-600 rounded-md"
                        title={`Delete ${flat.examType}`}
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

      {/* Summative Assessment Section */}
        <h3 className="text-xl font-bold text-gray-800 mb-4">Summative Assessment</h3>
        {/* Check if there are any summative schedules for the current class */}
        {categorizedSchedules["Summative Assessment"].length === 0 ? (
          <div className="bg-gray-50 border-l-4 border-gray-300 text-gray-700 p-4 rounded-md">
            <p>No available schedules for Summative Assessments in {selectedClass}.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg shadow-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* Iterate over each individual summative schedule */}
                {categorizedSchedules["Summative Assessment"].map((flat, idx) => (
                  <tr key={flat._id + '-' + flat.subjectSlotIndex} className="hover:bg-blue-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{flat.examType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{flat.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{flat.time}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{flat.subject}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => onEditSchedule(flat.fullSchedule)} // Pass the entire schedule object for editing
                        className="text-blue-600 hover:text-blue-800 mr-4 inline-flex items-center text-sm transition duration-150 ease-in-out transform hover:scale-105 px-2 py-1 border border-blue-600 rounded-md"
                        title={`Edit ${flat.examType}`}
                      >
                        <FiEdit className="mr-1" /> Edit
                      </button>
                      <button
                        onClick={() => onDeleteSchedule(flat._id)} // Pass schedule ID for deletion
                        className="text-red-600 hover:text-red-800 inline-flex items-center text-sm transition duration-150 ease-in-out transform hover:scale-105 px-2 py-1 border border-red-600 rounded-md"
                        title={`Delete ${flat.examType}`}
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
  );
};

export default ClassScheduleView;
