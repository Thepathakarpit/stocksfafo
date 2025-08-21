import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Divider,
  Button,
  Alert,
  Chip
} from '@mui/material';
import { Refresh, Notifications, Palette, Speed } from '@mui/icons-material';
import StockListSelector from '../components/StockListSelector';
import Grid from '@mui/material/Grid';

interface SettingsPageProps {
  currentStockList: string;
  activeStockCount: number;
  onSwitchStockList: (listType: string, customCount?: number) => Promise<boolean>;
  isLoading?: boolean;
}

const SettingsPage: React.FC<SettingsPageProps> = ({
  currentStockList,
  activeStockCount,
  onSwitchStockList,
  isLoading = false
}) => {
  const [settings, setSettings] = useState({
    notifications: true,
    autoRefresh: true,
    darkMode: false,
    soundAlerts: false,
    highFrequencyUpdates: true
  });

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const handleSettingChange = (setting: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handleSaveSettings = () => {
    setSaveStatus('saving');
    // Simulate save operation
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 1000);
  };

  const handleResetToDefaults = () => {
    setSettings({
      notifications: true,
      autoRefresh: true,
      darkMode: false,
      soundAlerts: false,
      highFrequencyUpdates: true
    });
    setSaveStatus('idle');
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Settings
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
        Configure your dashboard preferences and data sources
      </Typography>

      <Grid container spacing={3}>
        {/* Stock List Configuration */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Refresh color="primary" />
                <Typography variant="h6" fontWeight={600}>
                  Data Source
                </Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Current List: <Chip label={currentStockList} size="small" color="primary" />
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
                Active Stocks: <Chip label={activeStockCount} size="small" />
              </Typography>

              <StockListSelector
                currentList={currentStockList}
                activeStockCount={activeStockCount}
                onSwitchList={onSwitchStockList}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Display Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Palette color="primary" />
                <Typography variant="h6" fontWeight={600}>
                  Display Settings
                </Typography>
              </Box>

              <Box display="flex" flexDirection="column" gap={1}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.darkMode}
                      onChange={() => handleSettingChange('darkMode')}
                    />
                  }
                  label="Dark Mode"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.autoRefresh}
                      onChange={() => handleSettingChange('autoRefresh')}
                    />
                  }
                  label="Auto Refresh Data"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.highFrequencyUpdates}
                      onChange={() => handleSettingChange('highFrequencyUpdates')}
                    />
                  }
                  label="High Frequency Updates (1 second)"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Notification Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Notifications color="primary" />
                <Typography variant="h6" fontWeight={600}>
                  Notifications
                </Typography>
              </Box>

              <Box display="flex" flexDirection="column" gap={1}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications}
                      onChange={() => handleSettingChange('notifications')}
                    />
                  }
                  label="Enable Notifications"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.soundAlerts}
                      onChange={() => handleSettingChange('soundAlerts')}
                    />
                  }
                  label="Sound Alerts"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Performance Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Speed color="primary" />
                <Typography variant="h6" fontWeight={600}>
                  Performance
                </Typography>
              </Box>

              <Typography variant="body2" color="text.secondary" gutterBottom>
                Current update frequency: <Chip label="1 second" size="small" color="success" />
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                WebSocket connection: <Chip label="Active" size="small" color="success" />
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Memory usage: <Chip label="Optimized" size="small" color="info" />
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Save/Reset Section */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Configuration
          </Typography>
          
          {saveStatus === 'saved' && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Settings saved successfully!
            </Alert>
          )}
          
          {saveStatus === 'error' && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Failed to save settings. Please try again.
            </Alert>
          )}

          <Box display="flex" gap={2} flexWrap="wrap">
            <Button
              variant="contained"
              onClick={handleSaveSettings}
              disabled={saveStatus === 'saving'}
            >
              {saveStatus === 'saving' ? 'Saving...' : 'Save Settings'}
            </Button>
            
            <Button
              variant="outlined"
              onClick={handleResetToDefaults}
              disabled={saveStatus === 'saving'}
            >
              Reset to Defaults
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SettingsPage; 