// src/context/ProfileContext.jsx
import React, { createContext, useState, useContext } from 'react';
export let role = "admin";

const ProfileContext = createContext();

export const ProfileProvider = ({ children }) => {
  const userprofileval = JSON.parse(localStorage.getItem('userprofile'));
  const [profileData, setProfileData] = useState({
    // name: 'Kushwinth Kumar',
    // email: 'kushwinthkumar@gmail.com',
    // phone: '+1 (555) 123-4567',
    // role: 'Admin',
    // profileImage: '/avatar.png',
    // subscriptionActive: true, // Added: true if subscription is active
    // subscriptionExpiryDate: '2026-07-15' // Added: Expiry date in YYYY-MM-DD format
    name: `${userprofileval.full_name} - (${userprofileval.user_id})`,
    email: userprofileval.email,
    phone: userprofileval.phone,
    role: 'Admin',
    profileImage: userprofileval.profileImage,
    subscriptionActive: userprofileval.is_active, // Added: true if subscription is active
    subscriptionExpiryDate: userprofileval.renewalDate // Added: Expiry date in YYYY-MM-DD format
  });

  return (
    <ProfileContext.Provider value={{ profileData, setProfileData }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => useContext(ProfileContext);