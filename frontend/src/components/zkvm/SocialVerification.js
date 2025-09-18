import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
  Collapse,
  Link
} from '@mui/material';
import {
  Security,
  CheckCircle,
  Error,
  Info,
  Warning,
  ExpandMore,
  ExpandLess,
  OpenInNew,
  Refresh,
  VerifiedUser,
  Shield
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useWeb3Auth } from '../../contexts/Web3AuthContext';
import { useContractAddresses, useSocialAccountRegistryContract, useRiscZeroSocialVerifierContract } from '../../hooks/useContract';
import zkVMService from '../../services/zkVMService';
import toast from 'react-hot-toast';

const SocialVerification = ({ onVerificationComplete }) => {
  const { walletAddress } = useWeb3Auth();
  const addresses = useContractAddresses();
  const { contract: socialRegistryContract } = useSocialAccountRegistryContract(addresses.socialAccountRegistry);
  const { contract: verifierContract } = useRiscZeroSocialVerifierContract(addresses.riscZeroSocialVerifier);

  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [oauthToken, setOauthToken] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [userVerificationData, setUserVerificationData] = useState(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [currentRequestId, setCurrentRequestId] = useState(null);
  const [expandedInstructions, setExpandedInstructions] = useState(false);

  const supportedPlatforms = zkVMService.getSupportedPlatforms();

  // Load user verification status on component mount
  useEffect(() => {
    if (walletAddress && socialRegistryContract) {
      loadUserVerificationStatus();
    }
  }, [walletAddress, socialRegistryContract]);

  const loadUserVerificationStatus = async () => {
    try {
      const contracts = {
        socialAccountRegistry: socialRegistryContract,
        riscZeroSocialVerifier: verifierContract
      };
      
      const status = await zkVMService.getUserVerificationStatus(walletAddress, contracts);
      setUserVerificationData(status);
    } catch (error) {
      console.error('Failed to load verification status:', error);
    }
  };

  const handlePlatformChange = (event) => {
    setSelectedPlatform(event.target.value);
    setOauthToken('');
    setVerificationStatus(null);
  };

  const handleStartVerification = async () => {
    if (!selectedPlatform || !oauthToken) {
      toast.error('Please select a platform and enter OAuth token');
      return;
    }

    if (!zkVMService.validateOAuthToken(selectedPlatform, oauthToken)) {
      toast.error('Invalid OAuth token format');
      return;
    }

    setIsVerifying(true);
    setVerificationStatus({ type: 'info', message: 'Starting verification process...' });

    try {
      const contracts = {
        socialAccountRegistry: socialRegistryContract,
        riscZeroSocialVerifier: verifierContract
      };

      const requestId = await zkVMService.requestVerification(
        selectedPlatform,
        oauthToken,
        walletAddress,
        contracts
      );

      setCurrentRequestId(requestId);
      setVerificationStatus({ 
        type: 'info', 
        message: 'Generating zero-knowledge proof... This may take a few minutes.' 
      });

      // Poll for verification completion
      pollVerificationStatus(requestId, contracts);

    } catch (error) {
      console.error('Verification failed:', error);
      setVerificationStatus({ 
        type: 'error', 
        message: `Verification failed: ${error.message}` 
      });
      setIsVerifying(false);
    }
  };

  const pollVerificationStatus = async (requestId, contracts) => {
    const maxAttempts = 30; // 5 minutes with 10-second intervals
    let attempts = 0;

    const poll = async () => {
      try {
        attempts++;
        const status = await zkVMService.checkVerificationStatus(requestId, contracts);

        if (status.isCompleted) {
          if (status.isVerified) {
            setVerificationStatus({ 
              type: 'success', 
              message: `✅ ${selectedPlatform} account verified successfully!`,
              data: status.data
            });
            
            // Refresh user verification data
            await loadUserVerificationStatus();
            
            if (onVerificationComplete) {
              onVerificationComplete(selectedPlatform, status.data);
            }
          } else {
            setVerificationStatus({ 
              type: 'error', 
              message: 'Verification failed. Please check your OAuth token and try again.' 
            });
          }
          setIsVerifying(false);
          return;
        }

        if (attempts >= maxAttempts) {
          setVerificationStatus({ 
            type: 'warning', 
            message: 'Verification is taking longer than expected. Please check back later.' 
          });
          setIsVerifying(false);
          return;
        }

        // Continue polling
        setTimeout(poll, 10000); // Poll every 10 seconds
      } catch (error) {
        console.error('Failed to check verification status:', error);
        setVerificationStatus({ 
          type: 'error', 
          message: `Failed to check verification status: ${error.message}` 
        });
        setIsVerifying(false);
      }
    };

    poll();
  };

  const handleShowInstructions = () => {
    setShowInstructions(true);
  };

  const getInstructions = () => {
    if (!selectedPlatform) return null;
    return zkVMService.getOAuthInstructions(selectedPlatform);
  };

  const getPlatformIcon = (platformName) => {
    const platform = zkVMService.getPlatformByName(platformName);
    return platform?.icon || '🔗';
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

  return (
    <Box>
      {/* User Verification Status */}
      {userVerificationData && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Shield sx={{ mr: 1, color: userVerificationData.hasVerification ? 'success.main' : 'grey.500' }} />
              <Typography variant="h6">
                Verification Status
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Chip
                icon={<VerifiedUser />}
                label={getVerificationLevelText(userVerificationData.verificationLevel)}
                color={getVerificationLevelColor(userVerificationData.verificationLevel)}
                variant={userVerificationData.hasVerification ? 'filled' : 'outlined'}
              />
              <Typography variant="body2" color="text.secondary">
                {userVerificationData.verificationLevel} platform(s) verified
              </Typography>
            </Box>

            {userVerificationData.linkedAccounts.length > 0 && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Linked Accounts:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {userVerificationData.linkedAccounts.map((account, index) => (
                    <Chip
                      key={index}
                      icon={<span>{getPlatformIcon(account.platform?.name)}</span>}
                      label={account.platform?.name || 'Unknown'}
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Verification Form */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Security sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">
              Social Account Verification
            </Typography>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Verify your social accounts using zero-knowledge proofs to enhance your security level
            and unlock higher transaction limits.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Select Platform</InputLabel>
              <Select
                value={selectedPlatform}
                onChange={handlePlatformChange}
                label="Select Platform"
                disabled={isVerifying}
              >
                {Object.entries(supportedPlatforms).map(([key, platform]) => (
                  <MenuItem key={key} value={key}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ marginRight: 8 }}>{platform.icon}</span>
                      {platform.name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedPlatform && (
              <Button
                variant="outlined"
                onClick={handleShowInstructions}
                startIcon={<Info />}
                sx={{ minWidth: 'fit-content' }}
              >
                Instructions
              </Button>
            )}
          </Box>

          {selectedPlatform && (
            <TextField
              fullWidth
              label="OAuth Token"
              value={oauthToken}
              onChange={(e) => setOauthToken(e.target.value)}
              placeholder={`Enter your ${zkVMService.getPlatformByName(selectedPlatform)?.name} OAuth token`}
              disabled={isVerifying}
              type="password"
              sx={{ mb: 3 }}
              helperText="Your token is processed securely using zero-knowledge proofs"
            />
          )}

          {verificationStatus && (
            <Alert 
              severity={verificationStatus.type} 
              sx={{ mb: 3 }}
              action={
                verificationStatus.type === 'success' && (
                  <IconButton size="small" onClick={loadUserVerificationStatus}>
                    <Refresh />
                  </IconButton>
                )
              }
            >
              {verificationStatus.message}
              {verificationStatus.data && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" display="block">
                    Account Age: {Math.floor(verificationStatus.data.accountAge / 86400)} days
                  </Typography>
                  <Typography variant="caption" display="block">
                    Followers: {verificationStatus.data.followerCount}
                  </Typography>
                </Box>
              )}
            </Alert>
          )}

          {isVerifying && (
            <Box sx={{ mb: 3 }}>
              <LinearProgress />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                Generating zero-knowledge proof...
              </Typography>
            </Box>
          )}

          <Button
            variant="contained"
            onClick={handleStartVerification}
            disabled={!selectedPlatform || !oauthToken || isVerifying}
            fullWidth
            startIcon={<Security />}
          >
            {isVerifying ? 'Verifying...' : 'Start Verification'}
          </Button>
        </CardContent>
      </Card>

      {/* Instructions Dialog */}
      <Dialog
        open={showInstructions}
        onClose={() => setShowInstructions(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {getInstructions()?.title}
        </DialogTitle>
        <DialogContent>
          {getInstructions() && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Follow these steps to get your OAuth token:
              </Typography>
              
              <List>
                {getInstructions().steps.map((step, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <Typography variant="body2" color="primary">
                        {index + 1}.
                      </Typography>
                    </ListItemIcon>
                    <ListItemText primary={step} />
                  </ListItem>
                ))}
              </List>

              <Box sx={{ mt: 2 }}>
                <Link
                  href={getInstructions().url}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ display: 'flex', alignItems: 'center' }}
                >
                  Open {zkVMService.getPlatformByName(selectedPlatform)?.name} Developer Portal
                  <OpenInNew sx={{ ml: 1, fontSize: 16 }} />
                </Link>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowInstructions(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SocialVerification;
