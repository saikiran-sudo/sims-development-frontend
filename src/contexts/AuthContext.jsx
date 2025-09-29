import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('authToken');
        const role = localStorage.getItem('authRole');
        const userProfile = localStorage.getItem('userprofile');

        if (token && role && userProfile) {
          const parsedToken = JSON.parse(token);
          const parsedRole = JSON.parse(role);
          const parsedProfile = JSON.parse(userProfile);

          setUser({
            token: parsedToken,
            role: parsedRole,
            profile: parsedProfile
          });
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = (userData) => {
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authRole');
    localStorage.removeItem('userprofile');
    setUser(null);
    navigate('/');
  };

  const isAuthenticated = () => {
    return !!user;
  };

  const hasRole = (requiredRole) => {
    return user?.role === requiredRole;
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated,
    hasRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 