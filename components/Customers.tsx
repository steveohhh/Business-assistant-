import React, { useState, useEffect, useMemo } from 'react';
import { Customer, SituationalEncounter, MicroSignal } from '../types';
import { analyzeCustomerProfile, generateAvatar } from '../services/geminiService';
import { useAppStore } from '../stores/useAppStore';
// FIX: Added 'Users' to lucide-react imports to resolve missing component error.
import { 
    User, Users, Sparkles, X, Activity, Shield, DollarSign, 
    Save, Brain, FileText, Zap, Target, Eye, Clock, Camera, RefreshCw, Hexagon,
    AlertTriangle, MessageCircle, Gavel, Award, Trophy, Image as ImageIcon, Medal, Skull, Crown, Ghost, Star, Link as LinkIcon, BarChart2, TrendingUp, TrendingDown,
    PanelLeftClose, PanelLeftOpen, CheckCircle2, XCircle, Calendar, Repeat, Search
} from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip, Cell, PieChart, Pie } from 'recharts';

const ARCHETYPES = {
    'A': { label: 'The Analyst', color: 'text-blue-400', bg: 'bg-blue-500' },
    'I': { label: 'The Maverick', color: 'text-cyber-gold', bg: 'bg-cyber-gold' },
    'S': { label: 'The Connector', color: 'text-cyber-purple', bg: 'bg-cyber-purple' },
    'C': { label: 'The Sentinel', color: 'text-cyber-green', bg: 'bg-cyber-green' }
};

const PSYCH_QUESTIONS = [
    { id: 'd1', category: 'Decision Style', text: "When deciding to buy, what is their first instinct?", options: [{ text: "Research/Compare", value: 'A' }, { text: "Gut Feeling", value: 'I' }, { text: "Ask Peers", value: 'S' }, { text: "Wait for Guarantee", value: 'C' }] },
    { id: 'd2', category: 'Price Sensitivity', text: "How do they react to a high price?", options: [{ text: "Calculates Value", value: 'A' }, { text: "Pays for Status", value: 'I' }, { text: "Negotiates/Social", value: 'S' }, { text: "Seeks Safety/Deal", value: 'C' }] },
    { id: 'd3', category: 'Interaction Pace', text: "How fast do they want to move?", options: [{ text: "Methodical", value: 'A' }, { text: "Fast/Impatient", value: 'I' }, { text: "Chatty/Relaxed", value: 'S' }, { text: "Slow/Cautious", value: 'C' }] },
    { id: 'd4', category: 'Risk Tolerance', text: "How do they handle a new/unknown product?", options: [{ text: "Analyzes Data", value: 'A' }, { text: "Tries Immediately", value: 'I' }, { text: "Asks 'Who else uses it?'", value: 'S' }, { text: "Avoids/Waits", value: 'C' }] },
    { id: 'd5', category: 'Conflict Style', text: "If something goes wrong, what do they do?", options: [{ text: "States Facts", value: 'A' }, { text: "Gets Loud/Angry", value: 'I' }, { text: "Appeals to Relationship", value: 'S' }, { text: "Withdraws/Silent", value: 'C' }] }
];

const EXPERIMENTS = [
    { id: 'exp_upsell', name: 'The "Scarcity" Upsell', desc: "Tell them only 1 unit is left.", type: 'Active' },
    { id: 'exp_silence', name: 'The Silence Test', desc: "Stay silent after quoting price.", type: 'Passive' },
    { id: 'exp_bonus', name: 'The Surprise Bonus', desc: "Gift small item after deal closes.", type: 'Positive' },
    { id: 'exp_pressure', name: 'Time Pressure', desc: "Check watch visibly during chat.", type: 'Active' }
];

