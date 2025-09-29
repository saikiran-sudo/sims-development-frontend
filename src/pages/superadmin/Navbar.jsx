// src/pages/superadmin/Navbar.jsx

import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import ProfileDropdown from './profile/ProfileDropdown';
import { useProfile } from './profile/ProfileContext';
import { FaHome } from 'react-icons/fa'; // Import the Font Awesome Home icon

const Navbar = () => {
  const { profileData } = useProfile();
  const navigate = useNavigate();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className='flex items-center justify-between p-4 bg-white shadow-sm dark:bg-gray-800'>
      <div className="flex-1 flex items-center gap-1 md:gap-2 text-sm">
        <h1 className="hidden sm:block text-gray-700 dark:text-gray-300">Welcome Back,</h1>
        <p className="font-bold text-gray-900 dark:text-white">{profileData.name}</p>
      </div>

      <div className='flex items-center gap-4 sm:gap-6 ml-4'>
        {/* Home Icon using Font Awesome */}
        <div
          className='bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center cursor-pointer relative hover:bg-gray-200'
          onClick={() => navigate('/superadmin')} // Navigates to the root of the SuperAdminRouter (SuperAdminPage)
        >
          <FaHome size={20} className="text-gray-600 dark:text-gray-300" /> {/* Font Awesome Home Icon */}
        </div>

        <div className="relative" ref={dropdownRef}>
          <button onClick={() => setShowProfileDropdown(!showProfileDropdown)} className="flex items-center gap-2">
            <div className='hidden sm:flex flex-col items-end'>
              <span className="text-sm font-medium text-gray-800 dark:text-white">{profileData.name}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{profileData.role}</span>
            </div>
            {/* Modified: Wrap image in a div to enforce square shape and object-fit */}
            <div className="w-8 h-8 rounded-full overflow-hidden">
              <img 
                src={profileData.profileImage} 
                alt="User Avatar" 
                className="w-full h-full object-cover" // Ensure image covers the div, cropping if needed
              />
            </div>
          </button>

          <ProfileDropdown
            isOpen={showProfileDropdown}
            onClose={() => setShowProfileDropdown(false)}
            onProfileClick={() => navigate('profile')}
            onSettingsClick={() => navigate('settings')}
            onAboutUsClick={() => navigate('aboutus')}
            onPrivacyPolicyClick={() => navigate('privacypolicy')}
            onLogout={() => navigate('/landing')}
          />
        </div>
      </div>
    </div>
  );
};

export default Navbar;