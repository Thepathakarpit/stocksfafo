import React, { useCallback, useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, CircularProgress, Typography, Alert, Button } from '@mui/material';
import { useStockSocket } from '../hooks/useStockSocket';
import Layout from './Layout';
import DashboardPage from '../pages/DashboardPage';
import CategoriesPage from '../pages/CategoriesPage';
import PerformancePage from '../pages/PerformancePage';
import AnalysisPage from '../pages/AnalysisPage';
import SettingsPage from '../pages/SettingsPage';
import AboutPage from '../pages/AboutPage';

const AuthenticatedApp: React.FC = () => {
  const [isWebSocketEnabled, setIsWebSocketEnabled] = useState(true);
  const [fallbackStocks, setFallbackStocks] = useState([]);
  
  const { 
    stocks, 
    isConnected, 
    connectionStatus, 
    error, 
    reconnect,
    currentStockList,
    activeStockCount,
    switchStockList,
    isLoading,
    reconnectAttempts
  } = useStockSocket();

  // Fallback to HTTP if WebSocket fails
  useEffect(() => {
    if (connectionStatus === 'error' && isWebSocketEnabled) {
      console.log('WebSocket failed, falling back to HTTP');
      setIsWebSocketEnabled(false);
      loadFallbackData();
    }
  }, [connectionStatus, isWebSocketEnabled]);

  const loadFallbackData = async () => {
    try {
      console.log('🔄 Loading fallback data from HTTP API...');
      const response = await fetch('http://localhost:5000/api/stocks', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📊 Fallback data response:', data);
      
      if (data.success && data.data) {
        setFallbackStocks(data.data);
        console.log('✅ Fallback data loaded successfully:', data.data.length, 'stocks');
      } else {
        console.error('❌ Fallback data response invalid:', data);
      }
    } catch (error) {
      console.error('❌ Failed to load fallback data:', error);
      // Don't set fallback stocks on error, let the user see the error
    }
  };

  const handleSwitchStockList = useCallback(async (listType: string, customCount?: number): Promise<boolean> => {
    try {
      if (isWebSocketEnabled) {
        const success = await switchStockList(listType, customCount);
        return success;
      } else {
        // Fallback to HTTP API
        const response = await fetch('http://localhost:5000/api/switch-stock-list', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ listType, customCount }),
        });
        return response.ok;
      }
    } catch (error) {
      console.error('Failed to switch stock list:', error);
      return false;
    }
  }, [switchStockList, isWebSocketEnabled]);

  const handleReconnect = useCallback(() => {
    if (isWebSocketEnabled) {
      reconnect();
    } else {
      setIsWebSocketEnabled(true);
    }
  }, [reconnect, isWebSocketEnabled]);

  const handleEnableWebSocket = () => {
    setIsWebSocketEnabled(true);
  };

  // Use fallback data if WebSocket is disabled or has errors
  const currentStocks = isWebSocketEnabled && isConnected ? stocks : fallbackStocks;
  const currentConnectionStatus = isWebSocketEnabled ? connectionStatus : 'connected';
  const currentIsConnected = isWebSocketEnabled && isConnected;
  const currentError = isWebSocketEnabled ? error : null;

  // Auto-enable WebSocket if connection is successful
  useEffect(() => {
    if (isWebSocketEnabled && isConnected && connectionStatus === 'connected') {
      console.log('✅ WebSocket connection successful, real-time updates enabled');
    } else if (isWebSocketEnabled && connectionStatus === 'error' && reconnectAttempts >= 3) {
      console.log('⚠️ WebSocket failed after multiple attempts, switching to fallback mode');
      setIsWebSocketEnabled(false);
    }
  }, [isWebSocketEnabled, isConnected, connectionStatus, reconnectAttempts]);

  // Debug logging
  console.log('AuthenticatedApp state:', {
    stocksCount: currentStocks.length,
    isWebSocketEnabled,
    connectionStatus: currentConnectionStatus,
    isConnected: currentIsConnected,
    error: currentError,
    isLoading,
    reconnectAttempts
  });

  // Show loading state
  if (isLoading && currentStocks.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 2,
        }}
      >
        <CircularProgress size={48} />
        <Typography variant="h6" color="text.secondary">
          Loading stock data...
        </Typography>
      </Box>
    );
  }

  return (
    <>
      {/* WebSocket Status Alert */}
      {!isWebSocketEnabled && (
        <Alert 
          severity="warning" 
          sx={{ position: 'fixed', top: 16, right: 16, zIndex: 1000, maxWidth: 400 }}
          action={
            <Button color="inherit" size="small" onClick={handleEnableWebSocket}>
              Enable Real-time
            </Button>
          }
        >
          <Typography variant="body2" gutterBottom>
            <strong>Fallback Mode:</strong> Using cached data instead of real-time updates
          </Typography>
          <Typography variant="caption" color="text.secondary">
            WebSocket connection failed. Click "Enable Real-time" to retry.
          </Typography>
        </Alert>
      )}

      {/* Connection Error Alert */}
      {isWebSocketEnabled && currentError && (
        <Alert 
          severity="error" 
          sx={{ position: 'fixed', top: 16, right: 16, zIndex: 1000, maxWidth: 400 }}
          action={
            <Button color="inherit" size="small" onClick={handleReconnect}>
              Reconnect
            </Button>
          }
        >
          <Typography variant="body2" gutterBottom>
            <strong>Connection Error:</strong> {currentError}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Click "Reconnect" to try again, or the system will auto-reconnect.
          </Typography>
        </Alert>
      )}

      <Layout
        connectionStatus={currentConnectionStatus}
        isConnected={currentIsConnected}
        error={currentError}
        onReconnect={handleReconnect}
        currentStockList={currentStockList}
        activeStockCount={currentStocks.length}
        onSwitchStockList={handleSwitchStockList}
        isLoading={isLoading}
      >
        <Routes>
          <Route path="/dashboard" element={
            <DashboardPage 
              stocks={currentStocks}
              isConnected={currentIsConnected}
              connectionStatus={currentConnectionStatus}
              error={currentError}
              reconnect={handleReconnect}
            />
          } />
          <Route path="/" element={
            <DashboardPage 
              stocks={currentStocks}
              isConnected={currentIsConnected}
              connectionStatus={currentConnectionStatus}
              error={currentError}
              reconnect={handleReconnect}
            />
          } />
          <Route path="/categories" element={
            <CategoriesPage 
              stocks={currentStocks}
              isConnected={currentIsConnected}
              connectionStatus={currentConnectionStatus}
            />
          } />
          <Route path="/performance" element={
            <PerformancePage 
              stocks={currentStocks}
              connectionStatus={currentConnectionStatus}
            />
          } />
          <Route path="/analysis" element={<AnalysisPage />} />
          <Route 
            path="/settings" 
            element={
              <SettingsPage 
                currentStockList={currentStockList}
                activeStockCount={currentStocks.length}
                onSwitchStockList={handleSwitchStockList}
                isLoading={isLoading}
              />
            } 
          />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </Layout>
    </>
  );
};

export default AuthenticatedApp; 