const SIGNAL_PRESETS = {
    VERBAL: ["Asked Price", "Asked Quality", "Mentioned Rival", "Joked", "Silent", "Complained", "Tech Lingo", "Swore"],
    NON_VERBAL: ["Check Phone", "Eye Contact", "Pacing", "Relaxed", "Rushed", "Fidgeting", "Nodding", "Arms Crossed"],
    TRANSACTIONAL: ["Exact Cash", "Haggled", "Bought Upsell", "No Upsell", "Big Bills", "Asked Credit", "Small Bills", "Tipped"]
};

const StatHex = ({ label, value, color }: { label: string, value: number, color: string }) => (
    <div className="flex flex-col items-center">
        <div className="relative w-14 h-14 flex items-center justify-center mb-1">
            <Hexagon className={`text-gray-800 absolute inset-0 w-full h-full fill-black/60`} strokeWidth={1} />
            <Hexagon className={`${color} absolute inset-0 w-full h-full opacity-20`} strokeWidth={2} />
            <span className={`relative z-10 font-black text-sm ${color}`}>{value}</span>
        </div>
        <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">{label}</span>
    </div>
);

export const PrestigeBadge = ({ prestige, size = 32 }: { prestige: number, size?: number }) => {
    if (prestige === 0) return null;
    const scale = size / 32;
    let icon = <Skull size={20 * scale} className="text-orange-700 drop-shadow-[0_0_5px_rgba(194,65,12,0.8)]" />;
    let ringColor = "border-orange-900 bg-orange-900/20";
    if (prestige === 2) { icon = <Award size={20 * scale} className="text-gray-300 shadow-gray-400"; ringColor = "border-gray-400 bg-gray-400/20"; }
    else if (prestige === 3) { icon = <Crown size={20 * scale} className="text-yellow-400"; ringColor = "border-yellow-500 bg-yellow-500/20"; }
    else if (prestige >= 4) { icon = <Ghost size={20 * scale} className="text-cyan-400 animate-pulse"; ringColor = "border-cyan-500 bg-cyan-500/20"; }
    return (
        <div className={`rounded-full border-2 ${ringColor} flex items-center justify-center relative`} style={{ width: size, height: size }}>
            {icon}
            <div className="absolute -bottom-1 -right-1 bg-black text-[10px] font-black text-white px-1 rounded border border-white/20 leading-none">{prestige}</div>
        </div>
    );
};

