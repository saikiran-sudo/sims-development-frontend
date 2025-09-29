// LeaveModule.jsx (Admin Panel)
import React, { useState, useEffect } from 'react';
import {
    Calendar,
    CheckCircle,
    XCircle,
    ListTodo,
    Briefcase, // For Leave Type (teacher's work-related leave)
    User, // For Teacher name
    MessageSquare, // For comment button
    Edit, // Icon for edit button
    Clock, // For requested time
} from 'lucide-react';
import axios from 'axios';

// Access API_BASE_URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'; // Fallback for development

const LeaveModule = () => {
    const [teacherLeaveRequests, setTeacherLeaveRequests] = useState([]);
    const [error, setError] = useState(null);

    // State for comment modal
    const [showCommentModal, setShowCommentModal] = useState(false);
    const [selectedRequestForComment, setSelectedRequestForComment] = useState(null);
    const [modalComment, setModalComment] = useState('');

    // New state to track which request's actions are being edited
    const [editingActionId, setEditingActionId] = useState(null);

    // Simulate fetching teacher leave requests on component mount
    useEffect(() => {
        const fetchLeaveRequests = async () => {
            const token = JSON.parse(localStorage.getItem('authToken'));
            try {
                const res = await axios.get(`${API_BASE_URL}/api/leaves/teacher`, { // Use API_BASE_URL
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                setTeacherLeaveRequests(res.data);
            } catch (err) {
                setError(err.response?.data?.error || 'Failed to fetch leave requests');
            }
        };
        fetchLeaveRequests();
    }, []);

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

    // Handler for updating status (Approve/Reject)
    const handleUpdateStatus = async (requestId, newStatus) => {
        const token = JSON.parse(localStorage.getItem('authToken'));
        try {
            const res = await axios.patch(`${API_BASE_URL}/api/leaves/teacher/${requestId}/status`, { status: newStatus }, { // Use API_BASE_URL
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setTeacherLeaveRequests(prevRequests =>
                prevRequests.map(request =>
                    request._id === requestId ? res.data : request
                )
            );
            setEditingActionId(null);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update status');
        }
    };

    // Handlers for comment modal
    const openCommentModal = (request) => {
        setSelectedRequestForComment(request);
        setModalComment(request.adminComment || ''); // Use adminComment for admin panel
        setShowCommentModal(true);
    };

    const closeCommentModal = () => {
        setShowCommentModal(false);
        setSelectedRequestForComment(null);
        setModalComment('');
    };

    const handleSaveComment = async () => {
        if (selectedRequestForComment) {
            const token = JSON.parse(localStorage.getItem('authToken'));
            try {
                const res = await axios.patch(`${API_BASE_URL}/api/leaves/teacher/${selectedRequestForComment._id}/comment`, { adminComment: modalComment }, { // Use API_BASE_URL
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                setTeacherLeaveRequests(prevRequests =>
                    prevRequests.map(request =>
                        request._id === selectedRequestForComment._id ? res.data : request
                    )
                );
                closeCommentModal();
            } catch (err) {
                setError(err.response?.data?.error || 'Failed to update comment');
            }
        }
    };

    // Handler for "Edit Actions" button - only sets editing state, does NOT open comment modal
    const handleEditActionsClick = (request) => {
        setEditingActionId(request._id);
    };

    if (error) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-red-500 text-lg">Error: {error}</div>
            </div>
        );
    }

    return (
        <div className="px-0 sm:px-2 md:px-4 lg:p-6 flex flex-col gap-2 sm:gap-4 lg:gap-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4">
                <h1 className="text-3xl font-extrabold text-gray-900 flex items-center mb-4 sm:mb-0">
                    <Calendar className="mr-3 text-blue-600" size={32} /> Teacher Leave Requests
                </h1>
            </div>

            {/* Teacher Leave Requests Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-4 border-b">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-800 flex items-center">
                        <ListTodo size={20} className="mr-3 text-gray-600" /> All Teacher Leave Applications
                    </h2>
                </div>

                {teacherLeaveRequests.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        No teacher leave requests to display.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider sm:px-6 sm:py-3">
                                        <User size={14} className="inline mr-1 text-gray-500" /> Teacher Name
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider sm:px-6 sm:py-3">
                                        <Briefcase size={14} className="inline mr-1 text-gray-500" /> Leave Type
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider sm:px-6 sm:py-3">
                                        <Calendar size={14} className="inline mr-1 text-gray-500" /> Duration
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider sm:px-6 sm:py-3">
                                        Reason
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider sm:px-6 sm:py-3">
                                        Status
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider sm:px-6 sm:py-3">
                                        Admin's Comment
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider sm:px-6 sm:py-3">
                                        <Clock size={14} className="inline mr-1 text-gray-500" /> Requested On
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider sm:px-6 sm:py-3">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {teacherLeaveRequests.map(request => (
                                    <tr key={request._id} className="hover:bg-gray-50 transition duration-150">
                                        <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900 sm:px-6 sm:py-4 sm:text-sm">
                                            {request.applicantName} (ID: {request.employeeId})
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-800 sm:px-6 sm:py-4 sm:text-sm">
                                            {request.leave_type}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600 sm:px-6 sm:py-4 sm:text-sm">
                                            {new Date(request.start_date).toLocaleDateString()} {request.end_date && request.start_date !== request.end_date ? `to ${new Date(request.end_date).toLocaleDateString()}` : ''}
                                        </td>
                                        <td className="px-3 py-2 text-xs text-gray-600 sm:px-6 sm:py-4 sm:text-sm max-w-xs overflow-hidden text-ellipsis break-words">
                                            {request.reason || 'N/A'}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap sm:px-6 sm:py-4">
                                            <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColorClass(request.status)}`}>
                                                {request.status}
                                            </span>
                                        </td>
                                        {/* Admin's Comment Column Logic */}
                                        <td className="px-3 py-2 text-xs text-gray-600 sm:px-6 sm:py-4 sm:text-sm">
                                            {request.status === 'Pending' || editingActionId === request._id ? ( // Show edit button if pending or if "Edit" in actions column is clicked
                                                <button
                                                    onClick={() => openCommentModal(request)}
                                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200 shadow-sm"
                                                >
                                                    <MessageSquare size={16} className="mr-2" />
                                                    {request.adminComment ? 'Edit Comment' : 'Add Comment'}
                                                </button>
                                            ) : (
                                                <p className="max-w-xs overflow-hidden text-ellipsis break-words">
                                                    {request.adminComment || 'N/A'}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600 sm:px-6 sm:py-4 sm:text-sm">
                                            {new Date(request.requestedAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-sm font-medium sm:px-6 sm:py-4">
                                            {request.status === 'Pending' || editingActionId === request._id ? (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleUpdateStatus(request._id, 'Approved')}
                                                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                                        title="Approve Request"
                                                    >
                                                        <CheckCircle size={14} className="mr-1" /> Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateStatus(request._id, 'Rejected')}
                                                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                                        title="Reject Request"
                                                    >
                                                        <XCircle size={14} className="mr-1" /> Reject
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleEditActionsClick(request)}
                                                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-200"
                                                    title="Edit Actions"
                                                >
                                                    <Edit size={14} className="mr-1" /> Edit
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Comment Modal for Admin */}
            {showCommentModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                            <MessageSquare size={20} className="mr-2 text-blue-600" />
                            Comment for {selectedRequestForComment?.applicantName}'s Leave
                        </h3>
                        <div className="mb-4">
                            <label htmlFor="adminComment" className="block text-sm font-medium text-gray-700 mb-2">
                                Admin's Comment:
                            </label>
                            <textarea
                                id="adminComment"
                                className="w-full p-3 border border-gray-300 rounded-lg resize-y min-h-[100px] focus:ring-blue-500 focus:border-blue-500"
                                value={modalComment}
                                onChange={(e) => setModalComment(e.target.value)}
                                placeholder="Add your comment here..."
                            ></textarea>
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={closeCommentModal}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md font-semibold hover:bg-gray-300 transition duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveComment}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 shadow-sm transition duration-200"
                            >
                                Save Comment
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeaveModule;
