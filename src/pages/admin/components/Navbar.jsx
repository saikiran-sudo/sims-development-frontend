// Navbar.jsx
import React, { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from 'react-router-dom';
import { useAnnouncements } from '../announcements/AnnouncementProvider';
import { useMessages } from '../messages/MessageProvider';
import ProfileDropdown from '../profile/ProfileDropdown';
import { useProfile } from '../profile/ProfileContext';
import SIMSLogo from '../../../assets/sims-logo.png';

// Import specific Font Awesome icons from 'react-icons/fa'
import { FaBars, FaComments, FaBullhorn, FaSearch } from 'react-icons/fa'; // Added FaSearch

const Navbar = ({ isMobileMenuOpen, setIsMobileMenuOpen, onSearchNavigate }) => { // Added onSearchNavigate prop
  const { profileData } = useProfile();
  const { announcements } = useAnnouncements();
  const { unreadMessageCount } = useMessages();
  const navigate = useNavigate();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState(''); // State for search input

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeAnnouncementCount = announcements.filter(ann => {
    const endDate = new Date(ann.endDate);
    return ann.status === 'active' && new Date() <= endDate;
  }).length;

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    if (onSearchNavigate) {
      onSearchNavigate(searchQuery);
      setSearchQuery(''); // Clear search query after submission
    }
  };

  return (
    <div className='flex items-center justify-between p-3 bg-white shadow-sm dark:bg-gray-800'>
      {/* Mobile Menu Toggle and Logo (visible on small screens) */}
      <div className="flex items-center gap-3 lg:hidden">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-full hover:bg-gray-100"
          aria-label="Toggle Mobile Menu"
        >
          <FaBars className="text-gray-600 text-xl" />
        </button>
        <Link to="/" className="flex items-center gap-2">
          <img src={SIMSLogo} alt="SIMS Logo" className="h-10 w-15 animate-fade-in-down" />
        </Link>
      </div>

      {/* Welcome Back message (hidden on small screens, shown on medium and up) */}
      <div className="flex-1 items-center gap-1 md:gap-2 text-sm hidden sm:flex">
        <h1 className="text-gray-700 dark:text-gray-300">Welcome Back,</h1>
        <p className="font-bold text-gray-900 dark:text-white">{profileData.name}</p>
      </div>

      {/* Search Bar (visible on large screens) */}
      <div className="relative flex-grow max-w-sm mx-4 hidden lg:block"> 
        <form onSubmit={handleSearchSubmit}>
          <input
            type="text"
            placeholder="Easy search to any pages"
            className="w-full pl-10 pr-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100 text-gray-800"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </form>
      </div>

      <div className='flex items-center gap-4 sm:gap-6 ml-auto'>
        {/* Messages Icon */}
        <div
          className='bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center cursor-pointer relative hover:bg-gray-200'
          onClick={() => navigate('/admin/messages')}
        >
          <FaComments className="text-gray-600 text-lg" />
          {unreadMessageCount > 0 && (
            <div className='absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-blue-500 text-white rounded-full text-xs font-semibold border-2 border-white'>
              {unreadMessageCount}
            </div>
          )}
        </div>

        {/* Announcements Icon */}
        <div
          className='bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center cursor-pointer relative hover:bg-gray-200'
          onClick={() => navigate('/admin/announcements/overview')}
        >
          <FaBullhorn className="text-gray-600 text-lg" />
          {activeAnnouncementCount > 0 && (
            <div className='absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-purple-500 text-white rounded-full text-xs font-semibold border-2 border-white'>
              {activeAnnouncementCount}
            </div>
          )}
        </div>

        <div className="relative" ref={dropdownRef}>
          <button onClick={() => setShowProfileDropdown(!showProfileDropdown)} className="flex items-center gap-2">
            <div className='hidden sm:flex flex-col items-end'>
              <span className="text-sm font-medium text-gray-800 dark:text-white">{profileData.name}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{profileData.role}</span>
            </div>
            <img
              src={profileData.profileImage}
              alt="User Avatar"
              width={32}
              height={32}
              className="rounded-full w-8 h-8 object-cover"
            />
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