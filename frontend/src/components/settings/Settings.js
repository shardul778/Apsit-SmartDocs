import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Divider,
  Grid,
  Switch,
  FormControlLabel,
  Button,
  Alert
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Palette as PaletteIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useTheme } from '../../context/ThemeContext';
import { PageHeader, AlertMessage } from '../common';

const Settings = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({
    open: false,
    message: '',
    severity: 'info',
  });

  // Settings state
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      browser: true,
      mobile: false,
    },
    appearance: {
      darkMode: darkMode,
      fontSize: 'medium',
      language: 'english',
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: 30, // minutes
    },
  });

  // Handle settings change
  const handleSettingChange = (category, setting) => (event) => {
    const value = event.target.checked;
    setSettings({
      ...settings,
      [category]: {
        ...settings[category],
        [setting]: value,
      },
    });

    // Handle special cases
    if (category === 'appearance' && setting === 'darkMode') {
      toggleDarkMode();
    }
  };

  // Save settings
  const saveSettings = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setAlert({
        open: true,
        message: 'Settings saved successfully',
        severity: 'success',
      });
    }, 1000);
  };

  return (
    <Box>
      <PageHeader
        title="Settings"
        subtitle="Manage your application settings"
        breadcrumbs={[
          { label: 'Dashboard', link: '/dashboard' },
          { label: 'Settings' },
        ]}
      />

      {/* Notifications Settings */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <NotificationsIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6">Notification Settings</Typography>
        </Box>
        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.notifications.email}
                  onChange={handleSettingChange('notifications', 'email')}
                  color="primary"
                />
              }
              label="Email Notifications"
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
              Receive notifications via email for important updates
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={settings.notifications.browser}
                  onChange={handleSettingChange('notifications', 'browser')}
                  color="primary"
                />
              }
              label="Browser Notifications"
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
              Receive notifications in your browser when you're online
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={settings.notifications.mobile}
                  onChange={handleSettingChange('notifications', 'mobile')}
                  color="primary"
                />
              }
              label="Mobile Notifications"
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
              Receive push notifications on your mobile device
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Appearance Settings */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <PaletteIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6">Appearance Settings</Typography>
        </Box>
        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.appearance.darkMode}
                  onChange={handleSettingChange('appearance', 'darkMode')}
                  color="primary"
                />
              }
              label="Dark Mode"
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
              Switch between light and dark theme
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Security Settings */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <SecurityIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6">Security Settings</Typography>
        </Box>
        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.security.twoFactorAuth}
                  onChange={handleSettingChange('security', 'twoFactorAuth')}
                  color="primary"
                />
              }
              label="Two-Factor Authentication"
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
              Add an extra layer of security to your account
            </Typography>

            <Alert severity="info" sx={{ mb: 2 }}>
              Two-factor authentication is currently in development and will be available soon.
            </Alert>
          </Grid>
        </Grid>
      </Paper>

      {/* Save Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          onClick={saveSettings}
          disabled={loading}
        >
          Save Settings
        </Button>
      </Box>

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

export default Settings;