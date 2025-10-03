import React, { useState, useEffect } from 'react';
import { Alert, Snackbar, IconButton, Slide } from '@mui/material';
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

  const TransitionUp = (props) => <Slide {...props} direction={position.vertical === 'bottom' ? 'up' : 'down'} />;

  const commonShadow = '0 8px 24px rgba(0,0,0,0.2)';

  return (
    <Snackbar
      open={isOpen}
      autoHideDuration={autoHideDuration}
      onClose={handleClose}
      anchorOrigin={position}
      TransitionComponent={TransitionUp}
      sx={{
        '& .MuiPaper-root': {
          borderRadius: 2,
          boxShadow: commonShadow,
        },
      }}
    >
      <Alert
        onClose={handleClose}
        severity={severity}
        variant={variant}
        sx={{
          width: '100%',
          borderRadius: 2,
          px: 2,
          py: 1.25,
          ...(variant === 'standard' && {
            bgcolor: (theme) =>
              severity === 'success'
                ? theme.palette.success.light
                : severity === 'error'
                ? theme.palette.error.light
                : severity === 'warning'
                ? theme.palette.warning.light
                : theme.palette.info.light,
            color: (theme) => theme.palette.getContrastText(
              severity === 'success'
                ? theme.palette.success.light
                : severity === 'error'
                ? theme.palette.error.light
                : severity === 'warning'
                ? theme.palette.warning.light
                : theme.palette.info.light
            ),
            border: '1px solid rgba(255,255,255,0.3)',
            backdropFilter: 'saturate(180%) blur(6px)',
          }),
        }}
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