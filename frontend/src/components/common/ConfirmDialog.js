import React from 'react';
import {
  Button,
  DialogContentText,
  Box,
  Paper,
  Typography,
} from '@mui/material';

const ConfirmDialog = ({
  open,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  confirmButtonProps = {},
  cancelButtonProps = {},
  severity = 'error',
  children,
}) => {
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
  };

  // Map severity to button color
  const getButtonColor = () => {
    switch (severity) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      case 'success':
        return 'success';
      default:
        return 'primary';
    }
  };

  if (!open) return null;

  return (
    <Box
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
      role="dialog"
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 1400,
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Paper
        elevation={8}
        sx={{
          pointerEvents: 'auto',
          borderRadius: 3,
          boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
          minWidth: { xs: 280, sm: 420 },
          maxWidth: '90vw',
          p: 3,
        }}
      >
        <Typography id="confirm-dialog-title" variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
          {title}
        </Typography>
        <Box sx={{ mb: 2 }}>
          <DialogContentText id="confirm-dialog-description" sx={{ fontSize: 15 }}>
            {message}
          </DialogContentText>
          {children}
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button onClick={handleCancel} color="inherit" variant="text" {...cancelButtonProps}>
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            color={getButtonColor()}
            variant="contained"
            sx={{ boxShadow: '0 6px 16px rgba(0,0,0,0.2)' }}
            {...confirmButtonProps}
          >
            {confirmText}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default ConfirmDialog;