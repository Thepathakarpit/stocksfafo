export interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  lastUpdated: Date;
  sector?: string;
  marketCapCategory?: 'Large' | 'Mid' | 'Small';
  weight?: number;
}

export interface StockResponse {
  success: boolean;
  data: Stock[];
  message?: string;
}

export type SortField = 'gain' | 'volume' | 'marketCap' | 'price' | 'symbol' | 'name';
export type SortDirection = 'asc' | 'desc';

export interface SortOption {
  field: SortField;
  direction: SortDirection;
  label: string;
}

export interface StockCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  stocks: Stock[];
  totalValue: number;
  avgChange: number;
}

// Predefined sorting options
export const SORT_OPTIONS: SortOption[] = [
  { field: 'gain', direction: 'desc', label: 'Highest Gain Today' },
  { field: 'gain', direction: 'asc', label: 'Lowest Gain Today' },
  { field: 'volume', direction: 'desc', label: 'Highest Volume' },
  { field: 'volume', direction: 'asc', label: 'Lowest Volume' },
  { field: 'marketCap', direction: 'desc', label: 'Highest Market Cap' },
  { field: 'marketCap', direction: 'asc', label: 'Lowest Market Cap' },
  { field: 'price', direction: 'desc', label: 'Highest Price' },
  { field: 'price', direction: 'asc', label: 'Lowest Price' },
  { field: 'symbol', direction: 'asc', label: 'Symbol A-Z' },
  { field: 'symbol', direction: 'desc', label: 'Symbol Z-A' },
  { field: 'name', direction: 'asc', label: 'Name A-Z' },
  { field: 'name', direction: 'desc', label: 'Name Z-A' }
];

// Sector categorization mapping
export const SECTOR_CATEGORIES = {
  'Banking': {
    name: 'Banking & Financial Services',
    description: 'Banks, NBFCs, and Financial Institutions',
    icon: '🏦',
    color: '#1976d2'
  },
  'IT Services': {
    name: 'Information Technology',
    description: 'Software, IT Services, and Technology',
    icon: '💻',
    color: '#388e3c'
  },
  'FMCG': {
    name: 'Fast Moving Consumer Goods',
    description: 'Consumer Products and Food & Beverages',
    icon: '🛒',
    color: '#f57c00'
  },
  'Oil & Gas': {
    name: 'Oil & Gas',
    description: 'Energy, Petroleum, and Gas Companies',
    icon: '⛽',
    color: '#d32f2f'
  },
  'Pharmaceuticals': {
    name: 'Healthcare & Pharmaceuticals',
    description: 'Pharmaceutical and Healthcare Companies',
    icon: '💊',
    color: '#7b1fa2'
  },
  'Automobiles': {
    name: 'Automobiles & Auto Components',
    description: 'Automotive and Transportation',
    icon: '🚗',
    color: '#5d4037'
  },
  'Metals': {
    name: 'Metals & Mining',
    description: 'Steel, Metals, and Mining Companies',
    icon: '⚒️',
    color: '#616161'
  },
  'Telecom': {
    name: 'Telecommunications',
    description: 'Telecom and Communication Services',
    icon: '📱',
    color: '#00796b'
  },
  'Power': {
    name: 'Power & Utilities',
    description: 'Power Generation and Utilities',
    icon: '⚡',
    color: '#fbc02d'
  },
  'Construction': {
    name: 'Infrastructure & Construction',
    description: 'Construction and Infrastructure',
    icon: '🏗️',
    color: '#ff5722'
  },
  'Other': {
    name: 'Other Sectors',
    description: 'Diversified and Other Industries',
    icon: '📊',
    color: '#9e9e9e'
  }
};

