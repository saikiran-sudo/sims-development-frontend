// src/context/ProfileContext.jsx
import React, { createContext, useState, useContext } from 'react';
export let role = "parent";

const ProfileContext = createContext();

export const ProfileProvider = ({ children }) => {
  const userprofileval = JSON.parse(localStorage.getItem('userprofile'));
  const [profileData, setProfileData] = useState({
    name: `${userprofileval.full_name} - (${userprofileval.user_id})`,
    parentId: userprofileval.user_id,
    email: userprofileval.email,
    phone: userprofileval.phone,
    role: 'Parent',
    lastLogin: userprofileval.last_login,
    school: userprofileval.school_name,
    profileImage: userprofileval.profileImage
  });

  return (
    <ProfileContext.Provider value={{ profileData, setProfileData }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => useContext(ProfileContext);
