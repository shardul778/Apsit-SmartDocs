import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const EmptyState = ({
  title = 'No data found',
  description = 'There are no items to display at this time.',
  icon,
  actionText,
  actionLink,
  onActionClick,
  elevation = 0,
  sx = {},
}) => {
  return (
    <Paper
      elevation={elevation}
      sx={{
        p: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        borderRadius: 2,
        backgroundColor: (theme) =>
          theme.palette.mode === 'light' ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.05)',
        ...sx,
      }}
    >
      {icon && (
        <Box sx={{ mb: 2, color: 'text.secondary', '& svg': { fontSize: 64 } }}>
          {icon}
        </Box>
      )}

      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 450 }}>
        {description}
      </Typography>

      {(actionText || actionLink || onActionClick) && (
        <Button
          variant="contained"
          color="primary"
          component={actionLink ? RouterLink : 'button'}
          to={actionLink}
          onClick={onActionClick}
        >
          {actionText || 'Action'}
        </Button>
      )}
    </Paper>
  );
};

export default EmptyState;