import { useState, useEffect, useRef, useCallback } from 'react';

const useWebSocket = (url, options = {}) => {
  const {
    onMessage,
    onOpen,
    onClose,
    onError,
    enabled = true,
    reconnectAttempts = 3,
    reconnectInterval = 5000
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  
  const ws = useRef(null);
  const reconnectTimeoutId = useRef(null);
  const reconnectCount = useRef(0);

  const connect = useCallback(() => {
    if (!enabled) return;

    try {
      const token = localStorage.getItem('abunfi_token');
      if (!token) {
        console.warn('No authentication token found for WebSocket connection');
        return;
      }

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = process.env.REACT_APP_WS_URL || 'localhost:3001';
      const wsUrl = `${protocol}//${host}${url}?token=${token}`;

      setConnectionStatus('Connecting...');
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = (event) => {
        setIsConnected(true);
        setConnectionStatus('Connected');
        reconnectCount.current = 0;
        
        // Send subscription message for strategy updates
        if (ws.current.readyState === WebSocket.OPEN) {
          ws.current.send(JSON.stringify({
            type: 'subscribe_strategy_updates'
          }));
        }

        if (onOpen) onOpen(event);
      };

      ws.current.onmessage = (event) => {
        const message = event;
        setLastMessage(message);
        if (onMessage) onMessage(message);
      };

      ws.current.onclose = (event) => {
        setIsConnected(false);
        setConnectionStatus('Disconnected');

        console.log('🔌 WebSocket closed:', {
          wasClean: event.wasClean,
          code: event.code,
          reason: event.reason,
          reconnectCount: reconnectCount.current,
          maxAttempts: reconnectAttempts
        });

        if (onClose) onClose(event);

        // Attempt to reconnect if not a clean close and we haven't exceeded max attempts
        // Don't reconnect if it's an authentication error (code 1008)
        if (!event.wasClean &&
            event.code !== 1008 &&
            reconnectCount.current < reconnectAttempts &&
            enabled) {
          reconnectCount.current += 1;
          setConnectionStatus(`Reconnecting... (${reconnectCount.current}/${reconnectAttempts})`);

          reconnectTimeoutId.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        } else if (reconnectCount.current >= reconnectAttempts || event.code === 1008) {
          setConnectionStatus(event.code === 1008 ? 'Authentication failed' : 'Connection failed');
          console.log('🚫 WebSocket reconnection stopped:', event.code === 1008 ? 'Authentication failed' : 'Max attempts reached');
        }
      };

      ws.current.onerror = (event) => {
        setConnectionStatus('Connection error');
        if (onError) onError(event);
      };

    } catch (error) {
      console.error('WebSocket connection error:', error);
      setConnectionStatus('Connection error');
    }
  }, [url, enabled, onMessage, onOpen, onClose, onError, reconnectAttempts, reconnectInterval]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutId.current) {
      clearTimeout(reconnectTimeoutId.current);
    }
    
    if (ws.current) {
      ws.current.close(1000, 'Component unmounting');
    }
  }, []);

  const sendMessage = useCallback((message) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(typeof message === 'string' ? message : JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  const ping = useCallback(() => {
    return sendMessage({ type: 'ping', timestamp: Date.now() });
  }, [sendMessage]);

  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutId.current) {
        clearTimeout(reconnectTimeoutId.current);
      }
    };
  }, []);

  // Ping every 30 seconds to keep connection alive
  useEffect(() => {
    if (!isConnected) return;

    const pingInterval = setInterval(() => {
      ping();
    }, 30000);

    return () => clearInterval(pingInterval);
  }, [isConnected, ping]);

  return {
    isConnected,
    lastMessage,
    connectionStatus,
    sendMessage,
    ping,
    connect,
    disconnect,
    reconnectCount: reconnectCount.current
  };
};

export { useWebSocket };
