import React from 'react';
import { Box, Typography, Grid, Card, CardContent, LinearProgress } from '@mui/material';
import { TrendingUp, TrendingDown, Speed, Assessment } from '@mui/icons-material';
import { Stock } from '../types/stock';

interface PerformancePageProps {
  stocks?: Stock[];
  connectionStatus?: 'connecting' | 'connected' | 'disconnected' | 'error';
}

const PerformancePage: React.FC<PerformancePageProps> = ({ 
  stocks = [], 
  connectionStatus = 'connected' 
}) => {
  // Calculate performance metrics
  const totalStocks = stocks.length;
  const gainers = stocks.filter(stock => stock.changePercent > 0);
  const losers = stocks.filter(stock => stock.changePercent < 0);
  const unchanged = stocks.filter(stock => stock.changePercent === 0);

  const avgGain = gainers.length > 0 
    ? gainers.reduce((sum, stock) => sum + stock.changePercent, 0) / gainers.length 
    : 0;
  const avgLoss = losers.length > 0 
    ? losers.reduce((sum, stock) => sum + stock.changePercent, 0) / losers.length 
    : 0;

  const topGainers = [...gainers].sort((a, b) => b.changePercent - a.changePercent).slice(0, 5);
  const topLosers = [...losers].sort((a, b) => a.changePercent - b.changePercent).slice(0, 5);

  const metrics = [
    {
      title: 'Total Stocks',
      value: totalStocks,
      icon: <Assessment />,
      color: '#2196f3'
    },
    {
      title: 'Gainers',
      value: gainers.length,
      icon: <TrendingUp />,
      color: '#4caf50'
    },
    {
      title: 'Losers',
      value: losers.length,
      icon: <TrendingDown />,
      color: '#f44336'
    },
    {
      title: 'Unchanged',
      value: unchanged.length,
      icon: <Speed />,
      color: '#9e9e9e'
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: 600 }}>
        Market Performance
      </Typography>

      {/* Performance Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {metrics.map((metric) => (
          <Grid item xs={12} sm={6} md={3} key={metric.title}>
            <Card sx={{ 
              background: `linear-gradient(135deg, ${metric.color}15 0%, ${metric.color}25 100%)`,
              border: `1px solid ${metric.color}30`
            }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Box sx={{ color: metric.color, mb: 1 }}>
                  {metric.icon}
                </Box>
                <Typography variant="h4" fontWeight={700} sx={{ color: metric.color }}>
                  {metric.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {metric.title}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Average Performance */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Average Gain
              </Typography>
              <Typography variant="h4" color="success.main" fontWeight={700}>
                +{avgGain.toFixed(2)}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={Math.min(avgGain * 10, 100)} 
                color="success"
                sx={{ mt: 2, height: 8, borderRadius: 4 }}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Average Loss
              </Typography>
              <Typography variant="h4" color="error.main" fontWeight={700}>
                {avgLoss.toFixed(2)}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={Math.min(Math.abs(avgLoss) * 10, 100)} 
                color="error"
                sx={{ mt: 2, height: 8, borderRadius: 4 }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Top Performers */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="success.main">
                Top Gainers
              </Typography>
              {topGainers.map((stock, index) => (
                <Box key={stock.symbol} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">
                    {index + 1}. {stock.symbol}
                  </Typography>
                  <Typography variant="body2" color="success.main" fontWeight={600}>
                    +{stock.changePercent.toFixed(2)}%
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="error.main">
                Top Losers
              </Typography>
              {topLosers.map((stock, index) => (
                <Box key={stock.symbol} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">
                    {index + 1}. {stock.symbol}
                  </Typography>
                  <Typography variant="body2" color="error.main" fontWeight={600}>
                    {stock.changePercent.toFixed(2)}%
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PerformancePage; 