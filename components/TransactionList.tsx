
import React from 'react';
import { ShieldAlert, Trash2, ArrowUpRight, ArrowDownRight, RefreshCcw, Scissors } from 'lucide-react';
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
    <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
      <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
        <div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Financial Ledger</h3>
          <p className="text-slate-500 text-sm font-medium mt-1">Audit-ready historical log of your Adjusted Cost Base.</p>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-black text-slate-600 bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm uppercase tracking-widest">
          <RefreshCcw size={14} className="text-rose-600" /> 
          {ledger.length} Records
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[11px] font-black uppercase text-slate-400 tracking-[0.2em]">
            <tr>
              <th className="px-10 py-6">Date / Time</th>
              <th className="px-10 py-6">Security</th>
              <th className="px-10 py-6 text-right">Quantity</th>
              <th className="px-10 py-6 text-right">Inventory</th>
              <th className="px-10 py-6 text-right">Unit Price</th>
              <th className="px-10 py-6 text-right">Ledger Impact</th>
              <th className="px-10 py-6 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayLedger.map((tx) => {
              const isBuy = tx.type === 'BUY';
              
              return (
                <tr key={tx.id} className={`hover:bg-slate-50/80 transition-colors group ${tx.isSuperficial ? 'bg-amber-50/40' : tx.type === 'SPLIT' ? 'bg-indigo-50/20' : ''}`}>
                  <td className="px-10 py-8 whitespace-nowrap">
                    <span className="text-xs font-black text-slate-900 block tracking-tight">
                      {tx.dateTime.toLocaleDateString('en-CA').replace(/-/g, '/')}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                      {tx.dateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-4">
                      <span className="font-black text-slate-900 text-lg tracking-tighter uppercase">{tx.symbol}</span>
                      <div className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest border flex items-center gap-1 shadow-sm ${
                        isBuy ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                        tx.type === 'SELL' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                        'bg-indigo-50 text-indigo-600 border-indigo-100'
                      }`}>
                        {isBuy ? <ArrowUpRight size={10} /> : tx.type === 'SELL' ? <ArrowDownRight size={10} /> : <Scissors size={10} />}
                        {tx.type}
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <span className={`text-base font-black tracking-tight ${isBuy ? 'text-blue-600' : tx.type === 'SELL' ? 'text-rose-500' : 'text-slate-900'}`}>
                      {isBuy ? '+' : tx.type === 'SELL' ? '-' : ''}{tx.quantity.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                    </span>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <span className="text-sm font-black text-slate-900">
                      {tx.sharesAfter.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                    </span>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-black text-slate-900">${tx.price.toFixed(4)}</span>
                      {tx.fxRate !== 1 && <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">FX: {tx.fxRate.toFixed(4)}</span>}
                    </div>
                  </td>
                  <td className="px-10 py-8 text-right min-w-[200px]">
                    <div className="flex flex-col items-end">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-lg font-black text-slate-900">${formatMoney(tx.acbPerShare)}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">CAD</span>
                      </div>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <span className="text-[10px] text-rose-500 font-black uppercase tracking-widest">${formatMoney(tx.acbPerShare / tx.fxRate)}</span>
                        <span className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter">ORIGINAL</span>
                      </div>
                      <div className="flex items-baseline gap-1.5 mt-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">POOL: ${formatCompact(tx.acbAfter)}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <div className="flex items-center justify-end gap-3">
                       {tx.isSuperficial && (
                        <div className="p-2 text-amber-600 bg-amber-50 rounded-xl" title="Superficial Loss Detected">
                          <ShieldAlert size={20} />
                        </div>
                      )}
                      <button 
                        onClick={() => onDelete(tx.id)}
                        className="p-3 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={22} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {displayLedger.length === 0 && (
          <div className="p-32 text-center flex flex-col items-center">
            <div className="p-12 bg-slate-50 rounded-[48px] text-slate-200 mb-8 border border-slate-100">
              <RefreshCcw size={80} />
            </div>
            <h4 className="text-slate-900 font-black text-3xl tracking-tight">No Financial History</h4>
            <p className="text-slate-400 text-lg max-w-sm mx-auto mt-4 font-medium leading-relaxed">Choose an IBKR CSV report from the dashboard to populate your trade history.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionList;
