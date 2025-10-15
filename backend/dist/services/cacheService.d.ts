import { Stock } from '../types/stock';
export interface CacheStats {
    totalHits: number;
    totalMisses: number;
    hitRate: number;
    itemCount: number;
    memoryUsage: number;
}
export declare class CacheService<T = any> {
    private cache;
    private stats;
    private readonly maxSize;
    private readonly defaultTTL;
    private cleanupInterval;
    constructor(maxSize?: number, defaultTTL?: number);
    set(key: string, data: T, ttl?: number): void;
    get(key: string): T | null;
    has(key: string): boolean;
    delete(key: string): boolean;
    clear(): void;
    getStats(): CacheStats;
    getOrSet(key: string, fallbackFn: () => Promise<T>, ttl?: number): Promise<T>;
    private evictLRU;
    private cleanup;
    private startCleanup;
    stopCleanup(): void;
    private estimateMemoryUsage;
    getHitRate(): number;
}
export declare class StockCacheService extends CacheService<Stock> {
    constructor();
    cacheStock(stock: Stock): void;
    getStock(symbol: string): Stock | null;
    cacheStocks(stocks: Stock[]): void;
    getStocks(symbols: string[]): {
        [symbol: string]: Stock;
    };
}
export declare class PortfolioCacheService extends CacheService<any> {
    constructor();
    cacheUserPortfolio(userId: string, portfolio: any): void;
    getUserPortfolio(userId: string): any | null;
    invalidateUserPortfolio(userId: string): void;
}
export declare const stockCache: StockCacheService;
export declare const portfolioCache: PortfolioCacheService;
export declare const generalCache: CacheService<any>;
export declare function getCacheStats(): {
    stock: CacheStats;
    portfolio: CacheStats;
    general: CacheStats;
    timestamp: string;
};
