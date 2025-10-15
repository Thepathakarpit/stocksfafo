export declare class StockApp {
    private app;
    private server;
    private io;
    private dataStore;
    constructor();
    private setupMiddleware;
    private setupRoutes;
    private authMiddleware;
    private setupWebSocket;
    start(port?: number): void;
}
