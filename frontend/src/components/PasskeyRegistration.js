import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Security,
  Fingerprint,
  CheckCircle,
  Error,
  Star,
  TrendingUp,
  Shield
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import passkeyService from '../services/passkeyService';
import toast from 'react-hot-toast';

const PasskeyRegistration = ({ open, onClose, onSuccess }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [deviceName, setDeviceName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [supportDetails, setSupportDetails] = useState(null);
  const [registrationResult, setRegistrationResult] = useState(null);

  useEffect(() => {
    if (open) {
      // Check WebAuthn support when dialog opens
      const support = passkeyService.getSupportDetails();
      setSupportDetails(support);
      
      // Auto-generate device name
      const deviceInfo = getDeviceInfo();
      setDeviceName(deviceInfo);
      
      // Reset state
      setActiveStep(0);
      setError('');
      setRegistrationResult(null);
    }
  }, [open]);

  const getDeviceInfo = () => {
    const userAgent = navigator.userAgent;
    
    if (/iPhone|iPad|iPod/.test(userAgent)) {
      return 'iPhone';
    } else if (/Android/.test(userAgent)) {
      return 'Android Device';
    } else if (/Mac/.test(userAgent)) {
      return 'Mac';
    } else if (/Windows/.test(userAgent)) {
      return 'Windows PC';
    } else {
      return 'My Device';
    }
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleRegisterPasskey = async () => {
    try {
      setIsLoading(true);
      setError('');

      const result = await passkeyService.registerPasskey(deviceName);
      setRegistrationResult(result);
      
      toast.success('Passkey registered successfully! 🎉');
      handleNext();
      
      // Call success callback after a short delay
      setTimeout(() => {
        onSuccess?.(result);
      }, 2000);

    } catch (error) {
      console.error('Passkey registration failed:', error);
      const errorMessage = passkeyService.getErrorMessage(error);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    {
      label: 'Check Compatibility',
      content: (
        <Box>
          <Typography variant="body1" gutterBottom>
            Let's check if your device supports passkeys:
          </Typography>
          
          {supportDetails && (
            <List>
              <ListItem>
                <ListItemIcon>
                  {supportDetails.webauthn ? <CheckCircle color="success" /> : <Error color="error" />}
                </ListItemIcon>
                <ListItemText 
                  primary="WebAuthn Support" 
                  secondary={supportDetails.webauthn ? 'Supported' : 'Not supported'}
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  {supportDetails.platform ? <CheckCircle color="success" /> : <Error color="warning" />}
                </ListItemIcon>
                <ListItemText 
                  primary="Platform Authenticator" 
                  secondary={supportDetails.platform ? 'Available (Face ID, Touch ID, Windows Hello)' : 'Not available'}
                />
              </ListItem>
            </List>
          )}

          {supportDetails?.webauthn ? (
            <Alert severity="success" sx={{ mt: 2 }}>
              Great! Your device supports passkeys. You can proceed with registration.
            </Alert>
          ) : (
            <Alert severity="error" sx={{ mt: 2 }}>
              Your device doesn't support passkeys. Please try using a different device or browser.
            </Alert>
          )}
        </Box>
      )
    },
    {
      label: 'Device Information',
      content: (
        <Box>
          <Typography variant="body1" gutterBottom>
            Give your passkey a memorable name:
          </Typography>
          
          <TextField
            fullWidth
            label="Device Name"
            value={deviceName}
            onChange={(e) => setDeviceName(e.target.value)}
            placeholder="e.g., iPhone, Work Laptop, Personal Computer"
            sx={{ mt: 2, mb: 2 }}
          />
          
          <Typography variant="body2" color="text.secondary">
            This helps you identify which device you're using when signing in.
          </Typography>
        </Box>
      )
    },
    {
      label: 'Register Passkey',
      content: (
        <Box>
          <Typography variant="body1" gutterBottom>
            Ready to create your passkey! Here's what will happen:
          </Typography>
          
          <List dense>
            <ListItem>
              <ListItemIcon><Fingerprint color="primary" /></ListItemIcon>
              <ListItemText primary="Your device will prompt for biometric authentication" />
            </ListItem>
            <ListItem>
              <ListItemIcon><Security color="primary" /></ListItemIcon>
              <ListItemText primary="A secure passkey will be created and stored on your device" />
            </ListItem>
            <ListItem>
              <ListItemIcon><Shield color="primary" /></ListItemIcon>
              <ListItemText primary="Your account security will be enhanced" />
            </ListItem>
          </List>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </Box>
      )
    },
    {
      label: 'Success & Rewards',
      content: (
        <Box textAlign="center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            <CheckCircle color="success" sx={{ fontSize: 64, mb: 2 }} />
          </motion.div>
          
          <Typography variant="h6" gutterBottom>
            Passkey Registered Successfully! 🎉
          </Typography>
          
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Your account is now more secure with passkey authentication.
          </Typography>

          {registrationResult?.isFirstPasskey && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                🎁 Welcome Bonus Unlocked!
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap', mb: 2 }}>
                <Chip 
                  icon={<Star />} 
                  label="0.005 USDC Bonus" 
                  color="primary" 
                  variant="outlined" 
                />
                <Chip 
                  icon={<TrendingUp />} 
                  label="30-day Yield Boost" 
                  color="secondary" 
                  variant="outlined" 
                />
                <Chip 
                  icon={<Security />} 
                  label="Enhanced Limits" 
                  color="success" 
                  variant="outlined" 
                />
              </Box>
              
              <Typography variant="body2" color="text.secondary">
                Your rewards will be applied to your account automatically.
              </Typography>
            </Box>
          )}
        </Box>
      )
    }
  ];

  const canProceed = () => {
    switch (activeStep) {
      case 0:
        return supportDetails?.webauthn;
      case 1:
        return deviceName.trim().length > 0;
      case 2:
        return true;
      default:
        return false;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <Security color="primary" />
          <Typography variant="h6">Set Up Passkey Authentication</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel>{step.label}</StepLabel>
              <StepContent>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {step.content}
                  </motion.div>
                </AnimatePresence>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </DialogContent>
      
      <DialogActions sx={{ p: 3 }}>
        {activeStep === steps.length - 1 ? (
          <Button onClick={onClose} variant="contained" color="primary">
            Done
          </Button>
        ) : (
          <>
            <Button 
              onClick={onClose} 
              disabled={isLoading}
            >
              Cancel
            </Button>
            
            {activeStep > 0 && (
              <Button 
                onClick={handleBack}
                disabled={isLoading}
              >
                Back
              </Button>
            )}
            
            {activeStep === 2 ? (
              <Button
                onClick={handleRegisterPasskey}
                variant="contained"
                disabled={!canProceed() || isLoading}
                startIcon={isLoading ? <CircularProgress size={20} /> : <Fingerprint />}
              >
                {isLoading ? 'Creating Passkey...' : 'Create Passkey'}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                variant="contained"
                disabled={!canProceed()}
              >
                Next
              </Button>
            )}
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default PasskeyRegistration;
