// src/pages/admin/admissions/AdmissionModule.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select';
import {
  User, Mail, Phone, Home, Key, Image, Users, FileText, Plus, X, Calendar, Venus, Briefcase, School, Paperclip, Hash, BookOpen, IdCard, CheckCircle, Info
} from 'lucide-react';

// Access API_BASE_URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'; // Fallback for development

// Axios instance for backend API
const api = axios.create({ baseURL: `${API_BASE_URL}/api` }); // Use API_BASE_URL here
import { useAuth } from '../../../contexts/AuthContext';

// Add a request interceptor to include token and headers
api.interceptors.request.use(
  (config) => {
    const token = JSON.parse(localStorage.getItem('authToken')); // Adjust key if your app uses a different one
    console.log('token is ', token);
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    config.headers['Content-Type'] = 'application/json';
    return config;
  },
  (error) => Promise.reject(error)
);

const GENDER_OPTIONS = [
  { value: '', label: 'Select Gender' },
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Other', label: 'Other' },
];

const STUDENT_TYPE_OPTIONS = [
  { value: 'Current Student', label: 'Current Student' },
  { value: 'Migrated Student', label: 'Migrated Student' },
];

const initialParentData = {
  parentId: '',
  password: '',
  name: '',
  email: '',
  phone: '',
  childrenCount: 0,
  address: '',
  image: null,
  parentImageFile: null,
};

