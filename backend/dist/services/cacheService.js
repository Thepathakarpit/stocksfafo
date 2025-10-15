"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generalCache = exports.portfolioCache = exports.stockCache = exports.PortfolioCacheService = exports.StockCacheService = exports.CacheService = void 0;
exports.getCacheStats = getCacheStats;
class CacheService {
    constructor(maxSize = 1000, defaultTTL = 30000) {
        this.cache = new Map();
        this.stats = {
            hits: 0,
            misses: 0,
            evictions: 0
        };
        this.cleanupInterval = null;
        this.maxSize = maxSize;
        this.defaultTTL = defaultTTL;
        this.startCleanup();
    }
    set(key, data, ttl) {
        if (this.cache.size >= this.maxSize) {
            this.evictLRU();
        }
        const cacheItem = {
            data,
            timestamp: Date.now(),
            hits: 0,
            ttl: ttl || this.defaultTTL
        };
        this.cache.set(key, cacheItem);
    }
    get(key) {
        const item = this.cache.get(key);
        if (!item) {
            this.stats.misses++;
            return null;
        }
        if (Date.now() - item.timestamp > item.ttl) {
            this.cache.delete(key);
            this.stats.misses++;
            return null;
        }
        item.hits++;
        item.timestamp = Date.now();
        this.stats.hits++;
        return item.data;
    }
    has(key) {
        return this.get(key) !== null;
    }
    delete(key) {
        return this.cache.delete(key);
    }
    clear() {
        this.cache.clear();
        this.stats = { hits: 0, misses: 0, evictions: 0 };
    }
    getStats() {
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
    async getOrSet(key, fallbackFn, ttl) {
        const cached = this.get(key);
        if (cached !== null) {
            return cached;
        }
        try {
            const data = await fallbackFn();
            this.set(key, data, ttl);
            return data;
        }
        catch (error) {
            console.error(`Cache fallback error for key ${key}:`, error);
            throw error;
        }
    }
    evictLRU() {
        let oldestKey = null;
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
    cleanup() {
        const now = Date.now();
        const keysToDelete = [];
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
    startCleanup() {
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 60000);
    }
    stopCleanup() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }
    estimateMemoryUsage() {
        let totalSize = 0;
        for (const [key, item] of this.cache) {
            totalSize += key.length * 2;
            totalSize += JSON.stringify(item.data).length * 2;
            totalSize += 24;
        }
        return totalSize;
    }
    getHitRate() {
        const total = this.stats.hits + this.stats.misses;
        return total > 0 ? (this.stats.hits / total) * 100 : 0;
    }
}
exports.CacheService = CacheService;
class StockCacheService extends CacheService {
    constructor() {
        super(500, 5000);
    }
    cacheStock(stock) {
        this.set(stock.symbol, stock);
    }
    getStock(symbol) {
        return this.get(symbol);
    }
    cacheStocks(stocks) {
        stocks.forEach(stock => this.cacheStock(stock));
    }
    getStocks(symbols) {
        const result = {};
        symbols.forEach(symbol => {
            const stock = this.getStock(symbol);
            if (stock) {
                result[symbol] = stock;
            }
        });
        return result;
    }
}
exports.StockCacheService = StockCacheService;
class PortfolioCacheService extends CacheService {
    constructor() {
        super(100, 10000);
    }
    cacheUserPortfolio(userId, portfolio) {
        this.set(`portfolio:${userId}`, portfolio);
    }
    getUserPortfolio(userId) {
        return this.get(`portfolio:${userId}`);
    }
    invalidateUserPortfolio(userId) {
        this.delete(`portfolio:${userId}`);
    }
}
exports.PortfolioCacheService = PortfolioCacheService;
exports.stockCache = new StockCacheService();
exports.portfolioCache = new PortfolioCacheService();
exports.generalCache = new CacheService();
function getCacheStats() {
    return {
        stock: exports.stockCache.getStats(),
        portfolio: exports.portfolioCache.getStats(),
        general: exports.generalCache.getStats(),
        timestamp: new Date().toISOString()
    };
}
//# sourceMappingURL=cacheService.js.map