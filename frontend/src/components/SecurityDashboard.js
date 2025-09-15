import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Alert,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip
} from '@mui/material';
import {
  Security,
  Fingerprint,
  Delete,
  Add,
  Star,
  CheckCircle,
  Warning,
  Info
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import passkeyService from '../services/passkeyService';
import PasskeyRegistration from './PasskeyRegistration';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

const SecurityDashboard = () => {
  const [passkeys, setPasskeys] = useState([]);
  const [securityStatus, setSecurityStatus] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRegistration, setShowRegistration] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, passkey: null });

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      setLoading(true);
      
      const [passkeysData, statusData, recommendationsData] = await Promise.all([
        passkeyService.getUserPasskeys(),
        passkeyService.getSecurityStatus(),
        passkeyService.getSecurityRecommendations()
      ]);

      setPasskeys(passkeysData);
      setSecurityStatus(statusData);
      setRecommendations(recommendationsData);
    } catch (error) {
      console.error('Failed to load security data:', error);
      toast.error('Failed to load security information');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePasskey = async (passkey) => {
    try {
      await passkeyService.deletePasskey(passkey.id);
      toast.success('Passkey deleted successfully');
      setDeleteDialog({ open: false, passkey: null });
      loadSecurityData(); // Reload data
    } catch (error) {
      console.error('Failed to delete passkey:', error);
      toast.error('Failed to delete passkey');
    }
  };

  const handleClaimAchievement = async (achievement) => {
    try {
      await passkeyService.claimAchievement(achievement.id);
      toast.success('Achievement claimed! 🎉');
      loadSecurityData(); // Reload data
    } catch (error) {
      console.error('Failed to claim achievement:', error);
      toast.error('Failed to claim achievement');
    }
  };

  const getSecurityLevelColor = (level) => {
    switch (level) {
      case 'basic': return 'warning';
      case 'enhanced': return 'info';
      case 'premium': return 'success';
      default: return 'default';
    }
  };

  const getTrustScoreColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'info';
    if (score >= 40) return 'warning';
    return 'error';
  };

  if (loading) {
    return (
      <Box p={3}>
        <Typography variant="h5" gutterBottom>Security Dashboard</Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom display="flex" alignItems="center" gap={1}>
        <Security color="primary" />
        Security Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Security Overview */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Security Overview
              </Typography>
              
              {securityStatus && (
                <Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="body2">Security Level</Typography>
                    <Chip 
                      label={securityStatus.security.securityLevel.toUpperCase()} 
                      color={getSecurityLevelColor(securityStatus.security.securityLevel)}
                      size="small"
                    />
                  </Box>

                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="body2">Trust Score</Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <LinearProgress 
                        variant="determinate" 
                        value={securityStatus.security.trustScore} 
                        sx={{ width: 100 }}
                        color={getTrustScoreColor(securityStatus.security.trustScore)}
                      />
                      <Typography variant="body2">
                        {securityStatus.security.trustScore}/100
                      </Typography>
                    </Box>
                  </Box>

                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="body2">2FA Status</Typography>
                    <Chip 
                      label={securityStatus.security.twoFactorEnabled ? 'Enabled' : 'Disabled'} 
                      color={securityStatus.security.twoFactorEnabled ? 'success' : 'error'}
                      size="small"
                    />
                  </Box>

                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2">Active Passkeys</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {securityStatus.security.passkeyCount}
                    </Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Achievements */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Security Achievements
              </Typography>
              
              {securityStatus?.achievements?.length > 0 ? (
                <List dense>
                  {securityStatus.achievements.slice(0, 3).map((achievement) => (
                    <ListItem key={achievement.id}>
                      <ListItemIcon>
                        <Star color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={achievement.achievement_name}
                        secondary={`${achievement.bonus_amount} ${achievement.bonus_type}`}
                      />
                      {!achievement.claimed && (
                        <ListItemSecondaryAction>
                          <Button 
                            size="small" 
                            onClick={() => handleClaimAchievement(achievement)}
                          >
                            Claim
                          </Button>
                        </ListItemSecondaryAction>
                      )}
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No achievements yet. Set up 2FA to earn your first achievement!
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Passkey Management */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Passkey Management
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setShowRegistration(true)}
                >
                  Add Passkey
                </Button>
              </Box>

              {passkeys.length > 0 ? (
                <List>
                  {passkeys.map((passkey) => (
                    <motion.div
                      key={passkey.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ListItem>
                        <ListItemIcon>
                          <Fingerprint color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={passkey.device_name}
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                Added {formatDistanceToNow(new Date(passkey.created_at))} ago
                              </Typography>
                              {passkey.last_used_at && (
                                <Typography variant="body2" color="text.secondary">
                                  Last used {formatDistanceToNow(new Date(passkey.last_used_at))} ago
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Tooltip title="Delete passkey">
                            <IconButton
                              edge="end"
                              onClick={() => setDeleteDialog({ open: true, passkey })}
                              disabled={passkeys.length <= 1}
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </ListItemSecondaryAction>
                      </ListItem>
                    </motion.div>
                  ))}
                </List>
              ) : (
                <Alert severity="info">
                  No passkeys configured. Add your first passkey to enhance your account security!
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Security Recommendations */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Security Recommendations
              </Typography>
              
              {recommendations.recommendations?.length > 0 ? (
                <List>
                  {recommendations.recommendations.map((rec, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        {rec.type === 'critical' && <Warning color="error" />}
                        {rec.type === 'high' && <Warning color="warning" />}
                        {rec.type === 'medium' && <Info color="info" />}
                        {rec.type === 'low' && <CheckCircle color="success" />}
                      </ListItemIcon>
                      <ListItemText
                        primary={rec.title}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {rec.description}
                            </Typography>
                            <Typography variant="body2" color="primary">
                              Reward: {rec.reward}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Alert severity="success">
                  Great! You're following all security best practices.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Passkey Registration Dialog */}
      <PasskeyRegistration
        open={showRegistration}
        onClose={() => setShowRegistration(false)}
        onSuccess={() => {
          setShowRegistration(false);
          loadSecurityData();
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, passkey: null })}
      >
        <DialogTitle>Delete Passkey</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the passkey "{deleteDialog.passkey?.device_name}"?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            This action cannot be undone. Make sure you have another way to access your account.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, passkey: null })}>
            Cancel
          </Button>
          <Button 
            onClick={() => handleDeletePasskey(deleteDialog.passkey)}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SecurityDashboard;
