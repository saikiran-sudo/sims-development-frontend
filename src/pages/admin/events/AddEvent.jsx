import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';

// Access API_BASE_URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'; // Fallback for development

const eventTypeOptions = [
  { value: 'Academic', label: 'Academic' },
  { value: 'Sport', label: 'Sport' },
  { value: 'Cultural', label: 'Cultural' },
  { value: 'Meeting', label: 'Meeting' },
  { value: 'Other', label: 'Other' },
];

const targetAudienceOptions = [
  { value: 'all', label: 'All' },
  { value: 'all_teachers', label: 'Teachers' },
  { value: 'all_students', label: 'Students' },
  { value: 'all_parents', label: 'Parents' },
];

const eventStatusOptions = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

function AddEvent({ show, onClose, onSave, eventToEdit }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventType: [],
    startDate: new Date(),
    endDate: null,
    status: 'upcoming',
    eventName: '',
    targetAudience: [],
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    console.log('event to me ', eventToEdit);
    if (eventToEdit) {
      console.log('targetGroups:', eventToEdit.targetGroups);
      console.log('targetAudience:', eventToEdit.targetAudience);
      setFormData({
        title: eventToEdit.title || '',
        description: eventToEdit.description || '',
        eventType: eventToEdit.eventType || [],
        startDate: eventToEdit.startDate ? new Date(eventToEdit.startDate) : new Date(),
        endDate: eventToEdit.endDate ? new Date(eventToEdit.endDate) : null,
        status: eventToEdit.status || 'upcoming',
        eventName: eventToEdit.eventName || '',
        targetAudience: eventToEdit.targetGroups || [], // Use targetGroups instead of targetAudience
      });
    } else {
      setFormData({
        title: '',
        description: '',
        eventType: [],
        startDate: new Date(),
        endDate: null,
        status: 'upcoming',
        eventName: '',
        targetAudience: [],
      });
    }
  }, [eventToEdit]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (formData.eventType.length === 0) newErrors.eventType = 'At least one event type is required';
    if (!formData.startDate) newErrors.startDate = 'Start Date is required';
    // if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
    //   newErrors.endDate = 'End Date must be after Start Date';
    // }
    if (!formData.eventName.trim()) newErrors.eventName = 'Event Name is required';
    if (formData.targetAudience.length === 0) newErrors.targetAudience = 'At least one target audience is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSelectChange = (selectedOptions, { name }) => {
    if (name === 'eventType' || name === 'targetAudience') {
      setFormData((prev) => ({ ...prev, [name]: selectedOptions ? selectedOptions.map(option => option.value) : [] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: selectedOptions ? selectedOptions.value : '' }));
    }
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleDateChange = (date, name) => {
    setFormData((prev) => ({ ...prev, [name]: date }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      const eventToSave = {
        ...formData,
        id: eventToEdit ? eventToEdit.id : null,
        startDate: formData.startDate ? formData.startDate.toISOString().split('T')[0] : '',
        endDate: formData.endDate ? formData.endDate.toISOString().split('T')[0] : null,
        targetAudience: formData.targetAudience,
      };
    }
    try {
      const eventData = {
        title: formData.title,
        eventName: formData.eventName,
        description: formData.description,
        startDate: formData.startDate,
        endDate: formData.endDate,
        eventType: formData.eventType,
        targetAudience: formData.targetAudience, // This will be converted to targetGroups and targetAudience in the backend
        status: formData.status,
        admin_id: user?.profile?._id || user?.profile?.userId || user?.profile?.user_id || '', // Add admin ID
      };
      const token = JSON.parse(localStorage.getItem('authToken'));
      if (eventToEdit) {
        const response = await axios.put(`${API_BASE_URL}/api/events/${eventToEdit._id}`, eventData, { // Use API_BASE_URL
          headers: { Authorization: `Bearer ${token}` }
        });
        setFormData({
          title: response.data.title,
          description: response.data.description,
          eventType: response.data.eventType,
          startDate: new Date(response.data.startDate),
          endDate: response.data.endDate ? new Date(response.data.endDate) : null,
          status: response.data.status,
          eventName: response.data.eventName,
          targetAudience: response.data.targetAudience,
        });
        onSave(formData);
        onClose();
      } else {
        // Logic for adding a new event
        const response = await axios.post(`${API_BASE_URL}/api/events/`, eventData, { // Use API_BASE_URL
          headers: {
            Authorization: `Bearer ${token}`,
          }
        });
        onClose();
      }
    } catch (e) {
      console.log("failed to add event", e);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="relative p-6 bg-white w-full max-w-2xl mx-auto rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">
            {eventToEdit ? 'Edit Event' : 'Add New Event'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`p-2 border rounded w-full ${errors.title ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Enter event title"
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
            </div>

            <div>
              <label htmlFor="eventName" className="block text-sm font-medium text-gray-700 mb-1">Event Name *</label>
              <input
                type="text"
                id="eventName"
                name="eventName"
                value={formData.eventName}
                onChange={handleChange}
                className={`p-2 border rounded w-full ${errors.eventName ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Enter event name"
              />
              {errors.eventName && <p className="text-red-500 text-sm mt-1">{errors.eventName}</p>}
            </div>

            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                placeholder="Provide a detailed description of the event..."
                className={`mt-1 block w-full border rounded-md shadow-sm p-2 ${errors.description ? 'border-red-500' : 'border-gray-300'} focus:ring-blue-500 focus:border-blue-500`}
              ></textarea>
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Type *</label>
              <Select
                name="eventType"
                options={eventTypeOptions}
                value={eventTypeOptions.filter(option => formData.eventType.includes(option.value))}
                onChange={handleSelectChange}
                isMulti
                placeholder="Select Event Type(s)"
                className="basic-multi-select"
                classNamePrefix="select"
              />
              {errors.eventType && <p className="text-red-500 text-sm mt-1">{errors.eventType}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Target Audience *</label>
              <Select
                name="targetAudience"
                options={targetAudienceOptions}
                value={targetAudienceOptions.filter(option => formData.targetAudience.includes(option.value))}
                onChange={handleSelectChange}
                isMulti
                placeholder="Select Target Audience(s)"
                className="basic-multi-select"
                classNamePrefix="select"
              />
              {errors.targetAudience && <p className="text-red-500 text-sm mt-1">{errors.targetAudience}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Start Date *</label>
              <DatePicker
                selected={formData.startDate}
                onChange={(date) => handleDateChange(date, 'startDate')}
                minDate={new Date()}
                className={`p-2 border rounded w-full ${errors.startDate ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">End Date (Optional)</label>
              <DatePicker
                selected={formData.endDate}
                onChange={(date) => handleDateChange(date, 'endDate')}
                minDate={formData.startDate || new Date()}
                isClearable
                className={`p-2 border rounded w-full ${errors.endDate ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.endDate && <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="p-2 border rounded w-full"
              >
                {eventStatusOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
              {eventToEdit ? 'Update Event' : 'Publish Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddEvent;
