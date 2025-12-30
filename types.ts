
export type TransactionType = 'BUY' | 'SELL' | 'SPLIT';

export interface RawTransaction {
  id: string;
  symbol: string;
  dateTime: Date;
  type: TransactionType;
  quantity: number;
  price: number;
  commission: number;
  fxRate: number; // USD to CAD
  currency: string; // The native currency (USD, CAD, HKD, etc.)
  description?: string;
}

export interface LedgerEntry extends RawTransaction {
  acbBefore: number;
  acbAfter: number;
  sharesBefore: number;
  sharesAfter: number;
  acbPerShare: number;
  nativeCostBefore: number;
  nativeCostAfter: number;
  realizedGainLoss: number;
  isSuperficial: boolean;
  notes?: string;
}

export interface PositionSummary {
  symbol: string;
  totalShares: number;
  totalACB: number; // CAD
  totalNativeCost: number; // Native currency
  currency: string;
  acbPerShare: number;
  isForeign: boolean;
  lastFxRate: number;
}

export interface TaxYearSummary {
  year: number;
  totalRealizedGains: number;
  totalRealizedLosses: number;
  netGainLoss: number;
}
