import React, { useState, useEffect } from 'react';
import { Batch, Customer } from '../types';
import { useData } from '../DataContext';
import { ShoppingCart, Users, DollarSign, Scale, Calculator, RefreshCw, Eye, EyeOff, Sparkles, ChevronRight, UserCircle, MessageSquare, Anchor, ShieldAlert, Zap, AlertCircle, Link2, Link2Off, CheckCircle, X, Award, Star } from 'lucide-react';

interface POSProps {
  batches: Batch[];
  customers: Customer[];
  onProcessSale: (batchId: string, customerId: string, salesRep: string, weight: number, amount: number, profit: number) => void;
}

const POS: React.FC<POSProps> = ({ batches, customers, onProcessSale }) => {
  const { settings, stagedTransaction, stageTransaction, posState, updatePOSState } = useData();
  
  const [showProfitDetails, setShowProfitDetails] = useState(true);
  const [isLinked, setIsLinked] = useState(true); // Default to linked calculator
  const [isReadingScale, setIsReadingScale] = useState(false); // New Scale State
  
  // Receipt State
  const [lastTransaction, setLastTransaction] = useState<{
      batchName: string;
      weight: number;
      amount: number;
      profit: number;
      customerName: string;
      newTotalSpent: number;
      promotion?: 'GOLD' | 'PLATINUM' | null;
  } | null>(null);

  // CONSUME STAGED TRANSACTION (From Profit Planner)
  useEffect(() => {
    if (stagedTransaction) {
        updatePOSState({
            batchId: stagedTransaction.batchId,
            weightInput: stagedTransaction.weight.toString(),
            cashInput: stagedTransaction.amount.toFixed(2)
        });
        stageTransaction(null);
    }
  }, [stagedTransaction]);

  const selectedBatch = batches.find(b => b.id === posState.batchId);
  const selectedCustomer = customers.find(c => c.id === posState.customerId);

  // Auto-Sync Price Logic
  useEffect(() => {
    if (selectedBatch) {
        let batchPrice = settings.defaultPricePerGram;
        
        if (posState.pricingTier === 'RETAIL') {
            batchPrice = selectedBatch.targetRetailPrice > 0 ? selectedBatch.targetRetailPrice : settings.defaultPricePerGram;
        } else {
             // Wholesale Logic
            batchPrice = selectedBatch.wholesalePrice > 0 ? selectedBatch.wholesalePrice : settings.defaultWholesalePrice;
        }

        // Only update target price if it changed to prevent loop
        if (batchPrice !== posState.targetPrice) {
            updatePOSState({ targetPrice: batchPrice });
        }
    } else {
        if (posState.targetPrice !== settings.defaultPricePerGram) {
            updatePOSState({ targetPrice: settings.defaultPricePerGram });
        }
    }
  }, [posState.batchId, posState.pricingTier, settings.defaultPricePerGram, settings.defaultWholesalePrice]);

  // --- BIDIRECTIONAL CALCULATOR LOGIC ---

  const handleCashChange = (val: string) => {
    const updates: any = { cashInput: val };
    
    // If linked, auto-calculate weight based on cash / price
    if (isLinked) {
        const cash = parseFloat(val);
        if (!isNaN(cash) && posState.targetPrice > 0) {
            updates.weightInput = (cash / posState.targetPrice).toFixed(2);
        } else if (val === '') {
            updates.weightInput = '';
        }
    }
    updatePOSState(updates);
  };

  const handleWeightChange = (val: string) => {
    const updates: any = { weightInput: val };

    // If linked, auto-calculate cash based on weight * price
    if (isLinked) {
        const weight = parseFloat(val);
        if (!isNaN(weight)) {
            updates.cashInput = (weight * posState.targetPrice).toFixed(2);
        } else if (val === '') {
            updates.cashInput = '';
        }
    }
    updatePOSState(updates);
  };

  const setPreset = (grams: number) => {
    const cash = (grams * posState.targetPrice).toFixed(2);
    // Presets always force a sync regardless of link state initially
    updatePOSState({ weightInput: grams.toString(), cashInput: cash });
  };

  // SCALE SIMULATOR
  const simulateScale = () => {
      setIsReadingScale(true);
      const target = parseFloat(posState.weightInput) || 3.5;
      let count = 0;
      const interval = setInterval(() => {
          count++;
          // Generate random jitter around target or random number if empty
          const jitter = (Math.random() - 0.5) * 2;
          const val = target > 0 ? target + jitter : Math.random() * 10;
          updatePOSState({ weightInput: Math.abs(val).toFixed(2) });
          
          if (count > 10) {
              clearInterval(interval);
              setIsReadingScale(false);
              // Settle on clean number
              updatePOSState({ weightInput: target.toFixed(2) });
              // Trigger sync if linked
              if (isLinked) {
                  const cash = (target * posState.targetPrice).toFixed(2);
                  updatePOSState({ cashInput: cash });
              }
          }
      }, 80);
  };

  const handleCompleteSale = () => {
    if (!selectedBatch || !selectedCustomer) return;
    
    if (!posState.customerId) {
        alert("Please select a customer to track metrics."); 
        return;
    }

    const weight = parseFloat(posState.weightInput);
    const amount = parseFloat(posState.cashInput);
    
    if (isNaN(weight) || isNaN(amount) || weight <= 0) return;

    if (weight > selectedBatch.currentStock) {
      alert("Insufficient stock!");
      return;
    }

    const costBasis = weight * selectedBatch.trueCostPerGram;
    const profit = amount - costBasis;

    // Detect Level Up
    const prevTotal = selectedCustomer.totalSpent;
    const newTotal = prevTotal + amount;
    let promotion: 'GOLD' | 'PLATINUM' | null = null;
    if (prevTotal < 500 && newTotal >= 500) promotion = 'GOLD';
    if (prevTotal < 1000 && newTotal >= 1000) promotion = 'PLATINUM';

    // Process Sale
    onProcessSale(selectedBatch.id, posState.customerId, posState.salesRep, weight, amount, profit);

    // Show Receipt Modal
    setLastTransaction({
        batchName: selectedBatch.name,
        weight,
        amount,
        profit,
        customerName: selectedCustomer.name,
        newTotalSpent: newTotal,
        promotion
    });
  };

  // RECOMMENDATION ENGINE LOGIC
  const getRecommendedBatches = () => {
      const activeBatches = batches.filter(b => b.currentStock > 0);
      if (!selectedCustomer || !selectedCustomer.psychProfile) return activeBatches.slice(0, 3);

      const archetype = selectedCustomer.psychProfile.primary;
      
      if (['Optimiser', 'Analyst', 'Minimalist'].includes(archetype)) {
          return [...activeBatches].sort((a,b) => {
              const markupA = a.targetRetailPrice / a.trueCostPerGram;
              const markupB = b.targetRetailPrice / b.trueCostPerGram;
              return markupA - markupB;
          }).slice(0, 3);
      } 
      else if (['Impulsive', 'Opportunist', 'Reactor'].includes(archetype)) {
          return [...activeBatches].sort((a,b) => b.targetRetailPrice - a.targetRetailPrice).slice(0, 3);
      }
      else {
          return [...activeBatches].sort((a,b) => b.currentStock - a.currentStock).slice(0, 3);
      }
  };

  const recommendedBatches = getRecommendedBatches();

  // Derived Profit display
  const currentWeight = parseFloat(posState.weightInput) || 0;
  const currentAmount = parseFloat(posState.cashInput) || 0;
  const expectedAmount = currentWeight * posState.targetPrice;
  // Short calculation only relevant if Unlinked
  const isShort = !isLinked && (currentAmount < expectedAmount - 0.05); 
  
  const estimatedCost = selectedBatch ? currentWeight * selectedBatch.trueCostPerGram : 0;
  const projectedProfit = currentAmount - estimatedCost;
  const marginPercent = currentAmount > 0 ? (projectedProfit / currentAmount) * 100 : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full relative">
      
      {/* TRANSACTION RECEIPT MODAL */}
      {lastTransaction && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
              <div className={`bg-cyber-panel border rounded-2xl w-full max-w-md p-0 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] ${lastTransaction.promotion ? 'border-cyber-purple shadow-[0_0_100px_rgba(99,102,241,0.5)] scale-105' : 'border-cyber-gold shadow-[0_0_50px_rgba(212,175,55,0.3)]'}`}>
                  
                  {/* HEADER */}
                  <div className={`${lastTransaction.promotion ? 'bg-gradient-to-r from-cyber-purple to-pink-600' : 'bg-cyber-gold'} text-black p-4 flex justify-between items-center relative overflow-hidden`}>
                      {lastTransaction.promotion && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <Sparkles size={200} className="text-white opacity-20 animate-spin-slow"/>
                          </div>
                      )}
                      <h3 className="font-black uppercase tracking-widest text-lg flex items-center gap-2 relative z-10">
                          {lastTransaction.promotion ? (
                              <> <Award size={24} className="animate-bounce"/> LEVEL UP! </>
                          ) : (
                              <> <CheckCircle size={24}/> Transaction Complete </>
                          )}
                      </h3>
                      <button onClick={() => setLastTransaction(null)} className="hover:bg-black/20 p-1 rounded-full relative z-10"><X size={20}/></button>
                  </div>

                  <div className="p-8 font-mono space-y-4 relative">
                      
                      {lastTransaction.promotion && (
                          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center opacity-10">
                              <Star size={300} className="text-cyber-purple animate-pulse"/>
                          </div>
                      )}

                      {lastTransaction.promotion && (
                          <div className="text-center bg-white/10 p-4 rounded-xl border border-white/20 mb-4 animate-slide-in">
                              <div className="text-cyber-purple text-xs font-bold uppercase tracking-widest mb-1">Customer Promoted To</div>
                              <div className="text-3xl text-white font-black uppercase tracking-tighter drop-shadow-lg">
                                  {lastTransaction.promotion} TIER
                              </div>
                              <div className="text-[10px] text-gray-300 mt-1">Unlock associated benefits immediately.</div>
                          </div>
                      )}

                      <div className="text-center pb-4 border-b border-white/10">
                          <div className="text-gray-400 text-xs uppercase mb-1">Total Received</div>
                          <div className="text-4xl text-white font-bold tracking-tighter">${lastTransaction.amount.toFixed(2)}</div>
                      </div>
                      
                      <div className="space-y-2 text-sm relative z-10">
                          <div className="flex justify-between">
                              <span className="text-gray-500">Customer</span>
                              <span className="text-white font-bold">{lastTransaction.customerName}</span>
                          </div>
                          <div className="flex justify-between">
                              <span className="text-gray-500">Item</span>
                              <span className="text-white">{lastTransaction.batchName}</span>
                          </div>
                          <div className="flex justify-between">
                              <span className="text-gray-500">Quantity</span>
                              <span className="text-white">{lastTransaction.weight.toFixed(2)}g</span>
                          </div>
                      </div>

                      <div className="bg-white/5 p-4 rounded-xl border border-white/10 mt-4 relative z-10">
                          <div className="flex justify-between items-center mb-1">
                              <span className="text-xs text-cyber-green uppercase font-bold">Net Profit</span>
                              <span className="text-xl text-cyber-green font-bold">+${lastTransaction.profit.toFixed(2)}</span>
                          </div>
                          <div className="w-full bg-gray-800 h-1.5 rounded-full mt-2 overflow-hidden">
                              <div className="bg-cyber-gold h-full transition-all duration-1000" style={{ width: `${Math.min(100, (lastTransaction.newTotalSpent % 500) / 500 * 100)}%` }}></div>
                          </div>
                          <div className="text-[10px] text-center text-gray-500 mt-1 uppercase tracking-widest">
                              Loyalty Progress
                          </div>
                      </div>

                      <button onClick={() => setLastTransaction(null)} className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl uppercase tracking-widest text-sm transition-all relative z-10">
                          Return to Terminal
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* LEFT: Controls */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Batch Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-cyber-panel border border-white/10 rounded-xl p-4">
                <label className="flex items-center gap-2 text-gray-400 text-sm mb-2 uppercase font-bold tracking-wider">
                    <UserCircle size={14} /> Sales Agent
                </label>
                <select 
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-cyber-gold"
                    value={posState.salesRep}
                    onChange={(e) => updatePOSState({ salesRep: e.target.value })}
                >
                    {settings.staffMembers.map(staff => (
                        <option key={staff} value={staff}>{staff}</option>
                    ))}
                </select>
            </div>

            <div className="bg-cyber-panel border border-white/10 rounded-xl p-4">
                <label className="flex items-center gap-2 text-gray-400 text-sm mb-2 uppercase font-bold tracking-wider">
                    <ShoppingCart size={14} /> Active Batch
                </label>
                <select 
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-cyber-gold"
                    value={posState.batchId}
                    onChange={(e) => updatePOSState({ batchId: e.target.value })}
                >
                    <option value="">-- Select Inventory --</option>
                    {batches.filter(b => b.currentStock > 0).map(b => (
                        <option key={b.id} value={b.id}>
                            {b.name} ({b.currentStock.toFixed(1)}g avail)
                        </option>
                    ))}
                </select>
            </div>

            <div className="bg-cyber-panel border border-white/10 rounded-xl p-4">
                <label className="flex items-center gap-2 text-gray-400 text-sm mb-2 uppercase font-bold tracking-wider">
                    <Users size={14} /> Customer
                </label>
                <select 
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-cyber-gold"
                    value={posState.customerId}
                    onChange={(e) => updatePOSState({ customerId: e.target.value })}
                >
                    <option value="">-- Select Customer --</option>
                    {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
            </div>
        </div>

        {/* The Calculator Core */}
        <div className="bg-cyber-panel border border-white/10 rounded-2xl p-6 relative overflow-hidden backdrop-blur-xl shadow-[0_0_30px_rgba(0,0,0,0.5)]">
             <div className="absolute top-0 right-0 p-4 opacity-5">
                <Calculator size={150} />
             </div>

             {/* Rate Adjuster */}
             <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4 relative z-10">
                <div className="flex items-center gap-4">
                     <div className="flex bg-black/50 rounded-lg p-1 border border-white/10">
                         <button 
                            onClick={() => updatePOSState({ pricingTier: 'RETAIL' })}
                            className={`px-3 py-1 rounded text-xs font-bold uppercase transition-all ${posState.pricingTier === 'RETAIL' ? 'bg-cyber-green text-black' : 'text-gray-500 hover:text-white'}`}
                         >
                             Retail
                         </button>
                         <button 
                            onClick={() => updatePOSState({ pricingTier: 'WHOLESALE' })}
                            className={`px-3 py-1 rounded text-xs font-bold uppercase transition-all ${posState.pricingTier === 'WHOLESALE' ? 'bg-cyber-gold text-black' : 'text-gray-500 hover:text-white'}`}
                         >
                             Wholesale
                         </button>
                     </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`text-xl font-bold ${posState.pricingTier === 'RETAIL' ? 'text-cyber-green' : 'text-cyber-gold'}`}>$</span>
                    <input 
                        type="number" 
                        value={posState.targetPrice}
                        onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            updatePOSState({ targetPrice: val });
                        }}
                        className={`bg-transparent border-b w-24 text-center font-mono text-2xl text-white outline-none ${posState.pricingTier === 'RETAIL' ? 'border-cyber-green' : 'border-cyber-gold'}`}
                    />
                    <span className="text-gray-400 text-sm">/ gram</span>
                </div>
             </div>

             {/* Bi-Directional Inputs */}
             <div className="flex items-center gap-4 mb-8 relative z-10">
                <div className="space-y-2 flex-1">
                    <label className="flex items-center gap-2 text-cyber-green font-bold uppercase text-sm">
                        <DollarSign size={16} /> Cash In
                    </label>
                    <div className="relative">
                        <input 
                            type="number" 
                            value={posState.cashInput}
                            onChange={(e) => handleCashChange(e.target.value)}
                            placeholder="0.00"
                            className={`w-full bg-black/60 border rounded-xl p-4 text-4xl font-mono text-white outline-none transition-all ${isShort ? 'border-red-500 focus:border-red-500' : 'border-cyber-green/30 focus:border-cyber-green'}`}
                        />
                        {isShort && (
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500 flex items-center gap-1 text-xs font-bold uppercase bg-black/80 px-2 py-1 rounded border border-red-500/30">
                                <AlertCircle size={12}/> Short
                            </span>
                        )}
                    </div>
                </div>

                {/* LINK / UNLINK TOGGLE */}
                <div className="flex flex-col items-center pt-6 gap-2">
                    <button 
                        onClick={() => setIsLinked(!isLinked)}
                        className={`p-3 rounded-full border transition-all ${isLinked ? 'bg-cyber-gold text-black border-cyber-gold shadow-[0_0_15px_rgba(212,175,55,0.4)]' : 'bg-white/5 text-gray-500 border-white/10 hover:text-white'}`}
                        title={isLinked ? "Calculator Linked: Auto-updates" : "Unlinked: Manual Override Allowed"}
                    >
                        {isLinked ? <Link2 size={20}/> : <Link2Off size={20}/>}
                    </button>
                    <span className="text-[9px] uppercase font-bold text-gray-500">{isLinked ? 'SYNC' : 'MANUAL'}</span>
                </div>

                <div className="space-y-2 flex-1">
                    <div className="flex justify-between items-center">
                        <label className="flex items-center gap-2 text-cyber-purple font-bold uppercase text-sm">
                            <Scale size={16} /> Weight Out (g)
                        </label>
                        <button 
                            onClick={simulateScale} 
                            className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded border border-cyber-purple/30 ${isReadingScale ? 'text-cyber-purple bg-cyber-purple/20 animate-pulse' : 'text-gray-500 hover:text-white'}`}
                        >
                            {isReadingScale ? 'Reading...' : 'Read Scale'}
                        </button>
                    </div>
                    <input 
                        type="number" 
                        value={posState.weightInput}
                        onChange={(e) => handleWeightChange(e.target.value)}
                        placeholder="0.00"
                        className={`w-full bg-black/60 border rounded-xl p-4 text-4xl font-mono text-white outline-none focus:border-cyber-purple focus:shadow-[0_0_25px_rgba(99,102,241,0.2)] transition-all ${isReadingScale ? 'animate-pulse text-cyber-purple' : ''}`}
                    />
                </div>
             </div>

             {/* Quick Presets */}
             <div className="grid grid-cols-4 md:grid-cols-8 gap-2 mb-6 relative z-10">
                 {[0.25, 0.5, 1.0, 3.5, 7.0, 14.0, 28.0].map(w => (
                     <button 
                        key={w}
                        onClick={() => setPreset(w)}
                        className="bg-white/5 hover:bg-cyber-gold hover:text-black border border-white/10 hover:border-cyber-gold rounded-lg py-3 font-mono text-xs font-bold transition-all"
                     >
                        {w}g
                     </button>
                 ))}
                 <button 
                    onClick={() => updatePOSState({ cashInput: '', weightInput: '' })}
                    className="bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/30 rounded-lg py-3 flex items-center justify-center transition-all"
                 >
                    <RefreshCw size={14} />
                 </button>
             </div>

             {/* Profit Preview Breakdown */}
             {selectedBatch && currentAmount > 0 && (
                 <div className="bg-black/30 rounded-xl p-4 border border-white/5 relative z-10 animate-fade-in">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-[10px] text-gray-500 uppercase font-bold tracking-widest flex items-center gap-2">
                             <Zap size={10} className="text-cyber-gold"/> Deal Analysis
                        </h4>
                        <button onClick={() => setShowProfitDetails(!showProfitDetails)} className="text-gray-500 hover:text-white">
                            {showProfitDetails ? <Eye size={14} /> : <EyeOff size={14} />}
                        </button>
                    </div>
                    
                    {showProfitDetails ? (
                        <div className="grid grid-cols-4 gap-4 text-center">
                            <div className="bg-white/5 p-2 rounded">
                                <div className="text-[9px] text-gray-500 uppercase font-bold mb-1">Amount Out</div>
                                <div className="font-mono text-white font-bold">{currentWeight.toFixed(2)}g</div>
                            </div>
                            <div className="bg-white/5 p-2 rounded">
                                <div className="text-[9px] text-gray-500 uppercase font-bold mb-1">At Cost</div>
                                <div className="font-mono text-gray-400 font-bold">${estimatedCost.toFixed(2)}</div>
                            </div>
                            <div className="bg-white/5 p-2 rounded">
                                <div className="text-[9px] text-gray-500 uppercase font-bold mb-1">Resale Value</div>
                                <div className="font-mono text-cyber-gold font-bold">${currentAmount.toFixed(2)}</div>
                            </div>
                            <div className="bg-white/5 p-2 rounded border border-white/5">
                                <div className="text-[9px] text-gray-500 uppercase font-bold mb-1">Net Profit</div>
                                <div className={`font-mono font-bold ${projectedProfit >= 0 ? 'text-cyber-green' : 'text-cyber-red'}`}>
                                    ${projectedProfit.toFixed(2)}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 text-sm py-2 italic">
                            Financial details hidden
                        </div>
                    )}
                 </div>
             )}
        </div>

        <button 
            onClick={handleCompleteSale}
            disabled={!selectedBatch || !posState.customerId || currentAmount <= 0}
            className="w-full bg-gradient-to-r from-cyber-gold to-yellow-600 text-black font-black text-xl py-5 rounded-xl uppercase tracking-[0.2em] hover:brightness-110 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all shadow-[0_0_30px_rgba(212,175,55,0.2)]"
        >
            Execute Sale
        </button>
      </div>

      {/* RIGHT: Context Info */}
      <div className="space-y-6">
        
        {selectedCustomer ? (
            <>
                <div className="bg-cyber-panel border border-white/10 rounded-xl p-6 relative overflow-hidden">
                     {/* Tier Badge Background */}
                     <div className="absolute top-0 right-0 p-4 opacity-5 font-black text-6xl text-white select-none">
                         {selectedCustomer.totalSpent > 1000 ? 'PLT' : selectedCustomer.totalSpent > 500 ? 'GLD' : 'SLV'}
                     </div>

                     <h3 className="text-gray-400 uppercase text-xs font-bold mb-4 flex items-center gap-2"><UserCircle size={14}/> Target Identity</h3>
                     <div className="flex items-center gap-4 mb-4 relative z-10">
                        {selectedCustomer.avatarImage ? (
                            <img src={selectedCustomer.avatarImage} className="w-14 h-14 rounded-full border-2 border-cyber-gold object-cover shadow-[0_0_15px_rgba(212,175,55,0.4)]" />
                        ) : (
                            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-cyber-purple to-blue-500 flex items-center justify-center font-bold text-xl shadow-lg border border-white/20">
                                {selectedCustomer.name.substring(0,2).toUpperCase()}
                            </div>
                        )}
                        <div>
                            <div className="text-white font-bold text-lg leading-none">{selectedCustomer.name}</div>
                            <div className="text-xs text-cyber-gold mt-1">
                                {selectedCustomer.totalSpent > 1000 ? 'Platinum' : selectedCustomer.totalSpent > 500 ? 'Gold' : 'Silver'} Tier
                            </div>
                        </div>
                     </div>
                     
                     {selectedCustomer.psychProfile ? (
                         <div className="mt-4 space-y-3 relative z-10">
                             {/* TACTICAL NEGOTIATION HUD */}
                             <div className="bg-cyber-purple/10 border border-cyber-purple/30 rounded-lg p-3">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] text-cyber-purple uppercase font-bold flex items-center gap-1"><Zap size={10}/> Tactical HUD</span>
                                    <span className="text-[10px] text-white bg-cyber-purple/20 px-1.5 rounded">{selectedCustomer.psychProfile.primary}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                    <div className="bg-black/40 rounded p-2">
                                        <div className="text-[9px] text-gray-400 uppercase mb-0.5 flex items-center gap-1"><Anchor size={8}/> Anchor</div>
                                        <div className="text-xs text-white font-bold">{selectedCustomer.psychProfile.interactionStrategy.persuasionAnchor}</div>
                                    </div>
                                    <div className="bg-black/40 rounded p-2">
                                        <div className="text-[9px] text-gray-400 uppercase mb-0.5 flex items-center gap-1"><MessageSquare size={8}/> Tone</div>
                                        <div className="text-xs text-white font-bold">{selectedCustomer.psychProfile.interactionStrategy.tone}</div>
                                    </div>
                                </div>
                                
                                {selectedCustomer.psychProfile.interactionStrategy.avoid.length > 0 && (
                                    <div className="text-[10px] text-red-300 bg-red-500/10 p-2 rounded border border-red-500/20 flex items-start gap-1">
                                        <ShieldAlert size={10} className="mt-0.5 shrink-0"/>
                                        <span>
                                            <strong className="text-red-400 uppercase">Avoid:</strong> {selectedCustomer.psychProfile.interactionStrategy.avoid.slice(0, 2).join(", ")}
                                        </span>
                                    </div>
                                )}
                             </div>
                         </div>
                     ) : (
                         <div className="text-center py-4 text-gray-500 text-xs italic">
                             Run Behavioral Analysis in CRM to unlock tactical guidance.
                         </div>
                     )}
                </div>

                {/* RECOMMENDATION ENGINE */}
                <div className="bg-cyber-panel border border-white/10 rounded-xl p-6 border-l-2 border-l-cyber-gold animate-fade-in">
                    <h3 className="text-cyber-gold uppercase text-xs font-bold mb-4 flex items-center gap-2">
                        <Sparkles size={14} /> Recommended
                    </h3>
                    <div className="space-y-3">
                        {recommendedBatches.length > 0 ? recommendedBatches.map(b => (
                            <div 
                                key={b.id} 
                                onClick={() => updatePOSState({ batchId: b.id })}
                                className="bg-white/5 hover:bg-white/10 p-3 rounded-lg cursor-pointer transition-all group"
                            >
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-bold text-gray-200 group-hover:text-white">{b.name}</span>
                                    <ChevronRight size={14} className="text-gray-500 group-hover:text-cyber-gold"/>
                                </div>
                                <div className="flex justify-between mt-1">
                                    <span className="text-[10px] text-gray-500">{b.strainType}</span>
                                    <span className="text-xs font-mono text-cyber-green">${b.targetRetailPrice}/g</span>
                                </div>
                            </div>
                        )) : (
                            <div className="text-gray-500 text-xs italic text-center">No active inventory</div>
                        )}
                    </div>
                </div>
            </>
        ) : (
            <div className="bg-cyber-panel border border-white/10 rounded-xl p-6 flex items-center justify-center text-gray-500 h-32 border-dashed">
                Select Customer Target
            </div>
        )}

        {selectedBatch && (
             <div className="bg-cyber-panel border border-white/10 rounded-xl p-6">
                <h3 className="text-gray-400 uppercase text-xs font-bold mb-4">Batch Telemetry</h3>
                <div className="space-y-4">
                    <div className="flex justify-between items-end">
                        <span className="text-white font-bold text-lg">{selectedBatch.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded uppercase font-bold border ${selectedBatch.strainType === 'Rock' ? 'border-gray-500 text-gray-500' : 'border-cyan-400 text-cyan-400'}`}>{selectedBatch.strainType}</span>
                    </div>
                    
                    <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                        <div 
                            className={`h-full ${selectedBatch.currentStock < selectedBatch.actualWeight * 0.2 ? 'bg-cyber-red' : 'bg-cyber-green'}`} 
                            style={{width: `${(selectedBatch.currentStock / selectedBatch.actualWeight) * 100}%`}} 
                        />
                    </div>
                    
                    <div className="flex justify-between text-sm font-mono border-t border-white/5 pt-3 mt-2">
                        <div>
                            <span className="text-gray-500 text-xs block">Current Stock</span>
                            <span className="text-white font-bold">{selectedBatch.currentStock.toFixed(1)}g</span>
                        </div>
                        <div className="text-right">
                            <span className="text-gray-500 text-xs block">Break Even</span>
                            <span className="text-cyber-red font-bold">${selectedBatch.trueCostPerGram.toFixed(2)}/g</span>
                        </div>
                    </div>
                </div>
             </div>
        )}
      </div>
    </div>
  );
};

export default POS;