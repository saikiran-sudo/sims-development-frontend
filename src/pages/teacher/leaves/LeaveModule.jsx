// TeacherLeaveModule.jsx (Teacher Panel)
import React, { useState, useEffect } from 'react';
import {
    Calendar,
    CheckCircle,
    XCircle,
    ListTodo,
    BookOpen, // For Leave Type
    User, // For Child name
    MessageSquare, // For comment button
    Edit, // Icon for edit button
    Briefcase, // New icon for Leave Management button (teacher's work-related leave)
} from 'lucide-react';
import axios from 'axios';
import LeaveManagement from './LeaveManagement'; // Import the new LeaveManagement component

// Access API_BASE_URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Get token from localStorage
const getToken = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    return token ? JSON.parse(token) : null;
};

const LeaveModule = () => {
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [error, setError] = useState(null);

    // State for comment modal
    const [showCommentModal, setShowCommentModal] = useState(false);
    const [selectedRequestForComment, setSelectedRequestForComment] = useState(null);
    const [modalComment, setModalComment] = useState('');

    // New state to track which request's actions are being edited
    const [editingActionId, setEditingActionId] = useState(null);

    // State to control which view is active
    const [activeView, setActiveView] = useState('studentLeave'); // 'studentLeave' or 'teacherLeave'

    // Remove the leave creation state and handlers
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createForm, setCreateForm] = useState({
        leave_type: '',
        start_date: '',
        end_date: '',
        reason: '',
        applicantName: '',
    });
    const [creating, setCreating] = useState(false);

    // Remove these handlers:
    // openCreateModal, closeCreateModal, handleCreateFormChange, handleCreateLeave

    // Fetch leave requests from backend
    useEffect(() => {
        const fetchLeaves = async () => {
            try {
                setError(null);
                const token = getToken();
                let url = '';
                if (activeView === 'studentLeave') {
                    url = `${API_BASE_URL}/api/leaves/student`;
                } else {
                    url = `${API_BASE_URL}/api/leaves/teacher`;
                }
                const res = await axios.get(url, {
                    withCredentials: true,
                    headers: token ? { Authorization: `Bearer ${token}` } : {}
                });
                console.log('API Response:', res.data); // Debug log
                const mapped = res.data.map(lr => ({
                    id: lr._id,
                    childId: lr.user_id,
                    childName: lr.applicantName || 'N/A',
                    class: lr.class || '',
                    section: lr.section || '',
                    leaveType: lr.leave_type,
                    startDate: lr.start_date ? lr.start_date.slice(0, 10) : '',
                    endDate: lr.end_date ? lr.end_date.slice(0, 10) : '',
                    status: lr.status,
                    teacherComment: lr.adminComment || '',
                    requestedAt: lr.requestedAt,
                }));
                console.log('Mapped data:', mapped); // Debug log
                setLeaveRequests(mapped);
            } catch (err) {
                setError(err.response?.data?.error || 'Failed to fetch leave requests');
            }
        };
        fetchLeaves();
    }, [activeView]);

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
        try {
            const token = getToken();
            let url = '';
            if (activeView === 'studentLeave') {
                url = `${API_BASE_URL}/api/leaves/student/${requestId}/status`;
            } else {
                url = `${API_BASE_URL}/api/leaves/teacher/${requestId}/status`;
            }
            await axios.patch(url, { status: newStatus }, {
                withCredentials: true,
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            setLeaveRequests(prevRequests =>
                prevRequests.map(request =>
                    request.id === requestId
                        ? { ...request, status: newStatus }
                        : request
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
        setModalComment(request.teacherComment || '');
        setShowCommentModal(true);
    };

    const closeCommentModal = () => {
        setShowCommentModal(false);
        setSelectedRequestForComment(null);
        setModalComment('');
    };

    // Handler for saving comment
    const handleSaveComment = async () => {
        if (selectedRequestForComment) {
            try {
                const token = getToken();
                let url = '';
                let data = {};
                if (activeView === 'studentLeave') {
                    url = `${API_BASE_URL}/api/leaves/student/${selectedRequestForComment.id}/comment`;
                    data = { teacherComment: modalComment };
                } else {
                    url = `${API_BASE_URL}/api/leaves/teacher/${selectedRequestForComment.id}/comment`;
                    data = { adminComment: modalComment };
                }
                await axios.patch(url, data, {
                    withCredentials: true,
                    headers: token ? { Authorization: `Bearer ${token}` } : {}
                });
                setLeaveRequests(prevRequests =>
                    prevRequests.map(request =>
                        request.id === selectedRequestForComment.id
                            ? { ...request, teacherComment: modalComment }
                            : request
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
        setEditingActionId(request.id);
        // Removed: openCommentModal(request); - Comment modal will now only open when 'Add Comment' or 'Edit Comment' button is clicked
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
            {/* Header and Navigation Buttons */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4">
                <h1 className="text-3xl font-extrabold text-gray-900 flex items-center mb-4 sm:mb-0">
                    {activeView === 'studentLeave' ? (
                        <Calendar className="mr-3 text-blue-600" size={32} />
                    ) : (
                        <Briefcase className="mr-3 text-purple-600" size={32} />
                    )}
                    {activeView === 'studentLeave' ? 'Student Leave Requests' : 'My Leave Management'}
                </h1>
                <div className="flex gap-4">
                    <button
                        onClick={() => setActiveView('studentLeave')}
                        className={`px-5 py-2.5 rounded-lg font-semibold flex items-center transition-colors
                            ${activeView === 'studentLeave' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                    >Student Leaves
                    </button>
                    <button
                        onClick={() => setActiveView('teacherLeave')}
                        className={`px-5 py-2.5 rounded-lg font-semibold flex items-center transition-colors
                            ${activeView === 'teacherLeave' ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                    >My Leave
                    </button>
                </div>
            </div>

            {/* Conditional Rendering of Modules */}
            {activeView === 'studentLeave' && (
                <>
                    {/* Student Leave Requests Table */}
                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                        <div className="p-4 border-b">
                            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 flex items-center">
                                <ListTodo size={20} className="mr-3 text-gray-600" /> All Student Leave Applications
                            </h2>
                        </div>

                        {leaveRequests.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                No student leave requests to display.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider sm:px-6 sm:py-3">
                                                <User size={14} className="inline mr-1 text-gray-500" /> Child Name
                                            </th>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider sm:px-6 sm:py-3">
                                                <BookOpen size={14} className="inline mr-1 text-gray-500" /> Leave Type
                                            </th>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider sm:px-6 sm:py-3">
                                                <Calendar size={14} className="inline mr-1 text-gray-500" /> Duration
                                            </th>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider sm:px-6 sm:py-3">
                                                Status
                                            </th>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider sm:px-6 sm:py-3">
                                                Teacher's Comment
                                            </th>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider sm:px-6 sm:py-3">
                                                Requested On
                                            </th>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider sm:px-6 sm:py-3">
                                                Actions
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
                                                <td className="px-3 py-2 whitespace-nowrap sm:px-6 sm:py-4">
                                                    <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColorClass(request.status)}`}>
                                                        {request.status}
                                                    </span>
                                                </td>
                                                {/* Teacher's Comment Column Logic */}
                                                <td className="px-3 py-2 text-xs text-gray-600 sm:px-6 sm:py-4 sm:text-sm">
                                                    {request.status === 'Pending' || editingActionId === request.id ? ( // Show edit button if pending or if "Edit" in actions column is clicked
                                                        <button
                                                            onClick={() => openCommentModal(request)}
                                                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200 shadow-sm"
                                                        >
                                                            <MessageSquare size={16} className="mr-2" />
                                                            {request.teacherComment ? 'Edit Comment' : 'Add Comment'}
                                                        </button>
                                                    ) : (
                                                        <p className="max-w-xs overflow-hidden text-ellipsis break-words">
                                                            {request.teacherComment || 'N/A'}
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600 sm:px-6 sm:py-4 sm:text-sm">
                                                    {new Date(request.requestedAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-3 py-2 whitespace-nowrap text-sm font-medium sm:px-6 sm:py-4">
                                                    {request.status === 'Pending' || editingActionId === request.id ? (
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleUpdateStatus(request.id, 'Approved')}
                                                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                                                title="Approve Request"
                                                            >
                                                                <CheckCircle size={14} className="mr-1" /> Approve
                                                            </button>
                                                            <button
                                                                onClick={() => handleUpdateStatus(request.id, 'Rejected')}
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

                    {/* Comment Modal */}
                    {showCommentModal && (
                        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50 p-4">
                            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                                    <MessageSquare size={20} className="mr-2 text-blue-600" />
                                    Comment for {selectedRequestForComment?.childName}'s Leave
                                </h3>
                                <div className="mb-4">
                                    <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                                        Teacher's Comment:
                                    </label>
                                    <textarea
                                        id="comment"
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
                </>
            )}

            {activeView === 'teacherLeave' && <LeaveManagement />}

            {/* Remove the showCreateModal section completely */}
        </div>
    );
};

export default LeaveModule;