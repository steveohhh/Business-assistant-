import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { Settings as SettingsIcon, Save, Users, Plus, X, Download, Smartphone, Trash2, Monitor, Lock, ShieldCheck, Database, Upload, FileJson, DollarSign, List, Package, AlertTriangle, Calculator, TrendingUp, Wallet, CreditCard, Hash, CheckCircle } from 'lucide-react';
import { BackupData } from '../types';

const Settings: React.FC = () => {
  const { 
    settings, updateSettings, addNotification, batches, customers, sales, 
    operationalExpenses, partners, referrals, financials, missions, 
    updateFinancials, loadBackup, isInstallable, triggerInstallPrompt 
  } = useAppStore(state => ({ ...state }));
  
  const [form, setForm] = useState(settings);
  const [saved, setSaved] = useState(false);
  const [newStaff, setNewStaff] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [adjustCash, setAdjustCash] = useState(0);
  const [adjustBank, setAdjustBank] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pinInput, setPinInput] = useState(settings.appPin || '');

  useEffect(() => { setAdjustCash(financials.cashOnHand); setAdjustBank(financials.bankBalance); }, [financials]);
  useEffect(() => { setForm(settings); setPinInput(settings.appPin || ''); }, [settings]);


  const projectedMargin = form.defaultPricePerGram - form.defaultCostEstimate;
  const projectedMarginPercent = form.defaultPricePerGram > 0 ? (projectedMargin / form.defaultPricePerGram) * 100 : 0;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput && !/^\d{4}$/.test(pinInput)) {
        addNotification("PIN must be exactly 4 digits.", "ERROR");
        return;
    }
    updateSettings({ ...form, appPin: pinInput });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };
  
  const handleUpdateFinancials = () => {
      updateFinancials({ cashOnHand: adjustCash, bankBalance: adjustBank });
      addNotification("Wallet balances manually updated.", 'WARNING');
  };

  const handleFactoryReset = () => {
      if (window.confirm("CRITICAL WARNING: This will permanently delete ALL data. Are you sure?")) {
          if(window.confirm("FINAL CONFIRMATION: Wipe system completely?")) {
              localStorage.clear();
              window.location.reload();
          }
      }
  };

  const addStaff = (e: React.FormEvent) => { e.preventDefault(); if (newStaff && !form.staffMembers.includes(newStaff)) { setForm({ ...form, staffMembers: [...form.staffMembers, newStaff] }); setNewStaff(''); } };
  const removeStaff = (name: string) => { setForm({ ...form, staffMembers: form.staffMembers.filter(s => s !== name) }); };
  const addCategory = (e: React.FormEvent) => { e.preventDefault(); if (newCategory && !form.expenseCategories.includes(newCategory)) { setForm({ ...form, expenseCategories: [...form.expenseCategories, newCategory] }); setNewCategory(''); } };
  const removeCategory = (cat: string) => { setForm({ ...form, expenseCategories: form.expenseCategories.filter(c => c !== cat) }); };

  const handleExportBackup = () => {
      const backup: BackupData = { version: "2.6.0", timestamp: new Date().toISOString(), batches, customers, sales, operationalExpenses, settings, partners, referrals, financials, missions };
      const dataStr = JSON.stringify(backup, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SMP_BACKUP_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addNotification("Backup file generated.", "SUCCESS");
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const json = JSON.parse(event.target?.result as string);
              if (!json.version || !json.timestamp) throw new Error("Invalid backup format");
              if (window.confirm(`Restore backup from ${new Date(json.timestamp).toLocaleDateString()}?`)) loadBackup(json);
          } catch (err) { addNotification("Failed to parse backup file.", "ERROR"); }
      };
      reader.readAsText(file);
      e.target.value = '';
  };

  return (
    <div className="max-w-5xl mx-auto mt-6 pb-20 animate-fade-in">
        <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3 tracking-tight uppercase"><SettingsIcon className="text-cyber-gold" /> System Configuration</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <form onSubmit={handleSave} className="space-y-8">
                {/* Core Business Logic */}
                <div className="bg-cyber-panel border border-white/10 rounded-2xl p-6">
                    <h3 className="text-white font-bold uppercase text-sm mb-6 flex items-center gap-2"><Calculator size={16} className="text-cyber-green"/> Core Business Logic</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs text-gray-400 uppercase font-bold">Default Retail Price</label><input type="number" value={form.defaultPricePerGram} onChange={e => setForm({...form, defaultPricePerGram: parseFloat(e.target.value)})} className="w-full bg-black/50 border border-white/10 rounded p-2 text-white outline-none"/></div>
                        <div><label className="text-xs text-gray-400 uppercase font-bold">Default Wholesale</label><input type="number" value={form.defaultWholesalePrice} onChange={e => setForm({...form, defaultWholesalePrice: parseFloat(e.target.value)})} className="w-full bg-black/50 border border-white/10 rounded p-2 text-white outline-none"/></div>
                        <div><label className="text-xs text-gray-400 uppercase font-bold">Est. Cost Basis</label><input type="number" value={form.defaultCostEstimate} onChange={e => setForm({...form, defaultCostEstimate: parseFloat(e.target.value)})} className="w-full bg-black/50 border border-white/10 rounded p-2 text-white outline-none"/></div>
                        <div><label className="text-xs text-gray-400 uppercase font-bold">Commission Rate (%)</label><input type="number" value={form.commissionRate} onChange={e => setForm({...form, commissionRate: parseFloat(e.target.value)})} className="w-full bg-black/50 border border-white/10 rounded p-2 text-white outline-none"/></div>
                    </div>
                    <div className="mt-4 p-3 bg-black/40 rounded border border-white/10 flex justify-between items-center"><div className="text-xs text-gray-400">Projected Margin</div><div className="text-cyber-gold font-mono font-bold">{projectedMarginPercent.toFixed(1)}%</div></div>
                </div>

                {/* Operator Identity */}
                <div className="bg-cyber-panel border border-white/10 rounded-2xl p-6">
                    <h3 className="text-white font-bold uppercase text-sm mb-6 flex items-center gap-2"><Users size={16} className="text-cyber-purple"/> Operator Identity</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs text-gray-400 uppercase font-bold">Operator Alias</label><input value={form.operatorAlias} onChange={e => setForm({...form, operatorAlias: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded p-2 text-white outline-none"/></div>
                        <div><label className="text-xs text-gray-400 uppercase font-bold">Public Dealer ID</label><input value={form.publicDealerId} onChange={e => setForm({...form, publicDealerId: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded p-2 text-white outline-none"/></div>
                    </div>
                </div>
                
                {/* System Access */}
                <div className="bg-cyber-panel border border-white/10 rounded-2xl p-6">
                    <h3 className="text-white font-bold uppercase text-sm mb-6 flex items-center gap-2"><Lock size={16} className="text-red-500"/> System Access</h3>
                    <div><label className="text-xs text-gray-400 uppercase font-bold">4-Digit Lock PIN (leave blank to disable)</label><input type="text" maxLength={4} value={pinInput} onChange={e => setPinInput(e.target.value.replace(/\D/g, ''))} className="w-full bg-black/50 border border-white/10 rounded p-2 text-white font-mono text-2xl tracking-[0.5em] text-center outline-none"/></div>
                </div>

                <button type="submit" className="w-full bg-cyber-gold text-black font-bold py-4 rounded-xl uppercase tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-2">
                    {saved ? <CheckCircle size={20}/> : <Save size={20}/>} {saved ? 'SAVED' : 'Save Configuration'}
                </button>
            </form>

            <div className="space-y-8">
                {/* Staff & Categories */}
                <div className="bg-cyber-panel border border-white/10 rounded-2xl p-6">
                    <h3 className="text-white font-bold uppercase text-sm mb-6 flex items-center gap-2"><List size={16} /> Staff & Categories</h3>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <h4 className="text-xs text-gray-400 uppercase font-bold mb-2">Staff Members</h4>
                            <form onSubmit={addStaff} className="flex gap-2 mb-2"><input value={newStaff} onChange={e => setNewStaff(e.target.value)} className="flex-1 bg-black/50 text-xs p-2 rounded border border-white/10"/><button type="submit" className="bg-white/10 p-2 rounded"><Plus size={14}/></button></form>
                            <div className="space-y-1">{form.staffMembers.map(s => <div key={s} className="flex justify-between items-center bg-white/5 p-1 px-2 rounded text-xs"><span className="text-gray-300">{s}</span><button onClick={()=>removeStaff(s)} className="text-gray-600 hover:text-red-500"><X size={12}/></button></div>)}</div>
                        </div>
                        <div>
                            <h4 className="text-xs text-gray-400 uppercase font-bold mb-2">Expense Categories</h4>
                            <form onSubmit={addCategory} className="flex gap-2 mb-2"><input value={newCategory} onChange={e => setNewCategory(e.target.value)} className="flex-1 bg-black/50 text-xs p-2 rounded border border-white/10"/><button type="submit" className="bg-white/10 p-2 rounded"><Plus size={14}/></button></form>
                            <div className="space-y-1">{form.expenseCategories.map(c => <div key={c} className="flex justify-between items-center bg-white/5 p-1 px-2 rounded text-xs"><span className="text-gray-300">{c}</span><button onClick={()=>removeCategory(c)} className="text-gray-600 hover:text-red-500"><X size={12}/></button></div>)}</div>
                        </div>
                    </div>
                </div>

                 {/* Wallet Management */}
                 <div className="bg-cyber-panel border border-white/10 rounded-2xl p-6">
                    <h3 className="text-white font-bold uppercase text-sm mb-6 flex items-center gap-2"><Wallet size={16} className="text-blue-400"/> Wallet Management</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div><label className="text-xs text-gray-400 uppercase font-bold">Cash on Hand</label><input type="number" value={adjustCash} onChange={e => setAdjustCash(parseFloat(e.target.value))} className="w-full bg-black/50 border border-white/10 rounded p-2 text-white outline-none"/></div>
                        <div><label className="text-xs text-gray-400 uppercase font-bold">Bank Balance</label><input type="number" value={adjustBank} onChange={e => setAdjustBank(parseFloat(e.target.value))} className="w-full bg-black/50 border border-white/10 rounded p-2 text-white outline-none"/></div>
                    </div>
                    <button onClick={handleUpdateFinancials} className="w-full bg-blue-500/20 border border-blue-500/50 text-blue-400 font-bold py-2 rounded text-xs hover:bg-blue-500 hover:text-white transition-all">Manually Adjust Balances</button>
                </div>
                
                {/* System & Data */}
                <div className="bg-cyber-panel border border-white/10 rounded-2xl p-6">
                    <h3 className="text-white font-bold uppercase text-sm mb-6 flex items-center gap-2"><Database size={16}/> System & Data</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <button onClick={handleExportBackup} className="bg-white/5 p-4 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-300 hover:bg-white/10 hover:text-white"><Download size={20}/> <span className="text-xs font-bold">Export Backup</span></button>
                        <button onClick={handleImportClick} className="bg-white/5 p-4 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-300 hover:bg-white/10 hover:text-white"><Upload size={20}/> <span className="text-xs font-bold">Import Backup</span></button>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json"/>
                    </div>
                    {isInstallable && <button onClick={triggerInstallPrompt} className="w-full bg-cyber-purple/20 border border-cyber-purple/50 text-cyber-purple font-bold py-3 rounded-lg text-sm hover:bg-cyber-purple hover:text-white transition-all flex items-center justify-center gap-2 mb-4"><Smartphone size={16}/> Install PWA</button>}
                    <button onClick={handleFactoryReset} className="w-full bg-red-500/20 border border-red-500/50 text-red-400 font-bold py-3 rounded-lg text-sm hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"><AlertTriangle size={16}/> Factory Reset</button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default Settings;