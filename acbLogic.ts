
import { RawTransaction, LedgerEntry, PositionSummary, TaxYearSummary } from './types';
import { isWithinInterval, subDays, addDays } from 'date-fns';

export const calculateACB = (transactions: RawTransaction[]): LedgerEntry[] => {
  const sorted = [...transactions].sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
  
  const ledger: LedgerEntry[] = [];
  const positions: Record<string, { shares: number; acb: number; nativeCost: number }> = {};

  sorted.forEach((tx) => {
    if (!positions[tx.symbol]) {
      positions[tx.symbol] = { shares: 0, acb: 0, nativeCost: 0 };
    }

    const pos = positions[tx.symbol];
    const sharesBefore = pos.shares;
    const acbBefore = pos.acb;
    const nativeCostBefore = pos.nativeCost;
    
    let acbAfter = acbBefore;
    let sharesAfter = sharesBefore;
    let nativeCostAfter = nativeCostBefore;
    let realizedGainLoss = 0;
    let isSuperficial = false;
    let acbPerShare = sharesBefore > 0 ? acbBefore / sharesBefore : 0;

    const totalCostCAD = (tx.quantity * tx.price * tx.fxRate) + (tx.commission * tx.fxRate);
    const proceedsCAD = (tx.quantity * tx.price * tx.fxRate) - (tx.commission * tx.fxRate);
    const nativeCostChange = (tx.quantity * tx.price) + tx.commission;

    if (tx.type === 'BUY') {
      sharesAfter += tx.quantity;
      acbAfter += totalCostCAD;
      nativeCostAfter += nativeCostChange;
    } else if (tx.type === 'SELL') {
      if (sharesBefore > 0) {
        const ratio = tx.quantity / sharesBefore;
        const costOfSoldShares = ratio * acbBefore;
        const nativeCostOfSoldShares = ratio * nativeCostBefore;
        
        realizedGainLoss = proceedsCAD - costOfSoldShares;
        
        sharesAfter -= tx.quantity;
        acbAfter -= costOfSoldShares;
        nativeCostAfter -= nativeCostOfSoldShares;

        if (realizedGainLoss < 0) {
          const windowStart = subDays(tx.dateTime, 30);
          const windowEnd = addDays(tx.dateTime, 30);
          
          const hasReacquisition = sorted.some((otherTx) => {
            return (
              otherTx.symbol === tx.symbol &&
              otherTx.type === 'BUY' &&
              isWithinInterval(otherTx.dateTime, { start: windowStart, end: windowEnd })
            );
          });

          if (hasReacquisition && sharesAfter > 0) {
            isSuperficial = true;
            acbAfter += Math.abs(realizedGainLoss);
            realizedGainLoss = 0;
          }
        }
      }
    } else if (tx.type === 'SPLIT') {
      sharesAfter = sharesBefore + tx.quantity;
      acbAfter = acbBefore;
      nativeCostAfter = nativeCostBefore;
    }

    if (Math.abs(sharesAfter) < 0.000001) {
      sharesAfter = 0; acbAfter = 0; nativeCostAfter = 0;
    }

    pos.shares = sharesAfter;
    pos.acb = acbAfter;
    pos.nativeCost = nativeCostAfter;

    ledger.push({
      ...tx,
      acbBefore,
      acbAfter,
      nativeCostBefore,
      nativeCostAfter,
      sharesBefore,
      sharesAfter,
      acbPerShare: sharesAfter > 0 ? acbAfter / sharesAfter : 0,
      realizedGainLoss,
      isSuperficial
    });
  });

  return ledger;
};

export const getPositionsSummary = (ledger: LedgerEntry[]): PositionSummary[] => {
  const map: Record<string, PositionSummary> = {};
  ledger.forEach(entry => {
    map[entry.symbol] = {
      symbol: entry.symbol,
      totalShares: entry.sharesAfter,
      totalACB: entry.acbAfter,
      totalNativeCost: entry.nativeCostAfter,
      currency: entry.currency,
      acbPerShare: entry.acbPerShare,
      isForeign: entry.fxRate !== 1,
      lastFxRate: entry.fxRate
    };
  });
  return Object.values(map).filter(p => p.totalShares > 0);
};

export const getTaxSummaries = (ledger: LedgerEntry[]): TaxYearSummary[] => {
  const years: Record<number, TaxYearSummary> = {};
  ledger.forEach(entry => {
    const year = entry.dateTime.getFullYear();
    if (!years[year]) {
      years[year] = { year, totalRealizedGains: 0, totalRealizedLosses: 0, netGainLoss: 0 };
    }
    if (entry.realizedGainLoss > 0) years[year].totalRealizedGains += entry.realizedGainLoss;
    if (entry.realizedGainLoss < 0) years[year].totalRealizedLosses += Math.abs(entry.realizedGainLoss);
    years[year].netGainLoss += entry.realizedGainLoss;
  });
  return Object.values(years).sort((a, b) => b.year - a.year);
};
