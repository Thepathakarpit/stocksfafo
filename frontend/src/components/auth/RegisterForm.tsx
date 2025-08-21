import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import { PersonAdd, LoginOutlined, AccountBalance } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { UserRegistrationData } from '../../types/auth';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
  onSuccess?: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin, onSuccess }) => {
  const { register, isLoading } = useAuth();
  const [formData, setFormData] = useState<UserRegistrationData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    console.log('🔧 RegisterForm: Field change:', { name, value, type: typeof value });
    
    if (name === 'confirmPassword') {
      setConfirmPassword(value);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
    // Clear error when user starts typing
    if (error) setError('');
  };

  const validateForm = (): boolean => {
    // Check all required fields are filled
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      setError('Please fill in all required fields');
      return false;
    }

    // Check confirm password is filled
    if (!confirmPassword) {
      setError('Please confirm your password');
      return false;
    }

    // Check email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    // Check password length
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    // Check password strength
    if (!/(?=.*[a-z])/.test(formData.password)) {
      setError('Password must contain at least one lowercase letter');
      return false;
    }

    if (!/(?=.*[A-Z])/.test(formData.password)) {
      setError('Password must contain at least one uppercase letter');
      return false;
    }

    if (!/(?=.*\d)/.test(formData.password)) {
      setError('Password must contain at least one number');
      return false;
    }

    // Check password confirmation
    if (formData.password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    // Check name lengths
    if (formData.firstName.trim().length < 2 || formData.lastName.trim().length < 2) {
      setError('First name and last name must be at least 2 characters long');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    console.log('🔐 RegisterForm: Form submission started');
    console.log('📋 Form data:', formData);
    console.log('🔑 Confirm password:', confirmPassword ? 'filled' : 'empty');

    if (!validateForm()) {
      console.log('❌ RegisterForm: Validation failed');
      return;
    }

    console.log('✅ RegisterForm: Validation passed, calling register API');

    try {
      const success = await register({
        ...formData,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
      });
      
      if (success) {
        console.log('✅ RegisterForm: Registration successful');
        onSuccess?.();
      } else {
        console.log('❌ RegisterForm: Registration failed');
        setError('Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('❌ RegisterForm: Registration error:', error);
      setError('Registration failed. Please try again.');
    }
  };

  return (
    <Card sx={{ maxWidth: 500, width: '100%', mx: 'auto' }}>
      <CardContent sx={{ p: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <AccountBalance sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" component="h1" gutterBottom>
            Start Trading
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create your free account and get ₹5,00,000 demo money to start trading
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
              <TextField
                fullWidth
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                autoComplete="given-name"
                disabled={isLoading}
              />
            </Box>
            <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
              <TextField
                fullWidth
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                autoComplete="family-name"
                disabled={isLoading}
              />
            </Box>
          </Box>

          <TextField
            fullWidth
            label="Email Address"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            margin="normal"
            required
            autoComplete="email"
            disabled={isLoading}
          />

          <TextField
            fullWidth
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            margin="normal"
            required
            autoComplete="new-password"
            disabled={isLoading}
            helperText="Must contain at least 6 characters with uppercase, lowercase, and number"
          />

          <TextField
            fullWidth
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={handleChange}
            margin="normal"
            required
            autoComplete="new-password"
            disabled={isLoading}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={isLoading}
            sx={{ mt: 3, mb: 2, py: 1.5 }}
            startIcon={isLoading ? <CircularProgress size={20} /> : <PersonAdd />}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </Button>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              or
            </Typography>
          </Divider>

          <Button
            fullWidth
            variant="outlined"
            size="large"
            onClick={onSwitchToLogin}
            disabled={isLoading}
            startIcon={<LoginOutlined />}
            sx={{ py: 1.5 }}
          >
            Already have an account? Sign In
          </Button>
        </Box>

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Demo Trading Platform • No real money involved
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            By creating an account, you get ₹5,00,000 virtual money to practice trading
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default RegisterForm; 