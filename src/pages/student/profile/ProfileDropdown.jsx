// src/components/ProfileDropdown.jsx
import React from "react";
import { LogOut, Info, Shield, User } from 'lucide-react'; // Import User icon for consistency
import { useProfile } from '../profile/ProfileContext'; // Assuming ProfileContext provides profileData

const ProfileDropdown = ({
  isOpen,
  onClose, // This prop needs to be called to close the dropdown
  onProfileClick,
  onAboutUsClick,
  onPrivacyPolicyClick,
  onLogout
}) => {
  const { profileData } = useProfile();
  if (!isOpen) return null;

  // Helper function to handle clicks: close dropdown then execute action
  const handleClick = (action) => {
    onClose(); // Close the dropdown first
    action(); // Then execute the specific action (e.g., navigate)
  };
  const handleLogout = (action) => {
    localStorage.removeItem('authToken');
    onClose();
    action();
  };

  return (
    <div className="absolute right-0 mt-2 w-64 bg-gray-800 rounded-md shadow-lg py-2 z-50 border border-gray-700 animate-fade-in-down">
      {/* Profile Info Section */}
      <div className="px-4 py-3 border-b border-gray-700 flex flex-col items-center">
        <img
          src={profileData.profileImage || '/avatar.png'} // Fallback for profile image
          alt="Profile"
          width={64}
          height={64}
          className="w-16 h-16 rounded-full mb-2 border-2 border-gray-600 object-cover"
        />
        <p className="text-sm font-medium text-white">{profileData.name || 'User'}</p>
        <button
          className="w-full text-xs bg-gray-700 text-white hover:bg-gray-600 py-1 px-2 rounded transition-colors duration-150"
          onClick={() => handleClick(onProfileClick)} // Call handleClick
        >
          <User size={14} className="inline-block mr-1" /> View Profile
        </button>
      </div>

      {/* Navigation Links Section */}
      <div className="py-1">
        {/* New "About Us" Link */}
        <button
          className="flex items-center w-full px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 transition-colors duration-150"
          onClick={() => handleClick(onAboutUsClick)} // Call handleClick
        >
          <Info size={14} className="mr-2 text-gray-400" /> {/* Info icon for About Us */}
          About Us
        </button>
        {/* New "Privacy Policies" Link */}
        <button
          className="flex items-center w-full px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 transition-colors duration-150"
          onClick={() => handleClick(onPrivacyPolicyClick)} // Call handleClick
        >
          <Shield size={14} className="mr-2 text-gray-400" /> {/* Shield icon for Privacy Policies */}
          Privacy Policies
        </button>
      </div>

      {/* Logout Section */}
      <div className="border-t border-gray-700 py-1">
        <button
          className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-gray-700 transition-colors duration-150" // Changed text color for logout to red-400
          onClick={() => handleLogout(onLogout)} // Call handleClick
        >
          <LogOut size={14} className="mr-2 text-red-400" /> {/* Icon color also red-400 */}
          Logout
        </button>
      </div>
    </div>
  );
};

export default ProfileDropdown;