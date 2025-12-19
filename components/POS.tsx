import React, { useState, useEffect, useMemo } from 'react';
import { Batch, Customer } from '../types';
import { useAppStore } from '../stores/useAppStore';
import { ShoppingCart, Users, DollarSign, Scale, Calculator, RefreshCw, Eye, EyeOff, Sparkles, ChevronRight, UserCircle, AlertCircle, Link2, Link2Off, CheckCircle, CheckCircle2, X, Award, Star, Zap, CreditCard, Wallet, ShieldAlert, Target, TrendingDown, TrendingUp, Crown, Trophy, User, Medal, Percent } from 'lucide-react';
// FIX: Removed unused import causing module resolution issues with React.lazy
// import { PrestigeBadge } from './Customers';

// Robust Math Helper
const round = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

const HaggleWidget = ({ costBasis, currentPrice, targetPrice, authorizedDiscountPct }: { costBasis: number, currentPrice: number, targetPrice: number, authorizedDiscountPct: number }) => {
    const floorPrice = costBasis * 1.15;
    const maxPrice = targetPrice * 1.2; 
    const range = maxPrice - costBasis;
    const authorizedPrice = targetPrice * (1 - (authorizedDiscountPct / 100));
    const currentPercent = range > 0 ? Math.min(100, Math.max(0, ((currentPrice - costBasis) / range) * 100)) : 0;
    const floorPercent = range > 0 ? ((floorPrice - costBasis) / range) * 100 : 0;
    const targetPercent = range > 0 ? ((targetPrice - costBasis) / range) * 100 : 100;
    const authPercent = range > 0 ? ((authorizedPrice - costBasis) / range) * 100 : 50;

    let zoneColor = 'bg-gray-500', zoneText = 'ANALYZING';
    if (currentPrice < costBasis) { zoneColor = 'bg-red-600'; zoneText = 'LOSS LEADER'; }
    else if (currentPrice < floorPrice) { zoneColor = 'bg-red-400'; zoneText = 'BELOW MARGIN'; }
    else if (currentPrice < authorizedPrice) { zoneColor = 'bg-orange-500'; zoneText = 'EXCESSIVE DISCOUNT'; }
    else if (currentPrice < targetPrice) { zoneColor = 'bg-cyber-green'; zoneText = 'AUTHORIZED DEAL'; }
    else { zoneColor = 'bg-cyber-gold'; zoneText = 'PREMIUM'; }

    return (
        <div className="bg-black/40 border border-white/10 rounded-xl p-4 animate-fade-in">
            <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold uppercase text-gray-400 flex items-center gap-1"><TrendingDown size={12}/> Negotiation Assistant</span>
                <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded text-black ${zoneColor}`}>{zoneText}</span>
            </div>
            <div className="relative h-4 bg-gray-800 rounded-full mb-2 overflow-hidden">
                <div className="absolute top-0 bottom-0 left-0 bg-red-900/50 border-r border-red-500" style={{ width: `${floorPercent}%` }}></div>
                <div className="absolute top-0 bottom-0 bg-cyber-green/10 border-l border-cyber-green/50 border-r border-cyber-green/50" style={{ left: `${authPercent}%`, right: `${100 - targetPercent}%` }}></div>
                <div className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_white] transition-all duration-300 z-10" style={{ left: `${currentPercent}%` }}></div>
            </div>
            <div className="flex justify-between text-[9px] font-mono text-gray-500">
                <span>Cost: ${costBasis.toFixed(2)}</span>
                <span className="text-cyber-green">Auth Floor: ${authorizedPrice.toFixed(2)} (-{authorizedDiscountPct.toFixed(1)}%)</span>
                <span className="text-white">Target: ${targetPrice.toFixed(2)}</span>
            </div>
        </div>
    );
};

const POS: React.FC = () => {
  const batches = useAppStore(s => s.batches);
  const customers = useAppStore(s => s.customers);
  const processSale = useAppStore(s => s.processSale);
  const settings = useAppStore(s => s.settings);
  const stagedTransaction = useAppStore(s => s.stagedTransaction);
  const stageTransaction = useAppStore(s => s.stageTransaction);
  const posState = useAppStore(s => s.posState);
  const updatePOSState = useAppStore(s => s.updatePOSState);
  const sales = useAppStore(s => s.sales);
  const inventoryTerms = useAppStore(s => s.inventoryTerms);
  
  const [showProfitDetails, setShowProfitDetails] = useState(true);
  const [isLinked, setIsLinked] = useState(true); 
  const [lastTransaction, setLastTransaction] = useState<any>(null);

  const staffMetrics = useMemo(() => {
      return settings.staffMembers.map(staffName => {
          const staffSales = sales.filter(s => s.salesRep === staffName);
          const totalVariance = staffSales.reduce((acc, s) => acc + (s.variance || 0), 0);
          const totalRevenue = staffSales.reduce((acc, s) => acc + s.amount, 0);
          const level = Math.floor(Math.sqrt(totalRevenue / 100)) + 1;
          return { name: staffName, variance: totalVariance, level };
      });
  }, [sales, settings.staffMembers]);

  useEffect(() => {
    if (stagedTransaction) {
        updatePOSState({
            batchId: stagedTransaction.batchId,
            weightInput: stagedTransaction.weight.toString(),
            cashInput: stagedTransaction.amount.toFixed(2),
            customerId: stagedTransaction.customerId || '',
        });
        stageTransaction(null);
    }
  }, [stagedTransaction, updatePOSState, stageTransaction]);

  const selectedBatch = batches.find(b => b.id === posState.batchId);
  const selectedCustomer = customers.find(c => c.id === posState.customerId);

  const customerDiscountAuth = useMemo(() => {
      if (!selectedCustomer) return 0;
      const levelBonus = (selectedCustomer.level || 1) * 0.2;
      const prestigeBonus = (selectedCustomer.prestige || 0) * 2.0;
      return Math.min(30, levelBonus + prestigeBonus);
  }, [selectedCustomer]);

  useEffect(() => {
    if (selectedBatch) {
        let batchPrice = settings.defaultPricePerGram;
        if (posState.pricingTier === 'RETAIL') {
            batchPrice = selectedBatch.targetRetailPrice > 0 ? selectedBatch.targetRetailPrice : settings.defaultPricePerGram;
        } else {
            batchPrice = selectedBatch.wholesalePrice > 0 ? selectedBatch.wholesalePrice : settings.defaultWholesalePrice;
        }
        
        if (batchPrice !== posState.targetPrice) {
            updatePOSState({ targetPrice: batchPrice });
            if (isLinked && posState.weightInput) {
                const w = parseFloat(posState.weightInput);
                if (!isNaN(w)) updatePOSState({ cashInput: round(w * batchPrice).toFixed(2) });
            }
        }
    }
  }, [posState.batchId, posState.pricingTier, settings, selectedBatch, isLinked, posState.weightInput, posState.targetPrice, updatePOSState]);

  const handleCashChange = (val: string) => {
    updatePOSState({ cashInput: val });
    if (isLinked) {
        const cash = parseFloat(val);
        if (!isNaN(cash) && posState.targetPrice > 0) updatePOSState({ weightInput: round(cash / posState.targetPrice).toString() });
        else if (val === '') updatePOSState({ weightInput: '' });
    }
  };

  const handleWeightChange = (val: string) => {
    updatePOSState({ weightInput: val });
    if (isLinked) {
        const weight = parseFloat(val);
        if (!isNaN(weight)) updatePOSState({ cashInput: round(weight * posState.targetPrice).toFixed(2) });
        else if (val === '') updatePOSState({ cashInput: '' });
    }
  };

  const handlePriceChange = (val: string) => {
      const newPrice = parseFloat(val);
      if (isNaN(newPrice)) return;
      updatePOSState({ targetPrice: newPrice });
      const weight = parseFloat(posState.weightInput);
      if (!isNaN(weight)) updatePOSState({ cashInput: round(weight * newPrice).toFixed(2) });
  };

  const setPreset = (grams: number) => {
    const cash = round(grams * posState.targetPrice).toFixed(2);
    updatePOSState({ weightInput: grams.toString(), cashInput: cash });
  };

  const handleCompleteSale = () => {
    if (!selectedBatch) return;
    const finalCustomerId = posState.customerId || 'WALK_IN';
    const effectiveCustomer = customers.find(c => c.id === finalCustomerId);
    const weight = parseFloat(posState.weightInput);
    const amount = parseFloat(posState.cashInput);
    
    if (isNaN(weight) || isNaN(amount) || weight <= 0 || !effectiveCustomer) return;
    if (weight > selectedBatch.currentStock) { alert("Insufficient stock!"); return; }

    const costBasis = weight * selectedBatch.trueCostPerGram;
    const profit = amount - costBasis;

    processSale(selectedBatch.id, finalCustomerId, posState.salesRep, weight, amount, profit, posState.targetPrice, posState.paymentMethod);
    setLastTransaction({ batchName: selectedBatch.name, weight, amount, profit, customerName: effectiveCustomer.name });
  };

  const getRecommendedBatches = () => {
      const activeBatches = batches.filter(b => b.currentStock > 0);
      if (!selectedCustomer || !selectedCustomer.psychProfile) return activeBatches.slice(0, 3);
      const archetype = selectedCustomer.psychProfile.primary;
      if (['Optimiser', 'Analyst', 'Minimalist'].includes(archetype)) return [...activeBatches].sort((a,b) => (a.targetRetailPrice / a.trueCostPerGram) - (b.targetRetailPrice / b.trueCostPerGram)).slice(0, 3);
      else if (['Impulsive', 'Opportunist', 'Reactor'].includes(archetype)) return [...activeBatches].sort((a,b) => b.targetRetailPrice - a.targetRetailPrice).slice(0, 3);
      else return [...activeBatches].sort((a,b) => b.currentStock - a.currentStock).slice(0, 3);
  };

  const recommendedBatches = getRecommendedBatches();
  const currentWeight = parseFloat(posState.weightInput) || 0;
  const currentAmount = parseFloat(posState.cashInput) || 0;
  const expectedAmount = round(currentWeight * posState.targetPrice);
  const mathDiff = round(currentAmount - expectedAmount);
  const isShort = mathDiff < -0.05;
  const isOver = mathDiff > 0.05;
  const estimatedCost = selectedBatch ? currentWeight * selectedBatch.trueCostPerGram : 0;
  const projectedProfit = currentAmount - estimatedCost;
  const profitMarginPercent = currentAmount > 0 ? (projectedProfit / currentAmount) * 100 : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full relative animate-fade-in">
        {lastTransaction && (
             <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4" onClick={() => setLastTransaction(null)}>
                <div className="bg-gradient-to-br from-cyber-panel to-black border-2 border-cyber-green shadow-[0_0_100px_rgba(16,185,129,0.3)] rounded-3xl w-full max-w-md p-8 text-center relative overflow-hidden">
                    <CheckCircle2 size={64} className="text-cyber-green mx-auto mb-6 animate-pulse"/>
                    <h2 className="text-3xl font-black text-white uppercase tracking-widest mb-2">Transaction Complete</h2>
                    <p className="text-gray-400 text-sm mb-8">Ledger updated. Inventory adjusted.</p>
                    <div className="bg-black/50 rounded-xl p-6 space-y-4 text-left border border-white/10">
                        <div className="flex justify-between"><span className="text-gray-500">Client</span><span className="text-white font-bold">{lastTransaction.customerName}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Asset</span><span className="text-white font-bold">{lastTransaction.batchName}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Volume</span><span className="text-white font-bold">{lastTransaction.weight}{inventoryTerms.unit}</span></div>
                        <div className="flex justify-between font-bold text-xl border-t border-white/10 pt-4 mt-4"><span className="text-gray-400">TOTAL</span><span className="text-cyber-green">${lastTransaction.amount.toFixed(2)}</span></div>
                    </div>
                     <button className="mt-8 text-gray-500 text-xs uppercase font-bold tracking-widest hover:text-white">Click anywhere to close</button>
                </div>
            </div>
        )}
        <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <select value={posState.batchId} onChange={e => updatePOSState({ batchId: e.target.value })} className="w-full bg-cyber-panel border border-white/10 rounded-xl p-4 text-white font-bold outline-none focus:border-cyber-gold"><option value="">-- Select {inventoryTerms.strainLabel} --</option>{batches.filter(b=>b.currentStock > 0).map(b => <option key={b.id} value={b.id}>{b.name} ({b.currentStock.toFixed(1)}{inventoryTerms.unit})</option>)}</select>
                <select value={posState.customerId} onChange={e => updatePOSState({ customerId: e.target.value })} className="w-full bg-cyber-panel border border-white/10 rounded-xl p-4 text-white font-bold outline-none focus:border-cyber-gold"><option value="">-- Select Client --</option>{customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
            </div>
            <div className="bg-cyber-panel border border-white/10 rounded-2xl p-6 space-y-6">
                <div className="flex justify-between items-center"><div className="text-xs uppercase font-bold text-gray-400">Transaction Details</div><div className="flex bg-black/40 rounded-lg p-1 border border-white/10"><button onClick={() => updatePOSState({ pricingTier: 'RETAIL' })} className={`px-3 py-1 text-[10px] rounded-md font-bold uppercase ${posState.pricingTier === 'RETAIL' ? 'bg-cyber-gold text-black' : 'text-gray-500'}`}>Retail</button><button onClick={() => updatePOSState({ pricingTier: 'WHOLESALE' })} className={`px-3 py-1 text-[10px] rounded-md font-bold uppercase ${posState.pricingTier === 'WHOLESALE' ? 'bg-cyber-purple text-white' : 'text-gray-500'}`}>Wholesale</button></div></div>
                <div className="grid grid-cols-2 gap-6 items-end">
                    <div><label className="text-sm font-bold text-white flex items-center gap-2 mb-2"><Scale size={16}/> {inventoryTerms.stockLabel}</label><div className="relative"><input type="number" step="0.1" value={posState.weightInput} onChange={e => handleWeightChange(e.target.value)} className="w-full bg-black/50 border border-white/20 rounded-xl p-4 text-3xl font-mono text-white outline-none focus:border-cyber-purple transition-all text-center" placeholder="0.0"/><span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-mono">{inventoryTerms.unit}</span></div></div>
                    <div><label className="text-sm font-bold text-white flex items-center gap-2 mb-2"><DollarSign size={16}/> Price</label><div className="relative"><input type="number" step="0.01" value={posState.cashInput} onChange={e => handleCashChange(e.target.value)} className="w-full bg-black/50 border border-white/20 rounded-xl p-4 text-3xl font-mono text-white outline-none focus:border-cyber-green transition-all text-center" placeholder="0.00"/><span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-mono">$</span></div></div>
                </div>
                <div className="flex justify-center items-center gap-4"><div className="flex-1 h-px bg-white/10"></div><button onClick={() => setIsLinked(!isLinked)} className={`p-2 rounded-full border transition-all ${isLinked ? 'bg-cyber-purple/20 border-cyber-purple text-cyber-purple' : 'bg-gray-700 border-gray-600 text-gray-400'}`}>{isLinked ? <Link2 size={16}/> : <Link2Off size={16}/>}</button><div className="flex-1 h-px bg-white/10"></div></div>
                <div className="flex flex-wrap justify-center gap-2">{[1, 3.5, 7, 14, 28].map(w => <button key={w} onClick={() => setPreset(w)} className="bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-lg text-xs font-bold text-gray-300 transition-all">{w}{inventoryTerms.unit}</button>)}</div>
                {selectedBatch && <HaggleWidget costBasis={estimatedCost} currentPrice={currentAmount} targetPrice={expectedAmount} authorizedDiscountPct={customerDiscountAuth} />}
            </div>
            <div className="grid grid-cols-2 gap-4"><div className="flex bg-cyber-panel border border-white/10 rounded-xl p-1"><button onClick={()=>updatePOSState({paymentMethod:'CASH'})} className={`flex-1 flex items-center justify-center gap-2 p-3 text-sm font-bold rounded-lg ${posState.paymentMethod === 'CASH' ? 'bg-cyber-green text-black' : 'text-gray-400'}`}><Wallet size={16}/> Cash</button><button onClick={()=>updatePOSState({paymentMethod:'BANK'})} className={`flex-1 flex items-center justify-center gap-2 p-3 text-sm font-bold rounded-lg ${posState.paymentMethod === 'BANK' ? 'bg-cyber-purple text-white' : 'text-gray-400'}`}><CreditCard size={16}/> Bank</button></div><button onClick={handleCompleteSale} disabled={!selectedBatch || currentWeight <= 0} className="bg-cyber-gold text-black font-black text-lg p-4 rounded-xl uppercase tracking-widest hover:brightness-110 disabled:opacity-50 transition-all">Complete</button></div>
        </div>

        <div className="space-y-6">
            <div className="bg-cyber-panel border border-white/10 rounded-2xl p-6">
                <h3 className="text-xs uppercase font-bold text-gray---
