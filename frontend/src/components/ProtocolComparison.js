import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  IconButton,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  TrendingUp,
  Security,
  Speed,
  AccountBalance,
  Info,
  Refresh
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const ProtocolComparison = ({ showDetailed = false }) => {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Mock data for protocols
  const [protocolData, setProtocolData] = useState([
    {
      name: 'Aave',
      logo: '🏦',
      apy: 7.8,
      tvl: '12.5B',
      allocation: 60,
      balance: 750000,
      riskScore: 25, // Lower is safer
      liquidityScore: 95,
      securityScore: 98,
      features: ['Flash Loans', 'Stable Rates', 'Credit Delegation'],
      pros: ['Highest TVL', 'Battle-tested', 'Multiple collateral types'],
      cons: ['Higher gas fees', 'Complex interface'],
      lastDayChange: 0.2,
      volume24h: '2.1B'
    },
    {
      name: 'Compound',
      logo: '🔷',
      apy: 8.9,
      tvl: '8.2B',
      allocation: 40,
      balance: 500000,
      riskScore: 30,
      liquidityScore: 88,
      securityScore: 95,
      features: ['Governance Token', 'Algorithmic Rates', 'cToken System'],
      pros: ['Higher APY', 'Simple interface', 'Pioneer protocol'],
      cons: ['Lower liquidity', 'Governance risks'],
      lastDayChange: -0.1,
      volume24h: '1.8B'
    }
  ]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        // Fetch real-time APY data from DeFi protocols
        // TODO: Implement when backend API endpoints are ready
        // Example: fetchProtocolAPYs().then(data => setProtocolData(data));
        // For now, using placeholder data with small variations
        setProtocolData(prev => prev.map(protocol => ({
          ...protocol,
          apy: protocol.apy + (Math.random() - 0.5) * 0.2,
          lastDayChange: (Math.random() - 0.5) * 0.5
        })));
        setLastUpdated(new Date());
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const handleRefresh = () => {
    setLastUpdated(new Date());
    // Fetch updated APY data from DeFi protocols
    // TODO: Implement when backend API endpoints are ready
    // Example: fetchProtocolAPYs().then(data => setProtocolData(data));
    setProtocolData(prev => prev.map(protocol => ({
      ...protocol,
      apy: protocol.apy + (Math.random() - 0.5) * 0.1
    })));
  };

  const getRiskColor = (score) => {
    if (score <= 30) return 'success';
    if (score <= 60) return 'warning';
    return 'error';
  };

  const getAPYColor = (change) => {
    if (change > 0) return 'success.main';
    if (change < 0) return 'error.main';
    return 'text.secondary';
  };

  if (!showDetailed) {
    // Simple comparison view
    return (
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              So sánh Protocols
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Cập nhật: {lastUpdated.toLocaleTimeString()}
              </Typography>
              <IconButton size="small" onClick={handleRefresh}>
                <Refresh fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          <Grid container spacing={2}>
            {protocolData.map((protocol, index) => (
              <Grid item xs={12} sm={6} key={protocol.name}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h4" sx={{ mr: 1 }}>
                          {protocol.logo}
                        </Typography>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            {protocol.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            TVL: ${protocol.tvl}
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body2">APY</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', color: getAPYColor(protocol.lastDayChange) }}>
                              {protocol.apy.toFixed(2)}%
                            </Typography>
                            <Typography 
                              variant="caption" 
                              sx={{ color: getAPYColor(protocol.lastDayChange) }}
                            >
                              {protocol.lastDayChange > 0 ? '+' : ''}{protocol.lastDayChange.toFixed(2)}%
                            </Typography>
                          </Box>
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">Allocation</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {protocol.allocation}%
                          </Typography>
                        </Box>

                        <LinearProgress 
                          variant="determinate" 
                          value={protocol.allocation} 
                          sx={{ 
                            height: 6, 
                            borderRadius: 3,
                            backgroundColor: 'grey.200',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: index === 0 ? 'primary.main' : 'secondary.main'
                            }
                          }} 
                        />
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip 
                          label={`Risk: ${protocol.riskScore}`} 
                          size="small" 
                          color={getRiskColor(protocol.riskScore)}
                          variant="outlined"
                        />
                        <Chip 
                          label={`Liquidity: ${protocol.liquidityScore}`} 
                          size="small" 
                          color="info"
                          variant="outlined"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    );
  }

  // Detailed comparison view
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          So sánh chi tiết Protocols
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                size="small"
              />
            }
            label="Auto refresh"
          />
          <IconButton onClick={handleRefresh}>
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {protocolData.map((protocol, index) => (
          <Grid item xs={12} md={6} key={protocol.name}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h3" sx={{ mr: 2 }}>
                      {protocol.logo}
                    </Typography>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                        {protocol.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Value Locked: ${protocol.tvl}
                      </Typography>
                    </Box>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center', p: 1 }}>
                        <TrendingUp sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {protocol.apy.toFixed(2)}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Current APY
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center', p: 1 }}>
                        <AccountBalance sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {(protocol.balance / 1000000).toFixed(1)}M
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Your Balance
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Risk & Performance Scores
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip 
                        icon={<Security />}
                        label={`Security: ${protocol.securityScore}`} 
                        size="small" 
                        color="success"
                      />
                      <Chip 
                        icon={<Speed />}
                        label={`Liquidity: ${protocol.liquidityScore}`} 
                        size="small" 
                        color="info"
                      />
                      <Chip 
                        label={`Risk: ${protocol.riskScore}`} 
                        size="small" 
                        color={getRiskColor(protocol.riskScore)}
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Detailed Comparison Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Metric</TableCell>
                  {protocolData.map(protocol => (
                    <TableCell key={protocol.name} align="center">
                      {protocol.logo} {protocol.name}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell component="th" scope="row">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      Current APY
                      <Tooltip title="Annual Percentage Yield - annual interest rate">
                        <Info fontSize="small" color="action" />
                      </Tooltip>
                    </Box>
                  </TableCell>
                  {protocolData.map(protocol => (
                    <TableCell key={protocol.name} align="center">
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: getAPYColor(protocol.lastDayChange) }}>
                        {protocol.apy.toFixed(2)}%
                      </Typography>
                      <Typography variant="caption" sx={{ color: getAPYColor(protocol.lastDayChange) }}>
                        {protocol.lastDayChange > 0 ? '+' : ''}{protocol.lastDayChange.toFixed(2)}%
                      </Typography>
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row">24h Volume</TableCell>
                  {protocolData.map(protocol => (
                    <TableCell key={protocol.name} align="center">
                      ${protocol.volume24h}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row">Your Allocation</TableCell>
                  {protocolData.map(protocol => (
                    <TableCell key={protocol.name} align="center">
                      {protocol.allocation}%
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row">Risk Score</TableCell>
                  {protocolData.map(protocol => (
                    <TableCell key={protocol.name} align="center">
                      <Chip 
                        label={protocol.riskScore} 
                        size="small" 
                        color={getRiskColor(protocol.riskScore)}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ProtocolComparison;
