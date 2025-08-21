# 🛠️ Development Guide

This guide provides comprehensive information for developers working on the StockSFAFO project, including coding standards, best practices, and contribution guidelines.

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [API Development](#api-development)
- [Frontend Development](#frontend-development)
- [Database Guidelines](#database-guidelines)
- [Security Best Practices](#security-best-practices)
- [Performance Optimization](#performance-optimization)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm 9+
- Docker & Docker Compose
- Git
- VS Code (recommended)

### Development Environment Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/stocksfafo.git
   cd stocksfafo
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   ```bash
   # Backend
   cp backend/env.example backend/.env
   # Edit backend/.env with your configuration
   
   # Frontend
   cp frontend/.env.example frontend/.env
   # Edit frontend/.env with your configuration
   ```

4. **Start development services**
   ```bash
   # Using Docker (recommended)
   docker-compose up -d mongodb redis
   
   # Or install locally
   # MongoDB: https://docs.mongodb.com/manual/installation/
   # Redis: https://redis.io/download
   ```

5. **Start the application**
   ```bash
   npm run dev
   ```

## 🏗️ Project Structure

### Backend Structure
```
backend/
├── src/
│   ├── config/          # Configuration management
│   │   └── index.ts     # Main config with validation
│   ├── middleware/      # Express middleware
│   │   ├── auth.ts      # Authentication middleware
│   │   ├── errorHandler.ts # Error handling
│   │   └── validation.ts # Input validation
│   ├── routes/          # API routes
│   │   ├── auth.ts      # Authentication routes
│   │   ├── stocks.ts    # Stock data routes
│   │   └── portfolio.ts # Portfolio routes
│   ├── services/        # Business logic
│   │   ├── userService.ts
│   │   └── stockDataService.ts
│   ├── types/           # TypeScript definitions
│   ├── utils/           # Utility functions
│   └── index.ts         # Server entry point
├── tests/               # Test files
├── Dockerfile           # Container configuration
└── package.json         # Dependencies and scripts
```

### Frontend Structure
```
frontend/
├── src/
│   ├── components/      # React components
│   │   ├── auth/        # Authentication components
│   │   ├── stocks/      # Stock-related components
│   │   └── common/      # Shared components
│   ├── hooks/           # Custom React hooks
│   ├── pages/           # Page components
│   ├── services/        # API services
│   ├── types/           # TypeScript definitions
│   ├── utils/           # Utility functions
│   └── App.tsx          # Main app component
├── tests/               # Test files
├── Dockerfile           # Container configuration
└── package.json         # Dependencies and scripts
```

## 📝 Coding Standards

### TypeScript Guidelines

1. **Strict Mode**: Always use TypeScript strict mode
2. **Type Definitions**: Define interfaces for all data structures
3. **No Any**: Avoid using `any` type, use `unknown` or proper types
4. **Null Safety**: Use optional chaining and nullish coalescing

```typescript
// ✅ Good
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
}

const getUser = async (id: string): Promise<User | null> => {
  // Implementation
};

// ❌ Bad
const getUser = async (id: any): Promise<any> => {
  // Implementation
};
```

### Naming Conventions

1. **Files**: Use kebab-case for file names
2. **Components**: Use PascalCase for React components
3. **Functions**: Use camelCase for functions and variables
4. **Constants**: Use UPPER_SNAKE_CASE for constants
5. **Interfaces**: Use PascalCase with descriptive names

```typescript
// ✅ Good
// user-service.ts
interface UserProfile {
  userId: string;
  displayName: string;
}

const MAX_RETRY_ATTEMPTS = 3;

// ❌ Bad
// userService.ts
interface user {
  user_id: string;
  display_name: string;
}

const maxRetryAttempts = 3;
```

### Code Organization

1. **Single Responsibility**: Each function/class should have one purpose
2. **Separation of Concerns**: Keep business logic separate from UI
3. **Dependency Injection**: Use dependency injection for services
4. **Error Handling**: Always handle errors appropriately

```typescript
// ✅ Good - Single Responsibility
class StockDataService {
  async fetchStockData(symbol: string): Promise<Stock> {
    // Only handles stock data fetching
  }
}

class PortfolioService {
  async calculatePortfolioValue(portfolio: Portfolio): Promise<number> {
    // Only handles portfolio calculations
  }
}

// ❌ Bad - Multiple Responsibilities
class StockService {
  async fetchStockData(symbol: string): Promise<Stock> {
    // Fetches stock data
  }
  
  async calculatePortfolioValue(portfolio: Portfolio): Promise<number> {
    // Also calculates portfolio value
  }
  
  async sendEmail(user: User): Promise<void> {
    // Also sends emails
  }
}
```

## 🧪 Testing Guidelines

### Backend Testing

1. **Unit Tests**: Test individual functions and methods
2. **Integration Tests**: Test API endpoints and database operations
3. **Test Coverage**: Aim for 80%+ code coverage
4. **Mocking**: Mock external dependencies

```typescript
// Example unit test
describe('UserService', () => {
  describe('authenticateUser', () => {
    it('should authenticate valid user credentials', async () => {
      const userService = new UserService();
      const result = await userService.authenticateUser('test@example.com', 'password123');
      
      expect(result).toBeDefined();
      expect(result.email).toBe('test@example.com');
    });

    it('should return null for invalid credentials', async () => {
      const userService = new UserService();
      const result = await userService.authenticateUser('test@example.com', 'wrongpassword');
      
      expect(result).toBeNull();
    });
  });
});
```

### Frontend Testing

1. **Component Tests**: Test React components in isolation
2. **Hook Tests**: Test custom hooks separately
3. **Integration Tests**: Test user interactions
4. **Accessibility Tests**: Ensure components are accessible

```typescript
// Example component test
import { render, screen, fireEvent } from '@testing-library/react';
import { LoginForm } from '../LoginForm';

describe('LoginForm', () => {
  it('should render login form', () => {
    render(<LoginForm onLogin={jest.fn()} />);
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('should call onLogin with form data', () => {
    const mockOnLogin = jest.fn();
    render(<LoginForm onLogin={mockOnLogin} />);
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    
    expect(mockOnLogin).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });
});
```

## 🔌 API Development

### RESTful API Design

1. **HTTP Methods**: Use appropriate HTTP methods (GET, POST, PUT, DELETE)
2. **Status Codes**: Return proper HTTP status codes
3. **Response Format**: Use consistent JSON response format
4. **Error Handling**: Provide meaningful error messages

```typescript
// Example API endpoint
router.get('/api/stocks/:symbol', async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const stock = await stockService.getStock(symbol);
    
    if (!stock) {
      return res.status(404).json({
        success: false,
        message: 'Stock not found',
        error: 'STOCK_NOT_FOUND'
      });
    }
    
    res.json({
      success: true,
      data: stock
    });
  } catch (error) {
    next(error);
  }
});
```

### API Documentation

1. **OpenAPI/Swagger**: Document all API endpoints
2. **Request/Response Examples**: Provide clear examples
3. **Error Codes**: Document all possible error responses
4. **Authentication**: Document authentication requirements

## 🎨 Frontend Development

### React Best Practices

1. **Functional Components**: Use functional components with hooks
2. **Custom Hooks**: Extract reusable logic into custom hooks
3. **State Management**: Use appropriate state management (Zustand for simple state)
4. **Performance**: Use React.memo, useCallback, useMemo when needed

```typescript
// Example custom hook
export const useStockData = (symbol: string) => {
  const [stock, setStock] = useState<Stock | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStock = async () => {
      try {
        setLoading(true);
        const data = await stockService.getStock(symbol);
        setStock(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch stock');
      } finally {
        setLoading(false);
      }
    };

    fetchStock();
  }, [symbol]);

  return { stock, loading, error };
};
```

### Component Structure

1. **Props Interface**: Define props interface for each component
2. **Default Props**: Use default props when appropriate
3. **Children**: Use React.ReactNode for flexible children
4. **Event Handlers**: Use proper event handler types

```typescript
interface StockCardProps {
  stock: Stock;
  onSelect?: (stock: Stock) => void;
  className?: string;
  children?: React.ReactNode;
}

export const StockCard: React.FC<StockCardProps> = ({
  stock,
  onSelect,
  className = '',
  children
}) => {
  const handleClick = useCallback(() => {
    onSelect?.(stock);
  }, [stock, onSelect]);

  return (
    <Card className={className} onClick={handleClick}>
      <CardContent>
        <Typography variant="h6">{stock.symbol}</Typography>
        <Typography variant="body2">{stock.name}</Typography>
        <Typography variant="h5" color="primary">
          ₹{stock.price.toFixed(2)}
        </Typography>
        {children}
      </CardContent>
    </Card>
  );
};
```

## 🗄️ Database Guidelines

### MongoDB Best Practices

1. **Indexing**: Create indexes for frequently queried fields
2. **Schema Design**: Design schemas for optimal query performance
3. **Data Validation**: Use Mongoose schemas for validation
4. **Connection Management**: Properly manage database connections

```typescript
// Example Mongoose schema
const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
      message: 'Invalid email format'
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create indexes
userSchema.index({ email: 1 });
userSchema.index({ createdAt: -1 });
```

### Redis Best Practices

1. **Key Naming**: Use consistent key naming conventions
2. **TTL**: Set appropriate TTL for cached data
3. **Serialization**: Use JSON for complex data structures
4. **Error Handling**: Handle Redis connection errors

```typescript
// Example Redis usage
class CacheService {
  constructor(private redis: Redis) {}

  async getStock(symbol: string): Promise<Stock | null> {
    try {
      const cached = await this.redis.get(`stock:${symbol}`);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      logger.error('Redis get error:', error);
      return null;
    }
  }

  async setStock(symbol: string, stock: Stock, ttl = 300): Promise<void> {
    try {
      await this.redis.setex(`stock:${symbol}`, ttl, JSON.stringify(stock));
    } catch (error) {
      logger.error('Redis set error:', error);
    }
  }
}
```

## 🔒 Security Best Practices

### Authentication & Authorization

1. **JWT Tokens**: Use secure JWT tokens with proper expiration
2. **Password Hashing**: Use bcrypt for password hashing
3. **Rate Limiting**: Implement rate limiting for API endpoints
4. **Input Validation**: Validate all user inputs

```typescript
// Example authentication middleware
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AuthenticationError('Access token is required');
    }

    const token = authHeader.slice(7);
    const decoded = verifyToken(token);
    req.user = decoded;
    
    next();
  } catch (error) {
    next(new AuthenticationError('Invalid access token'));
  }
};
```

### Data Validation

1. **Zod Schemas**: Use Zod for runtime validation
2. **Sanitization**: Sanitize user inputs
3. **SQL Injection**: Use parameterized queries
4. **XSS Protection**: Sanitize output data

```typescript
// Example validation schema
const createUserSchema = z.object({
  email: z.string().email().min(1).max(255),
  password: z.string().min(8).max(100),
  firstName: z.string().min(1).max(50).regex(/^[a-zA-Z\s]+$/),
  lastName: z.string().min(1).max(50).regex(/^[a-zA-Z\s]+$/)
});

router.post('/api/auth/register', async (req, res, next) => {
  try {
    const validatedData = createUserSchema.parse(req.body);
    // Process validated data
  } catch (error) {
    next(new ValidationError('Invalid input data'));
  }
});
```

## ⚡ Performance Optimization

### Backend Optimization

1. **Caching**: Implement Redis caching for frequently accessed data
2. **Database Queries**: Optimize database queries with proper indexing
3. **Compression**: Enable gzip compression
4. **Connection Pooling**: Use connection pooling for database connections

### Frontend Optimization

1. **Code Splitting**: Use React.lazy for code splitting
2. **Memoization**: Use React.memo, useCallback, useMemo
3. **Bundle Optimization**: Optimize bundle size
4. **Image Optimization**: Optimize images and use lazy loading

```typescript
// Example code splitting
const StockChart = React.lazy(() => import('./StockChart'));
const PortfolioView = React.lazy(() => import('./PortfolioView'));

// Example memoization
const StockList = React.memo(({ stocks, onSelect }: StockListProps) => {
  const handleSelect = useCallback((stock: Stock) => {
    onSelect(stock);
  }, [onSelect]);

  return (
    <div>
      {stocks.map(stock => (
        <StockCard key={stock.symbol} stock={stock} onSelect={handleSelect} />
      ))}
    </div>
  );
});
```

## 🚀 Deployment

### Environment Configuration

1. **Environment Variables**: Use environment variables for configuration
2. **Secrets Management**: Use secure secrets management
3. **Health Checks**: Implement health check endpoints
4. **Monitoring**: Set up application monitoring

### Docker Best Practices

1. **Multi-stage Builds**: Use multi-stage builds for smaller images
2. **Security**: Run containers as non-root users
3. **Resource Limits**: Set appropriate resource limits
4. **Health Checks**: Include health checks in Docker images

## 🔧 Troubleshooting

### Common Issues

1. **TypeScript Errors**: Check type definitions and imports
2. **Database Connection**: Verify database connection settings
3. **CORS Issues**: Check CORS configuration
4. **Build Errors**: Clear node_modules and reinstall dependencies

### Debug Mode

Enable debug logging:
```bash
# Backend
NODE_ENV=development DEBUG=* npm run dev

# Frontend
REACT_APP_DEBUG=true npm start
```

### Logs

Check application logs:
```bash
# Docker logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Application logs
tail -f logs/combined.log
tail -f logs/error.log
```

## 📚 Additional Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [MongoDB Best Practices](https://docs.mongodb.com/manual/data-modeling/)
- [Redis Documentation](https://redis.io/documentation)

---

**Remember**: Always follow the established coding standards and best practices. When in doubt, refer to this guide or ask the team for clarification. 