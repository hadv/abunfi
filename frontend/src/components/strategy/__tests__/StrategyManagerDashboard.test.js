import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import StrategyManagerDashboard from '../../../pages/StrategyManagerDashboard';
import { UserContext } from '../../../contexts/UserContext';

// Mock the services
jest.mock('../../../services/strategyManagerService', () => ({
  getStrategiesOverview: jest.fn(() => Promise.resolve({
    data: {
      totalAssets: '75000000',
      strategiesCount: 4,
      activeStrategies: 4,
      totalAPY: 8.45,
      strategies: [
        {
          address: '0x1234...aave',
          name: 'Aave USDC Strategy',
          totalAssets: '30000000',
          apy: 7.8,
          allocation: 40.0,
          riskScore: 25,
          isActive: true,
          lastUpdate: new Date().toISOString()
        }
      ]
    }
  })),
  getFundsDistribution: jest.fn(() => Promise.resolve({
    data: {
      distribution: [
        {
          name: 'Aave USDC',
          value: 30000000,
          percentage: 40.0,
          apy: 7.8,
          riskScore: 25,
          color: '#1976d2'
        }
      ],
      totalValue: 75000000,
      lastUpdate: new Date().toISOString()
    }
  })),
  getStrategyPerformance: jest.fn(() => Promise.resolve({
    data: {
      strategies: [],
      period: '30d',
      lastUpdate: new Date().toISOString()
    }
  })),
  getCompoundInterest: jest.fn(() => Promise.resolve({
    data: {
      calculations: [],
      period: '1y',
      principal: 10000,
      lastUpdate: new Date().toISOString()
    }
  }))
}));

// Mock the WebSocket hook
jest.mock('../../../hooks/useWebSocket', () => ({
  useWebSocket: jest.fn(() => ({
    isConnected: true,
    lastMessage: null
  }))
}));

const theme = createTheme();

const mockUser = {
  id: '1',
  name: 'Strategy Manager',
  email: 'manager@abunfi.com',
  role: 'strategy_manager'
};

const renderWithProviders = (component, user = mockUser) => {
  return render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <UserContext.Provider value={{ user, isLoading: false }}>
          {component}
        </UserContext.Provider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('StrategyManagerDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders dashboard for strategy manager', async () => {
    renderWithProviders(<StrategyManagerDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Strategy Manager Dashboard 📊')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Real-time monitoring and management of DeFi strategies')).toBeInTheDocument();
  });

  test('shows access denied for regular user', () => {
    const regularUser = { ...mockUser, role: 'user' };
    renderWithProviders(<StrategyManagerDashboard />, regularUser);
    
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.getByText(/You don't have permission to access/)).toBeInTheDocument();
  });

  test('displays overview cards with correct data', async () => {
    renderWithProviders(<StrategyManagerDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('$75.0M')).toBeInTheDocument();
      expect(screen.getByText('8.45%')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument(); // Active strategies
    });
  });

  test('shows live updates status', async () => {
    renderWithProviders(<StrategyManagerDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Live Updates')).toBeInTheDocument();
    });
  });

  test('renders all tab options', async () => {
    renderWithProviders(<StrategyManagerDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Fund Distribution')).toBeInTheDocument();
      expect(screen.getByText('Performance Analytics')).toBeInTheDocument();
      expect(screen.getByText('Compound Interest')).toBeInTheDocument();
      expect(screen.getByText('Allocation Management')).toBeInTheDocument();
    });
  });

  test('allows admin access', async () => {
    const adminUser = { ...mockUser, role: 'admin' };
    renderWithProviders(<StrategyManagerDashboard />, adminUser);
    
    await waitFor(() => {
      expect(screen.getByText('Strategy Manager Dashboard 📊')).toBeInTheDocument();
    });
  });
});
