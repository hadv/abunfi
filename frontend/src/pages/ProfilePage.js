import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Avatar,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Chip
} from '@mui/material';
import {
  Person,
  AccountBalanceWallet,
  Notifications,
  Share
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useUser } from '../contexts/UserContext';
import { useWeb3Auth } from '../contexts/Web3AuthContext';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { user, updateProfile } = useUser();
  const { walletAddress } = useWeb3Auth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    language: user?.preferences?.language || 'en',
    currency: user?.preferences?.currency || 'USD',
    notifications: {
      email: user?.preferences?.notifications?.email || true,
      push: user?.preferences?.notifications?.push || true,
      sms: user?.preferences?.notifications?.sms || false
    }
  });

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSave = async () => {
    try {
      await updateProfile(formData);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('An error occurred, please try again');
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      language: user?.preferences?.language || 'vi',
      currency: user?.preferences?.currency || 'VND',
      notifications: {
        email: user?.preferences?.notifications?.email || true,
        push: user?.preferences?.notifications?.push || true,
        sms: user?.preferences?.notifications?.sms || false
      }
    });
    setIsEditing(false);
  };

  const copyWalletAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    toast.success('Wallet address copied!');
  };

  const generateReferralLink = () => {
    const referralCode = user?.referralCode || 'ABC123';
    const link = `https://abunfi.com/ref/${referralCode}`;
    navigator.clipboard.writeText(link);
    toast.success('Referral link copied!');
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          Personal Profile
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your account information and settings
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Profile Info */}
        <Grid item xs={12} md={8}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card sx={{ mb: 3 }}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Person />
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      Personal Information
                    </Typography>
                  </Box>
                  <Button
                    variant={isEditing ? "outlined" : "contained"}
                    onClick={() => isEditing ? handleCancel() : setIsEditing(true)}
                  >
                    {isEditing ? 'Hủy' : 'Chỉnh sửa'}
                  </Button>
                </Box>

                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      disabled={!isEditing}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      disabled={!isEditing}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Phone Number"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      disabled={!isEditing}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth disabled={!isEditing}>
                      <InputLabel>Language</InputLabel>
                      <Select
                        value={formData.language}
                        onChange={(e) => handleInputChange('language', e.target.value)}
                        label="Language"
                      >
                        <MenuItem value="en">English</MenuItem>
                        <MenuItem value="vi">Tiếng Việt</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                {isEditing && (
                  <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                    <Button variant="contained" onClick={handleSave}>
                      Save Changes
                    </Button>
                    <Button variant="outlined" onClick={handleCancel}>
                      Cancel
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Wallet Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card sx={{ mb: 3 }}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <AccountBalanceWallet />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Wallet Information
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Địa chỉ ví
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        fontFamily: 'monospace',
                        bgcolor: 'grey.100',
                        p: 1,
                        borderRadius: 1,
                        flex: 1
                      }}
                    >
                      {walletAddress}
                    </Typography>
                    <Button size="small" onClick={copyWalletAddress}>
                      Copy
                    </Button>
                  </Box>
                </Box>

                <Alert severity="info">
                  Đây là địa chỉ ví thông minh được tạo tự động cho bạn. Bạn có thể sử dụng nó để nhận tiền từ các ví khác.
                </Alert>
              </CardContent>
            </Card>
          </motion.div>

          {/* Notifications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Notifications />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Notification Settings
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.notifications.email}
                        onChange={(e) => handleInputChange('notifications.email', e.target.checked)}
                      />
                    }
                    label="Thông báo qua Email"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.notifications.push}
                        onChange={(e) => handleInputChange('notifications.push', e.target.checked)}
                      />
                    }
                    label="Thông báo đẩy"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.notifications.sms}
                        onChange={(e) => handleInputChange('notifications.sms', e.target.checked)}
                      />
                    }
                    label="Thông báo SMS"
                  />
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Profile Avatar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card sx={{ mb: 3 }}>
              <CardContent sx={{ p: 4, textAlign: 'center' }}>
                <Avatar
                  src={user?.avatar}
                  sx={{ width: 100, height: 100, mx: 'auto', mb: 2 }}
                >
                  {user?.name?.charAt(0)?.toUpperCase()}
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {user?.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {user?.email}
                </Typography>
                <Chip
                  label={user?.kycStatus === 'verified' ? 'Verified' : 'Not Verified'}
                  color={user?.kycStatus === 'verified' ? 'success' : 'warning'}
                  size="small"
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Referral */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Share />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Refer Friends
                  </Typography>
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Your referral code:
                </Typography>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontFamily: 'monospace',
                    bgcolor: 'primary.light',
                    color: 'primary.contrastText',
                    p: 1,
                    borderRadius: 1,
                    textAlign: 'center',
                    mb: 2
                  }}
                >
                  {user?.referralCode || 'ABC123'}
                </Typography>

                <Button
                  fullWidth
                  variant="outlined"
                  onClick={generateReferralLink}
                  sx={{ mb: 2 }}
                >
                  Copy Referral Link
                </Button>

                <Typography variant="body2" color="text.secondary">
                  You have referred: <strong>{user?.referralCount || 0}</strong> people
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProfilePage;
