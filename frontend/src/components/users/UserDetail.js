import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Typography,
  useTheme
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  Work as WorkIcon,
  CalendarToday as CalendarTodayIcon,
  Person as PersonIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { userService } from '../../services';
import { AuthContext } from '../../contexts/AuthContext';
import { PageHeader, LoadingSpinner, ConfirmDialog, AlertMessage } from '../common';
import { formatDate } from '../../utils/formatters';

const UserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const { user: currentUser } = useContext(AuthContext);
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: ''
  });
  const [alert, setAlert] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

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

  // Fetch user data
  useEffect(() => {
    if (currentUser?.role === 'admin') {
      const fetchUser = async () => {
        try {
          const data = await userService.getUserById(id);
          setUser(data);
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
  }, [id, navigate, currentUser]);

  // Get role color
  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return theme.palette.error.main;
      case 'manager':
        return theme.palette.warning.main;
      default:
        return theme.palette.primary.main;
    }
  };

  // Handle delete user
  const handleDeleteUser = async () => {
    try {
      await userService.deleteUser(id);
      setAlert({
        open: true,
        message: 'User deleted successfully',
        severity: 'success'
      });
      
      // Navigate to users list after a short delay
      setTimeout(() => navigate('/users'), 1500);
    } catch (error) {
      console.error('Error deleting user:', error);
      setAlert({
        open: true,
        message: 'Failed to delete user. Please try again later.',
        severity: 'error'
      });
    }
  };

  // Open delete confirmation dialog
  const openDeleteDialog = () => {
    setConfirmDialog({
      open: true,
      title: 'Delete User',
      message: `Are you sure you want to delete ${user?.name}? This action cannot be undone.`,
      onConfirm: handleDeleteUser,
      severity: 'error'
    });
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
        title="User Details"
        subtitle={user?.name}
        breadcrumbs={[
          { label: 'Dashboard', link: '/' },
          { label: 'Users', link: '/users' },
          { label: 'User Details', link: `/users/${id}` }
        ]}
        action={{
          label: 'Back to Users',
          icon: <ArrowBackIcon />,
          onClick: () => navigate('/users'),
          link: '/users'
        }}
      />

      <Grid container spacing={3}>
        {/* User profile card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Avatar
                sx={{
                  width: 100,
                  height: 100,
                  mx: 'auto',
                  mb: 2,
                  bgcolor: theme.palette.primary.main
                }}
              >
                {user?.name?.charAt(0)?.toUpperCase()}
              </Avatar>
              
              <Typography variant="h5" gutterBottom>
                {user?.name}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {user?.email}
              </Typography>
              
              <Chip
                label={user?.role?.toUpperCase()}
                sx={{
                  bgcolor: getRoleColor(user?.role),
                  color: '#fff',
                  mt: 1
                }}
              />
              
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => navigate(`/users/${id}/edit`)}
                >
                  Edit
                </Button>
                
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={openDeleteDialog}
                >
                  Delete
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* User details */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              User Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <List>
              <ListItem>
                <ListItemIcon>
                  <PersonIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Full Name"
                  secondary={user?.name}
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <EmailIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Email Address"
                  secondary={user?.email}
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <BusinessIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Department"
                  secondary={user?.department?.charAt(0)?.toUpperCase() + user?.department?.slice(1)}
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <WorkIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Position"
                  secondary={user?.position}
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <SecurityIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Role"
                  secondary={
                    <Chip
                      size="small"
                      label={user?.role?.toUpperCase()}
                      sx={{
                        bgcolor: getRoleColor(user?.role),
                        color: '#fff'
                      }}
                    />
                  }
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <CalendarTodayIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Account Created"
                  secondary={formatDate(user?.createdAt)}
                />
              </ListItem>
              
              {user?.updatedAt && (
                <ListItem>
                  <ListItemIcon>
                    <CalendarTodayIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Last Updated"
                    secondary={formatDate(user?.updatedAt)}
                  />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Confirm dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={() => {
          confirmDialog.onConfirm();
          setConfirmDialog({ ...confirmDialog, open: false });
        }}
        onCancel={() => setConfirmDialog({ ...confirmDialog, open: false })}
        severity={confirmDialog.severity}
      />

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

export default UserDetail;