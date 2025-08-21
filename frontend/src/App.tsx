import React, { useState, useEffect } from 'react';
import './App.css';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
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

const API_BASE = 'http://localhost:5000/api';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string>('');
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [activeTab, setActiveTab] = useState<'portfolio' | 'market' | 'api'>('portfolio');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auth state
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // Trade state
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    // Check for existing token
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
      loadUserData(savedToken);
    }
  }, []);

  useEffect(() => {
    if (token) {
      loadStocks();
      // Update stocks every 10 seconds
      const interval = setInterval(loadStocks, 10000);
      return () => clearInterval(interval);
    }
  }, [token]);

  const loadUserData = async (authToken: string) => {
    try {
      const response = await fetch(`${API_BASE}/portfolio`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await response.json();
      if (data.success) {
        // We need to reconstruct user object since we only get portfolio
        // For now, let's get from localStorage if available
        const userData = localStorage.getItem('userData');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          setUser({ ...parsedUser, portfolio: data.portfolio });
        }
      }
    } catch (error) {
      console.error('Failed to load user data');
    }
  };

  const loadStocks = async () => {
    try {
      const response = await fetch(`${API_BASE}/stocks`);
      const data = await response.json();
      if (data.success) {
        setStocks(data.data);
      }
    } catch (error) {
      console.error('Failed to load stocks');
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const body = isLogin 
        ? { email, password }
        : { email, password, firstName, lastName };

      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (data.success) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('token', data.token);
        localStorage.setItem('userData', JSON.stringify(data.user));
        setEmail('');
        setPassword('');
        setFirstName('');
        setLastName('');
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTrade = async () => {
    if (!selectedStock || !user) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/portfolio/trade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          symbol: selectedStock.symbol,
          name: selectedStock.name,
          type: tradeType,
          quantity,
          price: selectedStock.price
        })
      });

      const data = await response.json();

      if (data.success) {
        setUser({ ...user, portfolio: data.portfolio });
        setSelectedStock(null);
        setQuantity(1);
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Trade failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  };

  const formatPercent = (percent: number) => {
    return `${percent > 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  if (!user) {
    return (
      <div className="app">
        <div className="auth-container">
          <div className="auth-card">
            <h1>StocksFafo</h1>
            <div className="auth-tabs">
              <button 
                className={isLogin ? 'active' : ''} 
                onClick={() => setIsLogin(true)}
              >
                Login
              </button>
              <button 
                className={!isLogin ? 'active' : ''} 
                onClick={() => setIsLogin(false)}
              >
                Register
              </button>
            </div>
            
            <form onSubmit={handleAuth}>
              {!isLogin && (
                <>
                  <input
                    type="text"
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </>
              )}
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type="submit" disabled={loading}>
                {loading ? 'Loading...' : (isLogin ? 'Login' : 'Register')}
              </button>
              {error && <div className="error">{error}</div>}
            </form>
          </div>
        </div>
      </div>
    );
  }

  const totalPortfolioValue = user.portfolio.cash + 
    user.portfolio.stocks.reduce((sum, stock) => sum + (stock.quantity * stock.currentPrice), 0);

  const totalGainLoss = user.portfolio.stocks.reduce((sum, stock) => 
    sum + ((stock.currentPrice - stock.avgPrice) * stock.quantity), 0);

  return (
    <div className="app">
      <header className="header">
        <h1>StocksFafo</h1>
        <div className="user-info">
          <span>Welcome, {user.firstName} {user.lastName}</span>
          <span>Portfolio: {formatCurrency(totalPortfolioValue)}</span>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <nav className="nav">
        <button 
          className={activeTab === 'portfolio' ? 'active' : ''} 
          onClick={() => setActiveTab('portfolio')}
        >
          Portfolio
        </button>
        <button 
          className={activeTab === 'market' ? 'active' : ''} 
          onClick={() => setActiveTab('market')}
        >
          Market
        </button>
        <button 
          className={activeTab === 'api' ? 'active' : ''} 
          onClick={() => setActiveTab('api')}
        >
          API
        </button>
      </nav>

      <main className="main">
        {activeTab === 'portfolio' && (
          <div className="portfolio">
            <div className="portfolio-summary">
              <div className="summary-card">
                <h3>Cash</h3>
                <p>{formatCurrency(user.portfolio.cash)}</p>
              </div>
              <div className="summary-card">
                <h3>Total Value</h3>
                <p>{formatCurrency(totalPortfolioValue)}</p>
              </div>
              <div className="summary-card">
                <h3>Total P&L</h3>
                <p className={totalGainLoss >= 0 ? 'positive' : 'negative'}>
                  {formatCurrency(totalGainLoss)}
                </p>
              </div>
            </div>

            <div className="holdings">
              <h2>Holdings</h2>
              {user.portfolio.stocks.length === 0 ? (
                <p>No holdings yet. Start trading to build your portfolio!</p>
              ) : (
                <div className="holdings-grid">
                  {user.portfolio.stocks.map((holding) => {
                    const gainLoss = (holding.currentPrice - holding.avgPrice) * holding.quantity;
                    const gainLossPercent = ((holding.currentPrice - holding.avgPrice) / holding.avgPrice) * 100;
                    
                    return (
                      <div key={holding.symbol} className="holding-card">
                        <h4>{holding.symbol}</h4>
                        <p>{holding.name}</p>
                        <p>Qty: {holding.quantity}</p>
                        <p>Avg Price: {formatCurrency(holding.avgPrice)}</p>
                        <p>Current: {formatCurrency(holding.currentPrice)}</p>
                        <p className={gainLoss >= 0 ? 'positive' : 'negative'}>
                          P&L: {formatCurrency(gainLoss)} ({formatPercent(gainLossPercent)})
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="transactions">
              <h2>Recent Transactions</h2>
              {user.portfolio.transactions
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .map((transaction) => (
                <div key={transaction.id} className="transaction-item">
                  <span className={`type ${transaction.type.toLowerCase()}`}>
                    {transaction.type}
                  </span>
                  <span>{transaction.symbol}</span>
                  <span>{transaction.quantity} shares</span>
                  <span>{formatCurrency(transaction.price)}</span>
                  <span>{new Date(transaction.timestamp).toLocaleDateString()}</span>
                </div>
              ))}
              {user.portfolio.transactions.length === 0 && (
                <div className="no-transactions">
                  <p>No transactions yet. Start trading to see your history!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'market' && (
          <div className="market">
            <h2>Live Market Data</h2>
            <div className="stocks-grid">
              {stocks.map((stock) => (
                <div key={stock.symbol} className="stock-card">
                  <h4>{stock.symbol}</h4>
                  <p>{stock.name}</p>
                  <p className="price">{formatCurrency(stock.price)}</p>
                  <p className={stock.change >= 0 ? 'positive' : 'negative'}>
                    {formatCurrency(stock.change)} ({formatPercent(stock.changePercent)})
                  </p>
                  <div className="trade-buttons">
                    <button 
                      className="buy-btn"
                      onClick={() => {
                        setSelectedStock(stock);
                        setTradeType('BUY');
                      }}
                    >
                      BUY
                    </button>
                    <button 
                      className="sell-btn"
                      onClick={() => {
                        setSelectedStock(stock);
                        setTradeType('SELL');
                      }}
                    >
                      SELL
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'api' && (
          <div className="api-docs">
            <h2>API Reference</h2>
            <p>Base URL: {API_BASE}</p>

            <div className="token-box">
              <div className="token-header">
                <h3>Your Trading Key (JWT)</h3>
                <button 
                  type="button" 
                  className="copy-btn"
                  onClick={() => {
                    if (!token) return;
                    navigator.clipboard.writeText(token);
                    alert('Token copied to clipboard');
                  }}
                  disabled={!token}
                >
                  {token ? 'Copy Token' : 'Login to get token'}
                </button>
              </div>
              <span className="token-value">{token || 'Not logged in'}</span>
            </div>

            <div className="api-grid">
              <div className="section-card">
                <h3>Public Endpoints</h3>
                <ul>
                  <li>GET /health</li>
                  <li>GET /stocks</li>
                  <li>GET /stock-lists</li>
                  <li>GET /performance</li>
                  <li>POST /auth/register</li>
                  <li>POST /auth/login</li>
                </ul>
              </div>

              <div className="section-card">
                <h3>Authenticated Endpoints</h3>
                <ul>
                  <li>POST /auth/verify</li>
                  <li>GET /auth/profile</li>
                  <li>GET /portfolio</li>
                  <li>GET /portfolio/summary</li>
                  <li>GET /portfolio/holdings</li>
                  <li>GET /portfolio/transactions</li>
                  <li>POST /portfolio/trade</li>
                </ul>
              </div>

              <div className="section-card full-width">
                <h3>Api Calls</h3>
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
{`# =======================
# AUTHENTICATION
# =======================
# Register
curl -X POST http://localhost:5000/api/auth/register   -H "Content-Type: application/json"   -d '{"email":"user@example.com","password":"Test123!","firstName":"First","lastName":"Last"}'

# Login
curl -X POST http://localhost:5000/api/auth/login   -H "Content-Type: application/json"   -d '{"email":"user@example.com","password":"Test123!"}'

# Verify token (requires Authorization header)
curl -X POST http://localhost:5000/api/auth/verify   -H "Authorization: Bearer ${token || 'YOUR_JWT_HERE'}"

# Profile (requires Authorization header)
curl http://localhost:5000/api/auth/profile   -H "Authorization: Bearer ${token || 'YOUR_JWT_HERE'}"

# =======================
# STOCKS
# =======================
# Get all active stocks
curl http://localhost:5000/api/stocks

# Get one stock by symbol
curl http://localhost:5000/api/stocks/TCS

# Filter by sector keyword in company name (case-insensitive)
curl http://localhost:5000/api/stocks/sector/bank

# Top performers (count)
curl http://localhost:5000/api/stocks/performance/top/10

# Worst performers (count)
curl http://localhost:5000/api/stocks/performance/worst/10

# =======================
# PORTFOLIO (requires Authorization header)
# =======================
# Get full portfolio
curl http://localhost:5000/api/portfolio   -H "Authorization: Bearer ${token || 'YOUR_JWT_HERE'}"

# Get portfolio summary
curl http://localhost:5000/api/portfolio/summary   -H "Authorization: Bearer ${token || 'YOUR_JWT_HERE'}"

# Get holdings (sorted)
# sortBy: value|symbol|quantity|gainLoss|gainLossPercent
# sortOrder: asc|desc
curl "http://localhost:5000/api/portfolio/holdings?sortBy=value&sortOrder=desc"   -H "Authorization: Bearer ${token || 'YOUR_JWT_HERE'}"

# Get transactions (filters + pagination)
# page, limit, symbol (substring), type: BUY|SELL
curl "http://localhost:5000/api/portfolio/transactions?page=1&limit=20"   -H "Authorization: Bearer ${token || 'YOUR_JWT_HERE'}"

curl "http://localhost:5000/api/portfolio/transactions?type=BUY&symbol=TC"   -H "Authorization: Bearer ${token || 'YOUR_JWT_HERE'}"

# Execute trades
# BUY
curl -X POST http://localhost:5000/api/portfolio/trade   -H "Authorization: Bearer ${token || 'YOUR_JWT_HERE'}"   -H "Content-Type: application/json"   -d '{"symbol":"TCS","name":"Tata Consultancy Services Ltd","type":"BUY","quantity":1,"price":3900}'

# SELL
curl -X POST http://localhost:5000/api/portfolio/trade   -H "Authorization: Bearer ${token || 'YOUR_JWT_HERE'}"   -H "Content-Type: application/json"   -d '{"symbol":"TCS","name":"Tata Consultancy Services Ltd","type":"SELL","quantity":1,"price":3920}'

# Performance metrics
curl http://localhost:5000/api/portfolio/performance   -H "Authorization: Bearer ${token || 'YOUR_JWT_HERE'}"`}
                </pre>
              </div>
            </div>
          </div>
        )}
      </main>

      {selectedStock && (
        <div className="modal-overlay" onClick={() => setSelectedStock(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{tradeType} {selectedStock.symbol}</h3>
            <p>{selectedStock.name}</p>
            <p>Price: {formatCurrency(selectedStock.price)}</p>
            
            <div className="trade-form">
              <label>
                Quantity:
                <input 
                  type="number" 
                  min="1" 
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                />
              </label>
              
              <p>Total: {formatCurrency(selectedStock.price * quantity)}</p>
              
              <div className="modal-buttons">
                <button onClick={() => setSelectedStock(null)}>Cancel</button>
                <button 
                  onClick={handleTrade}
                  disabled={loading}
                  className={tradeType === 'BUY' ? 'buy-btn' : 'sell-btn'}
                >
                  {loading ? 'Processing...' : `${tradeType} ${quantity} shares`}
                </button>
              </div>
              
              {error && <div className="error">{error}</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
