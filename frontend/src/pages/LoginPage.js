import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Divider,
  CircularProgress,
  Alert,
  Dialog
} from '@mui/material';
import { Google, Apple, Phone, Code } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useWeb3Auth } from '../contexts/Web3AuthContext';
import DevLogin from '../components/DevLogin';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useWeb3Auth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDevLogin, setShowDevLogin] = useState(false);

  const handleSocialLogin = async (provider) => {
    try {
      setIsLoading(true);
      setError('');
      
      await login(provider);
      toast.success('Đăng nhập thành công!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      setError('Đăng nhập thất bại. Vui lòng thử lại.');
      toast.error('Đăng nhập thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        bgcolor: 'background.default',
        backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Container maxWidth="sm">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Paper
            elevation={24}
            sx={{
              p: 6,
              borderRadius: 3,
              textAlign: 'center',
              bgcolor: 'background.paper'
            }}
          >
            {/* Logo */}
            <Box sx={{ mb: 4 }}>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2
                }}
              >
                <Typography variant="h3" sx={{ color: 'white', fontWeight: 'bold' }}>
                  A
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                Chào mừng đến Abunfi
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Đăng nhập để bắt đầu hành trình tiết kiệm của bạn
              </Typography>
            </Box>

            {/* Error Alert */}
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {/* Social Login Buttons */}
            <Box sx={{ mb: 3 }}>
              <Button
                fullWidth
                variant="outlined"
                size="large"
                startIcon={<Google />}
                onClick={() => handleSocialLogin('google')}
                disabled={isLoading}
                sx={{
                  mb: 2,
                  py: 1.5,
                  borderColor: '#db4437',
                  color: '#db4437',
                  '&:hover': {
                    borderColor: '#db4437',
                    bgcolor: 'rgba(219, 68, 55, 0.04)'
                  }
                }}
              >
                {isLoading ? (
                  <CircularProgress size={20} />
                ) : (
                  'Đăng nhập với Google'
                )}
              </Button>

              <Button
                fullWidth
                variant="outlined"
                size="large"
                startIcon={<Apple />}
                onClick={() => handleSocialLogin('apple')}
                disabled={isLoading}
                sx={{
                  mb: 2,
                  py: 1.5,
                  borderColor: '#000',
                  color: '#000',
                  '&:hover': {
                    borderColor: '#000',
                    bgcolor: 'rgba(0, 0, 0, 0.04)'
                  }
                }}
              >
                Đăng nhập với Apple
              </Button>

              <Button
                fullWidth
                variant="outlined"
                size="large"
                startIcon={<Phone />}
                onClick={() => handleSocialLogin('phone')}
                disabled={isLoading}
                sx={{
                  py: 1.5,
                  borderColor: 'primary.main',
                  color: 'primary.main'
                }}
              >
                Đăng nhập với số điện thoại
              </Button>
            </Box>

            <Divider sx={{ my: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Hoặc
              </Typography>
            </Divider>

            {/* Demo Login */}
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={() => handleSocialLogin('google')}
              disabled={isLoading}
              sx={{ py: 1.5, mb: 2 }}
            >
              Dùng thử Demo
            </Button>

            {/* Development Login */}
            {process.env.NODE_ENV === 'development' && (
              <Button
                variant="outlined"
                fullWidth
                startIcon={<Code />}
                onClick={() => setShowDevLogin(true)}
                disabled={isLoading}
                sx={{
                  py: 1.5,
                  mb: 3,
                  borderColor: 'warning.main',
                  color: 'warning.main',
                  '&:hover': {
                    borderColor: 'warning.dark',
                    backgroundColor: 'warning.light',
                    color: 'warning.dark'
                  }
                }}
              >
                Development Login
              </Button>
            )}

            {/* Terms */}
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Bằng cách đăng nhập, bạn đồng ý với{' '}
              <Typography component="span" color="primary" sx={{ cursor: 'pointer' }}>
                Điều khoản sử dụng
              </Typography>{' '}
              và{' '}
              <Typography component="span" color="primary" sx={{ cursor: 'pointer' }}>
                Chính sách bảo mật
              </Typography>{' '}
              của chúng tôi.
            </Typography>

            {/* Back to Home */}
            <Box sx={{ mt: 4 }}>
              <Button
                variant="text"
                onClick={() => navigate('/')}
                sx={{ textTransform: 'none' }}
              >
                ← Quay lại trang chủ
              </Button>
            </Box>
          </Paper>
        </motion.div>
      </Container>

      {/* Development Login Dialog */}
      <Dialog
        open={showDevLogin}
        onClose={() => setShowDevLogin(false)}
        maxWidth="sm"
        fullWidth
      >
        <DevLogin onClose={() => setShowDevLogin(false)} />
      </Dialog>
    </Box>
  );
};

export default LoginPage;
