import axios from 'axios';

const API_URL = '/api/auth';

// Register user
export const register = async (userData) => {
  const response = await axios.post(`${API_URL}/register`, userData);
  return response.data;
};

// Login user
export const login = async (email, password) => {
  const response = await axios.post(`${API_URL}/login`, { email, password });
  return response.data;
};

// Get current user
export const getCurrentUser = async () => {
  const response = await axios.get(`${API_URL}/me`);
  return response.data;
};

// Update profile
export const updateProfile = async (profileData) => {
  const response = await axios.put(`${API_URL}/profile`, profileData);
  return response.data;
};

// Upload profile image
export const uploadProfileImage = async (file) => {
  const formData = new FormData();
  formData.append('profileImage', file);
  
  const response = await axios.put(`${API_URL}/profile/image`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

// Upload signature
export const uploadSignature = async (file) => {
  const formData = new FormData();
  formData.append('signature', file);
  
  const response = await axios.put(`${API_URL}/profile/signature`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

// Change password
export const changePassword = async (currentPassword, newPassword) => {
  const response = await axios.put(`${API_URL}/password`, { currentPassword, newPassword });
  return response.data;
};

// Set auth token
export const setAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};