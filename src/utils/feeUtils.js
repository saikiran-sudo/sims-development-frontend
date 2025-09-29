import axios from 'axios';

// Access API_BASE_URL from environment variables
const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'; // Fallback for development
const API_BASE_URL = `${API_URL}/api`; // Use the base URL for the API endpoint

// Helper function to get auth headers
const getAuthHeaders = () => {
    const token = JSON.parse(localStorage.getItem('authToken'));
    return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Fee Records Fetching Utility Functions
 * This file provides comprehensive functions to fetch fee records from the backend Fee controller
 */

// 🧾 Get all fee records (Admin only)
export const fetchAllFees = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/fees`, {
            headers: getAuthHeaders(),
        });
        console.log('All fees fetched:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching all fees:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch all fees');
    }
};

// 🧾 Get student's fee history (Student or Parent)
export const fetchStudentFees = async (studentId) => {
    try {
        console.log(`Making API call to fetch fees for student ${studentId}`);
        const response = await axios.get(`${API_BASE_URL}/fees/student/${studentId}`, {
            headers: getAuthHeaders(),
        });
        console.log(`API response for student ${studentId}:`, response);
        console.log(`Fees data for student ${studentId}:`, response.data);
        return response.data;
    } catch (error) {
        console.error(`Error fetching fees for student ${studentId}:`, error);
        console.error(`Error response:`, error.response);
        throw new Error(error.response?.data?.message || 'Failed to fetch student fees');
    }
};

// 🧾 Get a single fee record by ID
export const fetchFeeById = async (feeId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/fees/${feeId}`, {
            headers: getAuthHeaders(),
        });
        console.log(`Fee record ${feeId}:`, response.data);
        return response.data;
    } catch (error) {
        console.error(`Error fetching fee ${feeId}:`, error);
        throw new Error(error.response?.data?.message || 'Failed to fetch fee record');
    }
};

// 💵 Create a new fee record (Admin only)
export const createFeeRecord = async (feeData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/fees`, feeData, {
            headers: getAuthHeaders(),
        });
        console.log('Fee record created:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error creating fee record:', error);
        throw new Error(error.response?.data?.message || 'Failed to create fee record');
    }
};

// ✏️ Update a fee record (Admin only)
export const updateFeeRecord = async (feeId, feeData) => {
    try {
        const response = await axios.put(`${API_BASE_URL}/fees/${feeId}`, feeData, {
            headers: getAuthHeaders(),
        });
        console.log(`Fee record ${feeId} updated:`, response.data);
        return response.data;
    } catch (error) {
        console.error(`Error updating fee ${feeId}:`, error);
        throw new Error(error.response?.data?.message || 'Failed to update fee record');
    }
};

// ❌ Delete a fee record (Admin only)
export const deleteFeeRecord = async (feeId) => {
    try {
        const response = await axios.delete(`${API_BASE_URL}/fees/${feeId}`, {
            headers: getAuthHeaders(),
        });
        console.log(`Fee record ${feeId} deleted:`, response.data);
        return response.data;
    } catch (error) {
        console.error(`Error deleting fee ${feeId}:`, error);
        throw new Error(error.response?.data?.message || 'Failed to delete fee record');
    }
};

// 💳 Submit payment for a specific term (Parent/Student)
export const submitTermPayment = async (feeId, paymentData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/fees/${feeId}/pay-term`, paymentData, {
            headers: getAuthHeaders(),
        });
        console.log(`Payment submitted for fee ${feeId}:`, response.data);
        return response.data;
    } catch (error) {
        console.error(`Error submitting payment for fee ${feeId}:`, error);
        throw new Error(error.response?.data?.message || error.message || 'Failed to submit payment');
    }
};

