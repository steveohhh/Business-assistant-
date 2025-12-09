import React, { useState } from 'react';
import { Sale, Batch, BusinessIntelligence } from '../types';
import { generateBusinessIntelligence } from '../services/geminiService';
import { useData } from '../DataContext';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis, BarChart, Bar, Cell, LineChart, Line, Legend, CartesianGrid, PieChart, Pie } from 'recharts';
import { Brain, TrendingUp, AlertTriangle, RefreshCw, Filter, DollarSign, Users, ShieldAlert, Clock } from 'lucide-react';

interface AnalyticsProps {
  sales: Sale[];
}

const Analytics: React.FC<AnalyticsProps> = ({ sales }) => {
  const { batches, customers, settings } = useData();
  const [activeTab, setActiveTab] = useState<'FINANCIAL' | 'CASHFLOW' | 'PREDICTIVE' | 'TEAM'>('FINANCIAL');
  const [biData, setBiData] = useState<BusinessIntelligence | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGeneratePredictions = async () => {
      setIsLoading(true);
      const result = await generateBusinessIntelligence(batches, sales);
      setBiData(result);
      setIsLoading(false);
  };

  // Prepare data for Profit Area Chart
  const salesByDate = sales.reduce((acc, sale) => {
    const date = new Date(sale.timestamp).toLocaleDateString();
    if (!acc[date]) acc[date] = { date, profit: 0, revenue: 0 };
    acc[date].profit += sale.profit;
    acc[date].revenue += sale.amount;
    return acc;
  }, {} as Record<string, any>);
  
  const profitData = Object.values(salesByDate).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Prepare Cash Flow Data
  // Combine Sales (Inflow) and Batch Costs (Outflow)
  const getCashFlowData = () => {
      const flows: Record<string, { date: string, inflow: number, outflow: number, net: number }> = {};
      
      // 1. Process Sales (Inflow)
      sales.forEach(s => {
          const d = new Date(s.timestamp).toLocaleDateString();
          if (!flows[d]) flows[d] = { date: d, inflow: 0, outflow: 0, net: 0 };
          flows[d].inflow += s.amount;
      });

      // 2. Process Batch Costs (Outflow) - using dateAdded as proxy for purchase date
      batches.forEach(b => {
          const d = new Date(b.dateAdded).toLocaleDateString();
          if (!flows[d]) flows[d] = { date: d, inflow: 0, outflow: 0, net: 0 };
          const totalBatchCost = b.purchasePrice + b.fees + b.expenses.reduce((sum, e) => sum + e.amount, 0);
          flows[d].outflow += totalBatchCost;
      });

      // 3. Process Batch Expenses (Outflow) - separate timestamps
      batches.forEach(b => {
          b.expenses.forEach(e => {
               const d = new Date(e.timestamp).toLocaleDateString();
               if (!flows[d]) flows[d] = { date: d, inflow: 0, outflow: 0, net: 0 };
               flows[d].outflow += e.amount;
          });
      });

      // 4. Calculate Net and Sort
      return Object.values(flows)
        .map(f => ({ ...f, net: f.inflow - f.outflow }))
        .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const cashFlowData = getCashFlowData();
  const totalInflow = cashFlowData.reduce((acc, c) => acc + c.inflow, 0);
  const totalOutflow = cashFlowData.reduce((acc, c) => acc + c.outflow, 0);
  const currentLiquidity = totalInflow - totalOutflow;

  // Prepare data for Heatmap (Hour of day vs Day of week)
  const heatmapData = sales.map(sale => {
    const d = new Date(sale.timestamp);
    return {
        day: d.getDay(), // 0-6
        hour: d.getHours(), // 0-23
        value: sale.amount // size of bubble
    };
  });

  // Prepare Funnel Data
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

  // Prepare Staff Performance Data
  const staffStats = settings.staffMembers.map(staffName => {
      const staffSales = sales.filter(s => s.salesRep === staffName);
      const totalRev = staffSales.reduce((acc, s) => acc + s.amount, 0);
      const commission = totalRev * (settings.commissionRate / 100);
      return {
          name: staffName,
          salesCount: staffSales.length,
          revenue: totalRev,
          commission: commission
      };
  }).sort((a, b) => b.revenue - a.revenue);

  // Prepare Global Risk Data
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

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-cyber-panel p-6 rounded-2xl border border-white/10">
                      <h3 className="text-gray-400 text-xs uppercase">Total Revenue</h3>
                      <p className="text-3xl font-mono text-white mt-2">
                          ${sales.reduce((acc, s) => acc + s.amount, 0).toFixed(2)}
                      </p>
                  </div>
                  <div className="bg-cyber-panel p-6 rounded-2xl border border-white/10">
                      <h3 className="text-gray-400 text-xs uppercase">Net Profit</h3>
                      <p className="text-3xl font-mono text-cyber-green mt-2">
                          ${sales.reduce((acc, s) => acc + s.profit, 0).toFixed(2)}
                      </p>
                  </div>
                  <div className="bg-cyber-panel p-6 rounded-2xl border border-white/10">
                      <h3 className="text-gray-400 text-xs uppercase">Total Volume</h3>
                      <p className="text-3xl font-mono text-cyber-gold mt-2">
                          {sales.reduce((acc, s) => acc + s.weight, 0).toFixed(1)}g
                      </p>
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
                   
                   {/* Funnel Chart */}
                   <div className="bg-cyber-panel p-6 rounded-2xl border border-white/10 h-80">
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Filter size={16}/> Customer Funnel</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={funnelData} margin={{top: 0, right: 30, left: 30, bottom: 0}}>
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" stroke="#fff" fontSize={10} width={80} />
                                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{backgroundColor: '#1A1A1A', border: '1px solid #333', color: '#fff'}} />
                                <Bar dataKey="value" barSize={30} radius={[0, 4, 4, 0]}>
                                    {funnelData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                   </div>
               </div>

               <div className="grid grid-cols-1 gap-6">
                   <div className="bg-cyber-panel p-6 rounded-2xl border border-white/10 h-80">
                       <h3 className="text-white font-bold mb-4">Temporal Density (Heatmap)</h3>
                       <ResponsiveContainer width="100%" height="100%">
                          <ScatterChart margin={{top: 20, right: 20, bottom: 20, left: 20}}>
                              <XAxis type="number" dataKey="hour" name="Hour" unit="h" domain={[0, 24]} stroke="#666" tickCount={12}/>
                              <YAxis type="number" dataKey="day" name="Day" tickFormatter={(val) => days[val]} domain={[0, 6]} stroke="#666" tickCount={7}/>
                              <ZAxis type="number" dataKey="value" range={[20, 400]} />
                              <Tooltip cursor={{strokeDasharray: '3 3'}} contentStyle={{backgroundColor: '#1A1A1A', border: '1px solid #333', color: '#fff'}}/>
                              <Scatter name="Sales" data={heatmapData} fill="#D4AF37" fillOpacity={0.6} />
                          </ScatterChart>
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
               {!biData ? (
                   <div className="h-full flex flex-col items-center justify-center p-10 border border-white/10 rounded-2xl bg-cyber-panel">
                       <Brain size={64} className="text-gray-600 mb-4" />
                       <h3 className="text-xl text-white font-bold mb-2">Predictive Models Offline</h3>
                       <p className="text-gray-500 mb-6 text-center max-w-md">Generate AI forecasts for restocking dates, revenue predictions, and strategic archetype targeting.</p>
                       <button 
                        onClick={handleGeneratePredictions} 
                        disabled={isLoading}
                        className="bg-cyber-purple hover:bg-cyber-purple/80 text-white font-bold px-8 py-4 rounded-xl flex items-center gap-2 transition-all"
                       >
                           {isLoading ? <RefreshCw className="animate-spin" /> : <TrendingUp />}
                           {isLoading ? 'Running Simulations...' : 'Generate Forecast'}
                       </button>
                   </div>
               ) : (
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                       {/* Sales Forecast */}
                       <div className="bg-cyber-panel border border-white/10 rounded-2xl p-6 relative overflow-hidden">
                           <div className="absolute top-0 right-0 p-6 opacity-10"><TrendingUp size={100} className="text-cyber-green"/></div>
                           <h3 className="text-cyber-green font-bold uppercase tracking-wider mb-6">Revenue Forecast</h3>
                           
                           <div className="mb-8">
                               <p className="text-sm text-gray-400 mb-1">Period</p>
                               <p className="text-xl text-white font-bold">{biData.forecast.period}</p>
                           </div>

                           <div className="grid grid-cols-2 gap-4 mb-8">
                               <div>
                                   <p className="text-sm text-gray-400 mb-1">Predicted Revenue</p>
                                   <p className="text-4xl font-mono text-cyber-green font-bold">${biData.forecast.predictedRevenue.toFixed(0)}</p>
                               </div>
                               <div>
                                   <p className="text-sm text-gray-400 mb-1">Predicted Volume</p>
                                   <p className="text-4xl font-mono text-white font-bold">{biData.forecast.predictedVolume.toFixed(1)}g</p>
                               </div>
                           </div>
                           
                           <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                               <p className="text-xs text-cyber-purple uppercase font-bold mb-2">Strategic Directive</p>
                               <p className="text-white italic">"{biData.forecast.topArchetypeTarget}"</p>
                           </div>
                       </div>

                       {/* Inventory Forecast */}
                       <div className="bg-cyber-panel border border-white/10 rounded-2xl p-6">
                           <div className="flex justify-between items-center mb-6">
                               <h3 className="text-cyber-red font-bold uppercase tracking-wider flex items-center gap-2"><Clock size={18}/> Stockout Trajectory</h3>
                               <button onClick={handleGeneratePredictions} className="text-xs text-gray-500 hover:text-white flex items-center gap-1">
                                   <RefreshCw size={12}/> Refresh
                               </button>
                           </div>
                           
                           <div className="space-y-5">
                               {biData.restock.sort((a,b) => a.daysRemaining - b.daysRemaining).map(item => {
                                   // Calculate urgency percentage (inverse of days left, max 30 days)
                                   const maxDays = 30;
                                   const urgency = Math.max(0, Math.min(100, (1 - (item.daysRemaining / maxDays)) * 100));
                                   const barColor = item.daysRemaining < 3 ? 'bg-red-500' : item.daysRemaining < 7 ? 'bg-orange-500' : 'bg-cyber-green';
                                   
                                   return (
                                     <div key={item.batchId} className="bg-black/40 p-4 rounded-xl border border-white/5">
                                       <div className="flex justify-between items-center mb-2">
                                           <div>
                                               <div className="font-bold text-white text-sm">{item.batchName}</div>
                                               <div className="text-[10px] text-gray-500">Rec. Reorder: {item.suggestedReorder}g</div>
                                           </div>
                                           <div className={`text-sm font-mono font-bold ${item.daysRemaining < 3 ? 'text-red-500' : 'text-gray-300'}`}>
                                               {item.daysRemaining < 1 ? '< 24 Hrs' : `${item.daysRemaining.toFixed(0)} Days`}
                                           </div>
                                       </div>
                                       
                                       {/* Restock Progress Bar (Resuoky Bar) */}
                                       <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden relative">
                                            <div className={`h-full ${barColor} transition-all duration-700`} style={{ width: `${100 - urgency}%` }}></div>
                                       </div>
                                       
                                       <div className="flex justify-between mt-1 text-[10px] text-gray-600 uppercase">
                                            <span>Urgency</span>
                                            <span>{item.confidence}% Confidence</span>
                                       </div>
                                   </div>
                                   )
                               })}
                               {biData.restock.length === 0 && (
                                   <div className="text-center text-gray-500 py-10">No immediate stockout risks detected.</div>
                               )}
                           </div>
                       </div>
                   </div>
               )}
           </div>
       )}
    </div>
  );
};

export default Analytics;