function AdmissionModule() {
  // State for backend data
  const [classOptions, setClassOptions] = useState([]);
  const [existingParents, setExistingParents] = useState([]);
  const [existingStudents, setExistingStudents] = useState([]);
  const [admissionMode, setAdmissionMode] = useState('newAdmission');
  const [parentData, setParentData] = useState(initialParentData);
  const [studentsData, setStudentsData] = useState([]);
  const [parentErrors, setParentErrors] = useState({});
  const [studentsErrors, setStudentsErrors] = useState([]);
  const [showParentPassword, setShowParentPassword] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState('');
  const [existingParentIdInput, setExistingParentIdInput] = useState('');
  const [selectedExistingParent, setSelectedExistingParent] = useState(null);
  const [foundExistingChildren, setFoundExistingChildren] = useState([]);
  const [existingParentError, setExistingParentError] = useState('');
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();

  // Fetch classes, parents, students from backend
  useEffect(() => {
    api.get('/classes/names/all')
      .then(res => {
        const uniqueClasses = Array.from(new Map(
          (res.data || res).map(cls => [
            cls.class_name || cls.label || cls.value,
            cls
          ])
        ).values());
        const options = uniqueClasses.map(cls => ({
          label: cls.class_name || cls.name || cls.label || cls.value,
          value: cls.class_name || cls.name || cls.label || cls.value
        }));
        setClassOptions(options);
      })
      .catch(() => setClassOptions([]));
    api.get('/parents')
      .then(res => setExistingParents(res.data))
      .catch(() => setExistingParents([]));
    api.get('/students')
      .then(res => setExistingStudents(res.data))
      .catch(() => setExistingStudents([]));
  }, []);

  // Clear student errors when students data changes (e.g., child removed)
  useEffect(() => {
    setStudentsErrors(prevErrors => {
      const newErrors = Array(studentsData.length).fill(null).map((_, i) => prevErrors[i] || {});
      return newErrors;
    });
  }, [studentsData.length]);

  // Reset form when admission mode changes
  useEffect(() => {
    // Clear all form data and errors
    setParentData(initialParentData);
    setStudentsData([]);
    setParentErrors({});
    setStudentsErrors([]);
    setSubmissionMessage('');
    setSelectedExistingParent(null);
    setFoundExistingChildren([]);
    setExistingParentIdInput('');
    setExistingParentError('');
  }, [admissionMode]);


  // --- Validation Functions ---
  const validateParentForm = () => {
    if (admissionMode === 'existingParent' && !selectedExistingParent) {
      setParentErrors({ parentId: 'Please select an existing parent.' }); // Adjusted error key for clarity
      return false;
    }

    const errors = {};
    if (admissionMode === 'newAdmission') {
      if (!parentData.parentId) errors.parentId = 'Parent ID is required';
      if (!parentData.password) errors.password = 'Password is required';
      if (!parentData.name) errors.name = 'Name is required';
      if (!parentData.email) {
        errors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(parentData.email)) {
        errors.email = 'Email format is invalid';
      }
      if (!parentData.phone) {
        errors.phone = 'Phone number is required';
      } else if (!/^\d{10}$/.test(parentData.phone)) {
        errors.phone = 'Phone number must be 10 digits';
      }
      if (!parentData.address) errors.address = 'Address is required';
    }

    setParentErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStudentForm = (student, index) => {
    const errors = {};
    if (!student.studentId) errors.studentId = 'Student ID is required';
    if (!student.password) errors.password = 'Password is required';
    if (!student.name) errors.name = 'Name is required';
    if (!student.dateOfBirth) {
      errors.dateOfBirth = 'Date of Birth is required';
    } else {
      const dob = new Date(student.dateOfBirth);
      const today = new Date();
      // Calculate 3 years ago from today
      const threeYearsAgo = new Date(today.getFullYear() - 3, today.getMonth(), today.getDate());

      if (dob > threeYearsAgo) {
        errors.dateOfBirth = 'Student must be at least 3 years old';
      }
    }
    if (!student.gender) errors.gender = 'Gender is required';
    if (!student.class) errors.class = 'Class is required';
    if (!student.studentType) errors.studentType = 'Student Type is required';

    if (student.studentType?.value === 'Migrated Student') {
      if (!student.previousSchoolName) errors.previousSchoolName = 'Previous School Name is required';
      if (!student.previousSchoolAddress) errors.previousSchoolAddress = 'Previous School Address is required';
      if (!student.previousSchoolPhone) {
        errors.previousSchoolPhone = 'Previous School Phone is required';
      } else if (!/^\d{10}$/.test(student.previousSchoolPhone)) {
        errors.previousSchoolPhone = 'Phone number must be 10 digits';
      }
      if (!student.previousSchoolStartDate) errors.previousSchoolStartDate = 'Start Date is required';
      if (!student.previousSchoolEndDate) errors.previousSchoolEndDate = 'End Date is required';
    }

    setStudentsErrors(prevErrors => {
      const newErrors = [...prevErrors];
      newErrors[index] = errors;
      return newErrors;
    });
    return Object.keys(errors).length === 0;
  };

  const validateAllForms = () => {
    const isParentFormValid = validateParentForm();

    let allStudentsValid = true;
    if (studentsData.length === 0) {
      setSubmissionMessage('Please add at least one child.');
      setTimeout(() => setSubmissionMessage(''), 3000);
      return false; // Minimum 1 child validation
    }

    const newStudentsErrors = studentsData.map((student, index) => {
      const studentValid = validateStudentForm(student, index);
      if (!studentValid) allStudentsValid = false;
      return studentsErrors[index]; // This will be updated by validateStudentForm
    });
    setStudentsErrors(newStudentsErrors); // Ensure state is updated after all validations

    return isParentFormValid && allStudentsValid;
  };


  // --- Parent Handlers ---
  const handleChangeParent = (e) => {
    const { name, value } = e.target;
    setParentData(prev => ({ ...prev, [name]: value }));
    setParentErrors(prev => ({ ...prev, [name]: undefined })); // Clear error on change
  };

  const handleImageChangeParent = async (e) => {
    const file = e.target.files[0];
    const uploadFile = new FormData();
    uploadFile.append("file", file);
    uploadFile.append("upload_preset", "sims_development");
    uploadFile.append("cloud_name", "duxyycuty");
    try {
      const response = await axios.post('https://api.cloudinary.com/v1_1/duxyycuty/image/upload', uploadFile);
      const imageUrl = response.data.url;
      setParentData(prev => ({ ...prev, image: imageUrl, parentImageFile: file }));
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  const handleExistingParentIdChange = async (e) => {
    const { value } = e.target;
    setExistingParentIdInput(value);
    setExistingParentError('');
    setSelectedExistingParent(null);
    setFoundExistingChildren([]);
    setParentData(initialParentData);

    if (value.trim() === '') return;

    // Use user_id for lookup
    const foundParent = existingParents.find(p => p.user_id === value);
    if (foundParent) {
      setSelectedExistingParent(foundParent);
      setParentData(prev => ({
        ...prev,
        parentId: foundParent.user_id,
        name: foundParent.full_name,
        email: foundParent.email,
        phone: foundParent.phone,
        address: foundParent.address,
        image: foundParent.image || null,
      }));
      // Fetch children from backend for this parent
      try {
        const res = await api.get(`/parents/${foundParent._id}`);
        if (res.data && Array.isArray(res.data.children)) {
          setFoundExistingChildren(res.data.children);
        } else if (res.data && Array.isArray(res.data.linkedStudents)) {
          setFoundExistingChildren(res.data.linkedStudents);
        } else {
          setFoundExistingChildren([]);
        }
      } catch (err) {
        setFoundExistingChildren([]);
      }
    } else {
      setExistingParentError('Parent ID not found.');
    }
  };


  // --- Student Handlers (dynamic forms) ---
  const handleAddChild = () => {
    setStudentsData(prev => [
      ...prev,
      {
        id: Date.now() + prev.length, // Simple unique key for React list
        studentId: '',
        password: '',
        name: '',
        dateOfBirth: '',
        gender: null,
        class: null,
        studentType: null,
        avatar: null,
        studentAvatarFile: null,
        documents: [],
        studentDocumentsFiles: [],
        showPassword: false,
        previousSchoolName: '',
        previousSchoolAddress: '',
        previousSchoolPhone: '',
        previousSchoolStartDate: '',
        previousSchoolEndDate: '',
      }
    ]);
  };

  const handleRemoveChild = (idToRemove) => {
    setStudentsData(prev => prev.filter(student => student.id !== idToRemove));
    // Errors will be re-aligned by useEffect when studentsData.length changes
  };

  const handleChangeStudent = (index, e) => {
    const { name, value } = e.target;
    setStudentsData(prev => {
      const newStudents = [...prev];
      newStudents[index] = { ...newStudents[index], [name]: value };
      return newStudents;
    });
    setStudentsErrors(prevErrors => { // Clear specific student error on change
      const newErrors = [...prevErrors];
      if (newErrors[index]) {
        newErrors[index][name] = undefined;
      }
      return newErrors;
    });
  };

  const handleSelectChangeStudent = (index, name, selectedOption) => {
    setStudentsData(prev => {
      const newStudents = [...prev];
      newStudents[index] = { ...newStudents[index], [name]: selectedOption };
      return newStudents;
    });
    setStudentsErrors(prevErrors => { // Clear specific student error on change
      const newErrors = [...prevErrors];
      if (newErrors[index]) {
        newErrors[index][name] = undefined;
      }
      return newErrors;
    });
  };

  const handleAvatarChangeStudent = async (index, e) => {
    const file = e.target.files[0];
    const uploadFile = new FormData();
    uploadFile.append("file", file);
    uploadFile.append("upload_preset", "sims_development");
    uploadFile.append("cloud_name", "duxyycuty");
    try {
      const response = await axios.post('https://api.cloudinary.com/v1_1/duxyycuty/image/upload', uploadFile);
      const imageUrl = response.data.url;
      setStudentsData(prev => {
        const newStudents = [...prev];
        newStudents[index] = { ...newStudents[index], avatar: imageUrl, studentAvatarFile: file };
        return newStudents;
      });
    } catch (e) {
      console.log(e);
    }
  };

  const handleDocumentUploadStudent = async (index, e) => {
    const files = Array.from(e.target.files);
    try {
      // Store file names for display
      setStudentsData(prev => {
        const newStudents = [...prev];
        newStudents[index] = {
          ...newStudents[index],
          studentDocumentsFiles: [
            ...(newStudents[index].studentDocumentsFiles || []),
            ...files.map(file => ({ name: file.name }))
          ]
        };
        return newStudents;
      });

      // Upload all files in parallel
      const uploadPromises = files.map(file => {
        const uploadFile = new FormData();
        uploadFile.append("file", file);
        uploadFile.append("upload_preset", "sims_development");
        return axios.post('https://api.cloudinary.com/v1_1/duxyycuty/auto/upload', uploadFile);
      });

      const responses = await Promise.all(uploadPromises);
      const urls = responses.map(res => res.data.url);

      setStudentsData(prev => {
        const newStudents = [...prev];
        newStudents[index] = {
          ...newStudents[index],
          documents: [...(newStudents[index].documents || []), ...urls]
        };
        return newStudents;
      });
    } catch (error) {
      console.error("Error uploading documents:", error);
      if (error.response) {
        console.error("Cloudinary error response:", error.response.data);
        alert("Cloudinary error: " + JSON.stringify(error.response.data));
      }
    }
  };

  const handleRemoveDocumentStudent = (studentIndex, docIndex) => {
    setStudentsData(prev => {
      const newStudents = [...prev];
      newStudents[studentIndex].studentDocumentsFiles = newStudents[studentIndex].studentDocumentsFiles.filter((_, i) => i !== docIndex);
      return newStudents;
    });
  };

  // Update handleSubmit to POST to backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmissionMessage('');
    setLoading(true);
    if (admissionMode === 'existingParent' && !selectedExistingParent) {
      setExistingParentError('Please enter a valid Parent ID to proceed.');
      setSubmissionMessage('Please correct the errors in the form.');
      setTimeout(() => setSubmissionMessage(''), 3000);
      setLoading(false);
      return;
    }
    const allFormsValid = validateAllForms();
    if (!allFormsValid) {
      setSubmissionMessage('Please correct the errors in the form.');
      setTimeout(() => setSubmissionMessage(''), 3000);
      setLoading(false);
      return;
    }
    try {
      // Ensure admin_id is present and valid
      if (!user?.profile?._id) {
        setSubmissionMessage('Admin ID is missing. Please log in again.');
        setLoading(false);
        return;
      }
      let parentObjId = null;
      let parentUserId = null;
      if (admissionMode === 'newAdmission') {
        const token = JSON.parse(localStorage.getItem('authToken'));
        const parentPayload = {
          user_id: parentData.parentId,
          full_name: parentData.name,
          email: parentData.email,
          password: parentData.password,
          phone: parentData.phone,
          address: parentData.address,
          childrenCount: studentsData.length,
          profileImage: parentData.image,
          admin_id: user?.profile?._id, // Only use the correct admin ObjectId
        };
        console.log(parentPayload);
        const parentRes = await api.post('/parents', parentPayload, {
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
          },
        });
        parentObjId = parentRes.data.parent._id;
        parentUserId = parentRes.data.parent.user_id;
      } else if (admissionMode === 'existingParent') {
        parentObjId = selectedExistingParent._id;
        parentUserId = selectedExistingParent.user_id;
        const token = JSON.parse(localStorage.getItem('authToken'));
        await api.put(`/parents/${parentObjId}`, { childrenCount: (foundExistingChildren.length || 0) + studentsData.length }, {
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
          },
        });
      }
      const token = JSON.parse(localStorage.getItem('authToken'));
      await Promise.all(studentsData.map(async (student) => {
        const studentPayload = {
          user_id: student.studentId,
          password: student.password,
          role: "student",
          full_name: student.name,
          email: '', // fill if available
          admission_number: student.studentId,
          date_of_birth: student.dateOfBirth,
          gender: student.gender?.value,
          address: '', // fill if available
          parent_id: [parentObjId],
          class_id: student.class?.value,
          rollNumber: '', // fill if available
          section: 'A',
          blood_group: 'Unknown',
          medical_notes: '',
          profile_image: student.avatar || '',
          contact: '', // fill if available
          status: 'Active',
          student_type: student.studentType?.value,
          previous_school_name: student.previousSchoolName,
          previous_school_address: student.previousSchoolAddress,
          previous_school_phone_number: student.previousSchoolPhone,
          previous_school_start_date: student.previousSchoolStartDate,
          previous_school_end_date: student.previousSchoolEndDate,
          documents: (student.documents || []).map(url => ({ url, name: "" })),
          admin_id: user?.profile?._id || user?.profile?.userId || user?.profile?.user_id || '', // Add admin ID
          // users: // leave blank unless you have a User ref
        };
        console.log('studentPayload ', studentPayload);
        await api.post('/students', studentPayload, {
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
          },
        });
      }));
      setSubmissionMessage('The Admission has been added successfully!');
      setTimeout(() => setSubmissionMessage(''), 5000);
      setParentData(initialParentData);
      setStudentsData([]);
      setParentErrors({});
      setStudentsErrors([]);
      setSelectedExistingParent(null);
      setFoundExistingChildren([]);
      setExistingParentIdInput('');
      setExistingParentError('');
    } catch (error) {
      setSubmissionMessage('An error occurred during admission. Please try again.');
      setTimeout(() => setSubmissionMessage(''), 5000);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="px-0 sm:px-2 md:px-4 lg:p-6 flex flex-col gap-2 sm:gap-4 lg:gap-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Admission Form</h2>
        <button
          type="button"
          onClick={() => setAdmissionMode(admissionMode === 'newAdmission' ? 'existingParent' : 'newAdmission')}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg shadow-lg transition-colors duration-300 ease-in-out text-lg font-medium ${admissionMode === 'newAdmission'
              ? 'bg-purple-600 text-white hover:bg-purple-700 transform hover:scale-105'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 transform hover:scale-105'
            }`}
        >
          {admissionMode === 'newAdmission' ? (
            <>
              <Users size={20} /> Existing Parent
            </>
          ) : (
            <>
              <Plus size={20} /> New Admission
            </>
          )}
        </button>
      </div>

      <form className="space-y-10" onSubmit={handleSubmit}>
        {/* --- Existing Parent Mode Input --- */}
        {admissionMode === 'existingParent' && (
          <section className="border border-purple-200 rounded-lg p-6 bg-purple-50 shadow-sm">
            <h3 className="text-2xl font-bold text-purple-800 mb-6 border-b-2 border-purple-300 pb-4 flex items-center gap-2">
              <Users size={28} /> Existing Parent Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Parent ID for lookup */}
              <div>
                <label htmlFor="existingParentId" className="block text-sm font-medium text-gray-700">Enter Existing Parent ID <span className="text-red-500">*</span></label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <IdCard size={20} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="existingParentId"
                    id="existingParentId"
                    value={existingParentIdInput}
                    onChange={handleExistingParentIdChange}
                    className={`pl-10 pr-3 py-2 block w-full border ${existingParentError ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-purple-500 focus:border-purple-500 transition duration-150 ease-in-out`}
                    placeholder="Enter Existing Parent ID (e.g., P001, P002)"
                  />
                </div>
                {existingParentError && <p className="mt-1 text-sm text-red-600">{existingParentError}</p>}
              </div>

              {/* Display Parent Name (automatically shown) */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Parent Name</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User size={20} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={parentData.name || ''}
                    className="pl-10 pr-3 py-2 block w-full border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                    readOnly
                    placeholder="Parent Name will appear here"
                  />
                </div>
              </div>

              {/* Display Parent ID (automatically shown) */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Parent ID</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <IdCard size={20} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={parentData.parentId || ''}
                    className="pl-10 pr-3 py-2 block w-full border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                    readOnly
                    placeholder="Parent ID will appear here"
                  />
                </div>
              </div>
            </div>

            {selectedExistingParent && foundExistingChildren.length > 0 && (
              <div className="mt-8 pt-6 border-t border-purple-300">
                <h4 className="text-xl font-semibold text-purple-800 mb-4 flex items-center gap-2">
                  <BookOpen size={24} /> Previously Admitted Children
                </h4>
                <div className="space-y-3">
                  {foundExistingChildren.map((child, idx) => {
                    // Helper functions to safely extract string values
                    const getUserId = (userId) => {
                      if (!userId) return '';
                      if (typeof userId === 'string' || typeof userId === 'number') return userId;
                      if (userId.user_id) return userId.user_id;
                      if (userId._id) return userId._id;
                      if (userId.full_name) return userId.full_name;
                      return JSON.stringify(userId);
                    };
                    const getClassId = (classId) => {
                      if (!classId) return '';
                      if (typeof classId === 'string' || typeof classId === 'number') return classId;
                      if (classId.class_name) return classId.class_name;
                      if (classId._id) return classId._id;
                      return JSON.stringify(classId);
                    };
                    return (
                      <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 bg-white rounded-md shadow-sm border border-purple-100">
                        <div className="flex items-center gap-4">
                          {child.avatar && (
                            <img src={child.avatar} alt="Child Avatar" className="w-10 h-10 rounded-full object-cover" />
                          )}
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-800">
                              {child.full_name || child.name}
                              <span className="text-purple-600">
                                ({getUserId(child.user_id) || child.studentId || child.admission_number})
                              </span>
                            </span>
                            <span className="text-sm text-gray-600">
                              Class: {getClassId(child.class_id) || child.class?.label || child.class} | Gender: {child.gender?.label || child.gender || 'Not specified'}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1" />
                        <div className="flex items-center gap-2">
                          {/* Add more details if needed */}
                          <span className="text-xs text-gray-500">ID: {getUserId(child.user_id) || child.studentId}</span>
                        </div>
                        <Info size={20} className="text-purple-500" />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {selectedExistingParent && foundExistingChildren.length === 0 && (
              <div className="mt-8 pt-6 border-t border-purple-300 text-center text-gray-500">
                <p>No previously admitted children found for this parent.</p>
              </div>
            )}
          </section>
        )}

        {/* --- New Admission Mode Parent Details Section --- */}
        {admissionMode === 'newAdmission' && (
          <section className="border border-blue-200 rounded-lg p-6 bg-blue-50 shadow-sm">
            <h3 className="text-2xl font-bold text-blue-800 mb-6 border-b-2 border-blue-300 pb-4 flex items-center gap-2">
              <Users size={28} /> Parent Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Parent ID */}
              <div>
                <label htmlFor="parentId" className="block text-sm font-medium text-gray-700">Parent ID <span className="text-red-500">*</span></label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <IdCard size={20} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="parentId"
                    id="parentId"
                    value={parentData.parentId}
                    onChange={handleChangeParent}
                    className={`pl-10 pr-3 py-2 block w-full border ${parentErrors.parentId ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out`}
                    placeholder="Enter Parent ID"
                  />
                </div>
                {parentErrors.parentId && <p className="mt-1 text-sm text-red-600">{parentErrors.parentId}</p>}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="parentPassword" className="block text-sm font-medium text-gray-700">Password <span className="text-red-500">*</span></label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key size={20} className="text-gray-400" />
                  </div>
                  <input
                    type={showParentPassword ? 'text' : 'password'}
                    name="password"
                    id="parentPassword"
                    value={parentData.password}
                    onChange={handleChangeParent}
                    className={`pl-10 pr-10 py-2 block w-full border ${parentErrors.password ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out`}
                    placeholder="Set Parent Password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowParentPassword(!showParentPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-gray-500 hover:text-blue-600 focus:outline-none"
                  >
                    {showParentPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                {parentErrors.password && <p className="mt-1 text-sm text-red-600">{parentErrors.password}</p>}
              </div>

              {/* Name */}
              <div>
                <label htmlFor="parentName" className="block text-sm font-medium text-gray-700">Name <span className="text-red-500">*</span></label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User size={20} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    id="parentName"
                    value={parentData.name}
                    onChange={handleChangeParent}
                    className={`pl-10 pr-3 py-2 block w-full border ${parentErrors.name ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out`}
                    placeholder="Enter Parent Name"
                  />
                </div>
                {parentErrors.name && <p className="mt-1 text-sm text-red-600">{parentErrors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="parentEmail" className="block text-sm font-medium text-gray-700">Email <span className="text-red-500">*</span></label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail size={20} className="text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    id="parentEmail"
                    value={parentData.email}
                    onChange={handleChangeParent}
                    className={`pl-10 pr-3 py-2 block w-full border ${parentErrors.email ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out`}
                    placeholder="Enter Parent Email"
                  />
                </div>
                {parentErrors.email && <p className="mt-1 text-sm text-red-600">{parentErrors.email}</p>}
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="parentPhone" className="block text-sm font-medium text-gray-700">Phone <span className="text-red-500">*</span></label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone size={20} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="phone"
                    id="parentPhone"
                    value={parentData.phone}
                    onChange={handleChangeParent}
                    className={`pl-10 pr-3 py-2 block w-full border ${parentErrors.phone ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out`}
                    placeholder="Enter 10-digit Phone"
                    maxLength="10"
                  />
                </div>
                {parentErrors.phone && <p className="mt-1 text-sm text-red-600">{parentErrors.phone}</p>}
              </div>

              {/* Address */}
              <div>
                <label htmlFor="parentAddress" className="block text-sm font-medium text-gray-700">Address <span className="text-red-500">*</span></label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Home size={20} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="address"
                    id="parentAddress"
                    value={parentData.address}
                    onChange={handleChangeParent}
                    className={`pl-10 pr-3 py-2 block w-full border ${parentErrors.address ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out`}
                    placeholder="Enter Parent Address"
                  />
                </div>
                {parentErrors.address && <p className="mt-1 text-sm text-red-600">{parentErrors.address}</p>}
              </div>

              {/* Parent Image Upload */}
              <div className="col-span-1 md:col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium mb-1 text-gray-700">Upload Parent Image (Optional)</label>
                <div
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file && file.type.startsWith('image/')) {
                      setParentData((prev) => ({ ...prev, image: URL.createObjectURL(file), parentImageFile: file }));
                    }
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  className="flex items-center justify-center p-4 border-2 border-dashed border-gray-400 rounded-md cursor-pointer bg-gray-50 hover:bg-gray-100 text-center min-h-[80px] transition duration-150 ease-in-out"
                  onClick={() => document.getElementById('parentFileInput').click()}
                >
                  {parentData.image ? (
                    <img src={parentData.image} alt="Parent Preview" className="w-24 h-24 rounded-full object-cover shadow-sm border border-gray-200" />
                  ) : (
                    <p className="text-gray-600 text-sm flex items-center gap-2"><Image size={20} className="text-gray-500" /> Drag & drop or click to upload</p>
                  )}
                </div>
                <input
                  id="parentFileInput"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChangeParent}
                />
              </div>
            </div>
          </section>
        )}

        {/* --- Children Details Section (for new children, applies to both modes) --- */}
        {/* Show this section if new admission is selected OR if existing parent is selected AND found */}
        {(admissionMode === 'newAdmission' || (admissionMode === 'existingParent' && selectedExistingParent)) && (
          <section className="space-y-8">
            <h3 className="text-2xl font-bold text-blue-800 mb-6 border-b-2 border-blue-300 pb-4 flex items-center gap-2">
              <BookOpen size={28} /> New Children Details
            </h3>
            {studentsData.map((student, index) => (
              <div key={student.id} className="border border-green-200 p-6 rounded-lg bg-green-50 mb-6 relative shadow-md">
                <h4 className="text-xl font-semibold text-green-800 mb-4 pb-2 border-b border-green-200">Child #{index + 1}</h4>
                <button
                  type="button"
                  onClick={() => handleRemoveChild(student.id)}
                  className="absolute top-4 right-4 text-red-600 hover:text-red-800 p-2 rounded-full bg-red-100 transition-colors duration-200 ease-in-out shadow-sm"
                  aria-label={`Remove Child ${index + 1}`}
                >
                  <X size={20} />
                </button>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Student ID */}
                  <div>
                    <label htmlFor={`studentId-${index}`} className="block text-sm font-medium text-gray-700">Student ID <span className="text-red-500">*</span></label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <IdCard size={20} className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="studentId"
                        id={`studentId-${index}`}
                        value={student.studentId}
                        onChange={(e) => handleChangeStudent(index, e)}
                        className={`pl-10 pr-3 py-2 block w-full border ${studentsErrors[index]?.studentId ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out`}
                        placeholder="Enter Student ID"
                      />
                    </div>
                    {studentsErrors[index]?.studentId && <p className="mt-1 text-sm text-red-600">{studentsErrors[index].studentId}</p>}
                  </div>

                  {/* Password */}
                  <div>
                    <label htmlFor={`studentPassword-${index}`} className="block text-sm font-medium text-gray-700">Password <span className="text-red-500">*</span></label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Key size={20} className="text-gray-400" />
                      </div>
                      <input
                        type={student.showPassword ? 'text' : 'password'}
                        name="password"
                        id={`studentPassword-${index}`}
                        value={student.password}
                        onChange={(e) => handleChangeStudent(index, e)}
                        className={`pl-10 pr-10 py-2 block w-full border ${studentsErrors[index]?.password ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out`}
                        placeholder="Set Student Password"
                      />
                      <button
                        type="button"
                        onClick={() => setStudentsData(prev => {
                          const newStudents = [...prev];
                          newStudents[index] = { ...newStudents[index], showPassword: !newStudents[index].showPassword };
                          return newStudents;
                        })}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-gray-500 hover:text-blue-600 focus:outline-none"
                      >
                        {student.showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    {studentsErrors[index]?.password && <p className="mt-1 text-sm text-red-600">{studentsErrors[index].password}</p>}
                  </div>

                  {/* Name */}
                  <div>
                    <label htmlFor={`studentName-${index}`} className="block text-sm font-medium text-gray-700">Name <span className="text-red-500">*</span></label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User size={20} className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="name"
                        id={`studentName-${index}`}
                        value={student.name}
                        onChange={(e) => handleChangeStudent(index, e)}
                        className={`pl-10 pr-3 py-2 block w-full border ${studentsErrors[index]?.name ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out`}
                        placeholder="Enter Student Name"
                      />
                    </div>
                    {studentsErrors[index]?.name && <p className="mt-1 text-sm text-red-600">{studentsErrors[index].name}</p>}
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label htmlFor={`dateOfBirth-${index}`} className="block text-sm font-medium text-gray-700">Date of Birth <span className="text-red-500">*</span></label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar size={20} className="text-gray-400" />
                      </div>
                      <input
                        type="date"
                        name="dateOfBirth"
                        id={`dateOfBirth-${index}`}
                        value={student.dateOfBirth}
                        onChange={(e) => handleChangeStudent(index, e)}
                        className={`pl-10 pr-3 py-2 block w-full border ${studentsErrors[index]?.dateOfBirth ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out`}
                      />
                    </div>
                    {studentsErrors[index]?.dateOfBirth && <p className="mt-1 text-sm text-red-600">{studentsErrors[index].dateOfBirth}</p>}
                  </div>

                  {/* Gender */}
                  <div>
                    <label htmlFor={`gender-${index}`} className="block text-sm font-medium text-gray-700">Gender <span className="text-red-500">*</span></label>
                    <Select
                      id={`gender-${index}`}
                      name="gender"
                      options={GENDER_OPTIONS}
                      value={student.gender}
                      onChange={(selectedOption) => handleSelectChangeStudent(index, 'gender', selectedOption)}
                      classNamePrefix="react-select"
                      className={`mt-1 ${studentsErrors[index]?.gender ? 'border border-red-500 rounded-md' : ''}`}
                      placeholder="Select Gender"
                    />
                    {studentsErrors[index]?.gender && <p className="mt-1 text-sm text-red-600">{studentsErrors[index].gender}</p>}
                  </div>

                  {/* Class */}
                  <div>
                    <label htmlFor={`class-${index}`} className="block text-sm font-medium text-gray-700">Class <span className="text-red-500">*</span></label>
                    <Select
                      id={`class-${index}`}
                      name="class"
                      options={classOptions} // Use classOptions instead of CLASS_OPTIONS
                      value={student.class}
                      onChange={(selectedOption) => handleSelectChangeStudent(index, 'class', selectedOption)}
                      classNamePrefix="react-select"
                      className={`mt-1 ${studentsErrors[index]?.class ? 'border border-red-500 rounded-md' : ''}`}
                      placeholder="Select Class"
                    />
                    {studentsErrors[index]?.class && <p className="mt-1 text-sm text-red-600">{studentsErrors[index].class}</p>}
                  </div>

                  {/* Student Type */}
                  <div>
                    <label htmlFor={`studentType-${index}`} className="block text-sm font-medium text-gray-700">Student Type <span className="text-red-500">*</span></label>
                    <Select
                      id={`studentType-${index}`}
                      name="studentType"
                      options={STUDENT_TYPE_OPTIONS}
                      value={student.studentType}
                      onChange={(selectedOption) => handleSelectChangeStudent(index, 'studentType', selectedOption)}
                      classNamePrefix="react-select"
                      className={`mt-1 ${studentsErrors[index]?.studentType ? 'border border-red-500 rounded-md' : ''}`}
                      placeholder="Select Student Type"
                    />
                    {studentsErrors[index]?.studentType && <p className="mt-1 text-sm text-red-600">{studentsErrors[index].studentType}</p>}
                  </div>

                  {/* Student Avatar Upload */}
                  <div className="col-span-1 md:col-span-2 lg:col-span-3">
                    <label className="block text-sm font-medium mb-1 text-gray-700">Upload Student Avatar (Optional)</label>
                    <div
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files[0];
                        if (file && file.type.startsWith('image/')) {
                          handleAvatarChangeStudent(index, { target: { files: [file] } });
                        }
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      className="flex items-center justify-center p-4 border-2 border-dashed border-gray-400 rounded-md cursor-pointer bg-gray-50 hover:bg-gray-100 text-center min-h-[80px] transition duration-150 ease-in-out"
                      onClick={() => document.getElementById(`studentAvatarInput-${index}`).click()}
                    >
                      {student.avatar ? (
                        <img src={student.avatar} alt="Student Preview" className="w-24 h-24 rounded-full object-cover shadow-sm border border-gray-200" />
                      ) : (
                        <p className="text-gray-600 text-sm flex items-center gap-2"><Image size={20} className="text-gray-500" /> Drag & drop or click to upload</p>
                      )}
                    </div>
                    <input
                      id={`studentAvatarInput-${index}`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleAvatarChangeStudent(index, e)}
                    />
                  </div>
                </div>

                {/* --- Previous School Details (Conditional) --- */}
                {student.studentType?.value === 'Migrated Student' && (
                  <div className="mt-8 pt-6 border-t border-green-200">
                    <h4 className="text-xl font-semibold text-green-800 mb-4 flex items-center gap-2">
                      <School size={24} /> Previous School Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* School Name */}
                      <div>
                        <label htmlFor={`previousSchoolName-${index}`} className="block text-sm font-medium text-gray-700">School Name <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          name="previousSchoolName"
                          id={`previousSchoolName-${index}`}
                          value={student.previousSchoolName}
                          onChange={(e) => handleChangeStudent(index, e)}
                          className={`mt-1 px-3 py-2 block w-full border ${studentsErrors[index]?.previousSchoolName ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out`}
                          placeholder="Enter Previous School Name"
                        />
                        {studentsErrors[index]?.previousSchoolName && <p className="mt-1 text-sm text-red-600">{studentsErrors[index].previousSchoolName}</p>}
                      </div>

                      {/* Address */}
                      <div>
                        <label htmlFor={`previousSchoolAddress-${index}`} className="block text-sm font-medium text-gray-700">Address <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          name="previousSchoolAddress"
                          id={`previousSchoolAddress-${index}`}
                          value={student.previousSchoolAddress}
                          onChange={(e) => handleChangeStudent(index, e)}
                          className={`mt-1 px-3 py-2 block w-full border ${studentsErrors[index]?.previousSchoolAddress ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out`}
                          placeholder="Enter Previous School Address"
                        />
                        {studentsErrors[index]?.previousSchoolAddress && <p className="mt-1 text-sm text-red-600">{studentsErrors[index].previousSchoolAddress}</p>}
                      </div>

                      {/* Phone Number */}
                      <div>
                        <label htmlFor={`previousSchoolPhone-${index}`} className="block text-sm font-medium text-gray-700">Phone Number <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          name="previousSchoolPhone"
                          id={`previousSchoolPhone-${index}`}
                          value={student.previousSchoolPhone}
                          onChange={(e) => handleChangeStudent(index, e)}
                          className={`mt-1 px-3 py-2 block w-full border ${studentsErrors[index]?.previousSchoolPhone ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out`}
                          placeholder="Enter Phone Number"
                          maxLength="10"
                        />
                        {studentsErrors[index]?.previousSchoolPhone && <p className="mt-1 text-sm text-red-600">{studentsErrors[index].previousSchoolPhone}</p>}
                      </div>

                      {/* Start Date */}
                      <div>
                        <label htmlFor={`previousSchoolStartDate-${index}`} className="block text-sm font-medium text-gray-700">Start Date <span className="text-red-500">*</span></label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Calendar size={20} className="text-gray-400" />
                          </div>
                          <input
                            type="date"
                            name="previousSchoolStartDate"
                            id={`previousSchoolStartDate-${index}`}
                            value={student.previousSchoolStartDate}
                            onChange={(e) => handleChangeStudent(index, e)}
                            className={`pl-10 pr-3 py-2 block w-full border ${studentsErrors[index]?.previousSchoolStartDate ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out`}
                          />
                        </div>
                        {studentsErrors[index]?.previousSchoolStartDate && <p className="mt-1 text-sm text-red-600">{studentsErrors[index].previousSchoolStartDate}</p>}
                      </div>

                      {/* End Date */}
                      <div>
                        <label htmlFor={`previousSchoolEndDate-${index}`} className="block text-sm font-medium text-gray-700">End Date <span className="text-red-500">*</span></label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Calendar size={20} className="text-gray-400" />
                          </div>
                          <input
                            type="date"
                            name="previousSchoolEndDate"
                            id={`previousSchoolEndDate-${index}`}
                            value={student.previousSchoolEndDate}
                            onChange={(e) => handleChangeStudent(index, e)}
                            className={`pl-10 pr-3 py-2 block w-full border ${studentsErrors[index]?.previousSchoolEndDate ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out`}
                          />
                        </div>
                        {studentsErrors[index]?.previousSchoolEndDate && <p className="mt-1 text-sm text-red-600">{studentsErrors[index].previousSchoolEndDate}</p>}
                      </div>
                    </div>

                    {/* Documents for Previous School */}
                    <div className="mt-6">
                      <label className="block text-sm font-medium mb-1 text-gray-700">Documents (Transcripts, Certificates, etc.) (Optional)</label>
                      <div
                        onDrop={(e) => {
                          e.preventDefault();
                          handleDocumentUploadStudent(index, { target: { files: e.dataTransfer.files } });
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        className="flex items-center justify-center p-4 border-2 border-dashed border-gray-400 rounded-md cursor-pointer bg-gray-50 hover:bg-gray-100 text-center min-h-[80px] transition duration-150 ease-in-out"
                        onClick={() => document.getElementById(`studentDocumentsInput-${index}`).click()}
                      >
                        <p className="text-gray-600 text-sm flex items-center gap-2"><Paperclip size={20} className="text-gray-500" /> Drag & drop or click to upload documents</p>
                      </div>
                      <input
                        id={`studentDocumentsInput-${index}`}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => handleDocumentUploadStudent(index, e)}
                      />
                      <div className="mt-2 space-y-2">
                        {(student.studentDocumentsFiles || []).map((file, docIndex) => (
                          <div key={docIndex} className="flex items-center justify-between p-2 border border-gray-200 rounded-md bg-white shadow-sm text-sm">
                            <span className="truncate">{file.name}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveDocumentStudent(index, docIndex)}
                              className="ml-4 text-red-500 hover:text-red-700"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            <div className="flex justify-center mt-8">
              <button
                type="button"
                onClick={handleAddChild}
                className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors shadow-lg text-lg font-medium transform hover:scale-105"
              >
                <Plus size={22} /> {studentsData.length === 0 ? 'Add Children' : 'Add Another Child'}
              </button>
            </div>
          </section>
        )}
      </form>

      {/* Submission Section */}
      <div className="flex justify-end gap-4 mt-12 pt-6 border-t border-gray-200">
        {submissionMessage && (
          <div className={`p-4 text-center text-lg font-semibold rounded-md w-full max-w-md ${submissionMessage.includes('successfully') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {submissionMessage}
          </div>
        )}
        <button
          type="submit"
          onClick={handleSubmit}
          className="px-10 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-lg text-lg font-medium transform hover:scale-105"
          disabled={loading}
        >
          {loading ? 'Submitting...' : 'Submit Admission'}
        </button>
      </div>
    </div>
  );
}

export default AdmissionModule;