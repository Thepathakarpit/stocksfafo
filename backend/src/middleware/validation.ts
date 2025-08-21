import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { ValidationError } from './errorHandler';

// Validation result handler
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error) => error.msg);
    throw new ValidationError(errorMessages.join(', '));
  }
  next();
};

// Common validation rules
export const commonValidations = {
  // Email validation
  email: body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),

  // Password validation
  password: body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),

  // Name validation
  firstName: body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),

  lastName: body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),

  // Stock symbol validation
  stockSymbol: param('symbol')
    .isString()
    .trim()
    .isLength({ min: 1, max: 10 })
    .withMessage('Stock symbol must be between 1 and 10 characters')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Stock symbol can only contain uppercase letters and numbers'),

  // Pagination validation
  page: query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  limit: query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  // Search validation
  search: query('search')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters'),

  // Sort validation
  sort: query('sort')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort must be either "asc" or "desc"'),

  // Date validation
  date: body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid ISO 8601 date'),

  // Amount validation
  amount: body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number'),

  // Quantity validation
  quantity: body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
};

// Specific validation chains
export const authValidations = {
  register: [
    commonValidations.email,
    commonValidations.password,
    commonValidations.firstName,
    commonValidations.lastName,
    handleValidationErrors,
  ],

  login: [
    commonValidations.email,
    body('password').notEmpty().withMessage('Password is required'),
    handleValidationErrors,
  ],
};

export const stockValidations = {
  getStock: [
    commonValidations.stockSymbol,
    handleValidationErrors,
  ],

  searchStocks: [
    commonValidations.search,
    commonValidations.page,
    commonValidations.limit,
    handleValidationErrors,
  ],
};

export const portfolioValidations = {
  addStock: [
    commonValidations.stockSymbol,
    commonValidations.amount,
    commonValidations.quantity,
    handleValidationErrors,
  ],

  updateStock: [
    commonValidations.stockSymbol,
    commonValidations.amount.optional(),
    commonValidations.quantity.optional(),
    handleValidationErrors,
  ],

  removeStock: [
    commonValidations.stockSymbol,
    handleValidationErrors,
  ],
};

// Custom validation for stock list switching
export const stockListValidations = [
  body('listType')
    .isIn(['nifty50', 'sensex30', 'nifty500'])
    .withMessage('List type must be nifty50, sensex30, or nifty500'),
  body('customCount')
    .optional()
    .isInt({ min: 1, max: 500 })
    .withMessage('Custom count must be between 1 and 500'),
  handleValidationErrors,
]; 