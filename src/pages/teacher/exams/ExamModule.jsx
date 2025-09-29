// ExamModule.jsx
import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart2, BookA, LayoutList, Edit,
  TrendingUp, TrendingDown, MinusCircle, PieChart, XCircle, GraduationCap, Settings
} from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import TotalMarksModal from './TotalMarksModal';

// Access API_BASE_URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'; // Fallback for development

const getAuthHeaders = () => {
  const token = JSON.parse(localStorage.getItem('authToken'));
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const ExamModule = () => {
  const [activeTab, setActiveTab] = useState('grades');
  const [activeReportClass, setActiveReportClass] = useState('Grade 5');
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [showTotalMarksModal, setShowTotalMarksModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [tempMarks, setTempMarks] = useState({});
  const [selectedExamType, setSelectedExamType] = useState(''); // New state for exam type

  // Backend data states
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [results, setResults] = useState([]); // New state for Result data - always initialize as empty array
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teacherClassInfo, setTeacherClassInfo] = useState(null); // New state for teacher's assigned class

  // Fetch all data on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [overviewRes, subjectsRes, resultsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/exam-reports/overview`, { headers: getAuthHeaders() }),
          axios.get(`${API_BASE_URL}/api/subjects/under-my-admin`, { headers: getAuthHeaders() }),
          axios.get(`${API_BASE_URL}/api/exam-reports/results-under-my-admin?class=${activeReportClass}`, { headers: getAuthHeaders() })
        ]);
        
        
        setStudents(overviewRes.data.students || []);
        setExams(overviewRes.data.exams || []);
        setGrades(overviewRes.data.grades || []);
        
        // Filter subjects based on teacher's class assignment
        let filteredSubjects = subjectsRes.data || [];
        if (overviewRes.data.students && overviewRes.data.students.length > 0) {
          // Get the teacher's assigned class and section from the first student
          const teacherClass = overviewRes.data.students[0].class;
          const teacherSection = overviewRes.data.students[0].section;
          
          
          if (teacherClass && teacherSection) {
            // Filter subjects to only include those for the teacher's assigned class and section
            filteredSubjects = (subjectsRes.data || []).filter(subject => {
              // Check if subject is assigned to the teacher's class and section
              if (subject.className) {
                // Handle different className formats: "Class 1-A", "1A", "Class 1", etc.
                const className = subject.className;
                
                
                // Check for exact match with class-section format
                if (className === `${teacherClass}-${teacherSection}` || 
                    className === `${teacherClass}${teacherSection}`) {
                  return true;
                }
                
                // Check for class name match (without section)
                if (className === teacherClass) {
                  console.log(`✓ Class name match found for "${subject.name}"`);
                  return true;
                }
                
                // Check for partial matches
                if (className.includes(teacherClass) && className.includes(teacherSection)) {
                  console.log(`✓ Partial match found for "${subject.name}"`);
                  return true;
                }
                
                console.log(`✗ No match found for "${subject.name}"`);
              }
              return false;
            });
            
            console.log(`Filtered subjects for ${teacherClass}-${teacherSection}:`, filteredSubjects);
            
            // Set teacher class info
            setTeacherClassInfo({
              class: teacherClass,
              section: teacherSection,
              isClassTeacher: true
            });
            
            // Set the active report class to the teacher's assigned class
            setActiveReportClass(teacherClass);
          }
        }
        
        setSubjects(filteredSubjects);
        
        // Handle different possible response structures
        let resultsData = [];
        if (resultsRes.data) {
          if (Array.isArray(resultsRes.data)) {
            resultsData = resultsRes.data;
          } else if (resultsRes.data.results && Array.isArray(resultsRes.data.results)) {
            resultsData = resultsRes.data.results;
          } else if (resultsRes.data.data && Array.isArray(resultsRes.data.data)) {
            resultsData = resultsRes.data.data;
          }
        }
        console.log('Processed results data:', resultsData);
        setResults(resultsData);
        
        // Set default class if available and teacher is assigned to a specific class
        if (overviewRes.data.students && overviewRes.data.students.length > 0) {
          // If teacher has students from a specific class, use that class
          const availableClasses = [...new Set(overviewRes.data.students.map(s => s.class).filter(Boolean))];
          if (availableClasses.length > 0) {
            // Don't override if we already set it above
            if (!teacherClassInfo) {
              setActiveReportClass(availableClasses[0]);
              // Check if this is a class teacher (only one class available)
              if (availableClasses.length === 1) {
                setTeacherClassInfo({
                  class: availableClasses[0],
                  section: overviewRes.data.students[0].section || '',
                  isClassTeacher: true
                });
              }
            }
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to fetch exam data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []); // Remove activeReportClass dependency to avoid infinite loops

  // Fetch results when exam type changes
  useEffect(() => {
    const fetchResults = async () => {
      if (selectedExamType && activeReportClass) {
        try {
          const resultsRes = await axios.get(
            `${API_BASE_URL}/api/exam-reports/results-under-my-admin?class=${activeReportClass}&examType=${selectedExamType}`, 
            { headers: getAuthHeaders() }
          );
          console.log('Fetch results for exam type - resultsRes.data:', resultsRes.data);
          console.log('Fetch results for exam type - isArray:', Array.isArray(resultsRes.data));
          // Handle different possible response structures
          let resultsData = [];
          if (resultsRes.data) {
            if (Array.isArray(resultsRes.data)) {
              resultsData = resultsRes.data;
            } else if (resultsRes.data.results && Array.isArray(resultsRes.data.results)) {
              resultsData = resultsRes.data.results;
            } else if (resultsRes.data.data && Array.isArray(resultsRes.data.data)) {
              resultsData = resultsRes.data.data;
            }
          }
          console.log('Processed results data for exam type:', resultsData);
          setResults(resultsData);
        } catch (err) {
          console.error('Error fetching results for exam type:', err);
        }
      }
    };
    fetchResults();
  }, [selectedExamType, activeReportClass]);

  // Debug: Monitor results state changes
  useEffect(() => {
    console.log('Results state changed:', results);
    console.log('Results type:', typeof results);
    console.log('Results isArray:', Array.isArray(results));
  }, [results]);

  // Build subjectsConfig from subjects array
  const subjectsConfig = useMemo(() => {
    console.log('Building subjectsConfig from subjects:', subjects);
    const config = {};
    
    if (subjects && Array.isArray(subjects) && subjects.length > 0) {
      subjects.forEach(subj => {
        if (subj.name && subj.name !== 'Mathematics') { // Filter out Mathematics
          config[subj.name] = { 
            maxMarks: subj.maxMarks || 100, 
            passingMarks: subj.passingMarks || 35, 
            _id: subj._id 
          };
        }
      });
    } else {
      // Fallback to default subjects if no subjects are found
      console.warn('No subjects found for teacher, using default subjects config');
      if (teacherClassInfo && teacherClassInfo.isClassTeacher) {
        // For class teachers, show a more specific message
        console.warn(`No subjects found for ${teacherClassInfo.class}-${teacherClassInfo.section}`);
      }
      config['English'] = { maxMarks: 100, passingMarks: 35, _id: 'default' };
      config['Science'] = { maxMarks: 100, passingMarks: 35, _id: 'default' };
      config['History'] = { maxMarks: 100, passingMarks: 35, _id: 'default' };
      config['Geography'] = { maxMarks: 100, passingMarks: 35, _id: 'default' };
    }
    
    console.log('Built subjectsConfig:', config);
    return config;
  }, [subjects, teacherClassInfo]);

  // Helper: get students for current class
  const studentData = useMemo(() => {
    console.log('Filtering students for class:', activeReportClass);
    console.log('All students:', students);
    if (!students || !Array.isArray(students)) {
      console.warn('Students is not an array:', students);
      return [];
    }
    const filtered = students.filter(s => s.class === activeReportClass);
    console.log('Filtered students:', filtered);
    return filtered;
  }, [students, activeReportClass]);

  // Helper: get subjects config for current class (assuming all classes share config)
  const currentSubjectsConfig = subjectsConfig;

  // Helper: get exams for current class
  const currentExams = useMemo(() => {
    if (!exams || !Array.isArray(exams)) {
      console.warn('Exams is not an array:', exams);
      return [];
    }
    return exams.filter(e => e.class === activeReportClass);
  }, [exams, activeReportClass]);

  // Helper: get marks for a student from Result model (by studentId and exam type)
  const getStudentMarks = (studentId) => {
    // Ensure results is an array before calling find
    if (!results || !Array.isArray(results)) {
      console.warn('Results is not an array:', results);
      return {};
    }
    
    // Find result for this specific student and exam type
    const studentResult = results.find(r => {
      // Handle both string and ObjectId comparisons
      const resultStudentId = typeof r.id === 'object' ? r.id.toString() : r.id;
      const targetStudentId = typeof studentId === 'object' ? studentId.toString() : studentId;
      const matchesStudent = resultStudentId === targetStudentId;
      const matchesExamType = !selectedExamType || r.examType === selectedExamType;
      return matchesStudent && matchesExamType;
    });
    
    // Return marks object from Result model, or empty object if not found
    return studentResult ? studentResult.marks || {} : {};
  };

  // Helper: getClassReportData (mimic previous logic, but from Result data)
  const getClassReportData = (className) => {
    // Ensure results is an array before proceeding
    if (!results || !Array.isArray(results)) {
      console.warn('Results is not an array in getClassReportData:', results);
      return { sectionSummary: [], subjectPerformance: [] };
    }
    
    // Section summary: group by section
    const classStudents = students.filter(s => s.class === className);
    const sections = [...new Set(classStudents.map(s => s.section))];
    const sectionSummary = sections.map(section => {
      const sectionStudents = classStudents.filter(s => s.section === section);
      const studentsGraded = sectionStudents.filter(s => {
        const resultStudentId = typeof s.id === 'object' ? s.id.toString() : s.id;
        return results.some(r => {
          const rStudentId = typeof r.id === 'object' ? r.id.toString() : r.id;
          const matchesStudent = rStudentId === resultStudentId;
          const matchesExamType = !selectedExamType || r.examType === selectedExamType;
          return matchesStudent && matchesExamType;
        });
      }).length;
      const totalStudents = sectionStudents.length;
      // Calculate average performance
      let totalPercent = 0;
      let count = 0;
      sectionStudents.forEach(s => {
        const studentResult = results.find(r => {
          const resultStudentId = typeof r.id === 'object' ? r.id.toString() : r.id;
          const targetStudentId = typeof s.id === 'object' ? s.id.toString() : s.id;
          const matchesStudent = resultStudentId === targetStudentId;
          const matchesExamType = !selectedExamType || r.examType === selectedExamType;
          return matchesStudent && matchesExamType;
        });
        if (studentResult && studentResult.marks) {
          let total = 0, max = 0;
          Object.entries(studentResult.marks).forEach(([subject, marks]) => {
            const conf = subjectsConfig[subject];
            if (conf) {
              total += marks;
              max += conf.maxMarks;
            }
          });
          if (max > 0) {
            totalPercent += (total / max) * 100;
            count++;
          }
        }
      });
      const averagePercentage = count > 0 ? (totalPercent / count).toFixed(2) : 0;
      // Count grade categories
      let good = 0, average = 0, poor = 0;
      sectionStudents.forEach(s => {
        const studentResult = results.find(r => {
          const resultStudentId = typeof r.id === 'object' ? r.id.toString() : r.id;
          const targetStudentId = typeof s.id === 'object' ? s.id.toString() : s.id;
          const matchesStudent = resultStudentId === targetStudentId;
          const matchesExamType = !selectedExamType || r.examType === selectedExamType;
          return matchesStudent && matchesExamType;
        });
        if (studentResult && studentResult.marks) {
          let total = 0, max = 0;
          Object.entries(studentResult.marks).forEach(([subject, marks]) => {
            const conf = subjectsConfig[subject];
            if (conf) {
              total += marks;
              max += conf.maxMarks;
            }
          });
          const percent = max > 0 ? (total / max) * 100 : 0;
          if (percent >= 70) good++;
          else if (percent >= 50) average++;
          else poor++;
        }
      });
      return {
        section,
        studentsGraded,
        totalStudents,
        averagePercentage,
        good,
        average,
        poor
      };
    });
    // Subject performance
    const subjectPerformance = Object.keys(subjectsConfig).map(subject => {
      let good = 0, average = 0, poor = 0, totalGradedStudents = 0;
      classStudents.forEach(s => {
        const studentResult = results.find(r => {
          const resultStudentId = typeof r.id === 'object' ? r.id.toString() : r.id;
          const targetStudentId = typeof s.id === 'object' ? s.id.toString() : s.id;
          const matchesStudent = resultStudentId === targetStudentId;
          const matchesExamType = !selectedExamType || r.examType === selectedExamType;
          return matchesStudent && matchesExamType;
        });
        if (studentResult && studentResult.marks && studentResult.marks[subject] !== undefined) {
          totalGradedStudents++;
          const percent = (studentResult.marks[subject] / (subjectsConfig[subject]?.maxMarks || 1)) * 100;
          if (percent >= 70) good++;
          else if (percent >= 50) average++;
          else poor++;
        }
      });
      return { subject, good, average, poor, totalGradedStudents };
    });
    // Overall class chart data
    let excellent = 0, good = 0, average = 0, poor = 0;
    classStudents.forEach(s => {
      const studentResult = results.find(r => {
        const resultStudentId = typeof r.id === 'object' ? r.id.toString() : r.id;
        const targetStudentId = typeof s.id === 'object' ? s.id.toString() : s.id;
        const matchesStudent = resultStudentId === targetStudentId;
        const matchesExamType = !selectedExamType || r.examType === selectedExamType;
        return matchesStudent && matchesExamType;
      });
      if (studentResult && studentResult.marks) {
        let total = 0, max = 0;
        Object.entries(studentResult.marks).forEach(([subject, marks]) => {
          const conf = subjectsConfig[subject];
          if (conf) {
            total += marks;
            max += conf.maxMarks;
          }
        });
        const percent = max > 0 ? (total / max) * 100 : 0;
        if (percent >= 85) excellent++;
        else if (percent >= 70) good++;
        else if (percent >= 50) average++;
        else poor++;
      }
    });
    const overallClassChartData = [
      { name: 'Excellent', value: excellent, color: '#22C55E' },
      { name: 'Good', value: good, color: '#3B82F6' },
      { name: 'Average', value: average, color: '#EAB308' },
      { name: 'Poor', value: poor, color: '#EF4444' }
    ];
    return { sectionSummary, subjectPerformance, overallClassChartData };
  };

  // --- Modal Handlers ---
  const handleEditClick = (student) => {
    setSelectedStudent(student);
    setTempMarks(getStudentMarks(student.id));
    setShowGradeModal(true);
  };

  const handleMarkChange = (subject, value) => {
    const maxMarks = currentSubjectsConfig[subject]?.maxMarks;
    let numericValue = value !== '' ? parseInt(value) : '';
    if (numericValue !== '' && (numericValue < 0 || numericValue > maxMarks)) {
      alert(`Marks for ${subject} must be between 0 and ${maxMarks}.`);
      numericValue = numericValue < 0 ? 0 : maxMarks;
    }
    setTempMarks(prev => ({ ...prev, [subject]: numericValue }));
  };

  const handleSaveGrades = async (e) => {
    e.preventDefault();
    if (!selectedStudent || !selectedExamType) {
      alert('Please select an exam type before saving grades.');
      return;
    }
    try {
      console.log('Saving grades for student:', selectedStudent);
      console.log('Student class:', selectedStudent.class);
      console.log('Exam type:', selectedExamType);
      console.log('Temp marks:', tempMarks);
      
      // Create a result object with all the marks for this student
      const resultData = {
        id: selectedStudent.id,
        name: selectedStudent.name,
        class: selectedStudent.class,
        section: selectedStudent.section,
        rollNo: selectedStudent.rollNo,
        marks: tempMarks,
        examType: selectedExamType // Add exam type to the result data
      };
      
      // Validate that all required fields are present
      if (!resultData.id || !resultData.name || !resultData.class || !resultData.section || !resultData.rollNo || !resultData.examType) {
        alert('Missing required student information. Please try again.');
        return;
      }
      
      // Validate that marks object is not empty
      if (!resultData.marks || Object.keys(resultData.marks).length === 0) {
        alert('No marks entered. Please enter marks for at least one subject.');
        return;
      }
      
      console.log('Sending result data to backend:', resultData);

      // Check if there's already a result for this student and exam type
      const existingResult = results && Array.isArray(results) ? results.find(r => {
        const resultStudentId = typeof r.id === 'object' ? r.id.toString() : r.id;
        const targetStudentId = typeof selectedStudent.id === 'object' ? selectedStudent.id.toString() : selectedStudent.id;
        return resultStudentId === targetStudentId && r.examType === selectedExamType;
      }) : null;

      const authHeaders = getAuthHeaders();
      console.log('Auth headers being sent:', authHeaders);
      
      if (existingResult) {
        // If result exists for the same exam type, update it using PUT
        console.log('Updating existing result for same exam type');
        await axios.put(`${API_BASE_URL}/api/exam-reports/result/${selectedStudent.id}`, resultData, { headers: authHeaders });
      } else {
        // If no result exists for this exam type, create new one using POST
        console.log('Creating new result for different exam type');
        await axios.post(`${API_BASE_URL}/api/exam-reports/result`, resultData, { headers: authHeaders });
      }

      // Refetch results for the specific exam type
      const resultsRes = await axios.get(
        `${API_BASE_URL}/api/exam-reports/results-under-my-admin?class=${activeReportClass}&examType=${selectedExamType}`, 
        { headers: getAuthHeaders() }
      );
      
                // Handle different possible response structures
                let resultsData = [];
                if (resultsRes.data) {
                  if (Array.isArray(resultsRes.data)) {
                    resultsData = resultsRes.data;
                  } else if (resultsRes.data.results && Array.isArray(resultsRes.data.results)) {
                    resultsData = resultsRes.data.results;
                  } else if (resultsRes.data.data && Array.isArray(resultsRes.data.data)) {
                    resultsData = resultsRes.data.data;
                  }
                }
                console.log('Processed results data after save:', resultsData);
                setResults(resultsData);
      setShowGradeModal(false);
      alert('Grades saved successfully!');
    } catch (err) {
      console.error('Error saving grades:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      console.error('Error message:', err.message);
      
      // Show more specific error message
      const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to save grades. Please try again.';
      alert(`Error: ${errorMessage}`);
    }
  };

  // --- Total Marks Modal Handlers ---
  const handleOpenTotalMarksModal = () => {
    setShowTotalMarksModal(true);
  };
  const handleCloseTotalMarksModal = () => {
    setShowTotalMarksModal(false);
  };
  const handleSaveMaxMarks = async (newMaxMarks) => {
    try {
      // For each subject, if maxMarks changed, update via PUT
      await Promise.all(Object.keys(newMaxMarks).map(async (subjectName) => {
        const subj = subjects.find(s => s.name === subjectName);
        if (subj && subj.maxMarks !== newMaxMarks[subjectName]) {
          await axios.put(`${API_BASE_URL}/api/subjects/${subj._id}`, { maxMarks: newMaxMarks[subjectName] }, { headers: getAuthHeaders() });
        }
      }));
      // Refetch subjects
      const subjectsRes = await axios.get(`${API_BASE_URL}/api/subjects/under-my-admin`, { headers: getAuthHeaders() });
      setSubjects(subjectsRes.data || []);
      alert('Max marks updated and saved to backend.');
    } catch (err) {
      alert('Failed to update max marks.');
    }
  };
  // --- End Total Marks Modal Handlers ---

  const PIE_COLORS = ['#22C55E', '#EAB308', '#EF4444'];
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-300 rounded shadow-md">
          <p className="text-sm font-semibold">{`${payload[0].name}: ${payload[0].value} students`}</p>
          <p className="text-xs text-gray-600">{`Percentage: ${(payload[0].percent * 100).toFixed(2)}%`}</p>
        </div>
      );
    }
    return null;
  };

  if (loading) return <div className="p-8 text-center text-lg">Loading exam data...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

  // Ensure results is always an array
  if (!results || !Array.isArray(results)) {
    console.warn('Results is not properly initialized:', results);
    // Don't return here, just log the warning and continue
  }

  return (
    <div className="px-0 sm:px-2 md:px-4 lg:p-6 flex flex-col gap-2 sm:gap-4 lg:gap-8">
      {teacherClassInfo && teacherClassInfo.isClassTeacher && (!subjects || subjects.length === 0) && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2">
            <BookA size={16} className="text-yellow-600" />
            <div>
              <h3 className="text-sm font-semibold text-yellow-800">
                No Subjects Found
              </h3>
              <p className="text-sm text-yellow-700">
                No subjects have been assigned to {teacherClassInfo.class}-{teacherClassInfo.section} yet.
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                Please contact the school administrator to assign subjects to your class, or check if subjects are properly configured in the system.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Exam Type Dropdown */}
      <div className="mb-4 w-full max-w-xs">
        <label htmlFor="examType" className="block text-sm font-medium text-gray-700 mb-1">
          Select Exam Type <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <select
            id="examType"
            className={`w-full pl-3 pr-8 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 appearance-none bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
              selectedExamType ? 'border-green-500' : 'border-gray-300'
            }`}
            onChange={(e) => setSelectedExamType(e.target.value)}
            value={selectedExamType}
          >
            <option value="">Select Exam Type</option>
            <option value="Formative Assessment 1">Formative Assessment 1</option>
            <option value="Formative Assessment 2">Formative Assessment 2</option>
            <option value="Formative Assessment 3">Formative Assessment 3</option>
            <option value="Summative Assessment 1">Summative Assessment 1</option>
            <option value="Summative Assessment 2">Summative Assessment 2</option>
            <option value="Summative Assessment 3">Summative Assessment 3</option>
          </select>
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
            <LayoutList size={16} />
          </span>
        </div>
        {!selectedExamType && (
          <p className="text-sm text-red-500 mt-1">Please select an exam type to view and manage grades</p>
        )}
      </div>
      {/* Header and Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-4 border-b border-gray-200 gap-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center gap-3">
          <LayoutList size={24} className="text-purple-600 sm:w-8 sm:h-8 w-6 h-6" />
          Grades & Reports
        </h1>
        <div className="flex flex-wrap gap-2 sm:gap-4 w-full sm:w-auto">
          {/* Set Exam Marks button - full width on mobile */}
          <button
            onClick={handleOpenTotalMarksModal}
            className="px-4 py-2 sm:px-5 sm:py-2 rounded-lg font-semibold transition-colors duration-200 bg-blue-500 text-white shadow-md hover:bg-blue-600 flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <Settings size={18} className="sm:w-5 sm:h-5 w-4 h-4" />
            <span>Set Exam Marks</span>
          </button>
          {/* Tab buttons - adjust to fit on mobile */}
          <div className="flex gap-2 sm:gap-4 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('grades')}
              className={`px-3 py-1 sm:px-5 sm:py-2 rounded-lg font-semibold transition-colors duration-200 text-sm sm:text-base ${
                activeTab === 'grades'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              } flex-1 sm:flex-none`}
            >
              Student Grades
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-3 py-1 sm:px-5 sm:py-2 rounded-lg font-semibold transition-colors duration-200 text-sm sm:text-base ${
                activeTab === 'reports'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              } flex-1 sm:flex-none`}
            >
              Class Reports
            </button>
          </div>
        </div>
      </div>
      {/* Student Grades Tab Content */}
      {activeTab === 'grades' && (
        <>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {activeReportClass} Student Marks
            {selectedExamType && <span className="text-lg font-normal text-gray-600 ml-2">- {selectedExamType}</span>}
          </h2>
          {!selectedExamType ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-md">
              <BookA size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Exam Type Selected</h3>
              <p className="text-gray-500">Please select an exam type above to view and manage student grades.</p>
            </div>
          ) : !results || !Array.isArray(results) ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-md">
              <BookA size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Loading Results...</h3>
              <p className="text-gray-500">Please wait while we load the exam results.</p>
            </div>
          ) : (
          <div className="overflow-x-auto bg-white rounded-lg shadow-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                  {currentSubjectsConfig && typeof currentSubjectsConfig === 'object' && Object.keys(currentSubjectsConfig).map(subject => (
                    <th key={subject} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{subject}</th>
                  ))}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results && Array.isArray(results) && studentData.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.rollNo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{student.name}</td>
                    {currentSubjectsConfig && typeof currentSubjectsConfig === 'object' && Object.keys(currentSubjectsConfig).map(subject => {
                      const marks = getStudentMarks(student.id)[subject];
                      return (
                        <td key={subject} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {marks !== undefined ? marks : '-'}
                        </td>
                      );
                    })}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <button
                        onClick={() => handleEditClick(student)}
                        className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                      >
                        <Edit size={14} /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </>
      )}
      {/* Reports Tab Content */}
      {activeTab === 'reports' && (
        <>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Class Performance Reports
            {selectedExamType && <span className="text-lg font-normal text-gray-600 ml-2">- {selectedExamType}</span>}
          </h2>
          {!selectedExamType ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-md">
              <PieChart size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Exam Type Selected</h3>
              <p className="text-gray-500">Please select an exam type above to view performance reports.</p>
            </div>
          ) : !results || !Array.isArray(results) ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-md">
              <PieChart size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Loading Results...</h3>
              <p className="text-gray-500">Please wait while we load the exam results.</p>
            </div>
          ) : activeReportClass && (
            <div className="grid grid-cols-1 lg:grid-cols-[57%_43%] gap-8 mt-8">
              {/* Grade 5 Details - 60% width */}
              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <BookA size={22} className="text-orange-600" /> {activeReportClass} Details
                </h3>
                {getClassReportData(activeReportClass).sectionSummary.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-700 mb-3">Section Summary</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Students</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Performance (%)</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-green-600"><TrendingUp size={14} className="inline-block mr-1" />Good</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-yellow-600"><MinusCircle size={14} className="inline-block mr-1" />Average</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-red-600"><TrendingDown size={14} className="inline-block mr-1" />Poor</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {getClassReportData(activeReportClass).sectionSummary.map((summary, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{summary.section}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{summary.studentsGraded} / {summary.totalStudents}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{summary.averagePercentage}%</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{summary.good}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{summary.average}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{summary.poor}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {getClassReportData(activeReportClass).subjectPerformance.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-700 mb-3">Subject Performance</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-green-600"><TrendingUp size={14} className="inline-block mr-1" />Good</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-yellow-600"><MinusCircle size={14} className="inline-block mr-1" />Average</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-red-600"><TrendingDown size={14} className="inline-block mr-1" />Poor</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Graded</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {getClassReportData(activeReportClass).subjectPerformance.map((subj, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{subj.subject}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{subj.good}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{subj.average}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{subj.poor}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{subj.totalGradedStudents}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
              {/* Overall Class Performance - 40% width */}
              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <PieChart size={22} className="text-purple-600" /> Overall Performance ({activeReportClass})
                </h3>
                {getClassReportData(activeReportClass).overallClassChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={getClassReportData(activeReportClass).overallClassChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        label={(entry) => `${entry.name} (${entry.value})`}
                      >
                        {getClassReportData(activeReportClass).overallClassChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-gray-500 py-10">
                    No overall performance data for this class yet.
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
      {/* Grade Edit Modal */}
      {showGradeModal && selectedStudent && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50 overflow-auto">
          <div className="relative bg-white rounded-xl shadow-2xl p-8 w-full max-w-2xl transform transition-all duration-300 scale-100 opacity-100">
            <button
              onClick={() => setShowGradeModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              <XCircle size={24} />
            </button>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-3">
              <GraduationCap className="inline-block mr-2" size={24} />
              Edit Grades for {selectedStudent.name} ({selectedStudent.rollNo})
            </h2>
            <form onSubmit={handleSaveGrades}>
              <div className="overflow-y-auto max-h-96">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Max Marks</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marks Scored</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.keys(currentSubjectsConfig).map(subject => (
                      <tr key={subject}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{subject}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{currentSubjectsConfig[subject].maxMarks}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <input
                            type="number"
                            value={tempMarks[subject] || ''}
                            onChange={(e) => handleMarkChange(subject, e.target.value)}
                            min="0"
                            max={currentSubjectsConfig[subject].maxMarks}
                            className="w-24 px-2 py-1 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end gap-3 mt-6 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setShowGradeModal(false)}
                  className="px-5 py-2 rounded-lg bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition transform hover:scale-105 shadow-md"
                >
                  Save Grades
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Total Marks Modal */}
      {showTotalMarksModal && (
        <TotalMarksModal
          onClose={handleCloseTotalMarksModal}
          onSaveMarks={handleSaveMaxMarks}
          initialSubjectsConfig={currentSubjectsConfig}
        />
      )}
    </div>
  );
};

export default ExamModule;