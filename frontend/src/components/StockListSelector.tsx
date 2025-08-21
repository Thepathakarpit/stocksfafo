import React, { useState } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  TextField,
  Typography,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  SwapHoriz as SwitchIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  ShowChart as ShowChartIcon
} from '@mui/icons-material';

interface StockListInfo {
  count: number;
  description: string;
  updateFrequency: string;
}

interface StockListSelectorProps {
  currentList: string;
  activeStockCount: number;
  onSwitchList: (listType: string, customCount?: number) => Promise<boolean>;
  isLoading?: boolean;
}

const StockListSelector: React.FC<StockListSelectorProps> = ({
  currentList,
  activeStockCount,
  onSwitchList,
  isLoading = false
}) => {
  const [selectedList, setSelectedList] = useState(currentList);
  const [customCount, setCustomCount] = useState<number | ''>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stockLists = {
    nifty50: {
      label: 'NIFTY 50',
      description: 'Top 50 companies by market cap',
      icon: <TrendingUpIcon />,
      color: 'primary',
      maxCount: 50
    },
    sensex30: {
      label: 'SENSEX 30',
      description: 'Top 30 BSE companies',
      icon: <AssessmentIcon />,
      color: 'secondary',
      maxCount: 30
    },
    nifty500: {
      label: 'NIFTY 500',
      description: 'Comprehensive 500 companies',
      icon: <ShowChartIcon />,
      color: 'success',
      maxCount: 500
    }
  };

  const handleSwitchClick = () => {
    if (selectedList === currentList && !customCount) {
      return; // No change needed
    }
    setDialogOpen(true);
  };

  const handleConfirmSwitch = async () => {
    setSwitching(true);
    setError(null);

    try {
      const success = await onSwitchList(
        selectedList,
        customCount ? Number(customCount) : undefined
      );

      if (success) {
        setDialogOpen(false);
        setCustomCount('');
      } else {
        setError('Failed to switch stock list. Please try again.');
      }
    } catch (err) {
      setError('Error switching stock list. Please check your connection.');
    } finally {
      setSwitching(false);
    }
  };

  const getListIcon = (listType: string) => {
    const list = stockLists[listType as keyof typeof stockLists];
    return list ? list.icon : <TrendingUpIcon />;
  };

  const getListColor = (listType: string) => {
    const list = stockLists[listType as keyof typeof stockLists];
    return list ? list.color : 'primary';
  };

  const getEstimatedLoadTime = () => {
    const targetCount = customCount || stockLists[selectedList as keyof typeof stockLists]?.maxCount || 50;
    if (targetCount <= 50) return '< 1 min';
    if (targetCount <= 200) return '1-2 mins';
    return '2-3 mins';
  };

  return (
    <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
      {/* Current Status */}
      <Box display="flex" alignItems="center" gap={1}>
        <Chip
          icon={getListIcon(currentList)}
          label={`${stockLists[currentList as keyof typeof stockLists]?.label || currentList.toUpperCase()} (${activeStockCount})`}
          color={getListColor(currentList) as any}
          variant="filled"
          size="medium"
        />
        {isLoading && (
          <CircularProgress size={16} />
        )}
      </Box>

      {/* List Selector */}
      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel>Stock List</InputLabel>
        <Select
          value={selectedList}
          label="Stock List"
          onChange={(e) => setSelectedList(e.target.value)}
        >
          {Object.entries(stockLists).map(([key, list]) => (
            <MenuItem key={key} value={key}>
              <Box display="flex" alignItems="center" gap={1}>
                {list.icon}
                {list.label}
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Custom Count Input */}
      <TextField
        size="small"
        label="Custom Count"
        type="number"
        value={customCount}
        onChange={(e) => setCustomCount(e.target.value ? parseInt(e.target.value) : '')}
        sx={{ width: 120 }}
        inputProps={{
          min: 1,
          max: stockLists[selectedList as keyof typeof stockLists]?.maxCount || 500
        }}
        placeholder="Optional"
      />

      {/* Switch Button */}
      <Button
        variant="contained"
        startIcon={<SwitchIcon />}
        onClick={handleSwitchClick}
        disabled={
          switching ||
          (selectedList === currentList && !customCount) ||
          (customCount !== '' && (customCount < 1 || customCount > (stockLists[selectedList as keyof typeof stockLists]?.maxCount || 500)))
        }
        color={getListColor(selectedList) as any}
      >
        Switch
      </Button>

      {/* Confirmation Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <SwitchIcon />
            Switch Stock List
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2}>
            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}
            
            <Typography variant="body1">
              You're about to switch from{' '}
              <strong>{stockLists[currentList as keyof typeof stockLists]?.label || currentList.toUpperCase()}</strong>{' '}
              to{' '}
              <strong>{stockLists[selectedList as keyof typeof stockLists]?.label}</strong>
              {customCount && ` (${customCount} stocks)`}.
            </Typography>

            <Box
              sx={{
                p: 2,
                bgcolor: 'background.paper',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <Typography variant="subtitle2" gutterBottom>
                New Configuration:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • List: {stockLists[selectedList as keyof typeof stockLists]?.label}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Stocks: {customCount || stockLists[selectedList as keyof typeof stockLists]?.maxCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Estimated Load Time: {getEstimatedLoadTime()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Update Frequency: Real-time with batching
              </Typography>
            </Box>

            <Alert severity="info">
              <Typography variant="body2">
                The switch will temporarily interrupt real-time updates while the new stock list is loaded.
                WebSocket connection will be maintained.
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={switching}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmSwitch}
            variant="contained"
            disabled={switching}
            startIcon={switching ? <CircularProgress size={16} /> : <SwitchIcon />}
            color={getListColor(selectedList) as any}
          >
            {switching ? 'Switching...' : 'Confirm Switch'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StockListSelector; 