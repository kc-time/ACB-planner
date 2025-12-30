
import React from 'react';
import { Download, Printer, AlertCircle } from 'lucide-react';
import { LedgerEntry } from '../types';

interface AuditTrailProps {
  ledger: LedgerEntry[];
  tickerFilter: string;
}

const AuditTrail: React.FC<AuditTrailProps> = ({ ledger, tickerFilter }) => {
  const filtered = ledger.filter(l => 
    tickerFilter === 'ALL' || tickerFilter === '' || l.symbol.includes(tickerFilter)
  );

  const handlePrint = () => {
    window.print();
  };

  const getCurrency = (symbol: string) => {
    return symbol.toUpperCase().endsWith('.TO') ? 'CAD' : 'USD';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold">Audit Trail</h2>
          <p className="text-slate-500 text-sm">Chronological ledger for CRA compliance documentation (All final totals in CAD).</p>
        </div>
        <div className="flex gap-2 print:hidden">
          <button onClick={handlePrint} className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm">
            <Printer size={18} /> Print Audit
          </button>
          <button className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors shadow-sm">
            <Download size={18} /> Export PDF
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 space-y-8">
          {filtered.length === 0 ? (
            <div className="text-center py-20 text-slate-400">No data available to audit.</div>
          ) : (
            filtered.map((entry, idx) => {
              const currency = getCurrency(entry.symbol);
              const nativeAmount = entry.quantity * entry.price;
              const cadAmount = nativeAmount * entry.fxRate;
              
              return (
                <div key={idx} className="relative pl-8 border-l-2 border-slate-100 pb-8 last:pb-0">
                  <div className={`absolute left-[-9px] top-0 w-4 h-4 rounded-full border-2 border-white ${
                    entry.type === 'BUY' ? 'bg-blue-500' : 'bg-rose-500'
                  }`} />
                  <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                    <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                          {entry.dateTime.toLocaleString()}
                        </span>
                        <h3 className="text-lg font-bold text-slate-900">
                          {entry.type} {entry.quantity.toLocaleString()} {entry.symbol} @ ${entry.price.toFixed(4)} {currency}
                        </h3>
                        {entry.fxRate !== 1 && (
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight mt-1">
                            Applied Conversion: 1 {currency} = {entry.fxRate.toFixed(4)} CAD
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">New Portfolio Impact</span>
                         <div className="font-bold text-rose-600">ACB: ${entry.acbAfter.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CAD</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                      <div className="space-y-1">
                        <p className="text-slate-500">Transaction Value (CAD)</p>
                        <p className="font-semibold">
                          ${cadAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
                          <span className="text-[10px] text-slate-400 ml-1">(incl. FX)</span>
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-slate-500">Commissions (CAD)</p>
                        <p className="font-semibold">${(entry.commission * entry.fxRate).toFixed(2)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-slate-500">ACB Cost Pool Change</p>
                        <p className="font-semibold">
                          ${entry.acbBefore.toLocaleString(undefined, { maximumFractionDigits: 0 })} 
                          <span className="text-slate-300 mx-1">→</span> 
                          ${entry.acbAfter.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </p>
                      </div>
                    </div>

                    {entry.isSuperficial && (
                      <div className="mt-4 p-3 bg-rose-50 border border-rose-100 rounded-lg flex items-center gap-3 text-rose-800 text-xs font-medium">
                        <div className="bg-rose-100 p-1 rounded-full"><AlertCircle size={14} /></div>
                        CRA Compliance: Superficial loss detected. Loss added back to pool.
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditTrail;
