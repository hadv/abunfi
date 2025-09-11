import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Grid,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  TrendingUp,
  Security,
  Speed,
  AutoAwesome,
  Info
} from '@mui/icons-material';

const UniswapV4StrategyCard = ({ strategy }) => {
  const {
    name,
    apy,
    totalAssets,
    allocation,
    riskScore,
    isActive
  } = strategy;

  // Mock additional V4-specific data
  const v4Features = {
    rangeUtilization: 87.5, // Percentage of time in optimal range
    feesCollected24h: 2450.75, // USD
    rebalanceCount: 3, // Last 30 days
    gasEfficiency: 45, // Percentage improvement over V3
    currentRange: {
      lower: 0.9985,
      upper: 1.0015,
      current: 0.9998
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value) => {
    return `${value.toFixed(2)}%`;
  };

  const getRiskColor = (score) => {
    if (score <= 20) return '#4caf50'; // Green
    if (score <= 40) return '#ff9800'; // Orange
    return '#f44336'; // Red
  };

  const getRiskLabel = (score) => {
    if (score <= 20) return 'Low';
    if (score <= 40) return 'Medium';
    return 'High';
  };

  return (
    <Card 
      sx={{ 
        height: '100%',
        background: 'linear-gradient(135deg, #9c27b0 0%, #673ab7 100%)',
        color: 'white',
        position: 'relative',
        overflow: 'visible'
      }}
    >
      {/* V4 Badge */}
      <Chip
        label="V4"
        size="small"
        sx={{
          position: 'absolute',
          top: -8,
          right: 16,
          background: '#ff6f00',
          color: 'white',
          fontWeight: 'bold',
          zIndex: 1
        }}
      />

      {/* Kyber Badge */}
      <Chip
        label="Kyber Hook"
        size="small"
        sx={{
          position: 'absolute',
          top: -8,
          right: 70,
          background: '#00d4aa',
          color: 'white',
          fontWeight: 'bold',
          zIndex: 1,
          fontSize: '0.65rem'
        }}
      />

      <CardContent>
        {/* Header */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" component="h3" sx={{ fontWeight: 600, mb: 1 }}>
            {name}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={`${formatPercentage(apy)} APY`}
              size="small"
              sx={{ 
                background: 'rgba(255,255,255,0.2)', 
                color: 'white',
                fontWeight: 'bold'
              }}
            />
            <Chip
              label={`${getRiskLabel(riskScore)} Risk`}
              size="small"
              sx={{ 
                background: getRiskColor(riskScore),
                color: 'white'
              }}
            />
            {isActive && (
              <Chip
                label="Active"
                size="small"
                sx={{ 
                  background: '#4caf50',
                  color: 'white'
                }}
              />
            )}
          </Box>
        </Box>

        {/* Key Metrics */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Total Assets
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {formatCurrency(totalAssets)}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Allocation
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {formatPercentage(allocation)}
            </Typography>
          </Grid>
        </Grid>

        {/* V4 Specific Features */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            V4 Features
          </Typography>
          
          {/* Range Utilization */}
          <Box sx={{ mb: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Range Utilization
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {formatPercentage(v4Features.rangeUtilization)}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={v4Features.rangeUtilization}
              sx={{
                height: 6,
                borderRadius: 3,
                backgroundColor: 'rgba(255,255,255,0.2)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: '#4caf50',
                  borderRadius: 3
                }
              }}
            />
          </Box>

          {/* Current Range */}
          <Box sx={{ mb: 1.5 }}>
            <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>
              Current Range: {v4Features.currentRange.lower} - {v4Features.currentRange.upper}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Current Price: {v4Features.currentRange.current}
            </Typography>
          </Box>
        </Box>

        {/* Performance Indicators */}
        <Grid container spacing={1}>
          <Grid item xs={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <TrendingUp sx={{ fontSize: 16, color: '#4caf50' }} />
              <Box>
                <Typography variant="caption" sx={{ opacity: 0.8, display: 'block' }}>
                  24h Fees
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  ${v4Features.feesCollected24h.toFixed(2)}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Speed sx={{ fontSize: 16, color: '#ff9800' }} />
              <Box>
                <Typography variant="caption" sx={{ opacity: 0.8, display: 'block' }}>
                  Gas Efficiency
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  +{v4Features.gasEfficiency}%
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* Additional Features */}
        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Tooltip title="Powered by Kyber's FairFlow hook technology for optimal MEV protection and fair pricing">
            <Chip
              icon={<AutoAwesome sx={{ fontSize: 14 }} />}
              label="Kyber FairFlow"
              size="small"
              variant="outlined"
              sx={{
                borderColor: '#00d4aa',
                color: '#00d4aa',
                backgroundColor: 'rgba(0, 212, 170, 0.1)',
                '& .MuiChip-icon': { color: '#00d4aa' }
              }}
            />
          </Tooltip>
          <Tooltip title="Automated rebalancing based on market conditions">
            <Chip
              icon={<AutoAwesome sx={{ fontSize: 14 }} />}
              label="Auto-Rebalance"
              size="small"
              variant="outlined"
              sx={{
                borderColor: 'rgba(255,255,255,0.5)',
                color: 'white',
                '& .MuiChip-icon': { color: 'white' }
              }}
            />
          </Tooltip>
          <Tooltip title="Advanced security features and risk management">
            <Chip
              icon={<Security sx={{ fontSize: 14 }} />}
              label="Secure"
              size="small"
              variant="outlined"
              sx={{
                borderColor: 'rgba(255,255,255,0.5)',
                color: 'white',
                '& .MuiChip-icon': { color: 'white' }
              }}
            />
          </Tooltip>
        </Box>
      </CardContent>
    </Card>
  );
};

export default UniswapV4StrategyCard;
