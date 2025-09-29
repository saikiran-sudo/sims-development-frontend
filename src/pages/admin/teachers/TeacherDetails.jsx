// TeacherDetails.jsx
import axios from 'axios';
import React, { useState, useEffect } from 'react';
import Select from 'react-select';

// Access API_BASE_URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Helper function to extract the section part from class_name
const getSectionForDisplay = (className, section) => {
  if (!className || !section) {
    return '';
  }
  
  // For pre-primary classes (Nursery, LKG, UKG)
  if (['Nursery', 'LKG', 'UKG'].includes(className)) {
    return section;
  } else {
    // For numbered classes, return the section
    return section;
  }
};

// Function to format class objects for react-select options
const formatClassOption = (cls) => {
  if (!cls || !cls.class_name) {
    return { label: 'Unknown Class', value: '' };
  }
  
  const sectionPart = getSectionForDisplay(cls.class_name, cls.section);
  let label = cls.class_name;
  let value = cls.class_name;
  if (sectionPart) {
    label += `-${sectionPart}`;
    value += `-${sectionPart}`;
  }
  return { label: label, value: value }; // Value includes both class_name and section
};

function TeacherDetails({ data, editable = false, onClose, onUpdate, existingTeachers = [] }) {
  const [formData, setFormData] = useState({
    ...data,
    class_teacher: null,
    password: '', // Always start with empty password for security
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [allClasses, setAllClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);

  useEffect(() => {
    const fetchAllClasses = async () => {
      try {
        setLoadingClasses(true);
        const token = JSON.parse(localStorage.getItem('authToken'));
        const response = await axios.get(`${API_BASE_URL}/api/classes/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAllClasses(response.data);
      } catch (error) {
        console.error('Error fetching all classes for dropdown:', error);
      } finally {
        setLoadingClasses(false);
      }
    };
    fetchAllClasses();
  }, []);

  const classOptions = React.useMemo(() => allClasses.map(formatClassOption), [allClasses]);

  useEffect(() => {
    if (data && classOptions.length > 0) {
      setFormData({
        ...data,
        class_teacher: data.class_teacher
          ? classOptions.find(opt => opt.value === data.class_teacher) || 
            classOptions.find(opt => opt.value.startsWith(data.class_teacher + '-')) ||
            { label: data.class_teacher, value: data.class_teacher }
          : null,
        password: '', // Don't populate password field for security
      });
    }
  }, [data, classOptions]);

  const validateForm = () => {
    const newErrors = {};
    const { user_id, full_name, email, phone, password } = formData;
    const trimmedUserId = user_id?.trim();
    const trimmedName = full_name?.trim();
    const trimmedEmail = email?.trim().toLowerCase();
    const trimmedPhone = phone?.trim();

    if (!trimmedUserId) newErrors.user_id = 'User ID is required';
    if (!trimmedName) newErrors.full_name = 'Name is required';

    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!trimmedEmail) newErrors.email = 'Email is required';
    else if (!gmailRegex.test(trimmedEmail)) {
      newErrors.email = 'Only Gmail addresses are allowed';
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!trimmedPhone) newErrors.phone = 'Phone number is required';
    else if (!phoneRegex.test(trimmedPhone)) {
      newErrors.phone = 'Phone number must be exactly 10 digits';
    }

    // Class teacher is no longer mandatory, so removed validation here

    existingTeachers
      .filter((t) => t._id !== data._id)
      .forEach((t) => {
        if (t.user_id.toLowerCase() === trimmedUserId?.toLowerCase()) {
          newErrors.user_id = 'Duplicate User ID found';
        }
        if (trimmedEmail && t.email?.toLowerCase() === trimmedEmail) {
          newErrors.email = 'Duplicate Gmail ID found';
        }
        if (trimmedPhone && t.phone === trimmedPhone) {
          newErrors.phone = 'Duplicate phone number found';
        }
      });

    // Only validate password if it's provided (for updates) or if it's a new teacher
    if (editable && password && password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleClassTeacherChange = (selected) => {
    setFormData((prev) => ({ ...prev, class_teacher: selected }));
    setErrors((prev) => ({ ...prev, class_teacher: '' }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setFormData((prev) => ({
        ...prev,
        image: URL.createObjectURL(file),
        imageFile: file,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        image: null,
        imageFile: null,
      }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      console.log('Validation failed:', errors);
      return;
    }

    try {
      const token = JSON.parse(localStorage.getItem('authToken'));
      if (!token) {
        console.error('Authentication token not found.');
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append('user_id', formData.user_id.trim());
      formDataToSend.append('full_name', formData.full_name.trim());
      formDataToSend.append('email', formData.email.trim().toLowerCase());
      formDataToSend.append('phone', formData.phone.trim());
      formDataToSend.append('address', formData.address?.trim() || '');
      // formDataToSend.append('subjects_taught', JSON.stringify([]));
      formDataToSend.append('class_teacher', formData.class_teacher?.value || ''); // Make sure to send null or empty string if not selected

      if (formData.password) {
        formDataToSend.append('password', formData.password);
      }

      if (formData.imageFile) {
        formDataToSend.append('image', formData.imageFile);
      } else if (formData.image && typeof formData.image === 'string' && !formData.image.startsWith('blob:')) {
        formDataToSend.append('image', formData.image);
      }

      await axios.put(`${API_BASE_URL}/api/teachers/${formData._id}`, formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      onUpdate({
        ...formData,
        class_teacher: formData.class_teacher?.value || '', // Send back null/empty string if not selected
        image: formData.imageFile ? URL.createObjectURL(formData.imageFile) : formData.image,
      });
      onClose();
    } catch (err) {
      console.error('Error updating teacher:', err);
      if (err.response && err.response.data && err.response.data.message) {
        alert(`Error: ${err.response.data.message}`);
      } else {
        alert('Failed to update teacher. Please try again later.');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[90%] md:w-[450px] max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">
          {editable ? 'Edit Teacher Details' : 'Teacher Details'}
        </h2>

        <div className="flex flex-col gap-3">
          <div>
            <input
              name="user_id"
              value={formData.user_id}
              onChange={handleChange}
              disabled={!editable}
              placeholder="Teacher EMP ID *"
              className={`p-2 border rounded w-full ${errors.user_id ? 'border-red-500' : 'border-gray-300'
                }`}
            />
            {errors.user_id && (
              <p className="text-red-500 text-sm mt-1">{errors.user_id}</p>
            )}
          </div>

          {editable && (
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password || ''}
                onChange={handleChange}
                placeholder="New Password"
                className={`p-2 border rounded w-full ${errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </div>
          )}

          {['full_name', 'email', 'phone', 'address'].map((field) => (
            <div key={field}>
              <input
                name={field}
                value={formData[field]}
                onChange={handleChange}
                disabled={!editable}
                placeholder={`${field.charAt(0).toUpperCase() + field.slice(1)} *`}
                className={`p-2 border rounded w-full ${errors[field] ? 'border-red-500' : 'border-gray-300'
                  }`}
              />
              {errors[field] && (
                <p className="text-red-500 text-sm mt-1">{errors[field]}</p>
              )}
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium mb-1">Class Teacher</label> {/* Removed '*' */}
            <Select
              options={classOptions}
              value={formData.class_teacher}
              onChange={handleClassTeacherChange}
              placeholder={loadingClasses ? "Loading classes..." : "Select class teacher..."}
              isClearable // Allows clearing the selection
              isDisabled={!editable || loadingClasses}
            />
            {errors.class_teacher && <p className="text-red-500 text-sm mt-1">{errors.class_teacher}</p>}
          </div>

          {editable && (
            <div>
              <label className="block text-sm font-medium mb-1">Upload Image</label>
              <div
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file && file.type.startsWith('image/')) {
                    setFormData((prev) => ({
                      ...prev,
                      image: URL.createObjectURL(file),
                      imageFile: file,
                    }));
                  }
                }}
                onDragOver={(e) => e.preventDefault()}
                className="flex items-center justify-center p-4 border-2 border-dashed border-gray-400 rounded cursor-pointer bg-gray-50 hover:bg-gray-100 text-center"
                onClick={() => document.getElementById('fileInputEdit').click()}
              >
                {formData.image ? (
                  <img
                    src={formData.image}
                    alt="Preview"
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <p className="text-gray-600 text-sm">Drag & drop or click to upload</p>
                )}
              </div>
              <input
                id="fileInputEdit"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>
          )}

          {!editable && formData.image && (
            <img
              src={formData.image}
              alt="Teacher"
              className="w-24 h-24 rounded-full object-cover mx-auto mt-3"
            />
          )}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">Close</button>
          {editable && (
            <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded">
              Save
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default TeacherDetails;