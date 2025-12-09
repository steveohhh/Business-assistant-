import React, { useState } from 'react';
import { Sale, OperationalExpense } from '../types';
import { useData } from '../DataContext';
import { Save, CheckCircle, AlertTriangle, TrendingDown, DollarSign, Trash2, Wallet, ArrowDownCircle } from 'lucide-react';

interface LedgerProps {
  sales: Sale[];
}

const Ledger: React.FC<LedgerProps> = ({ sales }) => {
  const { operationalExpenses, addOperationalExpense, deleteOperationalExpense } = useData();
  
  // Ledger State
  const [physicalCash, setPhysicalCash] = useState<string>('');
  const [submitted, setSubmitted] = useState(false);

  // Expense Form State
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState('');

  // Filter for "Today"
  const todayStr = new Date().toDateString();
  const todaySales = sales.filter(s => new Date(s.timestamp).toDateString() === todayStr);
  const todayExpenses = operationalExpenses.filter(e => new Date(e.timestamp).toDateString() === todayStr);
  
  // CALCULATIONS
  const totalSalesRevenue = todaySales.reduce((acc, s) => acc + s.amount, 0);
  const totalDeductions = todayExpenses.reduce((acc, e) => acc + e.amount, 0);
  
  // The system's "Expected" cash is Revenue - what we took out.
  const systemExpectedCash = totalSalesRevenue - totalDeductions;
  
  // The Variance is what we counted minus what the system expects.
  // Negative means missing money.
  const actualCount = parseFloat(physicalCash || '0');
  const cashVariance = actualCount - systemExpectedCash;
  
  const handleAddExpense = (e: React.FormEvent) => {
      e.preventDefault();
      if (!expDesc || !expAmount) return;
      
      const newExp: OperationalExpense = {
          id: Date.now().toString(),
          description: expDesc,
          amount: parseFloat(expAmount),
          timestamp: new Date().toISOString(),
          category: 'PAYOUT'
      };
      
      addOperationalExpense(newExp);
      setExpDesc('');
      setExpAmount('');
  };

  const handleSubmitClose = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-6xl mx-auto mt-6 pb-20">
      <div className="flex items-center gap-3 mb-8 justify-center">
          <Wallet className="text-cyber-gold" size={32} />
          <h2 className="text-3xl font-bold text-white uppercase tracking-widest">Daily Ledger Protocol</h2>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* LEFT: EXPENSE MANAGEMENT (CASH OUT) */}
          <div className="space-y-6">
              <div className="bg-cyber-panel border border-white/10 rounded-2xl p-6">
                  <h3 className="text-white font-bold uppercase text-sm mb-4 flex items-center gap-2">
                      <ArrowDownCircle size={16} className="text-cyber-red" /> 
                      Drawer Deductions (Cash Out)
                  </h3>
                  
                  {/* Expense Form */}
                  <form onSubmit={handleAddExpense} className="bg-black/40 rounded-xl p-4 border border-white/5 mb-6">
                      <div className="grid grid-cols-3 gap-3 mb-3">
                          <div className="col-span-2">
                              <label className="text-[10px] uppercase font-bold text-gray-500">Reason</label>
                              <input 
                                  value={expDesc}
                                  onChange={e => setExpDesc(e.target.value)}
                                  placeholder="e.g. Gas, Lunch, Vendor Pay"
                                  className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white text-sm outline-none focus:border-cyber-red"
                              />
                          </div>
                          <div>
                              <label className="text-[10px] uppercase font-bold text-gray-500">Amount</label>
                              <input 
                                  type="number" step="0.01"
                                  value={expAmount}
                                  onChange={e => setExpAmount(e.target.value)}
                                  placeholder="0.00"
                                  className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white text-sm outline-none focus:border-cyber-red text-right font-mono"
                              />
                          </div>
                      </div>
                      <button type="submit" className="w-full bg-cyber-red/20 text-cyber-red border border-cyber-red/50 hover:bg-cyber-red hover:text-white rounded-lg py-2 text-xs font-bold uppercase transition-all">
                          Record Deduction
                      </button>
                  </form>

                  {/* Expense Log */}
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                      {todayExpenses.length === 0 ? (
                          <div className="text-center text-gray-600 text-xs italic py-4">No cash removed from drawer today.</div>
                      ) : (
                          todayExpenses.map(exp => (
                              <div key={exp.id} className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/5 group">
                                  <div>
                                      <div className="text-white font-bold text-sm">{exp.description}</div>
                                      <div className="text-[10px] text-gray-500">{new Date(exp.timestamp).toLocaleTimeString()}</div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                      <span className="font-mono text-cyber-red font-bold">-${exp.amount.toFixed(2)}</span>
                                      <button onClick={() => deleteOperationalExpense(exp.id)} className="text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <Trash2 size={14} />
                                      </button>
                                  </div>
                              </div>
                          ))
                      )}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                      <span className="text-gray-400 text-xs uppercase font-bold">Total Removed</span>
                      <span className="text-xl font-mono text-cyber-red font-bold">-${totalDeductions.toFixed(2)}</span>
                  </div>
              </div>
          </div>

          {/* RIGHT: RECONCILIATION (THE COUNT) */}
          <div className="space-y-6">
              <div className="bg-cyber-panel border border-white/10 rounded-2xl p-6 relative overflow-hidden">
                  
                  {/* System Math */}
                  <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                          <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Sales Revenue</span>
                          <span className="text-2xl font-mono text-cyber-green font-bold">+${totalSalesRevenue.toFixed(2)}</span>
                      </div>
                      <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                          <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Expenses (Out)</span>
                          <span className="text-2xl font-mono text-cyber-red font-bold">-${totalDeductions.toFixed(2)}</span>
                      </div>
                  </div>
                  
                  <div className="bg-black/40 rounded-xl p-4 border border-cyber-gold/30 mb-8 text-center">
                       <span className="text-xs text-cyber-gold uppercase font-bold block mb-1">Theoretical Cash In Drawer</span>
                       <span className="text-4xl font-mono text-white font-black">${systemExpectedCash.toFixed(2)}</span>
                  </div>

                  {!submitted ? (
                    <form onSubmit={handleSubmitClose} className="space-y-6 animate-fade-in">
                        <div className="relative">
                          <label className="block text-white text-sm font-bold uppercase mb-2 flex items-center gap-2">
                              <DollarSign size={16} className="text-cyber-green"/> Physical Cash Count
                          </label>
                          <div className="flex items-center relative">
                             <span className="absolute left-4 text-gray-500 text-xl">$</span>
                             <input 
                                type="number" step="0.01" required
                                value={physicalCash} onChange={e => setPhysicalCash(e.target.value)}
                                className="w-full bg-black/60 border border-white/20 rounded-xl py-4 pl-10 pr-4 text-3xl font-mono text-white outline-none focus:border-cyber-green transition-all"
                                placeholder="0.00"
                             />
                          </div>
                          <p className="text-[10px] text-gray-500 mt-2">Enter the total cash currently in the register.</p>
                        </div>

                        <button className="w-full bg-gradient-to-r from-cyber-gold to-yellow-600 text-black font-black text-xl py-4 rounded-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 uppercase tracking-widest shadow-lg shadow-cyber-gold/20">
                          <Save /> Close Shift
                        </button>
                    </form>
                  ) : (
                    <div className="animate-slide-in">
                        <div className={`p-6 rounded-2xl border-2 ${Math.abs(cashVariance) < 0.05 ? 'border-cyber-green bg-cyber-green/10' : cashVariance < 0 ? 'border-cyber-red bg-cyber-red/10' : 'border-cyber-gold bg-cyber-gold/10'}`}>
                           <div className="flex justify-between items-start mb-2">
                               <span className="text-sm uppercase font-bold tracking-widest opacity-80">
                                   {Math.abs(cashVariance) < 0.05 ? 'Balanced' : cashVariance < 0 ? 'Missing Money' : 'Overage'}
                               </span>
                               {Math.abs(cashVariance) < 0.05 ? <CheckCircle size={24}/> : <AlertTriangle size={24}/>}
                           </div>
                           
                           <div className="text-center py-4">
                               <span className="text-xs text-gray-400 uppercase font-bold block mb-1">Final Variance</span>
                               <span className={`text-5xl font-mono font-black ${cashVariance < 0 ? 'text-cyber-red' : 'text-cyber-green'}`}>
                                 {cashVariance > 0 ? '+' : ''}{cashVariance.toFixed(2)}
                               </span>
                           </div>
                        </div>
                        
                        <div className="mt-6 flex justify-center">
                            <button onClick={() => setSubmitted(false)} className="text-xs text-gray-500 hover:text-white underline">
                                Recount / Adjustment
                            </button>
                        </div>
                    </div>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
};

export default Ledger;