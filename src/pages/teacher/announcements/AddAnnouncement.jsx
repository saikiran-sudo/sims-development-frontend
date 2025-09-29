import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useAnnouncements } from './AnnouncementProvider'; // Import the hook
import api from '../../../utils/axiosConfig'; // Use configured axios instance
import { 
  fetchClassesUnderMyAdmin, 
  fetchAllSections, 
  fetchSectionsForClass,
  extractSectionsFromClasses,
  sectionsToOptions
} from '../../../utils/classUtils';

const targetOptions = [
  { value: 'all', label: 'All' },
  { value: 'all_students', label: 'Students' },
  { value: 'all_parents', label: 'Parents' },
];

function AddAnnouncement({ onClose }) { // Remove onSave prop
  const { handleAddAnnouncement } = useAnnouncements(); // Get handler from context

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    target: [],
    class: null,
    section: null,
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 7 days from now
    status: 'active'
  });

  const [errors, setErrors] = useState({});
  const [classOptions, setClassOptions] = useState([]);
  const [sectionOptions, setSectionOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Fetch classes and sections on component mount
  useEffect(() => {
    fetchClassesAndSections();
  }, []);

  const fetchClassesAndSections = async () => {
    try {
      // Fetch classes using utility function
      const classes = await fetchClassesUnderMyAdmin();
      
      // Create unique class options
      const classOpts = classes.reduce((acc, cls) => {
        const existing = acc.find(item => item.label === cls.class_name);
        if (!existing) {
          acc.push({
            value: cls._id,
            label: `${cls.class_name}`
          });
        }
        return acc;
      }, []);
      setClassOptions(classOpts);

      // Fetch all sections using utility function
      const sectionOptions = await fetchAllSections();
      setSectionOptions(sectionOptions);
    } catch (error) {
      console.error('Error fetching classes and sections:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.content.trim()) newErrors.content = 'Content is required';
    if (formData.target.length === 0) newErrors.target = 'At least one target is required';
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    if (!formData.endDate) newErrors.endDate = 'End date is required';
    if (formData.endDate < formData.startDate) newErrors.endDate = 'End date must be after start date';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
    setSubmitError(''); // Clear submit error when user makes changes
  };

  const handleTargetChange = (selected) => {
    setFormData(prev => ({ ...prev, target: selected }));
    setErrors(prev => ({ ...prev, target: '' }));
    setSubmitError(''); // Clear submit error when user makes changes
  };

  const handleClassChange = async (selected) => {
    setFormData(prev => ({ ...prev, class: selected }));
    
    // If a class is selected, fetch sections for that specific class
    if (selected) {
      try {
        // Fetch sections for the selected class using utility function
        const classSectionOptions = await fetchSectionsForClass(selected.label);
        
        // If we have sections for this class, update the section options
        if (classSectionOptions.length > 0) {
          setSectionOptions(classSectionOptions);
        }
        
        // Clear the selected section when class changes
        setFormData(prev => ({ ...prev, section: null }));
      } catch (error) {
        console.error('Error fetching sections for class:', error);
      }
    } else {
      // If no class is selected, fetch all sections
      fetchClassesAndSections();
    }
  };

  const handleSectionChange = (selected) => {
    setFormData(prev => ({ ...prev, section: selected }));
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setSubmitError('');

    try {
      // Prepare the request payload
      const payload = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        target: formData.target.map(t => t.value),
        class: formData.class ? formData.class.value : null,
        section: formData.section ? formData.section.value : null,
        startDate: formData.startDate.toISOString().split('T')[0],
        endDate: formData.endDate.toISOString().split('T')[0],
        status: formData.status,
      };

      // Use the configured axios instance (no need to manually add headers)
      const response = await api.post('/announcements/under-my-admin', payload);
      
      // Handle successful response
      handleAddAnnouncement(response.data);
      onClose();
    } catch (error) {
      console.error('Failed to add announcement:', error);
      
      // Handle different types of errors
      if (error.response) {
        // Server responded with error status
        const errorMessage = error.response.data?.message || 'Failed to create announcement';
        setSubmitError(errorMessage);
      } else if (error.request) {
        // Network error
        setSubmitError('Network error. Please check your connection and try again.');
      } else {
        // Other error
        setSubmitError(error.message || 'An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[90%] md:w-[600px] max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-semibold mb-4">Add New Announcement</h2>
        
        {/* Display submit error if any */}
        {submitError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {submitError}
          </div>
        )}

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
            />
            {errors.target && <p className="text-red-500 text-sm mt-1">{errors.target}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Class</label>
              <Select
                options={classOptions}
                value={formData.class}
                onChange={handleClassChange}
                placeholder="Select Class"
                isClearable
                className="basic-select"
                classNamePrefix="select"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Section</label>
              <Select
                options={sectionOptions}
                value={formData.section}
                onChange={handleSectionChange}
                placeholder="Select Section"
                isClearable
                className="basic-select"
                classNamePrefix="select"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start Date *</label>
              <DatePicker
                selected={formData.startDate}
                onChange={(date) => {
                  setFormData(prev => ({ ...prev, startDate: date }));
                  setErrors(prev => ({ ...prev, startDate: '' }));
                  setSubmitError(''); // Clear submit error when user makes changes
                }}
                className={`p-2 border rounded w-full ${errors.startDate ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">End Date *</label>
              <DatePicker
                selected={formData.endDate}
                onChange={(date) => {
                  setFormData(prev => ({ ...prev, endDate: date }));
                  setErrors(prev => ({ ...prev, endDate: '' }));
                  setSubmitError(''); // Clear submit error when user makes changes
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
          <button 
            onClick={onClose} 
            disabled={loading}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={loading}
            className={`px-4 py-2 rounded text-white ${
              loading 
                ? 'bg-blue-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddAnnouncement;