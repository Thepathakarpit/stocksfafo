import React from 'react';
import { Box } from '@mui/material';

const LiveBackground: React.FC = () => (
  <Box 
    sx={{ 
      position: 'fixed', 
      inset: 0, 
      zIndex: 0, 
      pointerEvents: 'none',
      background: 'linear-gradient(45deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `radial-gradient(circle at 25% 25%, #00e5ff 1px, transparent 1px),
                     radial-gradient(circle at 75% 75%, #00e5ff 1px, transparent 1px),
                     radial-gradient(circle at 50% 10%, #00e5ff 1px, transparent 1px)`,
        backgroundSize: '100px 100px, 150px 150px, 200px 200px',
        opacity: 0.5,
        animation: 'twinkle 3s infinite alternate'
      },
      '@keyframes twinkle': {
        '0%': { opacity: 0.3 },
        '100%': { opacity: 0.6 }
      }
    }}
  />
);

export default LiveBackground; 