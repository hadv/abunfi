import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Chip,
  IconButton,
  useTheme
} from '@mui/material';
import {
  TrendingUp,
  AccountBalanceWallet,
  Add,
  Remove,
  Refresh
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useUser } from '../contexts/UserContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

// Mock data for demo
const mockPortfolio = {
  totalBalance: 1250000, // VND
  totalDeposits: 1000000,
  earnedYield: 250000,
  currentAPY: 8.2,
  shares: 1.25
};

const mockYieldHistory = [
  { date: '2024-01', yield: 50000 },
  { date: '2024-02', yield: 120000 },
  { date: '2024-03', yield: 180000 },
  { date: '2024-04', yield: 250000 },
];

const DashboardPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, portfolio, refreshPortfolio } = useUser();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [displayPortfolio, setDisplayPortfolio] = useState(mockPortfolio);

  useEffect(() => {
    // Use real portfolio data if available, otherwise use mock data
    if (portfolio) {
      setDisplayPortfolio(portfolio);
    }
  }, [portfolio]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshPortfolio();
      toast.success('Dữ liệu đã được cập nhật');
    } catch (error) {
      toast.error('Không thể cập nhật dữ liệu');
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatVND = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const yieldPercentage = displayPortfolio.totalDeposits > 0 
    ? (displayPortfolio.earnedYield / displayPortfolio.totalDeposits) * 100 
    : 0;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
            Xin chào, {user?.name || 'Bạn'}! 👋
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Đây là tổng quan về tài khoản tiết kiệm của bạn
          </Typography>
        </Box>
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

      <Grid container spacing={3}>
        {/* Portfolio Overview */}
        <Grid item xs={12} md={8}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card sx={{ mb: 3 }}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Tổng tài sản
                  </Typography>
                  <Chip 
                    label={`APY ${displayPortfolio.currentAPY}%`}
                    color="success"
                    variant="outlined"
                  />
                </Box>
                
                <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 2, color: 'primary.main' }}>
                  <CountUp
                    end={displayPortfolio.totalBalance}
                    duration={2}
                    separator=","
                    suffix=" VNĐ"
                  />
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 4, mb: 3 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Tiền gửi
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {formatVND(displayPortfolio.totalDeposits)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Lợi nhuận
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                      +{formatVND(displayPortfolio.earnedYield)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Tăng trưởng
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                      +{yieldPercentage.toFixed(2)}%
                    </Typography>
                  </Box>
                </Box>

                <LinearProgress 
                  variant="determinate" 
                  value={Math.min(yieldPercentage, 100)} 
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    bgcolor: 'grey.200',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 4,
                      bgcolor: 'success.main'
                    }
                  }}
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Yield Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
                  Lịch sử lợi nhuận
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mockYieldHistory}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value) => [formatVND(value), 'Lợi nhuận']}
                        labelFormatter={(label) => `Tháng ${label}`}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="yield" 
                        stroke={theme.palette.primary.main}
                        strokeWidth={3}
                        dot={{ fill: theme.palette.primary.main, strokeWidth: 2, r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card sx={{ mb: 3 }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
                  Hành động nhanh
                </Typography>
                
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  startIcon={<Add />}
                  onClick={() => navigate('/savings')}
                  sx={{ mb: 2, py: 1.5 }}
                >
                  Gửi tiết kiệm
                </Button>
                
                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  startIcon={<Remove />}
                  onClick={() => navigate('/savings')}
                  sx={{ mb: 2, py: 1.5 }}
                >
                  Rút tiền
                </Button>
                
                <Button
                  fullWidth
                  variant="text"
                  size="large"
                  startIcon={<AccountBalanceWallet />}
                  onClick={() => navigate('/transactions')}
                  sx={{ py: 1.5 }}
                >
                  Xem lịch sử
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card sx={{ mb: 3 }}>
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <TrendingUp sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                  {displayPortfolio.currentAPY}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Lãi suất hiện tại
                </Typography>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card>
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <AccountBalanceWallet sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  {displayPortfolio.shares.toFixed(2)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Shares sở hữu
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;
