export interface User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  portfolio: Portfolio;
}

export interface Portfolio {
  cash: number; // Available cash in INR
  totalValue: number; // Total portfolio value
  totalInvested: number; // Total amount invested
  stocks: StockHolding[];
  transactions: Transaction[];
}

export interface StockHolding {
  symbol: string;
  name: string;
  quantity: number;
  avgPrice: number; // Average purchase price
  currentPrice: number; // Current market price
  value: number; // Current value (quantity * currentPrice)
  gainLoss: number; // Profit/Loss
  gainLossPercent: number; // Profit/Loss percentage
}

export interface Transaction {
  id: string;
  type: 'BUY' | 'SELL';
  symbol: string;
  name: string;
  quantity: number;
  price: number;
  amount: number; // quantity * price
  timestamp: string;
}

export interface UserRegistrationData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface UserLoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: Omit<User, 'password'>;
  token?: string;
}

export interface TradeRequest {
  symbol: string;
  name: string;
  quantity: number;
  price: number;
  type: 'BUY' | 'SELL';
}

export interface PortfolioSummary {
  totalValue: number;
  totalInvested: number;
  cash: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  dayGainLoss: number;
  dayGainLossPercent: number;
  stocksCount: number;
} 