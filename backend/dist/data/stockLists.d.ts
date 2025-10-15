export interface StockSymbol {
    symbol: string;
    name: string;
    sector: string;
    marketCap?: string;
    weight?: number;
}
export declare const NIFTY_50: StockSymbol[];
export declare const SENSEX_30: StockSymbol[];
export declare const NIFTY_500_ADDITIONAL: StockSymbol[];
export declare function getAllNifty50(): StockSymbol[];
export declare function getAllSensex30(): StockSymbol[];
export declare function getAllNifty500(): StockSymbol[];
export declare function getStocksByMarketCap(marketCap: string): StockSymbol[];
export declare function getStocksBySector(sector: string): StockSymbol[];
export declare function getTopNStocks(n: number, list?: 'nifty50' | 'sensex30' | 'nifty500'): StockSymbol[];
export declare const STOCK_LIST_INFO: {
    nifty50: {
        count: number;
        description: string;
        updateFrequency: string;
    };
    sensex30: {
        count: number;
        description: string;
        updateFrequency: string;
    };
    nifty500: {
        count: number;
        description: string;
        updateFrequency: string;
    };
};
