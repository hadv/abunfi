import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import toast from 'react-hot-toast';

// Mock dependencies
jest.mock('react-hot-toast');
jest.mock('../../../contexts/Web3AuthContext');
jest.mock('../../../services/rateLimitingService');

import { useWeb3Auth } from '../../../contexts/Web3AuthContext';
import rateLimitingService from '../../../services/rateLimitingService';
import SecurityDashboard from '../SecurityDashboard';
import GaslessTransactionSecurity from '../GaslessTransactionSecurity';
import AntiAbuseEducation from '../AntiAbuseEducation';

const theme = createTheme();

const TestWrapper = ({ children }) => (
  <ThemeProvider theme={theme}>
    {children}
  </ThemeProvider>
);

describe('Security Integration Tests', () => {
  const mockWalletAddress = '0x1234567890123456789012345678901234567890';
  const mockSecurityStatus = {
    isActive: true,
    isWhitelisted: false,
    requiresWhitelist: false,
    dailyLimits: {
      gas: {
        used: '0.05',
        limit: '0.1',
        remaining: '0.05',
        percentage: 50
      },
      transactions: {
        used: 25,
        limit: 50,
        remaining: 25,
        percentage: 50
      }
    },
    perTxLimit: '0.01',
    resetInfo: {
      lastReset: new Date('2024-01-01T00:00:00Z'),
      nextReset: new Date('2024-01-02T00:00:00Z'),
      hoursUntilReset: 12
    },
    warnings: [],
    riskLevel: 'low'
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock Web3Auth context
    useWeb3Auth.mockReturnValue({
      walletAddress: mockWalletAddress,
      isAuthenticated: true
    });

    // Mock rate limiting service
    rateLimitingService.getSecurityStatus = jest.fn().mockResolvedValue(mockSecurityStatus);
    rateLimitingService.checkRateLimitWarnings = jest.fn().mockResolvedValue([]);
    rateLimitingService.clearCache = jest.fn();
    rateLimitingService.showRateLimitNotifications = jest.fn();
  });

  describe('SecurityDashboard', () => {
    test('renders security dashboard with correct information', async () => {
      render(
        <TestWrapper>
          <SecurityDashboard />
        </TestWrapper>
      );

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByText('Security Dashboard')).toBeInTheDocument();
      });

      // Check account status
      expect(screen.getByText('Account Status')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Standard')).toBeInTheDocument();

      // Check risk level
      expect(screen.getByText('Risk Level')).toBeInTheDocument();
      expect(screen.getByText('LOW')).toBeInTheDocument();

      // Check rate limits
      expect(screen.getByText('Daily Gas Limit')).toBeInTheDocument();
      expect(screen.getByText('Daily Transaction Limit')).toBeInTheDocument();
    });

    test('displays warnings when approaching limits', async () => {
      const warningStatus = {
        ...mockSecurityStatus,
        dailyLimits: {
          ...mockSecurityStatus.dailyLimits,
          gas: {
            ...mockSecurityStatus.dailyLimits.gas,
            percentage: 85
          }
        },
        warnings: [{
          type: 'gas_limit',
          severity: 'warning',
          message: 'You have used 85% of your daily gas limit',
          remaining: '0.015'
        }],
        riskLevel: 'medium'
      };

      rateLimitingService.getSecurityStatus.mockResolvedValue(warningStatus);

      render(
        <TestWrapper>
          <SecurityDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Security Alerts')).toBeInTheDocument();
        expect(screen.getByText('You have used 85% of your daily gas limit')).toBeInTheDocument();
      });
    });

    test('handles refresh functionality', async () => {
      render(
        <TestWrapper>
          <SecurityDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Security Dashboard')).toBeInTheDocument();
      });

      // Find and click refresh button
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(rateLimitingService.clearCache).toHaveBeenCalledWith(mockWalletAddress);
        expect(toast.success).toHaveBeenCalledWith('Security status refreshed');
      });
    });
  });

  describe('GaslessTransactionSecurity', () => {
    const mockOnTransactionValidated = jest.fn();

    test('validates transaction and shows security status', async () => {
      render(
        <TestWrapper>
          <GaslessTransactionSecurity
            onTransactionValidated={mockOnTransactionValidated}
            estimatedGasCost="0.005"
            transactionType="deposit"
            showDetails={true}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Security Status')).toBeInTheDocument();
        expect(screen.getByText('Approved')).toBeInTheDocument();
      });

      expect(mockOnTransactionValidated).toHaveBeenCalledWith(true, mockSecurityStatus);
    });

    test('blocks transaction when limits exceeded', async () => {
      const blockedStatus = {
        ...mockSecurityStatus,
        dailyLimits: {
          ...mockSecurityStatus.dailyLimits,
          transactions: {
            ...mockSecurityStatus.dailyLimits.transactions,
            remaining: 0
          }
        }
      };

      rateLimitingService.getSecurityStatus.mockResolvedValue(blockedStatus);

      render(
        <TestWrapper>
          <GaslessTransactionSecurity
            onTransactionValidated={mockOnTransactionValidated}
            estimatedGasCost="0.005"
            transactionType="deposit"
            showDetails={true}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Blocked')).toBeInTheDocument();
      });

      expect(mockOnTransactionValidated).toHaveBeenCalledWith(false, blockedStatus);
    });

    test('shows detailed security information when expanded', async () => {
      render(
        <TestWrapper>
          <GaslessTransactionSecurity
            onTransactionValidated={mockOnTransactionValidated}
            estimatedGasCost="0.005"
            transactionType="deposit"
            showDetails={true}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Security Status')).toBeInTheDocument();
      });

      // Find and click expand button
      const expandButton = screen.getByRole('button', { name: /show security details/i });
      fireEvent.click(expandButton);

      await waitFor(() => {
        expect(screen.getByText('Daily Usage')).toBeInTheDocument();
        expect(screen.getByText('Gas Usage')).toBeInTheDocument();
        expect(screen.getByText('Transactions')).toBeInTheDocument();
      });
    });
  });

  describe('AntiAbuseEducation', () => {
    test('renders education content in compact mode', () => {
      render(
        <TestWrapper>
          <AntiAbuseEducation compact={true} />
        </TestWrapper>
      );

      expect(screen.getByText('Security & Rate Limiting')).toBeInTheDocument();
      expect(screen.getByText('Learn More')).toBeInTheDocument();
    });

    test('opens detailed education dialog', async () => {
      render(
        <TestWrapper>
          <AntiAbuseEducation compact={true} />
        </TestWrapper>
      );

      const learnMoreButton = screen.getByText('Learn More');
      fireEvent.click(learnMoreButton);

      await waitFor(() => {
        expect(screen.getByText('DOS Attack Prevention')).toBeInTheDocument();
        expect(screen.getByText('Sybil Attack Prevention')).toBeInTheDocument();
        expect(screen.getByText('Understanding Rate Limits')).toBeInTheDocument();
      });
    });

    test('displays best practices information', async () => {
      render(
        <TestWrapper>
          <AntiAbuseEducation />
        </TestWrapper>
      );

      // Find and click best practices accordion
      const bestPracticesButton = screen.getByText('Best Practices');
      fireEvent.click(bestPracticesButton);

      await waitFor(() => {
        expect(screen.getByText('Monitor Your Usage')).toBeInTheDocument();
        expect(screen.getByText('Batch Transactions')).toBeInTheDocument();
        expect(screen.getByText('Use During Off-Peak Hours')).toBeInTheDocument();
      });
    });
  });

  describe('Integration Scenarios', () => {
    test('complete security flow from dashboard to transaction', async () => {
      const { rerender } = render(
        <TestWrapper>
          <SecurityDashboard />
        </TestWrapper>
      );

      // Wait for dashboard to load
      await waitFor(() => {
        expect(screen.getByText('Security Dashboard')).toBeInTheDocument();
      });

      // Switch to transaction security component
      rerender(
        <TestWrapper>
          <GaslessTransactionSecurity
            onTransactionValidated={jest.fn()}
            estimatedGasCost="0.005"
            transactionType="deposit"
            showDetails={true}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Security Status')).toBeInTheDocument();
        expect(screen.getByText('Approved')).toBeInTheDocument();
      });
    });

    test('handles high-risk scenario with multiple warnings', async () => {
      const highRiskStatus = {
        ...mockSecurityStatus,
        dailyLimits: {
          gas: {
            used: '0.095',
            limit: '0.1',
            remaining: '0.005',
            percentage: 95
          },
          transactions: {
            used: 48,
            limit: 50,
            remaining: 2,
            percentage: 96
          }
        },
        warnings: [
          {
            type: 'gas_limit',
            severity: 'critical',
            message: 'You have used 95% of your daily gas limit',
            remaining: '0.005'
          },
          {
            type: 'tx_limit',
            severity: 'critical',
            message: 'You have used 96% of your daily transaction limit',
            remaining: 2
          }
        ],
        riskLevel: 'high'
      };

      rateLimitingService.getSecurityStatus.mockResolvedValue(highRiskStatus);

      render(
        <TestWrapper>
          <SecurityDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('HIGH')).toBeInTheDocument();
        expect(screen.getByText('Security Alerts')).toBeInTheDocument();
      });

      // Check that both warnings are displayed
      expect(screen.getByText(/95% of your daily gas limit/)).toBeInTheDocument();
      expect(screen.getByText(/96% of your daily transaction limit/)).toBeInTheDocument();
    });

    test('handles service unavailable scenario', async () => {
      rateLimitingService.getSecurityStatus.mockRejectedValue(new Error('Service unavailable'));

      render(
        <TestWrapper>
          <SecurityDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Failed to load security information/)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('handles network errors gracefully', async () => {
      rateLimitingService.getSecurityStatus.mockRejectedValue(new Error('Network error'));

      render(
        <TestWrapper>
          <GaslessTransactionSecurity
            onTransactionValidated={jest.fn()}
            estimatedGasCost="0.005"
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Security Status')).toBeInTheDocument();
      });

      // Should show error state or fallback
      expect(screen.queryByText('Approved')).not.toBeInTheDocument();
    });

    test('handles invalid wallet address', async () => {
      useWeb3Auth.mockReturnValue({
        walletAddress: null,
        isAuthenticated: false
      });

      render(
        <TestWrapper>
          <SecurityDashboard />
        </TestWrapper>
      );

      // Should not attempt to load security status
      expect(rateLimitingService.getSecurityStatus).not.toHaveBeenCalled();
    });
  });
});
