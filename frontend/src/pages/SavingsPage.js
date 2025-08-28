import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Tabs,
  Tab,
  Alert,
  Chip,
  Divider,
  CircularProgress
} from '@mui/material';
import { Add, Remove, TrendingUp, Info } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { NumericFormat } from 'react-number-format';
import toast from 'react-hot-toast';

const SavingsPage = () => {
  const [tabValue, setTabValue] = useState(0);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawShares, setWithdrawShares] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Mock data
  const currentAPY = 8.2;
  const userShares = 1.25;
  const sharePrice = 1000000; // VND per share
  const minimumDeposit = 10000; // VND

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) < minimumDeposit) {
      toast.error(`Số tiền tối thiểu là ${minimumDeposit.toLocaleString()} VNĐ`);
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Gửi tiết kiệm thành công!');
      setDepositAmount('');
    } catch (error) {
      toast.error('Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawShares || parseFloat(withdrawShares) <= 0) {
      toast.error('Vui lòng nhập số shares hợp lệ');
      return;
    }

    if (parseFloat(withdrawShares) > userShares) {
      toast.error('Số shares vượt quá số dư hiện có');
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Rút tiền thành công!');
      setWithdrawShares('');
    } catch (error) {
      toast.error('Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setIsLoading(false);
    }
  };

  const estimatedShares = depositAmount ? (parseFloat(depositAmount) / sharePrice).toFixed(4) : '0';
  const estimatedWithdrawAmount = withdrawShares ? (parseFloat(withdrawShares) * sharePrice).toLocaleString() : '0';

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          Tiết kiệm & Rút tiền
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Gửi tiết kiệm hoặc rút tiền từ tài khoản của bạn
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Main Action Card */}
        <Grid item xs={12} md={8}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <CardContent sx={{ p: 4 }}>
                <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
                  <Tab 
                    icon={<Add />} 
                    label="Gửi tiết kiệm" 
                    iconPosition="start"
                  />
                  <Tab 
                    icon={<Remove />} 
                    label="Rút tiền" 
                    iconPosition="start"
                  />
                </Tabs>

                {/* Deposit Tab */}
                {tabValue === 0 && (
                  <Box>
                    <Alert severity="info" sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Info fontSize="small" />
                        Số tiền tối thiểu: {minimumDeposit.toLocaleString()} VNĐ (~$4)
                      </Box>
                    </Alert>

                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                      Số tiền muốn gửi
                    </Typography>

                    <NumericFormat
                      customInput={TextField}
                      fullWidth
                      value={depositAmount}
                      onValueChange={(values) => setDepositAmount(values.value)}
                      thousandSeparator=","
                      suffix=" VNĐ"
                      placeholder="Nhập số tiền"
                      sx={{ mb: 3 }}
                      size="large"
                    />

                    {depositAmount && (
                      <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Ước tính nhận được:
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {estimatedShares} shares
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Lãi suất dự kiến: {currentAPY}%/năm
                        </Typography>
                      </Box>
                    )}

                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      onClick={handleDeposit}
                      disabled={isLoading || !depositAmount}
                      sx={{ py: 1.5 }}
                    >
                      {isLoading ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        'Gửi tiết kiệm'
                      )}
                    </Button>
                  </Box>
                )}

                {/* Withdraw Tab */}
                {tabValue === 1 && (
                  <Box>
                    <Alert severity="warning" sx={{ mb: 3 }}>
                      Bạn có thể rút tiền bất cứ lúc nào. Không có phí rút tiền.
                    </Alert>

                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                      Số shares muốn rút
                    </Typography>

                    <TextField
                      fullWidth
                      type="number"
                      value={withdrawShares}
                      onChange={(e) => setWithdrawShares(e.target.value)}
                      placeholder="Nhập số shares"
                      inputProps={{ 
                        step: "0.0001",
                        max: userShares 
                      }}
                      sx={{ mb: 2 }}
                      size="large"
                    />

                    <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setWithdrawShares((userShares * 0.25).toFixed(4))}
                      >
                        25%
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setWithdrawShares((userShares * 0.5).toFixed(4))}
                      >
                        50%
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setWithdrawShares((userShares * 0.75).toFixed(4))}
                      >
                        75%
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setWithdrawShares(userShares.toString())}
                      >
                        Tất cả
                      </Button>
                    </Box>

                    {withdrawShares && (
                      <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Ước tính nhận được:
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {estimatedWithdrawAmount} VNĐ
                        </Typography>
                      </Box>
                    )}

                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      onClick={handleWithdraw}
                      disabled={isLoading || !withdrawShares}
                      sx={{ py: 1.5 }}
                    >
                      {isLoading ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        'Rút tiền'
                      )}
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Info Sidebar */}
        <Grid item xs={12} md={4}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card sx={{ mb: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Thông tin tài khoản
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Shares hiện có
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {userShares} shares
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Giá trị mỗi share
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {sharePrice.toLocaleString()} VNĐ
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingUp sx={{ color: 'success.main' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Lãi suất hiện tại
                    </Typography>
                    <Chip 
                      label={`${currentAPY}% APY`}
                      color="success"
                      size="small"
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Cách thức hoạt động
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  • Tiền của bạn được đầu tư vào các giao thức DeFi uy tín như Aave
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  • Lãi suất được tính hàng ngày và tự động cộng dồn
                </Typography>
                
                <Typography variant="body2" color="text.secondary">
                  • Bạn có thể rút tiền bất cứ lúc nào mà không mất phí
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SavingsPage;
