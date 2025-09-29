import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import {
  FiCalendar,
  FiBook,
  FiAward,
  FiBell,
  FiClock,
  FiBarChart2,
  FiCheckCircle,
  FiAlertTriangle,
  FiStar,
  FiArrowRight,
  FiTrendingUp,
  FiBookmark,
  FiPieChart,
  FiClipboard,
  FiLayers,
  FiLoader
} from "react-icons/fi";
import axios from "axios";
import { teacherScheduleAPI } from '../../../services/api';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Container, Row, Col, Card, Badge, Button, ProgressBar, Alert, Spinner } from "react-bootstrap";

const StudentPage = () => {
  const userprofileval = JSON.parse(localStorage.getItem('userprofile'));
  const navigate = useNavigate();

  // State for data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [examResults, setExamResults] = useState([]);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [stats, setStats] = useState([]);

  // Access API_BASE_URL from environment variables
  const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'; // Fallback for development
  const API_BASE_URL = `${API_URL}/api`; // Use the base URL for the API endpoint

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token') || JSON.parse(localStorage.getItem('authToken'));
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Fetch student profile
  const fetchStudentProfile = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/students/me`, {
        headers: getAuthHeaders()
      });
      setStudentData(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching student profile:', error);
      throw error;
    }
  };

  // Fetch assignments
  const fetchAssignments = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/assignments`, {
        headers: getAuthHeaders()
      });
      setAssignments(response.data);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  // Fetch attendance data
  const fetchAttendance = async (studentId) => {
    try {
      // const response = await axios.get(`${API_BASE_URL}/student-attendance/student/${studentId}`, {
      //   headers: getAuthHeaders()
      // });
      const token = JSON.parse(localStorage.getItem('authToken'));
      const userId = userprofileval.user_id;
      if (!userId) throw new Error('Student user_id not found. Please log in again.');

      const profileRes = await axios.get(`${API_BASE_URL}/students/by-userid/${userId}`,
        token ? { headers: { Authorization: `Bearer ${token}` } } : {}
      );

      const student = profileRes.data;
      if (!student || !student._id) throw new Error('Student profile not found.');

      const response = await axios.get(`${API_BASE_URL}/student-attendance/student/${student._id}/under-my-admin`,
        token ? { headers: { Authorization: `Bearer ${token}` } } : {}
      );

      setAttendance(response.data);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  // Fetch exam results
  const fetchExamResults = async (studentId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/exam-reports/student/${studentId}`, {
        headers: getAuthHeaders()
      });
      setExamResults(response.data);
    } catch (error) {
      console.error('Error fetching exam results:', error);
    }
  };

  // Fetch today's schedule (placeholder - you may need to implement this endpoint)
  const fetchTodaySchedule = async () => {
    try {
      // This is a placeholder - you may need to create this endpoint
      // const response = await axios.get(`${API_BASE_URL}/timetable/today`, {
      //   headers: getAuthHeaders()
      // });
      const userProfile = JSON.parse(localStorage.getItem('userprofile'));
      const userId = userProfile?.user_id;

      if (!userId) {
        setError('User information not available. Please log in again.');
        setLoading(false);
        return;
      }


      const response = await teacherScheduleAPI.getScheduleByStudentForHomePage(userId);

      setTodaySchedule(response.data);
    } catch (error) {
      console.error('Error fetching today\'s schedule:', error);
      // Fallback to mock data if endpoint doesn't exist
      setTodaySchedule([
        { id: 1, time: "09:00 AM", course: "English", room: "Room 101", type: "lecture" },
        { id: 2, time: "11:30 AM", course: "Maths", room: "Room 205", type: "tutorial" },
        { id: 3, time: "02:00 PM", course: "Science", room: "Lab 1", type: "lab" },
      ]);
    }
  };

  // Calculate attendance statistics
  const calculateAttendanceStats = (attendanceData) => {
    if (!attendanceData || attendanceData.length === 0) {
      return {
        present: 0,
        absent: 0,
        leave: 0,
        total: 0,
        percentage: 0
      };
    }

    const stats = attendanceData.reduce((acc, record) => {
      const status = record.status?.toLowerCase() || 'present';
      acc[status] = (acc[status] || 0) + 1;
      acc.total += 1;
      return acc;
    }, { present: 0, absent: 0, leave: 0, total: 0 });

    stats.percentage = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;
    return stats;
  };

  // Calculate pending assignments
  const getPendingAssignments = () => {
    if (!assignments || assignments.length === 0) return [];

    const today = new Date();
    return assignments
      .filter(assignment => {
        const dueDate = new Date(assignment.dueDate);
        return dueDate >= today && !assignment.submitted;
      })
      .slice(0, 3) // Show only first 3
      .map(assignment => ({
        id: assignment._id,
        course: assignment.subject?.name || 'Unknown Subject',
        title: assignment.title,
        due: new Date(assignment.dueDate).toLocaleDateString(),
        priority: new Date(assignment.dueDate) <= new Date(today.getTime() + 24 * 60 * 60 * 1000) ? 'high' : 'medium'
      }));
  };

  // Calculate performance data
  const getPerformanceData = () => {
    if (!examResults || examResults.length === 0) {
      return [
        { subject: 'English', marks: 85, full: 100 },
        { subject: 'Maths', marks: 78, full: 100 },
        { subject: 'Physics', marks: 92, full: 100 },
        { subject: 'Chemistry', marks: 88, full: 100 },
        { subject: 'Biology', marks: 81, full: 100 },
        { subject: 'Social', marks: 75, full: 100 },
      ];
    }

    // Group by subject and calculate average
    const subjectMarks = examResults.reduce((acc, result) => {
      const subject = result.subject?.name || 'Unknown';
      if (!acc[subject]) {
        acc[subject] = { total: 0, count: 0 };
      }
      acc[subject].total += result.marks || 0;
      acc[subject].count += 1;
      return acc;
    }, {});

    return Object.entries(subjectMarks).map(([subject, data]) => ({
      subject,
      marks: Math.round(data.total / data.count),
      full: 100
    }));
  };

  // Load all data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch student profile first
        const student = await fetchStudentProfile();

        // Fetch other data in parallel
        await Promise.all([
          fetchAssignments(),
          fetchAttendance(student._id),
          fetchExamResults(student._id),
          fetchTodaySchedule()
        ]);

        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load dashboard data. Please try again.');
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Update stats when data changes
  useEffect(() => {
    if (studentData && attendance.length > 0) {
      const attendanceStats = calculateAttendanceStats(attendance);
      const pendingCount = getPendingAssignments().length;

      setStats([
        {
          icon: <FiBarChart2 size={24} />,
          title: "Attendance",
          value: `${attendanceStats.percentage}%`,
          color: "#4e73df",
          trend: attendanceStats.percentage >= 85 ? "up" : "down"
        },
        {
          icon: <FiAward size={24} />,
          title: "Pending Tasks",
          value: pendingCount,
          color: "#f6c23e",
          trend: pendingCount > 0 ? "down" : "up"
        },
        {
          icon: <FiStar size={24} />,
          title: "GPA Score",
          value: studentData.gpa || 3.85,
          color: "#e74a3b",
          trend: "steady"
        },
      ]);
    }
  }, [studentData, attendance, assignments]);

  const handleViewAssignments = () => {
    navigate('assignments');
  };

  const handleViewSchedules = () => {
    navigate('schedules');
  };

  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const todayDate = new Date().toLocaleDateString('en-IN', options);

  // Get attendance data for pie chart
  const getAttendanceData = () => {
    if (!attendance || attendance.length === 0) {
      return [
        { name: 'Present', value: 66, color: '#1cc88a' },
        { name: 'Absent', value: 9, color: '#e74a3b' },
        { name: 'Leave', value: 5, color: '#f6c23e' },
      ];
    }

    const stats = calculateAttendanceStats(attendance);
    return [
      { name: 'Present', value: stats.present, color: '#1cc88a' },
      { name: 'Absent', value: stats.absent, color: '#e74a3b' },
      { name: 'Leave', value: stats.leave, color: '#f6c23e' },
    ];
  };

  const getScoreStatus = (percentage) => {
    if (percentage >= 90) return { text: "Excellent", variant: "success", icon: <FiAward size={16} /> };
    if (percentage >= 75) return { text: "Good", variant: "primary", icon: <FiCheckCircle size={16} /> };
    if (percentage >= 60) return { text: "Average", variant: "warning", icon: <FiAlertTriangle size={16} /> };
    return { text: "Needs Improvement", variant: "danger", icon: <FiBell size={16} /> };
  };

  if (loading) {
    return (
      <Container fluid className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <Spinner animation="border" role="status" className="mb-3">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="text-muted">Loading dashboard data...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container fluid className="px-4 py-5">
        <Alert variant="danger">
          <Alert.Heading>Error Loading Dashboard</Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Alert>
      </Container>
    );
  }

  const pendingAssignments = getPendingAssignments();
  const attendanceData = getAttendanceData();
  const performanceData = getPerformanceData();

  return (
    <Container fluid className="px-0 sm:px-2 md:px-4 lg:p-6 flex flex-col gap-2 sm:gap-4 lg:gap-8">

      {/* Stats Cards - Adjusted for even distribution */}
      <Row className="g-4 mb-4">
        {stats.map((stat, index) => (
          <Col key={index} xs={12} sm={6} md={4}>
            <Card className="h-100 border-0 shadow-sm custom-card-hover">
              <Card.Body className="p-3">
                <div className="d-flex align-items-center">
                  <div className={`p-3 rounded-circle me-3 flex-shrink-0`}
                    style={{ backgroundColor: `${stat.color}20`, color: stat.color }}>
                    {stat.icon}
                  </div>
                  <div>
                    <h6 className="text-gray-600 text-uppercase fw-semibold mb-1" style={{ fontSize: '0.75rem' }}>{stat.title}</h6>
                    <div className="d-flex align-items-center">
                      <h4 className="mb-0 fw-bold text-gray-800 me-2">{stat.value}</h4>
                      {stat.trend === 'up' && <FiTrendingUp size={16} className="text-success" />}
                      {stat.trend === 'down' && <FiTrendingUp size={16} className="text-danger" style={{ transform: 'rotate(180deg)' }} />}
                      {stat.trend === 'steady' && <FiArrowRight size={16} className="text-secondary" style={{ transform: 'rotate(135deg)' }} />}
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Main Content */}
      <Row className="g-4 mb-4">
        {/* Pending Assignments */}
        <Col md={6} lg={4}>
          <Card className="h-100 border-0 shadow-sm custom-card-hover">
            <Card.Body className="d-flex flex-column">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0 fw-bold text-gray-800 d-flex align-items-center">
                  <FiAlertTriangle className="me-2 text-warning" size={18} />
                  Pending Assignments
                </h5>
              </div>

              <div className="list-group list-group-flush flex-grow-1">
                {pendingAssignments.length > 0 ? (
                  pendingAssignments.map((item) => (
                    <div key={item.id} className="list-group-item border-0 px-0 py-3 d-flex align-items-start">
                      <div className={`me-3 rounded-circle d-flex align-items-center justify-content-center flex-shrink-0`}
                        style={{
                          width: '40px',
                          height: '40px',
                          backgroundColor: item.priority === 'high' ? '#e74a3b20' : item.priority === 'medium' ? '#f6c23e20' : '#36b9cc20',
                          color: item.priority === 'high' ? '#e74a3b' : item.priority === 'medium' ? '#f6c23e' : '#36b9cc'
                        }}>
                        <FiBookmark size={16} />
                      </div>
                      <div className="flex-grow-1">
                        <h6 className="mb-1 fw-bold text-gray-800">{item.course}</h6>
                        <p className="text-muted mb-0 small">{item.title}</p>
                      </div>
                      <div className="text-end d-flex flex-column align-items-end">
                        <small className="d-block text-gray-600 fw-semibold">Due: {item.due}</small>
                        <Badge pill bg={item.priority === 'high' ? 'danger' : item.priority === 'medium' ? 'warning' : 'info'}
                          className="px-2 py-1 mt-1" style={{ fontSize: '0.65rem' }}>
                          {item.priority} priority
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted py-4">No pending assignments!</p>
                )}
              </div>

              <Button onClick={handleViewAssignments} variant="link" className="w-100 mt-auto text-decoration-none fw-semibold d-flex align-items-center justify-content-center text-primary pt-3">
                View All Assignments <FiArrowRight size={14} className="ms-1" />
              </Button>
            </Card.Body>
          </Card>
        </Col>

        {/* Today's Schedule */}
        <Col md={6} lg={3}>
          <Card className="h-100 border-0 shadow-sm custom-card-hover">
            <Card.Body className="d-flex flex-column">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0 fw-bold text-gray-800 d-flex align-items-center">
                  <FiCalendar className="me-2 text-primary" size={18} />
                  Today's Schedule
                </h5>
              </div>

              <div className="list-group list-group-flush flex-grow-1">
                {todaySchedule.length > 0 ? (
                  todaySchedule.map((cls) => (
                    <div key={cls.id} className="list-group-item border-0 px-0 py-3 d-flex align-items-start">
                      {/* <div className={`me-3 rounded-circle d-flex align-items-center justify-content-center flex-shrink-0`}
                        style={{
                          width: '40px',
                          height: '40px',
                          backgroundColor: cls.type === 'lecture' ? '#4e73df20' : cls.type === 'lab' ? '#1cc88a20' : '#f6c23e20',
                          color: cls.type === 'lecture' ? '#4e73df' : cls.type === 'lab' ? '#1cc88a' : '#f6c23e'
                        }}>
                        {cls.type === 'lecture' ? <FiBook size={16} /> : cls.type === 'lab' ? <FiAward size={16} /> : <FiClock size={16} />}
                      </div> */}
                      <div className="flex-grow-1">
                        <h6 className="mb-1 fw-bold text-gray-800">{cls.subject}</h6>
                        {/* <p className="text-muted mb-0 small">{cls.room}</p> */}
                      </div>
                      <div className="text-end d-flex flex-column align-items-end">
                        <small className="d-block text-gray-600 fw-semibold">{cls.startTime}</small>
                        {/* <Badge pill bg={cls.type === 'lecture' ? 'primary' : cls.type === 'lab' ? 'success' : 'warning'}
                          className="px-2 py-1 mt-1" style={{ fontSize: '0.65rem' }}>
                          {cls.type}
                        </Badge> */}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted py-4">No classes scheduled for today!</p>
                )}
              </div>

              <Button onClick={handleViewSchedules} variant="link" className="w-100 mt-auto text-decoration-none fw-semibold d-flex align-items-center justify-content-center text-primary pt-3">
                View Full Calendar <FiArrowRight size={14} className="ms-1" />
              </Button>
            </Card.Body>
          </Card>
        </Col>

        {/* Attendance Overview */}
        <Col md={12} lg={5}>
          <Card className="h-100 border-0 shadow-sm custom-card-hover">
            <Card.Body className="d-flex flex-column">
              <h5 className="mb-3 fw-bold text-gray-800 d-flex align-items-center">
                <FiPieChart className="me-2 text-info" size={18} />
                Attendance Overview
              </h5>

              <div className="d-flex align-items-center flex-grow-1 justify-content-center">
                <div style={{ width: '60%', height: '150px', flexShrink: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={attendanceData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                        cornerRadius={5}
                        label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {attendanceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value} days`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="ms-4" style={{ width: '40%' }}>
                  {attendanceData.map((item, index) => (
                    <div key={index} className="mb-2 d-flex align-items-center">
                      <span className="me-2" style={{
                        display: 'inline-block',
                        width: '12px',
                        height: '12px',
                        backgroundColor: item.color,
                        borderRadius: '3px'
                      }}></span>
                      <span className="text-gray-600 small">{item.name}</span>
                      <span className="ms-auto fw-bold text-gray-800">{item.value} days</span>
                    </div>
                  ))}
                  <div className="mt-3 p-3 bg-light rounded shadow-xs">
                    <small className="text-gray-600 d-block mb-1">Overall Attendance:</small>
                    <h4 className="mb-0 fw-bold text-gray-800">
                      {attendanceData.reduce((sum, item) => sum + item.value, 0) > 0
                        ? Math.round((attendanceData.find(item => item.name === 'Present')?.value || 0) /
                          attendanceData.reduce((sum, item) => sum + item.value, 0) * 100) + '%'
                        : '0%'
                      }
                    </h4>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Bottom Row */}
      <Row className="g-4">
        {/* Academic Performance Chart */}
        <Col md={6}>
          <Card className="h-100 border-0 shadow-sm custom-card-hover">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0 fw-bold text-gray-800 d-flex align-items-center">
                  <FiTrendingUp className="me-2 text-success" size={18} />
                  Academic Performance
                </h5>
              </div>

              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={performanceData}
                    margin={{
                      top: 10,
                      right: 30,
                      left: 0,
                      bottom: 0,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                    <XAxis dataKey="subject" axisLine={false} tickLine={false} style={{ fontSize: '0.8rem' }} />
                    <YAxis axisLine={false} tickLine={false} domain={[0, 100]} style={{ fontSize: '0.8rem' }} />
                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} formatter={(value, name) => [`${value} marks`, name === 'marks' ? 'Score' : 'Full Marks']} />
                    <Bar dataKey="marks" fill="#4e73df" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Previous Examination Results */}
        <Col md={6}>
          <Card className="h-100 border-0 shadow-sm custom-card-hover">
            <Card.Body className="d-flex flex-column">
              <h5 className="mb-3 fw-bold text-gray-800 d-flex align-items-center">
                <FiClipboard className="me-2 text-secondary" size={18} />
                Previous Examination Results
              </h5>

              <div>
                {examResults && examResults.length > 0 ? (
                  examResults.slice(0, 6).map((result, index) => {
                    const percentage = result.marks && result.totalMarks ? (result.marks / result.totalMarks) * 100 : 0;
                    const status = getScoreStatus(percentage);

                    return (
                      <div
                        key={result._id || index}
                        className={`d-flex align-items-center py-2 border-bottom border-light`}
                        style={{ transition: 'background-color 0.3s ease' }}
                      >
                        <div className={`me-3 flex-shrink-0 d-flex align-items-center justify-content-center`}
                          style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '50%',
                            backgroundColor: `${status.variant}20`,
                            color: status.variant,
                          }}>
                          {status.icon}
                        </div>
                        <div className="flex-grow-1 me-2">
                          <p className="mb-0 fw-semibold text-gray-800" style={{ fontSize: '0.875rem' }}>
                            {result.subject?.name || 'Unknown Subject'}
                            <span className="text-muted fw-normal" style={{ fontSize: '0.75rem' }}>
                              ({result.exam?.name || 'Exam'})
                            </span>
                          </p>
                          <small className="text-muted d-block" style={{ fontSize: '0.7rem' }}>
                            {result.examDate ? new Date(result.examDate).toLocaleDateString() : 'N/A'}
                          </small>
                        </div>
                        <div className="text-end d-flex flex-column align-items-end">
                          <span className={`fw-bold text-${status.variant}`} style={{ fontSize: '1rem' }}>
                            {result.marks || 0}/{result.totalMarks || 100}
                          </span>
                          <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                            {percentage.toFixed(0)}%
                          </small>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center text-muted py-4">No examination results available.</p>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default StudentPage;