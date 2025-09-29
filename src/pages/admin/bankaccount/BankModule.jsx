import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  PlusCircle,
  Pencil,
  Trash2,
  Banknote,
  Building,
  QrCode, // Keep QrCode for the display
  Save,
  XCircle,
  Info,
  BadgeInfo,
  UploadCloud,
  CheckCircle,
  X,
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

// Access API_BASE_URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const BankModule = () => {
  const { user } = useAuth();
  const [banks, setBanks] = useState([]);
  const [currentBank, setCurrentBank] = useState({
    id: null,
    bankName: '',
    accountHolderName:'',
    accountNumber: '',
    ifscCode: '',
    upiId: '',
    qrFileName: '',
    admin_id: user?.profile?._id || user?.profile?.userId || user?.profile?.user_id || '', // Add admin ID
  });
  const [qrPreview, setQrPreview] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [alert, setAlert] = useState({ message: '', type: '' });

  const MAX_BANKS = 5;

  useEffect(() => {
    const fetchBankDetails = async () => {
      const token = JSON.parse(localStorage.getItem('authToken'));
      if (!token) {
        console.error('No authentication token found');
        setAlert({ message: 'Authentication required. Please log in.', type: 'error' });
        return;
      }
      try {
        const res = await axios.get(`${API_BASE_URL}/api/bank/`, { // Use API_BASE_URL
          headers: { Authorization: `Bearer ${token}` }
        });
        const fetchedData = res.data;
        if (Array.isArray(fetchedData)) {
          setBanks(fetchedData);
        } else if (fetchedData) {
          setBanks([fetchedData]);
        } else {
          setBanks([]);
        }
        console.log('Fetched banks:', res.data);
      } catch (e) {
        console.error('Failed to fetch banks:', e);
        setAlert({ message: 'Failed to load bank details.', type: 'error' });
        setBanks([]);
      }
    };

    fetchBankDetails();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentBank(prev => ({ ...prev, [name]: value }));
  };

  const handleQrCodeChange = async (e) => {
    const file = e.target.files[0];

    if (!file) {
      setQrPreview(null);
      setCurrentBank(prev => ({ ...prev, qrFileName: '' }));
      setAlert({ message: 'QR Code image cleared.', type: 'info' });
      return;
    }

    const uploadFile = new FormData();
    uploadFile.append("file", file);
    uploadFile.append("upload_preset", "sims_development");
    uploadFile.append("cloud_name", "duxyycuty");

    try {
      const response = await axios.post('https://api.cloudinary.com/v1_1/duxyycuty/image/upload', uploadFile);
      const qrFileUrl = response.data.url;
      console.log('qrFile URL is :', qrFileUrl);
      setCurrentBank(prev => ({ ...prev, qrFileName: qrFileUrl }));
      setQrPreview(qrFileUrl);
      setAlert({ message: 'QR Code image uploaded successfully!', type: 'success' });
    } catch (error) {
      console.error('Error uploading QR code:', error);
      setAlert({ message: 'Failed to upload QR code image.', type: 'error' });
      setQrPreview(null);
      setCurrentBank(prev => ({ ...prev, qrFileName: '' }));
    }
  };

  // Add a new bank or update an existing one
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = JSON.parse(localStorage.getItem('authToken'));
    if (!token) {
      setAlert({ message: 'Authentication required. Please log in.', type: 'error' });
      return;
    }

    if (!currentBank.bankName || !currentBank.accountHolderName || !currentBank.accountNumber || !currentBank.ifscCode) {
      setAlert({ message: 'Bank Name, Account Holder Name, Account Number, and IFSC Code are required.', type: 'error' });
      return;
    }

    try {
      if (currentBank.id) {
        // Update existing bank
        // Ensure you send the 'currentBank.id' (which is '_id' from MongoDB) for the PUT request
        await axios.put(`${API_BASE_URL}/api/bank/${currentBank.id}`, currentBank, { // Use API_BASE_URL
          headers: { Authorization: `Bearer ${token}` }
        });
        setAlert({ message: 'Bank details updated successfully!', type: 'success' });
      } else {
        // Add new bank
        if (banks.length >= MAX_BANKS) {
          setAlert({ message: `You can add a maximum of ${MAX_BANKS} banks.`, type: 'error' });
          return;
        }
        await axios.post(`${API_BASE_URL}/api/bank/`, currentBank, { // Use API_BASE_URL
          headers: { Authorization: `Bearer ${token}` }
        });
        setAlert({ message: 'New bank added successfully!', type: 'success' });
      }
      // Re-fetch banks to update the list after add/edit
      const res = await axios.get(`${API_BASE_URL}/api/bank/`, { // Use API_BASE_URL
        headers: { Authorization: `Bearer ${token}` }
      });
      setBanks(res.data || []);
      resetForm();
    } catch (err) {
      console.error('Error saving bank details:', err);
      setAlert({ message: `Failed to save bank details: ${err.response?.data?.message || err.message}`, type: 'error' });
    }
  };

  // Populate the form for editing
  const handleEditClick = (bank) => {
    // Note: MongoDB uses _id, so map it to 'id' for currentBank state
    setCurrentBank({
      id: bank._id, // Set the id for update
      bankName: bank.bankName,
      accountHolderName: bank.accountHolderName,
      accountNumber: bank.accountNumber,
      ifscCode: bank.ifscCode,
      upiId: bank.upiId,
      qrFileName: bank.qrFileName,
      admin_id: user?.profile?._id || user?.profile?.userId || user?.profile?.user_id || '', // Add admin ID
    });
    setQrPreview(bank.qrFileName); // Set preview from qrFileName
    setShowForm(true);
    setAlert({ message: '', type: '' }); // Clear any previous alerts
  };

  // Delete bank
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this bank?')) {
      const token = JSON.parse(localStorage.getItem('authToken'));
      if (!token) {
        setAlert({ message: 'Authentication required to delete.', type: 'error' });
        return;
      }
      try {
        await axios.delete(`${API_BASE_URL}/api/bank/${id}`, { // Use API_BASE_URL
          headers: { Authorization: `Bearer ${token}` }
        });
        setBanks(banks.filter(bank => bank._id !== id)); // Filter by _id
        if (currentBank.id === id) { // If the deleted bank was being edited
          resetForm();
        }
        setAlert({ message: 'Bank record deleted successfully!', type: 'success' });
      } catch (error) {
        console.error('Error deleting bank:', error);
        setAlert({ message: `Failed to delete bank: ${error.response?.data?.message || error.message}`, type: 'error' });
      }
    }
  };

  // Reset form to initial state
  const resetForm = () => {
    setCurrentBank({
      id: null,
      bankName: '',
      accountHolderName: '',
      accountNumber: '',
      ifscCode: '',
      upiId: '',
      qrFileName: '',
      admin_id: user?.profile?._id || user?.profile?.userId || user?.profile?.user_id || '', // Add admin ID
    });
    setQrPreview(null);
    setShowForm(false);
  };

  return (
    <div className="px-0 sm:px-2 md:px-4 lg:p-6 flex flex-col gap-2 sm:gap-4 lg:gap-8">
      {/* Header */}
      <div className="flex items-center mb-8 pb-4 border-b border-gray-200">
        <Banknote className="mr-4 text-indigo-600" size={36} />
        <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900 leading-tight">Manage Bank Details</h1>
      </div>

      {/* Alert Message */}
      {alert.message && (
        <div className={`flex items-center justify-between p-4 mb-6 rounded-lg shadow-md ${alert.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
          alert.type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' :
            'bg-blue-100 text-blue-800 border border-blue-200'
          }`} role="alert">
          <div className="flex items-center">
            {alert.type === 'success' && <CheckCircle className="mr-3" size={20} />}
            {alert.type === 'error' && <XCircle className="mr-3" size={20} />}
            {alert.type === 'info' && <Info className="mr-3" size={20} />}
            <span className="text-sm font-medium">{alert.message}</span>
          </div>
          <button
            onClick={() => setAlert({ message: '', type: '' })}
            className={`p-1 rounded-full transition-colors ${alert.type === 'success' ? 'hover:bg-green-200' :
              alert.type === 'error' ? 'hover:bg-red-200' :
                'hover:bg-blue-200'
              }`}
            aria-label="Dismiss alert"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Add New Bank Button */}
      <div className="mb-6">
        {!showForm && (
          <button
            onClick={() => { resetForm(); setShowForm(true); setAlert({ message: '', type: '' }); }}
            disabled={banks.length >= MAX_BANKS}
            className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-semibold rounded-lg shadow-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50 disabled:opacity-60 disabled:cursor-not-allowed transition transform hover:-translate-y-0.5"
          >
            <PlusCircle className="mr-2" size={22} />
            Add New Bank ({banks.length}/{MAX_BANKS})
          </button>
        )}
        {banks.length >= MAX_BANKS && !showForm && (
          <p className="mt-4 text-sm text-yellow-800 bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded-md shadow-sm flex items-center">
            <BadgeInfo className="inline mr-2 text-yellow-500" size={18} /> Maximum of {MAX_BANKS} banks added. Please manage existing entries.
          </p>
        )}
      </div>

      {/* Bank Form (Add/Edit) */}
      {showForm && (
        <div className="bg-white p-6 md:p-8 rounded-xl border border-gray-200 shadow-lg mb-8 transition-all duration-300 ease-in-out transform scale-100 opacity-100">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">{currentBank.id ? 'Edit Bank Details' : 'Add New Bank'}</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="bankName" className="block text-sm font-medium text-gray-700 mb-1">Bank Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                id="bankName"
                name="bankName"
                value={currentBank.bankName}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400 text-base transition-colors"
                placeholder="e.g., HDFC Bank"
                required
              />
            </div>
            <div>
              <label htmlFor="accountHolderName" className="block text-sm font-medium text-gray-700 mb-1">Account Holder Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                id="accountHolderName"
                name="accountHolderName"
                value={currentBank.accountHolderName}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400 text-base transition-colors"
                placeholder="Account Holder Name"
                required
              />
            </div>
            <div>
              <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 mb-1">Account Number <span className="text-red-500">*</span></label>
              <input
                type="text"
                id="accountNumber"
                name="accountNumber"
                value={currentBank.accountNumber}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400 text-base transition-colors"
                placeholder="e.g., 50100XXXXXXX"
                required
              />
            </div>
            <div>
              <label htmlFor="ifscCode" className="block text-sm font-medium text-gray-700 mb-1">IFSC Code <span className="text-red-500">*</span></label>
              <input
                type="text"
                id="ifscCode"
                name="ifscCode"
                value={currentBank.ifscCode}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400 text-base transition-colors"
                placeholder="e.g., HDFC000XXXX"
                required
              />
            </div>
            <div>
              <label htmlFor="upiId" className="block text-sm font-medium text-gray-700 mb-1">UPI ID (Optional)</label>
              <input
                type="text"
                id="upiId"
                name="upiId"
                value={currentBank.upiId}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400 text-base transition-colors"
                placeholder="e.g., schoolname@upi"
              />
            </div>
            <div>
              <label htmlFor="qrCode" className="block text-sm font-medium text-gray-700 mb-2">QR Code Image (Optional)</label>
              <input
                type="file"
                id="qrCode"
                name="qrCode"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleQrCodeChange}
                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200 transition-colors"
              />
              {qrPreview && (
                <div className="mt-4 p-3 border border-gray-200 rounded-md bg-gray-50 flex items-center justify-center flex-col sm:flex-row gap-3">
                  <img src={qrPreview} alt="QR Preview" className="max-w-[100px] max-h-[100px] object-contain rounded-sm shadow-sm" />
                  <span className="text-sm text-gray-700 font-medium">{currentBank.qrFileName || 'QR Code Preview'}</span>
                </div>
              )}
              {currentBank.qrFileName && !qrPreview && (
                <p className="mt-2 text-sm text-gray-600 flex items-center bg-blue-50 border-l-4 border-blue-400 p-2 rounded-md">
                  <Info size={16} className="mr-2 text-blue-500" /> QR Code already set. Upload new image to replace.
                </p>
              )}
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => { resetForm(); setAlert({ message: '', type: '' }); }}
                className="flex items-center px-5 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-300 focus:ring-opacity-50 transition-colors"
              >
                <XCircle className="mr-2" size={20} />
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50 transition-colors"
              >
                <Save className="mr-2" size={20} />
                {currentBank.id ? 'Save Changes' : 'Add Bank'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List of Added Banks */}
      <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg border border-gray-200">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">Existing Banks</h2>
        {banks.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No banks added yet. Click "Add New Bank" to get started.</p>
        ) : (
          <ul className="space-y-4">
            {banks.map((bank) => (
              // Use bank._id for the key as it's the unique identifier from MongoDB
              <li key={bank._id} className="border border-gray-200 rounded-lg p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-50 hover:shadow-lg transition-shadow duration-200">
                <div className="flex-grow mb-4 sm:mb-0">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-1">
                    <Building size={20} className="mr-2 text-indigo-600" />
                    {bank.bankName}
                  </h3>
                  <p className="text-sm text-gray-700 ml-7"><span className="font-medium">Account holder name:</span> {bank.accountHolderName}</p>
                  <p className="text-sm text-gray-700 ml-7"><span className="font-medium">Account:</span> {bank.accountNumber}</p>
                  <p className="text-sm text-gray-700 ml-7"><span className="font-medium">IFSC:</span> {bank.ifscCode}</p>
                  {bank.upiId && <p className="text-sm text-gray-700 ml-7"><span className="font-medium">UPI:</span> {bank.upiId}</p>}
                  {bank.qrFileName && (
                    <div className="mt-2 ml-7 flex items-center text-gray-600">
                      <QrCode size={18} className="mr-2 text-gray-500" />
                      <span className="text-sm">QR Code available</span>
                    </div>
                  )}
                </div>
                <div className="flex space-x-2 mt-3 sm:mt-0">
                  <button
                    onClick={() => handleEditClick(bank)} // Pass the entire bank object
                    className="p-2.5 rounded-full text-indigo-600 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                    title="Edit Bank"
                  >
                    <Pencil size={20} />
                  </button>
                  <button
                    onClick={() => handleDelete(bank._id)}
                    className="p-2.5 rounded-full text-red-600 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                    title="Delete Bank"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default BankModule;