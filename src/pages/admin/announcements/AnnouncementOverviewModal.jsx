import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnnouncements } from './AnnouncementProvider'; // Import the hook

// Helper function to format date for display
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  // Example: "Jun 19, 2025"
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const AnnouncementOverviewModal = () => { // Removed props, now consumes context
  const { announcements } = useAnnouncements(); // Consume announcements from context
  const navigate = useNavigate(); // Hook for navigation

  const now = new Date();

  // Filter announcements to show only those that are 'active' and not 'expired'
  const activeAnnouncements = announcements.filter(ann => {
    const endDate = new Date(ann.endDate);
    return ann.status === 'active' && now <= endDate;
  });

  // Function to close the modal (by navigating back)
  const handleClose = () => {
    navigate(-1); // Go back to the previous page
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[95%] md:w-[700px] max-h-[90vh] overflow-y-auto shadow-lg">
        <div className="flex justify-between items-center mb-4 border-b pb-3">
          <h2 className="text-xl font-semibold text-gray-800">Active Announcements Overview</h2>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700 text-2xl font-bold">
            &times; {/* Close button */}
          </button>
        </div>

        {activeAnnouncements.length > 0 ? (
          <div className="space-y-4">
            {activeAnnouncements.map(ann => (
              <div key={ann.id} className="border border-gray-200 rounded-md p-3 bg-gray-50">
                <h3 className="text-lg font-medium text-blue-700 mb-1">{ann.title}</h3>
                <p className="text-sm text-gray-700 mb-2 line-clamp-3">{ann.content}</p>
                <div className="text-xs text-gray-500 flex justify-between items-center">
                  <span>
                    Targets: {ann.target.map(t => (
                      <span key={t} className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800 mr-1">
                        {t}
                      </span>
                    ))}
                  </span>
                  <span>
                    Active until: <span className="font-semibold">{formatDate(ann.endDate)}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-600">
            <p className="text-lg font-medium">No active announcements at the moment.</p>
            <p className="text-sm mt-1">Great! No urgent announcements to display.</p>
          </div>
        )}

        <div className="flex justify-end mt-6">
          <button
            onClick={handleClose}
            className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementOverviewModal;