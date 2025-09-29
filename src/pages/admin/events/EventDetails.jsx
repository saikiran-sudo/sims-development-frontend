import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

function EventDetails({ show, onClose, event, onEdit, onDelete, editable = true }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleDelete = () => {
    setIsDeleting(true);
    onDelete(event.id);
  };

  if (!show || !event) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center p-4">
      <div className="relative p-6 bg-white w-full max-w-2xl mx-auto rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Event Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">{event.title}</h3>
            <p className="text-sm text-gray-600">{event.eventName}</p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700">Description</h4>
            <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">
              {event.description || 'No description provided.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700">Event Type</h4>
              <p className="mt-1 text-sm text-gray-600">
                {event.eventType && event.eventType.length > 0 ? event.eventType.join(', ') : 'N/A'}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700">Target Audience</h4>
              <p className="mt-1 text-sm text-gray-600">
                {event.targetGroups && event.targetGroups.length > 0 ? 
                  (Array.isArray(event.targetGroups) ? 
                    event.targetGroups.join(', ') : 
                    event.targetGroups) : 
                  'N/A'}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700">Start Date</h4>
              <p className="mt-1 text-sm text-gray-600">{formatDate(event.startDate)}</p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700">End Date</h4>
              <p className="mt-1 text-sm text-gray-600">{formatDate(event.endDate)}</p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700">Status</h4>
              <p className="mt-1 text-sm text-gray-600 capitalize">{event.status || 'N/A'}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          {editable && (
            <>
              <button
                onClick={() => onEdit(event)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Edit Event
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Event'}
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default EventDetails;