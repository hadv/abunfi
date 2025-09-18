import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  LinearProgress,
  Alert,
  IconButton,
  Tooltip,
  Grid
} from '@mui/material';
import {
  Shield,
  VerifiedUser,
  Refresh,
  Security,
  CheckCircle,
  Warning
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useWeb3Auth } from '../../contexts/Web3AuthContext';
import { useContractAddresses, useSocialAccountRegistryContract } from '../../hooks/useContract';
import zkVMService from '../../services/zkVMService';

const SocialVerificationStatus = ({ compact = false, showRefresh = true }) => {
  const { walletAddress } = useWeb3Auth();
  const addresses = useContractAddresses();
  const { contract: socialRegistryContract } = useSocialAccountRegistryContract(addresses.socialAccountRegistry);

  const [verificationData, setVerificationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (walletAddress && socialRegistryContract) {
      loadVerificationStatus();
    }
  }, [walletAddress, socialRegistryContract]);

  const loadVerificationStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const contracts = {
        socialAccountRegistry: socialRegistryContract
      };
      
      const status = await zkVMService.getUserVerificationStatus(walletAddress, contracts);
      setVerificationData(status);
    } catch (error) {
      console.error('Failed to load verification status:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getVerificationLevelColor = (level) => {
    if (level >= 3) return 'success';
    if (level >= 2) return 'warning';
    if (level >= 1) return 'info';
    return 'default';
  };

  const getVerificationLevelText = (level) => {
    if (level >= 3) return 'High Security';
    if (level >= 2) return 'Medium Security';
    if (level >= 1) return 'Basic Security';
    return 'No Verification';
  };

  const getSecurityIcon = (level) => {
    if (level >= 3) return <CheckCircle color="success" />;
    if (level >= 2) return <Warning color="warning" />;
    if (level >= 1) return <Security color="info" />;
    return <Shield color="disabled" />;
  };

  const getPlatformIcon = (platformName) => {
    const platform = zkVMService.getPlatformByName(platformName);
    return platform?.icon || '🔗';
  };

  if (loading) {
    return (
      <Card sx={{ ...(compact && { boxShadow: 1 }) }}>
        <CardContent sx={{ ...(compact && { py: 2 }) }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Shield sx={{ mr: 1, color: 'grey.500' }} />
            <Typography variant={compact ? 'subtitle2' : 'h6'}>
              Social Verification
            </Typography>
          </Box>
          <LinearProgress />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
            Loading verification status...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ ...(compact && { boxShadow: 1 }) }}>
        <CardContent sx={{ ...(compact && { py: 2 }) }}>
          <Alert severity="error" size="small">
            Failed to load verification status
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!verificationData) {
    return null;
  }

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card sx={{ boxShadow: 1 }}>
          <CardContent sx={{ py: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {getSecurityIcon(verificationData.verificationLevel)}
                <Box sx={{ ml: 1 }}>
                  <Typography variant="subtitle2">
                    {getVerificationLevelText(verificationData.verificationLevel)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {verificationData.verificationLevel} platform(s) verified
                  </Typography>
                </Box>
              </Box>
              
              {showRefresh && (
                <Tooltip title="Refresh status">
                  <IconButton size="small" onClick={loadVerificationStatus}>
                    <Refresh fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>

            {verificationData.linkedAccounts.length > 0 && (
              <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {verificationData.linkedAccounts.map((account, index) => (
                  <Chip
                    key={index}
                    label={getPlatformIcon(account.platform?.name)}
                    size="small"
                    color="success"
                    variant="outlined"
                    sx={{ minWidth: 'auto', px: 0.5 }}
                  />
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Shield sx={{ mr: 1, color: verificationData.hasVerification ? 'success.main' : 'grey.500' }} />
              <Typography variant="h6">
                Social Verification Status
              </Typography>
            </Box>
            
            {showRefresh && (
              <Tooltip title="Refresh status">
                <IconButton onClick={loadVerificationStatus}>
                  <Refresh />
                </IconButton>
              </Tooltip>
            )}
          </Box>
          
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {getSecurityIcon(verificationData.verificationLevel)}
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {getVerificationLevelText(verificationData.verificationLevel)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Security Level
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <VerifiedUser color={verificationData.hasVerification ? 'success' : 'disabled'} />
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {verificationData.verificationLevel} Platform(s)
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Verified Accounts
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>

          {verificationData.linkedAccounts.length > 0 ? (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Linked Social Accounts:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {verificationData.linkedAccounts.map((account, index) => (
                  <Chip
                    key={index}
                    icon={<span>{getPlatformIcon(account.platform?.name)}</span>}
                    label={account.platform?.name || 'Unknown Platform'}
                    color="success"
                    variant="outlined"
                    size="small"
                  />
                ))}
              </Box>
            </Box>
          ) : (
            <Alert severity="info" sx={{ mt: 2 }}>
              No social accounts verified yet. Verify your social accounts to enhance security and unlock higher transaction limits.
            </Alert>
          )}

          {verificationData.hasVerification && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
              <Typography variant="body2" color="success.dark">
                🎉 Your social verification enhances your account security and provides access to higher gasless transaction limits!
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SocialVerificationStatus;
