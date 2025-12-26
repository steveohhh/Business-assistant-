import React, { useState, useMemo } from 'react';
import { Batch, BatchExpense } from '../types';
import { Plus, Trash2, Settings, DollarSign, TrendingUp, X, Truck, Package, Search, ArrowUpDown, EyeOff, Eye, History, FileText, Hourglass, List, Grid } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

const ListBatchCard: React.FC<{ batch: Batch, metrics: any, inventoryTerms: any }> = ({ batch, metrics, inventoryTerms }) => {
    const stockPercent = (batch.currentStock / (batch.actualWeight || 1)) * 100;
    const daysHeld = Math.floor((new Date().getTime() - new Date(batch.dateAdded).getTime()) / (1000 * 3600 * 24));
    let freshness = { label: 'FRESH', color: 'text-cyber-green' };
    if (daysHeld > 90) freshness = { label: 'STALE', color: 'text-red-500' };
    else if (daysHeld > 45) freshness = { label: 'AGING', color: 'text-orange-500' };
    const [setEditingBatch, setEditTab] = useAppStore(state => [state.setEditingBatch, state.setEditTab]);

    return (
        <div className="bg-cyber-panel border border-white/10 rounded-2xl p-5 relative overflow-hidden group transition-all hover:border-white/30 animate-fade-in">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-white font-bold text-lg">{batch.name}</h3>
                    <div className={`inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded border ${freshness.color} border-opacity-30 bg-opacity-10 font-bold uppercase`}>{freshness.label} ({daysHeld}d)</div>
                </div>
                <button onClick={() => { useAppStore.setState({ editingBatch: batch, editTab: 'DETAILS' }); }} className="text-gray-500 hover:text-white p-1"><Settings size={16} /></button>
            </div>
            <div className="mb-4">
                <div className="flex justify-between text-xs mb-1 font-mono">
                    <span className="text-gray-400">Stock</span>
                    <span className="text-white">{batch.currentStock.toFixed(1)}{inventoryTerms.unit}</span>
                </div>
                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden"><div className="h-full bg-cyber-gold transition-all duration-700" style={{ width: `${Math.min(100, stockPercent)}%` }}></div></div>
            </div>
            <div className="h-16 w-full opacity-50 mb-2">
                <ResponsiveContainer width="100%" height="100%"><AreaChart data={metrics.sparklineData}><Area type="monotone" dataKey="val" stroke="#D4AF37" fill="#D4AF37" fillOpacity={0.2} /></AreaChart></ResponsiveContainer>
            </div>
            <div className="flex justify-between items-center text-[10px] uppercase font-bold text-gray-500 border-t border-white/5 pt-2">
                <span>Burn: {metrics.burnRate.toFixed(1)} / day</span>
                <span className={metrics.daysRemaining < 7 ? 'text-red-500 animate-pulse' : ''}>{metrics.daysRemaining > 365 ? '365+' : metrics.daysRemaining.toFixed(0)} Days Left</span>
            </div>
        </div>
    );
};

