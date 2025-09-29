// StudentModule.jsx
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Avatar,
  IconButton,
} from '@mui/material';
import {
  Edit,
  Trash,
  Plus,
  Filter,
  X,
  Search,
  Users,
  CheckCircle,
  PauseCircle,
  Award,
  IdCard,
  Mail,
  Phone,
  User,
  Hash,
  BookOpen,
  Home,
  Key,
  Calendar,
  Venus,
  Briefcase,
  School,
  Paperclip,
  FileText,
  Download,
} from 'lucide-react';
import Select from 'react-select';

import ViewEditStudent from './ViewEditStudent';
// import api from '../../utils/axiosConfig';
import api from '../../../utils/axiosConfig'
import { useCallback } from 'react';
import { parentAPI } from '../../../services/api';
import { classAPI } from '../../../services/api';

const StudentModule = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [classOptions, setClassOptions] = useState([]);

  useEffect(()=>{
    const fetchClasses = async () => {
      const response = await classAPI.getAllClasses();
        const uniqueClasses = Array.from(
          new Map(
            (response.data || response).map(cls => [
              cls.class_name || cls.name || cls.label || cls.value,
              cls
            ])
          ).values()
        );
        const options = uniqueClasses.map(cls => 
          cls.class_name || cls.name || cls.label || cls.value
        ).filter(Boolean); // Remove any undefined/null values
        
        // Add "All Classes" option at the beginning with proper format for Select component
        const allClassesOptions = [
          { value: 'all', label: 'All Classes' },
          ...options.map(option => ({ value: option, label: option }))
        ];
        setClassOptions(allClassesOptions);
    }
    fetchClasses();
  },[]);

  const [filters, setFilters] = useState({
    searchQuery: '',
    class: 'all',
    studentId: '', // Filter for Student ID
    admissionNo: '', // New filter for Admission No
    studentType: 'all', // Added studentType filter
  });

  const [showFilters, setShowFilters] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  // Consolidated modal state
  const [openViewEditModal, setOpenViewEditModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false); // To control edit/view mode in ViewEditStudent

  const [parentOptions, setParentOptions] = useState([]);
  const [parentOptionsLoading, setParentOptionsLoading] = useState(true);

  // Calculate totals
  const totalStudents = students.length;
  const totalCurrent = students.filter(s => s.studentType === 'Current Student').length;
  const totalMigrated = students.filter(s => s.studentType === 'Migrated Student').length;

  // Handle filter changes
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      searchQuery: '',
      class: 'all',
      studentId: '',
      admissionNo: '',
      studentType: 'all',
    });
  };

  const activeFilterCount = Object.values(filters).filter(f => f && f !== 'all').length;


  // Filter students based on search and filters
  const filteredStudents = students.filter(student => {
    const { searchQuery, class: selectedClass, studentId: filterStudentId, admissionNo: filterAdmissionNo, studentType: filterStudentType } = filters;

    const matchesSearch =
      searchQuery === '' ||
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.parent.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.admissionNo.toLowerCase().includes(searchQuery.toLowerCase()) || // Include admissionNo in search
      student.section.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesClass = selectedClass === 'all' || student.class === selectedClass;
    const matchesStudentId = filterStudentId === '' || student.studentId.toLowerCase().includes(filterStudentId.toLowerCase());
    const matchesAdmissionNo = filterAdmissionNo === '' || student.admissionNo.toLowerCase().includes(filterAdmissionNo.toLowerCase()); // New admission no filter
    const matchesStudentType = filterStudentType === 'all' || student.studentType === filterStudentType; // New student type filter

    return matchesSearch && matchesClass && matchesStudentId && matchesAdmissionNo && matchesStudentType;
  });

  // Fetch students from backend
  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/students');
        // Map backend fields to frontend format
        const mapped = (res.data || []).map(s => ({
          id: s._id,
          admissionNo: s.admission_number,
          studentId: s.user_id,
          password: '', // never expose password
          name: s.full_name,
          rollNumber: s.rollNumber || '',
          section: s.section || '',
          class: s.class_id || '',
          parent: Array.isArray(s.parent_id) && s.parent_id.length > 0 ? s.parent_id.map(p => p._id) : [],
          parentDisplay: Array.isArray(s.parent_id) && s.parent_id.length > 0
            ? s.parent_id
                .map(p => {
                  if (p.full_name && p.user_id) return `${p.full_name}(${p.user_id})`;
                  if (p.full_name) return p.full_name;
                  if (p.user_id) return p.user_id;
                  return '';
                })
                .filter(Boolean)
                .join(', ')
            : '',
          status: s.status,
          avatar: s.profile_image || '',
          address: s.address,
          gender: s.gender,
          dateOfBirth: s.date_of_birth ? s.date_of_birth.substring(0, 10) : '',
          studentType: s.student_type,
          previousSchoolName: s.previous_school_name || '',
          previousSchoolAddress: s.previous_school_address || '',
          previousSchoolPhoneNumber: s.previous_school_phone_number || '',
          previousSchoolStartDate: s.previous_school_start_date ? s.previous_school_start_date.substring(0, 10) : '',
          previousSchoolEndDate: s.previous_school_end_date ? s.previous_school_end_date.substring(0, 10) : '',
          documents: s.documents || [],
        }));
        setStudents(mapped);
      } catch (err) {
        setError(err.message || 'Failed to fetch students');
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  // Fetch parent list
  useEffect(() => {
    const fetchParents = async () => {
      setParentOptionsLoading(true);
      try {
        const res = await parentAPI.getAllParents();
        setParentOptions(
          (res.data || []).map(p => ({
            value: p._id, // Use _id for value
            label: `${p.full_name} (${p.user_id || p._id})`,
            userId: p.user_id || p._id,
            fullName: p.full_name
          }))
        );
      } catch (err) {
        setParentOptions([]);
      } finally {
        setParentOptionsLoading(false);
      }
    };
    fetchParents();
  }, []);

  // Handle delete student
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this student record?')) {
      try {
        await api.delete(`/students/${id}`);
        setStudents(students.filter(student => student.id !== id));
      } catch (error) {
        alert('Error deleting student: ' + (error.message || 'Unknown error'));
      }
    }
  };

  const classes = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th']; // Updated to match CLASS_OPTIONS in other components
  // const classOptions = [{ value: 'all', label: 'All Classes' }, ...classes.map(cls => ({ value: cls, label: cls }))];
  const studentTypeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'Current Student', label: 'Current Student' },
    { value: 'Migrated Student', label: 'Migrated Student' },
  ];

  // Placeholder for document upload API call
  const uploadFile = async (file) => {
    // In a real application, you would implement actual file upload logic (e.g., to cloud storage)
    // For now, it mocks a successful upload
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(`http://example.com/documents/${Date.now()}-${file.name}`);
      }, 500);
    });
  };

  // Map frontend studentData to backend format
  const mapToBackend = (studentData) => {
    return {
      user_id: studentData.studentId,
      password: studentData.password,
      full_name: studentData.name,
      admission_number: studentData.admissionNo,
      date_of_birth: studentData.dateOfBirth,
      gender: studentData.gender,
      address: studentData.address,
      parent_id: Array.isArray(studentData.parent) ? studentData.parent : studentData.parent ? [studentData.parent] : [],
      class_id: studentData.class,
      status: studentData.status,
      student_type: studentData.studentType,
      previous_school_name: studentData.previousSchoolName,
      previous_school_address: studentData.previousSchoolAddress,
      previous_school_phone_number: studentData.previousSchoolPhoneNumber,
      previous_school_start_date: studentData.previousSchoolStartDate,
      previous_school_end_date: studentData.previousSchoolEndDate,
      profile_image: studentData.avatar || undefined,
      documents: studentData.documents || [],
      rollNumber: studentData.rollNumber,
      section: studentData.section,
    };
  };

  const handleSaveStudent = async (studentData) => {
    try {
      const isNew = !studentData.id;
      let updatedStudents;
      // No need to map user_id to _id, just use parent as _id
      const backendData = {
        ...mapToBackend(studentData),
        parent_id: studentData.parent || [],
      };
      if (isNew) {
        const res = await api.post('/students', backendData);
        // Refetch or append
        const newStudent = res.data;
        setStudents(prev => [...prev, {
          ...studentData,
          id: newStudent._id,
        }]);
        alert('Student added successfully!');
      } else {
        await api.put(`/students/${studentData.id}`, backendData);
        setStudents(prev => prev.map(s => s.id === studentData.id ? studentData : s));
        alert('Student updated successfully!');
      }
      setOpenViewEditModal(false);
      setSelectedStudent(null);
      setIsEditMode(false);
    } catch (error) {
      alert('Failed to save student: ' + (error.message || 'Unknown error'));
    }
  };

  const handleAddClick = () => {
    setSelectedStudent(null); // No data for new student
    setIsEditMode(true); // Always editable for add
    setOpenViewEditModal(true);
  };

  const handleView = (student) => {
    setSelectedStudent(student);
    setIsEditMode(false); // Not editable for view
    setOpenViewEditModal(true);
  };

  const handleEdit = (student) => {
    setSelectedStudent(student);
    setIsEditMode(true); // Editable for edit
    setOpenViewEditModal(true);
  };

  // Show loading/error
  if (loading) return <div className="p-8 text-center">Loading students...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="px-0 sm:px-2 md:px-4 lg:p-6 flex flex-col gap-2 sm:gap-4 lg:gap-8">
      {/* Summary Cards */}
      <div className="hidden sm:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4"> {/* Added hidden and sm:grid to hide on mobile */}
        {/* Card 1: Total Students */}
        <div className="relative bg-white rounded-xl overflow-hidden border border-gray-200 shadow-md">
          <div className="p-4 sm:p-6"> {/* Reduced padding for smaller screens */}
            <div className="absolute top-3 right-3 sm:top-4 sm:right-4"> {/* Adjusted icon positioning */}
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-blue-100 flex items-center justify-center shadow-sm"> {/* Adjusted icon container size */}
                <Users size={24} className="text-blue-600" /> {/* Adjusted icon size */}
              </div>
            </div>
            <div className="mt-2">
              <div className="flex items-center space-x-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-xs font-medium text-gray-500">All Students</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Total Students</h3> {/* Adjusted text size */}
              <div className="bg-gray-50 rounded-lg p-2 sm:p-3 border border-gray-100"> {/* Reduced padding */}
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{totalStudents}</p> {/* Adjusted text size */}
              </div>
            </div>
          </div>
        </div>
        {/* Card 2: Current Students */}
        <div className="relative bg-white rounded-xl overflow-hidden border border-gray-200 shadow-md">
          <div className="p-4 sm:p-6"> {/* Reduced padding for smaller screens */}
            <div className="absolute top-3 right-3 sm:top-4 sm:right-4"> {/* Adjusted icon positioning */}
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-green-100 flex items-center justify-center shadow-sm"> {/* Adjusted icon container size */}
                <CheckCircle size={24} className="text-green-600" /> {/* Adjusted icon size */}
              </div>
            </div>
            <div className="mt-2">
              <div className="flex items-center space-x-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-medium text-gray-500">Current Students</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Current Students</h3> {/* Adjusted text size */}
              <div className="bg-gray-50 rounded-lg p-2 sm:p-3 border border-gray-100"> {/* Reduced padding */}
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{totalCurrent}</p> {/* Adjusted text size */}
              </div>
            </div>
          </div>
        </div>
        {/* Card 3: Migrated Students */}
        <div className="relative bg-white rounded-xl overflow-hidden border border-gray-200 shadow-md">
          <div className="p-4 sm:p-6"> {/* Reduced padding for smaller screens */}
            <div className="absolute top-3 right-3 sm:top-4 sm:right-4"> {/* Adjusted icon positioning */}
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-yellow-100 flex items-center justify-center shadow-sm"> {/* Adjusted icon container size */}
                <Briefcase size={24} className="text-yellow-600" /> {/* Adjusted icon size */}
              </div>
            </div>
            <div className="mt-2">
              <div className="flex items-center space-x-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                <span className="text-xs font-medium text-gray-500">Migrated Students</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Migrated Students</h3> {/* Adjusted text size */}
              <div className="bg-gray-50 rounded-lg p-2 sm:p-3 border border-gray-100"> {/* Reduced padding */}
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{totalMigrated}</p> {/* Adjusted text size */}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-2xl font-bold text-gray-800">Student Records</h2>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-grow w-full md:w-[400px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search students..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-full leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={filters.searchQuery}
                onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
              />
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex-shrink-0 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <Filter size={18} /> Filters {activeFilterCount > 0 && <span className="ml-1 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">{activeFilterCount}</span>}
            </button>
          </div>
        </div>

        {/* Filters Section */}
        {showFilters && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200 animate-fade-in grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="admission-no-filter" className="block text-sm font-medium text-gray-700 mb-1">Admission No</label>
              <input
                id="admission-no-filter"
                type="text"
                placeholder="Filter by Admission No."
                className="block w-full border border-gray-300 rounded-md shadow-sm p-2"
                value={filters.admissionNo}
                onChange={(e) => handleFilterChange('admissionNo', e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="student-id-filter" className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
              <input
                id="student-id-filter"
                type="text"
                placeholder="Filter by Student ID"
                className="block w-full border border-gray-300 rounded-md shadow-sm p-2"
                value={filters.studentId}
                onChange={(e) => handleFilterChange('studentId', e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="class-filter" className="block text-sm font-medium text-gray-700 mb-1">Class</label>
              <Select
                id="class-filter"
                options={classOptions}
                value={classOptions.find(option => option.value === filters.class)}
                onChange={(selected) => handleFilterChange('class', selected.value)}
                className="basic-single"
                classNamePrefix="select"
              />
            </div>
            <div>
              <label htmlFor="student-type-filter" className="block text-sm font-medium text-gray-700 mb-1">Student Type</label>
              <Select
                id="student-type-filter"
                options={studentTypeOptions}
                value={studentTypeOptions.find(option => option.value === filters.studentType)}
                onChange={(selected) => handleFilterChange('studentType', selected.value)}
                className="basic-single"
                classNamePrefix="select"
              />
            </div>
            <div className="md:col-span-3 flex justify-end gap-2 mt-2">
              <button
                onClick={clearFilters}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}

        {/* Student Table */}
        <div className="bg-white border border-gray-200 shadow overflow-x-auto rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avatar
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Admission No.
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Class
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Roll No
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Parent ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Avatar src={student.avatar} alt={student.name} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.admissionNo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.studentId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {student.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {student.class} {student.section && `(${student.section})`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {student.rollNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {student.studentType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {student.parentDisplay}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <IconButton
                          onClick={() => handleView(student)} // Changed to handleView
                          color="primary"
                          size="small"
                        >
                          <FileText size={20} />
                        </IconButton>
                        <IconButton
                          onClick={() => handleEdit(student)} // Changed to handleEdit
                          color="primary"
                          size="small"
                        >
                          <Edit size={20} />
                        </IconButton>
                        <IconButton
                          onClick={() => handleDelete(student.id)}
                          color="secondary"
                          size="small"
                        >
                          <Trash size={20} />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                    <p className="text-center text-gray-500 py-4">
                      No student records found matching your criteria. Try adjusting your search or filter criteria.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      {/* Modals */}
      {openViewEditModal && !parentOptionsLoading && (
        <ViewEditStudent
          onClose={() => { setOpenViewEditModal(false); setSelectedStudent(null); setIsEditMode(false); }}
          onSave={handleSaveStudent}
          data={selectedStudent}
          editable={isEditMode}
          existingStudents={students}
          uploadFile={uploadFile}
          parentOptions={parentOptions}
        />
      )}
    </div>
  );
};

export default StudentModule;