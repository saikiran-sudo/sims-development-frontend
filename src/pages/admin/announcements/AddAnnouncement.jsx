import React, { useState } from 'react';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useAnnouncements } from './AnnouncementProvider'; // Import the hook
import axios from 'axios'
import { useAuth } from '../../../contexts/AuthContext';

// Access API_BASE_URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'; // Fallback for development

const targetOptions = [
  { value: 'all', label: 'All' },
  { value: 'all_students', label: 'Students' },
  { value: 'all_teachers', label: 'Teachers' },
  { value: 'all_parents', label: 'Parents' }
];

function AddAnnouncement({ onClose }) { // Remove onSave prop
  const { handleAddAnnouncement } = useAnnouncements(); // Get handler from context
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    target: [],
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 7 days from now
    status: 'active'
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.content.trim()) newErrors.content = 'Content is required';
    if (formData.target.length === 0) newErrors.target = 'At least one target is required';
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    // if (formData.endDate < formData.startDate || formData.endDate !== null) newErrors.endDate = 'End date must be after start date';
    if (formData.endDate && formData.endDate < formData.startDate) {
      newErrors.endDate = 'End date must be after start date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleTargetChange = (selected) => {
    setFormData(prev => ({ ...prev, target: selected }));
    setErrors(prev => ({ ...prev, target: '' }));
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const token = JSON.parse(localStorage.getItem('authToken'));
      
      const response = await axios.post(`${API_BASE_URL}/api/announcements/`, { 
        title: formData.title.trim(),
        content: formData.content.trim(),
        target: formData.target.map(t => t.value),
        startDate: formData.startDate.toISOString().split('T')[0],
        endDate: formData.endDate ? new Date(formData.endDate).toISOString().split('T')[0] : null,
        status: formData.status,
        admin_id: user?.profile?._id || user?.profile?.userId || user?.profile?.user_id || ''
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      handleAddAnnouncement(response.data); // Use context handler
      onClose();
    } catch (e) {
      console.log('failed to add announcement ', e)
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[90%] md:w-[600px] max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-semibold mb-4">Add New Announcement</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`p-2 border rounded w-full ${errors.title ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Content *</label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              rows="4"
              className={`p-2 border rounded w-full ${errors.content ? 'border-red-500' : 'border-gray-300'}`}
            ></textarea>
            {errors.content && <p className="text-red-500 text-sm mt-1">{errors.content}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Target Audience *</label>
            <Select
              name="target"
              isMulti
              options={targetOptions}
              value={formData.target}
              onChange={handleTargetChange}
              classNamePrefix="react-select"
              className={`${errors.target ? 'border-red-500 rounded' : ''}`}
              placeholder="Select Target Audience"
            />
            {errors.target && <p className="text-red-500 text-sm mt-1">{errors.target}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start Date *</label>
              <DatePicker
                selected={formData.startDate}
                onChange={(date) => {
                  setFormData(prev => ({ ...prev, startDate: date }));
                  setErrors(prev => ({ ...prev, startDate: '' }));
                }}
                className={`p-2 border rounded w-full ${errors.startDate ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">End Date (Optional)</label>
              <DatePicker
                selected={formData.endDate}
                onChange={(date) => {
                  setFormData(prev => ({ ...prev, endDate: date }));
                  setErrors(prev => ({ ...prev, endDate: '' }));
                }}
                minDate={formData.startDate}
                className={`p-2 border rounded w-full ${errors.endDate ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.endDate && <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="p-2 border rounded w-full"
            >
              <option value="active">Active</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">Cancel</button>
          <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded">Publish</button>
        </div>
      </div>
    </div>
  );
}

export default AddAnnouncement;
