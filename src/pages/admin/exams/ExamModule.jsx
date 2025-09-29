import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import {
  BarChart2, Users, PieChart,
  TrendingUp, TrendingDown, MinusCircle, BookA, LayoutList, Table
} from 'lucide-react';
import { classAPI } from '../../../services/api';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { getAuthHeaders } from '../../../utils/axiosConfig';

// Access API_BASE_URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'; // Fallback for development

const GOOD_THRESHOLD = 75;
const AVERAGE_THRESHOLD = 50;
const POOR_THRESHOLD = 0;

const ExamModule = () => {
  const [activeReportClass, setActiveReportClass] = useState(''); // Will be set after data loads
  const [showCompleteSchoolReport, setShowCompleteSchoolReport] = useState(false);
  const [activeTab, setActiveTab] = useState('reports'); // Add tab state for admin

  const [exams, setExams] = useState([]);
  const [students, setStudents] = useState([]);
  const [studentGrades, setStudentGrades] = useState([]);
  const [results, setResults] = useState([]); // Add results state for class reports
  const [subjects, setSubjects] = useState([]); // Add subjects state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [classOptions, setClassOptions] = useState([]);
  const [sectionOptions, setSectionOptions] = useState([]);


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
      const allClassesOptions = ['All Classes', ...options];
      setClassOptions(allClassesOptions);
      setSectionOptions(uniqueSections);
    }
    fetchClasses();
  }, []);

  // Build subjectsConfig from subjects array
  const subjectsConfig = useMemo(() => {
    console.log('Building subjectsConfig from subjects:', subjects);
    const config = {};
    if (subjects && subjects.length > 0) {
      subjects.forEach(subj => {
        if (subj.name) {
          config[subj.name] = {
            maxMarks: subj.maxMarks || 100,
            passingMarks: subj.passingMarks || 35,
            _id: subj._id
          };
        }
      });
    }
    console.log('Built subjectsConfig:', config);
    return config;
  }, [subjects]);

  // Get available classes from actual student data
  // const availableClasses = useMemo(() => {
  //   const classes = Array.from(new Set(students.map(s => s.class).filter(Boolean)));
  //   return classes.sort((a, b) => {
  //     // Sort classes logically (Nursery, LKG, UKG, Class 1, Class 2, etc.)
  //     const classOrder = {
  //       'Nursery': 0, 'LKG': 1, 'UKG': 2,
  //       'Class 1': 3, 'Class 2': 4, 'Class 3': 5, 'Class 4': 6, 'Class 5': 7,
  //       'Class 6': 8, 'Class 7': 9, 'Class 8': 10, 'Class 9': 11, 'Class 10': 12
  //     };
  //     return (classOrder[a] || 999) - (classOrder[b] || 999);
  //   });
  // }, [students]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch data from backend API using axios
        const [overviewRes, subjectsRes, resultsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/exam-reports/overview`, {
            headers: getAuthHeaders()
          }),
          axios.get(`${API_BASE_URL}/api/subjects`, {
            headers: getAuthHeaders()
          }),
          axios.get(`${API_BASE_URL}/api/exam-reports/results`, {
            headers: getAuthHeaders()
          })
        ]);

        console.log('Overview response:', overviewRes.data);
        console.log('Subjects response:', subjectsRes.data);
        console.log('Results response:', resultsRes.data);

        // Check if students array is empty and log more details
        if (!overviewRes.data.students || overviewRes.data.students.length === 0) {
          console.warn('⚠️ No students found in the response!');
          console.log('Full overview response:', JSON.stringify(overviewRes.data, null, 2));
        }

        setExams(overviewRes.data.exams || []);
        setStudents(overviewRes.data.students || []);
        setStudentGrades(overviewRes.data.grades || []);
        setSubjects(subjectsRes.data || []);
        
        // Fix: Handle the nested results structure from backend
        const resultsData = resultsRes.data?.results || resultsRes.data || [];
        setResults(resultsData);
        
        console.log('Processed data:', {
          exams: overviewRes.data.exams?.length || 0,
          students: overviewRes.data.students?.length || 0,
          grades: overviewRes.data.grades?.length || 0,
          subjects: subjectsRes.data?.length || 0,
          results: resultsData.length
        });
      } catch (err) {
        console.error('❌ Failed to fetch exam report data:', err);
        console.error('Error response:', err.response?.data);
        console.error('Error status:', err.response?.status);
        console.error('Error message:', err.message);
        setError(err.response?.data?.message || err.message || 'Failed to fetch exam report data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Set default active class when students data loads
  useEffect(() => {
    if (students.length > 0 && !activeReportClass) {
      const firstClass = classOptions.filter(option => option !== 'All Classes')[0];
      if (firstClass) {
        setActiveReportClass(firstClass);
      }
    }
  }, [students, classOptions, activeReportClass]);





  // Helper: get students for current class
  const studentData = useMemo(() => {
    console.log('Filtering students for class:', activeReportClass);
    console.log('All students:', students);
    const filtered = students.filter(s => s.class === activeReportClass);
    console.log('Filtered students:', filtered);
    return filtered;
  }, [students, activeReportClass]);

  // Helper: get subjects config for current class (assuming all classes share config)
  const currentSubjectsConfig = subjectsConfig;

  // Helper: get exams for current class
  const currentExams = useMemo(() => {
    return exams.filter(e => e.class === activeReportClass);
  }, [exams, activeReportClass]);

  // Helper: get marks for a student from Result model (by studentId)
  const getStudentMarks = (studentId) => {
    console.log('Getting marks for student:', studentId);
    console.log('All results:', results);

    // Find result for this specific student
    const studentResult = results.find(r => {
      // Handle both string and ObjectId comparisons
      const resultStudentId = typeof r.id === 'object' ? r.id.toString() : r.id;
      const targetStudentId = typeof studentId === 'object' ? studentId.toString() : studentId;
      return resultStudentId === targetStudentId;
    });

    console.log('Student result:', studentResult);

    // Return marks object from Result model, or empty object if not found
    return studentResult ? studentResult.marks || {} : {};
  };

  // --- Report Calculations (Memoized for performance) ---

  const getStudentGradeCategory = useCallback((percentage) => {
    if (percentage >= GOOD_THRESHOLD) return 'Good';
    if (percentage >= AVERAGE_THRESHOLD) return 'Average';
    return 'Poor';
  }, []);

  const getCompletedExams = useMemo(() => {
    return exams.filter(exam => exam.status === 'Completed');
  }, [exams]);

  // Calculate reports for a specific class (enhanced version using results data)
  const getClassReportData = useCallback((className) => {
    console.log(`Calculating report for class: ${className}`);
    console.log('All students:', students);
    console.log('All results:', results);

    if (!className || !students || !results) {
      console.log('Missing required data for class report');
      return {
        sectionSummary: [],
        subjectPerformance: [],
        overallClassChartData: [],
        totalStudentsConsideredForOverall: 0
      };
    }

    // const classStudents = students.filter(student => student.class === className);
    const classStudents = results.filter(result => result.class === className);
    console.log(`Students in ${className}:`, classStudents);

    // Handle both array and object results structure
    const resultsArray = Array.isArray(results) ? results : (results.results || []);
    console.log(`Results for ${className}:`, resultsArray);

    if (classStudents.length === 0) {
      console.log(`No students found for class: ${className}`);
      return {
        sectionSummary: [],
        subjectPerformance: [],
        overallClassChartData: [],
        totalStudentsConsideredForOverall: 0
      };
    }

    const sections = Array.from(new Set(classStudents.map(s => s.section))).sort();

    // Section Summary
    const sectionSummary = sections.map(section => {
      const studentsInSection = classStudents.filter(s => s.section === section);
      const studentsGraded = studentsInSection.filter(s => {
        const resultStudentId = typeof s.id === 'object' ? s.id.toString() : s.id;
        return resultsArray.some(r => {
          const rStudentId = typeof r.id === 'object' ? r.id.toString() : r.id;
          return rStudentId === resultStudentId;
        });
      }).length;
      const totalStudents = studentsInSection.length;

      // Calculate average performance
      let totalPercent = 0;
      let count = 0;
      let good = 0, average = 0, poor = 0;

      studentsInSection.forEach(s => {
        const studentResult = resultsArray.find(r => {
          const resultStudentId = typeof r.id === 'object' ? r.id.toString() : r.id;
          const targetStudentId = typeof s.id === 'object' ? s.id.toString() : s.id;
          return resultStudentId === targetStudentId;
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
            const percent = (total / max) * 100;
            totalPercent += percent;
            count++;

            // Categorize student performance
            if (percent >= 75) good++;
            else if (percent >= 50) average++;
            else poor++;
          }
        }
      });

      const averagePercentage = count > 0 ? (totalPercent / count).toFixed(2) : 0;

      return {
        section,
        studentsGraded,
        totalStudents,
        averagePercentage,
        good,
        average,
        poor
      };
    }).filter(s => s.totalStudents > 0);

    // Subject Performance
    const subjectPerformance = Object.keys(subjectsConfig).map(subject => {
      let good = 0, average = 0, poor = 0, totalGradedStudents = 0;
      classStudents.forEach(s => {
        const studentResult = resultsArray.find(r => {
          const resultStudentId = typeof r.id === 'object' ? r.id.toString() : r.id;
          const targetStudentId = typeof s.id === 'object' ? s.id.toString() : s.id;
          return resultStudentId === targetStudentId;
        });
        if (studentResult && studentResult.marks && studentResult.marks[subject] !== undefined) {
          totalGradedStudents++;
          const percent = (studentResult.marks[subject] / (subjectsConfig[subject]?.maxMarks || 1)) * 100;
          if (percent >= 75) good++;
          else if (percent >= 50) average++;
          else poor++;
        }
      });
      return { subject, good, average, poor, totalGradedStudents };
    }).filter(s => s.totalGradedStudents > 0);

    // Overall Class Performance for Pie Chart
    let excellent = 0, good = 0, average = 0, poor = 0;
    let totalStudentsConsideredForOverall = 0;

    classStudents.forEach(s => {
      const studentResult = resultsArray.find(r => {
        const resultStudentId = typeof r.id === 'object' ? r.id.toString() : r.id;
        const targetStudentId = typeof s.id === 'object' ? s.id.toString() : s.id;
        return resultStudentId === targetStudentId;
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
        if (percent > 0) {
          totalStudentsConsideredForOverall++;
          if (percent >= 85) excellent++;
          else if (percent >= 75) good++;
          else if (percent >= 50) average++;
          else poor++;
        }
      }
    });

    const overallClassChartData = [
      { name: 'Excellent', value: excellent, color: '#22C55E' },
      { name: 'Good', value: good, color: '#3B82F6' },
      { name: 'Average', value: average, color: '#EAB308' },
      { name: 'Poor', value: poor, color: '#EF4444' }
    ].filter(data => data.value > 0);

    const reportData = {
      sectionSummary,
      subjectPerformance,
      overallClassChartData,
      totalStudentsConsideredForOverall
    };

    console.log(`Class report data for ${className}:`, reportData);
    return reportData;
  }, [students, results, subjectsConfig]);

  const currentClassReport = useMemo(() => {
    if (!activeReportClass) return null;
    const report = getClassReportData(activeReportClass);
    console.log(`Class report for ${activeReportClass}:`, report);
    return report;
  }, [activeReportClass, getClassReportData]);


  // Calculate Complete School Report
  const completeSchoolReportData = useMemo(() => {
    const schoolOverallGrades = { Excellent: 0, Good: 0, Average: 0, Poor: 0 };
    let totalStudentsConsidered = 0;

    const studentsAccountedFor = new Set();

    // Use results data instead of studentGrades for consistency
    results.forEach(result => {
      if (!studentsAccountedFor.has(result.id)) {
        studentsAccountedFor.add(result.id);
        
        let totalMarks = 0;
        let totalMaxMarks = 0;
        let subjectsAttempted = 0;

        // Calculate total marks from the result's marks object
        if (result.marks && typeof result.marks === 'object') {
          Object.entries(result.marks).forEach(([subject, marks]) => {
            const conf = subjectsConfig[subject];
            if (conf && marks !== undefined && marks !== null) {
              totalMarks += marks;
              totalMaxMarks += conf.maxMarks;
              subjectsAttempted++;
            }
          });
        }

        if (subjectsAttempted > 0 && totalMaxMarks > 0) {
          const percentage = (totalMarks / totalMaxMarks) * 100;
          
          // Categorize student performance
          if (percentage >= 85) schoolOverallGrades.Excellent++;
          else if (percentage >= 75) schoolOverallGrades.Good++;
          else if (percentage >= 50) schoolOverallGrades.Average++;
          else schoolOverallGrades.Poor++;
          
          totalStudentsConsidered++;
        }
      }
    });

    const chartData = [
      { name: 'Excellent', value: schoolOverallGrades.Excellent, color: '#10B981' },
      { name: 'Good', value: schoolOverallGrades.Good, color: '#22C55E' },
      { name: 'Average', value: schoolOverallGrades.Average, color: '#EAB308' },
      { name: 'Poor', value: schoolOverallGrades.Poor, color: '#EF4444' },
    ].filter(data => data.value > 0);

    return {
      chartData: chartData,
      totalStudentsConsidered: totalStudentsConsidered
    };
  }, [results, subjectsConfig]);


  // Chart colors (defined once, consistent)
  const PIE_COLORS = ['#22C55E', '#EAB308', '#EF4444'];

  // Render Custom Tooltip for Recharts Pie Chart
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-md">
          <p className="text-sm font-semibold text-gray-800">{`${payload[0].name}: ${payload[0].value} students`}</p>
          <p className="text-xs text-gray-600">{`Percentage: ${(payload[0].percent * 100).toFixed(2)}%`}</p>
        </div>
      );
    }
    return null;
  };


  return (
    <div className="px-0 sm:px-2 md:px-4 lg:p-6 flex flex-col gap-2 sm:gap-4 lg:gap-8">
      {/* Header and Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-4 border-b border-gray-200 gap-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center gap-3">
          <LayoutList size={24} className="text-purple-600 sm:w-8 sm:h-8 w-6 h-6" />
          Exams Performance Reports
        </h1>
        <div className="flex flex-wrap gap-2 sm:gap-4 w-full sm:w-auto">
          {/* Tab buttons - adjust to fit on mobile */}
          <div className="flex gap-2 sm:gap-4 w-full sm:w-auto">
            <button
              onClick={() => {
                setActiveTab('reports');
                const firstClass = classOptions.filter(option => option !== 'All Classes')[0];
                setActiveReportClass(firstClass);
                setShowCompleteSchoolReport(false);
              }}
              className={`px-3 py-1 sm:px-5 sm:py-2 rounded-lg font-semibold transition-colors duration-200 text-sm sm:text-base ${activeTab === 'reports' && !showCompleteSchoolReport
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                } flex-1 sm:flex-none`}
            >
              Class Reports
            </button>
            <button
              onClick={() => {
                setActiveTab('complete');
                setActiveReportClass(null);
                setShowCompleteSchoolReport(true);
              }}
              className={`px-3 py-1 sm:px-5 sm:py-2 rounded-lg font-semibold transition-colors duration-200 text-sm sm:text-base ${activeTab === 'complete' && showCompleteSchoolReport
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                } flex-1 sm:flex-none`}
            >
              Complete Report
            </button>

          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-20">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading exam data...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading exam data</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* --- Class Reports Section --- */}
      {!loading && !error && activeTab === 'reports' && !showCompleteSchoolReport && (
        <>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Class Performance Reports</h2>

          {/* Class Selection Buttons */}
          <div className="flex flex-wrap gap-2 sm:gap-3 border-b border-gray-200 mb-8 pb-3 -mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto no-scrollbar">
            {classOptions.filter(option => option !== 'All Classes').map(cls => (
              <button
                key={cls}
                onClick={() => setActiveReportClass(cls)}
                className={`flex-shrink-0 px-4 py-2 text-sm font-medium focus:outline-none transition-all duration-200 rounded-lg whitespace-nowrap
                    ${activeReportClass === cls
                    ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700 transform hover:-translate-y-0.5'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {cls}
              </button>
            ))}
          </div>

          {activeReportClass && (
            <div className="grid grid-cols-1 lg:grid-cols-[57%_43%] gap-8 mt-8">
              {/* Class Details - 60% width */}
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
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{summary.studentsGraded} / 5{/*{summary.totalStudents}*/}</td>
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

      {/* --- Complete School Report Section --- */}
      {!loading && !error && activeTab === 'complete' && showCompleteSchoolReport && (
        <div className="grid grid-cols-1 mt-8">
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Users size={24} className="text-indigo-600" /> Complete School Performance Overview
            </h3>
            {completeSchoolReportData.totalStudentsConsidered > 0 && completeSchoolReportData.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <RechartsPieChart>
                  <Pie
                    data={completeSchoolReportData.chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    fill="#8884d8"
                    labelLine={false} // Hide label lines for cleaner look
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} // Display name and percentage
                  >
                    {completeSchoolReportData.chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-gray-500 py-10">No overall school performance data available yet. Ensure exams are 'Completed' and grades are recorded across classes.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamModule;
