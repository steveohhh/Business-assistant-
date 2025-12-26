import React, { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { ShoppingCart, Users, DollarSign, Scale, Calculator, Package, User, Wallet, CreditCard, Target, TrendingUp, Activity, Lock } from 'lucide-react';
import { PrestigeBadge } from './Customers';
import { safeFloat } from '../utils/formatting';

const POS: React.FC = () => {
  const batches = useAppStore(state => state.batches);
  const customers = useAppStore(state => state.customers);
  const posState = useAppStore(state => state.posState);
  const stagedTx = useAppStore(state => state.stagedTransaction);
  const inventoryTerms = useAppStore(state => state.inventoryTerms);

  const updatePOSState = useAppStore(state => state.updatePOSState);
  const processSale = useAppStore(state => state.processSale);
  const stageTransaction = useAppStore(state => state.stageTransaction);
  const addNotification = useAppStore(state => state.addNotification);

  const selectedBatch = useMemo(() => batches.find(b => b.id === posState.batchId), [batches, posState.batchId]);
  const selectedCustomer = useMemo(() => customers.find(c => c.id === posState.customerId), [customers, posState.customerId]);

  useEffect(() => {
    if (stagedTx) {
      const batch = batches.find(b => b.id === stagedTx.batchId);
      const customer = customers.find(c => (stagedTx.customerId && c.id === stagedTx.customerId) || (stagedTx.ghostId && c.ghostId === stagedTx.ghostId)) || customers.find(c => c.id === 'WALK_IN');
      
      updatePOSState({
        batchId: stagedTx.batchId,
        customerId: customer?.id || 'WALK_IN',
        weightInput: stagedTx.weight.toString(),
        cashInput: stagedTx.amount.toString(),
        targetPrice: batch?.targetRetailPrice || 10
      });
      addNotification("Tactical Link Active", "INFO");
      // CRITICAL: Clear the stage via timeout to prevent synchronous loop #185
      setTimeout(() => stageTransaction(null), 0);
    }
  }, [stagedTx, batches, customers, updatePOSState, addNotification, stageTransaction]);

  const handleWeightChange = (val: string) => {
    updatePOSState({ weightInput: val });
    const weight = parseFloat(val);
    if (!isNaN(weight) && selectedBatch) {
      const price = posState.targetPrice || selectedBatch.targetRetailPrice;
      const total = safeFloat(weight * price);
      // Only update if difference is significant to prevent loops
      if (Math.abs(parseFloat(posState.cashInput) - total) > 0.005) {
          updatePOSState({ cashInput: total.toString() });
      }
    }
  };

  const handlePriceChange = (val: number) => {
    updatePOSState({ targetPrice: val });
    const weight = parseFloat(posState.weightInput);
    if (!isNaN(weight)) {
      const total = safeFloat(weight * val);
      if (Math.abs(parseFloat(posState.cashInput) - total) > 0.005) {
          updatePOSState({ cashInput: total.toString() });
      }
    }
  };

  const handleCashChange = (val: string) => {
    updatePOSState({ cashInput: val });
    const cash = parseFloat(val);
    const weight = parseFloat(posState.weightInput);
    if (!isNaN(cash) && !isNaN(weight) && weight > 0) {
      const newPrice = safeFloat(cash / weight);
      if (Math.abs(posState.targetPrice - newPrice) > 0.005) {
          updatePOSState({ targetPrice: newPrice });
      }
    }
  };

  const handleCheckout = () => {
    const weight = parseFloat(posState.weightInput);
    const amount = parseFloat(posState.cashInput);
    if (!selectedBatch || !selectedCustomer || isNaN(weight) || isNaN(amount)) return;
    
    // Precision check for stock
    if (weight > selectedBatch.currentStock + 0.005) {
        addNotification("Insufficient Stock Level", "ERROR");
        return;
    }

    const costBasis = safeFloat(weight * selectedBatch.trueCostPerGram);
    const profit = safeFloat(amount - costBasis);

    processSale(selectedBatch.id, selectedCustomer.id, posState.salesRep, weight, amount, profit, posState.targetPrice, posState.paymentMethod);
    // Note: stagedTx is already cleared in useEffect, but good to be safe here if manual flow was used
    if (stagedTx) stageTransaction(null);
    addNotification("Synchronized with Ledger", "SUCCESS");
  };

  const profitVal = useMemo(() => {
      const weight = parseFloat(posState.weightInput) || 0;
      const cash = parseFloat(posState.cashInput) || 0;
      const cost = selectedBatch ? safeFloat(weight * selectedBatch.trueCostPerGram) : 0;
      return safeFloat(cash - cost);
  }, [posState.weightInput, posState.cashInput, selectedBatch]);

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-8 pb-24 animate-fade-in">
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
                <ShoppingCart className="text-cyber-gold" size={28} />
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Terminal Node</h2>
            </div>
            <div className="flex items-center gap-2 text-cyber-gold/50 text-[10px] font-mono border border-cyber-gold/20 px-2 py-1 rounded bg-black/40">
                <Lock size={10} className="text-cyber-gold"/>
                <span className="tracking-widest">SECURE_LINK</span>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-cyber-panel border border-white/10 rounded-2xl p-6 shadow-xl">
                <label className="text-[10px] uppercase font-bold text-gray-500 mb-4 block tracking-widest flex items-center gap-2"><Package size={12}/> Asset Matrix</label>
                <select className="w-full bg-black/60 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-cyber-gold" value={posState.batchId} onChange={(e) => {
                    const b = batches.find(x => x.id === e.target.value);
                    updatePOSState({ batchId: e.target.value, targetPrice: b?.targetRetailPrice || 10 });
                }}>
                    <option value="">-- Choose Asset --</option>
                    {batches.filter(b => b.currentStock > 0).map(b => (
                        <option key={b.id} value={b.id}>{b.name} ({b.currentStock.toFixed(1)}{inventoryTerms.unit})</option>
                    ))}
                </select>
                {selectedBatch && (
                    <div className="mt-4 flex justify-between bg-black/40 p-2 rounded-lg text-[10px] font-mono border border-white/5">
                        <span className="text-gray-500">BASE COST: ${selectedBatch.trueCostPerGram.toFixed(2)}</span>
                        <span className="text-cyber-gold">AVAIL: {selectedBatch.currentStock.toFixed(1)}</span>
                    </div>
                )}
            </div>

            <div className="bg-cyber-panel border border-white/10 rounded-2xl p-6 shadow-xl">
                <label className="text-[10px] uppercase font-bold text-gray-500 mb-4 block tracking-widest flex items-center gap-2"><Users size={12}/> Entity Profile</label>
                <select className="w-full bg-black/60 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-cyber-purple" value={posState.customerId} onChange={(e) => updatePOSState({ customerId: e.target.value })}>
                    {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name} (Lvl {c.level})</option>
                    ))}
                </select>
                {selectedCustomer && (
                    <div className="mt-4 flex items-center gap-4 bg-black/40 p-3 rounded-xl border border-white/5">
                        <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center border border-white/10 overflow-hidden">
                                {selectedCustomer.avatarImage ? <img src={selectedCustomer.avatarImage} className="w-full h-full object-cover" /> : <User size={20}/>}
                            </div>
                            <PrestigeBadge prestige={selectedCustomer.prestige || 0} size={16} />
                        </div>
                        <div className="text-xs text-white font-bold">{selectedCustomer.name} <span className="text-cyber-purple block text-[9px] uppercase font-bold">{selectedCustomer.psychProfile?.primary || 'UNPROFILED'}</span></div>
                    </div>
                )}
            </div>
        </div>

        <div className="bg-cyber-panel border border-white/10 rounded-3xl p-8 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                <Target size={200} className="text-white"/>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                <div className="space-y-6">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-3"><Scale size={14} className="inline mr-2"/> Quantity ({inventoryTerms.unit})</label>
                        <input type="number" step="0.1" className="w-full bg-black/60 border border-white/10 rounded-2xl p-6 text-4xl font-mono text-white outline-none focus:border-cyber-gold transition-all" value={posState.weightInput} onChange={(e) => handleWeightChange(e.target.value)} placeholder="0.0"/>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-3"><Target size={14} className="inline mr-2"/> Unit Value</label>
                        <div className="flex gap-2">
                            <input type="number" className="flex-1 bg-black/60 border border-white/10 rounded-xl py-3 px-4 text-xl font-mono text-white outline-none focus:border-cyber-green transition-all" value={posState.targetPrice} onChange={(e) => handlePriceChange(parseFloat(e.target.value) || 0)}/>
                            {[10, 15, 20].map(p => (
                                <button key={p} onClick={() => handlePriceChange(p)} className={`px-4 rounded-xl text-xs font-black border ${posState.targetPrice === p ? 'bg-cyber-gold text-black border-cyber-gold' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>${p}</button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6 flex flex-col justify-end">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-3"><DollarSign size={14} className="inline mr-2"/> Realized Total</label>
                        <input type="number" step="0.01" className="w-full bg-black/80 border border-cyber-green/50 rounded-2xl p-6 text-5xl font-mono text-white outline-none focus:border-cyber-green shadow-lg shadow-cyber-green/5 transition-all" value={posState.cashInput} onChange={(e) => handleCashChange(e.target.value)} placeholder="0.00"/>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => updatePOSState({ paymentMethod: 'CASH' })} className={`py-4 rounded-xl border font-bold uppercase text-[10px] transition-all ${posState.paymentMethod === 'CASH' ? 'bg-cyber-green text-black border-cyber-green' : 'bg-white/5 text-gray-500 border-white/10 hover:bg-white/10'}`}><Wallet size={14} className="inline mr-1"/> Physical</button>
                        <button onClick={() => updatePOSState({ paymentMethod: 'BANK' })} className={`py-4 rounded-xl border font-bold uppercase text-[10px] transition-all ${posState.paymentMethod === 'BANK' ? 'bg-cyber-purple text-white border-cyber-purple' : 'bg-white/5 text-gray-500 border-white/10 hover:bg-white/10'}`}><CreditCard size={14} className="inline mr-1"/> Digital</button>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <div className="space-y-6">
          <div className="bg-cyber-panel border border-white/10 rounded-2xl p-6 flex flex-col h-full shadow-2xl">
              <h3 className="text-white font-black uppercase text-xs tracking-widest mb-6 border-b border-white/5 pb-4 flex items-center gap-2"><Calculator size={14}/> Operational Intel</h3>
              
              <div className="flex-1 space-y-6">
                <div className="bg-gradient-to-br from-black to-gray-900 rounded-xl p-4 border border-white/5 border-l-4 border-l-cyber-gold shadow-lg">
                    <div className="text-[10px] text-cyber-gold uppercase font-bold mb-2">Net Realized Gain</div>
                    <div className="flex justify-between items-end">
                        <div className="text-3xl font-mono text-white font-black">${profitVal.toFixed(2)}</div>
                        <div className="text-cyber-green text-xs font-black font-mono">+{isNaN(profitVal) || parseFloat(posState.cashInput) === 0 ? '0' : ((profitVal / parseFloat(posState.cashInput)) * 100).toFixed(1)}%</div>
                    </div>
                </div>

                {selectedCustomer && (
                    <div className="bg-black/40 rounded-xl p-4 border border-white/5 text-[10px] space-y-2">
                        <div className="text-gray-500 uppercase font-bold">Client History</div>
                        <div className="flex justify-between"><span>TOTAL VOL</span><span className="text-white font-bold">${selectedCustomer.totalSpent.toFixed(0)}</span></div>
                        <div className="flex justify-between"><span>XP POOL</span><span className="text-cyber-purple font-bold">{selectedCustomer.xp}</span></div>
                    </div>
                )}
              </div>

              <button 
                onClick={handleCheckout}
                disabled={!selectedBatch || !selectedCustomer || isNaN(parseFloat(posState.weightInput)) || parseFloat(posState.weightInput) === 0}
                className="mt-8 w-full bg-cyber-gold hover:bg-yellow-500 text-black py-5 rounded-2xl font-black text-xl uppercase tracking-widest shadow-lg shadow-cyber-gold/20 disabled:opacity-50 disabled:grayscale transition-all transform active:scale-95"
              >
                Log Transaction
              </button>
          </div>
      </div>
    </div>
  );
};

export default POS;