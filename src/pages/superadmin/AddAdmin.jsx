import React, { useState } from 'react';
import { PlusCircle, Building2, Mail, User, Key, Eye, EyeOff, Calendar, Image as ImageIcon, UploadCloud, Phone } from 'lucide-react'; // Import Phone icon
import axios from 'axios';

// Access API_BASE_URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; // Fallback for development

const AddAdmin = ({ admins, setAdmins, calculateRenewalDate }) => {
  const [formData, setFormData] = useState({
    schoolName: '',
    email: '',
    userId: '',
    password: '',
    confirmPassword: '',
    contactNumber: '', // Added contactNumber
    planType: 'monthly'
  });

  const [profileImage, setProfileImage] = useState(null); // State for profile image file
  const [profileImagePreview, setProfileImagePreview] = useState(null); // State for image preview (initially null)
  const [isDragOver, setIsDragOver] = useState(false); // New state for drag-and-drop visual feedback

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormError('');
  };

  // New function to process the file (from input or drag-drop)
  const processFile = (file) => {
    if (file && file.type.startsWith('image/')) {
      setProfileImage(file);
      setProfileImagePreview(URL.createObjectURL(file)); // Create a preview URL
      setFormError('');
    } else if (file) {
      setFormError('Please upload a valid image file (e.g., JPG, PNG, GIF).');
      setProfileImage(null);
      setProfileImagePreview(null); // Clear preview on error
    } else {
      setProfileImage(null);
      setProfileImagePreview(null); // Clear preview if no file
      setFormError('');
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];

    const uploadFile = new FormData();
    uploadFile.append("file", file);
    uploadFile.append("upload_preset", "sims_development");
    uploadFile.append("cloud_name", "duxyycuty");

    try {
      const response = await axios.post('https://api.cloudinary.com/v1_1/duxyycuty/image/upload', uploadFile);
      const profileImageUrl = response.data.url;
      setProfileImagePreview(profileImageUrl);
    } catch (error) {
      console.error('Error uploading profile image:', error);
    }
  };

  // Drag and Drop Handlers
  const handleDragOver = (e) => {
    e.preventDefault(); // Necessary to allow a drop
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  // Replace handleSubmit with axios logic
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setFormError("Passwords don't match!");
      return;
    }

    if (admins.some(admin => admin.userId === formData.userId)) {
      setFormError('User ID already exists!');
      return;
    }
    if (admins.some(admin => admin.email === formData.email)) {
      setFormError('Email ID already exists!');
      return;
    }
    // New: Check for unique contact number
    if (admins.some(admin => admin.contactNumber === formData.contactNumber)) {
      setFormError('Contact number already exists!');
      return;
    }


    const today = new Date().toISOString().split('T')[0];
    const renewalDate = calculateRenewalDate(formData.planType);

    try {
      // Prepare payload (add image logic if needed)
      const payload = {
        ...formData,
        createdAt: today,
        renewalDate,
        profileImage: profileImagePreview // Or handle Cloudinary upload if needed
      };
      console.log('payload is ',payload);
      const response = await axios.post(`${API_BASE_URL}/api/admins/`, payload);
      setAdmins(prev => [...prev, response.data]);
      setFormData({
        schoolName: '',
        email: '',
        userId: '',
        password: '',
        confirmPassword: '',
        contactNumber: '',
        planType: 'monthly'
      });
      setProfileImage(null);
      setProfileImagePreview(null);
      setFormError('');
      setShowPassword(false);
      setShowConfirmPassword(false);
    } catch (error) {
      setFormError(error.response?.data?.message || 'Failed to add admin');
    }
  };

  return (
    <section className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center">
          <PlusCircle className="mr-3 text-indigo-600 h-6 w-6" />
          Register New School Admin
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* School Name Input */}
          <div className="space-y-1">
            <label htmlFor="schoolName" className="block text-sm font-medium text-gray-700">
              School Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                id="schoolName"
                name="schoolName"
                value={formData.schoolName}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-all placeholder-gray-400"
                placeholder="e.g., Green Valley High"
                required
              />
            </div>
          </div>

          {/* Email ID Input */}
          <div className="space-y-1">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email ID <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-all placeholder-gray-400"
                placeholder="admin@school.com"
                required
              />
            </div>
          </div>

          {/* User ID Input */}
          <div className="space-y-1">
            <label htmlFor="userId" className="block text-sm font-medium text-gray-700">
              User ID <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                id="userId"
                name="userId"
                value={formData.userId}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-all placeholder-gray-400"
                placeholder="unique_admin_id"
                required
              />
            </div>
          </div>

          {/* Contact Number Input */}
          <div className="space-y-1">
            <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700">
              Contact Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="tel" // Use type="tel" for phone numbers
                id="contactNumber"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-all placeholder-gray-400"
                placeholder="e.g., 9876543210"
                required
                pattern="[0-9]{10}" // Simple 10-digit number pattern
                title="Please enter a 10-digit phone number"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-all placeholder-gray-400"
                placeholder="********"
                required
                minLength="8"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Confirm Password Input */}
          <div className="space-y-1">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-all placeholder-gray-400"
                placeholder="********"
                required
                minLength="8"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Plan Type Selection */}
          <div className="space-y-1">
            <label htmlFor="planType" className="block text-sm font-medium text-gray-700">
              Plan Type <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                id="planType"
                name="planType"
                value={formData.planType}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-all appearance-none bg-white"
                required
              >
                <option value="monthly">Monthly Plan</option>
                <option value="yearly">Yearly Plan</option>
              </select>
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            </div>
          </div>

          {/* Profile Image Upload (Drag and Drop) */}
          <div className="space-y-1 md:col-span-2"> {/* Make it span 2 columns for better layout */}
            <label className="block text-sm font-medium text-gray-700">
              Upload Profile Image (Optional)
            </label>
            <div
              className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg transition-colors duration-200
                ${isDragOver ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 bg-gray-50'}
                relative cursor-pointer`} 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                type="file"
                id="profileImage"
                name="profileImage"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="text-center">
                {profileImagePreview ? (
                  <img
                    src={profileImagePreview}
                    alt="Profile Preview"
                    className="mx-auto w-20 h-20 rounded-full object-cover border-2 border-indigo-300 mb-2"
                  />
                ) : (
                  <>
                    <UploadCloud className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold text-indigo-600">Drag & drop</span> or <span className="font-semibold text-indigo-600">click to upload</span>
                    </p>
                  </>
                )}
                <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 5MB</p>
                {profileImage && (
                  <p className="text-xs text-gray-500 mt-1">Selected: {profileImage.name}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {formError && (
          <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
            {formError}
          </div>
        )}

        <div className="pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium shadow hover:bg-indigo-700 transition-colors duration-200 flex items-center justify-center"
          >
            <PlusCircle className="mr-2 h-5 w-5" />
            Add Admin
          </button>
        </div>
      </form>
    </section>
  );
};

export default AddAdmin;