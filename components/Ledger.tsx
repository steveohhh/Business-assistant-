import React, { useState, useEffect, useMemo } from 'react';
import { Sale, OperationalExpense } from '../types';
import { useAppStore } from '../stores/useAppStore';
import { Save, CheckCircle, AlertTriangle, TrendingDown, Trash2, Wallet, ArrowDownCircle, PlayCircle, Lock, Download, Calculator, DollarSign } from 'lucide-react';
import { safeFloat } from '../utils/formatting';

const Ledger: React.FC = () => {
  // REFACTORED: Atomic selectors to prevent loop #185
  const sales = useAppStore(s => s.sales);
  const operationalExpenses = useAppStore(s => s.operationalExpenses);
  const categories = useAppStore(s => s.settings.expenseCategories);
  
  const addOperationalExpense = useAppStore(s => s.addOperationalExpense);
  const deleteOperationalExpense = useAppStore(s => s.deleteOperationalExpense);
  const addNotification = useAppStore(s => s.addNotification);

  const [shiftStarted, setShiftStarted] = useState(false);
  const [openingFloat, setOpeningFloat] = useState<number>(0);
  const [floatInput, setFloatInput] = useState('');
  const [physicalCash, setPhysicalCash] = useState<string>('');
  const [submitted, setSubmitted] = useState(false);
  const [showDenominations, setShowDenominations] = useState(false);
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expCategory, setExpCategory] = useState(categories[0] || 'Misc');

  const [denoms, setDenoms] = useState({ d100: '', d50: '', d20: '', d10: '', d5: '', coins: '' });

  useEffect(() => {
      const savedFloat = localStorage.getItem('smp_shift_float');
      if (savedFloat) { setOpeningFloat(parseFloat(savedFloat)); setShiftStarted(true); }
  }, []);

  const handleStartShift = (e: React.FormEvent) => {
      e.preventDefault();
      const val = parseFloat(floatInput);
      if (!isNaN(val)) { setOpeningFloat(val); setShiftStarted(true); localStorage.setItem('smp_shift_float', val.toString()); }
  };

  const handleEndShift = () => {
      if(window.confirm("Close shift?")) {
          localStorage.removeItem('smp_shift_float');
          setShiftStarted(false); setOpeningFloat(0); setSubmitted(false); setPhysicalCash('');
      }
  };

  const { todaySales, todayExpenses, totalSalesRevenue, totalDeductions, systemExpectedCash } = useMemo(() => {
    const todayStr = new Date().toDateString();
    const tSales = sales.filter(s => new Date(s.timestamp).toDateString() === todayStr);
    const tExp = operationalExpenses.filter(e => new Date(e.timestamp).toDateString() === todayStr);
    const rev = tSales.reduce((acc, s) => acc + s.amount, 0);
    const ded = tExp.reduce((acc, e) => acc + e.amount, 0);
    // Use safeFloat for system expected calculation
    return { todaySales: tSales, todayExpenses: tExp, totalSalesRevenue: rev, totalDeductions: ded, systemExpectedCash: safeFloat(openingFloat + rev - ded) };
  }, [sales, operationalExpenses, openingFloat]);
  
  // Safe calculation for variance
  const cashVariance = safeFloat(parseFloat(physicalCash || '0') - systemExpectedCash);
  
  const handleAddExpense = (e: React.FormEvent) => {
      e.preventDefault();
      if (!expDesc || !expAmount) return;
      addOperationalExpense({ id: Date.now().toString(), description: expDesc, amount: parseFloat(expAmount), timestamp: new Date().toISOString(), category: expCategory });
      setExpDesc(''); setExpAmount('');
  };

  useEffect(() => {
      if (showDenominations) {
          const total = (parseFloat(denoms.d100) || 0) * 100 + (parseFloat(denoms.d50) || 0) * 50 + (parseFloat(denoms.d20) || 0) * 20 + (parseFloat(denoms.d10) || 0) * 10 + (parseFloat(denoms.d5) || 0) * 5 + (parseFloat(denoms.coins) || 0);
          setPhysicalCash(safeFloat(total).toFixed(2));
      }
  }, [denoms, showDenominations]);

  if (!shiftStarted) {
      return (
          <div className="max-w-md mx-auto mt-20 p-8 bg-cyber-panel border border-white/10 rounded-2xl text-center shadow-2xl animate-fade-in">
              <Wallet size={64} className="mx-auto text-cyber-gold mb-6" />
              <h2 className="text-2xl font-bold text-white uppercase tracking-widest mb-2">Initialize Shift</h2>
              <form onSubmit={handleStartShift}><div className="relative mb-6"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-cyber-green font-bold">$</span><input type="number" step="0.01" value={floatInput} onChange={e => setFloatInput(e.target.value)} className="w-full bg-black/50 border border-white/20 rounded-xl py-4 pl-10 pr-4 text-2xl text-white font-mono outline-none focus:border-cyber-green" placeholder="0.00"/></div><button type="submit" className="w-full bg-cyber-green text-black font-bold py-4 rounded-xl uppercase tracking-widest hover:brightness-110 flex items-center justify-center gap-2"><PlayCircle size={20} /> Open Register</button></form>
          </div>
      );
  }

  return (
    <div className="max-w-6xl mx-auto mt-6 pb-20 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3"><Wallet className="text-cyber-gold" size={32} /><div><h2 className="text-2xl font-bold text-white uppercase tracking-widest">Daily Ledger</h2><div className="text-xs text-gray-500 font-mono">SHIFT OPEN • FLOAT: ${openingFloat.toFixed(2)}</div></div></div>
          <button onClick={handleEndShift} className="text-xs text-red-500 hover:text-white border border-red-500/30 hover:bg-red-500 px-4 py-2 rounded-lg transition-all uppercase font-bold flex items-center gap-2"><Lock size={12} /> Force Close</button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
              <div className="bg-cyber-panel border border-white/10 rounded-2xl p-6">
                  <h3 className="text-white font-bold uppercase text-sm mb-4 flex items-center gap-2"><ArrowDownCircle size={16} className="text-cyber-red" /> Drawer Deductions</h3>
                  <form onSubmit={handleAddExpense} className="bg-black/40 rounded-xl p-4 border border-white/5 mb-6">
                      <div className="grid grid-cols-2 gap-3 mb-3">
                          <input value={expDesc} onChange={e => setExpDesc(e.target.value)} placeholder="Reason" className="bg-white/5 border border-white/10 rounded-lg p-2 text-white text-sm outline-none col-span-2"/>
                          <select value={expCategory} onChange={e => setExpCategory(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg p-2 text-white text-sm outline-none">{categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}<option value="Other">Other</option></select>
                          <input type="number" step="0.01" value={expAmount} onChange={e => setExpAmount(e.target.value)} placeholder="0.00" className="bg-white/5 border border-white/10 rounded-lg p-2 text-white text-sm outline-none text-right font-mono"/>
                      </div>
                      <button type="submit" className="w-full bg-cyber-red/20 text-cyber-red border border-cyber-red/50 hover:bg-cyber-red hover:text-white rounded-lg py-2 text-xs font-bold uppercase transition-all">Record Deduction</button>
                  </form>
                  <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                      {todayExpenses.map(exp => (
                          <div key={exp.id} className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/5 group">
                              <div><div className="text-white font-bold text-sm">{exp.description}</div><div className="text-[10px] text-gray-500">{new Date(exp.timestamp).toLocaleTimeString()}</div></div>
                              <div className="flex items-center gap-4"><span className="font-mono text-cyber-red font-bold">-${exp.amount.toFixed(2)}</span><button onClick={() => deleteOperationalExpense(exp.id)} className="text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14} /></button></div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
          <div className="space-y-6">
              <div className="bg-cyber-panel border border-white/10 rounded-2xl p-6 relative">
                  <div className="bg-black/40 rounded-xl p-4 border border-cyber-gold/30 mb-8 text-center"><span className="text-xs text-cyber-gold uppercase font-bold block mb-1">Theoretical Total</span><span className="text-4xl font-mono text-white font-black">${systemExpectedCash.toFixed(2)}</span></div>
                  {!submitted ? (
                    <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} className="space-y-6 animate-fade-in">
                        <div className="flex justify-between items-center"><label className="text-white text-sm font-bold uppercase flex items-center gap-2"><DollarSign size={16} className="text-cyber-green"/> Cash Count</label><button type="button" onClick={() => setShowDenominations(!showDenominations)} className="text-[10px] text-cyber-gold uppercase font-bold">{showDenominations ? 'Hide' : 'Helper'}</button></div>
                        {showDenominations && (
                            <div className="grid grid-cols-3 gap-3 bg-black/40 p-4 rounded-xl border border-white/10 animate-slide-in">
                                {['100', '50', '20', '10', '5'].map(d => (
                                    <div key={d}><label className="text-[9px] text-gray-500 font-bold block mb-1">${d}</label><input type="number" value={denoms[`d${d}` as keyof typeof denoms]} onChange={e => setDenoms({...denoms, [`d${d}`]: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded p-1 text-center text-white text-xs outline-none font-mono"/></div>
                                ))}
                                <div><label className="text-[9px] text-gray-500 font-bold block mb-1">Coins</label><input type="number" value={denoms.coins} onChange={e => setDenoms({...denoms, coins: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded p-1 text-center text-white text-xs outline-none font-mono"/></div>
                            </div>
                        )}
                        <div className="flex items-center relative"><span className="absolute left-4 text-gray-500 text-xl">$</span><input type="number" step="0.01" required value={physicalCash} onChange={e => setPhysicalCash(e.target.value)} className="w-full bg-black/60 border border-white/20 rounded-xl py-4 pl-10 pr-4 text-3xl font-mono text-white outline-none focus:border-cyber-green" readOnly={showDenominations}/></div>
                        <button className="w-full bg-gradient-to-r from-cyber-gold to-yellow-600 text-black font-black text-xl py-4 rounded-xl uppercase tracking-widest shadow-lg">Save & Reconcile</button>
                    </form>
                  ) : (
                    <div className="animate-slide-in text-center">
                        <div className="mb-6 flex justify-center">{Math.abs(cashVariance) < 0.01 ? <CheckCircle size={80} className="text-cyber-green" /> : <AlertTriangle size={80} className="text-red-500" />}</div>
                        <h3 className="text-white font-bold text-2xl uppercase mb-2">Shift Closed</h3>
                        <div className="bg-black/40 rounded-xl p-6 border border-white/10 mb-6">
                            <div className="text-xs text-gray-500 uppercase font-bold mb-2">Variance</div>
                            <div className={`text-4xl font-mono font-bold ${Math.abs(cashVariance) < 0.01 ? 'text-cyber-green' : 'text-red-500'}`}>{cashVariance >= 0 ? '+' : ''}{cashVariance.toFixed(2)}</div>
                        </div>
                        <button onClick={() => setSubmitted(false)} className="text-gray-500 hover:text-white underline text-xs">Correct Count</button>
                    </div>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
};

export default Ledger;