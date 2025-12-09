import React, { useState, useEffect } from 'react';
import { Sale, OperationalExpense } from '../types';
import { useData } from '../DataContext';
import { Save, CheckCircle, AlertTriangle, TrendingDown, DollarSign, Trash2, Wallet, ArrowDownCircle, PlayCircle, Lock, Download } from 'lucide-react';

interface LedgerProps {
  sales: Sale[];
}

const Ledger: React.FC<LedgerProps> = ({ sales }) => {
  const { operationalExpenses, addOperationalExpense, deleteOperationalExpense, settings, addNotification } = useData();
  
  // Shift State
  const [shiftStarted, setShiftStarted] = useState(false);
  const [openingFloat, setOpeningFloat] = useState<number>(0);
  const [floatInput, setFloatInput] = useState('');

  // Ledger State
  const [physicalCash, setPhysicalCash] = useState<string>('');
  const [submitted, setSubmitted] = useState(false);

  // Expense Form State
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expCategory, setExpCategory] = useState(settings.expenseCategories[0] || 'Misc');

  // Load Shift State on Mount
  useEffect(() => {
      const savedFloat = localStorage.getItem('smp_shift_float');
      if (savedFloat) {
          setOpeningFloat(parseFloat(savedFloat));
          setShiftStarted(true);
      }
  }, []);

  const handleStartShift = (e: React.FormEvent) => {
      e.preventDefault();
      const val = parseFloat(floatInput);
      if (!isNaN(val)) {
          setOpeningFloat(val);
          setShiftStarted(true);
          localStorage.setItem('smp_shift_float', val.toString());
      }
  };

  const handleEndShift = () => {
      if(window.confirm("Are you sure you want to close this shift and reset the float?")) {
          localStorage.removeItem('smp_shift_float');
          setShiftStarted(false);
          setOpeningFloat(0);
          setSubmitted(false);
          setPhysicalCash('');
          setFloatInput('');
      }
  };

  // Filter for "Today"
  const todayStr = new Date().toDateString();
  const todaySales = sales.filter(s => new Date(s.timestamp).toDateString() === todayStr);
  const todayExpenses = operationalExpenses.filter(e => new Date(e.timestamp).toDateString() === todayStr);
  
  // CALCULATIONS
  const totalSalesRevenue = todaySales.reduce((acc, s) => acc + s.amount, 0);
  const totalDeductions = todayExpenses.reduce((acc, e) => acc + e.amount, 0);
  
  // Expected Cash = Opening Float + Sales - Expenses
  const systemExpectedCash = openingFloat + totalSalesRevenue - totalDeductions;
  
  // Variance
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
          category: expCategory
      };
      
      addOperationalExpense(newExp);
      setExpDesc('');
      setExpAmount('');
  };

  const handleSubmitClose = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleExportCSV = () => {
      // Headers
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Date,Time,Type,Description,Category,Amount\n";

      // Sales
      sales.forEach(s => {
          const d = new Date(s.timestamp);
          csvContent += `${d.toLocaleDateString()},${d.toLocaleTimeString()},SALE,${s.batchName} (${s.weight}g),Revenue,${s.amount.toFixed(2)}\n`;
      });

      // Expenses
      operationalExpenses.forEach(e => {
          const d = new Date(e.timestamp);
          csvContent += `${d.toLocaleDateString()},${d.toLocaleTimeString()},EXPENSE,${e.description},${e.category},-${e.amount.toFixed(2)}\n`;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `SMP_LEDGER_EXPORT_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      addNotification("Ledger exported to CSV.", "SUCCESS");
  };

  if (!shiftStarted) {
      return (
          <div className="max-w-md mx-auto mt-20 p-8 bg-cyber-panel border border-white/10 rounded-2xl text-center shadow-2xl animate-fade-in">
              <Wallet size={64} className="mx-auto text-cyber-gold mb-6" />
              <h2 className="text-2xl font-bold text-white uppercase tracking-widest mb-2">Initialize Shift</h2>
              <p className="text-gray-400 text-sm mb-8">Enter the starting cash amount (Float) in the drawer to begin operations.</p>
              
              <form onSubmit={handleStartShift}>
                  <div className="relative mb-6">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-cyber-green font-bold">$</span>
                      <input 
                        type="number" step="0.01" autoFocus
                        value={floatInput} onChange={e => setFloatInput(e.target.value)}
                        className="w-full bg-black/50 border border-white/20 rounded-xl py-4 pl-10 pr-4 text-2xl text-white font-mono outline-none focus:border-cyber-green transition-all"
                        placeholder="0.00"
                      />
                  </div>
                  <button type="submit" className="w-full bg-cyber-green text-black font-bold py-4 rounded-xl uppercase tracking-widest hover:brightness-110 flex items-center justify-center gap-2">
                      <PlayCircle size={20} /> Open Register
                  </button>
              </form>
          </div>
      );
  }

  return (
    <div className="max-w-6xl mx-auto mt-6 pb-20 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Wallet className="text-cyber-gold" size={32} />
            <div>
                <h2 className="text-2xl font-bold text-white uppercase tracking-widest">Daily Ledger</h2>
                <div className="text-xs text-gray-500 font-mono">SHIFT OPEN • FLOAT: ${openingFloat.toFixed(2)}</div>
            </div>
          </div>
          <div className="flex gap-2">
              <button onClick={handleExportCSV} className="text-xs text-cyber-purple hover:text-white border border-cyber-purple/30 hover:bg-cyber-purple px-4 py-2 rounded-lg transition-all uppercase font-bold flex items-center gap-2">
                  <Download size={12} /> Export CSV
              </button>
              <button onClick={handleEndShift} className="text-xs text-red-500 hover:text-white border border-red-500/30 hover:bg-red-500 px-4 py-2 rounded-lg transition-all uppercase font-bold flex items-center gap-2">
                  <Lock size={12} /> Force Close Shift
              </button>
          </div>
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
                      <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                              <label className="text-[10px] uppercase font-bold text-gray-500">Reason</label>
                              <input 
                                  value={expDesc}
                                  onChange={e => setExpDesc(e.target.value)}
                                  placeholder="Details..."
                                  className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white text-sm outline-none focus:border-cyber-red"
                              />
                          </div>
                          <div>
                               <label className="text-[10px] uppercase font-bold text-gray-500">Category</label>
                               <select 
                                   value={expCategory}
                                   onChange={e => setExpCategory(e.target.value)}
                                   className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white text-sm outline-none"
                               >
                                   {settings.expenseCategories.map(cat => (
                                       <option key={cat} value={cat}>{cat}</option>
                                   ))}
                                   <option value="Other">Other</option>
                               </select>
                          </div>
                          <div className="col-span-2">
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
                  <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                      {todayExpenses.length === 0 ? (
                          <div className="text-center text-gray-600 text-xs italic py-4">No cash removed from drawer today.</div>
                      ) : (
                          todayExpenses.map(exp => (
                              <div key={exp.id} className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/5 group">
                                  <div>
                                      <div className="flex items-center gap-2">
                                          <span className="text-white font-bold text-sm">{exp.description}</span>
                                          <span className="text-[10px] text-gray-500 border border-gray-600 px-1 rounded">{exp.category}</span>
                                      </div>
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
                  <div className="grid grid-cols-3 gap-2 mb-8">
                      <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                          <span className="text-[9px] text-gray-500 uppercase font-bold block mb-1">Start Float</span>
                          <span className="text-lg font-mono text-gray-300 font-bold">${openingFloat.toFixed(2)}</span>
                      </div>
                      <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                          <span className="text-[9px] text-gray-500 uppercase font-bold block mb-1">Revenue</span>
                          <span className="text-lg font-mono text-cyber-green font-bold">+${totalSalesRevenue.toFixed(2)}</span>
                      </div>
                      <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                          <span className="text-[9px] text-gray-500 uppercase font-bold block mb-1">Expenses</span>
                          <span className="text-lg font-mono text-cyber-red font-bold">-${totalDeductions.toFixed(2)}</span>
                      </div>
                  </div>
                  
                  <div className="bg-black/40 rounded-xl p-4 border border-cyber-gold/30 mb-8 text-center">
                       <span className="text-xs text-cyber-gold uppercase font-bold block mb-1">Theoretical Drawer Total</span>
                       <span className="text-4xl font-mono text-white font-black">${systemExpectedCash.toFixed(2)}</span>
                  </div>

                  {!submitted ? (
                    <form onSubmit={handleSubmitClose} className="space-y-6 animate-fade-in">
                        <div className="relative">
                          <label className="block text-white text-sm font-bold uppercase mb-2 flex items-center gap-2">
                              <DollarSign size={16} className="text-cyber-green"/> Closing Cash Count
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
                          <p className="text-[10px] text-gray-500 mt-2">Enter the total physical cash currently in the register.</p>
                        </div>

                        <button className="w-full bg-gradient-to-r from-cyber-gold to-yellow-600 text-black font-black text-xl py-4 rounded-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 uppercase tracking-widest shadow-lg shadow-cyber-gold/20">
                          <Save /> Verify & Close
                        </button>
                    </form>
                  ) : (
                    <div className="animate-slide-in">
                        <div className={`p-6 rounded-2xl border-2 ${Math.abs(cashVariance) < 0.05 ? 'border-cyber-green bg-cyber-green/10' : cashVariance < 0 ? 'border-cyber-red bg-cyber-red/10' : 'border-cyber-gold bg-cyber-gold/10'}`}>
                           <div className="flex justify-between items-start mb-2">
                               <span className="text-sm uppercase font-bold tracking-widest opacity-80">
                                   {Math.abs(cashVariance) < 0.05 ? 'Perfectly Balanced' : cashVariance < 0 ? 'Shortage Detected' : 'Overage Detected'}
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
                        
                        <div className="mt-6 flex justify-center gap-4">
                            <button onClick={() => setSubmitted(false)} className="text-xs text-gray-400 hover:text-white underline">
                                Recount
                            </button>
                            <button onClick={handleEndShift} className="text-xs text-cyber-gold hover:text-white underline font-bold">
                                Finalize & Start New Day
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