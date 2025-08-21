import fs from 'fs/promises';
import path from 'path';
import { User, Portfolio, UserRegistrationData, StockHolding, Transaction } from '../types/user';
import { generateUserId, generateTransactionId, hashPassword, comparePassword } from '../utils/auth';

const USERS_FILE_PATH = path.join(__dirname, '../data/users.json');
const DEMO_STARTING_CASH = 500000; // 5 Lakh INR

export class UserService {
  private users: Map<string, User> = new Map();
  private usersByEmail: Map<string, User> = new Map();
  private initialized: boolean = false;
  private initializationPromise: Promise<void>;
  private static instance: UserService;

  private constructor() {
    // Create the initialization promise immediately
    this.initializationPromise = this.initialize();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  /**
   * Initialize the user service
   */
  private async initialize(): Promise<void> {
    try {
      console.log('🚀 UserService: Initializing...');
      await this.loadUsers();
      this.initialized = true;
      console.log('✅ UserService: Initialization complete');
    } catch (error) {
      console.error('❌ UserService: Initialization failed:', error);
      // Continue with empty user maps
      this.initialized = true;
    }
  }

  /**
   * Wait for initialization to complete
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      console.log('⏳ UserService: Waiting for initialization...');
      await this.initializationPromise;
      console.log('✅ UserService: Initialization complete, proceeding...');
    }
  }

  /**
   * Load users from JSON file
   */
  private async loadUsers(): Promise<void> {
    try {
      console.log('📂 UserService: Attempting to load users from:', USERS_FILE_PATH);
      
      await fs.access(USERS_FILE_PATH);
      console.log('✅ UserService: Users file exists, reading...');
      
      const data = await fs.readFile(USERS_FILE_PATH, 'utf8');
      console.log('📄 UserService: File read successfully, data length:', data.length);
      console.log('📄 UserService: File content preview:', data.substring(0, 200) + '...');
      
      const usersArray: User[] = JSON.parse(data);
      console.log('📊 UserService: Parsed', usersArray.length, 'users from file');
      
      for (const user of usersArray) {
        console.log('👤 UserService: Loading user:', { id: user.id, email: user.email });
        this.users.set(user.id, user);
        this.usersByEmail.set(user.email.toLowerCase(), user);
      }
      
      console.log(`✅ UserService: Successfully loaded ${usersArray.length} users from storage`);
      console.log('📋 UserService: User IDs in memory:', Array.from(this.users.keys()));
      console.log('📧 UserService: User emails in memory:', Array.from(this.usersByEmail.keys()));
    } catch (error) {
      console.error('❌ UserService: Failed to load users:', error);
      console.log('📄 UserService: No existing users file found, starting fresh');
      await this.ensureDataDirectory();
    }
  }

  /**
   * Ensure data directory exists
   */
  private async ensureDataDirectory(): Promise<void> {
    const dataDir = path.dirname(USERS_FILE_PATH);
    try {
      await fs.access(dataDir);
    } catch {
      await fs.mkdir(dataDir, { recursive: true });
    }
  }

  /**
   * Save users to JSON file
   */
  private async saveUsers(): Promise<void> {
    try {
      console.log('💾 UserService: Starting to save users to disk...');
      console.log('📊 UserService: Total users in memory:', this.users.size);
      console.log('📋 UserService: User IDs to save:', Array.from(this.users.keys()));
      
      await this.ensureDataDirectory();
      const usersArray = Array.from(this.users.values());
      
      console.log('💾 UserService: Writing users to file:', USERS_FILE_PATH);
      console.log('📄 UserService: Users data to write:', usersArray.map(u => ({ id: u.id, email: u.email })));
      
      await fs.writeFile(USERS_FILE_PATH, JSON.stringify(usersArray, null, 2));
      
      console.log('✅ UserService: Successfully saved users to disk');
    } catch (error) {
      console.error('❌ UserService: Failed to save users:', error);
      console.error('❌ UserService: Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack?.split('\n')[0] : 'No stack trace'
      });
      throw new Error('Failed to save user data');
    }
  }

  /**
   * Create a new user portfolio with demo money
   */
  private createInitialPortfolio(): Portfolio {
    return {
      cash: DEMO_STARTING_CASH,
      totalValue: DEMO_STARTING_CASH,
      totalInvested: 0,
      stocks: [],
      transactions: []
    };
  }

  /**
   * Register a new user
   */
  async registerUser(userData: UserRegistrationData): Promise<User> {
    try {
      await this.ensureInitialized();
      
      console.log('👤 UserService: Starting user registration for:', userData.email);
      
    const emailLower = userData.email.toLowerCase();
    
    if (this.usersByEmail.has(emailLower)) {
        console.log('❌ UserService: User already exists:', emailLower);
      throw new Error('User with this email already exists');
    }

    const hashedPassword = await hashPassword(userData.password);
    const userId = generateUserId();
      
      console.log('🔑 UserService: Generated user ID:', userId);
    
    const newUser: User = {
      id: userId,
      email: emailLower,
      password: hashedPassword,
      firstName: userData.firstName,
      lastName: userData.lastName,
      createdAt: new Date().toISOString(),
      portfolio: this.createInitialPortfolio()
    };

      console.log('👤 UserService: Created user object:', { id: newUser.id, email: newUser.email });

    this.users.set(userId, newUser);
    this.usersByEmail.set(emailLower, newUser);
      
      console.log('💾 UserService: User added to memory maps, calling saveUsers...');
    
    await this.saveUsers();
    
      console.log(`✅ UserService: Successfully registered new user: ${emailLower} with ID: ${userId}`);
    return newUser;
    } catch (error) {
      console.error('❌ UserService: Registration failed:', error);
      throw error;
    }
  }

  /**
   * Authenticate user login
   */
  async authenticateUser(email: string, password: string): Promise<User | null> {
    const user = this.usersByEmail.get(email.toLowerCase());
    
    if (!user) {
      return null;
    }

    const isValidPassword = await comparePassword(password, user.password);
    return isValidPassword ? user : null;
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User | null> {
    await this.ensureInitialized();
    
    console.log('🔍 UserService: Looking for user with ID:', userId);
    console.log('📊 UserService: Total users in memory:', this.users.size);
    console.log('📋 UserService: Available user IDs:', Array.from(this.users.keys()));
    
    const user = this.users.get(userId) || null;
    console.log('✅ UserService: User found:', user ? { id: user.id, email: user.email } : 'null');
    
    return user;
  }

  /**
   * Get user by email
   */
  getUserByEmail(email: string): User | null {
    return this.usersByEmail.get(email.toLowerCase()) || null;
  }

  /**
   * Update user portfolio
   */
  async updateUserPortfolio(userId: string, portfolio: Portfolio): Promise<void> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.portfolio = portfolio;
    await this.saveUsers();
  }

  /**
   * Execute a trade (buy/sell stocks)
   */
  async executeTrade(
    userId: string, 
    symbol: string, 
    name: string,
    quantity: number, 
    price: number, 
    type: 'BUY' | 'SELL'
  ): Promise<Transaction> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const amount = quantity * price;
    const transaction: Transaction = {
      id: generateTransactionId(),
      type,
      symbol,
      name,
      quantity,
      price,
      amount,
      timestamp: new Date().toISOString()
    };

    if (type === 'BUY') {
      // Check if user has enough cash
      if (user.portfolio.cash < amount) {
        throw new Error('Insufficient funds');
      }

      // Deduct cash
      user.portfolio.cash -= amount;
      user.portfolio.totalInvested += amount;

      // Add or update stock holding
      const existingStock = user.portfolio.stocks.find(s => s.symbol === symbol);
      if (existingStock) {
        // Update average price
        const totalQuantity = existingStock.quantity + quantity;
        const totalValue = (existingStock.quantity * existingStock.avgPrice) + amount;
        existingStock.avgPrice = totalValue / totalQuantity;
        existingStock.quantity = totalQuantity;
        existingStock.currentPrice = price;
        existingStock.value = totalQuantity * price;
        existingStock.gainLoss = existingStock.value - (totalQuantity * existingStock.avgPrice);
        existingStock.gainLossPercent = ((existingStock.value - (totalQuantity * existingStock.avgPrice)) / (totalQuantity * existingStock.avgPrice)) * 100;
      } else {
        // Add new stock
        const newStock: StockHolding = {
          symbol,
          name,
          quantity,
          avgPrice: price,
          currentPrice: price,
          value: amount,
          gainLoss: 0,
          gainLossPercent: 0
        };
        user.portfolio.stocks.push(newStock);
      }
    } else { // SELL
      const existingStock = user.portfolio.stocks.find(s => s.symbol === symbol);
      if (!existingStock || existingStock.quantity < quantity) {
        throw new Error('Insufficient stocks to sell');
      }

      // Add cash
      user.portfolio.cash += amount;
      
      // Reduce stock quantity
      existingStock.quantity -= quantity;
      existingStock.value = existingStock.quantity * existingStock.currentPrice;
      
      if (existingStock.quantity === 0) {
        // Remove stock if quantity becomes 0
        user.portfolio.stocks = user.portfolio.stocks.filter(s => s.symbol !== symbol);
      } else {
        // Recalculate gain/loss
        const avgCost = existingStock.quantity * existingStock.avgPrice;
        existingStock.gainLoss = existingStock.value - avgCost;
        existingStock.gainLossPercent = (existingStock.gainLoss / avgCost) * 100;
      }
    }

    // Add transaction to history
    user.portfolio.transactions.push(transaction);

    // Update total portfolio value
    user.portfolio.totalValue = user.portfolio.cash + 
      user.portfolio.stocks.reduce((total, stock) => total + stock.value, 0);

    await this.saveUsers();
    
    console.log(`✅ Executed ${type} trade: ${quantity} ${symbol} at ₹${price}`);
    return transaction;
  }

  /**
   * Update stock prices for a user's portfolio
   */
  async updateStockPrices(userId: string, stockPrices: { [symbol: string]: number }): Promise<void> {
    const user = this.users.get(userId);
    if (!user) {
      return;
    }

    let portfolioUpdated = false;

    for (const stock of user.portfolio.stocks) {
      if (stockPrices[stock.symbol] !== undefined && stockPrices[stock.symbol] !== stock.currentPrice) {
        stock.currentPrice = stockPrices[stock.symbol]!;
        stock.value = stock.quantity * stock.currentPrice;
        
        const avgCost = stock.quantity * stock.avgPrice;
        stock.gainLoss = stock.value - avgCost;
        stock.gainLossPercent = (stock.gainLoss / avgCost) * 100;
        
        portfolioUpdated = true;
      }
    }

    if (portfolioUpdated) {
      // Update total portfolio value
      user.portfolio.totalValue = user.portfolio.cash + 
        user.portfolio.stocks.reduce((total, stock) => total + stock.value, 0);
      
      await this.saveUsers();
    }
  }

  /**
   * Update stock prices for all users' portfolios
   */
  async updateAllUsersStockPrices(stockPrices: { [symbol: string]: number }): Promise<boolean> {
    try {
      let portfoliosUpdated = 0;
      
      // Update each user's portfolio
      for (const [userId, user] of this.users) {
        let userPortfolioUpdated = false;
        
        for (const stock of user.portfolio.stocks) {
          if (stockPrices[stock.symbol] !== undefined && stockPrices[stock.symbol] !== stock.currentPrice) {
            stock.currentPrice = stockPrices[stock.symbol]!;
            stock.value = stock.quantity * stock.currentPrice;
            
            const avgCost = stock.quantity * stock.avgPrice;
            stock.gainLoss = stock.value - avgCost;
            stock.gainLossPercent = (stock.gainLoss / avgCost) * 100;
            
            userPortfolioUpdated = true;
          }
        }
        
        if (userPortfolioUpdated) {
          // Update total portfolio value
          user.portfolio.totalValue = user.portfolio.cash + 
            user.portfolio.stocks.reduce((total, stock) => total + stock.value, 0);
          
          portfoliosUpdated++;
        }
      }
      
      // Save all users if any portfolios were updated
      if (portfoliosUpdated > 0) {
        await this.saveUsers();
        console.log(`📊 Updated ${portfoliosUpdated} user portfolios with new stock prices`);
        return true;
      }
      
      return false;
      
    } catch (error) {
      console.error('❌ Error updating all users stock prices:', error);
      return false;
    }
  }

  /**
   * Get all users count (for admin purposes)
   */
  getUsersCount(): number {
    return this.users.size;
  }
} 