const HeroCustomerCard: React.FC<{ customer: Customer, onClick: () => void }> = ({ customer, onClick }) => {
    const stats = { negotiation: 50, intellect: 50, patience: 50, volatility: 50, loyalty: 50, riskPerception: 50, ...(customer.psychProfile?.rpgStats || {}) };
    const level = customer.level || 1;
    const xp = customer.xp || 0;
    const currentLevelBaseXP = Math.pow(level - 1, 2) * 100;
    const nextLevelXP = Math.pow(level, 2) * 100;
    const progressPercent = ((xp - currentLevelBaseXP) / (Math.max(1, nextLevelXP - currentLevelBaseXP))) * 100;
    const lifetimeProfit = customer.transactionHistory.reduce((acc, s) => acc + s.profit, 0);

    const radarData = [
        { subject: 'INT', value: stats.intellect },
        { subject: 'NEG', value: stats.negotiation },
        { subject: 'PAT', value: stats.patience },
        { subject: 'VOL', value: stats.volatility },
        { subject: 'RSK', value: stats.riskPerception },
        { subject: 'LOY', value: stats.loyalty },
    ];

    return (
        <div onClick={onClick} className="bg-cyber-panel border border-white/10 rounded-3xl overflow-hidden cursor-pointer group hover:border-cyber-gold transition-all relative shadow-2xl h-full flex flex-col transform hover:-translate-y-1">
            <div className="h-80 w-full relative shrink-0">
                {customer.avatarImage ? <img src={customer.avatarImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" /> : <div className="w-full h-full bg-gradient-to-b from-gray-800 to-black flex items-center justify-center"><User size={96} className="text-gray-600 opacity-20"/></div>}
                <div className="absolute top-4 left-4 z-10">
                    <div className="bg-black/80 backdrop-blur-md border border-cyber-gold/50 px-4 py-2 rounded-full flex items-center gap-3 shadow-lg">
                        {customer.prestige ? <div className="flex items-center gap-2"><PrestigeBadge prestige={customer.prestige} size={24} /><span className="text-sm text-cyber-red font-black">P{customer.prestige}</span></div> : <span className="text-sm text-cyber-gold font-black">Lvl {level}</span>}
                        <div className="w-20 h-1.5 bg-gray-700 rounded-full overflow-hidden"><div className={`h-full transition-all ${customer.prestige ? 'bg-cyber-red' : 'bg-cyber-gold'}`} style={{ width: `${progressPercent}%` }}></div></div>
                    </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/80 to-transparent">
                    <h3 className="text-3xl font-black text-white uppercase tracking-tighter leading-none mb-1">{customer.name}</h3>
                    <span className="text-gray-400 font-bold text-xs uppercase tracking-widest bg-white/10 px-2 py-0.5 rounded">{customer.psychProfile?.primary || 'Unprofiled'}</span>
                </div>
            </div>
            <div className="p-4 bg-black/90 flex-1 flex flex-col justify-between">
                <div className="w-full h-40 relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                            <PolarGrid stroke="#333" strokeDasharray="3 3"/><PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 10, fontWeight: 'bold' }} />
                            <Radar name="Stats" dataKey="value" stroke="#D4AF37" strokeWidth={2} fill="#D4AF37" fillOpacity={0.4} />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-3 gap-2 border-t border-white/5 pt-3 mt-auto">
                    <div className="text-center"><div className="text-[9px] text-gray-500 uppercase font-bold">Loyalty</div><div className="text-white font-mono text-xs">{stats.loyalty}</div></div>
                    <div className="text-center border-l border-white/5 border-r"><div className="text-[9px] text-gray-500 uppercase font-bold">Risk Tol</div><div className="text-white font-mono text-xs">{stats.riskPerception}</div></div>
                    <div className="text-center"><div className="text-[9px] text-gray-500 uppercase font-bold">Profit</div><div className={`font-mono text-xs flex justify-center items-center gap-1 font-bold ${lifetimeProfit >= 0 ? 'text-cyber-green' : 'text-red-500'}`}>{lifetimeProfit >= 0 ? <TrendingUp size={10}/> : <TrendingDown size={10}/>}${lifetimeProfit.toFixed(0)}</div></div>
                </div>
            </div>
        </div>
    );
};

const EmptyState: React.FC<{ title: string, message: string }> = ({ title, message }) => (
    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
        <Users size={64} className="text-gray-700 mb-4"/>
        <h3 className="text-xl font-bold text-white">{title}</h3>
        <p className="text-gray-500 max-w-xs">{message}</p>
    </div>
);


const Customers: React.FC = () => {
  const customers = useAppStore(s => s.customers);
  const addCustomer = useAppStore(s => s.addCustomer);
  const updateCustomer = useAppStore(s => s.updateCustomer);
  const addNotification = useAppStore(s => s.addNotification);
  const triggerPrestige = useAppStore(s => s.triggerPrestige);

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'SHEET' | 'MATRIX' | 'PSYCHOLOGY' | 'RHYTHM' | 'GALLERY'>('OVERVIEW');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [newName, setNewName] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [editNotes, setEditNotes] = useState('');
  const [visualDesc, setVisualDesc] = useState('');
  const [ghostIdInput, setGhostIdInput] = useState('');
  const [matrixAnswers, setMatrixAnswers] = useState<Record<string, string>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);

  useEffect(() => {
      if (selectedCustomer) {
          setEditNotes(selectedCustomer.notes || '');
          setVisualDesc(selectedCustomer.visualDescription || '');
          setMatrixAnswers(selectedCustomer.behavioralMatrix || {});
          setGhostIdInput(selectedCustomer.ghostId || '');
      }
  }, [selectedCustomer]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    addCustomer({ id: Date.now().toString(), name: newName, notes: '', tags: [], microSignals: [], encounters: [], totalSpent: 0, lastPurchase: new Date().toISOString(), transactionHistory: [], xp: 0, level: 1, achievements: [], gallery: [] });
    setNewName(''); setShowAdd(false);
  };

  const handleAnalyze = async () => {
    if (!selectedCustomer) return;
    setIsAnalyzing(true);
    const updated = await analyzeCustomerProfile({ ...selectedCustomer, notes: editNotes, behavioralMatrix: matrixAnswers }, selectedCustomer.transactionHistory);
    setIsAnalyzing(false);
    if (updated) { updateCustomer(updated); setSelectedCustomer(updated); addNotification("Psych profile updated.", 'SUCCESS'); }
  };

  const handleGenerateAvatar = async () => {
    if (!selectedCustomer || !visualDesc) return;
    setIsGeneratingAvatar(true);
    const base64Image = await generateAvatar(visualDesc, selectedCustomer.achievements || []);
    setIsGeneratingAvatar(false);
    if (base64Image) {
        const updated = { ...selectedCustomer, avatarImage: base64Image, visualDescription: visualDesc, gallery: [...(selectedCustomer.gallery || []), base64Image].slice(-20), lastAvatarGenerationDate: new Date().toISOString() };
        updateCustomer(updated); setSelectedCustomer(updated); addNotification("Identity rendered.", 'SUCCESS');
    }
  };

  const filteredCustomers = useMemo(() => {
    const activeCustomers = customers.filter(c => c.id !== 'WALK_IN');
    if (!searchTerm) return activeCustomers;
    return activeCustomers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [customers, searchTerm]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-white uppercase tracking-tight">Client Database</h2>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <div className="flex-1 md:w-48 bg-black/50 border border-white/10 rounded-lg flex items-center px-3 py-2">
                <Search size={14} className="text-gray-500 mr-2"/>
                <input className="bg-transparent text-sm text-white outline-none w-full placeholder-gray-600" placeholder="Search clients..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <button onClick={() => setShowAdd(true)} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg border border-white/10">Add Client</button>
        </div>
      </div>

      {showAdd && (
        <form onSubmit={handleCreate} className="bg-cyber-panel p-4 rounded-xl border border-white/10 mb-6 flex gap-4 animate-fade-in">
          <input className="flex-1 bg-black/50 border border-white/10 rounded p-2 text-white" placeholder="Client Name" value={newName} onChange={e => setNewName(e.target.value)} required />
          <button type="submit" className="bg-cyber-green text-black font-bold px-4 rounded">SAVE</button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pb-20">
        {filteredCustomers.length > 0 ? (
            filteredCustomers.map(c => <HeroCustomerCard key={c.id} customer={c} onClick={() => { setSelectedCustomer(c); setActiveTab('OVERVIEW'); }} />)
        ) : (
            <EmptyState title="No Clients Found" message="Try adjusting your search or add a new client to the database."/>
        )}
      </div>

      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#0a0a0a] w-full max-w-7xl h-[95vh] rounded-3xl border border-white/10 flex overflow-hidden">
            <div className={`bg-white/5 border-r border-white/5 flex flex-col transition-all duration-300 shrink-0 ${isSidebarCollapsed ? 'w-20 p-4' : 'w-80 p-6'} overflow-y-auto`}>
                <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="mb-6 self-end text-gray-400 hover:text-white"><PanelLeftOpen size={20} /></button>
                <nav className="space-y-2 flex-1">
                    {[
                        { id: 'OVERVIEW', icon: FileText, label: 'Live Session' },
                        { id: 'SHEET', icon: User, label: 'Character Sheet' },
                        { id: 'MATRIX', icon: Activity, label: 'Behavior Matrix' },
                        { id: 'PSYCHOLOGY', icon: Brain, label: 'Archetype' },
                        { id: 'GALLERY', icon: ImageIcon, label: 'Neural Gallery' }
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`w-full text-left p-3 rounded-lg text-xs font-bold uppercase flex items-center gap-2 transition-all ${activeTab === tab.id ? 'bg-cyber-gold text-black shadow-lg shadow-cyber-gold/20' : 'text-gray-400 hover:bg-white/5'} ${isSidebarCollapsed ? 'justify-center' : ''}`}>
                            <tab.icon size={16} />{!isSidebarCollapsed && <span>{tab.label}</span>}
                        </button>
                    ))}
                </nav>
                <button onClick={() => setSelectedCustomer(null)} className={`mt-auto flex items-center gap-2 text-gray-500 hover:text-white p-2 ${isSidebarCollapsed ? 'justify-center' : ''}`}><X size={16} />{!isSidebarCollapsed && <span>Close</span>}</button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 bg-black/20">
                {activeTab === 'OVERVIEW' && (
                    <div className="space-y-6 max-w-4xl animate-fade-in">
                        <h3 className="text-2xl font-bold text-white uppercase">Active Session: {selectedCustomer.name}</h3>
                        <div className="bg-cyber-panel border border-white/10 rounded-xl p-4">
                            <label className="text-xs text-cyber-gold font-bold uppercase mb-2 block">Ghost Portal Uplink</label>
                            <input className="w-full bg-black/50 border border-white/10 rounded p-2 text-xs text-white" value={ghostIdInput} onChange={e => setGhostIdInput(e.target.value)} placeholder="Enter GHOST-ID"/>
                        </div>
                        <textarea className="w-full bg-black/40 border border-white/10 rounded-lg p-4 text-sm text-white h-64 resize-none" value={editNotes} onChange={e => setEditNotes(e.target.value)} placeholder="Enter raw observations..."/>
                        <div className="flex justify-end gap-3"><button onClick={handleAnalyze} disabled={isAnalyzing} className="bg-cyber-purple text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-all">{isAnalyzing ? <RefreshCw className="animate-spin" size={16}/> : <Brain size={16}/>} Run Deep Profile</button></div>
                    </div>
                )}
                {activeTab === 'SHEET' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl animate-fade-in">
                        <div className="bg-cyber-panel border border-white/10 rounded-2xl p-6 flex flex-col items-center">
                            <div className="w-full aspect-square rounded-xl overflow-hidden mb-4 border-2 border-cyber-gold relative group">
                                {selectedCustomer.avatarImage ? <img src={selectedCustomer.avatarImage} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-black flex items-center justify-center"><User size={64} className="text-gray-700"/></div>}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center p-4 transition-all">
                                    <textarea className="w-full bg-black/50 border border-white/20 rounded p-2 text-xs text-white mb-2" value={visualDesc} onChange={e => setVisualDesc(e.target.value)} placeholder="Identity prompt..."/>
                                    <button onClick={handleGenerateAvatar} disabled={isGeneratingAvatar} className="bg-cyber-gold text-black text-xs font-bold px-4 py-2 rounded uppercase flex items-center gap-2">{isGeneratingAvatar ? <RefreshCw className="animate-spin" size={14}/> : <Camera size={14}/>} Render</button>
                                </div>
                            </div>
                            <h2 className="text-2xl font-black text-white uppercase">{selectedCustomer.name}</h2>
                        </div>
                        <div className="bg-cyber-panel border border-white/10 rounded-2xl p-6"><h3 className="text-white font-bold uppercase text-sm mb-6 flex items-center gap-2"><Activity size={16} className="text-cyber-gold"/> Core Attributes</h3><div className="space-y-4"><div><div className="flex justify-between text-xs text-gray-500 font-bold uppercase mb-1"><span>Loyalty</span><span>{selectedCustomer.psychProfile?.rpgStats?.loyalty || 50}%</span></div><div className="w-full h-2 bg-gray-800 rounded-full"><div className="h-full bg-cyber-purple" style={{width: `${selectedCustomer.psychProfile?.rpgStats?.loyalty || 50}%`}}></div></div></div></div></div>
                    </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;