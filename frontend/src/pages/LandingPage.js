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
    title: 'Lãi suất hấp dẫn',
    description: 'Nhận lãi suất 6-12%/năm từ các chiến lược đầu tư đa dạng: Lending, Liquid Staking, Liquidity Providing'
  },
  {
    icon: <AccountBalanceWallet sx={{ fontSize: 40, color: 'primary.main' }} />,
    title: 'Tiết kiệm dễ dàng',
    description: 'Bắt đầu từ chỉ 10,000 VNĐ (~$4), phù hợp với mọi người'
  },
  {
    icon: <Security sx={{ fontSize: 40, color: 'primary.main' }} />,
    title: 'An toàn & minh bạch',
    description: 'Smart contracts được kiểm toán, quản lý rủi ro thông minh với phân bổ tự động giữa các chiến lược'
  },
  {
    icon: <Speed sx={{ fontSize: 40, color: 'primary.main' }} />,
    title: 'Đăng ký siêu tốc',
    description: 'Đăng nhập bằng Google/Apple, không cần nhớ private key phức tạp'
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
            Đăng nhập
          </Button>
          <Button
            variant="contained"
            onClick={() => navigate('/login')}
          >
            Bắt đầu
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
              Tiết kiệm dễ dàng cho mọi người
            </Typography>
            
            <Typography
              variant="h5"
              color="text.secondary"
              sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}
            >
              Gửi tiết kiệm từ 10,000 VNĐ và nhận lãi suất 6-12%/năm từ các chiến lược đầu tư đa dạng.
              Đơn giản, an toàn, minh bạch.
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/login')}
                sx={{ px: 4, py: 1.5 }}
              >
                Bắt đầu tiết kiệm
              </Button>
              <Button
                variant="outlined"
                size="large"
                sx={{ px: 4, py: 1.5 }}
              >
                Tìm hiểu thêm
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
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color="primary" sx={{ fontWeight: 'bold' }}>
                  6-12%
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Lãi suất hàng năm
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color="primary" sx={{ fontWeight: 'bold' }}>
                  10K VNĐ
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Số tiền tối thiểu
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color="primary" sx={{ fontWeight: 'bold' }}>
                  24/7
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Rút tiền linh hoạt
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
            Tại sao chọn Abunfi?
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
              Chiến lược đầu tư đa dạng
            </Typography>
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{ textAlign: 'center', mb: 6, maxWidth: 700, mx: 'auto' }}
            >
              Tiền của bạn được phân bổ thông minh giữa các chiến lược đầu tư khác nhau để tối ưu hóa lợi nhuận và giảm thiểu rủi ro
            </Typography>

            <Grid container spacing={4}>
              {/* Lending Strategy */}
              <Grid item xs={12} md={6} lg={4}>
                <Card sx={{ height: '100%', border: '2px solid', borderColor: 'success.light' }}>
                  <CardContent sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="h2" sx={{ mb: 2 }}>🏦</Typography>
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
                      Lending Protocols
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Aave, Compound - Cho vay tài sản để nhận lãi suất ổn định
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
                        APY: 4-6%
                      </Typography>
                      <Typography variant="caption" sx={{
                        bgcolor: 'info.light',
                        color: 'info.dark',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1,
                        fontSize: '0.7rem'
                      }}>
                        Rủi ro thấp
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
                      Curve, Uniswap V3 - Cung cấp thanh khoản cho các cặp stablecoin
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
                        APY: 5-8%
                      </Typography>
                      <Typography variant="caption" sx={{
                        bgcolor: 'secondary.light',
                        color: 'secondary.dark',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1,
                        fontSize: '0.7rem'
                      }}>
                        Rủi ro TB
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
                      Lido, Rocket Pool - Stake ETH và nhận liquid staking tokens
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
                        APY: 4-6%
                      </Typography>
                      <Typography variant="caption" sx={{
                        bgcolor: 'error.light',
                        color: 'error.dark',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1,
                        fontSize: '0.7rem'
                      }}>
                        Rủi ro TB-Cao
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Box sx={{ textAlign: 'center', mt: 4, p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="body1" sx={{ fontWeight: 'medium', mb: 1 }}>
                🤖 Quản lý rủi ro thông minh
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Hệ thống tự động phân bổ funds giữa các chiến lược dựa trên mức độ rủi ro, APY và điều kiện thị trường để tối ưu hóa lợi nhuận
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
              Sẵn sàng bắt đầu?
            </Typography>
            <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
              Tham gia cùng hàng nghìn người đã tin tưởng Abunfi
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
              Đăng ký ngay
            </Button>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
};

export default LandingPage;
