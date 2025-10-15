"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userService_1 = require("../services/userService");
const auth_1 = require("../utils/auth");
const auth_2 = require("../middleware/auth");
const router = express_1.default.Router();
const userService = userService_1.UserService.getInstance();
router.post('/register', async (req, res) => {
    try {
        console.log('🔐 Registration request received');
        console.log('📋 Request body:', JSON.stringify(req.body, null, 2));
        console.log('📋 Request headers:', req.headers);
        const { email, password, firstName, lastName } = req.body;
        console.log('🔍 Extracted fields:', {
            email: email ? `"${email}" (${typeof email})` : 'undefined',
            password: password ? `"${password.substring(0, 3)}..." (${typeof password})` : 'undefined',
            firstName: firstName ? `"${firstName}" (${typeof firstName})` : 'undefined',
            lastName: lastName ? `"${lastName}" (${typeof lastName})` : 'undefined'
        });
        if (!email || !password || !firstName || !lastName) {
            console.log('❌ Validation failed - missing fields:', {
                hasEmail: !!email,
                hasPassword: !!password,
                hasFirstName: !!firstName,
                hasLastName: !!lastName
            });
            const response = {
                success: false,
                message: 'All fields are required'
            };
            return res.status(400).json(response);
        }
        if (!(0, auth_1.isValidEmail)(email)) {
            const response = {
                success: false,
                message: 'Invalid email format'
            };
            return res.status(400).json(response);
        }
        const passwordValidation = (0, auth_1.isValidPassword)(password);
        if (!passwordValidation.valid) {
            const response = {
                success: false,
                message: passwordValidation.message
            };
            return res.status(400).json(response);
        }
        if (firstName.trim().length < 2 || lastName.trim().length < 2) {
            const response = {
                success: false,
                message: 'First name and last name must be at least 2 characters long'
            };
            return res.status(400).json(response);
        }
        const existingUser = userService.getUserByEmail(email);
        if (existingUser) {
            const response = {
                success: false,
                message: 'User with this email already exists'
            };
            return res.status(409).json(response);
        }
        const newUser = await userService.registerUser({
            email: email.trim(),
            password,
            firstName: firstName.trim(),
            lastName: lastName.trim()
        });
        const token = (0, auth_1.generateToken)(newUser.id, newUser.email);
        const { password: _, ...userWithoutPassword } = newUser;
        const response = {
            success: true,
            message: 'User registered successfully',
            user: userWithoutPassword,
            token
        };
        return res.status(201).json(response);
    }
    catch (error) {
        console.error('Registration error:', error);
        const response = {
            success: false,
            message: error instanceof Error ? error.message : 'Registration failed'
        };
        return res.status(500).json(response);
    }
});
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            const response = {
                success: false,
                message: 'Email and password are required'
            };
            return res.status(400).json(response);
        }
        const user = await userService.authenticateUser(email.trim(), password);
        if (!user) {
            const response = {
                success: false,
                message: 'Invalid email or password'
            };
            return res.status(401).json(response);
        }
        const token = (0, auth_1.generateToken)(user.id, user.email);
        const { password: _, ...userWithoutPassword } = user;
        const response = {
            success: true,
            message: 'Login successful',
            user: userWithoutPassword,
            token
        };
        return res.json(response);
    }
    catch (error) {
        console.error('Login error:', error);
        const response = {
            success: false,
            message: 'Login failed'
        };
        return res.status(500).json(response);
    }
});
router.get('/profile', auth_2.authenticateToken, async (req, res) => {
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
        const { password: _, ...userWithoutPassword } = user;
        res.json({
            success: true,
            user: userWithoutPassword
        });
    }
    catch (error) {
        console.error('Profile retrieval error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve profile'
        });
    }
});
router.post('/verify', auth_2.authenticateToken, (req, res) => {
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
    }
    catch (error) {
        console.error('Token verification error:', error);
        return res.status(401).json({
            success: false,
            message: 'Token verification failed'
        });
    }
});
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
    }
    catch (error) {
        console.error('Get stats error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get stats'
        });
    }
});
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
    }
    catch (error) {
        console.error('Debug endpoint error:', error);
        res.status(500).json({
            success: false,
            message: 'Debug endpoint failed'
        });
    }
});
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
    }
    catch (error) {
        console.error('Debug endpoint error:', error);
        res.status(500).json({
            success: false,
            message: 'Debug endpoint failed',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map