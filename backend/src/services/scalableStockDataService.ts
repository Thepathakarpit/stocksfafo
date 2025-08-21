import { Server } from 'socket.io';
import { Stock } from '../types/stock';
import { NseIndia } from 'stock-nse-india';
import { StockSymbol, getAllNifty50, getAllSensex30, getAllNifty500, getTopNStocks } from '../data/stockLists';
import { UserService } from './userService';
import { stockCache, getCacheStats } from './cacheService';

interface StockDataCache {
  [symbol: string]: {
    data: Stock;
    lastUpdated: Date;
    errorCount: number;
    priority: number; // Higher priority = updated more frequently
  };
}

interface BatchConfig {
  size: number;
  intervalMs: number;
  maxConcurrent: number;
}

interface ScalingConfig {
  enabled: boolean;
  maxStocks: number;
  batchConfigs: {
    small: BatchConfig;
    medium: BatchConfig;
    large: BatchConfig;
  };
}

class ScalableStockDataService {
  private io: Server;
  private cache: StockDataCache = {};
  private nse: NseIndia;
  private userService: UserService;
  private updateInterval: NodeJS.Timeout | null = null;
  private batchQueue: string[] = [];
  private isProcessing = false;
  
  // Scaling configuration
  private readonly SCALING_CONFIG: ScalingConfig = {
    enabled: true,
    maxStocks: 500,
    batchConfigs: {
      small: { size: 5, intervalMs: 1000, maxConcurrent: 2 }, // <= 50 stocks
      medium: { size: 10, intervalMs: 2000, maxConcurrent: 3 }, // 51-200 stocks
      large: { size: 15, intervalMs: 3000, maxConcurrent: 5 }  // 201+ stocks
    }
  };

