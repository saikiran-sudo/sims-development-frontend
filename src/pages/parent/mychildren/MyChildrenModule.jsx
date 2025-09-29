// src/pages/parent/MyChildrenModule.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, GraduationCap, Grid, ChevronRight,
  BookOpen, Calendar, Hash, Award, Building, Mail, Phone, XCircle, ListOrdered, Loader2
} from 'lucide-react';
import api from '../../../utils/axiosConfig';

const MyChildrenModule = () => {
  const navigate = useNavigate();

  const [childrenData, setChildrenData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // NEW STATES FOR MODAL
  const [showModal, setShowModal] = useState(false);
  const [selectedChild, setSelectedChild] = useState(null);

  useEffect(() => {
    const fetchChildrenData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch parent profile with linked students
        const response = await api.get('/parents/me');
        const { linkedStudents } = response.data;
        console.log('parent response data is ', linkedStudents);
        
        if (linkedStudents && Array.isArray(linkedStudents)) {
          // Map backend student data to frontend format
          const mappedChildren = linkedStudents.map(student => ({
            id: student._id || student.user_id || '',
            name: student.full_name || 'N/A',
            profileImage: student.profile_image,
            class: student.class_id?.class_name || student.class_id || 'N/A',
            section: student.section || 'N/A',
            admissionNo: student.admission_number || 'N/A',
            rollNo: student.rollNumber || 'N/A',
            dateOfBirth: student.date_of_birth ? new Date(student.date_of_birth).toISOString().split('T')[0] : 'N/A',
            parentId: student.parent_id?.[0] || 'N/A',
            parentPhone: student.contact || 'N/A',
            teacher: student.teacherName || 'N/A',
            teacherId: student.teacher || 'N/A',
            address: student.address || 'N/A'
          }));
          
          setChildrenData(mappedChildren);
        } else {
          setChildrenData([]);
        }
      } catch (err) {
        console.error('Error fetching children data:', err);
        setError(err.message || 'Failed to fetch children data');
        
        // If it's an authentication error, redirect to login
        if (err.message.includes('Authentication failed')) {
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchChildrenData();
  }, [navigate]);

  // MODIFIED handleViewDetails to open modal
  const handleViewDetails = (child) => {
    setSelectedChild(child); // Set the child data to be displayed in the modal
    setShowModal(true); // Open the modal
  };

  // Function to close the modal
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedChild(null); // Clear selected child data when closing
  };

  // Loading state
  if (loading) {
    return (
      <div className="px-0 sm:px-2 md:px-4 lg:p-6 flex flex-col gap-2 sm:gap-4 lg:gap-8">
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-200">
          <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
            <User size={32} className="text-blue-600" />
            My Children
          </h1>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-3 text-gray-600">
            <Loader2 size={24} className="animate-spin" />
            <span className="text-lg">Loading children data...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="px-0 sm:px-2 md:px-4 lg:p-6 flex flex-col gap-2 sm:gap-4 lg:gap-8">
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-200">
          <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
            <User size={32} className="text-blue-600" />
            My Children
          </h1>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <XCircle size={48} className="mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Data</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No children state
  if (childrenData.length === 0) {
    return (
      <div className="px-0 sm:px-2 md:px-4 lg:p-6 flex flex-col gap-2 sm:gap-4 lg:gap-8">
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-200">
          <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
            <User size={32} className="text-blue-600" />
            My Children
          </h1>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-gray-400 mb-4">
              <User size={64} className="mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Children Found</h3>
            <p className="text-gray-600">No children are currently linked to your account.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-0 sm:px-2 md:px-4 lg:p-6 flex flex-col gap-2 sm:gap-4 lg:gap-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-200">
          <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
            <User size={32} className="text-blue-600" />
            My Children
          </h1>
        </div>
        {console.log('childrenData', childrenData)}

        {/* Children Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {childrenData.map((child) => (
            <div key={child.id} className="bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className="p-6">
                <div className="flex flex-col items-center mb-6">
                  <img
                    src={child.profileImage || '/default-child-avatar.png'}
                    alt={`${child.name}'s profile`}
                    className="w-32 h-32 rounded-full object-cover border-4 border-blue-300 shadow-lg"
                  />
                  <h2 className="text-2xl font-bold text-gray-900 mt-4">{child.name}</h2>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                    <Hash size={16} className="text-gray-400" /> Admission No: {child.admissionNo}
                  </p>
                </div>

                <div className="space-y-4 text-gray-700 mb-8">
                  <div className="flex items-center gap-3 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                    <GraduationCap size={20} className="text-blue-600" />
                    <span className="font-semibold text-gray-800">Class:</span> {child.class} ({child.section || 'N/A'})
                  </div>
                  <div className="flex items-center gap-3 bg-green-50/50 p-3 rounded-lg border border-green-100">
                    <BookOpen size={20} className="text-green-600" />
                    <span className="font-semibold text-gray-800">Teacher:</span> {child.teacher || 'N/A'} ({child.teacherId})
                  </div>
                  <div className="flex items-center gap-3 bg-purple-50/50 p-3 rounded-lg border border-purple-100">
                    <Calendar size={20} className="text-purple-600" />
                    <span className="font-semibold text-gray-800">DOB:</span> {child.dateOfBirth || 'N/A'}
                  </div>
                  {/* NEW: Roll Number on card */}
                  <div className="flex items-center gap-3 bg-cyan-50/50 p-3 rounded-lg border border-cyan-100">
                    <ListOrdered size={20} className="text-cyan-600" />
                    <span className="font-semibold text-gray-800">Roll No:</span> {child.rollNo || 'N/A'}
                  </div>
                  {/* Removed Address and Achievements from card to show only in modal */}
                </div>

                <button
                  onClick={() => handleViewDetails(child)}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition transform hover:scale-105 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
                  aria-label={`View details for ${child.name}`}
                >
                  View Details <ChevronRight size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>

      {/* Child Details Modal */}
      {showModal && selectedChild && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50 overflow-auto">
          <div className="relative bg-white rounded-xl shadow-2xl p-8 w-full max-w-2xl transform transition-all duration-300 scale-100 opacity-100">
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 focus:outline-none"
              aria-label="Close modal"
            >
              <XCircle size={24} /> {/* Adjusted icon size */}
            </button>

            <div className="flex flex-col items-center mb-6 pb-4 border-b border-gray-200">
              <img
                src={selectedChild.profileImage || '/default-child-avatar.png'}
                alt={`${selectedChild.name}'s profile`}
                className="w-32 h-32 rounded-full object-cover border-4 border-blue-400 shadow-lg" /* Slightly smaller image */
              />
              <h2 className="text-2xl font-extrabold text-gray-900 mt-4">{selectedChild.name}</h2> {/* Adjusted text size */}
              <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                <Hash size={16} className="text-gray-500" /> Admission No: {selectedChild.admissionNo} {/* Adjusted text size */}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-gray-700"> {/* Added gap-x and gap-y */}
              <div className="flex items-center gap-2"> {/* Reduced gap */}
                <GraduationCap size={18} className="text-blue-600" /> {/* Adjusted icon size */}
                <span className="font-semibold text-sm">Class:</span> <span className="text-sm">{selectedChild.class} ({selectedChild.section || 'N/A'})</span> {/* Adjusted text size */}
              </div>
              <div className="flex items-center gap-2">
                <BookOpen size={18} className="text-green-600" />
                <span className="font-semibold text-sm">Teacher:</span> <span className="text-sm">{selectedChild.teacher || 'N/A'} {selectedChild.teacherId ? `(${selectedChild.teacherId})` : ''}</span> {/* Updated to show Teacher ID */}
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-purple-600" />
                <span className="font-semibold text-sm">Date of Birth:</span> <span className="text-sm">{selectedChild.dateOfBirth || 'N/A'}</span>
              </div>
              {/* Roll Number in Modal */}
              <div className="flex items-center gap-2">
                <ListOrdered size={18} className="text-cyan-600" />
                <span className="font-semibold text-sm">Roll No:</span> <span className="text-sm">{selectedChild.rollNo || 'N/A'}</span>
              </div>
              <div className="flex items-start gap-2 col-span-1 md:col-span-2"> {/* Aligned to start for multiline address */}
                <Building size={18} className="text-red-600 mt-1" />
                <span className="font-semibold text-sm">Address:</span> <span className="text-sm">{selectedChild.address || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2 col-span-1 md:col-span-2">
                <Phone size={18} className="text-orange-600" />
                <span className="font-semibold text-sm">Parent Phone:</span> <span className="text-sm">{selectedChild.parentPhone || 'N/A'}</span>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-gray-200 text-right">
              <button
                onClick={handleCloseModal}
                className="px-6 py-3 rounded-lg bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyChildrenModule;