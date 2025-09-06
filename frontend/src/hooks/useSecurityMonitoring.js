import { useState, useEffect, useCallback, useRef } from 'react';
import { useWeb3Auth } from '../contexts/Web3AuthContext';
import { useRateLimitingService } from '../services/rateLimitingService';
import { useWebSocket } from './useWebSocket';
import toast from 'react-hot-toast';

/**
 * Hook for real-time security monitoring
 * Monitors rate limits, security events, and provides real-time updates
 */
export const useSecurityMonitoring = (options = {}) => {
  const {
    enableWebSocket = true,
    monitoringInterval = 60000, // 1 minute
    enableNotifications = true,
    autoRefresh = true
  } = options;

  const { walletAddress, isAuthenticated } = useWeb3Auth();
  const { service: rateLimitingService, isReady } = useRateLimitingService();
  
  const [securityStatus, setSecurityStatus] = useState(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [securityEvents, setSecurityEvents] = useState([]);
  
  const intervalRef = useRef(null);
  const previousStatusRef = useRef(null);

  // WebSocket connection for real-time updates
  const {
    isConnected: wsConnected,
    lastMessage: wsMessage,
    sendMessage: wsSendMessage
  } = useWebSocket(
    enableWebSocket && isAuthenticated ? '/security-monitoring' : null,
    {
      reconnectAttempts: 3,
      reconnectInterval: 10000,
      onOpen: () => {
        setConnectionStatus('connected');
        console.log('Security monitoring WebSocket connected');
      },
      onClose: () => {
        setConnectionStatus('disconnected');
        console.log('Security monitoring WebSocket disconnected');
      },
      onError: (error) => {
        setConnectionStatus('error');
        console.error('Security monitoring WebSocket error:', error);
      }
    }
  );

  // Load security status
  const loadSecurityStatus = useCallback(async () => {
    if (!isReady || !walletAddress || !rateLimitingService) {
      return null;
    }

    try {
      const status = await rateLimitingService.getSecurityStatus(walletAddress);
      setSecurityStatus(status);
      setLastUpdate(new Date());
      
      // Check for significant changes
      if (previousStatusRef.current) {
        checkForSecurityChanges(previousStatusRef.current, status);
      }
      
      previousStatusRef.current = status;
      return status;
    } catch (error) {
      console.error('Failed to load security status:', error);
      return null;
    }
  }, [isReady, walletAddress, rateLimitingService]);

  // Check for significant security changes
  const checkForSecurityChanges = useCallback((previousStatus, currentStatus) => {
    if (!enableNotifications) return;

    const events = [];

    // Check for status changes
    if (previousStatus.isActive !== currentStatus.isActive) {
      events.push({
        type: 'status_change',
        severity: currentStatus.isActive ? 'info' : 'warning',
        message: `Gasless transactions ${currentStatus.isActive ? 'enabled' : 'disabled'}`,
        timestamp: new Date()
      });
    }

    // Check for whitelist changes
    if (previousStatus.isWhitelisted !== currentStatus.isWhitelisted) {
      events.push({
        type: 'whitelist_change',
        severity: 'info',
        message: `Account ${currentStatus.isWhitelisted ? 'whitelisted' : 'removed from whitelist'}`,
        timestamp: new Date()
      });
    }

    // Check for risk level changes
    if (previousStatus.riskLevel !== currentStatus.riskLevel) {
      const severity = currentStatus.riskLevel === 'high' ? 'error' : 
                     currentStatus.riskLevel === 'medium' ? 'warning' : 'info';
      events.push({
        type: 'risk_level_change',
        severity,
        message: `Security risk level changed to ${currentStatus.riskLevel}`,
        timestamp: new Date()
      });
    }

    // Check for approaching limits
    const gasPercentage = currentStatus.dailyLimits.gas.percentage;
    const txPercentage = currentStatus.dailyLimits.transactions.percentage;
    const prevGasPercentage = previousStatus.dailyLimits.gas.percentage;
    const prevTxPercentage = previousStatus.dailyLimits.transactions.percentage;

    // Gas limit warnings
    if (gasPercentage >= 90 && prevGasPercentage < 90) {
      events.push({
        type: 'gas_limit_critical',
        severity: 'error',
        message: 'Critical: You have used 90% of your daily gas limit',
        timestamp: new Date()
      });
    } else if (gasPercentage >= 75 && prevGasPercentage < 75) {
      events.push({
        type: 'gas_limit_warning',
        severity: 'warning',
        message: 'Warning: You have used 75% of your daily gas limit',
        timestamp: new Date()
      });
    }

    // Transaction limit warnings
    if (txPercentage >= 90 && prevTxPercentage < 90) {
      events.push({
        type: 'tx_limit_critical',
        severity: 'error',
        message: 'Critical: You have used 90% of your daily transaction limit',
        timestamp: new Date()
      });
    } else if (txPercentage >= 75 && prevTxPercentage < 75) {
      events.push({
        type: 'tx_limit_warning',
        severity: 'warning',
        message: 'Warning: You have used 75% of your daily transaction limit',
        timestamp: new Date()
      });
    }

    // Add events and show notifications
    if (events.length > 0) {
      setSecurityEvents(prev => [...prev, ...events]);
      
      events.forEach(event => {
        switch (event.severity) {
          case 'error':
            toast.error(event.message, { duration: 8000 });
            break;
          case 'warning':
            toast.warning(event.message, { duration: 6000 });
            break;
          case 'info':
            toast.info(event.message, { duration: 4000 });
            break;
          default:
            toast(event.message);
        }
      });
    }
  }, [enableNotifications]);

  // Handle WebSocket messages
  useEffect(() => {
    if (wsMessage && wsMessage.type === 'security_update') {
      const { data } = wsMessage;
      
      if (data.walletAddress === walletAddress) {
        // Update security status from WebSocket
        setSecurityStatus(data.securityStatus);
        setLastUpdate(new Date());
        
        // Check for changes
        if (previousStatusRef.current) {
          checkForSecurityChanges(previousStatusRef.current, data.securityStatus);
        }
        
        previousStatusRef.current = data.securityStatus;
      }
    }
  }, [wsMessage, walletAddress, checkForSecurityChanges]);

  // Start monitoring
  const startMonitoring = useCallback(() => {
    if (isMonitoring) return;

    setIsMonitoring(true);
    
    // Initial load
    loadSecurityStatus();
    
    // Set up polling if WebSocket is not available or disabled
    if (autoRefresh && (!enableWebSocket || !wsConnected)) {
      intervalRef.current = setInterval(loadSecurityStatus, monitoringInterval);
    }

    // Subscribe to security updates via WebSocket
    if (enableWebSocket && wsConnected && walletAddress) {
      wsSendMessage({
        type: 'subscribe_security',
        walletAddress
      });
    }
  }, [
    isMonitoring, 
    loadSecurityStatus, 
    autoRefresh, 
    enableWebSocket, 
    wsConnected, 
    monitoringInterval,
    walletAddress,
    wsSendMessage
  ]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Unsubscribe from WebSocket updates
    if (enableWebSocket && wsConnected && walletAddress) {
      wsSendMessage({
        type: 'unsubscribe_security',
        walletAddress
      });
    }
  }, [enableWebSocket, wsConnected, walletAddress, wsSendMessage]);

  // Auto start/stop monitoring based on authentication
  useEffect(() => {
    if (isAuthenticated && walletAddress && isReady) {
      startMonitoring();
    } else {
      stopMonitoring();
    }

    return () => {
      stopMonitoring();
    };
  }, [isAuthenticated, walletAddress, isReady, startMonitoring, stopMonitoring]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Manual refresh
  const refreshSecurityStatus = useCallback(async () => {
    if (rateLimitingService && walletAddress) {
      rateLimitingService.clearCache(walletAddress);
      return await loadSecurityStatus();
    }
    return null;
  }, [rateLimitingService, walletAddress, loadSecurityStatus]);

  // Clear security events
  const clearSecurityEvents = useCallback(() => {
    setSecurityEvents([]);
  }, []);

  return {
    // Status
    securityStatus,
    isMonitoring,
    lastUpdate,
    connectionStatus: enableWebSocket ? connectionStatus : 'disabled',
    securityEvents,
    
    // Actions
    startMonitoring,
    stopMonitoring,
    refreshSecurityStatus,
    clearSecurityEvents,
    
    // Utilities
    isConnected: wsConnected,
    canMonitor: isReady && isAuthenticated && walletAddress
  };
};
