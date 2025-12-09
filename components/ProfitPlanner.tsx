import React, { useState, useEffect } from 'react';
import { useData } from '../DataContext';
import { Calculator, TrendingUp, AlertTriangle, ArrowRight, DollarSign, Percent, Scale, Crosshair } from 'lucide-react';
import { Batch } from '../types';

interface ProfitPlannerProps {
  onNavigateToPOS: () => void;
}

const ProfitPlanner: React.FC<ProfitPlannerProps> = ({ onNavigateToPOS }) => {
  const { batches, stageTransaction, settings } = useData();
  const [selectedBatchId, setSelectedBatchId] = useState('');
  
  // Scenario State
  const [targetWeight, setTargetWeight] = useState(3.5);
  const [basePrice, setBasePrice] = useState(settings.defaultPricePerGram);
  const [discountPercent, setDiscountPercent] = useState(0);

  const selectedBatch = batches.find(b => b.id === selectedBatchId);

  // Initialize base price when batch changes
  useEffect(() => {
    if (selectedBatch && selectedBatch.targetRetailPrice > 0) {
      setBasePrice(selectedBatch.targetRetailPrice);
    } else {
      setBasePrice(settings.defaultPricePerGram);
    }
  }, [selectedBatchId, settings.defaultPricePerGram]);

  // Calculations
  const finalPricePerGram = basePrice * (1 - discountPercent / 100);
  const totalRevenue = finalPricePerGram * targetWeight;
  const costBasisPerGram = selectedBatch ? selectedBatch.trueCostPerGram : 0;
  const totalCost = costBasisPerGram * targetWeight;
  const netProfit = totalRevenue - totalCost;
  const marginPercent = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  
  // Determine Health Colors
  const marginColor = marginPercent > 50 ? 'text-cyber-green' : marginPercent > 30 ? 'text-cyber-gold' : 'text-cyber-red';
  const marginBg = marginPercent > 50 ? 'bg-cyber-green' : marginPercent > 30 ? 'bg-cyber-gold' : 'bg-cyber-red';

  const handleApplyToPOS = () => {
    if (!selectedBatchId) return;
    stageTransaction({
      batchId: selectedBatchId,
      weight: targetWeight,
      amount: parseFloat(totalRevenue.toFixed(2))
    });
    onNavigateToPOS();
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-cyber-gold/20 p-2 rounded-lg text-cyber-gold">
          <Crosshair size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white uppercase tracking-tight">Strategy Planner</h2>
          <p className="text-xs text-gray-500">Hypothetical scenario modeling engine</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
        
        {/* LEFT: Controls */}
        <div className="lg:col-span-2 space-y-6">
           
           {/* Batch Selector */}
           <div className="bg-cyber-panel border border-white/10 rounded-2xl p-6">
              <label className="text-gray-400 text-xs font-bold uppercase mb-3 block">Inventory Source</label>
              <select 
                value={selectedBatchId} 
                onChange={e => setSelectedBatchId(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-cyber-gold transition-all"
              >
                <option value="">-- Select Asset --</option>
                {batches.map(b => (
                  <option key={b.id} value={b.id}>{b.name} (Stock: {b.currentStock.toFixed(1)}g)</option>
                ))}
              </select>
           </div>

           {selectedBatch && (
             <div className="bg-cyber-panel border border-white/10 rounded-2xl p-8 space-y-8 animate-fade-in shadow-2xl">
                
                {/* Weight Control */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-cyber-purple font-bold uppercase text-sm flex items-center gap-2"><Scale size={16}/> Target Weight</label>
                    <span className="text-2xl font-mono text-white">{targetWeight.toFixed(2)}g</span>
                  </div>
                  <input 
                    type="range" min="0.5" max="28" step="0.5" 
                    value={targetWeight} 
                    onChange={e => setTargetWeight(parseFloat(e.target.value))}
                    className="w-full accent-cyber-purple h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex gap-2 justify-center">
                    {[1, 3.5, 7, 14, 28].map(w => (
                      <button key={w} onClick={() => setTargetWeight(w)} className="bg-white/5 hover:bg-cyber-purple hover:text-white border border-white/10 px-3 py-1 rounded text-xs transition-all">{w}g</button>
                    ))}
                  </div>
                </div>

                {/* Price Control */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-cyber-gold font-bold uppercase text-sm flex items-center gap-2"><DollarSign size={16}/> Base Price / Gram</label>
                    <span className="text-2xl font-mono text-white">${basePrice.toFixed(2)}</span>
                  </div>
                  <input 
                    type="range" min={Math.ceil(costBasisPerGram)} max="30" step="0.5" 
                    value={basePrice} 
                    onChange={e => setBasePrice(parseFloat(e.target.value))}
                    className="w-full accent-cyber-gold h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <p className="text-xs text-center text-gray-500">Break-even: ${costBasisPerGram.toFixed(2)}/g</p>
                </div>

                {/* Discount Control */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-cyber-green font-bold uppercase text-sm flex items-center gap-2"><Percent size={16}/> Applied Discount</label>
                    <span className="text-2xl font-mono text-white">{discountPercent}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="50" step="1" 
                    value={discountPercent} 
                    onChange={e => setDiscountPercent(parseInt(e.target.value))}
                    className="w-full accent-cyber-green h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  {discountPercent > 20 && (
                    <div className="flex items-center justify-center gap-2 text-cyber-red text-xs animate-pulse">
                      <AlertTriangle size={12} /> High discount warning
                    </div>
                  )}
                </div>

             </div>
           )}
        </div>

        {/* RIGHT: Visual Analysis */}
        <div className="bg-black/40 border border-white/10 rounded-2xl p-6 flex flex-col">
          <h3 className="text-gray-400 uppercase text-xs font-bold mb-6 tracking-widest">Scenario Projection</h3>
          
          {selectedBatch ? (
            <div className="flex-1 flex flex-col justify-between animate-fade-in">
              
              {/* Margin Meter */}
              <div className="mb-8">
                 <div className="flex justify-between mb-2">
                    <span className="text-xs text-gray-500">Cost Ratio</span>
                    <span className="text-xs text-gray-500">Profit Ratio</span>
                 </div>
                 <div className="w-full h-4 bg-gray-800 rounded-full overflow-hidden flex">
                    <div className="bg-gray-600 h-full transition-all duration-500" style={{ width: `${100 - marginPercent}%` }}></div>
                    <div className={`${marginBg} h-full transition-all duration-500 shadow-[0_0_15px_rgba(255,255,255,0.2)]`} style={{ width: `${marginPercent}%` }}></div>
                 </div>
                 <div className="text-center mt-2">
                    <span className={`text-4xl font-black font-mono ${marginColor} transition-all`}>{marginPercent.toFixed(1)}%</span>
                    <span className="block text-[10px] text-gray-500 uppercase tracking-widest">Net Margin</span>
                 </div>
              </div>

              {/* Data Grid */}
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <span className="text-sm text-gray-400">Revenue</span>
                  <span className="text-xl font-mono text-white">${totalRevenue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <span className="text-sm text-gray-400">Total Cost</span>
                  <span className="text-xl font-mono text-red-400">-${totalCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                  <span className="text-sm text-cyber-gold font-bold uppercase">Net Profit</span>
                  <span className={`text-2xl font-mono font-bold ${netProfit > 0 ? 'text-cyber-green' : 'text-cyber-red'}`}>
                    ${netProfit.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Action */}
              <button 
                onClick={handleApplyToPOS}
                disabled={netProfit < 0 && marginPercent < 0}
                className="w-full bg-cyber-gold text-black font-black text-lg py-5 rounded-xl uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)] flex items-center justify-center gap-3 disabled:opacity-50 disabled:hover:scale-100"
              >
                Execute Strategy <ArrowRight size={20} />
              </button>

            </div>
          ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-gray-600">
               <Calculator size={64} className="mb-4 opacity-20" />
               <p className="text-center">Select an asset to begin modeling.</p>
             </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ProfitPlanner;
