import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  useTheme
} from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { motion } from 'framer-motion';

const APYComparisonChart = ({ strategies }) => {
  const theme = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  if (!strategies || strategies.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            APY Comparison
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
            <Typography color="text.secondary">No strategy data available</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Generate mock historical APY data for demonstration
  const generateHistoricalData = (strategies, days) => {
    const data = [];
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - i));
      
      const dataPoint = {
        date: date.toISOString().split('T')[0],
        timestamp: date.getTime()
      };
      
      strategies.forEach(strategy => {
        // Generate realistic APY variations
        const baseAPY = strategy.apy || 8;
        const variation = (Math.random() - 0.5) * 2; // ±1% variation
        const trend = Math.sin((i / days) * Math.PI * 2) * 0.5; // Slight cyclical trend
        dataPoint[strategy.name] = Math.max(0, baseAPY + variation + trend);
      });
      
      data.push(dataPoint);
    }
    
    return data;
  };

  const getDaysFromPeriod = (period) => {
    switch (period) {
      case '7d': return 7;
      case '30d': return 30;
      case '90d': return 90;
      default: return 30;
    }
  };

  const chartData = generateHistoricalData(strategies, getDaysFromPeriod(selectedPeriod));

  // Generate colors for each strategy
  const colors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.info.main
  ];

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            bgcolor: 'background.paper',
            p: 2,
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            boxShadow: 2
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
            {new Date(label).toLocaleDateString()}
          </Typography>
          {payload.map((entry, index) => (
            <Typography key={index} variant="body2" sx={{ color: entry.color }}>
              {entry.dataKey}: {entry.value.toFixed(2)}%
            </Typography>
          ))}
        </Box>
      );
    }
    return null;
  };

  // Calculate statistics
  const calculateStats = (strategies, data) => {
    return strategies.map(strategy => {
      const values = data.map(d => d[strategy.name]).filter(v => v !== undefined);
      const current = values[values.length - 1] || 0;
      const previous = values[values.length - 2] || current;
      const change = current - previous;
      const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
      const max = Math.max(...values);
      const min = Math.min(...values);
      
      return {
        name: strategy.name,
        current,
        change,
        avg,
        max,
        min,
        volatility: Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length)
      };
    });
  };

  const stats = calculateStats(strategies, chartData);

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
              APY Comparison Over Time
            </Typography>
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Period</InputLabel>
              <Select
                value={selectedPeriod}
                label="Period"
                onChange={(e) => setSelectedPeriod(e.target.value)}
              >
                <MenuItem value="7d">7 Days</MenuItem>
                <MenuItem value="30d">30 Days</MenuItem>
                <MenuItem value="90d">90 Days</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Chart */}
          <Box sx={{ height: 400, mb: 3 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date"
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis 
                  label={{ value: 'APY (%)', angle: -90, position: 'insideLeft' }}
                  domain={['dataMin - 0.5', 'dataMax + 0.5']}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {strategies.map((strategy, index) => (
                  <Line
                    key={strategy.name}
                    type="monotone"
                    dataKey={strategy.name}
                    stroke={colors[index % colors.length]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </Box>

          {/* Statistics Table */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>
              Performance Statistics ({selectedPeriod})
            </Typography>
            
            <Box sx={{ overflowX: 'auto' }}>
              <Box sx={{ minWidth: 600 }}>
                {/* Header */}
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 1fr',
                  gap: 1,
                  p: 1,
                  bgcolor: 'background.default',
                  borderRadius: 1,
                  mb: 1,
                  fontWeight: 'bold'
                }}>
                  <Typography variant="caption" sx={{ fontWeight: 'bold' }}>Strategy</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 'bold', textAlign: 'center' }}>Current</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 'bold', textAlign: 'center' }}>Change</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 'bold', textAlign: 'center' }}>Average</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 'bold', textAlign: 'center' }}>Max</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 'bold', textAlign: 'center' }}>Min</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 'bold', textAlign: 'center' }}>Volatility</Typography>
                </Box>

                {/* Data Rows */}
                {stats.map((stat, index) => (
                  <Box key={stat.name} sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 1fr',
                    gap: 1,
                    p: 1,
                    borderBottom: index < stats.length - 1 ? 1 : 0,
                    borderColor: 'divider',
                    alignItems: 'center'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          bgcolor: colors[index % colors.length]
                        }}
                      />
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {stat.name}
                      </Typography>
                    </Box>
                    
                    <Typography variant="body2" sx={{ textAlign: 'center', fontWeight: 'medium' }}>
                      {stat.current.toFixed(2)}%
                    </Typography>
                    
                    <Box sx={{ textAlign: 'center' }}>
                      <Chip
                        size="small"
                        label={`${stat.change >= 0 ? '+' : ''}${stat.change.toFixed(2)}%`}
                        color={stat.change >= 0 ? 'success' : 'error'}
                        variant="outlined"
                      />
                    </Box>
                    
                    <Typography variant="body2" sx={{ textAlign: 'center' }}>
                      {stat.avg.toFixed(2)}%
                    </Typography>
                    
                    <Typography variant="body2" sx={{ textAlign: 'center', color: 'success.main' }}>
                      {stat.max.toFixed(2)}%
                    </Typography>
                    
                    <Typography variant="body2" sx={{ textAlign: 'center', color: 'error.main' }}>
                      {stat.min.toFixed(2)}%
                    </Typography>
                    
                    <Typography variant="body2" sx={{ textAlign: 'center' }}>
                      {stat.volatility.toFixed(2)}%
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>

          {/* Key Insights */}
          <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Key Insights
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1 }}>
              <Typography variant="body2">
                <strong>Best Performer:</strong> {stats.reduce((best, current) => 
                  current.current > best.current ? current : best
                ).name}
              </Typography>
              <Typography variant="body2">
                <strong>Most Stable:</strong> {stats.reduce((stable, current) => 
                  current.volatility < stable.volatility ? current : stable
                ).name}
              </Typography>
              <Typography variant="body2">
                <strong>Highest Peak:</strong> {Math.max(...stats.map(s => s.max)).toFixed(2)}%
              </Typography>
              <Typography variant="body2">
                <strong>Portfolio Avg:</strong> {(stats.reduce((sum, s) => sum + s.current, 0) / stats.length).toFixed(2)}%
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default APYComparisonChart;
