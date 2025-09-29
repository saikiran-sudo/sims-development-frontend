// LeaveModule.jsx
import React, { useState, useEffect } from 'react';
import {
    Calendar,
    Send,
    ListTodo,
    ChevronDown,
    ChevronUp,
    PlusCircle,
    XCircle,
    CheckCircle,
    BookOpen, // For Leave Type (like a book for rules/policy)
    User, // For Child name
    Paperclip, // For Attachments
    Loader2 // For loading states
} from 'lucide-react';
import axios from 'axios';

// The variable name must be prefixed with VITE_ for Vite to expose it to the client-side.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const LeaveModule = () => {
    const [children, setChildren] = useState([]);
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showRequestForm, setShowRequestForm] = useState(false);

    const [newRequest, setNewRequest] = useState({
        childId: '', // Can be a specific childId or 'all'
        leaveType: '',
        startDate: '',
        endDate: '', // Now optional
        reason: '', // Added reason field as required by backend
        attachment: null, // For file upload simulation
    });

    // Helper function to get auth headers
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

    // Fetch parent's children data
    useEffect(() => {
        const fetchChildrenData = async () => {
            try {
                setLoading(true);
                setError(null);
                
                // Get parent profile with linked students
                const response = await axios.get(`${API_BASE_URL}/api/parents/me`, {
                    headers: getAuthHeaders(),
                });
                
                const { linkedStudents } = response.data;
                
                // Transform students data to match the expected format
                const childrenData = linkedStudents.map(student => ({
                    id: student._id,
                    user_id: student.user_id,
                    name: student.full_name,
                    class: student.class_id?.class_name || student.class_id || 'N/A',
                    section: student.section || 'N/A',
                    admissionNumber: student.admission_number,
                }));
                
                setChildren(childrenData);
                
                // Fetch leave requests for all children
                await fetchLeaveRequests(childrenData);
                
            } catch (err) {
                console.error('Error fetching children data:', err);
                setError('Failed to load children data. Please try again.');
                
                // Handle authentication errors
                if (err.response?.status === 401 || err.response?.status === 403) {
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('authRole');
                    localStorage.removeItem('userprofile');
                    window.location.href = '/login';
                    return;
                }
            } finally {
                setLoading(false);
            }
        };

        fetchChildrenData();
    }, []);

    // Fetch leave requests for children
    const fetchLeaveRequests = async (childrenData) => {
        try {
            // Use the parent-specific endpoint for better performance
            const response = await axios.get(`${API_BASE_URL}/api/leaves/parent/children/under-my-parent`, {
                headers: getAuthHeaders(),
            });
            
            // Transform leave data to match frontend format
            const transformedLeaves = response.data.map(leave => ({
                id: leave._id,
                childId: leave.user_id,
                // childName: leave.studentInfo ? leave.studentInfo.name : 'Unknown',?
                childName: leave.applicantName,
                leaveType: leave.leave_type,
                startDate: new Date(leave.start_date).toISOString().split('T')[0],
                endDate: new Date(leave.end_date).toISOString().split('T')[0],
                status: leave.status,
                teacherComment: leave.adminComment || '',
                requestedAt: leave.requestedAt || leave.createdAt,
                reason: leave.reason,
                documentUrl: leave.document_url,
            }));
            
            setLeaveRequests(transformedLeaves);
            
        } catch (err) {
            console.error('Error fetching leave requests:', err);
            setError('Failed to load leave requests. Please try again.');
        }
    };

    const handleInputChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'attachment' && files) {
            setNewRequest(prev => ({ ...prev, [name]: files[0] }));
        } else {
            setNewRequest(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmitRequest = async (e) => {
        e.preventDefault();

        // Basic validation for common fields
        const { childId, leaveType, startDate, endDate, reason } = newRequest;
        if (!childId || !leaveType || !startDate || !reason) {
            alert('Please fill in all required fields: Child, Leave Type, Start Date, and Reason.');
            return;
        }

        // Handle optional end date: if not provided, set it to be the same as startDate
        const finalEndDate = endDate || startDate;

        if (new Date(startDate) > new Date(finalEndDate)) {
            alert('End Date cannot be before Start Date.');
            return;
        }

        let childrenToProcess = [];
        if (newRequest.childId === 'all') {
            childrenToProcess = children; // Apply to all children
            if (childrenToProcess.length === 0) {
                alert('No children available to apply leave to.');
                return;
            }
        } else {
            const selectedChild = children.find(c => c.id === newRequest.childId);
            if (!selectedChild) {
                alert('Selected child not found.');
                return;
            }
            childrenToProcess = [selectedChild]; // Apply to a single selected child
        }

        setSubmitting(true);

        try {
            // Create leave requests for each child
            const leavePromises = childrenToProcess.map(async (child) => {
                const leaveData = {
                    user_id: child.user_id,
                    leave_type: newRequest.leaveType,
                    start_date: newRequest.startDate,
                    end_date: finalEndDate,
                    reason: newRequest.reason,
                    applicantName: child.name,
                    // Note: File upload would need to be handled separately with FormData
                    // For now, we'll skip file upload
                };

                const response = await axios.post(`${API_BASE_URL}/api/leaves/parent`, leaveData, {
                    headers: getAuthHeaders(),
                });

                return response.data;
            });

            const newLeaves = await Promise.all(leavePromises);

            // Transform and add new leaves to the list
            const transformedNewLeaves = newLeaves.map(leave => {
                const child = childrenToProcess.find(c => c.id === leave.user_id);
                return {
                    id: leave._id,
                    childId: leave.user_id,
                    childName: child ? child.name : 'Unknown',
                    leaveType: leave.leave_type,
                    startDate: new Date(leave.start_date).toISOString().split('T')[0],
                    endDate: new Date(leave.end_date).toISOString().split('T')[0],
                    status: leave.status,
                    teacherComment: leave.adminComment || '',
                    requestedAt: leave.requestedAt || leave.createdAt,
                    reason: leave.reason,
                    documentUrl: leave.document_url,
                };
            });

            setLeaveRequests(prev => [...transformedNewLeaves, ...prev]);
            alert(`Leave request${newLeaves.length > 1 ? 's' : ''} submitted successfully!`);

            // Reset form and hide it
            setNewRequest({
                childId: '',
                leaveType: '',
                startDate: '',
                endDate: '',
                reason: '',
                attachment: null,
            });
            setShowRequestForm(false);

        } catch (err) {
            console.error('Error submitting leave request:', err);
            alert('Failed to submit leave request. Please try again.');
            
            // Handle authentication errors
            if (err.response?.status === 401 || err.response?.status === 403) {
                localStorage.removeItem('authToken');
                localStorage.removeItem('authRole');
                localStorage.removeItem('userprofile');
                window.location.href = '/login';
                return;
            }
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusColorClass = (status) => {
        switch (status) {
            case 'Pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'Approved':
                return 'bg-green-100 text-green-800';
            case 'Rejected':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <div className="px-0 sm:px-2 md:px-4 lg:p-6 flex flex-col gap-2 sm:gap-4 lg:gap-8">
                <div className="flex justify-center items-center h-64">
                    <div className="flex items-center gap-3 text-gray-600">
                        <Loader2 size={24} className="animate-spin" />
                        <span>Loading leave requests...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="px-0 sm:px-2 md:px-4 lg:p-6 flex flex-col gap-2 sm:gap-4 lg:gap-8">
                <div className="flex justify-center items-center h-64">
                    <div className="text-red-500 text-lg">{error}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="px-0 sm:px-2 md:px-4 lg:p-6 flex flex-col gap-2 sm:gap-4 lg:gap-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4">
                <h1 className="text-3xl font-extrabold text-gray-900 flex items-center mb-4 sm:mb-0">
                    <Calendar className="mr-3 text-blue-600" size={32} /> Leave Requests
                </h1>
            </div>

            {/* Raise New Leave Request Section */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md mb-6">
                <button
                    onClick={() => setShowRequestForm(!showRequestForm)}
                    className="w-full flex justify-between items-center text-lg font-semibold text-gray-800 py-3 px-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition duration-200"
                >
                    <span className="flex items-center">
                        <PlusCircle size={20} className="mr-3 text-blue-600" />
                        Raise New Leave Request
                    </span>
                    {showRequestForm ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>

                {showRequestForm && (
                    <form onSubmit={handleSubmitRequest} className="mt-4 border-t pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label htmlFor="childId" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                    <User size={16} className="mr-2 text-gray-500" /> Child
                                </label>
                                <select
                                    id="childId"
                                    name="childId"
                                    value={newRequest.childId}
                                    onChange={handleInputChange}
                                    className="w-full border border-gray-300 rounded-lg p-2.5 text-base focus:ring-blue-500 focus:border-blue-500"
                                    required
                                >
                                    <option value="">Select Child</option>
                                    <option value="all">All Children</option>
                                    {children.map(child => (
                                        <option key={child.id} value={child.id}>
                                            {child.name} ({child.user_id}-{child.class}-{child.section})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="leaveType" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                    <BookOpen size={16} className="mr-2 text-gray-500" /> Leave Type
                                </label>
                                <select
                                    id="leaveType"
                                    name="leaveType"
                                    value={newRequest.leaveType}
                                    onChange={handleInputChange}
                                    className="w-full border border-gray-300 rounded-lg p-2.5 text-base focus:ring-blue-500 focus:border-blue-500"
                                    required
                                >
                                    <option value="">Select Type</option>
                                    <option value="Sick Leave">Sick Leave</option>
                                    <option value="Casual Leave">Casual Leave</option>
                                    <option value="Earned Leave">Earned Leave</option>
                                    <option value="Maternity/Paternity Leave">Maternity/Paternity Leave</option>
                                    <option value="Sabbatical">Sabbatical</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                    <Calendar size={16} className="mr-2 text-gray-500" /> Start Date
                                </label>
                                <input
                                    type="date"
                                    id="startDate"
                                    name="startDate"
                                    value={newRequest.startDate}
                                    onChange={handleInputChange}
                                    className="w-full border border-gray-300 rounded-lg p-2.5 text-base focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                    <Calendar size={16} className="mr-2 text-gray-500" /> End Date (Optional)
                                </label>
                                <input
                                    type="date"
                                    id="endDate"
                                    name="endDate"
                                    value={newRequest.endDate}
                                    onChange={handleInputChange}
                                    className="w-full border border-gray-300 rounded-lg p-2.5 text-base focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                        
                        {/* Reason field */}
                        <div className="mb-4">
                            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                                Reason for Leave *
                            </label>
                            <textarea
                                id="reason"
                                name="reason"
                                value={newRequest.reason}
                                onChange={handleInputChange}
                                rows={3}
                                className="w-full border border-gray-300 rounded-lg p-2.5 text-base focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Please provide a detailed reason for the leave request..."
                                required
                            />
                        </div>

                        <div className="mb-6">
                            <label htmlFor="attachment" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                <Paperclip size={16} className="mr-2 text-gray-500" /> Attachment (Optional)
                            </label>
                            <input
                                type="file"
                                id="attachment"
                                name="attachment"
                                onChange={handleInputChange}
                                className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                            />
                            {newRequest.attachment && (
                                <p className="mt-2 text-sm text-gray-500">Selected: {newRequest.attachment.name}</p>
                            )}
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setNewRequest({
                                        childId: '', leaveType: '', startDate: '', endDate: '', reason: '', attachment: null,
                                    });
                                    setShowRequestForm(false);
                                }}
                                className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-semibold flex items-center hover:bg-gray-300 transition duration-200"
                                disabled={submitting}
                            >
                                <XCircle size={20} className="mr-2" /> Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-semibold flex items-center hover:bg-blue-700 shadow-md transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 size={20} className="mr-2 animate-spin" /> Submitting...
                                    </>
                                ) : (
                                    <>
                                        <Send size={20} className="mr-2" /> Submit Request
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* My Leave Requests Section */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-4 border-b">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-800 flex items-center">
                        <ListTodo size={20} className="mr-3 text-gray-600" /> My Leave Requests
                    </h2>
                </div>

                {leaveRequests.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        No leave requests submitted yet.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider sm:px-6 sm:py-3">
                                        Child Name
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider sm:px-6 sm:py-3">
                                        Leave Type
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider sm:px-6 sm:py-3">
                                        Duration
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider sm:px-6 sm:py-3">
                                        Reason
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider sm:px-6 sm:py-3">
                                        Teacher's Comment
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider sm:px-6 sm:py-3">
                                        Status
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider sm:px-6 sm:py-3">
                                        Requested On
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {leaveRequests.map(request => (
                                    <tr key={request.id} className="hover:bg-gray-50 transition duration-150">
                                        <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900 sm:px-6 sm:py-4 sm:text-sm">
                                            {request.childName} ({request.childId})
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-800 sm:px-6 sm:py-4 sm:text-sm">
                                            {request.leaveType}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600 sm:px-6 sm:py-4 sm:text-sm">
                                            {request.startDate} {request.endDate && request.startDate !== request.endDate ? `to ${request.endDate}` : ''}
                                        </td>
                                        <td className="px-3 py-2 text-xs text-gray-600 sm:px-6 sm:py-4 sm:text-sm max-w-xs overflow-hidden text-ellipsis">
                                            {request.reason || 'N/A'}
                                        </td>
                                        <td className="px-3 py-2 text-xs text-gray-600 sm:px-6 sm:py-4 sm:text-sm max-w-xs overflow-hidden text-ellipsis">
                                            {request.teacherComment || 'N/A'}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap sm:px-6 sm:py-4">
                                            <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColorClass(request.status)}`}>
                                                {request.status}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600 sm:px-6 sm:py-4 sm:text-sm">
                                            {new Date(request.requestedAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LeaveModule;