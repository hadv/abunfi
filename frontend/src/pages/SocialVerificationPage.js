import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Paper
} from '@mui/material';
import {
  Security,
  Shield,
  CheckCircle,
  Info,
  VerifiedUser,
  LocalGasStation,
  Speed,
  Lock
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { SocialVerification, SocialVerificationStatus } from '../components/zkvm';
import { useWeb3Auth } from '../contexts/Web3AuthContext';
import toast from 'react-hot-toast';

const SocialVerificationPage = () => {
  const { walletAddress } = useWeb3Auth();
  const [verificationComplete, setVerificationComplete] = useState(false);

  const handleVerificationComplete = (platform, data) => {
    setVerificationComplete(true);
    toast.success(`${platform} account verified successfully!`);
  };

  const benefits = [
    {
      icon: <LocalGasStation color="primary" />,
      title: 'Higher Gas Limits',
      description: 'Verified accounts get access to higher daily gas limits for gasless transactions'
    },
    {
      icon: <Speed color="primary" />,
      title: 'Faster Processing',
      description: 'Priority processing for verified users with reduced wait times'
    },
    {
      icon: <Shield color="primary" />,
      title: 'Enhanced Security',
      description: 'Multi-platform verification provides stronger Sybil attack protection'
    },
    {
      icon: <VerifiedUser color="primary" />,
      title: 'Trust Score',
      description: 'Build your reputation with verifiable social account history'
    }
  ];

  const securityFeatures = [
    'Zero-knowledge proofs protect your privacy',
    'OAuth tokens are processed securely in zkVM',
    'No sensitive data is stored on-chain',
    'One social account per wallet address',
    'Configurable verification requirements per platform'
  ];

  if (!walletAddress) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning">
          Please connect your wallet to access social verification features.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Social Verification
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            Enhance your account security with zero-knowledge social verification
          </Typography>
          <Chip
            icon={<Security />}
            label="Powered by RISC Zero zkVM"
            color="primary"
            variant="outlined"
          />
        </Box>

        <Grid container spacing={4}>
          {/* Left Column - Verification Status & Form */}
          <Grid item xs={12} lg={8}>
            <Box sx={{ mb: 3 }}>
              <SocialVerificationStatus />
            </Box>
            
            <SocialVerification onVerificationComplete={handleVerificationComplete} />
          </Grid>

          {/* Right Column - Benefits & Information */}
          <Grid item xs={12} lg={4}>
            {/* Benefits */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <CheckCircle sx={{ mr: 1, color: 'success.main' }} />
                  Verification Benefits
                </Typography>
                
                <List dense>
                  {benefits.map((benefit, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        {benefit.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={benefit.title}
                        secondary={benefit.description}
                        primaryTypographyProps={{ variant: 'subtitle2' }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>

            {/* Security Features */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <Lock sx={{ mr: 1, color: 'primary.main' }} />
                  Privacy & Security
                </Typography>
                
                <List dense>
                  {securityFeatures.map((feature, index) => (
                    <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 24 }}>
                        <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={feature}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>

            {/* How It Works */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <Info sx={{ mr: 1, color: 'info.main' }} />
                  How It Works
                </Typography>
                
                <Box>
                  <Typography variant="body2" paragraph>
                    <strong>1. Select Platform:</strong> Choose a social platform to verify (Twitter, Discord, GitHub, etc.)
                  </Typography>
                  
                  <Typography variant="body2" paragraph>
                    <strong>2. Provide OAuth Token:</strong> Enter your platform's OAuth token following our secure instructions
                  </Typography>
                  
                  <Typography variant="body2" paragraph>
                    <strong>3. ZK Proof Generation:</strong> Our RISC Zero zkVM generates a zero-knowledge proof of your account validity
                  </Typography>
                  
                  <Typography variant="body2" paragraph>
                    <strong>4. On-Chain Verification:</strong> The proof is verified and your account is linked securely
                  </Typography>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Alert severity="info" size="small">
                    <Typography variant="caption">
                      Your OAuth tokens are processed in a secure zero-knowledge environment and never stored permanently.
                    </Typography>
                  </Alert>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Success Message */}
        {verificationComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Paper 
              sx={{ 
                mt: 4, 
                p: 3, 
                bgcolor: 'success.light', 
                border: '2px solid',
                borderColor: 'success.main'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CheckCircle sx={{ mr: 2, color: 'success.dark', fontSize: 32 }} />
                <Box>
                  <Typography variant="h6" color="success.dark" gutterBottom>
                    Verification Successful!
                  </Typography>
                  <Typography variant="body2" color="success.dark">
                    Your social account has been verified and linked to your wallet. 
                    You now have access to enhanced security features and higher transaction limits.
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </motion.div>
        )}
      </motion.div>
    </Container>
  );
};

export default SocialVerificationPage;
