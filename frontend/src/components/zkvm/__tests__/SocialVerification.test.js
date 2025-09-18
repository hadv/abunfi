import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import toast from 'react-hot-toast';

// Mock dependencies
jest.mock('react-hot-toast');
jest.mock('../../../contexts/Web3AuthContext');
jest.mock('../../../hooks/useContract');
jest.mock('../../../services/zkVMService');

import { useWeb3Auth } from '../../../contexts/Web3AuthContext';
import { useContractAddresses, useSocialAccountRegistryContract, useRiscZeroSocialVerifierContract } from '../../../hooks/useContract';
import zkVMService from '../../../services/zkVMService';
import SocialVerification from '../SocialVerification';

const theme = createTheme();

// Mock implementations
const mockContracts = {
  socialAccountRegistry: {
    getVerificationStatus: jest.fn(),
    getUserSocialAccounts: jest.fn(),
    linkSocialAccount: jest.fn()
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

const mockSupportedPlatforms = {
  TWITTER: { id: 0, name: 'Twitter', icon: '🐦', minAge: 30, minFollowers: 10 },
  DISCORD: { id: 1, name: 'Discord', icon: '💬', minAge: 14, minFollowers: 0 },
  GITHUB: { id: 2, name: 'GitHub', icon: '🐙', minAge: 90, minFollowers: 5 }
};

beforeEach(() => {
  // Reset all mocks
  jest.clearAllMocks();
  
  // Setup default mock implementations
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
  
  zkVMService.getSupportedPlatforms.mockReturnValue(mockSupportedPlatforms);
  zkVMService.getPlatformByName.mockImplementation((name) => mockSupportedPlatforms[name.toUpperCase()]);
  zkVMService.validateOAuthToken.mockReturnValue(true);
  zkVMService.getUserVerificationStatus.mockResolvedValue({
    hasVerification: false,
    verificationLevel: 0,
    linkedAccounts: []
  });
  zkVMService.getOAuthInstructions.mockReturnValue({
    title: 'Test OAuth Instructions',
    steps: ['Step 1', 'Step 2'],
    url: 'https://example.com'
  });
});

const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('SocialVerification Component', () => {
  test('renders social verification form', async () => {
    renderWithTheme(<SocialVerification />);
    
    expect(screen.getByText('Social Account Verification')).toBeInTheDocument();
    expect(screen.getByText('Verify your social accounts using zero-knowledge proofs')).toBeInTheDocument();
    expect(screen.getByLabelText('Select Platform')).toBeInTheDocument();
  });

  test('loads user verification status on mount', async () => {
    renderWithTheme(<SocialVerification />);
    
    await waitFor(() => {
      expect(zkVMService.getUserVerificationStatus).toHaveBeenCalledWith(
        '0x742d35Cc6634C0532925a3b8D4C9db96c4b4Db45',
        expect.objectContaining({
          socialAccountRegistry: mockContracts.socialAccountRegistry,
          riscZeroSocialVerifier: mockContracts.riscZeroSocialVerifier
        })
      );
    });
  });

  test('shows platform selection dropdown', async () => {
    renderWithTheme(<SocialVerification />);
    
    const platformSelect = screen.getByLabelText('Select Platform');
    fireEvent.mouseDown(platformSelect);
    
    await waitFor(() => {
      expect(screen.getByText('Twitter')).toBeInTheDocument();
      expect(screen.getByText('Discord')).toBeInTheDocument();
      expect(screen.getByText('GitHub')).toBeInTheDocument();
    });
  });

  test('shows OAuth token input when platform is selected', async () => {
    renderWithTheme(<SocialVerification />);
    
    const platformSelect = screen.getByLabelText('Select Platform');
    fireEvent.mouseDown(platformSelect);
    
    const twitterOption = await screen.findByText('Twitter');
    fireEvent.click(twitterOption);
    
    await waitFor(() => {
      expect(screen.getByLabelText('OAuth Token')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your Twitter OAuth token')).toBeInTheDocument();
    });
  });

  test('shows instructions button when platform is selected', async () => {
    renderWithTheme(<SocialVerification />);
    
    const platformSelect = screen.getByLabelText('Select Platform');
    fireEvent.mouseDown(platformSelect);
    
    const twitterOption = await screen.findByText('Twitter');
    fireEvent.click(twitterOption);
    
    await waitFor(() => {
      expect(screen.getByText('Instructions')).toBeInTheDocument();
    });
  });

  test('validates OAuth token before starting verification', async () => {
    zkVMService.validateOAuthToken.mockReturnValue(false);
    
    renderWithTheme(<SocialVerification />);
    
    // Select platform
    const platformSelect = screen.getByLabelText('Select Platform');
    fireEvent.mouseDown(platformSelect);
    const twitterOption = await screen.findByText('Twitter');
    fireEvent.click(twitterOption);
    
    // Enter invalid token
    const tokenInput = await screen.findByLabelText('OAuth Token');
    fireEvent.change(tokenInput, { target: { value: 'invalid-token' } });
    
    // Try to start verification
    const startButton = screen.getByText('Start Verification');
    fireEvent.click(startButton);
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid OAuth token format');
    });
  });

  test('starts verification process with valid inputs', async () => {
    const mockRequestId = '0xabc123...';
    zkVMService.requestVerification.mockResolvedValue(mockRequestId);
    
    renderWithTheme(<SocialVerification />);
    
    // Select platform
    const platformSelect = screen.getByLabelText('Select Platform');
    fireEvent.mouseDown(platformSelect);
    const twitterOption = await screen.findByText('Twitter');
    fireEvent.click(twitterOption);
    
    // Enter valid token
    const tokenInput = await screen.findByLabelText('OAuth Token');
    fireEvent.change(tokenInput, { target: { value: 'valid-twitter-token' } });
    
    // Start verification
    const startButton = screen.getByText('Start Verification');
    fireEvent.click(startButton);
    
    await waitFor(() => {
      expect(zkVMService.requestVerification).toHaveBeenCalledWith(
        'TWITTER',
        'valid-twitter-token',
        '0x742d35Cc6634C0532925a3b8D4C9db96c4b4Db45',
        expect.objectContaining({
          socialAccountRegistry: mockContracts.socialAccountRegistry,
          riscZeroSocialVerifier: mockContracts.riscZeroSocialVerifier
        })
      );
    });
    
    expect(screen.getByText('Generating zero-knowledge proof... This may take a few minutes.')).toBeInTheDocument();
  });

  test('shows instructions dialog when instructions button is clicked', async () => {
    renderWithTheme(<SocialVerification />);
    
    // Select platform
    const platformSelect = screen.getByLabelText('Select Platform');
    fireEvent.mouseDown(platformSelect);
    const twitterOption = await screen.findByText('Twitter');
    fireEvent.click(twitterOption);
    
    // Click instructions button
    const instructionsButton = await screen.findByText('Instructions');
    fireEvent.click(instructionsButton);
    
    await waitFor(() => {
      expect(screen.getByText('Test OAuth Instructions')).toBeInTheDocument();
      expect(screen.getByText('Step 1')).toBeInTheDocument();
      expect(screen.getByText('Step 2')).toBeInTheDocument();
    });
  });

  test('handles verification completion successfully', async () => {
    const mockOnComplete = jest.fn();
    const mockRequestId = '0xabc123...';
    
    zkVMService.requestVerification.mockResolvedValue(mockRequestId);
    zkVMService.checkVerificationStatus.mockResolvedValue({
      isCompleted: true,
      isVerified: true,
      data: {
        socialAccountHash: '0xdef456...',
        walletAddress: '0x742d35Cc6634C0532925a3b8D4C9db96c4b4Db45',
        platform: 0,
        accountAge: 2592000, // 30 days
        followerCount: 100,
        timestamp: Date.now(),
        socialAccountId: 'test_user'
      }
    });
    
    renderWithTheme(<SocialVerification onVerificationComplete={mockOnComplete} />);
    
    // Select platform and enter token
    const platformSelect = screen.getByLabelText('Select Platform');
    fireEvent.mouseDown(platformSelect);
    const twitterOption = await screen.findByText('Twitter');
    fireEvent.click(twitterOption);
    
    const tokenInput = await screen.findByLabelText('OAuth Token');
    fireEvent.change(tokenInput, { target: { value: 'valid-token' } });
    
    // Start verification
    const startButton = screen.getByText('Start Verification');
    fireEvent.click(startButton);
    
    // Wait for verification to complete
    await waitFor(() => {
      expect(screen.getByText(/✅ TWITTER account verified successfully!/)).toBeInTheDocument();
    }, { timeout: 3000 });
    
    expect(mockOnComplete).toHaveBeenCalledWith('TWITTER', expect.any(Object));
  });

  test('handles verification failure', async () => {
    const mockRequestId = '0xabc123...';
    
    zkVMService.requestVerification.mockResolvedValue(mockRequestId);
    zkVMService.checkVerificationStatus.mockResolvedValue({
      isCompleted: true,
      isVerified: false,
      data: null
    });
    
    renderWithTheme(<SocialVerification />);
    
    // Select platform and enter token
    const platformSelect = screen.getByLabelText('Select Platform');
    fireEvent.mouseDown(platformSelect);
    const twitterOption = await screen.findByText('Twitter');
    fireEvent.click(twitterOption);
    
    const tokenInput = await screen.findByLabelText('OAuth Token');
    fireEvent.change(tokenInput, { target: { value: 'invalid-token' } });
    
    // Start verification
    const startButton = screen.getByText('Start Verification');
    fireEvent.click(startButton);
    
    // Wait for verification to fail
    await waitFor(() => {
      expect(screen.getByText('Verification failed. Please check your OAuth token and try again.')).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
