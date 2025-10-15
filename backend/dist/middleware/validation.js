"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stockListValidations = exports.portfolioValidations = exports.stockValidations = exports.authValidations = exports.commonValidations = exports.handleValidationErrors = void 0;
const express_validator_1 = require("express-validator");
const errorHandler_1 = require("./errorHandler");
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map((error) => error.msg);
        throw new errorHandler_1.ValidationError(errorMessages.join(', '));
    }
    next();
};
exports.handleValidationErrors = handleValidationErrors;
exports.commonValidations = {
    email: (0, express_validator_1.body)('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    password: (0, express_validator_1.body)('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    firstName: (0, express_validator_1.body)('firstName')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('First name must be between 2 and 50 characters')
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('First name can only contain letters and spaces'),
    lastName: (0, express_validator_1.body)('lastName')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Last name must be between 2 and 50 characters')
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('Last name can only contain letters and spaces'),
    stockSymbol: (0, express_validator_1.param)('symbol')
        .isString()
        .trim()
        .isLength({ min: 1, max: 10 })
        .withMessage('Stock symbol must be between 1 and 10 characters')
        .matches(/^[A-Z0-9]+$/)
        .withMessage('Stock symbol can only contain uppercase letters and numbers'),
    page: (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    limit: (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    search: (0, express_validator_1.query)('search')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Search term must be between 1 and 100 characters'),
    sort: (0, express_validator_1.query)('sort')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('Sort must be either "asc" or "desc"'),
    date: (0, express_validator_1.body)('date')
        .optional()
        .isISO8601()
        .withMessage('Date must be a valid ISO 8601 date'),
    amount: (0, express_validator_1.body)('amount')
        .isFloat({ min: 0.01 })
        .withMessage('Amount must be a positive number'),
    quantity: (0, express_validator_1.body)('quantity')
        .isInt({ min: 1 })
        .withMessage('Quantity must be a positive integer'),
};
exports.authValidations = {
    register: [
        exports.commonValidations.email,
        exports.commonValidations.password,
        exports.commonValidations.firstName,
        exports.commonValidations.lastName,
        exports.handleValidationErrors,
    ],
    login: [
        exports.commonValidations.email,
        (0, express_validator_1.body)('password').notEmpty().withMessage('Password is required'),
        exports.handleValidationErrors,
    ],
};
exports.stockValidations = {
    getStock: [
        exports.commonValidations.stockSymbol,
        exports.handleValidationErrors,
    ],
    searchStocks: [
        exports.commonValidations.search,
        exports.commonValidations.page,
        exports.commonValidations.limit,
        exports.handleValidationErrors,
    ],
};
exports.portfolioValidations = {
    addStock: [
        exports.commonValidations.stockSymbol,
        exports.commonValidations.amount,
        exports.commonValidations.quantity,
        exports.handleValidationErrors,
    ],
    updateStock: [
        exports.commonValidations.stockSymbol,
        exports.commonValidations.amount.optional(),
        exports.commonValidations.quantity.optional(),
        exports.handleValidationErrors,
    ],
    removeStock: [
        exports.commonValidations.stockSymbol,
        exports.handleValidationErrors,
    ],
};
exports.stockListValidations = [
    (0, express_validator_1.body)('listType')
        .isIn(['nifty50', 'sensex30', 'nifty500'])
        .withMessage('List type must be nifty50, sensex30, or nifty500'),
    (0, express_validator_1.body)('customCount')
        .optional()
        .isInt({ min: 1, max: 500 })
        .withMessage('Custom count must be between 1 and 500'),
    exports.handleValidationErrors,
];
//# sourceMappingURL=validation.js.map