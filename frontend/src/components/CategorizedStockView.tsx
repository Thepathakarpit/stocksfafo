import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
  Badge,
  Grid
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Sort as SortIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { Stock, StockCategory, SortField, SortDirection, SORT_OPTIONS, StockUtils } from '../types/stock';
import StockCard from './StockCard';

interface CategorizedStockViewProps {
  stocks: Stock[];
  isLoading?: boolean;
}

const CategorizedStockView: React.FC<CategorizedStockViewProps> = ({
  stocks,
  isLoading = false
}) => {
  const [sortField, setSortField] = useState<SortField>('gain');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['Banking', 'IT Services', 'FMCG']));

  // Categorize and sort stocks
  const categorizedStocks = useMemo(() => {
    const categories = StockUtils.categorizeStocksBySector(stocks);
    
    // Sort stocks within each category
    return categories.map(category => ({
      ...category,
      stocks: StockUtils.sortStocks(category.stocks, sortField, sortDirection)
    }));
  }, [stocks, sortField, sortDirection]);

  const handleCategoryToggle = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleSortChange = (event: any) => {
    const selectedOption = SORT_OPTIONS.find(option => 
      `${option.field}-${option.direction}` === event.target.value
    );
    if (selectedOption) {
      setSortField(selectedOption.field);
      setSortDirection(selectedOption.direction);
    }
  };

  const getTotalStats = () => {
    const totalStocks = stocks.length;
    const gainers = stocks.filter(stock => stock.changePercent > 0).length;
    const losers = stocks.filter(stock => stock.changePercent < 0).length;
    const neutral = totalStocks - gainers - losers;
    
    return { totalStocks, gainers, losers, neutral };
  };

  const stats = getTotalStats();

  if (isLoading && stocks.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Box textAlign="center">
          <Box
            sx={{
              width: 48,
              height: 48,
              border: '3px solid #e5e7eb',
              borderTop: '3px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              mx: 'auto',
              mb: 2
            }}
          />
          <Typography variant="body2" color="text.secondary">
            Loading categorized stocks...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box display="flex" flexDirection="column" gap={3}>
      {/* Header with stats and sorting */}
      <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <Box>
              <Typography variant="h5" fontWeight={700} gutterBottom>
                Market Overview by Sectors
              </Typography>
              <Box display="flex" gap={2} flexWrap="wrap">
                <Chip 
                  label={`${stats.totalStocks} Total`} 
                  variant="outlined" 
                  sx={{ color: 'white', borderColor: 'white' }}
                />
                <Chip 
                  icon={<TrendingUpIcon />}
                  label={`${stats.gainers} Gainers`} 
                  sx={{ backgroundColor: '#00e676', color: 'white' }}
                />
                <Chip 
                  icon={<TrendingDownIcon />}
                  label={`${stats.losers} Losers`} 
                  sx={{ backgroundColor: '#ff1744', color: 'white' }}
                />
                <Chip 
                  label={`${stats.neutral} Neutral`} 
                  sx={{ backgroundColor: '#9e9e9e', color: 'white' }}
                />
              </Box>
            </Box>
            
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel sx={{ color: 'white' }}>Sort by</InputLabel>
              <Select
                value={`${sortField}-${sortDirection}`}
                onChange={handleSortChange}
                label="Sort by"
                startAdornment={<SortIcon sx={{ mr: 1, color: 'white' }} />}
                sx={{
                  color: 'white',
                  '.MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                  '.MuiSvgIcon-root': { color: 'white' }
                }}
              >
                {SORT_OPTIONS.map((option) => (
                  <MenuItem key={`${option.field}-${option.direction}`} value={`${option.field}-${option.direction}`}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* Categories */}
      <Box display="flex" flexDirection="column" gap={2}>
        <AnimatePresence>
          {categorizedStocks.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Accordion
                expanded={expandedCategories.has(category.id)}
                onChange={() => handleCategoryToggle(category.id)}
                sx={{
                  borderRadius: 2,
                  '&:before': { display: 'none' },
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    backgroundColor: category.color,
                    color: 'white',
                    borderRadius: '8px 8px 0 0',
                    '& .MuiAccordionSummary-content': {
                      alignItems: 'center',
                      gap: 2
                    }
                  }}
                >
                  <Box display="flex" alignItems="center" gap={2} flex={1}>
                    <Typography variant="h6" sx={{ fontSize: '2rem' }}>
                      {category.icon}
                    </Typography>
                    <Box flex={1}>
                      <Typography variant="h6" fontWeight={600}>
                        {category.name}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        {category.description}
                      </Typography>
                    </Box>
                    <Box display="flex" gap={1} flexWrap="wrap">
                      <Badge badgeContent={category.stocks.length} color="secondary">
                        <Chip 
                          label="Stocks" 
                          size="small" 
                          variant="outlined" 
                          sx={{ color: 'white', borderColor: 'white' }}
                        />
                      </Badge>
                      <Chip 
                        label={`${category.avgChange >= 0 ? '+' : ''}${category.avgChange.toFixed(2)}%`}
                        size="small"
                        sx={{
                          backgroundColor: category.avgChange >= 0 ? '#00e676' : '#ff1744',
                          color: 'white'
                        }}
                      />
                      <Chip 
                        label={StockUtils.formatMarketCap(category.totalValue)}
                        size="small"
                        variant="outlined"
                        sx={{ color: 'white', borderColor: 'white' }}
                      />
                    </Box>
                  </Box>
                </AccordionSummary>
                
                <AccordionDetails sx={{ p: 0 }}>
                  <Box p={2}>
                    <Grid container spacing={2}>
                      {category.stocks.map((stock) => (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={stock.symbol}>
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.2 }}
                          >
                            <StockCard stock={stock} />
                          </motion.div>
                        </Grid>
                      ))}
                    </Grid>
                    
                    {category.stocks.length === 0 && (
                      <Box textAlign="center" py={4}>
                        <Typography variant="body2" color="text.secondary">
                          No stocks in this category
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </AccordionDetails>
              </Accordion>
            </motion.div>
          ))}
        </AnimatePresence>
      </Box>

      {categorizedStocks.length === 0 && (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No stocks available
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Stocks will appear here once data is loaded
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default CategorizedStockView; 