import express from 'express';
import { UserService } from '../services/userService';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { TradeRequest, PortfolioSummary, Transaction } from '../types/user';

const router = express.Router();
const userService = UserService.getInstance();

/**
 * GET /api/portfolio
 * Get user's portfolio
 */
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    console.log('📊 Portfolio GET request received');
    console.log('🔑 Request user:', req.user ? { userId: req.user.userId } : 'null');
    console.log('🔍 Request headers:', req.headers.authorization ? 'Bearer token present' : 'No auth header');

    if (!req.user) {
      console.error('❌ Portfolio GET: User not authenticated');
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    console.log('🔍 Looking for user with ID:', req.user.userId);
    console.log('📋 Available user IDs in service:', Array.from(userService['users'].keys()));
    console.log('📧 Available user emails in service:', Array.from(userService['usersByEmail'].keys()));
    
    const user = await userService.getUserById(req.user.userId);
    
    if (!user) {
      console.error('❌ Portfolio GET: User not found in database:', req.user.userId);
      console.log('📋 Total users in system:', userService.getUsersCount());
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('✅ Portfolio GET: User found:', { id: user.id, email: user.email });
    console.log('📊 Portfolio data:', { 
      cash: user.portfolio.cash, 
      stocksCount: user.portfolio.stocks.length,
      totalInvested: user.portfolio.totalInvested 
    });

    res.json({
      success: true,
      portfolio: user.portfolio
    });
  } catch (error) {
    console.error('❌ Portfolio GET error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to get portfolio'
    });
  }
});

/**
 * GET /api/portfolio/summary
 * Get portfolio summary with calculated metrics
 */
router.get('/summary', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    console.log('📈 Portfolio summary GET request received');
    console.log('🔑 Request user:', req.user ? { userId: req.user.userId } : 'null');

    if (!req.user) {
      console.error('❌ Portfolio summary GET: User not authenticated');
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    console.log('🔍 Looking for user with ID:', req.user.userId);
    const user = await userService.getUserById(req.user.userId);
    
    if (!user) {
      console.error('❌ Portfolio summary GET: User not found in database:', req.user.userId);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('✅ Portfolio summary GET: User found:', { id: user.id, email: user.email });

    const portfolio = user.portfolio;
    console.log('📊 Portfolio raw data:', {
      cash: portfolio.cash,
      totalInvested: portfolio.totalInvested,
      stocksCount: portfolio.stocks.length,
      stocks: portfolio.stocks.map((s: any) => ({ symbol: s.symbol, value: s.value, gainLoss: s.gainLoss }))
    });

    const totalStockValue = portfolio.stocks.reduce((total: number, stock: any) => total + stock.value, 0);
    const totalGainLoss = totalStockValue - portfolio.totalInvested;
    const totalGainLossPercent = portfolio.totalInvested > 0 
      ? (totalGainLoss / portfolio.totalInvested) * 100 
      : 0;

    const summary: PortfolioSummary = {
      totalValue: portfolio.cash + totalStockValue,
      totalInvested: portfolio.totalInvested,
      totalGainLoss,
      totalGainLossPercent,
      cash: portfolio.cash,
      dayGainLoss: portfolio.stocks.reduce((total: number, stock: any) => total + stock.gainLoss, 0),
      dayGainLossPercent: totalStockValue > 0 
        ? (portfolio.stocks.reduce((total: number, stock: any) => total + stock.gainLoss, 0) / totalStockValue) * 100
        : 0,
      stocksCount: portfolio.stocks.length
    };

    console.log('📊 Portfolio summary calculated:', {
      totalValue: summary.totalValue,
      totalInvested: summary.totalInvested,
      totalGainLoss: summary.totalGainLoss,
      totalGainLossPercent: summary.totalGainLossPercent
    });

    res.json({
      success: true,
      summary
    });
  } catch (error) {
    console.error('❌ Portfolio summary GET error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to get portfolio summary'
    });
  }
});

/**
 * POST /api/portfolio/trade
 * Execute a trade (buy/sell stocks)
 */
