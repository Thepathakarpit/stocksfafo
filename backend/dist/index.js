"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const mongoose_1 = __importDefault(require("mongoose"));
const ioredis_1 = __importDefault(require("ioredis"));
const config_1 = require("@/config");
const logger_1 = __importDefault(require("@/utils/logger"));
const errorHandler_1 = require("@/middleware/errorHandler");
const responseFormat_1 = require("@/middleware/responseFormat");
const logger_2 = require("@/utils/logger");
const stocks_1 = __importDefault(require("@/routes/stocks"));
const auth_1 = __importDefault(require("@/routes/auth"));
const portfolio_1 = __importDefault(require("@/routes/portfolio"));
const scalableStockDataService_1 = __importDefault(require("@/services/scalableStockDataService"));
const userService_1 = require("@/services/userService");
const stockLists_1 = require("@/data/stockLists");
class App {
    constructor() {
        this.app = (0, express_1.default)();
        this.server = http_1.default.createServer(this.app);
        this.io = new socket_io_1.Server(this.server, {
            cors: {
                origin: config_1.config.frontendUrl,
                methods: ['GET', 'POST'],
                credentials: true,
            },
        });
        this.initializeMiddleware();
        this.initializeRoutes();
        this.initializeErrorHandling();
        this.initializeWebSocket();
    }
    async initializeServices() {
        try {
            this.userService = userService_1.UserService.getInstance();
            this.stockService = new scalableStockDataService_1.default(this.io, this.userService);
            try {
                this.redis = new ioredis_1.default(config_1.config.redis.url);
                this.redis.on('error', (error) => {
                    logger_1.default.error('Redis connection error:', error);
                });
                this.redis.on('connect', () => {
                    logger_1.default.info('Connected to Redis');
                });
            }
            catch (error) {
                logger_1.default.warn('Redis initialization failed, continuing without Redis:', error);
                this.redis = undefined;
            }
            try {
                await mongoose_1.default.connect(config_1.config.database.uri);
                logger_1.default.info('Connected to MongoDB');
            }
            catch (error) {
                logger_1.default.warn('MongoDB connection failed, continuing without MongoDB:', error);
            }
            this.app.set('io', this.io);
            this.app.set('stockService', this.stockService);
            this.app.set('userService', this.userService);
            this.app.set('redis', this.redis);
        }
        catch (error) {
            logger_1.default.error('Failed to initialize services (non-fatal):', error);
        }
    }
    initializeMiddleware() {
        if (config_1.config.security.helmetEnabled) {
            this.app.use((0, helmet_1.default)());
        }
        this.app.use((0, cors_1.default)({
            origin: config_1.config.security.corsOrigin,
            credentials: true,
        }));
        if (config_1.config.performance.compressionEnabled) {
            this.app.use((0, compression_1.default)());
        }
        this.app.use((0, morgan_1.default)('combined', { stream: logger_2.stream }));
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
        this.app.use(responseFormat_1.formatResponseMiddleware);
        this.app.use((req, res, next) => {
            req.id = Math.random().toString(36).substring(7);
            next();
        });
    }
    initializeRoutes() {
        this.app.get('/health', (req, res) => {
            const redisStatus = this.redis?.status ?? 'disabled';
            const mongoStatus = mongoose_1.default.connection?.readyState === 1 ? 'connected' : 'disconnected';
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
        this.app.use('/api/stocks', stocks_1.default);
        this.app.use('/api/auth', auth_1.default);
        this.app.use('/api/portfolio', portfolio_1.default);
        this.app.get('/api/stock-lists', (req, res) => {
            res.json({
                success: true,
                data: stockLists_1.STOCK_LIST_INFO,
                currentStats: this.stockService.getPerformanceStats(),
                activeStocks: this.stockService.getActiveStockCount(),
            });
        });
        this.app.get('/api/performance', (req, res) => {
            res.json({
                success: true,
                data: this.stockService.getPerformanceStats(),
                activeStocks: this.stockService.getActiveStockCount(),
                timestamp: new Date(),
            });
        });
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
        <p>Real-time updates: <code>ws://localhost:${config_1.config.port}</code></p>
        <p>Event: <code>stocks-updated</code></p>
      `);
        });
    }
    initializeErrorHandling() {
        this.app.use(errorHandler_1.notFoundHandler);
        this.app.use(errorHandler_1.errorHandler);
    }
    initializeWebSocket() {
        this.io.on('connection', (socket) => {
            logger_1.default.info('Client connected:', socket.id);
            socket.on('subscribe-stocks', (symbols) => {
                logger_1.default.info('Client subscribed to stocks:', symbols.length > 0 ? symbols : 'all');
                socket.join('stock-updates');
            });
            socket.on('switch-stock-list', (data) => {
                logger_1.default.info('Client requested stock list switch:', data);
                try {
                    this.stockService.switchStockList(data.listType, data.customCount);
                    socket.emit('stock-list-switched', {
                        success: true,
                        listType: data.listType,
                        customCount: data.customCount,
                        activeStocks: this.stockService.getActiveStockCount(),
                    });
                }
                catch (error) {
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
                logger_1.default.info('Client disconnected:', socket.id);
            });
        });
    }
    async start() {
        try {
            await this.initializeServices();
            try {
                await this.stockService.start(config_1.config.stockData.defaultList, config_1.config.stockData.defaultCount);
                logger_1.default.info('Stock data service started successfully');
            }
            catch (error) {
                logger_1.default.warn('Stock data service failed to start, continuing without it:', error);
            }
            this.server.listen(config_1.config.port, () => {
                logger_1.default.info(`🚀 Server running on port ${config_1.config.port}`);
                logger_1.default.info(`📊 Environment: ${config_1.config.env}`);
                logger_1.default.info(`🔗 Frontend URL: ${config_1.config.frontendUrl}`);
            });
        }
        catch (error) {
            logger_1.default.error('Failed to start application (non-fatal):', error);
            this.server.listen(config_1.config.port, () => {
                logger_1.default.info(`🚀 Server running in degraded mode on port ${config_1.config.port}`);
            });
        }
    }
    async stop() {
        logger_1.default.info('🛑 Shutting down gracefully...');
        this.stockService.stop();
        await this.redis.quit();
        await mongoose_1.default.connection.close();
        this.server.close(() => {
            logger_1.default.info('👋 Server closed');
            process.exit(0);
        });
    }
}
const app = new App();
process.on('SIGINT', () => {
    app.stop();
});
process.on('SIGTERM', () => {
    app.stop();
});
process.on('uncaughtException', (error) => {
    logger_1.default.error('Uncaught Exception:', error);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    logger_1.default.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
app.start();
//# sourceMappingURL=index.js.map