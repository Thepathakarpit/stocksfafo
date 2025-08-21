import axios, { AxiosResponse } from 'axios';
import { 
  AuthResponse, 
  UserRegistrationData, 
  UserLoginData, 
  User, 
  Portfolio,
  PortfolioSummary,
  TradeRequest,
  Transaction,
  StockHolding
} from '../types/auth';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

console.log('🔧 API Client: Base URL configured as:', API_BASE_URL);

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 second timeout
});

// Request interceptor to add auth token and logging
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  
  console.log('📡 API Request:', {
    method: config.method?.toUpperCase(),
    url: config.url,
    hasToken: !!token,
    tokenPrefix: token ? token.substring(0, 20) + '...' : 'none'
  });
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling and logging
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ API Response Success:', {
      method: response.config.method?.toUpperCase(),
      url: response.config.url,
      status: response.status,
      data: response.data?.success !== undefined ? { success: response.data.success } : 'data present'
    });
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', {
      method: error.config?.method?.toUpperCase(),
      url: error.config?.url,
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.response?.data?.message || error.message,
      data: error.response?.data
    });
    
    if (error.response?.status === 401) {
      console.warn('🚨 API: 401 Unauthorized - clearing stored credentials');
      // Token expired or invalid
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  /**
   * Register a new user
   */
  register: async (userData: UserRegistrationData): Promise<AuthResponse> => {
    try {
      const response: AxiosResponse<AuthResponse> = await apiClient.post('/auth/register', userData);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        message: 'Registration failed. Please try again.',
      };
    }
  },

  /**
   * Login user
   */
  login: async (credentials: UserLoginData): Promise<AuthResponse> => {
    try {
      const response: AxiosResponse<AuthResponse> = await apiClient.post('/auth/login', credentials);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        message: 'Login failed. Please try again.',
      };
    }
  },

  /**
   * Get current user profile
   */
  getProfile: async (): Promise<{ success: boolean; user?: User; message?: string }> => {
    try {
      const response = await apiClient.get('/auth/profile');
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        message: 'Failed to get user profile',
      };
    }
  },

  /**
   * Verify JWT token
   */
  verifyToken: async (): Promise<{ success: boolean; user?: any; message?: string }> => {
    try {
      const response = await apiClient.post('/auth/verify');
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: 'Token verification failed',
      };
    }
  },
};

// Portfolio API
export const portfolioAPI = {
  /**
   * Get user's portfolio
   */
  getPortfolio: async (): Promise<{ success: boolean; portfolio?: Portfolio; message?: string }> => {
    try {
      const response = await apiClient.get('/portfolio');
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        message: 'Failed to get portfolio',
      };
    }
  },

  /**
   * Get portfolio summary
   */
  getSummary: async (): Promise<{ 
    success: boolean; 
    summary?: PortfolioSummary; 
    portfolio?: Portfolio;
    message?: string 
  }> => {
    try {
      const response = await apiClient.get('/portfolio/summary');
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        message: 'Failed to get portfolio summary',
      };
    }
  },

  /**
   * Execute a trade
   */
  executeTrade: async (tradeData: TradeRequest): Promise<{ 
    success: boolean; 
    transaction?: Transaction;
    portfolio?: Portfolio;
    message?: string 
  }> => {
    try {
      console.log('🔍 portfolioAPI.executeTrade: Sending trade data:', tradeData);
      const response = await apiClient.post('/portfolio/trade', tradeData);
      console.log('🔍 portfolioAPI.executeTrade: Response received:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ portfolioAPI.executeTrade: Error:', error);
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        message: 'Trade execution failed',
      };
    }
  },

  /**
   * Get transaction history
   */
  getTransactions: async (
    page: number = 1,
    limit: number = 50,
    symbol?: string,
    type?: string
  ): Promise<{ 
    success: boolean; 
    transactions?: Transaction[];
    pagination?: {
      current: number;
      limit: number;
      total: number;
      pages: number;
    };
    message?: string 
  }> => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      if (symbol) params.append('symbol', symbol);
      if (type) params.append('type', type);

      const response = await apiClient.get(`/portfolio/transactions?${params}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        message: 'Failed to get transactions',
      };
    }
  },

  /**
   * Get stock holdings
   */
  getHoldings: async (
    sortBy: string = 'value',
    sortOrder: string = 'desc'
  ): Promise<{ 
    success: boolean; 
    holdings?: StockHolding[];
    totalValue?: number;
    totalGainLoss?: number;
    message?: string 
  }> => {
    try {
      const response = await apiClient.get(`/portfolio/holdings?sortBy=${sortBy}&sortOrder=${sortOrder}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        message: 'Failed to get holdings',
      };
    }
  },

  /**
   * Get portfolio performance
   */
  getPerformance: async (): Promise<{ 
    success: boolean; 
    performance?: {
      totalValue: number;
      totalInvested: number;
      cash: number;
      totalGainLoss: number;
      totalGainLossPercent: number;
      stocksValue: number;
      stocksCount: number;
      transactionsCount: number;
      topPerformer: StockHolding | null;
      worstPerformer: StockHolding | null;
    };
    message?: string 
  }> => {
    try {
      const response = await apiClient.get('/portfolio/performance');
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        message: 'Failed to get performance metrics',
      };
    }
  },
};

// Stock API (existing)
export const stockAPI = {
  /**
   * Get all stocks
   */
  getStocks: async () => {
    try {
      const response = await apiClient.get('/stocks');
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        message: 'Failed to get stocks',
      };
    }
  },
};

// Trading API - Alias for portfolioAPI for backward compatibility
export const tradingAPI = portfolioAPI;

export default apiClient; 