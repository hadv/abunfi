import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Slider,
  TextField,
  Button,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  useTheme
} from '@mui/material';
import {
  Save,
  Refresh,
  Warning,
  CheckCircle,
  Settings
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const AllocationControls = ({ strategies }) => {
  const theme = useTheme();
  const [allocations, setAllocations] = useState(() => {
    // Initialize with current allocations
    const initial = {};
    strategies.forEach(strategy => {
      initial[strategy.name] = strategy.allocation || 0;
    });
    return initial;
  });
  
  const [isRebalancing, setIsRebalancing] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingChanges, setPendingChanges] = useState(false);

  if (!strategies || strategies.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Allocation Management
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <Typography color="text.secondary">No strategies available</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const totalAllocation = Object.values(allocations).reduce((sum, val) => sum + val, 0);
  const isValidAllocation = Math.abs(totalAllocation - 100) < 0.1;

  const handleAllocationChange = (strategyName, newValue) => {
    setAllocations(prev => ({
      ...prev,
      [strategyName]: newValue
    }));
    setPendingChanges(true);
  };

  const handleAutoRebalance = () => {
    const equalAllocation = 100 / strategies.length;
    const newAllocations = {};
    strategies.forEach(strategy => {
      newAllocations[strategy.name] = equalAllocation;
    });
    setAllocations(newAllocations);
    setPendingChanges(true);
    toast.success('Auto-rebalanced to equal allocations');
  };

  const handleRiskBasedRebalance = () => {
    // Allocate more to lower risk strategies
    const totalRiskScore = strategies.reduce((sum, s) => sum + (100 - (s.riskScore || 50)), 0);
    const newAllocations = {};
    
    strategies.forEach(strategy => {
      const riskWeight = (100 - (strategy.riskScore || 50)) / totalRiskScore;
      newAllocations[strategy.name] = riskWeight * 100;
    });
    
    setAllocations(newAllocations);
    setPendingChanges(true);
    toast.success('Rebalanced based on risk scores');
  };

  const handleAPYBasedRebalance = () => {
    // Allocate more to higher APY strategies
    const totalAPY = strategies.reduce((sum, s) => sum + (s.apy || 0), 0);
    const newAllocations = {};
    
    strategies.forEach(strategy => {
      const apyWeight = (strategy.apy || 0) / totalAPY;
      newAllocations[strategy.name] = apyWeight * 100;
    });
    
    setAllocations(newAllocations);
    setPendingChanges(true);
    toast.success('Rebalanced based on APY performance');
  };

  const handleSaveChanges = async () => {
    if (!isValidAllocation) {
      toast.error('Total allocation must equal 100%');
      return;
    }

    setShowConfirmDialog(true);
  };

  const confirmSaveChanges = async () => {
    setIsRebalancing(true);
    setShowConfirmDialog(false);

    try {
      // Simulate API call to update allocations
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setPendingChanges(false);
      toast.success('Allocation changes saved successfully');
    } catch (error) {
      toast.error('Failed to save allocation changes');
    } finally {
      setIsRebalancing(false);
    }
  };

  const resetChanges = () => {
    const original = {};
    strategies.forEach(strategy => {
      original[strategy.name] = strategy.allocation || 0;
    });
    setAllocations(original);
    setPendingChanges(false);
    toast.info('Changes reset to original values');
  };

  const getRiskColor = (riskScore) => {
    if (riskScore < 30) return 'success';
    if (riskScore < 60) return 'warning';
    return 'error';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Strategy Allocation Management
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip
                label={`Total: ${totalAllocation.toFixed(1)}%`}
                color={isValidAllocation ? 'success' : 'error'}
                icon={isValidAllocation ? <CheckCircle /> : <Warning />}
              />
              {pendingChanges && (
                <Chip
                  label="Unsaved Changes"
                  color="warning"
                  variant="outlined"
                />
              )}
            </Box>
          </Box>

          {/* Allocation Status */}
          {!isValidAllocation && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              Total allocation must equal 100%. Current total: {totalAllocation.toFixed(1)}%
            </Alert>
          )}

          {/* Quick Actions */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>
              Quick Rebalancing Options
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleAutoRebalance}
                  startIcon={<Settings />}
                >
                  Equal Allocation
                </Button>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleRiskBasedRebalance}
                  startIcon={<Settings />}
                >
                  Risk-Based
                </Button>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleAPYBasedRebalance}
                  startIcon={<Settings />}
                >
                  APY-Based
                </Button>
              </Grid>
            </Grid>
          </Box>

          {/* Individual Strategy Controls */}
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>
            Individual Strategy Allocations
          </Typography>
          
          <Grid container spacing={3}>
            {strategies.map((strategy, index) => (
              <Grid item xs={12} md={6} key={strategy.name}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          {strategy.name}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                          <Chip
                            size="small"
                            label={`${strategy.apy?.toFixed(1)}% APY`}
                            color="success"
                            variant="outlined"
                          />
                          <Chip
                            size="small"
                            label={`Risk: ${strategy.riskScore || 0}`}
                            color={getRiskColor(strategy.riskScore || 0)}
                            variant="outlined"
                          />
                        </Box>
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        {allocations[strategy.name]?.toFixed(1)}%
                      </Typography>
                    </Box>

                    {/* Allocation Slider */}
                    <Box sx={{ px: 1, mb: 2 }}>
                      <Slider
                        value={allocations[strategy.name] || 0}
                        onChange={(_, newValue) => handleAllocationChange(strategy.name, newValue)}
                        min={0}
                        max={100}
                        step={0.1}
                        marks={[
                          { value: 0, label: '0%' },
                          { value: 25, label: '25%' },
                          { value: 50, label: '50%' },
                          { value: 75, label: '75%' },
                          { value: 100, label: '100%' }
                        ]}
                        valueLabelDisplay="auto"
                        valueLabelFormat={(value) => `${value.toFixed(1)}%`}
                      />
                    </Box>

                    {/* Precise Input */}
                    <TextField
                      fullWidth
                      size="small"
                      label="Precise Allocation (%)"
                      type="number"
                      value={allocations[strategy.name] || 0}
                      onChange={(e) => handleAllocationChange(strategy.name, parseFloat(e.target.value) || 0)}
                      inputProps={{ min: 0, max: 100, step: 0.1 }}
                    />

                    {/* Current vs Target */}
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Current: {strategy.allocation?.toFixed(1)}% → Target: {allocations[strategy.name]?.toFixed(1)}%
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={allocations[strategy.name] || 0}
                        sx={{ mt: 1, height: 6, borderRadius: 3 }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              variant="outlined"
              onClick={resetChanges}
              startIcon={<Refresh />}
              disabled={!pendingChanges || isRebalancing}
            >
              Reset Changes
            </Button>
            
            <Button
              variant="contained"
              onClick={handleSaveChanges}
              startIcon={<Save />}
              disabled={!pendingChanges || !isValidAllocation || isRebalancing}
            >
              {isRebalancing ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>

          {/* Loading Indicator */}
          {isRebalancing && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                Updating strategy allocations...
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onClose={() => setShowConfirmDialog(false)}>
        <DialogTitle>Confirm Allocation Changes</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Are you sure you want to apply these allocation changes?
          </Typography>
          <Box sx={{ mt: 2 }}>
            {strategies.map(strategy => (
              <Box key={strategy.name} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                <Typography variant="body2">{strategy.name}:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  {strategy.allocation?.toFixed(1)}% → {allocations[strategy.name]?.toFixed(1)}%
                </Typography>
              </Box>
            ))}
          </Box>
          <Alert severity="info" sx={{ mt: 2 }}>
            This action will trigger a rebalancing of funds across all strategies.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmDialog(false)}>Cancel</Button>
          <Button onClick={confirmSaveChanges} variant="contained">
            Confirm Changes
          </Button>
        </DialogActions>
      </Dialog>
    </motion.div>
  );
};

export default AllocationControls;
