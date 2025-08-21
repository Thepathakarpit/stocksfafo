import express from 'express';
import { UserService } from '../services/userService';
import { generateToken, isValidEmail, isValidPassword } from '../utils/auth';
import { AuthResponse, UserRegistrationData, UserLoginData } from '../types/user';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();
const userService = UserService.getInstance();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req, res) => {
  try {
    console.log('🔐 Registration request received');
    console.log('📋 Request body:', JSON.stringify(req.body, null, 2));
    console.log('📋 Request headers:', req.headers);
    
    const { email, password, firstName, lastName }: UserRegistrationData = req.body;

    console.log('🔍 Extracted fields:', {
      email: email ? `"${email}" (${typeof email})` : 'undefined',
      password: password ? `"${password.substring(0, 3)}..." (${typeof password})` : 'undefined',
      firstName: firstName ? `"${firstName}" (${typeof firstName})` : 'undefined',
      lastName: lastName ? `"${lastName}" (${typeof lastName})` : 'undefined'
    });

    // Validate input
    if (!email || !password || !firstName || !lastName) {
      console.log('❌ Validation failed - missing fields:', {
        hasEmail: !!email,
        hasPassword: !!password,
        hasFirstName: !!firstName,
        hasLastName: !!lastName
      });
      
      const response: AuthResponse = {
        success: false,
        message: 'All fields are required'
      };
      return res.status(400).json(response);
    }

    // Validate email format
    if (!isValidEmail(email)) {
      const response: AuthResponse = {
        success: false,
        message: 'Invalid email format'
      };
      return res.status(400).json(response);
    }

    // Validate password strength
    const passwordValidation = isValidPassword(password);
    if (!passwordValidation.valid) {
      const response: AuthResponse = {
        success: false,
        message: passwordValidation.message
      };
      return res.status(400).json(response);
    }

    // Validate names
    if (firstName.trim().length < 2 || lastName.trim().length < 2) {
      const response: AuthResponse = {
        success: false,
        message: 'First name and last name must be at least 2 characters long'
      };
      return res.status(400).json(response);
    }

    // Check if user already exists
    const existingUser = userService.getUserByEmail(email);
    if (existingUser) {
      const response: AuthResponse = {
        success: false,
        message: 'User with this email already exists'
      };
      return res.status(409).json(response);
    }

    // Register the user
    const newUser = await userService.registerUser({
      email: email.trim(),
      password,
      firstName: firstName.trim(),
      lastName: lastName.trim()
    });

    // Generate JWT token
    const token = generateToken(newUser.id, newUser.email);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = newUser;

    const response: AuthResponse = {
      success: true,
      message: 'User registered successfully',
      user: userWithoutPassword,
      token
    };

    return res.status(201).json(response);
  } catch (error) {
    console.error('Registration error:', error);
    
    const response: AuthResponse = {
      success: false,
      message: error instanceof Error ? error.message : 'Registration failed'
    };

    return res.status(500).json(response);
  }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password }: UserLoginData = req.body;

    // Validate input
    if (!email || !password) {
      const response: AuthResponse = {
        success: false,
        message: 'Email and password are required'
      };
      return res.status(400).json(response);
    }

    // Authenticate user
    const user = await userService.authenticateUser(email.trim(), password);
    
    if (!user) {
      const response: AuthResponse = {
        success: false,
        message: 'Invalid email or password'
      };
      return res.status(401).json(response);
    }

    // Generate JWT token
    const token = generateToken(user.id, user.email);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    const response: AuthResponse = {
      success: true,
      message: 'Login successful',
      user: userWithoutPassword,
      token
    };

    return res.json(response);
  } catch (error) {
    console.error('Login error:', error);
    
    const response: AuthResponse = {
      success: false,
      message: 'Login failed'
    };

    return res.status(500).json(response);
  }
});

/**
 * GET /api/auth/profile
 * Get user profile information
 */
router.get('/profile', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const user = await userService.getUserById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Profile retrieval error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile'
    });
  }
});

/**
 * POST /api/auth/verify
 * Verify JWT token
 */
router.post('/verify', authenticateToken, (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    return res.json({
      success: true,
      message: 'Token is valid',
      user: req.user
    });
  } catch (error) {
    console.error('Token verification error:', error);
    
    return res.status(401).json({
      success: false,
      message: 'Token verification failed'
    });
  }
});

/**
 * GET /api/auth/stats
 * Get authentication stats (for admin/monitoring)
 */
router.get('/stats', (req, res) => {
  try {
    const totalUsers = userService.getUsersCount();

    return res.json({
      success: true,
      stats: {
        totalUsers,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to get stats'
    });
  }
});

/**
 * GET /api/auth/debug
 * Debug endpoint to check user service state
 */
router.get('/debug', async (req, res) => {
  try {
    const totalUsers = userService.getUsersCount();
    const users = Array.from(userService['users'].keys());
    
    res.json({
      success: true,
      totalUsers,
      userIds: users,
      message: 'User service debug info'
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Debug endpoint failed'
    });
  }
});

/**
 * GET /api/auth/users-debug
 * Debug endpoint to check what users are loaded
 */
router.get('/users-debug', async (req, res) => {
  try {
    await userService['ensureInitialized']();
    const totalUsers = userService.getUsersCount();
    const userIds = Array.from(userService['users'].keys());
    const userEmails = Array.from(userService['usersByEmail'].keys());
    
    res.json({
      success: true,
      totalUsers,
      userIds,
      userEmails,
      message: 'User service debug info'
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Debug endpoint failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 