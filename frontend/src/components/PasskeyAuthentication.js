import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  IconButton
} from '@mui/material';
import {
  Fingerprint,
  Security,
  CheckCircle,
  Error,
  Close,
  Refresh
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import passkeyService from '../services/passkeyService';
import toast from 'react-hot-toast';

const PasskeyAuthentication = ({ 
  open, 
  onClose, 
  onSuccess, 
  temporaryToken,
  title = "Verify Your Identity",
  subtitle = "Use your passkey to complete authentication"
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [authStep, setAuthStep] = useState('ready'); // 'ready', 'authenticating', 'success', 'error'
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (open) {
      setAuthStep('ready');
      setError('');
      setRetryCount(0);
    }
  }, [open]);

  const handleAuthenticate = async () => {
    try {
      setIsLoading(true);
      setError('');
      setAuthStep('authenticating');

      // Step 1: Authenticate with passkey
      const authResult = await passkeyService.authenticateWithPasskey();
      
      if (!authResult.success) {
        throw new Error('Passkey authentication failed');
      }

      // Step 2: Complete 2FA if temporary token is provided
      if (temporaryToken) {
        const completionResult = await passkeyService.complete2FA(temporaryToken);
        
        if (!completionResult.success) {
          throw new Error('Failed to complete 2FA authentication');
        }

        // Update auth token in localStorage or context
        if (completionResult.token) {
          localStorage.setItem('authToken', completionResult.token);
        }
      }

      setAuthStep('success');
      toast.success('Authentication successful! 🎉');
      
      // Call success callback after a short delay
      setTimeout(() => {
        onSuccess?.(authResult);
      }, 1500);

    } catch (error) {
      console.error('Passkey authentication failed:', error);
      const errorMessage = passkeyService.getErrorMessage(error);
      setError(errorMessage);
      setAuthStep('error');
      setRetryCount(prev => prev + 1);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setError('');
    setAuthStep('ready');
  };

  const renderContent = () => {
    switch (authStep) {
      case 'ready':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Box textAlign="center" py={3}>
              <Security color="primary" sx={{ fontSize: 64, mb: 2 }} />
              
              <Typography variant="h6" gutterBottom>
                {title}
              </Typography>
              
              <Typography variant="body1" color="text.secondary" gutterBottom>
                {subtitle}
              </Typography>

              <Card sx={{ mt: 3, mb: 3, bgcolor: 'primary.50' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Fingerprint color="primary" />
                    <Box textAlign="left">
                      <Typography variant="subtitle2">
                        Touch ID, Face ID, or Windows Hello
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Use your device's built-in security features
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {retryCount > 0 && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Having trouble? Make sure your device is unlocked and try again.
                </Alert>
              )}
            </Box>
          </motion.div>
        );

      case 'authenticating':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Box textAlign="center" py={4}>
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Fingerprint color="primary" sx={{ fontSize: 64, mb: 2 }} />
              </motion.div>
              
              <Typography variant="h6" gutterBottom>
                Authenticating...
              </Typography>
              
              <Typography variant="body1" color="text.secondary" gutterBottom>
                Please follow the prompt on your device
              </Typography>

              <CircularProgress sx={{ mt: 2 }} />
            </Box>
          </motion.div>
        );

      case 'success':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
          >
            <Box textAlign="center" py={4}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <CheckCircle color="success" sx={{ fontSize: 64, mb: 2 }} />
              </motion.div>
              
              <Typography variant="h6" gutterBottom>
                Authentication Successful! ✨
              </Typography>
              
              <Typography variant="body1" color="text.secondary">
                Welcome back! Redirecting you now...
              </Typography>
            </Box>
          </motion.div>
        );

      case 'error':
        return (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Box textAlign="center" py={3}>
              <Error color="error" sx={{ fontSize: 64, mb: 2 }} />
              
              <Typography variant="h6" gutterBottom>
                Authentication Failed
              </Typography>
              
              <Alert severity="error" sx={{ mt: 2, mb: 3 }}>
                {error}
              </Alert>

              <Typography variant="body2" color="text.secondary">
                Please try again or contact support if the problem persists.
              </Typography>
            </Box>
          </motion.div>
        );

      default:
        return null;
    }
  };

  const renderActions = () => {
    switch (authStep) {
      case 'ready':
        return (
          <>
            <Button onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleAuthenticate}
              variant="contained"
              disabled={isLoading}
              startIcon={<Fingerprint />}
            >
              Authenticate
            </Button>
          </>
        );

      case 'authenticating':
        return (
          <Button onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
        );

      case 'success':
        return (
          <Button onClick={onClose} variant="contained" color="success">
            Continue
          </Button>
        );

      case 'error':
        return (
          <>
            <Button onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleRetry}
              variant="contained"
              startIcon={<Refresh />}
            >
              Try Again
            </Button>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={authStep === 'authenticating' ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <Security color="primary" />
            <Typography variant="h6">Two-Factor Authentication</Typography>
          </Box>
          
          {authStep !== 'authenticating' && (
            <IconButton onClick={onClose} size="small">
              <Close />
            </IconButton>
          )}
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
      </DialogContent>
      
      <DialogActions sx={{ p: 3 }}>
        {renderActions()}
      </DialogActions>
    </Dialog>
  );
};

export default PasskeyAuthentication;
