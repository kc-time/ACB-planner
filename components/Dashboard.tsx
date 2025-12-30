
import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  AlertCircle, 
  ShieldCheck,
  Globe,
  Briefcase,
  ChevronRight
} from 'lucide-react';
import { PositionSummary, TaxYearSummary, LedgerEntry } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface DashboardProps {
  positions: PositionSummary[];
  taxSummaries: TaxYearSummary[];
  ledger: LedgerEntry[];
}

const Dashboard: React.FC<DashboardProps> = ({ positions, taxSummaries, ledger }) => {
  const totalCostCAD = positions.reduce((acc, p) => acc + p.totalACB, 0);
  const foreignPositions = positions.filter(p => p.isForeign);
  const foreignCost = foreignPositions.reduce((acc, p) => acc + p.totalACB, 0);
  const currentYearSummary = taxSummaries[0] || { year: new Date().getFullYear(), totalRealizedGains: 0, totalRealizedLosses: 0, netGainLoss: 0 };
  
  // Calculate sub-totals by native currency
  const currencyTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    positions.forEach(p => {
      const cur = p.currency || (p.symbol.endsWith('.TO') ? 'CAD' : 'USD');
      totals[cur] = (totals[cur] || 0) + p.totalNativeCost;
    });
    return Object.entries(totals).sort((a, b) => b[1] - a[1]);
  }, [positions]);

  const COLORS = ['#e11d48', '#2563eb', '#059669', '#d97706', '#7c3aed'];

  const chartData = ledger.slice(-20).map(entry => ({
    name: entry.dateTime.toLocaleDateString(),
    acb: entry.acbAfter
  }));

  const pieData = positions
    .sort((a, b) => b.totalACB - a.totalACB)
    .slice(0, 5)
    .map(p => ({
      name: p.symbol,
      value: p.totalACB
    }));

  const formatMoney = (val: number) => val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Portfolio Health</h1>
        <p className="text-slate-500 flex items-center gap-2 font-medium">
          Real-time tax tracking and ACB breakdown <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded text-[10px] font-black uppercase tracking-wider">All report values in CAD</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* REDESIGNED FIRST CARD */}
        <div className="bg-white p-6 rounded-[28px] border border-slate-200 shadow-sm flex flex-col h-full hover:border-rose-400 hover:shadow-xl hover:shadow-rose-100/20 transition-all group">
          <div className="flex justify-between items-start mb-4">
             <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform"><Briefcase size={22} /></div>
             <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-1 rounded-lg border border-rose-100">CAD AGGREGATE</span>
          </div>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Total Portfolio Cost Basis</p>
          
          <div className="flex-1 space-y-2 mb-6">
            {currencyTotals.length > 0 ? currencyTotals.map(([cur, val]) => (
              <div key={cur} className="flex justify-between items-center bg-slate-50/80 px-4 py-2 rounded-xl border border-slate-100/50">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">{cur} Pool</span>
                <span className="text-sm font-black text-slate-900">${formatMoney(val)}</span>
              </div>
            )) : (
              <div className="text-xs text-slate-400 italic py-4">No active positions.</div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100">
             <h2 className="text-2xl font-black text-slate-900 tracking-tight">${formatMoney(totalCostCAD)}</h2>
             <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Adjusted Cost Base (CAD)</p>
          </div>
        </div>

        <StatCard 
          title="Foreign Asset Cost" 
          value={`$${formatMoney(foreignCost)}`} 
          subtitle="Non-CAD Security Pool"
          icon={<Globe className="text-indigo-600" />}
          warning={foreignCost > 100000}
          currency="CAD"
        />
        <StatCard 
          title={`Realized G/L (${currentYearSummary.year})`} 
          value={`$${formatMoney(currentYearSummary.netGainLoss)}`} 
          subtitle="Annual Tax Exposure"
          icon={currentYearSummary.netGainLoss >= 0 ? <TrendingUp className="text-emerald-600" /> : <TrendingDown className="text-rose-600" />}
          trend={currentYearSummary.netGainLoss}
          currency="CAD"
        />
        <StatCard 
          title="Superficial Losses" 
          value={ledger.filter(l => l.isSuperficial).length.toString()} 
          subtitle="CRA Warning Flags"
          icon={<ShieldCheck className="text-amber-600" />}
          caution={ledger.some(l => l.isSuperficial)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm h-[450px]">
          <h3 className="text-lg font-black mb-8 flex items-center gap-2 text-slate-900 tracking-tight">
            <TrendingUp size={22} className="text-rose-500" /> Total ACB Progression (CAD)
          </h3>
          <ResponsiveContainer width="100%" height="80%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorAcb" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e11d48" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#e11d48" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" hide />
              <YAxis tick={{fontSize: 10, fontWeight: 700}} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val/1000}k`} />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Total ACB (CAD)']}
              />
              <Area type="monotone" dataKey="acb" stroke="#e11d48" fillOpacity={1} fill="url(#colorAcb)" strokeWidth={4} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm h-[450px] flex flex-col">
          <h3 className="text-lg font-black mb-8 flex items-center gap-2 text-slate-900 tracking-tight">
            <DollarSign size={22} className="text-rose-500" /> Top Allocations (CAD)
          </h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={70} outerRadius={95} paddingAngle={8} dataKey="value">
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />)}
                </Pie>
                <Tooltip formatter={(val: number) => `$${val.toLocaleString()} CAD`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-8 space-y-3">
            {pieData.map((d, i) => (
              <div key={i} className="flex justify-between text-xs items-center">
                <span className="flex items-center gap-2 font-black text-slate-600 uppercase tracking-tighter">
                  <span className="w-3 h-3 rounded-md" style={{ backgroundColor: COLORS[i] }} /> {d.name}
                </span>
                <span className="font-black text-slate-900">${formatMoney(d.value)} <span className="text-[10px] text-slate-400 ml-1">CAD</span></span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, subtitle, icon, trend, warning, caution, currency }: any) => (
  <div className={`bg-white p-6 rounded-[28px] border-2 ${warning ? 'border-amber-400 bg-amber-50/30' : caution ? 'border-rose-400 bg-rose-50/30' : 'border-slate-100'} shadow-sm transition-all hover:scale-[1.03] hover:shadow-lg group`}>
    <div className="flex justify-between items-start mb-5">
      <div className={`p-3 rounded-2xl ${warning ? 'bg-amber-100' : caution ? 'bg-rose-100' : 'bg-slate-100/80'} group-hover:scale-110 transition-transform`}>{icon}</div>
      {currency && <span className="text-[10px] font-black text-slate-500 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-sm">{currency}</span>}
    </div>
    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{title}</p>
    <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1">{value}</h2>
    <p className="text-slate-500 text-[10px] mt-2 flex items-center gap-1.5 font-bold uppercase tracking-tight">
      {warning && <AlertCircle size={14} className="text-amber-600" />} {subtitle}
    </p>
  </div>
);

export default Dashboard;
