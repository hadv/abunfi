import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  Chip,
  LinearProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  IconButton,
  Collapse
} from '@mui/material';
import {
  Security,
  Warning,
  CheckCircle,
  Error,
  Info,
  ExpandMore,
  ExpandLess,
  LocalGasStation,
  Receipt,
  Shield,
  VerifiedUser
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useWeb3Auth } from '../../contexts/Web3AuthContext';
import { useRateLimitingService } from '../../services/rateLimitingService';
import toast from 'react-hot-toast';

const GaslessTransactionSecurity = ({ 
  onTransactionValidated, 
  estimatedGasCost, 
  transactionType = 'transaction',
  showDetails = true 
}) => {
  const { walletAddress } = useWeb3Auth();
  const { service: rateLimitingService, isReady } = useRateLimitingService();
  
  const [securityStatus, setSecurityStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSecurityDialog, setShowSecurityDialog] = useState(false);
  const [showDetails, setShowDetailsExpanded] = useState(false);
  const [canProceed, setCanProceed] = useState(false);

  const loadSecurityStatus = async () => {
    if (!isReady || !walletAddress || !rateLimitingService) {
      return;
    }

    try {
      setLoading(true);
      const status = await rateLimitingService.getSecurityStatus(walletAddress);
      setSecurityStatus(status);
      
      // Check if transaction can proceed
      const canTransact = validateTransaction(status);
      setCanProceed(canTransact);
      
      if (onTransactionValidated) {
        onTransactionValidated(canTransact, status);
      }
    } catch (error) {
      console.error('Failed to load security status:', error);
      setCanProceed(false);
      if (onTransactionValidated) {
        onTransactionValidated(false, null);
      }
    } finally {
      setLoading(false);
    }
  };

  const validateTransaction = (status) => {
    if (!status || !status.isActive) {
      return false;
    }

    // Check if account requires whitelist and is not whitelisted
    if (status.requiresWhitelist && !status.isWhitelisted) {
      return false;
    }

    // Check if estimated gas cost exceeds per-transaction limit
    if (estimatedGasCost && parseFloat(estimatedGasCost) > parseFloat(status.perTxLimit)) {
      return false;
    }

    // Check if daily limits would be exceeded
    const remainingGas = parseFloat(status.dailyLimits.gas.remaining);
    const remainingTx = status.dailyLimits.transactions.remaining;

    if (estimatedGasCost && parseFloat(estimatedGasCost) > remainingGas) {
      return false;
    }

    if (remainingTx <= 0) {
      return false;
    }

    return true;
  };

  useEffect(() => {
    loadSecurityStatus();
  }, [isReady, walletAddress, rateLimitingService, estimatedGasCost]);

  const getSecurityLevel = () => {
    if (!securityStatus) return 'unknown';
    
    if (!securityStatus.isActive || 
        (securityStatus.requiresWhitelist && !securityStatus.isWhitelisted)) {
      return 'blocked';
    }
    
    if (securityStatus.riskLevel === 'high') return 'high-risk';
    if (securityStatus.riskLevel === 'medium') return 'medium-risk';
    return 'secure';
  };

  const getSecurityColor = () => {
    switch (getSecurityLevel()) {
      case 'blocked': return 'error';
      case 'high-risk': return 'error';
      case 'medium-risk': return 'warning';
      case 'secure': return 'success';
      default: return 'info';
    }
  };

  const getSecurityIcon = () => {
    switch (getSecurityLevel()) {
      case 'blocked': return <Error />;
      case 'high-risk': return <Warning />;
      case 'medium-risk': return <Warning />;
      case 'secure': return <CheckCircle />;
      default: return <Info />;
    }
  };

  const getSecurityMessage = () => {
    if (!securityStatus) return 'Checking security status...';
    
    switch (getSecurityLevel()) {
      case 'blocked':
        if (!securityStatus.isActive) {
          return 'Gasless transactions are currently disabled for your account';
        }
        if (securityStatus.requiresWhitelist && !securityStatus.isWhitelisted) {
          return 'Your account requires whitelisting for gasless transactions';
        }
        return 'Transaction blocked by security policy';
      case 'high-risk':
        return 'You are approaching your daily limits. Transaction may fail.';
      case 'medium-risk':
        return 'You have used most of your daily allowance. Monitor your usage.';
      case 'secure':
        return 'Transaction can proceed safely within rate limits';
      default:
        return 'Security status unknown';
    }
  };

  const formatPercentage = (value) => {
    return Math.min(100, Math.max(0, value)).toFixed(1);
  };

  if (loading) {
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box display="flex" alignItems="center">
            <Security sx={{ mr: 1 }} />
            <Typography variant="body2">Checking security status...</Typography>
          </Box>
          <LinearProgress sx={{ mt: 1 }} />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card sx={{ mb: 2, border: `2px solid`, borderColor: `${getSecurityColor()}.main` }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box display="flex" alignItems="center">
                {getSecurityIcon()}
                <Box ml={1}>
                  <Typography variant="subtitle2" color={getSecurityColor()}>
                    Security Status
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {getSecurityMessage()}
                  </Typography>
                </Box>
              </Box>
              
              <Box display="flex" alignItems="center">
                <Chip
                  label={canProceed ? 'Approved' : 'Blocked'}
                  color={canProceed ? 'success' : 'error'}
                  size="small"
                  sx={{ mr: 1 }}
                />
                {showDetails && (
                  <Tooltip title="Show security details">
                    <IconButton 
                      size="small" 
                      onClick={() => setShowDetailsExpanded(!showDetailsExpanded)}
                    >
                      {showDetailsExpanded ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Box>

            <Collapse in={showDetailsExpanded}>
              <Box mt={2}>
                {securityStatus && (
                  <>
                    {/* Rate Limit Status */}
                    <Box mb={2}>
                      <Typography variant="subtitle2" gutterBottom>
                        Daily Usage
                      </Typography>
                      
                      <Box mb={1}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                          <Typography variant="body2" display="flex" alignItems="center">
                            <LocalGasStation sx={{ fontSize: 16, mr: 0.5 }} />
                            Gas Usage
                          </Typography>
                          <Typography variant="body2">
                            {formatPercentage(securityStatus.dailyLimits.gas.percentage)}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={securityStatus.dailyLimits.gas.percentage}
                          color={securityStatus.dailyLimits.gas.percentage > 80 ? 'error' : 'primary'}
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {securityStatus.dailyLimits.gas.remaining} ETH remaining
                        </Typography>
                      </Box>

                      <Box>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                          <Typography variant="body2" display="flex" alignItems="center">
                            <Receipt sx={{ fontSize: 16, mr: 0.5 }} />
                            Transactions
                          </Typography>
                          <Typography variant="body2">
                            {formatPercentage(securityStatus.dailyLimits.transactions.percentage)}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={securityStatus.dailyLimits.transactions.percentage}
                          color={securityStatus.dailyLimits.transactions.percentage > 80 ? 'error' : 'primary'}
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {securityStatus.dailyLimits.transactions.remaining} transactions remaining
                        </Typography>
                      </Box>
                    </Box>

                    {/* Account Status */}
                    <Box display="flex" gap={1} mb={2}>
                      <Chip
                        icon={<Shield />}
                        label={securityStatus.isActive ? 'Active' : 'Inactive'}
                        color={securityStatus.isActive ? 'success' : 'error'}
                        size="small"
                      />
                      <Chip
                        icon={<VerifiedUser />}
                        label={securityStatus.isWhitelisted ? 'Whitelisted' : 'Standard'}
                        color={securityStatus.isWhitelisted ? 'primary' : 'default'}
                        size="small"
                      />
                    </Box>

                    {/* Estimated Cost */}
                    {estimatedGasCost && (
                      <Alert 
                        severity={parseFloat(estimatedGasCost) > parseFloat(securityStatus.perTxLimit) ? 'error' : 'info'}
                        sx={{ mt: 1 }}
                      >
                        <Typography variant="body2">
                          Estimated gas cost: {estimatedGasCost} ETH
                          {parseFloat(estimatedGasCost) > parseFloat(securityStatus.perTxLimit) && 
                            ` (Exceeds per-transaction limit of ${securityStatus.perTxLimit} ETH)`
                          }
                        </Typography>
                      </Alert>
                    )}

                    {/* Warnings */}
                    {securityStatus.warnings && securityStatus.warnings.length > 0 && (
                      <Box mt={2}>
                        <Typography variant="subtitle2" gutterBottom>
                          Security Warnings
                        </Typography>
                        {securityStatus.warnings.map((warning, index) => (
                          <Alert 
                            key={index} 
                            severity={warning.severity} 
                            sx={{ mb: 1 }}
                            size="small"
                          >
                            {warning.message}
                          </Alert>
                        ))}
                      </Box>
                    )}
                  </>
                )}
              </Box>
            </Collapse>
          </CardContent>
        </Card>
      </motion.div>

      {/* Security Details Dialog */}
      <Dialog 
        open={showSecurityDialog} 
        onClose={() => setShowSecurityDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <Security sx={{ mr: 1 }} />
            Gasless Transaction Security
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" paragraph>
            Gasless transactions are protected by rate limiting to prevent DOS and Sybil attacks. 
            Your account has daily limits for gas usage and transaction count.
          </Typography>
          
          {securityStatus && (
            <List>
              <ListItem>
                <ListItemIcon><LocalGasStation /></ListItemIcon>
                <ListItemText
                  primary="Daily Gas Limit"
                  secondary={`${securityStatus.dailyLimits.gas.used} / ${securityStatus.dailyLimits.gas.limit} ETH used`}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><Receipt /></ListItemIcon>
                <ListItemText
                  primary="Daily Transaction Limit"
                  secondary={`${securityStatus.dailyLimits.transactions.used} / ${securityStatus.dailyLimits.transactions.limit} transactions used`}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><Shield /></ListItemIcon>
                <ListItemText
                  primary="Per-Transaction Limit"
                  secondary={`${securityStatus.perTxLimit} ETH maximum per transaction`}
                />
              </ListItem>
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSecurityDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default GaslessTransactionSecurity;
