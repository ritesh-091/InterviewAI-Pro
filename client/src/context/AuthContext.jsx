import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import { useNotification } from './NotificationContext';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useNotification();

  // Load user profile on app mount if token is active
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const profile = await apiRequest('/auth/profile');
          setUser(profile);
        } catch (err) {
          console.error('Failed to load profile, clearing token:', err);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      localStorage.setItem('token', res.token);
      localStorage.setItem('refreshToken', res.refreshToken);
      setUser(res.user);
      addToast('Login Successful', `Welcome back, ${res.user.profile.name}!`, 'success');
      return true;
    } catch (err) {
      addToast('Authentication Failed', err.message, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, name) => {
    setLoading(true);
    try {
      const res = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name })
      });
      localStorage.setItem('token', res.token);
      localStorage.setItem('refreshToken', res.refreshToken);
      setUser(res.user);
      addToast('Account Created', 'A verification email has been logged to the console.', 'success');
      return true;
    } catch (err) {
      addToast('Registration Failed', err.message, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const googleAuth = async (email, name, googleId, avatar) => {
    setLoading(true);
    try {
      const res = await apiRequest('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ email, name, googleId, avatar })
      });
      localStorage.setItem('token', res.token);
      localStorage.setItem('refreshToken', res.refreshToken);
      setUser(res.user);
      addToast('Google Login Successful', `Authorized as ${res.user.profile.name}`, 'success');
      return true;
    } catch (err) {
      addToast('Google Auth Failed', err.message, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setUser(null);
    addToast('Logged Out', 'You have been successfully logged out.', 'info');
  };

  const updateUserProfile = async (profileData) => {
    try {
      const res = await apiRequest('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData)
      });
      setUser(prev => ({
        ...prev,
        profile: res.user.profile
      }));
      addToast('Profile Updated', 'Your profile details have been saved.', 'success');
      return true;
    } catch (err) {
      addToast('Update Failed', err.message, 'error');
      throw err;
    }
  };

  const refreshUser = async () => {
    try {
      const profile = await apiRequest('/auth/profile');
      setUser(profile);
    } catch (err) {
      console.error('Failed to refresh user details:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        login,
        register,
        googleAuth,
        logout,
        updateUserProfile,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
