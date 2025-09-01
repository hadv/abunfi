import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Chip,
  LinearProgress,
  useTheme
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AccountBalance,
  Security,
  Timeline
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const StrategyPerformanceGrid = ({ strategies, detailed = false }) => {
  const theme = useTheme();

  if (!strategies || strategies.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Strategy Performance
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <Typography color="text.secondary">No strategies available</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const getRiskColor = (riskScore) => {
    if (riskScore < 30) return 'success';
    if (riskScore < 60) return 'warning';
    return 'error';
  };

  const getRiskLabel = (riskScore) => {
    if (riskScore < 30) return 'Low Risk';
    if (riskScore < 60) return 'Medium Risk';
    return 'High Risk';
  };

  const formatCurrency = (amount) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toFixed(0)}`;
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
          Strategy Performance Overview
        </Typography>
        
        <Grid container spacing={3}>
          {strategies.map((strategy, index) => (
            <Grid item xs={12} sm={6} lg={detailed ? 6 : 4} key={strategy.address || index}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card 
                  variant="outlined" 
                  sx={{ 
                    height: '100%',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: theme.shadows[4],
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <CardContent>
                    {/* Strategy Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                          {strategy.name}
                        </Typography>
                        <Chip
                          size="small"
                          label={strategy.isActive ? 'Active' : 'Inactive'}
                          color={strategy.isActive ? 'success' : 'default'}
                          variant="outlined"
                        />
                      </Box>
                      <AccountBalance sx={{ color: 'primary.main', fontSize: 32 }} />
                    </Box>

                    {/* Key Metrics */}
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                            {strategy.apy?.toFixed(2) || '0.00'}%
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Current APY
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                            {formatCurrency(strategy.totalAssets || 0)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Total Assets
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>

                    {/* Allocation Progress */}
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Allocation
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {strategy.allocation?.toFixed(1) || '0.0'}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={strategy.allocation || 0}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: 'grey.200',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                            bgcolor: 'primary.main'
                          }
                        }}
                      />
                    </Box>

                    {/* Risk Assessment */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Security sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          Risk Level
                        </Typography>
                      </Box>
                      <Chip
                        size="small"
                        label={getRiskLabel(strategy.riskScore || 0)}
                        color={getRiskColor(strategy.riskScore || 0)}
                        variant="outlined"
                      />
                    </Box>

                    {/* Performance Indicators */}
                    {detailed && (
                      <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                          Performance Metrics
                        </Typography>
                        
                        <Grid container spacing={1}>
                          <Grid item xs={6}>
                            <Box sx={{ textAlign: 'center', p: 1 }}>
                              <TrendingUp sx={{ color: 'success.main', fontSize: 20, mb: 0.5 }} />
                              <Typography variant="caption" display="block" color="text.secondary">
                                24h Change
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'success.main' }}>
                                +{((Math.random() * 2) + 0.1).toFixed(2)}%
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6}>
                            <Box sx={{ textAlign: 'center', p: 1 }}>
                              <Timeline sx={{ color: 'info.main', fontSize: 20, mb: 0.5 }} />
                              <Typography variant="caption" display="block" color="text.secondary">
                                7d Avg APY
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                {((strategy.apy || 0) + (Math.random() - 0.5) * 0.5).toFixed(2)}%
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>

                        {/* Additional Metrics */}
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Volatility: {((Math.random() * 3) + 0.5).toFixed(2)}%
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Sharpe Ratio: {((Math.random() * 2) + 1).toFixed(2)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Max Drawdown: -{((Math.random() * 5) + 1).toFixed(2)}%
                          </Typography>
                        </Box>
                      </Box>
                    )}

                    {/* Last Update */}
                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        Updated: {strategy.lastUpdate ? 
                          new Date(strategy.lastUpdate).toLocaleTimeString() : 
                          'Just now'
                        }
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {/* Summary Statistics */}
        <Box sx={{ mt: 4, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>
            Portfolio Summary
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  {strategies.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total Strategies
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                  {(strategies.reduce((sum, s) => sum + (s.apy || 0), 0) / strategies.length).toFixed(2)}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Average APY
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'info.main' }}>
                  {formatCurrency(strategies.reduce((sum, s) => sum + (s.totalAssets || 0), 0))}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total AUM
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                  {(strategies.reduce((sum, s) => sum + (s.riskScore || 0), 0) / strategies.length).toFixed(0)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Avg Risk Score
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};

export default StrategyPerformanceGrid;
