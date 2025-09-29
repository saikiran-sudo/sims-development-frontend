// src/components/AnnouncementDetails.jsx
import React from 'react';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useAnnouncements } from './AnnouncementProvider';

const targetOptions = [
  { value: 'all', label: 'All' },
  { value: 'all_students', label: 'Students' },
  { value: 'all_parents', label: 'Parents' },
  { value: 'all_teachers', label: 'Teachers' },
];

function AnnouncementDetails({ data, onClose }) { // Removed editable prop as it's always false now
  const [formData] = React.useState({
    ...data,
    target: (data.targetGroups || []).map(t => targetOptions.find(option => option.value === t)).filter(Boolean),
    startDate: new Date(data.startDate),
    endDate: new Date(data.endDate)
  });

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[90%] md:w-[600px] max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-semibold mb-4">Announcement Details</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <div className="p-2 bg-gray-100 rounded text-sm">
              {formData.title}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Content</label>
            <div className="p-2 bg-gray-100 rounded text-sm whitespace-pre-line">
              {formData.content}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Target Audience</label>
            <div className="p-2 bg-gray-100 rounded text-sm">
              {formData.target.map(t => t.label).join(', ')}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <div className="p-2 bg-gray-100 rounded text-sm">
                {formData.startDate.toLocaleDateString()}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <div className="p-2 bg-gray-100 rounded text-sm">
                {formData.endDate.toLocaleDateString()}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <div className="p-2 bg-gray-100 rounded text-sm">
              {formData.status}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Created At</label>
            <div className="p-2 bg-gray-100 rounded text-sm">
              {new Date(formData.createdAt).toLocaleString()}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default AnnouncementDetails;