import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  useTheme
} from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { motion } from 'framer-motion';

const CompoundInterestChart = ({ data }) => {
  const theme = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState('1y');
  const [principal, setPrincipal] = useState(10000);

  if (!data || !data.calculations) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Compound Interest Projections
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
            <Typography color="text.secondary">No data available</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const { calculations, period, principal: currentPrincipal } = data;

  // Prepare chart data by combining all strategy projections
  const chartData = [];
  if (calculations.length > 0) {
    const maxLength = Math.max(...calculations.map(calc => calc.projections.length));
    
    for (let i = 0; i < maxLength; i++) {
      const dataPoint = { period: i };
      
      calculations.forEach(calc => {
        if (calc.projections[i]) {
          dataPoint[calc.strategyName] = calc.projections[i].value;
        }
      });
      
      chartData.push(dataPoint);
    }
  }

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
            Month {label}
          </Typography>
          {payload.map((entry, index) => (
            <Typography key={index} variant="body2" sx={{ color: entry.color }}>
              {entry.dataKey}: ${entry.value.toLocaleString()}
            </Typography>
          ))}
        </Box>
      );
    }
    return null;
  };

  // Generate colors for each strategy
  const colors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.info.main
  ];

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
              Compound Interest Projections
            </Typography>
            <Chip
              label={`Principal: $${currentPrincipal.toLocaleString()}`}
              color="primary"
              variant="outlined"
            />
          </Box>

          {/* Controls */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Period</InputLabel>
                <Select
                  value={selectedPeriod}
                  label="Period"
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                >
                  <MenuItem value="3m">3 Months</MenuItem>
                  <MenuItem value="6m">6 Months</MenuItem>
                  <MenuItem value="1y">1 Year</MenuItem>
                  <MenuItem value="2y">2 Years</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Principal Amount ($)"
                type="number"
                value={principal}
                onChange={(e) => setPrincipal(Number(e.target.value))}
                inputProps={{ min: 1000, max: 1000000, step: 1000 }}
              />
            </Grid>
          </Grid>

          {/* Chart */}
          <Box sx={{ height: 400, mb: 3 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="period" 
                  label={{ value: 'Months', position: 'insideBottom', offset: -5 }}
                />
                <YAxis 
                  label={{ value: 'Value ($)', angle: -90, position: 'insideLeft' }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {calculations.map((calc, index) => (
                  <Line
                    key={calc.strategyName}
                    type="monotone"
                    dataKey={calc.strategyName}
                    stroke={colors[index % colors.length]}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </Box>

          {/* Strategy Comparison Table */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
              Strategy Comparison
            </Typography>
            <Grid container spacing={2}>
              {calculations.map((calc, index) => (
                <Grid item xs={12} sm={6} md={4} key={calc.strategyName}>
                  <Box
                    sx={{
                      p: 2,
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      bgcolor: 'background.default'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          bgcolor: colors[index % colors.length]
                        }}
                      />
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        {calc.strategyName}
                      </Typography>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      APY: {calc.apy.toFixed(2)}%
                    </Typography>
                    
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      Final Value: ${calc.projections[calc.projections.length - 1]?.value.toLocaleString()}
                    </Typography>
                    
                    <Typography variant="body2" color="success.main" sx={{ fontWeight: 'medium' }}>
                      Total Return: ${calc.totalReturn.toLocaleString()}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary">
                      ROI: {calc.roi.toFixed(1)}%
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Summary */}
          <Box sx={{ mt: 3, p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Key Insights
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2">
                  <strong>Best Performer:</strong> {
                    calculations.reduce((best, current) => 
                      current.roi > best.roi ? current : best
                    ).strategyName
                  }
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2">
                  <strong>Highest APY:</strong> {
                    Math.max(...calculations.map(c => c.apy)).toFixed(2)
                  }%
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2">
                  <strong>Average ROI:</strong> {
                    (calculations.reduce((sum, c) => sum + c.roi, 0) / calculations.length).toFixed(1)
                  }%
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2">
                  <strong>Period:</strong> {period === '1y' ? '1 Year' : period === '6m' ? '6 Months' : period}
                </Typography>
              </Grid>
            </Grid>
          </Box>

          {/* Last Update */}
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Projections based on current APY rates • Updated: {new Date().toLocaleString()}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CompoundInterestChart;
