import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
  useTheme
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { userService } from '../../services';
import { AuthContext } from '../../contexts/AuthContext';
import { PageHeader, LoadingSpinner, AlertMessage } from '../common';

// User form validation schema
const UserSchema = Yup.object().shape({
  name: Yup.string().required('Name is required').max(100, 'Name is too long'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  department: Yup.string().required('Department is required'),
  position: Yup.string().required('Position is required'),
  role: Yup.string().required('Role is required'),
  password: Yup.string()
    .when('_isNewUser', {
      is: true,
      then: Yup.string()
        .required('Password is required')
        .min(8, 'Password must be at least 8 characters')
        .matches(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\w\W]{8,}$/,
          'Password must contain at least one uppercase letter, one lowercase letter, and one number'
        )
    }),
  confirmPassword: Yup.string()
    .when('password', {
      is: val => val && val.length > 0,
      then: Yup.string()
        .oneOf([Yup.ref('password')], 'Passwords must match')
        .required('Confirm password is required')
    })
});

const UserForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const { user: currentUser } = useContext(AuthContext);
  const isEditMode = Boolean(id);
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(isEditMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [alert, setAlert] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Initial form values
  const initialValues = {
    name: '',
    email: '',
    department: '',
    position: '',
    role: 'user',
    password: '',
    confirmPassword: '',
    _isNewUser: !isEditMode // Used for conditional validation
  };

  // Check if current user is admin
  useEffect(() => {
    if (currentUser?.role !== 'admin') {
      setAlert({
        open: true,
        message: 'You do not have permission to access this page',
        severity: 'error'
      });
    }
  }, [currentUser]);

  // Fetch user if in edit mode
  useEffect(() => {
    if (isEditMode && currentUser?.role === 'admin') {
      const fetchUser = async () => {
        try {
          const data = await userService.getUserById(id);
          // Remove sensitive fields
          delete data.password;
          setUser({
            ...data,
            confirmPassword: '',
            _isNewUser: false
          });
        } catch (error) {
          console.error('Error fetching user:', error);
          setAlert({
            open: true,
            message: 'Failed to load user. Please try again later.',
            severity: 'error'
          });
          navigate('/users');
        } finally {
          setLoading(false);
        }
      };
      fetchUser();
    }
  }, [id, isEditMode, navigate, currentUser]);

  // Handle form submission
  const handleSubmit = async (values, { setSubmitting }) => {
    // Remove the helper field
    const userData = { ...values };
    delete userData._isNewUser;
    delete userData.confirmPassword;
    
    // If editing and password is empty, remove it
    if (isEditMode && !userData.password) {
      delete userData.password;
    }
    
    try {
      if (isEditMode) {
        await userService.updateUser(id, userData);
        setAlert({
          open: true,
          message: 'User updated successfully',
          severity: 'success'
        });
      } else {
        await userService.createUser(userData);
        setAlert({
          open: true,
          message: 'User created successfully',
          severity: 'success'
        });
      }
      
      // Navigate to users list after a short delay
      setTimeout(() => navigate('/users'), 1500);
    } catch (error) {
      console.error('Error saving user:', error);
      setAlert({
        open: true,
        message: `Failed to ${isEditMode ? 'update' : 'create'} user. Please try again later.`,
        severity: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle password visibility
  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Toggle confirm password visibility
  const handleToggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  if (currentUser?.role !== 'admin') {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" color="error" gutterBottom>
          Access Denied
        </Typography>
        <Typography variant="body1">
          You do not have permission to access this page. This page is only accessible to administrators.
        </Typography>
        <Button
          component="a"
          href="/"
          variant="contained"
          sx={{ mt: 2 }}
        >
          Go to Dashboard
        </Button>
      </Box>
    );
  }

  if (loading) {
    return <LoadingSpinner message="Loading user data..." />;
  }

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader 
        title={isEditMode ? 'Edit User' : 'Create User'}
        subtitle={isEditMode ? `Editing: ${user?.name}` : 'Create a new user'}
        breadcrumbs={[
          { label: 'Dashboard', link: '/' },
          { label: 'Users', link: '/users' },
          { label: isEditMode ? 'Edit User' : 'Create User', link: isEditMode ? `/users/${id}/edit` : '/users/create' }
        ]}
        action={{
          label: 'Back to Users',
          icon: <ArrowBackIcon />,
          onClick: () => navigate('/users'),
          link: '/users'
        }}
      />

      <Formik
        initialValues={user || initialValues}
        validationSchema={UserSchema}
        enableReinitialize
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, values, errors, touched, handleChange }) => (
          <Form>
            <Grid container spacing={3}>
              {/* User details */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      User Details
                    </Typography>
                    <Divider sx={{ mb: 3 }} />
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Field
                          as={TextField}
                          fullWidth
                          label="Full Name"
                          name="name"
                          value={values.name}
                          onChange={handleChange}
                          error={touched.name && Boolean(errors.name)}
                          helperText={touched.name && errors.name}
                        />
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Field
                          as={TextField}
                          fullWidth
                          label="Email Address"
                          name="email"
                          type="email"
                          value={values.email}
                          onChange={handleChange}
                          error={touched.email && Boolean(errors.email)}
                          helperText={touched.email && errors.email}
                        />
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth error={touched.department && Boolean(errors.department)}>
                          <InputLabel>Department</InputLabel>
                          <Field
                            as={Select}
                            name="department"
                            label="Department"
                            value={values.department}
                            onChange={handleChange}
                          >
                            <MenuItem value="legal">Legal</MenuItem>
                            <MenuItem value="hr">HR</MenuItem>
                            <MenuItem value="finance">Finance</MenuItem>
                            <MenuItem value="marketing">Marketing</MenuItem>
                            <MenuItem value="it">IT</MenuItem>
                            <MenuItem value="operations">Operations</MenuItem>
                          </Field>
                          {touched.department && errors.department && (
                            <FormHelperText>{errors.department}</FormHelperText>
                          )}
                        </FormControl>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Field
                          as={TextField}
                          fullWidth
                          label="Position"
                          name="position"
                          value={values.position}
                          onChange={handleChange}
                          error={touched.position && Boolean(errors.position)}
                          helperText={touched.position && errors.position}
                        />
                      </Grid>
                      
                      <Grid item xs={12}>
                        <FormControl fullWidth error={touched.role && Boolean(errors.role)}>
                          <InputLabel>Role</InputLabel>
                          <Field
                            as={Select}
                            name="role"
                            label="Role"
                            value={values.role}
                            onChange={handleChange}
                          >
                            <MenuItem value="user">User</MenuItem>
                            <MenuItem value="manager">Manager</MenuItem>
                            <MenuItem value="admin">Admin</MenuItem>
                          </Field>
                          {touched.role && errors.role && (
                            <FormHelperText>{errors.role}</FormHelperText>
                          )}
                        </FormControl>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Password section */}
              <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    {isEditMode ? 'Change Password (Optional)' : 'Set Password'}
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Field
                        as={TextField}
                        fullWidth
                        label="Password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        value={values.password}
                        onChange={handleChange}
                        error={touched.password && Boolean(errors.password)}
                        helperText={touched.password && errors.password}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={handleTogglePasswordVisibility}
                                edge="end"
                              >
                                {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                              </IconButton>
                            </InputAdornment>
                          )
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Field
                        as={TextField}
                        fullWidth
                        label="Confirm Password"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={values.confirmPassword}
                        onChange={handleChange}
                        error={touched.confirmPassword && Boolean(errors.confirmPassword)}
                        helperText={touched.confirmPassword && errors.confirmPassword}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={handleToggleConfirmPasswordVisibility}
                                edge="end"
                              >
                                {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                              </IconButton>
                            </InputAdornment>
                          )
                        }}
                      />
                    </Grid>
                    
                    {isEditMode && (
                      <Grid item xs={12}>
                        <Typography variant="caption" color="text.secondary">
                          Leave the password fields empty if you don't want to change the password.
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </Paper>
              </Grid>

              {/* Form actions */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/users')}
                  >
                    Cancel
                  </Button>
                  
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                    disabled={isSubmitting}
                  >
                    {isEditMode ? 'Update User' : 'Create User'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Form>
        )}
      </Formik>

      {/* Alert message */}
      <AlertMessage
        open={alert.open}
        message={alert.message}
        severity={alert.severity}
        onClose={() => setAlert({ ...alert, open: false })}
      />
    </Box>
  );
};

export default UserForm;