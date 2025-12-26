
import React, { useState, useMemo } from 'react';
import { Sale, Batch, BusinessIntelligence } from '../types';
import { generateBusinessIntelligence } from '../services/geminiService';
import { useAppStore } from '../stores/useAppStore';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, ComposedChart, Bar, Line, PieChart, Pie, Cell } from 'recharts';
// Added missing Zap icon import
import { Brain, TrendingUp, RefreshCw, DollarSign, Activity, GitMerge, PieChart as PieIcon, TrendingDown, Calendar, Layers, BarChart2, Zap } from 'lucide-react';

const FlowDiagram = ({ sales, batches, expenses }: { sales: Sale[], batches: Batch[], expenses: any[] }) => {
    const metrics = useMemo(() => {
        const totalRevenue = sales.reduce((a, b) => a + b.amount, 0);
        const cogs = sales.reduce((a, b) => a + b.costBasis, 0);
        const operationalExpenses = expenses.reduce((a, b) => a + b.amount, 0);
        const netProfit = totalRevenue - cogs - operationalExpenses;
        return { totalRevenue, cogs, operationalExpenses, netProfit };
    }, [sales, expenses]);

    if (metrics.totalRevenue === 0) return <div className="text-center p-20 text-gray-500">No revenue data.</div>;

    return (
        <div className="w-full h-64 flex flex-col items-center justify-center p-8 bg-black/40 rounded-3xl border border-white/5">
             <GitMerge size={48} className="text-blue-500 mb-4 animate-pulse"/>
             <div className="grid grid-cols-3 gap-8 w-full text-center">
                 <div><div className="text-[10px] text-gray-500 uppercase font-bold">Revenue</div><div className="text-2xl font-mono font-bold text-white">${metrics.totalRevenue.toFixed(0)}</div></div>
                 <div><div className="text-[10px] text-gray-500 uppercase font-bold">COGS</div><div className="text-2xl font-mono font-bold text-red-500">-${metrics.cogs.toFixed(0)}</div></div>
                 <div><div className="text-[10px] text-gray-500 uppercase font-bold">Net Profit</div><div className={`text-2xl font-mono font-bold ${metrics.netProfit >= 0 ? 'text-cyber-green' : 'text-red-500'}`}>${metrics.netProfit.toFixed(0)}</div></div>
             </div>
        </div>
    );
};

