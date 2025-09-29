import React, { useState, useEffect } from 'react';
import { Upload, CheckCircle, Clock, LayoutList, FileText, Hourglass, CheckSquare } from 'lucide-react'; // Consolidated to Lucide icons
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Access API_BASE_URL from environment variables
const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'; // Fallback for development
const API_BASE_URL = `${API_URL}/api`; // Use the base URL for the API endpoint

const AssignmentModule = () => {
  const navigate = useNavigate();

  // State for assignments and classes
  const [assignments, setAssignments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // Fetch assignments and classes on mount
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get user profile from localStorage
      const storedUserProfile = localStorage.getItem('userprofile');
      if (!storedUserProfile) {
        setError('User profile not found. Please log in again.');
        setLoading(false);
        return;
      }

      const userprofile = JSON.parse(storedUserProfile);
      setUserProfile(userprofile);

      const studentClass = userprofile.class_id;
      const studentSection = userprofile.section;

      if (!studentClass || !studentSection) {
        setError('Student class or section information is missing.');
        setLoading(false);
        return;
      }

      console.log('Student data:', { studentClass, studentSection, userprofile });

      let token;
      try {
        const tokenData = localStorage.getItem('authToken');
        if (!tokenData) {
          setError('Authentication token not found. Please log in again.');
          setLoading(false);
          return;
        }
        token = JSON.parse(tokenData);
      } catch (tokenError) {
        // If JSON.parse fails, try using the raw value
        token = localStorage.getItem('authToken');
        if (!token) {
          setError('Authentication token not found. Please log in again.');
          setLoading(false);
          return;
        }
      }

      console.log('Token found:', token ? 'Yes' : 'No');
      
      // Fetch assignments - backend will use user profile data
      console.log('Fetching assignments...');
      try {
        const assignmentsRes = await axios.get(`${API_BASE_URL}/assignments/under-my-student`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Assignments response:', assignmentsRes.data);
        setAssignments(Array.isArray(assignmentsRes.data) ? assignmentsRes.data : (assignmentsRes.data.assignments || []));
      } catch (assignmentError) {
        console.error('Assignment fetch error:', assignmentError);
        // Try without token to see if it's an auth issue
        if (assignmentError.response?.status === 401) {
          setError('Authentication failed. Please log in again.');
        } else {
          setError('Failed to load assignments. Please try again.');
        }
        setLoading(false);
        return;
      }
      
      // Fetch classes
      try {
        const classesRes = await axios.get(`${API_BASE_URL}/classes`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setClasses(Array.isArray(classesRes.data) ? classesRes.data : (classesRes.data.classes || []));
      } catch (classesError) {
        console.error('Classes fetch error:', classesError);
        // Don't fail the entire request if classes fail to load
        setClasses([]);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      if (err.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else if (err.response?.status === 404) {
        setError('No assignments found for your class and section.');
      } else {
        setError('Failed to load assignments or classes. Please try again.');
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [retryCount]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  // Helper to get class name by id or object
  const getClassName = (classObj) => {
    if (!classObj) return '';
    if (typeof classObj === 'string') {
      const found = classes.find(c => c._id === classObj);
      return found ? found.class_name : classObj;
    }
    return classObj.class_name || '';
  };
  const getSubjectName = (subjectObj) => {
    if (!subjectObj) return '';
    if (typeof subjectObj === 'string') {
      const found = classes.find(c => c._id === subjectObj);
      return found ? found.name : subjectObj;
    }
    return subjectObj.name || '';
  };

  // Status display logic
  const getStatusDisplay = (assignment) => {
    const status = assignment.status;
    const dueDate = new Date(assignment.dueDate);
    const now = new Date();
    const isCompleted = status === 'Submitted';
    const isOverdue = status === 'Pending' && dueDate < now;

    if (isCompleted) {
      return (
        <span className="inline-flex items-center font-semibold text-green-600 px-3 py-1 rounded-full bg-green-100 text-xs">
          <CheckCircle size={14} className="mr-1" /> Uploaded
        </span>
      );
    } else if (isOverdue || status === 'Late') {
      return (
        <button
          onClick={() => handleUploadClick(assignment._id)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full flex items-center text-sm font-medium shadow-md transition-all duration-200 hover:scale-105"
          aria-label={`Upload assignment for ${assignment.title}`}
        >
          <Upload size={16} className="mr-2" /> Upload
        </button>
      );
    } else {
      return (
        <button
          onClick={() => handleUploadClick(assignment._id)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full flex items-center text-sm font-medium shadow-md transition-all duration-200 hover:scale-105"
          aria-label={`Upload assignment for ${assignment.title}`}
        >
          <Upload size={16} className="mr-2" /> Upload
        </button>
      );
    }
  };

  // Upload click handler
  const handleUploadClick = (assignmentId) => {
    navigate(`/student/submit-assignment/${assignmentId}`);
  };

  // Stats
  const totalAssignments = assignments.length;
  const pendingAssignments = assignments.filter(a => a.status === 'Pending').length;
  const completedAssignments = assignments.filter(a => a.status === 'Submitted').length;

  if (loading) {
    return <div className="p-8 text-center text-gray-600">Loading assignments...</div>;
  }
  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-600 mb-4">{error}</div>
        <button 
          onClick={handleRetry}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
        >
          Retry Loading
        </button>
      </div>
    );
  }

  return (
    <div className="px-0 sm:px-2 md:px-4 lg:p-6 flex flex-col gap-2 sm:gap-4 lg:gap-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 flex items-center gap-3 mb-4 sm:mb-0">
          <LayoutList size={36} className="text-indigo-600" /> Assignments Overview
        </h1>
        <span className="text-sm text-gray-600">
          Last updated: {new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })}
        </span>
      </div>

      {/* Stats Cards - Now always in 3 columns */}
      <div className="grid grid-cols-3 gap-4 sm:gap-6 mb-10"> {/* Changed to grid-cols-3 for all screen sizes */}
        {/* Total Assignments Card */}
        <div className="bg-white p-3 sm:p-6 rounded-xl shadow-lg border border-gray-200 flex flex-col items-center sm:flex-row sm:items-center gap-2 sm:gap-4 text-center sm:text-left transition-transform duration-200 hover:scale-[1.02]">
          <div className="p-2 sm:p-3 rounded-full bg-blue-100 text-blue-600 flex-shrink-0">
            <FileText size={20} /> {/* Adjusted icon size for smaller screens */}
          </div>
          <div>
            <h6 className="text-xs sm:text-sm text-gray-600 uppercase font-semibold mb-1">Total Assignments</h6>
            <span className="text-3xl sm:text-4xl font-extrabold text-gray-900">{totalAssignments}</span> {/* Adjusted font size for smaller screens */}
          </div>
        </div>

        {/* Pending Assignments Card */}
        <div className="bg-white p-3 sm:p-6 rounded-xl shadow-lg border border-gray-200 flex flex-col items-center sm:flex-row sm:items-center gap-2 sm:gap-4 text-center sm:text-left transition-transform duration-200 hover:scale-[1.02]">
          <div className="p-2 sm:p-3 rounded-full bg-yellow-100 text-yellow-600 flex-shrink-0">
            <Hourglass size={20} /> {/* Adjusted icon size for smaller screens */}
          </div>
          <div>
            <h6 className="text-xs sm:text-sm text-gray-600 uppercase font-semibold mb-1">Pending</h6>
            <span className="text-3xl sm:text-4xl font-extrabold text-gray-900">{pendingAssignments}</span> {/* Adjusted font size for smaller screens */}
          </div>
        </div>

        {/* Completed Assignments Card */}
        <div className="bg-white p-3 sm:p-6 rounded-xl shadow-lg border border-gray-200 flex flex-col items-center sm:flex-row sm:items-center gap-2 sm:gap-4 text-center sm:text-left transition-transform duration-200 hover:scale-[1.02]">
          <div className="p-2 sm:p-3 rounded-full bg-green-100 text-green-600 flex-shrink-0">
            <CheckSquare size={20} /> {/* Adjusted icon size for smaller screens */}
          </div>
          <div>
            <h6 className="text-xs sm:text-sm text-gray-600 uppercase font-semibold mb-1">Completed</h6>
            <span className="text-3xl sm:text-4xl font-extrabold text-gray-900">{completedAssignments}</span> {/* Adjusted font size for smaller screens */}
          </div>
        </div>
      </div>

      {/* Assignments Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        {assignments.length === 0 ? (
          <div className="p-8 text-center text-gray-600">
            <FileText size={48} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">No Assignments Found</h3>
            <p className="text-sm text-gray-500 mb-4">
              There are currently no assignments for your class ({userProfile?.class_id}) and section ({userProfile?.section}).
            </p>
            <button 
              onClick={handleRetry}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
            >
              Refresh
            </button>
          </div>
        ) : (
          <div className="min-w-full overflow-x-auto"> {/* Added overflow-x-auto for responsiveness */}
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assignments.map((a) => {
                  // const className = getClassName(a.class);
                  const subjectName = getSubjectName(a.subject);
                  return (
                    <tr key={a._id} className={a.status === 'Late' ? 'bg-red-50 hover:bg-red-100 transition-colors duration-150' : 'hover:bg-gray-50 transition-colors duration-150'}>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{a.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">{subjectName}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${a.status === 'Late' ? 'text-red-600 font-semibold' : 'text-gray-800'}`}>{a.dueDate ? new Date(a.dueDate).toLocaleDateString() : ''}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${a.status === 'Submitted' ? 'bg-green-100 text-green-800' :
                            a.status === 'Late' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                          }`}>
                          {a.status === 'Submitted' ? 'Submitted' : a.status === 'Late' ? 'Overdue' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusDisplay(a)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignmentModule;
