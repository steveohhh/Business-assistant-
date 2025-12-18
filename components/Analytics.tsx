import React, { useState, useMemo } from 'react';
import { Sale, Batch, BusinessIntelligence } from '../types';
import { generateBusinessIntelligence } from '../services/geminiService';
import { useAppStore } from '../stores/useAppStore';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis, BarChart, Bar, Cell, LineChart, Line, Legend, CartesianGrid, PieChart, Pie, ReferenceLine, ComposedChart } from 'recharts';
import { Brain, TrendingUp, AlertTriangle, RefreshCw, Filter, DollarSign, Users, ShieldAlert, Clock, Target, ArrowUpRight, Calendar, Truck, Wallet, CreditCard, Lock, Zap, Grid, Activity, GitMerge, Flag, PieChart as PieIcon, BarChart2, TrendingDown } from 'lucide-react';

// Custom Flow Chart Component
const FlowDiagram = ({ sales, batches, expenses }: { sales: Sale[], batches: Batch[], expenses: any[] }) => {
    // 1. Calculate Aggregates
    const silverRevenue = sales.filter(s => { const c = s.amount; return c < 50; }).reduce((a, b) => a + b.amount, 0); 
    const goldRevenue = sales.filter(s => { const c = s.amount; return c >= 50 && c < 200; }).reduce((a, b) => a + b.amount, 0);
    const platRevenue = sales.filter(s => { const c = s.amount; return c >= 200; }).reduce((a, b) => a + b.amount, 0);
    
    const totalRevenue = sales.reduce((a, b) => a + b.amount, 0);
    
    const cogs = sales.reduce((a, b) => a + b.costBasis, 0);
    const operationalExpenses = expenses.reduce((a, b) => a + b.amount, 0);
    const netProfit = totalRevenue - cogs - operationalExpenses;

    if (totalRevenue === 0) return <div className="text-center p-20 text-gray-500">No revenue data to visualize flow.</div>;

    // 2. SVG Metrics
    const width = 800;
    const height = 400;
    const nodeWidth = 120;
    
    const maxVal = Math.max(totalRevenue, cogs + operationalExpenses + netProfit);
    const scale = (val: number) => Math.max(10, (val / maxVal) * (height - 100));

    // Node Heights
    const hSilver = scale(silverRevenue);
    const hGold = scale(goldRevenue);
    const hPlat = scale(platRevenue);
    const hRev = scale(totalRevenue);
    const hCogs = scale(cogs);
    const hExp = scale(operationalExpenses);
    const hProfit = scale(Math.abs(netProfit));

    // Positions (Y)
    const ySilver = 50;
    const yGold = ySilver + hSilver + 20;
    const yPlat = yGold + hGold + 20;
    const yRev = (height - hRev) / 2;
    const yCogs = 50;
    const yExp = yCogs + hCogs + 20;
    const yProfit = yExp + hExp + 20;

    const drawPath = (x1: number, y1: number, x2: number, y2: number, thick: number, color: string) => {
        const cp1x = x1 + (x2 - x1) / 2;
        const cp2x = x2 - (x2 - x1) / 2;
        return (
            <path 
                d={`M ${x1} ${y1} C ${cp1x} ${y1}, ${cp2x} ${y2}, ${x2} ${y2}`} 
                stroke={color} 
                strokeWidth={Math.max(1, thick)} 
                fill="none" 
                opacity="0.4"
                className="hover:opacity-80 transition-opacity duration-300"
            />
        );
    };

    return (
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="font-mono text-[10px]">
            {drawPath(nodeWidth, ySilver + hSilver/2, width/2 - nodeWidth/2, yRev + hRev*0.2, hSilver, '#9CA3AF')}
            {drawPath(nodeWidth, yGold + hGold/2, width/2 - nodeWidth/2, yRev + hRev*0.5, hGold, '#D4AF37')}
            {drawPath(nodeWidth, yPlat + hPlat/2, width/2 - nodeWidth/2, yRev + hRev*0.8, hPlat, '#22d3ee')}

            {drawPath(width/2 + nodeWidth/2, yRev + hRev*0.2, width - nodeWidth, yCogs + hCogs/2, hCogs, '#EF4444')}
            {drawPath(width/2 + nodeWidth/2, yRev + hRev*0.5, width - nodeWidth, yExp + hExp/2, hExp, '#F59E0B')}
            {drawPath(width/2 + nodeWidth/2, yRev + hRev*0.8, width - nodeWidth, yProfit + hProfit/2, hProfit, netProfit >= 0 ? '#10B981' : '#EF4444')}

            <rect x="0" y={ySilver} width={nodeWidth} height={hSilver} fill="#374151" rx="4" />
            <text x="10" y={ySilver + hSilver/2} fill="white" dy="4">Small Orders</text>
            <text x="10" y={ySilver + hSilver/2 + 12} fill="#9CA3AF" dy="4">${silverRevenue.toFixed(0)}</text>

            <rect x="0" y={yGold} width={nodeWidth} height={hGold} fill="#374151" rx="4" />
            <text x="10" y={yGold + hGold/2} fill="white" dy="4">Mid/Regular</text>
            <text x="10" y={yGold + hGold/2 + 12} fill="#D4AF37" dy="4">${goldRevenue.toFixed(0)}</text>

            <rect x="0" y={yPlat} width={nodeWidth} height={hPlat} fill="#374151" rx="4" />
            <text x="10" y={yPlat + hPlat/2} fill="white" dy="4">Bulk/VIP</text>
            <text x="10" y={yPlat + hPlat/2 + 12} fill="#22d3ee" dy="4">${platRevenue.toFixed(0)}</text>

            <rect x={width/2 - nodeWidth/2} y={yRev} width={nodeWidth} height={hRev} fill="#1F2937" stroke="#6366F1" strokeWidth="2" rx="4" />
            <text x={width/2} y={yRev + hRev/2} fill="white" textAnchor="middle" dy="-6" className="font-bold">REVENUE</text>
            <text x={width/2} y={yRev + hRev/2} fill="#6366F1" textAnchor="middle" dy="12" className="text-lg font-bold">${totalRevenue.toFixed(0)}</text>

            <rect x={width - nodeWidth} y={yCogs} width={nodeWidth} height={hCogs} fill="#374151" rx="4" />
            <text x={width - nodeWidth + 10} y={yCogs + hCogs/2} fill="white" dy="4">COGS</text>
            <text x={width - nodeWidth + 10} y={yCogs + hCogs/2 + 12} fill="#EF4444" dy="4">-${cogs.toFixed(0)}</text>

            <rect x={width - nodeWidth} y={yExp} width={nodeWidth} height={hExp} fill="#374151" rx="4" />
            <text x={width - nodeWidth + 10} y={yExp + hExp/2} fill="white" dy="4">Operations</text>
            <text x={width - nodeWidth + 10} y={yExp + hExp/2 + 12} fill="#F59E0B" dy="4">-${operationalExpenses.toFixed(0)}</text>

            <rect x={width - nodeWidth} y={yProfit} width={nodeWidth} height={hProfit} fill="#374151" stroke={netProfit >= 0 ? "#10B981" : "#EF4444"} rx="4" />
            <text x={width - nodeWidth + 10} y={yProfit + hProfit/2} fill="white" dy="4" className="font-bold">{netProfit >= 0 ? 'PROFIT' : 'LOSS'}</text>
            <text x={width - nodeWidth + 10} y={yProfit + hProfit/2 + 12} fill={netProfit >= 0 ? "#10B981" : "#EF4444"} dy="4" className="font-bold">${netProfit.toFixed(0)}</text>
        </svg>
    );
};

