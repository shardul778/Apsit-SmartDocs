import React, { useState, useEffect } from 'react';
import { Alert, Snackbar, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

const AlertMessage = ({
  message,
  severity = 'info',
  open,
  onClose,
  autoHideDuration = 6000,
  variant = 'filled',
  position = { vertical: 'top', horizontal: 'right' },
}) => {
  const [isOpen, setIsOpen] = useState(open);

  useEffect(() => {
    setIsOpen(open);
  }, [open]);

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setIsOpen(false);
    if (onClose) {
      onClose();
    }
  };

  return (
    <Snackbar
      open={isOpen}
      autoHideDuration={autoHideDuration}
      onClose={handleClose}
      anchorOrigin={position}
    >
      <Alert
        onClose={handleClose}
        severity={severity}
        variant={variant}
        sx={{ width: '100%' }}
        action={
          <IconButton
            aria-label="close"
            color="inherit"
            size="small"
            onClick={handleClose}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default AlertMessage;