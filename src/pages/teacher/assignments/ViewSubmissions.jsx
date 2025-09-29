import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { saveAs } from 'file-saver';
import {
  FileText, // For View Details button
  Edit, // For Grade/Edit button
  ArrowLeft, // For back button
  UserCheck, // Main icon for Submissions
  Download, // For download button
} from 'lucide-react';

const token = JSON.parse(localStorage.getItem('authToken'));

// Access API_BASE_URL from environment variables
const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'; // Fallback for development
const API_BASE_URL = `${API_URL}/api`; // Use the base URL for the API endpoint

const ViewSubmissions = ({ onBackToAssignmentModule, selectedClassFilter, allAvailableClasses }) => {
  const [allSubmissions, setAllSubmissions] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  // State for filters and search
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterClass, setFilterClass] = useState(selectedClassFilter || "All");
  const [searchTerm, setSearchTerm] = useState("");

  // States for modal management
  const [showViewDetailsModal, setShowViewDetailsModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [currentGrade, setCurrentGrade] = useState('');
  const [currentFeedback, setCurrentFeedback] = useState('');

  // Use the allAvailableClasses prop if passed, otherwise define locally
  const availableClasses = allAvailableClasses || ["All", "Class 9", "Class 10", "Class 11"];
  const allAvailableStatuses = ["All", "Graded", "Pending", "Late"];

  useEffect(() => {
    const fetchAllSubmissions = async () => {
      setLoading(true);
      try {
        // Fetch all assignments
        const assignmentsRes = await axios.get(`${API_BASE_URL}/assignments/under-my-admin`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        setAssignments(assignmentsRes.data);
        // Fetch submissions for each assignment directly from backend
        const submissionsArr = await Promise.all(
          assignmentsRes.data.map(async (assignment) => {
            try {
              // Validate that assignment._id is a valid ObjectId
              if (!assignment._id || typeof assignment._id !== 'string' || assignment._id.length !== 24) {
                console.error('Invalid assignment ID format in ViewSubmissions:', assignment._id);
                return [];
              }
              
              const res = await axios.get(`${API_BASE_URL}/assignment-submissions/${assignment._id}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
              });
              // Each submission has files: []
              return res.data.map(sub => ({
                ...sub,
                assignmentTitle: assignment.title,
                class: assignment.class?.class_name || '',
                section: assignment.section || '',
                subject: assignment.subject?.name || '',
                student_id: sub.student_id || null, // Add the full student_id object
                studentName: sub.student_id ? `${sub.student_id.full_name}(${sub.student_id.user_id})` : '',
                submittedDate: sub.submitted_at ? new Date(sub.submitted_at).toISOString().slice(0, 10) : '',
                status: sub.grade ? 'Graded' : 'Pending',
                grade: sub.grade || '-',
                feedback: sub.remarks || '',
                files: Array.isArray(sub.files) ? sub.files : [], // Always array
                submissionId: sub._id,
              }));
            } catch (err) {
              console.error('Error fetching submissions for assignment in ViewSubmissions:', assignment._id, err.message);
              return [];
            }
          })
        );
        setAllSubmissions(submissionsArr.flat());
      } catch (err) {
        // handle error
      }
      setLoading(false);
    };
    fetchAllSubmissions();
  }, []);

  // Filter submissions based on current criteria
  const filteredSubmissions = allSubmissions.filter(submission => {
    const matchesStatus = filterStatus === "All" || submission.status === filterStatus;
    const matchesClass = filterClass === "All" || submission.class === filterClass;
    const matchesSearch = searchTerm === "" ||
      submission.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.assignmentTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.subject.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesClass && matchesSearch;
  });

  // Helper to get file extension from URL
  function getFileExtension(url) {
    const match = url ? url.match(/\.[0-9a-z]+$/i) : null;
    return match ? match[0] : '';
  }

  // Handle Download: Download all files for a submission
  const handleDownload = async (submissionId) => {
    const submission = allSubmissions.find(s => s.submissionId === submissionId);
    if (submission && submission.files && submission.files.length > 0) {
      try {
        for (let i = 0; i < submission.files.length; i++) {
          const fileUrl = submission.files[i];
          const response = await axios.get(fileUrl, { responseType: 'blob' });
          saveAs(
            response.data,
            `${submission.studentName.replace(/\s/g, '_')}_${submission.assignmentTitle.replace(/\s/g, '_')}_file${i + 1}${getFileExtension(fileUrl)}`
          );
        }
        alert(`Downloading ${submission.files.length} file(s) for ${submission.studentName}.`);
      } catch (err) {
        alert("Failed to download file(s).");
      }
    } else {
      alert("No file(s) available for download for this submission.");
    }
  };

  // Handle View Details: Opens a modal with submission details
  const handleViewDetails = (submissionId) => {
    const submission = allSubmissions.find(s => s.submissionId === submissionId);
    setSelectedSubmission(submission);
    setShowViewDetailsModal(true);
  };

  // Handle Grade: Opens a modal to input grade and feedback
  const handleGrade = (submissionId) => {
    const submission = allSubmissions.find(s => s.submissionId === submissionId);
    setSelectedSubmission(submission);
    setCurrentGrade(submission?.grade === '-' ? '' : submission?.grade || '');
    setCurrentFeedback(submission?.feedback || '');
    setShowGradeModal(true);
  };

  // Handle saving the grade from the modal (PUT to backend)
  const saveGrade = async () => {
    if (!selectedSubmission) return;
    try {
      await axios.put(`${API_BASE_URL}/assignment-submissions/grade/${selectedSubmission.submissionId}/under-my-admin`, {
        grade: currentGrade,
        remarks: currentFeedback,
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setAllSubmissions(prevSubmissions =>
        prevSubmissions.map(s =>
          s.submissionId === selectedSubmission.submissionId
            ? {
              ...s,
              grade: currentGrade.trim() === "" ? "-" : currentGrade,
              feedback: currentFeedback,
              status: "Graded" // Mark as graded
            }
            : s
        )
      );
      alert(`Graded submission ${selectedSubmission.submissionId}: Grade - ${currentGrade}, Feedback - ${currentFeedback}`);
      setShowGradeModal(false); // Close modal after saving
      setSelectedSubmission(null);
      setCurrentGrade('');
      setCurrentFeedback('');
    } catch (err) {
      alert("Failed to save grade.");
    }
  };

  // Function to go back to AssignmentModule using the prop
  const handleGoBack = () => {
    onBackToAssignmentModule(filterClass);
  };

  return (
    <div className="px-0 sm:px-2 md:px-4 lg:p-6 flex flex-col gap-2 sm:gap-4 lg:gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b border-gray-200">
        <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900 leading-tight mb-4 md:mb-0 flex items-center gap-3">
          <UserCheck size={36} className="text-blue-600" />
          Student Submissions
        </h1>
        <button
          onClick={handleGoBack}
          className="px-5 py-2.5 bg-gray-600 text-white rounded-lg text-sm font-semibold hover:bg-gray-700 transition duration-200 shadow-md flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-gray-500 focus:ring-opacity-50 transform hover:-translate-y-0.5"
        >
          <ArrowLeft className="mr-2" size={20} /> Back to Assignments
        </button>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Search Submissions:</label>
          <input
            type="text"
            id="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by student, assignment, subject..."
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 transition-colors"
          />
        </div>
        <div>
          <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">Filter by Status:</label>
          <div className="relative">
            <select
              id="statusFilter"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="block w-full px-4 py-2.5 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white pr-10 text-gray-900 transition-colors cursor-pointer"
            >
              {allAvailableStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <svg className="w-5 h-5 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>
        <div>
          <label htmlFor="classFilter" className="block text-sm font-medium text-gray-700 mb-1">Filter by Class:</label>
          <div className="relative">
            <select
              id="classFilter"
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="block w-full px-4 py-2.5 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white pr-10 text-gray-900 transition-colors cursor-pointer"
            >
              {availableClasses.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
            <svg className="w-5 h-5 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>
        <div className="flex items-end">
          <div className="bg-white p-3 rounded-xl shadow-md border border-gray-200 flex flex-col justify-center items-center text-center w-full">
            <h3 className="text-lg font-semibold text-gray-800 mb-1">Total Submissions</h3>
            <p className="text-3xl font-bold text-blue-600">
              {filteredSubmissions.length}
            </p>
          </div>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="rounded-xl border border-gray-200 shadow-lg overflow-hidden overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Student Name</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Assignment</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Class</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Subject</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Submitted On</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Grade</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan="8" className="px-6 py-6 text-center text-gray-500">Loading submissions...</td>
              </tr>
            ) : filteredSubmissions.length > 0 ? (
              filteredSubmissions.map((submission) => {
                // Log student name (includes user_id and full_name)
                return (
                  <tr key={submission.submissionId} className="transition-colors duration-200 hover:bg-blue-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{submission.student_id?.full_name && submission.student_id?.user_id
                      ? `${submission.student_id.full_name}(${submission.student_id.user_id})`
                      : 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{submission.assignmentTitle}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{submission.class}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{submission.subject}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{submission.submittedDate}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-semibold
                        ${submission.status === "Graded" ? "bg-green-100 text-green-800" :
                          submission.status === "Pending" ? "bg-yellow-100 text-yellow-800" :
                            "bg-red-100 text-red-800"
                        }`}>
                        {submission.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{submission.grade}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          className="p-2.5 rounded-full text-blue-600 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                          onClick={() => handleViewDetails(submission.submissionId)}
                          title="View Details"
                        >
                          <FileText size={20} />
                        </button>
                        <button
                          className="p-2.5 rounded-full text-indigo-600 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                          onClick={() => handleGrade(submission.submissionId)}
                          title="Grade Submission"
                        >
                          <Edit size={20} />
                        </button>
                        <button
                          className="p-2.5 rounded-full text-gray-600 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                          onClick={() => handleDownload(submission.submissionId)}
                          title="Download Submission"
                        >
                          <Download size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="8" className="px-6 py-6 text-center text-gray-500">
                  No submissions found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* View Details Modal */}
      {showViewDetailsModal && selectedSubmission && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 relative">
            <button
              onClick={() => setShowViewDetailsModal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              title="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">Submission Details</h2>
            <div className="space-y-3 text-gray-700">
              <p><strong>Student Name:</strong> {selectedSubmission.studentName}</p>
              <p><strong>Assignment:</strong> {selectedSubmission.assignmentTitle}</p>
              <p><strong>Class:</strong> {selectedSubmission.class}</p>
              <p><strong>Subject:</strong> {selectedSubmission.subject}</p>
              <p><strong>Submitted On:</strong> {selectedSubmission.submittedDate}</p>
              <p><strong>Status:</strong> <span className={`px-2 py-1 rounded-full text-xs font-semibold ${selectedSubmission.status === "Graded" ? "bg-green-100 text-green-800" : selectedSubmission.status === "Pending" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`}>{selectedSubmission.status}</span></p>
              <p><strong>Grade:</strong> {selectedSubmission.grade}</p>
              <p><strong>Feedback:</strong> {selectedSubmission.feedback || 'No feedback provided.'}</p>
              <p><strong>Submitted File(s):</strong> {selectedSubmission.files && selectedSubmission.files.length > 0 ? (
                <ul className="list-disc ml-6">
                  {selectedSubmission.files.map((fileUrl, idx) => (
                    <li key={idx}>
                      <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">File {idx + 1}</a>
                    </li>
                  ))}
                </ul>
              ) : 'N/A'}</p>
            </div>
            <div className="mt-6 text-right">
              <button
                onClick={() => setShowViewDetailsModal(false)}
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grade Submission Modal */}
      {showGradeModal && selectedSubmission && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 relative">
            <button
              onClick={() => setShowGradeModal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              title="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">Grade Submission</h2>
            <div className="space-y-4 text-gray-700">
              <p><strong>Student:</strong> {selectedSubmission.studentName}</p>
              <p><strong>Assignment:</strong> {selectedSubmission.assignmentTitle}</p>
              <div>
                <label htmlFor="gradeInput" className="block text-sm font-medium text-gray-700 mb-1">Grade:</label>
                <input
                  type="text"
                  id="gradeInput"
                  value={currentGrade}
                  onChange={(e) => setCurrentGrade(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., A+, B, 95%"
                />
              </div>
              <div>
                <label htmlFor="feedbackInput" className="block text-sm font-medium text-gray-700 mb-1">Feedback:</label>
                <textarea
                  id="feedbackInput"
                  value={currentFeedback}
                  onChange={(e) => setCurrentFeedback(e.target.value)}
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 resize-y"
                  placeholder="Provide feedback for the student..."
                ></textarea>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowGradeModal(false)}
                className="px-5 py-2.5 bg-gray-300 text-gray-800 rounded-lg shadow-md hover:bg-gray-400 transition-colors focus:outline-none focus:ring-4 focus:ring-gray-300 focus:ring-opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={saveGrade}
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50"
              >
                Save Grade
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewSubmissions;