// ReportsData.jsx
import { examAPI, studentMarksAPI, classAPI, studentAPI } from '../../../services/api';

// Constants for Grade Thresholds
export const GOOD_THRESHOLD = 80;
export const AVERAGE_THRESHOLD = 50;
export const POOR_THRESHOLD = 0; // Keeping this as 0, as percentages below AVERAGE_THRESHOLD will fall here
export const FAIL_THRESHOLD = 30; // New threshold for a more explicit 'Fail' or 'Very Poor' within 'Poor'

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
export const teacherClasses = [];
export const subjectsConfig = {};
export const students = [];


export const getStudentGradeCategory = (percentage) => {
  if (percentage >= GOOD_THRESHOLD) return 'Good';
  // If a specific FAIL_THRESHOLD is desired within 'Poor' for a clearer distinction,
  // you can uncomment and adjust the following line, and potentially the categories.
  if (percentage < FAIL_THRESHOLD) return 'Poor'; // If percentage is below FAIL_THRESHOLD, it's 'Poor' (or 'Fail')
  if (percentage >= AVERAGE_THRESHOLD) return 'Average';
  return 'Poor'; // Any percentage below AVERAGE_THRESHOLD (that isn't already 'Good')
};


// Modify getClassReportData to accept students AND subjectsConfig as parameters
export const getClassReportData = (className, currentStudents, currentSubjectsConfig) => {
  // Use currentStudents instead of the globally imported 'students'
  const classStudents = currentStudents.filter(student => student.class === className);

  // Generate classExams dynamically based on the provided currentSubjectsConfig
  const classExams = Object.keys(currentSubjectsConfig).map(subject => ({
    subject: subject,
    maxMarks: currentSubjectsConfig[subject].maxMarks,
    // You might need other exam properties, add them if necessary
  }));

  const sections = Array.from(new Set(classStudents.map(s => s.section))).sort();
  const subjects = Array.from(new Set(classExams.map(e => e.subject))).sort();

  // Section Summary
  const sectionSummary = sections.map(section => {
    const studentsInSection = classStudents.filter(s => s.section === section);
    let studentsGradedCount = 0;
    let goodCount = 0;
    let averageCount = 0;
    let poorCount = 0;

    studentsInSection.forEach(student => {
      let studentOverallMarks = 0;
      let studentOverallMaxMarks = 0;
      let studentExamsAttempted = 0;

      Object.entries(student.marks).forEach(([subject, marks]) => {
        const exam = classExams.find(e => e.subject === subject);
        if (exam) {
          studentOverallMarks += marks;
          studentOverallMaxMarks += exam.maxMarks;
          studentExamsAttempted++;
        }
      });

      if (studentExamsAttempted > 0) {
        studentsGradedCount++;
        const percentage = (studentOverallMarks / studentOverallMaxMarks) * 100;
        const category = getStudentGradeCategory(percentage);
        if (category === 'Good') goodCount++;
        else if (category === 'Average') averageCount++;
        else poorCount++;
      }
    });

    const totalStudentsConsidered = goodCount + averageCount + poorCount;
    // Recalculate average percentage based on actual counts and thresholds
    const avgPercentage = totalStudentsConsidered > 0 ?
      ((goodCount * 100 + averageCount * 70 + poorCount * 25) / totalStudentsConsidered) : 0; // Using mid-points for illustration

    return {
      section: section,
      totalStudents: studentsInSection.length,
      studentsGraded: studentsGradedCount,
      averagePercentage: avgPercentage.toFixed(2),
      good: goodCount,
      average: averageCount,
      poor: poorCount
    };
  });

  // Subject Performance
  const subjectPerformance = subjects.map(subject => {
    let goodCount = 0;
    let averageCount = 0;
    let poorCount = 0;
    let totalStudentsWithGradesForSubject = 0;

    classStudents.forEach(student => {
      const marks = student.marks[subject];
      const exam = classExams.find(e => e.subject === subject); // Find the exam based on currentSubjectsConfig
      if (marks !== undefined && exam) { // Ensure marks exist and exam config is found
        totalStudentsWithGradesForSubject++;
        const percentage = (marks / exam.maxMarks) * 100;
        const category = getStudentGradeCategory(percentage);
        if (category === 'Good') goodCount++;
        else if (category === 'Average') averageCount++;
        else poorCount++;
      }
    });

    return {
      subject: subject,
      good: goodCount,
      average: averageCount,
      poor: poorCount,
      totalGradedStudents: totalStudentsWithGradesForSubject
    };
  });

  // Overall Class Performance for Pie Chart
  const overallClassGrades = { Good: 0, Average: 0, Poor: 0 };
  let totalStudentsConsideredForOverall = 0;

  classStudents.forEach(student => {
    let studentOverallMarks = 0;
    let studentOverallMaxMarks = 0;
    let studentExamsAttempted = 0;

    Object.entries(student.marks).forEach(([subject, marks]) => {
      const exam = classExams.find(e => e.subject === subject);
      if (exam) {
        studentOverallMarks += marks;
        studentOverallMaxMarks += exam.maxMarks;
        studentExamsAttempted++;
      }
    });

    if (studentExamsAttempted > 0) {
      totalStudentsConsideredForOverall++;
      const percentage = (studentOverallMarks / studentOverallMaxMarks) * 100;
      const category = getStudentGradeCategory(percentage);
      overallClassGrades[category]++;
    }
  });

  const overallClassChartData = [
    { name: 'Good', value: overallClassGrades.Good, color: '#22C55E' },
    { name: 'Average', value: overallClassGrades.Average, color: '#EAB308' },
    { name: 'Poor', value: overallClassGrades.Poor, color: '#EF4444' },
  ].filter(data => data.value > 0);

  return {
    sectionSummary,
    subjectPerformance,
    overallClassChartData,
    totalStudentsConsideredForOverall
  };
};

// We don't export getCompletedExams directly anymore, as exam max marks are dynamic
// based on currentSubjectsConfig.