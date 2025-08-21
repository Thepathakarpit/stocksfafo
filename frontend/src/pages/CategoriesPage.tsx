import React from 'react';
import { Box, Typography, Grid, Paper, Chip } from '@mui/material';
import { TrendingUp, TrendingDown, Remove } from '@mui/icons-material';
import CategorizedStockView from '../components/CategorizedStockView';
import { Stock } from '../types/stock';

interface CategoriesPageProps {
  stocks?: Stock[];
  isConnected?: boolean;
  connectionStatus?: 'connecting' | 'connected' | 'disconnected' | 'error';
}

const CategoriesPage: React.FC<CategoriesPageProps> = ({ 
  stocks = [], 
  isConnected = true, 
  connectionStatus = 'connected' 
}) => {
  // Calculate category statistics
  const gainers = stocks.filter(stock => stock.changePercent > 0);
  const losers = stocks.filter(stock => stock.changePercent < 0);
  const unchanged = stocks.filter(stock => stock.changePercent === 0);

  const categories = [
    {
      name: 'Top Gainers',
      stocks: gainers.slice(0, 10),
      color: 'success',
      icon: <TrendingUp />,
      count: gainers.length
    },
    {
      name: 'Top Losers',
      stocks: losers.slice(0, 10),
      color: 'error',
      icon: <TrendingDown />,
      count: losers.length
    },
    {
      name: 'Unchanged',
      stocks: unchanged.slice(0, 10),
      color: 'default',
      icon: <Remove />,
      count: unchanged.length
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: 600 }}>
        Stock Categories
      </Typography>

      {/* Category Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {categories.map((category) => (
          <Grid item xs={12} md={4} key={category.name}>
            <Paper
              elevation={2}
              sx={{
                p: 3,
                textAlign: 'center',
                border: `2px solid ${category.color === 'success' ? '#4caf50' : category.color === 'error' ? '#f44336' : '#9e9e9e'}`,
                borderRadius: 2
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                {category.icon}
                <Typography variant="h6" sx={{ ml: 1, fontWeight: 600 }}>
                  {category.name}
                </Typography>
              </Box>
              <Chip 
                label={`${category.count} stocks`}
                color={category.color as any}
                size="medium"
                sx={{ fontWeight: 600 }}
              />
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Category Details */}
      <CategorizedStockView
        stocks={stocks}
        isLoading={connectionStatus === 'connecting'}
      />
    </Box>
  );
};

export default CategoriesPage; 