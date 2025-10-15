"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
router.get('/', (req, res) => {
    try {
        const stockService = req.app.get('stockService');
        if (!stockService) {
            return res.status(500).json({
                success: false,
                data: [],
                message: 'Stock data service not available'
            });
        }
        const stocks = stockService.getAllStocks();
        const response = {
            success: true,
            data: stocks,
            message: `${stocks.length} stocks retrieved successfully`
        };
        return res.json(response);
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            data: [],
            message: 'Error retrieving stocks'
        });
    }
});
router.get('/:symbol', (req, res) => {
    try {
        const { symbol } = req.params;
        const stockService = req.app.get('stockService');
        if (!stockService) {
            return res.status(500).json({
                success: false,
                data: null,
                message: 'Stock data service not available'
            });
        }
        const stock = stockService.getStock(symbol.toUpperCase());
        if (!stock) {
            return res.status(404).json({
                success: false,
                data: null,
                message: `Stock ${symbol.toUpperCase()} not found in current list`
            });
        }
        return res.json({
            success: true,
            data: stock,
            message: 'Stock retrieved successfully'
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            data: null,
            message: 'Error retrieving stock'
        });
    }
});
router.get('/live/:symbol', async (req, res) => {
    const { symbol } = req.params;
    try {
        const stockService = req.app.get('stockService');
        if (!stockService) {
            return res.status(500).json({
                success: false,
                data: null,
                message: 'Stock data service not available'
            });
        }
        const stock = stockService.getStock(symbol.toUpperCase());
        if (!stock) {
            return res.status(404).json({
                success: false,
                data: null,
                message: `Stock ${symbol.toUpperCase()} not found or data unavailable`
            });
        }
        return res.json({
            success: true,
            data: stock,
            message: 'Live stock data retrieved successfully from cache'
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            data: null,
            message: 'Error fetching live stock data'
        });
    }
});
router.get('/sector/:sector', (req, res) => {
    try {
        const { sector } = req.params;
        const stockService = req.app.get('stockService');
        if (!stockService) {
            return res.status(500).json({
                success: false,
                data: [],
                message: 'Stock data service not available'
            });
        }
        const allStocks = stockService.getAllStocks();
        const sectorStocks = allStocks.filter(stock => stock.name.toLowerCase().includes(sector.toLowerCase()));
        return res.json({
            success: true,
            data: sectorStocks,
            message: `${sectorStocks.length} stocks found for sector: ${sector}`
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            data: [],
            message: 'Error retrieving sector stocks'
        });
    }
});
router.get('/performance/top/:count', (req, res) => {
    try {
        const count = parseInt(req.params.count) || 10;
        const stockService = req.app.get('stockService');
        if (!stockService) {
            return res.status(500).json({
                success: false,
                data: [],
                message: 'Stock data service not available'
            });
        }
        const allStocks = stockService.getAllStocks();
        const topPerformers = allStocks
            .sort((a, b) => b.changePercent - a.changePercent)
            .slice(0, count);
        return res.json({
            success: true,
            data: topPerformers,
            message: `Top ${count} performing stocks`
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            data: [],
            message: 'Error retrieving top performing stocks'
        });
    }
});
router.get('/performance/worst/:count', (req, res) => {
    try {
        const count = parseInt(req.params.count) || 10;
        const stockService = req.app.get('stockService');
        if (!stockService) {
            return res.status(500).json({
                success: false,
                data: [],
                message: 'Stock data service not available'
            });
        }
        const allStocks = stockService.getAllStocks();
        const worstPerformers = allStocks
            .sort((a, b) => a.changePercent - b.changePercent)
            .slice(0, count);
        return res.json({
            success: true,
            data: worstPerformers,
            message: `Worst ${count} performing stocks`
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            data: [],
            message: 'Error retrieving worst performing stocks'
        });
    }
});
exports.default = router;
//# sourceMappingURL=stocks.js.map