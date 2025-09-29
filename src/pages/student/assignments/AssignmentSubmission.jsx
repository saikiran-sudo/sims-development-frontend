import React, { useCallback, useState, useEffect } from 'react';
import { UploadCloud, FileText, FileImage, FileArchive, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import imageCompression from 'browser-image-compression';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

// Access API_BASE_URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'; // Fallback for development

const MAX_FILE_SIZE_MB = 10;
const MAX_FILES = 10;

const Toast = ({ message, type = 'info', onClose }) => {
  const bgColor = {
    info: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    error: 'bg-red-100 text-red-800'
  };

  useEffect(() => {
    const timer = setTimeout(() => onClose(), 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed bottom-4 right-4 px-4 py-3 rounded-md shadow-md flex items-center ${bgColor[type]} animate-fade-in`}
      onClick={onClose}
    >
      {type === 'success' ? <CheckCircle className="mr-2" size={18} /> : <AlertCircle className="mr-2" size={18} />}
      {message}
    </div>
  );
};

const FileIcon = ({ type }) => {
  if (type.startsWith('image/')) return <FileImage className="text-blue-500 mr-2" size={18} />;
  if (type === 'application/zip') return <FileArchive className="text-purple-500 mr-2" size={18} />;
  return <FileText className="text-gray-500 mr-2" size={18} />;
};

const AssignmentSubmission = () => {
  const { assignmentId } = useParams();
  const [files, setFiles] = useState([]);
  const [description, setDescription] = useState('');
  const [toast, setToast] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Get assignment details based on assignmentId
  const assignment = {
    id: assignmentId,
    title: `Assignment`,
    dueDate: assignmentId?.dueDate,
    // class: 'Science 201'
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  const compressFile = async (file) => {
    if (file.type.startsWith('image/')) {
      try {
        return await imageCompression(file, {
          maxSizeMB: 2,
          maxWidthOrHeight: 1920,
          useWebWorker: true
        });
      } catch (err) {
        console.error('Image compression failed:', err);
        return file;
      }
    }
    return file;
  };

  const onDrop = useCallback(async (acceptedFiles) => {
    if (files.length + acceptedFiles.length > MAX_FILES) {
      showToast(`Maximum ${MAX_FILES} files allowed`, 'error');
      return;
    }

    const validFiles = acceptedFiles.filter(f => f.size <= MAX_FILE_SIZE_MB * 1024 * 1024);
    if (validFiles.length !== acceptedFiles.length) {
      showToast('Some files exceeded size limit and were ignored', 'error');
    }

    try {
      const compressed = await Promise.all(validFiles.map(compressFile));
      setFiles(prev => [...prev, ...compressed]);
      showToast(`${validFiles.length} file(s) added`, 'success');
    } catch (err) {
      showToast('Error processing files', 'error');
    }
  }, [files]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: MAX_FILE_SIZE_MB * 1024 * 1024,
    multiple: true
  });

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    showToast('File removed', 'info');
  };

  const handleSubmit = async () => {
    if (files.length === 0) {
      showToast('Please add at least one file', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload each file to Cloudinary and collect URLs
      const uploadPromises = files.map(async (file) => {
        const uploadFile = new FormData();
        uploadFile.append('file', file);
        uploadFile.append('upload_preset', 'sims_development');
        uploadFile.append('cloud_name', 'duxyycuty');
        // Use image/upload for images, raw/upload for others
        const isImage = file.type.startsWith('image/');
        const endpoint = isImage
          ? 'https://api.cloudinary.com/v1_1/duxyycuty/image/upload'
          : 'https://api.cloudinary.com/v1_1/duxyycuty/raw/upload';
        const response = await axios.post(endpoint, uploadFile);
        return response.data.secure_url;
      });
      const fileUrls = await Promise.all(uploadPromises);

      // Post to backend
      const token = JSON.parse(localStorage.getItem('authToken'));
      const userprofile = JSON.parse(localStorage.getItem('userprofile'));

      await axios.post(`${API_BASE_URL}/api/assignment-submissions`, {
        assignment_id: assignmentId, // match backend field name
        description,
        files: fileUrls,
        admin_id: userprofile.admin_id // Add admin_id from user profile
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      showToast('Assignment submitted successfully!', 'success');
      setTimeout(() => navigate('/student/assignments'), 2000);
    } catch (err) {
      showToast('Submission failed. Please try again.', 'error');
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="px-0 sm:px-2 md:px-4 lg:p-6 flex flex-col gap-2 sm:gap-4 lg:gap-8">
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-1">{assignment.title}</h2>
          {/* <p className="text-sm text-gray-500 mb-4">Class: {assignment.class} | Due: {new Date(assignment.dueDate).toLocaleDateString()}</p> */}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Assignment Description</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              rows="4"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter any additional comments or notes about your submission..."
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload Files</label>
            <p className="text-xs text-gray-500 mb-3">
              Max file size: {MAX_FILE_SIZE_MB}MB | Max files: {MAX_FILES} | Supported formats: PDF, DOCX, JPG, PNG, ZIP
            </p>

            <div className="flex gap-3 mb-4">
              <button
                onClick={() => document.getElementById('fileInput').click()}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <UploadCloud className="mr-2" size={18} />
                Add Files
              </button>
              <input
                id="fileInput"
                type="file"
                multiple
                onChange={(e) => onDrop(Array.from(e.target.files))}
                className="hidden"
              />
            </div>

            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                }`}
            >
              <input {...getInputProps()} />
              <UploadCloud className="mx-auto text-gray-400 mb-2" size={32} />
              {isDragActive ? (
                <p className="text-sm text-gray-600">Drop files here</p>
              ) : (
                <>
                  <p className="text-sm text-gray-600">Drag and drop files here, or click to browse</p>
                  <p className="text-xs text-gray-500 mt-1">Supports multiple files</p>
                </>
              )}
            </div>
          </div>

          {files.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-700">Selected Files ({files.length})</h3>
              </div>
              <ul className="divide-y divide-gray-200">
                {files.map((file, index) => (
                  <li key={index} className="px-4 py-3 flex justify-between items-center">
                    <div className="flex items-center">
                      <FileIcon type={file.type} />
                      <div>
                        <p className="text-sm font-medium text-gray-800 truncate max-w-xs">{file.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      aria-label="Remove file"
                    >
                      <X size={18} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={() => navigate('/student/assignments')}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || files.length === 0}
            className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none ${(isSubmitting || files.length === 0) ? 'opacity-70 cursor-not-allowed' : ''
              }`}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Assignment'}
          </button>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default AssignmentSubmission;