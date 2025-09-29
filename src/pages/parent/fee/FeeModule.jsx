import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    CreditCard,
    Banknote,
    QrCode,
    Loader2,
    CheckCircle,
    IndianRupee,
    AlertCircle,
    User,
    Clipboard,
    GraduationCap,
    Download
} from 'lucide-react';
import { FaUsers, FaCheckCircle } from "react-icons/fa";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import { 
    fetchParentChildrenWithFees, 
    submitTermPayment, 
    refreshStudentFeeData,
    getPaymentRecordsByFeeId,
    checkPaymentStatusAndUpdateFee,
    getMyPaymentRecords
} from '../../../utils/feeUtils';

// Import QR code images directly since they are in the same folder

// import upiQrCode from './upi_qr.png'; // This import is no longer strictly needed if using bank-specific QRs for UPI

// The variable name must be prefixed with VITE_ for Vite to expose it to the client-side.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const FeeModule = () => {
    const { user } = useAuth();
    
    // State for parent and children data
    const [parentInfo, setParentInfo] = useState({ children: [] });
    const [allStudentFeeData, setAllStudentFeeData] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [debugMode, setDebugMode] = useState(false);
    const [paymentStatusPolling, setPaymentStatusPolling] = useState(false);
    const [notification, setNotification] = useState(null);

    // Helper function to get auth headers
    const getAuthHeaders = () => {
        const token = JSON.parse(localStorage.getItem('authToken'));
        return token ? { Authorization: `Bearer ${token}` } : {};
    };

    // Function to fetch parent's children and their fee data using utility functions
    const fetchParentData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Test: Check if there are any fee records at all (for debugging)
            try {
                const allFeesResponse = await axios.get(`${API_BASE_URL}/api/fees`, {
                    headers: getAuthHeaders(),
                });
                // console.log('All fees in database:', allFeesResponse.data);
                // console.log('Total fee records:', allFeesResponse.data.length);
            } catch (allFeesError) {
                console.log('Could not fetch all fees (expected for parent role):', allFeesError.message);
            }

            // Use the utility function to fetch parent children with fees
            const childrenWithFees = await fetchParentChildrenWithFees();
            // console.log('Children with fees:', childrenWithFees);

            // Transform students data to match the expected format
            const children = childrenWithFees.map(({ student }) => ({
                id: student._id,
                name: student.full_name,
                rollNumber: student.admission_number,
                studentId: student.user_id,
                class: student.class_id?.class_name || student.class_id || 'N/A',
                section: student.section || 'N/A',
                profilePic: student.profile_image,
            }));

            // console.log('Transformed children:', children);
            setParentInfo({ children });

            // Transform fee data to match frontend format
            const transformedFeeData = {};
            
            // Process each child's fees and check PaymentDetails status
            for (const { student, fees } of childrenWithFees) {
                const feeTerms = [];
                
                // Process each fee record for the child
                for (const feeRecord of fees) {
                    // Check PaymentDetails status for this fee
                    let paymentDetailsStatus = null;
                    try {
                        const paymentRecords = await getPaymentRecordsByFeeId(feeRecord._id || feeRecord.id);
                        paymentDetailsStatus = paymentRecords;
                    } catch (error) {
                        console.log(`No payment records found for fee ${feeRecord._id || feeRecord.id}`);
                    }
                    
                    // Helper function to get status and payment details based on PaymentDetails
                    const getStatusAndPaymentDetails = (termKey, defaultStatus, defaultPaymentDate, defaultPaymentMethod) => {
                        if (!paymentDetailsStatus || paymentDetailsStatus.length === 0) {
                            return {
                                status: defaultStatus,
                                paymentDate: defaultPaymentDate,
                                paymentMethod: defaultPaymentMethod
                            };
                        }
                        
                        // Find verified payment for this term
                        const verifiedPayment = paymentDetailsStatus.find(payment => 
                            payment.term === termKey && payment.status === 'Verified'
                        );
                        
                        if (verifiedPayment) {
                            return {
                                status: 'Paid',
                                paymentDate: verifiedPayment.payment_date ? new Date(verifiedPayment.payment_date).toISOString().split('T')[0] : defaultPaymentDate,
                                paymentMethod: verifiedPayment.payment_method || defaultPaymentMethod
                            };
                        }
                        
                        // Find pending payment for this term
                        const pendingPayment = paymentDetailsStatus.find(payment => 
                            payment.term === termKey && payment.status === 'Pending'
                        );
                        
                        if (pendingPayment) {
                            return {
                                status: 'Pending',
                                paymentDate: pendingPayment.payment_date ? new Date(pendingPayment.payment_date).toISOString().split('T')[0] : defaultPaymentDate,
                                paymentMethod: pendingPayment.payment_method || defaultPaymentMethod
                            };
                        }
                        
                        return {
                            status: defaultStatus,
                            paymentDate: defaultPaymentDate,
                            paymentMethod: defaultPaymentMethod
                        };
                    };
                    
                    // Map backend fee structure to frontend format for all three terms
                    // Always create all three terms, even if they don't exist in the backend
                    
                    // First Term
                    const firstTermDefaultStatus = feeRecord.first_term?.status || feeRecord.term1Status || 'Due';
                    const firstTermDefaultPaymentDate = feeRecord.first_term?.payment_date ? new Date(feeRecord.first_term.payment_date).toISOString().split('T')[0] : feeRecord.term1PaymentDate || '';
                    const firstTermDefaultPaymentMethod = feeRecord.first_term?.payment_method || feeRecord.term1PaymentMethod || '';
                    const firstTermDetails = getStatusAndPaymentDetails('first', firstTermDefaultStatus, firstTermDefaultPaymentDate, firstTermDefaultPaymentMethod);
                    
                    feeTerms.push({
                        term: '1st Term',
                        feeType: 'Tuition Fee',
                        amount: feeRecord.first_term?.amount_due || feeRecord.term1Amount || 0,
                        dueDate: feeRecord.first_term?.due_date ? new Date(feeRecord.first_term.due_date).toISOString().split('T')[0] : 
                                feeRecord.term1DueDate || '',
                        status: firstTermDetails.status,
                        paymentDate: firstTermDetails.paymentDate,
                        paymentMethod: firstTermDetails.paymentMethod,
                        receiptUrl: feeRecord.first_term?.receipt_url || '',
                        feeId: feeRecord._id || feeRecord.id, // Store fee record ID for payment submission
                        termKey: 'first' // Backend term key
                    });
                    
                    // Second Term
                    const secondTermDefaultStatus = feeRecord.second_term?.status || feeRecord.term2Status || 'Due';
                    const secondTermDefaultPaymentDate = feeRecord.second_term?.payment_date ? new Date(feeRecord.second_term.payment_date).toISOString().split('T')[0] : feeRecord.term2PaymentDate || '';
                    const secondTermDefaultPaymentMethod = feeRecord.second_term?.payment_method || feeRecord.term2PaymentMethod || '';
                    const secondTermDetails = getStatusAndPaymentDetails('second', secondTermDefaultStatus, secondTermDefaultPaymentDate, secondTermDefaultPaymentMethod);
                    
                    feeTerms.push({
                        term: '2nd Term',
                        feeType: 'Tuition Fee',
                        amount: feeRecord.second_term?.amount_due || feeRecord.term2Amount || 0,
                        dueDate: feeRecord.second_term?.due_date ? new Date(feeRecord.second_term.due_date).toISOString().split('T')[0] : 
                                feeRecord.term2DueDate || '',
                        status: secondTermDetails.status,
                        paymentDate: secondTermDetails.paymentDate,
                        paymentMethod: secondTermDetails.paymentMethod,
                        receiptUrl: feeRecord.second_term?.receipt_url || '',
                        feeId: feeRecord._id || feeRecord.id, // Store fee record ID for payment submission
                        termKey: 'second' // Backend term key
                    });
                    
                    // Third Term
                    const thirdTermDefaultStatus = feeRecord.third_term?.status || feeRecord.term3Status || 'Due';
                    const thirdTermDefaultPaymentDate = feeRecord.third_term?.payment_date ? new Date(feeRecord.third_term.payment_date).toISOString().split('T')[0] : feeRecord.term3PaymentDate || '';
                    const thirdTermDefaultPaymentMethod = feeRecord.third_term?.payment_method || feeRecord.term3PaymentMethod || '';
                    const thirdTermDetails = getStatusAndPaymentDetails('third', thirdTermDefaultStatus, thirdTermDefaultPaymentDate, thirdTermDefaultPaymentMethod);
                    
                    feeTerms.push({
                        term: '3rd Term',
                        feeType: 'Tuition Fee',
                        amount: feeRecord.third_term?.amount_due || feeRecord.term3Amount || 0,
                        dueDate: feeRecord.third_term?.due_date ? new Date(feeRecord.third_term.due_date).toISOString().split('T')[0] : 
                                feeRecord.term3DueDate || '',
                        status: thirdTermDetails.status,
                        paymentDate: thirdTermDetails.paymentDate,
                        paymentMethod: thirdTermDetails.paymentMethod,
                        receiptUrl: feeRecord.third_term?.receipt_url || '',
                        feeId: feeRecord._id || feeRecord.id, // Store fee record ID for payment submission
                        termKey: 'third' // Backend term key
                    });
                }
                
                transformedFeeData[student._id] = feeTerms;
                // console.log(`Fee terms for student ${student._id}:`, feeTerms);
            }

            // console.log('Final transformed fee data:', transformedFeeData);
            setAllStudentFeeData(transformedFeeData);
            
            // Set first child as selected if available
            if (children.length > 0) {
                setSelectedChildId(children[0].id);
            }
        } catch (err) {
            console.error('Error fetching parent data:', err);
            setError('Failed to load fee data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

        // Fetch parent's children and their fee data on component mount
    useEffect(() => {
        fetchParentData();
    }, []);

    const [selectedChildId, setSelectedChildId] = useState(null);
    const [selectedTerms, setSelectedTerms] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState('');
    const [selectedBank, setSelectedBank] = useState(''); // Stores the currently selected bank for QR display
    const [selectedGateway, setSelectedGateway] = useState('');
    const [transactionId, setTransactionId] = useState('');
    const [transactionIdSubmitted, setTransactionIdSubmitted] = useState(false);
    const [showReceipt, setShowReceipt] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [amountPaidForReceipt, setAmountPaidForReceipt] = useState(0);

    // New state for randomly selected UPI bank details
    const [randomUpiBank, setRandomUpiBank] = useState(null);
    const [copiedText, setCopiedText] = useState(''); // State to show 'Copied!' feedback

    // State for unique Invoice ID
    const [invoiceId, setInvoiceId] = useState('');

    // New state to store terms paid in the current transaction for receipt
    const [termsPaidInCurrentTransaction, setTermsPaidInCurrentTransaction] = useState([]);

    // New state to store recent payment history
    const [recentPayments, setRecentPayments] = useState([]);
    const [bankDetails, setBankDetails] = useState([]);


    const receiptRef = useRef(); // This ref is now only for the *current* transaction's receipt preview

    useEffect(() => {
        if (parentInfo.children && parentInfo.children.length > 0) {
            setSelectedChildId(parentInfo.children[0].id);
        }
    }, [parentInfo.children]);

    // Fetching Bank details
    useEffect(() => {
        const fetchBankDetails = async () => {
            const response = await axios.get(`${API_BASE_URL}/api/bank/under-my-admin`, {
                headers: getAuthHeaders(),
            });
            console.log('Bank details:', response.data);
            setBankDetails(response.data);
        };
        fetchBankDetails();
    }, []);

    // Fetching Recent Payments
    useEffect(() => {
        const fetchRecentPayments = async () => {
            try {
                console.log('Fetching recent payments for user:', user);
                if (user && user.role === 'parent') {
                    console.log('User is parent, fetching payment records...');
                    const paymentRecords = await getMyPaymentRecords();
                    console.log('Payment records fetched:', paymentRecords);
                    
                    // Transform payment records to match the frontend format
                    const transformedPayments = paymentRecords.map(record => ({
                        invoiceId: record.invoice_id || `INV-${record._id}`,
                        studentId: record.student_id?._id || record.student_id,
                        studentName: record.student_id?.full_name || record.student_name || 'Unknown Student',
                        transactionId: record.transaction_id,
                        amount: record.amount_paid || 0,
                        paymentDate: record.payment_date || new Date().toISOString(),
                        paymentMethod: record.payment_method || 'Unknown',
                        termsPaid: record.term ? [{ term: record.term, feeType: 'Tuition Fee', amount: record.amount_paid || 0 }] : [],
                        status: record.status || 'Verification Pending'
                    }));
                    
                    console.log('Transformed payments:', transformedPayments);
                    setRecentPayments(transformedPayments);
                } else {
                    console.log('User not ready or not parent:', user);
                }
            } catch (error) {
                console.error('Error fetching recent payments:', error);
                // Don't set error state here as it's not critical for the main functionality
            }
        };
        
        console.log('useEffect triggered for recent payments, user:', user, 'loading:', loading);
        // Fetch recent payments when user is ready and not loading, or when loading changes from true to false
        if (user && user.role === 'parent' && !loading) {
            fetchRecentPayments();
        }
    }, [user?.role, loading]); // Added loading as dependency to ensure it runs after parent data is loaded

    // Additional effect to ensure recent payments are fetched on component mount if user is already loaded
    useEffect(() => {
        const fetchRecentPaymentsOnMount = async () => {
            try {
                // Check if user is already loaded from localStorage
                const token = localStorage.getItem('authToken');
                const role = localStorage.getItem('authRole');
                
                if (token && role && JSON.parse(role) === 'parent' && !loading) {
                    console.log('User already loaded on mount, fetching recent payments...');
                    const paymentRecords = await getMyPaymentRecords();
                    
                    const transformedPayments = paymentRecords.map(record => ({
                        invoiceId: record.invoice_id || `INV-${record._id}`,
                        studentId: record.student_id?._id || record.student_id,
                        studentName: record.student_id?.full_name || record.student_name || 'Unknown Student',
                        transactionId: record.transaction_id,
                        amount: record.amount_paid || 0,
                        paymentDate: record.payment_date || new Date().toISOString(),
                        paymentMethod: record.payment_method || 'Unknown',
                        termsPaid: record.term ? [{ term: record.term, feeType: 'Tuition Fee', amount: record.amount_paid || 0 }] : [],
                        status: record.status || 'Verification Pending'
                    }));
                    
                    setRecentPayments(transformedPayments);
                }
            } catch (error) {
                console.error('Error fetching recent payments on mount:', error);
            }
        };
        
        fetchRecentPaymentsOnMount();
    }, []); // Run only on component mount

    // Effect to set random UPI bank details when UPI is selected
    useEffect(() => {
        if (paymentMethod === 'UPI') {
            const banks = bankDetails.map(bank => ({
                name: bank.bankName,
                qrCode: bank.qrFileName,
                accountName: bank.accountHolderName,
                accountNumber: bank.accountNumber,
                ifscCode: bank.ifscCode,
                upiId: bank.upiId
            }));

            const randomIndex = Math.floor(Math.random() * banks.length);
            setRandomUpiBank(banks[randomIndex]);
        } else {
            setRandomUpiBank(null); // Clear when UPI is not selected
        }
    }, [paymentMethod]);


    const studentData = useMemo(() => {
        return parentInfo.children.find(child => child.id === selectedChildId);
    }, [selectedChildId, parentInfo.children]);

    const feeDetails = useMemo(() => {
        // console.log('Selected child ID:', selectedChildId);
        // console.log('All student fee data:', allStudentFeeData);
        const details = allStudentFeeData[selectedChildId] || [];
        // console.log('Fee details for selected child:', details);
        return details;
    }, [selectedChildId, allStudentFeeData]);

    const totalAmountToPay = useMemo(() => {
        return feeDetails
            .filter(fee => selectedTerms.includes(fee.term))
            .reduce((sum, fee) => sum + fee.amount, 0);
    }, [selectedTerms, feeDetails]);


    const handleTermSelect = (term) => {
        setPaymentMethod('');
        setSelectedBank('');
        setSelectedGateway('');
        setTransactionId('');
        setTransactionIdSubmitted(false);
        setShowReceipt(false);
        setPaymentSuccess(false);
        setAmountPaidForReceipt(0);
        setCopiedText(''); // Clear copied text feedback
        setInvoiceId(''); // Clear invoice ID when terms change
        setTermsPaidInCurrentTransaction([]); // Clear terms paid in current transaction

        setSelectedTerms(prevSelectedTerms => {
            if (prevSelectedTerms.includes(term)) {
                return prevSelectedTerms.filter(t => t !== term);
            } else {
                return [...prevSelectedTerms, term];
            }
        });
    };

    const handleChildSelect = (childId) => {
        setSelectedChildId(childId);
        setSelectedTerms([]);
        setPaymentMethod('');
        setSelectedBank('');
        setSelectedGateway('');
        setTransactionId('');
        setTransactionIdSubmitted(false);
        setShowReceipt(false);
        setPaymentSuccess(false);
        setIsProcessing(false);
        setAmountPaidForReceipt(0);
        setRandomUpiBank(null); // Clear random UPI bank when child changes
        setCopiedText(''); // Clear copied text feedback
        setInvoiceId(''); // Clear invoice ID when child changes
        setTermsPaidInCurrentTransaction([]); // Clear terms paid in current transaction
    };

    // Function to generate a unique invoice ID
    const generateInvoiceId = () => {
        // Simple unique ID based on timestamp and a random string
        return `INV-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    };

    // Refactored downloadReceipt to take payment data
    const downloadPaymentReceipt = async (paymentData) => {
        // Validate payment data
        if (!paymentData || !paymentData.invoiceId || !paymentData.studentName || !paymentData.amount) {
            console.error("Invalid payment data for receipt generation:", paymentData);
            alert("Could not generate receipt: Invalid payment data.");
            return;
        }

        // Find student info using the studentId from payment data
        // The studentId in paymentData is the MongoDB ID of the student
        const studentInfo = parentInfo.children.find(child => child.id === paymentData.studentId);
        if (!studentInfo) {
            console.error("Student data not found for receipt generation. Payment data:", paymentData);
            console.error("Available children:", parentInfo.children);
            alert("Could not generate receipt: Student data missing.");
            return;
        }

        // Create a temporary div to render the receipt content
        const receiptContentDiv = document.createElement('div');
        receiptContentDiv.style.width = '210mm'; // A4 width
        receiptContentDiv.style.padding = '20mm'; // Some padding
        receiptContentDiv.style.boxSizing = 'border-box';
        receiptContentDiv.style.background = 'white';
        receiptContentDiv.style.fontFamily = 'sans-serif'; // Ensure font is consistent

        // Construct the inner HTML for the receipt
        receiptContentDiv.innerHTML = `
            <div style="text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 1rem; margin-bottom: 1rem;">
                <div style="font-size: 2.25rem; font-weight: 800; color: #4338ca; margin-bottom: 0.5rem;">School Name</div>
                <p style="font-size: 0.875rem; color: #4b5563; margin-bottom: 0.25rem;">123 School Lane, Education City, 560001</p>
                <p style="font-size: 0.875rem; color: #4b5563;">contact@schoolname.edu | +91-9876543210</p>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h3 style="font-size: 1.5rem; font-weight: 700; color: #1f2937;">Payment Receipt</h3>
                <div style="text-align: right;">
                    <p style="font-size: 0.875rem; font-weight: 600; color: #374151;">Invoice ID:</p>
                    <p style="font-size: 1.125rem; font-weight: 800; color: #2563eb;">${paymentData.invoiceId}</p>
                </div>
            </div>

            <div style="margin-bottom: 1.5rem; padding: 1rem; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 0.5rem;">
                <h4 style="font-size: 1.125rem; font-weight: 600; color: #1f2937; margin-bottom: 0.75rem;">Student Details</h4>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; font-size: 0.875rem; color: #374151;">
                    <p><span style="font-weight: 500;">Name:</span> ${paymentData.studentName}</p>
                    <p><span style="font-weight: 500;">Student ID:</span> ${paymentData.studentId}</p>
                    <p><span style="font-weight: 500;">Class:</span> ${studentInfo ? `${studentInfo.class}-${studentInfo.section}` : 'N/A'}</p>
                </div>
            </div>

            <div style="margin-bottom: 1.5rem; padding: 1rem; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 0.5rem;">
                <h4 style="font-size: 1.125rem; font-weight: 600; color: #1f2937; margin-bottom: 0.75rem;">Payment Information</h4>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; font-size: 0.875rem; color: #374151;">
                    <p><span style="font-weight: 500;">Payment Date:</span> ${paymentData.paymentDate ? new Date(paymentData.paymentDate).toLocaleDateString() : 'N/A'}</p>
                    <p><span style="font-weight: 500;">Payment Method:</span> ${paymentData.paymentMethod || 'Unknown'}</p>
                    <p style="grid-column: span 2;"><span style="font-weight: 500;">Transaction ID:</span> <span style="font-family: monospace; color: #1f2937;">${paymentData.transactionId || 'N/A'}</span></p>
                </div>
            </div>

            <div style="margin-bottom: 1.5rem;">
                <h4 style="font-weight: 600; color: #1f2937; font-size: 1.125rem; margin-bottom: 0.75rem;">Terms with Payment Under Verification:</h4>
                <ul style="list-style: disc; padding-left: 1.25rem; font-size: 1rem; color: #374151; margin-top: 0;">
                    ${(paymentData.termsPaid || []).map(term => `
                        <li>${term.term || 'Unknown Term'} - ${term.feeType || 'Tuition Fee'}: <span style="font-weight: 700;">₹${(term.amount || 0).toLocaleString()}</span></li>
                    `).join('')}
                </ul>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 1rem; border-top: 2px solid #d1d5db;">
                <span style="font-size: 1.25rem; font-weight: 700; color: #1f2937;">Total Amount Paid (Under Verification):</span>
                <span style="font-size: 1.5rem; font-weight: 800; color: #10b981;">₹${paymentData.amount.toLocaleString()}</span>
            </div>

            <div style="margin-top: 2rem; text-align: center; color: #6b7280; font-size: 0.875rem;">
                <p>Thank you for your timely payment!</p>
                <p style="margin-top: 0.5rem;">This is a system-generated receipt and does not require a signature.</p>
            </div>
        `;

        // Append to body temporarily for html2canvas to render
        document.body.appendChild(receiptContentDiv);

        try {
            console.log("Starting PDF generation for payment:", paymentData);
            const canvas = await html2canvas(receiptContentDiv, { scale: 2 });
            console.log("Canvas generated successfully");
            const imgData = canvas.toDataURL('image/png');
            console.log("Image data generated");
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 210;
            const pageHeight = 297;
            const imgHeight = canvas.height * imgWidth / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }
            const filename = `Fee_Payment_Receipt_${paymentData.studentName.replace(/\s/g, '_')}_${paymentData.invoiceId}.pdf`;
            console.log("Saving PDF as:", filename);
            pdf.save(filename);
            console.log("PDF saved successfully");
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Failed to generate PDF receipt. Please try again.");
        } finally {
            // Clean up: remove the temporary div
            document.body.removeChild(receiptContentDiv);
        }
    };


    const generateUpiDeepLink = () => {
        if (totalAmountToPay === 0) {
            alert('Please select terms to pay before generating UPI link.');
            return '#';
        }
        // Use the UPI ID from the randomly selected bank
        const payeeUpiId = randomUpiBank ? randomUpiBank.upiId : 'schoolname@upi'; // Fallback to generic if not set
        const payeeName = encodeURIComponent('School Name Fees');
        const transactionRef = `FEE${studentData.studentId}${Date.now()}`;
        const transactionNote = encodeURIComponent(`Fee Payment for ${studentData.name} - Terms: ${selectedTerms.join(', ')}`);

        const upiLink = `upi://pay?pa=${payeeUpiId}&pn=${payeeName}&am=${totalAmountToPay}.00&cu=INR&tr=${transactionRef}&tn=${transactionNote}`;
        return upiLink;
    };

    // Function to copy text to clipboard
    const copyToClipboard = (text, identifier) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedText(identifier);
            setTimeout(() => setCopiedText(''), 2000); // Clear feedback after 2 seconds
        }).catch(err => {
            console.error('Failed to copy: ', err);
            alert('Failed to copy text. Please copy manually.');
        });
    };

    // Function to submit payment to backend using utility functions
    const submitPaymentToBackend = async (paymentData) => {
        try {
            // Validate user data
            if (!user || !user.profile) {
                throw new Error('User information not available. Please log in again.');
            }

            // Get the fee details for the selected child
            const feeDetails = allStudentFeeData[selectedChildId] || [];
            
            // Group selected terms by fee record ID to handle multiple fee records
            const termsByFeeId = {};
            
            selectedTerms.forEach(termName => {
                const termData = feeDetails.find(fee => fee.term === termName);
                if (termData) {
                    if (!termsByFeeId[termData.feeId]) {
                        termsByFeeId[termData.feeId] = [];
                    }
                    termsByFeeId[termData.feeId].push(termData);
                }
            });

            // Submit payment for each fee record
            for (const [feeId, terms] of Object.entries(termsByFeeId)) {
                // Calculate amount per term for this fee record
                const amountPerTerm = paymentData.amount / terms.length;
                
                for (const termData of terms) {
                    // Get user ID with fallbacks
                    const userId = user.profile._id || user.profile.id || user.profile.userId;
                    if (!userId) {
                        throw new Error('Unable to identify user. Please log in again.');
                    }

                    // Get user name with fallbacks
                    const userName = user.profile.full_name || user.profile.name || user.profile.username || user.profile.email || 'Parent';

                    const paymentPayload = {
                        term: termData.termKey, // Use the backend term key
                        amount_paid: amountPerTerm,
                        payment_date: new Date().toISOString(),
                        payment_method: paymentData.paymentMethod,
                        transaction_id: paymentData.transactionId,
                        invoice_id: paymentData.invoiceId,
                        paid_by: userId,
                        paid_by_name: userName,
                        paid_by_role: 'parent'
                    };

                    // console.log('User object for payment:', user);
                    // console.log('Payment payload:', paymentPayload);

                    // console.log('Submitting payment payload:', paymentPayload);
                    await submitTermPayment(feeId, paymentPayload);
                }
            }

            // Refresh fee data after successful payment
            await fetchParentData();
            
            // Start polling for payment status changes
            startPaymentStatusPolling();
            
        } catch (err) {
            console.error('Error submitting payment to backend:', err);
            console.error('Error response:', err.response);
            console.error('Error status:', err.response?.status);
            console.error('Error data:', err.response?.data);
            throw new Error(err.response?.data?.message || err.message || 'Failed to submit payment. Please try again.');
        }
    };

    // Function to check payment status and update fee data
    const checkPaymentStatusAndUpdateFees = async () => {
        try {
            if (!parentInfo.children.length) return;

            let hasUpdates = false;
            let verifiedPayments = [];
            
            // Check each child's fee data for payment status changes
            for (const child of parentInfo.children) {
                const childFeeData = allStudentFeeData[child.id] || [];
                
                for (const feeTerm of childFeeData) {
                    if (feeTerm.feeId) {
                        try {
                            const paymentRecords = await getPaymentRecordsByFeeId(feeTerm.feeId);
                            const verifiedPaymentsForTerm = paymentRecords.filter(payment => 
                                payment.status === 'Verified' && 
                                payment.term === feeTerm.termKey
                            );
                            
                            // If there are verified payments for this term, refresh the fee data
                            if (verifiedPaymentsForTerm.length > 0) {
                                console.log(`Found verified payment for fee ${feeTerm.feeId}, term ${feeTerm.termKey}`);
                                hasUpdates = true;
                                verifiedPayments.push({
                                    childName: child.name,
                                    term: feeTerm.term,
                                    amount: verifiedPaymentsForTerm[0].amount_paid
                                });
                            }
                        } catch (error) {
                            console.error(`Error checking payment status for fee ${feeTerm.feeId}:`, error);
                        }
                    }
                }
            }
            
            // If there are updates, refresh all fee data and show notification
            if (hasUpdates) {
                console.log('Payment status changes detected, refreshing fee data...');
                await fetchParentData();
                
                // Show notification for verified payments
                if (verifiedPayments.length > 0) {
                    const message = verifiedPayments.map(payment => 
                        `${payment.childName}'s ${payment.term} payment (₹${payment.amount}) has been verified!`
                    ).join('\n');
                    
                    setNotification({
                        type: 'success',
                        message: message,
                        title: 'Payment Verified!'
                    });
                    
                    // Auto-hide notification after 5 seconds
                    setTimeout(() => {
                        setNotification(null);
                    }, 5000);
                }
            }
        } catch (error) {
            console.error('Error checking payment status:', error);
        }
    };

    // Function to start polling for payment status changes
    const startPaymentStatusPolling = () => {
        if (paymentStatusPolling) return null; // Already polling
        
        setPaymentStatusPolling(true);
        console.log('Starting payment status polling...');
        
        // Poll every 30 seconds for payment status changes
        const pollInterval = setInterval(async () => {
            await checkPaymentStatusAndUpdateFees();
        }, 30000); // 30 seconds
        
        // Store the interval ID for cleanup
        return pollInterval;
    };

    // Function to stop polling
    const stopPaymentStatusPolling = () => {
        setPaymentStatusPolling(false);
        console.log('Stopping payment status polling...');
    };

    // useEffect to start polling when component mounts and clean up on unmount
    useEffect(() => {
        let pollInterval;
        
        // Start polling after initial data load
        if (parentInfo.children.length > 0 && !paymentStatusPolling) {
            pollInterval = startPaymentStatusPolling();
        }
        
        // Cleanup function
        return () => {
            if (pollInterval) {
                clearInterval(pollInterval);
            }
            stopPaymentStatusPolling();
        };
    }, [parentInfo.children.length, paymentStatusPolling]);


    // Loading state
    if (loading) {
        return (
            <div className="px-0 sm:px-2 md:px-4 lg:p-6 flex flex-col gap-2 sm:gap-4 lg:gap-8">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center gap-2 mb-4 sm:mb-0 text-center sm:text-left">
                    <IndianRupee className="mr-3 text-indigo-600 size-7 sm:size-8" />
                    Fee Payment Portal
                </h1>
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="flex items-center gap-3 text-gray-600">
                        <Loader2 size={24} className="animate-spin" />
                        <span>Loading fee data...</span>
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="px-0 sm:px-2 md:px-4 lg:p-6 flex flex-col gap-2 sm:gap-4 lg:gap-8">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center gap-2 mb-4 sm:mb-0 text-center sm:text-left">
                    <IndianRupee className="mr-3 text-indigo-600 size-7 sm:size-8" />
                    Fee Payment Portal
                </h1>
                <div className="bg-red-50 p-4 rounded-lg text-red-800 flex items-center justify-center mb-6 shadow-sm text-sm sm:text-base">
                    <AlertCircle className="mr-2" size={20} />
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="px-0 sm:px-2 md:px-4 lg:p-6 flex flex-col gap-2 sm:gap-4 lg:gap-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-4 sm:mb-0">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center gap-2 text-center sm:text-left">
                    <IndianRupee className="mr-3 text-indigo-600 size-7 sm:size-8" />
                    Fee Payment Portal
                </h1>
                <div className="flex items-center gap-2">
                    <button
                        onClick={async () => {
                            try {
                                setLoading(true);
                                await checkPaymentStatusAndUpdateFees();
                                await fetchParentData();
                            } catch (error) {
                                console.error('Error refreshing payment status:', error);
                            } finally {
                                setLoading(false);
                            }
                        }}
                        disabled={loading}
                        className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                        <Loader2 size={16} className={loading ? "animate-spin" : ""} />
                        {loading ? "Refreshing..." : "Refresh Status"}
                    </button>
                </div>
            </div>

            {/* Notification */}
            {notification && (
                <div className={`p-4 rounded-lg mb-4 shadow-lg ${
                    notification.type === 'success' 
                        ? 'bg-green-50 border border-green-200 text-green-800' 
                        : 'bg-red-50 border border-red-200 text-red-800'
                }`}>
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                            <CheckCircle 
                                size={20} 
                                className={`mt-0.5 ${
                                    notification.type === 'success' ? 'text-green-600' : 'text-red-600'
                                }`} 
                            />
                            <div>
                                <h4 className="font-semibold text-sm">
                                    {notification.title}
                                </h4>
                                <p className="text-sm mt-1 whitespace-pre-line">
                                    {notification.message}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setNotification(null)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}

            {/* Debug Panel */}
            {debugMode && (
                <div className="bg-gray-100 p-4 rounded-lg mb-4 text-xs">
                    <h3 className="font-bold mb-2">Debug Information:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <strong>Parent Info:</strong>
                            <pre className="bg-white p-2 rounded mt-1 overflow-auto max-h-32">
                                {JSON.stringify(parentInfo, null, 2)}
                            </pre>
                        </div>
                        <div>
                            <strong>All Student Fee Data:</strong>
                            <pre className="bg-white p-2 rounded mt-1 overflow-auto max-h-32">
                                {JSON.stringify(allStudentFeeData, null, 2)}
                            </pre>
                        </div>
                        <div>
                            <strong>Selected Child ID:</strong>
                            <pre className="bg-white p-2 rounded mt-1">
                                {selectedChildId}
                            </pre>
                        </div>
                        <div>
                            <strong>Fee Details for Selected Child:</strong>
                            <pre className="bg-white p-2 rounded mt-1 overflow-auto max-h-32">
                                {JSON.stringify(feeDetails, null, 2)}
                            </pre>
                        </div>
                        <div>
                            <strong>User Object:</strong>
                            <pre className="bg-white p-2 rounded mt-1 overflow-auto max-h-32">
                                {JSON.stringify(user, null, 2)}
                            </pre>
                        </div>
                        <div>
                            <strong>User Profile:</strong>
                            <pre className="bg-white p-2 rounded mt-1 overflow-auto max-h-32">
                                {JSON.stringify(user?.profile, null, 2)}
                            </pre>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-300">
                        <h4 className="font-bold mb-2">Debug Actions:</h4>
                        <div className="flex gap-2">
                            <button
                                onClick={async () => {
                                    try {
                                        const response = await axios.post(`${API_BASE_URL}/api/fees/create-sample`, {}, {
                                            headers: getAuthHeaders(),
                                        });
                                        alert(`Created ${response.data.fees.length} sample fee records`);
                                        fetchParentData();
                                    } catch (error) {
                                        alert('Failed to create sample fees: ' + error.message);
                                    }
                                }}
                                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
                            >
                                Create Sample Fees
                            </button>
                            <button
                                onClick={() => {
                                    console.log('Current state:', {
                                        parentInfo,
                                        allStudentFeeData,
                                        selectedChildId,
                                        feeDetails
                                    });
                                }}
                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                            >
                                Log State
                            </button>
                            <button
                                onClick={async () => {
                                    try {
                                        const response = await axios.get(`${API_BASE_URL}/api/fees`, {
                                            headers: getAuthHeaders(),
                                        });
                                        // console.log('All fees in database:', response.data);
                                        alert(`Found ${response.data.length} fee records in database`);
                                    } catch (error) {
                                        console.error('Error fetching fees:', error);
                                        alert('Error fetching fees: ' + error.response?.data?.message || error.message);
                                    }
                                }}
                                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
                            >
                                Check Fees
                            </button>
                            <button
                                onClick={() => {
                                    console.log('User object:', user);
                                    console.log('User profile:', user?.profile);
                                    console.log('User ID:', user?.profile?.id);
                                    console.log('User _id:', user?.profile?._id);
                                    console.log('User object keys:', Object.keys(user || {}));
                                    console.log('User profile keys:', Object.keys(user?.profile || {}));
                                }}
                                className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 text-xs"
                            >
                                Log User
                            </button>
                            <button
                                onClick={async () => {
                                    try {
                                        const testPayment = {
                                            fee_id: "507f1f77bcf86cd799439011", // Test ObjectId
                                            student_id: "507f1f77bcf86cd799439012", // Test ObjectId
                                            student_name: "Test Student",
                                            class: "10",
                                            section: "A",
                                            term: "first",
                                            term_name: "1st Term",
                                            amount_paid: 1000,
                                            payment_method: "Bank Transfer",
                                            transaction_id: "TEST" + Date.now(),
                                            invoice_id: "INV" + Date.now(),
                                            paid_by: user.profile?._id || user.profile?.id || "507f1f77bcf86cd799439013",
                                            paid_by_name: user.profile?.full_name || user.profile?.name || "Test Parent",
                                            paid_by_role: "parent"
                                        };
                                        
                                        const response = await axios.post(`${API_BASE_URL}/api/payment-details`, testPayment, {
                                            headers: getAuthHeaders(),
                                        });
                                        alert('Test payment created: ' + JSON.stringify(response.data));
                                    } catch (error) {
                                        alert('Test payment failed: ' + error.response?.data?.message || error.message);
                                    }
                                }}
                                className="px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 text-xs"
                            >
                                Test Payment
                            </button>
                            <button
                                onClick={async () => {
                                    try {
                                        // Test the fee payment endpoint directly
                                        const testFeePayment = {
                                            term: "first",
                                            amount_paid: 1000,
                                            payment_date: new Date().toISOString(),
                                            payment_method: "Bank Transfer",
                                            transaction_id: "TEST" + Date.now(),
                                            invoice_id: "INV" + Date.now(),
                                            paid_by: user.profile?._id || user.profile?.id || "507f1f77bcf86cd799439013",
                                            paid_by_name: user.profile?.full_name || user.profile?.name || "Test Parent",
                                            paid_by_role: "parent"
                                        };
                                        
                                        // Use a sample fee ID - you might need to replace this with a real one
                                        const sampleFeeId = "507f1f77bcf86cd799439011";
                                        
                                        const response = await axios.post(`${API_BASE_URL}/api/fees/${sampleFeeId}/pay-term`, testFeePayment, {
                                            headers: getAuthHeaders(),
                                        });
                                        alert('Test fee payment created: ' + JSON.stringify(response.data));
                                    } catch (error) {
                                        console.error('Test fee payment error:', error);
                                        alert('Test fee payment failed: ' + error.response?.data?.message || error.message);
                                    }
                                }}
                                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                            >
                                Test Fee Payment
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Children Selector */}
            <div className="bg-white p-4 rounded-xl shadow-md border border-gray-200 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {parentInfo.children.map(child => (
                        <div
                            key={child.id}
                            className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all duration-300 ease-in-out
                                    ${selectedChildId === child.id ? 'border-indigo-500 bg-indigo-50 shadow-md' : 'border-gray-200 bg-white hover:border-gray-400 hover:shadow-sm'}`}
                            onClick={() => handleChildSelect(child.id)}
                        >
                            <img
                                src={child.profilePic}
                                alt={child.name}
                                className="rounded-full mr-3 border border-gray-200"
                                style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                            />
                            <div className="flex-grow">
                                <h6 className="mb-0 font-semibold text-gray-800 text-base">{child.name}</h6>
                                <small className="text-gray-500 text-xs sm:text-sm">
                                    {child.grade} {child.rollNumber && `• Roll No: ${child.rollNumber}`}
                                </small>
                            </div>
                            {selectedChildId === child.id && (
                                <FaCheckCircle className="text-indigo-500 ml-auto" size={20} />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Display message if no child is selected or no children exist */}
            {!selectedChildId && (
                <div className="bg-blue-50 p-4 rounded-lg text-blue-800 flex items-center justify-center mb-6 shadow-sm text-sm sm:text-base">
                    <AlertCircle className="mr-2" size={20} />
                    Please select a child to view their fee details.
                </div>
            )}

            {selectedChildId && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                    {/* Left Section: Student Information & Fee Details */}
                    <div>
                        {/* Student Information */}
                        <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 mb-6 shadow-md">
                            <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-5 text-gray-800 flex items-center">
                                <User className="mr-2 text-blue-600 size-5 sm:size-6" /> Student Information
                            </h2>
                            <div className="space-y-3 sm:space-y-4">
                                <div className="flex items-center bg-gray-50 p-2 rounded-md border border-gray-200">
                                    <span className="text-sm sm:text-base text-gray-900 font-medium">{studentData.name}</span>
                                </div>
                                <div className="flex items-center bg-gray-50 p-2 rounded-md border border-gray-200">
                                    <Clipboard className="text-gray-500 mr-2 size-4 sm:size-5" />
                                    <span className="text-sm sm:text-base text-gray-900">ID: <span className="font-medium">{studentData.studentId}</span></span>
                                </div>
                                <div className="flex items-center bg-gray-50 p-2 rounded-md border border-gray-200">
                                    <GraduationCap className="text-gray-500 mr-2 size-4 sm:size-5" />
                                    <span className="text-sm sm:text-base text-gray-900">Class: <span className="font-medium">{studentData.class}-{studentData.section}</span></span>
                                </div>
                            </div>
                        </div>

                        {/* Selected Terms Summary */}
                        {selectedTerms.length > 0 && (
                            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-gray-200 mb-4">
                                <h3 className="text-lg font-semibold mb-3 flex items-center text-indigo-700">
                                    <CheckCircle className="mr-2 size-5" /> Selected Terms for Payment
                                </h3>
                                <div className="space-y-2">
                                    {selectedTerms.map(termName => {
                                        const termData = feeDetails.find(fee => fee.term === termName);
                                        return (
                                            <div key={termName} className="flex justify-between items-center p-2 bg-indigo-50 rounded-lg">
                                                <span className="font-medium text-indigo-800">{termName}</span>
                                                <span className="font-bold text-indigo-900">₹{termData?.amount.toLocaleString() || 0}</span>
                                            </div>
                                        );
                                    })}
                                    <div className="border-t border-indigo-200 pt-2 mt-3">
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-lg text-indigo-800">Total Amount:</span>
                                            <span className="font-bold text-xl text-indigo-900">₹{totalAmountToPay.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Fee Details List */}
                        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-gray-200">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg sm:text-xl font-semibold flex items-center">
                                    <Banknote className="mr-2 text-green-600 size-5 sm:size-6" /> Fee Details
                                </h2>
                                {feeDetails.filter(fee => fee.status === 'Due' || fee.status === 'Overdue').length > 0 && (
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-gray-500">
                                            {selectedTerms.length} of {feeDetails.filter(fee => fee.status === 'Due' || fee.status === 'Overdue').length} terms selected
                                        </span>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    const selectableTerms = feeDetails
                                                        .filter(fee => fee.status === 'Due' || fee.status === 'Overdue')
                                                        .map(fee => fee.term);
                                                    setSelectedTerms(selectableTerms);
                                                }}
                                                className="px-3 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                                            >
                                                Select All Due
                                            </button>
                                            <button
                                                onClick={() => setSelectedTerms([])}
                                                className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                                            >
                                                Clear All
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            {console.log('feeDetails length ', feeDetails.length)}
                            {feeDetails.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="text-gray-500 text-sm sm:text-base mb-4">
                                        No fee records found for this child.
                                    </div>
                                    <div className="text-xs text-gray-400 mb-4">
                                        This could mean:
                                        <ul className="list-disc list-inside mt-2 space-y-1">
                                            <li>Fee records haven't been created yet by the admin</li>
                                            <li>The student ID doesn't match the fee records</li>
                                            <li>There's a connection issue with the backend</li>
                                        </ul>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                                        <button
                                            onClick={fetchParentData}
                                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                                        >
                                            Refresh Data
                                        </button>
                                        <button
                                            onClick={() => {
                                                // Show instructions for admin
                                                alert('Please contact the school administrator to create fee records for your child. The admin can use the Fee Management module to add fee records.');
                                            }}
                                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                                        >
                                            Contact Admin
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                feeDetails.map((fee) => {
                                    return (
                                    <div
                                        key={fee.term}
                                        className={`border rounded-lg p-3 sm:p-4 mb-3 transition-all duration-200 ease-in-out transform hover:scale-[1.01]
                                                ${fee.status === 'Paid'
                                                ? 'bg-gradient-to-r from-green-50 to-green-100 border-green-200 text-gray-600 cursor-not-allowed opacity-90'
                                                : fee.status === 'Pending'
                                                    ? 'bg-yellow-50 border-yellow-200 text-gray-600 cursor-not-allowed opacity-90'
                                                    : fee.status === 'Overdue'
                                                        ? 'bg-red-50 border-red-200 text-gray-600 cursor-not-allowed opacity-90'
                                                        : 'bg-white cursor-pointer hover:shadow-md'
                                            } ${selectedTerms.includes(fee.term) ? 'border-indigo-500 bg-indigo-50 shadow-md ring-1 ring-indigo-500' : 'border-gray-200'}`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-start flex-grow">
                                                {/* Simple checkbox for testing */}
                                                <div className="mr-3 mt-1">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedTerms.includes(fee.term)}
                                                        onChange={() => handleTermSelect(fee.term)}
                                                        disabled={fee.status === 'Paid'}
                                                        className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2 cursor-pointer"
                                                        style={{ transform: 'scale(1.2)' }}
                                                    />
                                                    <span className="ml-2 text-xs">
                                                        {fee.status === 'Due' || fee.status === 'Overdue' ? 'Select' : ''}
                                                    </span>
                                                </div>
                                                
                                                <div className="flex-grow">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="font-medium text-sm sm:text-base text-gray-800">{fee.term} - {fee.feeType}</h3>
                                                        {selectedTerms.includes(fee.term) && (
                                                            <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">
                                                                Selected
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="space-y-1 text-xs sm:text-sm text-gray-600">
                                                        <p className={`${fee.status === 'Overdue' ? 'text-red-500 font-semibold' : ''}`}>
                                                            Due Date: {fee.dueDate || 'Not set'}
                                                        </p>
                                                        {fee.status === 'Paid' && fee.paymentDate && (
                                                            <p className="text-green-600">
                                                                Paid on: {fee.paymentDate}
                                                            </p>
                                                        )}
                                                        {fee.status === 'Paid' && fee.paymentMethod && (
                                                            <p className="text-green-600">
                                                                Method: {fee.paymentMethod}
                                                            </p>
                                                        )}
                                                        {fee.status === 'Overdue' && (
                                                            <p className="text-red-500 font-semibold">
                                                                ⚠️ This term is overdue
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="text-right flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-2">
                                                <p className="font-bold text-base sm:text-lg text-gray-900">₹{fee.amount.toLocaleString()}</p>
                                                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                                                    fee.status === 'Paid'
                                                        ? 'bg-green-200 text-green-800'
                                                        : fee.status === 'Overdue'
                                                            ? 'bg-red-200 text-red-800'
                                                            : fee.status === 'Pending'
                                                                ? 'bg-blue-200 text-blue-800'
                                                                : 'bg-yellow-200 text-yellow-800'
                                                    }`}>
                                                    {fee.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                                })
                            )}
                        </div>
                    </div>

                    {/* Right Section: Payment Method & Form */}
                    <div className="flex flex-col">
                        <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-5 text-gray-800 flex items-center">
                            <CreditCard className="mr-2 text-purple-600 size-5 sm:size-6" /> Payment Method
                        </h2>
                        <form onSubmit={(e) => e.preventDefault()} className="space-y-4 sm:space-y-6 flex-grow flex flex-col">
                            {/* Payment Method Buttons */}
                            <div className="space-y-3">
                                <button
                                    type="button"
                                    onClick={() => { setPaymentMethod('Bank Transfer'); setSelectedBank(''); setSelectedGateway(''); setTransactionId(''); setTransactionIdSubmitted(false); setAmountPaidForReceipt(0); setCopiedText(''); }}
                                    disabled={selectedTerms.length === 0 || isProcessing}
                                    className={`w-full p-3 sm:p-4 border rounded-lg flex items-center justify-start text-base sm:text-lg font-medium transition-all duration-200 transform hover:scale-[1.01]
                                            ${paymentMethod === 'Bank Transfer'
                                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md ring-1 ring-indigo-500'
                                            : 'border-gray-300 bg-white text-gray-800 hover:border-indigo-400 hover:shadow-sm'
                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    <Banknote className="mr-3 size-5 sm:size-6" />
                                    Bank Transfer
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setPaymentMethod('UPI'); setSelectedBank(''); setSelectedGateway(''); setTransactionId(''); setTransactionIdSubmitted(false); setAmountPaidForReceipt(0); setCopiedText(''); }}
                                    disabled={selectedTerms.length === 0 || isProcessing}
                                    className={`w-full p-3 sm:p-4 border rounded-lg flex items-center justify-start text-base sm:text-lg font-medium transition-all duration-200 transform hover:scale-[1.01]
                                            ${paymentMethod === 'UPI'
                                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md ring-1 ring-indigo-500'
                                            : 'border-gray-300 bg-white text-gray-800 hover:border-indigo-400 hover:shadow-sm'
                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    <QrCode className="mr-3 size-5 sm:size-6" />
                                    UPI
                                </button>
                            </div>

                            {/* Conditional sections based on payment method */}
                            {selectedTerms.length > 0 && (paymentMethod === 'Bank Transfer' || paymentMethod === 'UPI') && !paymentSuccess && (
                                <div className="space-y-4 sm:space-y-6 p-4 bg-gray-50 rounded-xl border border-gray-200 shadow-inner">
                                    {/* Bank Transfer QR Codes and Account Info */}
                                    {paymentMethod === 'Bank Transfer' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-3">Select Bank to View QR & Account Details</label>

                                            {/* Bank Selection Thumbnails - DYNAMIC */}
                                            <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-4">
                                                {bankDetails.map((bank) => (
                                                    <div
                                                        key={bank._id || bank.bankName}
                                                        className={`flex flex-col items-center p-2 sm:p-3 border rounded-lg cursor-pointer transition-all duration-200 transform hover:scale-[1.03]
                                                            ${selectedBank === bank.bankName ? 'border-indigo-500 ring-2 ring-indigo-500 bg-white shadow-md' : 'border-gray-300 bg-white hover:border-gray-400'}`}
                                                        onClick={() => setSelectedBank(bank.bankName)}
                                                    >
                                                        <img
                                                            src={bank.qrFileName}
                                                            alt={`${bank.bankName} QR Code`}
                                                            className="w-16 h-16 sm:w-20 sm:h-20 object-contain mb-2"
                                                        />
                                                        <span className="text-xs sm:text-sm font-medium text-gray-700 text-center">{bank.bankName}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Selected QR Code Display Area - DYNAMIC */}
                                            {selectedBank && (() => {
                                                const selectedBankObj = bankDetails.find(bank => bank.bankName === selectedBank);
                                                if (!selectedBankObj) return null;
                                                return (
                                                    <div
                                                        key={selectedBankObj._id || selectedBankObj.bankName}
                                                        className="flex flex-col items-center w-full bg-gray-50 rounded-lg text-sm sm:text-base"
                                                    >
                                                        <h4 className="text-lg font-semibold text-gray-800 mb-4">{selectedBankObj.bankName} QR Code</h4>
                                                        <img
                                                            src={selectedBankObj.qrFileName}
                                                            alt={`${selectedBankObj.bankName} QR Code`}
                                                            className="w-40 h-40 sm:w-56 sm:h-56 object-contain mb-6 transition-transform duration-300 ease-in-out transform hover:scale-105"
                                                        />
                                                        <p className="text-center text-sm sm:text-base text-gray-600 mb-4">
                                                            Scan this QR code with your bank's app to make the payment.
                                                        </p>
                                                        {/* Account Details */}
                                                        <div className="w-full p-4 bg-gray-50 border border-gray-100 rounded-lg text-sm sm:text-base">
                                                            <p className="font-semibold text-gray-800 mb-2">{selectedBankObj.bankName} Account Details:</p>
                                                            <p className="text-gray-700 flex items-center justify-between">
                                                                <span>Account Holder Name: {selectedBankObj.accountHolderName}</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => copyToClipboard(selectedBankObj.accountHolderName, 'bankName')}
                                                                    className="ml-2 p-1 rounded-md hover:bg-gray-200 transition-colors"
                                                                    title="Copy Account Name"
                                                                >
                                                                    <Clipboard className="size-4 text-gray-600" />
                                                                </button>
                                                            </p>
                                                            <p className="text-gray-700 flex items-center justify-between">
                                                                <span>Account Number: <span className="font-mono select-all">{selectedBankObj.accountNumber}</span></span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => copyToClipboard(selectedBankObj.accountNumber, 'bankAccountNumber')}
                                                                    className="ml-2 p-1 rounded-md hover:bg-gray-200 transition-colors"
                                                                    title="Copy Account Number"
                                                                >
                                                                    <Clipboard className="size-4 text-gray-600" />
                                                                </button>
                                                            </p>
                                                            <p className="text-gray-700 flex items-center justify-between">
                                                                <span>IFSC Code: <span className="font-mono select-all">{selectedBankObj.ifscCode}</span></span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => copyToClipboard(selectedBankObj.ifscCode, 'bankIfscCode')}
                                                                    className="ml-2 p-1 rounded-md hover:bg-gray-200 transition-colors"
                                                                    title="Copy IFSC Code"
                                                                >
                                                                    <Clipboard className="size-4 text-gray-600" />
                                                                </button>
                                                            </p>
                                                            {copiedText.startsWith('bank') && (
                                                                <span className="text-xs text-green-600 font-semibold mt-1">Copied!</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                            {!selectedBank && (
                                                <div className="text-center text-gray-500 py-4 text-sm sm:text-base">Please select a bank above to view its QR code and account details.</div>
                                            )}
                                        </div>
                                    )}

                                    {/* UPI QR Code and Random Bank Details */}
                                    {paymentMethod === 'UPI' && randomUpiBank && (
                                        <div className="text-center">
                                            <label className="block text-sm font-medium text-gray-700 mb-3">Scan QR Code</label>
                                            <div className="flex justify-center mb-4">
                                                <img src={randomUpiBank.qrCode} alt={`${randomUpiBank.name} QR Code`} className="w-32 h-32 sm:w-48 sm:h-48 object-contain border border-gray-300 rounded-lg p-2 bg-white shadow-md" />
                                            </div>
                                            <p className="text-sm text-gray-700 font-medium text-center mb-4 flex items-center justify-center">
                                                <span>UPI ID: <span className="font-mono">{randomUpiBank.upiId}</span></span>
                                                <button
                                                    type="button"
                                                    onClick={() => copyToClipboard(randomUpiBank.upiId, 'upiId')}
                                                    className="ml-2 p-1 rounded-md hover:bg-gray-200 transition-colors"
                                                    title="Copy UPI ID"
                                                >
                                                    <Clipboard className="size-4 text-gray-600" />
                                                </button>
                                                {copiedText === 'upiId' && (
                                                    <span className="text-xs text-green-600 font-semibold ml-1">Copied!</span>
                                                )}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-2">
                                                (Scan this QR code with your preferred UPI app to pay.)
                                            </p>
                                            {/* Displaying random bank details under UPI QR */}
                                            <div className="w-full p-4 bg-gray-50 border border-gray-100 rounded-lg text-sm sm:text-base mt-4">
                                                <p className="font-semibold text-gray-800 mb-2">{randomUpiBank.name} Account Details:</p>
                                                <p className="text-gray-700 flex items-center justify-between">
                                                    <span>Account Name: {randomUpiBank.accountName}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => copyToClipboard(randomUpiBank.accountName, 'upiAccountName')}
                                                        className="ml-2 p-1 rounded-md hover:bg-gray-200 transition-colors"
                                                        title="Copy Account Name"
                                                    >
                                                        <Clipboard className="size-4 text-gray-600" />
                                                    </button>
                                                </p>
                                                <p className="text-gray-700 flex items-center justify-between">
                                                    <span>Account Number: <span className="font-mono select-all">{randomUpiBank.accountNumber}</span></span>
                                                    <button
                                                        type="button"
                                                        onClick={() => copyToClipboard(randomUpiBank.accountNumber, 'upiAccountNumber')}
                                                        className="ml-2 p-1 rounded-md hover:bg-gray-200 transition-colors"
                                                        title="Copy Account Number"
                                                    >
                                                        <Clipboard className="size-4 text-gray-600" />
                                                    </button>
                                                </p>
                                                <p className="text-gray-700 flex items-center justify-between">
                                                    <span>IFSC Code: <span className="font-mono select-all">{randomUpiBank.ifscCode}</span></span>
                                                    <button
                                                        type="button"
                                                        onClick={() => copyToClipboard(randomUpiBank.ifscCode, 'upiIfscCode')}
                                                        className="ml-2 p-1 rounded-md hover:bg-gray-200 transition-colors"
                                                        title="Copy IFSC Code"
                                                    >
                                                        <Clipboard className="size-4 text-gray-600" />
                                                    </button>
                                                </p>
                                                {copiedText.startsWith('upiAccount') || copiedText.startsWith('upiIfsc') ? (
                                                    <span className="text-xs text-green-600 font-semibold mt-1">Copied!</span>
                                                ) : null}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Transaction ID Input (after payment is simulated, before submission) */}
                            {paymentSuccess && !transactionIdSubmitted && (
                                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg shadow-sm text-sm sm:text-base">
                                    <label htmlFor="transactionId" className="block font-medium text-green-800 mb-1">
                                        Enter Confirmed Transaction ID
                                    </label>
                                    <input
                                        type="text"
                                        id="transactionId"
                                        className="w-full border border-green-300 rounded-md p-2 sm:p-3 text-green-900 bg-white focus:ring-green-500 focus:border-green-500 focus:outline-none"
                                        value={transactionId}
                                        onChange={(e) => setTransactionId(e.target.value)}
                                        placeholder="e.g., ABC123XYZ789"
                                    />
                                    <p className="text-xs text-green-700 mt-2 mb-3">Please enter the 12 Digit transaction ID provided by your bank/gateway to confirm payment and view receipt.</p>
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            if (transactionId.trim().length !== 12) { // Changed validation
                                                alert('Please enter a valid 12-digit transaction ID.');
                                                return;
                                            }
                                            
                                            try {
                                                // Generate unique invoice ID upon successful transaction ID submission
                                                const newInvoiceId = generateInvoiceId();
                    
                                                setInvoiceId(newInvoiceId);
                                                
                                                // Submit payment to backend
                                                await submitPaymentToBackend({
                                                    amount: amountPaidForReceipt,
                                                    paymentMethod: paymentMethod,
                                                    transactionId: transactionId,
                                                    invoiceId: newInvoiceId
                                                });
                                                
                                                setTransactionIdSubmitted(true);
                                                // Capture the terms that were just paid for the receipt
                                                setTermsPaidInCurrentTransaction([...selectedTerms]); // Deep copy to prevent future changes

                                                // Add this payment to recent payments list
                                                const paidTermsDetails = feeDetails.filter(fee => selectedTerms.includes(fee.term));
                                                const newPaymentRecord = {
                                                    invoiceId: invoiceId, // Use the state variable
                                                    studentId: studentData.studentId,
                                                    studentName: studentData.name,
                                                    transactionId: transactionId,
                                                    amount: amountPaidForReceipt,
                                                    paymentDate: new Date().toISOString(), // Use ISO string for consistent date storage
                                                    paymentMethod: paymentMethod,
                                                    termsPaid: paidTermsDetails.map(term => ({ term: term.term, feeType: term.feeType, amount: term.amount })),
                                                    status: 'Verification Pending'
                                                };
                                                setRecentPayments(prevPayments => [newPaymentRecord, ...prevPayments]);

                                                // Clear selected terms after successful transaction ID submission
                                                setSelectedTerms([]);
                                                
                                            } catch (err) {
                                                console.error('Payment submission error details:', err);
                                                console.error('Error response:', err.response);
                                                console.error('Error message:', err.message);
                                                alert(`Payment submission failed: ${err.response?.data?.message || err.message || 'Unknown error'}`);
                                            }
                                        }}
                                        disabled={!transactionId.trim()}
                                        className="w-full bg-indigo-600 text-white py-2.5 px-4 rounded-md text-sm font-semibold flex items-center justify-center hover:bg-indigo-700 disabled:bg-indigo-300 transition-colors"
                                    >
                                        Submit Transaction ID
                                    </button>
                                </div>
                            )}

                            {/* Payment Success Message (appears after transaction ID is submitted for both methods) */}
                            {paymentSuccess && transactionIdSubmitted && (
                                <div className="bg-green-100 text-green-800 p-4 rounded-lg flex items-center justify-center text-center font-medium mt-6 text-sm sm:text-base shadow-sm">
                                    <CheckCircle className="mr-2 size-5" />
                                    Payment successful for the selected terms! Receipt is now available. Your payment is under verification.
                                </div>
                            )}


                            {/* Toggle to show receipt (now depends on transactionIdSubmitted) */}
                            {paymentSuccess && transactionIdSubmitted && transactionId && invoiceId && (
                                <div className="flex items-center mt-4">
                                    <input
                                        type="checkbox"
                                        id="receiptCheck"
                                        checked={showReceipt}
                                        onChange={(e) => setShowReceipt(e.target.checked)}
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                        disabled={!paymentSuccess || !transactionIdSubmitted || !transactionId.trim() || !invoiceId}
                                    />
                                    <label htmlFor="receiptCheck" className="ml-2 block text-sm text-gray-900">
                                        Show Payment Receipt
                                    </label>
                                </div>
                            )}


                            {/* This section will be the receipt content to be downloaded */}
                            {showReceipt && paymentSuccess && transactionIdSubmitted && transactionId && invoiceId && (
                                <div ref={receiptRef} className="mt-6 p-6 bg-white border border-gray-300 rounded-xl shadow-lg font-sans">
                                    {/* Receipt Header */}
                                    <div className="flex flex-col items-center justify-center border-b pb-4 mb-4">
                                        <div className="text-3xl font-extrabold text-indigo-700 mb-2">School Name</div>
                                        <p className="text-sm text-gray-600 mb-1">123 School Lane, Education City, 560001</p>
                                        <p className="text-sm text-gray-600">contact@schoolname.edu | +91-9876543210</p>
                                    </div>

                                    {/* Invoice Details */}
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-2xl font-bold text-gray-800">Payment Receipt</h3>
                                        <div className="text-right">
                                            <p className="text-sm font-semibold text-gray-700">Invoice ID:</p>
                                            <p className="text-lg font-extrabold text-blue-600">{invoiceId}</p>
                                        </div>
                                    </div>

                                    {/* Student Information */}
                                    <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                        <h4 className="text-lg font-semibold text-gray-800 mb-3">Student Details</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-700">
                                            <p><span className="font-medium">Name:</span> {studentData.name}</p>
                                            <p><span className="font-medium">Student ID:</span> {studentData.studentId}</p>
                                            <p><span className="font-medium">Class:</span> {studentData.class}-{studentData.section}</p>
                                        </div>
                                    </div>

                                    {/* Payment Details */}
                                    <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                        <h4 className="text-lg font-semibold text-gray-800 mb-3">Payment Information</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-700">
                                            <p><span className="font-medium">Payment Date:</span> {new Date().toLocaleDateString()}</p>
                                            <p><span className="font-medium">Payment Method:</span> {paymentMethod} {selectedGateway && `(${selectedGateway})`}</p>
                                            <p className="col-span-2"><span className="font-medium">Transaction ID:</span> <span className="font-mono text-gray-900">{transactionId}</span></p>
                                        </div>
                                    </div>

                                    {/* Terms with Payment Under Verification - UPDATED */}
                                    <div className="mb-6">
                                        <h4 className="font-semibold text-gray-800 text-lg mb-3">Terms with Payment Under Verification:</h4>
                                        <ul className="list-disc pl-5 text-base text-gray-700 space-y-1">
                                            {feeDetails
                                                .filter(fee => termsPaidInCurrentTransaction.includes(fee.term)) // Filter based on terms paid in THIS transaction
                                                .map((fee) => (
                                                    <li key={fee.term}>{fee.term} - {fee.feeType}: <span className="font-bold">₹{fee.amount.toLocaleString()}</span></li>
                                                ))}
                                        </ul>
                                    </div>

                                    {/* Total Amount Paid */}
                                    <div className="flex justify-between items-center pt-4 border-t-2 border-gray-300">
                                        <span className="text-xl font-bold text-gray-900">Total Amount Paid (Under Verification):</span>
                                        <span className="text-2xl font-extrabold text-green-600">₹{amountPaidForReceipt.toLocaleString()}</span>
                                    </div>

                                    {/* Receipt Footer */}
                                    <div className="mt-8 text-center text-gray-500 text-sm">
                                        <p>Thank you for your timely payment!</p>
                                        <p className="mt-2">This is a system-generated receipt and does not require a signature.</p>
                                    </div>
                                </div>
                            )}

                            {/* Download Receipt Button for current transaction*/}
                            {showReceipt && paymentSuccess && transactionIdSubmitted && transactionId && invoiceId && (
                                <button
                                    type="button"
                                    // Pass the current transaction's relevant data to the download function
                                    onClick={() => downloadPaymentReceipt({
                                        invoiceId: invoiceId,
                                        studentId: studentData.studentId,
                                        studentName: studentData.name,
                                        transactionId: transactionId,
                                        amount: amountPaidForReceipt,
                                        paymentDate: new Date().toISOString(),
                                        paymentMethod: paymentMethod,
                                        termsPaid: termsPaidInCurrentTransaction.map(term => feeDetails.find(f => f.term === term)), // Get full fee details for terms
                                    })}
                                    className="mt-4 w-full bg-indigo-600 text-white py-3 px-6 rounded-lg text-lg font-semibold flex items-center justify-center hover:bg-indigo-700 transition-colors shadow-md"
                                >
                                    <Download className="mr-3 size-6" />
                                    Download Receipt
                                </button>
                            )}

                            {/* The primary 'Pay' / 'Submit Transaction' button */}
                            <div className="mt-auto pt-6 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (totalAmountToPay === 0) {
                                            alert('Please select at least one term to pay.');
                                            return;
                                        }
                                        if (!paymentMethod) {
                                            alert('Please select a payment method.');
                                            return;
                                        }

                                        setIsProcessing(true);
                                        setPaymentSuccess(false);
                                        setTransactionId('');
                                        setTransactionIdSubmitted(false);
                                        setShowReceipt(false);
                                        setAmountPaidForReceipt(0);
                                        setInvoiceId(''); // Clear invoice ID before new payment process
                                        setTermsPaidInCurrentTransaction([]); // Clear terms paid in current transaction


                                        if (paymentMethod === 'UPI') {
                                            const upiLink = generateUpiDeepLink();
                                            window.location.href = upiLink;

                                            setTimeout(() => {
                                                setIsProcessing(false);
                                                setPaymentSuccess(true);
                                                setAmountPaidForReceipt(totalAmountToPay);
                                            }, 3000);
                                        } else if (paymentMethod === 'Bank Transfer') {
                                            setTimeout(() => {
                                                setIsProcessing(false);
                                                setPaymentSuccess(true);
                                                setAmountPaidForReceipt(totalAmountToPay);
                                            }, 1500);
                                        }
                                    }}
                                    disabled={selectedTerms.length === 0 || !paymentMethod || isProcessing || paymentSuccess}
                                    className={`w-full py-3 px-6 rounded-lg text-lg font-semibold flex items-center justify-center transition-colors
                                            ${selectedTerms.length === 0 || !paymentMethod || isProcessing || paymentSuccess
                                            ? 'bg-indigo-300 text-white cursor-not-allowed'
                                            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'
                                        }`}
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="mr-3 animate-spin size-6" />
                                            Processing...
                                        </>
                                    ) : (
                                        // The button text for Bank Transfer needs to be "Submit Transaction" only after paymentSuccess is true
                                        paymentMethod === 'Bank Transfer' && !paymentSuccess ? 'Initiate Bank Transfer' : `Pay ₹${totalAmountToPay.toLocaleString()}`
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Recent Payments List Section - NEWLY ADDED */}
            <div className="mt-8 bg-white p-6 rounded-xl shadow-md border border-gray-200">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
                        <IndianRupee className="mr-3 text-purple-600 size-6 sm:size-7" /> Recent Payments
                    </h2>
                    <button
                        onClick={async () => {
                            try {
                                setLoading(true);
                                const paymentRecords = await getMyPaymentRecords();
                                const transformedPayments = paymentRecords.map(record => ({
                                    invoiceId: record.invoice_id || `INV-${record._id}`,
                                    studentId: record.student_id?._id || record.student_id,
                                    studentName: record.student_id?.full_name || record.student_name || 'Unknown Student',
                                    transactionId: record.transaction_id,
                                    amount: record.amount_paid || 0,
                                    paymentDate: record.payment_date || new Date().toISOString(),
                                    paymentMethod: record.payment_method || 'Unknown',
                                    termsPaid: record.term ? [{ term: record.term, feeType: 'Tuition Fee', amount: record.amount_paid || 0 }] : [],
                                    status: record.status || 'Verification Pending'
                                }));
                                setRecentPayments(transformedPayments);
                                setError(null);
                            } catch (error) {
                                console.error('Error refreshing payments:', error);
                                setError('Failed to refresh payments. Please try again.');
                            } finally {
                                setLoading(false);
                            }
                        }}
                        disabled={loading}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Loader2 className={`mr-2 size-4 ${loading ? 'animate-spin' : ''}`} />
                        {loading ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>
                
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="animate-spin size-6 text-purple-600 mr-3" />
                        <span className="text-gray-600">Loading recent payments...</span>
                    </div>
                ) : recentPayments.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Invoice ID
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Student
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Amount
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Terms Paid
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {recentPayments.map((payment, index) => (
                                    <tr key={payment.invoiceId || index}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                                            {payment.invoiceId}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {payment.studentName}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                                            ₹{payment.amount.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            {payment.termsPaid.map(t => `${t.term} (${t.feeType})`).join(', ')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {new Date(payment.paymentDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                payment.status === 'Verification Pending'
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : 'bg-green-100 text-green-800'
                                            }`}>
                                                {payment.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => downloadPaymentReceipt(payment)}
                                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                                title="Download Receipt"
                                            >
                                                <Download className="mr-1.5 size-4" />
                                                Receipt
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <div className="text-gray-400 mb-3">
                            <IndianRupee className="size-12 mx-auto" />
                        </div>
                        <p className="text-gray-500 text-lg">No recent payments found</p>
                        <p className="text-gray-400 text-sm mt-1">Your payment history will appear here once you make payments</p>
                        {error && (
                            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                                <p className="text-red-600 text-sm">
                                    <AlertCircle className="inline size-4 mr-2" />
                                    Error loading payments: {error}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FeeModule;