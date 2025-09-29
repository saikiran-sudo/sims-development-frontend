import React, { useState, useEffect } from 'react';
import {
  Search,
  Eye,
  Pencil,
  Trash2,
  PlusCircle,
  X,
  School, // Icon for Class module
  Users, // Icon for strength/students
  User, // For individual teacher
  BookText, // For subjects
  GraduationCap, // Alternative for Class
  Save, // For save button
  CheckCircle, // For success alert
  Info // For info/error alert
} from 'lucide-react';
import api from '../../../utils/axiosConfig';
import { useAuth } from '../../../contexts/AuthContext';
import { classAPI } from '../../../services/api';
import { fetchSectionsForClass } from '../../../utils/classUtils';
import axios from 'axios';

// Helper function to extract the section from a class name (e.g., "1A" -> "A")
const extractSection = (className) => {
  // Check if className is a valid string
  if (!className || typeof className !== 'string') {
    return '';
  }

  // This regex looks for a number followed by an uppercase letter at the end of the string.
  // Example: "1A" -> "A", "10B" -> "B", "Nursery" -> ""
  // This function might need adjustment if sections are no longer single letters at the end.
  // For now, it will extract the last character if it's a letter after a digit.
  const match = className.match(/\d+([A-Za-z])$/);
  if (match && match[1]) {
    return match[1].toUpperCase();
  }
  // If className itself is just the section (e.g., "Morning Batch"), return it directly
  // This is a heuristic and might need refinement based on actual data structure.
  if (!className.match(/\d/) && className) { // If no digit in class name, assume it might be a direct section name if not empty
    return className;
  }
  return ''; // Return empty string if no section letter is found
};

