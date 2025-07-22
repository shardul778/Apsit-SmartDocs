import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import jwt_decode from 'jwt-decode';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state from localStorage on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (token) {
          // Check if token is expired
          const decodedToken = jwt_decode(token);
          const currentTime = Date.now() / 1000;
          
          if (decodedToken.exp < currentTime) {
            // Token is expired
            logout();
          } else {
            // Set auth token in axios headers
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            // Get current user data
            const response = await axios.get('/api/auth/me');
            
            setUser(response.data.user);
            setIsAuthenticated(true);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      setError(null);
      setIsLoading(true);
      
      const response = await axios.post('/api/auth/login', { email, password });
      const { token, user } = response.data;
      
      // Save token to localStorage
      localStorage.setItem('token', token);
      
      // Set auth token in axios headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(user);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed. Please try again.';
      setError(message);
      return { success: false, message };
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      setError(null);
      setIsLoading(true);
      
      const response = await axios.post('/api/auth/register', userData);
      const { token, user } = response.data;
      
      // Save token to localStorage
      localStorage.setItem('token', token);
      
      // Set auth token in axios headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(user);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed. Please try again.';
      setError(message);
      return { success: false, message };
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    // Remove token from localStorage
    localStorage.removeItem('token');
    
    // Remove auth token from axios headers
    delete axios.defaults.headers.common['Authorization'];
    
    setUser(null);
    setIsAuthenticated(false);
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      setError(null);
      setIsLoading(true);
      
      const response = await axios.put('/api/auth/profile', profileData);
      
      setUser(response.data.user);
      
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Profile update failed. Please try again.';
      setError(message);
      return { success: false, message };
    } finally {
      setIsLoading(false);
    }
  };

  // Upload profile image
  const uploadProfileImage = async (file) => {
    try {
      setError(null);
      setIsLoading(true);
      
      const formData = new FormData();
      formData.append('profileImage', file);
      
      const response = await axios.put('/api/auth/profile/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Update user state with new profile image
      setUser({
        ...user,
        profileImage: response.data.profileImage,
      });
      
      return { success: true, profileImage: response.data.profileImage };
    } catch (error) {
      const message = error.response?.data?.message || 'Image upload failed. Please try again.';
      setError(message);
      return { success: false, message };
    } finally {
      setIsLoading(false);
    }
  };

  // Upload signature
  const uploadSignature = async (file) => {
    try {
      setError(null);
      setIsLoading(true);
      
      const formData = new FormData();
      formData.append('signature', file);
      
      const response = await axios.put('/api/auth/profile/signature', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Update user state with new signature
      setUser({
        ...user,
        signature: response.data.signature,
      });
      
      return { success: true, signature: response.data.signature };
    } catch (error) {
      const message = error.response?.data?.message || 'Signature upload failed. Please try again.';
      setError(message);
      return { success: false, message };
    } finally {
      setIsLoading(false);
    }
  };

  // Change password
  const changePassword = async (currentPassword, newPassword) => {
    try {
      setError(null);
      setIsLoading(true);
      
      await axios.put('/api/auth/password', { currentPassword, newPassword });
      
      return { success: true, message: 'Password changed successfully' };
    } catch (error) {
      const message = error.response?.data?.message || 'Password change failed. Please try again.';
      setError(message);
      return { success: false, message };
    } finally {
      setIsLoading(false);
    }
  };

  // Clear error
  const clearError = () => setError(null);

  const value = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    updateProfile,
    uploadProfileImage,
    uploadSignature,
    changePassword,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};