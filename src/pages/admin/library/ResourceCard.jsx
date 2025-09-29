// src/pages/admin/library/ResourceCard.jsx
import React from 'react';
import { FiEdit, FiTrash2, FiFileText } from 'react-icons/fi'; // Action icons and generic file icon
import { FaFilePdf, FaRegImage, FaVideo, FaLink, FaEye } from 'react-icons/fa'; // Resource type icons

const ResourceCard = ({ resource, onEdit, onDelete }) => {
  // Determine the icon based on resource type
  const getTypeIcon = (type) => {
    switch (type) {
      case 'pdf':
        return <FaFilePdf className="text-red-500" />;
      case 'image':
        return <FaRegImage className="text-green-500" />;
      case 'video':
        return <FaVideo className="text-purple-500" />;
      case 'link':
        return <FaLink className="text-blue-500" />;
      default:
        return <FiFileText className="text-gray-500" />; // Generic file icon
    }
  };

  // Basic function to simulate opening the resource
  const handleViewResource = () => {
    if (resource.url) {
      // For actual files, you might open in a new tab or trigger a download
      // For links/videos, open the URL
      window.open(resource.url, '_blank');
    } else {
      alert("No URL available for this resource to view/download.");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col h-full">
      {/* Card Header with Type Icon and Title */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center">
          {React.cloneElement(getTypeIcon(resource.type), { size: 24, className: 'mr-3' })} {/* Pass size and margin */}
          <h3 className="text-lg font-bold text-gray-800 break-words max-w-[calc(100%-60px)]">{resource.title}</h3>
        </div>
        {/* Placeholder for a preview image/video thumbnail if available */}
        {resource.type === 'image' && resource.url && (
            <img
              src={resource.url}
              alt={resource.title}
              className="w-16 h-16 object-cover rounded-md ml-3"
              onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/600x400/CCCCCC/000000?text=No%20Image'; }}
            />
        )}
      </div>

      {/* Card Body with Details */}
      <div className="p-4 flex-grow space-y-2 text-gray-700 text-sm">
        <p><span className="font-semibold">Subject:</span> {resource.subject}</p>
        <p><span className="font-semibold">Topic:</span> {resource.topic}</p>
        <p><span className="font-semibold">Classes:</span> {resource.classes.join(', ')}</p>
        <p><span className="font-semibold">Description:</span> <span className="text-gray-600 text-sm italic">{resource.description}</span></p>
        <p><span className="font-semibold">Type:</span> <span className="capitalize">{resource.type}</span></p>
      </div>

      {/* Card Footer with Actions - MODIFIED FOR ROW LAYOUT */}
      <div className="p-4 border-t border-gray-200 flex justify-around items-center gap-2 flex-wrap mt-auto"> {/* Added mt-auto to push to bottom */}
        <button
          onClick={handleViewResource}
          className="flex-1 min-w-[80px] bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1.5 rounded-md text-sm font-medium transition duration-200 flex items-center justify-center" // Changed py, added flex-1, justify-center, min-w
          title="View/Download Resource"
        >
          <FaEye className="mr-1" /> View
        </button>
        <button
          onClick={() => onEdit(resource)}
          className="flex-1 min-w-[80px] bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1.5 rounded-md text-sm font-medium transition duration-200 flex items-center justify-center" // Changed py, added flex-1, justify-center, min-w
          title="Edit Resource"
        >
          <FiEdit className="mr-1" /> Edit
        </button>
        <button
          onClick={() => onDelete(resource.id)}
          className="flex-1 min-w-[80px] bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1.5 rounded-md text-sm font-medium transition duration-200 flex items-center justify-center" // Changed py, added flex-1, justify-center, min-w
          title="Delete Resource"
        >
          <FiTrash2 className="mr-1" /> Delete
        </button>
      </div>
    </div>
  );
};

export default ResourceCard;