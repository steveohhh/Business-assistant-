import React, { useState, useEffect } from 'react';
import { Customer, AssessmentData, MicroSignal, SituationalEncounter } from '../types';
import { analyzeCustomerProfile, generateAvatar } from '../services/geminiService';
import { useData } from '../DataContext';
import { 
    User, Sparkles, X, Activity, Shield, Heart, DollarSign, 
    Edit3, Save, Brain, FileText, BarChart2, AlertTriangle, Zap, Target, Lock, Eye, Clock, TrendingUp, ChevronRight, ChevronLeft, Camera, RefreshCw, Radio, PlusCircle, BookOpen, Layers
} from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';

interface CustomersProps {
  customers: Customer[];
  onAddCustomer: (c: Customer) => void;
  onUpdateCustomer: (c: Customer) => void;
}

const BEHAVIOR_TAGS = [
    "Haggles", "Big Spender", "Impulsive", "Chatty", "Rude", 
    "Knows Product", "Quick/Rush", "Gift Buyer", "Ask for Discount", "Cash Only"
];

// --- ASSESSMENT OPTIONS DICTIONARY ---
const ASSESSMENT_OPTIONS = {
    defaultBehavior: ["Guarded", "Chatty", "Rushed", "Relaxed", "Anxious", "Dominant", "Passive"],
    unexpectedReaction: ["Freeze", "Aggression", "Curiosity", "Indifference", "Humor", "Suspicion"],
    disagreementStyle: ["Argumentative", "Passive-Aggressive", "Silent", "Diplomatic", "Yielding"],
    controlFocus: ["Price", "Quality", "Time", "Environment", "Process", "None"],
    avoidance: ["Personal Info", "Money talk", "Eye Contact", "Commitment", "Small Talk"],
    focusObject: ["Product Visuals", "Scent/Smell", "Numbers/Stats", "Status/Brand", "Relationship", "Efficiency"],
    responseSpeed: ["Instant", "Calculated", "Hesitant", "Erratic", "Slow"],
    frustrationTrigger: ["Waiting", "Confusion", "Being Corrected", "High Prices", "No Stock", "Ambiguity"],
    calmingTrigger: ["Reassurance", "Data/Facts", "Discount", "Empathy", "Space", "Options"],
    coreDrive: ["Security", "Significance", "Efficiency", "Connection", "Variety", "Growth"]
};

