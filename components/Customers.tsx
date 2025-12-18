import React, { useState, useEffect, useMemo } from 'react';
import { Customer, AssessmentData, SituationalEncounter, MicroSignal } from '../types';
import { analyzeCustomerProfile, generateAvatar } from '../services/geminiService';
import { useAppStore } from '../stores/useAppStore';
import { 
    User, Sparkles, X, Activity, Shield, DollarSign, 
    Save, Brain, FileText, Zap, Target, Eye, Clock, Camera, RefreshCw, BookOpen, Layers, Hexagon,
    AlertTriangle, MessageCircle, Gavel, Flame, Anchor, Lock, ChevronRight, ChevronLeft, HelpCircle, Radio, Mic, CreditCard, Smile, Beaker, Play, CheckCircle2, XCircle, Calendar, Repeat, Hourglass, PanelLeftClose, PanelLeftOpen, Check, Award, Trophy, Image as ImageIcon, Medal, Skull, Crown, Ghost, Star, Diamond, Link as LinkIcon, BarChart2, TrendingUp, TrendingDown
} from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

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

const ARCHETYPES = {
    'A': { label: 'The Analyst', color: 'text-blue-400', bg: 'bg-blue-500', desc: "Logic-driven. Values data, ROI, and precision.", statBonus: { intellect: 90, risk: 20 } },
    'I': { label: 'The Maverick', color: 'text-cyber-gold', bg: 'bg-cyber-gold', desc: "Impulse-driven. Values novelty, speed, and status.", statBonus: { volatility: 90, patience: 10 } },
    'S': { label: 'The Connector', color: 'text-cyber-purple', bg: 'bg-cyber-purple', desc: "Social-driven. Values consensus, reviews, and rapport.", statBonus: { negotiation: 80, loyalty: 70 } },
    'C': { label: 'The Sentinel', color: 'text-cyber-green', bg: 'bg-cyber-green', desc: "Security-driven. Values guarantees, safety, and routine.", statBonus: { patience: 90, risk: 10 } }
};

const SIGNAL_PRESETS = {
    VERBAL: ["Asked Price", "Asked Quality", "Mentioned Rival", "Joked", "Silent", "Complained", "Tech Lingo", "Swore"],
    NON_VERBAL: ["Check Phone", "Eye Contact", "Pacing", "Relaxed", "Rushed", "Fidgeting", "Nodding", "Arms Crossed"],
    TRANSACTIONAL: ["Exact Cash", "Haggled", "Bought Upsell", "No Upsell", "Big Bills", "Asked Credit", "Small Bills", "Tipped"]
};

// ... (Helper components StatHex, RhythmBadge, etc. omitted for brevity if unchanged, but included in full file) ...
// RE-INCLUDING HELPERS TO ENSURE FILE INTEGRITY
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

const RhythmBadge = ({ cycle }: { cycle: string }) => {
    let color = 'bg-gray-600';
    if (cycle === 'WEEKLY') color = 'bg-cyber-green';
    if (cycle === 'FORTNIGHTLY') color = 'bg-cyber-gold';
    if (cycle === 'MONTHLY') color = 'bg-blue-500';
    return <div className={`px-4 py-2 rounded-full font-bold text-xs uppercase flex items-center gap-2 text-black ${color}`}><Repeat size={14}/> {cycle} Payer</div>;
};

const NextVisitCountdown = ({ date, confidence }: { date: string, confidence: number }) => {
    const today = new Date();
    const target = new Date(date);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    let message = ""; let color = "text-white";
    if (diffDays < 0) { message = `${Math.abs(diffDays)} Days Overdue`; color = "text-red-500"; } 
    else if (diffDays === 0) { message = "Expected Today"; color = "text-cyber-green animate-pulse"; } 
    else { message = `In ${diffDays} Days`; color = "text-cyber-gold"; }
    return (
        <div className="bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center">
            <span className="text-[10px] uppercase text-gray-500 font-bold mb-1">Predicted Visit</span>
            <span className={`text-2xl font-black font-mono ${color}`}>{message}</span>
            <div className="w-full h-1 bg-gray-800 rounded-full mt-2 overflow-hidden"><div className="h-full bg-white transition-all" style={{ width: `${confidence}%` }}></div></div>
            <span className="text-[9px] text-gray-600 mt-1">{confidence}% Confidence</span>
        </div>
    );
};

