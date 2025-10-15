import { Request, Response, NextFunction } from 'express';
export declare const handleValidationErrors: (req: Request, res: Response, next: NextFunction) => void;
export declare const commonValidations: {
    email: import("express-validator").ValidationChain;
    password: import("express-validator").ValidationChain;
    firstName: import("express-validator").ValidationChain;
    lastName: import("express-validator").ValidationChain;
    stockSymbol: import("express-validator").ValidationChain;
    page: import("express-validator").ValidationChain;
    limit: import("express-validator").ValidationChain;
    search: import("express-validator").ValidationChain;
    sort: import("express-validator").ValidationChain;
    date: import("express-validator").ValidationChain;
    amount: import("express-validator").ValidationChain;
    quantity: import("express-validator").ValidationChain;
};
export declare const authValidations: {
    register: (import("express-validator").ValidationChain | ((req: Request, res: Response, next: NextFunction) => void))[];
    login: (import("express-validator").ValidationChain | ((req: Request, res: Response, next: NextFunction) => void))[];
};
export declare const stockValidations: {
    getStock: (import("express-validator").ValidationChain | ((req: Request, res: Response, next: NextFunction) => void))[];
    searchStocks: (import("express-validator").ValidationChain | ((req: Request, res: Response, next: NextFunction) => void))[];
};
export declare const portfolioValidations: {
    addStock: (import("express-validator").ValidationChain | ((req: Request, res: Response, next: NextFunction) => void))[];
    updateStock: (import("express-validator").ValidationChain | ((req: Request, res: Response, next: NextFunction) => void))[];
    removeStock: (import("express-validator").ValidationChain | ((req: Request, res: Response, next: NextFunction) => void))[];
};
export declare const stockListValidations: (import("express-validator").ValidationChain | ((req: Request, res: Response, next: NextFunction) => void))[];
