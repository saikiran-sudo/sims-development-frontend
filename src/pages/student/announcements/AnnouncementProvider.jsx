// src/contexts/AnnouncementProvider.jsx (or src/components/AnnouncementProvider.jsx, choose your path)
import React, { useState, useEffect, createContext, useContext } from 'react';
import axios from 'axios';

// Access API_BASE_URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'; // Fallback for development

// Create a Context for announcements
const AnnouncementContext = createContext(null);

// Custom hook to use the announcement context
export const useAnnouncements = () => {
  const context = useContext(AnnouncementContext);
  if (!context) {
    throw new Error('useAnnouncements must be used within an AnnouncementProvider');
  }
  return context;
};

const AnnouncementProvider = ({ children }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = JSON.parse(localStorage.getItem('authToken'));
        if (!token) {
          throw new Error('No authentication token found. Please log in again.');
        }
        
        const response = await axios.get(`${API_BASE_URL}/api/announcements/under-my-student`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        // Normalize the data to match the expected format
        const normalizedData = response.data.map((a) => ({
          ...a,
          // Normalize fields if needed
          id: a._id || a.id,
          startDate: a.startDate ? a.startDate.slice(0, 10) : '',
          endDate: a.endDate ? a.endDate.slice(0, 10) : '',
          target: Array.isArray(a.target) ? a.target.map(t => t.toLowerCase()) : [],
          status: a.status,
        }));
        
        setAnnouncements(normalizedData);
      } catch (err) {
        setError(err.message || 'Error fetching announcements. Please try again.');
        console.error('Error fetching announcements:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
  }, []);

  const handleAddAnnouncement = (newAnn) => {
    setAnnouncements(prev => [...prev, newAnn]);
  };

  const handleUpdateAnnouncement = (updatedAnn) => {
    setAnnouncements(prev => prev.map(a => a.id === updatedAnn.id ? updatedAnn : a));
  };

  const handleDeleteAnnouncement = (id) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  return (
    <AnnouncementContext.Provider value={{ announcements, loading, error, handleAddAnnouncement, handleUpdateAnnouncement, handleDeleteAnnouncement }}>
      {children}
    </AnnouncementContext.Provider>
  );
};

export default AnnouncementProvider;