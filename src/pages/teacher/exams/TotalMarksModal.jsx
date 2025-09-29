// TotalMarksModal.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { XCircle, Maximize2 } from 'lucide-react'; // Import icons for close and potential expand (optional)

function TotalMarksModal({ onClose, onSaveMarks, initialSubjectsConfig }) {
  const [subjectMaxMarks, setSubjectMaxMarks] = useState({});

  // Initialize state with current max marks from props
  useEffect(() => {
    const initialMarks = {};
    Object.keys(initialSubjectsConfig).forEach(subject => {
      initialMarks[subject] = initialSubjectsConfig[subject].maxMarks;
    });
    setSubjectMaxMarks(initialMarks);
  }, [initialSubjectsConfig]); // Re-run if initial config changes

  const handleChange = (subject, value) => {
    // Ensure value is a number and non-negative
    const numericValue = parseInt(value, 10);
    setSubjectMaxMarks(prevMarks => ({
      ...prevMarks,
      [subject]: isNaN(numericValue) || numericValue < 0 ? 0 : numericValue,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSaveMarks) {
      onSaveMarks(subjectMaxMarks);
    }
    onClose(); // Close the modal after saving
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="relative bg-white rounded-xl shadow-2xl p-8 w-full max-w-lg transform transition-all duration-300 scale-100 opacity-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          <XCircle size={24} />
        </button>
        <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-3 flex items-center gap-2">
          <Maximize2 size={24} className="text-purple-600" /> Set Exam Max Marks
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="overflow-y-auto max-h-80 pr-2"> {/* Added pr-2 for scrollbar spacing */}
            {Object.keys(initialSubjectsConfig).map(subject => (
              <div key={subject} className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100 last:border-b-0">
                <label htmlFor={`max-marks-${subject}`} className="text-lg font-medium text-gray-700 w-2/3">
                  {subject}:
                </label>
                <input
                  id={`max-marks-${subject}`}
                  type="number"
                  value={subjectMaxMarks[subject] || ''}
                  onChange={(e) => handleChange(subject, e.target.value)}
                  min="0"
                  className="w-1/3 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 text-right"
                  placeholder="Max Marks"
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3 mt-8 border-t pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-lg bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition transform hover:scale-105 shadow-md"
            >
              Save Marks
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TotalMarksModal;