router.post('/trade', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    console.log('💰 Trade POST request received');
    console.log('🔑 Request user:', req.user ? { userId: req.user.userId } : 'null');
    console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
    console.log('📋 Request headers:', {
      'content-type': req.headers['content-type'],
      authorization: req.headers.authorization ? 'Bearer token present' : 'No auth header'
    });

    if (!req.user) {
      console.error('❌ Trade POST: User not authenticated');
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const { symbol, name, quantity, price, type }: TradeRequest = req.body;

    console.log('🔍 Extracted fields from request body:');
    console.log('  - symbol:', symbol, typeof symbol);
    console.log('  - name:', name, typeof name);
    console.log('  - quantity:', quantity, typeof quantity);
    console.log('  - price:', price, typeof price);
    console.log('  - type:', type, typeof type);

    // Validate input
    if (!symbol || !name || !quantity || !price || !type) {
      console.error('❌ Trade validation failed - missing required fields:');
      console.error('  - symbol present:', !!symbol);
      console.error('  - name present:', !!name);
      console.error('  - quantity present:', !!quantity);
      console.error('  - price present:', !!price);
      console.error('  - type present:', !!type);
      
      return res.status(400).json({
        success: false,
        message: 'All trade fields are required'
      });
    }

    if (!['BUY', 'SELL'].includes(type)) {
      console.error('❌ Trade validation failed - invalid type:', type);
      return res.status(400).json({
        success: false,
        message: 'Trade type must be BUY or SELL'
      });
    }

    if (quantity <= 0 || price <= 0) {
      console.error('❌ Trade validation failed - invalid numbers:', { quantity, price });
      return res.status(400).json({
        success: false,
        message: 'Quantity and price must be positive numbers'
      });
    }

    // Enforce market price rules
    try {
      const stockService = req.app.get('stockService');
      const market = stockService?.getStock(symbol.toUpperCase());
      if (!market || typeof market.price !== 'number' || market.price <= 0) {
        console.error('❌ Market price unavailable for symbol:', symbol);
        return res.status(400).json({
          success: false,
          message: 'Market price unavailable. Please try again later.'
        });
      }

      // Rule: Do not allow SELL at a higher rate than market price
      if (type === 'SELL' && price > market.price) {
        return res.status(400).json({
          success: false,
          message: `Sell price cannot exceed market price. Market: ₹${market.price}, Requested: ₹${price}`
        });
      }

      // Optional: Prevent extreme BUY undercuts if desired in future
      // if (type === 'BUY' && price < market.price * 0.5) { ... }
    } catch (marketErr) {
      console.error('❌ Error validating against market price:', marketErr);
      return res.status(500).json({
        success: false,
        message: 'Failed to validate trade against market price'
      });
    }

    console.log('✅ Trade validation passed, executing trade...');

    // Execute the trade
    const transaction = await userService.executeTrade(
      req.user.userId,
      symbol.toUpperCase(),
      name,
      quantity,
      price,
      type
    );

    console.log('✅ Trade executed successfully:', transaction);

    // Get updated portfolio
    const user = await userService.getUserById(req.user.userId);
    
    res.json({
      success: true,
      message: `${type} order executed successfully`,
      transaction,
      portfolio: user?.portfolio
    });
  } catch (error) {
    console.error('❌ Trade execution error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Trade execution failed';
    
    res.status(400).json({
      success: false,
      message: errorMessage
    });
  }
});

/**
 * GET /api/portfolio/transactions
 * Get user's transaction history
 */
router.get('/transactions', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const user = await userService.getUserById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const symbol = req.query.symbol as string;
    const type = req.query.type as string;

    let transactions = [...user.portfolio.transactions];

    // Filter by symbol if provided
    if (symbol) {
      transactions = transactions.filter(t => t.symbol.toLowerCase().includes(symbol.toLowerCase()));
    }

    // Filter by type if provided
    if (type && ['BUY', 'SELL'].includes(type.toUpperCase())) {
      transactions = transactions.filter(t => t.type === type.toUpperCase());
    }

    // Sort by timestamp (newest first)
    transactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedTransactions = transactions.slice(startIndex, endIndex);

    res.json({
      success: true,
      transactions: paginatedTransactions,
      pagination: {
        current: page,
        limit,
        total: transactions.length,
        pages: Math.ceil(transactions.length / limit)
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to get transactions'
    });
  }
});

/**
 * GET /api/portfolio/holdings
 * Get user's current stock holdings
 */
