import React from 'react';
import { Box, Chip, Tooltip, IconButton } from '@mui/material';
import { 
  Wifi as ConnectedIcon,
  WifiOff as DisconnectedIcon,
  Sync as ConnectingIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

interface ConnectionStatusProps {
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  isConnected: boolean;
  error?: string | null;
  onReconnect: () => void;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  status,
  isConnected,
  error,
  onReconnect
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'connected':
        return <ConnectedIcon fontSize="small" />;
      case 'connecting':
        return <ConnectingIcon fontSize="small" sx={{ animation: 'spin 1s linear infinite' }} />;
      case 'error':
        return <ErrorIcon fontSize="small" />;
      default:
        return <DisconnectedIcon fontSize="small" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'connected': return 'success';
      case 'connecting': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected': return 'Live Data';
      case 'connecting': return 'Connecting...';
      case 'error': return 'Connection Error';
      default: return 'Offline';
    }
  };

  const getTooltipText = () => {
    if (error) return `Connection Error: ${error}`;
    switch (status) {
      case 'connected': return 'Connected to live stock data';
      case 'connecting': return 'Connecting to stock data server...';
      case 'error': return 'Unable to connect to stock data server';
      default: return 'Not connected to stock data server';
    }
  };

  return (
    <Box display="flex" alignItems="center" gap={1}>
      <Tooltip title={getTooltipText()}>
        <Chip
          icon={getStatusIcon()}
          label={getStatusText()}
          color={getStatusColor()}
          size="small"
          variant={isConnected ? 'filled' : 'outlined'}
          sx={{ 
            fontWeight: 600,
            '& .MuiChip-icon': {
              animation: status === 'connecting' ? 'spin 1s linear infinite' : 'none'
            }
          }}
        />
      </Tooltip>
      
      {!isConnected && (
        <Tooltip title="Reconnect to live data">
          <IconButton 
            onClick={onReconnect} 
            size="small" 
            color="primary"
            sx={{ 
              opacity: 0.7,
              '&:hover': { opacity: 1 }
            }}
          >
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
};

export default ConnectionStatus; 