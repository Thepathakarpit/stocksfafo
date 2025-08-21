import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  CircularProgress,
  Alert,
  Avatar,
  Button,
} from '@mui/material';
import { 
  TrendingUp, 
  TrendingDown, 
  AccountBalance, 
  Assessment,
  Refresh,
  AttachMoney
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { portfolioAPI } from '../../services/api';
import { Portfolio, PortfolioSummary, StockHolding } from '../../types/auth';

const PortfolioDashboard: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // Enhanced Debug logging
  useEffect(() => {
    console.log('🔍 PortfolioDashboard State Debug:', {
      user: user ? { email: user.email, id: user.id } : 'null',
      portfolio: portfolio ? 'exists' : 'null',
      summary: summary ? 'exists' : 'null',
      loading,
      error,
      retryCount,
      authToken: localStorage.getItem('auth_token') ? 'exists' : 'missing'
    });
  });

  const loadPortfolioData = async (showLoading = true) => {
    try {
      console.log('🚀 Starting loadPortfolioData...');
      if (showLoading) {
      setLoading(true);
      }
      setError('');

      // Check if user is authenticated
      if (!user) {
        console.error('❌ User not found in context');
        setError('User not authenticated. Please log in again.');
        return;
      }

      // Check if auth token exists
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.error('❌ No auth token found in localStorage');
        setError('Authentication token not found. Please log in again.');
        return;
      }

      console.log('🔄 Loading portfolio data for user:', user.email);
      console.log('🔑 Auth token exists:', !!token);

      // Test backend connectivity first
      try {
        console.log('🧪 Testing backend connectivity...');
        const healthResponse = await fetch('http://localhost:5000/health');
        if (!healthResponse.ok) {
          throw new Error(`Backend health check failed: ${healthResponse.status}`);
        }
        console.log('✅ Backend is accessible');
      } catch (healthError) {
        console.error('❌ Backend connectivity test failed:', healthError);
        setError('Backend server is not accessible. Please ensure the server is running.');
        return;
      }

      // Now try with the actual API service
      console.log('📡 Making API calls via portfolioAPI service...');
      const [portfolioResponse, summaryResponse] = await Promise.all([
        portfolioAPI.getPortfolio(),
        portfolioAPI.getSummary()
      ]);

      console.log('📊 Portfolio response:', portfolioResponse);
      console.log('📈 Summary response:', summaryResponse);

      if (portfolioResponse.success && portfolioResponse.portfolio) {
        console.log('✅ Setting portfolio data:', portfolioResponse.portfolio);
        setPortfolio(portfolioResponse.portfolio);
        console.log('✅ Portfolio loaded successfully');
      } else {
        const errorMsg = portfolioResponse.message || 'Failed to load portfolio';
        console.error('❌ Portfolio loading failed:', errorMsg);
        setError(errorMsg);
      }

      if (summaryResponse.success && summaryResponse.summary) {
        console.log('✅ Setting summary data:', summaryResponse.summary);
        setSummary(summaryResponse.summary);
        console.log('✅ Portfolio summary loaded successfully');
      } else {
        console.warn('⚠️ Portfolio summary loading failed:', summaryResponse.message);
      }

      // Reset retry count on successful load
      setRetryCount(0);

      // Refresh user data to get latest portfolio
      try {
        console.log('🔄 Refreshing user data...');
        await refreshUser();
        console.log('✅ User data refreshed successfully');
      } catch (refreshError) {
        console.warn('⚠️ User data refresh failed:', refreshError);
        // Don't fail the entire operation if refresh fails
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('❌ Portfolio loading error:', err);
      setError(`Failed to load portfolio data: ${errorMessage}`);
      
      // Implement retry logic
      if (retryCount < maxRetries) {
        console.log(`🔄 Retrying portfolio load (${retryCount + 1}/${maxRetries})...`);
        setRetryCount(prev => prev + 1);
        setTimeout(() => loadPortfolioData(false), 2000 * (retryCount + 1)); // Exponential backoff
      }
    } finally {
      console.log('🏁 loadPortfolioData finished');
      setLoading(false);
    }
  };

  // Load portfolio data on component mount
  useEffect(() => {
    loadPortfolioData();
    
    // Set up periodic refresh every 30 seconds for real-time updates
    const refreshInterval = setInterval(() => {
      console.log('🔄 Periodic portfolio refresh...');
      loadPortfolioData(false);
    }, 30000);
    
    return () => {
      clearInterval(refreshInterval);
    };
  }, [user]); // Re-run when user changes

  // Manual refresh handler
  const handleManualRefresh = () => {
    console.log('🔄 Manual portfolio refresh triggered');
    setRetryCount(0); // Reset retry count for manual refresh
    loadPortfolioData();
  };

  // Check authentication after all hooks
  if (!user) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          <Typography variant="body1">
            <strong>Authentication Required:</strong> Please log in to view your portfolio.
          </Typography>
        </Alert>
      </Box>
    );
  }

  const formatCurrency = (amount: number): string => {
    return `₹${amount.toLocaleString('en-IN', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0 
    })}`;
  };

  const formatPercentage = (percent: number): string => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  const getGainLossColor = (value: number) => {
    if (value > 0) return 'success.main';
    if (value < 0) return 'error.main';
    return 'text.secondary';
  };

  // Show connection status and errors
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert 
          severity="error" 
          action={
            <IconButton
              aria-label="retry"
              color="inherit"
              size="small"
              onClick={handleManualRefresh}
            >
              <Refresh />
            </IconButton>
          }
        >
          <Typography variant="body1" gutterBottom>
            <strong>Portfolio Loading Error:</strong> {error}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Click the refresh button to try again, or check your connection.
          </Typography>
        </Alert>
      </Box>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading portfolio data...
        </Typography>
      </Box>
    );
  }

  // Show success connection status
  if (portfolio && summary) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="success" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>✅ Real-time updates enabled:</strong> Portfolio data is being updated in real-time
          </Typography>
        </Alert>
        
        {/* Portfolio content goes here */}
        <Typography variant="h4" gutterBottom>
          Portfolio Dashboard
        </Typography>
        {/* Add your portfolio display components here */}
      </Box>
    );
  }

  // Show connection status
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Portfolio Dashboard
        </Typography>
        <IconButton onClick={handleManualRefresh} disabled={loading}>
          <Refresh />
        </IconButton>
      </Box>

      {/* Portfolio Summary Cards */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { 
          xs: '1fr', 
          sm: 'repeat(2, 1fr)', 
          md: 'repeat(4, 1fr)' 
        }, 
        gap: 3, 
        mb: 4 
      }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                <AccountBalance />
              </Avatar>
              <Typography variant="h6">Total Value</Typography>
            </Box>
            <Typography variant="h4" component="div">
              {formatCurrency(summary?.totalValue || 0)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Portfolio worth
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                <AttachMoney />
              </Avatar>
              <Typography variant="h6">Available Cash</Typography>
            </Box>
            <Typography variant="h4" component="div">
              {formatCurrency(summary?.cash || 0)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ready to invest
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ bgcolor: getGainLossColor(summary?.totalGainLoss || 0), mr: 2 }}>
                {(summary?.totalGainLoss || 0) >= 0 ? <TrendingUp /> : <TrendingDown />}
              </Avatar>
              <Typography variant="h6">Total P&L</Typography>
            </Box>
            <Typography 
              variant="h4" 
              component="div"
              sx={{ color: getGainLossColor(summary?.totalGainLoss || 0) }}
            >
              {formatCurrency(summary?.totalGainLoss || 0)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatPercentage(summary?.totalGainLossPercent || 0)}
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                <Assessment />
              </Avatar>
              <Typography variant="h6">Invested</Typography>
            </Box>
            <Typography variant="h4" component="div">
              {formatCurrency(summary?.totalInvested || 0)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total invested amount
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Stock Holdings Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
            Stock Holdings ({summary?.stocksCount || 0})
          </Typography>
          
          {portfolio?.stocks && portfolio.stocks.length > 0 ? (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Stock</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell align="right">Avg Price</TableCell>
                    <TableCell align="right">Current Price</TableCell>
                    <TableCell align="right">Value</TableCell>
                    <TableCell align="right">P&L</TableCell>
                    <TableCell align="right">P&L %</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {portfolio.stocks.map((stock: StockHolding) => (
                    <TableRow key={stock.symbol}>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {stock.symbol}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {stock.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">
                          {stock.quantity}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">
                          {formatCurrency(stock.avgPrice)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">
                          {formatCurrency(stock.currentPrice)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="bold">
                          {formatCurrency(stock.value)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          sx={{ color: getGainLossColor(stock.gainLoss) }}
                          fontWeight="bold"
                        >
                          {formatCurrency(stock.gainLoss)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={formatPercentage(stock.gainLossPercent)}
                          size="small"
                          color={stock.gainLossPercent >= 0 ? 'success' : 'error'}
                          variant="outlined"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary">
                No stocks in portfolio
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Start trading to build your portfolio
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default PortfolioDashboard; 