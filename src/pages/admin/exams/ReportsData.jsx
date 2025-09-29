// ReportsData.jsx
import { examAPI, examReportAPI, studentMarksAPI, classAPI, studentAPI } from '../../../services/api';

// Constants for Grade Thresholds
export const GOOD_THRESHOLD = 80;    // Marks >= 80%
export const AVERAGE_THRESHOLD = 50; // Marks >= 50% and < 80%
export const POOR_THRESHOLD = 0;     // Marks < 50% (assuming marks can't be negative)

/**
 * Fetches all exams from the backend
 * @returns {Promise<Array>} Promise that resolves to array of exams
 */
export const fetchExams = async () => {
  try {
    const response = await examAPI.getAllExams();
    return response.data || [];
  } catch (error) {
    console.error('Error fetching exams:', error);
    return [];
  }
};

/**
 * Fetches all students from the backend
 * @returns {Promise<Array>} Promise that resolves to array of students
 */
export const fetchStudents = async () => {
  try {
    const response = await studentAPI.getAllStudents();
    return response.data || [];
  } catch (error) {
    console.error('Error fetching students:', error);
    return [];
  }
};

/**
 * Fetches all classes from the backend
 * @returns {Promise<Array>} Promise that resolves to array of classes
 */
export const fetchClasses = async () => {
  try {
    const response = await classAPI.getAllClasses();
    return response.data || [];
  } catch (error) {
    console.error('Error fetching classes:', error);
    return [];
  }
};

/**
 * Fetches exam reports by class
 * @param {string} classId - The class ID
 * @returns {Promise<Array>} Promise that resolves to array of exam reports
 */
export const fetchExamReportsByClass = async (classId) => {
  try {
    const response = await examReportAPI.getReportsByClass(classId);
    return response.data || [];
  } catch (error) {
    console.error('Error fetching exam reports by class:', error);
    return [];
  }
};

/**
 * Fetches exam reports by student
 * @param {string} studentId - The student ID
 * @returns {Promise<Array>} Promise that resolves to array of exam reports
 */
export const fetchExamReportsByStudent = async (studentId) => {
  try {
    const response = await examReportAPI.getReportsByStudent(studentId);
    return response.data || [];
  } catch (error) {
    console.error('Error fetching exam reports by student:', error);
    return [];
  }
};

/**
 * Fetches student marks by student
 * @param {string} studentId - The student ID
 * @returns {Promise<Array>} Promise that resolves to array of student marks
 */
export const fetchStudentMarksByStudent = async (studentId) => {
  try {
    const response = await studentMarksAPI.getMarksByStudent(studentId);
    return response.data || [];
  } catch (error) {
    console.error('Error fetching student marks by student:', error);
    return [];
  }
};

/**
 * Fetches student marks by exam
 * @param {string} examId - The exam ID
 * @returns {Promise<Array>} Promise that resolves to array of student marks
 */
export const fetchStudentMarksByExam = async (examId) => {
  try {
    const response = await studentMarksAPI.getMarksByExam(examId);
    return response.data || [];
  } catch (error) {
    console.error('Error fetching student marks by exam:', error);
    return [];
  }
};

// Export empty arrays as defaults for backward compatibility
export const predefinedExams = [];
export const predefinedStudents = [];
export const predefinedStudentGrades = [];