import { Stock } from '../types/stock';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  hits: number;
  ttl: number;
}

export interface CacheStats {
  totalHits: number;
  totalMisses: number;
  hitRate: number;
  itemCount: number;
  memoryUsage: number;
}

export class CacheService<T = any> {
  private cache = new Map<string, CacheItem<T>>();
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0
  };
  
  private readonly maxSize: number;
  private readonly defaultTTL: number;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(maxSize: number = 1000, defaultTTL: number = 30000) {
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
    this.startCleanup();
  }

  /**
   * Store data in cache with optional TTL
   */
  set(key: string, data: T, ttl?: number): void {
    // Evict LRU item if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    const cacheItem: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      hits: 0,
      ttl: ttl || this.defaultTTL
    };

    this.cache.set(key, cacheItem);
  }

  /**
   * Retrieve data from cache
   */
  get(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      this.stats.misses++;
      return null;
    }

    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update hit count and timestamp for LRU
    item.hits++;
    item.timestamp = Date.now();
    this.stats.hits++;
    
    return item.data;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Delete specific key
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, evictions: 0 };
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
    
    return {
      totalHits: this.stats.hits,
      totalMisses: this.stats.misses,
      hitRate: Math.round(hitRate * 100) / 100,
      itemCount: this.cache.size,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  /**
   * Get or set pattern with fallback function
   */
  async getOrSet(key: string, fallbackFn: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = this.get(key);
    
    if (cached !== null) {
      return cached;
    }

    try {
      const data = await fallbackFn();
      this.set(key, data, ttl);
      return data;
    } catch (error) {
      console.error(`Cache fallback error for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Evict least recently used item
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, item] of this.cache) {
      if (item.timestamp < oldestTime) {
        oldestTime = item.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.evictions++;
    }
  }

  /**
   * Clean up expired items
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, item] of this.cache) {
      if (now - item.timestamp > item.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    
    if (keysToDelete.length > 0) {
      console.log(`🧹 Cache cleanup: removed ${keysToDelete.length} expired items`);
    }
  }

  /**
   * Start automatic cleanup interval
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000); // Clean every minute
  }

  /**
   * Stop automatic cleanup
   */
  public stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Estimate memory usage in bytes
   */
  private estimateMemoryUsage(): number {
    let totalSize = 0;
    
    for (const [key, item] of this.cache) {
      totalSize += key.length * 2; // String chars are 2 bytes
      totalSize += JSON.stringify(item.data).length * 2;
      totalSize += 24; // Approximate overhead for timestamp, hits, ttl
    }
    
    return totalSize;
  }

  /**
   * Get cache hit rate percentage
   */
  getHitRate(): number {
    const total = this.stats.hits + this.stats.misses;
    return total > 0 ? (this.stats.hits / total) * 100 : 0;
  }
}

// Stock-specific cache implementation
export class StockCacheService extends CacheService<Stock> {
  constructor() {
    super(500, 5000); // 500 stocks, 5 second TTL for real-time data
  }

  /**
   * Cache stock data with symbol as key
   */
  cacheStock(stock: Stock): void {
    this.set(stock.symbol, stock);
  }

  /**
   * Get cached stock by symbol
   */
  getStock(symbol: string): Stock | null {
    return this.get(symbol);
  }

  /**
   * Cache multiple stocks at once
   */
  cacheStocks(stocks: Stock[]): void {
    stocks.forEach(stock => this.cacheStock(stock));
  }

  /**
   * Get cached stocks by symbols
   */
  getStocks(symbols: string[]): { [symbol: string]: Stock } {
    const result: { [symbol: string]: Stock } = {};
    
    symbols.forEach(symbol => {
      const stock = this.getStock(symbol);
      if (stock) {
        result[symbol] = stock;
      }
    });
    
    return result;
  }
}

// Portfolio cache for user data
export class PortfolioCacheService extends CacheService<any> {
  constructor() {
    super(100, 10000); // 100 users, 10 second TTL for portfolio data
  }

  /**
   * Cache user portfolio
   */
  cacheUserPortfolio(userId: string, portfolio: any): void {
    this.set(`portfolio:${userId}`, portfolio);
  }

  /**
   * Get cached user portfolio
   */
  getUserPortfolio(userId: string): any | null {
    return this.get(`portfolio:${userId}`);
  }

  /**
   * Invalidate user portfolio cache
   */
  invalidateUserPortfolio(userId: string): void {
    this.delete(`portfolio:${userId}`);
  }
}

// Global cache instances
export const stockCache = new StockCacheService();
export const portfolioCache = new PortfolioCacheService();
export const generalCache = new CacheService();

// Cache monitoring and stats
export function getCacheStats() {
  return {
    stock: stockCache.getStats(),
    portfolio: portfolioCache.getStats(),
    general: generalCache.getStats(),
    timestamp: new Date().toISOString()
  };
} 