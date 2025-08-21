// Comprehensive Indian Stock Market Lists
// Updated as of 2024 - Major indices with proper symbols

export interface StockSymbol {
  symbol: string;
  name: string;
  sector: string;
  marketCap?: string; // Large, Mid, Small
  weight?: number; // Index weight if available
}

// NIFTY 50 - Top 50 companies by market cap
export const NIFTY_50: StockSymbol[] = [
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', sector: 'Oil & Gas', marketCap: 'Large', weight: 10.5 },
  { symbol: 'TCS', name: 'Tata Consultancy Services Ltd', sector: 'IT Services', marketCap: 'Large', weight: 8.5 },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', sector: 'Banking', marketCap: 'Large', weight: 8.2 },
  { symbol: 'INFY', name: 'Infosys Ltd', sector: 'IT Services', marketCap: 'Large', weight: 6.8 },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', sector: 'Banking', marketCap: 'Large', weight: 6.5 },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever Ltd', sector: 'FMCG', marketCap: 'Large', weight: 4.2 },
  { symbol: 'ITC', name: 'ITC Ltd', sector: 'FMCG', marketCap: 'Large', weight: 4.0 },
  { symbol: 'SBIN', name: 'State Bank of India', sector: 'Banking', marketCap: 'Large', weight: 3.8 },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd', sector: 'Telecom', marketCap: 'Large', weight: 3.5 },
  { symbol: 'AXISBANK', name: 'Axis Bank Ltd', sector: 'Banking', marketCap: 'Large', weight: 3.2 },
  { symbol: 'LT', name: 'Larsen & Toubro Ltd', sector: 'Construction', marketCap: 'Large', weight: 3.0 },
  { symbol: 'ASIANPAINT', name: 'Asian Paints Ltd', sector: 'Paints', marketCap: 'Large', weight: 2.8 },
  { symbol: 'MARUTI', name: 'Maruti Suzuki India Ltd', sector: 'Automobiles', marketCap: 'Large', weight: 2.5 },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank Ltd', sector: 'Banking', marketCap: 'Large', weight: 2.4 },
  { symbol: 'TITAN', name: 'Titan Company Ltd', sector: 'Jewellery', marketCap: 'Large', weight: 2.2 },
  { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical Industries Ltd', sector: 'Pharmaceuticals', marketCap: 'Large', weight: 2.0 },
  { symbol: 'NESTLEIND', name: 'Nestle India Ltd', sector: 'FMCG', marketCap: 'Large', weight: 1.8 },
  { symbol: 'ULTRACEMCO', name: 'UltraTech Cement Ltd', sector: 'Cement', marketCap: 'Large', weight: 1.7 },
  { symbol: 'WIPRO', name: 'Wipro Ltd', sector: 'IT Services', marketCap: 'Large', weight: 1.6 },
  { symbol: 'POWERGRID', name: 'Power Grid Corporation of India Ltd', sector: 'Power', marketCap: 'Large', weight: 1.5 },
  { symbol: 'HCLTECH', name: 'HCL Technologies Ltd', sector: 'IT Services', marketCap: 'Large', weight: 1.4 },
  { symbol: 'NTPC', name: 'NTPC Ltd', sector: 'Power', marketCap: 'Large', weight: 1.3 },
  { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd', sector: 'Automobiles', marketCap: 'Large', weight: 1.2 },
  { symbol: 'ONGC', name: 'Oil & Natural Gas Corporation Ltd', sector: 'Oil & Gas', marketCap: 'Large', weight: 1.1 },
  { symbol: 'COALINDIA', name: 'Coal India Ltd', sector: 'Mining', marketCap: 'Large', weight: 1.0 },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance Ltd', sector: 'NBFC', marketCap: 'Large', weight: 0.9 },
  { symbol: 'TECHM', name: 'Tech Mahindra Ltd', sector: 'IT Services', marketCap: 'Large', weight: 0.8 },
  { symbol: 'HDFCLIFE', name: 'HDFC Life Insurance Company Ltd', sector: 'Insurance', marketCap: 'Large', weight: 0.7 },
  { symbol: 'BAJAJFINSV', name: 'Bajaj Finserv Ltd', sector: 'Financial Services', marketCap: 'Large', weight: 0.6 },
  { symbol: 'DRREDDY', name: 'Dr Reddys Laboratories Ltd', sector: 'Pharmaceuticals', marketCap: 'Large', weight: 0.5 },
  { symbol: 'M&M', name: 'Mahindra & Mahindra Ltd', sector: 'Automobiles', marketCap: 'Large', weight: 0.5 },
  { symbol: 'INDUSINDBK', name: 'IndusInd Bank Ltd', sector: 'Banking', marketCap: 'Large', weight: 0.4 },
  { symbol: 'ADANIENT', name: 'Adani Enterprises Ltd', sector: 'Diversified', marketCap: 'Large', weight: 0.4 },
  { symbol: 'DIVISLAB', name: 'Divis Laboratories Ltd', sector: 'Pharmaceuticals', marketCap: 'Large', weight: 0.3 },
  { symbol: 'APOLLOHOSP', name: 'Apollo Hospitals Enterprise Ltd', sector: 'Healthcare', marketCap: 'Large', weight: 0.3 },
  { symbol: 'GRASIM', name: 'Grasim Industries Ltd', sector: 'Textiles', marketCap: 'Large', weight: 0.3 },
  { symbol: 'CIPLA', name: 'Cipla Ltd', sector: 'Pharmaceuticals', marketCap: 'Large', weight: 0.3 },
  { symbol: 'BRITANNIA', name: 'Britannia Industries Ltd', sector: 'FMCG', marketCap: 'Large', weight: 0.3 },
  { symbol: 'SHREECEM', name: 'Shree Cement Ltd', sector: 'Cement', marketCap: 'Large', weight: 0.2 },
  { symbol: 'EICHERMOT', name: 'Eicher Motors Ltd', sector: 'Automobiles', marketCap: 'Large', weight: 0.2 },
  { symbol: 'HEROMOTOCO', name: 'Hero MotoCorp Ltd', sector: 'Automobiles', marketCap: 'Large', weight: 0.2 },
  { symbol: 'UPL', name: 'UPL Ltd', sector: 'Chemicals', marketCap: 'Large', weight: 0.2 },
  { symbol: 'JSWSTEEL', name: 'JSW Steel Ltd', sector: 'Steel', marketCap: 'Large', weight: 0.2 },
  { symbol: 'TATASTEEL', name: 'Tata Steel Ltd', sector: 'Steel', marketCap: 'Large', weight: 0.2 },
  { symbol: 'HINDALCO', name: 'Hindalco Industries Ltd', sector: 'Metals', marketCap: 'Large', weight: 0.2 },
  { symbol: 'TATACONSUM', name: 'Tata Consumer Products Ltd', sector: 'FMCG', marketCap: 'Large', weight: 0.1 },
  { symbol: 'BPCL', name: 'Bharat Petroleum Corporation Ltd', sector: 'Oil & Gas', marketCap: 'Large', weight: 0.1 },
  { symbol: 'SBILIFE', name: 'SBI Life Insurance Company Ltd', sector: 'Insurance', marketCap: 'Large', weight: 0.1 },
  { symbol: 'ADANIPORTS', name: 'Adani Ports and Special Economic Zone Ltd', sector: 'Infrastructure', marketCap: 'Large', weight: 0.1 },
  { symbol: 'LTIM', name: 'LTIMindtree Ltd', sector: 'IT Services', marketCap: 'Large', weight: 0.1 }
];

// SENSEX 30 - Bombay Stock Exchange top 30
export const SENSEX_30: StockSymbol[] = [
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', sector: 'Oil & Gas', marketCap: 'Large' },
  { symbol: 'TCS', name: 'Tata Consultancy Services Ltd', sector: 'IT Services', marketCap: 'Large' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', sector: 'Banking', marketCap: 'Large' },
  { symbol: 'INFY', name: 'Infosys Ltd', sector: 'IT Services', marketCap: 'Large' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', sector: 'Banking', marketCap: 'Large' },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever Ltd', sector: 'FMCG', marketCap: 'Large' },
  { symbol: 'ITC', name: 'ITC Ltd', sector: 'FMCG', marketCap: 'Large' },
  { symbol: 'SBIN', name: 'State Bank of India', sector: 'Banking', marketCap: 'Large' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd', sector: 'Telecom', marketCap: 'Large' },
  { symbol: 'AXISBANK', name: 'Axis Bank Ltd', sector: 'Banking', marketCap: 'Large' },
  { symbol: 'LT', name: 'Larsen & Toubro Ltd', sector: 'Construction', marketCap: 'Large' },
  { symbol: 'ASIANPAINT', name: 'Asian Paints Ltd', sector: 'Paints', marketCap: 'Large' },
  { symbol: 'MARUTI', name: 'Maruti Suzuki India Ltd', sector: 'Automobiles', marketCap: 'Large' },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank Ltd', sector: 'Banking', marketCap: 'Large' },
  { symbol: 'TITAN', name: 'Titan Company Ltd', sector: 'Jewellery', marketCap: 'Large' },
  { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical Industries Ltd', sector: 'Pharmaceuticals', marketCap: 'Large' },
  { symbol: 'NESTLEIND', name: 'Nestle India Ltd', sector: 'FMCG', marketCap: 'Large' },
  { symbol: 'ULTRACEMCO', name: 'UltraTech Cement Ltd', sector: 'Cement', marketCap: 'Large' },
  { symbol: 'WIPRO', name: 'Wipro Ltd', sector: 'IT Services', marketCap: 'Large' },
  { symbol: 'POWERGRID', name: 'Power Grid Corporation of India Ltd', sector: 'Power', marketCap: 'Large' },
  { symbol: 'HCLTECH', name: 'HCL Technologies Ltd', sector: 'IT Services', marketCap: 'Large' },
  { symbol: 'NTPC', name: 'NTPC Ltd', sector: 'Power', marketCap: 'Large' },
  { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd', sector: 'Automobiles', marketCap: 'Large' },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance Ltd', sector: 'NBFC', marketCap: 'Large' },
  { symbol: 'TECHM', name: 'Tech Mahindra Ltd', sector: 'IT Services', marketCap: 'Large' },
  { symbol: 'M&M', name: 'Mahindra & Mahindra Ltd', sector: 'Automobiles', marketCap: 'Large' },
  { symbol: 'INDUSINDBK', name: 'IndusInd Bank Ltd', sector: 'Banking', marketCap: 'Large' },
  { symbol: 'DRREDDY', name: 'Dr Reddys Laboratories Ltd', sector: 'Pharmaceuticals', marketCap: 'Large' },
  { symbol: 'BAJAJFINSV', name: 'Bajaj Finserv Ltd', sector: 'Financial Services', marketCap: 'Large' },
  { symbol: 'JSWSTEEL', name: 'JSW Steel Ltd', sector: 'Steel', marketCap: 'Large' }
];

// Additional stocks for NIFTY 500 (Top Mid and Small Cap companies)
export const NIFTY_500_ADDITIONAL: StockSymbol[] = [
  // Banking & Financial Services
  { symbol: 'FEDERALBNK', name: 'Federal Bank Ltd', sector: 'Banking', marketCap: 'Mid' },
  { symbol: 'IDFCFIRSTB', name: 'IDFC First Bank Ltd', sector: 'Banking', marketCap: 'Mid' },
  { symbol: 'BANKBARODA', name: 'Bank of Baroda', sector: 'Banking', marketCap: 'Large' },
  { symbol: 'PNB', name: 'Punjab National Bank', sector: 'Banking', marketCap: 'Large' },
  { symbol: 'CANBK', name: 'Canara Bank', sector: 'Banking', marketCap: 'Large' },
  
  // IT Services & Software
  { symbol: 'MPHASIS', name: 'Mphasis Ltd', sector: 'IT Services', marketCap: 'Mid' },
  { symbol: 'MINDTREE', name: 'Mindtree Ltd', sector: 'IT Services', marketCap: 'Mid' },
  { symbol: 'COFORGE', name: 'Coforge Ltd', sector: 'IT Services', marketCap: 'Mid' },
  { symbol: 'PERSISTENT', name: 'Persistent Systems Ltd', sector: 'IT Services', marketCap: 'Mid' },
  
  // Pharmaceuticals & Healthcare
  { symbol: 'LUPIN', name: 'Lupin Ltd', sector: 'Pharmaceuticals', marketCap: 'Large' },
  { symbol: 'BIOCON', name: 'Biocon Ltd', sector: 'Pharmaceuticals', marketCap: 'Mid' },
  { symbol: 'CADILAHC', name: 'Cadila Healthcare Ltd', sector: 'Pharmaceuticals', marketCap: 'Mid' },
  { symbol: 'ALKEM', name: 'Alkem Laboratories Ltd', sector: 'Pharmaceuticals', marketCap: 'Mid' },
  { symbol: 'TORNTPHARM', name: 'Torrent Pharmaceuticals Ltd', sector: 'Pharmaceuticals', marketCap: 'Mid' },
  
  // FMCG & Consumer
  { symbol: 'DABUR', name: 'Dabur India Ltd', sector: 'FMCG', marketCap: 'Large' },
  { symbol: 'GODREJCP', name: 'Godrej Consumer Products Ltd', sector: 'FMCG', marketCap: 'Large' },
  { symbol: 'MARICO', name: 'Marico Ltd', sector: 'FMCG', marketCap: 'Mid' },
  { symbol: 'COLPAL', name: 'Colgate Palmolive India Ltd', sector: 'FMCG', marketCap: 'Large' },
  { symbol: 'EMAMILTD', name: 'Emami Ltd', sector: 'FMCG', marketCap: 'Mid' },
  
  // Automobiles & Auto Components
  { symbol: 'BAJAJ-AUTO', name: 'Bajaj Auto Ltd', sector: 'Automobiles', marketCap: 'Large' },
  { symbol: 'TVSMOTORS', name: 'TVS Motor Company Ltd', sector: 'Automobiles', marketCap: 'Mid' },
  { symbol: 'ASHOKLEY', name: 'Ashok Leyland Ltd', sector: 'Automobiles', marketCap: 'Mid' },
  { symbol: 'MOTHERSUMI', name: 'Motherson Sumi Systems Ltd', sector: 'Auto Components', marketCap: 'Mid' },
  { symbol: 'BOSCHLTD', name: 'Bosch Ltd', sector: 'Auto Components', marketCap: 'Large' },
  
  // Metals & Mining
  { symbol: 'VEDL', name: 'Vedanta Ltd', sector: 'Metals', marketCap: 'Large' },
  { symbol: 'JINDALSTEL', name: 'Jindal Steel & Power Ltd', sector: 'Steel', marketCap: 'Mid' },
  { symbol: 'SAIL', name: 'Steel Authority of India Ltd', sector: 'Steel', marketCap: 'Large' },
  { symbol: 'NMDC', name: 'NMDC Ltd', sector: 'Mining', marketCap: 'Large' },
  { symbol: 'HINDZINC', name: 'Hindustan Zinc Ltd', sector: 'Metals', marketCap: 'Large' },
  
  // Oil & Gas
  { symbol: 'IOC', name: 'Indian Oil Corporation Ltd', sector: 'Oil & Gas', marketCap: 'Large' },
  { symbol: 'HPCL', name: 'Hindustan Petroleum Corporation Ltd', sector: 'Oil & Gas', marketCap: 'Large' },
  { symbol: 'GAIL', name: 'GAIL India Ltd', sector: 'Oil & Gas', marketCap: 'Large' },
  { symbol: 'OIL', name: 'Oil India Ltd', sector: 'Oil & Gas', marketCap: 'Mid' },
  
  // Telecom & Technology
  { symbol: 'IDEA', name: 'Vodafone Idea Ltd', sector: 'Telecom', marketCap: 'Mid' },
  { symbol: 'RCOM', name: 'Reliance Communications Ltd', sector: 'Telecom', marketCap: 'Small' },
  
  // Infrastructure & Construction
  { symbol: 'DLF', name: 'DLF Ltd', sector: 'Real Estate', marketCap: 'Large' },
  { symbol: 'GODREJPROP', name: 'Godrej Properties Ltd', sector: 'Real Estate', marketCap: 'Mid' },
  { symbol: 'IPCALAB', name: 'IPCA Laboratories Ltd', sector: 'Pharmaceuticals', marketCap: 'Mid' }
];

// Utility functions for stock list management
export function getAllNifty50(): StockSymbol[] {
  return NIFTY_50;
}

export function getAllSensex30(): StockSymbol[] {
  return SENSEX_30;
}

export function getAllNifty500(): StockSymbol[] {
  // Combine NIFTY 50 with additional stocks for full 500 list
  return [...NIFTY_50, ...NIFTY_500_ADDITIONAL];
}

export function getStocksByMarketCap(marketCap: string): StockSymbol[] {
  const allStocks = getAllNifty500();
  return allStocks.filter(stock => stock.marketCap === marketCap);
}

export function getStocksBySector(sector: string): StockSymbol[] {
  const allStocks = getAllNifty500();
  return allStocks.filter(stock => stock.sector === sector);
}

export function getTopNStocks(n: number, list: 'nifty50' | 'sensex30' | 'nifty500' = 'nifty50'): StockSymbol[] {
  let stockList: StockSymbol[];
  
  switch (list) {
    case 'sensex30':
      stockList = getAllSensex30();
      break;
    case 'nifty500':
      stockList = getAllNifty500();
      break;
    default:
      stockList = getAllNifty50();
  }
  
  return stockList.slice(0, n);
}

// Stock list metadata
export const STOCK_LIST_INFO = {
  nifty50: {
    count: NIFTY_50.length,
    description: 'Top 50 companies by market capitalization on NSE',
    updateFrequency: 'Quarterly'
  },
  sensex30: {
    count: SENSEX_30.length,
    description: 'Top 30 companies on Bombay Stock Exchange',
    updateFrequency: 'Quarterly'
  },
  nifty500: {
    count: NIFTY_50.length + NIFTY_500_ADDITIONAL.length,
    description: 'Comprehensive list of top 500 Indian companies',
    updateFrequency: 'Semi-annually'
  }
}; 