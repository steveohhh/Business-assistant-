import React, { useState } from 'react';
import { Sale, Batch, BusinessIntelligence } from '../types';
import { generateBusinessIntelligence } from '../services/geminiService';
import { useData } from '../DataContext';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis, BarChart, Bar, Cell, LineChart, Line, Legend, CartesianGrid, PieChart, Pie } from 'recharts';
import { Brain, TrendingUp, AlertTriangle, RefreshCw, Filter, DollarSign, Users, ShieldAlert, Clock, Target, ArrowUpRight, Calendar, Truck } from 'lucide-react';

interface AnalyticsProps {
  sales: Sale[];
}

const Analytics: React.FC<AnalyticsProps> = ({ sales }) => {
  const { batches, customers, settings, biData, setBiData } = useData();
  const [activeTab, setActiveTab] = useState<'FINANCIAL' | 'CASHFLOW' | 'PREDICTIVE' | 'TEAM'>('FINANCIAL');
  const [isLoading, setIsLoading] = useState(false);

  const handleGeneratePredictions = async () => {
      setIsLoading(true);
      const result = await generateBusinessIntelligence(batches, sales);
      setBiData(result);
      setIsLoading(false);
  };

  // --- METRIC CALCULATIONS ---

  // 1. Profit & ROI
  const totalRevenue = sales.reduce((acc, s) => acc + s.amount, 0);
  const totalProfit = sales.reduce((acc, s) => acc + s.profit, 0);
  const totalCost = totalRevenue - totalProfit;
  const roiPercent = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;
  const marginPercent = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  // 2. Profit Trajectory Data
  const salesByDate = sales.reduce((acc, sale) => {
    const date = new Date(sale.timestamp).toLocaleDateString();
    if (!acc[date]) acc[date] = { date, profit: 0, revenue: 0 };
    acc[date].profit += sale.profit;
    acc[date].revenue += sale.amount;
    return acc;
  }, {} as Record<string, any>);
  const profitData = Object.values(salesByDate).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // 3. Cash Flow Data
  const getCashFlowData = () => {
      const flows: Record<string, { date: string, inflow: number, outflow: number, net: number }> = {};
      sales.forEach(s => {
          const d = new Date(s.timestamp).toLocaleDateString();
          if (!flows[d]) flows[d] = { date: d, inflow: 0, outflow: 0, net: 0 };
          flows[d].inflow += s.amount;
      });
      batches.forEach(b => {
          const d = new Date(b.dateAdded).toLocaleDateString();
          if (!flows[d]) flows[d] = { date: d, inflow: 0, outflow: 0, net: 0 };
          const totalBatchCost = b.purchasePrice + b.fees + b.expenses.reduce((sum, e) => sum + e.amount, 0);
          flows[d].outflow += totalBatchCost;
      });
      batches.forEach(b => {
          b.expenses.forEach(e => {
               const d = new Date(e.timestamp).toLocaleDateString();
               if (!flows[d]) flows[d] = { date: d, inflow: 0, outflow: 0, net: 0 };
               flows[d].outflow += e.amount;
          });
      });
      return Object.values(flows)
        .map(f => ({ ...f, net: f.inflow - f.outflow }))
        .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };
  const cashFlowData = getCashFlowData();
  const totalInflow = cashFlowData.reduce((acc, c) => acc + c.inflow, 0);
  const totalOutflow = cashFlowData.reduce((acc, c) => acc + c.outflow, 0);
  const currentLiquidity = totalInflow - totalOutflow;

  // 4. Heatmap & Best Days
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const heatmapData = sales.map(sale => {
    const d = new Date(sale.timestamp);
    return { day: d.getDay(), hour: d.getHours(), value: sale.amount };
  });
  
  // Aggregated Sales by Day
  const salesByDay = sales.reduce((acc, s) => {
      const d = new Date(s.timestamp).getDay();
      acc[d] = (acc[d] || 0) + s.amount;
      return acc;
  }, new Array(7).fill(0));
  const bestDayIndex = salesByDay.indexOf(Math.max(...salesByDay));
  const bestDayName = days[bestDayIndex];
  const salesByDayChart = salesByDay.map((val, idx) => ({ name: days[idx], value: val }));

  // 5. Funnel Data
  const funnelCounts = {
      leads: customers.length,
      oneTime: customers.filter(c => c.transactionHistory.length === 1).length,
      returning: customers.filter(c => c.transactionHistory.length > 1 && c.transactionHistory.length < 5).length,
      loyal: customers.filter(c => c.transactionHistory.length >= 5).length
  };
  const funnelData = [
      { name: 'Total Database', value: funnelCounts.leads, fill: '#6366F1' },
      { name: 'One-Time Buyers', value: funnelCounts.oneTime, fill: '#D4AF37' },
      { name: 'Returning', value: funnelCounts.returning, fill: '#10B981' },
      { name: 'Loyal VIP', value: funnelCounts.loyal, fill: '#EF4444' }
  ];

  // 6. Staff & Risk Data
  const staffStats = settings.staffMembers.map(staffName => {
      const staffSales = sales.filter(s => s.salesRep === staffName);
      const totalRev = staffSales.reduce((acc, s) => acc + s.amount, 0);
      const commission = totalRev * (settings.commissionRate / 100);
      return { name: staffName, salesCount: staffSales.length, revenue: totalRev, commission: commission };
  }).sort((a, b) => b.revenue - a.revenue);

  const riskCounts = {
      low: customers.filter(c => (c.assessmentData?.riskScore || 0) <= 3).length,
      med: customers.filter(c => (c.assessmentData?.riskScore || 0) > 3 && (c.assessmentData?.riskScore || 0) <= 7).length,
      high: customers.filter(c => (c.assessmentData?.riskScore || 0) > 7).length,
      unknown: customers.filter(c => !c.assessmentData).length
  };
  const riskData = [
      { name: 'Low Risk', value: riskCounts.low, color: '#10B981' },
      { name: 'Medium Risk', value: riskCounts.med, color: '#F59E0B' },
      { name: 'High Risk', value: riskCounts.high, color: '#EF4444' },
      { name: 'Unknown', value: riskCounts.unknown, color: '#6B7280' }
  ];

  return (
    <div className="space-y-6 h-full flex flex-col">
       <div className="flex justify-between items-center mb-4">
           <h2 className="text-2xl font-bold text-white tracking-tight uppercase">Intelligence Deck</h2>
           <div className="flex gap-2 bg-white/5 p-1 rounded-lg">
               <button 
                onClick={() => setActiveTab('FINANCIAL')} 
                className={`px-4 py-2 rounded text-xs font-bold uppercase transition-all ${activeTab === 'FINANCIAL' ? 'bg-cyber-gold text-black' : 'text-gray-400 hover:text-white'}`}
               >
                   Financials
               </button>
               <button 
                onClick={() => setActiveTab('CASHFLOW')} 
                className={`px-4 py-2 rounded text-xs font-bold uppercase transition-all ${activeTab === 'CASHFLOW' ? 'bg-cyber-green text-black' : 'text-gray-400 hover:text-white'}`}
               >
                   Cash Flow
               </button>
               <button 
                onClick={() => setActiveTab('TEAM')} 
                className={`px-4 py-2 rounded text-xs font-bold uppercase transition-all flex items-center gap-2 ${activeTab === 'TEAM' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'}`}
               >
                   <Users size={14} /> Team & Risk
               </button>
               <button 
                onClick={() => setActiveTab('PREDICTIVE')} 
                className={`px-4 py-2 rounded text-xs font-bold uppercase transition-all flex items-center gap-2 ${activeTab === 'PREDICTIVE' ? 'bg-cyber-purple text-white' : 'text-gray-400 hover:text-white'}`}
               >
                   <Brain size={14} /> Predictive AI
               </button>
           </div>
       </div>

       {activeTab === 'FINANCIAL' && (
           <div className="space-y-6 animate-fade-in">
               {/* Top Row Stats */}
               <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-cyber-panel p-6 rounded-2xl border border-white/10">
                      <h3 className="text-gray-400 text-xs uppercase">Total Revenue</h3>
                      <p className="text-3xl font-mono text-white mt-2">${totalRevenue.toFixed(0)}</p>
                  </div>
                  <div className="bg-cyber-panel p-6 rounded-2xl border border-white/10">
                      <h3 className="text-gray-400 text-xs uppercase">Net Profit</h3>
                      <p className="text-3xl font-mono text-cyber-green mt-2">${totalProfit.toFixed(0)}</p>
                  </div>
                  
                  {/* NEW: ROI & MARGIN CARD */}
                  <div className="bg-cyber-panel p-6 rounded-2xl border border-white/10 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><ArrowUpRight size={48} className="text-cyber-gold"/></div>
                      <h3 className="text-cyber-gold text-xs uppercase font-bold flex items-center gap-2"><ArrowUpRight size={14}/> Returns</h3>
                      <div className="flex justify-between items-end mt-2">
                          <div>
                              <p className="text-xs text-gray-500 uppercase">Margin</p>
                              <p className="text-2xl font-mono text-white font-bold">{marginPercent.toFixed(1)}%</p>
                          </div>
                          <div className="text-right">
                              <p className="text-xs text-gray-500 uppercase">ROI</p>
                              <p className="text-2xl font-mono text-cyber-gold font-bold">{roiPercent.toFixed(0)}%</p>
                          </div>
                      </div>
                  </div>

                  <div className="bg-cyber-panel p-6 rounded-2xl border border-white/10">
                      <h3 className="text-gray-400 text-xs uppercase">Best Day</h3>
                      <p className="text-3xl font-mono text-cyber-purple mt-2">{bestDayName}</p>
                  </div>
               </div>

               {/* Charts */}
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                   <div className="lg:col-span-2 bg-cyber-panel p-6 rounded-2xl border border-white/10 h-80">
                      <h3 className="text-white font-bold mb-4">Profit Trajectory</h3>
                      <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={profitData}>
                              <defs>
                                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                                  </linearGradient>
                              </defs>
                              <XAxis dataKey="date" stroke="#666" fontSize={12} tickLine={false} />
                              <YAxis stroke="#666" fontSize={12} tickLine={false} tickFormatter={(val) => `$${val}`}/>
                              <Tooltip contentStyle={{backgroundColor: '#1A1A1A', border: '1px solid #333', color: '#fff'}} itemStyle={{color: '#10B981'}} />
                              <Area type="monotone" dataKey="profit" stroke="#10B981" fillOpacity={1} fill="url(#colorProfit)" />
                          </AreaChart>
                      </ResponsiveContainer>
                   </div>
                   
                   {/* HEATMAP / BEST SALES DAYS */}
                   <div className="bg-cyber-panel p-6 rounded-2xl border border-white/10 h-80">
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Calendar size={16}/> Sales Heatmap</h3>
                        <ResponsiveContainer width="100%" height="100%">
                          <ScatterChart margin={{top: 20, right: 20, bottom: 20, left: 20}}>
                              <XAxis type="number" dataKey="hour" name="Hour" unit="h" domain={[0, 24]} stroke="#666" tickCount={6}/>
                              <YAxis type="number" dataKey="day" name="Day" tickFormatter={(val) => days[val]} domain={[0, 6]} stroke="#666" tickCount={7} interval={0}/>
                              <ZAxis type="number" dataKey="value" range={[20, 400]} />
                              <Tooltip cursor={{strokeDasharray: '3 3'}} contentStyle={{backgroundColor: '#1A1A1A', border: '1px solid #333', color: '#fff'}}/>
                              <Scatter name="Sales Volume" data={heatmapData} fill="#D4AF37" fillOpacity={0.7} />
                          </ScatterChart>
                       </ResponsiveContainer>
                   </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-cyber-panel p-6 rounded-2xl border border-white/10 h-64">
                        <h3 className="text-white font-bold mb-4">Daily Performance Breakdown</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={salesByDayChart}>
                                <XAxis dataKey="name" stroke="#666" fontSize={12} />
                                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{backgroundColor: '#1A1A1A', border: '1px solid #333', color: '#fff'}} />
                                <Bar dataKey="value" fill="#6366F1" radius={[4, 4, 0, 0]}>
                                    {salesByDayChart.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.name === bestDayName ? '#D4AF37' : '#6366F1'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    
                    {/* Funnel Chart */}
                   <div className="bg-cyber-panel p-6 rounded-2xl border border-white/10 h-64">
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Filter size={16}/> Customer Funnel</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={funnelData} margin={{top: 0, right: 30, left: 30, bottom: 0}}>
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" stroke="#fff" fontSize={10} width={90} />
                                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{backgroundColor: '#1A1A1A', border: '1px solid #333', color: '#fff'}} />
                                <Bar dataKey="value" barSize={20} radius={[0, 4, 4, 0]}>
                                    {funnelData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                   </div>
               </div>
           </div>
       )}

       {activeTab === 'TEAM' && (
           <div className="space-y-6 animate-fade-in">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                   
                   {/* STAFF PERFORMANCE */}
                   <div className="bg-cyber-panel p-6 rounded-2xl border border-white/10">
                       <h3 className="text-white font-bold mb-6 flex items-center gap-2"><Users size={20}/> Staff Leaderboard</h3>
                       
                       <div className="h-64 mb-6">
                           <ResponsiveContainer width="100%" height="100%">
                               <BarChart data={staffStats} layout="vertical" margin={{left: 20}}>
                                   <XAxis type="number" hide />
                                   <YAxis dataKey="name" type="category" stroke="#fff" width={100} tick={{fontSize: 12}} />
                                   <Tooltip cursor={{fill: 'transparent'}} contentStyle={{backgroundColor: '#000', border: '1px solid #333'}} />
                                   <Bar dataKey="revenue" fill="#6366F1" radius={[0, 4, 4, 0]} barSize={20} />
                               </BarChart>
                           </ResponsiveContainer>
                       </div>

                       <div className="space-y-2">
                           {staffStats.map((staff, i) => (
                               <div key={staff.name} className="flex justify-between items-center bg-white/5 p-3 rounded-lg">
                                   <div className="flex items-center gap-3">
                                       <span className="font-bold text-gray-400">#{i+1}</span>
                                       <span className="text-white font-bold">{staff.name}</span>
                                   </div>
                                   <div className="text-right">
                                       <div className="text-cyber-green font-mono">${staff.revenue.toFixed(0)}</div>
                                       <div className="text-[10px] text-gray-500">
                                            Commission ({settings.commissionRate}%): <span className="text-cyber-gold">${staff.commission.toFixed(2)}</span>
                                       </div>
                                   </div>
                               </div>
                           ))}
                       </div>
                   </div>

                   {/* GLOBAL RISK DISTRIBUTION */}
                   <div className="bg-cyber-panel p-6 rounded-2xl border border-white/10">
                       <h3 className="text-white font-bold mb-6 flex items-center gap-2"><ShieldAlert size={20}/> Global Risk Distribution</h3>
                       
                       <div className="h-64 w-full flex items-center justify-center">
                           <ResponsiveContainer width="100%" height="100%">
                               <PieChart>
                                   <Pie
                                     data={riskData}
                                     cx="50%"
                                     cy="50%"
                                     innerRadius={60}
                                     outerRadius={80}
                                     paddingAngle={5}
                                     dataKey="value"
                                   >
                                     {riskData.map((entry, index) => (
                                       <Cell key={`cell-${index}`} fill={entry.color} />
                                     ))}
                                   </Pie>
                                   <Tooltip contentStyle={{backgroundColor: '#000', border: '1px solid #333'}} />
                                   <Legend verticalAlign="bottom" height={36}/>
                               </PieChart>
                           </ResponsiveContainer>
                       </div>

                       <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/5">
                           <h4 className="text-xs text-gray-400 uppercase font-bold mb-2">Risk Assessment Protocol</h4>
                           <div className="grid grid-cols-2 gap-4">
                               <div className="text-center">
                                   <div className="text-2xl font-mono text-cyber-red font-bold">{riskCounts.high}</div>
                                   <div className="text-[10px] text-gray-500 uppercase">High Risk Clients</div>
                               </div>
                               <div className="text-center">
                                   <div className="text-2xl font-mono text-cyber-green font-bold">{riskCounts.low}</div>
                                   <div className="text-[10px] text-gray-500 uppercase">Safe Clients</div>
                               </div>
                           </div>
                       </div>
                   </div>

               </div>
           </div>
       )}

       {activeTab === 'CASHFLOW' && (
           <div className="space-y-6 animate-fade-in">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="bg-cyber-panel p-6 rounded-2xl border border-white/10">
                      <h3 className="text-gray-400 text-xs uppercase">Total Inflow</h3>
                      <p className="text-3xl font-mono text-cyber-green mt-2">+${totalInflow.toFixed(2)}</p>
                   </div>
                   <div className="bg-cyber-panel p-6 rounded-2xl border border-white/10">
                      <h3 className="text-gray-400 text-xs uppercase">Total Outflow</h3>
                      <p className="text-3xl font-mono text-cyber-red mt-2">-${totalOutflow.toFixed(2)}</p>
                   </div>
                   <div className="bg-cyber-panel p-6 rounded-2xl border border-white/10">
                      <h3 className="text-gray-400 text-xs uppercase">Net Liquidity</h3>
                      <p className={`text-3xl font-mono mt-2 ${currentLiquidity >= 0 ? 'text-white' : 'text-red-500'}`}>
                          ${currentLiquidity.toFixed(2)}
                      </p>
                   </div>
               </div>

               <div className="bg-cyber-panel p-6 rounded-2xl border border-white/10 h-96">
                   <h3 className="text-white font-bold mb-6 flex items-center gap-2"><DollarSign size={20}/> Cash Flow Timeline</h3>
                   <ResponsiveContainer width="100%" height="100%">
                       <LineChart data={cashFlowData}>
                           <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                           <XAxis dataKey="date" stroke="#666" fontSize={12} tickLine={false} />
                           <YAxis stroke="#666" fontSize={12} tickLine={false} tickFormatter={val => `$${val}`} />
                           <Tooltip contentStyle={{backgroundColor: '#1A1A1A', border: '1px solid #333', color: '#fff'}} />
                           <Legend />
                           <Line type="monotone" dataKey="inflow" stroke="#10B981" strokeWidth={2} dot={false} name="Inflow (Sales)" />
                           <Line type="monotone" dataKey="outflow" stroke="#EF4444" strokeWidth={2} dot={false} name="Outflow (Stock/Exp)" />
                           <Line type="monotone" dataKey="net" stroke="#D4AF37" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Net Change" />
                       </LineChart>
                   </ResponsiveContainer>
               </div>
           </div>
       )}

       {activeTab === 'PREDICTIVE' && (
           <div className="space-y-6 animate-fade-in flex-1">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                   
                   {/* LEFT COLUMN: SALES PREDICTIONS (AI MODEL) */}
                   <div className="space-y-6">
                        {!biData ? (
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
                            <>
                                {/* Revenue Forecast */}
                                <div className="bg-cyber-panel border border-white/10 rounded-2xl p-6 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-6 opacity-10"><TrendingUp size={100} className="text-cyber-green"/></div>
                                    <h3 className="text-cyber-green font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
                                        <TrendingUp size={16}/> Revenue Forecast
                                    </h3>
                                    
                                    <div className="grid grid-cols-2 gap-4 mb-8 relative z-10">
                                        <div>
                                            <p className="text-sm text-gray-400 mb-1">Predicted 7-Day Revenue</p>
                                            <p className="text-4xl font-mono text-cyber-green font-bold">${biData.forecast.predictedRevenue.toFixed(0)}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-400 mb-1">Predicted Volume</p>
                                            <p className="text-4xl font-mono text-white font-bold">{biData.forecast.predictedVolume.toFixed(1)}g</p>
                                        </div>
                                    </div>
                                    
                                    {biData.forecast.dailyTrend && biData.forecast.dailyTrend.length > 0 && (
                                        <div className="h-48 w-full mt-4">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={biData.forecast.dailyTrend}>
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
                                            <p className="text-center text-[10px] text-gray-500 mt-2 uppercase tracking-widest">7-Day Sales Trajectory</p>
                                        </div>
                                    )}
                                </div>

                                {/* Archetype Opportunity */}
                                <div className="bg-cyber-panel border border-white/10 rounded-2xl p-6">
                                    <h3 className="text-cyber-purple font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
                                        <Target size={16}/> Opportunity Radar
                                    </h3>
                                    
                                    {biData.forecast.archetypeBreakdown && biData.forecast.archetypeBreakdown.length > 0 ? (
                                        <div className="h-48 w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart layout="vertical" data={biData.forecast.archetypeBreakdown} margin={{left: 30}}>
                                                    <XAxis type="number" hide/>
                                                    <YAxis dataKey="archetype" type="category" stroke="#fff" fontSize={11} width={80}/>
                                                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{backgroundColor: '#000', border: '1px solid #333', color: '#fff'}} />
                                                    <Bar dataKey="potentialRevenue" fill="#6366F1" radius={[0, 4, 4, 0]} barSize={20}>
                                                        {biData.forecast.archetypeBreakdown.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={index === 0 ? '#D4AF37' : '#6366F1'} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                            <p className="text-center text-[10px] text-gray-500 mt-2 uppercase tracking-widest">Revenue Potential by Archetype</p>
                                        </div>
                                    ) : (
                                        <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-center">
                                            <p className="text-xs text-cyber-purple uppercase font-bold mb-2">Primary Target</p>
                                            <p className="text-white italic text-lg">"{biData.forecast.topArchetypeTarget}"</p>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                   </div>

                   {/* RIGHT COLUMN: RESUPPLY INTELLIGENCE (HARD DATA) */}
                   <div className="bg-cyber-panel border border-white/10 rounded-2xl p-6">
                       <div className="flex justify-between items-center mb-6">
                           <h3 className="text-cyber-red font-bold uppercase tracking-wider flex items-center gap-2"><Truck size={18}/> Resupply Intelligence</h3>
                       </div>
                       
                       <div className="space-y-6 h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                           {batches.filter(b => b.status !== 'Sold Out').map(batch => {
                               const capacity = batch.actualWeight || 1;
                               const current = batch.currentStock;
                               // Progress Bar Logic: 0% filled = 0% depleted (Full Stock). 100% filled = 100% depleted (Empty).
                               const depletionPct = Math.min(100, Math.max(0, ((capacity - current) / capacity) * 100));
                               const restockAmount = Math.max(0, capacity - current);
                               const restockCost = restockAmount * batch.trueCostPerGram;

                               // Color Logic: Low depletion (Green), High depletion (Red/Urgent)
                               const barColor = depletionPct > 80 ? 'bg-red-500' : depletionPct > 50 ? 'bg-orange-500' : 'bg-cyber-green';
                               const textColor = depletionPct > 80 ? 'text-red-500' : 'text-gray-400';

                               return (
                                 <div key={batch.id} className="bg-black/40 p-4 rounded-xl border border-white/5">
                                   <div className="flex justify-between items-center mb-2">
                                       <div>
                                           <div className="font-bold text-white text-sm">{batch.name}</div>
                                           <div className="text-[10px] text-gray-500">Stock: {current.toFixed(1)}g / {capacity.toFixed(0)}g</div>
                                       </div>
                                       <div className="text-right">
                                           <div className="text-[10px] text-gray-500 uppercase">Est. Restock Cost</div>
                                           <div className="text-sm font-mono font-bold text-cyber-gold">${restockCost.toFixed(2)}</div>
                                       </div>
                                   </div>
                                   
                                   {/* Resupply Progress Bar */}
                                   <div className="relative pt-1">
                                        <div className="flex mb-1 items-center justify-between">
                                            <span className={`text-[10px] font-bold uppercase ${textColor}`}>
                                                {depletionPct > 90 ? 'CRITICAL REORDER' : depletionPct > 50 ? 'RESUPPLY SOON' : 'HEALTHY'}
                                            </span>
                                            <span className="text-[10px] font-bold text-white">{depletionPct.toFixed(0)}% Depleted</span>
                                        </div>
                                        <div className="overflow-hidden h-2 mb-1 text-xs flex rounded bg-gray-800">
                                            <div style={{ width: `${depletionPct}%` }} className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${barColor} transition-all duration-1000`}></div>
                                        </div>
                                   </div>
                                 </div>
                               )
                           })}
                           {batches.filter(b => b.status !== 'Sold Out').length === 0 && (
                               <div className="text-center text-gray-500 py-10">No active inventory to track.</div>
                           )}
                       </div>
                   </div>
               </div>
           </div>
       )}
    </div>
  );
};

export default Analytics;