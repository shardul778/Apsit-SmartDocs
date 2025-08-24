import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Container, CssBaseline, IconButton, useMediaQuery, useTheme } from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';

// Import layout components
import Sidebar from '../components/layout/Sidebar';
import Footer from '../components/layout/Footer';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flex: 1 }}>
        <Sidebar 
          open={sidebarOpen} 
          onToggle={toggleSidebar}
          variant="permanent"
        />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: { sm: `calc(100% - ${sidebarOpen ? '240px' : '64px'})` },
            ml: { sm: sidebarOpen ? '240px' : '64px' },
            transition: 'margin-left 0.3s ease, width 0.3s ease',
            position: 'relative',
            minHeight: '100vh',
          }}
        >
          {/* Mobile menu toggle button */}
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={toggleSidebar}
              sx={{ 
                position: 'fixed', 
                top: '12px', 
                left: '12px', 
                zIndex: 1100,
                bgcolor: 'background.paper',
                boxShadow: 2,
                '&:hover': {
                  bgcolor: 'background.paper',
                }
              }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          <Container maxWidth="lg" sx={{ mt: isMobile ? 6 : 4, mb: 4 }}>
            <Outlet />
          </Container>
        </Box>
      </Box>
      <Footer />
    </Box>
  );
};

export default MainLayout;