// 🔍 Get parent's children and their fee data
export const fetchParentChildrenWithFees = async () => {
    try {
        // First, get parent profile with linked students
        const parentResponse = await axios.get(`${API_BASE_URL}/parents/me`, {
            headers: getAuthHeaders(),
        });
        
        console.log('Parent response:', parentResponse.data);
        const { linkedStudents } = parentResponse.data;
        console.log('Parent children:', linkedStudents);

        // Then fetch fee data for each child
        const childrenWithFees = await Promise.all(
            linkedStudents.map(async (student) => {
                try {
                    console.log(`Fetching fees for student ${student._id} (${student.full_name})`);
                    const fees = await fetchStudentFees(student._id);
                    console.log(`Fees received for student ${student._id}:`, fees);
                    return {
                        student,
                        fees
                    };
                } catch (error) {
                    console.error(`Error fetching fees for child ${student._id}:`, error);
                    return {
                        student,
                        fees: []
                    };
                }
            })
        );

        console.log('Children with fees:', childrenWithFees);
        return childrenWithFees;
    } catch (error) {
        console.error('Error fetching parent children with fees:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch parent data');
    }
};

// 📊 Get fee statistics (Admin only)
export const getFeeStatistics = async () => {
    try {
        const allFees = await fetchAllFees();
        
        const stats = {
            totalFees: allFees.length,
            totalAmount: allFees.reduce((sum, fee) => sum + (fee.amount || 0), 0),
            paidFees: allFees.filter(fee => fee.status === 'Paid').length,
            pendingFees: allFees.filter(fee => fee.status === 'Pending').length,
            overdueFees: allFees.filter(fee => fee.status === 'Overdue').length,
            termStats: {
                term1: {
                    total: allFees.length,
                    paid: allFees.filter(fee => fee.term1Status === 'Paid').length,
                    pending: allFees.filter(fee => fee.term1Status === 'Pending').length,
                    overdue: allFees.filter(fee => fee.term1Status === 'Overdue').length,
                },
                term2: {
                    total: allFees.length,
                    paid: allFees.filter(fee => fee.term2Status === 'Paid').length,
                    pending: allFees.filter(fee => fee.term2Status === 'Pending').length,
                    overdue: allFees.filter(fee => fee.term2Status === 'Overdue').length,
                },
                term3: {
                    total: allFees.length,
                    paid: allFees.filter(fee => fee.term3Status === 'Paid').length,
                    pending: allFees.filter(fee => fee.term3Status === 'Pending').length,
                    overdue: allFees.filter(fee => fee.term3Status === 'Overdue').length,
                }
            }
        };

        console.log('Fee statistics:', stats);
        return stats;
    } catch (error) {
        console.error('Error getting fee statistics:', error);
        throw new Error('Failed to get fee statistics');
    }
};

// 🔄 Refresh fee data for a specific student
export const refreshStudentFeeData = async (studentId) => {
    try {
        const fees = await fetchStudentFees(studentId);
        console.log(`Refreshed fee data for student ${studentId}:`, fees);
        return fees;
    } catch (error) {
        console.error(`Error refreshing fee data for student ${studentId}:`, error);
        throw error;
    }
};

// 📋 Example usage functions
export const feeExamples = {
    // Example: Create a new fee record
    createExampleFee: () => {
        return {
            student_id: "student_object_id_here",
            student_name: "John Doe",
            class: "10",
            section: "A",
            amount: 15000,
            first_term: {
                amount_due: 5000,
                status: "Due",
                due_date: "2024-06-15"
            },
            second_term: {
                amount_due: 5000,
                status: "Due",
                due_date: "2024-09-15"
            },
            third_term: {
                amount_due: 5000,
                status: "Due",
                due_date: "2024-12-15"
            }
        };
    },

    // Example: Submit payment data
    createExamplePayment: () => {
        return {
            term: "first", // "first", "second", or "third"
            amount_paid: 5000,
            payment_date: new Date().toISOString(),
            payment_method: "Bank Transfer",
            transaction_id: "TXN123456789"
        };
    }
};

// 📊 Payment Details API Functions

