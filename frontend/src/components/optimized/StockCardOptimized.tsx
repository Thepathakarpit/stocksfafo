import React, { memo, useMemo, useCallback, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Remove,
  ShoppingCart,
  MonetizationOn,
  Info,
  Refresh,
} from '@mui/icons-material';
import { Stock } from '../../types/stock';
import { tradingAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface StockCardProps {
  stock: Stock;
  onTradeComplete?: () => void;
  showTrading?: boolean;
  compact?: boolean;
}

interface TradeDialogProps {
  stock: Stock;
  open: boolean;
  onClose: () => void;
  onTradeComplete?: () => void;
}

// Optimized TradingDialog component
const TradingDialog = memo<TradeDialogProps>(({ stock, open, onClose, onTradeComplete }) => {
  const { user } = useAuth();
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Memoized calculations
  const tradeValue = useMemo(() => {
    return quantity * stock.price;
  }, [quantity, stock.price]);

  const maxAffordableShares = useMemo(() => {
    if (!user?.portfolio?.cash) return 0;
    return Math.floor(user.portfolio.cash / stock.price);
  }, [user?.portfolio?.cash, stock.price]);

  const userHolding = useMemo(() => {
    return user?.portfolio?.stocks?.find(s => s.symbol === stock.symbol);
  }, [user?.portfolio?.stocks, stock.symbol]);

  const maxSellableShares = useMemo(() => {
    return userHolding?.quantity || 0;
  }, [userHolding]);

  // Optimized trade handler
  const handleTrade = useCallback(async () => {
    if (quantity <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }

    if (tradeType === 'BUY' && quantity > maxAffordableShares) {
      setError('Insufficient funds');
      return;
    }

    if (tradeType === 'SELL' && quantity > maxSellableShares) {
      setError('Insufficient shares');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await tradingAPI.executeTrade({
        symbol: stock.symbol,
        name: stock.name,
        type: tradeType,
        quantity,
        price: stock.price
      });

      onTradeComplete?.();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Trade failed');
    } finally {
      setLoading(false);
    }
  }, [stock, tradeType, quantity, maxAffordableShares, maxSellableShares, onTradeComplete, onClose]);

  const dialogContent = useMemo(() => (
    <DialogContent>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          {stock.name} ({stock.symbol})
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Current Price: ₹{stock.price.toLocaleString()}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Button
          variant={tradeType === 'BUY' ? 'contained' : 'outlined'}
          color="success"
          onClick={() => setTradeType('BUY')}
          startIcon={<ShoppingCart />}
        >
          Buy
        </Button>
        <Button
          variant={tradeType === 'SELL' ? 'contained' : 'outlined'}
          color="error"
          onClick={() => setTradeType('SELL')}
          startIcon={<MonetizationOn />}
          disabled={maxSellableShares === 0}
        >
          Sell
        </Button>
      </Box>

      <TextField
        fullWidth
        type="number"
        label="Quantity"
        value={quantity}
        onChange={(e) => setQuantity(Number(e.target.value))}
        inputProps={{
          min: 1,
          max: tradeType === 'BUY' ? maxAffordableShares : maxSellableShares
        }}
        sx={{ mb: 2 }}
      />

      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Total Value: ₹{tradeValue.toLocaleString()}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {tradeType === 'BUY' 
            ? `Available Cash: ₹${user?.portfolio?.cash?.toLocaleString()}`
            : `Available Shares: ${maxSellableShares}`
          }
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    </DialogContent>
  ), [stock, tradeType, quantity, tradeValue, maxAffordableShares, maxSellableShares, user?.portfolio?.cash, error]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {tradeType === 'BUY' ? 'Buy' : 'Sell'} {stock.symbol}
      </DialogTitle>
      
      {dialogContent}
      
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleTrade}
          variant="contained"
          color={tradeType === 'BUY' ? 'success' : 'error'}
          disabled={loading || quantity <= 0}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Processing...' : `${tradeType} ${quantity} Share${quantity > 1 ? 's' : ''}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
});

TradingDialog.displayName = 'TradingDialog';

// Main optimized StockCard component
const StockCardOptimized = memo<StockCardProps>(({ 
  stock, 
  onTradeComplete, 
  showTrading = true, 
  compact = false 
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  // Memoized calculations for performance
  const priceData = useMemo(() => {
    const isPositive = stock.changePercent >= 0;
    const trendIcon = isPositive ? TrendingUp : TrendingDown;
    const color = isPositive ? 'success.main' : 'error.main';
    
    return {
      isPositive,
      trendIcon,
      color,
      changeText: `${isPositive ? '+' : ''}${stock.changePercent.toFixed(2)}%`,
      priceChangeText: `${isPositive ? '+' : ''}₹${Math.abs(stock.change).toFixed(2)}`
    };
  }, [stock.changePercent, stock.change]);

  const formattedData = useMemo(() => ({
    price: `₹${stock.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
    volume: stock.volume ? stock.volume.toLocaleString('en-IN') : 'N/A',
    marketCap: stock.marketCap ? `₹${(stock.marketCap / 10000000).toFixed(2)}Cr` : 'N/A',
    lastUpdated: new Date(stock.lastUpdated).toLocaleTimeString()
  }), [stock.price, stock.volume, stock.marketCap, stock.lastUpdated]);

  // Optimized event handlers
  const handleTradeClick = useCallback(() => {
    setDialogOpen(true);
  }, []);

  const handleDialogClose = useCallback(() => {
    setDialogOpen(false);
  }, []);

  const handleTradeCompleteWrapper = useCallback(() => {
    onTradeComplete?.();
    setDialogOpen(false);
  }, [onTradeComplete]);

  // Memoized card content
  const cardContent = useMemo(() => (
    <CardContent sx={{ p: compact ? 1.5 : 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Box>
          <Typography variant={compact ? 'h6' : 'h5'} component="h2" sx={{ fontWeight: 'bold' }}>
            {stock.symbol}
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              fontSize: compact ? '0.75rem' : '0.875rem',
              lineHeight: 1.2,
              maxWidth: '200px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {stock.name}
          </Typography>
        </Box>
        
        <Chip
          icon={React.createElement(priceData.trendIcon, { fontSize: 'small' })}
          label={priceData.changeText}
          color={priceData.isPositive ? 'success' : 'error'}
          size={compact ? 'small' : 'medium'}
          variant="filled"
        />
      </Box>

      {/* Price Section */}
      <Box sx={{ mb: compact ? 1 : 2 }}>
        <Typography variant={compact ? 'h6' : 'h4'} sx={{ fontWeight: 'bold', color: priceData.color }}>
          {formattedData.price}
        </Typography>
        <Typography variant="body2" sx={{ color: priceData.color }}>
          {priceData.priceChangeText}
        </Typography>
      </Box>

      {/* Details */}
      {!compact && (
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">Volume</Typography>
            <Typography variant="body2">{formattedData.volume}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Market Cap</Typography>
            <Typography variant="body2">{formattedData.marketCap}</Typography>
          </Box>
        </Box>
      )}

      {/* Actions */}
      {showTrading && (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            size={compact ? 'small' : 'medium'}
            onClick={handleTradeClick}
            startIcon={<ShoppingCart />}
            fullWidth
          >
            Trade
          </Button>
          
          <Tooltip title={`Last updated: ${formattedData.lastUpdated}`}>
            <IconButton size="small">
              <Info fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </CardContent>
  ), [stock, priceData, formattedData, compact, showTrading, handleTradeClick]);

  return (
    <>
      <Card
        sx={{
          height: compact ? 'auto' : '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: 3,
          },
          border: `1px solid ${priceData.isPositive ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)'}`,
        }}
      >
        {cardContent}
      </Card>

      {showTrading && (
        <TradingDialog
          stock={stock}
          open={dialogOpen}
          onClose={handleDialogClose}
          onTradeComplete={handleTradeCompleteWrapper}
        />
      )}
    </>
  );
});

StockCardOptimized.displayName = 'StockCardOptimized';

export default StockCardOptimized; 