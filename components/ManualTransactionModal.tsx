
import React, { useState, useMemo } from 'react';
import { X, Save, Info, ArrowRight, Globe } from 'lucide-react';
import { TransactionType, RawTransaction } from '../types';

interface ManualTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tx: RawTransaction) => void;
  availableTickers: string[];
}

const ManualTransactionModal: React.FC<ManualTransactionModalProps> = ({ isOpen, onClose, onSave, availableTickers }) => {
  const [type, setType] = useState<TransactionType>('BUY');
  const [symbol, setSymbol] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('10:00');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [commission, setCommission] = useState('0');
  const [fxRate, setFxRate] = useState('1');

  // Sync currency with symbol suffix but allow manual override
  useMemo(() => {
    if (symbol.toUpperCase().endsWith('.TO')) setCurrency('CAD');
    else if (symbol.toUpperCase().endsWith('.HK')) setCurrency('HKD');
    else if (symbol.length > 0) setCurrency('USD');
  }, [symbol]);

  const cadPreview = useMemo(() => {
    const qty = parseFloat(quantity) || 0;
    const prc = parseFloat(price) || 0;
    const fx = parseFloat(fxRate) || 1;
    const comm = parseFloat(commission) || 0;
    const totalNative = (qty * prc) + comm;
    const totalCAD = totalNative * fx;
    return { native: totalNative, cad: totalCAD, isValid: !isNaN(totalCAD) && qty > 0 };
  }, [quantity, price, fxRate, commission]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || !quantity || (type !== 'SPLIT' && !price)) return;

    onSave({
      id: `manual-${Date.now()}`,
      symbol: symbol.toUpperCase(),
      currency: currency.toUpperCase(),
      dateTime: new Date(`${date}T${time}:00`),
      type,
      quantity: parseFloat(quantity),
      price: type === 'SPLIT' ? 0 : parseFloat(price),
      commission: parseFloat(commission),
      fxRate: parseFloat(fxRate),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Record Transaction</h2>
            <p className="text-sm text-slate-500">Add a trade or corporate action manually.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} className="text-slate-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {(['BUY', 'SELL', 'SPLIT'] as const).map((t) => (
              <button key={t} type="button" onClick={() => setType(t)} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${type === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{t}</button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Symbol</label>
              <input value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="e.g. NVDA, SHOP.TO" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-bold uppercase" required />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Currency</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-bold">
                {['USD','CAD','HKD','EUR','GBP'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">FX Rate (to CAD)</label>
              <input type="number" step="any" value={fxRate} onChange={(e) => setFxRate(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
            </div>
            <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" required /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Time</label><input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" required /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{type === 'SPLIT' ? 'Shares Added' : 'Quantity'}</label><input type="number" step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" required /></div>
            {type !== 'SPLIT' && (
              <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Price ({currency})</label><input type="number" step="any" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" required /></div>
            )}
          </div>
          {cadPreview.isValid && type !== 'SPLIT' && (
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-between">
              <div className="flex flex-col"><span className="text-[10px] font-bold text-emerald-600 uppercase">Native Total</span><span className="font-bold text-slate-600">${cadPreview.native.toLocaleString()} {currency}</span></div>
              <ArrowRight className="text-emerald-300" size={20} />
              <div className="flex flex-col text-right"><span className="text-[10px] font-bold text-emerald-700 uppercase">CAD Equivalent</span><span className="text-lg font-black text-emerald-800">${cadPreview.cad.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
            </div>
          )}
          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-6 py-3 border border-slate-200 rounded-xl font-bold hover:bg-slate-50">Cancel</button>
            <button type="submit" className="flex-1 px-6 py-3 bg-rose-600 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2"><Save size={18} /> Save Record</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManualTransactionModal;
