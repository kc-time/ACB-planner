
import React, { useMemo, useState, useEffect } from 'react';
import { 
  AlertCircle, 
  ArrowDownRight, 
  ArrowRight, 
  Calculator, 
  Calendar, 
  Globe, 
  HelpCircle, 
  Info, 
  RefreshCw, 
  ShieldCheck, 
  Sparkles,
  Zap
} from 'lucide-react';
import { LedgerEntry, PositionSummary, TaxYearSummary } from '../types';

interface WhatIfSimulatorProps {
  positions: PositionSummary[];
  currentTaxSummaries: TaxYearSummary[];
  ledger: LedgerEntry[];
}

const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({ positions, currentTaxSummaries, ledger }) => {
  const [targetPrices, setTargetPrices] = useState<Record<string, string>>({});
  const [fxRate, setFxRate] = useState<number | null>(null);
  const [isFetchingFX, setIsFetchingFX] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const netRealized = currentTaxSummaries[0]?.netGainLoss || 0;

  const getCurrency = (symbol: string) => {
    return symbol.toUpperCase().endsWith('.TO') ? 'CAD' : 'USD';
  };

  // Chronological list of sell events for the active period
  const realizedTransactions = useMemo(() => {
    return ledger
      .filter(tx => tx.realizedGainLoss !== 0)
      .sort((a, b) => b.dateTime.getTime() - a.dateTime.getTime());
  }, [ledger]);

  const fetchRates = async () => {
    setIsFetchingFX(true);
    try {
      const response = await fetch('https://open.er-api.com/v6/latest/USD');
      const data = await response.json();
      if (data && data.rates && data.rates.CAD) {
        setFxRate(data.rates.CAD);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error("Failed to fetch public FX rates:", error);
    } finally {
      setIsFetchingFX(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const handlePriceChange = (symbol: string, val: string) => {
    setTargetPrices(prev => ({ ...prev, [symbol]: val }));
  };

  const harvestCandidates = useMemo(() => {
    return positions.map(p => {
      const targetPriceNative = parseFloat(targetPrices[p.symbol] || '0');
      if (targetPriceNative <= 0) return null;

      const currency = getCurrency(p.symbol);
      const activeFX = currency === 'USD' 
        ? (fxRate !== null ? fxRate : p.lastFxRate) 
        : 1;
      
      const targetPriceCAD = targetPriceNative * activeFX;
      const unrealizedGLPerShare = targetPriceCAD - p.acbPerShare;

      if (unrealizedGLPerShare >= 0) return null;

      let suggestedShares = 0;
      let predictedDeduction = 0;
      if (netRealized > 0) {
        suggestedShares = Math.min(
          p.totalShares, 
          Math.ceil(Math.abs(netRealized / unrealizedGLPerShare))
        );
        const simulatedProceedsCAD = suggestedShares * targetPriceCAD;
        const acbOfSoldShares = suggestedShares * p.acbPerShare;
        predictedDeduction = Math.abs(simulatedProceedsCAD - acbOfSoldShares);
      }

      return {
        symbol: p.symbol,
        unrealizedGLPerShare,
        suggestedShares,
        predictedDeduction,
        activeFX,
        isFullOffset: predictedDeduction >= netRealized - 0.01
      };
    }).filter(c => c !== null);
  }, [positions, targetPrices, netRealized, fxRate]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-900">
            <Calculator className="text-rose-600" /> Tax-Loss Harvesting Planner
          </h2>
          <p className="text-slate-500">Analyze current gains and simulate offsets with real-time currency conversion.</p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden md:block">
              Live FX: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button 
            onClick={fetchRates}
            disabled={isFetchingFX}
            className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:border-rose-500 hover:text-rose-600 transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={16} className={isFetchingFX ? 'animate-spin' : ''} />
            {isFetchingFX ? 'Syncing...' : 'Update FX Rates'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Health and Status Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                <Globe size={24} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">USD/CAD Exchange</p>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black text-slate-900">{fxRate ? fxRate.toFixed(4) : '---'}</span>
                  <span className="text-[8px] font-bold bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-full border border-emerald-100 uppercase">Live</span>
                </div>
              </div>
            </div>
            <div className={`p-5 rounded-2xl border flex items-center gap-4 shadow-sm ${netRealized > 0 ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
              <div className={`p-3 rounded-xl ${netRealized > 0 ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                {netRealized > 0 ? <AlertCircle size={24} /> : <ShieldCheck size={24} />}
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Net Realized (CAD)</p>
                <p className={`text-lg font-black ${netRealized >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  ${netRealized.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          {/* Realized Summaries and Records */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                <Calendar size={16} className="text-slate-400" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Annual Realized G/L</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white text-[10px] font-bold uppercase text-slate-400 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-3">Tax Year</th>
                      <th className="px-6 py-3">Gains</th>
                      <th className="px-6 py-3">Losses</th>
                      <th className="px-6 py-3 text-right">Net G/L</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentTaxSummaries.length > 0 ? currentTaxSummaries.map(s => (
                      <tr key={s.year} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-6 py-3 font-bold text-slate-900 text-sm">{s.year}</td>
                        <td className="px-6 py-3 text-emerald-600 font-medium text-xs">+${s.totalRealizedGains.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                        <td className="px-6 py-3 text-rose-600 font-medium text-xs">-${s.totalRealizedLosses.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                        <td className={`px-6 py-3 text-right font-bold text-sm ${s.netGainLoss >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                          ${s.netGainLoss.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400 text-xs italic">No historical records.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Restored: Realized Transaction Detail */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowDownRight size={16} className="text-slate-400" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Realized Transaction Detail</h3>
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase bg-slate-100 px-2 py-1 rounded">
                  {realizedTransactions.length} Sell Events
                </span>
              </div>
              <div className="max-h-[280px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-left">
                  <thead className="bg-white text-[10px] font-bold uppercase text-slate-400 sticky top-0 border-b border-slate-100 z-10 shadow-sm">
                    <tr>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Ticker</th>
                      <th className="px-6 py-3 text-right">Proceeds</th>
                      <th className="px-6 py-3 text-right">Cost Base</th>
                      <th className="px-6 py-3 text-right">Gain/Loss</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {realizedTransactions.length > 0 ? realizedTransactions.map(tx => {
                      const proceeds = (tx.quantity * tx.price * tx.fxRate) - (tx.commission * tx.fxRate);
                      const costBase = proceeds - tx.realizedGainLoss;
                      return (
                        <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-3"><span className="text-[11px] font-bold text-slate-500">{tx.dateTime.toLocaleDateString()}</span></td>
                          <td className="px-6 py-3"><span className="font-black text-slate-900 text-xs uppercase">{tx.symbol}</span></td>
                          <td className="px-6 py-3 text-right text-[11px] font-medium text-slate-600">${proceeds.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td className="px-6 py-3 text-right text-[11px] font-medium text-slate-600">${costBase.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td className="px-6 py-3 text-right">
                            <div className="flex flex-col items-end">
                              <span className={`text-xs font-black ${tx.realizedGainLoss >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {tx.realizedGainLoss >= 0 ? '+' : ''}${tx.realizedGainLoss.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </span>
                              {tx.isSuperficial && <span className="flex items-center gap-0.5 text-[8px] font-black uppercase text-amber-600 bg-amber-50 px-1 rounded"><Info size={8} /> Superficial</span>}
                            </div>
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-xs italic">No sell transactions found in this period.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Simulation Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-2">Simulation: Active Positions</h3>
            {positions.map(p => {
              const currency = getCurrency(p.symbol);
              const targetNative = parseFloat(targetPrices[p.symbol] || '0');
              const activeFX = currency === 'USD' ? (fxRate !== null ? fxRate : p.lastFxRate) : 1;
              const targetCAD = targetNative * activeFX;
              const simulatedProceedsCAD = p.totalShares * targetCAD;
              const simulatedGainLossCAD = targetNative > 0 ? simulatedProceedsCAD - p.totalACB : 0;
              
              return (
                <div key={p.symbol} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 hover:border-rose-300 transition-all group">
                  <div className="flex items-center gap-4 w-40 shrink-0">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-600 text-xs shrink-0 group-hover:bg-rose-50 transition-colors">{p.symbol.slice(0, 2)}</div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm uppercase">{p.symbol}</h4>
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full border ${currency === 'CAD' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>{currency} MARKET</span>
                    </div>
                  </div>
                  <div className="flex-1 px-4 w-full">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">{currency === 'USD' ? 'US$' : 'C$'}</span>
                      <input type="number" placeholder={`Current Price`} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all font-bold" value={targetPrices[p.symbol] || ''} onChange={(e) => handlePriceChange(p.symbol, e.target.value)} />
                    </div>
                    {targetNative > 0 && currency === 'USD' && (
                      <p className="text-[9px] text-slate-400 font-bold uppercase mt-1.5 px-1 flex justify-between">
                        <span>≈ ${targetCAD.toFixed(2)} CAD</span>
                        <span className="text-rose-600">FX: {activeFX.toFixed(4)}</span>
                      </p>
                    )}
                  </div>
                  <div className="text-right min-w-[150px]">
                    <div className={`text-sm font-black flex items-center justify-end gap-1 ${simulatedGainLossCAD >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {targetNative > 0 ? `${simulatedGainLossCAD >= 0 ? '+' : ''}$${simulatedGainLossCAD.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : <span className="text-slate-300 italic font-normal text-xs uppercase tracking-tighter">Enter {currency} Price</span>}
                    </div>
                    {targetNative > 0 && <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Simulated G/L (CAD)</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Optimizer Sidebar */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 self-start sticky top-8">
          <h3 className="text-lg font-bold flex items-center gap-2 text-rose-600"><Sparkles size={18} /> Tax-Loss Optimizer</h3>
          <div className="space-y-4">
            {netRealized <= 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200 px-4"><ShieldCheck size={32} className="mx-auto text-emerald-500 mb-2" /><p className="text-sm font-bold text-slate-800">No Net Gains</p></div>
            ) : harvestCandidates.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200 px-4"><HelpCircle size={32} className="mx-auto text-slate-300 mb-2" /><p className="text-sm font-bold text-slate-800">Enter Prices</p><p className="text-xs text-slate-500 mt-1">Input current prices to find potential losses.</p></div>
            ) : (
              harvestCandidates.map(c => c && (
                <div key={c.symbol} className="p-4 bg-rose-50 border border-rose-100 rounded-xl space-y-4">
                  <div className="flex items-center justify-between"><span className="font-black text-rose-700">{c.symbol}</span><span className="text-[10px] bg-rose-200 text-rose-800 px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">Harvest recommendation</span></div>
                  <div className="space-y-2">
                    <p className="text-[10px] text-rose-800 font-bold uppercase tracking-widest opacity-70">Suggested Action</p>
                    <div className="flex items-center gap-2 bg-white p-3 rounded-lg shadow-sm border border-rose-200">
                      <div className="text-xl font-black text-slate-900">{c.suggestedShares.toLocaleString()}</div>
                      <div className="text-[10px] uppercase font-bold text-slate-400 leading-tight">Shares of<br/>{c.symbol}</div><ArrowRight className="ml-auto text-rose-400" size={16} />
                    </div>
                  </div>
                  <div className="bg-emerald-600 p-4 rounded-xl shadow-lg">
                    <p className="text-[9px] text-emerald-100 font-bold uppercase tracking-widest mb-1 opacity-80">Predicted Tax Offset</p>
                    <p className="text-2xl font-black text-white leading-none">-${c.predictedDeduction.toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-xs font-normal">CAD</span></p>
                    <p className="text-[8px] text-emerald-200 font-bold mt-2">Calculated using {c.activeFX.toFixed(4)} FX</p>
                  </div>
                  <div className="pt-2 border-t border-rose-200/50">
                    {c.isFullOffset ? <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-black uppercase tracking-widest"><ShieldCheck size={14} /> Completely Balances Net Gains</div> : <div className="space-y-2"><div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-amber-600"><span>Partial Offset</span><span>{((c.predictedDeduction / netRealized) * 100).toFixed(0)}%</span></div><div className="h-1.5 bg-rose-200 rounded-full overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, (c.predictedDeduction / netRealized) * 100)}%` }} /></div></div>}
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Planner Compliance</h4>
            <ul className="space-y-3">
              <li className="text-[11px] text-slate-500 flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1 shrink-0" /><span><strong>Superficial Loss:</strong> Do not repurchase the harvested stock for 30 days.</span></li>
              <li className="text-[11px] text-slate-500 flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1 shrink-0" /><span>Simulation uses current <strong>weighted average cost pooling</strong>.</span></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatIfSimulator;
