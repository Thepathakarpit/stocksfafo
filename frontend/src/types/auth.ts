export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  portfolio: Portfolio;
}

export interface Portfolio {
  cash: number;
  totalValue: number;
  totalInvested: number;
  stocks: StockHolding[];
  transactions: Transaction[];
}

export interface StockHolding {
  symbol: string;
  name: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  value: number;
  gainLoss: number;
  gainLossPercent: number;
}

export interface Transaction {
  id: string;
  type: 'BUY' | 'SELL';
  symbol: string;
  name: string;
  quantity: number;
  price: number;
  amount: number;
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
  user?: User;
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

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: UserRegistrationData) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export interface ApiError {
  success: false;
  message: string;
} 