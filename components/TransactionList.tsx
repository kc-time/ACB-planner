
import React from 'react';
import { ShieldAlert, Trash2, ArrowUpRight, ArrowDownRight, RefreshCcw, Scissors, Info } from 'lucide-react';
import { LedgerEntry } from '../types';

interface TransactionListProps {
  ledger: LedgerEntry[];
  tickerFilter: string;
  onDelete: (id: string) => void;
}

const TransactionList: React.FC<TransactionListProps> = ({ ledger, onDelete }) => {
  const displayLedger = [...ledger].reverse();

  const formatMoney = (val: number) => val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formatCompact = (val: number) => val.toLocaleString(undefined, { maximumFractionDigits: 0 });

  return (
    <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
      <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Financial Ledger</h3>
          <p className="text-slate-500 text-sm font-medium">Historical audit of all stock activity and CAD adjusted cost base.</p>
        </div>
        <div className="flex items-center gap-3 text-xs font-black text-slate-600 bg-white px-5 py-2.5 rounded-[20px] border border-slate-200 shadow-sm">
          <RefreshCcw size={14} className="text-rose-600" /> 
          {ledger.length} ENTRIES
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
            <tr>
              <th className="px-8 py-5">Event Detail</th>
              <th className="px-8 py-5">Ticker</th>
              <th className="px-8 py-5">Trade Data</th>
              <th className="px-8 py-5">Impact (CAD)</th>
              <th className="px-8 py-5">Running Average</th>
              <th className="px-8 py-5 text-right">Realized P/L</th>
              <th className="px-8 py-5 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayLedger.map((tx) => (
              <tr key={tx.id} className={`hover:bg-slate-50/80 transition-colors group ${tx.isSuperficial ? 'bg-amber-50/30' : tx.type === 'SPLIT' ? 'bg-indigo-50/20' : ''}`}>
                <td className="px-8 py-6 whitespace-nowrap">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-xl ${
                      tx.type === 'BUY' ? 'bg-blue-100 text-blue-700' : 
                      tx.type === 'SELL' ? 'bg-rose-100 text-rose-700' : 
                      'bg-indigo-100 text-indigo-700'
                    }`}>
                      {tx.type === 'BUY' ? <ArrowUpRight size={18} /> : tx.type === 'SELL' ? <ArrowDownRight size={18} /> : <Scissors size={18} />}
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-900 block">{tx.dateTime.toLocaleDateString('en-CA')}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{tx.dateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className="font-black text-slate-900 text-base tracking-tighter">{tx.symbol}</span>
                  <span className={`block text-[8px] font-black uppercase tracking-widest ${tx.type === 'BUY' ? 'text-blue-500' : tx.type === 'SELL' ? 'text-rose-500' : 'text-indigo-500'}`}>{tx.type}</span>
                </td>
                <td className="px-8 py-6">
                  <div className="flex flex-col">
                    <div className="text-sm font-black text-slate-900">
                      {tx.type === 'SELL' ? '-' : '+'}{Math.abs(tx.quantity).toLocaleString(undefined, { maximumFractionDigits: 4 })} shares
                    </div>
                    <div className="text-[10px] text-slate-500 font-bold flex items-center gap-1 uppercase tracking-tighter">
                      @ ${tx.price.toFixed(4)} {tx.currency} 
                      {tx.fxRate !== 1 && <span className="text-[8px] bg-slate-100 px-1 rounded text-slate-400">FX: {tx.fxRate.toFixed(4)}</span>}
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                   <div className="flex flex-col">
                    <div className="text-sm font-black text-slate-800">
                       ${formatMoney(tx.price * tx.fxRate)} <span className="text-[9px] text-slate-400">CAD</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                      Total: ${formatMoney(tx.quantity * tx.price * tx.fxRate)}
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex flex-col">
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-black text-slate-900 text-sm">${formatMoney(tx.acbPerShare)}</span>
                      <span className="text-[9px] font-black text-rose-600 uppercase">CAD AVG</span>
                    </div>
                    {tx.fxRate !== 1 && (
                      <div className="flex items-baseline gap-1.5 opacity-60">
                        <span className="text-[10px] font-bold text-slate-500">${formatMoney(tx.acbPerShare / tx.fxRate)}</span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Native Avg</span>
                      </div>
                    )}
                    <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">
                      Pool: ${formatCompact(tx.acbAfter)} CAD
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex flex-col items-end">
                    {tx.type === 'SELL' ? (
                      <>
                        <span className={`font-black text-base ${tx.realizedGainLoss >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {tx.realizedGainLoss >= 0 ? '+' : ''}${formatMoney(tx.realizedGainLoss)}
                        </span>
                        {tx.isSuperficial && (
                          <span className="flex items-center gap-1 text-[8px] bg-amber-500 text-white font-black px-1.5 py-0.5 rounded uppercase tracking-tighter">
                            <ShieldAlert size={10} /> Superficial Loss
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-slate-300 text-[10px] font-black uppercase tracking-[0.2em]">—</span>
                    )}
                  </div>
                </td>
                <td className="px-8 py-6 text-right">
                  <button 
                    onClick={() => onDelete(tx.id)}
                    className="p-3 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {displayLedger.length === 0 && (
          <div className="p-32 text-center flex flex-col items-center">
            <div className="p-10 bg-slate-50 rounded-[40px] text-slate-300 mb-6 border border-slate-100">
              <RefreshCcw size={64} />
            </div>
            <h4 className="text-slate-900 font-black text-2xl tracking-tight">Ledger Empty</h4>
            <p className="text-slate-400 text-lg max-w-sm mx-auto mt-2 font-medium">Import your trade history to populate this audit-ready transaction log.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionList;
