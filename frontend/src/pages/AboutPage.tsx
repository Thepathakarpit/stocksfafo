import React from 'react';
import { Box, Typography, Card, CardContent, Chip, Link } from '@mui/material';
import { Speed, Storage, Bolt, TrendingUp } from '@mui/icons-material';
import Grid from '@mui/material/Grid';

const AboutPage: React.FC = () => {
  const features = [
    {
      icon: <Bolt />,
      title: 'Real-time Updates',
      description: 'Live stock prices updated every second via WebSocket connection'
    },
    {
      icon: <Speed />,
      title: 'High Performance',
      description: 'Optimized for handling 500+ stocks with minimal resource usage'
    },
    {
      icon: <Storage />,
      title: 'Smart Caching',
      description: 'Intelligent data batching and caching for optimal API usage'
    },
    {
      icon: <TrendingUp />,
      title: 'Advanced Analytics',
      description: 'Sector categorization, sorting, and performance analysis'
    }
  ];

  const techStack = [
    { name: 'React', version: '18.x', type: 'Frontend' },
    { name: 'TypeScript', version: '4.x', type: 'Language' },
    { name: 'Material-UI', version: '6.x', type: 'UI Framework' },
    { name: 'Socket.IO', version: '4.x', type: 'Real-time' },
    { name: 'Node.js', version: '18.x', type: 'Backend' },
    { name: 'Express', version: '4.x', type: 'Server' },
    { name: 'Three.js', version: '0.x', type: 'Graphics' },
    { name: 'Framer Motion', version: '11.x', type: 'Animation' }
  ];

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        About Stock Dashboard
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
        A comprehensive Indian stock market dashboard with real-time data and advanced analytics
      </Typography>

      {/* Project Overview */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <CardContent>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            🚀 Indian Stock Market Dashboard
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            A high-performance, real-time stock market dashboard designed specifically for Indian markets. 
            Features live data from NSE with support for NIFTY 50, SENSEX 30, and NIFTY 500 stocks.
          </Typography>
          <Box display="flex" gap={2} flexWrap="wrap">
            <Chip label="Real-time Data" sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }} />
            <Chip label="WebSocket Connection" sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }} />
            <Chip label="Responsive Design" sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }} />
            <Chip label="Open Source" sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }} />
          </Box>
        </CardContent>
      </Card>

      {/* Features */}
      <Typography variant="h5" fontWeight={600} gutterBottom sx={{ mt: 4, mb: 2 }}>
        Key Features
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {features.map((feature, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2} mb={1}>
                  <Box sx={{ color: 'primary.main', fontSize: '1.5rem' }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" fontWeight={600}>
                    {feature.title}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {feature.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Tech Stack */}
      <Typography variant="h5" fontWeight={600} gutterBottom sx={{ mb: 2 }}>
        Technology Stack
      </Typography>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            {techStack.map((tech, index) => (
              <Grid item xs={6} sm={4} md={3} key={index}>
                <Box textAlign="center" p={1}>
                  <Typography variant="body1" fontWeight={600}>
                    {tech.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {tech.version}
                  </Typography>
                  <Chip 
                    label={tech.type} 
                    size="small" 
                    variant="outlined" 
                    color="primary"
                    sx={{ mt: 0.5 }}
                  />
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Typography variant="h5" fontWeight={600} gutterBottom sx={{ mb: 2 }}>
        Performance Specifications
      </Typography>
              <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Data Processing
              </Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Update Frequency:</Typography>
                  <Chip label="1 second" size="small" color="success" />
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Max Stocks:</Typography>
                  <Chip label="500+" size="small" color="primary" />
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">API Efficiency:</Typography>
                  <Chip label="95% reduction" size="small" color="info" />
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Memory Usage:</Typography>
                  <Chip label="<5MB" size="small" color="warning" />
                </Box>
              </Box>
            </CardContent>
          </Card>
                  </Grid>

          <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Architecture
              </Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Connection Type:</Typography>
                  <Chip label="WebSocket" size="small" color="success" />
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Data Source:</Typography>
                  <Chip label="NSE India" size="small" color="primary" />
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Caching:</Typography>
                  <Chip label="Multi-tier" size="small" color="info" />
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Scalability:</Typography>
                  <Chip label="Enterprise" size="small" color="warning" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Footer */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Disclaimer
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            This dashboard is for educational and informational purposes only. Stock prices are fetched from 
            unofficial APIs and may not reflect real-time market conditions. Always consult official sources 
            and financial advisors before making investment decisions.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Data provided by NSE India (unofficial API). No authentication required for demo purposes.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AboutPage; 