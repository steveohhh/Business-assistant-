import React, { useState, useMemo } from 'react';
import { Batch, BatchExpense } from '../types';
import { Plus, Trash2, AlertTriangle, Settings, DollarSign, TrendingUp, X, Truck, BarChart2, MoreVertical, Save, Package, Scissors } from 'lucide-react';
import { useData } from '../DataContext';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';

interface StockProps {
  batches: Batch[];
  onAddBatch: (batch: Batch) => void;
  onDeleteBatch: (id: string) => void;
}

const Stock: React.FC<StockProps> = ({ batches, onAddBatch, onDeleteBatch }) => {
  const { updateBatch, sales, settings, addOperationalExpense } = useData();
  const [showForm, setShowForm] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  
  // New Batch Form State
  const [formData, setFormData] = useState({
    name: '',
    orderedWeight: 0,
    providerCut: 0,
    purchasePrice: 0,
    fees: 0,
    strainType: 'Rock', // Default to Rock
  });

  // Expense Management State
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');

  // Stock Adjustment State
  const [adjType, setAdjType] = useState<'PERSONAL' | 'LOSS' | 'CORRECTION'>('PERSONAL');
  const [adjAmount, setAdjAmount] = useState('');

  // --- METRICS ENGINE ---
  const batchMetrics = useMemo(() => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const cutoff = thirtyDaysAgo.getTime();

      const salesByBatch: Record<string, typeof sales> = {};
      sales.forEach(s => {
          if (new Date(s.timestamp).getTime() > cutoff) {
              if (!salesByBatch[s.batchId]) salesByBatch[s.batchId] = [];
              salesByBatch[s.batchId].push(s);
          }
      });

      const metrics: Record<string, { burnRate: number, daysRemaining: number, sparklineData: any[] }> = {};

      batches.forEach(b => {
          const recentSales = salesByBatch[b.id] || [];
          const totalSoldRecent = recentSales.reduce((acc, s) => acc + s.weight, 0);
          const burnRate = totalSoldRecent / 30; // grams per day
          const daysRemaining = burnRate > 0 ? b.currentStock / burnRate : 999;

          // Generate Sparkline Data (Last 10 Days)
          const sparklineData = Array.from({length: 10}, (_, i) => {
             const d = new Date();
             d.setDate(d.getDate() - (9 - i));
             const dateStr = d.toLocaleDateString();
             const daySales = recentSales.filter(s => new Date(s.timestamp).toLocaleDateString() === dateStr)
                .reduce((acc, s) => acc + s.weight, 0);
             return { day: i, val: daySales };
          });

          metrics[b.id] = { burnRate, daysRemaining, sparklineData };
      });

      return metrics;
  }, [sales, batches]);

  // --- HANDLERS ---
  const calculatePreview = () => {
    const actual = Math.max(0, formData.orderedWeight - formData.providerCut);
    const totalCost = formData.purchasePrice + formData.fees;
    const costPerGram = actual > 0 ? totalCost / actual : 0;
    return { actual, costPerGram };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { actual, costPerGram } = calculatePreview();

    const newBatch: Batch = {
      id: Date.now().toString(),
      name: formData.name,
      strainType: formData.strainType as any,
      orderedWeight: formData.orderedWeight,
      providerCut: formData.providerCut,
      personalUse: 0,
      loss: 0,
      actualWeight: actual,
      purchasePrice: formData.purchasePrice,
      fees: formData.fees,
      expenses: [],
      trueCostPerGram: costPerGram,
      wholesalePrice: settings.defaultWholesalePrice, 
      targetRetailPrice: settings.defaultPricePerGram, 
      currentStock: actual,
      status: 'Active',
      dateAdded: new Date().toISOString(),
    };

    onAddBatch(newBatch);
    setShowForm(false);
    setFormData({ name: '', orderedWeight: 0, providerCut: 0, purchasePrice: 0, fees: 0, strainType: 'Rock' });
  };

  const handleAddExpense = (batch: Batch) => {
      if (!expenseDesc || !expenseAmount) return;
      const amt = parseFloat(expenseAmount);
      const newExp: BatchExpense = {
          id: Date.now().toString(),
          description: expenseDesc,
          amount: amt,
          timestamp: new Date().toISOString()
      };
      
      const updatedBatch = {
          ...batch,
          expenses: [...batch.expenses, newExp]
      };
      
      updateBatch(updatedBatch);
      setExpenseDesc('');
      setExpenseAmount('');
  };

  const handleRemoveExpense = (batch: Batch, expenseId: string) => {
      const updatedBatch = {
          ...batch,
          expenses: batch.expenses.filter(e => e.id !== expenseId)
      };
      updateBatch(updatedBatch);
  };

  const handleStockAdjustment = (batch: Batch) => {
      if (!adjAmount) return;
      const amount = parseFloat(adjAmount);
      if (isNaN(amount) || amount <= 0) return;

      if (adjType === 'PERSONAL') {
          updateBatch({
              ...batch,
              personalUse: batch.personalUse + amount,
              currentStock: batch.currentStock - amount
          });
      } else if (adjType === 'LOSS') {
          updateBatch({
              ...batch,
              loss: (batch.loss || 0) + amount,
              currentStock: batch.currentStock - amount
          });
          // Also log financial loss
          addOperationalExpense({
              id: Date.now().toString(),
              description: `Loss/Theft: ${batch.name} (${amount}g)`,
              amount: amount * batch.trueCostPerGram,
              timestamp: new Date().toISOString(),
              category: 'Loss/Waste'
          });
      } else if (adjType === 'CORRECTION') {
           // Direct fix of stock number, assumes variance is loss or found item
           const diff = batch.currentStock - amount;
           // Implementation choice: Just set currentStock. 
           // If we want to track where it went, we'd need more complex logic.
           // For simple correction:
           updateBatch({
               ...batch,
               currentStock: amount
           });
      }
      setAdjAmount('');
  };

  const { actual, costPerGram } = calculatePreview();

  return (
    <div className="h-full flex flex-col relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white tracking-tight uppercase flex items-center gap-3">
            <Package className="text-blue-400"/> Inventory Control
        </h2>
        <button 
            onClick={() => setShowForm(true)} 
            className="bg-blue-500 hover:bg-blue-400 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all"
        >
            <Plus size={18} /> New Batch
        </button>
      </div>

      {/* BATCH GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
        {batches.map(batch => {
            const m = batchMetrics[batch.id] || { burnRate: 0, daysRemaining: 999, sparklineData: [] };
            const stockPercent = (batch.currentStock / batch.actualWeight) * 100;
            const healthColor = stockPercent < 20 ? 'bg-red-500 text-red-500' : stockPercent < 50 ? 'bg-yellow-500 text-yellow-500' : 'bg-cyber-green text-cyber-green';
            const borderClass = stockPercent < 20 ? 'border-red-500/50' : 'border-white/10';

            return (
                <div key={batch.id} className={`bg-cyber-panel border ${borderClass} rounded-2xl p-5 relative overflow-hidden group transition-all hover:border-white/30`}>
                    
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-white font-bold text-lg">{batch.name}</h3>
                                <span className={`text-[10px] px-2 py-0.5 rounded border ${batch.strainType === 'Rock' ? 'border-gray-400 text-gray-400' : 'border-cyan-400 text-cyan-400'} uppercase font-black`}>
                                    {batch.strainType}
                                </span>
                            </div>
                            <p className="text-gray-500 text-xs mt-1">Acquired: {new Date(batch.dateAdded).toLocaleDateString()}</p>
                        </div>
                        <button onClick={() => setEditingBatch(batch)} className="text-gray-500 hover:text-white p-1">
                            <Settings size={16} />
                        </button>
                    </div>

                    {/* Stock Gauge */}
                    <div className="mb-4">
                        <div className="flex justify-between text-xs mb-1 font-mono">
                            <span className="text-gray-400">Stock Level</span>
                            <span className={healthColor.split(' ')[1]}>{batch.currentStock.toFixed(1)}g / {batch.actualWeight}g</span>
                        </div>
                        <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div className={`h-full ${healthColor.split(' ')[0]} transition-all duration-500`} style={{ width: `${stockPercent}%` }}></div>
                        </div>
                    </div>

                    {/* Cost Metrics */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-black/30 p-2 rounded border border-white/5">
                            <div className="text-[10px] text-gray-500 uppercase">True Cost</div>
                            <div className="text-white font-mono font-bold">${batch.trueCostPerGram.toFixed(2)}/g</div>
                        </div>
                        <div className="bg-black/30 p-2 rounded border border-white/5">
                            <div className="text-[10px] text-gray-500 uppercase">Break Even</div>
                            <div className="text-gray-300 font-mono">${(batch.currentStock * batch.trueCostPerGram).toFixed(0)}</div>
                        </div>
                    </div>

                    {/* Sparkline & Prediction */}
                    <div className="h-16 w-full opacity-50 mb-2">
                         <ResponsiveContainer width="100%" height="100%">
                             <AreaChart data={m.sparklineData}>
                                <defs>
                                    <linearGradient id={`grad-${batch.id}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.5}/>
                                        <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <Area type="monotone" dataKey="val" stroke="#D4AF37" fill={`url(#grad-${batch.id})`} strokeWidth={2} />
                             </AreaChart>
                         </ResponsiveContainer>
                    </div>
                    
                    <div className="flex justify-between items-center text-[10px] uppercase font-bold text-gray-500 border-t border-white/5 pt-2">
                         <span>Burn: {m.burnRate.toFixed(1)}g / day</span>
                         <span className={m.daysRemaining < 7 ? 'text-red-500' : 'text-gray-500'}>
                             {m.daysRemaining > 300 ? '> 1 Year' : `${m.daysRemaining.toFixed(0)} Days Left`}
                         </span>
                    </div>

                </div>
            );
        })}
      </div>

      {/* CREATE BATCH MODAL */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-cyber-panel border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
                <h3 className="text-white font-bold text-xl mb-6">Manifest New Inventory</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-gray-400 uppercase font-bold">Product Name</label>
                            <input required className="w-full bg-black/50 border border-white/10 rounded p-3 text-white focus:border-blue-500 outline-none" 
                                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 uppercase font-bold">Category</label>
                            <select className="w-full bg-black/50 border border-white/10 rounded p-3 text-white outline-none"
                                value={formData.strainType} onChange={e => setFormData({...formData, strainType: e.target.value})}>
                                <option value="Rock">Rock (Dry/Solid)</option>
                                <option value="Wet">Wet (Live/Sauce)</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-gray-400 uppercase font-bold">Purchase Price ($)</label>
                            <input type="number" required className="w-full bg-black/50 border border-white/10 rounded p-3 text-white focus:border-blue-500 outline-none" 
                                value={formData.purchasePrice} onChange={e => setFormData({...formData, purchasePrice: parseFloat(e.target.value) || 0})} />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 uppercase font-bold">Fees / Tips ($)</label>
                            <input type="number" className="w-full bg-black/50 border border-white/10 rounded p-3 text-white focus:border-blue-500 outline-none" 
                                value={formData.fees} onChange={e => setFormData({...formData, fees: parseFloat(e.target.value) || 0})} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-gray-400 uppercase font-bold">Ordered Weight (g)</label>
                            <input type="number" required className="w-full bg-black/50 border border-white/10 rounded p-3 text-white focus:border-blue-500 outline-none" 
                                value={formData.orderedWeight} onChange={e => setFormData({...formData, orderedWeight: parseFloat(e.target.value) || 0})} />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 uppercase font-bold">Provider Cut (g)</label>
                            <input type="number" className="w-full bg-black/50 border border-white/10 rounded p-3 text-white focus:border-blue-500 outline-none" 
                                value={formData.providerCut} onChange={e => setFormData({...formData, providerCut: parseFloat(e.target.value) || 0})} />
                        </div>
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mt-4">
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-blue-300">Sellable Weight</span>
                            <span className="text-white font-bold">{actual.toFixed(2)}g</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-blue-300">True Cost Basis</span>
                            <span className="text-white font-bold">${costPerGram.toFixed(2)}/g</span>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-white py-3 rounded-lg font-bold">Cancel</button>
                        <button type="submit" className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-bold shadow-lg">Confirm Acquisition</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* EDIT BATCH MODAL */}
      {editingBatch && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-3xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
                  <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                      <h3 className="text-white font-bold text-xl uppercase tracking-wider">{editingBatch.name} Ledger</h3>
                      <button onClick={() => setEditingBatch(null)}><X className="text-gray-400 hover:text-white"/></button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                      
                      {/* Configuration */}
                      <div className="grid grid-cols-2 gap-6">
                           <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                               <label className="text-xs text-gray-400 uppercase font-bold block mb-2">Target Retail Price ($/g)</label>
                               <input type="number" className="w-full bg-white/5 border border-white/10 rounded p-2 text-white font-mono"
                                  value={editingBatch.targetRetailPrice || ''} 
                                  onChange={e => updateBatch({...editingBatch, targetRetailPrice: parseFloat(e.target.value)})}
                                  placeholder="Auto-fill POS"
                               />
                           </div>
                           <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                               <label className="text-xs text-gray-400 uppercase font-bold block mb-2">Wholesale Price ($/g)</label>
                               <input type="number" className="w-full bg-white/5 border border-white/10 rounded p-2 text-white font-mono"
                                  value={editingBatch.wholesalePrice || ''} 
                                  onChange={e => updateBatch({...editingBatch, wholesalePrice: parseFloat(e.target.value)})}
                                  placeholder="Bulk Rate"
                               />
                           </div>
                      </div>

                      {/* STOCK ADJUSTMENT TOOL */}
                      <div className="bg-cyber-panel border border-white/10 rounded-xl p-4">
                          <h4 className="text-white font-bold text-sm uppercase mb-4 flex items-center gap-2">
                              <Scissors size={14} className="text-cyber-gold"/> Stock Adjustment Tool
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                              <button onClick={() => setAdjType('PERSONAL')} className={`py-2 px-3 rounded text-xs font-bold border ${adjType === 'PERSONAL' ? 'bg-cyber-gold text-black border-cyber-gold' : 'border-gray-700 text-gray-400'}`}>
                                  Personal Use
                              </button>
                              <button onClick={() => setAdjType('LOSS')} className={`py-2 px-3 rounded text-xs font-bold border ${adjType === 'LOSS' ? 'bg-red-500 text-white border-red-500' : 'border-gray-700 text-gray-400'}`}>
                                  Loss / Theft
                              </button>
                              <button onClick={() => setAdjType('CORRECTION')} className={`py-2 px-3 rounded text-xs font-bold border ${adjType === 'CORRECTION' ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-700 text-gray-400'}`}>
                                  Correction
                              </button>
                          </div>
                          
                          <div className="flex gap-2">
                              <input 
                                type="number" 
                                value={adjAmount}
                                onChange={e => setAdjAmount(e.target.value)}
                                placeholder={adjType === 'CORRECTION' ? "New Total Weight (g)" : "Weight to Remove (g)"}
                                className="flex-1 bg-black/40 border border-white/10 rounded p-2 text-white outline-none"
                              />
                              <button onClick={() => handleStockAdjustment(editingBatch)} className="bg-white/10 hover:bg-white/20 text-white px-4 rounded font-bold text-sm">
                                  Execute
                              </button>
                          </div>
                          <div className="mt-2 text-[10px] text-gray-500">
                              {adjType === 'PERSONAL' && "Deducts from stock. Increases Personal Use counter. Affects true cost calc."}
                              {adjType === 'LOSS' && "Deducts from stock. Logs financial loss in Ledger. Affects true cost calc."}
                              {adjType === 'CORRECTION' && "Hard override of current stock level. Use for counting errors."}
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                         <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                            <span className="text-xs text-gray-500 uppercase block">Total Personal Use</span>
                            <span className="text-white font-mono">{editingBatch.personalUse || 0}g</span>
                         </div>
                         <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                            <span className="text-xs text-gray-500 uppercase block">Total Loss/Waste</span>
                            <span className="text-red-400 font-mono">{editingBatch.loss || 0}g</span>
                         </div>
                      </div>

                      {/* Expenses List */}
                      <div className="bg-cyber-panel border border-white/10 rounded-xl p-4">
                          <h4 className="text-white font-bold text-sm uppercase mb-4 flex items-center gap-2">
                              <DollarSign size={14} className="text-red-400"/> Cost Adjustments (Expenses)
                          </h4>
                          
                          <div className="space-y-2 mb-4">
                              {editingBatch.expenses && editingBatch.expenses.map(exp => (
                                  <div key={exp.id} className="flex justify-between items-center bg-white/5 p-2 rounded text-sm">
                                      <span className="text-gray-300">{exp.description}</span>
                                      <div className="flex items-center gap-3">
                                          <span className="text-red-400 font-mono">-${exp.amount.toFixed(2)}</span>
                                          <button onClick={() => handleRemoveExpense(editingBatch, exp.id)} className="text-gray-600 hover:text-red-500">
                                              <Trash2 size={12}/>
                                          </button>
                                      </div>
                                  </div>
                              ))}
                              {(!editingBatch.expenses || editingBatch.expenses.length === 0) && (
                                  <div className="text-gray-600 text-xs italic text-center py-2">No additional expenses recorded.</div>
                              )}
                          </div>

                          <div className="flex gap-2 border-t border-white/5 pt-4">
                               <select 
                                  className="bg-black/40 border border-white/10 rounded p-2 text-white text-sm outline-none"
                                  value={expenseDesc}
                                  onChange={e => setExpenseDesc(e.target.value)}
                               >
                                  <option value="">- Category -</option>
                                  {settings.expenseCategories.map(cat => (
                                      <option key={cat} value={cat}>{cat}</option>
                                  ))}
                                  <option value="Other">Other</option>
                               </select>
                              <input className="w-24 bg-black/40 border border-white/10 rounded p-2 text-white text-sm font-mono" placeholder="$0.00" type="number"
                                  value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)} />
                              <button onClick={() => handleAddExpense(editingBatch)} className="bg-white/10 hover:bg-white/20 text-white p-2 rounded">
                                  <Plus size={16}/>
                              </button>
                          </div>
                      </div>

                      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mt-auto">
                          <button onClick={() => { onDeleteBatch(editingBatch.id); setEditingBatch(null); }} className="w-full text-red-500 font-bold uppercase text-xs flex items-center justify-center gap-2 hover:text-red-400">
                              <Trash2 size={14}/> Delete Asset from Database
                          </button>
                      </div>

                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Stock;