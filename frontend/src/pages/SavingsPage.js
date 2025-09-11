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
import GaslessTransactionSecurity from '../components/security/GaslessTransactionSecurity';
import { useSecurityAuth } from '../services/securityAuthService';
import { useWeb3Auth } from '../contexts/Web3AuthContext';

const SavingsPage = () => {
  const { walletAddress } = useWeb3Auth();
  const { canPerformGaslessTransaction } = useSecurityAuth();
  const [tabValue, setTabValue] = useState(0);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawShares, setWithdrawShares] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [canProceedWithTransaction, setCanProceedWithTransaction] = useState(false);
  const [estimatedGasCost, setEstimatedGasCost] = useState('0.005'); // Mock estimated gas cost

  // Mock data
  const currentAPY = 8.2;
  const userShares = 1.25;
  const sharePrice = 40; // USD per share
  const minimumDeposit = 10; // USD

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleTransactionValidation = (canProceed, securityStatus) => {
    setCanProceedWithTransaction(canProceed);
    if (!canProceed && securityStatus) {
      console.log('Transaction blocked by security policy:', securityStatus);
    }
  };

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) < minimumDeposit) {
      toast.error(`Minimum amount is $${minimumDeposit.toLocaleString()}`);
      return;
    }

    // Check security before proceeding
    if (!canProceedWithTransaction) {
      toast.error('Transaction blocked by security policy. Please check your rate limits.');
      return;
    }

    setIsLoading(true);
    try {
      // Check gasless transaction eligibility
      const eligibility = await canPerformGaslessTransaction(walletAddress, estimatedGasCost);

      if (!eligibility.canProceed) {
        toast.error(`Cannot proceed: ${eligibility.reason}`);
        setIsLoading(false);
        return;
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Deposit successful!');
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
      toast.error('Number of shares exceeds current balance');
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Withdrawal successful!');
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
          Savings & Withdrawals
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Deposit savings or withdraw funds from your account
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
                    label="Deposit"
                    iconPosition="start"
                  />
                  <Tab
                    icon={<Remove />}
                    label="Withdraw"
                    iconPosition="start"
                  />
                </Tabs>

                {/* Deposit Tab */}
                {tabValue === 0 && (
                  <Box>
                    {/* Security Status */}
                    <GaslessTransactionSecurity
                      onTransactionValidated={handleTransactionValidation}
                      estimatedGasCost={estimatedGasCost}
                      transactionType="deposit"
                      showDetails={true}
                    />

                    <Alert severity="info" sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Info fontSize="small" />
                        Minimum amount: ${(minimumDeposit/25000).toFixed(0)}
                      </Box>
                    </Alert>

                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                      Amount to Deposit
                    </Typography>

                    <NumericFormat
                      customInput={TextField}
                      fullWidth
                      value={depositAmount}
                      onValueChange={(values) => setDepositAmount(values.value)}
                      thousandSeparator=","
                      prefix="$"
                      placeholder="Enter amount"
                      sx={{ mb: 3 }}
                      size="large"
                    />

                    {depositAmount && (
                      <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Estimated to receive:
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {estimatedShares} shares
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Expected APY: {currentAPY}%/year
                        </Typography>
                      </Box>
                    )}

                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      onClick={handleDeposit}
                      disabled={isLoading || !depositAmount || !canProceedWithTransaction}
                      sx={{ py: 1.5 }}
                    >
                      {isLoading ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        'Deposit Savings'
                      )}
                    </Button>
                  </Box>
                )}

                {/* Withdraw Tab */}
                {tabValue === 1 && (
                  <Box>
                    <Alert severity="warning" sx={{ mb: 3 }}>
                      You can withdraw money at any time. No withdrawal fees.
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
                          Estimated to receive:
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          ${estimatedWithdrawAmount}
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
                  Account Information
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
                    Value per share
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    ${sharePrice.toLocaleString()}
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingUp sx={{ color: 'success.main' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Current APY
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
                  How It Works
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  • Your funds are invested in trusted DeFi protocols like Aave and Compound
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  • The system automatically allocates funds to optimize returns
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  • Interest is calculated daily and automatically compounded
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  • You can withdraw funds anytime without fees
                </Typography>
              </CardContent>
            </Card>
          </motion.div>

          {/* Protocol Information Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card sx={{ mt: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Protocols Used
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    🏦 Aave Protocol
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Current APY: ~{(currentAPY * 0.6).toFixed(1)}%/year
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Leading lending protocol with high liquidity and strong security
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    🔷 Compound Protocol
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Current APY: ~{(currentAPY * 0.4).toFixed(1)}%/year
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pioneer lending protocol with automatic interest mechanism
                  </Typography>
                </Box>

                <Alert severity="info" sx={{ mt: 2 }}>
                  The system automatically allocates funds between protocols to optimize returns and minimize risk
                </Alert>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SavingsPage;
