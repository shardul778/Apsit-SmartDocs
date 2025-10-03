import React, { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Grid,
  Avatar,
  Divider,
  IconButton,
  Tab,
  Tabs,
  InputAdornment,
  Card,
  CardContent,
} from '@mui/material';
import {
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  PhotoCamera as PhotoCameraIcon,
  Draw as DrawIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import axios from '../../services/axiosConfig';
import { PageHeader, AlertMessage, LoadingSpinner } from '../common';

const Profile = () => {
  const { user, updateProfile, uploadProfileImage, getProfileImageUrl, uploadSignature, getSignatureUrl, changePassword } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [profileSrc, setProfileSrc] = useState(null);
  const [signatureSrc, setSignatureSrc] = useState(null);
  const [profileReloadKey, setProfileReloadKey] = useState(0);

  // Load images as blobs to ensure auth headers are applied
  const loadProfileImage = async (force = false) => {
    try {
      const maxRetries = 5;
      const delayMs = 300;
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const ts = Date.now();
          const response = await axios.get(`/api/auth/profile/image?_=${ts}`, { responseType: 'blob' });
          const contentType = (response.headers && response.headers['content-type']) || '';
          const blob = response.data;
          if (contentType.startsWith('image/') && blob && blob.size > 0) {
            const objectUrl = URL.createObjectURL(blob);
            setProfileSrc((prev) => {
              if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
              return objectUrl;
            });
            setProfileReloadKey((k) => k + 1);
            return;
          }
        } catch (inner) {}
        await new Promise((r) => setTimeout(r, delayMs));
      }
    } catch (e) {
      // Keep existing preview/source on failure
    }
  };

  const loadSignatureImage = async (force = false) => {
    try {
      const maxRetries = 5;
      const delayMs = 300;
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const ts = Date.now();
          const response = await axios.get(`/api/auth/profile/signature?_=${ts}`, { responseType: 'blob' });
          const contentType = (response.headers && response.headers['content-type']) || '';
          const blob = response.data;
          if (contentType.startsWith('image/') && blob && blob.size > 0) {
            const objectUrl = URL.createObjectURL(blob);
            setSignatureSrc((prev) => {
              if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
              return objectUrl;
            });
            return;
          }
        } catch (inner) {}
        await new Promise((r) => setTimeout(r, delayMs));
      }
    } catch (e) {
      // Keep existing preview/source on failure
    }
  };

  useEffect(() => {
    loadProfileImage();
    loadSignatureImage();
    // Cleanup object URLs on unmount
    return () => {
      if (profileSrc) URL.revokeObjectURL(profileSrc);
      if (signatureSrc) URL.revokeObjectURL(signatureSrc);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.hasProfileImage, user?.hasSignature]);

  // Profile update form
  const profileFormik = useFormik({
    initialValues: {
      name: user?.name || '',
      email: user?.email || '',
      department: user?.department || '',
      position: user?.position || '',
    },
    validationSchema: Yup.object({
      name: Yup.string().required('Name is required'),
      email: Yup.string().email('Invalid email address').required('Email is required'),
      department: Yup.string().required('Department is required'),
      position: Yup.string().required('Position is required'),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      try {
        await updateProfile(values);
        setAlert({
          open: true,
          message: 'Profile updated successfully',
          severity: 'success',
        });
      } catch (error) {
        setAlert({
          open: true,
          message: error.response?.data?.message || 'Failed to update profile',
          severity: 'error',
        });
      } finally {
        setLoading(false);
      }
    },
  });

  // Password change form
  const passwordFormik = useFormik({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validationSchema: Yup.object({
      currentPassword: Yup.string().required('Current password is required'),
      newPassword: Yup.string()
        .min(8, 'Password must be at least 8 characters')
        .matches(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]+$/,
          'Password must contain at least one uppercase letter, one lowercase letter, and one number'
        )
        .required('New password is required'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('newPassword'), null], 'Passwords must match')
        .required('Confirm password is required'),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      try {
        await changePassword(values.currentPassword, values.newPassword);
        setAlert({
          open: true,
          message: 'Password changed successfully',
          severity: 'success',
        });
        passwordFormik.resetForm();
      } catch (error) {
        setAlert({
          open: true,
          message: error.response?.data?.message || 'Failed to change password',
          severity: 'error',
        });
      } finally {
        setLoading(false);
      }
    },
  });

  const handleProfileImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file type
    const fileType = file.type;
    if (!fileType.includes('image/')) {
      setAlert({
        open: true,
        message: 'Please upload an image file',
        severity: 'error',
      });
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setAlert({
        open: true,
        message: 'Image size should not exceed 5MB',
        severity: 'error',
      });
      return;
    }


    // Immediate local preview
    try {
      const localUrl = URL.createObjectURL(file);
      setProfileSrc((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return localUrl;
      });
      setProfileReloadKey((k) => k + 1);
    } catch (e) {}

    setLoading(true);
    try {
      await uploadProfileImage(file);
      setAlert({
        open: true,
        message: 'Profile image updated successfully',
        severity: 'success',
      });
      await loadProfileImage(true);
    } catch (error) {
      setAlert({
        open: true,
        message: error.response?.data?.message || 'Failed to upload profile image',
        severity: 'error',
      });
    } finally {
      setLoading(false);
      // reset input to allow re-uploading the same file name
      try { event.target.value = ''; } catch (e) {}
    }
  };

  const handleSignatureUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file type
    const fileType = file.type;
    if (!fileType.includes('image/')) {
      setAlert({
        open: true,
        message: 'Please upload an image file',
        severity: 'error',
      });
      return;
    }

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setAlert({
        open: true,
        message: 'Signature image size should not exceed 2MB',
        severity: 'error',
      });
      return;
    }

    setLoading(true);
    try {
      await uploadSignature(file);
      setAlert({
        open: true,
        message: 'Signature updated successfully',
        severity: 'success',
      });
      await loadSignatureImage();
    } catch (error) {
      setAlert({
        open: true,
        message: error.response?.data?.message || 'Failed to upload signature',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword({
      ...showPassword,
      [field]: !showPassword[field],
    });
  };

  return (
    <Box>
      <PageHeader
        title="My Profile"
        subtitle="Manage your account information"
        breadcrumbs={[
          { label: 'Dashboard', link: '/dashboard' },
          { label: 'Profile' },
        ]}
      />

      <Paper sx={{ p: 0, mb: 4 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Profile Information" />
          <Tab label="Change Password" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {/* Profile Information Tab */}
          {activeTab === 0 && (
            <Grid container spacing={4}>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Box sx={{ position: 'relative', mb: 3 }}>
                      <Avatar
                        key={profileReloadKey}
                        src={profileSrc || getProfileImageUrl() || undefined}
                        alt={user?.name}
                        sx={{ width: 150, height: 150, mb: 2 }}
                      />
                      <input
                        accept="image/*"
                        style={{ display: 'none' }}
                        id="profile-image-upload"
                        type="file"
                        onChange={handleProfileImageUpload}
                      />
                      <label htmlFor="profile-image-upload">
                        <IconButton
                          color="primary"
                          aria-label="upload profile picture"
                          component="span"
                          sx={{
                            position: 'absolute',
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'background.paper',
                            boxShadow: 1,
                            '&:hover': { backgroundColor: 'background.default' },
                          }}
                        >
                          <PhotoCameraIcon />
                        </IconButton>
                      </label>
                    </Box>

                    <Typography variant="h6" gutterBottom>
                      {user?.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {user?.email}
                    </Typography>
                    <Divider sx={{ width: '100%', my: 2 }} />

                    <Typography variant="subtitle2" gutterBottom>
                      Department
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {user?.department || 'Not specified'}
                    </Typography>

                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                      Position
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {user?.position || 'Not specified'}
                    </Typography>

                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                      Role
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {user?.role === 'admin' ? 'Administrator' : 'Regular User'}
                    </Typography>
                  </CardContent>
                </Card>

                <Card sx={{ mt: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Signature
                    </Typography>
                    <Divider sx={{ mb: 2 }} />

                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px dashed',
                        borderColor: 'divider',
                        borderRadius: 1,
                        p: 2,
                        minHeight: 100,
                        position: 'relative',
                      }}
                    >
                      {user?.hasSignature ? (
                        <Box
                          component="img"
                          src={signatureSrc || getSignatureUrl()}
                          alt="Signature"
                          sx={{ maxWidth: '100%', maxHeight: 100 }}
                        />
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No signature uploaded
                        </Typography>
                      )}

                      <input
                        accept="image/*"
                        style={{ display: 'none' }}
                        id="signature-upload"
                        type="file"
                        onChange={handleSignatureUpload}
                      />
                      <label htmlFor="signature-upload">
                        <IconButton
                          color="primary"
                          aria-label="upload signature"
                          component="span"
                          sx={{
                            position: 'absolute',
                            right: 8,
                            bottom: 8,
                            backgroundColor: 'background.paper',
                            boxShadow: 1,
                            '&:hover': { backgroundColor: 'background.default' },
                          }}
                        >
                          <DrawIcon />
                        </IconButton>
                      </label>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Upload a clear image of your signature (PNG or JPEG, max 2MB)
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={8}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Edit Profile
                    </Typography>
                    <Divider sx={{ mb: 3 }} />

                    <Box component="form" onSubmit={profileFormik.handleSubmit}>
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            id="name"
                            name="name"
                            label="Full Name"
                            value={profileFormik.values.name}
                            onChange={profileFormik.handleChange}
                            onBlur={profileFormik.handleBlur}
                            error={profileFormik.touched.name && Boolean(profileFormik.errors.name)}
                            helperText={profileFormik.touched.name && profileFormik.errors.name}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            id="email"
                            name="email"
                            label="Email Address"
                            value={profileFormik.values.email}
                            onChange={profileFormik.handleChange}
                            onBlur={profileFormik.handleBlur}
                            error={profileFormik.touched.email && Boolean(profileFormik.errors.email)}
                            helperText={profileFormik.touched.email && profileFormik.errors.email}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            id="department"
                            name="department"
                            label="Department"
                            value={profileFormik.values.department}
                            onChange={profileFormik.handleChange}
                            onBlur={profileFormik.handleBlur}
                            placeholder="IT / Computer Science / Data Science / AIML"
                            error={profileFormik.touched.department && Boolean(profileFormik.errors.department)}
                            helperText={profileFormik.touched.department && profileFormik.errors.department}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            id="position"
                            name="position"
                            label="Position"
                            value={profileFormik.values.position}
                            onChange={profileFormik.handleChange}
                            onBlur={profileFormik.handleBlur}
                            error={profileFormik.touched.position && Boolean(profileFormik.errors.position)}
                            helperText={profileFormik.touched.position && profileFormik.errors.position}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            startIcon={<EditIcon />}
                            disabled={loading}
                          >
                            {loading ? <LoadingSpinner size={24} message="" /> : 'Update Profile'}
                          </Button>
                        </Grid>
                      </Grid>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Change Password Tab */}
          {activeTab === 1 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Change Password
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <Box component="form" onSubmit={passwordFormik.handleSubmit}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        id="currentPassword"
                        name="currentPassword"
                        label="Current Password"
                        type={showPassword.current ? 'text' : 'password'}
                        value={passwordFormik.values.currentPassword}
                        onChange={passwordFormik.handleChange}
                        onBlur={passwordFormik.handleBlur}
                        error={passwordFormik.touched.currentPassword && Boolean(passwordFormik.errors.currentPassword)}
                        helperText={passwordFormik.touched.currentPassword && passwordFormik.errors.currentPassword}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => togglePasswordVisibility('current')}
                                edge="end"
                              >
                                {showPassword.current ? <VisibilityOffIcon /> : <VisibilityIcon />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        id="newPassword"
                        name="newPassword"
                        label="New Password"
                        type={showPassword.new ? 'text' : 'password'}
                        value={passwordFormik.values.newPassword}
                        onChange={passwordFormik.handleChange}
                        onBlur={passwordFormik.handleBlur}
                        error={passwordFormik.touched.newPassword && Boolean(passwordFormik.errors.newPassword)}
                        helperText={passwordFormik.touched.newPassword && passwordFormik.errors.newPassword}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => togglePasswordVisibility('new')}
                                edge="end"
                              >
                                {showPassword.new ? <VisibilityOffIcon /> : <VisibilityIcon />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        id="confirmPassword"
                        name="confirmPassword"
                        label="Confirm New Password"
                        type={showPassword.confirm ? 'text' : 'password'}
                        value={passwordFormik.values.confirmPassword}
                        onChange={passwordFormik.handleChange}
                        onBlur={passwordFormik.handleBlur}
                        error={passwordFormik.touched.confirmPassword && Boolean(passwordFormik.errors.confirmPassword)}
                        helperText={passwordFormik.touched.confirmPassword && passwordFormik.errors.confirmPassword}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => togglePasswordVisibility('confirm')}
                                edge="end"
                              >
                                {showPassword.confirm ? <VisibilityOffIcon /> : <VisibilityIcon />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={loading}
                      >
                        {loading ? <LoadingSpinner size={24} message="" /> : 'Change Password'}
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              </CardContent>
            </Card>
          )}
        </Box>
      </Paper>

      <AlertMessage
        open={alert.open}
        message={alert.message}
        severity={alert.severity}
        onClose={() => setAlert({ ...alert, open: false })}
      />
    </Box>
  );
};

export default Profile;