const ClassModule = () => {
  const [classes, setClasses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredClasses, setFilteredClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingClassId, setEditingClassId] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [studentCounts, setStudentCounts] = useState({}); // New state for student counts
  const [error, setError] = useState('');

  const [newClass, setNewClass] = useState({
    grade: '', // This will be the "Class Name" input (e.g., "Class 1" or "Nursery")
    section: '', // This will be the "Section" input (e.g., "A", "Morning Batch", "Red Group")
  });


  // New state to store sections added within the current modal session
  const [addedSections, setAddedSections] = useState([]);

  const [alert, setAlert] = useState({ message: '', type: '' }); // type: 'success' or 'error'
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // New state for filter dropdowns
  const [filterClass, setFilterClass] = useState('All Classes');
  const [filterSection, setFilterSection] = useState('All Sections');
  const [classOptions, setClassOptions] = useState([]);
  const [sectionOptions, setSectionOptions] = useState([]);

  // Access API_BASE_URL from environment variables
  const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'; // Fallback for development
  const API_BASE_URL = `${API_URL}/api/classes`; // Use the base URL for the API endpoint

  const { user } = useAuth();

  // Fetch all classes from backend
  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await classAPI.getAllClasses();
      const uniqueClasses = Array.from(
        new Map(
          (response.data || response).map(cls => [
            cls.class_name || cls.name || cls.label || cls.value,
            cls
          ])
        ).values()
      );
      const uniqueSections = Array.from(
        new Set(
          (response.data || response)
            .map(cls => cls.section || cls.name || cls.label || cls.value)
            .filter(Boolean) // Remove any undefined/null values
        )
      );
      const options = uniqueClasses.map(cls =>
        cls.class_name || cls.name || cls.label || cls.value
      ).filter(Boolean); // Remove any undefined/null values

      // Add "All Classes" option at the beginning
      const allClassesOptions = ['All Classes', ...options];
      setClassOptions(allClassesOptions);
      setSectionOptions(uniqueSections);
      setClasses(response.data);
      setFilteredClasses(response.data);
    } catch (error) {
      setClassOptions([]); // fallback to empty
    } finally {
      setLoading(false);
    }
  };

  // Fetch sections for a specific class
  const fetchSectionsForSelectedClass = async (className) => {
    console.log('Fetching sections for class:', className);

    if (className === 'All' || className === 'All Classes') {
      // If "All" is selected, show all sections
      const response = await classAPI.getAllClasses();
      const allSections = Array.from(
        new Set(
          (response.data || response)
            .map(cls => cls.section)
            .filter(Boolean)
        )
      );
      console.log('All sections:', allSections);
      setSectionOptions(allSections);
      return;
    }

    try {
      // Fetch sections for the specific class
      const sections = await fetchSectionsForClass(className);
      if (sections && sections.length > 0) {
        // Extract section values from the options
        const sectionValues = sections.map(section => section.value || section);
        console.log('Sections from fetchSectionsForClass:', sectionValues);
        setSectionOptions(sectionValues);
      } else {
        // If no sections found, try to get from predefined sections
        const token = JSON.parse(localStorage.getItem('authToken'));
        const predefinedResponse = await axios.get(`${API_URL}/api/classes/sections?grade=${encodeURIComponent(className)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (predefinedResponse.data) {
          console.log('Predefined sections:', predefinedResponse.data);
          setSectionOptions(predefinedResponse.data);
        } else {
          console.log('No predefined sections found');
          setSectionOptions([]);
        }
      }
    } catch (error) {
      console.error('Error fetching sections for class:', error);
      // Fallback: try to get sections from existing classes data
      const existingSections = classes
        .filter(cls => cls.class_name === className)
        .map(cls => cls.section)
        .filter(Boolean);
      console.log('Fallback sections from existing classes:', existingSections);
      setSectionOptions(existingSections);
    }
  };

  // Handle class filter change
  const handleClassFilterChange = (selectedClass) => {
    console.log('Class filter changed to:', selectedClass);
    setFilterClass(selectedClass);
    setFilterSection('All Sections'); // Reset section filter when class changes
    fetchSectionsForSelectedClass(selectedClass);
  };

  // Fetch student counts for each class
  const fetchStudentCounts = async () => {
    try {
      const response = await api.get('/students');
      const students = response.data;

      // Create a map to count students by class and section
      const counts = {};

      students.forEach(student => {
        if (student.class_id && student.section) {
          const key = `${student.class_id}-${student.section}`;
          counts[key] = (counts[key] || 0) + 1;
        }
      });

      setStudentCounts(counts);
    } catch (error) {
      console.error('Error fetching student counts:', error);
    }
  };

  // Load classes on component mount
  useEffect(() => {
    fetchClasses();
    fetchStudentCounts();
  }, []);

  // Initialize sections when classes are loaded
  useEffect(() => {
    if (classes.length > 0) {
      fetchSectionsForSelectedClass(filterClass);
    }
  }, [classes, filterClass]);

  // Function to get teacher for a specific class and section
  const getTeacherForClass = (className, section) => {
    const classKey = `${className}-${section}`;
    const teacher = teachers.find(t => t.class_teacher === classKey);
    console.log('classkey :', classKey);
    console.log('teacher classkey :', teacher);
    return teacher ? `${teacher.full_name}(${teacher.user_id})` : 'Not Assigned';
  };

  // Fetch teachers
  useEffect(() => {
    const token = JSON.parse(localStorage.getItem('authToken'));
    const fetchTeachers = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/teachers/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTeachers(response.data);
      } catch (error) {
        console.error('Error fetching teachers:', error);
      }
    };
    fetchTeachers();
  }, []);



  // Color mapping for different grades (still used in view modal)
  const gradeColors = {
    'Nursery': { bg: 'bg-pink-100', text: 'text-pink-800' },
    'LKG': { bg: 'bg-orange-100', text: 'text-orange-800' },
    'UKG': { bg: 'bg-teal-100', text: 'text-teal-800' },
    'Class 1': { bg: 'bg-blue-100', text: 'text-blue-800' },
    'Class 2': { bg: 'bg-green-100', text: 'text-green-800' },
    'Class 3': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    'Class 4': { bg: 'bg-purple-100', text: 'text-purple-800' },
    'Class 5': { bg: 'bg-red-100', text: 'text-red-800' },
    'Class 6': { bg: 'bg-indigo-100', text: 'text-indigo-800' },
    'Class 7': { bg: 'bg-cyan-100', text: 'text-cyan-800' },
    'Class 8': { bg: 'bg-lime-100', text: 'text-lime-800' },
    'Class 9': { bg: 'bg-fuchsia-100', text: 'text-fuchsia-800' },
    'Class 10': { bg: 'bg-rose-100', text: 'text-rose-800' },
    'Default': { bg: 'bg-gray-100', text: 'text-gray-800' },
  };

  const getGradeDisplay = (grade) => {
    return gradeColors[grade] || gradeColors['Default'];
  };

  // Filter classes based on search term and dropdowns
  useEffect(() => {
    const results = classes.filter(
      (cls) => {
        const matchesSearchTerm =
          cls.class_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cls.section.toLowerCase().includes(searchTerm.toLowerCase()) ||
          getTeacherForClass(cls.class_name, cls.section).toLowerCase().includes(searchTerm.toLowerCase()) ||
          (cls.teachers_details && cls.teachers_details.some(teacher => // Check if teachers_details exists before using it
            teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            teacher.empId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (teacher.subjects && teacher.subjects.some(subject => subject.toLowerCase().includes(searchTerm.toLowerCase()))) // Check if subjects exists
          ));

        const matchesClassFilter =
          filterClass === 'All' || filterClass === 'All Classes' || cls.class_name === filterClass;

        const matchesSectionFilter =
          filterSection === 'All' || filterSection === 'All Sections' || cls.section === filterSection;

        return matchesSearchTerm && matchesClassFilter && matchesSectionFilter;
      }
    );
    setFilteredClasses(results);
  }, [searchTerm, classes, filterClass, filterSection]);

  const resetForm = () => {
    setNewClass({
      grade: '',
      section: '',
    });
    setEditingClassId(null);
    setIsAddEditModalOpen(false);
    setAddedSections([]); // Reset added sections when modal closes
  };

  // Handle add/update class submission (for the final "Add Class" button)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (!newClass.grade || (!editingClassId && !newClass.section && addedSections.length === 0)) {
        setAlert({ message: 'Please select Class Name and fill in Section Name.', type: 'error' });
        setSubmitting(false);
        return;
      }

      // If in edit mode, proceed with the single class update
      if (editingClassId) {
        const classData = {
          class_name: newClass.grade,
          strength: 0,
          section: newClass.section,
          class_teacher: 'Assigned Later',
          // teachers_details: [], 
          admin_id: user?.profile?._id || user?.profile?.userId || user?.profile?.user_id || '',
        };
        await api.put(`${API_BASE_URL}/${editingClassId}`, classData);
        setAlert({ message: 'Class updated successfully!', type: 'success' });
      } else {
        // If in add mode and sections are pending, add the last one if filled, then close.
        // Or if only one section is being added and "Add Class" is clicked directly.
        if (newClass.section) {
          const classData = {
            class_name: newClass.grade,
            strength: 0,
            section: newClass.section,
            class_teacher: 'Assigned Later',
            // teachers_details: [], 
            admin_id: user?.profile?._id || user?.profile?.userId || user?.profile?.user_id || '',
          };
          await api.post(API_BASE_URL, classData);
          

          setAlert({ message: 'Class added successfully!', type: 'success' });
        } else if (addedSections.length > 0) {
          setAlert({ message: 'All sections added successfully!', type: 'success' });
        }
      }

      await fetchClasses();
      await fetchStudentCounts(); // Refresh student counts
      resetForm();
    } catch (error) {
      console.log('Error saving class:', error.message);
      if (error.message === 'Class with section already exists') {
         window.alert(error.message);
        console.log('Class already exists!!!!!!!');
      } else {
        setAlert({
          message: error.response?.data?.message || 'Failed to save class',
          type: 'error'
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const classOptionss = [
    'Nursery',
    'LKG',
    'UKG',
    'Class 1',
    'Class 2',
    'Class 3',
    'Class 4',
    'Class 5',
    'Class 6',
    'Class 7',
    'Class 8',
    'Class 9',
    'Class 10',
  ]

  // Handle "Add Another Section" button click
  // This will add the current section as a new class and then reset the section input
  const handleAddAnotherSection = async () => {
    setSubmitting(true);

    try {
      if (!newClass.grade || !newClass.section) {
        setAlert({ message: 'Please select Class Name and fill in Section Name before adding another.', type: 'error' });
        return;
      }

      // Construct class_name from grade and section
      const classData = {
        class_name: newClass.grade,
        strength: 0,
        section: newClass.section,
        class_teacher: 'Assigned Later',
        // teachers_details: [], 
        admin_id: user?.profile?._id || user?.profile?.userId || user?.profile?.user_id || '',
      };

      await api.post(API_BASE_URL, classData);
      setAlert({ message: `Section '${newClass.section}' added for ${newClass.grade}! Add another or close.`, type: 'success' });

      // Add the successfully added section to our temporary list
      setAddedSections(prev => [...prev, newClass.section]);
      // Clear only the section field for the next input
      setNewClass(prev => ({ ...prev, section: '' }));
      await fetchClasses(); // Refresh the class list immediately
      await fetchStudentCounts(); // Refresh student counts

    } catch (error) {
      console.error('Error adding another section:', error);
      // setAlert({
      //   message: error.response?.data?.message || 'Failed to add section',
      //   type: 'error'
      // });
      if (error.response && error.response.status === 400) {
        // setAlert({
        //   message: error.response.data.message,
        //   type: 'error'
        // });
        console.log('error.response.data.message',error.response.data.message);
      } else {
        setAlert({
          message: error.response?.data?.message || 'Failed to add section',
          type: 'error'
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Handle view class profile
  const handleViewProfile = (classId) => {
    const selected = classes.find(cls => cls._id === classId);
    setSelectedClass(selected);
    setIsViewModalOpen(true);
  };

  // Handle edit class
  const handleEdit = (classId) => {
    const classToEdit = classes.find(cls => cls._id === classId);

    if (!classToEdit) {
      console.error('Class not found with ID:', classId);
      setAlert({ message: 'Class not found', type: 'error' });
      return;
    }

    setEditingClassId(classId);

    // Extract grade and section from class_name
    // The class_name might be something like "Class 1 A" or "Nursery A"
    let grade = classToEdit.class_name;
    let section = classToEdit.section || '';

    // If class_name contains a space, it might be "Grade Section" format
    if (classToEdit.class_name && classToEdit.class_name.includes(' ')) {
      const parts = classToEdit.class_name.split(' ');
      // Check if the last part looks like a section (single letter or short word)
      const lastPart = parts[parts.length - 1];
      if (lastPart.length <= 3 && /^[A-Za-z]+$/.test(lastPart)) {
        // Remove the last part to get the grade
        grade = parts.slice(0, -1).join(' ');
        section = lastPart;
      }
    }

    setNewClass({
      grade: grade,
      section: section,
    });
    setIsAddEditModalOpen(true);
    setAlert({ message: '', type: '' });
    setAddedSections([]); // Clear added sections when opening for edit
  };

  // Handle delete class
  const handleDelete = async (classId) => {
    if (window.confirm('Are you sure you want to delete this class?')) {
      try {
        await api.delete(`${API_BASE_URL}/${classId}`);
        setAlert({ message: 'Class deleted successfully!', type: 'success' });
        await fetchClasses();
        await fetchStudentCounts(); // Refresh student counts
      } catch (error) {
        console.error('Error deleting class:', error);
        setAlert({
          message: error.response?.data?.message || 'Failed to delete class',
          type: 'error'
        });
      }
    }
  };

  const closeModal = () => {
    setIsViewModalOpen(false);
    setSelectedClass(null);
  };


  // Get unique sections from existing classes for the filter dropdown
  const uniqueSections = ['All', ...sectionOptions];


  // Loading state
  if (loading) {
    return (
      <div className="px-0 sm:px-2 md:px-4 lg:p-6 flex flex-col gap-2 sm:gap-4 lg:gap-8">
        <div className="flex items-center mb-8 pb-4 border-b border-gray-200">
          <School className="mr-4 text-indigo-600" size={36} />
          <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900 leading-tight">Class Management</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-lg text-gray-600">Loading classes...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="px-0 sm:px-2 md:px-4 lg:p-6 flex flex-col gap-2 sm:gap-4 lg:gap-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200"> {/* Added justify-between */}
        <div className="flex items-center">
          <School className="mr-4 text-indigo-600" size={36} />
          <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900 leading-tight">Class Management</h1>
        </div>
        {/* New Filter Dropdowns */}
        <div className="flex gap-4">
          <div className="relative">
            <select
              className="block appearance-none w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 pr-8 rounded-lg shadow-sm leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={filterClass}
              onChange={(e) => handleClassFilterChange(e.target.value)}
            >
              {classOptions.map(grade => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
            </div>
          </div>
          <div className="relative">
            <select
              className="block appearance-none w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 pr-8 rounded-lg shadow-sm leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={filterSection}
              onChange={(e) => setFilterSection(e.target.value)}
            >
              <option value="All Sections">All Sections</option>
              {sectionOptions.map(section => (
                <option key={section} value={section}>{section}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Message */}
      {alert.message && (
        <div className={`flex items-center justify-between p-4 mb-6 rounded-lg shadow-md ${alert.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
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
            className={`p-1 rounded-full transition-colors ${alert.type === 'success' ? 'hover:bg-green-200' :
              alert.type === 'error' ? 'hover:bg-red-200' :
                'hover:bg-blue-200'
              }`}
            aria-label="Dismiss alert"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Search and Add New Class */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6 items-center">
        <div className="relative flex-grow w-full sm:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="text-gray-400" size={20} />
          </div>
          <input
            type="text"
            placeholder="Search classes, sections, or teacher names"
            className="pl-10 pr-4 py-2.5 w-full rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400 text-base transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { resetForm(); setIsAddEditModalOpen(true); setAlert({ message: '', type: '' }); }}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50 transition transform hover:-translate-y-0.5"
          >
            <PlusCircle size={20} /> Add New Class
          </button>
        </div>
      </div>

      {/* Classes Table */}
      <div className="rounded-xl border border-gray-200 shadow-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Class</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Section</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Strength</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Class Teacher</th> {/* Updated from Supervisor */}
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {filteredClasses.length > 0 ? (
              filteredClasses.map((cls) => (
                <tr key={cls._id} className="hover:bg-indigo-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-lg font-bold text-gray-900">{cls.class_name}</div> {/* Display grade as Class */}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-700">{cls.section || 'N/A'}</span> {/* Display actual section */}
                  </td>
                  {/* Strength display with actual student count */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-lg font-bold text-gray-900 mr-2">
                        {(() => {
                          const key = `${cls.class_name}-${cls.section}`;
                          return studentCounts[key] || 0;
                        })()}
                      </span>
                      <Users size={20} className="text-gray-500" />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {getTeacherForClass(cls.class_name, cls.section)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewProfile(cls._id)}
                        className="p-2.5 rounded-full text-blue-600 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        title="View Profile"
                      >
                        <Eye size={20} />
                      </button>
                      <button
                        onClick={() => handleEdit(cls._id)}
                        className="p-2.5 rounded-full text-indigo-600 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                        title="Edit"
                      >
                        <Pencil size={20} />
                      </button>
                      <button
                        onClick={() => handleDelete(cls._id)}
                        className="p-2.5 rounded-full text-red-600 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-6 text-center text-sm text-gray-500"> {/* Updated colspan */}
                  No classes found matching your search criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Class Modal */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 md:p-8 w-full max-w-lg md:max-w-xl shadow-2xl border border-gray-100 transition-all duration-300 ease-in-out transform scale-100 opacity-100">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingClassId ? 'Edit Class' : 'Add New Class'}
              </h2>
              <button
                onClick={() => { resetForm(); setAlert({ message: '', type: '' }); }}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-5">
                <div>
                  <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-1">Class Name <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select
                      id="grade"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white pr-10 text-gray-900 transition-colors cursor-pointer"
                      value={newClass.grade}
                      onChange={(e) => {
                        setNewClass({ ...newClass, grade: e.target.value, section: '' }); // Clear section when grade changes
                        setAddedSections([]); // Clear added sections when grade changes
                      }}
                      required
                      disabled={editingClassId || addedSections.length > 0} // Disable grade selection during edit or if sections are already added
                    >
                      <option value="" disabled>Select Class</option>
                      {classOptionss.filter(g => g !== 'All').map(grade => (
                        <option key={grade} value={grade}>{grade}</option>
                      ))}
                    </select>
                    <svg className="w-5 h-5 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>

                {/* Display previously added sections */}
                {!editingClassId && addedSections.length > 0 && (
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-2">Previously Added Sections for {newClass.grade}:</p>
                    <ul className="list-disc list-inside text-gray-600 text-sm">
                      {addedSections.map((section, index) => (
                        <li key={index}>Section: <span className="font-semibold">{section}</span></li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Section input is now a standard text input */}
                <div>
                  <label htmlFor="section" className="block text-sm font-medium text-gray-700 mb-1">Section Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    id="section"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400 text-base transition-colors"
                    value={newClass.section}
                    onChange={(e) => { setNewClass({ ...newClass, section: e.target.value }) }}
                    placeholder="e.g., A, B, Morning Batch"
                    required
                  // Removed disabled={editingClassId} - now it's editable
                  />
                </div>


                {/* Buttons */}
                <div className="flex justify-between space-x-3 pt-4 border-t border-gray-100">
                  {/* "Add Another Section" button - for adding multiple sections (as separate class entries) */}
                  {!editingClassId && ( // Only show in add mode
                    <button
                      type="button"
                      onClick={handleAddAnotherSection}
                      className="flex items-center px-4 py-2.5 border border-indigo-300 rounded-lg shadow-sm text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-4 focus:ring-indigo-300 focus:ring-opacity-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={submitting || !newClass.grade || !newClass.section} // Disable if submitting or no grade/section
                    >
                      <PlusCircle className="mr-2" size={20} />
                      Add Section & Add Another
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => { resetForm(); setAlert({ message: '', type: '' }); }}
                    className="flex items-center px-5 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-300 focus:ring-opacity-50 transition-colors"
                    disabled={submitting}
                  >
                    <X className="mr-2" size={20} />
                    Cancel
                  </button>
                  <button
                    type="submit" // This button will submit the current section and close the modal
                    className="flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={submitting || !newClass.grade || (!editingClassId && addedSections.length === 0 && !newClass.section)} // Disable if submitting or incomplete in add mode
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {editingClassId ? 'Saving...' : 'Adding...'}
                      </>
                    ) : (
                      <>
                        <Save className="mr-2" size={20} />
                        {editingClassId ? 'Save Changes' : (addedSections.length > 0 ? 'Done Adding Sections' : 'Add Class')}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Class Details Modal (no changes needed here, it shows full details) */}
      {isViewModalOpen && selectedClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transform scale-100 opacity-100 transition-all duration-300 ease-in-out">
            <div className="flex justify-between items-center border-b p-4">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedClass.class_name} Details
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-indigo-50 p-5 rounded-lg shadow-sm border border-indigo-100">
                  <h3 className="font-semibold text-lg mb-3 text-gray-800 flex items-center">
                    <Info size={22} className="mr-2 text-indigo-600" /> Class Information
                  </h3>
                  <div className="space-y-2 text-gray-700">
                    <p><span className="font-medium">Class Name:</span> {selectedClass.class_name}</p>
                    <p><span className="font-medium">Section:</span> {selectedClass.section || 'N/A'}</p>
                    <p><span className="font-medium">Students:</span> {(() => {
                      const key = `${selectedClass.class_name}-${selectedClass.section}`;
                      return studentCounts[key] || 0;
                    })()}</p>
                    <p><span className="font-medium">Class Teacher:</span> {getTeacherForClass(selectedClass.class_name, selectedClass.section)}</p>
                  </div>
                </div>

                <div className="bg-purple-50 p-5 rounded-lg shadow-sm border border-purple-100">
                  <h3 className="font-semibold text-lg mb-3 text-gray-800 flex items-center">
                    <Users size={22} className="mr-2 text-purple-600" /> Class Statistics
                  </h3>
                  <div className="space-y-2 text-gray-700">
                    <p><span className="font-medium">Enrolled Students:</span> {(() => {
                      const key = `${selectedClass.class_name}-${selectedClass.section}`;
                      return studentCounts[key] || 0;
                    })()}</p>
                    {/* Removed the hardcoded capacity and progress bar */}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end p-4 border-t border-gray-100">
              <button
                onClick={closeModal}
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

export default ClassModule;