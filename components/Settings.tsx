import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { Settings as SettingsIcon, Save, Users, Plus, X, Download, Smartphone, Trash2, Database, Upload, Calculator, Wallet, Lock, CheckCircle, Cloud, RefreshCw, Wifi, AlertTriangle, Tv2 } from 'lucide-react';
import { BackupData } from '../types';
import { saveToCloud, loadFromCloud, initSupabase } from '../services/supabaseService';

const Settings: React.FC = () => {
  // REFACTORED: Granular selectors to prevent Error 185
  const settings = useAppStore(state => state.settings);
  const financials = useAppStore(state => state.financials);
  const batches = useAppStore(state => state.batches);
  
  const updateSettings = useAppStore(state => state.updateSettings);
  const updateFinancials = useAppStore(state => state.updateFinancials);
  const addNotification = useAppStore(state => state.addNotification);
  const loadBackup = useAppStore(state => state.loadBackup);
  const isInstallable = useAppStore(state => state.isInstallable);
  const triggerInstallPrompt = useAppStore(state => state.triggerInstallPrompt);
  const updateStorefront = useAppStore(state => state.updateStorefront);

  // Backup context (needed for export)
  const customers = useAppStore(state => state.customers);
  const sales = useAppStore(state => state.sales);
  const operationalExpenses = useAppStore(state => state.operationalExpenses);
  const partners = useAppStore(state => state.partners);
  const referrals = useAppStore(state => state.referrals);
  const missions = useAppStore(state => state.missions);
  
  const [form, setForm] = useState(settings);
  const [saved, setSaved] = useState(false);
  const [adjustCash, setAdjustCash] = useState(financials.cashOnHand);
  const [adjustBank, setAdjustBank] = useState(financials.bankBalance);
  const [pinInput, setPinInput] = useState(settings.appPin || '');
  const [cloudStatus, setCloudStatus] = useState<'IDLE' | 'SYNCING' | 'SUCCESS' | 'ERROR'>('IDLE');
  
  // Storefront state
  const [storefrontMsg, setStorefrontMsg] = useState(settings.storefrontMessage || '');
  const [visibleBatches, setVisibleBatches] = useState<string[]>(batches.filter(b => b.isVisibleToCustomer).map(b => b.id));

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setAdjustCash(financials.cashOnHand); setAdjustBank(financials.bankBalance); }, [financials.cashOnHand, financials.bankBalance]);
  useEffect(() => { setForm(settings); setPinInput(settings.appPin || ''); setStorefrontMsg(settings.storefrontMessage || ''); }, [settings]);
  useEffect(() => { setVisibleBatches(batches.filter(b => b.isVisibleToCustomer).map(b => b.id)); }, [batches]);


  // Init Supabase if not active
  useEffect(() => { initSupabase(); }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput && !/^\d{4}$/.test(pinInput)) {
        addNotification("PIN must be 4 digits", "ERROR");
        return;
    }
    updateSettings({ ...form, appPin: pinInput });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };
  
  const handleUpdateFinancials = () => {
      updateFinancials({ cashOnHand: adjustCash, bankBalance: adjustBank });
      addNotification("Funds Adjust Successfully", 'SUCCESS');
  };

  const generateBackup = (): BackupData => {
      return { version: "3.0.0", timestamp: new Date().toISOString(), batches, customers, sales, operationalExpenses, settings, partners, referrals, financials, missions };
  };

  const handleExportBackup = () => {
      const backup = generateBackup();
      const dataStr = JSON.stringify(backup, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SMP_BACKUP_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addNotification("Backup Exported", "SUCCESS");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const json = JSON.parse(event.target?.result as string);
              if (window.confirm(`Restore data from ${new Date(json.timestamp).toLocaleDateString()}?`)) loadBackup(json);
          } catch (err) { addNotification("Invalid Backup File", "ERROR"); }
      };
      reader.readAsText(file);
      e.target.value = '';
  };

  const handleCloudUpload = async () => {
      setCloudStatus('SYNCING');
      const backup = generateBackup();
      const result = await saveToCloud(backup);
      if (result.success) {
          setCloudStatus('SUCCESS');
          addNotification("Neural Pattern Uploaded", "SUCCESS");
      } else {
          setCloudStatus('ERROR');
          addNotification(result.error || "Upload Failed", "ERROR");
      }
      setTimeout(() => setCloudStatus('IDLE'), 3000);
  };

  const handleCloudDownload = async () => {
      setCloudStatus('SYNCING');
      const data = await loadFromCloud();
      if (data) {
          if (window.confirm(`Overwrite local system with Cloud Data from ${new Date(data.timestamp).toLocaleString()}?`)) {
              loadBackup(data);
              setCloudStatus('SUCCESS');
              addNotification("System Restored from Cloud", "SUCCESS");
          } else {
              setCloudStatus('IDLE');
          }
      } else {
          setCloudStatus('ERROR');
          addNotification("No remote data found", "ERROR");
      }
      setTimeout(() => setCloudStatus('IDLE'), 3000);
  };

  const handleFactoryReset = () => {
    if (window.confirm("Wipe System Cache?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleStorefrontUpdate = () => {
      updateStorefront(storefrontMsg, visibleBatches);
      addNotification("Storefront Published to Ghost Portal", "SUCCESS");
  };

  const toggleBatchVisibility = (batchId: string) => {
      setVisibleBatches(prev => 
          prev.includes(batchId) ? prev.filter(id => id !== batchId) : [...prev, batchId]
      );
  };

  return (
    <div className="max-w-5xl mx-auto mt-6 pb-20 animate-fade-in">
        <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3 tracking-tight uppercase"><SettingsIcon className="text-cyber-gold" /> Kernel Configuration</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-8">
                {/* Storefront Panel */}
                <div className="bg-cyber-panel border border-white/10 rounded-2xl p-6">
                    <h3 className="text-white font-bold uppercase text-sm mb-6 flex items-center gap-2"><Tv2 size={16} className="text-cyber-green"/> Ghost Portal Storefront</h3>
                    <div><label className="text-[10px] text-gray-500 uppercase font-bold">Public Message</label><textarea value={storefrontMsg} onChange={e => setStorefrontMsg(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded p-2 text-white outline-none h-20 resize-none"/></div>
                    <div className="mt-4"><label className="text-[10px] text-gray-500 uppercase font-bold">Visible Inventory</label>
                        <div className="mt-2 space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                            {batches.map(b => (
                                <div key={b.id} onClick={() => toggleBatchVisibility(b.id)} className={`flex justify-between items-center p-3 rounded-lg border cursor-pointer transition-all ${visibleBatches.includes(b.id) ? 'bg-cyber-green/20 border-cyber-green/50' : 'bg-black/40 border-white/10'}`}>
                                    <span className="text-sm font-bold text-white">{b.name}</span>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${visibleBatches.includes(b.id) ? 'bg-cyber-green border-cyber-green' : 'border-gray-500'}`}>
                                        {visibleBatches.includes(b.id) && <CheckCircle size={12} className="text-black"/>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <button onClick={handleStorefrontUpdate} className="w-full mt-4 bg-cyber-green/20 border border-cyber-green/50 text-cyber-green font-bold py-3 rounded-lg text-xs hover:bg-cyber-green hover:text-white transition-all uppercase tracking-widest">Publish to Portal</button>
                </div>
                
                <form onSubmit={handleSave} className="space-y-8">
                    <div className="bg-cyber-panel border border-white/10 rounded-2xl p-6">
                        <h3 className="text-white font-bold uppercase text-sm mb-6 flex items-center gap-2"><Lock size={16} className="text-red-500"/> System Lock</h3>
                        <input type="text" maxLength={4} value={pinInput} onChange={e => setPinInput(e.target.value.replace(/\D/g, ''))} className="w-full bg-black/50 border border-white/10 rounded p-3 text-white font-mono text-2xl tracking-[0.5em] text-center outline-none" placeholder="----"/>
                        <p className="text-[10px] text-gray-600 mt-2 text-center uppercase font-bold tracking-widest">4-Digit Access Key</p>
                    </div>

                    <button type="submit" className="w-full bg-cyber-gold text-black font-bold py-4 rounded-xl uppercase tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-2">
                        {saved ? <CheckCircle size={20}/> : <Save size={20}/>} {saved ? 'SAVED' : 'Apply Kernel Config'}
                    </button>
                </form>
            </div>

            <div className="space-y-8">
                {/* Cloud Sync Panel */}
                <div className="bg-cyber-panel border border-cyber-purple/30 rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none"><Cloud size={100}/></div>
                    <h3 className="text-white font-bold uppercase text-sm mb-6 flex items-center gap-2 relative z-10"><Wifi size={16} className="text-cyber-purple"/> Neural Cloud Uplink</h3>
                    
                    <div className="grid grid-cols-2 gap-4 relative z-10">
                        <button onClick={handleCloudUpload} disabled={cloudStatus === 'SYNCING'} className="bg-black/40 border border-cyber-purple/50 p-4 rounded-xl flex flex-col items-center gap-2 hover:bg-cyber-purple/20 transition-all group">
                            {cloudStatus === 'SYNCING' ? <RefreshCw size={24} className="text-cyber-purple animate-spin"/> : <Upload size={24} className="text-cyber-purple group-hover:scale-110 transition-transform"/>}
                            <span className="text-[10px] font-bold uppercase text-gray-300">Upload Pattern</span>
                        </button>
                        <button onClick={handleCloudDownload} disabled={cloudStatus === 'SYNCING'} className="bg-black/40 border border-cyber-purple/50 p-4 rounded-xl flex flex-col items-center gap-2 hover:bg-cyber-purple/20 transition-all group">
                            {cloudStatus === 'SYNCING' ? <RefreshCw size={24} className="text-cyber-purple animate-spin"/> : <Download size={24} className="text-cyber-purple group-hover:scale-110 transition-transform"/>}
                            <span className="text-[10px] font-bold uppercase text-gray-300">Download Pattern</span>
                        </button>
                    </div>
                    {cloudStatus === 'SUCCESS' && <div className="mt-4 text-center text-xs text-cyber-green font-bold flex items-center justify-center gap-2"><CheckCircle size={12}/> Sync Complete</div>}
                    {cloudStatus === 'ERROR' && <div className="mt-4 text-center text-xs text-red-500 font-bold flex items-center justify-center gap-2"><AlertTriangle size={12}/> Sync Failed</div>}
                </div>

                <div className="bg-cyber-panel border border-white/10 rounded-2xl p-6">
                    <h3 className="text-white font-bold uppercase text-sm mb-6 flex items-center gap-2"><Database size={16}/> Local System</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <button onClick={handleExportBackup} className="bg-white/5 p-4 rounded-xl flex flex-col items-center gap-2 text-gray-300 hover:bg-white/10 transition-all"><Download size={20}/> <span className="text-[10px] font-bold uppercase">Export JSON</span></button>
                        <button onClick={() => fileInputRef.current?.click()} className="bg-white/5 p-4 rounded-xl flex flex-col items-center gap-2 text-gray-300 hover:bg-white/10 transition-all"><Upload size={20}/> <span className="text-[10px] font-bold uppercase">Import JSON</span></button>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json"/>
                    </div>
                    {isInstallable && <button onClick={triggerInstallPrompt} className="w-full bg-cyber-purple/20 border border-cyber-purple/50 text-cyber-purple font-bold py-3 rounded-lg text-xs hover:bg-cyber-purple hover:text-white transition-all flex items-center justify-center gap-2 mb-4 uppercase tracking-widest"><Smartphone size={16}/> Install Terminal</button>}
                    <button onClick={handleFactoryReset} className="w-full bg-red-500/10 border border-red-500/30 text-red-500 font-bold py-3 rounded-lg text-xs hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2 uppercase tracking-widest"><Trash2 size={16}/> Factory Reset</button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default Settings;