// 📊 Get payment records by parent ID
export const getParentPaymentRecords = async (parentId) => {
    try {
        console.log(`Fetching payment records for parent ${parentId}`);
        const response = await axios.get(`${API_BASE_URL}/payment-details/parent/${parentId}`, {
            headers: getAuthHeaders(),
        });
        console.log(`Payment records fetched for parent ${parentId}:`, response.data);
        return response.data;
    } catch (error) {
        console.error(`Error fetching payment records for parent ${parentId}:`, error);
        throw new Error(error.response?.data?.message || 'Failed to fetch payment records');
    }
};

// 📊 Get my payment records (for parents)
export const getMyPaymentRecords = async () => {
    try {
        console.log('Fetching my payment records');
        const headers = getAuthHeaders();
        console.log('Auth headers:', headers);
        console.log('API URL:', `${API_BASE_URL}/payment-details/my-payments`);
        
        const response = await axios.get(`${API_BASE_URL}/payment-details/my-payments`, {
            headers,
        });
        console.log('My payment records fetched:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching my payment records:', error);
        console.error('Error response:', error.response);
        console.error('Error status:', error.response?.status);
        console.error('Error data:', error.response?.data);
        throw new Error(error.response?.data?.message || 'Failed to fetch payment records');
    }
};

// 📊 Get payment records by student ID
export const getStudentPaymentRecords = async (studentId) => {
    try {
        console.log(`Fetching payment records for student ${studentId}`);
        const response = await axios.get(`${API_BASE_URL}/payment-details/student/${studentId}`, {
            headers: getAuthHeaders(),
        });
        console.log(`Payment records fetched for student ${studentId}:`, response.data);
        return response.data;
    } catch (error) {
        console.error(`Error fetching payment records for student ${studentId}:`, error);
        throw new Error(error.response?.data?.message || 'Failed to fetch payment records');
    }
};

// 🔍 Get payment record by transaction ID
export const getPaymentByTransactionId = async (transactionId) => {
    try {
        console.log(`Fetching payment record for transaction ${transactionId}`);
        const response = await axios.get(`${API_BASE_URL}/payment-details/transaction/${transactionId}`, {
            headers: getAuthHeaders(),
        });
        console.log(`Payment record fetched for transaction ${transactionId}:`, response.data);
        return response.data;
    } catch (error) {
        console.error(`Error fetching payment record for transaction ${transactionId}:`, error);
        throw new Error(error.response?.data?.message || 'Failed to fetch payment record');
    }
};

// 🔍 Get payment records by fee ID
export const getPaymentRecordsByFeeId = async (feeId) => {
    try {
        console.log(`Fetching payment records for fee ${feeId}`);
        const response = await axios.get(`${API_BASE_URL}/payment-details/fee/${feeId}`, {
            headers: getAuthHeaders(),
        });
        console.log(`Payment records fetched for fee ${feeId}:`, response.data);
        return response.data;
    } catch (error) {
        console.error(`Error fetching payment records for fee ${feeId}:`, error);
        throw new Error(error.response?.data?.message || 'Failed to fetch payment records');
    }
};

// 🔄 Check and update fee status based on payment verification
export const checkPaymentStatusAndUpdateFee = async (feeId, studentId) => {
    try {
        // Get payment records for this fee
        const paymentRecords = await getPaymentRecordsByFeeId(feeId);
        
        // Check if any payments are verified
        const verifiedPayments = paymentRecords.filter(payment => payment.status === 'Verified');
        
        if (verifiedPayments.length > 0) {
            // Refresh fee data to get updated status
            const updatedFees = await refreshStudentFeeData(studentId);
            console.log(`Fee status updated for student ${studentId} based on verified payments`);
            return updatedFees;
        }
        
        return null;
    } catch (error) {
        console.error(`Error checking payment status for fee ${feeId}:`, error);
        throw error;
    }
};

export default {
    fetchAllFees,
    fetchStudentFees,
    fetchFeeById,
    createFeeRecord,
    updateFeeRecord,
    deleteFeeRecord,
    submitTermPayment,
    fetchParentChildrenWithFees,
    getFeeStatistics,
    refreshStudentFeeData,
    getMyPaymentRecords,
    feeExamples
}; 