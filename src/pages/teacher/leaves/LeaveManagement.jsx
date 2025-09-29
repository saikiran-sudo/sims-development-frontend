// LeaveManagement.jsx (Teacher's Own Leave Request Panel)
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
    Briefcase, // For Leave Type (teacher's work-related leave)
    User, // For Teacher name
    Paperclip // For Attachments
} from 'lucide-react';
import axios from 'axios';

// Access API_BASE_URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'; // Fallback for development

const token = JSON.parse(localStorage.getItem('authToken'));

const LeaveManagement = () => {
    const [teacherLeaveRequests, setTeacherLeaveRequests] = useState([]);
    const [error, setError] = useState(null);
    const [showRequestForm, setShowRequestForm] = useState(false);
    const userprofileval = JSON.parse(localStorage.getItem('userprofile'));

    const [newRequest, setNewRequest] = useState({
        leaveType: '',
        startDate: '',
        endDate: '',
        reason: '',
        attachment: null,
    });

    // Fetch teacher's leave requests from backend
    useEffect(() => {
        const fetchTeacherLeaves = async () => {
            try {
                setError(null);
                const res = await axios.get(`${API_BASE_URL}/api/leaves/teacher/under-my-admin`, {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                const mapped = res.data.map(lr => ({
                    id: lr._id,
                    applicantId: lr.user_id,
                    applicantName: lr.applicantName || 'N/A',
                    leaveType: lr.leave_type,
                    startDate: lr.start_date ? lr.start_date.slice(0, 10) : '',
                    endDate: lr.end_date ? lr.end_date.slice(0, 10) : '',
                    status: lr.status,
                    adminComment: lr.adminComment || '',
                    requestedAt: lr.requestedAt,
                }));
                setTeacherLeaveRequests(mapped);
            } catch (err) {
                setError(err.response?.data?.error || 'Failed to fetch leave requests');
            }
        };
        fetchTeacherLeaves();
    }, []);

    const handleInputChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'attachment' && files) {
            setNewRequest(prev => ({ ...prev, [name]: files[0] }));
        } else {
            setNewRequest(prev => ({ ...prev, [name]: value }));
        }
    };

    // Submit new leave request to backend
    const handleSubmitRequest = async (e) => {
        e.preventDefault();
        const { leaveType, startDate, endDate, reason } = newRequest;
        if (!leaveType || !startDate || !reason) {
            alert('Please fill in all required fields: Leave Type, Start Date, and Reason.');
            return;
        }
        const finalEndDate = endDate || startDate;
        if (new Date(startDate) > new Date(finalEndDate)) {
            alert('End Date cannot be before Start Date.');
            return;
        }
        try {
            // TODO: Replace with real teacher user_id and employeeId from auth context
            const payload = {
                // user_id: 'teacher_user_id',
                // employeeId: 'teacher_employee_id',
                // applicantName: 'Teacher Name',
                user_id: userprofileval.user_id,
                employeeId: userprofileval.user_id,
                applicantName: userprofileval.full_name,
                leave_type: leaveType,
                start_date: startDate,
                end_date: finalEndDate,
                reason,
            };
            await axios.post(`${API_BASE_URL}/api/leaves/`, payload, {
                withCredentials: true,
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            alert('Leave request submitted successfully! It will be reviewed by the admin.');
            setShowRequestForm(false);
            setNewRequest({ leaveType: '', startDate: '', endDate: '', reason: '', attachment: null });
            // Refresh leave list
            const res = await axios.get(`${API_BASE_URL}/api/leaves/teacher/under-my-admin`, {
                withCredentials: true,
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const mapped = res.data.map(lr => ({
                id: lr._id,
                applicantId: lr.user_id,
                applicantName: lr.applicantName || 'N/A',
                leaveType: lr.leave_type,
                startDate: lr.start_date ? lr.start_date.slice(0, 10) : '',
                endDate: lr.end_date ? lr.end_date.slice(0, 10) : '',
                status: lr.status,
                adminComment: lr.adminComment || '',
                requestedAt: lr.requestedAt,
            }));
            setTeacherLeaveRequests(mapped);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to submit leave request');
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

    if (error) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-red-500 text-lg">Error: {error}</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2 sm:gap-4 lg:gap-8">
            {/* Raise New Leave Request Section */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md mb-6">
                <button
                    onClick={() => setShowRequestForm(!showRequestForm)}
                    className="w-full flex justify-between items-center text-lg font-semibold text-gray-800 py-3 px-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition duration-200"
                >
                    <span className="flex items-center">
                        <PlusCircle size={20} className="mr-3 text-purple-600" />
                        Raise New Leave Request for Myself
                    </span>
                    {showRequestForm ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>

                {showRequestForm && (
                    <form onSubmit={handleSubmitRequest} className="mt-4 border-t pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label htmlFor="leaveType" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                    <Briefcase size={16} className="mr-2 text-gray-500" /> Leave Type
                                </label>
                                <select
                                    id="leaveType"
                                    name="leaveType"
                                    value={newRequest.leaveType}
                                    onChange={handleInputChange}
                                    className="w-full border border-gray-300 rounded-lg p-2.5 text-base focus:ring-purple-500 focus:border-purple-500"
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
                                    className="w-full border border-gray-300 rounded-lg p-2.5 text-base focus:ring-purple-500 focus:border-purple-500"
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
                                    className="w-full border border-gray-300 rounded-lg p-2.5 text-base focus:ring-purple-500 focus:border-purple-500"
                                />
                            </div>
                            <div className="md:col-span-2"> {/* Make reason take full width on medium screens */}
                                <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                    <ListTodo size={16} className="mr-2 text-gray-500" /> Reason for Leave
                                </label>
                                <textarea
                                    id="reason"
                                    name="reason"
                                    value={newRequest.reason}
                                    onChange={handleInputChange}
                                    rows="3"
                                    className="w-full border border-gray-300 rounded-lg p-2.5 text-base focus:ring-purple-500 focus:border-purple-500 resize-y"
                                    placeholder="Briefly explain the reason for your leave..."
                                    required
                                ></textarea>
                            </div>
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
                                className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
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
                                        leaveType: '', startDate: '', endDate: '', reason: '', attachment: null,
                                    });
                                    setShowRequestForm(false);
                                }}
                                className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-semibold flex items-center hover:bg-gray-300 transition duration-200"
                            >
                                <XCircle size={20} className="mr-2" /> Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-5 py-2.5 bg-purple-600 text-white rounded-lg font-semibold flex items-center hover:bg-purple-700 shadow-md transition duration-200"
                            >
                                <Send size={20} className="mr-2" /> Submit Request
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* My Leave Requests Section */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-4 border-b">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-800 flex items-center">
                        <ListTodo size={20} className="mr-3 text-gray-600" /> My Submitted Leave Requests
                    </h2>
                </div>

                {teacherLeaveRequests.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        No leave requests submitted yet.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider sm:px-6 sm:py-3">
                                        Applicant
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
                                        Admin's Comment
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
                                {teacherLeaveRequests.map(request => (
                                    <tr key={request.id} className="hover:bg-gray-50 transition duration-150">
                                        <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900 sm:px-6 sm:py-4 sm:text-sm">
                                            {request.applicantName}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-800 sm:px-6 sm:py-4 sm:text-sm">
                                            {request.leaveType}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600 sm:px-6 sm:py-4 sm:text-sm">
                                            {request.startDate} {request.endDate && request.startDate !== request.endDate ? `to ${request.endDate}` : ''}
                                        </td>
                                        <td className="px-3 py-2 text-xs text-gray-600 sm:px-6 sm:py-4 sm:text-sm max-w-xs overflow-hidden text-ellipsis break-words">
                                            {request.reason || 'N/A'}
                                        </td>
                                        <td className="px-3 py-2 text-xs text-gray-600 sm:px-6 sm:py-4 sm:text-sm max-w-xs overflow-hidden text-ellipsis break-words">
                                            {request.adminComment || 'Awaiting Admin Comment'}
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

export default LeaveManagement;