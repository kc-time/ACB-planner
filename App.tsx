
import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, 
  History, 
  Calculator, 
  FileUp, 
  ShieldAlert, 
  Settings,
  X,
  Plus,
  Calendar,
  ChevronDown,
  Info,
  HelpCircle,
  Trash2
} from 'lucide-react';
import { RawTransaction, LedgerEntry, PositionSummary, TaxYearSummary } from './types';
import { calculateACB, getPositionsSummary, getTaxSummaries } from './acbLogic';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import WhatIfSimulator from './components/WhatIfSimulator';
import AuditTrail from './components/AuditTrail';
import ManualTransactionModal from './components/ManualTransactionModal';
import { isWithinInterval, startOfYear, endOfYear } from 'date-fns';

type DatePreset = 'all' | 'custom' | string;

// Unique key for GitHub Pages to prevent collisions with other apps on the same domain
const STORAGE_KEY = 'maple-acb-kc-time-planner-v1';

const App: React.FC = () => {
  const [transactions, setTransactions] = useState<RawTransaction[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'simulator' | 'audit'>('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [tickerFilter, setTickerFilter] = useState('ALL');
  const [isManualModalOpen, setManualModalOpen] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [customRange, setCustomRange] = useState<{ start: string; end: string }>({
    start: startOfYear(new Date()).toISOString().split('T')[0],
    end: endOfYear(new Date()).toISOString().split('T')[0]
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setTransactions(parsed.map((t: any) => ({ ...t, dateTime: new Date(t.dateTime) })));
        }
      } catch (e) {
        console.error("Failed to load saved data", e);
      }
    }
  }, []);

  useEffect(() => {
    if (transactions.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [transactions]);

  const fullLedger = useMemo(() => calculateACB(transactions), [transactions]);
  
  const availableYears = useMemo(() => {
    const years = new Set<string>(transactions.map(t => t.dateTime.getFullYear().toString()));
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [transactions]);

  const effectiveRange = useMemo(() => {
    if (datePreset === 'all') return { start: new Date(0), end: new Date(8640000000000000) };
    if (datePreset === 'custom') {
      return { start: new Date(customRange.start + 'T00:00:00'), end: new Date(customRange.end + 'T23:59:59') };
    }
    const year = parseInt(datePreset);
    return { start: new Date(`${year}-01-01T00:00:00`), end: new Date(`${year}-12-31T23:59:59`) };
  }, [datePreset, customRange]);

  const filteredLedger = useMemo(() => {
    return fullLedger.filter(entry => {
      const inDate = isWithinInterval(entry.dateTime, effectiveRange);
      const inTicker = tickerFilter === 'ALL' || entry.symbol === tickerFilter;
      return inDate && inTicker;
    });
  }, [fullLedger, effectiveRange, tickerFilter]);

  const positions = useMemo(() => getPositionsSummary(fullLedger), [fullLedger]);
  const taxSummaries = useMemo(() => getTaxSummaries(filteredLedger), [filteredLedger]);
  
  const availableTickers = useMemo(() => {
    return ['ALL', ...new Set(transactions.map(t => t.symbol))].sort();
  }, [transactions]);

  const clearAllData = () => {
    if (window.confirm("ARE YOU SURE? This will permanently delete all imported trades from your local browser storage.")) {
      setTransactions([]);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/);
      if (lines.length < 1) return;

      let currentMode: 'NONE' | 'TRADE' | 'CORP_ACTION' = 'NONE';
      const parsedTransactions: RawTransaction[] = [];

      lines.forEach((line, i) => {
        const cleanLine = line.trim();
        if (!cleanLine) return;

        const parts = cleanLine.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(p => p.replace(/"/g, '').trim());
        const headerTest = parts.join(',').toLowerCase();

        if (headerTest.includes('fxratetobase') && headerTest.includes('tradeprice')) {
          currentMode = 'TRADE';
          return;
        }
        if (headerTest.includes('report date') && headerTest.includes('quantity') && headerTest.includes('description')) {
          currentMode = 'CORP_ACTION';
          return;
        }

        if (currentMode === 'TRADE') {
          const currency = parts[0];
          const symbol = parts[2];
          
          // Ignore currency pairs as per instruction
          if (!symbol || symbol === 'Symbol' || symbol === 'USD.CAD' || symbol === 'CAD.USD') return;

          const dateStr = parts[3];
          let dt: Date;
          if (dateStr && (dateStr.includes(';') || dateStr.includes(':') || dateStr.includes(' '))) {
            const separator = dateStr.includes(';') ? ';' : (dateStr.includes(' ') ? ' ' : ':');
            const [d, t] = dateStr.split(separator);
            const year = d.includes('-') ? d.split('-')[0] : d.slice(0, 4);
            const month = d.includes('-') ? d.split('-')[1] : d.slice(4, 6);
            const day = d.includes('-') ? d.split('-')[2] : d.slice(6, 8);
            const formattedTime = t ? (t.includes(':') ? t : t.replace(/(\d{2})(\d{2})(\d{2})/, '$1:$2:$3')) : '12:00:00';
            dt = new Date(`${year}-${month}-${day}T${formattedTime}`);
          } else {
            dt = new Date(dateStr);
          }

          if (isNaN(dt.getTime())) return;

          const rawQty = parseFloat(parts[4]);
          parsedTransactions.push({
            id: `trade-${Date.now()}-${i}`,
            symbol,
            currency: currency || (symbol.endsWith('.TO') ? 'CAD' : 'USD'),
            dateTime: dt,
            type: rawQty > 0 ? 'BUY' : 'SELL',
            quantity: Math.abs(rawQty),
            price: parseFloat(parts[5]) || 0,
            commission: Math.abs(parseFloat(parts[6])) || 0,
            fxRate: parseFloat(parts[1]) || 1
          });
        } else if (currentMode === 'CORP_ACTION') {
          const currency = parts[0];
          const symbol = parts[1];
          const typeLabel = parts[5];
          if (!symbol || symbol === 'Symbol' || !typeLabel) return;
          if (typeLabel !== 'FS') return;

          const dt = new Date(parts[2]);
          if (isNaN(dt.getTime())) return;

          parsedTransactions.push({
            id: `split-${Date.now()}-${i}`,
            symbol,
            currency: currency || (symbol.endsWith('.TO') ? 'CAD' : 'USD'),
            dateTime: dt,
            type: 'SPLIT',
            quantity: parseFloat(parts[3]) || 0,
            price: 0,
            commission: 0,
            fxRate: 1,
            description: parts[4]
          });
        }
      });

      if (parsedTransactions.length > 0) {
        setTransactions(prev => [...prev, ...parsedTransactions]);
      } else {
        alert("Check 'IBKR Setup Guide' for required fields. No compatible stock trades found.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 overflow-hidden">
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300 bg-white border-r border-slate-200 flex flex-col z-20`}>
        <div className="p-6 flex items-center gap-3">
          <div className="bg-rose-600 p-2 rounded-lg text-white shadow-lg shadow-rose-200"><Calculator size={24} /></div>
          {isSidebarOpen && <span className="font-black text-xl tracking-tighter">Maple<span className="text-rose-600">ACB</span></span>}
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          <SidebarItem icon={<BarChart3 size={20} />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} collapsed={!isSidebarOpen} />
          <SidebarItem icon={<History size={20} />} label="Transaction Log" active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} collapsed={!isSidebarOpen} />
          <SidebarItem icon={<ShieldAlert size={20} />} label="Tax-Loss Planner" active={activeTab === 'simulator'} onClick={() => setActiveTab('simulator')} collapsed={!isSidebarOpen} />
          <SidebarItem icon={<Calendar size={20} />} label="Audit Trail" active={activeTab === 'audit'} onClick={() => setActiveTab('audit')} collapsed={!isSidebarOpen} />
        </nav>
        <div className="p-4 border-t border-slate-100 space-y-2">
           {transactions.length > 0 && isSidebarOpen && (
             <button onClick={clearAllData} className="w-full flex items-center justify-center gap-2 py-3 text-[10px] text-rose-600 hover:bg-rose-50 rounded-xl transition-all font-black uppercase tracking-widest border border-rose-100">
               <Trash2 size={16} /> Clear All Data
             </button>
           )}
           <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="w-full flex justify-center py-2 text-slate-400 hover:text-slate-600 transition-colors"><Settings size={20} /></button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-24 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10 shrink-0">
          <div className="flex items-center gap-6">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Filters</span>
              <div className="flex gap-2">
                <div className="relative">
                  <select className="pl-4 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold appearance-none focus:ring-2 focus:ring-rose-500" value={tickerFilter} onChange={(e) => setTickerFilter(e.target.value)}>
                    {availableTickers.map(t => <option key={t} value={t}>{t === 'ALL' ? 'All Tickers' : t}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                </div>
                <select className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-rose-500" value={datePreset} onChange={(e) => setDatePreset(e.target.value)}>
                  <option value="all">All Time</option>
                  {availableYears.map(y => <option key={y} value={y}>{y} Tax Year</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowGuide(true)} className="flex items-center gap-2 px-4 py-2.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl text-sm font-bold border border-blue-100"><HelpCircle size={18} /> IBKR Setup</button>
            <label className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold cursor-pointer shadow-md transition-all active:scale-95">
              <FileUp size={18} /> Import CSV
              <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
            </label>
            <button onClick={() => setManualModalOpen(true)} className="flex items-center gap-2 bg-white border border-slate-200 hover:border-rose-500 text-slate-700 px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm"><Plus size={18} /> Manual</button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {transactions.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto">
              <div className="bg-rose-100 p-10 rounded-[48px] text-rose-600 mb-10 animate-pulse shadow-2xl shadow-rose-200/50"><FileUp size={80} /></div>
              <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Ready for your IBKR Report</h2>
              <p className="text-slate-500 mb-12 text-xl leading-relaxed font-medium">Upload your Flex Query to calculate your CAD Adjusted Cost Base and track multi-currency pools.</p>
              
              <div className="flex flex-col gap-4 w-full px-10">
                <label className="w-full flex items-center justify-center gap-4 bg-rose-600 hover:bg-rose-700 text-white px-10 py-6 rounded-[32px] text-2xl font-black cursor-pointer shadow-2xl shadow-rose-300 transition-all hover:-translate-y-1.5 active:scale-95 active:translate-y-0">
                  <FileUp size={32} />
                  Choose IBKR CSV
                  <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                </label>
                
                <button 
                  onClick={() => setShowGuide(true)} 
                  className="flex items-center justify-center gap-2 text-sm font-black text-blue-600 hover:bg-blue-50 px-8 py-5 rounded-3xl border-2 border-dashed border-blue-200 transition-all uppercase tracking-widest"
                >
                  <Info size={20} /> View Required Flex Query Setup
                </button>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && <Dashboard positions={positions} taxSummaries={taxSummaries} ledger={filteredLedger} />}
              {activeTab === 'transactions' && <TransactionList ledger={filteredLedger} tickerFilter={tickerFilter} onDelete={(id) => setTransactions(transactions.filter(t => t.id !== id))} />}
              {activeTab === 'simulator' && <WhatIfSimulator positions={positions} currentTaxSummaries={taxSummaries} ledger={filteredLedger} />}
              {activeTab === 'audit' && <AuditTrail ledger={filteredLedger} tickerFilter={tickerFilter} />}
            </>
          )}
        </div>
      </main>

      {showGuide && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl p-12 overflow-hidden relative border border-slate-100">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-3xl font-black flex items-center gap-4 tracking-tight"><Settings className="text-blue-600" /> Flex Query Guide</h2>
              <button onClick={() => setShowGuide(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={28} /></button>
            </div>
            <div className="space-y-8">
              <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100 shadow-inner">
                <h3 className="font-black text-slate-900 mb-5 flex items-center gap-3"><span className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center text-xs">1</span> Trades (Execution)</h3>
                <div className="grid grid-cols-2 gap-3 text-[10px] font-black text-slate-500 uppercase tracking-tight">
                  {['CurrencyPrimary','FXRateToBase','Symbol','DateTime','Quantity','TradePrice','IBCommission','IBCommissionCurrency'].map(f => (
                    <div key={f} className="bg-white px-4 py-3 rounded-2xl border border-slate-200 shadow-sm">{f}</div>
                  ))}
                </div>
              </div>
              <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100 shadow-inner">
                <h3 className="font-black text-slate-900 mb-5 flex items-center gap-3"><span className="w-8 h-8 bg-rose-600 text-white rounded-lg flex items-center justify-center text-xs">2</span> Corporate Actions (Detail)</h3>
                <div className="grid grid-cols-2 gap-3 text-[10px] font-black text-slate-500 uppercase tracking-tight">
                  {['CurrencyPrimary','Symbol','Report Date','Quantity','Description','Type'].map(f => (
                    <div key={f} className="bg-white px-4 py-3 rounded-2xl border border-slate-200 shadow-sm">{f}</div>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={() => setShowGuide(false)} className="mt-12 w-full py-5 bg-slate-900 text-white rounded-[24px] font-black text-xl hover:bg-slate-800 transition-all shadow-xl active:scale-95">I've configured my Flex Query</button>
          </div>
        </div>
      )}

      <ManualTransactionModal isOpen={isManualModalOpen} onClose={() => setManualModalOpen(false)} onSave={(tx) => setTransactions(prev => [...prev, tx])} availableTickers={availableTickers} />
    </div>
  );
};

const SidebarItem = ({ icon, label, active, onClick, collapsed }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${active ? 'bg-rose-50 text-rose-600 shadow-sm font-black' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'} ${collapsed ? 'justify-center' : ''}`}>
    {icon}
    {!collapsed && <span className="text-sm">{label}</span>}
  </button>
);

export default App;
