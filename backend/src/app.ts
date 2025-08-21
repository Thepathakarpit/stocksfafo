import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createServer } from 'http';
import { Server } from 'socket.io';
import fs from 'fs';
import path from 'path';

// Simple in-memory data store
interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  portfolio: Portfolio;
}

interface Portfolio {
  cash: number;
  stocks: StockHolding[];
  transactions: Transaction[];
}

interface StockHolding {
  symbol: string;
  name: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
}

interface Transaction {
  id: string;
  type: 'BUY' | 'SELL';
  symbol: string;
  quantity: number;
  price: number;
  timestamp: string;
}

interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

// Simple data store
class DataStore {
  private users: Map<string, User> = new Map();
  private stocks: Map<string, Stock> = new Map();
  private dataFile = path.join(__dirname, 'data', 'users.json');

  constructor() {
    this.loadUsers();
    this.initializeStocks();
  }

  private loadUsers() {
    try {
      if (fs.existsSync(this.dataFile)) {
        const data = fs.readFileSync(this.dataFile, 'utf8');
        const usersArray = JSON.parse(data);
        usersArray.forEach((user: User) => {
          this.users.set(user.email, user);
        });
        console.log(`✅ Loaded ${this.users.size} users`);
      }
    } catch (error) {
      console.log('📄 Starting with empty user database');
    }
  }

  private saveUsers() {
    try {
      const usersArray = Array.from(this.users.values());
      fs.writeFileSync(this.dataFile, JSON.stringify(usersArray, null, 2));
    } catch (error) {
      console.error('❌ Failed to save users:', error);
    }
  }

  private initializeStocks() {
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

    // Update stock prices every 5 seconds
    setInterval(() => {
      this.updateStockPrices();
    }, 5000);
  }

  private updateStockPrices() {
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

  // User methods
  createUser(email: string, password: string, name: string): User {
    const user: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email,
      password,
      name,
      portfolio: {
        cash: 500000, // 5 Lakh starting money
        stocks: [],
        transactions: []
      }
    };
    this.users.set(email, user);
    this.saveUsers();
    return user;
  }

  getUserByEmail(email: string): User | null {
    return this.users.get(email) || null;
  }

  updateUser(user: User) {
    this.users.set(user.email, user);
    this.saveUsers();
  }

  // Stock methods
  getAllStocks(): Stock[] {
    return Array.from(this.stocks.values());
  }

  getStock(symbol: string): Stock | null {
    return this.stocks.get(symbol) || null;
  }
}

// Simple app class
export class StockApp {
  private app: express.Application;
  private server: any;
  private io: Server;
  private dataStore: DataStore;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new Server(this.server, {
      cors: { origin: "http://localhost:3000", credentials: true }
    });
    this.dataStore = new DataStore();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
  }

  private setupMiddleware() {
    this.app.use(helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: false
    }));
    this.app.use(cors({
      origin: 'http://localhost:3000',
      credentials: true
    }));
    this.app.use(compression());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  private setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'healthy', timestamp: new Date() });
    });

    // Auth routes
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
      } catch (error) {
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
      } catch (error) {
        res.status(500).json({ success: false, message: 'Login failed' });
      }
    });

    // Stock routes
    this.app.get('/api/stocks', (req, res) => {
      const stocks = this.dataStore.getAllStocks();
      res.json({ success: true, data: stocks });
    });

    // Portfolio routes
    this.app.get('/api/portfolio', this.authMiddleware.bind(this), (req: any, res) => {
      const user = this.dataStore.getUserByEmail(req.userEmail);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      // Update current prices in portfolio
      user.portfolio.stocks.forEach(holding => {
        const currentStock = this.dataStore.getStock(holding.symbol);
        if (currentStock) {
          holding.currentPrice = currentStock.price;
        }
      });

      res.json({ success: true, portfolio: user.portfolio });
    });

    this.app.post('/api/portfolio/trade', this.authMiddleware.bind(this), (req: any, res) => {
      try {
        const { symbol, type, quantity, price } = req.body;
        const user = this.dataStore.getUserByEmail(req.userEmail);
        
        if (!user) {
          return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Validate requested price against current market for SELL
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
          } else {
            const stock = this.dataStore.getStock(symbol);
            user.portfolio.stocks.push({
              symbol,
              name: stock?.name || symbol,
              quantity,
              avgPrice: price,
              currentPrice: price
            });
          }
        } else { // SELL
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

        // Add transaction
        const transaction: Transaction = {
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
      } catch (error) {
        console.error('Trade error:', error);
        res.status(500).json({ success: false, message: 'Trade failed' });
      }
    });
  }

  private authMiddleware(req: any, res: any, next: any) {
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

  private setupWebSocket() {
    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      // Send initial stock data
      socket.emit('stocks-updated', this.dataStore.getAllStocks());

      // Send stock updates every 5 seconds
      const interval = setInterval(() => {
        socket.emit('stocks-updated', this.dataStore.getAllStocks());
      }, 5000);

      socket.on('disconnect', () => {
        clearInterval(interval);
        console.log('Client disconnected:', socket.id);
      });
    });
  }

  public start(port: number = 5000) {
    this.server.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`);
      console.log(`📊 Stock data service initialized`);
      console.log(`🔗 Frontend URL: http://localhost:3000`);
    });
  }
} 