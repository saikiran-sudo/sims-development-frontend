// src/pages/admin/library/LibraryModule.jsx
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import AddEditResourceModal from './AddEditResourceModal';
import ResourceCard from './ResourceCard';
import { FiPlus } from 'react-icons/fi';
import { FaBookOpen, FaSearch } from 'react-icons/fa';
import { X, Filter, Search, Plus } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';

// Access API_BASE_URL from environment variables
const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'; // Fallback for development
const API_BASE_URL = `${API_URL}/api/resources`; // Use the base URL for the API endpoint

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = JSON.parse(localStorage.getItem('authToken'));
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const LibraryModule = () => {
  // State for all library resources (from backend)
  const [allResources, setAllResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  // Filters and UI state
  const [filters, setFilters] = useState({
    searchQuery: '',
    subject: 'All',
    class: 'All Classes',
    type: 'All',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingResource, setEditingResource] = useState(null);

  // Fetch resources from backend
  const fetchResources = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(API_BASE_URL, { headers: getAuthHeaders() });
      setAllResources(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error loading resources');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  // Options for dropdowns
  const classOptions = useMemo(() => ([
    'All Classes',
    ...Array.from({ length: 10 }, (_, i) => `Class ${i + 1}`)
  ]), []);

  const subjectOptions = useMemo(() => {
    const subjects = new Set(allResources.map(res => res.subject));
    return ['All', ...Array.from(subjects).sort()];
  }, [allResources]);

  const resourceTypes = ['All', 'pdf', 'image', 'video', 'link'];

  // Handler for filter changes
  const handleFilterChange = useCallback((filterName, value) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [filterName]: value
    }));
  }, []);

  // Calculate active filter count for the Filters button badge
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.subject && filters.subject !== 'All') count++;
    if (filters.class && filters.class !== 'All Classes') count++;
    if (filters.type && filters.type !== 'All') count++;
    return count;
  }, [filters]);

  // Memoized filtered and sorted resources for efficient rendering
  const filteredResources = useMemo(() => {
    let tempResources = [...allResources];
    if (filters.searchQuery) {
      const lowerCaseSearchTerm = filters.searchQuery.toLowerCase();
      tempResources = tempResources.filter(res =>
        res.title.toLowerCase().includes(lowerCaseSearchTerm) ||
        res.subject.toLowerCase().includes(lowerCaseSearchTerm) ||
        (res.topic || '').toLowerCase().includes(lowerCaseSearchTerm) ||
        (res.description || '').toLowerCase().includes(lowerCaseSearchTerm) ||
        (res._id || '').toLowerCase().includes(lowerCaseSearchTerm)
      );
    }
    if (filters.subject !== 'All') {
      tempResources = tempResources.filter(res => res.subject === filters.subject);
    }
    if (filters.class !== 'All Classes') {
      tempResources = tempResources.filter(res => (res.classes || []).includes(filters.class));
    }
    if (filters.type !== 'All') {
      tempResources = tempResources.filter(res => res.type === filters.type);
    }
    return tempResources;
  }, [allResources, filters]);

  // Handler for opening the Add/Edit modal
  const handleAddEditResource = (resource = null) => {
    setEditingResource(resource);
    setShowAddEditModal(true);
  };

  // Handler for saving a resource (add or update)
  const handleSaveResource = async (resourceData) => {
    setLoading(true);
    setError('');
    try {
      if (editingResource && editingResource._id) {
        // Update existing resource
        await axios.put(`${API_BASE_URL}/${editingResource._id}`, resourceData, { headers: getAuthHeaders() });
      } else {
        // Add new resource
        await axios.post(API_BASE_URL, resourceData, { headers: getAuthHeaders() });
      }
      await fetchResources();
      setShowAddEditModal(false);
      setEditingResource(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error saving resource');
    }
    setLoading(false);
  };

  // Handler for deleting a resource
  const handleDeleteResource = async (resourceId) => {
    if (!window.confirm('Are you sure you want to delete this resource? This action cannot be undone.')) return;
    setLoading(true);
    setError('');
    try {
      await axios.delete(`${API_BASE_URL}/${resourceId}`, { headers: getAuthHeaders() });
      await fetchResources();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error deleting resource');
    }
    setLoading(false);
  };

  // Handler to clear all filters
  const clearFilters = useCallback(() => {
    setFilters({
      searchQuery: '',
      subject: 'All',
      class: 'All Classes',
      type: 'All',
    });
  }, []);

  return (
    <div className="px-0 sm:px-2 md:px-4 lg:p-6 flex flex-col gap-2 sm:gap-4 lg:gap-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <FaBookOpen className="text-blue-600 text-3xl mr-3" />
          <h1 className="text-3xl font-bold text-gray-800">Digital Library Management</h1>
        </div>
      </div>

      {/* Main Filter Section */}
      <div className='flex justify-between mb-4'>
        {/* Search Bar (Desktop) */}
        <div className='hidden md:flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-gray-300 px-3 w-full md:w-[400px]'>
          <Search size={16} className="text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by Title, Topic, Subject, Class..."
            className="p-2 bg-transparent outline-none flex-1 min-w-0"
            value={filters.searchQuery}
            onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
          />
          {filters.searchQuery && (
            <button
              onClick={() => handleFilterChange('searchQuery', '')}
              className="text-gray-400 hover:text-gray-600 shrink-0"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Buttons */}
        <div className='flex gap-2'>
            {/* Mobile Search Button */}
            <button
              className='md:hidden flex items-center gap-1 px-3 py-2 bg-gray-100 rounded-md text-sm'
              onClick={() => setShowMobileSearch(!showMobileSearch)}
            >
              <Search size={16} />
              Search
            </button>

          {/* Filters Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm ${
              showFilters || activeFilterCount > 0
                ? 'bg-blue-100 text-blue-600'
                : 'bg-gray-100'
            }`}
          >
            {showFilters ? <X size={16} /> : <Filter size={16} />}
            <span className="hidden md:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className="ml-0 md:ml-1 inline-flex items-center px-1.5 py-0.5 md:px-2.5 md:py-0.5 rounded-full text-xs font-medium bg-blue-500 text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
          <button
            onClick={() => handleAddEditResource(null)}
            className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
          >
            <Plus size={16} className='mr-2' />
            <span>Add Resource</span>
          </button>
        </div>
      </div>

      {/* Mobile Search Input */}
      {showMobileSearch && (
        <div className='md:hidden flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-gray-300 px-3 w-full mb-4 animate-fade-in'>
          <Search size={16} className="text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by Title, Topic, Subject, Class..."
            className="p-2 bg-transparent outline-none flex-1 min-w-0"
            value={filters.searchQuery}
            onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
          />
          {filters.searchQuery && (
            <button
              onClick={() => handleFilterChange('searchQuery', '')}
              className="text-gray-400 hover:text-gray-600 shrink-0"
            >
              <X size={16} />
            </button>
          )}
        </div>
      )}

      {/* Filters Dropdown */}
      {showFilters && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200 animate-fade-in">
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            {/* Filter by Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Subject</label>
              <select
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                value={filters.subject}
                onChange={(e) => handleFilterChange('subject', e.target.value)}
              >
                {subjectOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            {/* Filter by Class */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Class</label>
              <select
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                value={filters.class}
                onChange={(e) => handleFilterChange('class', e.target.value)}
              >
                {classOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            {/* Filter by Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Type</label>
              <select
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
              >
                {resourceTypes.map(type => (
                  <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                ))}
              </select>
            </div>

          </div>
          <div className='flex justify-end mt-4'>
            <button
              onClick={clearFilters}
              className='text-sm font-medium text-blue-600 hover:text-blue-800 px-3 py-1 rounded hover:bg-blue-50 transition-colors duration-200'
            >
              Clear all filters
            </button>
          </div>
        </div>
      )}

      {/* Loading/Error State */}
      {loading && <div className="text-center text-blue-600 py-8">Loading resources...</div>}
      {error && <div className="text-center text-red-500 py-2">{error}</div>}

      {/* Resource Cards Display */}
      <div className="min-h-[300px]">
        {filteredResources.length === 0 && !loading ? (
          <div className="bg-blue-50 border-l-4 border-blue-400 text-blue-800 p-6 rounded-lg shadow-md text-center">
            <p className="font-bold text-lg mb-2">No Resources Found!</p>
            <p>Adjust your filters or add new resources to the library.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredResources.map(resource => (
              <ResourceCard
                key={resource._id}
                resource={resource}
                onEdit={handleAddEditResource}
                onDelete={() => handleDeleteResource(resource._id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Resource Modal */}
      {showAddEditModal && (
        <AddEditResourceModal
          initialData={editingResource}
          onClose={() => {
            setShowAddEditModal(false);
            setEditingResource(null);
          }}
          onSave={handleSaveResource}
          classOptions={classOptions.filter(option => option !== 'All Classes').map(cls => ({ value: cls, label: cls }))}
          admin_id={user?.profile?._id || user?.profile?.userId || user?.profile?.user_id || ''} // Add admin ID
        />
      )}
    </div>
  );
};

export default LibraryModule;
