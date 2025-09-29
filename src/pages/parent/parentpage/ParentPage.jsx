import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import {
  FaUser,
  FaBell,
  FaCalendarAlt,
  FaBook,
  FaAward,
  FaChartLine,
  FaChartPie,
  FaClipboardList,
  FaClock,
  FaBookmark,
  FaComments,
  FaRupeeSign,
  FaUsers,
  FaEnvelope,
  FaPhone,
  FaCheckCircle,
  FaArrowRight,
  FaCheck,
  FaTimes,
  FaMinusCircle,
  FaDownload,
  FaSyncAlt,
  FaInfoCircle,
  FaGraduationCap, // Added for examination results icon
  FaExclamationTriangle, // For social science (warning icon)
  FaClipboardCheck // For general subjects
} from "react-icons/fa";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import axios from 'axios';
import { Container, Row, Col, Card, Badge, Button, ProgressBar, ListGroup, Alert, Spinner } from "react-bootstrap";
import 'bootstrap/dist/css/bootstrap.min.css'; // Ensure Bootstrap CSS is imported

const ParentPage = () => {
  const navigate = useNavigate();
  const [selectedChild, setSelectedChild] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [parentData, setParentData] = useState(null);
  const [children, setChildren] = useState([]);
  const [totalPendingFees, setTotalPendingFees] = useState(0);

// Access API_BASE_URL from environment variables
const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'; // Fallback for development
const API_BASE_URL = `${API_URL}/api`; // Use the base URL for the API endpoint

  // Helper function to get authentication headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    // Parse token if it's stored as JSON string
    const authToken = typeof token === 'string' && token.startsWith('"') ? JSON.parse(token) : token;
    
    return {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  };

  // Fetch parent profile and children data
  useEffect(() => {
    const fetchParentData = async () => {
      try {
        setLoading(true);
        const headers = getAuthHeaders();

        const response = await axios.get(`${API_BASE_URL}/parents/me`, {
          headers,
          withCredentials: true
        });

        const { parent, linkedStudents } = response.data;
        setParentData(parent);
        setChildren(linkedStudents || []);

        // Set the first child as selected by default
        if (linkedStudents && linkedStudents.length > 0) {
          setSelectedChild(linkedStudents[0]);
        }

      } catch (err) {
        console.error('Error fetching parent data:', err);
        
        // Handle authentication errors
        if (err.response?.status === 401 || err.response?.status === 403) {
          // Clear invalid tokens and redirect to login
          localStorage.removeItem('authToken');
          localStorage.removeItem('authRole');
          localStorage.removeItem('userprofile');
          navigate('/login');
          return;
        }
        
        setError(err.response?.data?.message || err.message || 'Failed to fetch parent data');
      } finally {
        setLoading(false);
      }
    };

    fetchParentData();
  }, []);

  // Calculate total pending fees whenever children data changes
  useEffect(() => {
    const calculateTotalPendingFees = () => {
      let total = 0;
      children.forEach(child => {
        if (child.fees) {
          child.fees.forEach(fee => {
            if (fee.status === 'pending' || fee.status === 'unpaid') {
              total += parseFloat(fee.amount || 0);
            }
          });
        }
      });
      setTotalPendingFees(total);
    };

    calculateTotalPendingFees();
  }, [children]);

  // Fetch additional data for selected child
  const fetchChildData = async (childId) => {
    try {
      const headers = getAuthHeaders();
      
      // Fetch fees for the child
      const feesResponse = await axios.get(`${API_BASE_URL}/fees/student/${childId}`, {
        headers,
        withCredentials: true
      });

      // Fetch attendance for the child
      const attendanceResponse = await axios.get(`${API_BASE_URL}/student-attendance/student/${childId}`, {
        headers,
        withCredentials: true
      });

      // Fetch marks for the child
      const marksResponse = await axios.get(`${API_BASE_URL}/marks/student/${childId}`, {
        headers,
        withCredentials: true
      });

      // Update the selected child with fetched data
      setSelectedChild(prevChild => ({
        ...prevChild,
        fees: feesResponse.data,
        attendance: attendanceResponse.data,
        marks: marksResponse.data
      }));

    } catch (err) {
      console.error('Error fetching child data:', err);
      // Don't set error state here as it's not critical for the main functionality
    }
  };

  // Fetch child data when a child is selected
  useEffect(() => {
    if (selectedChild && selectedChild._id) {
      fetchChildData(selectedChild._id);
    }
  }, [selectedChild?._id]);

  // Helper function to get data for the currently selected child
  const getChildData = () => {
    if (!selectedChild) {
      return {
        attendanceData: [],
        performanceData: [],
        events: [],
        payments: [],
        examResults: []
      };
    }

    // Transform attendance data for pie chart
    const attendanceData = selectedChild.attendance ? [
      { name: 'Present', value: selectedChild.attendance.filter(a => a.status === 'present').length, color: '#1cc88a' },
      { name: 'Absent', value: selectedChild.attendance.filter(a => a.status === 'absent').length, color: '#e74a3b' },
      { name: 'Late', value: selectedChild.attendance.filter(a => a.status === 'late').length, color: '#f6c23e' }
    ] : [];

    // Transform performance data from marks
    const performanceData = selectedChild.marks ? selectedChild.marks.map(mark => ({
      subject: mark.subject || 'Unknown',
      score: mark.score || 0,
      average: mark.class_average || 75 // Default average if not available
    })) : [];

    // Transform fees to payments
    const payments = selectedChild.fees ? selectedChild.fees.map(fee => ({
      id: fee._id,
      date: new Date(fee.due_date).toLocaleDateString(),
      amount: `₹${fee.amount}`,
      status: fee.status === 'paid' ? 'Paid' : 'Pending',
      isPaid: fee.status === 'paid'
    })) : [];

    // Transform marks to exam results
    const examResults = selectedChild.marks ? selectedChild.marks.map(mark => ({
      id: mark._id,
      subject: mark.subject || 'Unknown',
      type: mark.exam_type || 'Assessment',
      score: mark.score || 0,
      maxScore: mark.max_marks || 100,
      date: new Date(mark.exam_date || mark.createdAt).toLocaleDateString(),
      icon: mark.score >= 90 ? <FaAward className="text-info" /> : 
            mark.score >= 75 ? <FaClipboardCheck /> : 
            <FaExclamationTriangle className="text-warning" />
    })) : [];

    return {
      attendanceData,
      performanceData,
      events: [], // Events will be fetched separately if needed
      payments,
      examResults
    };
  };

  const { attendanceData, performanceData, events, payments, examResults } = getChildData();

  // Dashboard statistics based on selected child's data
  const stats = [
    { 
      icon: <FaChartLine size={24} />, 
      title: "Performance", 
      value: selectedChild && performanceData.length > 0 ? 
        performanceData.reduce((acc, curr) => acc + curr.score, 0) / performanceData.length >= 80 ? "A" :
        performanceData.reduce((acc, curr) => acc + curr.score, 0) / performanceData.length >= 70 ? "B+" :
        performanceData.reduce((acc, curr) => acc + curr.score, 0) / performanceData.length >= 60 ? "B" : "C" : "--", 
      color: "#4e73df", 
      trend: "up" 
    },
    { 
      icon: <FaBook size={24} />, 
      title: "Pending Approvals", 
      value: selectedChild ? (selectedChild.assignments?.filter(a => a.status === 'pending').length || 0) : 0, 
      color: "#f6c23e", 
      trend: "steady" 
    },
    { 
      icon: <FaCalendarAlt size={24} />, 
      title: "Upcoming Events", 
      value: events?.length || 0, 
      color: "#1cc88a" 
    },
    {
      icon: <FaRupeeSign size={24} />,
      title: "Fee Status",
      value: totalPendingFees >= 0 ? `₹${totalPendingFees.toFixed(2)} Due` : "Paid",
      color: totalPendingFees > 0 ? "#e74a3b" : "#36b9cc",
    }
  ];

  // Handler for selecting a different child
  const handleViewChild = (child) => {
    setSelectedChild(child);
  };

  // Handler for navigating to the Events Calendar
  const handleViewCalendar = () => {
    navigate('events');
  };

  // Handler for navigating to the Full Report (Exams page)
  const handleViewFullReport = () => {
    if (selectedChild) {
      navigate('exams');
    }
  };

  // Handler for navigating to the Messages page
  const handleMessageTeacher = () => {
    navigate('messages');
  };

  // Handler for navigating to the Fees page
  const handlePayFees = () => {
    navigate('fee');
  };

  // Handler for navigating to the Profile page
  const handleViewProfile = () => {
    navigate('mychildren');
  };

  // Refresh data function
  const handleRefresh = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const headers = getAuthHeaders();
      const response = await axios.get(`${API_BASE_URL}/parents/me`, {
        headers,
        withCredentials: true
      });

      const { parent, linkedStudents } = response.data;
      setParentData(parent);
      setChildren(linkedStudents || []);

      if (linkedStudents && linkedStudents.length > 0) {
        setSelectedChild(linkedStudents[0]);
      }

    } catch (err) {
      console.error('Error refreshing data:', err);
      setError(err.response?.data?.message || err.message || 'Failed to refresh data');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to determine score color for exam results
  const getScoreColor = (score, maxScore) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 'text-success';
    if (percentage >= 75) return 'text-primary';
    if (percentage >= 60) return 'text-warning';
    return 'text-danger';
  };

  // --- Loading State ---
  if (loading) {
    return (
      <Container fluid className="py-5 bg-light min-vh-100 d-flex justify-content-center align-items-center">
        <div className="text-center">
          <Spinner animation="border" role="status" className="mb-3">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <h5 className="text-muted">Loading your dashboard...</h5>
        </div>
      </Container>
    );
  }

  // --- Error and Empty State Handling ---
  if (error) {
    return (
      <Container fluid className="py-5 bg-light min-vh-100 d-flex justify-content-center align-items-center">
        <Alert variant="danger" className="text-center shadow-lg p-4 rounded-3">
          <h4 className="alert-heading mb-3">
            <FaTimes className="me-2" />Error Loading Dashboard
          </h4>
          <p className="lead">{error}</p>
          <hr />
          <Button variant="primary" onClick={handleRefresh} className="mt-2 me-2">
            <FaSyncAlt className="me-2" />Refresh
          </Button>
          <Button variant="outline-secondary" onClick={() => window.location.reload()} className="mt-2">
            <FaSyncAlt className="me-2" />Reload Page
          </Button>
        </Alert>
      </Container>
    );
  }

  if (!children || children.length === 0) {
    return (
      <Container fluid className="py-5 bg-light min-vh-100 d-flex justify-content-center align-items-center">
        <Alert variant="info" className="text-center shadow-lg p-4 rounded-3">
          <h4 className="alert-heading mb-3">
            <FaInfoCircle className="me-2" />No Children Registered
          </h4>
          <p className="lead">Please contact school administration to register your children.</p>
        </Alert>
      </Container>
    );
  }

  // --- Main Render ---
  return (
    <Container fluid className="px-0 sm:px-2 md:px-4 lg:p-6 flex flex-col gap-2 sm:gap-4 lg:gap-8">

      {/* Children Selector */}
      <Card className="mb-4 border-0 shadow-sm rounded-4">
        <Card.Body className="p-4">
          <Row className="g-3">
            {children.map(child => (
              <Col key={child._id} xs={12} md={6}>
                <Card
                  className={`h-100 border-2 rounded-3 transition-all cursor-pointer ${selectedChild?._id === child._id ? 'border-primary shadow-sm' : 'border-light-subtle'}`}
                  onClick={() => handleViewChild(child)}
                  style={{ cursor: 'pointer' }}
                >
                  <Card.Body className="d-flex align-items-center p-3">
                    <img
                      src={child.profile_image}
                      alt={child.full_name}
                      className="rounded-circle me-3 border border-2 border-light"
                      style={{ width: '70px', height: '70px', objectFit: 'cover' }}
                    />
                    <div className="flex-grow-1">
                      <h6 className="mb-0 fw-bold text-dark">{child.full_name}</h6>
                      <small className="text-muted d-block">
                        {child.class_id?.class_name || 'Class Not Assigned'} 
                        {child.admission_number && ` • Roll No: ${child.admission_number}`}
                      </small>
                      {child.school && <small className="text-muted">{child.school}</small>}
                    </div>
                    {selectedChild?._id === child._id && (
                      <div className="ms-auto text-primary">
                        <FaCheckCircle size={22} />
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Card.Body>
      </Card>

      {/* Selected Child Info - Modernized and integrated */}
      {selectedChild && (
        <Card className="mb-4 border-0 shadow-sm rounded-4 bg-primary-subtle text-primary-emphasis">
          <Card.Body className="p-3 d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center">
              <img
                src={selectedChild.profile_image}
                alt={selectedChild.full_name}
                className="rounded-circle me-3 border border-primary"
                style={{ width: '60px', height: '60px', objectFit: 'cover' }}
              />
              <div>
                <h5 className="mb-0 fw-bold">{selectedChild.full_name}</h5>
                <p className="mb-0 text-dark-emphasis">
                  {selectedChild.class_id?.class_name || 'Class Not Assigned'}
                  {selectedChild.admission_number && ` • Roll No: ${selectedChild.admission_number}`}
                  {selectedChild.school && ` • ${selectedChild.school}`}
                </p>
              </div>
            </div>
            <Button variant="outline-primary" size="sm" className="d-flex align-items-center" onClick={handleViewProfile}>
              View Profile <FaArrowRight className="ms-2" />
            </Button>
          </Card.Body>
        </Card>
      )}

      {/* Stats Cards */}
      <Row className="g-4 mb-4">
        {stats.map((stat, index) => (
          <Col key={index} xs={12} sm={6} md={3}>
            <Card className="h-100 border-0 shadow-sm rounded-4 hover-shadow transition-all">
              <Card.Body className="p-4">
                <div className="d-flex align-items-start">
                  <div className={`p-3 rounded-circle me-3 flex-shrink-0 shadow-sm`}
                    style={{ backgroundColor: `${stat.color}20`, color: stat.color }}>
                    {stat.icon}
                  </div>
                  <div>
                    <h6 className="text-muted text-uppercase fw-semibold mb-1" style={{ fontSize: '0.8rem' }}>
                      {stat.title}
                    </h6>
                    <div className="d-flex align-items-center">
                      <h4 className="mb-0 fw-bold text-dark me-2">{stat.value}</h4>
                      {stat.trend === 'up' && <FaChartLine size={18} className="text-success" />}
                      {stat.trend === 'down' && <FaChartLine size={18} className="text-danger" style={{ transform: 'rotate(180deg)' }} />}
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
        {/* Attendance Pie Chart & Performance */}
        <Col md={12} lg={7}>
          <Card className="h-100 border-0 shadow-sm rounded-4 hover-shadow transition-all">
            <Card.Body className="p-4 d-flex flex-column">
              <h5 className="mb-4 fw-bold d-flex align-items-center text-dark">
                <FaChartPie className="me-2 text-info" size={22} />
                {selectedChild?.full_name}'s Attendance & Performance
              </h5>
              <Row className="flex-grow-1">
                {/* Attendance Pie Chart */}
                <Col lg={7} className="d-flex flex-column align-items-center justify-content-center">
                  {selectedChild && attendanceData && attendanceData.length > 0 ? (
                    <div style={{ width: '80%', height: '200px', flexShrink: 0 }}>
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
                      <p className="text-center text-muted mt-2 fw-semibold">Attendance Overview</p>
                    </div>
                  ) : (
                    <Alert variant="info" className="text-center w-100 mt-3">
                      {selectedChild ? `No attendance data available for ${selectedChild.full_name}.` : "Select a child to view attendance data."}
                    </Alert>
                  )}
                </Col>
                {/* Performance by Subject */}
                <Col lg={5} className="mt-4 mt-lg-0 d-flex flex-column">
                  <h6 className="fw-bold mb-3 text-dark">Performance by Subject</h6>
                  {selectedChild && performanceData && performanceData.length > 0 ? (
                    <>
                      {performanceData.map((subject, index) => (
                        <div key={index} className="mb-3">
                          <div className="d-flex justify-content-between mb-1">
                            <span className="fw-semibold text-dark">{subject.subject}</span>
                            <span className="fw-bold text-primary">{subject.score}%</span>
                          </div>
                          <ProgressBar
                            now={subject.score}
                            max={100}
                            variant={subject.score >= subject.average ? "success" : "warning"}
                            className="rounded-pill"
                            style={{ height: '12px' }}
                          />
                          <small className="text-muted">Class average: {subject.average}%</small>
                        </div>
                      ))}
                      {/* View Full Report Button */}
                      <Button
                        onClick={handleViewFullReport}
                        variant="link"
                        className="w-100 mt-auto text-decoration-none fw-semibold d-flex align-items-center justify-content-center text-primary pt-3 border-top border-light-subtle"
                      >
                        View Full Report <FaArrowRight size={14} className="ms-2" />
                      </Button>
                    </>
                  ) : (
                    <Alert variant="info" className="text-center mt-3">
                      {selectedChild ? `No performance data available for ${selectedChild.full_name}.` : "Select a child to view performance data."}
                    </Alert>
                  )}
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
        {/* Upcoming Events */}
        <Col md={12} lg={5}>
          <Card className="h-100 border-0 shadow-sm rounded-4 hover-shadow transition-all">
            <Card.Body className="d-flex flex-column p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="mb-0 fw-bold d-flex align-items-center text-dark">
                  <FaCalendarAlt className="me-2 text-primary" size={22} />
                  Upcoming Events
                </h5>
                <Badge bg="primary" pill className="fs-6">{events.length}</Badge>
              </div>

              {selectedChild && events && events.length > 0 ? (
                <>
                  <ListGroup variant="flush" className="flex-grow-1 border-0">
                    {events.map(event => (
                      <ListGroup.Item key={event.id} className="border-0 px-0 py-3 d-flex align-items-start event-item">
                        <div className={`me-3 rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 event-icon`}
                          style={{
                            width: '45px',
                            height: '45px',
                            backgroundColor: '#4e73df20',
                            color: '#4e73df'
                          }}>
                          <FaCalendarAlt size={18} />
                        </div>
                        <div className="flex-grow-1">
                          <h6 className="mb-1 fw-bold text-dark">{event.title}</h6>
                          <small className="text-muted d-flex align-items-center">
                            <FaClock className="me-1" size={14} /> {event.date} at {event.time}
                          </small>
                        </div>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>

                  <Button
                    onClick={handleViewCalendar}
                    variant="link"
                    className="w-100 mt-auto text-decoration-none fw-semibold d-flex align-items-center justify-content-center text-primary pt-3 border-top border-light-subtle"
                  >
                    View Full Calendar <FaArrowRight size={14} className="ms-2" />
                  </Button>
                </>
              ) : (
                <Alert variant="info" className="text-center mt-3">
                  {selectedChild ? `No upcoming events for ${selectedChild.full_name}.` : "Select a child to view upcoming events."}
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Bottom Row (Fee Payment History and Quick Actions) */}
      <Row className="g-4">

        {/* Fee Payment History */}
        <Col md={6}>
          <Card className="h-100 border-0 shadow-sm rounded-4 hover-shadow transition-all">
            <Card.Body className="p-4 d-flex flex-column">
              <h5 className="mb-4 fw-bold d-flex align-items-center text-dark">
                <FaRupeeSign className="me-2 text-success" size={22} />
                Fee Payment History
              </h5>

              {selectedChild && payments && payments.length > 0 ? (
                <>
                  <div className="table-responsive flex-grow-1">
                    <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th scope="col" className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.8rem' }}>Date</th>
                          <th scope="col" className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.8rem' }}>Amount</th>
                          <th scope="col" className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.8rem' }}>Status</th>
                          <th scope="col" className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.8rem' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map(payment => (
                          <tr key={payment.id} className="align-middle">
                            <td>{payment.date}</td>
                            <td><span className="fw-bold">{payment.amount}</span></td>
                            <td>
                              <Badge pill bg={payment.isPaid ? "success" : "warning"} className="py-2 px-3 fw-normal">
                                {payment.status}
                              </Badge>
                            </td>
                            <td>
                              {payment.isPaid ? (
                                <Button variant="outline-primary" size="sm" className="d-flex align-items-center rounded-pill py-1 px-3">
                                  <FaDownload className="me-1" size={12} /> Download
                                </Button>
                              ) : (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  className="d-flex align-items-center rounded-pill py-1 px-3"
                                  onClick={handlePayFees}
                                >
                                  <FaRupeeSign className="me-1" size={12} /> Pay Now
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <Button
                    onClick={handlePayFees}
                    variant="primary"
                    className="mt-4 w-100 rounded-pill fw-bold shadow-sm py-3 d-flex align-items-center justify-content-center"
                    style={{
                      transition: 'transform 0.2s ease-in-out',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <FaRupeeSign className="me-2" size={20} />
                    Make New Payment
                  </Button>
                </>
              ) : (
                <Alert variant="info" className="text-center mt-3">
                  {selectedChild ? `No payment history available for ${selectedChild.full_name}.` : "Select a child to view payment history."}
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Quick Actions */}
        <Col md={6}>
          <Card className="h-100 border-0 shadow-sm rounded-4 hover-shadow transition-all">
            <Card.Body className="d-flex flex-column p-4">
              <h5 className="mb-4 fw-bold d-flex align-items-center text-dark">
                <FaBookmark className="me-2 text-warning" size={22} />
                Quick Actions
              </h5>

              <div className="d-grid gap-3">
                <Button
                  variant="outline-primary"
                  className="text-start d-flex align-items-center rounded-pill px-4 py-3 fw-semibold"
                  onClick={handleMessageTeacher}
                >
                  <FaComments className="me-3" size={20} /> Message Teacher
                </Button>
                <Button
                  variant="outline-success"
                  className="text-start d-flex align-items-center rounded-pill px-4 py-3 fw-semibold"
                  onClick={handlePayFees}
                >
                  <FaRupeeSign className="me-3" size={20} /> Pay Fees
                </Button>
                <Button
                  variant="outline-info"
                  className="text-start d-flex align-items-center rounded-pill px-4 py-3 fw-semibold"
                  onClick={handleViewFullReport}
                >
                  <FaBook className="me-3" size={20} /> View Report Cards
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ParentPage;
