// ReportsData.jsx
import { studentMarksAPI, classAPI, studentAPI } from '../../../services/api';

// Constants for Grade Thresholds
export const GOOD_THRESHOLD = 80;
export const AVERAGE_THRESHOLD = 50;
export const EXCELLENT_THRESHOLD = 90;
export const FAIL_THRESHOLD = 30;

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
export const allClasses = [];
export const allSections = [];
export const subjectsConfig = {};
export const students = [];

export const getStudentGradeCategory = (percentage) => {
  if (percentage >= EXCELLENT_THRESHOLD) {
    return 'Excellent';
  } else if (percentage >= GOOD_THRESHOLD) {
    return 'Good';
  } else if (percentage >= AVERAGE_THRESHOLD) {
    return 'Average';
  } else {
    return 'Poor';
  }
};