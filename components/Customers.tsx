import React, { useState, useEffect, useMemo } from 'react';
import { Customer, AssessmentData, SituationalEncounter } from '../types';
import { analyzeCustomerProfile, generateAvatar } from '../services/geminiService';
import { useData } from '../DataContext';
import { 
    User, Sparkles, X, Activity, Shield, DollarSign, 
    Save, Brain, FileText, Zap, Target, Eye, Clock, Camera, RefreshCw, BookOpen, Layers, Hexagon,
    AlertTriangle, MessageCircle, Gavel, Flame, Anchor, Lock, ChevronRight, HelpCircle
} from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface CustomersProps {
  customers: Customer[];
  onAddCustomer: (c: Customer) => void;
  onUpdateCustomer: (c: Customer) => void;
}

// --- THE BEHAVIORAL MATRIX ENGINE (30 Questions) ---
const PSYCH_QUESTIONS = [
    // 1. DECISION STYLE (8 Questions)
    { id: 'd1', category: 'Decision Style', text: "When deciding to buy, what is their first instinct?", options: [{ text: "Research/Compare", value: 'A' }, { text: "Gut Feeling", value: 'I' }, { text: "Ask Peers", value: 'S' }, { text: "Wait for Guarantee", value: 'C' }] },
    { id: 'd2', category: 'Decision Style', text: "How do they handle too many options?", options: [{ text: "Detailed List", value: 'A' }, { text: "Pick 'Right' Feel", value: 'I' }, { text: "Ask Recs", value: 'S' }, { text: "Avoid/Delay", value: 'C' }] },
    { id: 'd3', category: 'Decision Style', text: "What drives choice fastest?", options: [{ text: "Evidence/Data", value: 'A' }, { text: "Novelty/Thrill", value: 'I' }, { text: "Popularity", value: 'S' }, { text: "Reliability", value: 'C' }] },
    { id: 'd4', category: 'Decision Style', text: "Preferred decision method?", options: [{ text: "Logical Breakdown", value: 'A' }, { text: "Impulsive", value: 'I' }, { text: "Social Validation", value: 'S' }, { text: "Step-by-Step", value: 'C' }] },
    { id: 'd5', category: 'Decision Style', text: "In groups, they buy because:", options: [{ text: "Facts Convince", value: 'A' }, { text: "Vibe Excites", value: 'I' }, { text: "Peer Pressure", value: 'S' }, { text: "Low Risk", value: 'C' }] },
    { id: 'd6', category: 'Decision Style', text: "Do they change decisions?", options: [{ text: "Rarely (Facts)", value: 'A' }, { text: "Often (New Shiny)", value: 'I' }, { text: "If Influenced", value: 'S' }, { text: "If Safer Option", value: 'C' }] },
    { id: 'd7', category: 'Decision Style', text: "Preferred purchase process?", options: [{ text: "Data-Rich", value: 'A' }, { text: "Quick/Fun", value: 'I' }, { text: "Collaborative", value: 'S' }, { text: "Structured", value: 'C' }] },
    { id: 'd8', category: 'Decision Style', text: "Response to new products?", options: [{ text: "Skeptical/Analyze", value: 'A' }, { text: "Early Adopter", value: 'I' }, { text: "Wait for Trend", value: 'S' }, { text: "Wait for Reviews", value: 'C' }] },

    // 2. MOTIVATIONAL DRIVERS (8 Questions)
    { id: 'm1', category: 'Motivation', text: "What excites them most?", options: [{ text: "ROI/Value", value: 'A' }, { text: "Novelty/Fun", value: 'I' }, { text: "Status", value: 'S' }, { text: "Security", value: 'C' }] },
    { id: 'm2', category: 'Motivation', text: "Biggest fear?", options: [{ text: "Poor Value", value: 'A' }, { text: "FOMO", value: 'I' }, { text: "Embarrassment", value: 'S' }, { text: "Risk/Regret", value: 'C' }] },
    { id: 'm3', category: 'Motivation', text: "Primary reward sought?", options: [{ text: "Mastery", value: 'A' }, { text: "Sensation", value: 'I' }, { text: "Approval", value: 'S' }, { text: "Peace of Mind", value: 'C' }] },
    { id: 'm4', category: 'Motivation', text: "Tempted by deals that show:", options: [{ text: "Cost-Benefit", value: 'A' }, { text: "Limited Time", value: 'I' }, { text: "Friend Recs", value: 'S' }, { text: "Guarantees", value: 'C' }] },
    { id: 'm5', category: 'Motivation', text: "Long-term motivator?", options: [{ text: "Competence", value: 'A' }, { text: "Adventure", value: 'I' }, { text: "Connection", value: 'S' }, { text: "Stability", value: 'C' }] },
    { id: 'm6', category: 'Motivation', text: "Value feeling...", options: [{ text: "Smart", value: 'A' }, { text: "Exhilarated", value: 'I' }, { text: "Validated", value: 'S' }, { text: "Secure", value: 'C' }] },
    { id: 'm7', category: 'Motivation', text: "Product failure frustration?", options: [{ text: "Bad Data", value: 'A' }, { text: "Boredom", value: 'I' }, { text: "Social Loss", value: 'S' }, { text: "Unsafe", value: 'C' }] },
    { id: 'm8', category: 'Motivation', text: "Goal of purchase?", options: [{ text: "Optimize", value: 'A' }, { text: "Fun", value: 'I' }, { text: "Social Gain", value: 'S' }, { text: "Reduce Risk", value: 'C' }] },

    // 3. COMMUNICATION STYLE (6 Questions)
    { id: 'c1', category: 'Communication', text: "Best pitch style?", options: [{ text: "Data/Proof", value: 'A' }, { text: "Storytelling", value: 'I' }, { text: "Testimonials", value: 'S' }, { text: "Instructions", value: 'C' }] },
    { id: 'c2', category: 'Communication', text: "Preferred Tone?", options: [{ text: "Precise", value: 'A' }, { text: "Exciting", value: 'I' }, { text: "Friendly", value: 'S' }, { text: "Reassuring", value: 'C' }] },
    { id: 'c3', category: 'Communication', text: "Best Content Type?", options: [{ text: "Charts/Specs", value: 'A' }, { text: "Visuals", value: 'I' }, { text: "Peer Stories", value: 'S' }, { text: "Step-by-Step", value: 'C' }] },
    { id: 'c4', category: 'Communication', text: "Reaction to Urgency?", options: [{ text: "Skeptical", value: 'A' }, { text: "Excited", value: 'I' }, { text: "Herd Instinct", value: 'S' }, { text: "Anxious", value: 'C' }] },
    { id: 'c5', category: 'Communication', text: "Trusts tone that is:", options: [{ text: "Credible", value: 'A' }, { text: "Enthusiastic", value: 'I' }, { text: "Relatable", value: 'S' }, { text: "Calm", value: 'C' }] },
    { id: 'c6', category: 'Communication', text: "Conversation Style?", options: [{ text: "Analytical", value: 'A' }, { text: "Playful", value: 'I' }, { text: "Collaborative", value: 'S' }, { text: "Guided", value: 'C' }] },

    // 4. RESISTANCE & TRIGGERS (8 Questions)
    { id: 'r1', category: 'Resistance', text: "Price objection meaning?", options: [{ text: "Prove Value", value: 'A' }, { text: "Not Excited Yet", value: 'I' }, { text: "Bad Optics", value: 'S' }, { text: "Fear of Loss", value: 'C' }] },
    { id: 'r2', category: 'Resistance', text: "Stalling tactic?", options: [{ text: "Checking Data", value: 'A' }, { text: "Distracted", value: 'I' }, { text: "Asking Partner", value: 'S' }, { text: "Frozen", value: 'C' }] },
    { id: 'r3', category: 'Resistance', text: "Overwhelmed behavior?", options: [{ text: "Analyze More", value: 'A' }, { text: "Pick Randomly", value: 'I' }, { text: "Follow Crowd", value: 'S' }, { text: "Shut Down", value: 'C' }] },
    { id: 'r4', category: 'Resistance', text: "Best way to close?", options: [{ text: "Logical Summary", value: 'A' }, { text: "Strike Now", value: 'I' }, { text: "Join Club", value: 'S' }, { text: "Risk-Free", value: 'C' }] },
    { id: 'r5', category: 'Resistance', text: "Handling errors?", options: [{ text: "Fix Process", value: 'A' }, { text: "Compensate", value: 'I' }, { text: "Apologize", value: 'S' }, { text: "Explain Why", value: 'C' }] },
    { id: 'r6', category: 'Resistance', text: "Negotiation style?", options: [{ text: "Fact-Based", value: 'A' }, { text: "Emotional", value: 'I' }, { text: "Relationship", value: 'S' }, { text: "Defensive", value: 'C' }] },
    { id: 'r7', category: 'Resistance', text: "Loyalty driver?", options: [{ text: "Consistency", value: 'A' }, { text: "New Drops", value: 'I' }, { text: "Community", value: 'S' }, { text: "Trust", value: 'C' }] },
    { id: 'r8', category: 'Resistance', text: "Response to pressure?", options: [{ text: "Resist", value: 'A' }, { text: "React", value: 'I' }, { text: "Comply", value: 'S' }, { text: "Retreat", value: 'C' }] }
];

