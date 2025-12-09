import React, { useState, useEffect } from 'react';
import { useData } from '../DataContext';
import { Settings as SettingsIcon, Save, Users, Plus, X, Download, Smartphone, Trash2, Monitor } from 'lucide-react';

const Settings: React.FC = () => {
  const { settings, updateSettings, addNotification } = useData();
  const [form, setForm] = useState(settings);
  const [saved, setSaved] = useState(false);
  const [newStaff, setNewStaff] = useState('');
  
  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
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
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
        addNotification("Installing Application...", 'SUCCESS');
        setDeferredPrompt(null);
        setIsInstallable(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(form);
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

  return (
    <div className="max-w-4xl mx-auto mt-10 pb-20 animate-fade-in">
      <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3 tracking-tight uppercase">
        <SettingsIcon className="text-cyber-gold" /> System Configuration
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* GENERAL SETTINGS */}
          <form onSubmit={handleSave} className="bg-cyber-panel border border-white/10 rounded-2xl p-8 space-y-6 h-fit">
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

            <div className="pt-4">
                <button 
                    type="submit"
                    className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest transition-all shadow-lg ${saved ? 'bg-cyber-green text-black' : 'bg-white text-black hover:bg-gray-200'}`}
                >
                    {saved ? 'Configuration Saved' : 'Save Changes'}
                </button>
            </div>
          </form>

          {/* RIGHT COLUMN: APP & STAFF */}
          <div className="space-y-8">
              
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