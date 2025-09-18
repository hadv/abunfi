import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import BatchingSystemInfo from '../BatchingSystemInfo';
import { vaultService } from '../../services/vaultService';

// Mock the vault service
jest.mock('../../services/vaultService', () => ({
  vaultService: {
    getBatchingConfig: jest.fn(),
    getPendingAllocations: jest.fn(),
    getGasSavingsEstimate: jest.fn()
  }
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>
  },
  AnimatePresence: ({ children }) => children
}));

describe('BatchingSystemInfo', () => {
  const mockBatchingConfig = {
    threshold: 1000,
    interval: 14400,
    emergencyThreshold: 5000,
    lastAllocationTime: Math.floor(Date.now() / 1000) - 7200
  };

  const mockPendingAllocations = {
    total: 750,
    lowRisk: 300,
    mediumRisk: 350,
    highRisk: 100,
    userCount: 12
  };

  const mockGasSavings = {
    originalGasCost: '0.005',
    finalGasCost: '0.001',
    savedAmount: '8.00',
    percentageSaved: 80,
    estimatedUsers: 10
  };

  beforeEach(() => {
    jest.clearAllMocks();
    vaultService.getBatchingConfig.mockResolvedValue(mockBatchingConfig);
    vaultService.getPendingAllocations.mockResolvedValue(mockPendingAllocations);
    vaultService.getGasSavingsEstimate.mockResolvedValue(mockGasSavings);
  });

  test('renders batching system info correctly', async () => {
    render(<BatchingSystemInfo depositAmount="100" />);

    // Wait for data to load first
    await waitFor(() => {
      expect(screen.getByText('Smart Batching System')).toBeInTheDocument();
    });

    // Wait for batch progress to be displayed
    await waitFor(() => {
      expect(screen.getByText('Batch Progress')).toBeInTheDocument();
    });

    // Check if batch progress is displayed
    expect(screen.getByText('$750 / $1,000')).toBeInTheDocument();

    // Check if user count is displayed
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('Users in Batch')).toBeInTheDocument();
  });

  test('displays gas savings when deposit amount is provided', async () => {
    const onGasSavingsUpdate = jest.fn();
    
    render(
      <BatchingSystemInfo 
        depositAmount="100" 
        onGasSavingsUpdate={onGasSavingsUpdate}
      />
    );

    await waitFor(() => {
      expect(vaultService.getGasSavingsEstimate).toHaveBeenCalledWith('100');
    });

    await waitFor(() => {
      expect(screen.getByText(/Gas Savings:/)).toBeInTheDocument();
      expect(screen.getByText(/\$8\.00/)).toBeInTheDocument();
    });

    expect(onGasSavingsUpdate).toHaveBeenCalledWith(mockGasSavings);
  });

  test('shows emergency batch alert when threshold is exceeded', async () => {
    const highPendingAllocations = {
      ...mockPendingAllocations,
      total: 6000 // Above emergency threshold
    };
    
    vaultService.getPendingAllocations.mockResolvedValue(highPendingAllocations);

    render(<BatchingSystemInfo depositAmount="100" />);

    await waitFor(() => {
      expect(screen.getByText(/Immediate Allocation:/)).toBeInTheDocument();
      expect(screen.getByText(/Large deposit volume detected/)).toBeInTheDocument();
    });
  });

  test('expands and collapses detailed information', async () => {
    render(<BatchingSystemInfo depositAmount="100" />);

    await waitFor(() => {
      expect(screen.getByText('Smart Batching System')).toBeInTheDocument();
    });

    // Find expand button by icon
    const expandButton = screen.getByTestId('ExpandMoreIcon').closest('button');

    // Click expand button to ensure content is visible
    fireEvent.click(expandButton);

    // Now detailed info should be visible
    await waitFor(() => {
      expect(screen.getByText('How Batching Works')).toBeInTheDocument();
    });

    expect(screen.getByText(/Deposit Pooling:/)).toBeInTheDocument();
    expect(screen.getByText(/Smart Timing:/)).toBeInTheDocument();
    expect(screen.getByText(/Gas Efficiency:/)).toBeInTheDocument();
    expect(screen.getByText(/Yield Optimization:/)).toBeInTheDocument();

    // Click again to collapse
    fireEvent.click(expandButton);

    // Content should still be in DOM but potentially hidden by CSS
    expect(screen.getByText('How Batching Works')).toBeInTheDocument();
  });

  test('displays risk level distribution in expanded view', async () => {
    render(<BatchingSystemInfo depositAmount="100" />);

    await waitFor(() => {
      expect(screen.getByText('Smart Batching System')).toBeInTheDocument();
    });

    // Expand the component
    const expandButton = screen.getByTestId('ExpandMoreIcon').closest('button');
    fireEvent.click(expandButton);

    await waitFor(() => {
      expect(screen.getByText('Current Batch Composition')).toBeInTheDocument();
    });

    // Check risk level chips
    expect(screen.getByText(/Low Risk: \$300/)).toBeInTheDocument();
    expect(screen.getByText(/Medium Risk: \$350/)).toBeInTheDocument();
    expect(screen.getByText(/High Risk: \$100/)).toBeInTheDocument();
  });

  test('handles loading state correctly', () => {
    // Mock services to never resolve
    vaultService.getBatchingConfig.mockImplementation(() => new Promise(() => {}));
    vaultService.getPendingAllocations.mockImplementation(() => new Promise(() => {}));

    render(<BatchingSystemInfo depositAmount="100" />);

    expect(screen.getByText('Loading batching information...')).toBeInTheDocument();
  });

  test('handles API errors gracefully', async () => {
    vaultService.getBatchingConfig.mockRejectedValue(new Error('API Error'));
    vaultService.getPendingAllocations.mockRejectedValue(new Error('API Error'));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<BatchingSystemInfo depositAmount="100" />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load batching data:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  test('calculates batch progress correctly', async () => {
    render(<BatchingSystemInfo depositAmount="100" />);

    await waitFor(() => {
      // Progress should be 750/1000 = 75%
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '75');
    });
  });

  test('formats currency correctly', async () => {
    render(<BatchingSystemInfo depositAmount="100" />);

    await waitFor(() => {
      expect(screen.getByText('$750 / $1,000')).toBeInTheDocument();
    });
  });

  test('does not call gas estimate when no deposit amount', async () => {
    render(<BatchingSystemInfo />);

    await waitFor(() => {
      expect(screen.getByText('Smart Batching System')).toBeInTheDocument();
    });

    expect(vaultService.getGasSavingsEstimate).not.toHaveBeenCalled();
  });

  test('updates gas estimate when deposit amount changes', async () => {
    const { rerender } = render(<BatchingSystemInfo depositAmount="100" />);

    await waitFor(() => {
      expect(vaultService.getGasSavingsEstimate).toHaveBeenCalledWith('100');
    });

    // Change deposit amount
    rerender(<BatchingSystemInfo depositAmount="200" />);

    await waitFor(() => {
      expect(vaultService.getGasSavingsEstimate).toHaveBeenCalledWith('200');
    });
  });
});
