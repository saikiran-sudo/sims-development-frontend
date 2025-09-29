import axios from 'axios';

// Access API_BASE_URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'; // Fallback for development

// Create axios instance with base configuration
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    let token = localStorage.getItem('authToken');
    
    // Handle case where token might be stored as JSON string
    if (token) {
      try {
        token = JSON.parse(token);
      } catch (e) {
        // Token is not JSON, use as is
      }
    }
    
    // Fallback to 'token' key if 'authToken' is not found
    if (!token) {
      token = localStorage.getItem('token');
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add additional headers for better compatibility
    config.headers['Content-Type'] = 'application/json';
    config.headers['Accept'] = 'application/json';
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
  verifyOTP: (email, otp) => api.post('/auth/verify-otp', { email, otp }),
  resendOTP: (email) => api.post('/auth/resend-otp', { email }),
  logout: () => api.post('/auth/logout'),
};

// User Management API
export const userAPI = {
  getAllUsers: () => api.get('/users'),
  getUserById: (id) => api.get(`/users/${id}`),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/users/${id}`),
};

// Teacher API
export const teacherAPI = {
  getAllTeachers: () => api.get('/teachers'),
  getTeacherById: (id) => api.get(`/teachers/${id}`),
  createTeacher: (teacherData) => api.post('/teachers', teacherData),
  updateTeacher: (id, teacherData) => api.put(`/teachers/${id}`, teacherData),
  deleteTeacher: (id) => api.delete(`/teachers/${id}`),
  getTeacherProfile: () => api.get('/teachers/profile'),
  getTeacherDashboard: () => api.get('/teachers/dashboard'),
  getTeacherCount: () => api.get('/teachers/count'), // Added function for teacher count
  searchTeachers: (query) => api.get('/teachers/search', { params: { query } }),
};

// Student API
export const studentAPI = {
  getAllStudents: () => api.get('/students'),
  getStudentById: (id) => api.get(`/students/${id}`),
  createStudent: (studentData) => api.post('/students', studentData),
  updateStudent: (id, studentData) => api.put(`/students/${id}`, studentData),
  deleteStudent: (id) => api.delete(`/students/${id}`),
  getStudentCount: () => api.get('/students/count'),
  getMyProfile: () => api.get('/students/me'),
  getExamDataForStudent: (studentId) => api.get(`/students/exams/${studentId}`),
  getStudentByUserId: (userId) => api.get(`/students/by-userid/${userId}`),
};

// Parent API
export const parentAPI = {
  getAllParents: () => api.get('/parents'),
  getAllParentsUnderMyAdmin: () => api.get('/parents/under-my-admin'),
  getParentById: (id) => api.get(`/parents/${id}`),
  createParent: (parentData) => api.post('/parents', parentData),
  updateParent: (id, parentData) => api.put(`/parents/${id}`, parentData),
  deleteParent: (id) => api.delete(`/parents/${id}`),
  getMyProfile: () => api.get('/parents/me'),
  getDashboard: () => api.get('/parents/dashboard'),
  getParentCount: () => api.get('/parents/count'),
};

// Admin API
export const adminAPI = {
  getAllAdmins: () => api.get('/admins'),
  getAdminById: (id) => api.get(`/admins/${id}`),
  createAdmin: (adminData) => api.post('/admins', adminData),
  updateAdmin: (id, adminData) => api.put(`/admins/${id}`, adminData),
  deleteAdmin: (id) => api.delete(`/admins/${id}`),
};

// Assignment API
export const assignmentAPI = {
  getAllAssignments: () => api.get('/assignments'),
  getAssignmentById: (id) => api.get(`/assignments/${id}`),
  createAssignment: (assignmentData) => api.post('/assignments', assignmentData),
  updateAssignment: (id, assignmentData) => api.put(`/assignments/${id}`, assignmentData),
  deleteAssignment: (id) => api.delete(`/assignments/${id}`),
};

// Assignment Submission API
export const assignmentSubmissionAPI = {
  getAllSubmissions: () => api.get('/assignment-submissions'),
  getSubmissionById: (id) => api.get(`/assignment-submissions/${id}`),
  createSubmission: (submissionData) => api.post('/assignment-submissions', submissionData),
  updateSubmission: (id, submissionData) => api.put(`/assignment-submissions/${id}`, submissionData),
  deleteSubmission: (id) => api.delete(`/assignment-submissions/${id}`),
  getSubmissionsByAssignment: (assignmentId) => api.get(`/assignment-submissions/assignment/${assignmentId}`),
};

// Class API
export const classAPI = {
  getAllClasses: () => api.get('/classes'),
  getAllClassesUnderMyAdmin: () => api.get('/classes/under-my-admin'),
  getClassById: (id) => api.get(`/classes/${id}`),
  createClass: (classData) => api.post('/classes', classData),
  updateClass: (id, classData) => api.put(`/classes/${id}`, classData),
  getClassNames: () => api.get('/classes/names'),
};

// Subject API
export const subjectAPI = {
  getAllSubjects: () => api.get('/subjects'),
  getSubjectById: (id) => api.get(`/subjects/${id}`),
  createSubject: (subjectData) => api.post('/subjects', subjectData),
  updateSubject: (id, subjectData) => api.put(`/subjects/${id}`, subjectData),
  deleteSubject: (id) => api.delete(`/subjects/${id}`),
};

// Exam API
export const examAPI = {
  getAllExams: () => api.get('/exams'),
  getExamById: (id) => api.get(`/exams/${id}`),
  createExam: (examData) => api.post('/exams', examData),
  updateExam: (id, examData) => api.put(`/exams/${id}`, examData),
  deleteExam: (id) => api.delete(`/exams/${id}`),
};

// Exam Schedule API
export const examScheduleAPI = {
  getAllExamSchedules: () => api.get('/exam-schedule'),
  getExamScheduleById: (id) => api.get(`/exam-schedule/${id}`),
  createExamSchedule: (scheduleData) => api.post('/exam-schedule', scheduleData),
  updateExamSchedule: (id, scheduleData) => api.put(`/exam-schedule/${id}`, scheduleData),
  deleteExamSchedule: (id) => api.delete(`/exam-schedule/${id}`),
};

// Regular Schedule API
export const regularScheduleAPI = {
  getALlRegularSchedules: () => api.get('/teacher/schedules/regular-schedule')
};

// Exam Reports API
export const examReportAPI = {
  getAllExamReports: () => api.get('/exam-reports'),
  getExamReportById: (id) => api.get(`/exam-reports/${id}`),
  createExamReport: (reportData) => api.post('/exam-reports', reportData),
  updateExamReport: (id, reportData) => api.put(`/exam-reports/${id}`, reportData),
  deleteExamReport: (id) => api.delete(`/exam-reports/${id}`),
  getReportsByClass: (classId) => api.get(`/exam-reports/class/${classId}`),
  getReportsByStudent: (studentId) => api.get(`/exam-reports/student/${studentId}`),
  getExamReportOverview: () => api.get('/exam-reports/overview'),
  getAllResults: (filters = {}) => api.get('/exam-reports/results', { params: filters }),
  getSubjectsConfig: () => api.get('/exam-reports/subjects-config'),
  updateSubjectsConfig: (config) => api.put('/exam-reports/subjects-config', config),
};

// Student Marks API
export const studentMarksAPI = {
  getAllMarks: () => api.get('/marks'),
  getMarksById: (id) => api.get(`/marks/${id}`),
  createMarks: (marksData) => api.post('/marks', marksData),
  updateMarks: (id, marksData) => api.put(`/marks/${id}`, marksData),
  deleteMarks: (id) => api.delete(`/marks/${id}`),
  getMarksByStudent: (studentId) => api.get(`/marks/student/${studentId}`),
  getMarksByExam: (examId) => api.get(`/marks/exam/${examId}`),
};

// Attendance API
export const attendanceAPI = {
  // Student Attendance
  getAllStudentAttendance: () => api.get('/student-attendance'),
  getStudentAttendanceById: (id) => api.get(`/student-attendance/${id}`),
  createStudentAttendance: (attendanceData) => api.post('/student-attendance', attendanceData),
  updateStudentAttendance: (id, attendanceData) => api.put(`/student-attendance/${id}`, attendanceData),
  deleteStudentAttendance: (id) => api.delete(`/student-attendance/${id}`),
  getAttendanceByStudent: (studentId) => api.get(`/student-attendance/student/${studentId}/under-my-parent`),
  getMonthlyReport: (studentId, month, year) => api.get('/student-attendance/monthly-report', { params: { studentId, month, year } }),
  getAttendanceByDate: (date) => api.get(`/student-attendance/date/${date}`),
  // BULK endpoints for students
  setBulkStudentAttendance: (date, records) => api.post('/student-attendance/bulk', { date, records }),
  getBulkStudentAttendanceByDate: (date) => api.get('/student-attendance/bulk/date', { params: { date } }),
  
  // Teacher Attendance
  getAllTeacherAttendance: () => api.get('/teacher-attendance'),
  getTeacherAttendanceById: (id) => api.get(`/teacher-attendance/${id}`),
  createTeacherAttendance: (attendanceData) => api.post('/teacher-attendance', attendanceData),
  updateTeacherAttendance: (id, attendanceData) => api.put(`/teacher-attendance/${id}`, attendanceData),
  deleteTeacherAttendance: (id) => api.delete(`/teacher-attendance/${id}`),
  getTeacherAttendanceByTeacher: (teacherId) => api.get(`/teacher-attendance/teacher/${teacherId}`),
  // BULK endpoints for teachers
  setBulkTeacherAttendance: (date, records) => api.post('/teacher-attendance/bulk', { date, records }),
  getBulkTeacherAttendanceByDate: (date) => api.get('/teacher-attendance/bulk/date', { params: { date } }),
};

// Fee API
export const feeAPI = {
  getAllFees: () => api.get('/fees'),
  getFeeById: (id) => api.get(`/fees/${id}`),
  createFee: (feeData) => api.post('/fees', feeData),
  updateFee: (id, feeData) => api.put(`/fees/${id}`, feeData),
  deleteFee: (id) => api.delete(`/fees/${id}`),
  getStudentFees: (studentId) => api.get(`/fees/student/${studentId}`),
  payTermFee: (feeId, paymentData) => api.post(`/fees/${feeId}/pay-term`, paymentData),
};

// Bank API
export const bankAPI = {
  getAllBankDetails: () => api.get('/bank'),
  getBankDetailsById: (id) => api.get(`/bank/${id}`),
  createBankDetails: (bankData) => api.post('/bank', bankData),
  updateBankDetails: (id, bankData) => api.put(`/bank/${id}`, bankData),
  deleteBankDetails: (id) => api.delete(`/bank/${id}`),
};

// Message API
export const messageAPI = {
  getAllMessages: (filters = {}) => api.get('/messages', { params: filters }),
  getMessageById: (id) => api.get(`/messages/${id}`),
  sendOrSaveMessage: (messageData) => api.post('/messages', messageData),
  markAsRead: (id) => api.put(`/messages/${id}/read`),
  deleteMessage: (id) => api.patch(`/messages/${id}/delete`),
  undoDelete: (id) => api.patch(`/messages/${id}/undo`),
  permanentDelete: (id) => api.delete(`/messages/${id}`),
  toggleStar: (id) => api.patch(`/messages/${id}/star`),
  getUsersForMessaging: (params = {}) => api.get('/messages/users', { params }),
};

// Announcement API
export const announcementAPI = {
  getAllAnnouncements: () => api.get('/announcements'),
  getAnnouncementById: (id) => api.get(`/announcements/${id}`),
  createAnnouncement: (announcementData) => api.post('/announcements', announcementData),
  updateAnnouncement: (id, announcementData) => api.put(`/announcements/${id}`, announcementData),
  deleteAnnouncement: (id) => api.delete(`/announcements/${id}`),
};

// Event API
export const eventAPI = {
  getAllEvents: () => api.get('/events'),
  getEventById: (id) => api.get(`/events/${id}`),
  createEvent: (eventData) => api.post('/events', eventData),
  updateEvent: (id, eventData) => api.put(`/events/${id}`, eventData),
  deleteEvent: (id) => api.delete(`/events/${id}`),
};

// Homework API
export const homeworkAPI = {
  getAllHomework: () => api.get('/homework'),
  getHomeworkById: (id) => api.get(`/homework/${id}`),
  createHomework: (homeworkData) => api.post('/homework', homeworkData),
  updateHomework: (id, homeworkData) => api.put(`/homework/${id}`, homeworkData),
  deleteHomework: (id) => api.delete(`/homework/${id}`),
  getHomeworkByTeacher: (teacherId) => api.get(`/homework/teacher/${teacherId}`),
  getHomeworkByClass: (classId) => api.get(`/homework/class/${classId}`),
  getHomeworkByStudent: (studentId) => api.get(`/homework/student/${studentId}`),
};

// Homework Submission API
export const homeworkSubmissionAPI = {
  getAllSubmissions: () => api.get('/homework-submissions'),
  getSubmissionById: (id) => api.get(`/homework-submissions/${id}`),
  createSubmission: (submissionData) => api.post('/homework-submissions', submissionData),
  updateSubmission: (id, submissionData) => api.put(`/homework-submissions/${id}`, submissionData),
  deleteSubmission: (id) => api.delete(`/homework-submissions/${id}`),
  getSubmissionsByHomework: (homeworkId) => api.get(`/homework-submissions/homework/${homeworkId}`),
  getSubmissionsByStudent: (studentId) => api.get(`/homework-submissions/student/${studentId}`),
};

// Library API
export const libraryAPI = {
  // Books
  getAllBooks: () => api.get('/books'),
  getBookById: (id) => api.get(`/books/${id}`),
  createBook: (bookData) => api.post('/books', bookData),
  updateBook: (id, bookData) => api.put(`/books/${id}`, bookData),
  deleteBook: (id) => api.delete(`/books/${id}`),
  
  // Resources
  getAllResources: () => api.get('/resources'),
  getResourceById: (id) => api.get(`/resources/${id}`),
  createResource: (resourceData) => api.post('/resources', resourceData),
  updateResource: (id, resourceData) => api.put(`/resources/${id}`, resourceData),
  deleteResource: (id) => api.delete(`/resources/${id}`),
};

// Timetable API
export const timetableAPI = {
  getAllTimetables: () => api.get('/timetable'),
  getTimetableById: (id) => api.get(`/timetable/${id}`),
  createTimetable: (timetableData) => api.post('/timetable', timetableData),
  updateTimetable: (id, timetableData) => api.put(`/timetable/${id}`, timetableData),
  deleteTimetable: (id) => api.delete(`/timetable/${id}`),
  getTimetableByClass: (classId) => api.get(`/timetable/class/${classId}`),
  getTimetableByTeacher: (teacherId) => api.get(`/timetable/teacher/${teacherId}`),
};

// Teacher Schedule API
export const teacherScheduleAPI = {
  getAllTeacherSchedules: () => api.get('/teacher/schedules'),
  getTeacherScheduleById: (id) => api.get(`/teacher/schedules/${id}`),
  createTeacherSchedule: (scheduleData) => api.post('/teacher/schedules', scheduleData),
  updateTeacherSchedule: (id, scheduleData) => api.put(`/teacher/schedules/${id}`, scheduleData),
  deleteTeacherSchedule: (id) => api.delete(`/teacher/schedules/${id}`),
  getScheduleByTeacher: (teacherId) => api.get(`/teacher/schedules/teacher/${teacherId}`),
  getScheduleByStudent: (studentId) => api.get(`/teacher/schedules/student/${studentId}`),
  getScheduleByStudentForHomePage: (studentId) => api.get(`/teacher/schedules/student/home/${studentId}`),
};

// Report Card API
export const reportCardAPI = {
  getAllReportCards: () => api.get('/report-cards'),
  getReportCardById: (id) => api.get(`/report-cards/${id}`),
  createReportCard: (reportCardData) => api.post('/report-cards', reportCardData),
  updateReportCard: (id, reportCardData) => api.put(`/report-cards/${id}`, reportCardData),
  deleteReportCard: (id) => api.delete(`/report-cards/${id}`),
  getReportCardByStudent: (studentId) => api.get(`/report-cards/student/${studentId}`),
  getReportCardByClass: (classId) => api.get(`/report-cards/class/${classId}`),
};

// Admin Staff API
export const adminStaffAPI = {
  getAllAdminStaff: () => api.get('/admin-staff'),
  getAdminStaffById: (id) => api.get(`/admin-staff/${id}`),
  createAdminStaff: (staffData) => api.post('/admin-staff', staffData),
  updateAdminStaff: (id, staffData) => api.put(`/admin-staff/${id}`, staffData),
  deleteAdminStaff: (id) => api.delete(`/admin-staff/${id}`),
};

// Admin Profile API
export const adminProfileAPI = {
  getOwnProfile: () => api.get('/admin-profile/me'),
  updateProfile: (id, profileData) => api.put(`/admin-profile/${id}`, profileData),
  changePassword: (data) => api.post('/admin-profile/change-password', data),
};

// Diary API
export const diaryAPI = {
  // Homework Diary
  getHomeworkDiary: () => api.get('/diary/homework'),
  createHomeworkDiary: (homeworkData) => api.post('/diary/homework', homeworkData),
  updateHomeworkDiary: (id, homeworkData) => api.put(`/diary/homework/${id}`, homeworkData),
  deleteHomeworkDiary: (id) => api.delete(`/diary/homework/${id}`),
  
  // Personal Diary
  getPersonalDiary: () => api.get('/diary/personal'),
  createPersonalDiary: (personalData) => api.post('/diary/personal', personalData),
  updatePersonalDiary: (id, personalData) => api.put(`/diary/personal/${id}`, personalData),
  deletePersonalDiary: (id) => api.delete(`/diary/personal/${id}`),
};

export default {
  authAPI,
  userAPI,
  teacherAPI,
  studentAPI,
  parentAPI,
  adminAPI,
  assignmentAPI,
  assignmentSubmissionAPI,
  classAPI,
  subjectAPI,
  examAPI,
  examScheduleAPI,
  examReportAPI,
  studentMarksAPI,
  attendanceAPI,
  feeAPI,
  bankAPI,
  messageAPI,
  announcementAPI,
  eventAPI,
  homeworkAPI,
  homeworkSubmissionAPI,
  libraryAPI,
  timetableAPI,
  teacherScheduleAPI,
  reportCardAPI,
  adminStaffAPI,
  adminProfileAPI,
  diaryAPI,
}; 