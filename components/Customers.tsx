import React, { useState, useEffect } from 'react';
import { Customer, AssessmentData } from '../types';
import { analyzeCustomerProfile, generateAvatar } from '../services/geminiService';
import { useData } from '../DataContext';
import { 
    User, Sparkles, X, Activity, Shield, Heart, DollarSign, 
    Edit3, Save, Brain, FileText, BarChart2, AlertTriangle, Zap, Target, Lock, Eye, Clock, TrendingUp, ChevronRight, ChevronLeft, Camera, RefreshCw
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

// --- 10-POINT BEHAVIORAL INTERROGATION ---
const AssessmentForm = ({ data, onChange }: { data: AssessmentData, onChange: (d: AssessmentData) => void }) => {
    const update = (key: keyof AssessmentData, val: any) => onChange({ ...data, [key]: val });

    const InputField = ({ label, field, placeholder }: { label: string, field: keyof AssessmentData, placeholder?: string }) => (
        <div className="flex flex-col">
            <label className="text-[10px] uppercase font-bold text-gray-500 mb-1">{label}</label>
            <input 
                className="bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-cyber-gold outline-none"
                value={data[field] as string}
                onChange={e => update(field, e.target.value)}
                placeholder={placeholder}
            />
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
                    <InputField label="1. Default Behavior" field="defaultBehavior" placeholder="e.g. Guarded, Chatty, Rushed" />
                    <InputField label="2. Unexpected Reaction" field="unexpectedReaction" placeholder="How do they react to surprise?" />
                    <InputField label="3. Disagreement Style" field="disagreementStyle" placeholder="Silent, Argumentative, Passive?" />
                    <InputField label="4. Control Focus" field="controlFocus" placeholder="What do they try to control?" />
                    <InputField label="5. Avoidance" field="avoidance" placeholder="What do they avoid discussing?" />
                </div>

                <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-3">
                    <h4 className="text-cyber-purple font-bold uppercase text-xs flex items-center gap-2"><Brain size={14}/> Cognitive Drivers</h4>
                    <InputField label="6. Focus Object" field="focusObject" placeholder="Price, Quality, Status, Speed?" />
                    <InputField label="7. Response Speed" field="responseSpeed" placeholder="Instant, Hesitant, Calculated?" />
                    <InputField label="8. Frustration Trigger" field="frustrationTrigger" placeholder="Waiting, Ambiguity, Being corrected?" />
                    <InputField label="9. Calming Trigger" field="calmingTrigger" placeholder="Facts, Empathy, Options?" />
                    <InputField label="10. Core Drive" field="coreDrive" placeholder="Efficiency, Power, Reassurance?" />
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

// --- RISK RADAR COMPONENT ---
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

// --- LTV SIMULATOR ---
const LTVSimulator = ({ customer }: { customer: Customer }) => {
    const [discountSim, setDiscountSim] = useState(0);

    const txCount = customer.transactionHistory.length;
    const totalSpent = customer.totalSpent;
    const avgOrder = txCount > 0 ? totalSpent / txCount : 0;
    
    // Simple Approximation of frequency (Tx per month)
    const firstTx = customer.transactionHistory.length > 0 ? new Date(customer.transactionHistory[0].timestamp) : new Date();
    const daysSinceFirst = Math.max(1, (new Date().getTime() - firstTx.getTime()) / (1000 * 3600 * 24));
    const freqPerYear = txCount > 0 ? (txCount / daysSinceFirst) * 365 : 0;
    
    const retentionBase = customer.psychProfile?.lifecycle?.retentionFactor || 1.0;
    
    // Simulation Logic
    const simRetention = retentionBase * (1 + (discountSim / 100) * 1.5); // 10% discount = 15% retention boost
    const simAvgOrder = avgOrder * (1 - (discountSim / 100)); // 10% discount = 10% less revenue per tx
    
    const currentLTVProjection = avgOrder * freqPerYear * retentionBase; // 1 Year forward
    const simulatedLTVProjection = simAvgOrder * freqPerYear * simRetention;

    return (
        <div className="bg-cyber-panel border border-white/10 rounded-2xl p-6 mt-6 animate-fade-in">
             <div className="flex items-center gap-2 mb-4 text-cyber-green">
                 <TrendingUp size={20} />
                 <h3 className="font-bold uppercase tracking-wider text-sm">Lifetime Value Predictor</h3>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                 <div>
                     <p className="text-xs text-gray-500 uppercase font-bold mb-1">Current 1-Year Projection</p>
                     <p className="text-3xl font-mono text-white">${currentLTVProjection.toFixed(0)}</p>
                     <p className="text-[10px] text-gray-500">Based on ${avgOrder.toFixed(0)} avg order × {freqPerYear.toFixed(1)} visits/yr</p>
                 </div>
                 <div>
                     <p className="text-xs text-gray-500 uppercase font-bold mb-1">Retention Factor (AI)</p>
                     <p className={`text-3xl font-mono ${retentionBase >= 1 ? 'text-cyber-green' : 'text-cyber-red'}`}>
                         {retentionBase.toFixed(2)}x
                     </p>
                     <p className="text-[10px] text-gray-500">
                        Churn Risk: {customer.psychProfile?.lifecycle?.churnProbability}%
                     </p>
                 </div>
             </div>

             <div className="bg-black/40 rounded-xl p-4 border border-white/5">
                 <div className="flex justify-between items-center mb-4">
                     <span className="text-xs font-bold text-cyber-gold uppercase">Discount Strategy Simulator</span>
                     <span className="text-cyber-gold font-mono">{discountSim}% Offer</span>
                 </div>
                 <input 
                    type="range" min="0" max="25" step="5" 
                    value={discountSim} 
                    onChange={e => setDiscountSim(parseInt(e.target.value))}
                    className="w-full accent-cyber-gold h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer mb-4"
                 />
                 
                 <div className="flex justify-between items-center">
                     <div>
                         <span className="block text-[10px] text-gray-500 uppercase">Projected LTV Impact</span>
                         <span className={`text-xl font-mono font-bold ${simulatedLTVProjection > currentLTVProjection ? 'text-cyber-green' : 'text-cyber-red'}`}>
                             ${simulatedLTVProjection.toFixed(0)} 
                             <span className="text-xs ml-1 opacity-70">
                                 ({simulatedLTVProjection > currentLTVProjection ? '+' : ''}
                                 {(simulatedLTVProjection - currentLTVProjection).toFixed(0)})
                             </span>
                         </span>
                     </div>
                     <div className="text-right">
                         <span className="block text-[10px] text-gray-500 uppercase">Retention Boost</span>
                         <span className="text-cyber-purple font-mono font-bold">
                             +{( (simRetention - retentionBase) / retentionBase * 100).toFixed(0)}%
                         </span>
                     </div>
                 </div>
             </div>
        </div>
    );
}

// --- SWIPEABLE CARD COMPONENT ---
interface SwipeableCardProps {
    children: React.ReactNode;
    onSwipeLeft: () => void;
    onSwipeRight: () => void;
    onClick: () => void;
}

const SwipeableCustomerCard: React.FC<SwipeableCardProps> = ({ children, onSwipeLeft, onSwipeRight, onClick }) => {
    const [offset, setOffset] = useState(0);
    const [startX, setStartX] = useState(0);
    const [startY, setStartY] = useState(0);
    const [swiping, setSwiping] = useState(false);
    const [bgAction, setBgAction] = useState<'NONE' | 'LEFT' | 'RIGHT'>('NONE');

    const handleTouchStart = (e: React.TouchEvent) => {
        setStartX(e.targetTouches[0].clientX);
        setStartY(e.targetTouches[0].clientY);
        setSwiping(false);
        setBgAction('NONE');
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!startX) return;
        const currentX = e.targetTouches[0].clientX;
        const currentY = e.targetTouches[0].clientY;
        const diffX = currentX - startX;
        const diffY = currentY - startY;

        // Check for primarily horizontal movement
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10) {
            setSwiping(true);
            const constrainedOffset = Math.max(-150, Math.min(150, diffX));
            setOffset(constrainedOffset);

            // Visual indicator
            if (constrainedOffset > 50) setBgAction('RIGHT'); // Add Note
            else if (constrainedOffset < -50) setBgAction('LEFT'); // View Profile
            else setBgAction('NONE');
        }
    };

    const handleTouchEnd = () => {
        if (offset > 100) {
            onSwipeRight();
        } else if (offset < -100) {
            onSwipeLeft();
        } else if (!swiping && Math.abs(offset) < 5) {
            onClick();
        }
        setOffset(0);
        setStartX(0);
        setSwiping(false);
        setBgAction('NONE');
    };

    return (
        <div 
            className="relative w-full rounded-xl overflow-hidden cursor-pointer bg-cyber-panel border border-white/5 select-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onClick={!swiping ? onClick : undefined}
        >
            {/* Background Action Layers */}
            <div className={`absolute inset-0 flex items-center justify-between px-6 transition-colors duration-300 ${
                bgAction === 'RIGHT' ? 'bg-cyber-green' : 
                bgAction === 'LEFT' ? 'bg-cyber-purple' : 'bg-transparent'
            }`}>
                <div className={`flex items-center gap-2 font-bold text-black transition-opacity duration-300 ${bgAction === 'RIGHT' ? 'opacity-100' : 'opacity-0'}`}>
                    <Edit3 size={20} /> Add Note
                </div>
                <div className={`flex items-center gap-2 font-bold text-white transition-opacity duration-300 ${bgAction === 'LEFT' ? 'opacity-100' : 'opacity-0'}`}>
                    View Profile <Brain size={20} />
                </div>
            </div>

            {/* Foreground Content */}
            <div 
                className="relative bg-cyber-panel p-4 transition-transform duration-150 ease-out h-full border border-white/5 hover:border-cyber-gold/30 rounded-xl"
                style={{ transform: `translateX(${offset}px)` }}
            >
                {children}
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
    
    const customerToAnalyze = { ...selectedCustomer, assessmentData: assessmentForm, notes: editNotes };
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
    addNotification("Constructing neural identity...", 'INFO');
    
    const base64Image = await generateAvatar(visualDesc);
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

  const getTierColor = (spent: number) => {
    if (spent > 5000) return 'text-purple-400 border-purple-400';
    if (spent > 1000) return 'text-cyber-gold border-cyber-gold';
    return 'text-gray-400 border-gray-600';
  };

  const handleSwipeLeft = (c: Customer) => {
      setSelectedCustomer(c);
      setActiveTab('PSYCHOLOGY');
  };

  const handleSwipeRight = (c: Customer) => {
      setSelectedCustomer(c);
      setActiveTab('OVERVIEW');
  };

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {customers.map(c => (
          <SwipeableCustomerCard 
            key={c.id} 
            onClick={() => { setSelectedCustomer(c); setActiveTab('OVERVIEW'); }}
            onSwipeLeft={() => handleSwipeLeft(c)}
            onSwipeRight={() => handleSwipeRight(c)}
          >
            <div className="flex items-center gap-3">
              {c.avatarImage ? (
                  <img src={c.avatarImage} alt="Avatar" className="w-12 h-12 rounded-full border-2 border-cyber-gold object-cover" />
              ) : (
                  <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-bold text-lg ${getTierColor(c.totalSpent)}`}>
                    {c.name.charAt(0)}
                  </div>
              )}
              
              <div>
                <h3 className="text-white font-bold">{c.name}</h3>
                <p className="text-xs text-gray-500">Last: {new Date(c.lastPurchase).toLocaleDateString()}</p>
              </div>
              <div className="ml-auto text-right">
                <span className="block text-cyber-green font-mono">${c.totalSpent.toFixed(0)}</span>
              </div>
            </div>
            {c.psychProfile && (
              <div className="mt-3 flex gap-2">
                 <div className="text-[10px] text-cyber-purple bg-cyber-purple/10 border border-cyber-purple/20 px-2 py-0.5 rounded uppercase tracking-wider">{c.psychProfile.primary}</div>
                 {c.assessmentData && c.assessmentData.riskScore > 7 && <div className="text-[10px] text-red-500 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded uppercase flex items-center gap-1"><AlertTriangle size={8}/> Risk</div>}
              </div>
            )}
          </SwipeableCustomerCard>
        ))}
      </div>

      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#0a0a0a] w-full max-w-6xl h-[90vh] rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex overflow-hidden">
            
            {/* SIDEBAR */}
            <div className="w-64 bg-white/5 border-r border-white/5 flex flex-col p-6">
                <div className="flex flex-col items-center text-center mb-8 relative">
                    {selectedCustomer.avatarImage ? (
                        <div className="relative group cursor-pointer">
                            <img src={selectedCustomer.avatarImage} className="w-24 h-24 rounded-full border-2 border-cyber-gold mb-4 object-cover shadow-[0_0_15px_rgba(212,175,55,0.3)]" />
                            <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-xs text-white">Edit</span>
                            </div>
                        </div>
                    ) : (
                        <div className="w-24 h-24 rounded-full bg-gradient-to-b from-gray-700 to-black border-2 border-cyber-gold mb-4 flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.3)]">
                            <User size={32} className="text-gray-500" />
                        </div>
                    )}
                    
                    <h2 className="text-xl font-bold text-white mb-1">{selectedCustomer.name}</h2>
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
                    <div className="animate-fade-in max-w-3xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-white uppercase tracking-tight">Field Overview</h3>
                            <button onClick={saveAssessment} className="text-xs flex items-center gap-1 text-cyber-green hover:text-white bg-white/5 px-3 py-1 rounded-full"><Save size={12} /> Save Changes</button>
                        </div>
                        
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
                            
                            {/* VISUAL IDENTITY GENERATOR */}
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
                                         
                                         <div className="flex gap-2 mt-6">
                                             {selectedCustomer.psychProfile.drives.map(d => (
                                                 <span key={d} className="bg-white/10 text-xs px-2 py-1 rounded text-white flex items-center gap-1"><Zap size={10}/> {d}</span>
                                             ))}
                                             {selectedCustomer.psychProfile.insecurity.map(i => (
                                                 <span key={i} className="bg-red-500/10 text-xs px-2 py-1 rounded text-red-400 flex items-center gap-1"><Lock size={10}/> {i}</span>
                                             ))}
                                         </div>
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
                                            <MatrixBar label="Abstraction" value={selectedCustomer.psychProfile.cognitive.abstraction} color="text-cyber-purple" />
                                            <MatrixBar label="Cognitive Tempo" value={selectedCustomer.psychProfile.cognitive.tempo} color="text-cyber-gold" />
                                            <div className="bg-gray-800/50 rounded-lg p-3 flex justify-between items-center">
                                                <span className="text-xs text-gray-400 uppercase font-bold">Friction Aversion</span>
                                                <span className={`text-sm font-mono font-bold ${selectedCustomer.psychProfile.cognitive.frictionAversion > 70 ? 'text-cyber-red' : 'text-cyber-green'}`}>
                                                    {selectedCustomer.psychProfile.cognitive.frictionAversion}/100
                                                </span>
                                            </div>
                                        </div>
                                     </div>
                                     
                                     {/* RADAR CHART */}
                                     {selectedCustomer.assessmentData && <RiskRadar assessment={selectedCustomer.assessmentData} />}
                                     
                                     {/* NEW: LTV SIMULATOR */}
                                     <LTVSimulator customer={selectedCustomer} />
                                     
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

const MatrixBar = ({ label, value, color }: { label: string, value: string, color: string }) => (
    <div className="bg-gray-800/50 rounded-lg p-3 flex justify-between items-center">
        <span className="text-xs text-gray-400 uppercase font-bold">{label}</span>
        <span className={`text-sm font-mono font-bold ${color}`}>{value}</span>
    </div>
);

export default Customers;