// src/pages/AuthContainer.jsx
import React, { useState } from 'react';
import LoginPage from './LoginPage';
import ForgotPasswordPage from './ForgotPasswordPage';

const AuthContainer = ({ onClose }) => {
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleShowForgotPassword = () => {
    setShowForgotPassword(true);
  };

  const handleShowLogin = () => {
    setShowForgotPassword(false);
  };

  return (
    // Note: The outer div with fixed positioning and background will be handled by LandingPage's modal.
    // AuthContainer itself just needs to render the correct form.
    <>
      {showForgotPassword ? (
        <ForgotPasswordPage onBackToLogin={handleShowLogin} onClose={onClose} />
      ) : (
        <LoginPage onForgotPasswordClick={handleShowForgotPassword} onClose={onClose} />
      )}
    </>
  );
};

export default AuthContainer;