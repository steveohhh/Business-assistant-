import React, { useState, useMemo } from 'react';
import { Batch, BatchExpense } from '../types';
import { Plus, Trash2, AlertTriangle, Settings, DollarSign, TrendingUp, X, Truck, BarChart2, MoreVertical, Save, Package, Scissors, Search, Filter, ArrowUpDown, EyeOff, Eye, History, FileText, Activity, Clock, Hourglass, Edit3 } from 'lucide-react';
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
  const [editTab, setEditTab] = useState<'DETAILS' | 'LIFECYCLE'>('DETAILS');
  
  // Filtering & Sorting State
  const [searchTerm, setSearchTerm] = useState('');
  const [hideSoldOut, setHideSoldOut] = useState(false);
  const [sortBy, setSortBy] = useState<'NEWEST' | 'OLDEST' | 'STOCK_HIGH' | 'STOCK_LOW'>('NEWEST');

  // New Batch Form State
  const [formData, setFormData] = useState({
    name: '',
    orderedWeight: 0,
    providerCut: 0,
    purchasePrice: 0,
    fees: 0,
    strainType: 'Rock', // Default to Rock
    targetRetailPrice: 0, 
    wholesalePrice: 0,
    notes: '' // New Notes field
  });

  // Initialize form with settings when opening
  const openNewBatchForm = () => {
      setFormData({ 
          name: '', orderedWeight: 0, providerCut: 0, purchasePrice: 0, fees: 0, strainType: 'Rock',
          targetRetailPrice: settings.defaultPricePerGram,
          wholesalePrice: settings.defaultWholesalePrice,
          notes: ''
      });
      setShowForm(true);
  };

  // Expense Management State
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');

  // Stock Adjustment State
  const [adjType, setAdjType] = useState<'PERSONAL' | 'LOSS' | 'CORRECTION'>('PERSONAL');
  const [adjAmount, setAdjAmount] = useState('');

  // --- FILTERING LOGIC ---
  const filteredBatches = useMemo(() => {
      let result = [...batches];

      // 1. Text Search
      if (searchTerm) {
          result = result.filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase()));
      }

      // 2. Hide Sold Out
      if (hideSoldOut) {
          result = result.filter(b => b.currentStock > 0.1);
      }

      // 3. Sorting
      result.sort((a, b) => {
          switch (sortBy) {
              case 'NEWEST': return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
              case 'OLDEST': return new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime();
              case 'STOCK_HIGH': return b.currentStock - a.currentStock;
              case 'STOCK_LOW': return a.currentStock - b.currentStock;
              default: return 0;
          }
      });

      return result;
  }, [batches, searchTerm, hideSoldOut, sortBy]);

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

  // --- LIFECYCLE GENERATOR ---
  const getLifecycleEvents = (batch: Batch) => {
      const events: { date: Date, type: string, desc: string, value: string, color: string }[] = [];
      
      // 1. Creation
      events.push({
          date: new Date(batch.dateAdded),
          type: 'CREATION',
          desc: 'Batch Acquired',
          value: `+${batch.actualWeight}g`,
          color: 'text-blue-400'
      });

      // 2. Sales
      const batchSales = sales.filter(s => s.batchId === batch.id);
      batchSales.forEach(s => {
          events.push({
              date: new Date(s.timestamp),
              type: 'SALE',
              desc: `Sold to ${s.customerName}`,
              value: `-${s.weight}g`,
              color: 'text-cyber-green'
          });
      });

      // 3. Expenses
      batch.expenses.forEach(e => {
          events.push({
              date: new Date(e.timestamp),
              type: 'EXPENSE',
              desc: e.description,
              value: `-$${e.amount.toFixed(2)}`,
              color: 'text-red-400'
          });
      });

      // Sort chronological descending
      return events.sort((a,b) => b.date.getTime() - a.date.getTime());
  };

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
      wholesalePrice: formData.wholesalePrice, 
      targetRetailPrice: formData.targetRetailPrice, 
      currentStock: actual,
      status: 'Active',
      dateAdded: new Date().toISOString(),
      notes: formData.notes
    };

    onAddBatch(newBatch);
    setShowForm(false);
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
              personalUse: (batch.personalUse || 0) + amount,
              currentStock: batch.currentStock - amount
          });
      } else if (adjType === 'LOSS') {
          updateBatch({
              ...batch,
              loss: (batch.loss || 0) + amount,
              currentStock: batch.currentStock - amount
          });
          // Also log financial loss entry in the Ledger
          addOperationalExpense({
              id: Date.now().toString(),
              description: `Loss/Theft: ${batch.name} (${amount}g)`,
              amount: amount * batch.trueCostPerGram,
              timestamp: new Date().toISOString(),
              category: 'Loss/Waste'
          });
      } else if (adjType === 'CORRECTION') {
           // Direct fix of stock number, for reconciliation errors
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
      
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-white tracking-tight uppercase flex items-center gap-3">
            <Package className="text-blue-400"/> Inventory Control
        </h2>
        
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {/* Search Input */}
            <div className="flex-1 md:w-64 bg-black/50 border border-white/10 rounded-lg flex items-center px-3 py-2">
                <Search size={14} className="text-gray-500 mr-2"/>
                <input 
                    className="bg-transparent text-sm text-white outline-none w-full placeholder-gray-600"
                    placeholder="Search batches..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Sort Dropdown */}
            <div className="relative group">
                <button className="bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-2 rounded-lg text-xs font-bold text-gray-300 flex items-center gap-2 h-full">
                    <ArrowUpDown size={14}/>
                    <span className="hidden sm:inline">Sort</span>
                </button>
                <div className="absolute right-0 mt-2 w-40 bg-[#121212] border border-white/10 rounded-lg shadow-xl overflow-hidden hidden group-hover:block z-20">
                    <button onClick={() => setSortBy('NEWEST')} className={`w-full text-left px-4 py-2 text-xs ${sortBy === 'NEWEST' ? 'text-cyber-gold bg-white/5' : 'text-gray-400 hover:text-white'}`}>Newest First</button>
                    <button onClick={() => setSortBy('OLDEST')} className={`w-full text-left px-4 py-2 text-xs ${sortBy === 'OLDEST' ? 'text-cyber-gold bg-white/5' : 'text-gray-400 hover:text-white'}`}>Oldest First</button>
                    <button onClick={() => setSortBy('STOCK_HIGH')} className={`w-full text-left px-4 py-2 text-xs ${sortBy === 'STOCK_HIGH' ? 'text-cyber-gold bg-white/5' : 'text-gray-400 hover:text-white'}`}>Highest Stock</button>
                    <button onClick={() => setSortBy('STOCK_LOW')} className={`w-full text-left px-4 py-2 text-xs ${sortBy === 'STOCK_LOW' ? 'text-cyber-gold bg-white/5' : 'text-gray-400 hover:text-white'}`}>Lowest Stock</button>
                </div>
            </div>

            {/* Toggle Sold Out */}
            <button 
                onClick={() => setHideSoldOut(!hideSoldOut)}
                className={`px-3 py-2 rounded-lg text-xs font-bold border flex items-center gap-2 transition-all ${hideSoldOut ? 'bg-cyber-purple/20 border-cyber-purple text-cyber-purple' : 'bg-white/5 border-white/10 text-gray-400'}`}
                title="Toggle Sold Out"
            >
                {hideSoldOut ? <EyeOff size={14}/> : <Eye size={14}/>}
                <span className="hidden sm:inline">{hideSoldOut ? 'Hidden' : 'All'}</span>
            </button>

            <button 
                onClick={openNewBatchForm} 
                className="bg-blue-500 hover:bg-blue-400 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all"
            >
                <Plus size={18} /> <span className="hidden sm:inline">New Batch</span>
            </button>
        </div>
      </div>

      {/* BATCH GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20 overflow-y-auto pr-1 custom-scrollbar">
        {filteredBatches.length > 0 ? filteredBatches.map(batch => {
            const m = batchMetrics[batch.id] || { burnRate: 0, daysRemaining: 999, sparklineData: [] };
            const stockPercent = (batch.currentStock / batch.actualWeight) * 100;
            const healthColor = stockPercent < 20 ? 'bg-red-500 text-red-500' : stockPercent < 50 ? 'bg-yellow-500 text-yellow-500' : 'bg-cyber-green text-cyber-green';
            const borderClass = stockPercent < 20 ? 'border-red-500/50' : 'border-white/10';

            // Freshness Calculation
            const daysHeld = Math.floor((new Date().getTime() - new Date(batch.dateAdded).getTime()) / (1000 * 3600 * 24));
            let freshnessConfig = { label: 'FRESH', color: 'text-cyber-green border-cyber-green bg-cyber-green/10' };
            if (daysHeld > 90) freshnessConfig = { label: 'STALE', color: 'text-red-500 border-red-500 bg-red-500/10' };
            else if (daysHeld > 45) freshnessConfig = { label: 'AGING', color: 'text-orange-500 border-orange-500 bg-orange-500/10' };
            else if (daysHeld > 14) freshnessConfig = { label: 'PEAK', color: 'text-cyber-gold border-cyber-gold bg-cyber-gold/10' };

            return (
                <div key={batch.id} className={`bg-cyber-panel border ${borderClass} rounded-2xl p-5 relative overflow-hidden group transition-all hover:border-white/30 animate-fade-in`}>
                    
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-white font-bold text-lg">{batch.name}</h3>
                                <span className={`text-[10px] px-2 py-0.5 rounded border ${batch.strainType === 'Rock' ? 'border-gray-400 text-gray-400' : 'border-cyan-400 text-cyan-400'} uppercase font-black`}>
                                    {batch.strainType}
                                </span>
                            </div>
                            <div className={`inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded border ${freshnessConfig.color} uppercase font-bold tracking-wider`}>
                                <Hourglass size={8}/> {freshnessConfig.label} ({daysHeld}d)
                            </div>
                        </div>
                        <button onClick={() => { setEditingBatch(batch); setEditTab('DETAILS'); }} className="text-gray-500 hover:text-white p-1">
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
                            <div className="text-[10px] text-cyber-gold uppercase font-bold flex items-center justify-between">
                                Buy At <DollarSign size={8}/>
                            </div>
                            <div className="text-white font-mono font-bold">${batch.trueCostPerGram.toFixed(2)}</div>
                        </div>
                        <div className="bg-black/30 p-2 rounded border border-white/5">
                            <div className="text-[10px] text-cyber-green uppercase font-bold flex items-center justify-between">
                                Sell At <DollarSign size={8}/>
                            </div>
                            <div className="text-white font-mono font-bold">${batch.targetRetailPrice.toFixed(2)}</div>
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
        }) : (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-500 opacity-50">
                <Package size={64} className="mb-4"/>
                <p>No inventory found.</p>
            </div>
        )}
      </div>

      {/* CREATE BATCH MODAL */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-cyber-panel border border-white/10 rounded-2xl w-full max-w-2xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
                <h3 className="text-white font-bold text-xl mb-6 flex items-center gap-2"><Truck size={24}/> Manifest New Inventory</h3>
                <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* SECTION 1: ACQUISITION */}
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                        <h4 className="text-xs text-cyber-gold font-bold uppercase mb-4 flex items-center gap-2">
                            <DollarSign size={14}/> Acquisition Costs
                        </h4>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="text-xs text-gray-400 uppercase font-bold">Product Name</label>
                                <input required className="w-full bg-black/50 border border-white/10 rounded p-3 text-white focus:border-blue-500 outline-none" 
                                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Blue Dream" />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 uppercase font-bold">Type</label>
                                <select className="w-full bg-black/50 border border-white/10 rounded p-3 text-white outline-none"
                                    value={formData.strainType} onChange={e => setFormData({...formData, strainType: e.target.value})}>
                                    <option value="Rock">Rock (Dry/Solid)</option>
                                    <option value="Wet">Wet (Live/Sauce)</option>
                                </select>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="text-xs text-gray-400 uppercase font-bold">Ordered Weight (g)</label>
                                <input type="number" required className="w-full bg-black/50 border border-white/10 rounded p-3 text-white focus:border-blue-500 outline-none" 
                                    value={formData.orderedWeight} onChange={e => setFormData({...formData, orderedWeight: parseFloat(e.target.value) || 0})} />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 uppercase font-bold">Total Purchase Price ($)</label>
                                <input type="number" required className="w-full bg-black/50 border border-white/10 rounded p-3 text-white focus:border-blue-500 outline-none" 
                                    value={formData.purchasePrice} onChange={e => setFormData({...formData, purchasePrice: parseFloat(e.target.value) || 0})} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="text-xs text-gray-400 uppercase font-bold">Extra Fees / Tips ($)</label>
                                <input type="number" className="w-full bg-black/50 border border-white/10 rounded p-3 text-white focus:border-blue-500 outline-none" 
                                    value={formData.fees} onChange={e => setFormData({...formData, fees: parseFloat(e.target.value) || 0})} />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 uppercase font-bold">Provider Cut/Loss (g)</label>
                                <input type="number" className="w-full bg-black/50 border border-white/10 rounded p-3 text-white focus:border-blue-500 outline-none" 
                                    value={formData.providerCut} onChange={e => setFormData({...formData, providerCut: parseFloat(e.target.value) || 0})} />
                            </div>
                        </div>

                        {/* Calculated Cost Preview */}
                        <div className="mt-4 p-3 bg-black/40 rounded border border-white/10 flex justify-between items-center">
                             <div className="text-xs text-gray-400">Calculated True Cost</div>
                             <div className="text-cyber-gold font-mono font-bold">${costPerGram.toFixed(2)} / gram</div>
                        </div>
                    </div>

                    {/* SECTION 2: PRICING STRATEGY */}
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                        <h4 className="text-xs text-cyber-green font-bold uppercase mb-4 flex items-center gap-2">
                            <TrendingUp size={14}/> Pricing Strategy
                        </h4>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="text-xs text-gray-400 uppercase font-bold">Target Retail Price ($/g)</label>
                                <input type="number" required className="w-full bg-black/50 border border-white/10 rounded p-3 text-white focus:border-cyber-green outline-none font-bold text-lg" 
                                    value={formData.targetRetailPrice} onChange={e => setFormData({...formData, targetRetailPrice: parseFloat(e.target.value) || 0})} />
                                <div className="text-[10px] text-gray-500 mt-1">
                                    Margin: {costPerGram > 0 ? (((formData.targetRetailPrice - costPerGram)/formData.targetRetailPrice)*100).toFixed(0) : 0}%
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 uppercase font-bold">Wholesale Price ($/g)</label>
                                <input type="number" required className="w-full bg-black/50 border border-white/10 rounded p-3 text-white focus:border-cyber-green outline-none" 
                                    value={formData.wholesalePrice} onChange={e => setFormData({...formData, wholesalePrice: parseFloat(e.target.value) || 0})} />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 uppercase font-bold">Batch Notes</label>
                            <textarea 
                                className="w-full bg-black/50 border border-white/10 rounded p-3 text-white focus:border-blue-500 outline-none resize-none h-20"
                                placeholder="Supplier details, curing notes, or quality indicators..."
                                value={formData.notes}
                                onChange={e => setFormData({...formData, notes: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="flex gap-4 pt-2">
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
                      <div className="flex-1">
                          {/* EDITABLE NAME */}
                          <input 
                            className="bg-transparent text-white font-bold text-xl uppercase tracking-wider outline-none border-b border-transparent focus:border-white/20 w-full"
                            value={editingBatch.name}
                            onChange={e => updateBatch({...editingBatch, name: e.target.value})}
                          />
                          <p className="text-[10px] text-gray-500">ID: {editingBatch.id}</p>
                      </div>
                      <button onClick={() => setEditingBatch(null)}><X className="text-gray-400 hover:text-white"/></button>
                  </div>

                  {/* Tabs */}
                  <div className="flex border-b border-white/5">
                      <button onClick={() => setEditTab('DETAILS')} className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 ${editTab === 'DETAILS' ? 'bg-white/5 text-cyber-gold border-b-2 border-cyber-gold' : 'text-gray-500 hover:text-white'}`}>
                          <FileText size={14} /> Details & Config
                      </button>
                      <button onClick={() => setEditTab('LIFECYCLE')} className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 ${editTab === 'LIFECYCLE' ? 'bg-white/5 text-cyber-green border-b-2 border-cyber-green' : 'text-gray-500 hover:text-white'}`}>
                          <History size={14} /> Lifecycle Timeline
                      </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                      
                      {editTab === 'DETAILS' ? (
                          <>
                            {/* NEW: SOURCE DATA EDITING (Unlocks Buy At) */}
                            <div className="bg-cyber-panel border border-white/10 rounded-xl p-4">
                                <h4 className="text-white font-bold text-sm uppercase mb-4 flex items-center gap-2">
                                    <Edit3 size={14} className="text-blue-400"/> Source & Cost Data
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-gray-500 uppercase font-bold">Total Purchase Cost</label>
                                        <input 
                                            type="number"
                                            className="w-full bg-black/40 border border-white/10 rounded p-2 text-white font-mono focus:border-blue-400 outline-none"
                                            value={editingBatch.purchasePrice}
                                            onChange={e => updateBatch({...editingBatch, purchasePrice: parseFloat(e.target.value) || 0})}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-gray-500 uppercase font-bold">Extra Fees</label>
                                        <input 
                                            type="number"
                                            className="w-full bg-black/40 border border-white/10 rounded p-2 text-white font-mono focus:border-blue-400 outline-none"
                                            value={editingBatch.fees}
                                            onChange={e => updateBatch({...editingBatch, fees: parseFloat(e.target.value) || 0})}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-gray-500 uppercase font-bold">Initial Weight (g)</label>
                                        <input 
                                            type="number"
                                            className="w-full bg-black/40 border border-white/10 rounded p-2 text-white font-mono focus:border-blue-400 outline-none"
                                            value={editingBatch.orderedWeight}
                                            onChange={e => updateBatch({...editingBatch, orderedWeight: parseFloat(e.target.value) || 0})}
                                        />
                                    </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-white/5 flex justify-between items-center text-xs">
                                    <span className="text-gray-400">Calculated "Buy At":</span>
                                    <span className="text-cyber-gold font-mono font-bold">${editingBatch.trueCostPerGram.toFixed(2)} / gram</span>
                                </div>
                            </div>

                            {/* Configuration (Unlocks Sell At) */}
                            <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                                <h4 className="text-white font-bold text-sm uppercase mb-4 flex items-center gap-2">
                                    <TrendingUp size={14} className="text-cyber-green"/> Pricing Strategy
                                </h4>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-xs text-gray-400 uppercase font-bold block mb-2">Target Retail Price ($/g)</label>
                                        <input type="number" className="w-full bg-white/5 border border-white/10 rounded p-2 text-white font-mono focus:border-cyber-green outline-none"
                                            value={editingBatch.targetRetailPrice || ''} 
                                            onChange={e => updateBatch({...editingBatch, targetRetailPrice: parseFloat(e.target.value) || 0})}
                                            placeholder="Auto-fill POS"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400 uppercase font-bold block mb-2">Wholesale Price ($/g)</label>
                                        <input type="number" className="w-full bg-white/5 border border-white/10 rounded p-2 text-white font-mono focus:border-cyber-green outline-none"
                                            value={editingBatch.wholesalePrice || ''} 
                                            onChange={e => updateBatch({...editingBatch, wholesalePrice: parseFloat(e.target.value) || 0})}
                                            placeholder="Bulk Rate"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Notes Field */}
                            <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                                <label className="text-xs text-gray-400 uppercase font-bold block mb-2">Batch Notes</label>
                                <textarea 
                                    className="w-full bg-white/5 border border-white/10 rounded p-2 text-white text-sm outline-none resize-none h-24"
                                    value={editingBatch.notes || ''}
                                    onChange={e => updateBatch({...editingBatch, notes: e.target.value})}
                                    placeholder="Add supply notes..."
                                />
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
                          </>
                      ) : (
                          // LIFECYCLE TIMELINE TAB
                          <div className="animate-fade-in relative h-full">
                              <div className="absolute left-4 top-0 bottom-0 w-[1px] bg-white/10"></div>
                              <div className="space-y-6 pl-10">
                                  {getLifecycleEvents(editingBatch).map((evt, idx) => (
                                      <div key={idx} className="relative">
                                          <div className={`absolute -left-[31px] w-4 h-4 rounded-full border-2 border-[#0a0a0a] ${
                                              evt.type === 'CREATION' ? 'bg-blue-500' : 
                                              evt.type === 'SALE' ? 'bg-cyber-green' : 'bg-red-500'
                                          }`}></div>
                                          <div className="bg-white/5 border border-white/5 rounded-lg p-3">
                                              <div className="flex justify-between items-start mb-1">
                                                  <span className="text-xs text-gray-400 font-bold uppercase">{evt.type}</span>
                                                  <span className="text-[10px] text-gray-500 font-mono">{evt.date.toLocaleString()}</span>
                                              </div>
                                              <div className="flex justify-between items-center">
                                                  <span className="text-white text-sm">{evt.desc}</span>
                                                  <span className={`font-mono font-bold ${evt.color}`}>{evt.value}</span>
                                              </div>
                                          </div>
                                      </div>
                                  ))}
                                  {getLifecycleEvents(editingBatch).length === 0 && (
                                      <div className="text-gray-500 italic text-sm">No recorded history.</div>
                                  )}
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

export default Stock;