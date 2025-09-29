// CreateAssignment.jsx
import React, { useState, useEffect } from 'react';
import { PlusCircle, X, CheckCircle, Info } from 'lucide-react';
import axios from 'axios';
import { getAuthHeaders } from '../../../utils/axiosConfig'; // Keep getAuthHeaders for fetch
import { classAPI } from '../../../services/api';

// Access API_BASE_URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'; // Fallback for development

const CreateAssignment = ({ showCreateForm, setShowCreateForm, setAlert, assignments, setAssignments, allAvailableClasses, allAvailableSections, allAvailableSubjects }) => {
  const [newAssignment, setNewAssignment] = useState({
    title: "",
    class: "",
    section: "",
    subject: "",
    dueDate: "",
    description: "",
  });
  const [classesLoading, setClassesLoading] = useState(false);


  // Fallback: Fetch classes directly if not provided by parent
  const [localClasses, setLocalClasses] = useState([]);
  
  useEffect(() => {
    const fetchClassesDirectly = async () => {
      if (!allAvailableClasses || allAvailableClasses.length === 0) {
        try {
          setClassesLoading(true);
          const token = JSON.parse(localStorage.getItem('authToken'));
          
          const classesRes = await axios.get(`${API_BASE_URL}/api/classes/under-my-admin`, {
            headers: {
              Authorization: token ? `Bearer ${token}` : '',
            }
          });
          const classes = classesRes.data;
          
          const classOpts = classes.reduce((acc, cls) => {
            const existing = acc.find(item => item.label === cls.class_name);
            if (!existing) {
              acc.push({
                value: cls._id,
                label: `${cls.class_name}`
              });
            }
            return acc;
          }, []);
          
          setLocalClasses(classOpts);
        } catch (err) {
          console.error('Error fetching classes directly:', err);
          console.error('Error response:', err.response?.data);
          setAlert({ message: 'Failed to fetch classes. Please try again.', type: 'error' });
        } finally {
          setClassesLoading(false);
        }
      }
    };
    
    fetchClassesDirectly();
  }, [allAvailableClasses]);

  // Use local classes if parent classes are not available
  const availableClasses = allAvailableClasses && allAvailableClasses.length > 0 ? allAvailableClasses : localClasses;
  
  
  // If still no classes available, show a message
  if (!availableClasses || availableClasses.length === 0) {
    console.warn('No classes available for teacher');
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAssignment({ ...newAssignment, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newAssignment.title || !newAssignment.class || !newAssignment.section || !newAssignment.subject || !newAssignment.dueDate) {
      setAlert({ message: 'Please fill in all required fields (Title, Class, Section, Subject, Due Date).', type: 'error' });
      return;
    }
    setLoading(true);
    try {
      // Validate that class is a valid ObjectId
      if (!newAssignment.class || typeof newAssignment.class !== 'string' || newAssignment.class.length !== 24) {
        console.error('Invalid class value:', newAssignment.class);
        setAlert({ message: 'Invalid class selection. Please select a valid class.', type: 'error' });
        setLoading(false);
        return;
      }
      
      // Validate that subject is a valid ObjectId
      if (!newAssignment.subject || typeof newAssignment.subject !== 'string' || newAssignment.subject.length !== 24) {
        console.error('Invalid subject value:', newAssignment.subject);
        setAlert({ message: 'Invalid subject selection. Please select a valid subject.', type: 'error' });
        setLoading(false);
        return;
      }
      
      const payload = {
        title: newAssignment.title,
        class: newAssignment.class,
        section: newAssignment.section,
        subject: newAssignment.subject, // Already ObjectId
        dueDate: newAssignment.dueDate,
        description: newAssignment.description,
      };
      const token = JSON.parse(localStorage.getItem('authToken'));
      const res = await axios.post(`${API_BASE_URL}/api/assignments/under-my-admin`, payload, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      });
      setAssignments(prev => [...prev, res.data]);
      setNewAssignment({ title: "", class: "", section: "", subject: "", dueDate: "", description: "" });
      setShowCreateForm(false);
      setAlert({ message: 'Assignment created successfully!', type: 'success' });
    } catch (err) {
      setAlert({ message: err.message || 'Failed to create assignment.', type: 'error' });
    }
    setLoading(false);
  };

  if (!showCreateForm) {
    return null; // Don't render if the form is not supposed to be shown
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 md:p-8 w-full max-w-lg shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto"> {/* Changed max-w-md to max-w-lg */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Create New Assignment</h2>
          <button
            onClick={() => { setShowCreateForm(false); setAlert({ message: '', type: '' }); }}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-5">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
              <input
                type="text"
                id="title"
                name="title"
                value={newAssignment.title}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400 text-base transition-colors"
                required
                placeholder="e.g., Math Homework Chapter 5"
              />
            </div>

            {/* Class and Section (two columns on larger screens) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="class" className="block text-sm font-medium text-gray-700 mb-1">Class <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select
                    id="class"
                    name="class"
                    value={newAssignment.class}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white pr-10 text-gray-900 transition-colors cursor-pointer"
                    required
                  >
                    <option value="">Select Class</option>
                    {classesLoading ? (
                      <option value="" disabled>Loading classes...</option>
                    ) : availableClasses && availableClasses.length > 0 ? (
                      availableClasses.map((cls) => {
                        // Ensure we always use the ObjectId for the value
                        const classId = cls.value || cls._id;
                        const className = cls.label || cls.class_name || cls;
                        
                        if (!classId) {
                          console.warn('Class missing ObjectId:', cls);
                          return null; // Skip this option if no ObjectId
                        }
                        
                        return (
                          <option key={classId} value={classId}>
                            {className}
                          </option>
                        );
                      }).filter(Boolean) // Remove null options
                    ) : (
                      <option value="" disabled>
                        {classesLoading ? 'Loading classes...' : 'No classes available. Please contact your administrator.'}
                      </option>
                    )}
                  </select>
                  <svg className="w-5 h-5 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
              <div>
                <label htmlFor="section" className="block text-sm font-medium text-gray-700 mb-1">Section <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select
                    id="section"
                    name="section"
                    value={newAssignment.section}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white pr-10 text-gray-900 transition-colors cursor-pointer"
                    required
                  >
                    <option value="">Select Section</option>
                    {allAvailableSections && allAvailableSections.length > 0 ? (
                      allAvailableSections.map((sec) => (
                        <option key={sec} value={sec}>{sec}</option>
                      ))
                    ) : (
                      <option value="" disabled>No sections available</option>
                    )}
                  </select>
                  <svg className="w-5 h-5 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>

            {/* Subject and Due Date (two columns on larger screens) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">Subject <span className="text-red-500">*</span></label>
                <select
                  id="subject"
                  name="subject"
                  value={newAssignment.subject}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white pr-10 text-gray-900 transition-colors cursor-pointer"
                  required
                >
                  <option value="">Select Subject</option>
                  {allAvailableSubjects && allAvailableSubjects.map((subj) => (
                    <option key={subj._id || subj} value={subj._id || subj}>{subj.name || subj}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">Due Date <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  id="dueDate"
                  name="dueDate"
                  value={newAssignment.dueDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400 text-base transition-colors"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
              <textarea
                id="description"
                name="description"
                value={newAssignment.description}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400 text-base transition-colors"
                rows="3"
                placeholder="Provide a brief description of the assignment..."
              ></textarea>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => { setShowCreateForm(false); setAlert({ message: '', type: '' }); }}
                className="flex items-center px-5 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-300 focus:ring-opacity-50 transition-colors"
              >
                <X className="mr-2" size={20} />
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50 transition-colors"
              >
                <PlusCircle className="mr-2" size={25} />
                Create
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAssignment;