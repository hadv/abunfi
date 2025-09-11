import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  TrendingUp,
  Security,
  Speed,
  AccountBalanceWallet
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const features = [
  {
    icon: <TrendingUp sx={{ fontSize: 40, color: 'primary.main' }} />,
    title: 'Attractive Interest Rates',
    description: 'Earn 6-15% APY from 5+ advanced investment strategies: Aave, Compound, Liquid Staking, Uniswap V4 FairFlow (powered by Kyber)'
  },
  {
    icon: <AccountBalanceWallet sx={{ fontSize: 40, color: 'primary.main' }} />,
    title: 'Gas-Free Transactions',
    description: 'Advanced EIP-7702 technology - Completely free transactions, no gas fees required'
  },
  {
    icon: <Security sx={{ fontSize: 40, color: 'primary.main' }} />,
    title: 'Safe & Transparent',
    description: 'Audited smart contracts, intelligent risk management with automatic allocation across 5+ DeFi strategies'
  },
  {
    icon: <Speed sx={{ fontSize: 40, color: 'primary.main' }} />,
    title: 'Super Fast Registration',
    description: 'Login with Google/Apple, automatic Smart Account, no need to remember complex private keys'
  }
];

const LandingPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Header */}
      <AppBar position="static" sx={{ bgcolor: 'background.paper', boxShadow: 1 }}>
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                A
              </Typography>
            </Box>
            <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
              Abunfi
            </Typography>
          </Box>
          
          <Box sx={{ flexGrow: 1 }} />
          
          <Button
            variant="outlined"
            onClick={() => navigate('/login')}
            sx={{ mr: 2 }}
          >
            Login
          </Button>
          <Button
            variant="contained"
            onClick={() => navigate('/login')}
          >
            Get Started
          </Button>
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography
              variant={isMobile ? 'h3' : 'h2'}
              component="h1"
              sx={{
                fontWeight: 'bold',
                mb: 3,
                background: 'linear-gradient(45deg, #2563eb 30%, #10b981 90%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Easy Savings for Everyone
            </Typography>
            
            <Typography
              variant="h5"
              color="text.secondary"
              sx={{ mb: 4, maxWidth: 700, mx: 'auto' }}
            >
              Start saving from $10 and earn 6-15% APY from 5+ advanced DeFi strategies.
              Gas-free transactions with EIP-7702 technology. Simple, safe, transparent.
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/login')}
                sx={{ px: 4, py: 1.5 }}
              >
                Start Saving
              </Button>
              <Button
                variant="outlined"
                size="large"
                sx={{ px: 4, py: 1.5 }}
              >
                Learn More
              </Button>
            </Box>
          </Box>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <Grid container spacing={4} sx={{ mb: 8 }}>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color="primary" sx={{ fontWeight: 'bold' }}>
                  6-15%
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Annual Interest Rate
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color="primary" sx={{ fontWeight: 'bold' }}>
                  5+
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  DeFi Strategies
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color="primary" sx={{ fontWeight: 'bold' }}>
                  $0
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Transaction Fees
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color="primary" sx={{ fontWeight: 'bold' }}>
                  24/7
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Flexible Withdrawals
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <Typography
            variant="h4"
            component="h2"
            sx={{ textAlign: 'center', mb: 6, fontWeight: 'bold' }}
          >
            Why Choose Abunfi?
          </Typography>
          
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                    },
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ mb: 2 }}>
                      {feature.icon}
                    </Box>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </motion.div>

        {/* Protocols Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <Box sx={{ mt: 8, mb: 8 }}>
            <Typography
              variant="h4"
              component="h2"
              sx={{ textAlign: 'center', mb: 2, fontWeight: 'bold' }}
            >
              Diversified Investment Strategies
            </Typography>
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{ textAlign: 'center', mb: 6, maxWidth: 800, mx: 'auto' }}
            >
              Your funds are intelligently allocated across 5+ advanced DeFi strategies with EIP-7702 gasless transaction technology
            </Typography>

            <Grid container spacing={3}>
              {/* Lending Strategy */}
              <Grid item xs={12} md={6} lg={4}>
                <Card sx={{ height: '100%', border: '2px solid', borderColor: 'success.light' }}>
                  <CardContent sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="h2" sx={{ mb: 2 }}>🏦</Typography>
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
                      Lending Protocols
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Aave V3, Compound V3 - Lend assets to earn stable interest rates
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                      <Typography variant="caption" sx={{
                        bgcolor: 'success.light',
                        color: 'success.dark',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1,
                        fontSize: '0.7rem'
                      }}>
                        APY: 4-8%
                      </Typography>
                      <Typography variant="caption" sx={{
                        bgcolor: 'info.light',
                        color: 'info.dark',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1,
                        fontSize: '0.7rem'
                      }}>
                        Low Risk
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Uniswap V4 FairFlow Strategy - NEW! */}
              <Grid item xs={12} md={6} lg={4}>
                <Card sx={{ height: '100%', border: '3px solid', borderColor: 'secondary.main', position: 'relative' }}>
                  <Box sx={{
                    position: 'absolute',
                    top: -10,
                    right: 10,
                    bgcolor: 'secondary.main',
                    color: 'white',
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    fontSize: '0.7rem',
                    fontWeight: 'bold'
                  }}>
                    🆕 NEW!
                  </Box>
                  <CardContent sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="h2" sx={{ mb: 2 }}>🦄</Typography>
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
                      Uniswap V4 FairFlow
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Advanced stablecoin strategy powered by Kyber's FairFlow hook technology for Uniswap V4
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                      <Typography variant="caption" sx={{
                        bgcolor: 'secondary.light',
                        color: 'secondary.dark',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1,
                        fontSize: '0.7rem'
                      }}>
                        APY: 8-15%
                      </Typography>
                      <Typography variant="caption" sx={{
                        bgcolor: 'warning.light',
                        color: 'warning.dark',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1,
                        fontSize: '0.7rem'
                      }}>
                        Medium Risk
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Liquidity Providing Strategy */}
              <Grid item xs={12} md={6} lg={4}>
                <Card sx={{ height: '100%', border: '2px solid', borderColor: 'warning.light' }}>
                  <CardContent sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="h2" sx={{ mb: 2 }}>⚖️</Typography>
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
                      Liquidity Providing
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Curve, Uniswap V3 - Provide liquidity for stablecoin pairs
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                      <Typography variant="caption" sx={{
                        bgcolor: 'warning.light',
                        color: 'warning.dark',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1,
                        fontSize: '0.7rem'
                      }}>
                        APY: 5-10%
                      </Typography>
                      <Typography variant="caption" sx={{
                        bgcolor: 'info.light',
                        color: 'info.dark',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1,
                        fontSize: '0.7rem'
                      }}>
                        Medium Risk
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Liquid Staking Strategy */}
              <Grid item xs={12} md={6} lg={4}>
                <Card sx={{ height: '100%', border: '2px solid', borderColor: 'primary.light' }}>
                  <CardContent sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="h2" sx={{ mb: 2 }}>🚀</Typography>
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
                      Liquid Staking
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Lido stETH, Rocket Pool rETH - Stake ETH and receive liquid tokens
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                      <Typography variant="caption" sx={{
                        bgcolor: 'primary.light',
                        color: 'primary.dark',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1,
                        fontSize: '0.7rem'
                      }}>
                        APY: 4-7%
                      </Typography>
                      <Typography variant="caption" sx={{
                        bgcolor: 'warning.light',
                        color: 'warning.dark',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1,
                        fontSize: '0.7rem'
                      }}>
                        Medium Risk
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* EIP-7702 Gasless Transactions - NEW! */}
              <Grid item xs={12} md={6} lg={4}>
                <Card sx={{ height: '100%', border: '3px solid', borderColor: 'error.main', position: 'relative' }}>
                  <Box sx={{
                    position: 'absolute',
                    top: -10,
                    right: 10,
                    bgcolor: 'error.main',
                    color: 'white',
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    fontSize: '0.7rem',
                    fontWeight: 'bold'
                  }}>
                    🔥 HOT!
                  </Box>
                  <CardContent sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="h2" sx={{ mb: 2 }}>⚡</Typography>
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
                      EIP-7702 Gasless
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Completely gas-free transactions with Smart Account
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                      <Typography variant="caption" sx={{
                        bgcolor: 'error.light',
                        color: 'error.dark',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1,
                        fontSize: '0.7rem'
                      }}>
                        Fee: $0
                      </Typography>
                      <Typography variant="caption" sx={{
                        bgcolor: 'success.light',
                        color: 'success.dark',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1,
                        fontSize: '0.7rem'
                      }}>
                        Tiện lợi 100%
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Box sx={{ textAlign: 'center', mt: 4, p: 4, bgcolor: 'grey.50', borderRadius: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                🤖 Smart Risk Management + EIP-7702 Gasless
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                System automatically allocates funds across 5+ DeFi strategies based on risk level, APY and market conditions
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ⚡ <strong>Gas-free transactions</strong> with EIP-7702 technology - No need to pay gas fees for any transaction!
              </Typography>
            </Box>
          </Box>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <Box
            sx={{
              textAlign: 'center',
              mt: 8,
              p: 6,
              bgcolor: 'primary.main',
              borderRadius: 3,
              color: 'white'
            }}
          >
            <Typography variant="h4" sx={{ mb: 2, fontWeight: 'bold' }}>
              Ready to experience next-generation DeFi?
            </Typography>
            <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
              Gas-free transactions + 5+ advanced DeFi strategies + 6-15% APY
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/login')}
              sx={{
                bgcolor: 'white',
                color: 'primary.main',
                px: 4,
                py: 1.5,
                '&:hover': {
                  bgcolor: 'grey.100',
                },
              }}
            >
              Sign Up Now
            </Button>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
};

export default LandingPage;
