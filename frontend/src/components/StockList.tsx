import React, { useState } from 'react';
import { Box, TextField, Typography, IconButton, Chip, Alert, Container } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Search as SearchIcon } from '@mui/icons-material';
import StockCard from './StockCard';
import { Stock } from '../types/stock';

interface StockListProps {
  stocks: Stock[];
  isConnected?: boolean;
  connectionStatus?: 'connecting' | 'connected' | 'disconnected' | 'error';
  error?: string | null;
  reconnect?: () => void;
}

const StockList: React.FC<StockListProps> = ({ 
  stocks = [], 
  isConnected = true, 
  connectionStatus = 'connected', 
  error = null, 
  reconnect 
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStocks = stocks.filter(stock =>
    stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stock.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'success';
      case 'connecting': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'LIVE';
      case 'connecting': return 'CONNECTING';
      case 'error': return 'OFFLINE';
      default: return 'DISCONNECTED';
    }
  };

  if (stocks.length === 0 && connectionStatus === 'connecting') {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Box textAlign="center">
          <Box
            sx={{
              width: 100,
              height: 100,
              border: '6px solid #e5e7eb',
              borderTop: '6px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              mx: 'auto',
              mb: 5
            }}
          />
          <Typography 
            variant="h3" 
            color="text.secondary" 
            fontWeight={700}
            sx={{ fontSize: '2.2rem', mb: 2 }}
          >
            Connecting to live data...
          </Typography>
          <Typography 
            variant="h5" 
            color="text.secondary" 
            sx={{ 
              fontSize: '1.4rem'
            }}
          >
            Please wait while we fetch real-time stock prices
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      width: '100%',
      p: { xs: 3, sm: 4, md: 5, lg: 6 }
    }}>
      <Box display="flex" flexDirection="column" gap={6}>
        {/* Massive Header Section - "Top Bar" */}
        <Box sx={{ 
          textAlign: 'center', 
          py: { xs: 4, md: 6, lg: 8 },
          background: 'linear-gradient(135deg, rgba(21, 101, 192, 0.05) 0%, rgba(66, 165, 245, 0.05) 100%)',
          borderRadius: 4,
          border: '1px solid rgba(21, 101, 192, 0.1)'
        }}>
          <Typography 
            variant="h1" 
            fontWeight={900} 
            gutterBottom 
            sx={{ 
              mb: 3,
              fontSize: { xs: '3rem', sm: '4rem', md: '5.5rem', lg: '6.5rem', xl: '7rem' },
              background: 'linear-gradient(45deg, #1565c0, #42a5f5)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textAlign: 'center',
              letterSpacing: '-0.02em',
              lineHeight: 0.9
            }}
          >
            Live Stock Dashboard
          </Typography>
          <Typography 
            variant="h3" 
            color="text.secondary" 
            sx={{ 
              mb: 5,
              fontSize: { xs: '1.4rem', sm: '1.8rem', md: '2.4rem', lg: '2.8rem' },
              fontWeight: 500,
              lineHeight: 1.3
            }}
          >
            Real-time stock prices with live updates every second
          </Typography>
          <Box display="flex" justifyContent="center" gap={3} flexWrap="wrap">
            <Chip 
              label={`${stocks.length} Live Stocks`}
              color="primary"
              size="medium"
              sx={{ 
                fontSize: '1.1rem', 
                fontWeight: 700,
                height: '48px',
                padding: '12px 24px'
              }}
            />
            <Chip 
              label={getStatusText()}
              color={getStatusColor()}
              size="medium"
              sx={{ 
                fontSize: '1.1rem', 
                fontWeight: 700,
                height: '48px',
                padding: '12px 24px'
              }}
            />
          </Box>
        </Box>

        {/* Enhanced Search and Status Bar */}
        <Box 
          display="flex" 
          alignItems="center" 
          justifyContent="space-between" 
          flexWrap="wrap" 
          gap={5}
          sx={{
            p: 5,
            backgroundColor: 'background.paper',
            borderRadius: 5,
            boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
            border: '1px solid rgba(0,0,0,0.05)'
          }}
        >
          <Box display="flex" alignItems="center" gap={4} flex={1} maxWidth="800px">
            <SearchIcon 
              color="primary" 
              sx={{ 
                fontSize: '2.5rem'
              }} 
            />
            <TextField
              fullWidth
              size="medium"
              placeholder="Search stocks by symbol or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 4,
                  fontSize: '1.4rem',
                  minHeight: '64px',
                  '& fieldset': {
                    borderColor: 'divider',
                    borderWidth: '2px',
                  },
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main',
                    borderWidth: '3px',
                  },
                },
                '& .MuiOutlinedInput-input': {
                  fontSize: '1.4rem',
                  fontWeight: 500,
                  padding: '20px 18px',
                }
              }}
            />
          </Box>
          
          <Box display="flex" alignItems="center" gap={4}>
            <Typography variant="h6" color="text.secondary" fontWeight={600}>
              {filteredStocks.length} of {stocks.length} stocks
            </Typography>
            {!isConnected && (
              <IconButton 
                onClick={reconnect} 
                size="large" 
                color="primary"
                title="Reconnect to live data"
                sx={{
                  backgroundColor: 'primary.main',
                  color: 'white',
                  width: '64px',
                  height: '64px',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  }
                }}
              >
                <RefreshIcon sx={{ fontSize: '2rem' }} />
              </IconButton>
            )}
          </Box>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert 
            severity="warning" 
            action={
              <IconButton color="inherit" size="large" onClick={reconnect}>
                <RefreshIcon sx={{ fontSize: '1.8rem' }} />
              </IconButton>
            }
            sx={{ 
              borderRadius: 4,
              fontSize: '1.3rem',
              padding: '20px 28px',
              '& .MuiAlert-message': {
                fontSize: '1.3rem',
                fontWeight: 500
              },
              '& .MuiAlert-icon': {
                fontSize: '2rem'
              }
            }}
          >
            Connection issue: {error}. Using cached data.
          </Alert>
        )}

        {/* No Results */}
        {filteredStocks.length === 0 && stocks.length > 0 && (
          <Box textAlign="center" py={10}>
            <Typography 
              variant="h2" 
              color="text.secondary" 
              gutterBottom 
              fontWeight={700}
              sx={{ fontSize: '3rem', mb: 2 }}
            >
              No stocks found
            </Typography>
            <Typography 
              variant="h4" 
              color="text.secondary"
              sx={{ fontSize: '1.6rem' }}
            >
              Try adjusting your search terms
            </Typography>
          </Box>
        )}

        {/* Stock Grid - Optimized for larger cards */}
        {filteredStocks.length > 0 && (
          <Box
            display="grid"
            gridTemplateColumns="repeat(auto-fill, minmax(520px, 1fr))"
            gap={6}
            sx={{
              width: '100%',
              '@media (max-width: 600px)': {
                gridTemplateColumns: '1fr',
                gap: 4,
              },
              '@media (max-width: 1100px)': {
                gridTemplateColumns: 'repeat(auto-fill, minmax(480px, 1fr))',
                gap: 4,
              },
              '@media (min-width: 1400px)': {
                gridTemplateColumns: 'repeat(auto-fill, minmax(560px, 1fr))',
                gap: 7,
              },
              '@media (min-width: 1800px)': {
                gridTemplateColumns: 'repeat(auto-fill, minmax(600px, 1fr))',
                gap: 8,
              },
              '@media (min-width: 2200px)': {
                gridTemplateColumns: 'repeat(auto-fill, minmax(650px, 1fr))',
                gap: 10,
              }
            }}
          >
            {filteredStocks.map((stock) => (
              <StockCard key={stock.symbol} stock={stock} />
            ))}
          </Box>
        )}

        {/* Enhanced Data Info Footer */}
        {stocks.length > 0 && (
          <Box 
            textAlign="center" 
            mt={6}
            sx={{
              p: 5,
              backgroundColor: 'background.paper',
              borderRadius: 4,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              border: '1px solid rgba(0,0,0,0.05)'
            }}
          >
            <Typography 
              variant="h3" 
              color="text.secondary" 
              fontWeight={700}
              sx={{ fontSize: '1.8rem', mb: 2 }}
            >
              Showing {filteredStocks.length} of {stocks.length} stocks
            </Typography>
            <Typography 
              variant="h5" 
              color="text.secondary" 
              sx={{ 
                fontSize: '1.3rem',
                fontWeight: 500
              }}
            >
              {isConnected && '🟢 Live updates enabled • Real-time data streaming every second'}
              {!isConnected && '🔴 Using cached data • Connection lost - click refresh to reconnect'}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default StockList; 