export interface JwtPayload {
    userId: string;
    email: string;
}
export declare const generateToken: (userId: string, email: string) => string;
export declare const verifyToken: (token: string) => JwtPayload;
export declare const hashPassword: (password: string) => Promise<string>;
export declare const comparePassword: (password: string, hashedPassword: string) => Promise<boolean>;
export declare const generateUserId: () => string;
export declare const generateTransactionId: () => string;
export declare const isValidEmail: (email: string) => boolean;
export declare const isValidPassword: (password: string) => {
    valid: boolean;
    message: string;
};
