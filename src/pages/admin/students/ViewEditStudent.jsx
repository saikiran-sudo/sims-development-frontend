// ViewEditStudent.jsx
import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import {
  Plus, X, Calendar, Venus, Briefcase, School, Paperclip, FileText, Image,
  Edit, Download, User, IdCard, Mail, Phone, Hash, BookOpen, Home, Key, Users
} from 'lucide-react';
import { classAPI } from '../../../services/api';
import axios from 'axios';

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

// Added new options for the Section dropdown
const SECTION_OPTIONS = [
  { value: '', label: 'Select Section' },
  { value: 'A', label: 'A' },
  { value: 'B', label: 'B' },
  { value: 'C', label: 'C' },
  { value: 'D', label: 'D' },
];

const ViewEditStudent = ({ onClose, onSave, data, editable = false, existingStudents, uploadFile, parentOptions = [] }) => {
  const [formData, setFormData] = useState({
    admissionNo: '',
    studentId: '',
    password: '',
    name: '',
    rollNumber: '',
    section: '',
    class: '',
    parent: [], // now array of user_ids
    status: 'active',
    avatar: '',
    address: '',
    gender: '',
    dateOfBirth: '',
    studentType: 'Current Student',
    previousSchoolName: '',
    previousSchoolAddress: '',
    previousSchoolStartDate: '',
    previousSchoolEndDate: '',
    documents: [],
    newPassword: '', // For updating password in edit mode
  });

  const [errors, setErrors] = useState({});
  const [documentsToUpload, setDocumentsToUpload] = useState([]);
  const [avatarToUpload, setAvatarToUpload] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [classOptions, setClassOptions] = useState([]);
  const [sectionOptions, setSectionOptions] = useState([]);

  useEffect(() => {
    if (data) {
      setFormData({
        ...data,
        class: data.class || '', // Store actual value
        gender: data.gender || '', // Store actual value
        studentType: data.studentType || 'Current Student', // Store actual value
        dateOfBirth: data.dateOfBirth || '',
        previousSchoolName: data.previousSchoolName || '',
        previousSchoolAddress: data.previousSchoolAddress || '',
        previousSchoolStartDate: data.previousSchoolStartDate || '',
        previousSchoolEndDate: data.previousSchoolEndDate || '',
        newPassword: '', // Clear newPassword on data load
        section: data.section || '',
        parent: data.parent || [], // ensure array
      });
      setAvatarPreview(data.avatar || '');
      setDocumentsToUpload([]); // Clear new documents on data load
    } else {
      // Reset form for adding new student
      setFormData({
        admissionNo: '',
        studentId: '',
        password: '',
        name: '',
        rollNumber: '',
        section: '',
        class: '',
        parent: [],
        status: 'active',
        avatar: '',
        address: '',
        gender: '',
        dateOfBirth: '',
        studentType: 'Current Student',
        previousSchoolName: '',
        previousSchoolAddress: '',
        previousSchoolStartDate: '',
        previousSchoolEndDate: '',
        documents: [],
        newPassword: '',
      });
      setAvatarPreview('');
      setDocumentsToUpload([]);
    }
    setErrors({});
  }, [data]);

  useEffect(() => {
    // Fetch class options from backend
    const fetchClassOptions = async () => {
      try {
        const response = await classAPI.getAllClasses();
        // Assuming response.data is an array of class objects with class_name property
        const uniqueClasses = Array.from(
          new Map(
            (response.data || response).map(cls => [
              cls.class_name || cls.name || cls.label || cls.value,
              cls
            ])
          ).values()
        );
        const uniqueSections = Array.from(
          new Map(
            (response.data || response).map(cls => [
              cls.section || cls.name || cls.label || cls.value,
              cls
            ])
          ).values()
        );
        const sectionOptions = uniqueSections.map(section => ({
          label: section.section || section.name || section.label || section.value,
          value: section.section || section.name || section.label || section.value
        }));
        const options = uniqueClasses.map(cls => ({
          label: cls.class_name || cls.name || cls.label || cls.value,
          value: cls.class_name || cls.name || cls.label || cls.value
        }));
        setClassOptions(options);
        setSectionOptions(sectionOptions);
      } catch (error) {
        setClassOptions([]); // fallback to empty
      }
    };
    fetchClassOptions();
  }, []);

  const validateForm = async () => {
    const newErrors = {};
    const {
      admissionNo, studentId, password, name, rollNumber, class: studentClass,
      parent, address, gender, dateOfBirth, studentType, previousSchoolName,
      previousSchoolAddress, previousSchoolStartDate, previousSchoolEndDate, newPassword
    } = formData;

    if (!admissionNo.trim()) newErrors.admissionNo = 'Admission No. is required';
    // Password is required for new students, optional for existing edits
    if (!data && !password.trim()) newErrors.password = 'Password is required';
    if (!data && password.trim().length < 6) newErrors.password = 'Password must be at least 6 characters long';
    if (editable && newPassword.trim() && newPassword.trim().length < 6) newErrors.newPassword = 'New password must be at least 6 characters long';
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!studentClass) newErrors.class = 'Class is required';
    if (!parent.length) newErrors.parent = 'Parent is required';
    if (!address.trim()) newErrors.address = 'Address is required';
    if (!gender) newErrors.gender = 'Gender is required';
    if (!dateOfBirth) newErrors.dateOfBirth = 'Date of Birth is required';

    if (studentType === 'Migrated Student') {
      if (!previousSchoolName.trim()) newErrors.previousSchoolName = 'Previous School Name is required for Migrated Students';
      if (!previousSchoolAddress.trim()) newErrors.previousSchoolAddress = 'Previous School Address is required for Migrated Students';
      if (!previousSchoolStartDate) newErrors.previousSchoolStartDate = 'Previous School Start Date is required for Migrated Students';
      if (!previousSchoolEndDate) newErrors.previousSchoolEndDate = 'Previous School End Date is required for Migrated Students';
    }

    // Check for duplicates, excluding the current student if in edit mode
    if (existingStudents) {
      const studentsToCheck = data ? existingStudents.filter(s => s.id !== data.id) : existingStudents;

      if (studentsToCheck.some(s => s.admissionNo.toLowerCase() === admissionNo.toLowerCase())) {
        newErrors.admissionNo = 'Admission No. already exists';
      }
      if (studentsToCheck.some(s => s.studentId.toLowerCase() === studentId.toLowerCase())) {
        newErrors.studentId = 'Student ID already exists';
      }
      if (rollNumber.trim() && studentsToCheck.some(s => s.rollNumber.toLowerCase() === rollNumber.toLowerCase())) {
        newErrors.rollNumber = 'Roll Number already exists';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSelectChange = (name, selectedOption) => {
    if (name === 'parent') {
      setFormData(prev => ({ ...prev, parent: selectedOption ? [selectedOption.value] : [] }));
      setErrors(prev => ({ ...prev, [name]: '' }));
      return;
    }
    setFormData(prev => ({ ...prev, [name]: selectedOption ? selectedOption.value : '' }));
    setErrors(prev => ({ ...prev, [name]: '' }));
    if (name === 'studentType' && selectedOption?.value === 'Current Student') {
      setFormData(prev => ({
        ...prev,
        previousSchoolName: '',
        previousSchoolAddress: '',
        previousSchoolStartDate: '',
        previousSchoolEndDate: '',
        documents: [],
      }));
    }
  };

  const handleDocumentUpload = async (event) => {
    try {
      const files = Array.from(event.target.files);

      // Upload each file individually
      for (const file of files) {
        const uploadFile = new FormData();
        uploadFile.append("file", file);
        uploadFile.append("upload_preset", "sims_development");
        uploadFile.append("cloud_name", "duxyycuty");

        // Use appropriate endpoint based on file type
        const isImage = file.type.startsWith('image/');
        const endpoint = isImage
          ? 'https://api.cloudinary.com/v1_1/duxyycuty/image/upload'
          : 'https://api.cloudinary.com/v1_1/duxyycuty/raw/upload';

        const response = await axios.post(endpoint, uploadFile);
        const url = response.data.secure_url;

        // Add the file object with URL to documentsToUpload
        setDocumentsToUpload(prev => [...prev, { file, url }]);
      }
    } catch (error) {
      console.error("Error uploading documents:", error);
      alert('Error uploading documents: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleRemoveExistingDocument = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleRemoveNewUploadDocument = (indexToRemove) => {
    setDocumentsToUpload(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleAvatarUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setAvatarToUpload(file);
      setAvatarPreview(URL.createObjectURL(file));
    } else {
      setAvatarToUpload(null);
      setAvatarPreview(formData.avatar || ''); // Revert to existing avatar if available
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isValid = await validateForm();
    if (isValid) {
      let finalAvatarUrl = formData.avatar;
      if (avatarToUpload) {
        const url = await uploadFile(avatarToUpload);
        if (url) {
          finalAvatarUrl = url;
        }
      }

      const newlyUploadedDocumentUrls = [];
      for (const doc of documentsToUpload) {
        if (doc.url) {
          // If it's already uploaded (has URL), use it directly
          newlyUploadedDocumentUrls.push({ name: doc.file.name, url: doc.url });
        } else {
          // If it's not uploaded yet, upload it using the uploadFile function
          const url = await uploadFile(doc.file || doc);
          if (url) {
            newlyUploadedDocumentUrls.push({ name: (doc.file || doc).name, url: url });
          }
        }
      }

      // Merge existing documents with newly uploaded ones
      const combinedDocuments = [...(formData.documents || []), ...newlyUploadedDocumentUrls];

      // Determine the final password
      const finalPassword = editable && formData.newPassword.trim() ? formData.newPassword.trim() : (formData.password || '');

      onSave({
        ...formData,
        avatar: finalAvatarUrl,
        documents: combinedDocuments,
        password: finalPassword,
        // Ensure class, gender, studentType are stored as values, not objects
        class: formData.class,
        gender: formData.gender,
        studentType: formData.studentType,
        section: formData.section, // Ensure section is saved as a value
        parent: formData.parent, // Ensure parent is saved as an array of user_ids
      });
      onClose();
    }
  };

  const getSelectValue = (options, value) => {
    return options.find(option => option.value === value) || null;
  };

  const dialogTitle = data
    ? (editable ? `Edit ${getSelectValue(STUDENT_TYPE_OPTIONS, formData.studentType)?.label || 'Student'} Details` : `View ${getSelectValue(STUDENT_TYPE_OPTIONS, formData.studentType)?.label || 'Student'} Details`)
    : 'Add New Student';

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>{dialogTitle}</DialogTitle>
        <DialogContent dividers>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Avatar Upload/Display */}
              <div className="md:col-span-2 flex flex-col items-center justify-center p-4">
                {editable ? (
                  <div
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files[0];
                      if (file && file.type.startsWith('image/')) {
                        setAvatarToUpload(file);
                        setAvatarPreview(URL.createObjectURL(file));
                      }
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    className="flex items-center justify-center p-4 border-2 border-dashed border-gray-400 rounded-full cursor-pointer bg-gray-50 hover:bg-gray-100 text-center w-32 h-32 overflow-hidden"
                    onClick={() => document.getElementById('avatar-upload').click()}
                  >
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <div className="flex flex-col items-center">
                        <Image className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="text-gray-600 text-sm">Drag & drop or click to upload</p>
                      </div>
                    )}
                  </div>
                ) : (
                  formData.avatar && (
                    <img src={formData.avatar} alt="Student Avatar" className="w-24 h-24 rounded-full object-cover mx-auto" />
                  )
                )}
                <input
                  id="avatar-upload"
                  name="avatar"
                  type="file"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  accept="image/*"
                  disabled={!editable}
                />
              </div>

              {/* Form Fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Admission No. {editable && <span className="text-red-500">*</span>}</label>
                <input type="text" name="admissionNo" value={formData.admissionNo} onChange={handleChange} readOnly={!editable}
                  className={`mt-1 block w-full border ${errors.admissionNo ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm p-2 ${!editable ? 'bg-gray-100' : ''}`} />
                {errors.admissionNo && <p className="text-red-500 text-xs mt-1">{errors.admissionNo}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Student ID {editable && <span className="text-red-500">*</span>}</label>
                <input type="text" name="studentId" value={formData.studentId} onChange={handleChange} readOnly={!editable}
                  className={`mt-1 block w-full border ${errors.studentId ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm p-2 ${!editable ? 'bg-gray-100' : ''}`} />
                {errors.studentId && <p className="text-red-500 text-xs mt-1">{errors.studentId}</p>}
              </div>

              {/* Password Field - only for adding or editing (newPassword) */}
              {!data && ( // Only show 'password' field for new student
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password {editable && <span className="text-red-500">*</span>}</label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} readOnly={!editable}
                      className={`mt-1 block w-full border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm p-2 pr-10 ${!editable ? 'bg-gray-100' : ''}`} />
                    {editable && (
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5">
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    )}
                  </div>
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                </div>
              )}
              {data && editable && ( // Only show 'newPassword' field in edit mode for existing student
                <div>
                  <label className="block text-sm font-medium text-gray-700">New Password (optional)</label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} name="newPassword" value={formData.newPassword} onChange={handleChange}
                      className={`mt-1 block w-full border ${errors.newPassword ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm p-2 pr-10`} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5">
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {errors.newPassword && <p className="text-red-500 text-xs mt-1">{errors.newPassword}</p>}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name {editable && <span className="text-red-500">*</span>}</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} readOnly={!editable}
                  className={`mt-1 block w-full border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm p-2 ${!editable ? 'bg-gray-100' : ''}`} />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Roll Number</label>
                <input type="text" name="rollNumber" value={formData.rollNumber} onChange={handleChange} readOnly={!editable}
                  className={`mt-1 block w-full border ${errors.rollNumber ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm p-2 ${!editable ? 'bg-gray-100' : ''}`} />
                {errors.rollNumber && <p className="text-red-500 text-xs mt-1">{errors.rollNumber}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Class {editable && <span className="text-red-500">*</span>}</label>
                <Select options={classOptions} value={getSelectValue(classOptions, formData.class)} onChange={(selected) => handleSelectChange('class', selected)} placeholder="Select Class"
                  className={`mt-1 basic-single ${errors.class ? 'border-red-500' : ''}`} classNamePrefix="select" isDisabled={!editable} />
                {errors.class && <p className="text-red-500 text-xs mt-1">{errors.class}</p>}
              </div>

              {/* Updated Section to use a Select dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Section</label>
                <Select
                  options={sectionOptions}
                  value={getSelectValue(sectionOptions, formData.section)}
                  onChange={(selected) => handleSelectChange('section', selected)}
                  placeholder="Select Section"
                  className="mt-1 basic-single"
                  classNamePrefix="select"
                  isDisabled={!editable}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Parent (User ID) {editable && <span className="text-red-500">*</span>}</label>
                <Select
                  options={parentOptions}
                  value={parentOptions.find(option => formData.parent && formData.parent[0] && String(option.value) === String(formData.parent[0])) || null}
                  onChange={selected => handleSelectChange('parent', selected)}
                  isDisabled={!editable}
                  placeholder="Select Parent by Name or User ID"
                  className={`mt-1 basic-single ${errors.parent ? 'border-red-500' : ''}`}
                  classNamePrefix="select"
                  isClearable
                />
                {errors.parent && <p className="text-red-500 text-xs mt-1">{errors.parent}</p>}
                {formData.parent && formData.parent[0] && (
                  <div className="text-xs text-gray-500 mt-1">Selected Parent User ID: {formData.parent[0]}</div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Address {editable && <span className="text-red-500">*</span>}</label>
                <input type="text" name="address" value={formData.address} onChange={handleChange} readOnly={!editable}
                  className={`mt-1 block w-full border ${errors.address ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm p-2 ${!editable ? 'bg-gray-100' : ''}`} />
                {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Gender {editable && <span className="text-red-500">*</span>}</label>
                <Select options={GENDER_OPTIONS} value={getSelectValue(GENDER_OPTIONS, formData.gender)} onChange={(selected) => handleSelectChange('gender', selected)} placeholder="Select Gender"
                  className={`mt-1 basic-single ${errors.gender ? 'border-red-500' : ''}`} classNamePrefix="select" isDisabled={!editable} />
                {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Date of Birth {editable && <span className="text-red-500">*</span>}</label>
                <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} readOnly={!editable}
                  className={`mt-1 block w-full border ${errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm p-2 ${!editable ? 'bg-gray-100' : ''}`} />
                {errors.dateOfBirth && <p className="text-red-500 text-xs mt-1">{errors.dateOfBirth}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Student Type</label>
                <Select options={STUDENT_TYPE_OPTIONS} value={getSelectValue(STUDENT_TYPE_OPTIONS, formData.studentType)} onChange={(selected) => handleSelectChange('studentType', selected)} placeholder="Select Student Type"
                  className="mt-1 basic-single" classNamePrefix="select" isDisabled={!editable} />
              </div>

              {formData.studentType === 'Migrated Student' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Previous School Name {editable && <span className="text-red-500">*</span>}</label>
                    <input type="text" name="previousSchoolName" value={formData.previousSchoolName} onChange={handleChange} readOnly={!editable}
                      className={`mt-1 block w-full border ${errors.previousSchoolName ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm p-2 ${!editable ? 'bg-gray-100' : ''}`} />
                    {errors.previousSchoolName && <p className="text-red-500 text-xs mt-1">{errors.previousSchoolName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Previous School Address {editable && <span className="text-red-500">*</span>}</label>
                    <input type="text" name="previousSchoolAddress" value={formData.previousSchoolAddress} onChange={handleChange} readOnly={!editable}
                      className={`mt-1 block w-full border ${errors.previousSchoolAddress ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm p-2 ${!editable ? 'bg-gray-100' : ''}`} />
                    {errors.previousSchoolAddress && <p className="text-red-500 text-xs mt-1">{errors.previousSchoolAddress}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Previous School Start Date {editable && <span className="text-red-500">*</span>}</label>
                    <input type="date" name="previousSchoolStartDate" value={formData.previousSchoolStartDate} onChange={handleChange} readOnly={!editable}
                      className={`mt-1 block w-full border ${errors.previousSchoolStartDate ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm p-2 ${!editable ? 'bg-gray-100' : ''}`} />
                    {errors.previousSchoolStartDate && <p className="text-red-500 text-xs mt-1">{errors.previousSchoolStartDate}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Previous School End Date {editable && <span className="text-red-500">*</span>}</label>
                    <input type="date" name="previousSchoolEndDate" value={formData.previousSchoolEndDate} onChange={handleChange} readOnly={!editable}
                      className={`mt-1 block w-full border ${errors.previousSchoolEndDate ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm p-2 ${!editable ? 'bg-gray-100' : ''}`} />
                    {errors.previousSchoolEndDate && <p className="text-red-500 text-xs mt-1">{errors.previousSchoolEndDate}</p>}
                  </div>

                  {/* Documents Section */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Documents</label>
                    <ul className="mb-4">
                      {formData.documents.map((doc, index) => (
                        <li key={`existing-${index}`} className="flex justify-between items-center bg-gray-100 p-2 rounded mb-1">
                          <a href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                            <FileText size={14} /> {doc.name}
                          </a>
                          {editable && (
                            <button type="button" onClick={() => handleRemoveExistingDocument(index)} className="text-red-500 hover:text-red-700">
                              <X size={16} />
                            </button>
                          )}
                          {!editable && <Download size={16} className="text-gray-500" />}
                        </li>
                      ))}
                      {documentsToUpload.map((file, index) => (
                        <li key={`new-${index}`} className="flex justify-between items-center bg-gray-100 p-2 rounded mb-1">
                          <span className="flex items-center gap-1">
                            <Paperclip size={14} /> {file.name}
                          </span>
                          {editable && (
                            <button type="button" onClick={() => handleRemoveNewUploadDocument(index)} className="text-red-500 hover:text-red-700">
                              <X size={16} />
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>

                    {editable && (
                      <div
                        className="flex items-center justify-center p-4 border-2 border-dashed border-gray-400 rounded cursor-pointer bg-gray-50 hover:bg-gray-100 text-center"
                        onClick={() => document.getElementById('document-upload').click()}
                      >
                        <Plus size={20} className="text-gray-500 mr-2" />
                        <p className="text-gray-600 text-sm">Drag & drop or click to upload documents</p>
                      </div>
                    )}
                    <input
                      id="document-upload"
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleDocumentUpload}
                      disabled={!editable}
                    />
                  </div>
                </>
              )}
            </div>
          </form>
        </DialogContent>
        <DialogActions>
          <button
            type="button"
            onClick={() => { onClose(); setErrors({}); }}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            {editable ? 'Cancel' : 'Close'}
          </button>
          {editable && (
            <button
              type="submit"
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Save
            </button>
          )}
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ViewEditStudent;