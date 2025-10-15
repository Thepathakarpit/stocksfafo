"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});
app.use((0, cors_1.default)());
app.use(express_1.default.json());
let users = [];
let stocks = [
    { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', price: 2850.75, change: 23.45, changePercent: 0.83 },
    { symbol: 'TCS', name: 'Tata Consultancy Services', price: 3950.50, change: -12.30, changePercent: -0.31 },
    { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', price: 1678.90, change: 8.75, changePercent: 0.52 },
    { symbol: 'INFY', name: 'Infosys Ltd', price: 1456.25, change: 15.60, changePercent: 1.08 },
    { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', price: 1245.80, change: -5.40, changePercent: -0.43 },
    { symbol: 'HINDUNILVR', name: 'Hindustan Unilever Ltd', price: 2367.50, change: 18.90, changePercent: 0.80 },
    { symbol: 'ITC', name: 'ITC Ltd', price: 456.75, change: 3.25, changePercent: 0.72 },
    { symbol: 'SBIN', name: 'State Bank of India', price: 678.45, change: -2.15, changePercent: -0.32 },
    { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd', price: 1234.60, change: 21.40, changePercent: 1.76 },
    { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank', price: 1789.30, change: 12.85, changePercent: 0.72 }
];
const generateToken = () => Math.random().toString(36).substring(2) + Date.now().toString(36);
const tokens = {};
const DATA_DIR = path_1.default.join(__dirname, '../data');
const USERS_FILE = path_1.default.join(DATA_DIR, 'users.json');
const ensureDataDir = () => {
    if (!fs_1.default.existsSync(DATA_DIR)) {
        fs_1.default.mkdirSync(DATA_DIR, { recursive: true });
    }
};
const loadUsers = () => {
    ensureDataDir();
    try {
        if (fs_1.default.existsSync(USERS_FILE)) {
            const data = fs_1.default.readFileSync(USERS_FILE, 'utf8');
            users = JSON.parse(data);
            console.log(`✅ Loaded ${users.length} users`);
        }
        else {
            users = [];
            console.log('📄 No existing users file found, starting fresh');
        }
    }
    catch (error) {
        console.error('❌ Error loading users:', error);
        users = [];
    }
};
const saveUsers = () => {
    ensureDataDir();
    try {
        fs_1.default.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    }
    catch (error) {
        console.error('❌ Error saving users:', error);
    }
};
const updateStockPrices = () => {
    stocks.forEach(stock => {
        const changePercent = (Math.random() - 0.5) * 4;
        const change = stock.price * (changePercent / 100);
        stock.price = Math.round((stock.price + change) * 100) / 100;
        stock.change = Math.round(change * 100) / 100;
        stock.changePercent = Math.round(changePercent * 100) / 100;
    });
    io.emit('stockUpdate', stocks);
};
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }
    const token = authHeader.substring(7);
    const userId = tokens[token];
    if (!userId) {
        return res.status(401).json({ error: 'Invalid token' });
    }
    req.userId = userId;
    next();
};
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        users: users.length,
        stocks: stocks.length
    });
});
app.get('/api/stocks', (req, res) => {
    res.json({ success: true, data: stocks });
});
app.post('/api/auth/register', (req, res) => {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    if (users.find(u => u.email === email)) {
        return res.status(400).json({ error: 'User already exists' });
    }
    const user = {
        id: `user_${Date.now()}_${Math.random().toString(36).substring(2)}`,
        email,
        password,
        name,
        portfolio: {
            cash: 500000,
            stocks: [],
            transactions: []
        }
    };
    users.push(user);
    saveUsers();
    const token = generateToken();
    tokens[token] = user.id;
    res.json({
        success: true,
        message: 'User registered successfully',
        token,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            portfolio: user.portfolio
        }
    });
});
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Missing email or password' });
    }
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = generateToken();
    tokens[token] = user.id;
    res.json({
        success: true,
        token,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            portfolio: user.portfolio
        }
    });
});
app.get('/api/portfolio', authenticate, (req, res) => {
    const user = users.find(u => u.id === req.userId);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    user.portfolio.stocks.forEach(holding => {
        const stock = stocks.find(s => s.symbol === holding.symbol);
        if (stock) {
            holding.currentPrice = stock.price;
        }
    });
    const totalStockValue = user.portfolio.stocks.reduce((sum, holding) => sum + (holding.quantity * holding.currentPrice), 0);
    res.json({
        success: true,
        portfolio: user.portfolio,
        summary: {
            cash: user.portfolio.cash,
            stockValue: totalStockValue,
            totalValue: user.portfolio.cash + totalStockValue,
            totalPnL: (user.portfolio.cash + totalStockValue) - 500000
        }
    });
});
app.post('/api/portfolio/trade', authenticate, (req, res) => {
    const { symbol, type, quantity, price } = req.body;
    if (!symbol || !type || !quantity || quantity <= 0) {
        return res.status(400).json({ error: 'Invalid trade parameters' });
    }
    const user = users.find(u => u.id === req.userId);
    const stock = stocks.find(s => s.symbol === symbol);
    if (!user || !stock) {
        return res.status(404).json({ error: 'User or stock not found' });
    }
    if (type === 'SELL' && typeof price === 'number' && price > stock.price) {
        return res.status(400).json({
            success: false,
            message: `Sell price cannot exceed market price. Market: ₹${stock.price}, Requested: ₹${price}`
        });
    }
    const totalCost = stock.price * quantity;
    if (type === 'BUY') {
        if (user.portfolio.cash < totalCost) {
            return res.status(400).json({ error: 'Insufficient cash' });
        }
        user.portfolio.cash -= totalCost;
        const existingHolding = user.portfolio.stocks.find(h => h.symbol === symbol);
        if (existingHolding) {
            const totalQuantity = existingHolding.quantity + quantity;
            existingHolding.avgPrice = ((existingHolding.avgPrice * existingHolding.quantity) + totalCost) / totalQuantity;
            existingHolding.quantity = totalQuantity;
            existingHolding.currentPrice = stock.price;
        }
        else {
            user.portfolio.stocks.push({
                symbol,
                name: stock.name,
                quantity,
                avgPrice: stock.price,
                currentPrice: stock.price
            });
        }
    }
    else if (type === 'SELL') {
        const holding = user.portfolio.stocks.find(h => h.symbol === symbol);
        if (!holding || holding.quantity < quantity) {
            return res.status(400).json({ error: 'Insufficient stock quantity' });
        }
        user.portfolio.cash += totalCost;
        holding.quantity -= quantity;
        if (holding.quantity === 0) {
            user.portfolio.stocks = user.portfolio.stocks.filter(h => h.symbol !== symbol);
        }
    }
    const transaction = {
        id: `txn_${Date.now()}_${Math.random().toString(36).substring(2)}`,
        type: type,
        symbol,
        quantity,
        price: stock.price,
        timestamp: new Date().toISOString()
    };
    user.portfolio.transactions.push(transaction);
    saveUsers();
    res.json({
        success: true,
        message: `${type} order executed successfully`,
        transaction
    });
});
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    socket.emit('stockUpdate', stocks);
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});
loadUsers();
setInterval(updateStockPrices, 5000);
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Stock data service initialized`);
    console.log(`🔗 Frontend URL: http://localhost:3000`);
});
//# sourceMappingURL=simple-server.js.map