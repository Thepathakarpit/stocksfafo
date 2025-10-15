"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const port = parseInt(process.env.PORT || '5000', 10);
const app = new app_1.StockApp();
app.start(port);
//# sourceMappingURL=server.js.map