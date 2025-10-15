import { Server } from 'socket.io';
import { Stock } from '../types/stock';
declare class StockDataService {
    private io;
    private cache;
    private nse;
    private updateInterval;
    private readonly UPDATE_FREQUENCY;
    private readonly MAX_ERROR_COUNT;
    private readonly CACHE_EXPIRY;
    constructor(io: Server);
    private initializeCache;
    start(): void;
    stop(): void;
    private updateAllStocks;
    private updateStock;
    private simulateStockUpdate;
    getStock(symbol: string): Stock | null;
    getAllStocks(): Stock[];
    addStock(stock: Stock): void;
}
export declare function startStockDataService(io: Server): StockDataService;
export declare function getStockDataService(): StockDataService | null;
export declare function stopStockDataService(): void;
export {};
