// TeacherModule.jsx
import React, { useState, useEffect } from 'react';
import AddTeacher from './AddTeacher';
import TeacherDetails from './TeacherDetails';
import { Edit, Trash, Plus, Filter, X, Search } from 'lucide-react';
import Select from 'react-select'; // Select is still needed for class_teacher filter
import axios from 'axios';

// Use import.meta.env to access environment variables.
// The variable name must be prefixed with VITE_ for Vite to expose it to the client-side.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

function TeacherModule() {
  const [teachers, setTeachers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [filters, setFilters] = useState({
    empId: '',
    searchQuery: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Still need allClasses and classOptions for class_teacher filter (if it's a filter option)
  const allClasses = Array.from(new Set(teachers.flatMap(t => t.class_teacher || []))).sort();
  const classOptions = allClasses.map(cls => ({ value: cls, label: cls }));

  useEffect(() => {
    const fetchTeachers = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = JSON.parse(localStorage.getItem('authToken'));
        if (!token) {
          setError('Authentication token not found. Please log in.');
          setLoading(false);
          return;
        }

        const response = await axios.get(`${API_BASE_URL}/api/teachers/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setTeachers(response.data);
      } catch (err) {
        console.error('Error fetching teachers:', err);
        setError('Failed to fetch teachers. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchTeachers();
  }, []);

  const handleAddTeacher = (data) => {
    setTeachers([...teachers, data]);
  };

  const handleView = (teacher) => {
    setSelectedTeacher(teacher);
    setIsEditMode(false);
    setShowDetailsModal(true);
  };

  const handleEdit = (teacher) => {
    setSelectedTeacher(teacher);
    setIsEditMode(true);
    setShowDetailsModal(true);
  };

  const handleUpdate = (updated) => {
    setTeachers(teachers.map((t) => (t.user_id === updated.user_id ? updated : t))); // Changed from empId to user_id
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this teacher record?')) {
      try {
        const token = JSON.parse(localStorage.getItem('authToken'));
        if (!token) {
          console.error('Authentication token not found.');
          return;
        }

        await axios.delete(`${API_BASE_URL}/api/teachers/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setTeachers(teachers.filter((t) => t._id !== id)); // Changed from t.id to t._id
      } catch (err) {
        console.error('Error deleting teacher:', err);
      }
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      empId: '',
      searchQuery: ''
    });
  };

  const activeFilterCount = Object.values(filters).filter(f => f && (typeof f !== 'object' || (f && f.value))).length;

  const filteredTeachers = teachers.filter(teacher => {
    const teacherEmpId = teacher.user_id?.toLowerCase() || '';
    const teacherName = teacher.full_name?.toLowerCase() || '';
    const teacherImage = teacher.profile_image || '';
    const teacherEmail = teacher.email?.toLowerCase() || '';
    const teacherPhone = teacher.phone?.toLowerCase() || '';
    const teacherAddress = teacher.address?.toLowerCase() || '';
    const teacherClassTeacher = teacher.class_teacher?.toLowerCase() || '';

    if (filters.empId && !teacherEmpId.includes(filters.empId.toLowerCase())) return false;

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const searchFields = [
        teacherEmpId,
        teacherName,
        teacherImage,
        teacherEmail,
        teacherPhone,
        teacherAddress,
        teacherClassTeacher
      ];
      return searchFields.some(field => field.includes(query));
    }

    return true;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg text-gray-600">Loading teachers...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="px-0 sm:px-2 md:px-4 lg:p-6 flex flex-col gap-2 sm:gap-4 lg:gap-8">
      <div className='flex justify-between mb-4'>
        <div className='hidden md:flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-gray-300 px-3 w-full md:w-[400px]'>
          <Search size={16} className="text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by ID, Name, Class Teacher, Email..."
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

        <div className='flex gap-2'>
          <button
            className='md:hidden flex items-center gap-1 px-3 py-2 bg-gray-100 rounded-md text-sm'
            onClick={() => setShowMobileSearch(!showMobileSearch)}
          >
            <Search size={16} />
            Search
          </button>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm ${showFilters || activeFilterCount > 0
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
            onClick={() => setShowAddModal(true)}
            className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
          >
            <Plus size={16} className='mr-2' />
            <span>Add Teacher</span>
          </button>
        </div>
      </div>

      {showMobileSearch && (
        <div className='md:hidden flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-gray-300 px-3 w-full mb-4 animate-fade-in'>
          <Search size={16} className="text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by ID, Name, Class Teacher, Email..."
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

      {showFilters && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200 animate-fade-in">
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">EMP ID</label>
              <input
                type="text"
                placeholder="Filter by EMP ID"
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                value={filters.empId}
                onChange={(e) => handleFilterChange('empId', e.target.value)}
              />
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

      <div className="bg-white border border-gray-200 shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 table-fixed">
            <thead className="bg-gray-50">
              <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[8%]">
                    Avatar
                  </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[8%]">
                  EMP ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[12%]">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[15%]">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%]">
                  Phone
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[12%]">
                  Class Teacher
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[15%]">
                  Address
                </th>
                <th scope="col" className="relative px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTeachers.length > 0 ? (
                filteredTeachers.map((teacher) => (
                  <tr key={teacher._id} className='hover:bg-gray-50'>
                    <td className='px-6 py-4 text-sm font-medium text-gray-900 break-words'>
                      {teacher.profile_image && <img src={teacher.profile_image} alt='Teacher Avatar' className='w-8 h-8 rounded-full object-cover' />}
                    </td>
                    <td className='px-6 py-4 text-sm font-medium text-gray-900 break-words'>
                      {teacher.user_id}
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-900 break-words'>
                      <div className='flex items-center gap-2'>
                        {teacher.full_name}
                      </div>
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-500 break-all'>
                      {teacher.email}
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-500 break-words'>
                      {teacher.phone}
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-500 break-words'>
                      {teacher.class_teacher || '-'}
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-500 break-words'>
                      {teacher.address}
                    </td>
                    <td className='px-6 py-4 text-right text-sm font-medium'>
                      <div className="flex items-center justify-end gap-2">
                        <span
                          onClick={() => handleView(teacher)}
                          className='text-blue-600 cursor-pointer hover:text-blue-800 text-lg'
                          title="View"
                        >
                          👁️
                        </span>
                        <button
                          onClick={() => handleEdit(teacher)}
                          className="text-indigo-600 hover:text-indigo-900 p-1 rounded-md hover:bg-indigo-50"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(teacher._id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <Search size={40} className='mb-3 text-gray-400' />
                      <h3 className='text-lg font-semibold mb-1'>
                        {teachers.length === 0 ? 'No teachers yet!' : 'No matching teachers found.'}
                      </h3>
                      <p className='mt-1 text-sm text-gray-600'>
                        {teachers.length === 0 ? 'Get started by adding a new teacher record' :
                          'Try adjusting your search or filter criteria'}
                      </p>
                      {teachers.length === 0 && (
                        <button
                          onClick={() => setShowAddModal(true)}
                          className='mt-6 inline-flex items-center px-5 py-2.5 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200'
                        >
                          <Plus size={20} className='mr-2' />
                          Add Teacher
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <AddTeacher
          onClose={() => setShowAddModal(false)}
          onSave={handleAddTeacher}
          existingTeachers={teachers}
        />
      )}

      {showDetailsModal && (
        <TeacherDetails
          onClose={() => setShowDetailsModal(false)}
          data={selectedTeacher}
          editable={isEditMode}
          onUpdate={handleUpdate}
          existingTeachers={teachers}
        />
      )}
    </div>
  );
}

export default TeacherModule;