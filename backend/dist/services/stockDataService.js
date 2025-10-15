"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startStockDataService = startStockDataService;
exports.getStockDataService = getStockDataService;
exports.stopStockDataService = stopStockDataService;
const sampleStocks_1 = require("../data/sampleStocks");
const stock_nse_india_1 = require("stock-nse-india");
class StockDataService {
    constructor(io) {
        this.cache = {};
        this.updateInterval = null;
        this.UPDATE_FREQUENCY = 1000;
        this.MAX_ERROR_COUNT = 3;
        this.CACHE_EXPIRY = 10000;
        this.io = io;
        this.nse = new stock_nse_india_1.NseIndia();
        this.initializeCache();
    }
    initializeCache() {
        sampleStocks_1.sampleStocks.forEach(stock => {
            this.cache[stock.symbol] = {
                data: { ...stock },
                lastUpdated: new Date(),
                errorCount: 0
            };
        });
    }
    start() {
        console.log('Starting stock data service...');
        this.updateInterval = setInterval(() => {
            this.updateAllStocks();
        }, this.UPDATE_FREQUENCY);
    }
    stop() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        console.log('Stock data service stopped');
    }
    async updateAllStocks() {
        const symbols = Object.keys(this.cache);
        const updatePromises = symbols.map(symbol => this.updateStock(symbol));
        try {
            await Promise.allSettled(updatePromises);
            const updatedStocks = Object.values(this.cache).map(item => item.data);
            this.io.to('stock-updates').emit('stocks-updated', updatedStocks);
        }
        catch (error) {
            console.error('Error updating stocks:', error);
        }
    }
    async updateStock(symbol) {
        const cacheItem = this.cache[symbol];
        if (!cacheItem)
            return;
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
            const volume = data.preOpenMarket?.totalTradedVolume ||
                cacheItem.data.volume;
            const price = data.priceInfo.lastPrice || cacheItem.data.price;
            const change = data.priceInfo.change || 0;
            const changePercent = data.priceInfo.pChange || 0;
            const issuedCap = data.securityInfo?.issuedCap || 0;
            const marketCap = issuedCap > 0 ? price * issuedCap : cacheItem.data.marketCap;
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
        }
        catch (error) {
            console.error(`Error fetching data for ${symbol}:`, error);
            cacheItem.errorCount++;
            if (cacheItem.errorCount >= this.MAX_ERROR_COUNT) {
                this.simulateStockUpdate(symbol);
            }
        }
    }
    simulateStockUpdate(symbol) {
        const cacheItem = this.cache[symbol];
        if (!cacheItem)
            return;
        const currentPrice = cacheItem.data.price;
        const changePercent = (Math.random() - 0.5) * 4;
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
        console.log(`Simulated update for ${symbol}: ₹${newPrice.toFixed(2)} (${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%)`);
    }
    getStock(symbol) {
        const cacheItem = this.cache[symbol];
        return cacheItem ? cacheItem.data : null;
    }
    getAllStocks() {
        return Object.values(this.cache).map(item => item.data);
    }
    addStock(stock) {
        this.cache[stock.symbol] = {
            data: { ...stock },
            lastUpdated: new Date(),
            errorCount: 0
        };
    }
}
let stockDataService = null;
function startStockDataService(io) {
    if (stockDataService) {
        stockDataService.stop();
    }
    stockDataService = new StockDataService(io);
    stockDataService.start();
    return stockDataService;
}
function getStockDataService() {
    return stockDataService;
}
function stopStockDataService() {
    if (stockDataService) {
        stockDataService.stop();
        stockDataService = null;
    }
}
//# sourceMappingURL=stockDataService.js.map