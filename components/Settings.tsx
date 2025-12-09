import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../DataContext';
import { Settings as SettingsIcon, Save, Users, Plus, X, Download, Smartphone, Trash2, Monitor, Lock, ShieldCheck, Database, Upload, FileJson } from 'lucide-react';
import { BackupData } from '../types';

const Settings: React.FC = () => {
  const { settings, updateSettings, addNotification, batches, customers, sales, operationalExpenses, loadBackup } = useData();
  const [form, setForm] = useState(settings);
  const [saved, setSaved] = useState(false);
  const [newStaff, setNewStaff] = useState('');
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
    
    // Validate PIN (must be 4 digits or empty)
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
              // Basic validation
              if (!json.version || !json.timestamp) {
                  throw new Error("Invalid backup format");
              }
              
              if (window.confirm(`Restore backup from ${new Date(json.timestamp).toLocaleDateString()}? Current data will be overwritten.`)) {
                   loadBackup(json);
              }
          } catch (err) {
              console.error(err);
              addNotification("Failed to parse backup file.", "ERROR");
          }
      };
      reader.readAsText(file);
      // Reset input
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
                <h3 className="text-white font-bold uppercase text-sm border-b border-white/10 pb-4">Core Economics</h3>
                
                <div className="space-y-2">
                    <label className="text-gray-400 font-bold uppercase text-xs tracking-wider">Default Price Per Gram ($)</label>
                    <input 
                        type="number" step="0.01"
                        value={form.defaultPricePerGram}
                        onChange={e => setForm({...form, defaultPricePerGram: parseFloat(e.target.value) || 0})}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-xl font-mono text-cyber-green focus:border-cyber-green outline-none"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-gray-400 font-bold uppercase text-xs tracking-wider">Currency</label>
                        <input 
                            type="text"
                            value={form.currencySymbol}
                            onChange={e => setForm({...form, currencySymbol: e.target.value})}
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-cyber-gold outline-none"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-gray-400 font-bold uppercase text-xs tracking-wider">Low Stock (g)</label>
                        <input 
                            type="number"
                            value={form.lowStockThreshold}
                            onChange={e => setForm({...form, lowStockThreshold: parseFloat(e.target.value) || 0})}
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-cyber-gold outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* SECURITY PANEL */}
            <div className="bg-cyber-panel border border-white/10 rounded-2xl p-8 space-y-6">
                 <h3 className="text-white font-bold uppercase text-sm border-b border-white/10 pb-4 flex items-center gap-2">
                    <ShieldCheck size={16} className="text-cyber-gold"/> Security Protocols
                 </h3>
                 
                 <div className="space-y-2">
                     <label className="text-gray-400 font-bold uppercase text-xs tracking-wider">App Access PIN (4 Digits)</label>
                     <div className="relative">
                        <Lock size={16} className="absolute left-4 top-4 text-gray-500"/>
                        <input 
                            type="text" 
                            maxLength={4}
                            placeholder="Set PIN (Leave empty to disable)"
                            value={pinInput}
                            onChange={e => {
                                const val = e.target.value.replace(/[^0-9]/g, '');
                                setPinInput(val);
                            }}
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-4 pl-12 text-xl font-mono text-white tracking-[0.5em] focus:border-cyber-gold outline-none"
                        />
                     </div>
                     <p className="text-[10px] text-gray-500">Leaving this field empty will disable the lock screen.</p>
                 </div>
            </div>

            <button 
                type="submit"
                className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest transition-all shadow-lg ${saved ? 'bg-cyber-green text-black' : 'bg-white text-black hover:bg-gray-200'}`}
            >
                {saved ? 'Configuration Saved' : 'Save Changes'}
            </button>
          </form>

          {/* RIGHT COLUMN: APP & STAFF */}
          <div className="space-y-8">
              
              {/* DATA MANAGEMENT */}
              <div className="bg-cyber-panel border border-white/10 rounded-2xl p-8 space-y-6">
                  <h3 className="text-white font-bold uppercase text-sm border-b border-white/10 pb-4 flex items-center gap-2">
                      <Database size={16}/> Data Persistence
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={handleExportBackup}
                        className="bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cyber-gold p-4 rounded-xl flex flex-col items-center gap-2 transition-all group"
                      >
                          <Download size={24} className="text-cyber-gold group-hover:scale-110 transition-transform" />
                          <span className="text-xs font-bold uppercase text-white">Backup Data</span>
                          <span className="text-[9px] text-gray-500 text-center">Save .json to device</span>
                      </button>

                      <button 
                        onClick={handleImportClick}
                        className="bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cyber-purple p-4 rounded-xl flex flex-col items-center gap-2 transition-all group"
                      >
                          <Upload size={24} className="text-cyber-purple group-hover:scale-110 transition-transform" />
                          <span className="text-xs font-bold uppercase text-white">Restore Data</span>
                          <span className="text-[9px] text-gray-500 text-center">Load .json from device</span>
                      </button>
                      <input 
                        type="file" 
                        accept=".json" 
                        ref={fileInputRef} 
                        onChange={handleFileChange}
                        className="hidden" 
                      />
                  </div>
                  <p className="text-[10px] text-gray-600 bg-black/20 p-2 rounded border border-white/5 flex gap-2">
                      <FileJson size={14} />
                      Warning: Clearing browser history may delete local data. Use "Backup Data" regularly to prevent loss.
                  </p>
              </div>

              {/* STAFF MANAGEMENT */}
              <div className="bg-cyber-panel border border-white/10 rounded-2xl p-8 space-y-6">
                   <h3 className="text-white font-bold uppercase text-sm border-b border-white/10 pb-4 flex items-center gap-2"><Users size={16}/> Staff & Commissions</h3>
                   
                   <div className="space-y-2">
                       <label className="text-gray-400 font-bold uppercase text-xs tracking-wider">Commission Rate (%)</label>
                       <input 
                           type="number" step="0.1"
                           value={form.commissionRate}
                           onChange={e => setForm({...form, commissionRate: parseFloat(e.target.value) || 0})}
                           className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-xl font-mono text-cyber-purple focus:border-cyber-purple outline-none"
                       />
                   </div>

                   <div>
                       <label className="text-gray-400 font-bold uppercase text-xs tracking-wider mb-2 block">Active Agents</label>
                       <div className="space-y-2 mb-4">
                           {form.staffMembers.map(staff => (
                               <div key={staff} className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/5">
                                   <span className="text-white font-bold">{staff}</span>
                                   {form.staffMembers.length > 1 && (
                                       <button onClick={() => removeStaff(staff)} className="text-gray-500 hover:text-red-500">
                                           <Trash2 size={16} />
                                       </button>
                                   )}
                               </div>
                           ))}
                       </div>
                       
                       <div className="flex gap-2">
                           <input 
                               value={newStaff}
                               onChange={e => setNewStaff(e.target.value)}
                               placeholder="New Agent Name"
                               className="flex-1 bg-black/40 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-cyber-purple"
                           />
                           <button onClick={addStaff} className="bg-cyber-purple/20 text-cyber-purple border border-cyber-purple/50 px-4 rounded-lg hover:bg-cyber-purple hover:text-white transition-all">
                               <Plus size={20} />
                           </button>
                       </div>
                   </div>
              </div>

              {/* SYSTEM INFO & PWA INSTALL */}
              <div className="bg-cyber-panel border border-white/10 rounded-2xl p-8">
                  <h3 className="text-white font-bold uppercase text-sm border-b border-white/10 pb-4 mb-6 flex items-center gap-2">
                      <Monitor size={16}/> System Status
                  </h3>
                  
                  <div className="flex flex-col gap-4">
                      {isInstallable ? (
                          <button 
                            onClick={handleInstallClick}
                            className="w-full bg-gradient-to-r from-cyber-gold to-yellow-600 text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] transition-transform"
                          >
                              <Download size={20} /> Install Application
                          </button>
                      ) : (
                          <div className="w-full bg-white/5 text-gray-500 font-bold py-4 rounded-xl flex items-center justify-center gap-2 border border-white/5">
                              <Smartphone size={20} /> App Installed / Browser Mode
                          </div>
                      )}
                      
                      <div className="text-center">
                          <p className="text-[10px] text-gray-600 uppercase font-bold tracking-widest">Version 2.5.0 (Stable)</p>
                          <p className="text-[10px] text-gray-700 mt-1">Local Storage Persistence Active</p>
                      </div>
                  </div>
              </div>

          </div>
      </div>
    </div>
  );
};

export default Settings;