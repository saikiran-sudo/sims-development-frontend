// src/context/ProfileContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { studentAPI } from '../../../services/api';
export let role = "student";

const ProfileContext = createContext();

export const ProfileProvider = ({ children }) => {
  const userprofileval = JSON.parse(localStorage.getItem('userprofile'));
  const [profileData, setProfileData] = useState({
    name: `${userprofileval.full_name} - (${userprofileval.user_id})`,
    user_id: userprofileval.user_id,
    phone: userprofileval.phone,
    role: 'Student',
    lastLogin: userprofileval.last_login,
    school: userprofileval.school_name,
    profileImage: userprofileval.profileImage,
    class: userprofileval.class_id,
    section: userprofileval.section,
    classTeacher: null,
    parentGuardian: null
  });

  // Fetch student profile data when component mounts
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const response = await studentAPI.getMyProfile();
        const studentData = response.data;
        
        console.log('Student data received:', studentData);
        console.log('Parent ID data:', studentData.parent_id.map(p => `${p.full_name}(${p.user_id})`));
        console.log('Parent Info data:', studentData.parentInfo);
        
        setProfileData(prev => ({
          ...prev,
          name: `${studentData.full_name} - (${studentData.user_id})`,
          user_id: studentData.user_id,
          phone: studentData.phone || userprofileval.phone,
          class: studentData.class_id,
          section: studentData.section,
          classTeacher: studentData.classTeacher?.display_name || 'Not Assigned',
          // parentGuardian: studentData.parentInfo?.display_name || (studentData.parent_id ? `${studentData.parent_id.full_name}(${studentData.parent_id.user_id})` : 'Not Assigned')
          parentGuardian: studentData.parent_id.map(p => `${p.full_name}(${p.user_id})`).filter(Boolean).join(', ')
        }));
      } catch (error) {
        console.error('Error fetching student profile:', error);
      }
    };

    fetchProfileData();
  }, []);

  return (
    <ProfileContext.Provider value={{ profileData, setProfileData }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => useContext(ProfileContext);