// --- RPG STAT BAR COMPONENT ---
const StatBar = ({ label, value, color }: { label: string, value: number, color: string }) => (
    <div className="mb-2">
        <div className="flex justify-between text-[10px] uppercase font-bold mb-1">
            <span className="text-gray-400">{label}</span>
            <span className={color}>{value}/100</span>
        </div>
        <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
            <div 
                className={`h-full ${color.replace('text-', 'bg-')} transition-all duration-1000 ease-out`} 
                style={{ width: `${value}%` }}
            ></div>
        </div>
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
                <textarea 
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-xs text-white focus:border-cyber-gold outline-none"
                    placeholder="Context: What happened? (e.g. 'I denied a discount', 'Police drove by')"
                    rows={2}
                    value={situation}
                    onChange={e => setSituation(e.target.value)}
                />
                <textarea 
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-xs text-white focus:border-cyber-gold outline-none"
                    placeholder="Reaction: How did they act? (e.g. 'Got angry then apologized', 'Stayed silent')"
                    rows={2}
                    value={reaction}
                    onChange={e => setReaction(e.target.value)}
                />
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

            <div className="space-y-2 max-h-40 overflow-y-auto">
                {customer.encounters && customer.encounters.slice().reverse().map(e => (
                    <div key={e.id} className="bg-white/5 p-3 rounded border border-white/5 text-xs">
                        <div className="flex justify-between mb-1">
                            <span className="text-gray-500">{new Date(e.timestamp).toLocaleDateString()}</span>
                            <span className={`font-bold ${e.outcome === 'POSITIVE' ? 'text-cyber-green' : e.outcome === 'NEGATIVE' ? 'text-red-500' : 'text-gray-400'}`}>{e.outcome}</span>
                        </div>
                        <div className="text-white mb-1"><span className="text-cyber-gold">CTX:</span> {e.situation}</div>
                        <div className="text-gray-300"><span className="text-cyber-purple">RXN:</span> {e.reaction}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- 10-POINT BEHAVIORAL INTERROGATION ---
const AssessmentForm = ({ data, onChange }: { data: AssessmentData, onChange: (d: AssessmentData) => void }) => {
    const update = (key: keyof AssessmentData, val: any) => onChange({ ...data, [key]: val });

    const SelectField = ({ label, field, options }: { label: string, field: keyof AssessmentData, options: string[] }) => (
        <div className="flex flex-col">
            <label className="text-[10px] uppercase font-bold text-gray-500 mb-1">{label}</label>
            <select 
                className="bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-cyber-gold outline-none appearance-none"
                value={data[field] as string}
                onChange={e => update(field, e.target.value)}
            >
                <option value="">-- Select --</option>
                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
        </div>
    );

    const ScoreField = ({ label, field }: { label: string, field: keyof AssessmentData }) => (
         <div className="flex flex-col">
            <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 flex justify-between">
                <span>{label}</span>
                <span className="text-cyber-gold">{data[field]}</span>
            </label>
            <input 
                type="range" min="1" max="10"
                className="accent-cyber-gold h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                value={data[field] as number}
                onChange={e => update(field, parseInt(e.target.value))}
            />
        </div>
    );

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-3">
                    <h4 className="text-cyber-gold font-bold uppercase text-xs flex items-center gap-2"><Eye size={14}/> Observable Pattern</h4>
                    <SelectField label="1. Default Behavior" field="defaultBehavior" options={ASSESSMENT_OPTIONS.defaultBehavior} />
                    <SelectField label="2. Unexpected Reaction" field="unexpectedReaction" options={ASSESSMENT_OPTIONS.unexpectedReaction} />
                    <SelectField label="3. Disagreement Style" field="disagreementStyle" options={ASSESSMENT_OPTIONS.disagreementStyle} />
                    <SelectField label="4. Control Focus" field="controlFocus" options={ASSESSMENT_OPTIONS.controlFocus} />
                    <SelectField label="5. Avoidance" field="avoidance" options={ASSESSMENT_OPTIONS.avoidance} />
                </div>

                <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-3">
                    <h4 className="text-cyber-purple font-bold uppercase text-xs flex items-center gap-2"><Brain size={14}/> Cognitive Drivers</h4>
                    <SelectField label="6. Focus Object" field="focusObject" options={ASSESSMENT_OPTIONS.focusObject} />
                    <SelectField label="7. Response Speed" field="responseSpeed" options={ASSESSMENT_OPTIONS.responseSpeed} />
                    <SelectField label="8. Frustration Trigger" field="frustrationTrigger" options={ASSESSMENT_OPTIONS.frustrationTrigger} />
                    <SelectField label="9. Calming Trigger" field="calmingTrigger" options={ASSESSMENT_OPTIONS.calmingTrigger} />
                    <SelectField label="10. Core Drive" field="coreDrive" options={ASSESSMENT_OPTIONS.coreDrive} />
                </div>
            </div>

            <div className="bg-black/30 p-4 rounded-xl border border-white/5 grid grid-cols-3 gap-6">
                <ScoreField label="Impulsivity" field="impulsivityScore" />
                <ScoreField label="Loyalty" field="loyaltyScore" />
                <ScoreField label="Risk Factor" field="riskScore" />
            </div>
        </div>
    );
};

// --- LARGE HERO CARD ---
const HeroCustomerCard = ({ customer, onClick }: { customer: Customer, onClick: () => void }) => {
    return (
        <div onClick={onClick} className="bg-cyber-panel border border-white/10 rounded-2xl overflow-hidden cursor-pointer group hover:border-cyber-gold transition-all relative shadow-xl">
            {/* Image Area */}
            <div className="h-72 w-full relative">
                {customer.avatarImage ? (
                    <img src={customer.avatarImage} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-b from-gray-800 to-black flex items-center justify-center">
                        <User size={64} className="text-gray-600"/>
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                
                <div className="absolute bottom-4 left-4">
                    <h3 className="text-3xl font-black text-white uppercase tracking-tighter drop-shadow-lg">{customer.name}</h3>
                    <p className="text-cyber-gold font-bold text-xs uppercase tracking-widest drop-shadow-md">
                        Level {Math.floor(customer.totalSpent / 500) + 1} {customer.psychProfile?.primary || 'New Profile'}
                    </p>
                </div>
            </div>

            {/* Stats Area */}
            <div className="p-5 bg-black/60 backdrop-blur-sm border-t border-white/10">
                {customer.psychProfile?.rpgStats ? (
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                        <StatBar label="Negotiation" value={customer.psychProfile.rpgStats.negotiation} color="text-cyber-purple" />
                        <StatBar label="Intellect" value={customer.psychProfile.rpgStats.intellect} color="text-blue-400" />
                        <StatBar label="Patience" value={customer.psychProfile.rpgStats.patience} color="text-cyber-green" />
                        <StatBar label="Risk" value={customer.psychProfile.rpgStats.riskPerception} color="text-red-500" />
                    </div>
                ) : (
                    <div className="text-center py-4 text-gray-500 text-xs italic">
                        Initialize Psyche Engine for Stats
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
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'ASSESSMENT' | 'PSYCHOLOGY'>('OVERVIEW');
  
  // Creation State
  const [newName, setNewName] = useState('');
  
  // Editing State
  const [editNotes, setEditNotes] = useState('');
  const [visualDesc, setVisualDesc] = useState('');
  const [imageQuality, setImageQuality] = useState<'fast' | 'detailed'>('fast');
  const [assessmentForm, setAssessmentForm] = useState<AssessmentData | undefined>(undefined);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);

  useEffect(() => {
      if (selectedCustomer) {
          setEditNotes(selectedCustomer.notes || '');
          setVisualDesc(selectedCustomer.visualDescription || '');
          setAssessmentForm(selectedCustomer.assessmentData || {
              defaultBehavior: '', unexpectedReaction: '', disagreementStyle: '', controlFocus: '', avoidance: '',
              focusObject: '', responseSpeed: '', frustrationTrigger: '', calmingTrigger: '', coreDrive: '',
              impulsivityScore: 5, loyaltyScore: 5, riskScore: 1
          });
      }
  }, [selectedCustomer]);

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

  const saveAssessment = () => {
      if (!selectedCustomer || !assessmentForm) return;
      onUpdateCustomer({ 
          ...selectedCustomer, 
          assessmentData: assessmentForm, 
          notes: editNotes,
          visualDescription: visualDesc 
      });
      // Update local state to reflect changes immediately
      setSelectedCustomer(prev => prev ? ({ ...prev, assessmentData: assessmentForm, notes: editNotes, visualDescription: visualDesc }) : null);
  };

  const handleAnalyze = async () => {
    if (!selectedCustomer) return;
    saveAssessment(); 
    setIsAnalyzing(true);
    addNotification("Accessing psychology mainframe...", 'INFO');
    
    // Ensure we include micro-signals in the analysis payload
    const customerToAnalyze = { 
        ...selectedCustomer, 
        assessmentData: assessmentForm, 
        notes: editNotes,
        microSignals: selectedCustomer.microSignals || [],
        encounters: selectedCustomer.encounters || []
    };
    const profile = await analyzeCustomerProfile(customerToAnalyze, selectedCustomer.transactionHistory);
    setIsAnalyzing(false);
    
    if (profile) {
      const updated = { ...customerToAnalyze, psychProfile: profile };
      onUpdateCustomer(updated);
      setSelectedCustomer(updated);
      setActiveTab('PSYCHOLOGY');
      addNotification("Psych profile generation complete.", 'SUCCESS');
    } else {
      addNotification("Analysis failed. Check connection.", 'ERROR');
    }
  };

  const handleGenerateAvatar = async () => {
    if (!visualDesc) {
        addNotification("Please enter a visual description first.", 'WARNING');
        return;
    }
    setIsGeneratingAvatar(true);
    addNotification(`Constructing ${imageQuality} neural identity...`, 'INFO');
    
    const base64Image = await generateAvatar(visualDesc, imageQuality);
    setIsGeneratingAvatar(false);
    
    if (base64Image && selectedCustomer) {
        const updated = { ...selectedCustomer, avatarImage: base64Image, visualDescription: visualDesc };
        onUpdateCustomer(updated);
        setSelectedCustomer(updated);
        addNotification("Identity successfully generated.", 'SUCCESS');
    } else {
        addNotification("Failed to generate identity.", 'ERROR');
    }
  };

  const toggleTag = (tag: string) => {
    if (!selectedCustomer) return;
    const currentTags = selectedCustomer.tags || [];
    let newTags = currentTags.includes(tag) ? currentTags.filter(t => t !== tag) : [...currentTags, tag];
    const updated = { ...selectedCustomer, tags: newTags };
    onUpdateCustomer(updated);
    setSelectedCustomer(updated);
  };

  const handleAddEncounter = (encounter: SituationalEncounter) => {
      if (!selectedCustomer) return;
      const updatedEncounters = [...(selectedCustomer.encounters || []), encounter];
      const updated = { ...selectedCustomer, encounters: updatedEncounters };
      onUpdateCustomer(updated);
      setSelectedCustomer(updated);
      addNotification("Situational encounter logged.", 'SUCCESS');
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
            <div className="w-80 bg-white/5 border-r border-white/5 flex flex-col p-6 overflow-y-auto">
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
                        <FileText size={16} /> Overview
                    </button>
                    <button onClick={() => setActiveTab('ASSESSMENT')} className={`w-full text-left p-3 rounded-lg text-xs font-bold uppercase flex items-center gap-2 ${activeTab === 'ASSESSMENT' ? 'bg-cyber-gold text-black shadow-lg shadow-cyber-gold/20' : 'text-gray-400 hover:bg-white/5'}`}>
                        <Activity size={16} /> Interrogation Log
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
                        
                        {/* ENCOUNTER LOGGER (NEW) */}
                        <EncounterLogger 
                            customer={selectedCustomer} 
                            onAddEncounter={handleAddEncounter} 
                        />

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                            <div className="space-y-2">
                                <label className="text-xs text-gray-400 uppercase font-bold">Quick Observations</label>
                                <div className="flex flex-wrap gap-2">
                                    {BEHAVIOR_TAGS.map(tag => {
                                        const active = (selectedCustomer.tags || []).includes(tag);
                                        return (
                                            <button key={tag} onClick={() => toggleTag(tag)} className={`text-xs px-2 py-1 rounded border transition-all ${active ? 'bg-cyber-gold text-black border-cyber-gold font-bold' : 'bg-transparent text-gray-500 border-gray-700 hover:border-gray-500'}`}>
                                                {tag}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                            
                            {/* VISUAL IDENTITY GENERATOR (UPDATED) */}
                            <div className="bg-cyber-panel border border-white/10 rounded-xl p-4">
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
                                    <button 
                                        onClick={() => setImageQuality('fast')}
                                        className={`flex-1 py-1 text-[10px] rounded uppercase font-bold border ${imageQuality === 'fast' ? 'bg-cyber-gold text-black border-cyber-gold' : 'text-gray-500 border-gray-700'}`}
                                    >
                                        Fast Mode
                                    </button>
                                    <button 
                                        onClick={() => setImageQuality('detailed')}
                                        className={`flex-1 py-1 text-[10px] rounded uppercase font-bold border ${imageQuality === 'detailed' ? 'bg-cyber-purple text-white border-cyber-purple' : 'text-gray-500 border-gray-700'}`}
                                    >
                                        Pro Mode (HD)
                                    </button>
                                </div>
                                <button 
                                    onClick={handleGenerateAvatar}
                                    disabled={isGeneratingAvatar || !visualDesc}
                                    className="w-full bg-white/5 hover:bg-cyber-gold hover:text-black text-xs text-gray-300 py-2 rounded flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                >
                                    {isGeneratingAvatar ? <RefreshCw className="animate-spin" size={12}/> : <Sparkles size={12}/>}
                                    Generate Neural Avatar
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col h-64 mb-6">
                           <label className="text-xs text-gray-400 uppercase font-bold mb-2">Field Notes</label>
                           <textarea className="flex-1 bg-black/40 border border-white/10 rounded-lg p-4 text-sm text-white focus:border-cyber-gold outline-none resize-none"
                              value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Enter raw observations and transaction details..." />
                        </div>
                    </div>
                )}

                {activeTab === 'ASSESSMENT' && assessmentForm && (
                    <div className="animate-fade-in max-w-3xl">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-2xl font-bold text-white uppercase tracking-tight">Behavioral Interrogation</h3>
                                <p className="text-xs text-gray-400">Complete this log to initialize the Archetype Engine.</p>
                            </div>
                            <button onClick={handleAnalyze} disabled={isAnalyzing} className="bg-cyber-purple text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-cyber-purple/80 transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                                {isAnalyzing ? 'Processing...' : <><Brain size={18} /> Initialize Engine</>}
                            </button>
                        </div>
                        <AssessmentForm data={assessmentForm} onChange={setAssessmentForm} />
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
                                            <div className="mt-6 pt-6 border-t border-white/5 grid grid-cols-2 gap-4">
                                                <StatBar label="Negotiation" value={selectedCustomer.psychProfile.rpgStats.negotiation} color="text-cyber-purple" />
                                                <StatBar label="Intellect" value={selectedCustomer.psychProfile.rpgStats.intellect} color="text-blue-400" />
                                                <StatBar label="Patience" value={selectedCustomer.psychProfile.rpgStats.patience} color="text-cyber-green" />
                                                <StatBar label="Volatility" value={selectedCustomer.psychProfile.rpgStats.volatility} color="text-red-500" />
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
                                     
                                     {/* RADAR CHART */}
                                     {selectedCustomer.assessmentData && <div className="animate-fade-in"><RiskRadar assessment={selectedCustomer.assessmentData} /></div>}
                                     
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
                                 <p className="text-sm">Complete Interrogation & Initialize</p>
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

const RiskRadar = ({ assessment }: { assessment: AssessmentData }) => {
    const data = [
        { subject: 'Impulsivity', A: assessment.impulsivityScore, fullMark: 10 },
        { subject: 'Loyalty', A: assessment.loyaltyScore, fullMark: 10 },
        { subject: 'Risk', A: assessment.riskScore, fullMark: 10 },
        { subject: 'Engagement', A: (assessment.impulsivityScore + assessment.loyaltyScore) / 2, fullMark: 10 },
        { subject: 'Stability', A: 10 - assessment.riskScore, fullMark: 10 },
    ];

    return (
        <div className="bg-black/40 border border-white/10 rounded-2xl p-4 h-64 flex flex-col items-center justify-center relative">
            <h4 className="absolute top-4 left-4 text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                <Shield size={12} /> Behavioral Matrix
            </h4>
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                    <PolarGrid stroke="#333" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#666', fontSize: 10, fontWeight: 'bold' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                    <Radar
                        name="Subject"
                        dataKey="A"
                        stroke="#D4AF37"
                        strokeWidth={2}
                        fill="#D4AF37"
                        fillOpacity={0.3}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default Customers;