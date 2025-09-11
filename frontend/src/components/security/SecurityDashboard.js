import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Chip,
  Alert,
  IconButton,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress
} from '@mui/material';
import {
  Security,
  Warning,
  CheckCircle,
  Error,
  Info,
  Refresh,
  Shield,
  LocalGasStation,
  Receipt,
  Schedule,
  VerifiedUser
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useWeb3Auth } from '../../contexts/Web3AuthContext';
import { useRateLimitingService } from '../../services/rateLimitingService';
import toast from 'react-hot-toast';

const SecurityDashboard = () => {
  const { walletAddress } = useWeb3Auth();
  const { service: rateLimitingService, isReady } = useRateLimitingService();
  
  const [securityStatus, setSecurityStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadSecurityStatus = async () => {
    if (!isReady || !walletAddress || !rateLimitingService) {
      return;
    }

    try {
      setLoading(true);
      const status = await rateLimitingService.getSecurityStatus(walletAddress);
      setSecurityStatus(status);
      
      // Show notifications for warnings
      if (status.warnings && status.warnings.length > 0) {
        rateLimitingService.showRateLimitNotifications(status.warnings);
      }
    } catch (error) {
      console.error('Failed to load security status:', error);
      toast.error('Failed to load security information');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    rateLimitingService.clearCache(walletAddress);
    await loadSecurityStatus();
    setRefreshing(false);
    toast.success('Security status refreshed');
  };

  useEffect(() => {
    loadSecurityStatus();
  }, [isReady, walletAddress, rateLimitingService]);

  const getRiskLevelColor = (riskLevel) => {
    switch (riskLevel) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'info';
    }
  };

  const getRiskLevelIcon = (riskLevel) => {
    switch (riskLevel) {
      case 'high': return <Error />;
      case 'medium': return <Warning />;
      case 'low': return <CheckCircle />;
      default: return <Info />;
    }
  };

  const formatPercentage = (value) => {
    return Math.min(100, Math.max(0, value)).toFixed(1);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading security status...
        </Typography>
      </Box>
    );
  }

  if (!securityStatus) {
    return (
      <Alert severity="error">
        Failed to load security information. Please try refreshing the page.
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <Security sx={{ mr: 1, fontSize: 32 }} />
          <Typography variant="h4" component="h1">
            Security Dashboard
          </Typography>
        </Box>
        <Tooltip title="Refresh security status">
          <IconButton onClick={handleRefresh} disabled={refreshing}>
            <Refresh sx={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Security Status Overview */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={4}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Shield sx={{ mr: 1 }} />
                  <Typography variant="h6">Account Status</Typography>
                </Box>
                <Box display="flex" alignItems="center" mb={1}>
                  <Chip
                    icon={securityStatus.isActive ? <CheckCircle /> : <Error />}
                    label={securityStatus.isActive ? 'Active' : 'Inactive'}
                    color={securityStatus.isActive ? 'success' : 'error'}
                    size="small"
                  />
                </Box>
                <Box display="flex" alignItems="center">
                  <Chip
                    icon={<VerifiedUser />}
                    label={securityStatus.isWhitelisted ? 'Whitelisted' : 'Standard'}
                    color={securityStatus.isWhitelisted ? 'primary' : 'default'}
                    size="small"
                  />
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} md={4}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Warning sx={{ mr: 1 }} />
                  <Typography variant="h6">Risk Level</Typography>
                </Box>
                <Box display="flex" alignItems="center">
                  <Chip
                    icon={getRiskLevelIcon(securityStatus.riskLevel)}
                    label={securityStatus.riskLevel.toUpperCase()}
                    color={getRiskLevelColor(securityStatus.riskLevel)}
                    size="medium"
                  />
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} md={4}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Schedule sx={{ mr: 1 }} />
                  <Typography variant="h6">Next Reset</Typography>
                </Box>
                <Typography variant="body1">
                  {securityStatus.resetInfo.hoursUntilReset} hours
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {securityStatus.resetInfo.nextReset.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Rate Limits */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <LocalGasStation sx={{ mr: 1 }} />
                  <Typography variant="h6">Daily Gas Limit</Typography>
                </Box>
                <Box mb={2}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">
                      Used: {securityStatus.dailyLimits.gas.used} ETH
                    </Typography>
                    <Typography variant="body2">
                      {formatPercentage(securityStatus.dailyLimits.gas.percentage)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={securityStatus.dailyLimits.gas.percentage}
                    color={securityStatus.dailyLimits.gas.percentage > 80 ? 'error' : 'primary'}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="body2" color="text.secondary" mt={1}>
                    Remaining: {securityStatus.dailyLimits.gas.remaining} ETH
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Receipt sx={{ mr: 1 }} />
                  <Typography variant="h6">Daily Transaction Limit</Typography>
                </Box>
                <Box mb={2}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">
                      Used: {securityStatus.dailyLimits.transactions.used} txs
                    </Typography>
                    <Typography variant="body2">
                      {formatPercentage(securityStatus.dailyLimits.transactions.percentage)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={securityStatus.dailyLimits.transactions.percentage}
                    color={securityStatus.dailyLimits.transactions.percentage > 80 ? 'error' : 'primary'}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="body2" color="text.secondary" mt={1}>
                    Remaining: {securityStatus.dailyLimits.transactions.remaining} txs
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Warnings and Alerts */}
      {securityStatus.warnings && securityStatus.warnings.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" mb={2}>
                Security Alerts
              </Typography>
              <List>
                {securityStatus.warnings.map((warning, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      {warning.severity === 'critical' && <Error color="error" />}
                      {warning.severity === 'warning' && <Warning color="warning" />}
                      {warning.severity === 'info' && <Info color="info" />}
                    </ListItemIcon>
                    <ListItemText
                      primary={warning.message}
                      secondary={warning.remaining && `Remaining: ${warning.remaining}`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Additional Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.6 }}
      >
        <Card>
          <CardContent>
            <Typography variant="h6" mb={2}>
              Rate Limiting Information
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Rate limiting helps prevent DOS and Sybil attacks by limiting the amount of gas and number of transactions each account can use per day.
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Per Transaction Gas Limit</Typography>
                <Typography variant="body2">{securityStatus.perTxLimit} ETH</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Requires Whitelist</Typography>
                <Typography variant="body2">
                  {securityStatus.requiresWhitelist ? 'Yes' : 'No'}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </motion.div>
    </Box>
  );
};

export default SecurityDashboard;
