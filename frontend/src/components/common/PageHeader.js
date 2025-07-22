import React from 'react';
import { Box, Typography, Breadcrumbs, Link, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const PageHeader = ({
  title,
  subtitle,
  breadcrumbs = [],
  action,
  actionText,
  actionIcon,
  actionLink,
  onActionClick,
}) => {
  return (
    <Box sx={{ mb: 4 }}>
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            
            return isLast ? (
              <Typography color="text.primary" key={index}>
                {crumb.label}
              </Typography>
            ) : (
              <Link
                component={RouterLink}
                to={crumb.link}
                underline="hover"
                color="inherit"
                key={index}
              >
                {crumb.label}
              </Link>
            );
          })}
        </Breadcrumbs>
      )}
      
      {/* Header with optional action button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="subtitle1" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        
        {(action || actionText || actionLink) && (
          <Button
            variant="contained"
            color="primary"
            startIcon={actionIcon}
            component={actionLink ? RouterLink : 'button'}
            to={actionLink}
            onClick={onActionClick}
          >
            {actionText || 'Action'}
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default PageHeader;