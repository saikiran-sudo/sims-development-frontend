// superadmin/SuperAdminRouter.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ProfileProvider } from '../pages/superadmin/profile/ProfileContext';
import SuperAdminPage from '../pages/superadmin/SuperAdminPage';
import Navbar from '../pages/superadmin/Navbar';
import ProfileModule from '../pages/superadmin/profile/ProfileModule';
import AboutUs from '../pages/AboutUs'; 
import PrivacyPolicy from '../pages/PrivacyPolicy'; 

const SuperAdminRouter = () => {
  return (
    <ProfileProvider> 
      <Navbar /> 
      <Routes>
        <Route path="/" element={<SuperAdminPage />} />
        <Route path="/profile" element={<ProfileModule />} /> 
        <Route path="/aboutus" element={<AboutUs />} /> 
        <Route path="/privacypolicy" element={<PrivacyPolicy />} /> 
      </Routes>
    </ProfileProvider>
  );
};

export default SuperAdminRouter;