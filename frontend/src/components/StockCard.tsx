import React, { useState } from 'react';
import { Card, CardContent, Typography, Box, Chip, Tooltip, Button, Dialog, DialogContent } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { Stock, StockUtils } from '../types/stock';
import { TrendingUp, TrendingDown, ShowChart, ShoppingCart, SellOutlined } from '@mui/icons-material';
import TradingInterface from './trading/TradingInterface';

interface StockCardProps {
  stock: Stock;
}

const formatNumber = (num: number) => new Intl.NumberFormat('en-IN').format(num);

const StockCard: React.FC<StockCardProps> = ({ stock }) => {
  const [prevPrice, setPrevPrice] = React.useState(stock.price);
  const [flash, setFlash] = React.useState<'up' | 'down' | null>(null);
  const [tradingDialogOpen, setTradingDialogOpen] = useState(false);

  React.useEffect(() => {
    if (stock.price !== prevPrice) {
      if (stock.price > prevPrice) {
        setFlash('up');
      } else if (stock.price < prevPrice) {
        setFlash('down');
      }
      setPrevPrice(stock.price);
      const timeout = setTimeout(() => setFlash(null), 800);
      return () => clearTimeout(timeout);
    }
  }, [stock.price, prevPrice]);

  const isPositive = stock.change >= 0;
  const changeColor = isPositive ? '#00c853' : '#f44336';
  const changeIcon = isPositive ? <TrendingUp sx={{ fontSize: '2rem' }} /> : <TrendingDown sx={{ fontSize: '2rem' }} />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.4 }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
    >
      <Card
        sx={{
          borderRadius: 5,
          boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          overflow: 'visible',
          position: 'relative',
          border: flash === 'up' ? '4px solid #00c853' : flash === 'down' ? '4px solid #f44336' : '2px solid #e2e8f0',
          transition: 'all 0.3s ease-in-out',
          minHeight: '300px',
          minWidth: '480px',
          '&:hover': {
            boxShadow: '0 16px 64px rgba(0,0,0,0.16)',
            transform: 'translateY(-4px)'
          }
        }}
      >
        <CardContent sx={{ p: 6 }}>
          {/* Header with Symbol and Live Badge */}
          <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={5}>
            <Box>
              <Typography 
                variant="h2" 
                fontWeight={900} 
                color="primary.main" 
                sx={{ 
                  lineHeight: 1.1,
                  fontSize: '2.8rem',
                  letterSpacing: '-0.02em'
                }}
              >
                {stock.symbol}
              </Typography>
              <Typography 
                variant="h5" 
                color="text.secondary" 
                sx={{ 
                  mt: 1, 
                  fontSize: '1.3rem',
                  fontWeight: 500,
                  lineHeight: 1.3
                }}
              >
                {stock.name.length > 26 ? stock.name.substring(0, 26) + '...' : stock.name}
              </Typography>
            </Box>
            <Chip 
              icon={<ShowChart sx={{ fontSize: '1.4rem' }} />} 
              label="LIVE" 
              color="success" 
              size="medium" 
              sx={{ 
                fontWeight: 700,
                fontSize: '1rem',
                height: '42px',
                padding: '10px 16px',
                borderRadius: '21px'
              }} 
            />
          </Box>

          {/* Price and Change - Main Focus */}
          <Box mb={5}>
            <AnimatePresence mode="wait">
              <motion.div
                key={stock.price}
                initial={{ scale: 1.05, opacity: 0.8 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Typography 
                  variant="h1" 
                  fontWeight={900} 
                  color="text.primary"
                  sx={{ 
                    fontSize: '3.8rem',
                    lineHeight: 1,
                    mb: 3,
                    fontFamily: '"Inter", system-ui, sans-serif',
                    letterSpacing: '-0.03em'
                  }}
                >
                  ₹{stock.price.toFixed(2)}
                </Typography>
              </motion.div>
            </AnimatePresence>
            
            <Box display="flex" alignItems="center" gap={2}>
              {changeIcon}
              <Typography
                variant="h3"
                fontWeight={700}
                sx={{
                  color: changeColor,
                  fontSize: '1.8rem',
                  letterSpacing: '-0.01em'
                }}
              >
                {isPositive ? '+' : ''}{stock.change.toFixed(2)} ({isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%)
              </Typography>
            </Box>
          </Box>

          {/* Key Metrics */}
          <Box display="flex" justifyContent="space-between" gap={4} mb={4}>
            <Box textAlign="center" flex={1}>
              <Typography 
                variant="h6" 
                color="text.secondary" 
                sx={{ 
                  fontSize: '1rem', 
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                  mb: 1
                }}
              >
                VOLUME
              </Typography>
              <Tooltip title={`Volume: ${formatNumber(stock.volume)}`}>
                <Typography 
                  variant="h4" 
                  fontWeight={800} 
                  color="text.primary"
                  sx={{ fontSize: '1.6rem' }}
                >
                  {StockUtils.formatVolume(stock.volume)}
                </Typography>
              </Tooltip>
            </Box>
            <Box textAlign="center" flex={1}>
              <Typography 
                variant="h6" 
                color="text.secondary" 
                sx={{ 
                  fontSize: '1rem', 
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                  mb: 1
                }}
              >
                MARKET CAP
              </Typography>
              <Tooltip title={`Market Cap: ₹${formatNumber(stock.marketCap)}`}>
                <Typography 
                  variant="h4" 
                  fontWeight={800} 
                  color="text.primary"
                  sx={{ fontSize: '1.6rem' }}
                >
                  ₹{StockUtils.formatMarketCap(stock.marketCap)}
                </Typography>
              </Tooltip>
            </Box>
          </Box>

          {/* Trading Buttons */}
          <Box display="flex" gap={2} mb={3}>
            <Button
              variant="contained"
              color="success"
              fullWidth
              size="large"
              startIcon={<ShoppingCart />}
              onClick={() => setTradingDialogOpen(true)}
              sx={{
                py: 1.5,
                fontWeight: 700,
                fontSize: '1rem',
                borderRadius: 2,
              }}
            >
              BUY
            </Button>
            <Button
              variant="contained"
              color="error"
              fullWidth
              size="large"
              startIcon={<SellOutlined />}
              onClick={() => setTradingDialogOpen(true)}
              sx={{
                py: 1.5,
                fontWeight: 700,
                fontSize: '1rem',
                borderRadius: 2,
              }}
            >
              SELL
            </Button>
          </Box>

          {/* Footer with Sector and Last Updated */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
            {stock.sector && (
              <Chip 
                label={stock.sector}
                size="medium"
                variant="outlined"
                sx={{ 
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  height: '38px',
                  borderRadius: '19px',
                  borderWidth: '2px'
                }}
              />
            )}
            <Typography 
              variant="body1" 
              color="text.disabled" 
              sx={{ 
                fontSize: '0.9rem',
                fontWeight: 500
              }}
            >
              {new Date(stock.lastUpdated).toLocaleTimeString()}
            </Typography>
          </Box>
        </CardContent>
      </Card>
      
      {/* Trading Dialog */}
      <Dialog
        open={tradingDialogOpen}
        onClose={() => setTradingDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogContent sx={{ p: 0 }}>
          <TradingInterface
            stock={stock}
            onTradeComplete={() => setTradingDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default StockCard; 