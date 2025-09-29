// ViewPayments.jsx
import React, { useState, useEffect } from 'react';
import {
    IndianRupee,
    ArrowLeft,
    Search,
    Filter,
    Download,
    Printer,
    CheckCircle,    // Tick icon
    XCircle,        // Cross icon
    Edit,           // Edit button icon
    AlertCircle,    // Used for Pending status icon
    Clock           // Could be used for Pending too, or a less specific icon
} from 'lucide-react';
import axios from 'axios';
import { saveAs } from 'file-saver'; // Import saveAs for file export

// Access API_BASE_URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'; // Fallback for development

const ViewPayments = ({ onBackToFeeManagement }) => {
    // Mock payment data (simulating payments made by parents)
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State to manage filters and search
    const [filters, setFilters] = useState({
        class: '',
        section: '',
        paymentStatus: ''
    });
    const [searchTerm, setSearchTerm] = useState('');

    // State for dynamic filter options
    const [availableClasses, setAvailableClasses] = useState([]);
    const [availableSections, setAvailableSections] = useState([]);

    // New state to track which payment's status is being edited
    const [editingPaymentId, setEditingPaymentId] = useState(null);

    useEffect(() => {
        const fetchPayments = async () => {
            setLoading(true);
            setError(null);
            try {
                // Fetch payment records from backend
                const token = JSON.parse(localStorage.getItem('authToken'));
                const response = await axios.get(`${API_BASE_URL}/api/payment-details`, { // Use API_BASE_URL
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                const paymentData = response.data || [];
                setPayments(paymentData);
                // Extract unique classes and sections for filters
                const classesSet = new Set();
                const sectionsSet = new Set();
                paymentData.forEach(payment => {
                    if (payment.class) classesSet.add(payment.class);
                    if (payment.section) sectionsSet.add(payment.section);
                });
                setAvailableClasses(Array.from(classesSet));
                setAvailableSections(Array.from(sectionsSet));
                setLoading(false);
            } catch (err) {
                setError("Failed to fetch payment records.");
                setLoading(false);
            }
        };
        fetchPayments();
    }, []);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleEditStatus = (paymentId) => {
        setEditingPaymentId(editingPaymentId === paymentId ? null : paymentId);
    };

    const handleStatusChange = async (paymentId, newStatus) => {
        try {
            setLoading(true);
            const token = JSON.parse(localStorage.getItem('authToken'));
            await axios.patch(`${API_BASE_URL}/api/payment-details/${paymentId}/status`, // Use API_BASE_URL
                { status: newStatus },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            setPayments(prevPayments =>
                prevPayments.map(payment =>
                    (payment._id === paymentId)
                        ? { ...payment, status: newStatus }
                        : payment
                )
            );
            setEditingPaymentId(null);
        } catch (err) {
            setError('Failed to update payment status.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyPayment = (paymentId) => {
        setPayments(prevPayments =>
            prevPayments.map(payment =>
                payment.id === paymentId ? { ...payment, status: 'Verified' } : payment
            )
        );
        setEditingPaymentId(null); // Exit editing mode after verification
    };

    const handleRejectPayment = (paymentId) => {
        setPayments(prevPayments =>
            prevPayments.map(payment =>
                payment.id === paymentId ? { ...payment, status: 'Not Verified' } : payment
            )
        );
        setEditingPaymentId(null); // Exit editing mode after rejection
    };

    const filteredPayments = payments.filter(payment => {
        const matchesSearch = searchTerm === '' ||
            payment.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            payment.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            payment.transactionId.toLowerCase().includes(searchTerm.toLowerCase());

        return (
            matchesSearch &&
            (filters.class === '' || payment.class === filters.class) &&
            (filters.section === '' || payment.section === filters.section) &&
            (filters.paymentStatus === '' || payment.status === filters.paymentStatus)
        );
    });

    const handleExport = () => {
        const headers = [
            "Payment ID", "Student ID", "Student Name", "Class", "Section", "Term", "Amount",
            "Payment Date", "Payment Method", "Transaction ID", "Status"
        ];
        const rows = filteredPayments.map(payment => [
            payment.id, payment.studentId, payment.studentName, payment.class, payment.section,
            payment.term, payment.amount, payment.paymentDate, payment.paymentMethod,
            payment.transactionId, payment.status
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(field => `"${field !== null && field !== undefined ? String(field).replace(/"/g, '""') : ''}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, 'payment_records.csv'); // Use saveAs from file-saver
    };

    const handlePrint = () => {
        const printContent = document.getElementById('payment-records-table').outerHTML;
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.open();
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Payment Records</title>
                        <style>
                            body { font-family: 'Arial', sans-serif; margin: 20px; }
                            h1 { text-align: center; margin-bottom: 20px; color: #333; }
                            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                            th { background-color: #f2f2f2; font-weight: bold; }
                            /* Updated status colors for print */
                            .status-Pending { color: orange; font-weight: bold; }
                            .status-Verified { color: green; font-weight: bold; }
                            .status-NotVerified { color: red; font-weight: bold; }
                            .no-print { display: none; }
                        </style>
                    </head>
                    <body>
                        <h1>Payment Records Report</h1>
                        ${printContent}
                        <script>
                            window.onload = function() {
                                window.print();
                                window.onafterprint = function() {
                                    window.close();
                                };
                            };
                        </script>
                    </body>
                </html>
            `);
            printWindow.document.close();
        } else {
            // Custom message box instead of alert()
            const messageBox = document.createElement('div');
            messageBox.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
            messageBox.innerHTML = `
                <div class="bg-white p-6 rounded-lg shadow-lg text-center">
                    <p class="text-lg font-semibold text-red-800 mb-4">Please allow pop-ups for printing functionality.</p>
                    <button id="closeMessageBox" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">OK</button>
                </div>
            `;
            document.body.appendChild(messageBox);
            document.getElementById('closeMessageBox').onclick = () => {
                document.body.removeChild(messageBox);
            };
        }
    };


    return (
        <div className="px-0 sm:px-2 md:px-4 lg:p-6 flex flex-col gap-2 sm:gap-4 lg:gap-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4">
                <h1 className="text-3xl font-extrabold text-gray-900 flex items-center mb-4 sm:mb-0">
                    <IndianRupee className="mr-3 text-purple-600" size={32} /> Payment Records
                </h1>
                <button
                    onClick={onBackToFeeManagement}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-xl flex items-center justify-center shadow-lg transition duration-300 ease-in-out transform hover:scale-105 text-base font-semibold"
                >
                    <ArrowLeft size={20} className="mr-2" /> Back to Fee Management
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md mb-6">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 flex items-center">
                    <Filter size={18} className="mr-2 text-gray-600" /> Filter Payments
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                        <select
                            name="class"
                            value={filters.class}
                            onChange={handleFilterChange}
                            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-purple-500 focus:border-purple-500"
                        >
                            <option value="">All Classes</option>
                            {availableClasses.map(cls => (
                                <option key={cls} value={cls}>Class {cls}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                        <select
                            name="section"
                            value={filters.section}
                            onChange={handleFilterChange}
                            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-purple-500 focus:border-purple-500"
                        >
                            <option value="">All Sections</option>
                            {availableSections.map(sec => (
                                <option key={sec} value={sec}>Section {sec}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                            name="paymentStatus"
                            value={filters.paymentStatus}
                            onChange={handleFilterChange}
                            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-purple-500 focus:border-purple-500"
                        >
                            <option value="">All Statuses</option>
                            <option value="Pending">Pending</option>
                            <option value="Verified">Verified</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                    </div>
                </div>
                <div className="mt-4 sm:mt-6 flex justify-end">
                    <button
                        onClick={() => setFilters({
                            class: '',
                            section: '',
                            paymentStatus: ''
                        })}
                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center hover:bg-gray-300 transition duration-200"
                    >
                        <Filter size={14} className="mr-1" /> Reset Filters
                    </button>
                </div>
            </div>

            {/* Payment Records Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-4 border-b flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by ID, Name or Transaction ID..."
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full text-sm focus:ring-purple-500 focus:border-purple-500"
                            value={searchTerm}
                            onChange={handleSearchChange}
                        />
                    </div>
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                        <button
                            onClick={handleExport}
                            className="flex items-center justify-center text-gray-700 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-medium transition duration-200 w-full sm:w-auto"
                        >
                            <Download size={16} className="mr-2" /> Export CSV
                        </button>
                        <button
                            onClick={handlePrint}
                            className="flex items-center justify-center text-gray-700 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-medium transition duration-200 w-full sm:w-auto"
                        >
                            <Printer size={16} className="mr-2" /> Print Report
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="p-8 text-center text-red-500 font-medium">
                        Error: {error}
                    </div>
                )}

                {loading ? (
                    <div className="p-8 text-center text-gray-500">
                        <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mb-4 mx-auto"></div>
                        Loading payment records...
                    </div>
                ) : (
                    <div className="overflow-x-auto" id="payment-records-table">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider sm:px-6 sm:py-3">
                                        Invoice ID
                                    </th>
                                    {/* <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider sm:px-6 sm:py-3">
                                        Payment ID
                                    </th> */}
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider sm:px-6 sm:py-3">
                                        Student ID
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider sm:px-6 sm:py-3">
                                        Student Name
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider sm:px-6 sm:py-3">
                                        Class/Section
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider sm:px-6 sm:py-3">
                                        Term
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider sm:px-6 sm:py-3">
                                        Amount
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider sm:px-6 sm:py-3">
                                        Payment Date
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider sm:px-6 sm:py-3">
                                        Method
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider sm:px-6 sm:py-3">
                                        Transaction ID
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider sm:px-6 sm:py-3">
                                        Status
                                    </th>
                                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider no-print sm:px-6 sm:py-3">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredPayments.length > 0 ? (
                                    filteredPayments.map((payment) => (
                                        <tr key={payment._id || payment.invoice_id} className="hover:bg-gray-50 transition duration-150">
                                            <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900 sm:px-6 sm:py-4 sm:text-sm">
                                                {payment.invoice_id || payment._id || '-'}
                                            </td>
                                            <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-800 sm:px-6 sm:py-4 sm:text-sm">
                                                {payment.student_id?.admission_number || payment.student_id?._id || payment.student_id || '-'}
                                            </td>
                                            <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-800 sm:px-6 sm:py-4 sm:text-sm">
                                                {payment.student_id?.full_name || payment.student_name || '-'}
                                            </td>
                                            <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600 sm:px-6 sm:py-4 sm:text-sm">
                                                {payment.class || '-'} / {payment.section || '-'}
                                            </td>
                                            <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600 sm:px-6 sm:py-4 sm:text-sm">
                                                {payment.term_name || payment.term || '-'}
                                            </td>
                                            <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900 sm:px-6 sm:py-4 sm:text-sm">
                                                ₹{typeof payment.amount_paid === 'number' ? payment.amount_paid.toLocaleString() : '-'}
                                            </td>
                                            <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600 sm:px-6 sm:py-4 sm:text-sm">
                                                {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : '-'}
                                            </td>
                                            <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600 sm:px-6 sm:py-4 sm:text-sm">
                                                {payment.payment_method || '-'}
                                            </td>
                                            <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600 sm:px-6 sm:py-4 sm:text-sm">
                                                <span className="font-mono">{payment.transaction_id || '-'}</span>
                                            </td>
                                            <td className="px-3 py-2 whitespace-nowrap sm:px-6 sm:py-4">
                                                {editingPaymentId === (payment._id || payment.invoice_id) ? (
                                                    <div className="flex space-x-2 items-center">
                                                        <select
                                                            value={payment.status || 'Pending'}
                                                            onChange={e => handleStatusChange(payment._id, e.target.value)}
                                                            className="border border-gray-300 rounded px-2 py-1 text-xs focus:ring-purple-500 focus:border-purple-500"
                                                        >
                                                            <option value="Pending">Pending</option>
                                                            <option value="Verified">Verified</option>
                                                            <option value="Rejected">Rejected</option>
                                                        </select>
                                                        <button
                                                            onClick={() => setEditingPaymentId(null)}
                                                            className="ml-2 text-gray-500 hover:text-gray-700 p-1 rounded-md hover:bg-gray-100 transition duration-150"
                                                            title="Cancel"
                                                        >
                                                            <XCircle size={18} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full
                                                        ${payment.status === 'Verified' ? 'bg-green-100 text-green-800' :
                                                            payment.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                                                                'bg-yellow-100 text-yellow-800'}`}> {/* Default to yellow for 'Pending' */}
                                                        {payment.status || '-'}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-3 py-2 whitespace-nowrap text-right text-xs font-medium no-print sm:px-6 sm:py-4 sm:text-sm">
                                                <button
                                                    onClick={() => handleEditStatus(payment._id || payment.invoice_id)}
                                                    className="text-indigo-600 hover:text-indigo-900 p-0.5 sm:p-1 rounded-md hover:bg-gray-100 transition duration-150"
                                                    title="Edit Status"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="11" className="px-6 py-8 text-center text-sm text-gray-500 sm:text-md">
                                            No payment records found matching your criteria.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ViewPayments;
