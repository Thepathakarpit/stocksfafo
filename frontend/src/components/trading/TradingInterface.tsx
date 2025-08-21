import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Chip,
  Divider,
} from '@mui/material';
import { 
  TrendingUp, 
  TrendingDown, 
  ShoppingCart,
  SellOutlined,
  CheckCircle,
  Error as ErrorIcon
} from '@mui/icons-material';
import { portfolioAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Stock } from '../../types/stock';

interface TradingInterfaceProps {
  stock: Stock;
  onTradeComplete?: () => void;
}

type TradeType = 'BUY' | 'SELL';

const TradingInterface: React.FC<TradingInterfaceProps> = ({ stock, onTradeComplete }) => {
  const { user, refreshUser } = useAuth();
  const [tradeType, setTradeType] = useState<TradeType>('BUY');
  const [quantity, setQuantity] = useState<string>('1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // Get current holding for this stock
  const currentHolding = user?.portfolio.stocks.find(s => s.symbol === stock.symbol);
  const availableCash = user?.portfolio.cash || 0;
  const currentPrice = stock.price;

  const handleTradeTypeChange = (
    event: React.MouseEvent<HTMLElement>,
    newTradeType: TradeType,
  ) => {
    if (newTradeType !== null) {
      setTradeType(newTradeType);
      setError('');
    }
  };

  const handleQuantityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (value === '' || /^\d+$/.test(value)) {
      setQuantity(value);
      setError('');
    }
  };

  const calculateTotalAmount = (): number => {
    const qty = parseInt(quantity) || 0;
    return qty * currentPrice;
  };

  const validateTrade = (): boolean => {
    const qty = parseInt(quantity);
    
    if (!qty || qty <= 0) {
      setError('Please enter a valid quantity');
      return false;
    }

    if (tradeType === 'BUY') {
      const totalAmount = calculateTotalAmount();
      if (totalAmount > availableCash) {
        setError('Insufficient funds for this trade');
        return false;
      }
    } else { // SELL
      if (!currentHolding || currentHolding.quantity < qty) {
        setError('Insufficient stocks to sell');
        return false;
      }
    }

    return true;
  };

  const handleTradeClick = () => {
    if (validateTrade()) {
      setConfirmDialogOpen(true);
    }
  };

  const executeTrade = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const tradeData = {
        symbol: stock.symbol,
        name: stock.name,
        quantity: parseInt(quantity),
        price: currentPrice,
        type: tradeType,
      };

      // Debug logging to see what's being sent
      console.log('🔍 TradingInterface: Stock data:', {
        symbol: stock.symbol,
        name: stock.name,
        price: currentPrice
      });
      console.log('🔍 TradingInterface: Trade data being sent:', tradeData);

      const response = await portfolioAPI.executeTrade(tradeData);

      if (response.success) {
        setSuccess(`${tradeType} order executed successfully!`);
        setQuantity('1');
        await refreshUser();
        onTradeComplete?.();
      } else {
        setError(response.message || 'Trade execution failed');
      }
    } catch (err) {
      setError('Trade execution failed. Please try again.');
      console.error('Trade execution error:', err);
    } finally {
      setLoading(false);
      setConfirmDialogOpen(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return `₹${amount.toLocaleString('en-IN', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0 
    })}`;
  };

  const getTradeButtonColor = () => {
    return tradeType === 'BUY' ? 'success' : 'error';
  };

  const getTradeButtonIcon = () => {
    return tradeType === 'BUY' ? <ShoppingCart /> : <SellOutlined />;
  };

  return (
    <Card sx={{ maxWidth: 400, mx: 'auto' }}>
      <CardContent>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h6" component="h2" gutterBottom>
            Trade {stock.symbol}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {stock.name}
          </Typography>
          <Typography variant="h4" component="div" sx={{ mt: 2, mb: 1 }}>
            {formatCurrency(currentPrice)}
          </Typography>
          <Chip
            label={`${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)} (${stock.changePercent.toFixed(2)}%)`}
            color={stock.change >= 0 ? 'success' : 'error'}
            icon={stock.change >= 0 ? <TrendingUp /> : <TrendingDown />}
            size="small"
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Trade Type
          </Typography>
          <ToggleButtonGroup
            value={tradeType}
            exclusive
            onChange={handleTradeTypeChange}
            fullWidth
            size="large"
          >
            <ToggleButton value="BUY" color="success">
              <ShoppingCart sx={{ mr: 1 }} />
              BUY
            </ToggleButton>
            <ToggleButton value="SELL" color="error">
              <SellOutlined sx={{ mr: 1 }} />
              SELL
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="Quantity"
            value={quantity}
            onChange={handleQuantityChange}
            type="text"
            inputProps={{ 
              pattern: '[0-9]*',
              inputMode: 'numeric'
            }}
            helperText={`Total: ${formatCurrency(calculateTotalAmount())}`}
          />
        </Box>

        {/* Portfolio Info */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Available Cash
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {formatCurrency(availableCash)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Holdings
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {currentHolding ? `${currentHolding.quantity} shares` : '0 shares'}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Button
          fullWidth
          variant="contained"
          size="large"
          color={getTradeButtonColor()}
          onClick={handleTradeClick}
          disabled={loading || !quantity || parseInt(quantity) <= 0}
          startIcon={getTradeButtonIcon()}
          sx={{ py: 1.5 }}
        >
          {tradeType} {quantity || 0} shares for {formatCurrency(calculateTotalAmount())}
        </Button>

        {/* Confirmation Dialog */}
        <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {tradeType === 'BUY' ? <ShoppingCart sx={{ mr: 1 }} /> : <SellOutlined sx={{ mr: 1 }} />}
              Confirm {tradeType} Order
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ py: 2 }}>
              <Typography variant="h6" gutterBottom>
                {stock.symbol} - {stock.name}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Type
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {tradeType}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Quantity
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {quantity} shares
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Price
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {formatCurrency(currentPrice)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Amount
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {formatCurrency(calculateTotalAmount())}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={executeTrade}
              variant="contained"
              color={getTradeButtonColor()}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <CheckCircle />}
            >
              {loading ? 'Executing...' : `Confirm ${tradeType}`}
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default TradingInterface; 