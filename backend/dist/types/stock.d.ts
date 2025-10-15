export interface Stock {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    volume: number;
    marketCap: number;
    lastUpdated: Date;
}
export interface StockResponse {
    success: boolean;
    data: Stock[];
    message?: string;
}
