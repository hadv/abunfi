import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Divider,
  CircularProgress,
  Alert,
  Dialog,
  Chip
} from '@mui/material';
import { Google, Apple, Phone, Code, Security, Star } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useWeb3Auth } from '../contexts/Web3AuthContext';
import DevLogin from '../components/DevLogin';
import AntiAbuseEducation from '../components/security/AntiAbuseEducation';
import PasskeyAuthentication from '../components/PasskeyAuthentication';
import PasskeyRegistration from '../components/PasskeyRegistration';
import { useSecurityAuth } from '../services/securityAuthService';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useWeb3Auth();
  const { socialLoginWithSecurity } = useSecurityAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDevLogin, setShowDevLogin] = useState(false);
  const [showSecurityInfo, setShowSecurityInfo] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [showPasskeySetup, setShowPasskeySetup] = useState(false);
  const [temporaryToken, setTemporaryToken] = useState('');
  const [loginSuggestions, setLoginSuggestions] = useState(null);

  const handleSocialLogin = async (provider) => {
    try {
      setIsLoading(true);
      setError('');

      // Step 1: Get Web3Auth user info
      const web3AuthResult = await login(provider);

      // Step 2: Perform social login with backend
      const loginData = {
        socialId: web3AuthResult.userInfo.verifierId,
        socialProvider: provider,
        email: web3AuthResult.userInfo.email,
        name: web3AuthResult.userInfo.name,
        walletAddress: web3AuthResult.walletAddress,
        avatar: web3AuthResult.userInfo.profileImage
      };

      const result = await authService.socialLogin(loginData);

      if (result.requires2FA) {
        // User needs to complete 2FA
        setTemporaryToken(result.temporaryToken);
        setShow2FA(true);
        toast.info('Please complete passkey authentication');
        return;
      }

      // Login successful - store token and redirect
      localStorage.setItem('authToken', result.token);

      // Check for setup suggestions
      if (result.suggestions) {
        setLoginSuggestions(result.suggestions);
      }

      toast.success('Login successful! Welcome to Abunfi.');
      navigate('/dashboard');

    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed. Please try again.');
      toast.error('Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FAComplete = async () => {
    try {
      setShow2FA(false);
      toast.success('Authentication successful! Welcome to Abunfi.');
      navigate('/dashboard');
    } catch (error) {
      console.error('2FA completion error:', error);
      toast.error('Failed to complete authentication');
    }
  };

  const handlePasskeySetupComplete = (result) => {
    setShowPasskeySetup(false);
    setLoginSuggestions(null);

    if (result.isFirstPasskey) {
      toast.success('🎉 Passkey setup complete! You earned security bonuses!');
    } else {
      toast.success('Passkey added successfully!');
    }
  };

  const handleSkipPasskeySetup = () => {
    setShowPasskeySetup(false);
    setLoginSuggestions(null);
    toast.info('You can set up passkeys later in your security settings');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        bgcolor: 'background.default',
        backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Container maxWidth="sm">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Paper
            elevation={24}
            sx={{
              p: 6,
              borderRadius: 3,
              textAlign: 'center',
              bgcolor: 'background.paper'
            }}
          >
            {/* Logo */}
            <Box sx={{ mb: 4 }}>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2
                }}
              >
                <Typography variant="h3" sx={{ color: 'white', fontWeight: 'bold' }}>
                  A
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                Welcome to Abunfi
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Login to start your savings journey
              </Typography>
            </Box>

            {/* Error Alert */}
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {/* Social Login Buttons */}
            <Box sx={{ mb: 3 }}>
              <Button
                fullWidth
                variant="outlined"
                size="large"
                startIcon={<Google />}
                onClick={() => handleSocialLogin('google')}
                disabled={isLoading}
                sx={{
                  mb: 2,
                  py: 1.5,
                  borderColor: '#db4437',
                  color: '#db4437',
                  '&:hover': {
                    borderColor: '#db4437',
                    bgcolor: 'rgba(219, 68, 55, 0.04)'
                  }
                }}
              >
                {isLoading ? (
                  <CircularProgress size={20} />
                ) : (
                  'Login with Google'
                )}
              </Button>

              <Button
                fullWidth
                variant="outlined"
                size="large"
                startIcon={<Apple />}
                onClick={() => handleSocialLogin('apple')}
                disabled={isLoading}
                sx={{
                  mb: 2,
                  py: 1.5,
                  borderColor: '#000',
                  color: '#000',
                  '&:hover': {
                    borderColor: '#000',
                    bgcolor: 'rgba(0, 0, 0, 0.04)'
                  }
                }}
              >
                Login with Apple
              </Button>

              <Button
                fullWidth
                variant="outlined"
                size="large"
                startIcon={<Phone />}
                onClick={() => handleSocialLogin('phone')}
                disabled={isLoading}
                sx={{
                  py: 1.5,
                  borderColor: 'primary.main',
                  color: 'primary.main'
                }}
              >
                Login with Phone Number
              </Button>
            </Box>

            <Divider sx={{ my: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Or
              </Typography>
            </Divider>

            {/* Demo Login */}
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={() => handleSocialLogin('google')}
              disabled={isLoading}
              sx={{ py: 1.5, mb: 2 }}
            >
              Try Demo
            </Button>

            {/* Development Login */}
            {process.env.NODE_ENV === 'development' && (
              <Button
                variant="outlined"
                fullWidth
                startIcon={<Code />}
                onClick={() => setShowDevLogin(true)}
                disabled={isLoading}
                sx={{
                  py: 1.5,
                  mb: 3,
                  borderColor: 'warning.main',
                  color: 'warning.main',
                  '&:hover': {
                    borderColor: 'warning.dark',
                    backgroundColor: 'warning.light',
                    color: 'warning.dark'
                  }
                }}
              >
                Development Login
              </Button>
            )}

            {/* Security Information */}
            <Box sx={{ mt: 3, mb: 2 }}>
              <Button
                startIcon={<Security />}
                variant="outlined"
                size="small"
                onClick={() => setShowSecurityInfo(true)}
                sx={{
                  textTransform: 'none',
                  borderColor: 'info.main',
                  color: 'info.main'
                }}
              >
                Security & Rate Limiting Info
              </Button>
            </Box>

            {/* Terms */}
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              By logging in, you agree to our{' '}
              <Typography component="span" color="primary" sx={{ cursor: 'pointer' }}>
                Terms of Service
              </Typography>{' '}
              and{' '}
              <Typography component="span" color="primary" sx={{ cursor: 'pointer' }}>
                Privacy Policy
              </Typography>.
            </Typography>

            {/* Back to Home */}
            <Box sx={{ mt: 4 }}>
              <Button
                variant="text"
                onClick={() => navigate('/')}
                sx={{ textTransform: 'none' }}
              >
                ← Back to Home
              </Button>
            </Box>
          </Paper>
        </motion.div>
      </Container>

      {/* Development Login Dialog */}
      <Dialog
        open={showDevLogin}
        onClose={() => setShowDevLogin(false)}
        maxWidth="sm"
        fullWidth
      >
        <DevLogin onClose={() => setShowDevLogin(false)} />
      </Dialog>

      {/* Security Information Dialog */}
      <AntiAbuseEducation
        showDialog={showSecurityInfo}
        onClose={() => setShowSecurityInfo(false)}
      />

      {/* 2FA Authentication Dialog */}
      <PasskeyAuthentication
        open={show2FA}
        onClose={() => setShow2FA(false)}
        onSuccess={handle2FAComplete}
        temporaryToken={temporaryToken}
        title="Complete Login"
        subtitle="Use your passkey to complete the login process"
      />

      {/* Passkey Setup Suggestion Dialog */}
      {loginSuggestions?.setup2FA && (
        <Dialog
          open={!!loginSuggestions}
          onClose={handleSkipPasskeySetup}
          maxWidth="sm"
          fullWidth
        >
          <Box p={3} textAlign="center">
            <Security color="primary" sx={{ fontSize: 48, mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {loginSuggestions.setup2FA.title}
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              {loginSuggestions.setup2FA.description}
            </Typography>

            <Box sx={{ mt: 2, mb: 3 }}>
              {loginSuggestions.setup2FA.rewards.map((reward, index) => (
                <Chip
                  key={index}
                  icon={<Star />}
                  label={reward}
                  color="primary"
                  variant="outlined"
                  sx={{ m: 0.5 }}
                />
              ))}
            </Box>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button onClick={handleSkipPasskeySetup}>
                Maybe Later
              </Button>
              <Button
                variant="contained"
                onClick={() => setShowPasskeySetup(true)}
                startIcon={<Security />}
              >
                Set Up Now
              </Button>
            </Box>
          </Box>
        </Dialog>
      )}

      {/* Passkey Registration Dialog */}
      <PasskeyRegistration
        open={showPasskeySetup}
        onClose={() => setShowPasskeySetup(false)}
        onSuccess={handlePasskeySetupComplete}
      />
    </Box>
  );
};

export default LoginPage;
