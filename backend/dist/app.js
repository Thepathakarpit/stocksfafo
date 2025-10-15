"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockApp = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class DataStore {
    constructor() {
        this.users = new Map();
        this.stocks = new Map();
        this.dataFile = path_1.default.join(__dirname, 'data', 'users.json');
        this.ensureDataDirectory();
        this.loadUsers();
        this.initializeStocks();
    }
    ensureDataDirectory() {
        try {
            const dataDir = path_1.default.dirname(this.dataFile);
            if (!fs_1.default.existsSync(dataDir)) {
                fs_1.default.mkdirSync(dataDir, { recursive: true });
                console.log('📁 Created data directory');
            }
        }
        catch (error) {
            console.error('⚠️ Could not create data directory:', error);
        }
    }
    loadUsers() {
        try {
            if (fs_1.default.existsSync(this.dataFile)) {
                const data = fs_1.default.readFileSync(this.dataFile, 'utf8');
                const usersArray = JSON.parse(data);
                usersArray.forEach((user) => {
                    this.users.set(user.email, user);
                });
                console.log(`✅ Loaded ${this.users.size} users`);
            }
        }
        catch (error) {
            console.log('📄 Starting with empty user database');
        }
    }
    saveUsers() {
        try {
            const usersArray = Array.from(this.users.values());
            fs_1.default.writeFileSync(this.dataFile, JSON.stringify(usersArray, null, 2));
        }
        catch (error) {
            console.error('❌ Failed to save users:', error);
        }
    }
    initializeStocks() {
        const stocksData = [
            { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', price: 2450 },
            { symbol: 'TCS', name: 'Tata Consultancy Services Ltd', price: 3890 },
            { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', price: 1650 },
            { symbol: 'INFY', name: 'Infosys Ltd', price: 1456 },
            { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', price: 987 },
            { symbol: 'HINDUNILVR', name: 'Hindustan Unilever Ltd', price: 2345 },
            { symbol: 'ITC', name: 'ITC Ltd', price: 445 },
            { symbol: 'SBIN', name: 'State Bank of India', price: 678 },
            { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd', price: 987 },
            { symbol: 'AXISBANK', name: 'Axis Bank Ltd', price: 876 },
        ];
        stocksData.forEach(stock => {
            this.stocks.set(stock.symbol, {
                ...stock,
                change: (Math.random() - 0.5) * 100,
                changePercent: (Math.random() - 0.5) * 5
            });
        });
        setInterval(() => {
            this.updateStockPrices();
        }, 5000);
    }
    updateStockPrices() {
        this.stocks.forEach((stock, symbol) => {
            const change = (Math.random() - 0.5) * 10;
            const newPrice = Math.max(stock.price + change, 1);
            const priceChange = newPrice - stock.price;
            const changePercent = (priceChange / stock.price) * 100;
            this.stocks.set(symbol, {
                ...stock,
                price: Math.round(newPrice * 100) / 100,
                change: Math.round(priceChange * 100) / 100,
                changePercent: Math.round(changePercent * 100) / 100
            });
        });
    }
    createUser(email, password, name) {
        const user = {
            id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            email,
            password,
            name,
            portfolio: {
                cash: 500000,
                stocks: [],
                transactions: []
            }
        };
        this.users.set(email, user);
        this.saveUsers();
        return user;
    }
    getUserByEmail(email) {
        return this.users.get(email) || null;
    }
    updateUser(user) {
        this.users.set(user.email, user);
        this.saveUsers();
    }
    getAllStocks() {
        return Array.from(this.stocks.values());
    }
    getStock(symbol) {
        return this.stocks.get(symbol) || null;
    }
}
class StockApp {
    constructor() {
        this.app = (0, express_1.default)();
        this.server = (0, http_1.createServer)(this.app);
        const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'];
        this.io = new socket_io_1.Server(this.server, {
            cors: { origin: allowedOrigins, credentials: true }
        });
        this.dataStore = new DataStore();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupWebSocket();
    }
    setupMiddleware() {
        this.app.use((0, helmet_1.default)({
            crossOriginEmbedderPolicy: false,
            contentSecurityPolicy: false
        }));
        const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'];
        this.app.use((0, cors_1.default)({
            origin: allowedOrigins,
            credentials: true
        }));
        this.app.use((0, compression_1.default)());
        this.app.use(express_1.default.json());
        this.app.use(express_1.default.urlencoded({ extended: true }));
        const frontendPath = path_1.default.join(__dirname, '../../frontend/build');
        if (fs_1.default.existsSync(frontendPath)) {
            this.app.use(express_1.default.static(frontendPath));
        }
    }
    setupRoutes() {
        this.app.get('/health', (req, res) => {
            res.json({ status: 'healthy', timestamp: new Date() });
        });
        this.app.post('/api/auth/register', (req, res) => {
            try {
                const { email, password, name } = req.body;
                if (!email || !password || !name) {
                    return res.status(400).json({ success: false, message: 'All fields required' });
                }
                if (this.dataStore.getUserByEmail(email)) {
                    return res.status(409).json({ success: false, message: 'User already exists' });
                }
                const user = this.dataStore.createUser(email, password, name);
                const { password: _, ...userWithoutPassword } = user;
                res.json({
                    success: true,
                    user: userWithoutPassword,
                    token: `token_${user.id}`,
                    message: 'Registration successful'
                });
            }
            catch (error) {
                res.status(500).json({ success: false, message: 'Registration failed' });
            }
        });
        this.app.post('/api/auth/login', (req, res) => {
            try {
                const { email, password } = req.body;
                if (!email || !password) {
                    return res.status(400).json({ success: false, message: 'Email and password required' });
                }
                const user = this.dataStore.getUserByEmail(email);
                if (!user || user.password !== password) {
                    return res.status(401).json({ success: false, message: 'Invalid credentials' });
                }
                const { password: _, ...userWithoutPassword } = user;
                res.json({
                    success: true,
                    user: userWithoutPassword,
                    token: `token_${user.id}`,
                    message: 'Login successful'
                });
            }
            catch (error) {
                res.status(500).json({ success: false, message: 'Login failed' });
            }
        });
        this.app.get('/api/stocks', (req, res) => {
            const stocks = this.dataStore.getAllStocks();
            res.json({ success: true, data: stocks });
        });
        this.app.get('/api/portfolio', this.authMiddleware.bind(this), (req, res) => {
            const user = this.dataStore.getUserByEmail(req.userEmail);
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            user.portfolio.stocks.forEach(holding => {
                const currentStock = this.dataStore.getStock(holding.symbol);
                if (currentStock) {
                    holding.currentPrice = currentStock.price;
                }
            });
            res.json({ success: true, portfolio: user.portfolio });
        });
        this.app.post('/api/portfolio/trade', this.authMiddleware.bind(this), (req, res) => {
            try {
                const { symbol, type, quantity, price } = req.body;
                const user = this.dataStore.getUserByEmail(req.userEmail);
                if (!user) {
                    return res.status(404).json({ success: false, message: 'User not found' });
                }
                const currentStock = this.dataStore.getStock(symbol);
                if (!currentStock) {
                    return res.status(404).json({ success: false, message: 'Stock not found' });
                }
                if (type === 'SELL' && typeof price === 'number' && price > currentStock.price) {
                    return res.status(400).json({
                        success: false,
                        message: `Sell price cannot exceed market price. Market: ₹${currentStock.price}, Requested: ₹${price}`
                    });
                }
                if (type === 'BUY') {
                    const totalCost = quantity * price;
                    if (user.portfolio.cash < totalCost) {
                        return res.status(400).json({ success: false, message: 'Insufficient funds' });
                    }
                    user.portfolio.cash -= totalCost;
                    const existingHolding = user.portfolio.stocks.find(s => s.symbol === symbol);
                    if (existingHolding) {
                        const totalQuantity = existingHolding.quantity + quantity;
                        const totalValue = (existingHolding.avgPrice * existingHolding.quantity) + totalCost;
                        existingHolding.avgPrice = totalValue / totalQuantity;
                        existingHolding.quantity = totalQuantity;
                        existingHolding.currentPrice = price;
                    }
                    else {
                        const stock = this.dataStore.getStock(symbol);
                        user.portfolio.stocks.push({
                            symbol,
                            name: stock?.name || symbol,
                            quantity,
                            avgPrice: price,
                            currentPrice: price
                        });
                    }
                }
                else {
                    const holding = user.portfolio.stocks.find(s => s.symbol === symbol);
                    if (!holding || holding.quantity < quantity) {
                        return res.status(400).json({ success: false, message: 'Insufficient stocks' });
                    }
                    user.portfolio.cash += quantity * price;
                    holding.quantity -= quantity;
                    if (holding.quantity === 0) {
                        user.portfolio.stocks = user.portfolio.stocks.filter(s => s.symbol !== symbol);
                    }
                }
                const transaction = {
                    id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    type,
                    symbol,
                    quantity,
                    price,
                    timestamp: new Date().toISOString()
                };
                user.portfolio.transactions.unshift(transaction);
                this.dataStore.updateUser(user);
                res.json({ success: true, message: `${type} order executed successfully`, transaction });
            }
            catch (error) {
                console.error('Trade error:', error);
                res.status(500).json({ success: false, message: 'Trade failed' });
            }
        });
        const frontendPath = path_1.default.join(__dirname, '../../frontend/build');
        if (fs_1.default.existsSync(frontendPath)) {
            this.app.get('*', (req, res) => {
                res.sendFile(path_1.default.join(frontendPath, 'index.html'));
            });
        }
    }
    authMiddleware(req, res, next) {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token || !token.startsWith('token_user_')) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const userId = token.replace('token_', '');
        const user = Array.from(this.dataStore['users'].values()).find(u => u.id === userId);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid token' });
        }
        req.userEmail = user.email;
        next();
    }
    setupWebSocket() {
        this.io.on('connection', (socket) => {
            console.log('Client connected:', socket.id);
            socket.emit('stocks-updated', this.dataStore.getAllStocks());
            const interval = setInterval(() => {
                socket.emit('stocks-updated', this.dataStore.getAllStocks());
            }, 5000);
            socket.on('disconnect', () => {
                clearInterval(interval);
                console.log('Client disconnected:', socket.id);
            });
        });
    }
    start(port = 5000) {
        this.server.listen(port, () => {
            console.log(`🚀 Server running on port ${port}`);
            console.log(`📊 Stock data service initialized`);
            console.log(`🔗 Frontend URL: http://localhost:3000`);
        });
    }
}
exports.StockApp = StockApp;
//# sourceMappingURL=app.js.map