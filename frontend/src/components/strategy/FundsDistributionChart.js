import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  useTheme
} from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { motion } from 'framer-motion';

const FundsDistributionChart = ({ data }) => {
  const theme = useTheme();

  if (!data || !data.distribution) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Funds Distribution
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
            <Typography color="text.secondary">No data available</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const { distribution, totalValue, lastUpdate } = data;

  // Custom tooltip for the pie chart
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
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
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            {data.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Value: ${(data.value / 1000000).toFixed(2)}M
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Percentage: {data.percentage.toFixed(1)}%
          </Typography>
          <Typography variant="body2" color="text.secondary">
            APY: {data.apy.toFixed(2)}%
          </Typography>
          <Chip
            size="small"
            label={`Risk: ${data.riskScore}`}
            color={data.riskScore < 30 ? 'success' : data.riskScore < 60 ? 'warning' : 'error'}
            sx={{ mt: 1 }}
          />
        </Box>
      );
    }
    return null;
  };

  // Custom label function
  const renderLabel = (entry) => {
    return `${entry.percentage.toFixed(1)}%`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Funds Distribution
            </Typography>
            <Chip
              label={`Total: $${(totalValue / 1000000).toFixed(1)}M`}
              color="primary"
              variant="outlined"
            />
          </Box>

          <Box sx={{ height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderLabel}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={800}
                >
                  {distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value, entry) => (
                    <span style={{ color: entry.color, fontWeight: 'bold' }}>
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </Box>

          {/* Strategy Details */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
              Strategy Details
            </Typography>
            {distribution.map((strategy, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  py: 1,
                  borderBottom: index < distribution.length - 1 ? 1 : 0,
                  borderColor: 'divider'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      bgcolor: strategy.color
                    }}
                  />
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    {strategy.name}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Chip
                    size="small"
                    label={`${strategy.apy.toFixed(1)}% APY`}
                    color="success"
                    variant="outlined"
                  />
                  <Chip
                    size="small"
                    label={`Risk: ${strategy.riskScore}`}
                    color={strategy.riskScore < 30 ? 'success' : strategy.riskScore < 60 ? 'warning' : 'error'}
                    variant="outlined"
                  />
                </Box>
              </Box>
            ))}
          </Box>

          {/* Last Update */}
          {lastUpdate && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Last updated: {new Date(lastUpdate).toLocaleString()}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FundsDistributionChart;
