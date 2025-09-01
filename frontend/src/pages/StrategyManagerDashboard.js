import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  IconButton,
  useTheme,
  Alert,
  CircularProgress,
  Tabs,
  Tab
} from '@mui/material';
import {
  Refresh,
  TrendingUp,
  AccountBalance,
  PieChart,
  Timeline,
  Settings,
  Notifications
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useUser } from '../contexts/UserContext';
import { useWebSocket } from '../hooks/useWebSocket';
import FundsDistributionChart from '../components/strategy/FundsDistributionChart';
import CompoundInterestChart from '../components/strategy/CompoundInterestChart';
import StrategyPerformanceGrid from '../components/strategy/StrategyPerformanceGrid';
import APYComparisonChart from '../components/strategy/APYComparisonChart';
import AllocationControls from '../components/strategy/AllocationControls';
import strategyManagerService from '../services/strategyManagerService';
import toast from 'react-hot-toast';

const StrategyManagerDashboard = () => {
  const theme = useTheme();
  const { user } = useUser();
  const [tabValue, setTabValue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Dashboard data state
  const [overview, setOverview] = useState(null);
  const [fundsDistribution, setFundsDistribution] = useState(null);
  const [strategyPerformance, setStrategyPerformance] = useState(null);
  const [compoundInterest, setCompoundInterest] = useState(null);

  // WebSocket connection for real-time updates (temporarily disabled for debugging)
  const { isConnected, lastMessage } = useWebSocket('/ws', {
    onMessage: handleWebSocketMessage,
    enabled: false // Temporarily disabled to prevent reconnection loop
  });

  // Check if user has access
  const hasAccess = user?.role === 'strategy_manager' || user?.role === 'admin';

  useEffect(() => {
    if (hasAccess) {
      loadInitialData();
    }
  }, [hasAccess]);

  // Handle WebSocket messages for real-time updates
  function handleWebSocketMessage(message) {
    try {
      const data = JSON.parse(message.data);
      
      switch (data.type) {
        case 'strategy_update':
          updateStrategyData(data.data);
          break;
        case 'funds_distribution_update':
          setFundsDistribution(data.data);
          break;
        case 'compound_interest_update':
          setCompoundInterest(data.data);
          break;
        case 'initial_strategy_data':
          updateStrategyData(data.data);
          break;
        default:
          console.log('Unknown WebSocket message type:', data.type);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  function updateStrategyData(data) {
    if (data.strategies) {
      setOverview(prev => ({
        ...prev,
        strategies: data.strategies,
        totalAssets: data.totalAssets,
        totalAPY: data.averageAPY,
        lastUpdate: data.lastUpdate
      }));
    }
  }

  async function loadInitialData() {
    setIsLoading(true);
    setError(null);

    try {
      const [overviewData, distributionData, performanceData, compoundData] = await Promise.all([
        strategyManagerService.getStrategiesOverview(),
        strategyManagerService.getFundsDistribution(),
        strategyManagerService.getStrategyPerformance('30d'),
        strategyManagerService.getCompoundInterest('1y', 10000)
      ]);

      setOverview(overviewData.data);
      setFundsDistribution(distributionData.data);
      setStrategyPerformance(performanceData.data);
      setCompoundInterest(compoundData.data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRefresh() {
    setIsRefreshing(true);
    await loadInitialData();
    setIsRefreshing(false);
    toast.success('Dashboard data refreshed');
  }

  function handleTabChange(event, newValue) {
    setTabValue(newValue);
  }

  if (!hasAccess) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Alert severity="error" sx={{ maxWidth: 600, mx: 'auto' }}>
          <Typography variant="h6" gutterBottom>
            Access Denied
          </Typography>
          <Typography>
            You don't have permission to access the Strategy Manager Dashboard. 
            This area is restricted to strategy managers and administrators only.
          </Typography>
        </Alert>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={loadInitialData}>
            Retry
          </Button>
        }>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
            Strategy Manager Dashboard 📊
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Real-time monitoring and management of DeFi strategies
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {/* Connection Status */}
          <Chip
            icon={<Notifications />}
            label={isConnected ? 'Live Updates' : 'Disconnected'}
            color={isConnected ? 'success' : 'error'}
            variant="outlined"
          />
          
          <IconButton 
            onClick={handleRefresh} 
            disabled={isRefreshing}
            sx={{ bgcolor: 'background.paper' }}
          >
            <Refresh sx={{ 
              animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' }
              }
            }} />
          </IconButton>
        </Box>
      </Box>

      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <AccountBalance sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  ${(overview?.totalAssets / 1000000).toFixed(1)}M
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Assets Under Management
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <TrendingUp sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                  {overview?.totalAPY?.toFixed(2)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Average APY
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <PieChart sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'info.main' }}>
                  {overview?.activeStrategies}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Strategies
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Timeline sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                  {overview?.strategiesCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Strategies
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Tabs for different views */}
      <Card sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Overview" />
          <Tab label="Fund Distribution" />
          <Tab label="Performance Analytics" />
          <Tab label="Compound Interest" />
          <Tab label="Allocation Management" />
        </Tabs>
      </Card>

      {/* Tab Content */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <StrategyPerformanceGrid strategies={overview?.strategies || []} />
          </Grid>
          <Grid item xs={12} lg={4}>
            <FundsDistributionChart data={fundsDistribution} />
          </Grid>
        </Grid>
      )}

      {tabValue === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FundsDistributionChart data={fundsDistribution} />
          </Grid>
          <Grid item xs={12} md={6}>
            <APYComparisonChart strategies={overview?.strategies || []} />
          </Grid>
        </Grid>
      )}

      {tabValue === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <APYComparisonChart strategies={overview?.strategies || []} />
          </Grid>
          <Grid item xs={12}>
            <StrategyPerformanceGrid strategies={overview?.strategies || []} detailed />
          </Grid>
        </Grid>
      )}

      {tabValue === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <CompoundInterestChart data={compoundInterest} />
          </Grid>
        </Grid>
      )}

      {tabValue === 4 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <AllocationControls strategies={overview?.strategies || []} />
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default StrategyManagerDashboard;