const ARCHETYPES = {
    'A': { label: 'The Analyst', color: 'text-blue-400', bg: 'bg-blue-500', desc: "Logic-driven. Values data, ROI, and precision.", statBonus: { intellect: 90, risk: 20 } },
    'I': { label: 'The Maverick', color: 'text-cyber-gold', bg: 'bg-cyber-gold', desc: "Impulse-driven. Values novelty, speed, and status.", statBonus: { volatility: 90, patience: 10 } },
    'S': { label: 'The Connector', color: 'text-cyber-purple', bg: 'bg-cyber-purple', desc: "Social-driven. Values consensus, reviews, and rapport.", statBonus: { negotiation: 80, loyalty: 70 } },
    'C': { label: 'The Sentinel', color: 'text-cyber-green', bg: 'bg-cyber-green', desc: "Security-driven. Values guarantees, safety, and routine.", statBonus: { patience: 90, risk: 10 } }
};

// --- RPG STAT COMPONENT ---
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

// --- SITUATIONAL ENCOUNTER LOGGER ---
const EncounterLogger = ({ customer, onAddEncounter }: { customer: Customer, onAddEncounter: (e: SituationalEncounter) => void }) => {
    const [situation, setSituation] = useState('');
    const [reaction, setReaction] = useState('');
    const [outcome, setOutcome] = useState<'POSITIVE'|'NEGATIVE'|'NEUTRAL'>('NEUTRAL');

    const handleLog = () => {
        if(!situation || !reaction) return;
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
        <div className="bg-cyber-panel border border-white/10 rounded-2xl p-6 mb-6">
            <h3 className="text-white font-bold uppercase text-sm mb-4 flex items-center gap-2"><BookOpen size={16} className="text-cyber-gold"/> Situational Analysis</h3>
            
            <div className="space-y-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <textarea 
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-xs text-white focus:border-cyber-gold outline-none"
                        placeholder="Context: What happened?"
                        rows={2}
                        value={situation}
                        onChange={e => setSituation(e.target.value)}
                    />
                    <textarea 
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-xs text-white focus:border-cyber-gold outline-none"
                        placeholder="Reaction: How did they act?"
                        rows={2}
                        value={reaction}
                        onChange={e => setReaction(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    {['POSITIVE', 'NEUTRAL', 'NEGATIVE'].map(o => (
                        <button 
                            key={o}
                            onClick={() => setOutcome(o as any)}
                            className={`flex-1 py-2 text-[10px] font-bold uppercase rounded border transition-all ${outcome === o 
                                ? (o === 'POSITIVE' ? 'bg-cyber-green text-black border-cyber-green' : o === 'NEGATIVE' ? 'bg-red-500 text-white border-red-500' : 'bg-gray-500 text-white border-gray-500') 
                                : 'bg-transparent text-gray-500 border-gray-700'}`}
                        >
                            {o}
                        </button>
                    ))}
                </div>
                <button onClick={handleLog} className="w-full bg-white/10 hover:bg-white/20 text-white py-2 rounded text-xs font-bold uppercase border border-white/10">
                    Log Encounter
                </button>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                {customer.encounters && customer.encounters.slice().slice(-5).reverse().map(e => (
                    <div key={e.id} className="bg-white/5 p-3 rounded border border-white/5 text-xs flex justify-between items-start gap-4">
                        <div>
                            <div className="text-gray-300 mb-1"><span className="text-cyber-gold font-bold">CTX:</span> {e.situation}</div>
                            <div className="text-gray-400"><span className="text-cyber-purple font-bold">RXN:</span> {e.reaction}</div>
                        </div>
                        <div className="flex flex-col items-end shrink-0">
                            <span className="text-[9px] text-gray-600">{new Date(e.timestamp).toLocaleDateString()}</span>
                            <span className={`font-black text-[10px] uppercase ${e.outcome === 'POSITIVE' ? 'text-cyber-green' : e.outcome === 'NEGATIVE' ? 'text-red-500' : 'text-gray-500'}`}>{e.outcome}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- ADVANCED BEHAVIORAL MATRIX FORM ---
const BehavioralMatrix = ({ scores, onAnswer }: { scores: Record<string, string>, onAnswer: (id: string, val: string) => void }) => {
    
    // Group questions by category for cleaner UI
    const categories = Array.from(new Set(PSYCH_QUESTIONS.map(q => q.category)));

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            {categories.map(cat => (
                <div key={cat} className="bg-black/30 border border-white/5 rounded-xl p-5">
                    <h4 className="text-cyber-gold font-bold uppercase text-xs mb-4 flex items-center gap-2">
                        <Layers size={14}/> {cat} Protocol
                    </h4>
                    <div className="space-y-6">
                        {PSYCH_QUESTIONS.filter(q => q.category === cat).map(q => (
                            <div key={q.id}>
                                <p className="text-white text-sm font-medium mb-2">{q.text}</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {q.options.map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => onAnswer(q.id, opt.value)}
                                            className={`text-left p-3 rounded text-xs border transition-all ${
                                                scores[q.id] === opt.value 
                                                ? 'bg-cyber-purple/20 border-cyber-purple text-white shadow-[0_0_10px_rgba(99,102,241,0.2)]' 
                                                : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10'
                                            }`}
                                        >
                                            <span className={`font-bold mr-2 ${scores[q.id] === opt.value ? 'text-cyber-purple' : 'text-gray-600'}`}>[{opt.value}]</span>
                                            {opt.text}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

// --- LARGE HERO CARD ---
const HeroCustomerCard: React.FC<{ customer: Customer, onClick: () => void }> = ({ customer, onClick }) => {
    
    // Calculate RPG Stats derived from Profile or Default
    const stats = customer.psychProfile?.rpgStats || {
        negotiation: 50, intellect: 50, patience: 50, volatility: 50, loyalty: 50, riskPerception: 50
    };

    return (
        <div onClick={onClick} className="bg-cyber-panel border border-white/10 rounded-2xl overflow-hidden cursor-pointer group hover:border-cyber-gold transition-all relative shadow-xl h-full flex flex-col">
            
            {/* Avatar & Header */}
            <div className="h-64 w-full relative shrink-0">
                {customer.avatarImage ? (
                    <img src={customer.avatarImage} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity filter contrast-125 grayscale hover:grayscale-0 duration-500" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-b from-gray-800 to-black flex items-center justify-center">
                        <User size={64} className="text-gray-600"/>
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                
                <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex justify-between items-end">
                        <div>
                            <h3 className="text-3xl font-black text-white uppercase tracking-tighter drop-shadow-lg leading-none">{customer.name}</h3>
                            <span className="text-cyber-gold font-bold text-[10px] uppercase tracking-widest drop-shadow-md">
                                Level {Math.floor(customer.totalSpent / 500) + 1} {customer.psychProfile?.primary || 'UNRANKED'}
                            </span>
                        </div>
                        {customer.psychProfile && (
                            <div className={`w-8 h-8 rounded bg-black/50 border border-white/20 flex items-center justify-center text-xs font-black ${ARCHETYPES[customer.psychProfile.primary.charAt(0) as keyof typeof ARCHETYPES]?.color}`}>
                                {customer.psychProfile.primary.charAt(0)}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* RPG Stat Tree */}
            <div className="p-4 bg-black/80 backdrop-blur-sm border-t border-white/10 flex-1">
                <div className="flex justify-between gap-2 px-2">
                    <StatHex label="LOGIC" value={stats.intellect} color="text-blue-400" />
                    <StatHex label="SPEED" value={stats.volatility} color="text-red-500" />
                    <StatHex label="CHARISMA" value={stats.negotiation} color="text-cyber-purple" />
                    <StatHex label="RISK" value={stats.riskPerception} color="text-cyber-gold" />
                </div>
                
                {customer.psychProfile?.interactionStrategy && (
                    <div className="mt-4 pt-3 border-t border-white/5">
                        <div className="flex items-center gap-2 mb-1">
                            <Zap size={10} className="text-cyber-gold"/>
                            <span className="text-[9px] uppercase text-gray-400 font-bold">Tactical Advice</span>
                        </div>
                        <p className="text-xs text-gray-300 italic line-clamp-2">
                            "{customer.psychProfile.interactionStrategy.tone}"
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- MAIN CUSTOMERS COMPONENT ---
const Customers: React.FC<CustomersProps> = ({ customers, onAddCustomer, onUpdateCustomer }) => {
  const { addNotification } = useData();
  const [showAdd, setShowAdd] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'MATRIX' | 'PSYCHOLOGY'>('OVERVIEW');
  
  // Creation State
  const [newName, setNewName] = useState('');
  
  // Editing State
  const [editNotes, setEditNotes] = useState('');
  const [visualDesc, setVisualDesc] = useState('');
  const [imageQuality, setImageQuality] = useState<'fast' | 'detailed'>('fast');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  
  // Matrix State (Loaded from customer data or empty)
  const [matrixAnswers, setMatrixAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
      if (selectedCustomer) {
          setEditNotes(selectedCustomer.notes || '');
          setVisualDesc(selectedCustomer.visualDescription || '');
          // Load existing matrix answers if available
          setMatrixAnswers(selectedCustomer.behavioralMatrix || {});
      }
  }, [selectedCustomer]);

  // Derived Archetype Score Calculation
  const calculatedArchetype = useMemo(() => {
      const counts: Record<string, number> = { A: 0, I: 0, S: 0, C: 0 };
      Object.values(matrixAnswers).forEach((val) => {
          const key = val as string;
          if (counts[key] !== undefined) counts[key]++;
      });
      const total = Object.values(counts).reduce((a: number, b: number) => a + b, 0);
      if (total === 0) return null;

      // Determine Dominant Archetype
      const primary = Object.keys(counts).reduce((a: string, b: string) => counts[a] > counts[b] ? a : b);
      return { 
          code: primary, 
          details: ARCHETYPES[primary as keyof typeof ARCHETYPES],
          counts 
      };
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
      transactionHistory: []
    };
    onAddCustomer(newC);
    setNewName('');
    setShowAdd(false);
  };

  const handleMatrixAnswer = (qId: string, val: string) => {
      setMatrixAnswers(prev => ({ ...prev, [qId]: val }));
  };

  const saveAssessment = () => {
      if (!selectedCustomer) return;
      
      // Persist matrix answers
      const updatedCustomer = { 
          ...selectedCustomer, 
          behavioralMatrix: matrixAnswers,
          notes: editNotes,
          visualDescription: visualDesc 
      };

      onUpdateCustomer(updatedCustomer);
      setSelectedCustomer(updatedCustomer); // Update local state
      addNotification("Matrix profile updated.", 'SUCCESS');
  };

  const handleAnalyze = async () => {
    if (!selectedCustomer) return;
    saveAssessment(); 
    setIsAnalyzing(true);
    addNotification("Accessing behavior prediction model...", 'INFO');
    
    // Create a rich text summary of the matrix answers for the AI
    const matrixSummary = Object.entries(matrixAnswers).map(([k, v]) => {
        const q = PSYCH_QUESTIONS.find(q => q.id === k);
        const a = q?.options.find(o => o.value === v);
        return `${q?.category}: ${a?.text} (${v})`;
    }).join('\n');

    const customerToAnalyze = { 
        ...selectedCustomer, 
        notes: `${editNotes}\n\n[BEHAVIORAL MATRIX RESULTS]\n${matrixSummary}`, // Inject matrix results into notes for AI context
        microSignals: selectedCustomer.microSignals || [],
        encounters: selectedCustomer.encounters || []
    };

    const profile = await analyzeCustomerProfile(customerToAnalyze, selectedCustomer.transactionHistory);
    setIsAnalyzing(false);
    
    if (profile) {
      const updated = { ...selectedCustomer, psychProfile: profile, behavioralMatrix: matrixAnswers };
      onUpdateCustomer(updated);
      setSelectedCustomer(updated);
      setActiveTab('PSYCHOLOGY');
      addNotification("Psych profile constructed.", 'SUCCESS');
    } else {
      addNotification("Analysis failed. Connection interrupted.", 'ERROR');
    }
  };

  const handleGenerateAvatar = async () => {
    if (!visualDesc) {
        addNotification("Visual description required.", 'WARNING');
        return;
    }
    setIsGeneratingAvatar(true);
    addNotification(`Rendering ${imageQuality} avatar...`, 'INFO');
    
    const base64Image = await generateAvatar(visualDesc, imageQuality);
    setIsGeneratingAvatar(false);
    
    if (base64Image && selectedCustomer) {
        const updated = { ...selectedCustomer, avatarImage: base64Image, visualDescription: visualDesc };
        onUpdateCustomer(updated);
        setSelectedCustomer(updated);
        addNotification("Identity rendered.", 'SUCCESS');
    }
  };

  const handleAddEncounter = (encounter: SituationalEncounter) => {
      if (!selectedCustomer) return;
      const updatedEncounters = [...(selectedCustomer.encounters || []), encounter];
      const updated = { ...selectedCustomer, encounters: updatedEncounters };
      onUpdateCustomer(updated);
      setSelectedCustomer(updated);
      addNotification("Encounter logged.", 'SUCCESS');
  }

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

      {/* NEW HERO CARD GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-10">
        {customers.map(c => (
          <HeroCustomerCard 
            key={c.id} 
            customer={c}
            onClick={() => { setSelectedCustomer(c); setActiveTab('OVERVIEW'); }}
          />
        ))}
      </div>

      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#0a0a0a] w-full max-w-7xl h-[95vh] rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex overflow-hidden">
            
            {/* SIDEBAR */}
            <div className="w-80 bg-white/5 border-r border-white/5 flex flex-col p-6 overflow-y-auto shrink-0">
                <div className="flex flex-col items-center text-center mb-8 relative">
                    <div className="w-48 h-48 rounded-xl overflow-hidden mb-4 border-2 border-cyber-gold shadow-[0_0_25px_rgba(212,175,55,0.2)]">
                        {selectedCustomer.avatarImage ? (
                            <img src={selectedCustomer.avatarImage} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-b from-gray-700 to-black flex items-center justify-center">
                                <User size={64} className="text-gray-500" />
                            </div>
                        )}
                    </div>
                    
                    <h2 className="text-2xl font-bold text-white mb-1">{selectedCustomer.name}</h2>
                    <p className="text-cyber-gold uppercase text-[10px] tracking-widest">Level {Math.floor(selectedCustomer.totalSpent / 500) + 1} Patron</p>
                </div>

                <nav className="space-y-2 flex-1">
                    <button onClick={() => setActiveTab('OVERVIEW')} className={`w-full text-left p-3 rounded-lg text-xs font-bold uppercase flex items-center gap-2 ${activeTab === 'OVERVIEW' ? 'bg-cyber-gold text-black shadow-lg shadow-cyber-gold/20' : 'text-gray-400 hover:bg-white/5'}`}>
                        <FileText size={16} /> Field Overview
                    </button>
                    <button onClick={() => setActiveTab('MATRIX')} className={`w-full text-left p-3 rounded-lg text-xs font-bold uppercase flex items-center gap-2 ${activeTab === 'MATRIX' ? 'bg-cyber-gold text-black shadow-lg shadow-cyber-gold/20' : 'text-gray-400 hover:bg-white/5'}`}>
                        <Activity size={16} /> Behavioral Matrix
                    </button>
                    <button onClick={() => setActiveTab('PSYCHOLOGY')} className={`w-full text-left p-3 rounded-lg text-xs font-bold uppercase flex items-center gap-2 ${activeTab === 'PSYCHOLOGY' ? 'bg-cyber-gold text-black shadow-lg shadow-cyber-gold/20' : 'text-gray-400 hover:bg-white/5'}`}>
                        <Brain size={16} /> Archetype Profile
                    </button>
                </nav>

                <button onClick={() => setSelectedCustomer(null)} className="mt-auto flex items-center gap-2 text-gray-500 hover:text-white p-2">
                    <X size={16} /> Close Panel
                </button>
            </div>

            {/* CONTENT AREA */}
            <div className="flex-1 overflow-y-auto p-8 relative bg-black/20">
                
                {activeTab === 'OVERVIEW' && (
                    <div className="animate-fade-in max-w-4xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-white uppercase tracking-tight">Field Overview</h3>
                            <button onClick={saveAssessment} className="text-xs flex items-center gap-1 text-cyber-green hover:text-white bg-white/5 px-3 py-1 rounded-full"><Save size={12} /> Save Changes</button>
                        </div>
                        
                        {/* ENCOUNTER LOGGER */}
                        <EncounterLogger 
                            customer={selectedCustomer} 
                            onAddEncounter={handleAddEncounter} 
                        />

                        {/* VISUAL IDENTITY GENERATOR */}
                        <div className="bg-cyber-panel border border-white/10 rounded-xl p-4 mb-6">
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-xs text-gray-400 uppercase font-bold flex items-center gap-2"><Camera size={12}/> Visual Identity</label>
                                {isGeneratingAvatar && <span className="text-[10px] text-cyber-gold animate-pulse">Rendering...</span>}
                            </div>
                            <textarea 
                                className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white focus:border-cyber-gold outline-none resize-none mb-2"
                                rows={2}
                                placeholder="Describe looks (e.g. 'Cyberpunk street vendor with neon glasses')..."
                                value={visualDesc}
                                onChange={(e) => setVisualDesc(e.target.value)}
                            />
                            <div className="flex gap-2 mb-2">
                                <button onClick={() => setImageQuality('fast')} className={`flex-1 py-1 text-[10px] rounded uppercase font-bold border ${imageQuality === 'fast' ? 'bg-cyber-gold text-black border-cyber-gold' : 'text-gray-500 border-gray-700'}`}>Fast Mode</button>
                                <button onClick={() => setImageQuality('detailed')} className={`flex-1 py-1 text-[10px] rounded uppercase font-bold border ${imageQuality === 'detailed' ? 'bg-cyber-purple text-white border-cyber-purple' : 'text-gray-500 border-gray-700'}`}>Pro Mode (HD)</button>
                            </div>
                            <button onClick={handleGenerateAvatar} disabled={isGeneratingAvatar || !visualDesc} className="w-full bg-white/5 hover:bg-cyber-gold hover:text-black text-xs text-gray-300 py-2 rounded flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                                {isGeneratingAvatar ? <RefreshCw className="animate-spin" size={12}/> : <Sparkles size={12}/>} Generate Neural Avatar
                            </button>
                        </div>

                        <div className="flex flex-col h-64 mb-6">
                           <label className="text-xs text-gray-400 uppercase font-bold mb-2">Field Notes</label>
                           <textarea className="flex-1 bg-black/40 border border-white/10 rounded-lg p-4 text-sm text-white focus:border-cyber-gold outline-none resize-none"
                              value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Enter raw observations and transaction details..." />
                        </div>
                    </div>
                )}

                {activeTab === 'MATRIX' && (
                    <div className="animate-fade-in max-w-4xl">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-2xl font-bold text-white uppercase tracking-tight">Behavioral Matrix</h3>
                                <p className="text-xs text-gray-400">Answer observed behaviors to determine archetype.</p>
                            </div>
                            
                            {calculatedArchetype && (
                                <div className={`px-4 py-2 rounded-lg border ${calculatedArchetype.details.bg.replace('bg-', 'border-')} bg-opacity-20 flex items-center gap-3`}>
                                    <div>
                                        <div className="text-[10px] uppercase text-gray-400 font-bold">Detected Archetype</div>
                                        <div className={`text-xl font-black uppercase ${calculatedArchetype.details.color}`}>{calculatedArchetype.details.label}</div>
                                    </div>
                                    <div className="text-right hidden sm:block">
                                        <div className="text-[9px] text-gray-500 uppercase">Analysis Confidence</div>
                                        <div className="text-white font-mono">{Math.floor(((Object.values(calculatedArchetype.counts) as number[]).reduce((a, b) => a + b, 0) / PSYCH_QUESTIONS.length) * 100)}%</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {calculatedArchetype && (
                            <div className="mb-6 bg-white/5 p-4 rounded-xl border-l-4 border-cyber-gold">
                                <h4 className="text-cyber-gold font-bold uppercase text-xs mb-2 flex items-center gap-2"><Zap size={14}/> Tactical Override</h4>
                                <p className="text-sm text-gray-300 italic mb-2">"{calculatedArchetype.details.desc}"</p>
                                <div className="grid grid-cols-2 gap-4 mt-3">
                                    <div className="bg-black/30 p-2 rounded">
                                        <span className="text-[10px] text-green-400 uppercase font-bold block mb-1">DO THIS</span>
                                        <span className="text-xs text-white">
                                            {calculatedArchetype.code === 'A' && "Show data charts. Compare prices. Be precise."}
                                            {calculatedArchetype.code === 'I' && "Focus on 'Now'. Use sensory words. create excitement."}
                                            {calculatedArchetype.code === 'S' && "Mention popular items. Show reviews. Build rapport."}
                                            {calculatedArchetype.code === 'C' && "Offer guarantees. Explain the process step-by-step."}
                                        </span>
                                    </div>
                                    <div className="bg-black/30 p-2 rounded">
                                        <span className="text-[10px] text-red-400 uppercase font-bold block mb-1">AVOID THIS</span>
                                        <span className="text-xs text-white">
                                            {calculatedArchetype.code === 'A' && "Vague claims. Emotional hype. Rushing them."}
                                            {calculatedArchetype.code === 'I' && "Too many details. Waiting too long. Boring facts."}
                                            {calculatedArchetype.code === 'S' && "Isolation. Dry facts. Being too aggressive."}
                                            {calculatedArchetype.code === 'C' && "Pressure tactics. Ambiguity. Sudden changes."}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <BehavioralMatrix scores={matrixAnswers} onAnswer={handleMatrixAnswer} />
                        
                        <div className="flex justify-end pt-6 border-t border-white/10">
                             <button onClick={handleAnalyze} disabled={isAnalyzing} className="bg-cyber-purple text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-cyber-purple/80 transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                                {isAnalyzing ? 'Processing...' : <><Brain size={18} /> Initialize Deep Psyche AI</>}
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'PSYCHOLOGY' && (
                    <div className="animate-fade-in">
                         {selectedCustomer.psychProfile ? (
                             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                 <div className="space-y-6">
                                     {/* ARCHETYPE CARD */}
                                     <div className="bg-cyber-panel border border-white/10 rounded-2xl p-6 relative overflow-hidden">
                                         <div className="absolute top-0 right-0 p-4 opacity-5"><Target size={150} /></div>
                                         <div className="flex items-center gap-3 mb-2">
                                             <span className="text-xs text-cyber-gold border border-cyber-gold px-2 py-1 rounded uppercase tracking-wider font-bold">Primary: {selectedCustomer.psychProfile.primary}</span>
                                             <span className="text-xs text-gray-500 border border-gray-600 px-2 py-1 rounded uppercase tracking-wider">Secondary: {selectedCustomer.psychProfile.secondary}</span>
                                         </div>
                                         <p className="text-gray-400 mt-4 leading-relaxed italic border-l-2 border-cyber-gold pl-4 text-lg">"{selectedCustomer.psychProfile.summary}"</p>
                                         
                                         {/* RPG STATS IN PROFILE */}
                                         {selectedCustomer.psychProfile.rpgStats && (
                                            <div className="mt-6 pt-6 border-t border-white/5 grid grid-cols-4 gap-2">
                                                <StatHex label="NEGO" value={selectedCustomer.psychProfile.rpgStats.negotiation} color="text-cyber-purple" />
                                                <StatHex label="INT" value={selectedCustomer.psychProfile.rpgStats.intellect} color="text-blue-400" />
                                                <StatHex label="PAT" value={selectedCustomer.psychProfile.rpgStats.patience} color="text-cyber-green" />
                                                <StatHex label="VOL" value={selectedCustomer.psychProfile.rpgStats.volatility} color="text-red-500" />
                                            </div>
                                         )}
                                     </div>

                                     {/* STRATEGY DECK */}
                                     <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                         <h4 className="text-sm font-bold text-gray-400 uppercase mb-4">Engagement Protocol</h4>
                                         <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-black/40 p-3 rounded-lg border border-white/5">
                                                    <span className="text-[10px] text-gray-500 uppercase font-bold">Tone</span>
                                                    <div className="text-cyber-green text-sm">{selectedCustomer.psychProfile.interactionStrategy.tone}</div>
                                                </div>
                                                <div className="bg-black/40 p-3 rounded-lg border border-white/5">
                                                    <span className="text-[10px] text-gray-500 uppercase font-bold">Anchor</span>
                                                    <div className="text-cyber-gold text-sm">{selectedCustomer.psychProfile.interactionStrategy.persuasionAnchor}</div>
                                                </div>
                                            </div>
                                             
                                             <div className="p-4 bg-cyber-green/10 border-l-2 border-cyber-green">
                                                 <span className="text-xs font-bold text-cyber-green uppercase block mb-1">STABILISE WITH</span>
                                                 <ul className="list-disc list-inside text-sm text-gray-300">
                                                    {selectedCustomer.psychProfile.interactionStrategy.stabiliseWith.map((s, i) => <li key={i}>{s}</li>)}
                                                 </ul>
                                             </div>
                                             <div className="p-4 bg-cyber-red/10 border-l-2 border-cyber-red">
                                                 <span className="text-xs font-bold text-cyber-red uppercase block mb-1">AVOID</span>
                                                 <ul className="list-disc list-inside text-sm text-gray-300">
                                                    {selectedCustomer.psychProfile.interactionStrategy.avoid.map((s, i) => <li key={i}>{s}</li>)}
                                                 </ul>
                                             </div>
                                         </div>
                                     </div>
                                 </div>

                                 <div className="space-y-6">
                                     <div className="bg-black/40 border border-white/10 rounded-2xl p-6">
                                        <h4 className="text-sm font-bold text-gray-400 uppercase mb-4 flex items-center gap-2"><Activity size={14}/> Cognitive Matrix</h4>
                                        <div className="space-y-4">
                                            <div className="bg-gray-800/50 rounded-lg p-3 flex justify-between items-center">
                                                <span className="text-xs text-gray-400 uppercase font-bold">Abstraction</span>
                                                <span className="text-sm font-mono font-bold text-cyber-purple">{selectedCustomer.psychProfile.cognitive.abstraction}</span>
                                            </div>
                                            <div className="bg-gray-800/50 rounded-lg p-3 flex justify-between items-center">
                                                <span className="text-xs text-gray-400 uppercase font-bold">Tempo</span>
                                                <span className="text-sm font-mono font-bold text-cyber-gold">{selectedCustomer.psychProfile.cognitive.tempo}</span>
                                            </div>
                                            <div className="bg-gray-800/50 rounded-lg p-3 flex justify-between items-center">
                                                <span className="text-xs text-gray-400 uppercase font-bold">Friction Aversion</span>
                                                <span className={`text-sm font-mono font-bold ${selectedCustomer.psychProfile.cognitive.frictionAversion > 70 ? 'text-cyber-red' : 'text-cyber-green'}`}>
                                                    {selectedCustomer.psychProfile.cognitive.frictionAversion}/100
                                                </span>
                                            </div>
                                        </div>
                                     </div>
                                     
                                     {selectedCustomer.psychProfile.lifecycle && (
                                         <div className="bg-black/40 border border-white/10 rounded-2xl p-6 flex justify-between items-center">
                                             <div>
                                                 <p className="text-xs text-gray-500 uppercase font-bold">Predicted Next Visit</p>
                                                 <p className="text-white font-mono">{selectedCustomer.psychProfile.lifecycle.predictedNextPurchase}</p>
                                             </div>
                                             <Clock className="text-cyber-gold" />
                                         </div>
                                     )}
                                 </div>
                             </div>
                         ) : (
                             <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50">
                                 <Brain size={64} className="mb-4"/>
                                 <p>Archetype Engine Offline</p>
                                 <p className="text-sm">Complete Matrix & Initialize</p>
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