  // Enhanced performance tracking with cache metrics
  private stats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    lastBatchTime: 0,
    activeStocks: 0,
    cacheHits: 0,
    cacheMisses: 0
  };

  private readonly MAX_ERROR_COUNT = 5;
  private readonly CACHE_EXPIRY_MS = 30000; // 30 seconds for large scale
  private readonly HIGH_PRIORITY_INTERVAL = 2; // Update high priority stocks every 2 cycles
  private readonly MEMORY_CLEANUP_INTERVAL = 300000; // 5 minutes

  constructor(io: Server, userService: UserService) {
    this.io = io;
    this.nse = new NseIndia();
    this.userService = userService;
    this.setupMemoryCleanup();
  }

  public async start(stockListType: 'nifty50' | 'sensex30' | 'nifty500' = 'nifty50', customCount?: number) {
    console.log(`🚀 Starting Scalable Stock Data Service for ${stockListType.toUpperCase()}`);
    
    await this.initializeStocks(stockListType, customCount);
    this.startBatchProcessing();
    
    console.log(`✅ Service started with ${this.stats.activeStocks} stocks`);
    this.logPerformanceStats();
  }

  public stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.isProcessing = false;
    console.log('🛑 Scalable Stock Data Service stopped');
  }

  private async initializeStocks(stockListType: string, customCount?: number) {
    let stockList: StockSymbol[];
    
    switch (stockListType) {
      case 'sensex30':
        stockList = getAllSensex30();
        break;
      case 'nifty500':
        stockList = getAllNifty500();
        break;
      default:
        stockList = getAllNifty50();
    }

    // Apply custom count if specified
    if (customCount && customCount > 0) {
      stockList = stockList.slice(0, customCount);
    }

    // Initialize cache with priority system
    stockList.forEach((stockSymbol, index) => {
      const priority = this.calculatePriority(stockSymbol, index);
      
      this.cache[stockSymbol.symbol] = {
        data: {
          symbol: stockSymbol.symbol,
          name: stockSymbol.name,
          price: 0,
          change: 0,
          changePercent: 0,
          volume: 0,
          marketCap: 0,
          lastUpdated: new Date()
        },
        lastUpdated: new Date(0), // Force initial update
        errorCount: 0,
        priority
      };
    });

    this.stats.activeStocks = Object.keys(this.cache).length;
    console.log(`📊 Initialized ${this.stats.activeStocks} stocks with priority system`);
  }

  private calculatePriority(stockSymbol: StockSymbol, index: number): number {
    // Higher priority for:
    // 1. Top index stocks (lower index = higher priority)
    // 2. Large market cap stocks
    // 3. High-volume sectors (Banking, IT, FMCG)
    
    let priority = 100 - index; // Base priority from index position
    
    if (stockSymbol.marketCap === 'Large') priority += 20;
    if (stockSymbol.weight && stockSymbol.weight > 5) priority += 15;
    
    const highVolumeSectors = ['Banking', 'IT Services', 'FMCG', 'Oil & Gas'];
    if (highVolumeSectors.includes(stockSymbol.sector)) priority += 10;
    
    return Math.max(1, priority); // Ensure minimum priority of 1
  }

  private getBatchConfig(): BatchConfig {
    const stockCount = this.stats.activeStocks;
    
    if (stockCount <= 50) {
      return this.SCALING_CONFIG.batchConfigs.small;
    } else if (stockCount <= 200) {
      return this.SCALING_CONFIG.batchConfigs.medium;
    } else {
      return this.SCALING_CONFIG.batchConfigs.large;
    }
  }

  private startBatchProcessing() {
    const config = this.getBatchConfig();
    
    console.log(`⚙️ Starting batch processing: ${config.size} stocks per batch, ${config.intervalMs}ms interval`);
    
    this.updateInterval = setInterval(() => {
      if (!this.isProcessing) {
        this.processBatch();
      }
    }, config.intervalMs);
  }

  private async processBatch() {
    this.isProcessing = true;
    const startTime = Date.now();
    
    try {
      const batchSymbols = this.getNextBatch();
      if (batchSymbols.length === 0) {
        this.isProcessing = false;
        return;
      }

      const config = this.getBatchConfig();
      const promises = batchSymbols.map((symbol, index) => 
        this.delayedUpdate(symbol, index * 100) // Stagger requests by 100ms
      );

      // Process in chunks to respect concurrency limits
      const chunks = this.chunkArray(promises, config.maxConcurrent);
      
      for (const chunk of chunks) {
        await Promise.allSettled(chunk);
      }

      // Broadcast updates to clients
      await this.broadcastUpdates();
      
      // Update performance stats
      this.stats.lastBatchTime = Date.now() - startTime;
      this.updatePerformanceStats();
      
    } catch (error) {
      console.error('❌ Batch processing error:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private getNextBatch(): string[] {
    const config = this.getBatchConfig();
    const allSymbols = Object.keys(this.cache);
    
    // Prioritize stocks that need updates
    const symbolsNeedingUpdate = allSymbols
      .filter(symbol => this.shouldUpdateStock(symbol))
      .sort((a, b) => {
        const itemA = this.cache[a];
        const itemB = this.cache[b];
        
        if (!itemA || !itemB) return 0;
        
        const priorityA = itemA.priority;
        const priorityB = itemB.priority;
        const ageA = Date.now() - itemA.lastUpdated.getTime();
        const ageB = Date.now() - itemB.lastUpdated.getTime();
        
        // Higher priority first, then older data first
        return (priorityB - priorityA) || (ageB - ageA);
      });

    return symbolsNeedingUpdate.slice(0, config.size);
  }

  private shouldUpdateStock(symbol: string): boolean {
    const cacheItem = this.cache[symbol];
    if (!cacheItem) return false;

    const timeSinceUpdate = Date.now() - cacheItem.lastUpdated.getTime();
    const isHighPriority = cacheItem.priority > 80;
    
    // High priority stocks update more frequently
    const updateThreshold = isHighPriority ? 
      this.CACHE_EXPIRY_MS / 2 : 
      this.CACHE_EXPIRY_MS;

    return timeSinceUpdate > updateThreshold || cacheItem.errorCount > 0;
  }

  private async delayedUpdate(symbol: string, delayMs: number): Promise<void> {
    if (delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
    return this.updateStock(symbol);
  }

  private async updateStock(symbol: string): Promise<void> {
    const cacheItem = this.cache[symbol];
    if (!cacheItem) return;

    // Check cache first for recent data
    const cachedStock = stockCache.getStock(symbol);
    if (cachedStock) {
      console.log(`📋 Cache hit for ${symbol}`);
      this.stats.cacheHits++;
      
      // Update local cache with cached data
      this.cache[symbol] = {
        ...cacheItem,
        data: cachedStock,
        lastUpdated: new Date()
      };
      return;
    }

    this.stats.cacheMisses++;
    this.stats.totalRequests++;
    const startTime = Date.now();

    try {
      const data = await this.nse.getEquityDetails(symbol);
      
      if (!data || !data.priceInfo) {
        throw new Error(`No data available for ${symbol}`);
      }

      // Extract and validate data
      const price = data.priceInfo.lastPrice || cacheItem.data.price;
      const change = data.priceInfo.change || 0;
      const changePercent = data.priceInfo.pChange || 0;
      const volume = data.preOpenMarket?.totalTradedVolume || cacheItem.data.volume;
      
      // Calculate market cap
      const issuedCap = data.securityInfo?.issuedCap || 0;
      const marketCap = issuedCap > 0 ? price * issuedCap : cacheItem.data.marketCap;

      const stockData: Stock = {
        symbol,
        name: data.info?.companyName || cacheItem.data.name,
        price,
        change,
        changePercent,
        volume,
        marketCap,
        lastUpdated: new Date()
      };

      // Update local cache
      this.cache[symbol] = {
        ...cacheItem,
        data: stockData,
        lastUpdated: new Date(),
        errorCount: 0
      };

      // Cache the stock data for future requests
      stockCache.cacheStock(stockData);

      this.stats.successfulRequests++;
      
      // Update average response time
      const responseTime = Date.now() - startTime;
      this.stats.averageResponseTime = 
        (this.stats.averageResponseTime + responseTime) / 2;

    } catch (error) {
      console.error(`❌ Error updating ${symbol}:`, error);
      
      cacheItem.errorCount++;
      this.stats.failedRequests++;
      
      // If too many errors, use simulation for demo
      if (cacheItem.errorCount >= this.MAX_ERROR_COUNT) {
        this.simulateStockUpdate(symbol);
      }
    }
  }

  private simulateStockUpdate(symbol: string) {
    const cacheItem = this.cache[symbol];
    if (!cacheItem) return;

    // Generate realistic price movements
    const currentPrice = cacheItem.data.price || 1000;
    const volatility = 0.02; // 2% max change
    const changePercent = (Math.random() - 0.5) * 2 * volatility * 100;
    const newPrice = currentPrice * (1 + changePercent / 100);
    const change = newPrice - currentPrice;

    this.cache[symbol] = {
      ...cacheItem,
      data: {
        ...cacheItem.data,
        price: Math.round(newPrice * 100) / 100,
        change: Math.round(change * 100) / 100,
        changePercent: Math.round(changePercent * 100) / 100,
        lastUpdated: new Date()
      },
      lastUpdated: new Date(),
      errorCount: 0 // Reset after simulation
    };
  }

  private async broadcastUpdates() {
    const updatedStocks = Object.values(this.cache).map(item => item.data);
    
    // Broadcast stock updates to clients
    this.io.to('stock-updates').emit('stocks-updated', updatedStocks);
    
    // Update user portfolios with new stock prices
    const portfoliosUpdated = await this.updateUserPortfolios(updatedStocks);
    
    // Notify clients if portfolios were updated
    if (portfoliosUpdated) {
      this.io.to('stock-updates').emit('portfolios-updated');
    }
  }
  
  private async updateUserPortfolios(stocks: Stock[]): Promise<boolean> {
    try {
      // Create a map of stock symbols to current prices
      const stockPrices: { [symbol: string]: number } = {};
      stocks.forEach(stock => {
        stockPrices[stock.symbol] = stock.price;
      });
      
      // Update all users' portfolios with new prices
      const updated = await this.userService.updateAllUsersStockPrices(stockPrices);
      return updated;
      
    } catch (error) {
      console.error('❌ Error updating user portfolios:', error);
      return false;
    }
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  private updatePerformanceStats() {
    const successRate = this.stats.totalRequests > 0 ? 
      (this.stats.successfulRequests / this.stats.totalRequests) * 100 : 0;
    
    // Log performance every 100 requests
    if (this.stats.totalRequests % 100 === 0) {
      console.log(`📊 Performance Stats:`, {
        totalRequests: this.stats.totalRequests,
        successRate: `${successRate.toFixed(2)}%`,
        avgResponseTime: `${this.stats.averageResponseTime.toFixed(0)}ms`,
        lastBatchTime: `${this.stats.lastBatchTime}ms`,
        activeStocks: this.stats.activeStocks
      });
    }
  }

  private setupMemoryCleanup() {
    setInterval(() => {
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      // Clean up old cache entries
      const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
      Object.keys(this.cache).forEach(symbol => {
        const item = this.cache[symbol];
        if (item && item.lastUpdated.getTime() < cutoffTime && item.errorCount > 10) {
          delete this.cache[symbol];
        }
      });
      
    }, this.MEMORY_CLEANUP_INTERVAL);
  }

  private logPerformanceStats() {
    const config = this.getBatchConfig();
    console.log(`🎯 Performance Configuration:`, {
      stockCount: this.stats.activeStocks,
      batchSize: config.size,
      batchInterval: `${config.intervalMs}ms`,
      maxConcurrent: config.maxConcurrent,
      estimatedUpdatesPerMinute: Math.floor(60000 / config.intervalMs) * config.size
    });
  }

  public testSetPrices(priceUpdates: {symbol: string, newPrice: number}[]) {
    priceUpdates.forEach(({symbol, newPrice}) => {
      const cacheItem = this.cache[symbol];
      if (cacheItem) {
        const oldPrice = cacheItem.data.price;
        const change = newPrice - oldPrice;
        const changePercent = (change / oldPrice) * 100;
        
        this.cache[symbol] = {
          ...cacheItem,
          data: {
            ...cacheItem.data,
            price: Math.round(newPrice * 100) / 100,
            change: Math.round(change * 100) / 100,
            changePercent: Math.round(changePercent * 100) / 100,
            lastUpdated: new Date()
          },
          lastUpdated: new Date()
        };
      }
    });
    
    // Trigger portfolio update
    this.broadcastUpdates();
  }
  
  public async forcePortfolioUpdate() {
    console.log('🔄 Forcing portfolio update with current prices...');
    await this.broadcastUpdates();
  }

  public forceSimulation(symbols: string[]) {
    symbols.forEach(symbol => {
      const cacheItem = this.cache[symbol];
      if (cacheItem) {
        cacheItem.errorCount = this.MAX_ERROR_COUNT + 1;
        this.simulateStockUpdate(symbol);
      }
    });
  }

  // Enhanced getStock method with cache integration
  public getStock(symbol: string): Stock | null {
    // Check cache first
    const cachedStock = stockCache.getStock(symbol);
    if (cachedStock) {
      return cachedStock;
    }

    // Fall back to local cache
    const cacheItem = this.cache[symbol];
    return cacheItem ? cacheItem.data : null;
  }

  // Enhanced getAllStocks with cache integration
  public getAllStocks(): Stock[] {
    const stocks: Stock[] = [];
    
    Object.keys(this.cache).forEach(symbol => {
      const stock = this.getStock(symbol);
      if (stock) {
        stocks.push(stock);
      }
    });
    
    return stocks;
  }

  // Enhanced performance stats with cache metrics
  public getPerformanceStats() {
    const cacheStats = getCacheStats();
    
    return { 
      ...this.stats,
      cache: cacheStats,
      cacheHitRate: this.stats.cacheHits > 0 ? 
        (this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses)) * 100 : 0
    };
  }

  public getActiveStockCount(): number {
    return this.stats.activeStocks;
  }

  public switchStockList(stockListType: 'nifty50' | 'sensex30' | 'nifty500', customCount?: number) {
    console.log(`🔄 Switching to ${stockListType.toUpperCase()}${customCount ? ` (${customCount} stocks)` : ''}`);
    
    this.stop();
    this.cache = {};
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      lastBatchTime: 0,
      activeStocks: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
    
    this.start(stockListType, customCount);
  }
}

export default ScalableStockDataService; 