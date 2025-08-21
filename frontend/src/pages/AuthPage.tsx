import React, { useState, useEffect } from 'react';
import { Box, Container, Paper } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import LiveBackground from '../components/LiveBackground';

type AuthMode = 'login' | 'register';

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  // Check if user is already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname;
      // If coming from an auth page or root, go to /dashboard
      if (!from || from === '/' || from.startsWith('/auth')) {
        navigate('/dashboard', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    }
  }, [isAuthenticated, navigate, location]);

  // Set initial auth mode based on URL or state
  useEffect(() => {
    if (location.pathname.endsWith('/register')) {
      setAuthMode('register');
    } else {
      setAuthMode('login');
    }
  }, [location.pathname]);

  const handleAuthSuccess = () => {
    const from = (location.state as any)?.from?.pathname || '/';
    navigate(from, { replace: true });
  };

  const switchToLogin = () => {
    setAuthMode('login');
    navigate('/auth/login', { replace: true });
  };

  const switchToRegister = () => {
    setAuthMode('register');
    navigate('/auth/register', { replace: true });
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      {/* Animated Background */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: 0.3,
          zIndex: 0,
        }}
      >
        <LiveBackground />
      </Box>

      {/* Auth Form Container */}
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1, py: 4 }}>
        <Paper
          elevation={24}
          sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          {authMode === 'login' ? (
            <LoginForm
              onSwitchToRegister={switchToRegister}
              onSuccess={handleAuthSuccess}
            />
          ) : (
            <RegisterForm
              onSwitchToLogin={switchToLogin}
              onSuccess={handleAuthSuccess}
            />
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default AuthPage; 