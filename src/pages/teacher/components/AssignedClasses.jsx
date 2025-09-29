// src/components/AssignedClasses.jsx
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { BookOpen, Tag, Hash, Book } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { getAuthHeaders } from '../../../utils/axiosConfig';

// Access API_BASE_URL from environment variables
const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const API_BASE_URL = `${API_URL}/api`;

function AssignedClasses() {
  const { user } = useAuth();
  const [allClasses, setAllClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get teacher profile from localStorage
  const teacherProfile = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('userprofile'));
    } catch (err) {
      console.error('Error parsing teacher profile:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    const fetchClasses = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!user?.token) {
          setError('No authentication token found.');
          setLoading(false);
          return;
        }

        const res = await axios.get(`${API_BASE_URL}/subjects/under-my-admin`, {
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json',
          },
        });
        setAllClasses(res.data);
      } catch (err) {
        console.error('Error fetching classes:', err);
        setError('Failed to fetch classes.');
      } finally {
        setLoading(false);
      }
    };

    if (user?.token) {
      fetchClasses();
    }
  }, [user]);

  // Filters classes to only show those assigned to the current teacher
  const teacherClasses = useMemo(() => {
    if (!teacherProfile?.user_id) return [];

    return allClasses.filter(cls =>
      Array.isArray(cls.teachers) &&
      cls.teachers.some(t => t.empId === teacherProfile.user_id)
    );
  }, [allClasses, teacherProfile]);

  if (!teacherProfile) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 h-full flex flex-col">
        <div className="text-center text-red-600 py-4">Teacher profile not found. Please log in again.</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 h-full flex flex-col">
      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <BookOpen size={24} className="text-purple-600" /> Assigned Classes
      </h2>

      {loading && (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <p>Loading classes...</p>
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center justify-center h-full text-red-600">
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && teacherClasses.length > 0 ? (
        <div className="flex flex-col gap-3 overflow-y-auto pr-2">
          {teacherClasses.map((cls) => (
            <div
              key={cls._id}
              className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center transition-all duration-200 hover:shadow-md"
            >
              <div className="flex-grow">
                <p className="text-sm font-medium text-blue-700 mb-1">
                  <span className="font-bold">{cls.name || 'N/A'}</span>
                </p>
                <div className="flex items-center text-gray-700 text-sm">
                  <Tag size={16} className="text-gray-500 mr-1" />
                  Grade: <span className="font-semibold ml-1">{cls.className?.match(/\d+/)?.[0] || 'N/A'}</span>
                  <Hash size={16} className="text-gray-500 ml-3 mr-1" />
                  Section: <span className="font-semibold ml-1">{cls.className?.match(/[A-Za-z]+/)?.[0] || 'N/A'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        !loading && !error && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Book size={40} className="mb-3 text-gray-400" />
            <p className="text-md font-medium">No classes assigned yet.</p>
          </div>
        )
      )}
    </div>
  );
}

export default AssignedClasses;