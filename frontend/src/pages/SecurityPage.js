import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import { Security } from '@mui/icons-material';
import SecurityDashboard from '../components/SecurityDashboard';

const SecurityPage = () => {
  return (
    <Container maxWidth="lg">
      <Box py={3}>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <Security color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h4" component="h1">
            Security Center
          </Typography>
        </Box>
        
        <Typography variant="body1" color="text.secondary" mb={4}>
          Manage your account security, passkeys, and view security achievements.
        </Typography>
        
        <SecurityDashboard />
      </Box>
    </Container>
  );
};

export default SecurityPage;
