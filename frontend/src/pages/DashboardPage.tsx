import React, { useState } from 'react';
import { Box, Tabs, Tab, Container } from '@mui/material';
import { AccountBalance, TrendingUp } from '@mui/icons-material';
import StockList from '../components/StockList';
import PortfolioDashboard from '../components/trading/PortfolioDashboard';
import LiveBackground from '../components/LiveBackground';
import { Stock } from '../types/stock';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface DashboardPageProps {
  stocks?: Stock[];
  isConnected?: boolean;
  connectionStatus?: 'connecting' | 'connected' | 'disconnected' | 'error';
  error?: string | null;
  reconnect?: () => void;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

const DashboardPage: React.FC<DashboardPageProps> = ({ 
  stocks = [], 
  isConnected = true, 
  connectionStatus = 'connected', 
  error = null, 
  reconnect 
}) => {
  const [tabValue, setTabValue] = useState(0);

  // Debug logging
  console.log('DashboardPage rendered with:', {
    stocksCount: stocks.length,
    isConnected,
    connectionStatus,
    error,
    tabValue
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ position: 'relative', minHeight: '100vh' }}>
      {/* Background */}
      <LiveBackground />
      
      {/* Content */}
      <Box sx={{ position: 'relative', zIndex: 2 }}>
        <Container maxWidth="xl" sx={{ py: 2 }}>
          <Box sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            bgcolor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '12px 12px 0 0',
            backdropFilter: 'blur(10px)'
          }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              variant="fullWidth"
              sx={{
                '& .MuiTab-root': {
                  fontSize: '1rem',
                  fontWeight: 600,
                  py: 2,
                }
              }}
            >
              <Tab 
                icon={<AccountBalance />} 
                label="Portfolio" 
                iconPosition="start"
                sx={{ gap: 1 }}
              />
              <Tab 
                icon={<TrendingUp />} 
                label="Market Watch" 
                iconPosition="start"
                sx={{ gap: 1 }}
              />
            </Tabs>
          </Box>

          <Box sx={{ 
            bgcolor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '0 0 12px 12px',
            backdropFilter: 'blur(10px)',
            minHeight: 'calc(100vh - 200px)'
          }}>
            <TabPanel value={tabValue} index={0}>
              <PortfolioDashboard />
            </TabPanel>
            <TabPanel value={tabValue} index={1}>
              <StockList 
                stocks={stocks}
                isConnected={isConnected}
                connectionStatus={connectionStatus}
                error={error}
                reconnect={reconnect}
              />
            </TabPanel>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default DashboardPage; 