// Utility functions for stock operations
export class StockUtils {
  static sortStocks(stocks: Stock[], sortField: SortField, direction: SortDirection): Stock[] {
    return [...stocks].sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

      switch (sortField) {
        case 'gain':
          aValue = a.changePercent;
          bValue = b.changePercent;
          break;
        case 'volume':
          aValue = a.volume;
          bValue = b.volume;
          break;
        case 'marketCap':
          aValue = a.marketCap;
          bValue = b.marketCap;
          break;
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'symbol':
          aValue = a.symbol;
          bValue = b.symbol;
          break;
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        default:
          aValue = a.changePercent;
          bValue = b.changePercent;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const result = aValue.localeCompare(bValue);
        return direction === 'asc' ? result : -result;
      }

      const result = (aValue as number) - (bValue as number);
      return direction === 'asc' ? result : -result;
    });
  }

  static categorizeStocksBySector(stocks: Stock[]): StockCategory[] {
    const categories: { [key: string]: StockCategory } = {};

    // Initialize categories
    Object.entries(SECTOR_CATEGORIES).forEach(([key, config]) => {
      categories[key] = {
        id: key,
        name: config.name,
        description: config.description,
        icon: config.icon,
        color: config.color,
        stocks: [],
        totalValue: 0,
        avgChange: 0
      };
    });

    // Categorize stocks
    stocks.forEach(stock => {
      const sector = stock.sector || this.inferSectorFromName(stock.name);
      const categoryKey = this.mapSectorToCategory(sector);
      
      if (categories[categoryKey]) {
        categories[categoryKey].stocks.push({
          ...stock,
          sector: sector
        });
      }
    });

    // Calculate statistics for each category
    Object.values(categories).forEach(category => {
      if (category.stocks.length > 0) {
        category.totalValue = category.stocks.reduce((sum, stock) => sum + stock.marketCap, 0);
        category.avgChange = category.stocks.reduce((sum, stock) => sum + stock.changePercent, 0) / category.stocks.length;
        
        // Sort stocks within category by gain (default)
        category.stocks = this.sortStocks(category.stocks, 'gain', 'desc');
      }
    });

    // Return only categories with stocks, sorted by total value
    return Object.values(categories)
      .filter(category => category.stocks.length > 0)
      .sort((a, b) => b.totalValue - a.totalValue);
  }

  private static inferSectorFromName(name: string): string {
    const nameLower = name.toLowerCase();
    
    if (nameLower.includes('bank') || nameLower.includes('finance') || nameLower.includes('finserv')) {
      return 'Banking';
    }
    if (nameLower.includes('tech') || nameLower.includes('infosy') || nameLower.includes('tcs') || nameLower.includes('wipro')) {
      return 'IT Services';
    }
    if (nameLower.includes('unilever') || nameLower.includes('itc') || nameLower.includes('nestle') || nameLower.includes('britannia')) {
      return 'FMCG';
    }
    if (nameLower.includes('oil') || nameLower.includes('petroleum') || nameLower.includes('gas') || nameLower.includes('reliance')) {
      return 'Oil & Gas';
    }
    if (nameLower.includes('pharma') || nameLower.includes('drug') || nameLower.includes('lab') || nameLower.includes('cipla')) {
      return 'Pharmaceuticals';
    }
    if (nameLower.includes('motor') || nameLower.includes('auto') || nameLower.includes('car') || nameLower.includes('maruti')) {
      return 'Automobiles';
    }
    if (nameLower.includes('steel') || nameLower.includes('metal') || nameLower.includes('mining') || nameLower.includes('coal')) {
      return 'Metals';
    }
    if (nameLower.includes('airtel') || nameLower.includes('telecom') || nameLower.includes('communication')) {
      return 'Telecom';
    }
    if (nameLower.includes('power') || nameLower.includes('ntpc') || nameLower.includes('grid')) {
      return 'Power';
    }
    if (nameLower.includes('larsen') || nameLower.includes('construction') || nameLower.includes('cement')) {
      return 'Construction';
    }
    
    return 'Other';
  }

  private static mapSectorToCategory(sector: string): string {
    const sectorMappings: { [key: string]: string } = {
      'Financial Services': 'Banking',
      'NBFC': 'Banking',
      'Software': 'IT Services',
      'Technology': 'IT Services',
      'Consumer Products': 'FMCG',
      'Food & Beverages': 'FMCG',
      'Energy': 'Oil & Gas',
      'Petroleum': 'Oil & Gas',
      'Healthcare': 'Pharmaceuticals',
      'Auto Components': 'Automobiles',
      'Steel': 'Metals',
      'Mining': 'Metals',
      'Communication': 'Telecom',
      'Utilities': 'Power',
      'Infrastructure': 'Construction',
      'Real Estate': 'Construction',
      'Cement': 'Construction',
      'Paints': 'FMCG',
      'Jewellery': 'Other',
      'Textiles': 'Other',
      'Chemicals': 'Other',
      'Diversified': 'Other'
    };

    return sectorMappings[sector] || sector;
  }

  static formatMarketCap(marketCap: number): string {
    if (marketCap >= 1e12) {
      return `${(marketCap / 1e12).toFixed(2)}T`;
    } else if (marketCap >= 1e11) {
      return `${(marketCap / 1e11).toFixed(1)}B`;
    } else if (marketCap >= 1e9) {
      return `${(marketCap / 1e9).toFixed(0)}B`;
    } else if (marketCap >= 1e6) {
      return `${(marketCap / 1e6).toFixed(0)}M`;
    }
    return marketCap.toString();
  }

  static formatVolume(volume: number): string {
    if (volume >= 1e7) {
      return `${(volume / 1e7).toFixed(1)}Cr`;
    } else if (volume >= 1e5) {
      return `${(volume / 1e5).toFixed(1)}L`;
    } else if (volume >= 1e3) {
      return `${(volume / 1e3).toFixed(0)}K`;
    }
    return volume.toString();
  }

  static getGainColor(changePercent: number): string {
    if (changePercent > 0) return '#00e676';
    if (changePercent < 0) return '#ff1744';
    return '#757575';
  }

  static getMarketCapCategory(marketCap: number): 'Large' | 'Mid' | 'Small' {
    if (marketCap >= 200000000000) return 'Large'; // 20,000 Cr
    if (marketCap >= 50000000000) return 'Mid';   // 5,000 Cr
    return 'Small';
  }
} 