const VisualBatchCard: React.FC<{ batch: Batch, metrics: any, inventoryTerms: any }> = ({ batch, metrics, inventoryTerms }) => {
    const stockPercent = (batch.currentStock / (batch.actualWeight || 1)) * 100;
    return (
        <div onClick={() => useAppStore.setState({ editingBatch: batch, editTab: 'DETAILS' })} className="bg-cyber-panel border border-white/10 rounded-2xl p-4 relative overflow-hidden group transition-all hover:border-cyber-gold/50 animate-fade-in cursor-pointer flex flex-col justify-between aspect-[4/5]">
            <div>
                <div className="flex justify-between items-center">
                    <h3 className="text-white font-bold text-sm truncate pr-2">{batch.name}</h3>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${batch.strainType === 'Rock' ? 'bg-green-500/20 text-green-400' : 'bg-purple-500/20 text-purple-400'}`}>{batch.strainType}</span>
                </div>
                <div className="text-[10px] text-gray-500 font-mono">Cost: ${batch.trueCostPerGram.toFixed(2)}</div>
            </div>
            <div className="flex flex-col items-center justify-center my-4">
                <div className="text-3xl font-mono font-black text-white">{batch.currentStock.toFixed(1)}</div>
                <div className="text-xs text-gray-400 -mt-1">{inventoryTerms.unit}</div>
            </div>
            <div>
                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden mb-2"><div className="h-full bg-cyber-gold" style={{ width: `${Math.min(100, stockPercent)}%` }}></div></div>
                <div className="flex justify-between items-center text-[9px] uppercase font-bold text-gray-500">
                    <span>Burn: {metrics.burnRate.toFixed(1)}/d</span>
                    <span className={metrics.daysRemaining < 7 ? 'text-red-500' : ''}>{metrics.daysRemaining > 365 ? '---' : metrics.daysRemaining.toFixed(0)}d left</span>
                </div>
            </div>
        </div>
    );
};

const Stock: React.FC = () => {
  const batches = useAppStore(state => state.batches);
  const sales = useAppStore(state => state.sales);
  const settings = useAppStore(state => state.settings);
  const inventoryTerms = useAppStore(state => state.inventoryTerms);
  const editingBatch = useAppStore(state => state.editingBatch);
  const editTab = useAppStore(state => state.editTab);

  const addBatch = useAppStore(state => state.addBatch);
  const deleteBatch = useAppStore(state => state.deleteBatch);
  const updateBatch = useAppStore(state => state.updateBatch);
  const addOperationalExpense = useAppStore(state => state.addOperationalExpense);
  
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<'LIST' | 'VISUAL'>('LIST'); 
  
  const [searchTerm, setSearchTerm] = useState('');
  const [hideSoldOut, setHideSoldOut] = useState(false);
  const [sortBy, setSortBy] = useState<'NEWEST' | 'OLDEST' | 'STOCK_HIGH' | 'STOCK_LOW'>('NEWEST');

  const [formData, setFormData] = useState({
    name: '', orderedWeight: 0, providerCut: 0, purchasePrice: 0, fees: 0, strainType: 'Rock', 
    targetRetailPrice: 0, wholesalePrice: 0, notes: '' 
  });

  const openNewBatchForm = () => {
      setFormData({ 
          name: '', orderedWeight: 0, providerCut: 0, purchasePrice: 0, fees: 0, strainType: 'Rock',
          targetRetailPrice: settings.defaultPricePerGram,
          wholesalePrice: settings.defaultWholesalePrice,
          notes: ''
      });
      setShowForm(true);
  };

  const [adjType, setAdjType] = useState<'PERSONAL' | 'LOSS' | 'CORRECTION'>('PERSONAL');
  const [adjAmount, setAdjAmount] = useState('');

  const filteredBatches = useMemo(() => {
      let result = [...batches];
      if (searchTerm) result = result.filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase()));
      if (hideSoldOut) result = result.filter(b => b.currentStock > 0.1);
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

  const batchMetrics = useMemo(() => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const cutoff = thirtyDaysAgo.getTime();
      const metrics: Record<string, { burnRate: number, daysRemaining: number, sparklineData: any[] }> = {};
      
      batches.forEach(b => {
          const recentSales = sales.filter(s => s.batchId === b.id && new Date(s.timestamp).getTime() > cutoff);
          const totalSoldRecent = recentSales.reduce((acc, s) => acc + s.weight, 0);
          const burnRate = totalSoldRecent / 30; 
          const daysRemaining = burnRate > 0 ? b.currentStock / burnRate : 999;
          const sparklineData = Array.from({length: 10}, (_, i) => {
             const d = new Date();
             d.setDate(d.getDate() - (9 - i));
             const dateStr = d.toLocaleDateString();
             const daySales = recentSales.filter(s => new Date(s.timestamp).toLocaleDateString() === dateStr).reduce((acc, s) => acc + s.weight, 0);
             return { day: i, val: daySales };
          });
          metrics[b.id] = { burnRate, daysRemaining, sparklineData };
      });
      return metrics;
  }, [sales, batches]);

  const getLifecycleEvents = (batch: Batch) => {
      const events: { date: Date, type: string, desc: string, value: string, color: string }[] = [];
      events.push({ date: new Date(batch.dateAdded), type: 'CREATION', desc: 'Batch Acquired', value: `+${batch.actualWeight}${inventoryTerms.unit}`, color: 'text-blue-400' });
      sales.filter(s => s.batchId === batch.id).forEach(s => events.push({ date: new Date(s.timestamp), type: 'SALE', desc: `Sold to ${s.customerName}`, value: `-${s.weight}${inventoryTerms.unit}`, color: 'text-cyber-green' }));
      batch.expenses.forEach(e => events.push({ date: new Date(e.timestamp), type: 'EXPENSE', desc: e.description, value: `-$${e.amount.toFixed(2)}`, color: 'text-red-400' }));
      return events.sort((a,b) => b.date.getTime() - a.date.getTime());
  };

  const handleStockAdjustment = () => {
      if (!adjAmount || !editingBatch) return;
      const amount = parseFloat(adjAmount);
      if (isNaN(amount) || amount < 0) return;
      
      let updatedBatch = { ...editingBatch };
      if (adjType === 'PERSONAL') {
          updatedBatch = { ...updatedBatch, personalUse: (updatedBatch.personalUse || 0) + amount, currentStock: updatedBatch.currentStock - amount };
      } else if (adjType === 'LOSS') {
          updatedBatch = { ...updatedBatch, loss: (updatedBatch.loss || 0) + amount, currentStock: updatedBatch.currentStock - amount };
          addOperationalExpense({ id: Date.now().toString(), description: `Loss: ${updatedBatch.name} (${amount}${inventoryTerms.unit})`, amount: amount * updatedBatch.trueCostPerGram, timestamp: new Date().toISOString(), category: 'Loss/Waste' });
      } else if (adjType === 'CORRECTION') {
           updatedBatch = { ...updatedBatch, currentStock: amount };
      }
      updateBatch(updatedBatch);
      useAppStore.setState({ editingBatch: updatedBatch });
      setAdjAmount('');
  };

  return (
    <div className="h-full flex flex-col relative pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-white tracking-tight uppercase flex items-center gap-3">
            <Package className="text-blue-400"/> Inventory Control
        </h2>
        
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <div className="flex bg-black/50 rounded-lg p-1 border border-white/10">
                <button onClick={() => setViewMode('LIST')} className={`p-2 rounded ${viewMode === 'LIST' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}><List size={16}/></button>
                <button onClick={() => setViewMode('VISUAL')} className={`p-2 rounded ${viewMode === 'VISUAL' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}><Grid size={16}/></button>
            </div>
            <div className="flex-1 md:w-48 bg-black/50 border border-white/10 rounded-lg flex items-center px-3 py-2">
                <Search size={14} className="text-gray-500 mr-2"/>
                <input className="bg-transparent text-sm text-white outline-none w-full placeholder-gray-600" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <button onClick={openNewBatchForm} className="bg-blue-500 hover:bg-blue-400 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all">
                <Plus size={18} /> <span className="hidden sm:inline">New Batch</span>
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
        {filteredBatches.length > 0 ? (
            <div className={`grid gap-6 ${viewMode === 'LIST' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-2 md:grid-cols-4 lg:grid-cols-5'}`}>
                {filteredBatches.map(batch => {
                    const metrics = batchMetrics[batch.id] || { burnRate: 0, daysRemaining: 999, sparklineData: [] };
                    if (viewMode === 'LIST') {
                        return <ListBatchCard key={batch.id} batch={batch} metrics={metrics} inventoryTerms={inventoryTerms} />;
                    }
                    return <VisualBatchCard key={batch.id} batch={batch} metrics={metrics} inventoryTerms={inventoryTerms} />;
                })}
            </div>
        ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-500 opacity-50"><Package size={64} className="mb-4"/><p>No inventory detected.</p></div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-cyber-panel border border-white/10 rounded-2xl w-full max-w-2xl p-6 shadow-2xl">
                <h3 className="text-white font-bold text-xl mb-6 flex items-center gap-2"><Truck size={24}/> Manifest New Batch</h3>
                <form onSubmit={(e) => {
                    e.preventDefault();
                    const newBatch: Batch = {
                      id: Date.now().toString(), name: formData.name, strainType: formData.strainType as any,
                      orderedWeight: formData.orderedWeight, providerCut: formData.providerCut, personalUse: 0, loss: 0, actualWeight: formData.orderedWeight - formData.providerCut,
                      purchasePrice: formData.purchasePrice, fees: formData.fees, expenses: [], trueCostPerGram: 0,
                      wholesalePrice: formData.wholesalePrice, targetRetailPrice: formData.targetRetailPrice, currentStock: formData.orderedWeight - formData.providerCut,
                      status: 'Active', dateAdded: new Date().toISOString(), notes: formData.notes
                    };
                    addBatch(newBatch);
                    setShowForm(false);
                }} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs text-gray-400 uppercase font-bold">Product Name</label><input required className="w-full bg-black/50 border border-white/10 rounded p-3 text-white outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Batch ID / Strain" /></div>
                        <div><label className="text-xs text-gray-400 uppercase font-bold">Quantity ({inventoryTerms.unit})</label><input type="number" required className="w-full bg-black/50 border border-white/10 rounded p-3 text-white outline-none" value={formData.orderedWeight} onChange={e => setFormData({...formData, orderedWeight: parseFloat(e.target.value) || 0})} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs text-gray-400 uppercase font-bold">Purchase Cost ($)</label><input type="number" required className="w-full bg-black/50 border border-white/10 rounded p-3 text-white outline-none" value={formData.purchasePrice} onChange={e => setFormData({...formData, purchasePrice: parseFloat(e.target.value) || 0})} /></div>
                        <div><label className="text-xs text-gray-400 uppercase font-bold">Retail Target ($/{inventoryTerms.unit})</label><input type="number" required className="w-full bg-black/50 border border-white/10 rounded p-3 text-white outline-none" value={formData.targetRetailPrice} onChange={e => setFormData({...formData, targetRetailPrice: parseFloat(e.target.value) || 0})} /></div>
                    </div>
                    <div className="flex gap-4 pt-2"><button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-white/5 text-white py-3 rounded-lg font-bold">Cancel</button><button type="submit" className="flex-1 bg-blue-500 text-white py-3 rounded-lg font-bold shadow-lg">Confirm Acquisition</button></div>
                </form>
            </div>
        </div>
      )}

      {editingBatch && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-3xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
                  <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5 shrink-0"><div><h3 className="text-white font-bold text-xl uppercase">{editingBatch.name}</h3><p className="text-[10px] text-gray-500">ID: {editingBatch.id}</p></div><button onClick={() => useAppStore.setState({ editingBatch: null })}><X className="text-gray-400 hover:text-white"/></button></div>
                  <div className="flex border-b border-white/5 shrink-0"><button onClick={() => useAppStore.setState({ editTab: 'DETAILS' })} className={`flex-1 py-4 text-xs font-bold uppercase transition-all ${editTab === 'DETAILS' ? 'bg-white/5 text-cyber-gold border-b-2 border-cyber-gold' : 'text-gray-500'}`}>Configuration</button><button onClick={() => useAppStore.setState({ editTab: 'LIFECYCLE' })} className={`flex-1 py-4 text-xs font-bold uppercase transition-all ${editTab === 'LIFECYCLE' ? 'bg-white/5 text-cyber-green border-b-2 border-cyber-green' : 'text-gray-500'}`}>Life-cycle History</button></div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                      {editTab === 'DETAILS' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-xs text-gray-500 uppercase font-bold mb-4 tracking-widest">Inventory Adjustments</h4>
                                    <div className="grid grid-cols-3 gap-1 bg-black/50 p-1 rounded-xl mb-4"><button onClick={() => setAdjType('PERSONAL')} className={`py-2 rounded-lg text-[10px] uppercase font-bold transition-all ${adjType === 'PERSONAL' ? 'bg-white/10 text-white shadow-lg' : 'text-gray-600'}`}>Personal</button><button onClick={() => setAdjType('LOSS')} className={`py-2 rounded-lg text-[10px] uppercase font-bold transition-all ${adjType === 'LOSS' ? 'bg-white/10 text-white shadow-lg' : 'text-gray-600'}`}>Loss</button><button onClick={() => setAdjType('CORRECTION')} className={`py-2 rounded-lg text-[10px] uppercase font-bold transition-all ${adjType === 'CORRECTION' ? 'bg-white/10 text-white shadow-lg' : 'text-gray-600'}`}>Correction</button></div>
                                    <div className="flex gap-2"><input type="number" placeholder="0.0" value={adjAmount} onChange={e => setAdjAmount(e.target.value)} className="flex-1 bg-black/50 border border-white/10 p-3 text-sm rounded-xl text-white outline-none focus:border-cyber-gold"/><button onClick={handleStockAdjustment} className="bg-cyber-gold text-black px-6 font-bold text-xs rounded-xl uppercase">Update</button></div>
                                </div>
                                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                                    <h4 className="text-red-500 text-[10px] font-black uppercase mb-2">Danger Zone</h4>
                                    <button onClick={() => { if(window.confirm("Purge batch records?")) { deleteBatch(editingBatch.id); useAppStore.setState({ editingBatch: null }); } }} className="text-red-500 text-xs flex items-center gap-2 hover:underline"><Trash2 size={14}/> Permanent Deletion</button>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h4 className="text-xs text-gray-500 uppercase font-bold mb-4 tracking-widest">Profit Potential</h4>
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex justify-between items-center"><span className="text-xs text-gray-500 uppercase">Est. Unit Gain</span><span className="text-cyber-green font-mono font-bold text-xl">${(editingBatch.targetRetailPrice - editingBatch.trueCostPerGram).toFixed(2)}</span></div>
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex justify-between items-center"><span className="text-xs text-gray-500 uppercase">Realizable Pool</span><span className="text-white font-mono font-bold text-xl">${(editingBatch.currentStock * editingBatch.targetRetailPrice).toFixed(2)}</span></div>
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex justify-between items-center"><span className="text-xs text-gray-500 uppercase">True Cost / {inventoryTerms.unit}</span><span className="text-gray-400 font-mono font-bold text-xl">${editingBatch.trueCostPerGram.toFixed(2)}</span></div>
                            </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                            {getLifecycleEvents(editingBatch).map((e, idx) => (
                                <div key={idx} className="flex items-center gap-4 group bg-white/5 p-4 rounded-xl border border-white/5 hover:border-white/20 transition-all">
                                    <div className="w-10 h-10 rounded-full bg-black border border-white/10 flex items-center justify-center shrink-0">{e.type === 'SALE' ? <TrendingUp size={16} className="text-cyber-green"/> : e.type === 'EXPENSE' ? < DollarSign size={16} className="text-red-500" /> : <Package size={16} className="text-blue-400"/>}</div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center"><span className="text-white font-bold text-sm">{e.desc}</span><span className={`font-mono text-sm font-bold ${e.color}`}>{e.value}</span></div>
                                        <span className="text-[10px] text-gray-500 uppercase font-mono">{e.date.toLocaleString()} // {e.type}</span>
                                    </div>
                                </div>
                            ))}
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