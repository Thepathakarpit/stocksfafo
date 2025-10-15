export declare const config: {
    readonly env: "development" | "production" | "test";
    readonly port: number;
    readonly frontendUrl: string;
    readonly database: {
        readonly uri: string;
    };
    readonly redis: {
        readonly url: string;
    };
    readonly jwt: {
        readonly secret: string;
        readonly expiresIn: string;
    };
    readonly rateLimit: {
        readonly windowMs: number;
        readonly maxRequests: number;
    };
    readonly stockData: {
        readonly defaultList: "nifty50" | "sensex30" | "nifty500";
        readonly defaultCount: number | undefined;
    };
    readonly logging: {
        readonly level: "error" | "warn" | "info" | "debug";
    };
    readonly security: {
        readonly corsOrigin: string;
        readonly helmetEnabled: boolean;
    };
    readonly performance: {
        readonly compressionEnabled: boolean;
        readonly cacheTtl: number;
    };
    readonly isDevelopment: boolean;
    readonly isProduction: boolean;
    readonly isTest: boolean;
};
export type Config = typeof config;
