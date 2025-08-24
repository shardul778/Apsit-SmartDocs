import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  IconButton,
  Divider,
  Tooltip,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon as MuiListItemIcon
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Description as DocumentIcon,
  Add as AddIcon,
  FileCopy as TemplateIcon,
  People as UserIcon,
  Person as ProfileIcon,
  Settings as SettingsIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const drawerWidth = 240;
const collapsedWidth = 64;

const Sidebar = ({ open, onToggle, variant = 'permanent' }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode, toggleDarkMode } = useTheme();
  
  const [anchorElUser, setAnchorElUser] = useState(null);

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogout = () => {
    logout();
    handleCloseUserMenu();
    navigate('/login');
  };

  // Navigation items based on user role
  const mainNavItems = [
    { title: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
    { title: 'My Documents', path: '/documents', icon: <DocumentIcon /> },
    { title: 'Create Document', path: '/documents/create', icon: <AddIcon /> },
  ];

  // Admin-only navigation items
  const adminNavItems = [
    { title: 'Templates', path: '/templates', icon: <TemplateIcon /> },
    { title: 'Users', path: '/users', icon: <UserIcon /> },
  ];

  // User settings navigation items
  const settingsNavItems = [
    { title: 'Profile', path: '/profile', icon: <ProfileIcon /> },
    { title: 'Settings', path: '/settings', icon: <SettingsIcon /> },
  ];

  const handleNavigation = (path) => {
    navigate(path);
    if (variant === 'temporary') {
      onToggle();
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const drawer = (
    <>
      {/* Header with toggle button */}
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        minHeight: '64px'
      }}>
        {open ? (
          <>
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
              SmartDocs
            </Typography>
            <IconButton onClick={onToggle} size="small" color="primary">
              <ChevronLeftIcon />
            </IconButton>
          </>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <IconButton 
              onClick={onToggle} 
              size="small" 
              color="primary"
              sx={{ 
                bgcolor: 'primary.main', 
                color: 'white',
                '&:hover': {
                  bgcolor: 'primary.dark',
                }
              }}
            >
              <ChevronRightIcon />
            </IconButton>
          </Box>
        )}
      </Box>
      
      <Divider />
      
      {/* User Profile Section */}
      {user && (
        <>
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Tooltip title={open ? '' : 'User Menu'} placement="right" disableHoverListener={open}>
                <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                  {user.profileImage ? (
                    <Avatar alt={user.name} src={user.profileImage} />
                  ) : (
                    <Avatar alt={user.name}>{user.name.charAt(0)}</Avatar>
                  )}
                </IconButton>
              </Tooltip>
              {open && (
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle2" noWrap>
                    {user.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {user.role === 'admin' ? 'Administrator' : 'Staff'}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
          
          {/* User Menu */}
          <Menu
            sx={{ mt: '45px' }}
            id="menu-appbar"
            anchorEl={anchorElUser}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorElUser)}
            onClose={handleCloseUserMenu}
          >
            <MenuItem onClick={() => {
              handleCloseUserMenu();
              navigate('/profile');
            }}>
              <MuiListItemIcon>
                <ProfileIcon fontSize="small" />
              </MuiListItemIcon>
              <Typography textAlign="center">Profile</Typography>
            </MenuItem>
            <MenuItem onClick={() => {
              handleCloseUserMenu();
              navigate('/settings');
            }}>
              <MuiListItemIcon>
                <SettingsIcon fontSize="small" />
              </MuiListItemIcon>
              <Typography textAlign="center">Settings</Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <MuiListItemIcon>
                <LogoutIcon fontSize="small" />
              </MuiListItemIcon>
              <Typography textAlign="center">Logout</Typography>
            </MenuItem>
          </Menu>
          
          <Divider />
        </>
      )}
      
      {/* Main Navigation */}
      <List>
        {mainNavItems.map((item) => (
          <ListItem key={item.title} disablePadding>
            <Tooltip 
              title={open ? '' : item.title} 
              placement="right"
              disableHoverListener={open}
            >
              <ListItemButton 
                onClick={() => handleNavigation(item.path)}
                selected={isActive(item.path)}
                sx={{
                  minHeight: 48,
                  justifyContent: open ? 'initial' : 'center',
                  px: 2.5,
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: open ? 3 : 'auto',
                    justifyContent: 'center',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {open && <ListItemText primary={item.title} />}
              </ListItemButton>
            </Tooltip>
          </ListItem>
        ))}
      </List>
      
      {/* Admin Navigation */}
      {user && user.role === 'admin' && (
        <>
          <Divider />
          {open && (
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Administration
              </Typography>
            </Box>
          )}
          <List>
            {adminNavItems.map((item) => (
              <ListItem key={item.title} disablePadding>
                <Tooltip 
                  title={open ? '' : item.title} 
                  placement="right"
                  disableHoverListener={open}
                >
                  <ListItemButton 
                    onClick={() => handleNavigation(item.path)}
                    selected={isActive(item.path)}
                    sx={{
                      minHeight: 48,
                      justifyContent: open ? 'initial' : 'center',
                      px: 2.5,
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 0,
                        mr: open ? 3 : 'auto',
                        justifyContent: 'center',
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    {open && <ListItemText primary={item.title} />}
                  </ListItemButton>
                </Tooltip>
              </ListItem>
            ))}
          </List>
        </>
      )}
      
      {/* User Settings Navigation */}
      <Divider />
      {open && (
        <Box sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            User Settings
          </Typography>
        </Box>
      )}
      <List>
        {settingsNavItems.map((item) => (
          <ListItem key={item.title} disablePadding>
            <Tooltip 
              title={open ? '' : item.title} 
              placement="right"
              disableHoverListener={open}
            >
              <ListItemButton 
                onClick={() => handleNavigation(item.path)}
                selected={isActive(item.path)}
                sx={{
                  minHeight: 48,
                  justifyContent: open ? 'initial' : 'center',
                  px: 2.5,
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: open ? 3 : 'auto',
                    justifyContent: 'center',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {open && <ListItemText primary={item.title} />}
              </ListItemButton>
            </Tooltip>
          </ListItem>
        ))}
      </List>
      
      {/* Theme Toggle Section */}
      <Divider />
      {open && (
        <Box sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Appearance
          </Typography>
        </Box>
      )}
      <List>
        <ListItem disablePadding>
          <Tooltip 
            title={open ? '' : 'Change Theme'} 
            placement="right"
            disableHoverListener={open}
          >
            <ListItemButton 
              onClick={toggleDarkMode}
              sx={{
                minHeight: 48,
                justifyContent: open ? 'initial' : 'center',
                px: 2.5,
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 3 : 'auto',
                  justifyContent: 'center',
                }}
              >
                {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
              </ListItemIcon>
              {open && <ListItemText primary="Change Theme" />}
            </ListItemButton>
          </Tooltip>
        </ListItem>
      </List>
    </>
  );

  return (
    <Box
      component="nav"
      sx={{ 
        width: { md: open ? drawerWidth : collapsedWidth }, 
        flexShrink: { md: 0 },
        transition: 'width 0.3s ease'
      }}
    >
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={open}
        onClose={onToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: drawerWidth,
            transition: 'width 0.3s ease'
          },
        }}
      >
        {drawer}
      </Drawer>
      
      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: open ? drawerWidth : collapsedWidth,
            transition: 'width 0.3s ease',
            overflowX: 'hidden',
            bgcolor: 'background.paper',
            borderRight: '1px solid',
            borderColor: 'divider',
            '&:hover': {
              boxShadow: open ? 'none' : '2px 0 8px rgba(0,0,0,0.1)',
            }
          },
        }}
        open
      >
        {drawer}
      </Drawer>
    </Box>
  );
};

export default Sidebar;