import React, { useState, useEffect } from 'react';
import {
  Snackbar,
  Alert,
  AlertTitle,
  Box,
  Typography,
  Button,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip
} from '@mui/material';
import {
  Close,
  Warning,
  Error,
  Info,
  CheckCircle,
  Security,
  LocalGasStation,
  Receipt,
  ExpandMore,
  ExpandLess
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useWeb3Auth } from '../../contexts/Web3AuthContext';
import { useRateLimitingService } from '../../services/rateLimitingService';

const SecurityNotifications = () => {
  const { walletAddress } = useWeb3Auth();
  const { service: rateLimitingService, isReady } = useRateLimitingService();
  
  const [notifications, setNotifications] = useState([]);
  const [expandedNotification, setExpandedNotification] = useState(null);

  // Check for security notifications periodically
  useEffect(() => {
    if (!isReady || !walletAddress || !rateLimitingService) {
      return;
    }

    const checkSecurityStatus = async () => {
      try {
        const warnings = await rateLimitingService.checkRateLimitWarnings(walletAddress);
        
        // Convert warnings to notifications
        const newNotifications = warnings.map((warning, index) => ({
          id: `security_${Date.now()}_${index}`,
          type: 'security',
          severity: warning.severity,
          title: getNotificationTitle(warning),
          message: warning.message,
          details: warning,
          timestamp: new Date(),
          autoHide: warning.severity === 'info',
          duration: getNotificationDuration(warning.severity)
        }));

        // Only show new notifications (avoid duplicates)
        const existingMessages = notifications.map(n => n.message);
        const uniqueNotifications = newNotifications.filter(
          n => !existingMessages.includes(n.message)
        );

        if (uniqueNotifications.length > 0) {
          setNotifications(prev => [...prev, ...uniqueNotifications]);
        }
      } catch (error) {
        console.error('Failed to check security status:', error);
      }
    };

    // Initial check
    checkSecurityStatus();

    // Set up periodic checks (every 5 minutes)
    const interval = setInterval(checkSecurityStatus, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isReady, walletAddress, rateLimitingService]);

  const getNotificationTitle = (warning) => {
    switch (warning.type) {
      case 'gas_limit':
        return 'Gas Limit Warning';
      case 'tx_limit':
        return 'Transaction Limit Warning';
      case 'whitelist':
        return 'Account Whitelist Required';
      default:
        return 'Security Notice';
    }
  };

  const getNotificationDuration = (severity) => {
    switch (severity) {
      case 'critical':
        return 10000; // 10 seconds
      case 'warning':
        return 7000;  // 7 seconds
      case 'info':
        return 4000;  // 4 seconds
      default:
        return 6000;  // 6 seconds
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <Error />;
      case 'warning':
        return <Warning />;
      case 'info':
        return <Info />;
      default:
        return <Security />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'info';
    }
  };

  const handleCloseNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const handleExpandNotification = (notificationId) => {
    setExpandedNotification(
      expandedNotification === notificationId ? null : notificationId
    );
  };

  const renderNotificationDetails = (notification) => {
    const { details } = notification;
    
    if (!details) return null;

    return (
      <Box sx={{ mt: 2 }}>
        {details.remaining && (
          <Typography variant="body2" color="text.secondary">
            Remaining: {details.remaining}
          </Typography>
        )}
        
        {details.type === 'gas_limit' && (
          <List dense>
            <ListItem>
              <ListItemIcon>
                <LocalGasStation sx={{ fontSize: 20 }} />
              </ListItemIcon>
              <ListItemText
                primary="Daily Gas Usage"
                secondary="Monitor your gasless transaction gas consumption"
              />
            </ListItem>
          </List>
        )}
        
        {details.type === 'tx_limit' && (
          <List dense>
            <ListItem>
              <ListItemIcon>
                <Receipt sx={{ fontSize: 20 }} />
              </ListItemIcon>
              <ListItemText
                primary="Daily Transaction Count"
                secondary="Track your gasless transaction frequency"
              />
            </ListItem>
          </List>
        )}
        
        {details.action && (
          <Box sx={{ mt: 1 }}>
            <Button
              size="small"
              variant="outlined"
              onClick={() => handleNotificationAction(details.action)}
            >
              {getActionButtonText(details.action)}
            </Button>
          </Box>
        )}
      </Box>
    );
  };

  const getActionButtonText = (action) => {
    switch (action) {
      case 'contact_support':
        return 'Contact Support';
      case 'optimize_usage':
        return 'Learn More';
      case 'batch_transactions':
        return 'Batching Guide';
      default:
        return 'Learn More';
    }
  };

  const handleNotificationAction = (action) => {
    switch (action) {
      case 'contact_support':
        // Open support contact
        window.open('mailto:support@abunfi.com', '_blank');
        break;
      case 'optimize_usage':
      case 'batch_transactions':
        // Navigate to help documentation
        window.open('/docs/gasless-transactions', '_blank');
        break;
      default:
        break;
    }
  };

  // Auto-hide notifications
  useEffect(() => {
    notifications.forEach(notification => {
      if (notification.autoHide) {
        const timer = setTimeout(() => {
          handleCloseNotification(notification.id);
        }, notification.duration);

        return () => clearTimeout(timer);
      }
    });
  }, [notifications]);

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 80,
        right: 16,
        zIndex: 1400,
        maxWidth: 400,
        width: '100%'
      }}
    >
      <AnimatePresence>
        {notifications.map((notification, index) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            style={{ marginBottom: 8 }}
          >
            <Alert
              severity={getSeverityColor(notification.severity)}
              variant="filled"
              action={
                <Box display="flex" alignItems="center">
                  <IconButton
                    size="small"
                    onClick={() => handleExpandNotification(notification.id)}
                    sx={{ color: 'inherit', mr: 1 }}
                  >
                    {expandedNotification === notification.id ? 
                      <ExpandLess /> : <ExpandMore />
                    }
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleCloseNotification(notification.id)}
                    sx={{ color: 'inherit' }}
                  >
                    <Close />
                  </IconButton>
                </Box>
              }
              sx={{
                '& .MuiAlert-message': {
                  width: '100%'
                }
              }}
            >
              <AlertTitle>
                <Box display="flex" alignItems="center">
                  {getSeverityIcon(notification.severity)}
                  <Typography variant="subtitle2" sx={{ ml: 1 }}>
                    {notification.title}
                  </Typography>
                  <Chip
                    label={notification.severity.toUpperCase()}
                    size="small"
                    sx={{ ml: 1, height: 20 }}
                  />
                </Box>
              </AlertTitle>
              
              <Typography variant="body2">
                {notification.message}
              </Typography>
              
              <Collapse in={expandedNotification === notification.id}>
                {renderNotificationDetails(notification)}
              </Collapse>
            </Alert>
          </motion.div>
        ))}
      </AnimatePresence>
    </Box>
  );
};

export default SecurityNotifications;