const Analytics: React.FC = () => {
  const batches = useAppStore(state => state.batches);
  const sales = useAppStore(state => state.sales);
  const biData = useAppStore(state => state.biData);
  const setBiData = useAppStore(state => state.setBiData);
  const operationalExpenses = useAppStore(state => state.operationalExpenses);
  
  const [activeTab, setActiveTab] = useState<'FINANCIAL' | 'NET_VALUE' | 'FLOW' | 'PREDICTIVE'>('FINANCIAL');
  const [isLoading, setIsLoading] = useState(false);

  const handleGeneratePredictions = async () => {
      setIsLoading(true);
      const result = await generateBusinessIntelligence(batches, sales);
      if (result) setBiData(result);
      setIsLoading(false);
  };

  const { financialTrendData, summaryMetrics, netValueData } = useMemo(() => {
      let cumulative = 0;
      const dailyMap: Record<string, { date: string, net: number, revenue: number, expense: number }> = {};
      
      sales.forEach(s => {
          const key = new Date(s.timestamp).toLocaleDateString();
          if (!dailyMap[key]) dailyMap[key] = { date: key, net: 0, revenue: 0, expense: 0 };
          dailyMap[key].revenue += s.amount;
          dailyMap[key].expense += s.costBasis;
      });

      operationalExpenses.forEach(e => {
          const key = new Date(e.timestamp).toLocaleDateString();
          if (!dailyMap[key]) dailyMap[key] = { date: key, net: 0, revenue: 0, expense: 0 };
          dailyMap[key].expense += e.amount;
      });

      const trend = Object.values(dailyMap).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const netHistory = trend.map(d => {
          cumulative += (d.revenue - d.expense);
          return { ...d, net: cumulative };
      });

      const totalRev = sales.reduce((a,b) => a + b.amount, 0);
      const totalExp = operationalExpenses.reduce((a,b) => a + b.amount, 0) + sales.reduce((a,b) => a + b.costBasis, 0);
      const totalNet = totalRev - totalExp;

      return { financialTrendData: trend, netValueData: netHistory, summaryMetrics: { totalRev, totalExp, totalNet } };
  }, [sales, operationalExpenses]);

  return (
    <div className="space-y-6 h-full flex flex-col pb-20 animate-fade-in">
       <div className="flex justify-between items-center mb-4">
           <h2 className="text-2xl font-bold text-white uppercase tracking-tight">Intelligence Deck</h2>
           <div className="flex gap-2 bg-white/5 p-1 rounded-lg">
               {['FINANCIAL', 'NET_VALUE', 'FLOW', 'PREDICTIVE'].map(tab => (
                   <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-4 py-2 rounded text-[10px] font-bold uppercase transition-all ${activeTab === tab ? 'bg-cyber-gold text-black' : 'text-gray-400 hover:text-white'}`}>{tab.replace('_', ' ')}</button>
               ))}
           </div>
       </div>

       {activeTab === 'FINANCIAL' && (
           <div className="space-y-6">
                <div className="grid grid-cols-3 gap-6">
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-center"><div className="text-[9px] text-gray-500 uppercase font-bold">Revenue</div><div className="text-2xl font-mono text-blue-400 font-bold">${summaryMetrics.totalRev.toFixed(0)}</div></div>
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-center"><div className="text-[9px] text-gray-500 uppercase font-bold">Expenses</div><div className="text-2xl font-mono text-red-500 font-bold">-${summaryMetrics.totalExp.toFixed(0)}</div></div>
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-center"><div className="text-[9px] text-gray-500 uppercase font-bold">Net Profit</div><div className={`text-2xl font-mono font-bold ${summaryMetrics.totalNet >= 0 ? 'text-cyber-green' : 'text-red-500'}`}>${summaryMetrics.totalNet.toFixed(0)}</div></div>
                </div>
                <div className="h-96 bg-cyber-panel border border-white/10 rounded-3xl p-6">
                    <h3 className="text-white font-bold uppercase text-xs mb-6 flex items-center gap-2"><BarChart2 size={16} className="text-blue-400"/> Daily P&L Trend</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={financialTrendData}>
                            <XAxis dataKey="date" hide /><YAxis stroke="#666" fontSize={10} tickFormatter={v => `$${v}`} /><Tooltip contentStyle={{backgroundColor: '#000', border: '1px solid #333'}} /><Bar dataKey="revenue" fill="#3B82F6" barSize={20} opacity={0.5} /><Bar dataKey="expense" fill="#EF4444" barSize={20} opacity={0.5} /><Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={3} dot={false} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
           </div>
       )}

       {activeTab === 'NET_VALUE' && (
           <div className="h-96 bg-cyber-panel border border-white/10 rounded-3xl p-6">
                <h3 className="text-white font-bold uppercase text-xs mb-6 flex items-center gap-2"><TrendingUp size={16} className="text-cyber-green"/> Cumulative Growth</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={netValueData}>
                        <defs><linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10B981" stopOpacity={0}/></linearGradient></defs>
                        <XAxis dataKey="date" hide /><YAxis stroke="#666" fontSize={10} /><Tooltip contentStyle={{backgroundColor: '#000', border: '1px solid #333'}} /><Area type="monotone" dataKey="net" stroke="#10B981" fill="url(#colorNet)" strokeWidth={3} />
                    </AreaChart>
                </ResponsiveContainer>
           </div>
       )}

       {activeTab === 'FLOW' && <FlowDiagram sales={sales} batches={batches} expenses={operationalExpenses} />}

       {activeTab === 'PREDICTIVE' && (
           <div className="flex-1 flex flex-col items-center justify-center p-12 border border-dashed border-white/10 rounded-3xl bg-cyber-panel">
               <Brain size={64} className="text-cyber-purple mb-4 animate-pulse"/>
               <h3 className="text-xl font-bold text-white mb-2">Simulated Trajectories</h3>
               <p className="text-gray-500 mb-8 text-center max-w-sm">Use AI to project stockout dates and weekly revenue forecasts based on current burn rates.</p>
               <button onClick={handleGeneratePredictions} disabled={isLoading} className="bg-cyber-purple text-white px-8 py-3 rounded-xl font-bold flex items-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(99,102,241,0.3)]">{isLoading ? <RefreshCw className="animate-spin" size={20}/> : <Zap size={20}/>} Initialize Forecast</button>
           </div>
       )}
    </div>
  );
};

export default Analytics;
