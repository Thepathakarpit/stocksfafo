"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const stock_nse_india_1 = require("stock-nse-india");
const stockLists_1 = require("../data/stockLists");
const cacheService_1 = require("./cacheService");
class ScalableStockDataService {
    constructor(io, userService) {
        this.cache = {};
        this.updateInterval = null;
        this.batchQueue = [];
        this.isProcessing = false;
        this.SCALING_CONFIG = {
            enabled: true,
            maxStocks: 500,
            batchConfigs: {
                small: { size: 5, intervalMs: 1000, maxConcurrent: 2 },
                medium: { size: 10, intervalMs: 2000, maxConcurrent: 3 },
                large: { size: 15, intervalMs: 3000, maxConcurrent: 5 }
            }
        };
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
        this.MAX_ERROR_COUNT = 5;
        this.CACHE_EXPIRY_MS = 30000;
        this.HIGH_PRIORITY_INTERVAL = 2;
        this.MEMORY_CLEANUP_INTERVAL = 300000;
        this.io = io;
        this.nse = new stock_nse_india_1.NseIndia();
        this.userService = userService;
        this.setupMemoryCleanup();
    }
    async start(stockListType = 'nifty50', customCount) {
        console.log(`🚀 Starting Scalable Stock Data Service for ${stockListType.toUpperCase()}`);
        await this.initializeStocks(stockListType, customCount);
        this.startBatchProcessing();
        console.log(`✅ Service started with ${this.stats.activeStocks} stocks`);
        this.logPerformanceStats();
    }
    stop() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        this.isProcessing = false;
        console.log('🛑 Scalable Stock Data Service stopped');
    }
    async initializeStocks(stockListType, customCount) {
        let stockList;
        switch (stockListType) {
            case 'sensex30':
                stockList = (0, stockLists_1.getAllSensex30)();
                break;
            case 'nifty500':
                stockList = (0, stockLists_1.getAllNifty500)();
                break;
            default:
                stockList = (0, stockLists_1.getAllNifty50)();
        }
        if (customCount && customCount > 0) {
            stockList = stockList.slice(0, customCount);
        }
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
                lastUpdated: new Date(0),
                errorCount: 0,
                priority
            };
        });
        this.stats.activeStocks = Object.keys(this.cache).length;
        console.log(`📊 Initialized ${this.stats.activeStocks} stocks with priority system`);
    }
    calculatePriority(stockSymbol, index) {
        let priority = 100 - index;
        if (stockSymbol.marketCap === 'Large')
            priority += 20;
        if (stockSymbol.weight && stockSymbol.weight > 5)
            priority += 15;
        const highVolumeSectors = ['Banking', 'IT Services', 'FMCG', 'Oil & Gas'];
        if (highVolumeSectors.includes(stockSymbol.sector))
            priority += 10;
        return Math.max(1, priority);
    }
    getBatchConfig() {
        const stockCount = this.stats.activeStocks;
        if (stockCount <= 50) {
            return this.SCALING_CONFIG.batchConfigs.small;
        }
        else if (stockCount <= 200) {
            return this.SCALING_CONFIG.batchConfigs.medium;
        }
        else {
            return this.SCALING_CONFIG.batchConfigs.large;
        }
    }
    startBatchProcessing() {
        const config = this.getBatchConfig();
        console.log(`⚙️ Starting batch processing: ${config.size} stocks per batch, ${config.intervalMs}ms interval`);
        this.updateInterval = setInterval(() => {
            if (!this.isProcessing) {
                this.processBatch();
            }
        }, config.intervalMs);
    }
    async processBatch() {
        this.isProcessing = true;
        const startTime = Date.now();
        try {
            const batchSymbols = this.getNextBatch();
            if (batchSymbols.length === 0) {
                this.isProcessing = false;
                return;
            }
            const config = this.getBatchConfig();
            const promises = batchSymbols.map((symbol, index) => this.delayedUpdate(symbol, index * 100));
            const chunks = this.chunkArray(promises, config.maxConcurrent);
            for (const chunk of chunks) {
                await Promise.allSettled(chunk);
            }
            await this.broadcastUpdates();
            this.stats.lastBatchTime = Date.now() - startTime;
            this.updatePerformanceStats();
        }
        catch (error) {
            console.error('❌ Batch processing error:', error);
        }
        finally {
            this.isProcessing = false;
        }
    }
    getNextBatch() {
        const config = this.getBatchConfig();
        const allSymbols = Object.keys(this.cache);
        const symbolsNeedingUpdate = allSymbols
            .filter(symbol => this.shouldUpdateStock(symbol))
            .sort((a, b) => {
            const itemA = this.cache[a];
            const itemB = this.cache[b];
            if (!itemA || !itemB)
                return 0;
            const priorityA = itemA.priority;
            const priorityB = itemB.priority;
            const ageA = Date.now() - itemA.lastUpdated.getTime();
            const ageB = Date.now() - itemB.lastUpdated.getTime();
            return (priorityB - priorityA) || (ageB - ageA);
        });
        return symbolsNeedingUpdate.slice(0, config.size);
    }
    shouldUpdateStock(symbol) {
        const cacheItem = this.cache[symbol];
        if (!cacheItem)
            return false;
        const timeSinceUpdate = Date.now() - cacheItem.lastUpdated.getTime();
        const isHighPriority = cacheItem.priority > 80;
        const updateThreshold = isHighPriority ?
            this.CACHE_EXPIRY_MS / 2 :
            this.CACHE_EXPIRY_MS;
        return timeSinceUpdate > updateThreshold || cacheItem.errorCount > 0;
    }
    async delayedUpdate(symbol, delayMs) {
        if (delayMs > 0) {
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
        return this.updateStock(symbol);
    }
    async updateStock(symbol) {
        const cacheItem = this.cache[symbol];
        if (!cacheItem)
            return;
        const cachedStock = cacheService_1.stockCache.getStock(symbol);
        if (cachedStock) {
            console.log(`📋 Cache hit for ${symbol}`);
            this.stats.cacheHits++;
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
            const price = data.priceInfo.lastPrice || cacheItem.data.price;
            const change = data.priceInfo.change || 0;
            const changePercent = data.priceInfo.pChange || 0;
            const volume = data.preOpenMarket?.totalTradedVolume || cacheItem.data.volume;
            const issuedCap = data.securityInfo?.issuedCap || 0;
            const marketCap = issuedCap > 0 ? price * issuedCap : cacheItem.data.marketCap;
            const stockData = {
                symbol,
                name: data.info?.companyName || cacheItem.data.name,
                price,
                change,
                changePercent,
                volume,
                marketCap,
                lastUpdated: new Date()
            };
            this.cache[symbol] = {
                ...cacheItem,
                data: stockData,
                lastUpdated: new Date(),
                errorCount: 0
            };
            cacheService_1.stockCache.cacheStock(stockData);
            this.stats.successfulRequests++;
            const responseTime = Date.now() - startTime;
            this.stats.averageResponseTime =
                (this.stats.averageResponseTime + responseTime) / 2;
        }
        catch (error) {
            console.error(`❌ Error updating ${symbol}:`, error);
            cacheItem.errorCount++;
            this.stats.failedRequests++;
            if (cacheItem.errorCount >= this.MAX_ERROR_COUNT) {
                this.simulateStockUpdate(symbol);
            }
        }
    }
    simulateStockUpdate(symbol) {
        const cacheItem = this.cache[symbol];
        if (!cacheItem)
            return;
        const currentPrice = cacheItem.data.price || 1000;
        const volatility = 0.02;
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
            errorCount: 0
        };
    }
    async broadcastUpdates() {
        const updatedStocks = Object.values(this.cache).map(item => item.data);
        this.io.to('stock-updates').emit('stocks-updated', updatedStocks);
        const portfoliosUpdated = await this.updateUserPortfolios(updatedStocks);
        if (portfoliosUpdated) {
            this.io.to('stock-updates').emit('portfolios-updated');
        }
    }
    async updateUserPortfolios(stocks) {
        try {
            const stockPrices = {};
            stocks.forEach(stock => {
                stockPrices[stock.symbol] = stock.price;
            });
            const updated = await this.userService.updateAllUsersStockPrices(stockPrices);
            return updated;
        }
        catch (error) {
            console.error('❌ Error updating user portfolios:', error);
            return false;
        }
    }
    chunkArray(array, chunkSize) {
        const chunks = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }
    updatePerformanceStats() {
        const successRate = this.stats.totalRequests > 0 ?
            (this.stats.successfulRequests / this.stats.totalRequests) * 100 : 0;
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
    setupMemoryCleanup() {
        setInterval(() => {
            if (global.gc) {
                global.gc();
            }
            const cutoffTime = Date.now() - (24 * 60 * 60 * 1000);
            Object.keys(this.cache).forEach(symbol => {
                const item = this.cache[symbol];
                if (item && item.lastUpdated.getTime() < cutoffTime && item.errorCount > 10) {
                    delete this.cache[symbol];
                }
            });
        }, this.MEMORY_CLEANUP_INTERVAL);
    }
    logPerformanceStats() {
        const config = this.getBatchConfig();
        console.log(`🎯 Performance Configuration:`, {
            stockCount: this.stats.activeStocks,
            batchSize: config.size,
            batchInterval: `${config.intervalMs}ms`,
            maxConcurrent: config.maxConcurrent,
            estimatedUpdatesPerMinute: Math.floor(60000 / config.intervalMs) * config.size
        });
    }
    testSetPrices(priceUpdates) {
        priceUpdates.forEach(({ symbol, newPrice }) => {
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
        this.broadcastUpdates();
    }
    async forcePortfolioUpdate() {
        console.log('🔄 Forcing portfolio update with current prices...');
        await this.broadcastUpdates();
    }
    forceSimulation(symbols) {
        symbols.forEach(symbol => {
            const cacheItem = this.cache[symbol];
            if (cacheItem) {
                cacheItem.errorCount = this.MAX_ERROR_COUNT + 1;
                this.simulateStockUpdate(symbol);
            }
        });
    }
    getStock(symbol) {
        const cachedStock = cacheService_1.stockCache.getStock(symbol);
        if (cachedStock) {
            return cachedStock;
        }
        const cacheItem = this.cache[symbol];
        return cacheItem ? cacheItem.data : null;
    }
    getAllStocks() {
        const stocks = [];
        Object.keys(this.cache).forEach(symbol => {
            const stock = this.getStock(symbol);
            if (stock) {
                stocks.push(stock);
            }
        });
        return stocks;
    }
    getPerformanceStats() {
        const cacheStats = (0, cacheService_1.getCacheStats)();
        return {
            ...this.stats,
            cache: cacheStats,
            cacheHitRate: this.stats.cacheHits > 0 ?
                (this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses)) * 100 : 0
        };
    }
    getActiveStockCount() {
        return this.stats.activeStocks;
    }
    switchStockList(stockListType, customCount) {
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
exports.default = ScalableStockDataService;
//# sourceMappingURL=scalableStockDataService.js.map