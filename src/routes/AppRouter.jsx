import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from '../pages/LandingPage';
import AboutUs from '../pages/AboutUs';
import PrivacyPolicy from '../pages/PrivacyPolicy';
import LoginPage from '../pages/LoginPage';
import AdminRouter from './AdminRouter';
import TeacherRouter from './TeacherRouter';
import StudentRouter from './StudentRouter';
import ParentRouter from './ParentRouter';
import SuperAdminRouter from './SuperAdminRouter';
import PrivateRoute from '../components/PrivateRoute';

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/aboutus" element={<AboutUs />} />
      <Route path="/privacypolicy" element={<PrivacyPolicy />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/superadmin/*" element={<SuperAdminRouter />} />
      <Route path="/admin/*" element={<PrivateRoute allowedRoles={['admin']}><AdminRouter /></PrivateRoute>} />
      <Route path="/teacher/*" element={<PrivateRoute allowedRoles={['teacher']}><TeacherRouter /></PrivateRoute>} />
      <Route path="/student/*" element={<PrivateRoute allowedRoles={['student']}><StudentRouter /></PrivateRoute>} />
      <Route path="/parent/*" element={<PrivateRoute allowedRoles={['parent']}><ParentRouter /></PrivateRoute>} />
    </Routes>
  );
};

export default AppRouter;
