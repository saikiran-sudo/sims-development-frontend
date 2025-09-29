// AssignmentModule.jsx
import React, { useState, useEffect } from 'react';
import {
  Eye,
  Pencil,
  Trash2,
  PlusCircle,
  X,
  ClipboardList, // Main icon for Assignment Module
  Tag, // For Subject
  Calendar, // For Due Date
  Users, // For Class
  CheckCircle, // For Submitted status
  Clock, // For Pending status
  AlertCircle, // For Late status
  FileText, // For Description
  UserCheck, // For Submissions
  Award, // For Grade (individual submission grade)
  Download, // For download button
  Info, // For general info/error alerts
  ListTodo // Icon for View Submissions
} from 'lucide-react';

import axios from 'axios';
import { classAPI } from '../../../services/api';

import CreateAssignment from './CreateAssignment'; // Import the new component
import ViewSubmissions from './ViewSubmissions'; // Import the new ViewSubmissions component

// Access API_BASE_URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'; // Fallback for development

// Assuming you will create this component for editing
const EditAssignment = ({
  showEditForm,
  setShowEditForm,
  setAlert,
  assignmentToEdit,
  setAssignmentToEdit,
  assignments,
  setAssignments,
  allAvailableClasses,
  allAvailableSections,
  allAvailableSubjects // <-- Add this prop
}) => {
  const [editedAssignment, setEditedAssignment] = useState(assignmentToEdit);
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    setEditedAssignment(assignmentToEdit);
  }, [assignmentToEdit, allAvailableClasses, allAvailableSubjects]);

  if (!showEditForm || !editedAssignment) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedAssignment({ ...editedAssignment, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editedAssignment.title || !editedAssignment.class || !editedAssignment.section || !editedAssignment.subject || !editedAssignment.dueDate) {
      setAlert({ message: 'Please fill in all required fields (Title, Class, Section, Subject, Due Date).', type: 'error' });
      return;
    }
    setLoading(true);
    try {
      const payload = {
        title: editedAssignment.title,
        class: editedAssignment.class, // Already ObjectId from dropdown
        section: editedAssignment.section,
        subject: editedAssignment.subject, // Already ObjectId from dropdown
        dueDate: editedAssignment.dueDate,
        description: editedAssignment.description,
      };
      const res = await axios.put(`${API_BASE_URL}/api/assignments/${editedAssignment._id}`, payload, {
        headers: {
          Authorization: JSON.parse(localStorage.getItem('authToken')) ? `Bearer ${JSON.parse(localStorage.getItem('authToken'))}` : '',
          'Content-Type': 'application/json',
        },
      });
      setAssignments(assignments.map(assign => assign._id === editedAssignment._id ? res.data : assign));
      setAlert({ message: 'Assignment updated successfully!', type: 'success' });
      setShowEditForm(false);
      setAssignmentToEdit(null);
    } catch (err) {
      setAlert({ message: err.message || 'Failed to update assignment.', type: 'error' });
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b p-4">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Pencil size={24} className="text-indigo-600" /> Edit Assignment
          </h2>
          <button
            onClick={() => { setShowEditForm(false); setAssignmentToEdit(null); setAlert({ message: '', type: '' }); }}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Title */}
          <div>
            <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-1">Assignment Title <span className="text-red-500">*</span></label>
            <input
              type="text"
              id="edit-title"
              name="title"
              value={editedAssignment.title}
              onChange={handleInputChange}
              className="mt-1 block w-full px-4 py-2.5 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400 text-base transition-colors"
              placeholder="e.g., Algebra Homework"
              required
            />
          </div>

          {/* Class */}
          <div>
            <label htmlFor="edit-class" className="block text-sm font-medium text-gray-700 mb-1">Class <span className="text-red-500">*</span></label>
            <select
              id="edit-class"
              name="class"
              value={typeof editedAssignment.class === 'object' ? editedAssignment.class._id : editedAssignment.class}
              onChange={handleInputChange}
              className="mt-1 block w-full px-4 py-2.5 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white pr-10 text-gray-900 transition-colors cursor-pointer"
              required
            >
              <option value="">Select Class</option>
              {allAvailableClasses.map(cls => (
                <option key={cls.value || cls._id || cls} value={cls.value || cls._id || cls}>
                  {cls.label || cls.class_name || cls}
                </option>
              ))}
            </select>
          </div>

          {/* Section */}
          <div>
            <label htmlFor="edit-section" className="block text-sm font-medium text-gray-700 mb-1">Section <span className="text-red-500">*</span></label>
            <select
              id="edit-section"
              name="section"
              value={editedAssignment.section}
              onChange={handleInputChange}
              className="mt-1 block w-full px-4 py-2.5 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white pr-10 text-gray-900 transition-colors cursor-pointer"
              required
            >
              <option value="">Select Section</option>
              {allAvailableSections.map(sec => (
                <option key={sec} value={sec}>{sec}</option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label htmlFor="edit-subject" className="block text-sm font-medium text-gray-700 mb-1">Subject <span className="text-red-500">*</span></label>
            <select
              id="edit-subject"
              name="subject"
              value={editedAssignment.subject?._id || editedAssignment.subject}
              onChange={handleInputChange}
              className="mt-1 block w-full px-4 py-2.5 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white pr-10 text-gray-900 transition-colors cursor-pointer"
              required
            >
              <option value="">Select Subject</option>
              {allAvailableSubjects && allAvailableSubjects.map(subj => (
                <option key={subj._id || subj} value={subj._id || subj}>{subj.name || subj}</option>
              ))}
            </select>
          </div>

          {/* Due Date */}
          <div className="sm:col-span-2">
            <label htmlFor="edit-dueDate" className="block text-sm font-medium text-gray-700 mb-1">Due Date <span className="text-red-500">*</span></label>
            <input
              type="date"
              id="edit-dueDate"
              name="dueDate"
              value={editedAssignment.dueDate}
              onChange={handleInputChange}
              className="mt-1 block w-full px-4 py-2.5 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 transition-colors"
              required
            />
          </div>

          {/* Description */}
          <div className="sm:col-span-2">
            <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              id="edit-description"
              name="description"
              value={editedAssignment.description}
              onChange={handleInputChange}
              className="mt-1 block w-full px-4 py-2.5 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400 text-base transition-colors"
              rows="3"
              placeholder="Provide a brief description of the assignment..."
            ></textarea>
          </div>

          <div className="sm:col-span-2 flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => { setShowEditForm(false); setAssignmentToEdit(null); setAlert({ message: '', type: '' }); }}
              className="flex items-center px-5 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-300 focus:ring-opacity-50 transition-colors"
            >
              <X className="mr-2" size={20} />
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50 transition-colors"
            >
              <Pencil className="mr-2" size={20} />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


const AssignmentModule = () => {
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showViewSubmissionsPage, setShowViewSubmissionsPage] = useState(false);
  const [selectedClassFilter, setSelectedClassFilter] = useState('All');
  const [alert, setAlert] = useState({ message: '', type: '' });
  const [allAvailableClasses, setAllAvailableClasses] = useState([]);
  const [allAvailableSections, setAllAvailableSections] = useState([]);
  const [allAvailableSubjects, setAllAvailableSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [getdata, setData] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [classSection, setClassSection] = useState([]);
  const [selectedClassFilterState, setSelectedClassFilterState] = useState("All");
  const [selectedSectionFilterState, setSelectedSectionFilterState] = useState("All");

  // Fetch subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const token = JSON.parse(localStorage.getItem('authToken'));
        const res = await axios.get(`${API_BASE_URL}/api/subjects/under-my-admin`, {
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
          }
        });
        setAllAvailableSubjects(res.data);
      } catch (err) {
        setAlert({ message: 'Failed to fetch subjects.', type: 'error' });
      }
    };
    fetchSubjects();
  }, []);

  useEffect(() => {
    const fetchClassOptions = async () => {
      const response = await classAPI.getAllClassesUnderMyAdmin();
      setClassSection(response.data || response);

      const uniqueSections = Array.from(
        new Map(
          (response.data || response).map(cls => [
            cls.section || cls.name || cls.label || cls.value,
            cls
          ])
        ).values()
      );
  
      const sectionOptions = uniqueSections.map(section => ([section.section]));
      setAllAvailableSections(sectionOptions);
    };
    fetchClassOptions();
  }, []);

  // Fetch classes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const token = JSON.parse(localStorage.getItem('authToken'));
      
        const classesRes = await axios.get(`${API_BASE_URL}/api/subjects/under-my-admin`, {
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
          }
        });

        const uniqueClasses = Array.from(
          new Map(
            (classesRes.data || classesRes).map(cls => [
              cls.className || cls.name || cls.label || cls.value,
              cls
            ])
          ).values()
        );
        const options = uniqueClasses.map(cls => ({
          label: cls.className || cls.name || cls.label || cls.value,
          value: cls.className || cls.name || cls.label || cls.value
        }));

        setAllAvailableClasses(options);
    
      } catch (err) {
        console.error('Error fetching classes:', err);
        console.error('Error response:', err.response?.data);
        setAlert({ message: 'Failed to fetch classes.', type: 'error' });
      }
    };
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClassFilterState) {
      const sections = classSection.filter(cls => cls.class_name === selectedClassFilterState);
      setAllAvailableSections(sections.map(section => ([section.section])));
    }
  }, [selectedClassFilterState])

  // Fetch students from backend
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const token = JSON.parse(localStorage.getItem('authToken'));
        const res = await axios.get(`${API_BASE_URL}/api/students/under-my-admin`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        setStudents(res.data);
      } catch (err) {
        setAlertState({ message: 'Failed to fetch students.', type: 'error' });
      }
    };
    fetchStudents();
  }, []);

  // Add a helper to get the auth headers
  const getAuthHeaders = () => {
    const token = JSON.parse(localStorage.getItem('authToken'))
    return {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
    };
  };

  // Fetch assignments and their submission counts from backend
  useEffect(() => {
    const fetchAssignmentsWithSubmissionCounts = async () => {
      setLoading(true);
      try {
        const token = JSON.parse(localStorage.getItem('authToken'));
        // Fetch all assignments
        const assignmentsRes = await axios.get(`${API_BASE_URL}/api/assignments/under-my-admin`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const assignmentsData = assignmentsRes.data;

        // Debug: Log the raw assignment data to see what we're getting
        console.log('Raw assignments data from API:', assignmentsData);

        // Fetch submissions for each assignment and count them
        const assignmentsWithCounts = await Promise.all(
          assignmentsData.map(async (assignment) => {
            // Debug: Log each assignment's subject data
            console.log(`Assignment "${assignment.title}" subject data:`, {
              subject: assignment.subject,
              subjectType: typeof assignment.subject,
              subjectName: assignment.subject?.name,
              isObject: assignment.subject && typeof assignment.subject === 'object'
            });

            try {
              console.log('Fetching submissions for assignment:', assignment._id, assignment.title);

              // Validate that assignment._id is a valid ObjectId
              if (!assignment._id || typeof assignment._id !== 'string' || assignment._id.length !== 24) {
                console.error('Invalid assignment ID format:', assignment._id);
                return {
                  ...assignment,
                  submissionsCount: 0,
                  pendingCount: 0
                };
              }

              const submissionsRes = await axios.get(`${API_BASE_URL}/api/assignment-submissions/${assignment._id}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
              });
              const submissions = submissionsRes.data;
              return {
                ...assignment,
                submissionsCount: submissions.length,
                pendingCount: submissions.filter(s => s.status === "Pending").length,
                submittedCount: submissions.filter(s => s.status !== "Pending").length
              };
            } catch (err) {
              console.error('Error fetching submissions for assignment:', assignment._id, err.message);
              return {
                ...assignment,
                submissionsCount: 0,
                pendingCount: 0
              };
            }
          })
        );

        setAssignments(assignmentsWithCounts);
      } catch (err) {
        setAlert({ message: 'Failed to fetch assignments or submissions.', type: 'error' });
      }
      setLoading(false);
    };
    fetchAssignmentsWithSubmissionCounts();
  }, []);

  // Fetch submissions for selected assignment (for view modal)
  const fetchSubmissionsForAssignment = async (assignmentId) => {
    try {
      // Validate that assignmentId is a valid ObjectId
      if (!assignmentId || typeof assignmentId !== 'string' || assignmentId.length !== 24) {
        console.error('Invalid assignment ID format:', assignmentId);
        setAlert({ message: 'Invalid assignment ID format.', type: 'error' });
        return;
      }

      const res = await axios.get(`${API_BASE_URL}/api/assignment-submissions/${assignmentId}`, getAuthHeaders());
      setSubmissions(res.data);
    } catch (err) {
      console.error('Error fetching submissions for assignment:', assignmentId, err.message);
      setAlert({ message: 'Failed to fetch submissions.', type: 'error' });
    }
  };

  // // CRUD Handlers
  // const handleCreateAssignment = async (assignmentData) => {
  //   try {
  //     const res = await axios.post(`${API_BASE_URL}/api/assignments/`, assignmentData, getAuthHeaders());
  //     setAssignments(prev => [...prev, res.data]);
  //     setAlert({ message: 'Assignment created successfully!', type: 'success' });
  //   } catch (err) {
  //     setAlert({ message: err.message || 'Failed to create assignment.', type: 'error' });
  //   }
  // };

  // const handleEditAssignment = (assignment) => {
  //   setEditingAssignment(assignment);
  //   setShowEditForm(true);
  //   setAlert({ message: '', type: '' });
  // };

  // const handleUpdateAssignment = async (id, updatedData) => {
  //   try {
  //     const res = await axios.put(`${API_BASE_URL}/api/assignments/${id}`, updatedData, getAuthHeaders());
  //     setAssignments(prev => prev.map(a => a._id === id ? res.data : a));
  //     setAlert({ message: 'Assignment updated successfully!', type: 'success' });
  //     setShowEditForm(false);
  //     setEditingAssignment(null);
  //   } catch (err) {
  //     setAlert({ message: err.message || 'Failed to update assignment.', type: 'error' });
  //   }
  // };

  // const deleteAssignment = async (id) => {
  //   if (window.confirm('Are you sure you want to delete this assignment?')) {
  //     try {
  //       await axios.delete(`${API_BASE_URL}/api/assignments/${id}`, getAuthHeaders());
  //       setAssignments(prev => prev.filter(a => a._id !== id));
  //       setAlert({ message: 'Assignment deleted successfully!', type: 'success' });
  //     } catch (err) {
  //       setAlert({ message: err.message || 'Failed to delete assignment.', type: 'error' });
  //     }
  //   }
  // };

  // Filtering logic
  // const filteredAssignments = selectedClassFilter === 'All'
  //   ? assignments
  //   : assignments.filter(a => a.class?.class_name === selectedClassFilter);

  // For view modal, fetch submissions when assignment is selected
  useEffect(() => {
    if (selectedAssignment) {
      fetchSubmissionsForAssignment(selectedAssignment._id);
    }
  }, [selectedAssignment]);

  // Calculate initial assignments with accurate submission counts and dynamic status
  // const initialAssignmentsWithCounts = assignments.map(assignment => {
  //   const submissionsForThisAssignment = submissions.filter(
  //     submission => submission.assignment_id === assignment._id
  //   );
  //   const totalActualSubmissions = submissionsForThisAssignment.length;
  //   const pendingActualSubmissions = submissionsForThisAssignment.filter(s => s.status === "Pending").length;

  //   const today = new Date();
  //   today.setHours(0, 0, 0, 0); // Normalize to start of day
  //   const assignmentDueDate = new Date(assignment.dueDate);
  //   assignmentDueDate.setHours(0, 0, 0, 0); // Normalize to start of day

  //   let displayStatus = "Upcoming"; // Default status

  //   if (assignmentDueDate < today) {
  //     // Due date has passed
  //     if (totalActualSubmissions === 0) {
  //       displayStatus = "Late"; // No submissions and past due
  //     } else if (pendingActualSubmissions > 0) {
  //       displayStatus = "Late"; // Past due with pending submissions
  //     } else {
  //       // Check for individual late submissions even if overall status is "Completed"
  //       const anyLateIndividualSubmissions = submissionsForThisAssignment.some(s => {
  //         const submittedDate = new Date(s.submitted_date);
  //         submittedDate.setHours(0, 0, 0, 0);
  //         return submittedDate > assignmentDueDate;
  //       });
  //       displayStatus = anyLateIndividualSubmissions ? "Late" : "Completed";
  //     }
  //   } else if (assignmentDueDate >= today) {
  //     // Due date is today or in the future
  //     if (totalActualSubmissions === 0) {
  //       displayStatus = "Pending"; // Future due date, no submissions yet
  //     } else if (pendingActualSubmissions > 0) {
  //       displayStatus = "Pending"; // Future due date, some pending submissions
  //     } else {
  //       displayStatus = "Completed"; // Future due date, all submitted and not pending
  //     }
  //   }


  //   return {
  //     ...assignment,
  //     submissions: totalActualSubmissions, // Total actual submissions
  //     status: displayStatus // Dynamic status for the assignment
  //   };
  // });

  const [selectedAssignmentState, setSelectedAssignmentState] = useState(null); // For View modal
  const [showCreateFormState, setShowCreateFormState] = useState(false); // For Create modal

  // New states for editing
  const [editingAssignmentState, setEditingAssignmentState] = useState(null); // Stores the assignment object being edited
  const [showEditFormState, setShowEditFormState] = useState(false); // Controls visibility of Edit modal

  // State to control full page view for submissions
  const [showViewSubmissionsPageState, setShowViewSubmissionsPageState] = useState(false);


  const [alertState, setAlertState] = useState({ message: '', type: '' });


  const uniqueClasses = [...new Set(assignments.map(a => a.class?.class_name))].sort();

  // Create filter options that include both existing assignment classes and all available classes from API
  const allAvailableClassesState = ["All", ...uniqueClasses];

  // For the class filter dropdown, we want to show all available classes from API, not just those with assignments
  const classFilterOptions = ["All", ...allAvailableClasses.map(cls => cls.label)];
  const sectionFilterOptions = ["All", ...allAvailableSections.map(sec => sec)];


  const handleViewAssignment = (assignment) => {
    setSelectedAssignmentState(assignment);
  };

  const handleEditAssignmentState = (assignment) => {

    setEditingAssignmentState(assignment); // Set the assignment to be edited
    setShowEditFormState(true); // Open the edit form
    setAlertState({ message: '', type: '' }); // Clear any previous alerts
  };

  const deleteAssignmentState = async (id) => {
    if (window.confirm('Are you sure you want to delete this assignment?')) {
      try {
        await axios.delete(`${API_BASE_URL}/api/assignments/${id}`, getAuthHeaders());
        setAssignments(prev => prev.filter(a => a._id !== id));
        setAlertState({ message: 'Assignment deleted successfully!', type: 'success' });
      } catch (err) {
        setAlertState({ message: err.message || 'Failed to delete assignment.', type: 'error' });
      }
    }
  };

  // Filtering logic for assignments table
  const filteredAssignmentsState = assignments.filter(assignment => {
    const classMatch = selectedClassFilterState === "All" || assignment.class?.class_name === selectedClassFilterState;
    const sectionMatch = selectedSectionFilterState === "All" || assignment.section === selectedSectionFilterState;
    return classMatch && sectionMatch;
  });

  // In the view modal, totalSubmissions, pendingSubmissions, and lateSubmissions are for the selected assignment
  // Filter mockSubmissionsData based on the selectedAssignment's ID
  const submissionsForSelectedAssignment = selectedAssignmentState
    ? submissions.filter(s => s.assignment_id === selectedAssignmentState._id)
    : [];
  const totalSubmissions = submissionsForSelectedAssignment.length;
  const pendingSubmissions = submissionsForSelectedAssignment.filter(s => s.status === "Pending").length;

  // Calculate late submissions for the *selected assignment* in the modal
  const lateSubmissionsForModal = selectedAssignmentState
    ? submissionsForSelectedAssignment.filter(s => {
      const submittedDate = new Date(s.submitted_date);
      submittedDate.setHours(0, 0, 0, 0); // Normalize to start of day
      const dueDate = new Date(selectedAssignmentState.dueDate);
      dueDate.setHours(0, 0, 0, 0); // Normalize to start of day
      return submittedDate > dueDate;
    }).length
    : 0;

  // --- NEW CALCULATIONS FOR GLOBAL SUMMARY STATS ---
  const getSubmissionsByClassFilter = (submissionsData, classFilter) => {
    if (classFilter === "All") {
      return submissionsData;
    }
    const filteredAssignmentIds = assignments
      .filter(a => a.class?.class_name === classFilter)
      .map(a => a._id);
    return submissionsData.filter(s => filteredAssignmentIds.includes(s.assignment_id));
  };

  const filteredSubmissions = getSubmissionsByClassFilter(submissions, selectedClassFilterState);


  const totalPendingSubmissionsGlobal = filteredAssignmentsState.map((assignment) => {
    return assignment.submissionsCount === 0
      ? (0)
      : assignment.submissionsCount
  }).reduce((sum, count) => sum + count, 0);

  const totalLateSubmissionsGlobal = filteredSubmissions.filter(s => {
    const assignment = assignments.find(a => a._id === s.assignment_id);
    if (!assignment) return false; // Should not happen with valid data

    const submittedDate = new Date(s.submitted_date);
    submittedDate.setHours(0, 0, 0, 0);
    const dueDate = new Date(assignment.dueDate);
    dueDate.setHours(0, 0, 0, 0);

    return submittedDate > dueDate;
  }).length;
  // --- END NEW CALCULATIONS ---

  // Calculate total students for the selected class and section
  const totalStudentsForFilter = students.filter(student => {
    // student.class_id can be an object or string, handle both
    let className = student.class_id?.class_name || student.class_id || student.class;
    let section = student.section;
    const classMatch = selectedClassFilterState === "All" || className === selectedClassFilterState;
    const sectionMatch = selectedSectionFilterState === "All" || section === selectedSectionFilterState;
    return classMatch && sectionMatch;
  }).length;

  const handleBackToAssignments = (classFilterFromSubmissions = "All") => {
    setShowViewSubmissionsPageState(false);
    // This line is crucial to set the filter back if provided by ViewSubmissions
    setSelectedClassFilterState(classFilterFromSubmissions);
  };


  if (showViewSubmissionsPageState) {
    return (
      <ViewSubmissions
        // Pass relevant props to ViewSubmissions
        // No need for allSubmissions and assignmentsData as mock data is in ViewSubmissions
        onBackToAssignmentModule={handleBackToAssignments} // Correct prop name and function
        selectedClassFilter={selectedClassFilterState} // Pass current filter
        allAvailableClasses={allAvailableClassesState} // Pass available classes for dropdown
      />
    );
  }

  return (
    <div className="px-0 sm:px-2 md:px-4 lg:p-6 flex flex-col gap-2 sm:gap-4 lg:gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b border-gray-200">
        <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900 leading-tight mb-4 md:mb-0 flex items-center gap-3">
          <ClipboardList size={36} className="text-purple-600" />
          Assignment Management
        </h1>
        <div className="flex gap-3"> {/* Container for buttons */}
          <button
            onClick={() => setShowViewSubmissionsPageState(true)} // Change to show full page
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition duration-200 shadow-md flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 transform hover:-translate-y-0.5"
          >
            <ListTodo className="mr-2" size={20} />
            View Submissions
          </button>
          <button
            onClick={() => { setShowCreateFormState(true); setAlertState({ message: '', type: '' }); }}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition duration-200 shadow-md flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50 transform hover:-translate-y-0.5"
          >
            <PlusCircle className="mr-2" size={20} />
            Create New Assignment
          </button>
        </div>
      </div>

      {/* Alert Message */}
      {alertState.message && (
        <div className={`flex items-center justify-between p-4 mb-6 rounded-lg shadow-md ${alertState.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
          alertState.type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' :
            'bg-blue-100 text-blue-800 border border-blue-200'
          }`} role="alert">
          <div className="flex items-center">
            {alertState.type === 'success' && <CheckCircle className="mr-3" size={20} />}
            {alertState.type === 'error' && <Info className="mr-3" size={20} />}
            <span className="text-sm font-medium">{alertState.message}</span>
          </div>
          <button
            onClick={() => setAlertState({ message: '', type: '' })}
            className={`p-1 rounded-full transition-colors ${alertState.type === 'success' ? 'hover:bg-green-200' :
              alertState.type === 'error' ? 'hover:bg-red-200' :
                'hover:bg-blue-200'
              }`}
            aria-label="Dismiss alert"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Class Filter Dropdown and Stats Cards */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="col-span-1 md:col-span-1">
          <label htmlFor="classFilter" className="block text-sm font-medium text-gray-700 mb-1">Filter by Class:</label>
          <div className="relative">
            <select
              id="classFilter"
              value={selectedClassFilterState}
              onChange={(e) => setSelectedClassFilterState(e.target.value)}
              className="block w-full px-4 py-2.5 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white pr-10 text-gray-900 transition-colors cursor-pointer"
            >
              {classFilterOptions.map((cls) => (
                <option key={cls.value || cls._id || cls} value={cls.value || cls._id || cls}>
                  {cls.label || cls.class_name || cls}
                </option>
              ))}
            </select>
            <svg className="w-5 h-5 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </div>
          {/* Section Filter Dropdown */}
          <label htmlFor="sectionFilter" className="block text-sm font-medium text-gray-700 mb-1 mt-4">Filter by Section:</label>
          <div className="relative">
            <select
              id="sectionFilter"
              value={selectedSectionFilterState}
              onChange={(e) => setSelectedSectionFilterState(e.target.value)}
              className="block w-full px-4 py-2.5 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white pr-10 text-gray-900 transition-colors cursor-pointer"
            >
              {sectionFilterOptions.map((sec) => (
                <option key={sec} value={sec}>{sec}</option>
              ))}
            </select>
            <svg className="w-5 h-5 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>

        <div className="col-span-1 md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl shadow-md border border-gray-200 flex flex-col justify-center items-center text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-1">Total Assignments</h3>
            <p className="text-3xl font-bold text-indigo-600">
              {filteredAssignmentsState.length}
            </p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-md border border-gray-200 flex flex-col justify-center items-center text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-1">Total Pending Submissions</h3>
            <p className="text-3xl font-bold text-yellow-600">
              {totalPendingSubmissionsGlobal} / {filteredAssignmentsState.length}
            </p>
            <span className="text-xs text-gray-500 mt-1">Pending / Total Assignments</span>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-md border border-gray-200 flex flex-col justify-center items-center text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-1">Total Late Submissions</h3>
            <p className="text-3xl font-bold text-red-600">
              {totalLateSubmissionsGlobal}
            </p>
          </div>
        </div>
      </div>


      {/* Assignments Table */}
      <div className="rounded-xl border border-gray-200 shadow-lg overflow-hidden overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Class</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Section</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Subject</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Due Date</th>
              {/* Removed Status Column Header */}
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Submissions</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {filteredAssignmentsState.length > 0 ? (
              filteredAssignmentsState.map((assignment) => (
                <tr key={assignment._id} className="transition-colors duration-200 hover:bg-indigo-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{assignment.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{assignment.class?.class_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{assignment.section}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {(() => {
                      // Debug: Log the subject data for this specific assignment
                      console.log(`Rendering subject for assignment "${assignment.title}":`, {
                        subject: assignment.subject,
                        subjectName: assignment.subject?.name,
                        subjectType: typeof assignment.subject,
                        finalValue: assignment.subject?.name ||
                          (typeof assignment.subject === 'string' ? assignment.subject : 'No Subject')
                      });

                      return assignment.subject?.name ||
                        (typeof assignment.subject === 'string' ? assignment.subject : 'No Subject');
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : ''}</td>
                  {/* Removed Status Data Cell */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {assignment.submissionsCount === 0
                      ? (assignment.status || "No Submissions")
                      : assignment.submissionsCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        className="p-2.5 rounded-full text-blue-600 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        onClick={() => handleViewAssignment(assignment)}
                        title="View Details"
                      >
                        <Eye size={20} />
                      </button>
                      <button
                        className="p-2.5 rounded-full text-indigo-600 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                        onClick={() => handleEditAssignmentState(assignment)}
                        title="Edit Assignment"
                      >
                        <Pencil size={20} />
                      </button>
                      <button
                        className="p-2.5 rounded-full text-red-600 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                        onClick={() => deleteAssignmentState(assignment._id)}
                        title="Delete Assignment"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="px-6 py-6 text-center text-gray-500">
                  No assignments found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Assignment Form (Modal) - Now a separate component */}
      <CreateAssignment
        showCreateForm={showCreateFormState}
        setShowCreateForm={setShowCreateFormState}
        setAlert={setAlertState}
        assignments={assignments}
        setAssignments={setAssignments}
      // allAvailableClasses={allAvailableClasses}
      // allAvailableSections={allAvailableSections}
      // allAvailableSubjects={allAvailableSubjects}
      />


      {/* Edit Assignment Form (Modal) */}
      <EditAssignment
        showEditForm={showEditFormState}
        setShowEditForm={setShowEditFormState}
        setAlert={setAlertState}
        assignmentToEdit={editingAssignmentState} // Pass the assignment to edit
        setAssignmentToEdit={setEditingAssignmentState} // Setter for the assignment to edit
        assignments={assignments}
        setAssignments={setAssignments}
        allAvailableClasses={allAvailableClasses}
        allAvailableSections={allAvailableSections}
        allAvailableSubjects={allAvailableSubjects}
      />

      {/* View Assignment Modal */}
      {selectedAssignmentState && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b p-4">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <ClipboardList size={24} className="text-purple-600" /> {selectedAssignmentState.title}
              </h2>
              <button
                onClick={() => setSelectedAssignmentState(null)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              {/* Assignment Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex items-center gap-3">
                  <Users size={20} className="text-indigo-500" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Class</h3>
                    <p className="text-base font-semibold text-gray-900">{selectedAssignmentState.class?.class_name}</p>
                  </div>
                </div>
                {/* Display Section in View Assignment Modal */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex items-center gap-3">
                  <Tag size={20} className="text-purple-500" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Section</h3>
                    <p className="text-base font-semibold text-gray-900">{selectedAssignmentState.section}</p>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex items-center gap-3">
                  <Tag size={20} className="text-green-500" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Subject</h3>
                    <p className="text-base font-semibold text-gray-900">
                      {selectedAssignmentState.subject?.name ||
                        (typeof selectedAssignmentState.subject === 'string' ? selectedAssignmentState.subject : 'No Subject')}
                    </p>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex items-center gap-3">
                  <Calendar size={20} className="text-orange-500" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Due Date</h3>
                    <p className="text-base font-semibold text-gray-900">{selectedAssignmentState.dueDate ? new Date(selectedAssignmentState.dueDate).toLocaleDateString() : ''}</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6 bg-gray-50 p-5 rounded-lg border border-gray-200">
                <h3 className="text-base font-medium text-gray-700 mb-2 flex items-center gap-2"><FileText size={20} className="text-blue-500" /> Description</h3>
                <p className="text-gray-800 leading-relaxed">{selectedAssignmentState.description || "No description provided."}</p>
              </div>

              {/* Summary Stats for Submissions */}
              <h3 className="text-xl font-bold text-gray-800 mb-4">Submission Statistics</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4"> {/* Changed to 3 columns */}
                <div className="bg-blue-50 p-5 rounded-xl shadow-sm border border-blue-100 flex flex-col justify-center items-center text-center">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">Total Submissions</h3>
                  <p className="text-3xl font-bold text-blue-600 flex items-center gap-1">
                    <UserCheck size={28} /> {totalSubmissions}
                  </p>
                </div>
                <div className="bg-yellow-50 p-5 rounded-xl shadow-sm border border-yellow-100 flex flex-col justify-center items-center text-center">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">Pending</h3>
                  <p className="text-3xl font-bold text-yellow-600 flex items-center gap-1">
                    <Clock size={28} /> {pendingSubmissions}
                  </p>
                </div>
                <div className="bg-red-50 p-5 rounded-xl shadow-sm border border-red-100 flex flex-col justify-center items-center text-center">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">Late</h3>
                  <p className="text-3xl font-bold text-red-600 flex items-center gap-1">
                    <AlertCircle size={28} /> {lateSubmissionsForModal}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end p-4 border-t border-gray-100">
              <button
                onClick={() => setSelectedAssignmentState(null)}
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentModule;