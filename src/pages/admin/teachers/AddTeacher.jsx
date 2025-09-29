// AddTeacher.jsx
import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Helper function to extract the section part from class_name
const getSectionForDisplay = (className, grade) => {
  // If grade is undefined or null, return empty string
  if (!grade) {
    return '';
  }
  
  if (['Nursery', 'LKG', 'UKG'].includes(grade)) {
    const gradePart = grade.replace(/\s/g, '');
    if (className.startsWith(gradePart)) {
      let section = className.substring(gradePart.length);
      return section.replace(/([A-Z])/g, ' $1').trim();
    }
    return className;
  } else {
    const classNumberMatch = grade.match(/\d+/);
    const classNumber = classNumberMatch ? classNumberMatch[0] : '';

    const sectionMatch = className.match(new RegExp(`^${classNumber}([A-Za-z])$`));
    if (sectionMatch && sectionMatch[1]) {
      return sectionMatch[1].toUpperCase();
    }
    return '';
  }
};

// Function to format class objects for react-select options
const formatClassOption = (cls) => {
  // Safety check for malformed class objects
  if (!cls || !cls.class_name) {
    return { label: 'Invalid Class', value: '' };
  }
  
  // Create label and value with both class name and section
  let label = cls.class_name;
  let value = cls.class_name;
  
  if (cls.section) {
    label += `-${cls.section}`;
    value += `-${cls.section}`;
  }
  
  return { label: label, value: value };
};

// Custom Message Box Component
const MessageBox = ({ message, type, onClose }) => {
  const bgColor = type === 'success' ? 'bg-green-100' : 'bg-red-100';
  const textColor = type === 'success' ? 'text-green-800' : 'text-red-800';
  const borderColor = type === 'success' ? 'border-green-200' : 'border-red-200';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-lg shadow-lg text-center p-6 border ${borderColor}`}>
        <p className={`text-lg font-semibold mb-4 ${textColor}`}>{message}</p>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          OK
        </button>
      </div>
    </div>
  );
};

function AddTeacher({ onClose, onSave, existingTeachers }) {
  const [formData, setFormData] = useState({
    empId: '',
    password: '',
    name: '',
    email: '',
    phone: '',
    classTeacher: null,
    address: '',
    image: null,
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const { user } = useAuth();
  const [messageBox, setMessageBox] = useState(null);
  const [allClasses, setAllClasses] = useState([]);

  useEffect(() => {
    const fetchAllClasses = async () => {
      try {
        const token = JSON.parse(localStorage.getItem('authToken'));
        const response = await axios.get(`${API_BASE_URL}/api/classes/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAllClasses(response.data);
      } catch (error) {
        console.error('Error fetching all classes for dropdown:', error);
      }
    };
    fetchAllClasses();
  }, []);

  const classOptions = allClasses
    .filter(cls => cls && cls.class_name)
    .map(formatClassOption)
    .filter(option => option.value !== ''); // Remove invalid options

  const validateForm = () => {
    const newErrors = {};
    const { empId, name, email, phone, password } = formData;
    const trimmedEmpId = empId.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = phone.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmpId) newErrors.empId = 'EMP ID is required';
    if (!trimmedPassword) newErrors.password = 'Password is required';
    if (!name.trim()) newErrors.name = 'Name is required';

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

    // Class Teacher is no longer mandatory, so removed validation here

    const validExistingTeachers = Array.isArray(existingTeachers) ? existingTeachers.filter(t => t) : [];

    if (validExistingTeachers.some(t => (t.user_id?.toLowerCase() || '') === trimmedEmpId.toLowerCase())) {
      newErrors.empId = 'Duplicate EMP ID found';
    }

    if (validExistingTeachers.some(t => (t.email?.toLowerCase() || '') === trimmedEmail)) {
      newErrors.email = 'Duplicate Gmail ID found';
    }

    if (validExistingTeachers.some(t => (t.phone || '') === trimmedPhone)) {
      newErrors.phone = 'Duplicate phone number found';
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
    setFormData((prev) => ({ ...prev, classTeacher: selected }));
    setErrors((prev) => ({ ...prev, classTeacher: '' }));
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];

    const uploadFile = new FormData();
    uploadFile.append("file", file);
    uploadFile.append("upload_preset", "sims_development");
    uploadFile.append("cloud_name", "duxyycuty");

    try {
      const response = await axios.post('https://api.cloudinary.com/v1_1/duxyycuty/image/upload', uploadFile);
      const imageUrl = response.data.url;
      setFormData((prev) => ({ ...prev, image: imageUrl }));
      setErrors((prev) => ({ ...prev, image: '' }));
    } catch (error) {
      console.error('Error uploading image:', error);
      setErrors((prev) => ({ ...prev, image: 'Failed to upload image' }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      setMessageBox({ message: "Please correct the errors in the form.", type: "error" });
      return;
    }

    const trimmedEmpId = formData.empId.trim();
    if (!trimmedEmpId) {
      setErrors(prev => ({ ...prev, empId: 'EMP ID cannot be empty' }));
      setMessageBox({ message: "EMP ID cannot be empty.", type: "error" });
      return;
    }

    try {
      const token = JSON.parse(localStorage.getItem('authToken'));
      if (!token) {
        setMessageBox({ message: 'No token found. Please log in.', type: 'error' });
        return;
      }

      const dataToSend = {
        user_id: trimmedEmpId,
        full_name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password.trim(),
        phone: formData.phone.trim(),
        address: formData.address?.trim() || '',
        qualification: formData.qualification?.trim() || '',
        // subjects_taught: JSON.stringify([]),
        class_teacher: formData.classTeacher?.value || '', // Send null or empty string if not selected
        profile_image: formData.image,
        certificates: [],
        admin_id: user?.profile?._id || user?.profile?.userId || user?.profile?.user_id || '',
      };

      const response = await axios.post(`${API_BASE_URL}/api/teachers/`, dataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      setMessageBox({ message: 'Teacher added successfully!', type: 'success' });
      onSave(response.data);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to add teacher.';
      // setMessageBox({ message: errorMessage, type: 'error' });
      setMessageBox({ message: 'Something went wrong', type: 'error' });
    }
  };

  const handleMessageBoxClose = () => {
    setMessageBox(null);
    if (messageBox?.type === 'success') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[90%] md:w-[450px] max-h-[90vh] overflow-y-auto shadow-xl">
        <h2 className="text-xl font-semibold mb-4">Add New Teacher</h2>
        <div className="flex flex-col gap-3">

          <div>
            <input
              name="empId"
              value={formData.empId}
              onChange={handleChange}
              placeholder="Teacher EMP ID *"
              className={`p-2 border rounded w-full ${errors.empId ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.empId && <p className="text-red-500 text-sm mt-1">{errors.empId}</p>}
          </div>

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password *"
              className={`p-2 pr-10 border rounded w-full ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-600 text-lg"
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
          </div>

          {['name', 'email', 'phone', 'address'].map((field) => (
            <div key={field}>
              <input
                name={field}
                value={formData[field]}
                onChange={handleChange}
                placeholder={`${field.charAt(0).toUpperCase() + field.slice(1)} *`}
                className={`p-2 border rounded w-full ${errors[field] ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors[field] && <p className="text-red-500 text-sm mt-1">{errors[field]}</p>}
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium mb-1">Class Teacher</label> {/* Removed '*' */}
            <Select
              options={classOptions}
              value={formData.classTeacher}
              onChange={handleClassTeacherChange}
              placeholder="Select class teacher..."
              isClearable // Allows clearing the selection
            />
            {errors.classTeacher && <p className="text-red-500 text-sm mt-1">{errors.classTeacher}</p>}
          </div>


          <div>
            <label className="block text-sm font-medium mb-1">Upload Image *</label>
            <div
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file && file.type.startsWith('image/')) {
                  setFormData((prev) => ({ ...prev, image: URL.createObjectURL(file) }));
                  setErrors((prev) => ({ ...prev, image: '' }));
                }
              }}
              onDragOver={(e) => e.preventDefault()}
              className={`flex items-center justify-center p-4 border-2 border-dashed rounded cursor-pointer text-center ${errors.image ? 'border-red-500 bg-red-50' : 'border-gray-400 bg-gray-50 hover:bg-gray-100'
                }`}
              onClick={() => document.getElementById('fileInput').click()}
            >
              {formData.image ? (
                <img src={formData.image} alt="Preview" className="w-24 h-24 rounded-full object-cover" />
              ) : (
                <p className="text-gray-600 text-sm">Drag & drop or click to upload</p>
              )}
            </div>
            {errors.image && <p className="text-red-500 text-sm mt-1">{errors.image}</p>}
            <input id="fileInput" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </div>

        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">Cancel</button>
          <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded">Add</button>
        </div>
      </div>

      {messageBox && (
        <MessageBox
          message={messageBox.message}
          type={messageBox.type}
          onClose={handleMessageBoxClose}
        />
      )}
    </div>
  );
}

export default AddTeacher;