// src/pages/ForgotPasswordPage.jsx
import React, { useState, useEffect } from 'react';
import { Mail, ArrowLeft, KeyRound, RefreshCcw, Lock, CheckCircle } from 'lucide-react';
import axios from 'axios';

const ForgotPasswordPage = ({ onBackToLogin, onClose }) => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [passwordResetSuccess, setPasswordResetSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0); // For OTP resend countdown
  const [redirectCountdown, setRedirectCountdown] = useState(3); // For redirect countdown
  const [isResending, setIsResending] = useState(false);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Effect for OTP resend countdown
  useEffect(() => {
    let interval;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [countdown]);

  // Effect for redirect countdown
  useEffect(() => {
    let timer;
    if (passwordResetSuccess && redirectCountdown > 0) {
      timer = setTimeout(() => {
        setRedirectCountdown(prev => prev - 1);
      }, 1000);
    } else if (passwordResetSuccess && redirectCountdown === 0) {
      onBackToLogin(); // Redirect when countdown finishes
    }
    return () => clearTimeout(timer);
  }, [passwordResetSuccess, redirectCountdown, onBackToLogin]);


  const handleSendOtp = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setOtpVerified(false);
    setPasswordResetSuccess(false);

    if (!email.includes('@') || !email.includes('.')) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsResending(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/admins/send-otp`, {
        email: email
      });

      setMessage(response.data.message || 'A One-Time Password (OTP) has been sent to your email address.');
      setOtpSent(true);
      setCountdown(60); // Start OTP resend countdown
    } catch (err) {
      console.error('Error sending OTP:', err);
      setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setPasswordResetSuccess(false);

    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      setError('Please enter a valid 6-digit OTP.');
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/admins/verify-otp`, {
        email: email,
        otp: otp
      });

      setMessage(response.data.message || 'OTP verified successfully! Please set your new password.');
      setError('');
      setOtpVerified(true);
    } catch (err) {
      console.error('Error verifying OTP:', err);
      setError(err.response?.data?.message || 'Failed to verify OTP. Please try again.');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/admins/reset-password`, {
        email: email,
        newPassword: newPassword
      });

      setPasswordResetSuccess(true);
      setMessage('');
      setError('');
      setRedirectCountdown(3); // Initialize redirect countdown

      // The redirection will now be handled by the useEffect for redirectCountdown
    } catch (err) {
      console.error('Error resetting password:', err);
      setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
    }
  };


  return (
    <div className="flex flex-col items-center">
      {passwordResetSuccess ? (
        <div className="flex flex-col items-center justify-center text-center p-8 bg-white rounded-lg shadow-xl animate-fade-in">
          <CheckCircle size={80} className="text-green-500 mb-6 animate-bounce-in" />
          <h3 className="text-4xl font-bold text-gray-900 mb-4">Success!</h3>
          <p className="text-gray-700 text-lg mb-8">
            Your password has been successfully reset. You can now log in with your new password.
          </p>
          <p className="text-gray-500 text-sm">
            Redirecting to login page in {redirectCountdown} seconds...
          </p>
        </div>
      ) : (
        <>
          <div className="p-4 bg-purple-100 rounded-full mb-6">
            {otpVerified ? <Lock size={48} className="text-purple-600" /> : otpSent ? <KeyRound size={48} className="text-purple-600" /> : <Mail size={48} className="text-purple-600" />}
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            {otpVerified ? 'Set New Password' : otpSent ? 'Verify OTP' : 'Reset Your Password'}
          </h3>
          <p className="text-gray-600 text-center mb-6">
            {otpVerified
              ? 'Enter your new password below.'
              : otpSent
                ? 'Enter the 6-digit code sent to your email address.'
                : 'Enter your email address and we\'ll send you a One-Time Password (OTP) to reset your password.'}
          </p>

          {/* NEW: Note for Teachers, Students, Parents */}
          {!otpSent && !otpVerified && ( // Show this note only on the initial email input screen
            <p className="text-red-500 text-center mb-6 p-3 border border-red-300 bg-red-50 rounded-lg">
              <strong>Note:</strong> If you are a Teacher, Student, or Parent, please contact school management to reset your password.
            </p>
          )}

          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-6 w-full">
              <div>
                <label htmlFor="email" className="block text-gray-700 text-sm font-medium mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="email"
                    id="email"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
              {message && <p className="text-green-600 text-sm mt-2">{message}</p>}

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-bold text-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg"
                disabled={isResending}
              >
                {isResending ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>
          ) : !otpVerified ? (
            <form onSubmit={handleVerifyOtp} className="space-y-6 w-full">
              <div>
                <label htmlFor="otp" className="block text-gray-700 text-sm font-medium mb-2">
                  One-Time Password (OTP)
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    id="otp"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength="6"
                    required
                  />
                </div>
              </div>

              {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
              {message && <p className="text-green-600 text-sm mt-2">{message}</p>}

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-bold text-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg"
              >
                Verify OTP
              </button>

              <button
                type="button"
                onClick={handleSendOtp}
                className="w-full flex items-center justify-center py-3 text-purple-600 hover:text-purple-800 transition-colors mt-4"
                disabled={countdown > 0 || isResending}
              >
                <RefreshCcw size={18} className="mr-2" />
                {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-6 w-full">
              <div>
                <label htmlFor="newPassword" className="block text-gray-700 text-sm font-medium mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="password"
                    id="newPassword"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-gray-700 text-sm font-medium mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="password"
                    id="confirmPassword"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
              {message && <p className="text-green-600 text-sm mt-2">{message}</p>}

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-bold text-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg"
              >
                Reset Password
              </button>
            </form>
          )}

          {!otpVerified && (
            <button
              type="button"
              onClick={onBackToLogin}
              className="w-full flex items-center justify-center py-3 text-indigo-600 hover:text-indigo-800 transition-colors mt-4"
            >
              <ArrowLeft size={18} className="mr-2" /> Back to Login
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default ForgotPasswordPage;