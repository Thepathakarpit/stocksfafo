const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Simple data storage
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

// Simple token for demo
const generateToken = () => Math.random().toString(36).substring(2) + Date.now().toString(36);
const tokens = {}; // token -> userId

// Data persistence helpers
const DATA_DIR = path.join(__dirname, '../data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

const ensureDataDir = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
};

const loadUsers = () => {
  ensureDataDir();
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf8');
      users = JSON.parse(data);
      console.log(`✅ Loaded ${users.length} users`);
    } else {
      users = [];
      console.log('📄 No existing users file found, starting fresh');
    }
  } catch (error) {
    console.error('❌ Error loading users:', error);
    users = [];
  }
};

const saveUsers = () => {
  ensureDataDir();
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('❌ Error saving users:', error);
  }
};

// Stock price simulation
const updateStockPrices = () => {
  stocks.forEach(stock => {
    const changePercent = (Math.random() - 0.5) * 4; // -2% to +2%
    const change = stock.price * (changePercent / 100);
    stock.price = Math.round((stock.price + change) * 100) / 100;
    stock.change = Math.round(change * 100) / 100;
    stock.changePercent = Math.round(changePercent * 100) / 100;
  });
  
  // Emit to all connected clients
  io.emit('stockUpdate', stocks);
};

// Authentication middleware
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

// Routes
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
  
  // Check if user already exists
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'User already exists' });
  }
  
  const user = {
    id: `user_${Date.now()}_${Math.random().toString(36).substring(2)}`,
    email,
    password, // In production, hash this
    name,
    portfolio: {
      cash: 500000, // ₹5 lakh demo money
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
  
  // Update current prices in portfolio
  user.portfolio.stocks.forEach(holding => {
    const stock = stocks.find(s => s.symbol === holding.symbol);
    if (stock) {
      holding.currentPrice = stock.price;
    }
  });
  
  const totalStockValue = user.portfolio.stocks.reduce((sum, holding) => 
    sum + (holding.quantity * holding.currentPrice), 0
  );
  
  res.json({
    success: true,
    portfolio: user.portfolio,
    summary: {
      cash: user.portfolio.cash,
      stockValue: totalStockValue,
      totalValue: user.portfolio.cash + totalStockValue,
      totalPnL: (user.portfolio.cash + totalStockValue) - 500000 // vs initial 5L
    }
  });
});

app.post('/api/portfolio/trade', authenticate, (req, res) => {
  const { symbol, type, quantity } = req.body;
  
  if (!symbol || !type || !quantity || quantity <= 0) {
    return res.status(400).json({ error: 'Invalid trade parameters' });
  }
  
  const user = users.find(u => u.id === req.userId);
  const stock = stocks.find(s => s.symbol === symbol);
  
  if (!user || !stock) {
    return res.status(404).json({ error: 'User or stock not found' });
  }
  
  const totalCost = stock.price * quantity;
  
  if (type === 'BUY') {
    if (user.portfolio.cash < totalCost) {
      return res.status(400).json({ error: 'Insufficient cash' });
    }
    
    user.portfolio.cash -= totalCost;
    
    // Add to holdings
    const existingHolding = user.portfolio.stocks.find(h => h.symbol === symbol);
    if (existingHolding) {
      const totalQuantity = existingHolding.quantity + quantity;
      existingHolding.avgPrice = ((existingHolding.avgPrice * existingHolding.quantity) + totalCost) / totalQuantity;
      existingHolding.quantity = totalQuantity;
      existingHolding.currentPrice = stock.price;
    } else {
      user.portfolio.stocks.push({
        symbol,
        name: stock.name,
        quantity,
        avgPrice: stock.price,
        currentPrice: stock.price
      });
    }
  } else if (type === 'SELL') {
    const holding = user.portfolio.stocks.find(h => h.symbol === symbol);
    if (!holding || holding.quantity < quantity) {
      return res.status(400).json({ error: 'Insufficient stock quantity' });
    }
    
    user.portfolio.cash += totalCost;
    holding.quantity -= quantity;
    
    // Remove holding if quantity becomes 0
    if (holding.quantity === 0) {
      user.portfolio.stocks = user.portfolio.stocks.filter(h => h.symbol !== symbol);
    }
  }
  
  // Add transaction
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

// WebSocket connections
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Send current stock data immediately
  socket.emit('stockUpdate', stocks);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Initialize
loadUsers();

// Start stock price updates
setInterval(updateStockPrices, 5000); // Update every 5 seconds

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Stock data service initialized`);
  console.log(`🔗 Frontend URL: http://localhost:3000`);
}); 