router.get('/holdings', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const user = await userService.getUserById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const sortBy = req.query.sortBy as string || 'value';
    const sortOrder = req.query.sortOrder as string || 'desc';

    let holdings = [...user.portfolio.stocks];

    // Sort holdings
    holdings.sort((a, b) => {
      let aValue: number, bValue: number;
      
      switch (sortBy) {
        case 'symbol':
          return sortOrder === 'asc' ? a.symbol.localeCompare(b.symbol) : b.symbol.localeCompare(a.symbol);
        case 'quantity':
          aValue = a.quantity;
          bValue = b.quantity;
          break;
        case 'gainLoss':
          aValue = a.gainLoss;
          bValue = b.gainLoss;
          break;
        case 'gainLossPercent':
          aValue = a.gainLossPercent;
          bValue = b.gainLossPercent;
          break;
        case 'value':
        default:
          aValue = a.value;
          bValue = b.value;
          break;
      }
      
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    res.json({
      success: true,
      holdings,
      totalValue: holdings.reduce((total, stock) => total + stock.value, 0),
      totalGainLoss: holdings.reduce((total, stock) => total + stock.gainLoss, 0)
    });
  } catch (error) {
    console.error('Get holdings error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to get holdings'
    });
  }
});

/**
 * GET /api/portfolio/performance
 * Get portfolio performance metrics
 */
router.get('/performance', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const user = await userService.getUserById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const portfolio = user.portfolio;
    const totalStockValue = portfolio.stocks.reduce((total, stock) => total + stock.value, 0);
    const totalValue = portfolio.cash + totalStockValue;
    const totalGainLoss = totalValue - 500000; // Initial amount
    const totalGainLossPercent = (totalGainLoss / 500000) * 100;

    // Calculate performance metrics
    const performance = {
      totalValue,
      totalInvested: portfolio.totalInvested,
      cash: portfolio.cash,
      totalGainLoss,
      totalGainLossPercent,
      stocksValue: totalStockValue,
      stocksCount: portfolio.stocks.length,
      transactionsCount: portfolio.transactions.length,
      topPerformer: portfolio.stocks.length > 0 
        ? portfolio.stocks.reduce((top, stock) => 
            stock.gainLossPercent > top.gainLossPercent ? stock : top
          )
        : null,
      worstPerformer: portfolio.stocks.length > 0
        ? portfolio.stocks.reduce((worst, stock) =>
            stock.gainLossPercent < worst.gainLossPercent ? stock : worst
          )
        : null
    };

    res.json({
      success: true,
      performance
    });
  } catch (error) {
    console.error('Get performance error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to get performance metrics'
    });
  }
});

/**
 * GET /api/portfolio/demo
 * Demo portfolio endpoint for testing (no auth required)
 */
router.get('/demo', async (req, res) => {
  try {
    const demoPortfolio = {
      cash: 500000,
      totalValue: 650000,
      totalInvested: 150000,
      stocks: [
        {
          symbol: 'RELIANCE',
          name: 'Reliance Industries Limited',
          quantity: 50,
          avgPrice: 1400,
          currentPrice: 1427.2,
          value: 71360,
          gainLoss: 1360,
          gainLossPercent: 1.94
        },
        {
          symbol: 'TCS',
          name: 'Tata Consultancy Services Limited',
          quantity: 25,
          avgPrice: 3100,
          currentPrice: 3096.6,
          value: 77415,
          gainLoss: -85,
          gainLossPercent: -0.11
        }
      ],
      transactions: [
        {
          id: 'demo_txn_1',
          type: 'BUY',
          symbol: 'RELIANCE',
          name: 'Reliance Industries Limited',
          quantity: 50,
          price: 1400,
          amount: 70000,
          timestamp: new Date().toISOString()
        },
        {
          id: 'demo_txn_2',
          type: 'BUY',
          symbol: 'TCS',
          name: 'Tata Consultancy Services Limited',
          quantity: 25,
          price: 3100,
          amount: 77500,
          timestamp: new Date().toISOString()
        }
      ]
    };

    res.json({
      success: true,
      portfolio: demoPortfolio,
      message: 'Demo portfolio data'
    });
  } catch (error) {
    console.error('❌ Demo portfolio error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to get demo portfolio'
    });
  }
});

export default router; 