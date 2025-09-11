import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider
} from '@mui/material';
import {
  ExpandMore,
  Security,
  Shield,
  Warning,
  Info,
  CheckCircle,
  Block,
  Speed,
  Group,
  LocalGasStation,
  Receipt,
  VerifiedUser,
  Help
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const AntiAbuseEducation = ({ compact = false, showDialog = false, onClose }) => {
  const [openDialog, setOpenDialog] = useState(showDialog);
  const [expandedPanel, setExpandedPanel] = useState(false);

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpandedPanel(isExpanded ? panel : false);
  };

  const handleClose = () => {
    setOpenDialog(false);
    if (onClose) onClose();
  };

  const educationContent = (
    <Box>
      {/* Overview */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Why Rate Limiting?
        </Typography>
        <Typography variant="body2">
          Rate limiting protects the Abunfi platform from DOS (Denial of Service) and Sybil attacks 
          while ensuring fair access to gasless transactions for all users.
        </Typography>
      </Alert>

      {/* DOS Attack Prevention */}
      <Accordion 
        expanded={expandedPanel === 'dos'} 
        onChange={handleAccordionChange('dos')}
        sx={{ mb: 2 }}
      >
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box display="flex" alignItems="center">
            <Speed sx={{ mr: 1, color: 'error.main' }} />
            <Typography variant="h6">DOS Attack Prevention</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" paragraph>
            DOS (Denial of Service) attacks attempt to overwhelm the system with excessive requests, 
            making it unavailable for legitimate users.
          </Typography>
          
          <Typography variant="subtitle2" gutterBottom>
            How we prevent DOS attacks:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon><LocalGasStation sx={{ fontSize: 20 }} /></ListItemIcon>
              <ListItemText
                primary="Daily Gas Limits"
                secondary="Each account has a maximum amount of gas that can be sponsored per day"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><Receipt sx={{ fontSize: 20 }} /></ListItemIcon>
              <ListItemText
                primary="Transaction Count Limits"
                secondary="Maximum number of gasless transactions per account per day"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><Speed sx={{ fontSize: 20 }} /></ListItemIcon>
              <ListItemText
                primary="Per-Transaction Limits"
                secondary="Maximum gas cost allowed for individual transactions"
              />
            </ListItem>
          </List>
        </AccordionDetails>
      </Accordion>

      {/* Sybil Attack Prevention */}
      <Accordion 
        expanded={expandedPanel === 'sybil'} 
        onChange={handleAccordionChange('sybil')}
        sx={{ mb: 2 }}
      >
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box display="flex" alignItems="center">
            <Group sx={{ mr: 1, color: 'warning.main' }} />
            <Typography variant="h6">Sybil Attack Prevention</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" paragraph>
            Sybil attacks involve creating multiple fake identities to gain unfair advantages 
            or exhaust system resources.
          </Typography>
          
          <Typography variant="subtitle2" gutterBottom>
            How we prevent Sybil attacks:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon><VerifiedUser sx={{ fontSize: 20 }} /></ListItemIcon>
              <ListItemText
                primary="Account Verification"
                secondary="Social login and wallet-based identity verification"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><Shield sx={{ fontSize: 20 }} /></ListItemIcon>
              <ListItemText
                primary="Whitelist System"
                secondary="Trusted accounts can have higher limits after verification"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><Block sx={{ fontSize: 20 }} /></ListItemIcon>
              <ListItemText
                primary="Behavior Monitoring"
                secondary="Suspicious patterns are detected and flagged"
              />
            </ListItem>
          </List>
        </AccordionDetails>
      </Accordion>

      {/* Rate Limiting Details */}
      <Accordion 
        expanded={expandedPanel === 'limits'} 
        onChange={handleAccordionChange('limits')}
        sx={{ mb: 2 }}
      >
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box display="flex" alignItems="center">
            <Security sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">Understanding Rate Limits</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="subtitle2" gutterBottom>
            Default Limits for Standard Accounts:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon><LocalGasStation sx={{ fontSize: 20 }} /></ListItemIcon>
              <ListItemText
                primary="Daily Gas Limit: 0.1 ETH"
                secondary="Approximately $250 worth of gas per day (at 2500 ETH price)"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><Receipt sx={{ fontSize: 20 }} /></ListItemIcon>
              <ListItemText
                primary="Daily Transaction Limit: 50"
                secondary="Maximum 50 gasless transactions per day"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><Speed sx={{ fontSize: 20 }} /></ListItemIcon>
              <ListItemText
                primary="Per-Transaction Limit: 0.01 ETH"
                secondary="Maximum $25 worth of gas per transaction"
              />
            </ListItem>
          </List>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" gutterBottom>
            Whitelisted Account Benefits:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon><CheckCircle sx={{ fontSize: 20, color: 'success.main' }} /></ListItemIcon>
              <ListItemText
                primary="Higher Limits"
                secondary="Increased daily gas and transaction limits"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckCircle sx={{ fontSize: 20, color: 'success.main' }} /></ListItemIcon>
              <ListItemText
                primary="Priority Processing"
                secondary="Faster transaction processing during high demand"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckCircle sx={{ fontSize: 20, color: 'success.main' }} /></ListItemIcon>
              <ListItemText
                primary="Custom Policies"
                secondary="Tailored rate limiting based on usage patterns"
              />
            </ListItem>
          </List>
        </AccordionDetails>
      </Accordion>

      {/* Best Practices */}
      <Accordion 
        expanded={expandedPanel === 'practices'} 
        onChange={handleAccordionChange('practices')}
        sx={{ mb: 2 }}
      >
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box display="flex" alignItems="center">
            <CheckCircle sx={{ mr: 1, color: 'success.main' }} />
            <Typography variant="h6">Best Practices</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="subtitle2" gutterBottom>
            To make the most of your gasless transactions:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon><Info sx={{ fontSize: 20 }} /></ListItemIcon>
              <ListItemText
                primary="Monitor Your Usage"
                secondary="Check your daily limits regularly to avoid hitting caps"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><Info sx={{ fontSize: 20 }} /></ListItemIcon>
              <ListItemText
                primary="Batch Transactions"
                secondary="Combine multiple operations when possible to save on transaction count"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><Info sx={{ fontSize: 20 }} /></ListItemIcon>
              <ListItemText
                primary="Use During Off-Peak Hours"
                secondary="Lower network congestion means more efficient gas usage"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><Info sx={{ fontSize: 20 }} /></ListItemIcon>
              <ListItemText
                primary="Keep Your Account Secure"
                secondary="Protect your wallet and login credentials to maintain good standing"
              />
            </ListItem>
          </List>
        </AccordionDetails>
      </Accordion>

      {/* Account Status */}
      <Card sx={{ mt: 3, bgcolor: 'background.paper' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Account Status Indicators
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1}>
            <Chip
              icon={<CheckCircle />}
              label="Active"
              color="success"
              size="small"
            />
            <Chip
              icon={<VerifiedUser />}
              label="Whitelisted"
              color="primary"
              size="small"
            />
            <Chip
              icon={<Warning />}
              label="Approaching Limits"
              color="warning"
              size="small"
            />
            <Chip
              icon={<Block />}
              label="Limit Exceeded"
              color="error"
              size="small"
            />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            These indicators show your current account status and rate limiting state.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box display="flex" alignItems="center">
                <Security sx={{ mr: 1 }} />
                <Typography variant="h6">Security & Rate Limiting</Typography>
              </Box>
              <Button
                startIcon={<Help />}
                onClick={() => setOpenDialog(true)}
                size="small"
              >
                Learn More
              </Button>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Abunfi uses rate limiting to prevent abuse and ensure fair access for all users.
            </Typography>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <Security sx={{ mr: 1, fontSize: 32 }} />
              <Typography variant="h5">Security & Anti-Abuse Protection</Typography>
            </Box>
            {educationContent}
          </CardContent>
        </Card>
      </motion.div>

      <Dialog
        open={openDialog}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        scroll="paper"
      >
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <Security sx={{ mr: 1 }} />
            Security & Anti-Abuse Protection
          </Box>
        </DialogTitle>
        <DialogContent>
          {educationContent}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AntiAbuseEducation;
