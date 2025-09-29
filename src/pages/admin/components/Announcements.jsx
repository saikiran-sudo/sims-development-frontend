import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaBullhorn, FaArrowRight, FaCalendarAlt } from 'react-icons/fa';
import { announcementAPI } from "../../../services/api";

function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await announcementAPI.getAllAnnouncements();
        setAnnouncements(response.data);
      } catch (error) {
        console.error('Error fetching announcements:', error);
        setError('Failed to load announcements');
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FaBullhorn className="text-purple-600" /> Announcements
        </h1>
        <Link to="/announcements" className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 transition-colors duration-200">
          View All <FaArrowRight className="text-xs" />
        </Link>
      </div>
      <div className="flex flex-col gap-4 mt-2 overflow-y-auto custom-scrollbar flex-1">
        {loading ? (
          <div className="text-gray-500 text-center">Loading announcements...</div>
        ) : error ? (
          <div className="text-red-500 text-center">{error}</div>
        ) : announcements.length === 0 ? (
          <div className="text-gray-500 text-center">No announcements available.</div>
        ) : (
          announcements.map((announcement, idx) => (
            <div key={idx} className="bg-blue-50 bg-opacity-70 rounded-lg p-4 border border-blue-100 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="flex items-start justify-between mb-2">
                <h2 className="font-semibold text-gray-800 text-base leading-snug">{announcement.title || announcement.heading || 'Untitled'}</h2>
                <span className="text-xs text-gray-600 bg-white bg-opacity-70 rounded-full px-2 py-1 flex items-center gap-1 shadow-sm">
                  <FaCalendarAlt className="text-gray-400 text-xs" /> {announcement.date || announcement.createdAt || ''}
                </span>
              </div>
              <p className="text-sm text-gray-700 mt-1 leading-snug">
                {announcement.description || announcement.content || ''}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Announcements;