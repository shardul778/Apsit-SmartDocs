import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Button,
  TextField,
  Typography,
  Link,
  Paper,
  Container,
} from '@mui/material';
import { LockReset as LockResetIcon } from '@mui/icons-material';
import { AlertMessage, LoadingSpinner } from '../common';

// Note: This is a placeholder component as the backend doesn't have a forgot password endpoint yet
const ForgotPassword = () => {
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });
  const [emailSent, setEmailSent] = useState(false);

  const validationSchema = Yup.object({
    email: Yup.string()
      .email('Enter a valid email')
      .required('Email is required'),
  });

  const formik = useFormik({
    initialValues: {
      email: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // This would be replaced with an actual API call in production
        // await authService.forgotPassword(values.email);
        
        setAlert({
          open: true,
          message: 'If an account exists with this email, you will receive password reset instructions.',
          severity: 'success',
        });
        setEmailSent(true);
      } catch (error) {
        setAlert({
          open: true,
          message: 'Failed to process your request. Please try again later.',
          severity: 'error',
        });
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <Container component="main" maxWidth="sm">
      <Paper
        elevation={3}
        sx={{
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          mt: 8,
          borderRadius: 2,
        }}
      >
        <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <LockResetIcon color="primary" sx={{ fontSize: 48, mb: 1 }} />
          <Typography component="h1" variant="h4" gutterBottom>
            Forgot Password
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center">
            Enter your email address and we'll send you instructions to reset your password.
          </Typography>
        </Box>

        {!emailSent ? (
          <Box component="form" onSubmit={formik.handleSubmit} sx={{ width: '100%', mt: 1 }}>
            <TextField
              margin="normal"
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              disabled={loading}
              sx={{ mt: 3, mb: 2 }}
            >
              {loading ? <LoadingSpinner size={24} message="" /> : 'Send Reset Link'}
            </Button>

            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Link component={RouterLink} to="/login" variant="body2">
                Back to Sign In
              </Link>
            </Box>
          </Box>
        ) : (
          <Box sx={{ width: '100%', mt: 2, textAlign: 'center' }}>
            <Typography variant="body1" paragraph>
              Check your email for instructions on how to reset your password.
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              If you don't receive an email within a few minutes, check your spam folder or try again.
            </Typography>
            <Button
              component={RouterLink}
              to="/login"
              variant="outlined"
              color="primary"
              sx={{ mt: 2 }}
            >
              Return to Sign In
            </Button>
          </Box>
        )}
      </Paper>

      <AlertMessage
        open={alert.open}
        message={alert.message}
        severity={alert.severity}
        onClose={() => setAlert({ ...alert, open: false })}
      />
    </Container>
  );
};

export default ForgotPassword;