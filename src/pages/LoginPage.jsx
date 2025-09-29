import React, { useState } from 'react';
import { LogIn, AtSign, Lock, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
// import ForgotPasswordPage from './ForgotPasswordPage';

const LoginPage = ({ onClose, onForgotPasswordClick }) => {
  const [user_id, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Get credentials from environment variables (assuming Vite environment for import.meta.env)
  const getEnvCredentials = () => {
    return [
      {
        user_id: import.meta.env.VITE_SUPERADMIN_USERNAME,
        password: import.meta.env.VITE_SUPERADMIN_PASSWORD,
        role: 'superadmin',
        email: import.meta.env.VITE_SUPERADMIN_EMAIL
      }
    ].filter(user => user.user_id && user.password); // Filter out undefined credentials
  };

  // Access API_BASE_URL from environment variables
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; // Fallback for development

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const users = getEnvCredentials();
    const superadmin = users.find(
      (u) => u.role === 'superadmin' && u.user_id === user_id && u.password === password
    );

    if (superadmin) {
      // Login as superadmin using env credentials
      localStorage.setItem('authRole', superadmin.role); // optional
      navigate('/superadmin');
      if (onClose) onClose();
      return;
    }

    // For all other roles, send POST request to backend
    try {
      const response = await axios.post(`${API_BASE_URL}/api/users/login`, { // Using API_BASE_URL
        user_id,
        password
      });

      const { token, role, userprofile } = response.data;
      console.log('teacher login details are ',response.data);

      // Store token and role
      localStorage.setItem('authToken', JSON.stringify(token));
      const a = JSON.parse(localStorage.getItem('authToken'));

      localStorage.setItem('authRole', JSON.stringify(role));
      localStorage.setItem('userprofile', JSON.stringify(userprofile));
      

      if (userprofile.status === 'Active') {
        // Navigate to dashboard based on role
        switch (role) {
          case 'admin':
            navigate('/admin');
            break;
          case 'teacher':
            navigate('/teacher');
            break;
          case 'student':
            navigate('/student');
            break;
          case 'parent':
            navigate('/parent');
            break;
          default:
            setError('Unknown user role.');
            return;
        }
      }
      else {
        setError('Your account is inactive. Please contact support.');
        return;
      }
      if (onClose) onClose();
    } catch (err) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Login failed. Please try again.');
      }
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleForgotPasswordClick = () => {
    setShowForgotPassword(true);

  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
  };

  return (
    <div className="flex flex-col items-center">
      {!showForgotPassword ? (
        <>
          <div className="p-4 bg-indigo-100 rounded-full mb-6">
            <LogIn size={48} className="text-indigo-600" />
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-6 text-center">Welcome Back!</h3>

          <form onSubmit={handleSubmit} className="space-y-6 w-full">
            <div>
              <label htmlFor="user_id" className="block text-gray-700 text-sm font-medium mb-2">
                Username
              </label>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  id="user_id"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                  placeholder="Enter your unique ID"
                  value={user_id}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-gray-700 text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button" // Important: use type="button" to prevent form submission
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && <p className="text-red-600 text-sm mt-2">{error}</p>}

            <div className="flex justify-between items-center text-sm">
              <label className="flex items-center text-gray-700">
                <input type="checkbox" className="form-checkbox text-indigo-600 rounded mr-2" />
                Remember me
              </label>
              <button
                type="button" // Important: use type="button" to prevent form submission
                onClick={handleForgotPasswordClick}
                className="text-indigo-600 hover:underline focus:outline-none"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-bold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              Sign In
            </button>
          </form>
        </>

      ) : (
        <ForgotPasswordModal
          onClose={() => setShowForgotPassword(false)}
          onBackToLogin={handleBackToLogin}
        />
      )}
    </div>
  );
};

export default LoginPage;
