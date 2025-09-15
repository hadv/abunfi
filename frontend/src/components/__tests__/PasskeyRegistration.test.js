import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import PasskeyRegistration from '../PasskeyRegistration';
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

describe('PasskeyRegistration', () => {
  const defaultProps = {
    open: true,
    onClose: jest.fn(),
    onSuccess: jest.fn()
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

  it('renders registration dialog when open', () => {
    renderWithTheme(<PasskeyRegistration {...defaultProps} />);
    
    expect(screen.getByText('Set Up Passkey')).toBeInTheDocument();
    expect(screen.getByText(/secure your account/i)).toBeInTheDocument();
  });

  it('shows compatibility check step initially', () => {
    renderWithTheme(<PasskeyRegistration {...defaultProps} />);
    
    expect(screen.getByText('Checking Compatibility...')).toBeInTheDocument();
  });

  it('progresses to device naming step after compatibility check', async () => {
    renderWithTheme(<PasskeyRegistration {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Name Your Device')).toBeInTheDocument();
      expect(screen.getByLabelText(/device name/i)).toBeInTheDocument();
    });
  });

  it('shows unsupported message when passkeys not supported', async () => {
    passkeyService.isSupported = false;
    
    renderWithTheme(<PasskeyRegistration {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText(/not supported/i)).toBeInTheDocument();
    });
  });

  it('validates device name input', async () => {
    renderWithTheme(<PasskeyRegistration {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Name Your Device')).toBeInTheDocument();
    });

    const nextButton = screen.getByText('Next');
    
    // Should be disabled initially
    expect(nextButton).toBeDisabled();

    // Enter device name
    const deviceNameInput = screen.getByLabelText(/device name/i);
    fireEvent.change(deviceNameInput, { target: { value: 'My iPhone' } });

    // Should be enabled now
    expect(nextButton).not.toBeDisabled();
  });

  it('handles successful registration', async () => {
    passkeyService.register.mockResolvedValue({
      success: true,
      isFirstPasskey: true,
      achievements: ['first_passkey'],
      securityBonus: 100
    });

    renderWithTheme(<PasskeyRegistration {...defaultProps} />);
    
    // Wait for device naming step
    await waitFor(() => {
      expect(screen.getByText('Name Your Device')).toBeInTheDocument();
    });

    // Enter device name and proceed
    const deviceNameInput = screen.getByLabelText(/device name/i);
    fireEvent.change(deviceNameInput, { target: { value: 'My iPhone' } });
    
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    // Should show registration step
    await waitFor(() => {
      expect(screen.getByText('Create Passkey')).toBeInTheDocument();
    });

    // Click create passkey
    const createButton = screen.getByText('Create Passkey');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(passkeyService.register).toHaveBeenCalledWith('My iPhone');
      expect(defaultProps.onSuccess).toHaveBeenCalledWith({
        success: true,
        isFirstPasskey: true,
        achievements: ['first_passkey'],
        securityBonus: 100
      });
    });
  });

  it('handles registration failure', async () => {
    const errorMessage = 'Registration failed';
    passkeyService.register.mockRejectedValue(new Error(errorMessage));

    renderWithTheme(<PasskeyRegistration {...defaultProps} />);
    
    // Navigate to registration step
    await waitFor(() => {
      expect(screen.getByText('Name Your Device')).toBeInTheDocument();
    });

    const deviceNameInput = screen.getByLabelText(/device name/i);
    fireEvent.change(deviceNameInput, { target: { value: 'My iPhone' } });
    
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Create Passkey')).toBeInTheDocument();
    });

    const createButton = screen.getByText('Create Passkey');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText(/failed/i)).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });
  });

  it('shows loading state during registration', async () => {
    let resolveRegistration;
    passkeyService.register.mockReturnValue(
      new Promise(resolve => { resolveRegistration = resolve; })
    );

    renderWithTheme(<PasskeyRegistration {...defaultProps} />);
    
    // Navigate to registration step
    await waitFor(() => {
      expect(screen.getByText('Name Your Device')).toBeInTheDocument();
    });

    const deviceNameInput = screen.getByLabelText(/device name/i);
    fireEvent.change(deviceNameInput, { target: { value: 'My iPhone' } });
    
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Create Passkey')).toBeInTheDocument();
    });

    const createButton = screen.getByText('Create Passkey');
    fireEvent.click(createButton);

    expect(screen.getByText('Creating...')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    // Resolve the promise
    resolveRegistration({ success: true });
    
    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalled();
    });
  });

  it('allows navigation between steps', async () => {
    renderWithTheme(<PasskeyRegistration {...defaultProps} />);
    
    // Wait for device naming step
    await waitFor(() => {
      expect(screen.getByText('Name Your Device')).toBeInTheDocument();
    });

    // Enter device name and proceed
    const deviceNameInput = screen.getByLabelText(/device name/i);
    fireEvent.change(deviceNameInput, { target: { value: 'My iPhone' } });
    
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    // Should show registration step
    await waitFor(() => {
      expect(screen.getByText('Create Passkey')).toBeInTheDocument();
    });

    // Go back
    const backButton = screen.getByText('Back');
    fireEvent.click(backButton);

    // Should be back to device naming
    await waitFor(() => {
      expect(screen.getByText('Name Your Device')).toBeInTheDocument();
    });
  });

  it('shows rewards information for first passkey', async () => {
    renderWithTheme(<PasskeyRegistration {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText(/security bonus/i)).toBeInTheDocument();
      expect(screen.getByText(/achievement/i)).toBeInTheDocument();
    });
  });

  it('handles device name validation', async () => {
    renderWithTheme(<PasskeyRegistration {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Name Your Device')).toBeInTheDocument();
    });

    const deviceNameInput = screen.getByLabelText(/device name/i);
    const nextButton = screen.getByText('Next');

    // Test empty name
    fireEvent.change(deviceNameInput, { target: { value: '' } });
    expect(nextButton).toBeDisabled();

    // Test too long name
    fireEvent.change(deviceNameInput, { target: { value: 'a'.repeat(101) } });
    expect(screen.getByText(/too long/i)).toBeInTheDocument();

    // Test valid name
    fireEvent.change(deviceNameInput, { target: { value: 'Valid Device Name' } });
    expect(nextButton).not.toBeDisabled();
  });

  it('handles close button click', () => {
    renderWithTheme(<PasskeyRegistration {...defaultProps} />);
    
    const closeButton = screen.getByLabelText('close');
    fireEvent.click(closeButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('handles cancel button click', async () => {
    renderWithTheme(<PasskeyRegistration {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Name Your Device')).toBeInTheDocument();
    });

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('shows appropriate error messages for different error types', async () => {
    const testCases = [
      { error: 'NotAllowedError', expectedText: /cancelled/i },
      { error: 'SecurityError', expectedText: /security/i },
      { error: 'NetworkError', expectedText: /network/i }
    ];

    for (const testCase of testCases) {
      const error = new Error(testCase.error);
      error.name = testCase.error;
      
      passkeyService.register.mockRejectedValue(error);

      renderWithTheme(<PasskeyRegistration {...defaultProps} />);
      
      // Navigate to registration step
      await waitFor(() => {
        expect(screen.getByText('Name Your Device')).toBeInTheDocument();
      });

      const deviceNameInput = screen.getByLabelText(/device name/i);
      fireEvent.change(deviceNameInput, { target: { value: 'Test Device' } });
      
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Create Passkey')).toBeInTheDocument();
      });

      const createButton = screen.getByText('Create Passkey');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText(testCase.expectedText)).toBeInTheDocument();
      });

      // Clean up for next iteration
      defaultProps.onClose.mockClear();
    }
  });
});
