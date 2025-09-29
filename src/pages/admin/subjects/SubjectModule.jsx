import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  PlusCircle,
  Trash2,
  X,
  Pencil,
  BookText,
  User,
  Info,
  CheckCircle,
  Save,
  ChevronDown
} from 'lucide-react';
import { teacherAPI } from '../../../services/api'; // Assuming this path is correct and teacherAPI uses the base URL
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import { classAPI } from '../../../services/api';

// Access API_BASE_URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'; // Fallback for development



// Create axios instance for direct backend calls
const backendAPI = axios.create({
  baseURL: `${API_BASE_URL}/api`, // Use API_BASE_URL here
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
backendAPI.interceptors.request.use(
  (config) => {
    const token = JSON.parse(localStorage.getItem('authToken'));
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Helper function to extract grade and section(s) from a combined class_name
// Now handles multiple sections, comma-separated (e.g., "Class 1", "A,B")
const parseFullClassName = (fullClassName) => {
  if (!fullClassName) return { grade: '', sections: [] };

  const parts = fullClassName.split(',').map(p => p.trim());
  let grade = '';
  let sections = [];

  // Determine the grade based on the first part
  const firstPart = parts[0];

  // Try to match standard numbered classes like "1A", "10B"
  const numberedClassMatch = firstPart.match(/^(\d+)([A-Za-z\s]*)$/); // Allow spaces in section part for parsing
  if (numberedClassMatch) {
    grade = `Class ${numberedClassMatch[1]}`;
    // Extract sections from each part, handling both "1A" and "A" (if provided as "1A,B")
    sections = parts.map(p => {
      const match = p.match(/^(\d*)([A-Za-z\s]*)$/);
      return match ? match[2].toUpperCase().trim() : ''; // Get the letter part, trim
    }).filter(s => s.length > 0); // Remove empty strings
  } else {
    // Try to match pre-primary classes like "NurseryMorningBatch"
    for (const gradeOpt of ['Nursery', 'LKG', 'UKG']) {
      const gradePart = gradeOpt.replace(/\s/g, ''); // "Nursery"
      if (firstPart.startsWith(gradePart)) {
        grade = gradeOpt;
        sections = parts.map(p => {
          let section = p.substring(gradePart.length);
          section = section.replace(/([A-Z])/g, ' $1').trim(); // "MorningBatch" -> "Morning Batch"
          return section;
        }).filter(s => s.length > 0);
        break;
      }
    }
  }

  return { grade, sections: [...new Set(sections)] }; // Ensure unique sections
};


// Custom Confirmation Modal Component
const CustomConfirmModal = ({ message, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Confirm Action</h3>
        <p className="text-gray-700 mb-6">{message}</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md font-semibold hover:bg-gray-300 transition duration-200"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-md font-semibold hover:bg-red-700 shadow-sm transition duration-200"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};


const SubjectModule = () => {
  // State
  const [subjects, setSubjects] = useState([]); // All subjects from backend
  const [selectedClass, setSelectedClass] = useState('All Classes'); // Default to Nursery (main page dropdown for class)
  const [selectedSectionMainPage, setSelectedSectionMainPage] = useState(''); // New: For main page section dropdown
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();

  // State for the Add/Edit form
  const [newSubject, setNewSubject] = useState({
    name: '',
    selectedGrade: '', // For "Select Class" dropdown in modal
    selectedSections: [], // Changed to an array for multiple sections in modal
    teachers: [{ empId: '', name: '' }],
    maxMarks: 100,
    passingMarks: 35,
    category: ''
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [alert, setAlert] = useState({ message: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [teacherSuggestions, setTeacherSuggestions] = useState([]);
  const [teacherLoading, setTeacherLoading] = useState(false);
  const teacherTimeout = useRef();

  const sectionDropdownRef = useRef(null);
  const [isSectionDropdownOpen, setIsSectionDropdownOpen] = useState(false); // To manage custom dropdown visibility for modal


  // State for custom confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [subjectToDeleteId, setSubjectToDeleteId] = useState(null);
  const [subjectToDeleteName, setSubjectToDeleteName] = useState('');
  const [sectionOptions, setSectionOptions] = useState([]);
  const [classOptions, setClassOptions] = useState([]);

  
  

  useEffect(() => {
    // Fetch class options and subjects from backend
    const fetchData = async () => {
      try {
        // Fetch class options
        const response = await classAPI.getAllClasses();
        const uniqueClasses = Array.from(
          new Map(
            (response.data || response).map(cls => [
              cls.class_name || cls.name || cls.label || cls.value,
              cls
            ])
          ).values()
        );
        
        const options = uniqueClasses.map(cls => 
          cls.class_name || cls.name || cls.label || cls.value
        ).filter(Boolean); // Remove any undefined/null values
        
        // Add "All Classes" option at the beginning
        const allClassesOptions = ['All Classes', ...options];
        setClassOptions(allClassesOptions);

        // Fetch subjects
        const subjectsRes = await backendAPI.get('/subjects');
        setSubjects(subjectsRes.data);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setClassOptions(['All Classes']); // fallback to just "All Classes"
        setSectionOptions([]); // fallback to empty sections
        setSubjects([]); // fallback to empty subjects
      }
    };
    fetchData();
  }, []);

  // Fetch sections for the selected class
  const fetchSectionsForClass = async (className) => {
    try {
      const response = await classAPI.getAllClasses();
      const classData = response.data || response;
      
      // Filter sections for the specific class
      const sectionsForClass = classData
        .filter(cls => {
          const clsName = cls.class_name || cls.name || cls.label || cls.value;
          return clsName === className;
        })
        .map(cls => cls.section)
        .filter(Boolean); // Remove undefined/null values
      
      // If no sections found, try to get all unique sections from the class data
      if (sectionsForClass.length === 0) {
        const allSections = Array.from(
          new Set(
            classData
              .map(cls => cls.section)
              .filter(Boolean)
          )
        );
        setSectionOptions(allSections);
      } else {
        setSectionOptions(sectionsForClass);
      }
    } catch (error) {
      console.error('Failed to fetch sections for class:', error);
      setSectionOptions([]);
    }
  };

  // Fetch sections when class selection changes
  useEffect(() => {
    if (selectedClass && selectedClass !== 'All Classes') {
      fetchSectionsForClass(selectedClass);
    } else if (selectedClass === 'All Classes') {
      // If "All Classes" is selected, get all unique sections
      const fetchAllSections = async () => {
        try {
          const response = await classAPI.getAllClasses();
          const classData = response.data || response;
          const allSections = Array.from(
            new Set(
              classData
                .map(cls => cls.section)
                .filter(Boolean)
            )
          );
          setSectionOptions(allSections);
        } catch (error) {
          console.error('Failed to fetch all sections:', error);
          setSectionOptions([]);
        }
      };
      fetchAllSections();
    }
  }, [selectedClass]);




  // Close custom dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sectionDropdownRef.current && !sectionDropdownRef.current.contains(event.target)) {
        setIsSectionDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Update filtered subjects when selectedClass, selectedSectionMainPage, searchTerm, or subjects change
  useEffect(() => {
    let results = subjects.filter(subject => {
      // Extract class and section information from the subject
      const subjectClass = subject.className || '';
      const subjectSection = subject.section || '';
      
      // Filter by class
      let classMatch = true;
      if (selectedClass && selectedClass !== 'All Classes') {
        // Check if the subject's class matches the selected class
        classMatch = subjectClass.includes(selectedClass) || subjectClass === selectedClass;
      }
      
      // Filter by section
      let sectionMatch = true;
      if (selectedSectionMainPage && selectedSectionMainPage !== '') {
        // Check if the subject's section matches the selected section
        sectionMatch = subjectSection === selectedSectionMainPage;
      }
      
      return classMatch && sectionMatch;
    });

    if (searchTerm) {
      results = results.filter(subject =>
        subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (subject.className || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (subject.section || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (subject.teachers || []).some(teacher =>
          (teacher.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (teacher.empId || '').toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
    setFilteredSubjects(results);
  }, [searchTerm, subjects, selectedClass, selectedSectionMainPage]);




  // Add teacher field in form
  const addTeacherField = () => {
    setNewSubject(prev => ({
      ...prev,
      teachers: [...prev.teachers, { empId: '', name: '' }]
    }));
  };

  // Remove teacher field in form
  const removeTeacherField = (index) => {
    const updatedTeachers = [...newSubject.teachers];
    updatedTeachers.splice(index, 1);
    setNewSubject(prev => ({
      ...prev,
      teachers: updatedTeachers
    }));
  };

  // Handle teacher input change
  const handleTeacherChange = (index, field, value) => {
    const updatedTeachers = [...newSubject.teachers];
    updatedTeachers[index][field] = value;
    setNewSubject(prev => ({
      ...prev,
      teachers: updatedTeachers
    }));
  };

  const resetForm = () => {
    // If "All Classes" is selected, default to the first available class for the form
    const defaultGrade = selectedClass === 'All Classes' ? classOptions.find(cls => cls !== 'All Classes') || '' : selectedClass;
    setNewSubject({
      name: '',
      selectedGrade: defaultGrade, // Default to the first available class if "All Classes" is selected
      selectedSections: [], // Reset to empty array
      teachers: [{ empId: '', name: '' }],
      maxMarks: 100,
      passingMarks: 35,
      category: ''
    });
    setEditingSubject(null);
    setShowAddForm(false);
    // Clear sections when resetting form
    setSectionOptions([]);
  };

  // Helper to construct full className for backend (e.g., "Class 1", ["A", "B"] -> "1A,1B")
  const constructFullClassName = (grade, sections) => {
    if (!grade || sections.length === 0) return '';

    const cleanGradeNum = grade.replace('Class ', '').replace(/\s/g, ''); // "Nursery", "1"

    // Construct the combined string based on grade type
    return sections.map(sec => {
      const cleanSection = sec.replace(/\s/g, ''); // "Morning Batch" -> "MorningBatch"
      if (grade.startsWith('Class ')) {
        return `${cleanGradeNum}${cleanSection}`;
      } else {
        return `${cleanGradeNum}${cleanSection}`; // For Nursery, LKG, UKG
      }
    }).join(',');
  };


  // Add new subject (backend)
  const handleAddSubject = async () => {
    const { name, selectedGrade, selectedSections, teachers, maxMarks, passingMarks, category } = newSubject;

    if (!name || !selectedGrade || selectedSections.length === 0) {
      setAlert({ message: 'Subject Name, Class, and at least one Section are required.', type: 'error' });
      return;
    }
    const validTeachers = teachers.filter(t => t.empId && t.name);
    if (validTeachers.length === 0) {
      setAlert({ message: 'At least one teacher (with Employee ID and Name) is required for the subject.', type: 'error' });
      return;
    }
    setLoading(true);
    try {
      // const fullClassName = constructFullClassName(selectedGrade, selectedSections);
      const payload = {
        name,
        className: selectedGrade, // Send the combined class name(s)
        section: selectedSections[0],
        teachers: validTeachers,
        maxMarks,
        passingMarks,
        category,
        admin_id: user?.profile?._id || user?.profile?.userId || user?.profile?.user_id || ''
      };
      await backendAPI.post('/subjects', payload);
      setAlert({ message: `Subject "${name}" added successfully to ${selectedGrade} ${selectedSections.join(', ')}!`, type: 'success' });
      resetForm();
      // Re-fetch all data to update tables correctly
      const subjectsRes = await backendAPI.get('/subjects');
      setSubjects(subjectsRes.data);
      // Refresh class and section options
      const classResponse = await classAPI.getAllClasses();
      const uniqueClasses = Array.from(
        new Set(
          (classResponse.data || classResponse)
            .map(cls => cls.class_name || cls.name || cls.label || cls.value)
            .filter(Boolean)
        )
      );
      const uniqueSections = Array.from(
        new Set(
          (classResponse.data || classResponse)
            .map(cls => cls.section || cls.name || cls.label || cls.value)
            .filter(Boolean)
        )
      );
      const allClassesOptions = ['All Classes', ...uniqueClasses];
      setClassOptions(allClassesOptions);
      setSectionOptions(uniqueSections);

    } catch (err) {
      setAlert({ message: err.response?.data?.message || err.message || 'Failed to add subject', type: 'error' });
    }
    setLoading(false);
  };

  // Delete subject (backend) with custom confirmation
  const handleDeleteConfirmation = (id, name) => {
    setSubjectToDeleteId(id);
    setSubjectToDeleteName(name);
    setShowConfirmModal(true);
  };

  const handleDeleteSubject = async () => {
    setShowConfirmModal(false); // Close the confirmation modal
    if (!subjectToDeleteId) return;

    setLoading(true);
    try {
      await backendAPI.delete(`/subjects/${subjectToDeleteId}`);
      setAlert({ message: 'Subject deleted successfully!', type: 'success' });
      // Re-fetch all data to update tables correctly
      const subjectsRes = await backendAPI.get('/subjects');
      setSubjects(subjectsRes.data);
      // Refresh class and section options
      const classResponse = await classAPI.getAllClasses();
      const uniqueClasses = Array.from(
        new Set(
          (classResponse.data || classResponse)
            .map(cls => cls.class_name || cls.name || cls.label || cls.value)
            .filter(Boolean)
        )
      );
      const uniqueSections = Array.from(
        new Set(
          (classResponse.data || classResponse)
            .map(cls => cls.section || cls.name || cls.label || cls.value)
            .filter(Boolean)
        )
      );
      const allClassesOptions = ['All Classes', ...uniqueClasses];
      setClassOptions(allClassesOptions);
      setSectionOptions(uniqueSections);

      setSubjectToDeleteId(null); // Clear the ID after deletion
      setSubjectToDeleteName('');
    } catch (err) {
      setAlert({ message: err.response?.data?.message || err.message || 'Failed to delete subject', type: 'error' });
    }
    setLoading(false);
  };

  // Edit subject (open modal)
  const handleEditSubject = (subject) => {
    setEditingSubject(subject);
    const { grade, sections } = parseFullClassName(subject.className); // Parse existing className
    setNewSubject({
      name: subject.name,
      selectedGrade: grade,
      selectedSections: sections, // Set as array
      teachers: subject.teachers.length > 0 ? subject.teachers : [{ empId: '', name: '' }],
      maxMarks: subject.maxMarks || 100,
      passingMarks: subject.passingMarks || 35,
      category: subject.category || ''
    });
    setShowAddForm(true);
    setAlert({ message: '', type: '' });
    // Fetch sections for the selected grade when editing
    if (grade && grade !== 'All Classes') {
      fetchSectionsForClass(grade);
    }
  };

  // Update subject (backend)
  const handleUpdateSubject = async () => {
    const { name, selectedGrade, selectedSections, teachers, maxMarks, passingMarks, category } = newSubject;

    if (!name || !selectedGrade || selectedSections.length === 0) {
      setAlert({ message: 'Subject Name, Class, and at least one Section are required.', type: 'error' });
      return;
    }
    const validTeachers = teachers.filter(t => t.empId && t.name);
    if (validTeachers.length === 0) {
      setAlert({ message: 'At least one teacher (with Employee ID and Name) is required for the subject.', type: 'error' });
      return;
    }
    setLoading(true);
    try {
      const fullClassName = constructFullClassName(selectedGrade, selectedSections);
      const payload = {
        name,
        className: fullClassName, // Send the combined class name(s)
        section: selectedSections[0],
        teachers: validTeachers,
        maxMarks,
        passingMarks,
        category,
        admin_id: user?.profile?._id || user?.profile?.userId || user?.profile?.user_id || ''
      };
      await backendAPI.put(`/subjects/${editingSubject._id}`, payload);
      setAlert({ message: 'Subject updated successfully!', type: 'success' });
      resetForm();
      // Re-fetch all data to update tables correctly
      const subjectsRes = await backendAPI.get('/subjects');
      setSubjects(subjectsRes.data);
      // Refresh class and section options
      const classResponse = await classAPI.getAllClasses();
      const uniqueClasses = Array.from(
        new Set(
          (classResponse.data || classResponse)
            .map(cls => cls.class_name || cls.name || cls.label || cls.value)
            .filter(Boolean)
        )
      );
      const uniqueSections = Array.from(
        new Set(
          (classResponse.data || classResponse)
            .map(cls => cls.section || cls.name || cls.label || cls.value)
            .filter(Boolean)
        )
      );
      const allClassesOptions = ['All Classes', ...uniqueClasses];
      setClassOptions(allClassesOptions);
      setSectionOptions(uniqueSections);

    } catch (err) {
      setAlert({ message: err.response?.data?.message || err.message || 'Failed to update subject', type: 'error' });
    }
    setLoading(false);
  };

  // Handle section selection/deselection for MODAL
  const handleSectionToggle = (section) => {
    setNewSubject(prev => {
      const currentSections = prev.selectedSections;
      if (currentSections.includes(section)) {
        return {
          ...prev,
          selectedSections: currentSections.filter(s => s !== section)
        };
      } else {
        return {
          ...prev,
          selectedSections: [...currentSections, section].sort() // Keep sorted
        };
      }
    });
  };

  return (
    <div className="px-0 sm:px-2 md:px-4 lg:p-6 flex flex-col gap-2 sm:gap-4 lg:gap-8">
      {/* Header */}
      <div className="flex items-center mb-8 pb-4 border-b border-gray-200">
        <BookText className="mr-4 text-indigo-600" size={36} />
        <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900 leading-tight">Subject Management</h1>
      </div>

      {/* Alert Message */}
      {alert.message && (
        <div className={`flex items-center justify-between p-4 mb-6 rounded-lg shadow-md ${
          alert.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
            alert.type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' :
              'bg-blue-100 text-blue-800 border border-blue-200'
        }`} role="alert">
          <div className="flex items-center">
            {alert.type === 'success' && <CheckCircle className="mr-3" size={20} />}
            {alert.type === 'error' && <Info className="mr-3" size={20} />}
            <span className="text-sm font-medium">{alert.message}</span>
          </div>
          <button
            onClick={() => setAlert({ message: '', type: '' })}
            className={`p-1 rounded-full transition-colors ${
              alert.type === 'success' ? 'hover:bg-green-200' :
                alert.type === 'error' ? 'hover:bg-red-200' :
                  'hover:bg-blue-200'
            }`}
            aria-label="Dismiss alert"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Class Selection, Section Selection, and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 items-center">
        {/* Class Selector for main page view */}
        <div className="relative w-full md:w-auto">
          <select
            className="block w-full px-4 py-2.5 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white pr-10 text-gray-900 transition-colors cursor-pointer"
            value={selectedClass}
            onChange={(e) => {
              const selectedValue = e.target.value;
              
              setSelectedClass(selectedValue);
              setSelectedSectionMainPage(''); // Clear section when class changes
              setSearchTerm(''); // Clear search when class changes
              setAlert({ message: '', type: '' }); // Clear alert
              // Sections will be fetched automatically by useEffect
            }}
          >
            {classOptions.map(cls => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
          <svg className="w-5 h-5 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
        </div>

        {/* Section Selector for main page view */}
        <div className="relative w-full md:w-auto">
          <select
            className="block w-full px-4 py-2.5 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white pr-10 text-gray-900 transition-colors cursor-pointer disabled:bg-gray-50 disabled:cursor-not-allowed"
            value={selectedSectionMainPage}
            onChange={(e) => {
              setSelectedSectionMainPage(e.target.value);
              setSearchTerm(''); // Clear search when section changes
              setAlert({ message: '', type: '' }); // Clear alert
            }}
            disabled={sectionOptions.length === 0}
          >
            <option value="">All Sections</option>
            {sectionOptions.length > 0 ? (
              sectionOptions.map(section => (
                <option key={section} value={section}>{section}</option>
              ))
            ) : (
              <option value="" disabled>No sections available</option>
            )}
          </select>
          <svg className="w-5 h-5 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
        </div>

        {/* Search Input */}
        <div className="relative flex-grow w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder={`Search subjects${selectedClass !== 'All Classes' ? ` for ${selectedClass}` : ''}${selectedSectionMainPage ? ` ${selectedSectionMainPage}` : ''}...`}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400 text-base transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Add Subject Button */}
        <button
          onClick={() => {
            resetForm();
            // Set default grade for new subject to currently selected main page class
            // If "All Classes" is selected, default to the first available class
            const defaultGrade = selectedClass === 'All Classes' ? classOptions.find(cls => cls !== 'All Classes') || '' : selectedClass;
            setNewSubject(prev => ({ ...prev, selectedGrade: defaultGrade }));
            setShowAddForm(true);
            setAlert({ message: '', type: '' });
            // Fetch sections for the default grade
            if (defaultGrade && defaultGrade !== 'All Classes') {
              fetchSectionsForClass(defaultGrade);
            }
          }}
          className="w-full md:w-auto flex items-center justify-center px-6 py-2.5 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50 transition transform hover:-translate-y-0.5"
        >
          <PlusCircle className="mr-2" size={20} /> Add Subject
        </button>
      </div>

      {/* Add/Edit Subject Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 md:p-8 w-full max-w-lg md:max-w-xl shadow-2xl border border-gray-100 transition-all duration-300 ease-in-out transform scale-100 opacity-100">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingSubject ? `Edit Subject` : `Add New Subject`}
              </h2>
              <button
                onClick={() => { setShowAddForm(false); setAlert({ message: '', type: '' }); }}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); editingSubject ? handleUpdateSubject() : handleAddSubject(); }}>
              <div className="space-y-5">
                {/* Select Class Dropdown */}
                {console.log('newSubject.selectedGrade', newSubject.selectedGrade)}
                <div>
                  <label htmlFor="selectClass" className="block text-sm font-medium text-gray-700 mb-1">Select Class <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select
                      id="selectClass"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white pr-10 text-gray-900 transition-colors cursor-pointer"
                      value={newSubject.selectedGrade}
                      onChange={(e) => {
                        const selectedGrade = e.target.value;
                        setNewSubject(prev => ({ ...prev, selectedGrade, selectedSections: [] })); // Clear sections when class changes
                        // Fetch sections for the selected class in modal
                        if (selectedGrade && selectedGrade !== 'All Classes') {
                          fetchSectionsForClass(selectedGrade);
                        }
                      }}
                      required
                    >
                      <option value="Select Class">Select Class</option>
                      {classOptions.filter(cls => cls !== 'All Classes').map(cls => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                    </select>
                    <svg className="w-5 h-5 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>

                {/* Select Section Multi-Dropdown (for modal) */}
                <div className="relative" ref={sectionDropdownRef}>
                  <label htmlFor="selectSection" className="block text-sm font-medium text-gray-700 mb-1">Select Section(s) <span className="text-red-500">*</span></label>
                  <div
                    className={`flex flex-wrap items-center w-full px-4 py-2.5 rounded-lg border ${
                      newSubject.selectedGrade ? 'border-gray-300' : 'border-gray-200 bg-gray-50'
                    } shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-colors cursor-pointer min-h-[44px]`}
                    onClick={() => newSubject.selectedGrade && setIsSectionDropdownOpen(!isSectionDropdownOpen)}
                  >
                    {newSubject.selectedSections.length > 0 ? (
                      newSubject.selectedSections.map(section => (
                        <span key={section} className="flex items-center bg-indigo-100 text-indigo-800 text-sm font-medium px-2.5 py-1 rounded-full mr-2 mb-1">
                          {section}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleSectionToggle(section); }}
                            className="ml-1 -mr-0.5 w-4 h-4 inline-flex items-center justify-center rounded-full text-indigo-500 hover:bg-indigo-200"
                            aria-label={`Remove ${section}`}
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400 text-base">
                        {newSubject.selectedGrade ? 'Select Section(s)' : 'Select a Class first'}
                      </span>
                    )}
                    <ChevronDown className={`ml-auto text-gray-400 transition-transform ${isSectionDropdownOpen ? 'rotate-180' : ''}`} size={20} />
                  </div>

                  {isSectionDropdownOpen && newSubject.selectedGrade && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                      {sectionOptions.length > 0 ? (
                        sectionOptions.map(section => (
                          <div
                            key={section}
                            className={`flex items-center px-4 py-2 cursor-pointer hover:bg-indigo-50 ${
                              newSubject.selectedSections.includes(section) ? 'bg-indigo-100 font-semibold' : ''
                            }`}
                            onClick={() => handleSectionToggle(section)}
                          >
                            <input
                              type="checkbox"
                              checked={newSubject.selectedSections.includes(section)}
                              readOnly
                              className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            {section}
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-gray-500 italic">No sections available for this class.</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Subject Name */}
                <div>
                  <label htmlFor="subjectName" className="block text-sm font-medium text-gray-700 mb-1">Subject Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    id="subjectName"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400 text-base transition-colors"
                    value={newSubject.name}
                    onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                    placeholder="Enter subject name"
                    required
                  />
                </div>

                {/* Teachers */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Teachers <span className="text-red-500">*</span></label>
                  {newSubject.teachers.map((teacher, index) => (
                    <div key={index} className="flex gap-2 mb-3 items-center relative">
                      <input
                        type="text"
                        className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400 text-base transition-colors"
                        value={teacher.empId}
                        onChange={async (e) => {
                          handleTeacherChange(index, 'empId', e.target.value);
                          // Debounce API call for teacher suggestions
                          if (teacherTimeout.current) clearTimeout(teacherTimeout.current);
                          const value = e.target.value;
                          if (value.length < 2) {
                            setTeacherSuggestions([]);
                            return;
                          }
                          setTeacherLoading(true);
                          teacherTimeout.current = setTimeout(async () => {
                            try {
                              const res = await teacherAPI.searchTeachers(value); // Assuming this API works
                              setTeacherSuggestions(res.data);
                            } catch {
                              setTeacherSuggestions([]);
                            }
                            setTeacherLoading(false);
                          }, 300);
                        }}
                        onBlur={() => setTimeout(() => setTeacherSuggestions([]), 200)}
                        placeholder="Employee ID"
                      />
                      {teacherLoading && <div className="absolute left-0 top-full text-xs text-gray-400 bg-white px-2 py-1 rounded shadow">Loading...</div>}
                      {teacherSuggestions.length > 0 && (
                        <div className="absolute left-0 top-full z-10 bg-white border border-gray-200 rounded shadow-md mt-1 w-full max-h-40 overflow-y-auto">
                          {teacherSuggestions.map((t) => (
                            <div
                              key={t.user_id}
                              className="px-3 py-2 hover:bg-indigo-100 cursor-pointer text-sm"
                              onMouseDown={() => { // Use onMouseDown to prevent blur before click
                                handleTeacherChange(index, 'empId', t.user_id);
                                handleTeacherChange(index, 'name', t.full_name);
                                setTeacherSuggestions([]);
                              }}
                            >
                              <span className="font-medium">{t.user_id}</span> - {t.full_name}
                            </div>
                          ))}
                        </div>
                      )}
                      <input
                        type="text"
                        className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400 text-base transition-colors"
                        value={teacher.name}
                        onChange={(e) => handleTeacherChange(index, 'name', e.target.value)}
                        placeholder="Teacher Name"
                      />
                      {newSubject.teachers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTeacherField(index)}
                          className="p-2 text-red-600 hover:text-red-800 rounded-full hover:bg-red-100 transition-colors"
                          title="Remove Teacher"
                        >
                          <X size={20} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addTeacherField}
                    className="mt-1 flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                  >
                    <PlusCircle size={18} /> Add Another Teacher
                  </button>
                </div>

                {/* Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => { setShowAddForm(false); setAlert({ message: '', type: '' }); }}
                    className="flex items-center px-5 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-300 focus:ring-opacity-50 transition-colors"
                  >
                    <X className="mr-2" size={20} />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading} // Disable if overall form is loading/submitting
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {editingSubject ? 'Saving...' : 'Adding...'}
                      </>
                    ) : (
                      <>
                        <Save className="mr-2" size={20} />
                        {editingSubject ? 'Save Changes' : 'Add Subject'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subjects Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Subject</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Class</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Section</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Teachers</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {filteredSubjects.length > 0 ? (
              filteredSubjects.map(subject => (
                <tr key={subject._id} className="transition-colors duration-200 hover:bg-indigo-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                    {subject.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {subject.className} {/* Display the combined class name */}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {subject.section} {/* Display the combined class name */}
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {subject.teachers.length > 0 ? (
                        subject.teachers.map((teacher, index) => (
                          <div key={index} className="flex items-center text-sm text-gray-700">
                            <User size={16} className="mr-1.5 text-gray-500" />
                            <span className="font-medium">{teacher.name}</span>
                            <span className="text-gray-500 ml-1">({teacher.empId})</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-gray-500 text-sm italic">No teachers assigned</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditSubject(subject)}
                        className="p-2.5 rounded-full text-indigo-600 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                        title="Edit Subject"
                      >
                        <Pencil size={20} />
                      </button>
                      <button
                        onClick={() => handleDeleteConfirmation(subject._id, subject.name)}
                        className="p-2.5 rounded-full text-red-600 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                        title="Delete Subject"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="px-6 py-6 text-center text-gray-500"> {/* Updated colspan */}
                  No subjects found{selectedClass !== 'All Classes' ? ` for ${selectedClass}` : ''} matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Custom Confirmation Modal */}
      {showConfirmModal && (
        <CustomConfirmModal
          message={`Are you sure you want to delete "${subjectToDeleteName}"? This action cannot be undone.`}
          onConfirm={handleDeleteSubject}
          onCancel={() => { setShowConfirmModal(false); setSubjectToDeleteId(null); setSubjectToDeleteName(''); }}
        />
      )}
    </div>
  );
};

export default SubjectModule;