const Analytics: React.FC = () => {
  const { batches, sales, biData, setBiData, operationalExpenses } = useAppStore(state => ({
    batches: state.batches,
    sales: state.sales,
    biData: state.biData,
    setBiData: state.setBiData,
    operationalExpenses: state.operationalExpenses,
  }));
  const [activeTab, setActiveTab] = useState<'FINANCIAL' | 'NET_VALUE' | 'FLOW' | 'PATTERNS' | 'LOSS' | 'PREDICTIVE'>('FINANCIAL');
  const [financialTimeframe, setFinancialTimeframe] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('DAILY');
  const [isLoading, setIsLoading] = useState(false);

  const handleGeneratePredictions = async () => {
      setIsLoading(true);
      const result = await generateBusinessIntelligence(batches, sales);
      setBiData(result);
      setIsLoading(false);
  };

  // --- COMPREHENSIVE FINANCIAL ENGINE ---
  const { financialTrendData, expenseCategoryData, summaryMetrics, netValueData, lossBreakdown } = useMemo(() => {
      // 1. TIMELINE CONSTRUCTION (MERGE ALL FINANCIAL EVENTS)
      const events: { date: Date, amount: number, type: 'REV' | 'EXP' | 'COGS', category?: string }[] = [];

      // Sales (Revenue & COGS)
      sales.forEach(s => {
          events.push({ date: new Date(s.timestamp), amount: s.amount, type: 'REV' });
          events.push({ date: new Date(s.timestamp), amount: -s.costBasis, type: 'COGS' });
      });

      // Operational Expenses
      operationalExpenses.forEach(e => {
          events.push({ date: new Date(e.timestamp), amount: -e.amount, type: 'EXP', category: e.category });
      });

      // Batch Purchases (Initial Layouts) - Optional for pure cashflow, but good for Net Value
      batches.forEach(b => {
          const totalAcqCost = b.purchasePrice + b.fees;
          // We don't count this as daily P&L expense usually (it's asset conversion), 
          // but for Net Cash Flow it matters. For P&L, COGS covers it. 
          // Let's stick to P&L for the main chart.
      });

      events.sort((a,b) => a.date.getTime() - b.date.getTime());

      // 2. NET VALUE GROWTH (CUMULATIVE)
      let cumulative = 0;
      const valueHistory: any[] = [];
      const groupByFormat = (d: Date) => d.toLocaleDateString();
      
      // Group by day for the chart
      const dailyMap: Record<string, { date: string, net: number }> = {};

      events.forEach(e => {
          cumulative += e.amount;
          const dayKey = groupByFormat(e.date);
          if (!dailyMap[dayKey]) dailyMap[dayKey] = { date: dayKey, net: cumulative };
          else dailyMap[dayKey].net = cumulative; // Update to end of day value
      });
      const netValueData = Object.values(dailyMap);

      // 3. P&L TREND DATA
      const plDataMap: Record<string, { date: string, revenue: number, expense: number, profit: number }> = {};
      
      const plLimit = new Date();
      if (financialTimeframe === 'DAILY') plLimit.setDate(plLimit.getDate() - 30);
      if (financialTimeframe === 'WEEKLY') plLimit.setDate(plLimit.getDate() - 90);
      if (financialTimeframe === 'MONTHLY') plLimit.setFullYear(plLimit.getFullYear() - 1);

      events.filter(e => e.date >= plLimit).forEach(e => {
          let key = e.date.toLocaleDateString();
          if (financialTimeframe === 'WEEKLY') {
             const d = new Date(e.date);
             const day = d.getDay(), diff = d.getDate() - day + (day === 0 ? -6 : 1);
             const monday = new Date(d.setDate(diff));
             key = `Wk ${monday.getDate()}/${monday.getMonth()+1}`;
          }
          if (financialTimeframe === 'MONTHLY') key = e.date.toLocaleString('default', { month: 'short', year: '2-digit' });

          if (!plDataMap[key]) plDataMap[key] = { date: key, revenue: 0, expense: 0, profit: 0 };
          
          if (e.type === 'REV') plDataMap[key].revenue += e.amount;
          else if (e.type === 'EXP' || e.type === 'COGS') plDataMap[key].expense += Math.abs(e.amount);
      });

      const financialTrendData = Object.values(plDataMap).map(d => ({
          ...d,
          profit: d.revenue - d.expense
      }));

      // 4. EXPENSE / LOSS BREAKDOWN
      const expenseCats: Record<string, number> = {};
      const lossCauses: Record<string, number> = {};

      operationalExpenses.forEach(e => {
          const cat = e.category || 'Uncategorized';
          expenseCats[cat] = (expenseCats[cat] || 0) + e.amount;
          if (cat.toLowerCase().includes('loss') || cat.toLowerCase().includes('waste') || cat.toLowerCase().includes('theft')) {
              lossCauses[e.description] = (lossCauses[e.description] || 0) + e.amount;
          }
      });

      const expenseCategoryData = Object.entries(expenseCats).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
      const lossBreakdown = Object.entries(lossCauses).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);

      // 5. SUMMARY
      const totalRev = sales.reduce((a,b) => a + b.amount, 0);
      const totalExp = operationalExpenses.reduce((a,b) => a + b.amount, 0) + sales.reduce((a,b) => a + b.costBasis, 0);
      const totalNet = totalRev - totalExp;

      return { financialTrendData, expenseCategoryData, summaryMetrics: { totalRev, totalNet, totalExp }, netValueData, lossBreakdown };
  }, [sales, operationalExpenses, batches, financialTimeframe]);

  // Heatmap Data
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const heatmapData = useMemo(() => {
      const grid = Array.from({ length: 7 }, () => Array(24).fill(0));
      sales.forEach(sale => {
          const d = new Date(sale.timestamp);
          grid[d.getDay()][d.getHours()] += sale.amount;
      });
      const data = [];
      for (let d = 0; d < 7; d++) {
          for (let h = 0; h < 24; h++) {
              if (grid[d][h] > 0) data.push({ day: d, hour: h, value: grid[d][h] });
          }
      }
      return data;
  }, [sales]);

  return (
    <div className="space-y-6 h-full flex flex-col">
       <div className="flex justify-between items-center mb-4">
           <h2 className="text-2xl font-bold text-white tracking-tight uppercase">Intelligence Deck</h2>
           <div className="flex gap-2 bg-white/5 p-1 rounded-lg overflow-x-auto custom-scrollbar max-w-[60vw]">
               {['FINANCIAL', 'NET_VALUE', 'FLOW', 'LOSS', 'PATTERNS', 'PREDICTIVE'].map(tab => (
                   <button 
                    key={tab}
                    onClick={() => setActiveTab(tab as any)} 
                    className={`px-4 py-2 rounded text-xs font-bold uppercase transition-all whitespace-nowrap ${activeTab === tab ? 'bg-cyber-gold text-black' : 'text-gray-400 hover:text-white'}`}
                   >
                       {tab.replace('_', ' ')}
                   </button>
               ))}
           </div>
       </div>

       {/* --- NET VALUE GROWTH --- */}
       {activeTab === 'NET_VALUE' && (
           <div className="space-y-6 animate-fade-in">
               <div className="bg-cyber-panel p-6 rounded-2xl border border-white/10 h-96 flex flex-col">
                   <h3 className="text-white font-bold uppercase text-sm mb-4 flex items-center gap-2"><TrendingUp size={16} className="text-cyber-green"/> Cumulative Net Worth Growth</h3>
                   <div className="flex-1 min-h-0">
                       <ResponsiveContainer width="100%" height="100%">
                           <AreaChart data={netValueData}>
                               <defs>
                                   <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                                       <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                                       <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                                   </linearGradient>
                               </defs>
                               <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                               <XAxis dataKey="date" stroke="#666" fontSize={10} minTickGap={30}/>
                               <YAxis stroke="#666" fontSize={10} tickFormatter={(val) => `$${val}`}/>
                               <Tooltip contentStyle={{backgroundColor: '#000', border: '1px solid #333', color: '#fff'}} />
                               <Area type="monotone" dataKey="net" stroke="#10B981" fillOpacity={1} fill="url(#colorNet)" strokeWidth={2} />
                           </AreaChart>
                       </ResponsiveContainer>
                   </div>
                   <p className="text-center text-[10px] text-gray-500 mt-2">Realized Profit Accumulation over Time</p>
               </div>
           </div>
       )}

       {/* --- LOSS ANALYSIS --- */}
       {activeTab === 'LOSS' && (
           <div className="space-y-6 animate-fade-in">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                   <div className="bg-cyber-panel p-6 rounded-2xl border border-white/10 h-80 flex flex-col">
                       <h3 className="text-white font-bold uppercase text-sm mb-4 flex items-center gap-2"><PieIcon size={16} className="text-red-500"/> Expense Composition</h3>
                       <ResponsiveContainer width="100%" height="100%">
                           <PieChart>
                               <Pie data={expenseCategoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                   {expenseCategoryData.map((entry, index) => (
                                       <Cell key={`cell-${index}`} fill={['#EF4444', '#F59E0B', '#6366F1', '#10B981'][index % 4]} stroke="#000" />
                                   ))}
                               </Pie>
                               <Tooltip contentStyle={{backgroundColor: '#000', border: '1px solid #333', color: '#fff'}} />
                               <Legend verticalAlign="bottom" height={36} />
                           </PieChart>
                       </ResponsiveContainer>
                   </div>

                   <div className="bg-cyber-panel p-6 rounded-2xl border border-white/10 h-80 flex flex-col">
                       <h3 className="text-white font-bold uppercase text-sm mb-4 flex items-center gap-2"><TrendingDown size={16} className="text-red-500"/> Specific Loss Events</h3>
                       {lossBreakdown.length > 0 ? (
                           <ResponsiveContainer width="100%" height="100%">
                               <BarChart layout="vertical" data={lossBreakdown}>
                                   <XAxis type="number" hide />
                                   <YAxis dataKey="name" type="category" width={100} stroke="#fff" fontSize={10} />
                                   <Tooltip contentStyle={{backgroundColor: '#000', border: '1px solid #333', color: '#fff'}} cursor={{fill: 'transparent'}}/>
                                   <Bar dataKey="value" fill="#EF4444" radius={[0, 4, 4, 0]} barSize={20} />
                               </BarChart>
                           </ResponsiveContainer>
                       ) : (
                           <div className="flex-1 flex items-center justify-center text-gray-500 text-xs italic">No specific loss events recorded.</div>
                       )}
                   </div>
               </div>
           </div>
       )}

       {/* --- FLOW DIAGRAM --- */}
       {activeTab === 'FLOW' && (
           <div className="h-full bg-cyber-panel border border-white/10 rounded-2xl p-6 flex flex-col animate-fade-in">
               <div className="flex justify-between items-start mb-6">
                   <div>
                        <h3 className="text-white font-bold uppercase text-sm flex items-center gap-2"><GitMerge size={16} className="text-blue-400"/> Value Stream Mapping</h3>
                        <p className="text-xs text-gray-500">Visualizing capital allocation from customer segments to net profit.</p>
                   </div>
               </div>
               <div className="flex-1 w-full flex items-center justify-center bg-black/20 rounded-xl overflow-hidden">
                   <FlowDiagram sales={sales} batches={batches} expenses={operationalExpenses} />
               </div>
           </div>
       )}

       {/* --- PATTERNS (HEATMAP) --- */}
       {activeTab === 'PATTERNS' && (
           <div className="space-y-6 animate-fade-in">
               <div className="bg-cyber-panel p-6 rounded-2xl border border-white/10 h-96 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-orange-500 font-bold flex items-center gap-2 uppercase text-sm"><Calendar size={16}/> Sales Chrono-Map</h3>
                        <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-1 rounded">Density: Revenue Volume</span>
                    </div>
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <ScatterChart margin={{top: 20, right: 20, bottom: 20, left: 20}}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                              <XAxis type="number" dataKey="hour" name="Hour" unit="h" domain={[0, 24]} stroke="#666" tickCount={12} tick={{fontSize: 10}}/>
                              <YAxis type="number" dataKey="day" name="Day" tickFormatter={(val) => days[val]} domain={[0, 6]} stroke="#666" tickCount={7} interval={0} reversed tick={{fontSize: 10}}/>
                              <ZAxis type="number" dataKey="value" range={[50, 600]} name="Volume" />
                              <Tooltip 
                                  cursor={{strokeDasharray: '3 3'}} 
                                  contentStyle={{backgroundColor: '#1A1A1A', border: '1px solid #F97316', color: '#fff'}} 
                                  formatter={(value: any) => [`$${value}`, `Volume`]}
                                  labelFormatter={() => ''}
                              />
                              <Scatter name="Sales Volume" data={heatmapData} fill="#F97316" fillOpacity={0.7} shape="circle" />
                          </ScatterChart>
                       </ResponsiveContainer>
                    </div>
                    <p className="text-center text-[10px] text-gray-500 mt-2">Larger hotspots indicate peak revenue hours.</p>
               </div>
           </div>
       )}

       {/* --- MAIN FINANCIALS --- */}
       {activeTab === 'FINANCIAL' && (
           <div className="space-y-6 animate-fade-in">
               <div className="grid grid-cols-3 gap-6 mb-6">
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                        <span className="text-[10px] text-gray-500 uppercase font-bold">Total Revenue</span>
                        <div className="text-2xl font-mono text-blue-400 font-bold">${summaryMetrics.totalRev.toFixed(0)}</div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                        <span className="text-[10px] text-gray-500 uppercase font-bold">Total Costs (COGS+OpEx)</span>
                        <div className="text-2xl font-mono text-red-500 font-bold">-${summaryMetrics.totalExp.toFixed(0)}</div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                        <span className="text-[10px] text-gray-500 uppercase font-bold">Net Profit</span>
                        <div className={`text-2xl font-mono font-bold ${summaryMetrics.totalNet >= 0 ? 'text-cyber-green' : 'text-red-500'}`}>
                            ${summaryMetrics.totalNet.toFixed(0)}
                        </div>
                    </div>
               </div>

               <div className="h-80 bg-black/20 rounded-xl p-4 border border-white/5">
                   <div className="flex justify-between mb-4">
                       <h4 className="text-xs font-bold text-gray-400 uppercase">P&L History</h4>
                       <div className="flex bg-black/40 p-1 rounded-lg border border-white/10">
                           {['DAILY', 'WEEKLY', 'MONTHLY'].map((t) => (
                               <button key={t} onClick={() => setFinancialTimeframe(t as any)} className={`px-2 py-1 rounded text-[9px] font-bold uppercase transition-all ${financialTimeframe === t ? 'bg-cyber-gold text-black' : 'text-gray-500'}`}>{t}</button>
                           ))}
                       </div>
                   </div>
                   <ResponsiveContainer width="100%" height="100%">
                       <ComposedChart data={financialTrendData}>
                           <defs>
                               <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                   <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                                   <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                               </linearGradient>
                           </defs>
                           <XAxis dataKey="date" stroke="#666" fontSize={10} tickLine={false} />
                           <YAxis stroke="#666" fontSize={10} tickLine={false} tickFormatter={(val) => `$${val}`}/>
                           <Tooltip contentStyle={{backgroundColor: '#000', border: '1px solid #333', color: '#fff'}} />
                           <Legend verticalAlign="top" height={36} iconSize={8} wrapperStyle={{fontSize: '10px'}}/>
                           <Bar dataKey="revenue" name="Revenue" barSize={20} fill="#3B82F6" opacity={0.5} />
                           <Bar dataKey="expense" name="Expenses" barSize={20} fill="#EF4444" opacity={0.5} />
                           <Line type="monotone" dataKey="profit" name="Net Profit" stroke="#10B981" strokeWidth={3} dot={false} />
                           <Area type="monotone" dataKey="profit" fill="url(#colorProfit)" stroke="none" />
                       </ComposedChart>
                   </ResponsiveContainer>
               </div>
           </div>
       )}

       {activeTab === 'PREDICTIVE' && (
           <div className="space-y-6 animate-fade-in flex-1">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                   <div className="space-y-6">
                        {!biData?.forecast ? (
                            <div className="h-64 flex flex-col items-center justify-center p-6 border border-white/10 rounded-2xl bg-cyber-panel">
                               <Brain size={48} className="text-gray-600 mb-4" />
                               <h3 className="text-lg text-white font-bold mb-2">Forecasting Engine</h3>
                               <p className="text-gray-500 mb-4 text-center text-sm">Initialize AI to generate revenue trajectories and archetype targeting.</p>
                               <button 
                                onClick={handleGeneratePredictions} 
                                disabled={isLoading}
                                className="bg-cyber-purple hover:bg-cyber-purple/80 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                               >
                                   {isLoading ? <RefreshCw className="animate-spin" size={16}/> : <TrendingUp size={16}/>}
                                   {isLoading ? 'Running Simulations...' : 'Generate AI Forecast'}
                               </button>
                            </div>
                        ) : (
                            <div className="bg-cyber-panel border border-white/10 rounded-2xl p-6">
                                <h3 className="text-cyber-green font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
                                    <TrendingUp size={16}/> Revenue Forecast
                                </h3>
                                <div className="h-48 w-full mt-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={biData.forecast.dailyTrend || []}>
                                            <defs>
                                                <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.6}/>
                                                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <XAxis dataKey="day" stroke="#666" fontSize={10} tickLine={false}/>
                                            <YAxis hide/>
                                            <Tooltip contentStyle={{backgroundColor: '#000', border: '1px solid #333', color: '#fff'}} itemStyle={{color: '#D4AF37'}} />
                                            <Area type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={3} fill="url(#gradRevenue)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}
                   </div>
               </div>
           </div>
       )}
    </div>
  );
};

export default Analytics;