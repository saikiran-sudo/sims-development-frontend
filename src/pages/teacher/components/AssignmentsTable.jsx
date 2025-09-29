import React, { useState } from "react";
import { BookOpen, Calendar, CheckCircle, Clock, XCircle, ChevronLeft, ChevronRight } from 'lucide-react'; // Lucide icons

const AssignmentsTable = ({ assignments = [] }) => {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Increased items per page for a slightly larger table

  // Calculate pagination
  const totalPages = Math.ceil(assignments.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = assignments.slice(indexOfFirstItem, indexOfLastItem);

  // Status color mapping with icons
  const getStatusDisplay = (status) => {
    switch (status.toLowerCase()) {
      case "completed": return (
        <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
          <CheckCircle size={14} /> {status}
        </span>
      );
      case "pending": return (
        <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
          <Clock size={14} /> {status}
        </span>
      );
      case "late": return (
        <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
          <XCircle size={14} /> {status}
        </span>
      );
      default: return (
        <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
          {status}
        </span>
      );
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'No due date';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
        <BookOpen size={28} className="text-purple-600" /> Recent Assignments
      </h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignment</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentItems.length > 0 ? (
              currentItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.assignment}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.class}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 flex items-center gap-2">
                    <Calendar size={16} className="text-gray-400" /> {formatDate(item.dueDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusDisplay(item.status)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="px-6 py-8 text-center text-gray-500 text-lg italic">
                  No assignments to display.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {assignments.length > itemsPerPage && (
        <div className="flex flex-col sm:flex-row items-center justify-between mt-6 pt-4 border-t border-gray-200">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-semibold">{indexOfFirstItem + 1}</span> to{" "}
              <span className="font-semibold">
                {Math.min(indexOfLastItem, assignments.length)}
              </span>{" "}
              of <span className="font-semibold">{assignments.length}</span> assignments
            </p>
          </div>
          <div className="flex space-x-2 mt-4 sm:mt-0">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-1
                ${currentPage === 1 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'}`}
            >
              <ChevronLeft size={16} /> Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200
                  ${currentPage === i + 1 ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-1
                ${currentPage === totalPages ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'}`}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentsTable;
