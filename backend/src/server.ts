import { StockApp } from './app';

const port = parseInt(process.env.PORT || '5000', 10);
const app = new StockApp();
app.start(port); 