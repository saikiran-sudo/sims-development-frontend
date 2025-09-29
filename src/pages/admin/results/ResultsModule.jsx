import React, { useState, useMemo, useEffect } from 'react';
import {
  Search, ChevronDown, ChevronUp, User, Book, Hash, Percent, Award,
  Filter, X, Star, Trophy, TrendingUp, AlertCircle, Download, Users
} from 'lucide-react';
import { classAPI } from '../../../services/api';
import axios from 'axios';
import { getAuthHeaders } from '../../../utils/axiosConfig';


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const ResultsModule = () => {
  const [studentsData, setStudentsData] = useState([]);
  const [students, setStudents] = useState([]); // New state for students
  const [subjectsConfig, setSubjectsConfig] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [filterExamType, setFilterExamType] = useState(''); // New state for exam type
  const [filterGradeCategory, setFilterGradeCategory] = useState('');
  const [activeReportClass, setActiveReportClass] = useState(''); // New state for active report class
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [activeFilters, setActiveFilters] = useState([]);
  const [classOptions, setClassOptions] = useState([]);
  const [sectionOptions, setSectionOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false); // New loading state for students
  const [error, setError] = useState('');
  const [studentsError, setStudentsError] = useState(''); // New error state for students

  useEffect(() => {
    const fetchClasses = async () => {
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
      // const allClassesOptions = ['All Classes', ...options];
      setClassOptions(options);
      setSectionOptions(uniqueSections);
    }
    fetchClasses();
  }, []);

  // New function to fetch subjects configuration
  const fetchSubjectsConfig = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/subjects`, { 
        headers: getAuthHeaders() 
      });
      
      if (response.data && Array.isArray(response.data)) {
        const subjectsConfigObj = {};
        response.data.forEach(subject => {
          subjectsConfigObj[subject.name] = {
            maxMarks: subject.maxMarks || 100,
            passingMarks: subject.passingMarks || 40
          };
        });
        setSubjectsConfig(subjectsConfigObj);
        console.log('Subjects config loaded:', subjectsConfigObj);
      }
    } catch (err) {
      console.error('Error fetching subjects config:', err);
      // Use default config if fetch fails
      setSubjectsConfig({});
    }
  };

  useEffect(() => {
    // Initialize with empty data - will be populated from API calls
    setStudentsData([]);
    setSubjectsConfig({});
  }, []);

  // Fetch students when component mounts
  useEffect(() => {
    fetchStudents();
    fetchSubjectsConfig(); // Also fetch subjects configuration
  }, []);

  // Fetch results data when filters change
  useEffect(() => {
    if (filterClass && filterExamType) {
      fetchResultsData();
    }
  }, [filterClass, filterSection, filterExamType]);

  // Sync activeReportClass with filterClass
  useEffect(() => {
    if (filterClass) {
      setActiveReportClass(filterClass);
    }
  }, [filterClass]);

  // New function to fetch students
  const fetchStudents = async () => {
    setStudentsLoading(true);
    setStudentsError('');
    
    try {
      const token = JSON.parse(localStorage.getItem('authToken'));
      if (!token) {
        setStudentsError('No authentication token found. Please login again.');
        setStudentsLoading(false);
        return;
      }
      
      const response = await axios.get(`${API_BASE_URL}/api/students`, { 
        headers: getAuthHeaders() 
      });
      
      console.log('Students response:', response);
      
      if (response.data && Array.isArray(response.data)) {
        // Map backend fields to frontend format
        const mappedStudents = response.data.map(s => ({
          id: s._id,
          admissionNo: s.admission_number || '',
          studentId: s.user_id || '',
          name: s.full_name || '',
          rollNumber: s.rollNumber || '',
          section: s.section || '',
          class: s.class_id || '',
          parent: Array.isArray(s.parent_id) && s.parent_id.length > 0 ? s.parent_id.map(p => p._id) : [],
          parentDisplay: Array.isArray(s.parent_id) && s.parent_id.length > 0 
            ? s.parent_id.map(p => `${p.full_name || ''} (${p.user_id || p._id || ''})`).filter(Boolean).join(', ')
            : '',
          status: s.status || '',
          avatar: s.profile_image || '',
          address: s.address || '',
          gender: s.gender || '',
          dateOfBirth: s.date_of_birth ? s.date_of_birth.substring(0, 10) : '',
          studentType: s.student_type || '',
          previousSchoolName: s.previous_school_name || '',
          previousSchoolAddress: s.previous_school_address || '',
          previousSchoolPhoneNumber: s.previous_school_phone_number || '',
          previousSchoolStartDate: s.previous_school_start_date ? s.previous_school_start_date.substring(0, 10) : '',
          previousSchoolEndDate: s.previous_school_end_date ? s.previous_school_end_date.substring(0, 10) : '',
          documents: s.documents || [],
        }));
        setStudents(mappedStudents);
      } else {
        setStudentsError('Invalid response format from server');
        setStudents([]);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
      console.error('Error response:', err.response);
      console.error('Error status:', err.response?.status);
      console.error('Error data:', err.response?.data);
      
      if (err.response?.status === 401) {
        setStudentsError('Authentication failed. Please login again.');
      } else if (err.response?.status === 404) {
        setStudentsError('Students endpoint not found. Please check the backend configuration.');
      } else if (err.response?.status === 500) {
        setStudentsError('Server error. Please try again later.');
      } else if (err.code === 'ECONNREFUSED') {
        setStudentsError('Cannot connect to server. Please check if the backend is running.');
      } else {
        setStudentsError(err.response?.data?.message || `Failed to fetch students: ${err.message}`);
      }
      
      setStudents([]);
    } finally {
      setStudentsLoading(false);
    }
  };

  const fetchResultsData = async () => {
    if (!filterClass || !filterExamType) return;
    
    setLoading(true);
    setError('');
    
    try {
      const token = JSON.parse(localStorage.getItem('authToken'));
      if (!token) {
        setError('No authentication token found. Please login again.');
        setLoading(false);
        return;
      }
      
      console.log('Fetching results with params:', { 
        class: filterClass, 
        section: filterSection || '', 
        examType: filterExamType 
      });
      
      // Build query parameters
      const params = new URLSearchParams();
      params.append('class', filterClass);
      if (filterSection) params.append('section', filterSection);
      params.append('examType', filterExamType);
      
      const response = await axios.get(`${API_BASE_URL}/api/exam-reports/results?${params.toString()}`, { 
        headers: getAuthHeaders() 
      });
      
      console.log('Results response:', response);
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
            console.log('Raw response data:', response.data);
      console.log('Response data type:', typeof response.data);
      console.log('Response data keys:', response.data ? Object.keys(response.data) : 'No data');
      
      // Handle different response formats
      let results = [];
      
      if (response.data && Array.isArray(response.data)) {
        // Direct array format
        results = response.data;
      } else if (response.data && response.data.marks && Array.isArray(response.data.marks)) {
        // Nested marks array format
        results = response.data.marks;
      } else if (response.data && response.data.results && Array.isArray(response.data.results)) {
        // Nested results array format
        results = response.data.results;
      } else if (response.data && typeof response.data === 'object') {
        // Single result object - convert to array
        results = [response.data];
      } else {
        console.error('Unexpected response format:', response.data);
        setError('Invalid response format from server. Please check the API response structure.');
        setStudentsData([]);
        setSubjectsConfig({});
        return;
      }
      
      console.log('Processed results:', results);
      
      // Transform the results to match the expected format
      const transformedResults = results.map(result => ({
        id: result.id || result._id || result.studentId || result.student_id,
        name: result.name || result.studentName || result.full_name || 'Unknown',
        class: result.class || result.classId || result.class_id || 'Unknown',
        section: result.section || result.sectionId || result.section_id || 'Unknown',
        rollNo: result.rollNo || result.rollNumber || result.roll_number || 'Unknown',
        marks: result.marks || result.subjectMarks || result.subject_marks || {},
        examType: result.examType || result.exam_type || filterExamType,
        // Calculate totals if not already present
        totalMarksObtained: result.totalMarksObtained || result.totalMarks || result.total_marks || 0,
        totalMaxMarks: result.totalMaxMarks || result.maxMarks || result.max_marks || 0,
        overallPercentage: result.overallPercentage || result.percentage || result.overall_percentage || 0,
        gradeCategory: result.gradeCategory || result.grade || result.grade_category || 'Poor'
      }));
      
      console.log('Transformed results:', transformedResults);
      console.log('Current subjects config:', subjectsConfig);
      
      // Additional logging for marks data
      console.log('Marks data from response:', results.map(r => ({ id: r.id, marks: r.marks })));
      console.log('Transformed results with marks:', transformedResults.map(r => ({ 
        id: r.id, 
        marks: r.marks, 
        totalMarksObtained: r.totalMarksObtained,
        totalMaxMarks: r.totalMaxMarks 
      })));
      
      setStudentsData(transformedResults);
      
      // Extract subjects from the marks to build subjectsConfig if not already loaded
      if (Object.keys(subjectsConfig).length === 0) {
        const subjects = new Set();
        results.forEach(result => {
          if (result.marks && typeof result.marks === 'object') {
            Object.keys(result.marks).forEach(subject => subjects.add(subject));
          }
        });
        
        console.log('Extracted subjects from marks:', Array.from(subjects));
        
        // Create a basic subjectsConfig (fallback if not loaded from backend)
        const subjectsConfigObj = {};
        Array.from(subjects).forEach(subject => {
          subjectsConfigObj[subject] = {
            maxMarks: 100, // Default max marks
            passingMarks: 40 // Default passing marks
          };
        });
        
        setSubjectsConfig(subjectsConfigObj);
      }
    } catch (err) {
      console.error('Error fetching results:', err);
      console.error('Error response:', err.response);
      console.error('Error status:', err.response?.status);
      console.error('Error data:', err.response?.data);
      
      if (err.response?.status === 401) {
        setError('Authentication failed. Please login again.');
      } else if (err.response?.status === 404) {
        setError('Results not found for the selected criteria.');
      } else if (err.response?.status === 500) {
        setError('Server error. Please try again later.');
      } else if (err.code === 'ECONNREFUSED') {
        setError('Cannot connect to server. Please check if the backend is running.');
      } else {
        setError(err.response?.data?.message || `Failed to fetch results data: ${err.message}`);
      }
      
      setStudentsData([]);
      setSubjectsConfig({});
    } finally {
      setLoading(false);
    }
  };

  const gradeCategories = ['Excellent', 'Good', 'Average', 'Poor'];

  const studentsWithCalculatedResults = useMemo(() => {
    return studentsData.map(student => {
      // Calculate totals from marks
      let totalMarksObtained = 0;
      let totalMaxMarks = 0;
      let subjectsAttempted = 0;
      
      if (student.marks && typeof student.marks === 'object') {
        console.log(`Calculating totals for student ${student.id}:`, student.marks);
        Object.entries(student.marks).forEach(([subject, marks]) => {
          if (marks !== undefined && marks !== null && !isNaN(marks) && parseFloat(marks) >= 0) {
            const subjectConf = subjectsConfig[subject];
            if (subjectConf && subjectConf.maxMarks) {
              totalMarksObtained += parseFloat(marks);
              totalMaxMarks += subjectConf.maxMarks;
              subjectsAttempted++;
              console.log(`Subject ${subject}: marks=${marks}, maxMarks=${subjectConf.maxMarks}, running total=${totalMarksObtained}`);
            } else {
              // If no subject config, assume max marks is 100
              totalMarksObtained += parseFloat(marks);
              totalMaxMarks += 100;
              subjectsAttempted++;
              console.log(`Subject ${subject}: marks=${marks}, maxMarks=100 (default), running total=${totalMarksObtained}`);
            }
          } else {
            console.log(`Subject ${subject}: invalid marks=${marks}`);
          }
        });
        console.log(`Final calculation for student ${student.id}: totalMarksObtained=${totalMarksObtained}, totalMaxMarks=${totalMaxMarks}, subjectsAttempted=${subjectsAttempted}`);
      }
      
      // Use existing calculated values if they exist and are valid, otherwise calculate new ones
      const finalTotalMarksObtained = (student.totalMarksObtained && student.totalMarksObtained > 0) 
        ? student.totalMarksObtained 
        : Math.round(totalMarksObtained * 100) / 100;
      
      const finalTotalMaxMarks = (student.totalMaxMarks && student.totalMaxMarks > 0)
        ? student.totalMaxMarks
        : Math.round(totalMaxMarks * 100) / 100;
      
      const overallPercentage = subjectsAttempted > 0 && finalTotalMaxMarks > 0
        ? (finalTotalMarksObtained / finalTotalMaxMarks) * 100
        : 0;
      
      let gradeCategory = 'Poor';
      if (overallPercentage >= 85) gradeCategory = 'Excellent';
      else if (overallPercentage >= 70) gradeCategory = 'Good';
      else if (overallPercentage >= 50) gradeCategory = 'Average';
      
      return {
        ...student,
        totalMarksObtained: finalTotalMarksObtained,
        totalMaxMarks: finalTotalMaxMarks,
        overallPercentage: parseFloat(overallPercentage.toFixed(2)),
        gradeCategory
      };
    });
  }, [studentsData, subjectsConfig]);

  const filteredStudents = useMemo(() => {
    let filtered = studentsWithCalculatedResults;

    if (!filterClass) {
      setActiveFilters([]);
      return [];
    }
    filtered = filtered.filter(student => student.class === filterClass);
    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.rollNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filterSection) {
      filtered = filtered.filter(student => student.section === filterSection);
    }
         // Filter by exam type
     if (filterExamType) {
       filtered = filtered.filter(student => student.examType === filterExamType);
     }
    if (filterGradeCategory) {
      filtered = filtered.filter(student => student.gradeCategory === filterGradeCategory);
    }

    const filters = [];
    if (searchTerm) filters.push(`Search: "${searchTerm}"`);
    if (filterClass) filters.push(`Class: ${filterClass}`);
    if (filterSection) filters.push(`Section: ${filterSection}`);
    if (filterExamType) filters.push(`Exam: ${filterExamType}`);
    if (filterGradeCategory) filters.push(`Grade: ${filterGradeCategory}`);
    setActiveFilters(filters);

    return filtered;
  }, [studentsWithCalculatedResults, searchTerm, filterClass, filterSection, filterExamType, filterGradeCategory]);

  // Filter students by class and section for display
  const filteredStudentsForDisplay = useMemo(() => {
    let filtered = students;
    
    if (filterClass) {
      filtered = filtered.filter(student => student.class === filterClass);
    }
    
    if (filterSection) {
      filtered = filtered.filter(student => student.section === filterSection);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.rollNumber && student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (student.admissionNo && student.admissionNo.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    return filtered;
  }, [students, filterClass, filterSection, searchTerm]);

  const sortedStudents = useMemo(() => {
    if (!sortConfig.key) return filteredStudents;
    const sortableStudents = [...filteredStudents];
    sortableStudents.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      if ([
        'overallPercentage', 'rollNo', 'totalMarksObtained'
      ].includes(sortConfig.key)) {
        aValue = parseFloat(aValue);
        bValue = parseFloat(bValue);
      } else if (sortConfig.key === 'class') {
        const classNumA = parseInt((aValue || '').replace('Grade ', ''));
        const classNumB = parseInt((bValue || '').replace('Grade ', ''));
        if (classNumA < classNumB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (classNumA > classNumB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      } else if (sortConfig.key === 'gradeCategory') {
        const categoryOrder = { 'Excellent': 4, 'Good': 3, 'Average': 2, 'Poor': 1 };
        const orderA = categoryOrder[aValue] || 0;
        const orderB = categoryOrder[bValue] || 0;
        if (orderA < orderB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (orderA > orderB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      }
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sortableStudents;
  }, [filteredStudents, sortConfig]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? <ChevronUp size={14} className="ml-1 inline" /> : <ChevronDown size={14} className="ml-1 inline" />;
  };

  const allSubjects = useMemo(() => {
    if (!filterClass) return [];
    const classSubjects = new Set();
    studentsWithCalculatedResults
      .filter(student => student.class === filterClass)
      .forEach(student => {
        Object.keys(student.marks).forEach(subject => classSubjects.add(subject));
      });
    return Array.from(classSubjects);
  }, [studentsWithCalculatedResults, filterClass]);

  const getGradeCategoryColor = (category) => {
    switch (category) {
      case 'Excellent':
        return 'bg-green-500 text-white';
      case 'Good':
        return 'bg-blue-500 text-white';
      case 'Average':
        return 'bg-yellow-500 text-white';
      case 'Poor':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-300 text-gray-800';
    }
  };

  const getGradeCategoryIcon = (category) => {
    switch (category) {
      case 'Excellent':
        return <Trophy size={14} className="inline mr-1" />;
      case 'Good':
        return <Star size={14} className="inline mr-1" />;
      case 'Average':
        return <TrendingUp size={14} className="inline mr-1" />;
      case 'Poor':
        return <AlertCircle size={14} className="inline mr-1" />;
      default:
        return null;
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterClass('');
    setFilterSection('');
    setFilterExamType('');
    setFilterGradeCategory('');
    setStudentsData([]);
    setSubjectsConfig({});
    setError('');
  };

  const handleDownloadReport = () => {
    if (sortedStudents.length === 0) {
      const messageBox = document.createElement('div');
      messageBox.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      messageBox.innerHTML = `
        <div class="bg-white p-6 rounded-lg shadow-lg text-center">
          <p class="text-lg font-semibold text-red-800 mb-4">No data to download.</p>
          <button id="closeMessageBox" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">OK</button>
        </div>
      `;
      document.body.appendChild(messageBox);
      document.getElementById('closeMessageBox').onclick = () => {
        document.body.removeChild(messageBox);
      };
      return;
    }

    const headers = [
      "Student ID", "Name", "Class", "Section", "Roll No", "Exam Type", // Added "Exam Type"
      ...allSubjects.map(sub => `${sub} Marks`),
      "Total Marks Obtained", "Total Max Marks", "Overall Percentage", "Grade Category"
    ];

    const rows = sortedStudents.map(student => {
      const studentMarks = allSubjects.map(subject =>
        student.marks[subject] !== undefined ? student.marks[subject] : 'N/A'
      );
      return [
        `"${student.id}"`,
        `"${student.name.replace(/"/g, '""')}"`,
        `"${student.class}"`,
        `"${student.section}"`,
        student.rollNo,
                 `"${student.examType || 'N/A'}"`, // Use actual exam type from student data
        ...studentMarks,
        student.totalMarksObtained,
        student.totalMaxMarks,
        `${student.overallPercentage}%`,
        `"${student.gradeCategory}"`
      ].join(',');
    });

    const csvContent = [
      headers.join(','),
      ...rows
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'student_report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadStudents = () => {
    if (filteredStudentsForDisplay.length === 0) {
      const messageBox = document.createElement('div');
      messageBox.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      messageBox.innerHTML = `
        <div class="bg-white p-6 rounded-lg shadow-lg text-center">
          <p class="text-lg font-semibold text-red-800 mb-4">No students to download.</p>
          <button id="closeMessageBox" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">OK</button>
        </div>
      `;
      document.body.appendChild(messageBox);
      document.getElementById('closeMessageBox').onclick = () => {
        document.body.removeChild(messageBox);
      };
      return;
    }

    const headers = [
      "Student ID", "Admission No", "Name", "Class", "Section", "Roll No", 
      "Status", "Gender", "Date of Birth", "Student Type", "Parents", "Address"
    ];

    const rows = filteredStudentsForDisplay.map(student => {
      return [
        `"${student.studentId || student.id}"`,
        `"${student.admissionNo || ''}"`,
        `"${student.name.replace(/"/g, '""')}"`,
        `"${student.class || ''}"`,
        `"${student.section || ''}"`,
        `"${student.rollNumber || ''}"`,
        `"${student.status || ''}"`,
        `"${student.gender || ''}"`,
        `"${student.dateOfBirth || ''}"`,
        `"${student.studentType || ''}"`,
        `"${student.parentDisplay || ''}"`,
        `"${(student.address || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = [
      headers.join(','),
      ...rows
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'students_list.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 text-white">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">Student Results Dashboard</h2>
            <p className="text-purple-100 text-sm mt-0.5">Performance overview</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-white/10 backdrop-blur-sm rounded-md px-3 py-1 flex items-center">
              <Users size={16} className="mr-1" />
              <span className="text-sm font-medium">{students.length} Students</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-md px-3 py-1 flex items-center">
              <Award size={16} className="mr-1" />
              <span className="text-sm font-medium">{filterClass ? sortedStudents.length : 0} Results</span>
            </div>
            <button
              onClick={handleDownloadReport}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-md px-3 py-1 flex items-center text-sm font-medium transition-colors duration-200"
              title="Download Report as CSV"
            >
              <Download size={16} className="mr-1" />
              Download
            </button>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row flex-wrap items-center gap-4">
          {/* Search Input */}
          <div className="relative flex-grow min-w-[200px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="text-gray-400" size={18} />
            </div>
            <input
              type="text"
              placeholder="Search students by name, roll number, or admission number..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 dark:bg-gray-700 dark:text-white dark:border-gray-600"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

                     {/* Exam Type Dropdown */}
           <div className="relative w-full md:w-auto min-w-[150px]">
             <select
               className="w-full pl-3 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 appearance-none bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600"
               value={filterExamType}
               onChange={(e) => setFilterExamType(e.target.value)}
              //  disabled={!filterClass}
             >
               <option value="">Select Exam Type</option>
               <option value="Formative Assessment 1">Formative Assessment 1</option>
               <option value="Formative Assessment 2">Formative Assessment 2</option>
               <option value="Formative Assessment 3">Formative Assessment 3</option>
               <option value="Summative Assessment 1">Summative Assessment 1</option>
               <option value="Summative Assessment 2">Summative Assessment 2</option>
               <option value="Summative Assessment 3">Summative Assessment 3</option>
             </select>
             <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
           </div>

          {/* Class Dropdown */}
          <div className="relative w-full md:w-auto min-w-[150px]">
            <select
              className="w-full pl-3 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 appearance-none bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600"
              value={filterClass}
              onChange={(e) => {
                setFilterClass(e.target.value);
                setFilterSection('');
                setFilterGradeCategory('');
                setFilterExamType('');
                setSearchTerm('');
              }}
            >
              <option value="">Select Class</option>
              {classOptions.map(cls => (
                <option key={cls} value={cls === 'All Classes' ? '' : cls}>{cls}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
          </div>

          {/* Section Dropdown */}
          <div className="relative w-full md:w-auto min-w-[150px]">
            <select
              className="w-full pl-3 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 appearance-none bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600"
              value={filterSection}
              onChange={(e) => setFilterSection(e.target.value)}
              disabled={!filterClass}
            >
              <option value="">All Sections</option>
              {sectionOptions.map(section => (
                <option key={section} value={section}>{section}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
          </div>

          {/* Grade Dropdown */}
          <div className="relative w-full md:w-auto min-w-[150px]">
            <select
              className="w-full pl-3 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 appearance-none bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600"
              value={filterGradeCategory}
              onChange={(e) => setFilterGradeCategory(e.target.value)}
              disabled={!filterClass}
            >
              <option value="">All Grades</option>
              {gradeCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
          </div>
          {activeFilters.length > 0 && (
            <button
              onClick={clearFilters}
              className="flex items-center text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors duration-300 ml-auto md:ml-0"
            >
              <X size={14} className="mr-1" />
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {filterClass && filterExamType ? (
        <>
          {loading && (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Loading results...</p>
            </div>
          )}
          
          {error && (
            <div className="p-6 text-center">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <AlertCircle className="h-6 w-6 text-red-500 mx-auto mb-2" />
                <p className="text-red-700 dark:text-red-300">{error}</p>
                <button
                  onClick={fetchResultsData}
                  className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-300 text-sm font-medium"
                >
                  Retry
                </button>
              </div>
            </div>
          )}
          
          {!loading && !error && (
            <>
              <div className="overflow-x-auto text-sm max-h-[400px] overflow-y-auto">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                  <tr>
                    <th
                      className="w-56 px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      onClick={() => requestSort('name')}
                    >
                      <div className="flex items-center">
                        <User size={14} className="mr-1" />
                        <span>Name</span>
                        {getSortIcon('name')}
                      </div>
                    </th>
                    <th
                      className="w-32 px-2 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      <div className="flex items-center">
                        <Hash size={14} className="mr-1" />
                        <span>Exam Type</span>
                      </div>
                    </th>
                    <th
                      className="w-20 px-2 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      onClick={() => requestSort('class')}
                    >
                      <div className="flex items-center">
                        <Book size={14} className="mr-0.5" />
                        <span>Class</span>
                        {getSortIcon('class')}
                      </div>
                    </th>
                    <th
                      className="w-16 px-2 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      onClick={() => requestSort('section')}
                    >
                      <div className="flex items-center">
                        <span>Sec</span>
                        {getSortIcon('section')}
                      </div>
                    </th>
                    <th
                      className="w-16 px-2 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      onClick={() => requestSort('rollNo')}
                    >
                      <span>Roll No</span>
                      {getSortIcon('rollNo')}
                    </th>
                    {allSubjects.map(subject => (
                      <th
                        key={subject}
                        className="w-20 px-2 py-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        <div className="flex flex-col items-center">
                          <span className="font-medium truncate">{subject.split(' ')[0]}</span>
                          <span className="text-[0.65rem] text-gray-400">/{subjectsConfig[subject]?.maxMarks || '?'}</span>
                        </div>
                      </th>
                    ))}
                    <th className="w-20 px-2 py-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      <span>Total</span>
                    </th>
                    <th
                      className="w-20 px-2 py-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      onClick={() => requestSort('overallPercentage')}
                    >
                      <div className="flex items-center justify-center">
                        <span>%</span>
                        {getSortIcon('overallPercentage')}
                      </div>
                    </th>
                    <th
                      className="w-20 px-2 py-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      onClick={() => requestSort('gradeCategory')}
                    >
                      <div className="flex items-center justify-center">
                        <Award size={12} className="mr-0.5" />
                        <span>Grade</span>
                        {getSortIcon('gradeCategory')}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {sortedStudents.length > 0 ? (
                    sortedStudents.map(student => (
                      <tr
                        key={student.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
                      >
                        <td className="w-56 px-4 py-2 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                              {(() => {
                                // Find the corresponding student data from the students array
                                const studentData = students.find(s => s.id === student.id || s.studentId === student.id);
                                if (studentData && studentData.avatar) {
                                  return <img className="h-8 w-8 rounded-full object-cover" src={studentData.avatar} alt={student.name} />;
                                }
                                return <User size={14} className="text-purple-600 dark:text-purple-300" />;
                              })()}
                            </div>
                            <div className="ml-3 min-w-0">
                              <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {(() => {
                                  // Find the corresponding student data from the students array
                                  const studentData = students.find(s => s.id === student.id || s.studentId === student.id);
                                  return studentData ? studentData.name : student.name;
                                })()}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                ID: {(() => {
                                  // Find the corresponding student data from the students array
                                  const studentData = students.find(s => s.id === student.id || s.studentId === student.id);
                                  return studentData ? studentData.studentId || studentData.id : student.id;
                                })()}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="w-32 px-2 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                          <span className="px-2 py-1 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 text-xs">
                            {student.examType}
                          </span>
                        </td>
                        <td className="w-20 px-2 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                          {student.class}
                        </td>
                        <td className="w-16 px-2 py-2 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs">
                            {student.section}
                          </span>
                        </td>
                        <td className="w-16 px-2 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {student.rollNo}
                        </td>
                        {allSubjects.map(subject => (
                          <td key={`${student.id}-${subject}`} className="w-20 px-2 py-2 whitespace-nowrap text-center">
                            <div className={`px-2 py-1 rounded-md text-xs font-semibold ${student.marks[subject] !== undefined && student.marks[subject] >= (subjectsConfig[subject]?.passingMarks || 0) ?
                                'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                                'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                              }`}>
                              {student.marks[subject] !== undefined ? student.marks[subject] : 'N/A'}
                            </div>
                          </td>
                        ))}
                        <td className="w-20 px-2 py-2 whitespace-nowrap text-center">
                          <div className="flex flex-col items-center">
                            <span className="text-sm font-bold text-gray-900 dark:text-white">
                              {(() => {
                                // Calculate total marks obtained from student marks
                                let totalMarksObtained = 0;
                                allSubjects.forEach(subject => {
                                  if (student.marks[subject] !== undefined && student.marks[subject] !== null) {
                                    totalMarksObtained += parseFloat(student.marks[subject]) || 0;
                                  }
                                });
                                return totalMarksObtained;
                              })()}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              /{(() => {
                                // Calculate total max marks from all subjects in the table
                                let totalMaxMarks = 0;
                                allSubjects.forEach(subject => {
                                  const subjectConfig = subjectsConfig[subject];
                                  if (subjectConfig && subjectConfig.maxMarks) {
                                    totalMaxMarks += subjectConfig.maxMarks;
                                  } else {
                                    // Default max marks if not configured
                                    totalMaxMarks += 100;
                                  }
                                });
                                return totalMaxMarks;
                              })()}
                            </span>
                          </div>
                        </td>
                        <td className="w-20 px-2 py-2 whitespace-nowrap text-center">
                          <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                            {(() => {
                              // Calculate percentage using the same logic as TOTAL column
                              let totalMarksObtained = 0;
                              let totalMaxMarks = 0;
                              
                              allSubjects.forEach(subject => {
                                if (student.marks[subject] !== undefined && student.marks[subject] !== null) {
                                  totalMarksObtained += parseFloat(student.marks[subject]) || 0;
                                }
                                
                                const subjectConfig = subjectsConfig[subject];
                                if (subjectConfig && subjectConfig.maxMarks) {
                                  totalMaxMarks += subjectConfig.maxMarks;
                                } else {
                                  totalMaxMarks += 100;
                                }
                              });
                              
                              // Calculate percentage
                              const percentage = totalMaxMarks > 0 ? (totalMarksObtained / totalMaxMarks) * 100 : 0;
                              return `${percentage.toFixed(2)}%`;
                            })()}
                          </span>
                        </td>
                        <td className="w-20 px-2 py-2 whitespace-nowrap text-center">
                          <span className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full ${getGradeCategoryColor(student.gradeCategory)}`}>
                            {getGradeCategoryIcon(student.gradeCategory)}
                            {student.gradeCategory}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6 + allSubjects.length} className="px-4 py-12 text-center bg-gray-50 dark:bg-gray-700">
                        <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                          <Search size={48} className="mb-4 text-gray-300 dark:text-gray-600" />
                          <h3 className="text-lg font-medium mb-2">No results found</h3>
                          <p className="max-w-md text-sm">Please try adjusting your search or filter criteria.</p>
                          <button
                            onClick={clearFilters}
                            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-300 text-sm font-medium"
                          >
                            Clear all filters
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {sortedStudents.length > 0 && (
            <div className="bg-gray-100 dark:bg-gray-900 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap justify-between items-center gap-2">
                <div className="text-xs text-gray-600 dark:text-gray-300">
                  Showing <span className="font-semibold">{sortedStudents.length}</span> of <span className="font-semibold">{studentsData.filter(s => s.class === filterClass).length}</span> students
                </div>
                <div className="flex flex-wrap gap-4 text-xs font-medium">
                  <div className="flex items-center">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 mr-1.5"></span>
                    <span>Excellent: {sortedStudents.filter(s => s.gradeCategory === 'Excellent').length}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 mr-1.5"></span>
                    <span>Good: {sortedStudents.filter(s => s.gradeCategory === 'Good').length}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 mr-1.5"></span>
                    <span>Average: {sortedStudents.filter(s => s.gradeCategory === 'Average').length}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 mr-1.5"></span>
                    <span>Poor: {sortedStudents.filter(s => s.gradeCategory === 'Poor').length}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
            </>
          )}
        </>
      ) : (
        <div className="p-16 text-center bg-gray-50 dark:bg-gray-900">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg inline-block max-w-sm">
            <Book size={48} className="text-purple-500 mb-4 mx-auto" />
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Select Class and Exam Type</h3>
            <p className="text-gray-600 dark:text-gray-400">Please choose a class and exam type from the dropdowns to display the student results.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsModule;