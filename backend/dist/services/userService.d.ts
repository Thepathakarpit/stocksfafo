import { User, Portfolio, UserRegistrationData, Transaction } from '../types/user';
export declare class UserService {
    private users;
    private usersByEmail;
    private initialized;
    private initializationPromise;
    private static instance;
    private constructor();
    static getInstance(): UserService;
    private initialize;
    private ensureInitialized;
    private loadUsers;
    private ensureDataDirectory;
    private saveUsers;
    private createInitialPortfolio;
    registerUser(userData: UserRegistrationData): Promise<User>;
    authenticateUser(email: string, password: string): Promise<User | null>;
    getUserById(userId: string): Promise<User | null>;
    getUserByEmail(email: string): User | null;
    updateUserPortfolio(userId: string, portfolio: Portfolio): Promise<void>;
    executeTrade(userId: string, symbol: string, name: string, quantity: number, price: number, type: 'BUY' | 'SELL'): Promise<Transaction>;
    updateStockPrices(userId: string, stockPrices: {
        [symbol: string]: number;
    }): Promise<void>;
    updateAllUsersStockPrices(stockPrices: {
        [symbol: string]: number;
    }): Promise<boolean>;
    getUsersCount(): number;
}
