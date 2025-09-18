import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  LinearProgress,
  Grid,
  Alert,
  Button,
  Tooltip,
  IconButton,
  Collapse
} from '@mui/material';
import {
  Info,
  Schedule,
  Savings,
  TrendingUp,
  ExpandMore,
  ExpandLess,
  LocalGasStation,
  Group,
  Timer
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { vaultService } from '../services/vaultService';

const BatchingSystemInfo = ({ depositAmount, onGasSavingsUpdate }) => {
  const [batchingConfig, setBatchingConfig] = useState(null);
  const [pendingAllocations, setPendingAllocations] = useState(null);
  const [gasSavings, setGasSavings] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBatchingData();
  }, []);

  useEffect(() => {
    if (depositAmount && parseFloat(depositAmount) > 0) {
      estimateGasSavings();
    }
  }, [depositAmount]);

  const loadBatchingData = async () => {
    try {
      const [config, pending] = await Promise.all([
        vaultService.getBatchingConfig(),
        vaultService.getPendingAllocations()
      ]);
      setBatchingConfig(config);
      setPendingAllocations(pending);
    } catch (error) {
      console.error('Failed to load batching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const estimateGasSavings = async () => {
    try {
      const savings = await vaultService.getGasSavingsEstimate(depositAmount);
      setGasSavings(savings);
      if (onGasSavingsUpdate) {
        onGasSavingsUpdate(savings);
      }
    } catch (error) {
      console.error('Failed to estimate gas savings:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getBatchProgress = () => {
    if (!batchingConfig || !pendingAllocations) return 0;
    return Math.min((pendingAllocations.total / batchingConfig.threshold) * 100, 100);
  };

  const getTimeUntilNextBatch = () => {
    if (!batchingConfig) return 0;
    const timeSinceLastAllocation = Date.now() / 1000 - batchingConfig.lastAllocationTime;
    const timeRemaining = Math.max(0, batchingConfig.interval - timeSinceLastAllocation);
    return timeRemaining;
  };

  const shouldShowEmergencyBatch = () => {
    return pendingAllocations && 
           batchingConfig && 
           pendingAllocations.total >= batchingConfig.emergencyThreshold;
  };

  if (loading) {
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <LinearProgress />
          <Typography variant="body2" sx={{ mt: 1 }}>
            Loading batching information...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mb: 2, border: '1px solid', borderColor: 'primary.light' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Savings color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Smart Batching System
            </Typography>
            <Tooltip title="Batching reduces gas costs by grouping multiple deposits together">
              <IconButton size="small">
                <Info fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          <IconButton onClick={() => setExpanded(!expanded)}>
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>

        {/* Gas Savings Alert */}
        {gasSavings && (
          <Alert 
            severity="success" 
            sx={{ mb: 2 }}
            icon={<LocalGasStation />}
          >
            <Typography variant="body2">
              <strong>Gas Savings:</strong> Your deposit will save approximately{' '}
              <strong>${gasSavings.savedAmount}</strong> in gas fees through batching!
            </Typography>
          </Alert>
        )}

        {/* Emergency Batch Alert */}
        {shouldShowEmergencyBatch() && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Immediate Allocation:</strong> Large deposit volume detected. 
              Your funds will be allocated immediately for optimal efficiency.
            </Typography>
          </Alert>
        )}

        {/* Batch Progress */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Batch Progress
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatCurrency(pendingAllocations?.total || 0)} / {formatCurrency(batchingConfig?.threshold || 0)}
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={getBatchProgress()} 
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        {/* Quick Stats */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                {pendingAllocations?.userCount || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Users in Batch
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                {formatTime(getTimeUntilNextBatch())}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Next Batch
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                ~{gasSavings?.percentageSaved || 0}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Gas Saved
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Expanded Details */}
        <Collapse in={expanded}>
          <Box sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
              How Batching Works
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Group fontSize="small" color="primary" />
                  <Typography variant="body2">
                    <strong>Deposit Pooling:</strong> Your deposit joins others in a batch
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Timer fontSize="small" color="primary" />
                  <Typography variant="body2">
                    <strong>Smart Timing:</strong> Batches execute when optimal
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <LocalGasStation fontSize="small" color="primary" />
                  <Typography variant="body2">
                    <strong>Gas Efficiency:</strong> Shared transaction costs
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <TrendingUp fontSize="small" color="primary" />
                  <Typography variant="body2">
                    <strong>Yield Optimization:</strong> Risk-based allocation
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {/* Risk Level Distribution */}
            {pendingAllocations && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                  Current Batch Composition
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={4}>
                    <Chip 
                      label={`Low Risk: ${formatCurrency(pendingAllocations.lowRisk || 0)}`}
                      color="success"
                      variant="outlined"
                      size="small"
                      sx={{ width: '100%' }}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <Chip 
                      label={`Medium Risk: ${formatCurrency(pendingAllocations.mediumRisk || 0)}`}
                      color="warning"
                      variant="outlined"
                      size="small"
                      sx={{ width: '100%' }}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <Chip 
                      label={`High Risk: ${formatCurrency(pendingAllocations.highRisk || 0)}`}
                      color="error"
                      variant="outlined"
                      size="small"
                      sx={{ width: '100%' }}
                    />
                  </Grid>
                </Grid>
              </Box>
            )}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default BatchingSystemInfo;
