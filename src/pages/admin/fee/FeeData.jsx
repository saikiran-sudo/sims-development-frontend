// FeeData.jsx
// This file provides API calls for fee records.
import { feeAPI } from '../../../services/api';

/**
 * Fetches all fee records from the backend
 * @returns {Promise<Array>} Promise that resolves to array of fee records
 */
export const fetchFeeRecords = async () => {
  try {
    const response = await feeAPI.getAllFees();
    return response.data || [];
  } catch (error) {
    console.error('Error fetching fee records:', error);
    return [];
  }
};

/**
 * Fetches fee records for a specific student
 * @param {string} studentId - The student ID
 * @returns {Promise<Array>} Promise that resolves to array of fee records for the student
 */
export const fetchStudentFees = async (studentId) => {
  try {
    const response = await feeAPI.getStudentFees(studentId);
    return response.data || [];
  } catch (error) {
    console.error('Error fetching student fees:', error);
    return [];
  }
};

/**
 * Creates a new fee record
 * @param {Object} feeData - The fee data to create
 * @returns {Promise<Object>} Promise that resolves to the created fee record
 */
export const createFeeRecord = async (feeData) => {
  try {
    const response = await feeAPI.createFee(feeData);
    return response.data;
  } catch (error) {
    console.error('Error creating fee record:', error);
    throw error;
  }
};

/**
 * Updates an existing fee record
 * @param {string} feeId - The fee ID to update
 * @param {Object} feeData - The updated fee data
 * @returns {Promise<Object>} Promise that resolves to the updated fee record
 */
export const updateFeeRecord = async (feeId, feeData) => {
  try {
    const response = await feeAPI.updateFee(feeId, feeData);
    return response.data;
  } catch (error) {
    console.error('Error updating fee record:', error);
    throw error;
  }
};

/**
 * Deletes a fee record
 * @param {string} feeId - The fee ID to delete
 * @returns {Promise<Object>} Promise that resolves to the deletion result
 */
export const deleteFeeRecord = async (feeId) => {
  try {
    const response = await feeAPI.deleteFee(feeId);
    return response.data;
  } catch (error) {
    console.error('Error deleting fee record:', error);
    throw error;
  }
};

/**
 * Processes a term fee payment
 * @param {string} feeId - The fee ID
 * @param {Object} paymentData - The payment data
 * @returns {Promise<Object>} Promise that resolves to the payment result
 */
export const payTermFee = async (feeId, paymentData) => {
  try {
    const response = await feeAPI.payTermFee(feeId, paymentData);
    return response.data;
  } catch (error) {
    console.error('Error processing term fee payment:', error);
    throw error;
  }
};

// Export empty array as default for backward compatibility
export const feeRecordsData = [];