import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../DataContext';
import { Settings as SettingsIcon, Save, Users, Plus, X, Download, Smartphone, Trash2, Monitor, Lock, ShieldCheck, Database, Upload, FileJson, DollarSign, List } from 'lucide-react';
import { BackupData } from '../types';

const Settings: React.FC = () => {
  const { settings, updateSettings, addNotification, batches, customers, sales, operationalExpenses, loadBackup } = useData();
  const [form, setForm] = useState(settings);
  const [saved, setSaved] = useState(false);
  const [newStaff, setNewStaff] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // PIN Management
  const [pinInput, setPinInput] = useState(settings.appPin || '');
  
  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
        addNotification("Installation not supported or already installed.", 'INFO');
        return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
        addNotification("Installing Application...", 'SUCCESS');
        setDeferredPrompt(null);
        setIsInstallable(false);
    }
  };

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

  const addStaff = (e: React.FormEvent) => {
      e.preventDefault();
      if (newStaff && !form.staffMembers.includes(newStaff)) {
          setForm({ ...form, staffMembers: [...form.staffMembers, newStaff] });
          setNewStaff('');
      }
  };

  const removeStaff = (name: string) => {
      setForm({ ...form, staffMembers: form.staffMembers.filter(s => s !== name) });
  };

  const addCategory = (e: React.FormEvent) => {
      e.preventDefault();
      if (newCategory && !form.expenseCategories.includes(newCategory)) {
          setForm({ ...form, expenseCategories: [...form.expenseCategories, newCategory] });
          setNewCategory('');
      }
  };

  const removeCategory = (cat: string) => {
      setForm({ ...form, expenseCategories: form.expenseCategories.filter(c => c !== cat) });
  };

  const handleExportBackup = () => {
      const backup: BackupData = {
          version: "2.5.0",
          timestamp: new Date().toISOString(),
          batches,
          customers,
          sales,
          operationalExpenses,
          settings
      };

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

  const handleImportClick = () => {
      fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const json = JSON.parse(event.target?.result as string);
              if (!json.version || !json.timestamp) throw new Error("Invalid backup format");
              if (window.confirm(`Restore backup from ${new Date(json.timestamp).toLocaleDateString()}?`)) {
                   loadBackup(json);
              }
          } catch (err) {
              console.error(err);
              addNotification("Failed to parse backup file.", "ERROR");
          }
      };
      reader.readAsText(file);
      e.target.value = '';
  };

  return (
    <div className="max-w-4xl mx-auto mt-10 pb-20 animate-fade-in">
      <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3 tracking-tight uppercase">
        <SettingsIcon className="text-cyber-gold" /> System Configuration
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* GENERAL SETTINGS */}
          <form onSubmit={handleSave} className="space-y-8">
            
            {/* ECONOMICS PANEL */}
            <div className="bg-cyber-panel border border-white/10 rounded-2xl p-8 space-y-6">
                <h3 className="text-white font-bold uppercase text-sm border-b border-white/10 pb-4">Standard Economics</h3>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-gray-400 font-bold uppercase text-xs tracking-wider">Retail Price ($/g)</label>
                        <input 
                            type="number" step="0.01"
                            value={form.defaultPricePerGram}
                            onChange={e => setForm({...form, defaultPricePerGram: parseFloat(e.target.value) || 0})}
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-cyber-green outline-none"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-gray-400 font-bold uppercase text-xs tracking-wider">Wholesale ($/g)</label>
                        <input 
                            type="number" step="0.01"
                            value={form.defaultWholesalePrice}
                            onChange={e => setForm({...form, defaultWholesalePrice: parseFloat(e.target.value) || 0})}
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-cyber-gold outline-none"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-gray-400 font-bold uppercase text-xs tracking-wider">Cost Estimate ($/g)</label>
                    <input 
                        type="number" step="0.01"
                        value={form.defaultCostEstimate}
                        onChange={e => setForm({...form, defaultCostEstimate: parseFloat(e.target.value) || 0})}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-cyber-gold outline-none"
                    />
                    <p className="text-[10px] text-gray-500">Used for estimating margin when batch data is missing.</p>
                </div>
            </div>

            {/* EXPENSE CATEGORIES */}
             <div className="bg-cyber-panel border border-white/10 rounded-2xl p-8 space-y-6">
                <h3 className="text-white font-bold uppercase text-sm border-b border-white/10 pb-4 flex items-center gap-2">
                    <List size={16}/> Expense Categories
                </h3>
                <div className="flex flex-wrap gap-2 mb-2">
                    {form.expenseCategories.map(cat => (
                        <span key={cat} className="bg-white/10 text-white text-xs px-2 py-1 rounded flex items-center gap-2">
                            {cat} <button type="button" onClick={() => removeCategory(cat)}><X size={10} className="hover:text-red-500"/></button>
                        </span>
                    ))}
                </div>
                <div className="flex gap-2">
                    <input 
                        value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="Add Category"
                        className="flex-1 bg-black/40 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-cyber-purple"
                    />
                    <button onClick={addCategory} className="bg-white/10 text-white p-3 rounded-lg hover:bg-white/20"><Plus size={20}/></button>
                </div>
            </div>

            {/* SECURITY PANEL */}
            <div className="bg-cyber-panel border border-white/10 rounded-2xl p-8 space-y-6">
                 <h3 className="text-white font-bold uppercase text-sm border-b border-white/10 pb-4 flex items-center gap-2">
                    <ShieldCheck size={16} className="text-cyber-gold"/> Security Protocols
                 </h3>
                 <div className="space-y-2">
                     <label className="text-gray-400 font-bold uppercase text-xs tracking-wider">App Access PIN</label>
                     <div className="relative">
                        <Lock size={16} className="absolute left-4 top-4 text-gray-500"/>
                        <input 
                            type="text" maxLength={4} placeholder="Set PIN (Leave empty to disable)"
                            value={pinInput} onChange={e => { const val = e.target.value.replace(/[^0-9]/g, ''); setPinInput(val); }}
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-4 pl-12 text-xl font-mono text-white tracking-[0.5em] focus:border-cyber-gold outline-none"
                        />
                     </div>
                 </div>
            </div>

            <button 
                type="submit"
                className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest transition-all shadow-lg ${saved ? 'bg-cyber-green text-black' : 'bg-white text-black hover:bg-gray-200'}`}
            >
                {saved ? 'Configuration Saved' : 'Save Changes'}
            </button>
          </form>

          {/* RIGHT COLUMN */}
          <div className="space-y-8">
              
              <div className="bg-cyber-panel border border-white/10 rounded-2xl p-8 space-y-6">
                  <h3 className="text-white font-bold uppercase text-sm border-b border-white/10 pb-4 flex items-center gap-2">
                      <Database size={16}/> Data Persistence
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                      <button onClick={handleExportBackup} className="bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cyber-gold p-4 rounded-xl flex flex-col items-center gap-2 transition-all group">
                          <Download size={24} className="text-cyber-gold group-hover:scale-110 transition-transform" />
                          <span className="text-xs font-bold uppercase text-white">Backup</span>
                      </button>
                      <button onClick={handleImportClick} className="bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cyber-purple p-4 rounded-xl flex flex-col items-center gap-2 transition-all group">
                          <Upload size={24} className="text-cyber-purple group-hover:scale-110 transition-transform" />
                          <span className="text-xs font-bold uppercase text-white">Restore</span>
                      </button>
                      <input type="file" accept=".json" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                  </div>
              </div>

              <div className="bg-cyber-panel border border-white/10 rounded-2xl p-8 space-y-6">
                   <h3 className="text-white font-bold uppercase text-sm border-b border-white/10 pb-4 flex items-center gap-2"><Users size={16}/> Staff</h3>
                   <div className="space-y-2">
                       <label className="text-gray-400 font-bold uppercase text-xs tracking-wider">Commission (%)</label>
                       <input 
                           type="number" step="0.1" value={form.commissionRate}
                           onChange={e => setForm({...form, commissionRate: parseFloat(e.target.value) || 0})}
                           className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-xl font-mono text-cyber-purple focus:border-cyber-purple outline-none"
                       />
                   </div>
                   <div className="space-y-2 mb-4">
                       {form.staffMembers.map(staff => (
                           <div key={staff} className="flex justify-between items-center bg-white/5 p-3 rounded-lg">
                               <span className="text-white font-bold">{staff}</span>
                               {form.staffMembers.length > 1 && (
                                   <button onClick={() => removeStaff(staff)} className="text-gray-500 hover:text-red-500"><Trash2 size={16} /></button>
                               )}
                           </div>
                       ))}
                   </div>
                   <div className="flex gap-2">
                       <input value={newStaff} onChange={e => setNewStaff(e.target.value)} placeholder="New Agent" className="flex-1 bg-black/40 border border-white/10 rounded-lg p-3 text-white outline-none" />
                       <button onClick={addStaff} className="bg-cyber-purple/20 text-cyber-purple border border-cyber-purple/50 px-4 rounded-lg"><Plus size={20}/></button>
                   </div>
              </div>

              {/* SYSTEM INFO */}
              <div className="bg-cyber-panel border border-white/10 rounded-2xl p-8">
                  <h3 className="text-white font-bold uppercase text-sm border-b border-white/10 pb-4 mb-6 flex items-center gap-2"><Monitor size={16}/> Status</h3>
                  <div className="text-center">
                      {isInstallable ? (
                          <button onClick={handleInstallClick} className="w-full bg-cyber-gold text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 mb-4">
                              <Download size={20} /> Install App
                          </button>
                      ) : (
                          <div className="w-full bg-white/5 text-gray-500 font-bold py-4 rounded-xl flex items-center justify-center gap-2 mb-4 border border-white/5">
                              <Smartphone size={20} /> Installed
                          </div>
                      )}
                      <p className="text-[10px] text-gray-600 uppercase font-bold tracking-widest">Version 2.6.0</p>
                  </div>
              </div>

          </div>
      </div>
    </div>
  );
};

export default Settings;