import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Avatar,
  useTheme
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  AdminPanelSettings as AdminIcon,
  Person as UserIcon
} from '@mui/icons-material';
import { userService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { PageHeader, LoadingSpinner, EmptyState, ConfirmDialog, AlertMessage } from '../common';

const UserList = () => {
  const theme = useTheme();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    role: '',
    department: '',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
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

  // Fetch users with pagination and filters
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await userService.getUsers({
        page: page + 1, // API uses 1-based indexing
        limit: rowsPerPage,
        ...filters
      });
      setUsers(response.users);
      setTotalCount(response.totalCount);
    } catch (error) {
      console.error('Error fetching users:', error);
      setAlert({
        open: true,
        message: 'Failed to load users. Please try again later.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (currentUser?.role === 'admin') {
      fetchUsers();
    }
  }, [page, rowsPerPage, filters, currentUser]);

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle filter changes
  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPage(0); // Reset to first page when filters change
  };

  // Handle search input
  const handleSearchChange = (event) => {
    const { value } = event.target;
    setFilters(prev => ({
      ...prev,
      search: value
    }));
  };

  // Handle search submit
  const handleSearchSubmit = (event) => {
    event.preventDefault();
    fetchUsers();
  };

  // Handle delete user
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      await userService.deleteUser(userToDelete.id);
      setAlert({
        open: true,
        message: 'User deleted successfully',
        severity: 'success'
      });
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Error deleting user:', error);
      setAlert({
        open: true,
        message: 'Failed to delete user. Please try again later.',
        severity: 'error'
      });
    } finally {
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  // Open delete confirmation dialog
  const openDeleteDialog = (user) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  // Get user role color
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

  // Get user avatar
  const getUserAvatar = (user) => {
    if (user.avatarUrl) {
      return <Avatar src={user.avatarUrl} alt={user.name} />;
    }
    
    return (
      <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
        {user.name.charAt(0).toUpperCase()}
      </Avatar>
    );
  };

  // Check if user can be deleted
  const canDeleteUser = (user) => {
    // Cannot delete yourself or other admins if you're not a super admin
    return user.id !== currentUser?.id && !(user.role === 'admin' && currentUser?.role !== 'superadmin');
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
          component={Link}
          to="/"
          variant="contained"
          sx={{ mt: 2 }}
        >
          Go to Dashboard
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader 
        title="Users" 
        subtitle="Manage system users"
        breadcrumbs={[
          { label: 'Dashboard', link: '/' },
          { label: 'Users', link: '/users' }
        ]}
        action={{
          label: 'Add User',
          icon: <AddIcon />,
          onClick: () => {/* Navigate to create user page */},
          link: '/users/create'
        }}
      />

      {/* Search and filter section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <form onSubmit={handleSearchSubmit}>
                <TextField
                  fullWidth
                  placeholder="Search users..."
                  name="search"
                  value={filters.search}
                  onChange={handleSearchChange}
                  InputProps={{
                    endAdornment: (
                      <IconButton type="submit" edge="end">
                        <SearchIcon />
                      </IconButton>
                    )
                  }}
                />
              </form>
            </Grid>
            <Grid item xs={12} md={6} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
              <Button
                startIcon={<FilterListIcon />}
                onClick={() => setShowFilters(!showFilters)}
                variant="outlined"
              >
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
            </Grid>

            {/* Filters */}
            {showFilters && (
              <Grid item xs={12}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Role</InputLabel>
                      <Select
                        name="role"
                        value={filters.role}
                        onChange={handleFilterChange}
                        label="Role"
                      >
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="admin">Admin</MenuItem>
                        <MenuItem value="manager">Manager</MenuItem>
                        <MenuItem value="user">User</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Department</InputLabel>
                      <Select
                        name="department"
                        value={filters.department}
                        onChange={handleFilterChange}
                        label="Department"
                      >
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="legal">Legal</MenuItem>
                        <MenuItem value="hr">HR</MenuItem>
                        <MenuItem value="finance">Finance</MenuItem>
                        <MenuItem value="marketing">Marketing</MenuItem>
                        <MenuItem value="it">IT</MenuItem>
                        <MenuItem value="operations">Operations</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Users table */}
      // Modify the condition in the render section
      {loading ? (
        <LoadingSpinner message="Loading users..." />
      ) : !users ? (
        <EmptyState 
          message="Error loading users"
          description="There was a problem loading the user list. Please try again."
        />
      ) : users.length === 0 ? (
        <EmptyState 
          message="No users found"
          description="Create a new user or adjust your filters to see results."
          action={{
            label: 'Add User',
            link: '/users/create'
          }}
        />
      ) : (
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <TableContainer>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Position</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow hover key={user.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {getUserAvatar(user)}
                        <Typography variant="subtitle2" sx={{ ml: 2 }}>
                          {user.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip 
                        icon={user.role === 'admin' ? <AdminIcon fontSize="small" /> : <UserIcon fontSize="small" />}
                        label={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        size="small"
                        sx={{
                          backgroundColor: getRoleColor(user.role),
                          color: '#fff'
                        }}
                      />
                    </TableCell>
                    <TableCell>{user.department}</TableCell>
                    <TableCell>{user.position}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <IconButton 
                          component={Link} 
                          to={`/users/${user.id}/edit`}
                          size="small"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      {canDeleteUser(user) && (
                        <Tooltip title="Delete">
                          <IconButton 
                            onClick={() => openDeleteDialog(user)}
                            size="small"
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* Pagination */}
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete User"
        message={`Are you sure you want to delete the user "${userToDelete?.name}"? This action cannot be undone.`}
        onConfirm={handleDeleteUser}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setUserToDelete(null);
        }}
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
        severity="error"
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

export default UserList;