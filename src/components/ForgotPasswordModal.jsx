import React, { useState } from 'react';
import { X, Mail, Lock, Eye, EyeOff, ArrowLeft, RefreshCw } from 'lucide-react';
import axios from 'axios';

const ForgotPasswordModal = ({ onClose, onBackToLogin }) => {
  const [step, setStep] = useState(1); // 1: email, 2: OTP, 3: new password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resetToken, setResetToken] = useState('');

  // Access API_BASE_URL from environment variables
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_BASE_URL}/api/forgot-password/request-reset`, {
        email
      });

      setSuccess(response.data.message);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_BASE_URL}/api/forgot-password/verify-otp`, {
        email,
        otp
      });
      console.log('response', response.data.token);

      setResetToken(response.data.token);
      setSuccess('OTP verified successfully!');
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/api/forgot-password/reset-password`, {
        email,
        token: resetToken,
        newPassword
      });

      setSuccess('Password reset successfully! You can now login with your new password.');
      setTimeout(() => {
        onBackToLogin();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setError('');

    try {
      await axios.post(`${API_BASE_URL}/api/forgot-password/resend-otp`, {
        email
      });

      setSuccess('New OTP sent to your email');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setError('');
      setSuccess('');
    } else {
      onBackToLogin();
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="p-4 bg-blue-100 rounded-full mb-4 inline-block">
          <Mail size={48} className="text-blue-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Forgot Password?</h3>
        <p className="text-gray-600">Enter your email address and we'll send you an OTP to reset your password.</p>
      </div>

      <form onSubmit={handleRequestReset} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-gray-700 text-sm font-medium mb-2">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="email"
              id="email"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Sending...' : 'Send Reset OTP'}
        </button>
      </form>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="p-4 bg-green-100 rounded-full mb-4 inline-block">
          <Lock size={48} className="text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Enter OTP</h3>
        <p className="text-gray-600">We've sent a 6-digit OTP to <strong>{email}</strong></p>
      </div>

      <form onSubmit={handleVerifyOTP} className="space-y-4">
        <div>
          <label htmlFor="otp" className="block text-gray-700 text-sm font-medium mb-2">
            OTP Code
          </label>
          <input
            type="text"
            id="otp"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-center text-2xl font-mono tracking-widest"
            placeholder="000000"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            maxLength={6}
            required
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}
        {success && <p className="text-green-600 text-sm">{success}</p>}

        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
          <button
            type="button"
            onClick={handleResendOTP}
            disabled={loading}
            className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </form>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="p-4 bg-purple-100 rounded-full mb-4 inline-block">
          <Lock size={48} className="text-purple-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Set New Password</h3>
        <p className="text-gray-600">Enter your new password below</p>
      </div>

      <form onSubmit={handleResetPassword} className="space-y-4">
        <div>
          <label htmlFor="newPassword" className="block text-gray-700 text-sm font-medium mb-2">
            New Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type={showPassword ? 'text' : 'password'}
              id="newPassword"
              className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-gray-700 text-sm font-medium mb-2">
            Confirm New Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}
        {success && <p className="text-green-600 text-sm">{success}</p>}

        <button
          type="submit"
          disabled={loading || !newPassword || !confirmPassword}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={goBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} className="text-gray-600" />
            </button>
            <h2 className="text-xl font-semibold text-gray-900">
              {step === 1 ? 'Forgot Password' : step === 2 ? 'Enter OTP' : 'Reset Password'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={24} className="text-gray-600" />
            </button>
          </div>

          {/* Content */}
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
