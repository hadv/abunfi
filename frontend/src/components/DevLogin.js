import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Card,
  CardContent,
  Alert,
  Chip,
  Divider,
  CircularProgress
} from '@mui/material';
import { Code, Person, AdminPanelSettings, ManageAccounts } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useUser } from '../contexts/UserContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const DevLogin = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useUser();
  const navigate = useNavigate();

  // Test if component is working
  console.log('🧪 DevLogin: Component rendered');

  const testAccounts = [
    {
      email: 'manager@abunfi.com',
      role: 'strategy_manager',
      name: 'Strategy Manager',
      icon: <ManageAccounts />,
      color: 'primary',
      description: 'Full access to Strategy Manager Dashboard'
    },
    {
      email: 'admin@abunfi.com',
      role: 'admin',
      name: 'Admin User',
      icon: <AdminPanelSettings />,
      color: 'error',
      description: 'Complete system access'
    },
    {
      email: 'user@abunfi.com',
      role: 'user',
      name: 'Regular User',
      icon: <Person />,
      color: 'default',
      description: 'Standard user access (Strategy Dashboard blocked)'
    }
  ];

  const handleLogin = async (loginEmail = email) => {
    if (!loginEmail) {
      setError('Please enter an email address');
      return;
    }

    console.log('🔐 DevLogin: Starting login for:', loginEmail);
    setIsLoading(true);
    setError('');

    try {
      console.log('📡 DevLogin: Making API call to /api/auth/dev-login');
      const response = await fetch('/api/auth/dev-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: loginEmail }),
      });

      const data = await response.json();
      console.log('📡 DevLogin: API response:', { ok: response.ok, status: response.status, data });

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store token
      console.log('💾 DevLogin: Storing token in localStorage');
      localStorage.setItem('abunfi_token', data.token);

      // Update user context
      console.log('👤 DevLogin: Updating user context with:', data.user);
      login(data.user);

      // Show success message
      toast.success(`Logged in as ${data.user.name} (${data.user.role})`);

      // Navigate based on role
      const targetPath = (data.user.role === 'strategy_manager' || data.user.role === 'admin')
        ? '/strategy-manager'
        : '/dashboard';

      console.log('🧭 DevLogin: Navigating to:', targetPath);
      navigate(targetPath);

      // Close modal if provided
      if (onClose) onClose();

    } catch (error) {
      console.error('❌ DevLogin: Login failed:', error);
      setError(error.message);
      toast.error('Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (account) => {
    console.log('🖱️ DevLogin: Quick login clicked for account:', account);
    setEmail(account.email);
    handleLogin(account.email);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card sx={{ maxWidth: 500, mx: 'auto' }}>
        <CardContent sx={{ p: 4 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Code sx={{ mr: 2, color: 'primary.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Development Login
            </Typography>
          </Box>

          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              This is a development-only feature for testing the Strategy Manager Dashboard.
              Use the test accounts below or enter an email manually.
            </Typography>
          </Alert>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Test Button */}
          <Box sx={{ mb: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => console.log('🧪 Test button clicked!')}
              sx={{ mb: 2 }}
            >
              🧪 Test Click (Check Console)
            </Button>
          </Box>

          {/* Manual Email Input */}
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              disabled={isLoading}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleLogin();
                }
              }}
            />
            <Button
              fullWidth
              variant="contained"
              onClick={() => handleLogin()}
              disabled={isLoading || !email}
              sx={{ mt: 2 }}
            >
              {isLoading ? <CircularProgress size={20} /> : 'Login'}
            </Button>
          </Box>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Quick Login
            </Typography>
          </Divider>

          {/* Test Accounts */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {testAccounts.map((account, index) => (
              <motion.div
                key={account.email}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card
                  variant="outlined"
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: 2,
                      transform: 'translateY(-2px)',
                      borderColor: 'primary.main'
                    }
                  }}
                  onClick={() => handleQuickLogin(account)}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ color: `${account.color}.main` }}>
                          {account.icon}
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                            {account.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {account.email}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {account.description}
                          </Typography>
                        </Box>
                      </Box>
                      <Chip
                        label={account.role}
                        color={account.color}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </Box>

          {/* Strategy Manager Access Note */}
          <Alert severity="warning" sx={{ mt: 3 }}>
            <Typography variant="body2">
              <strong>Strategy Manager Dashboard:</strong> Only accessible with 
              <Chip label="strategy_manager" size="small" sx={{ mx: 0.5 }} /> or 
              <Chip label="admin" size="small" sx={{ mx: 0.5 }} /> roles.
              Regular users will see an access denied message.
            </Typography>
          </Alert>

          {/* Close Button */}
          {onClose && (
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Button variant="text" onClick={onClose}>
                Cancel
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DevLogin;
