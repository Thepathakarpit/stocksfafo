import { useEffect, useRef, useState, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';
import { Stock } from '../types/stock';

interface UseStockSocketReturn {
  stocks: Stock[];
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  error: string | null;
  reconnect: () => void;
  currentStockList: string;
  activeStockCount: number;
  switchStockList: (listType: string, customCount?: number) => Promise<boolean>;
  isLoading: boolean;
  reconnectAttempts: number;
}

export const useStockSocket = (serverUrl: string = 'http://localhost:5000'): UseStockSocketReturn => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [currentStockList, setCurrentStockList] = useState<string>('NIFTY_50');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const isInitializedRef = useRef(false);
  const isConnectingRef = useRef(false);

  const connect = useCallback(() => {
    // Prevent multiple simultaneous connection attempts
    if (socketRef.current?.connected || isConnectingRef.current) {
      console.log('🔄 Connection already in progress or established, skipping...');
      return;
    }

    isConnectingRef.current = true;
    setConnectionStatus('connecting');
    setError(null);

    // First test if the backend is accessible via HTTP
    const testBackendConnection = async () => {
      try {
        console.log('🔍 Testing backend connectivity...');
        const response = await fetch(`${serverUrl}/health`, {
          method: 'GET'
        });
        
        if (!response.ok) {
          throw new Error(`Backend health check failed: ${response.status}`);
        }
        
        console.log('✅ Backend is accessible, proceeding with WebSocket connection');
        establishWebSocketConnection();
      } catch (error) {
        console.error('❌ Backend connectivity test failed:', error);
        setConnectionStatus('error');
        setError(`Backend not accessible: ${error instanceof Error ? error.message : 'Unknown error'}`);
        isConnectingRef.current = false;
        scheduleReconnect();
      }
    };

    const establishWebSocketConnection = () => {
      try {
        console.log(`🔌 Attempting to connect to WebSocket server at ${serverUrl}`);
        
        socketRef.current = io(serverUrl, {
          transports: ['websocket', 'polling'],
          timeout: 15000, // Increased timeout
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: maxReconnectAttempts,
          forceNew: true,
          upgrade: true,
          rememberUpgrade: false,
          autoConnect: false // Prevent auto-connection
        });

        const socket = socketRef.current;

        socket.on('connect', () => {
          console.log('✅ Connected to stock data server');
          setIsConnected(true);
          setConnectionStatus('connected');
          setError(null);
          reconnectAttemptsRef.current = 0;
          isInitializedRef.current = true;
          isConnectingRef.current = false;

          // Subscribe to stock updates
          socket.emit('subscribe-stocks', []);
        });

        socket.on('disconnect', (reason) => {
          console.log('❌ Disconnected from stock data server:', reason);
          setIsConnected(false);
          setConnectionStatus('disconnected');
          isConnectingRef.current = false;
          
          // Only reconnect for server-initiated disconnections
          if (reason === 'io server disconnect' || reason === 'transport close') {
            console.log('🔄 Server disconnected, attempting to reconnect...');
            scheduleReconnect();
          } else {
            console.log('ℹ️ Client-initiated disconnect, not reconnecting');
          }
        });

        socket.on('connect_error', (error) => {
          console.error('🚨 Connection error:', error);
          setIsConnected(false);
          setConnectionStatus('error');
          setError(`Connection failed: ${error.message || 'Unknown error'}`);
          isConnectingRef.current = false;
          scheduleReconnect();
        });

        socket.on('stocks-updated', (updatedStocks: Stock[]) => {
          console.log('📊 Received stock updates:', updatedStocks.length, 'stocks');
          setStocks(updatedStocks.map(stock => ({
            ...stock,
            lastUpdated: new Date(stock.lastUpdated)
          })));
        });

        socket.on('stock-list-switched', (data) => {
          if (data.success) {
            setCurrentStockList(data.listType);
            console.log('🔄 Stock list switched to:', data.listType);
          }
        });

        socket.on('performance-stats', (data) => {
          console.log('📈 Performance stats received:', data);
        });

        // Now manually connect
        socket.connect();

        // Test connection after a delay
        setTimeout(() => {
          if (!socket.connected) {
            console.log('⚠️ WebSocket not connected after timeout, attempting reconnect...');
            socket.connect();
          }
        }, 5000);

      } catch (error) {
        console.error('🚨 Error creating socket connection:', error);
        setConnectionStatus('error');
        setError(error instanceof Error ? error.message : 'Unknown connection error');
        isConnectingRef.current = false;
        scheduleReconnect();
      }
    };

    // Start with backend connectivity test
    testBackendConnection();
  }, [serverUrl]);

  const scheduleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      setError('Maximum reconnection attempts reached. Please refresh the page.');
      setConnectionStatus('error');
      isConnectingRef.current = false;
      return;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
    console.log(`🔄 Scheduling reconnect in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1})`);

    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectAttemptsRef.current++;
      // Only reconnect if not already connected
      if (!socketRef.current?.connected && !isConnectingRef.current) {
        connect();
      }
    }, delay);
  }, [connect]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (socketRef.current) {
      console.log('🧹 Disconnecting WebSocket...');
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setIsConnected(false);
    setConnectionStatus('disconnected');
    reconnectAttemptsRef.current = 0;
    isInitializedRef.current = false;
    isConnectingRef.current = false;
  }, []);

  const reconnect = useCallback(() => {
    console.log('🔄 Manual reconnection requested');
    disconnect();
    setTimeout(() => {
      reconnectAttemptsRef.current = 0;
      connect();
    }, 1000);
  }, [disconnect, connect]);

  useEffect(() => {
    // Initial connection
    connect();

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Fallback data loading if WebSocket fails
  useEffect(() => {
    if (connectionStatus === 'error' && stocks.length === 0 && !isInitializedRef.current) {
      console.log('📡 Fallback: Loading initial stock data via HTTP');
      fetch(`${serverUrl}/api/stocks`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          return response.json();
        })
        .then(data => {
          if (data.success && data.data) {
            console.log('📊 Fallback data loaded successfully:', data.data.length, 'stocks');
            setStocks(data.data.map((stock: Stock) => ({
              ...stock,
              lastUpdated: new Date(stock.lastUpdated)
            })));
          } else {
            console.error('❌ Fallback data response invalid:', data);
          }
        })
        .catch(error => {
          console.error('❌ Fallback data loading failed:', error);
          setError(`Failed to load stock data: ${error.message}`);
        });
    }
  }, [connectionStatus, stocks.length, serverUrl]);

  const switchStockList = useCallback(async (listType: string, customCount?: number): Promise<boolean> => {
    try {
      setIsLoading(true);
      console.log(`🔄 Switching stock list to: ${listType}${customCount ? ` (${customCount} stocks)` : ''}`);
      
      const response = await fetch(`${serverUrl}/api/switch-stock-list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ listType, customCount }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
        setCurrentStockList(result.listType || listType);
          console.log('✅ Stock list switched successfully');
        return true;
        } else {
          console.error('❌ Stock list switch failed:', result.error);
          return false;
        }
      } else {
        console.error('❌ HTTP error switching stock list:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ Failed to switch stock list:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [serverUrl]);

  return {
    stocks,
    isConnected,
    connectionStatus,
    error,
    reconnect,
    currentStockList,
    activeStockCount: stocks.length,
    switchStockList,
    isLoading,
    reconnectAttempts: reconnectAttemptsRef.current,
  };
}; 