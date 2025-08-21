import React, { useState } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Badge,
  Chip,
  Divider,
  useTheme,
  useMediaQuery,
  Typography,
  Tooltip,
  Button,
  Avatar,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  Dashboard as DashboardIcon,
  Category as CategoryIcon,
  TrendingUp as TrendingUpIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  Info as InfoIcon,
  Bolt,
  AccountCircle,
  Logout,
  AccountBalance
} from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ConnectionStatus from './ConnectionStatus';
import StockListSelector from './StockListSelector';

interface LayoutProps {
  children: React.ReactNode;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  isConnected: boolean;
  error?: string | null;
  onReconnect: () => void;
  currentStockList: string;
  activeStockCount: number;
  onSwitchStockList: (listType: string, customCount?: number) => Promise<boolean>;
  isLoading?: boolean;
}

const SIDEBAR_WIDTH_EXPANDED = 320; // Increased from 260
const SIDEBAR_WIDTH_COLLAPSED = 90; // Increased from 72

const Layout: React.FC<LayoutProps> = ({
  children,
  connectionStatus,
  isConnected,
  error,
  onReconnect,
  currentStockList,
  activeStockCount,
  onSwitchStockList,
  isLoading = false
}) => {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, logout } = useAuth();

  const navigationItems = [
    {
      path: '/',
      label: 'Dashboard',
      icon: <DashboardIcon sx={{ fontSize: '1.8rem' }} />,
      badge: activeStockCount > 0 ? activeStockCount : undefined
    },
    {
      path: '/categories',
      label: 'Categories',
      icon: <CategoryIcon sx={{ fontSize: '1.8rem' }} />,
    },
    {
      path: '/analysis',
      label: 'Analysis',
      icon: <AnalyticsIcon sx={{ fontSize: '1.8rem' }} />,
      badge: 'NEW'
    },
    {
      path: '/performance',
      label: 'Performance',
      icon: <TrendingUpIcon sx={{ fontSize: '1.8rem' }} />,
    },
    {
      path: '/settings',
      label: 'Settings',
      icon: <SettingsIcon sx={{ fontSize: '1.8rem' }} />,
    },
    {
      path: '/about',
      label: 'About',
      icon: <InfoIcon sx={{ fontSize: '1.8rem' }} />,
    }
  ];

  const isActivePage = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleLogout = () => {
    logout();
    handleUserMenuClose();
  };

  const formatCurrency = (amount: number): string => {
    return `₹${amount.toLocaleString('en-IN', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0 
    })}`;
  };

  const sidebarContent = (isExpanded: boolean) => (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      backgroundColor: '#1a1a1a',
      color: 'white'
    }}>
      {/* Header */}
      <Box sx={{ 
        p: isExpanded ? 4 : 3, 
        display: 'flex', 
        alignItems: 'center',
        justifyContent: isExpanded ? 'space-between' : 'center',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        minHeight: '80px'
      }}>
        {isExpanded ? (
          <>
            <Box display="flex" alignItems="center" gap={2}>
              <Bolt sx={{ fontSize: 36, color: '#42a5f5' }} />
              <Typography variant="h5" fontWeight={800} color="white">
                Stocks Pro
              </Typography>
            </Box>
            <IconButton 
              onClick={() => setSidebarExpanded(false)}
              sx={{ 
                color: 'white',
                width: 48,
                height: 48,
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              <ChevronLeftIcon sx={{ fontSize: '1.8rem' }} />
            </IconButton>
          </>
        ) : (
          <IconButton 
            onClick={() => setSidebarExpanded(true)}
            sx={{ 
              color: 'white',
              width: 56,
              height: 56,
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.1)'
              }
            }}
          >
            <MenuIcon sx={{ fontSize: '2rem' }} />
          </IconButton>
        )}
      </Box>

      {/* Connection Status - Only when expanded */}
      {isExpanded && (
        <Box sx={{ p: 3, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <Typography variant="subtitle1" color="rgba(255,255,255,0.9)" fontWeight={600} gutterBottom>
            Connection Status
          </Typography>
          <ConnectionStatus
            status={connectionStatus}
            isConnected={isConnected}
            error={error}
            onReconnect={onReconnect}
          />
          <Box mt={2}>
            <Chip 
              label={`${activeStockCount} stocks active`}
              size="medium"
              sx={{ 
                backgroundColor: 'rgba(66, 165, 245, 0.2)',
                color: '#42a5f5',
                fontSize: '0.9rem',
                fontWeight: 600,
                height: '32px'
              }}
            />
          </Box>
        </Box>
      )}

      {/* Stock List Selector - Only when expanded */}
      {isExpanded && (
        <Box sx={{ p: 3, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <Typography variant="subtitle1" color="rgba(255,255,255,0.9)" fontWeight={600} gutterBottom>
            Stock Lists
          </Typography>
          <StockListSelector
            currentList={currentStockList}
            activeStockCount={activeStockCount}
            onSwitchList={onSwitchStockList}
            isLoading={isLoading}
          />
        </Box>
      )}

      {/* Navigation Items */}
      <List sx={{ flex: 1, py: 2 }}>
        {navigationItems.map((item) => {
          const isActive = isActivePage(item.path);
          const listItem = (
            <ListItem
              key={item.path}
              component={Link}
              to={item.path}
              onClick={() => {
                if (isMobile) setMobileDrawerOpen(false);
              }}
              sx={{
                borderRadius: 3,
                mx: 2,
                mb: 1.5,
                minHeight: 60,
                backgroundColor: isActive ? 'rgba(66, 165, 245, 0.15)' : 'transparent',
                border: isActive ? '2px solid rgba(66, 165, 245, 0.4)' : '2px solid transparent',
                color: isActive ? '#42a5f5' : 'rgba(255,255,255,0.8)',
                '&:hover': {
                  backgroundColor: isActive ? 'rgba(66, 165, 245, 0.2)' : 'rgba(255,255,255,0.08)',
                  transform: 'translateX(4px)',
                  transition: 'all 0.2s ease-in-out'
                },
                textDecoration: 'none',
                justifyContent: isExpanded ? 'flex-start' : 'center',
                transition: 'all 0.2s ease-in-out'
              }}
            >
              <ListItemIcon 
                sx={{ 
                  color: isActive ? '#42a5f5' : 'rgba(255,255,255,0.7)',
                  minWidth: isExpanded ? 56 : 'auto',
                  justifyContent: 'center'
                }}
              >
                {item.badge ? (
                  <Badge 
                    badgeContent={item.badge} 
                    color="secondary"
                    sx={{
                      '& .MuiBadge-badge': {
                        backgroundColor: '#ff4757',
                        color: 'white',
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }
                    }}
                  >
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )}
              </ListItemIcon>
              {isExpanded && (
                <ListItemText 
                  primary={item.label}
                  primaryTypographyProps={{
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '1.1rem'
                  }}
                />
              )}
            </ListItem>
          );

          // Wrap with Tooltip when collapsed
          return !isExpanded ? (
            <Tooltip key={item.path} title={item.label} placement="right" arrow>
              {listItem}
            </Tooltip>
          ) : listItem;
        })}
      </List>

      {/* User Info & Portfolio Summary - Only when expanded */}
      {isExpanded && user && (
        <Box sx={{ p: 3, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          {/* User Info */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main', mr: 2, width: 40, height: 40 }}>
                {user.firstName[0]}{user.lastName[0]}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" color="white" fontWeight={600}>
                  {user.firstName} {user.lastName}
                </Typography>
                <Typography variant="caption" color="rgba(255,255,255,0.6)">
                  {user.email}
                </Typography>
              </Box>
              <IconButton
                onClick={handleUserMenuOpen}
                size="small"
                sx={{ color: 'rgba(255,255,255,0.8)' }}
              >
                <AccountCircle />
              </IconButton>
            </Box>

            {/* Portfolio Summary */}
            <Box sx={{ 
              bgcolor: 'rgba(66, 165, 245, 0.1)', 
              borderRadius: 2, 
              p: 2,
              border: '1px solid rgba(66, 165, 245, 0.2)'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AccountBalance sx={{ fontSize: 20, color: '#42a5f5', mr: 1 }} />
                <Typography variant="subtitle2" color="white" fontWeight={600}>
                  Portfolio Value
                </Typography>
              </Box>
              <Typography variant="h6" color="#42a5f5" fontWeight={700}>
                {formatCurrency(user.portfolio.totalValue)}
              </Typography>
              <Typography variant="caption" color="rgba(255,255,255,0.6)">
                Cash: {formatCurrency(user.portfolio.cash)} • 
                Stocks: {user.portfolio.stocks.length}
              </Typography>
            </Box>
          </Box>

          {/* Logout Button */}
          <Button
            fullWidth
            variant="outlined"
            color="error"
            startIcon={<Logout />}
            onClick={handleLogout}
            sx={{
              borderColor: 'rgba(244, 67, 54, 0.5)',
              color: 'rgba(244, 67, 54, 0.9)',
              '&:hover': {
                borderColor: 'error.main',
                backgroundColor: 'rgba(244, 67, 54, 0.1)',
              },
            }}
          >
            Logout
          </Button>

          {/* App Info */}
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="rgba(255,255,255,0.6)" fontWeight={500}>
              Demo Trading Platform
            </Typography>
            <Typography variant="caption" color="rgba(255,255,255,0.4)" display="block" mt={0.5}>
              v2.0 • No real money involved
            </Typography>
          </Box>
        </Box>
      )}

      {/* User Menu */}
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={handleUserMenuClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <MenuItem onClick={handleUserMenuClose} component={Link} to="/settings">
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          Settings
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </Box>
  );

  const currentSidebarWidth = sidebarExpanded ? SIDEBAR_WIDTH_EXPANDED : SIDEBAR_WIDTH_COLLAPSED;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Box
          sx={{
            width: currentSidebarWidth,
            flexShrink: 0,
            transition: 'width 0.3s ease-in-out',
            zIndex: 1200
          }}
        >
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: currentSidebarWidth,
              height: '100vh',
              transition: 'width 0.3s ease-in-out',
              zIndex: 1200,
              boxShadow: '4px 0 20px rgba(0,0,0,0.1)'
            }}
          >
            {sidebarContent(sidebarExpanded)}
          </Box>
        </Box>
      )}

      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer
          variant="temporary"
          anchor="left"
          open={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
          sx={{
            '& .MuiDrawer-paper': {
              width: SIDEBAR_WIDTH_EXPANDED,
              boxSizing: 'border-box',
            },
          }}
        >
          {sidebarContent(true)}
        </Drawer>
      )}

      {/* Mobile Menu Button */}
      {isMobile && (
        <IconButton
          onClick={() => setMobileDrawerOpen(true)}
          sx={{
            position: 'fixed',
            top: 20,
            left: 20,
            zIndex: 1300,
            backgroundColor: '#1a1a1a',
            color: 'white',
            '&:hover': {
              backgroundColor: '#333',
            },
            width: 56,
            height: 56,
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}
        >
          <MenuIcon sx={{ fontSize: '1.8rem' }} />
        </IconButton>
      )}

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: isMobile ? '100%' : `calc(100% - ${currentSidebarWidth}px)`,
          minHeight: '100vh',
          backgroundColor: 'background.default',
          transition: 'width 0.3s ease-in-out, margin-left 0.3s ease-in-out',
          marginLeft: isMobile ? 0 : 0,
          paddingTop: isMobile ? '96px' : 0, // Increased space for larger mobile menu button
          overflow: 'hidden'
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout; 