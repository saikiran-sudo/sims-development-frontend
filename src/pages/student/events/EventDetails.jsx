import React from 'react';
import { X } from 'lucide-react';

function EventDetails({ onClose, eventData }) {
  if (!eventData) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center p-4">
      <div className="relative p-6 bg-white w-full max-w-2xl mx-auto rounded-lg shadow-lg">
        {/* Modal Header */}
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Event Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        {/* Details Body */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <div className="p-2 bg-gray-100 rounded text-sm">{eventData.title || 'N/A'}</div>
          </div>

          {/* Event Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Name</label>
            <div className="p-2 bg-gray-100 rounded text-sm">{eventData.eventName || 'N/A'}</div>
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <div className="p-2 bg-gray-100 rounded text-sm whitespace-pre-wrap">
              {eventData.description || 'No description provided.'}
            </div>
          </div>

          {/* Event Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
            <div className="p-2 bg-gray-100 rounded text-sm">
              {eventData.eventType && eventData.eventType.length > 0 ? 
                eventData.eventType.join(', ') : 'N/A'}
            </div>
          </div>

          {/* Target Audience */}
          <div>
            <label className="block text-sm font-medium mb-1">Target Audience</label>
            <div className="p-2 bg-gray-100 rounded text-sm">
              {eventData.targetAudience || 'N/A'}
            </div>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <div className="p-2 bg-gray-100 rounded text-sm">
              {formatDate(eventData.startDate)}
            </div>
          </div>

          {/* End Date (Optional) */}
          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <div className="p-2 bg-gray-100 rounded text-sm">
              {formatDate(eventData.endDate)}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <div className="p-2 bg-gray-100 rounded text-sm">
              {eventData.status || 'N/A'}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">Close</button>
        </div>
      </div>
    </div>
  );
}

export default EventDetails;