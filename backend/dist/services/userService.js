"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const auth_1 = require("../utils/auth");
const USERS_FILE_PATH = path_1.default.join(__dirname, '../data/users.json');
const DEMO_STARTING_CASH = 500000;
class UserService {
    constructor() {
        this.users = new Map();
        this.usersByEmail = new Map();
        this.initialized = false;
        this.initializationPromise = this.initialize();
    }
    static getInstance() {
        if (!UserService.instance) {
            UserService.instance = new UserService();
        }
        return UserService.instance;
    }
    async initialize() {
        try {
            console.log('🚀 UserService: Initializing...');
            await this.loadUsers();
            this.initialized = true;
            console.log('✅ UserService: Initialization complete');
        }
        catch (error) {
            console.error('❌ UserService: Initialization failed:', error);
            this.initialized = true;
        }
    }
    async ensureInitialized() {
        if (!this.initialized) {
            console.log('⏳ UserService: Waiting for initialization...');
            await this.initializationPromise;
            console.log('✅ UserService: Initialization complete, proceeding...');
        }
    }
    async loadUsers() {
        try {
            console.log('📂 UserService: Attempting to load users from:', USERS_FILE_PATH);
            await promises_1.default.access(USERS_FILE_PATH);
            console.log('✅ UserService: Users file exists, reading...');
            const data = await promises_1.default.readFile(USERS_FILE_PATH, 'utf8');
            console.log('📄 UserService: File read successfully, data length:', data.length);
            console.log('📄 UserService: File content preview:', data.substring(0, 200) + '...');
            const usersArray = JSON.parse(data);
            console.log('📊 UserService: Parsed', usersArray.length, 'users from file');
            for (const user of usersArray) {
                console.log('👤 UserService: Loading user:', { id: user.id, email: user.email });
                this.users.set(user.id, user);
                this.usersByEmail.set(user.email.toLowerCase(), user);
            }
            console.log(`✅ UserService: Successfully loaded ${usersArray.length} users from storage`);
            console.log('📋 UserService: User IDs in memory:', Array.from(this.users.keys()));
            console.log('📧 UserService: User emails in memory:', Array.from(this.usersByEmail.keys()));
        }
        catch (error) {
            console.error('❌ UserService: Failed to load users:', error);
            console.log('📄 UserService: No existing users file found, starting fresh');
            await this.ensureDataDirectory();
        }
    }
    async ensureDataDirectory() {
        const dataDir = path_1.default.dirname(USERS_FILE_PATH);
        try {
            await promises_1.default.access(dataDir);
        }
        catch {
            await promises_1.default.mkdir(dataDir, { recursive: true });
        }
    }
    async saveUsers() {
        try {
            console.log('💾 UserService: Starting to save users to disk...');
            console.log('📊 UserService: Total users in memory:', this.users.size);
            console.log('📋 UserService: User IDs to save:', Array.from(this.users.keys()));
            await this.ensureDataDirectory();
            const usersArray = Array.from(this.users.values());
            console.log('💾 UserService: Writing users to file:', USERS_FILE_PATH);
            console.log('📄 UserService: Users data to write:', usersArray.map(u => ({ id: u.id, email: u.email })));
            await promises_1.default.writeFile(USERS_FILE_PATH, JSON.stringify(usersArray, null, 2));
            console.log('✅ UserService: Successfully saved users to disk');
        }
        catch (error) {
            console.error('❌ UserService: Failed to save users:', error);
            console.error('❌ UserService: Error details:', {
                name: error instanceof Error ? error.name : 'Unknown',
                message: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack?.split('\n')[0] : 'No stack trace'
            });
            throw new Error('Failed to save user data');
        }
    }
    createInitialPortfolio() {
        return {
            cash: DEMO_STARTING_CASH,
            totalValue: DEMO_STARTING_CASH,
            totalInvested: 0,
            stocks: [],
            transactions: []
        };
    }
    async registerUser(userData) {
        try {
            await this.ensureInitialized();
            console.log('👤 UserService: Starting user registration for:', userData.email);
            const emailLower = userData.email.toLowerCase();
            if (this.usersByEmail.has(emailLower)) {
                console.log('❌ UserService: User already exists:', emailLower);
                throw new Error('User with this email already exists');
            }
            const hashedPassword = await (0, auth_1.hashPassword)(userData.password);
            const userId = (0, auth_1.generateUserId)();
            console.log('🔑 UserService: Generated user ID:', userId);
            const newUser = {
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
        }
        catch (error) {
            console.error('❌ UserService: Registration failed:', error);
            throw error;
        }
    }
    async authenticateUser(email, password) {
        const user = this.usersByEmail.get(email.toLowerCase());
        if (!user) {
            return null;
        }
        const isValidPassword = await (0, auth_1.comparePassword)(password, user.password);
        return isValidPassword ? user : null;
    }
    async getUserById(userId) {
        await this.ensureInitialized();
        console.log('🔍 UserService: Looking for user with ID:', userId);
        console.log('📊 UserService: Total users in memory:', this.users.size);
        console.log('📋 UserService: Available user IDs:', Array.from(this.users.keys()));
        const user = this.users.get(userId) || null;
        console.log('✅ UserService: User found:', user ? { id: user.id, email: user.email } : 'null');
        return user;
    }
    getUserByEmail(email) {
        return this.usersByEmail.get(email.toLowerCase()) || null;
    }
    async updateUserPortfolio(userId, portfolio) {
        const user = this.users.get(userId);
        if (!user) {
            throw new Error('User not found');
        }
        user.portfolio = portfolio;
        await this.saveUsers();
    }
    async executeTrade(userId, symbol, name, quantity, price, type) {
        const user = this.users.get(userId);
        if (!user) {
            throw new Error('User not found');
        }
        const amount = quantity * price;
        const transaction = {
            id: (0, auth_1.generateTransactionId)(),
            type,
            symbol,
            name,
            quantity,
            price,
            amount,
            timestamp: new Date().toISOString()
        };
        if (type === 'BUY') {
            if (user.portfolio.cash < amount) {
                throw new Error('Insufficient funds');
            }
            user.portfolio.cash -= amount;
            user.portfolio.totalInvested += amount;
            const existingStock = user.portfolio.stocks.find(s => s.symbol === symbol);
            if (existingStock) {
                const totalQuantity = existingStock.quantity + quantity;
                const totalValue = (existingStock.quantity * existingStock.avgPrice) + amount;
                existingStock.avgPrice = totalValue / totalQuantity;
                existingStock.quantity = totalQuantity;
                existingStock.currentPrice = price;
                existingStock.value = totalQuantity * price;
                existingStock.gainLoss = existingStock.value - (totalQuantity * existingStock.avgPrice);
                existingStock.gainLossPercent = ((existingStock.value - (totalQuantity * existingStock.avgPrice)) / (totalQuantity * existingStock.avgPrice)) * 100;
            }
            else {
                const newStock = {
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
        }
        else {
            const existingStock = user.portfolio.stocks.find(s => s.symbol === symbol);
            if (!existingStock || existingStock.quantity < quantity) {
                throw new Error('Insufficient stocks to sell');
            }
            user.portfolio.cash += amount;
            existingStock.quantity -= quantity;
            existingStock.value = existingStock.quantity * existingStock.currentPrice;
            if (existingStock.quantity === 0) {
                user.portfolio.stocks = user.portfolio.stocks.filter(s => s.symbol !== symbol);
            }
            else {
                const avgCost = existingStock.quantity * existingStock.avgPrice;
                existingStock.gainLoss = existingStock.value - avgCost;
                existingStock.gainLossPercent = (existingStock.gainLoss / avgCost) * 100;
            }
        }
        user.portfolio.transactions.push(transaction);
        user.portfolio.totalValue = user.portfolio.cash +
            user.portfolio.stocks.reduce((total, stock) => total + stock.value, 0);
        await this.saveUsers();
        console.log(`✅ Executed ${type} trade: ${quantity} ${symbol} at ₹${price}`);
        return transaction;
    }
    async updateStockPrices(userId, stockPrices) {
        const user = this.users.get(userId);
        if (!user) {
            return;
        }
        let portfolioUpdated = false;
        for (const stock of user.portfolio.stocks) {
            if (stockPrices[stock.symbol] !== undefined && stockPrices[stock.symbol] !== stock.currentPrice) {
                stock.currentPrice = stockPrices[stock.symbol];
                stock.value = stock.quantity * stock.currentPrice;
                const avgCost = stock.quantity * stock.avgPrice;
                stock.gainLoss = stock.value - avgCost;
                stock.gainLossPercent = (stock.gainLoss / avgCost) * 100;
                portfolioUpdated = true;
            }
        }
        if (portfolioUpdated) {
            user.portfolio.totalValue = user.portfolio.cash +
                user.portfolio.stocks.reduce((total, stock) => total + stock.value, 0);
            await this.saveUsers();
        }
    }
    async updateAllUsersStockPrices(stockPrices) {
        try {
            let portfoliosUpdated = 0;
            for (const [userId, user] of this.users) {
                let userPortfolioUpdated = false;
                for (const stock of user.portfolio.stocks) {
                    if (stockPrices[stock.symbol] !== undefined && stockPrices[stock.symbol] !== stock.currentPrice) {
                        stock.currentPrice = stockPrices[stock.symbol];
                        stock.value = stock.quantity * stock.currentPrice;
                        const avgCost = stock.quantity * stock.avgPrice;
                        stock.gainLoss = stock.value - avgCost;
                        stock.gainLossPercent = (stock.gainLoss / avgCost) * 100;
                        userPortfolioUpdated = true;
                    }
                }
                if (userPortfolioUpdated) {
                    user.portfolio.totalValue = user.portfolio.cash +
                        user.portfolio.stocks.reduce((total, stock) => total + stock.value, 0);
                    portfoliosUpdated++;
                }
            }
            if (portfoliosUpdated > 0) {
                await this.saveUsers();
                console.log(`📊 Updated ${portfoliosUpdated} user portfolios with new stock prices`);
                return true;
            }
            return false;
        }
        catch (error) {
            console.error('❌ Error updating all users stock prices:', error);
            return false;
        }
    }
    getUsersCount() {
        return this.users.size;
    }
}
exports.UserService = UserService;
//# sourceMappingURL=userService.js.map