const LiveExperiments = ({ onLogExperiment }: { onLogExperiment: (name: string, result: string, outcome: string) => void }) => {
    return (
        <div className="bg-cyber-panel border border-white/10 rounded-2xl p-6 mb-6">
            <h3 className="text-white font-bold uppercase text-sm mb-4 flex items-center gap-2"><Beaker size={16} className="text-cyber-purple"/> Live Behavioral Experiments</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {EXPERIMENTS.map(exp => (
                    <div key={exp.id} className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl p-4 transition-all group">
                        <div className="flex justify-between items-start mb-2">
                            <span className="font-bold text-white text-xs">{exp.name}</span>
                            <span className="text-[9px] uppercase border border-gray-600 px-1 rounded text-gray-400">{exp.type}</span>
                        </div>
                        <p className="text-[10px] text-gray-500 mb-3 h-8">{exp.desc}</p>
                        <div className="flex gap-2">
                            <button onClick={() => onLogExperiment(exp.name, 'Positive', 'POSITIVE')} className="flex-1 bg-cyber-green/20 hover:bg-cyber-green/40 text-cyber-green py-1 rounded text-[10px] font-bold"><CheckCircle2 size={12} className="mx-auto"/></button>
                            <button onClick={() => onLogExperiment(exp.name, 'Negative', 'NEGATIVE')} className="flex-1 bg-red-500/20 hover:bg-red-500/40 text-red-500 py-1 rounded text-[10px] font-bold"><XCircle size={12} className="mx-auto"/></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const MicroSignalInput = ({ customer, onAddSignal }: { customer: Customer, onAddSignal: (s: MicroSignal) => void }) => {
    return (
        <div className="bg-cyber-panel border border-white/10 rounded-2xl p-6 mb-6">
            <h3 className="text-white font-bold uppercase text-sm mb-4 flex items-center gap-2"><Eye size={16} className="text-blue-400"/> Micro-Signal Observation</h3>
            <div className="space-y-4">
                {Object.entries(SIGNAL_PRESETS).map(([category, signals]) => (
                    <div key={category}>
                        <h4 className="text-[10px] text-gray-500 uppercase font-bold mb-2">{category}</h4>
                        <div className="flex flex-wrap gap-2">
                            {signals.map(sig => (
                                <button 
                                    key={sig} 
                                    onClick={() => onAddSignal({ id: Date.now().toString(), timestamp: new Date().toISOString(), category: category as any, event: sig, intensity: 5 })}
                                    className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-cyber-gold rounded-full text-xs text-gray-300 transition-all active:scale-95"
                                >
                                    {sig}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const EncounterLogger = ({ customer, onAddEncounter }: { customer: Customer, onAddEncounter: (e: SituationalEncounter) => void }) => {
    const [situation, setSituation] = useState('');
    const [reaction, setReaction] = useState('');
    const [outcome, setOutcome] = useState<'POSITIVE'|'NEGATIVE'|'NEUTRAL'>('NEUTRAL');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!situation) return;
        onAddEncounter({
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            situation,
            reaction,
            outcome
        });
        setSituation('');
        setReaction('');
    };

    return (
        <form onSubmit={handleSubmit} className="bg-cyber-panel border border-white/10 rounded-2xl p-6">
            <h3 className="text-white font-bold uppercase text-sm mb-4 flex items-center gap-2"><MessageCircle size={16} className="text-cyber-gold"/> Encounter Log</h3>
            <div className="space-y-3">
                <input className="w-full bg-black/40 border border-white/10 rounded p-2 text-xs text-white outline-none focus:border-cyber-gold" placeholder="Situation / Context..." value={situation} onChange={e => setSituation(e.target.value)} />
                <input className="w-full bg-black/40 border border-white/10 rounded p-2 text-xs text-white outline-none focus:border-cyber-gold" placeholder="Customer Reaction..." value={reaction} onChange={e => setReaction(e.target.value)} />
                <div className="flex gap-2">
                    {['POSITIVE', 'NEUTRAL', 'NEGATIVE'].map(o => (
                        <button 
                            key={o} type="button" 
                            onClick={() => setOutcome(o as any)}
                            className={`flex-1 py-1 rounded text-[10px] font-bold border ${outcome === o ? (o === 'POSITIVE' ? 'bg-cyber-green text-black border-cyber-green' : o === 'NEGATIVE' ? 'bg-red-500 text-white border-red-500' : 'bg-gray-500 text-white border-gray-500') : 'bg-transparent border-gray-700 text-gray-500'}`}
                        >
                            {o}
                        </button>
                    ))}
                </div>
                <button type="submit" className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-2 rounded text-xs">LOG ENTRY</button>
            </div>
        </form>
    );
};

const BehavioralMatrix = ({ scores, onAnswer }: { scores: Record<string, string>, onAnswer: (id: string, val: string) => void }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
            {PSYCH_QUESTIONS.map(q => (
                <div key={q.id} className="bg-cyber-panel border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all">
                    <div className="text-[10px] text-cyber-gold uppercase font-bold mb-1">{q.category}</div>
                    <div className="text-sm font-bold text-white mb-3">{q.text}</div>
                    <div className="grid grid-cols-2 gap-2">
                        {q.options.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => onAnswer(q.id, opt.value)}
                                className={`text-left p-2 rounded border text-xs transition-all ${scores[q.id] === opt.value ? 'bg-cyber-purple/20 border-cyber-purple text-white' : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'}`}
                            >
                                {opt.text}
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

// --- PRESTIGE EMBLEM COMPONENT ---
export const PrestigeBadge = ({ prestige, size = 32 }: { prestige: number, size?: number }) => {
    const scale = size / 32;
    // P1: Skull, P2: Wings, P3: Crown, P4: Star, P5+: Dark Matter
    if (prestige === 0) return null;

    let icon = <Skull size={20 * scale} className="text-orange-700 drop-shadow-[0_0_5px_rgba(194,65,12,0.8)]" />;
    let ringColor = "border-orange-900 bg-orange-900/20";
    
    if (prestige === 2) {
        icon = <Award size={20 * scale} className="text-gray-300 drop-shadow-[0_0_5px_rgba(209,213,219,0.8)]" />;
        ringColor = "border-gray-400 bg-gray-400/20";
    } else if (prestige === 3) {
        icon = <Crown size={20 * scale} className="text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]" />;
        ringColor = "border-yellow-500 bg-yellow-500/20";
    } else if (prestige === 4) {
        icon = <Star size={20 * scale} className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-pulse" />;
        ringColor = "border-cyan-500 bg-cyan-500/20";
    } else if (prestige >= 5) {
        icon = <Ghost size={20 * scale} className="text-purple-500 drop-shadow-[0_0_10px_rgba(168,85,247,1)] animate-pulse" />;
        ringColor = "border-purple-600 bg-purple-600/30 shadow-[0_0_15px_rgba(147,51,234,0.5)]";
    }

    return (
        <div className={`rounded-full border-2 ${ringColor} flex items-center justify-center relative`} style={{ width: size, height: size }}>
            {icon}
            <div className="absolute -bottom-1 -right-1 bg-black text-[10px] font-black text-white px-1 rounded border border-white/20 leading-none">
                {prestige}
            </div>
        </div>
    );
};

// --- PRESTIGE MODAL ---
const PrestigeModal = ({ customer, onClose, onConfirm }: { customer: Customer, onClose: () => void, onConfirm: () => void }) => {
    return (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in">
            <div className="w-full max-w-lg border-2 border-red-600 bg-black shadow-[0_0_100px_rgba(220,38,38,0.4)] rounded-3xl overflow-hidden relative">
                {/* Background FX */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-red-900/50 via-transparent to-transparent pointer-events-none"></div>
                
                <div className="relative z-10 p-8 text-center flex flex-col items-center">
                    <Medal size={80} className="text-red-500 mb-6 animate-pulse-slow drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]" />
                    
                    <h2 className="text-3xl font-black text-white uppercase tracking-widest mb-2 text-outline">Prestige Mode</h2>
                    <div className="h-1 w-24 bg-red-600 rounded-full mb-6"></div>
                    
                    <p className="text-gray-300 text-sm mb-8 leading-relaxed max-w-xs">
                        Are you ready to trade your progress for glory? 
                        <br/><br/>
                        <strong className="text-white">Reset Level 50 to Level 1.</strong>
                        <br/>
                        Gain <strong className="text-cyber-gold">Prestige Rank {(customer.prestige || 0) + 1}</strong>.
                    </p>

                    <div className="grid grid-cols-2 gap-4 w-full mb-8">
                        <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-xl">
                            <div className="text-xs text-red-400 uppercase font-bold mb-1">Penalty</div>
                            <div className="text-white font-mono text-lg">XP Reset</div>
                        </div>
                        <div className="bg-cyber-gold/20 border border-cyber-gold/30 p-4 rounded-xl">
                            <div className="text-xs text-cyber-gold uppercase font-bold mb-1">Reward</div>
                            <div className="text-white font-mono text-lg">+2% Disc Auth</div>
                        </div>
                    </div>

                    <div className="flex gap-4 w-full">
                        <button onClick={onClose} className="flex-1 py-4 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 uppercase font-bold tracking-wider transition-all">
                            Cancel
                        </button>
                        <button onClick={onConfirm} className="flex-1 py-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest shadow-[0_0_30px_rgba(220,38,38,0.6)] hover:shadow-[0_0_50px_rgba(220,38,38,0.8)] transition-all transform hover:scale-105">
                            ENTER PRESTIGE
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ... (HeroCustomerCard remains unchanged)
const HeroCustomerCard: React.FC<{ customer: Customer, onClick: () => void }> = ({ customer, onClick }) => {
    // SAFE MERGE: Ensure all stats exist even if API returns partial data to prevent crashes
    const defaultStats = { negotiation: 50, intellect: 50, patience: 50, volatility: 50, loyalty: 50, riskPerception: 50 };
    const stats = { ...defaultStats, ...(customer.psychProfile?.rpgStats || {}) };
    
    // Level & XP Logic
    const level = customer.level || 1;
    const xp = customer.xp || 0;
    const currentLevelBaseXP = Math.pow(level - 1, 2) * 100;
    const nextLevelXP = Math.pow(level, 2) * 100;
    const progressPercent = ((xp - currentLevelBaseXP) / (nextLevelXP - currentLevelBaseXP)) * 100;

    // Calculate Total Lifetime Profit
    const lifetimeProfit = customer.transactionHistory.reduce((acc, s) => acc + s.profit, 0);

    const radarData = [
        { subject: 'INT', value: stats.intellect, fullMark: 100 },
        { subject: 'NEG', value: stats.negotiation, fullMark: 100 },
        { subject: 'PAT', value: stats.patience, fullMark: 100 },
        { subject: 'VOL', value: stats.volatility, fullMark: 100 },
        { subject: 'RSK', value: stats.riskPerception, fullMark: 100 },
        { subject: 'LOY', value: stats.loyalty, fullMark: 100 },
    ];

    return (
        <div onClick={onClick} className="bg-cyber-panel border border-white/10 rounded-3xl overflow-hidden cursor-pointer group hover:border-cyber-gold transition-all relative shadow-2xl h-full flex flex-col transform hover:-translate-y-1">
            {/* Expanded Image Area */}
            <div className="h-80 w-full relative shrink-0">
                {customer.avatarImage ? (
                    <img src={customer.avatarImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 filter contrast-110" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-b from-gray-800 to-black flex items-center justify-center">
                        <User size={96} className="text-gray-600 opacity-20"/>
                    </div>
                )}
                
                {/* Level Badge Overlay */}
                <div className="absolute top-4 left-4 z-10">
                    <div className="bg-black/80 backdrop-blur-md border border-cyber-gold/50 px-4 py-2 rounded-full flex items-center gap-3 shadow-lg">
                        {customer.prestige && customer.prestige > 0 ? (
                            <span className="text-sm text-cyber-red font-black uppercase tracking-widest flex items-center gap-2">
                                <PrestigeBadge prestige={customer.prestige} size={24} /> 
                                <span>P{customer.prestige}</span>
                            </span>
                        ) : (
                            <span className="text-sm text-cyber-gold font-black uppercase tracking-widest">Lvl {level}</span>
                        )}
                        <div className="w-20 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                            <div className={`h-full transition-all shadow-[0_0_10px_rgba(212,175,55,0.8)] ${customer.prestige ? 'bg-cyber-red' : 'bg-cyber-gold'}`} style={{ width: `${progressPercent}%` }}></div>
                        </div>
                    </div>
                </div>

                {/* Name Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/80 to-transparent">
                    <div className="flex justify-between items-end">
                        <div>
                            <h3 className="text-3xl font-black text-white uppercase tracking-tighter drop-shadow-2xl leading-none mb-1">{customer.name}</h3>
                            <div className="flex items-center gap-2">
                                <span className="text-gray-400 font-bold text-xs uppercase tracking-widest bg-white/10 px-2 py-0.5 rounded">
                                    {customer.id === 'WALK_IN' ? 'System Guest' : customer.psychProfile?.primary ? `${customer.psychProfile.primary}` : 'Unprofiled'}
                                </span>
                                {customer.achievements && customer.achievements.length > 0 && (
                                    <span className="text-xs text-cyber-purple font-bold flex items-center gap-1">
                                        <Trophy size={10} /> {customer.achievements.length}
                                    </span>
                                )}
                            </div>
                        </div>
                        {customer.psychProfile && (
                            <div className={`w-10 h-10 rounded-xl bg-black/50 border border-white/20 flex items-center justify-center text-lg font-black shadow-xl backdrop-blur-sm ${ARCHETYPES[customer.psychProfile.primary.charAt(0) as keyof typeof ARCHETYPES]?.color}`}>
                                {customer.psychProfile.primary.charAt(0)}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            <div className="p-4 bg-black/90 backdrop-blur-sm border-t border-white/10 flex-1 flex flex-col justify-between">
                
                {/* Stats Visualization */}
                <div className="w-full h-40 relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                            <PolarGrid stroke="#333" strokeDasharray="3 3"/>
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 10, fontWeight: 'bold' }} />
                            <Radar name="Stats" dataKey="value" stroke="#D4AF37" strokeWidth={2} fill="#D4AF37" fillOpacity={0.4} />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-3 gap-2 border-t border-white/5 pt-3 mt-auto">
                    <div className="text-center">
                        <div className="text-[9px] text-gray-500 uppercase font-bold">Loyalty</div>
                        <div className="text-white font-mono text-xs">{stats.loyalty}</div>
                    </div>
                    <div className="text-center border-l border-white/5 border-r">
                        <div className="text-[9px] text-gray-500 uppercase font-bold">Risk Tol</div>
                        <div className="text-white font-mono text-xs">{stats.riskPerception}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-[9px] text-gray-500 uppercase font-bold">Profit</div>
                        <div className={`font-mono text-xs flex justify-center items-center gap-1 font-bold ${lifetimeProfit >= 0 ? 'text-cyber-green' : 'text-red-500'}`}>
                            {lifetimeProfit >= 0 ? <TrendingUp size={10}/> : <TrendingDown size={10}/>}
                            ${lifetimeProfit.toFixed(0)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Customers: React.FC = () => {
  const { customers, addCustomer, updateCustomer, addNotification, triggerPrestige } = useAppStore(state => ({
      customers: state.customers,
      addCustomer: state.addCustomer,
      updateCustomer: state.updateCustomer,
      addNotification: state.addNotification,
      triggerPrestige: state.triggerPrestige
  }));
  const [showAdd, setShowAdd] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'SHEET' | 'MATRIX' | 'PSYCHOLOGY' | 'RHYTHM' | 'GALLERY'>('OVERVIEW');
  const [newName, setNewName] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [visualDesc, setVisualDesc] = useState('');
  const [imageQuality, setImageQuality] = useState<'fast' | 'detailed'>('fast');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const [matrixAnswers, setMatrixAnswers] = useState<Record<string, string>>({});
  const [showPrestigeModal, setShowPrestigeModal] = useState(false);
  
  // NEW: GHOST ID STATE
  const [ghostIdInput, setGhostIdInput] = useState('');
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

  // ... (useEffect and Handlers remain unchanged)
  useEffect(() => {
      if (selectedCustomer) {
          setEditNotes(selectedCustomer.notes || '');
          setVisualDesc(selectedCustomer.visualDescription || '');
          setMatrixAnswers(selectedCustomer.behavioralMatrix || {});
          setGhostIdInput(selectedCustomer.ghostId || ''); // Initialize Ghost ID
      }
  }, [selectedCustomer]);

  // Calculate profitability for the selected customer detail view
  const currentCustomerProfit = useMemo(() => {
      if (!selectedCustomer) return 0;
      return selectedCustomer.transactionHistory.reduce((acc, s) => acc + s.profit, 0);
  }, [selectedCustomer]);

  const calculatedArchetype = useMemo(() => {
      const counts: Record<string, number> = { A: 0, I: 0, S: 0, C: 0 };
      Object.values(matrixAnswers).forEach((val) => { const key = val as string; if (counts[key] !== undefined) counts[key]++; });
      const total = Object.values(counts).reduce((a: number, b: number) => a + b, 0);
      if (total === 0) return null;
      const primary = Object.keys(counts).reduce((a: string, b: string) => counts[a] > counts[b] ? a : b);
      return { code: primary, details: ARCHETYPES[primary as keyof typeof ARCHETYPES], counts };
  }, [matrixAnswers]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newC: Customer = {
      id: Date.now().toString(),
      name: newName,
      notes: '',
      tags: [],
      microSignals: [],
      encounters: [],
      totalSpent: 0,
      lastPurchase: new Date().toISOString(),
      transactionHistory: [],
      xp: 0,
      level: 1,
      achievements: [],
      gallery: []
    };
    addCustomer(newC);
    setNewName('');
    setShowAdd(false);
  };

  const handleMatrixAnswer = (qId: string, val: string) => {
      setMatrixAnswers(prev => ({ ...prev, [qId]: val }));
  };

  const saveAssessment = () => {
      if (!selectedCustomer) return;
      const updatedCustomer = { 
          ...selectedCustomer, 
          behavioralMatrix: matrixAnswers, 
          notes: editNotes, 
          visualDescription: visualDesc, 
          ghostId: ghostIdInput // SAVE GHOST ID
      };
      updateCustomer(updatedCustomer);
      setSelectedCustomer(updatedCustomer);
      addNotification("Profile data updated.", 'SUCCESS');
  };

  const handleAnalyze = async () => {
    if (!selectedCustomer) return;
    saveAssessment(); 
    setIsAnalyzing(true);
    addNotification("Accessing behavior prediction model...", 'INFO');
    const matrixSummary = Object.entries(matrixAnswers).map(([k, v]) => {
        const q = PSYCH_QUESTIONS.find(q => q.id === k);
        const a = q?.options.find(o => o.value === v);
        return `${q?.category}: ${a?.text} (${v})`;
    }).join('\n');
    const customerToAnalyze = { 
        ...selectedCustomer, 
        notes: `${editNotes}\n\n[BEHAVIORAL MATRIX RESULTS]\n${matrixSummary}`, 
        microSignals: selectedCustomer.microSignals || [],
        encounters: selectedCustomer.encounters || []
    };
    const updatedCustomer = await analyzeCustomerProfile(customerToAnalyze, selectedCustomer.transactionHistory);
    setIsAnalyzing(false);
    if (updatedCustomer) {
      updateCustomer(updatedCustomer);
      setSelectedCustomer(updatedCustomer);
      addNotification("Psych profile constructed.", 'SUCCESS');
    } else {
      addNotification("Analysis failed. Connection interrupted.", 'ERROR');
    }
  };

  const handleGenerateAvatar = async () => {
    if (!selectedCustomer) return;
    
    // 1. Check Daily Limit
    const lastGen = selectedCustomer.lastAvatarGenerationDate;
    if (lastGen) {
        const lastDate = new Date(lastGen);
        const now = new Date();
        const diffHours = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60);
        if (diffHours < 24) {
            const hoursLeft = 24 - diffHours;
            addNotification(`Cooldown Active: Wait ${hoursLeft.toFixed(1)}h for next generation.`, 'WARNING');
            return;
        }
    }

    if (!visualDesc) { addNotification("Visual description required.", 'WARNING'); return; }
    
    setIsGeneratingAvatar(true);
    addNotification(`Rendering ${imageQuality} avatar with Achievement Context...`, 'INFO');
    
    // 2. Pass Achievements to Generator
    const base64Image = await generateAvatar(visualDesc, selectedCustomer.achievements || [], imageQuality);
    
    setIsGeneratingAvatar(false);
    
    if (base64Image) {
        const newGallery = [...(selectedCustomer.gallery || []), base64Image].slice(-20);
        const updated = { 
            ...selectedCustomer, 
            avatarImage: base64Image, 
            visualDescription: visualDesc, 
            gallery: newGallery,
            lastAvatarGenerationDate: new Date().toISOString()
        };
        updateCustomer(updated);
        setSelectedCustomer(updated);
        addNotification("Identity rendered successfully.", 'SUCCESS');
    }
  };

  const handleSelectAvatar = (img: string) => {
      if (!selectedCustomer) return;
      const updated = { ...selectedCustomer, avatarImage: img };
      updateCustomer(updated);
      setSelectedCustomer(updated);
      addNotification("Main avatar updated.", 'SUCCESS');
  }

  const handleAddEncounter = (encounter: SituationalEncounter) => {
      if (!selectedCustomer) return;
      const updatedEncounters = [...(selectedCustomer.encounters || []), encounter];
      const updated = { ...selectedCustomer, encounters: updatedEncounters };
      updateCustomer(updated);
      setSelectedCustomer(updated);
      addNotification("Encounter logged.", 'SUCCESS');
  }

  const handleLogExperiment = (name: string, result: string, outcome: string) => {
      const encounter: SituationalEncounter = {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          situation: `[EXPERIMENT: ${name}]`,
          reaction: result,
          outcome: outcome as any
      };
      handleAddEncounter(encounter);
  };

  const handleAddSignal = (signal: MicroSignal) => {
      if (!selectedCustomer) return;
      const updatedSignals = [...(selectedCustomer.microSignals || []), signal];
      const updated = { ...selectedCustomer, microSignals: updatedSignals };
      updateCustomer(updated);
      setSelectedCustomer(updated);
      addNotification("Micro-signal recorded.", 'INFO');
  }

  const handlePrestigeConfirm = () => {
      if(selectedCustomer) {
          triggerPrestige(selectedCustomer.id);
          setShowPrestigeModal(false);
          const updated = { ...selectedCustomer, level: 1, xp: 0, prestige: (selectedCustomer.prestige || 0) + 1 };
          setSelectedCustomer(updated);
      }
  };

  const getStatBar = (label: string, value: number, colorClass: string, icon: any) => (
      <div className="mb-4 group">
          <div className="flex justify-between items-center mb-1">
              <span className={`text-xs font-bold uppercase flex items-center gap-2 text-gray-400 group-hover:text-white transition-colors`}>
                  {icon} {label}
              </span>
              <span className={`text-sm font-mono font-bold ${colorClass}`}>{value}%</span>
          </div>
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
              <div 
                  className={`h-full ${colorClass.replace('text-', 'bg-')} transition-all duration-1000 ease-out shadow-[0_0_10px_currentColor]`} 
                  style={{ width: `${value}%` }}
              ></div>
          </div>
      </div>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white tracking-tight uppercase">Client Database</h2>
        <button onClick={() => setShowAdd(true)} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg border border-white/10">Add Client</button>
      </div>

      {showAdd && (
        <form onSubmit={handleCreate} className="bg-cyber-panel p-4 rounded-xl border border-white/10 mb-6 flex gap-4 animate-fade-in">
          <input className="flex-1 bg-black/50 border border-white/10 rounded p-2 text-white" placeholder="Client Name" value={newName} onChange={e => setNewName(e.target.value)} required />
          <button type="submit" className="bg-cyber-green text-black font-bold px-4 rounded">SAVE</button>
        </form>
      )}

      {/* ENLARGED GRID FOR HERO CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pb-20">
        {customers.filter(c => c.id !== 'WALK_IN').map(c => (
          <HeroCustomerCard key={c.id} customer={c} onClick={() => { setSelectedCustomer(c); setActiveTab('OVERVIEW'); }} />
        ))}
      </div>

      {selectedCustomer && showPrestigeModal && (
          <PrestigeModal customer={selectedCustomer} onClose={() => setShowPrestigeModal(false)} onConfirm={handlePrestigeConfirm} />
      )}

      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#0a0a0a] w-full max-w-7xl h-[95vh] rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex overflow-hidden">
            
            {/* SIDEBAR (No changes) */}
            <div className={`bg-white/5 border-r border-white/5 flex flex-col transition-all duration-300 ease-in-out shrink-0 ${isSidebarCollapsed ? 'w-20 p-4' : 'w-80 p-6'} overflow-y-auto custom-scrollbar`}>
                <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="mb-6 self-end text-gray-400 hover:text-white transition-colors">
                    {isSidebarCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
                </button>

                <div className={`flex flex-col items-center text-center mb-8 relative transition-opacity duration-200 ${isSidebarCollapsed ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100 h-auto'}`}>
                    <div className="w-48 h-48 rounded-2xl overflow-hidden mb-4 border-2 border-cyber-gold shadow-[0_0_25px_rgba(212,175,55,0.2)] group relative cursor-pointer" onClick={() => setActiveTab('GALLERY')}>
                        {selectedCustomer.avatarImage ? (
                            <img src={selectedCustomer.avatarImage} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-b from-gray-700 to-black flex items-center justify-center"><User size={64} className="text-gray-500" /></div>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><ImageIcon className="text-white"/></div>
                        
                        {/* PRESTIGE BADGE OVERLAY */}
                        {selectedCustomer.prestige && selectedCustomer.prestige > 0 && (
                            <div className="absolute bottom-2 right-2 drop-shadow-xl">
                                <PrestigeBadge prestige={selectedCustomer.prestige} size={48} />
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2 mb-1 justify-center">
                        <h2 className="text-2xl font-bold text-white">{selectedCustomer.name}</h2>
                        <button onClick={(e) => { e.stopPropagation(); handleAnalyze(); }} disabled={isAnalyzing} className={`p-1 rounded-full border border-white/10 bg-white/5 hover:bg-cyber-purple hover:border-cyber-purple hover:text-white transition-all ${isAnalyzing ? 'text-cyber-purple' : 'text-gray-400'}`} title="Run Deep Profile Analysis">
                            <Brain size={16} className={isAnalyzing ? "animate-pulse" : ""} />
                        </button>
                    </div>
                    <div className="flex flex-col items-center w-full px-4 mt-2">
                        <div className="flex justify-between w-full text-[10px] text-gray-400 uppercase font-bold mb-1">
                            {selectedCustomer.prestige && selectedCustomer.prestige > 0 ? (
                                <span className="text-cyber-red flex items-center gap-1 font-bold"><Medal size={10}/> Prestige {selectedCustomer.prestige}</span>
                            ) : (
                                <span>Lvl {selectedCustomer.level || 1}</span>
                            )}
                            <span>{selectedCustomer.xp || 0} XP</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div className={`h-full w-1/2 ${selectedCustomer.prestige ? 'bg-cyber-red shadow-[0_0_10px_red]' : 'bg-cyber-gold'}`}></div>
                        </div>
                    </div>
                </div>

                {isSidebarCollapsed && (
                    <div className="mb-8 flex justify-center animate-fade-in relative">
                         <div className="w-10 h-10 rounded-full overflow-hidden border border-cyber-gold shadow-lg cursor-pointer" title={selectedCustomer.name}>
                            {selectedCustomer.avatarImage ? ( <img src={selectedCustomer.avatarImage} className="w-full h-full object-cover" /> ) : ( <div className="w-full h-full bg-gray-700 flex items-center justify-center"><User size={20}/></div> )}
                         </div>
                         {selectedCustomer.prestige && selectedCustomer.prestige > 0 && (
                             <div className="absolute -bottom-2 -right-2 scale-50"><PrestigeBadge prestige={selectedCustomer.prestige}/></div>
                         )}
                    </div>
                )}

                <nav className="space-y-2 flex-1">
                    <button onClick={() => setActiveTab('OVERVIEW')} className={`w-full text-left p-3 rounded-lg text-xs font-bold uppercase flex items-center gap-2 transition-all ${activeTab === 'OVERVIEW' ? 'bg-cyber-gold text-black shadow-lg shadow-cyber-gold/20' : 'text-gray-400 hover:bg-white/5'} ${isSidebarCollapsed ? 'justify-center' : ''}`} title="Live Session">
                        <FileText size={16} />{!isSidebarCollapsed && <span>Live Session Mode</span>}
                    </button>
                    <button onClick={() => setActiveTab('SHEET')} className={`w-full text-left p-3 rounded-lg text-xs font-bold uppercase flex items-center gap-2 transition-all ${activeTab === 'SHEET' ? 'bg-cyber-gold text-black shadow-lg shadow-cyber-gold/20' : 'text-gray-400 hover:bg-white/5'} ${isSidebarCollapsed ? 'justify-center' : ''}`} title="Character Sheet">
                        <User size={16} />{!isSidebarCollapsed && <span>Character Sheet</span>}
                    </button>
                    <button onClick={() => setActiveTab('MATRIX')} className={`w-full text-left p-3 rounded-lg text-xs font-bold uppercase flex items-center gap-2 transition-all ${activeTab === 'MATRIX' ? 'bg-cyber-gold text-black shadow-lg shadow-cyber-gold/20' : 'text-gray-400 hover:bg-white/5'} ${isSidebarCollapsed ? 'justify-center' : ''}`} title="Behavioral Matrix">
                        <Activity size={16} />{!isSidebarCollapsed && <span>Behavioral Matrix</span>}
                    </button>
                    <button onClick={() => setActiveTab('RHYTHM')} className={`w-full text-left p-3 rounded-lg text-xs font-bold uppercase flex items-center gap-2 transition-all ${activeTab === 'RHYTHM' ? 'bg-cyber-gold text-black shadow-lg shadow-cyber-gold/20' : 'text-gray-400 hover:bg-white/5'} ${isSidebarCollapsed ? 'justify-center' : ''}`} title="Rhythm & Temporal">
                        <Calendar size={16} />{!isSidebarCollapsed && <span>Rhythm & Temporal</span>}
                    </button>
                    <button onClick={() => setActiveTab('PSYCHOLOGY')} className={`w-full text-left p-3 rounded-lg text-xs font-bold uppercase flex items-center gap-2 transition-all ${activeTab === 'PSYCHOLOGY' ? 'bg-cyber-gold text-black shadow-lg shadow-cyber-gold/20' : 'text-gray-400 hover:bg-white/5'} ${isSidebarCollapsed ? 'justify-center' : ''}`} title="Archetype Profile">
                        <Brain size={16} />{!isSidebarCollapsed && <span>Archetype Profile</span>}
                    </button>
                    <button onClick={() => setActiveTab('GALLERY')} className={`w-full text-left p-3 rounded-lg text-xs font-bold uppercase flex items-center gap-2 transition-all ${activeTab === 'GALLERY' ? 'bg-cyber-gold text-black shadow-lg shadow-cyber-gold/20' : 'text-gray-400 hover:bg-white/5'} ${isSidebarCollapsed ? 'justify-center' : ''}`} title="Neural Gallery">
                        <ImageIcon size={16} />{!isSidebarCollapsed && <span>Neural Gallery</span>}
                    </button>
                </nav>

                <button onClick={() => setSelectedCustomer(null)} className={`mt-auto flex items-center gap-2 text-gray-500 hover:text-white p-2 transition-all ${isSidebarCollapsed ? 'justify-center' : ''}`}>
                    <X size={16} />{!isSidebarCollapsed && <span>Close Panel</span>}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 relative bg-black/20">
                {activeTab === 'OVERVIEW' && (
                    <div className="animate-fade-in max-w-4xl">
                        {/* ... Existing Overview Content ... */}
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-2xl font-bold text-white uppercase tracking-tight">Active Session</h3>
                                <p className="text-gray-500 text-xs">Execute live tests and log reactions in real-time.</p>
                            </div>
                            
                            {/* PRESTIGE BUTTON */}
                            {selectedCustomer.level >= 50 && (
                                <button 
                                    onClick={() => setShowPrestigeModal(true)} 
                                    className="bg-red-900/30 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white px-4 py-2 rounded-lg font-black uppercase text-xs flex items-center gap-2 animate-pulse transition-all shadow-[0_0_15px_rgba(220,38,38,0.3)]"
                                >
                                    <Medal size={16}/> PRESTIGE AVAILABLE
                                </button>
                            )}
                            
                            <button onClick={saveAssessment} className="text-xs flex items-center gap-1 text-cyber-green hover:text-white bg-white/5 px-3 py-1 rounded-full ml-4"><Save size={12} /> Save Changes</button>
                        </div>

                        {/* GHOST ID LINKING */}
                        <div className="bg-cyber-panel border border-white/10 rounded-xl p-4 mb-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h4 className="text-xs text-cyber-gold font-bold uppercase flex items-center gap-2">
                                        <LinkIcon size={14}/> Ghost Portal Uplink
                                    </h4>
                                    <p className="text-[10px] text-gray-500 mt-1">Enter the unique Ghost ID from the customer's portal to link remote orders.</p>
                                </div>
                                <div className="flex gap-2">
                                    <input 
                                        className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white w-48 focus:border-cyber-gold outline-none"
                                        placeholder="Enter GHOST-ID"
                                        value={ghostIdInput}
                                        onChange={(e) => setGhostIdInput(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                        
                        <LiveExperiments onLogExperiment={handleLogExperiment} />
                        <MicroSignalInput customer={selectedCustomer} onAddSignal={handleAddSignal} />
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <EncounterLogger customer={selectedCustomer} onAddEncounter={handleAddEncounter} />
                            
                            <div className="space-y-6">
                                <div className="flex flex-col h-64">
                                   <label className="text-xs text-gray-400 uppercase font-bold mb-2">Field Notes</label>
                                   <textarea className="flex-1 bg-black/40 border border-white/10 rounded-lg p-4 text-sm text-white focus:border-cyber-gold outline-none resize-none" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Enter raw observations and transaction details..." />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- CHARACTER SHEET TAB --- */}
                {activeTab === 'SHEET' && (
                    <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl">
                        
                        {/* LEFT: AVATAR & IDENTITY */}
                        <div className="space-y-6">
                            <div className="bg-cyber-panel border border-white/10 rounded-2xl p-6 flex flex-col items-center">
                                <div className="w-full aspect-square rounded-xl overflow-hidden mb-4 border-2 border-cyber-gold shadow-[0_0_20px_rgba(212,175,55,0.2)] relative group">
                                    {selectedCustomer.avatarImage ? (
                                        <img src={selectedCustomer.avatarImage} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-gray-800 to-black flex flex-col items-center justify-center text-gray-600">
                                            <User size={64} className="mb-2"/>
                                            <span className="text-xs uppercase font-bold">No Visual</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all p-4">
                                        <textarea 
                                            className="w-full bg-black/50 border border-white/20 rounded p-2 text-xs text-white mb-2 resize-none" 
                                            placeholder="Visual Prompt..." 
                                            rows={2}
                                            value={visualDesc}
                                            onChange={e => setVisualDesc(e.target.value)}
                                            onClick={e => e.stopPropagation()}
                                        />
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleGenerateAvatar(); }} 
                                            disabled={isGeneratingAvatar}
                                            className="bg-cyber-gold text-black text-xs font-bold px-3 py-2 rounded uppercase tracking-wider flex items-center gap-2 hover:brightness-110"
                                        >
                                            {isGeneratingAvatar ? <RefreshCw className="animate-spin" size={12}/> : <Camera size={12}/>} Generate
                                        </button>
                                    </div>
                                </div>

                                <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-1">{selectedCustomer.name}</h2>
                                <div className="flex gap-2 mb-4">
                                    <span className="bg-white/10 text-white text-[10px] px-2 py-0.5 rounded uppercase font-bold">Lvl {selectedCustomer.level}</span>
                                    <span className="bg-cyber-purple/20 text-cyber-purple text-[10px] px-2 py-0.5 rounded uppercase font-bold border border-cyber-purple/30">
                                        {selectedCustomer.psychProfile?.primary || "Unclassified"}
                                    </span>
                                </div>

                                <div className="w-full grid grid-cols-2 gap-2 text-center">
                                    <div className="bg-black/30 p-2 rounded border border-white/5">
                                        <div className="text-[9px] text-gray-500 uppercase font-bold">Lifetime Value</div>
                                        <div className="text-cyber-green font-mono font-bold">${selectedCustomer.totalSpent.toFixed(0)}</div>
                                    </div>
                                    <div className="bg-black/30 p-2 rounded border border-white/5">
                                        <div className="text-[9px] text-gray-500 uppercase font-bold">Encounters</div>
                                        <div className="text-white font-mono font-bold">{selectedCustomer.transactionHistory.length}</div>
                                    </div>
                                    <div className="col-span-2 bg-black/30 p-2 rounded border border-white/5">
                                        <div className="text-[9px] text-gray-500 uppercase font-bold">Lifetime Profit</div>
                                        <div className={`font-mono font-bold flex justify-center items-center gap-1 ${currentCustomerProfit >= 0 ? 'text-cyber-green' : 'text-red-500'}`}>
                                            {currentCustomerProfit >= 0 ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
                                            ${currentCustomerProfit.toFixed(0)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: STATS & MATRIX */}
                        <div className="lg:col-span-2 space-y-6">
                            
                            {/* CORE METRICS */}
                            <div className="bg-cyber-panel border border-white/10 rounded-2xl p-6">
                                <h3 className="text-white font-bold uppercase text-sm mb-6 flex items-center gap-2">
                                    <Activity size={16} className="text-cyber-gold"/> Core Attributes
                                </h3>
                                
                                {getStatBar("Trustworthiness", selectedCustomer.psychProfile?.rpgStats?.trustworthiness || 50, "text-cyber-green", <Shield size={12}/>)}
                                {getStatBar("Loyalty", selectedCustomer.psychProfile?.rpgStats?.loyalty || 50, "text-cyber-purple", <Star size={12}/>)}
                                {getStatBar("Risk Factor", selectedCustomer.psychProfile?.rpgStats?.riskPerception || 50, "text-red-500", <AlertTriangle size={12}/>)}
                            </div>

                            {/* PERSONALITY MATRIX */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* DISC */}
                                <div className="bg-cyber-panel border border-white/10 rounded-2xl p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-white font-bold uppercase text-xs flex items-center gap-2"><BarChart2 size={14} className="text-blue-400"/> DISC Profile</h3>
                                        <button onClick={handleAnalyze} disabled={isAnalyzing} className="text-[10px] text-gray-500 hover:text-white uppercase font-bold flex items-center gap-1">
                                            {isAnalyzing ? <RefreshCw className="animate-spin" size={10}/> : <RefreshCw size={10}/>} Update
                                        </button>
                                    </div>
                                    {selectedCustomer.psychProfile?.disc ? (
                                        <div className="h-40 flex items-end justify-between gap-2 px-2">
                                            {[
                                                { label: 'D', val: selectedCustomer.psychProfile.disc.dominance, color: 'bg-red-500' },
                                                { label: 'I', val: selectedCustomer.psychProfile.disc.influence, color: 'bg-yellow-400' },
                                                { label: 'S', val: selectedCustomer.psychProfile.disc.steadiness, color: 'bg-green-500' },
                                                { label: 'C', val: selectedCustomer.psychProfile.disc.conscientiousness, color: 'bg-blue-500' }
                                            ].map(d => (
                                                <div key={d.label} className="flex flex-col items-center gap-1 w-full">
                                                    <div className="w-full bg-gray-800 rounded-t-lg relative group h-32 flex items-end">
                                                        <div 
                                                            className={`w-full ${d.color} opacity-80 group-hover:opacity-100 transition-all duration-1000`} 
                                                            style={{ height: `${d.val}%` }}
                                                        ></div>
                                                        <span className="absolute bottom-1 w-full text-center text-[10px] font-bold text-black mix-blend-screen">{d.val}</span>
                                                    </div>
                                                    <span className="text-xs font-bold text-gray-400">{d.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="h-40 flex items-center justify-center text-gray-600 text-xs italic">
                                            Run analysis to generate DISC profile.
                                        </div>
                                    )}
                                </div>

                                {/* OCEAN */}
                                <div className="bg-cyber-panel border border-white/10 rounded-2xl p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-white font-bold uppercase text-xs flex items-center gap-2"><Brain size={14} className="text-pink-400"/> OCEAN / Big 5</h3>
                                    </div>
                                    {selectedCustomer.psychProfile?.ocean ? (
                                        <div className="space-y-3">
                                            {[
                                                { label: 'Openness', val: selectedCustomer.psychProfile.ocean.openness },
                                                { label: 'Conscientious', val: selectedCustomer.psychProfile.ocean.conscientiousness },
                                                { label: 'Extraversion', val: selectedCustomer.psychProfile.ocean.extraversion },
                                                { label: 'Agreeableness', val: selectedCustomer.psychProfile.ocean.agreeableness },
                                                { label: 'Neuroticism', val: selectedCustomer.psychProfile.ocean.neuroticism }
                                            ].map(o => (
                                                <div key={o.label} className="flex items-center gap-2">
                                                    <span className="text-[9px] uppercase font-bold text-gray-500 w-20 text-right">{o.label}</span>
                                                    <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                                        <div className="h-full bg-pink-500/80" style={{ width: `${o.val}%` }}></div>
                                                    </div>
                                                    <span className="text-[9px] font-mono text-gray-300 w-6">{o.val}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="h-40 flex items-center justify-center text-gray-600 text-xs italic">
                                            No psychometric data.
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>
                )}

                {activeTab === 'MATRIX' && <BehavioralMatrix scores={matrixAnswers} onAnswer={handleMatrixAnswer} />}
                
                {activeTab === 'RHYTHM' && (
                    <div className="animate-fade-in w-full">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-white uppercase">Temporal Intelligence</h3>
                            <button onClick={handleAnalyze} disabled={isAnalyzing} className="text-xs flex items-center gap-1 text-cyber-gold hover:text-white bg-white/5 px-3 py-1 rounded-full"><RefreshCw size={12} /> {isAnalyzing ? 'Analyzing...' : 'Recalculate Rhythm'}</button>
                        </div>
                        {selectedCustomer.temporalMetrics ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-cyber-panel border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center"><span className="text-[10px] uppercase text-gray-500 font-bold mb-2">Detected Pay Cycle</span><RhythmBadge cycle={selectedCustomer.temporalMetrics.payCycle} /></div>
                                <NextVisitCountdown date={selectedCustomer.temporalMetrics.predictedNextVisit} confidence={selectedCustomer.temporalMetrics.confidence} />
                                <div className="bg-cyber-panel border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center"><span className="text-[10px] uppercase text-gray-500 font-bold mb-1">Average Gap</span><span className="text-3xl font-mono text-white font-bold">{selectedCustomer.temporalMetrics.avgDaysBetweenBuys.toFixed(1)} <span className="text-xs text-gray-600 font-sans">Days</span></span></div>
                            </div>
                        ) : <div className="text-center text-gray-500">No Temporal Data</div>}
                    </div>
                )}

                {activeTab === 'PSYCHOLOGY' && (
                    <div className="animate-fade-in w-full">
                         <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-white uppercase tracking-tight">Psychometric Profile</h3>
                            <button onClick={handleAnalyze} disabled={isAnalyzing} className="text-xs flex items-center gap-1 text-cyber-gold hover:text-white bg-white/5 px-3 py-1 rounded-full"><RefreshCw size={12} /> {isAnalyzing ? 'Analyzing...' : 'Re-Run Analysis'}</button>
                        </div>

                         {selectedCustomer.psychProfile ? (
                             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                 
                                 {/* Left: Summary & Protocol */}
                                 <div className="space-y-6">
                                     <div className="bg-cyber-panel border border-white/10 rounded-2xl p-6">
                                         <h4 className="text-xs text-cyber-gold uppercase font-bold mb-2 flex items-center gap-2"><Brain size={14}/> Executive Summary</h4>
                                         <p className="text-gray-300 italic leading-relaxed text-sm">"{selectedCustomer.psychProfile.summary}"</p>
                                     </div>
                                     <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                         <h4 className="text-xs text-gray-400 uppercase font-bold mb-4 flex items-center gap-2"><Gavel size={14}/> Engagement Protocol</h4>
                                         <div className="space-y-4">
                                             <div>
                                                 <div className="text-[10px] text-gray-500 uppercase font-bold">Recommended Tone</div>
                                                 <div className="text-white font-bold text-lg">{selectedCustomer.psychProfile.interactionStrategy.tone}</div>
                                             </div>
                                             <div className="grid grid-cols-2 gap-4">
                                                 <div>
                                                     <div className="text-[10px] text-green-500 uppercase font-bold mb-1">Trigger (Do)</div>
                                                     <ul className="text-xs text-gray-400 list-disc list-inside">
                                                         {selectedCustomer.psychProfile.interactionStrategy.stabiliseWith.map(s => <li key={s}>{s}</li>)}
                                                     </ul>
                                                 </div>
                                                 <div>
                                                     <div className="text-[10px] text-red-500 uppercase font-bold mb-1">Avoid (Don't)</div>
                                                     <ul className="text-xs text-gray-400 list-disc list-inside">
                                                         {selectedCustomer.psychProfile.interactionStrategy.avoid.map(s => <li key={s}>{s}</li>)}
                                                     </ul>
                                                 </div>
                                             </div>
                                         </div>
                                     </div>
                                 </div>

                                 {/* Right: RPG Stats Radar */}
                                 <div className="bg-cyber-panel border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center">
                                     <h4 className="text-xs text-gray-400 uppercase font-bold mb-4 w-full flex items-center gap-2"><Hexagon size={14}/> Attribute Hex Graph</h4>
                                     
                                     {/* Radar Chart Container */}
                                     <div className="w-full h-64 relative mb-6">
                                         <ResponsiveContainer width="100%" height="100%">
                                             {/* SAFE MERGE APPLIED IN HeroCustomerCard - Replicating here for Detail View */}
                                             <RadarChart cx="50%" cy="50%" outerRadius="75%" data={[
                                                 { subject: 'Intellect', value: (selectedCustomer.psychProfile.rpgStats?.intellect || 50), fullMark: 100 },
                                                 { subject: 'Negotiation', value: (selectedCustomer.psychProfile.rpgStats?.negotiation || 50), fullMark: 100 },
                                                 { subject: 'Patience', value: (selectedCustomer.psychProfile.rpgStats?.patience || 50), fullMark: 100 },
                                                 { subject: 'Volatility', value: (selectedCustomer.psychProfile.rpgStats?.volatility || 50), fullMark: 100 },
                                                 { subject: 'Risk', value: (selectedCustomer.psychProfile.rpgStats?.riskPerception || 50), fullMark: 100 },
                                                 { subject: 'Loyalty', value: (selectedCustomer.psychProfile.rpgStats?.loyalty || 50), fullMark: 100 },
                                             ]}>
                                                 <PolarGrid stroke="#333" strokeDasharray="3 3"/>
                                                 <PolarAngleAxis dataKey="subject" tick={{ fill: '#aaa', fontSize: 11, fontWeight: 'bold' }} />
                                                 <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false}/>
                                                 <Radar name="Stats" dataKey="value" stroke="#D4AF37" strokeWidth={3} fill="#D4AF37" fillOpacity={0.3} />
                                                 <Tooltip 
                                                     contentStyle={{backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px'}} 
                                                     itemStyle={{color: '#D4AF37', fontWeight: 'bold'}}
                                                 />
                                             </RadarChart>
                                         </ResponsiveContainer>
                                     </div>

                                     {/* Stat Breakdown Grid */}
                                     <div className="grid grid-cols-3 gap-4 w-full">
                                         <StatHex label="Intellect" value={selectedCustomer.psychProfile.rpgStats?.intellect || 50} color="text-blue-400" />
                                         <StatHex label="Negotiation" value={selectedCustomer.psychProfile.rpgStats?.negotiation || 50} color="text-cyber-green" />
                                         <StatHex label="Patience" value={selectedCustomer.psychProfile.rpgStats?.patience || 50} color="text-gray-400" />
                                         <StatHex label="Volatility" value={selectedCustomer.psychProfile.rpgStats?.volatility || 50} color="text-red-500" />
                                         <StatHex label="Risk Tol." value={selectedCustomer.psychProfile.rpgStats?.riskPerception || 50} color="text-orange-500" />
                                         <StatHex label="Loyalty" value={selectedCustomer.psychProfile.rpgStats?.loyalty || 50} color="text-cyber-purple" />
                                     </div>
                                 </div>

                             </div>
                         ) : <div className="text-center text-gray-500">No Profile Data. Run Analysis first.</div>}
                    </div>
                )}

                {activeTab === 'GALLERY' && (
                    <div className="animate-fade-in w-full">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-2xl font-bold text-white uppercase tracking-tight">Neural Gallery</h3>
                                <p className="text-gray-500 text-xs">Generated variants and concept art for this identity.</p>
                            </div>
                        </div>
                        
                        {(selectedCustomer.gallery && selectedCustomer.gallery.length > 0) ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {selectedCustomer.gallery.slice().reverse().map((img, idx) => (
                                    <div 
                                        key={idx} 
                                        onClick={() => handleSelectAvatar(img)}
                                        className={`group relative aspect-square rounded-2xl overflow-hidden cursor-pointer border-2 transition-all ${selectedCustomer.avatarImage === img ? 'border-cyber-green' : 'border-transparent hover:border-cyber-gold'}`}
                                    >
                                        <img src={img} className="w-full h-full object-cover" />
                                        {selectedCustomer.avatarImage === img && (
                                            <div className="absolute inset-0 bg-cyber-green/20 flex items-center justify-center">
                                                <CheckCircle2 size={48} className="text-cyber-green drop-shadow-lg" />
                                            </div>
                                        )}
                                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-center text-xs text-white py-2 opacity-0 group-hover:opacity-100 transition-opacity uppercase font-bold tracking-widest">
                                            Set as Active
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 border border-white/10 border-dashed rounded-2xl text-gray-500">
                                <ImageIcon size={48} className="mb-4 opacity-20"/>
                                <p>No Images Generated</p>
                                <p className="text-xs">Use the 'Visual Identity' tool in Overview to create avatars.</p>
                            </div>
                        )}
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