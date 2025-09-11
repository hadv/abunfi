import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  Pagination
} from '@mui/material';
import {
  Search,
  TrendingUp,
  TrendingDown,
  History,
  CheckCircle,
  Schedule,
  Error
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';

// Mock transaction data
const mockTransactions = [
  {
    id: '1',
    type: 'deposit',
    amount: 500000,
    shares: 0.5,
    status: 'confirmed',
    timestamp: new Date('2024-01-15'),
    txHash: '0x1234...5678'
  },
  {
    id: '2',
    type: 'yield_harvest',
    amount: 25000,
    shares: 0.025,
    status: 'confirmed',
    timestamp: new Date('2024-01-20'),
    txHash: '0x2345...6789'
  },
  {
    id: '3',
    type: 'deposit',
    amount: 300000,
    shares: 0.3,
    status: 'confirmed',
    timestamp: new Date('2024-01-25'),
    txHash: '0x3456...7890'
  },
  {
    id: '4',
    type: 'withdraw',
    amount: 100000,
    shares: 0.1,
    status: 'pending',
    timestamp: new Date('2024-01-28'),
    txHash: null
  },
  {
    id: '5',
    type: 'yield_harvest',
    amount: 15000,
    shares: 0.015,
    status: 'confirmed',
    timestamp: new Date('2024-01-30'),
    txHash: '0x4567...8901'
  }
];

const TransactionsPage = () => {
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />;
      case 'pending':
        return <Schedule sx={{ color: 'warning.main', fontSize: 20 }} />;
      case 'failed':
        return <Error sx={{ color: 'error.main', fontSize: 20 }} />;
      default:
        return <Schedule sx={{ color: 'grey.500', fontSize: 20 }} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'deposit':
        return <TrendingUp sx={{ color: 'success.main', fontSize: 20 }} />;
      case 'withdraw':
        return <TrendingDown sx={{ color: 'error.main', fontSize: 20 }} />;
      case 'yield_harvest':
        return <History sx={{ color: 'primary.main', fontSize: 20 }} />;
      default:
        return <History sx={{ color: 'grey.500', fontSize: 20 }} />;
    }
  };

  const getTypeName = (type) => {
    switch (type) {
      case 'deposit':
        return 'Deposit';
      case 'withdraw':
        return 'Withdrawal';
      case 'yield_harvest':
        return 'Yield';
      case 'referral_bonus':
        return 'Referral Bonus';
      default:
        return 'Other';
    }
  };

  const formatUSD = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const filteredTransactions = mockTransactions.filter(tx => {
    const matchesSearch = tx.txHash?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getTypeName(tx.type).toLowerCase().includes(searchTerm.toLowerCase());
    
    if (tabValue === 0) return matchesSearch; // All
    if (tabValue === 1) return matchesSearch && tx.type === 'deposit';
    if (tabValue === 2) return matchesSearch && tx.type === 'withdraw';
    if (tabValue === 3) return matchesSearch && tx.type === 'yield_harvest';
    
    return matchesSearch;
  });

  const paginatedTransactions = filteredTransactions.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          Lịch sử giao dịch
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track all your transactions and activities
        </Typography>
      </Box>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card>
          <CardContent sx={{ p: 0 }}>
            {/* Filters */}
            <Box sx={{ p: 3, pb: 0 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Tabs value={tabValue} onChange={handleTabChange}>
                  <Tab label="All" />
                  <Tab label="Deposits" />
                  <Tab label="Withdrawals" />
                  <Tab label="Yield" />
                </Tabs>

                <TextField
                  size="small"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ width: 300 }}
                />
              </Box>
            </Box>

            {/* Transaction Table */}
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Loại</TableCell>
                    <TableCell>Số tiền</TableCell>
                    <TableCell>Shares</TableCell>
                    <TableCell>Trạng thái</TableCell>
                    <TableCell>Thời gian</TableCell>
                    <TableCell>Hash</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedTransactions.map((transaction) => (
                    <TableRow key={transaction.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          {getTypeIcon(transaction.type)}
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {getTypeName(transaction.type)}
                          </Typography>
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 'bold',
                            color: transaction.type === 'withdraw' ? 'error.main' : 'success.main'
                          }}
                        >
                          {transaction.type === 'withdraw' ? '-' : '+'}
                          {formatUSD(transaction.amount)}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2">
                          {transaction.shares} shares
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getStatusIcon(transaction.status)}
                          <Chip
                            label={transaction.status === 'confirmed' ? 'Success' :
                                   transaction.status === 'pending' ? 'Processing' : 'Failed'}
                            color={getStatusColor(transaction.status)}
                            size="small"
                          />
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {format(transaction.timestamp, 'MM/dd/yyyy HH:mm', { locale: enUS })}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        {transaction.txHash ? (
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontFamily: 'monospace',
                              color: 'primary.main',
                              cursor: 'pointer',
                              '&:hover': { textDecoration: 'underline' }
                            }}
                            onClick={() => window.open(`https://arbiscan.io/tx/${transaction.txHash}`, '_blank')}
                          >
                            {transaction.txHash}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(event, value) => setPage(value)}
                  color="primary"
                />
              </Box>
            )}

            {/* Empty State */}
            {filteredTransactions.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <History sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                  No Transactions
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {searchTerm ? 'No matching transactions found' : 'You have no transactions yet'}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </Box>
  );
};

export default TransactionsPage;
