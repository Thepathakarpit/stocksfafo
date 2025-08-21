import { Server } from 'socket.io';
import { Stock } from '../types/stock';
import { sampleStocks } from '../data/sampleStocks';
import { NseIndia } from 'stock-nse-india';

interface StockDataCache {
  [symbol: string]: {
    data: Stock;
    lastUpdated: Date;
    errorCount: number;
  };
}

class StockDataService {
  private io: Server;
  private cache: StockDataCache = {};
  private nse: NseIndia;
  private updateInterval: NodeJS.Timeout | null = null;
  private readonly UPDATE_FREQUENCY = 1000; // 1 second
  private readonly MAX_ERROR_COUNT = 3;
  private readonly CACHE_EXPIRY = 10000; // 10 seconds

  constructor(io: Server) {
    this.io = io;
    this.nse = new NseIndia();
    this.initializeCache();
  }

  private initializeCache() {
    // Initialize cache with sample data
    sampleStocks.forEach(stock => {
      this.cache[stock.symbol] = {
        data: { ...stock },
        lastUpdated: new Date(),
        errorCount: 0
      };
    });
  }

  public start() {
    console.log('Starting stock data service...');
    this.updateInterval = setInterval(() => {
      this.updateAllStocks();
    }, this.UPDATE_FREQUENCY);
  }

  public stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    console.log('Stock data service stopped');
  }

  private async updateAllStocks() {
    const symbols = Object.keys(this.cache);
    const updatePromises = symbols.map(symbol => this.updateStock(symbol));
    
    try {
      await Promise.allSettled(updatePromises);
      
      // Broadcast updated data to all connected clients
      const updatedStocks = Object.values(this.cache).map(item => item.data);
      this.io.to('stock-updates').emit('stocks-updated', updatedStocks);
    } catch (error) {
      console.error('Error updating stocks:', error);
    }
  }

  private async updateStock(symbol: string): Promise<void> {
    const cacheItem = this.cache[symbol];
    if (!cacheItem) return;

    // Skip if recently updated and no errors
    const timeSinceUpdate = Date.now() - cacheItem.lastUpdated.getTime();
    if (timeSinceUpdate < this.CACHE_EXPIRY && cacheItem.errorCount === 0) {
      return;
    }

    try {
      console.log(`Fetching live data for ${symbol}...`);
      const data = await this.nse.getEquityDetails(symbol);
      
      if (!data || !data.priceInfo) {
        throw new Error(`No data available for ${symbol}`);
      }

      // Extract relevant data with fallbacks
      const volume = data.preOpenMarket?.totalTradedVolume || 
                   cacheItem.data.volume;
      
      const price = data.priceInfo.lastPrice || cacheItem.data.price;
      const change = data.priceInfo.change || 0;
      const changePercent = data.priceInfo.pChange || 0;
      
      // Calculate market cap
      const issuedCap = data.securityInfo?.issuedCap || 0;
      const marketCap = issuedCap > 0 ? price * issuedCap : cacheItem.data.marketCap;

      // Update cache
      this.cache[symbol] = {
        data: {
          symbol,
          name: data.info?.companyName || cacheItem.data.name,
          price,
          change,
          changePercent,
          volume,
          marketCap,
          lastUpdated: new Date()
        },
        lastUpdated: new Date(),
        errorCount: 0
      };

      console.log(`Updated ${symbol}: ₹${price} (${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%)`);
      
    } catch (error) {
      console.error(`Error fetching data for ${symbol}:`, error);
      
      // Increment error count
      cacheItem.errorCount++;
      
      // If too many errors, use fallback data with simulated changes
      if (cacheItem.errorCount >= this.MAX_ERROR_COUNT) {
        this.simulateStockUpdate(symbol);
      }
    }
  }

  private simulateStockUpdate(symbol: string) {
    const cacheItem = this.cache[symbol];
    if (!cacheItem) return;

    // Simulate small price changes for demo purposes
    const currentPrice = cacheItem.data.price;
    const changePercent = (Math.random() - 0.5) * 4; // Random change between -2% to +2%
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
      errorCount: 0 // Reset error count after simulation
    };

    console.log(`Simulated update for ${symbol}: ₹${newPrice.toFixed(2)} (${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%)`);
  }

  public getStock(symbol: string): Stock | null {
    const cacheItem = this.cache[symbol];
    return cacheItem ? cacheItem.data : null;
  }

  public getAllStocks(): Stock[] {
    return Object.values(this.cache).map(item => item.data);
  }

  public addStock(stock: Stock) {
    this.cache[stock.symbol] = {
      data: { ...stock },
      lastUpdated: new Date(),
      errorCount: 0
    };
  }
}

let stockDataService: StockDataService | null = null;

export function startStockDataService(io: Server) {
  if (stockDataService) {
    stockDataService.stop();
  }
  
  stockDataService = new StockDataService(io);
  stockDataService.start();
  return stockDataService;
}

export function getStockDataService(): StockDataService | null {
  return stockDataService;
}

export function stopStockDataService() {
  if (stockDataService) {
    stockDataService.stop();
    stockDataService = null;
  }
} 