import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import PasskeyAuthentication from '../PasskeyAuthentication';
import passkeyService from '../../services/passkeyService';

// Mock dependencies
jest.mock('../../services/passkeyService');

const theme = createTheme();

const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('PasskeyAuthentication', () => {
  const defaultProps = {
    open: true,
    onClose: jest.fn(),
    onSuccess: jest.fn(),
    temporaryToken: 'test-token',
    title: 'Test Authentication',
    subtitle: 'Test subtitle'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    passkeyService.isSupported = true;
    passkeyService.getSupportDetails.mockReturnValue({
      platform: true,
      crossPlatform: true,
      userVerification: true
    });
  });

  it('renders authentication dialog when open', () => {
    renderWithTheme(<PasskeyAuthentication {...defaultProps} />);
    
    expect(screen.getByText('Test Authentication')).toBeInTheDocument();
    expect(screen.getByText('Test subtitle')).toBeInTheDocument();
    expect(screen.getByText('Authenticate')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    renderWithTheme(<PasskeyAuthentication {...defaultProps} open={false} />);
    
    expect(screen.queryByText('Test Authentication')).not.toBeInTheDocument();
  });

  it('shows unsupported message when passkeys not supported', () => {
    passkeyService.isSupported = false;
    
    renderWithTheme(<PasskeyAuthentication {...defaultProps} />);
    
    expect(screen.getByText(/not supported/i)).toBeInTheDocument();
  });

  it('handles successful authentication', async () => {
    passkeyService.authenticate.mockResolvedValue({
      success: true,
      message: 'Authentication successful'
    });

    renderWithTheme(<PasskeyAuthentication {...defaultProps} />);
    
    const authenticateButton = screen.getByText('Authenticate');
    fireEvent.click(authenticateButton);

    await waitFor(() => {
      expect(passkeyService.authenticate).toHaveBeenCalledWith('test-token');
      expect(defaultProps.onSuccess).toHaveBeenCalled();
    });
  });

  it('handles authentication failure', async () => {
    const errorMessage = 'Authentication failed';
    passkeyService.authenticate.mockRejectedValue(new Error(errorMessage));

    renderWithTheme(<PasskeyAuthentication {...defaultProps} />);
    
    const authenticateButton = screen.getByText('Authenticate');
    fireEvent.click(authenticateButton);

    await waitFor(() => {
      expect(screen.getByText(/failed/i)).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });
  });

  it('shows loading state during authentication', async () => {
    let resolveAuth;
    passkeyService.authenticate.mockReturnValue(
      new Promise(resolve => { resolveAuth = resolve; })
    );

    renderWithTheme(<PasskeyAuthentication {...defaultProps} />);
    
    const authenticateButton = screen.getByText('Authenticate');
    fireEvent.click(authenticateButton);

    expect(screen.getByText('Authenticating...')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    // Resolve the promise
    resolveAuth({ success: true });
    
    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalled();
    });
  });

  it('allows retry after failure', async () => {
    passkeyService.authenticate
      .mockRejectedValueOnce(new Error('First failure'))
      .mockResolvedValueOnce({ success: true });

    renderWithTheme(<PasskeyAuthentication {...defaultProps} />);
    
    // First attempt
    const authenticateButton = screen.getByText('Authenticate');
    fireEvent.click(authenticateButton);

    await waitFor(() => {
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    // Retry
    const retryButton = screen.getByText('Try Again');
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(passkeyService.authenticate).toHaveBeenCalledTimes(2);
      expect(defaultProps.onSuccess).toHaveBeenCalled();
    });
  });

  it('handles close button click', () => {
    renderWithTheme(<PasskeyAuthentication {...defaultProps} />);
    
    const closeButton = screen.getByLabelText('close');
    fireEvent.click(closeButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('handles cancel button click', () => {
    renderWithTheme(<PasskeyAuthentication {...defaultProps} />);
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('shows appropriate error messages for different error types', async () => {
    const testCases = [
      { error: 'NotAllowedError', expectedText: /cancelled/i },
      { error: 'SecurityError', expectedText: /security/i },
      { error: 'NetworkError', expectedText: /network/i },
      { error: 'UnknownError', expectedText: /unexpected/i }
    ];

    for (const testCase of testCases) {
      const error = new Error(testCase.error);
      error.name = testCase.error;
      
      passkeyService.authenticate.mockRejectedValue(error);

      renderWithTheme(<PasskeyAuthentication {...defaultProps} />);
      
      const authenticateButton = screen.getByText('Authenticate');
      fireEvent.click(authenticateButton);

      await waitFor(() => {
        expect(screen.getByText(testCase.expectedText)).toBeInTheDocument();
      });

      // Clean up for next iteration
      defaultProps.onClose.mockClear();
    }
  });

  it('displays support details when available', () => {
    passkeyService.getSupportDetails.mockReturnValue({
      platform: true,
      crossPlatform: false,
      userVerification: true
    });

    renderWithTheme(<PasskeyAuthentication {...defaultProps} />);
    
    expect(screen.getByText(/Face ID, Touch ID, or Windows Hello/i)).toBeInTheDocument();
  });

  it('handles missing temporary token', () => {
    renderWithTheme(
      <PasskeyAuthentication 
        {...defaultProps} 
        temporaryToken={null}
      />
    );
    
    const authenticateButton = screen.getByText('Authenticate');
    expect(authenticateButton).toBeDisabled();
  });

  it('shows success state after authentication', async () => {
    passkeyService.authenticate.mockResolvedValue({
      success: true,
      message: 'Authentication successful'
    });

    renderWithTheme(<PasskeyAuthentication {...defaultProps} />);
    
    const authenticateButton = screen.getByText('Authenticate');
    fireEvent.click(authenticateButton);

    await waitFor(() => {
      expect(screen.getByText(/success/i)).toBeInTheDocument();
    });
  });

  it('handles keyboard navigation', () => {
    renderWithTheme(<PasskeyAuthentication {...defaultProps} />);
    
    const dialog = screen.getByRole('dialog');
    
    // Test Escape key
    fireEvent.keyDown(dialog, { key: 'Escape', code: 'Escape' });
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('focuses on authenticate button when dialog opens', async () => {
    renderWithTheme(<PasskeyAuthentication {...defaultProps} />);
    
    await waitFor(() => {
      const authenticateButton = screen.getByText('Authenticate');
      expect(authenticateButton).toHaveFocus();
    });
  });
});
