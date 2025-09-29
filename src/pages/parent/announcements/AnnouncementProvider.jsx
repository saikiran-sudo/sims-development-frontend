// src/contexts/AnnouncementProvider.jsx (or src/components/AnnouncementProvider.jsx, choose your path)
import React, { useState, useEffect, createContext, useContext } from 'react';

// Use import.meta.env to access environment variables.
// The variable name must be prefixed with VITE_ for Vite to expose it to the client-side.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

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
        
        // Use the API_BASE_URL variable for the API call
        const res = await fetch(`${API_BASE_URL}/api/announcements`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (!res.ok) throw new Error('Failed to fetch announcements');
        const data = await res.json();
        setAnnouncements(
          data.map((a) => ({
            ...a,
            // Normalize fields if needed
            id: a._id || a.id,
            startDate: a.startDate ? a.startDate.slice(0, 10) : '',
            endDate: a.endDate ? a.endDate.slice(0, 10) : '',
            target: Array.isArray(a.target) ? a.target.map(t => t.toLowerCase()) : [],
            status: a.status,
          }))
        );
      } catch (err) {
        setError(err.message || 'Error fetching announcements. Please try again.');
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
