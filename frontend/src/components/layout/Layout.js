import React, { useState } from 'react';
import { Box, CssBaseline, IconButton, Toolbar, useMediaQuery, useTheme as useMuiTheme } from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const drawerWidth = 240;

const Layout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      
      {/* Top navigation bar */}
      <Navbar />
      
      {/* Sidebar navigation */}
      <Sidebar 
        open={mobileOpen} 
        onClose={handleDrawerToggle} 
        variant={isMobile ? 'temporary' : 'permanent'} 
      />
      
      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          mt: '64px', // AppBar height
        }}
      >
        {/* Mobile menu toggle button */}
        {isMobile && (
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' }, position: 'fixed', top: '12px', left: '12px', zIndex: 1100 }}
          >
            <MenuIcon />
          </IconButton>
        )}
        
        {/* Page content */}
        {children}
      </Box>
    </Box>
  );
};

export default Layout;