import express, { Request } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import Redis from 'ioredis';

// Extend Request interface to include id
declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}

// Import configuration and utilities
import { config } from '@/config';
import logger from '@/utils/logger';
import { errorHandler, notFoundHandler } from '@/middleware/errorHandler';
import { formatResponseMiddleware } from '@/middleware/responseFormat';
import { stream } from '@/utils/logger';

// Import routes
import stocksRouter from '@/routes/stocks';
import authRouter from '@/routes/auth';
import portfolioRouter from '@/routes/portfolio';

// Import services
import ScalableStockDataService from '@/services/scalableStockDataService';
import { UserService } from '@/services/userService';

// Import stock data
import { STOCK_LIST_INFO } from '@/data/stockLists';

class App {
  public app: express.Application;
  public server: http.Server;
  public io: Server;
  public redis!: Redis;
  public userService!: UserService;
  public stockService!: ScalableStockDataService;

  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: config.frontendUrl,
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });
    
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
    this.initializeWebSocket();
  }

  private async initializeServices(): Promise<void> {
    try {
      // Initialize core services first so the app can run without external deps
      this.userService = UserService.getInstance();
      this.stockService = new ScalableStockDataService(this.io, this.userService);

      // Initialize Redis (optional)
      try {
        this.redis = new Redis(config.redis.url);
        this.redis.on('error', (error) => {
          logger.error('Redis connection error:', error);
        });
        this.redis.on('connect', () => {
          logger.info('Connected to Redis');
        });
      } catch (error) {
        logger.warn('Redis initialization failed, continuing without Redis:', error as any);
        // @ts-expect-error allow undefined redis in health checks
        this.redis = undefined;
      }

      // Initialize MongoDB (optional)
      try {
        await mongoose.connect(config.database.uri);
        logger.info('Connected to MongoDB');
      } catch (error) {
        logger.warn('MongoDB connection failed, continuing without MongoDB:', error as any);
      }

      // Attach services to app for use in routes
      this.app.set('io', this.io);
      this.app.set('stockService', this.stockService);
      this.app.set('userService', this.userService);
      this.app.set('redis', this.redis);

    } catch (error) {
      logger.error('Failed to initialize services (non-fatal):', error);
      // Continue running with whatever services initialized
    }
  }

  private initializeMiddleware(): void {
    // Security middleware
    if (config.security.helmetEnabled) {
      this.app.use(helmet());
    }

    // CORS
    this.app.use(cors({
      origin: config.security.corsOrigin,
      credentials: true,
    }));

    // Compression
    if (config.performance.compressionEnabled) {
      this.app.use(compression() as any);
    }

    // Request logging
    this.app.use(morgan('combined', { stream }));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Response formatting (pretty JSON or CLI)
    this.app.use(formatResponseMiddleware);

    // Request ID for tracking
    this.app.use((req, res, next) => {
      req.id = Math.random().toString(36).substring(7);
      next();
    });
  }

  private initializeRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      const redisStatus = (this.redis as any)?.status ?? 'disabled';
      const mongoStatus = mongoose.connection?.readyState === 1 ? 'connected' : 'disconnected';
      const activeStocks = this.stockService ? this.stockService.getActiveStockCount() : 0;

      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        activeStocks,
        redis: redisStatus,
        mongodb: mongoStatus,
      });
    });

    // API routes
    this.app.use('/api/stocks', stocksRouter);
    this.app.use('/api/auth', authRouter);
    this.app.use('/api/portfolio', portfolioRouter);

    // Stock list management
    this.app.get('/api/stock-lists', (req, res) => {
      res.json({
        success: true,
        data: STOCK_LIST_INFO,
        currentStats: this.stockService.getPerformanceStats(),
        activeStocks: this.stockService.getActiveStockCount(),
      });
    });

    // Performance metrics
    this.app.get('/api/performance', (req, res) => {
      res.json({
        success: true,
        data: this.stockService.getPerformanceStats(),
        activeStocks: this.stockService.getActiveStockCount(),
        timestamp: new Date(),
      });
    });

    // Root endpoint
    this.app.get('/', (req, res) => {
      const stats = this.stockService.getPerformanceStats();
      res.send(`
        <h1>🚀 Indian Stock Market Dashboard - Backend API</h1>
        <h2>📊 Current Status</h2>
        <ul>
          <li><strong>Active Stocks:</strong> ${stats.activeStocks}</li>
          <li><strong>Total Requests:</strong> ${stats.totalRequests}</li>
          <li><strong>Success Rate:</strong> ${stats.totalRequests > 0 ? ((stats.successfulRequests / stats.totalRequests) * 100).toFixed(2) : 0}%</li>
          <li><strong>Average Response Time:</strong> ${stats.averageResponseTime.toFixed(0)}ms</li>
        </ul>
        <h2>🔗 API Endpoints</h2>
        <ul>
          <li><code>GET /api/stocks</code> - Get all active stocks</li>
          <li><code>GET /api/stock-lists</code> - Get available stock lists info</li>
          <li><code>POST /api/switch-stock-list</code> - Switch stock list</li>
          <li><code>GET /api/performance</code> - Get performance metrics</li>
          <li><code>GET /health</code> - Health check</li>
        </ul>
        <h2>📡 WebSocket</h2>
        <p>Real-time updates: <code>ws://localhost:${config.port}</code></p>
        <p>Event: <code>stocks-updated</code></p>
      `);
    });
  }

  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);

    // Global error handler
    this.app.use(errorHandler);
  }

  private initializeWebSocket(): void {
    this.io.on('connection', (socket) => {
      logger.info('Client connected:', socket.id);

      socket.on('subscribe-stocks', (symbols: string[]) => {
        logger.info('Client subscribed to stocks:', symbols.length > 0 ? symbols : 'all');
        socket.join('stock-updates');
      });

      socket.on('switch-stock-list', (data: { listType: string; customCount?: number }) => {
        logger.info('Client requested stock list switch:', data);

        try {
          this.stockService.switchStockList(data.listType as any, data.customCount);
          socket.emit('stock-list-switched', {
            success: true,
            listType: data.listType,
            customCount: data.customCount,
            activeStocks: this.stockService.getActiveStockCount(),
          });
        } catch (error) {
          socket.emit('stock-list-switched', {
            success: false,
            error: 'Failed to switch stock list',
          });
        }
      });

      socket.on('get-performance-stats', () => {
        socket.emit('performance-stats', {
          stats: this.stockService.getPerformanceStats(),
          activeStocks: this.stockService.getActiveStockCount(),
          timestamp: new Date(),
        });
      });

      socket.on('disconnect', () => {
        logger.info('Client disconnected:', socket.id);
      });
    });
  }

  public async start(): Promise<void> {
    try {
      // Initialize services first
      await this.initializeServices();
      
      // Start stock service (non-fatal if it fails)
      try {
        await this.stockService.start(config.stockData.defaultList, config.stockData.defaultCount);
        logger.info('Stock data service started successfully');
      } catch (error) {
        logger.warn('Stock data service failed to start, continuing without it:', error as any);
      }

      // Start server
      this.server.listen(config.port, () => {
        logger.info(`🚀 Server running on port ${config.port}`);
        logger.info(`📊 Environment: ${config.env}`);
        logger.info(`🔗 Frontend URL: ${config.frontendUrl}`);
      });

    } catch (error) {
      logger.error('Failed to start application (non-fatal):', error);
      // Attempt to still start the HTTP server minimally
      this.server.listen(config.port, () => {
        logger.info(`🚀 Server running in degraded mode on port ${config.port}`);
      });
    }
  }

  public async stop(): Promise<void> {
    logger.info('🛑 Shutting down gracefully...');
    
    // Stop stock service
    this.stockService.stop();
    
    // Close Redis connection
    await this.redis.quit();
    
    // Close MongoDB connection
    await mongoose.connection.close();
    
    // Close server
    this.server.close(() => {
      logger.info('👋 Server closed');
      process.exit(0);
    });
  }
}

// Create and start application
const app = new App();

// Graceful shutdown
process.on('SIGINT', () => {
  app.stop();
});

process.on('SIGTERM', () => {
  app.stop();
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the application
app.start(); 