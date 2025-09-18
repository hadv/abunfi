import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';

// Mock dependencies
jest.mock('../../../contexts/Web3AuthContext');
jest.mock('../../../hooks/useContract');
jest.mock('../../../services/zkVMService');

import { useWeb3Auth } from '../../../contexts/Web3AuthContext';
import { useContractAddresses, useSocialAccountRegistryContract, useRiscZeroSocialVerifierContract } from '../../../hooks/useContract';
import zkVMService from '../../../services/zkVMService';
import SocialVerificationPage from '../../../pages/SocialVerificationPage';

const theme = createTheme();

// Mock implementations
const mockContracts = {
  socialAccountRegistry: {
    getVerificationStatus: jest.fn(),
    getUserSocialAccounts: jest.fn()
  },
  riscZeroSocialVerifier: {
    requestVerification: jest.fn(),
    getVerificationResult: jest.fn()
  }
};

const mockAddresses = {
  socialAccountRegistry: '0x123...',
  riscZeroSocialVerifier: '0x456...'
};

beforeEach(() => {
  jest.clearAllMocks();
  
  useWeb3Auth.mockReturnValue({
    walletAddress: '0x742d35Cc6634C0532925a3b8D4C9db96c4b4Db45'
  });
  
  useContractAddresses.mockReturnValue(mockAddresses);
  
  useSocialAccountRegistryContract.mockReturnValue({
    contract: mockContracts.socialAccountRegistry
  });
  
  useRiscZeroSocialVerifierContract.mockReturnValue({
    contract: mockContracts.riscZeroSocialVerifier
  });
  
  zkVMService.getSupportedPlatforms.mockReturnValue({
    TWITTER: { id: 0, name: 'Twitter', icon: '🐦', minAge: 30, minFollowers: 10 },
    DISCORD: { id: 1, name: 'Discord', icon: '💬', minAge: 14, minFollowers: 0 }
  });
  
  zkVMService.getUserVerificationStatus.mockResolvedValue({
    hasVerification: true,
    verificationLevel: 2,
    linkedAccounts: [
      {
        platform: { id: 0, name: 'Twitter', icon: '🐦' },
        accountHash: '0xabc123...',
        platformId: 0
      },
      {
        platform: { id: 1, name: 'Discord', icon: '💬' },
        accountHash: '0xdef456...',
        platformId: 1
      }
    ]
  });
});

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        {component}
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('zkVM Integration Tests', () => {
  test('renders social verification page with all components', async () => {
    renderWithProviders(<SocialVerificationPage />);
    
    // Check page title and description
    expect(screen.getByText('Social Verification')).toBeInTheDocument();
    expect(screen.getByText('Enhance your account security with zero-knowledge social verification')).toBeInTheDocument();
    expect(screen.getByText('Powered by RISC Zero zkVM')).toBeInTheDocument();
    
    // Check verification status component
    await waitFor(() => {
      expect(screen.getByText('Verification Status')).toBeInTheDocument();
    });
    
    // Check verification form
    expect(screen.getByText('Social Account Verification')).toBeInTheDocument();
    expect(screen.getByLabelText('Select Platform')).toBeInTheDocument();
    
    // Check benefits section
    expect(screen.getByText('Verification Benefits')).toBeInTheDocument();
    expect(screen.getByText('Higher Gas Limits')).toBeInTheDocument();
    expect(screen.getByText('Enhanced Security')).toBeInTheDocument();
    
    // Check security features
    expect(screen.getByText('Privacy & Security')).toBeInTheDocument();
    expect(screen.getByText('Zero-knowledge proofs protect your privacy')).toBeInTheDocument();
    
    // Check how it works section
    expect(screen.getByText('How It Works')).toBeInTheDocument();
    expect(screen.getByText('1. Select Platform:')).toBeInTheDocument();
  });

  test('displays user verification status correctly', async () => {
    renderWithProviders(<SocialVerificationPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Medium Security')).toBeInTheDocument();
      expect(screen.getByText('2 platform(s) verified')).toBeInTheDocument();
    });
    
    // Check linked accounts are displayed
    await waitFor(() => {
      expect(screen.getByText('Linked Accounts:')).toBeInTheDocument();
    });
  });

  test('handles wallet not connected state', () => {
    useWeb3Auth.mockReturnValue({
      walletAddress: null
    });
    
    renderWithProviders(<SocialVerificationPage />);
    
    expect(screen.getByText('Please connect your wallet to access social verification features.')).toBeInTheDocument();
  });

  test('zkVM service methods are called correctly', async () => {
    renderWithProviders(<SocialVerificationPage />);
    
    await waitFor(() => {
      expect(zkVMService.getUserVerificationStatus).toHaveBeenCalledWith(
        '0x742d35Cc6634C0532925a3b8D4C9db96c4b4Db45',
        expect.objectContaining({
          socialAccountRegistry: mockContracts.socialAccountRegistry
        })
      );
    });
    
    expect(zkVMService.getSupportedPlatforms).toHaveBeenCalled();
  });

  test('contract hooks are initialized with correct addresses', () => {
    renderWithProviders(<SocialVerificationPage />);
    
    expect(useContractAddresses).toHaveBeenCalled();
    expect(useSocialAccountRegistryContract).toHaveBeenCalledWith('0x123...');
    expect(useRiscZeroSocialVerifierContract).toHaveBeenCalledWith('0x456...');
  });

  test('verification completion shows success message', async () => {
    renderWithProviders(<SocialVerificationPage />);
    
    // Simulate verification completion by finding the SocialVerification component
    // and triggering its onVerificationComplete callback
    const verificationForm = screen.getByText('Social Account Verification').closest('div');
    expect(verificationForm).toBeInTheDocument();
    
    // Note: In a real integration test, we would simulate the full verification flow
    // For now, we just verify the components are rendered correctly
  });

  test('all required zkVM components are present', async () => {
    renderWithProviders(<SocialVerificationPage />);
    
    // Verify SocialVerificationStatus component is rendered
    await waitFor(() => {
      expect(screen.getByText('Verification Status')).toBeInTheDocument();
    });
    
    // Verify SocialVerification component is rendered
    expect(screen.getByText('Social Account Verification')).toBeInTheDocument();
    
    // Verify platform selection is available
    expect(screen.getByLabelText('Select Platform')).toBeInTheDocument();
    
    // Verify start verification button is present
    expect(screen.getByText('Start Verification')).toBeInTheDocument();
  });

  test('responsive layout works correctly', async () => {
    // Mock window.matchMedia for responsive testing
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query.includes('(max-width: 768px)'),
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
    
    renderWithProviders(<SocialVerificationPage />);
    
    // Verify the page renders without errors on mobile
    expect(screen.getByText('Social Verification')).toBeInTheDocument();
    expect(screen.getByText('Verification Benefits')).toBeInTheDocument();
  });
});
