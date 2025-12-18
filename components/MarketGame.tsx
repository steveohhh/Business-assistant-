
import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { TrendingUp, TrendingDown, DollarSign, Users, Globe, Wifi, Activity, Zap, Lock, Unlock, Trophy, AlertTriangle, Play, Pause, ShieldCheck, Copy, Terminal, CheckCircle2, XCircle, Settings, Link as LinkIcon, Database } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';
import { initSupabase, signInAnonymously, subscribeToLeaderboard, updateProfileStats, HARDCODED_SUPABASE_URL, HARDCODED_SUPABASE_KEY } from '../services/supabaseService';

interface MarketItem {
    id: string;
    name: string;
    symbol: string;
    price: number;
    history: { time: number, price: number }[];
    volatility: number; // 0.0 to 1.0
    trend: 'UP' | 'DOWN' | 'STABLE';
}

interface Rival {
    id: string;
    name: string;
    netWorth: number;
    status: 'Buying' | 'Selling' | 'Holding' | 'Active';
    avatarColor: string;
    isVerified: boolean; // AUDIT SYSTEM
    reputation: number;
}

const INITIAL_ITEMS: MarketItem[] = [
    { id: '1', name: 'Neuro-Chips', symbol: 'NCHP', price: 120, history: [], volatility: 0.05, trend: 'STABLE' },
    { id: '2', name: 'Raw Lithium', symbol: 'LITH', price: 45, history: [], volatility: 0.02, trend: 'STABLE' },
    { id: '3', name: 'Dark Fibre', symbol: 'DARK', price: 300, history: [], volatility: 0.15, trend: 'STABLE' },
    { id: '4', name: 'Bio-Synth', symbol: 'BIO', price: 85, history: [], volatility: 0.08, trend: 'STABLE' }
];

const RIVAL_NAMES = ['NeonViper', 'Kira_88', 'NullPointer', 'Ghost_Shell', 'Data_Wraith', 'Cyber_Monk'];

const MarketGame: React.FC = () => {
    const { financials, updateFinancials, addNotification, settings, updateSettings, batches } = useAppStore(state => ({
        financials: state.financials,
        updateFinancials: state.updateFinancials,
        addNotification: state.addNotification,
        settings: state.settings,
        updateSettings: state.updateSettings,
        batches: state.batches,
    }));
    const [connected, setConnected] = useState(false);
    const [items, setItems] = useState<MarketItem[]>(INITIAL_ITEMS);
    const [rivals, setRivals] = useState<Rival[]>([]);
    const [portfolio, setPortfolio] = useState<Record<string, number>>({}); 
    const [selectedItem, setSelectedItem] = useState<string>(INITIAL_ITEMS[0].id);
    const [buyAmount, setBuyAmount] = useState(1);
    const [showAuditModal, setShowAuditModal] = useState(false);
    const [isAuditing, setIsAuditing] = useState(false);
    
    // ONLINE MULTIPLAYER STATE
    const [showNetworkConfig, setShowNetworkConfig] = useState(false);
    const [isOnline, setIsOnline] = useState(false);
    const [supabaseUrl, setSupabaseUrl] = useState(HARDCODED_SUPABASE_URL);
    const [supabaseKey, setSupabaseKey] = useState(HARDCODED_SUPABASE_KEY);
    const [authLoading, setAuthLoading] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string>('');

    // Game Loop Refs
    const intervalRef = useRef<number | null>(null);
    const syncIntervalRef = useRef<number | null>(null);
    const tickCount = useRef(0);
    const hasAutoConnected = useRef(false);
    
    // Use refs for current values in intervals
    const financialsRef = useRef(financials);
    const portfolioRef = useRef(portfolio);
    const itemsRef = useRef(items);
    const batchesRef = useRef(batches);

    useEffect(() => { financialsRef.current = financials; }, [financials]);
    useEffect(() => { portfolioRef.current = portfolio; }, [portfolio]);
    useEffect(() => { itemsRef.current = items; }, [items]);
    useEffect(() => { batchesRef.current = batches; }, [batches]);

    // --- AUTO CONNECT LOGIC ---
    useEffect(() => {
        if (HARDCODED_SUPABASE_URL && HARDCODED_SUPABASE_KEY && !isOnline && !hasAutoConnected.current) {
            hasAutoConnected.current = true;
            handleConnectOnline();
        }
    }, []);

    // --- CONNECTION SIMULATION (Offline Mode) ---
    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout>;
        if (!connected && !isOnline) {
            const generateRivals = () => {
                const newRivals = RIVAL_NAMES.map((name, i) => ({
                    id: `rival-${i}`,
                    name,
                    netWorth: 1000 + Math.random() * 20000,
                    status: 'Holding' as const,
                    avatarColor: ['#EF4444', '#10B981', '#3B82F6', '#D4AF37', '#8B5CF6'][i % 5],
                    isVerified: Math.random() > 0.6,
                    reputation: Math.floor(Math.random() * 1000)
                }));
                setRivals(newRivals.sort((a,b) => b.netWorth - a.netWorth));
            };

            timeout = setTimeout(() => {
                generateRivals();
                setConnected(true);
                if (!HARDCODED_SUPABASE_URL) {
                    addNotification("Local Network: Uplink Established.", "SUCCESS");
                }
            }, 2000);
        }
        return () => clearTimeout(timeout);
    }, [connected, isOnline]);

    // --- MARKET ENGINE ---
    useEffect(() => {
        if (!connected) return;

        const updateMarket = () => {
            tickCount.current += 1;

            // 1. Update Prices
            setItems(prev => prev.map(item => {
                const changePercent = (Math.random() - 0.5) * 2 * item.volatility;
                let newPrice = item.price * (1 + changePercent);
                newPrice = Math.max(1, newPrice); 

                const newHistory = [...item.history, { time: tickCount.current, price: newPrice }].slice(-20);
                
                return {
                    ...item,
                    price: newPrice,
                    history: newHistory,
                    trend: newPrice > item.price ? 'UP' : newPrice < item.price ? 'DOWN' : 'STABLE'
                };
            }));

            // 2. Update Rivals (Only in Offline Simulation)
            if (!isOnline) {
                setRivals(prev => prev.map(r => {
                    const actionRoll = Math.random();
                    let status: 'Buying' | 'Selling' | 'Holding' = 'Holding';
                    let worthChange = 0;

                    if (actionRoll > 0.8) {
                        status = 'Buying';
                        worthChange = -(Math.random() * 50); 
                    } else if (actionRoll < 0.2) {
                        status = 'Selling';
                        worthChange = Math.random() * 100;
                    } else {
                        worthChange = (Math.random() - 0.4) * 20;
                    }

                    return {
                        ...r,
                        netWorth: Math.max(0, r.netWorth + worthChange),
                        status
                    };
                }).sort((a,b) => b.netWorth - a.netWorth));
            }
        };

        intervalRef.current = window.setInterval(updateMarket, 2000); 
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [connected, isOnline]);

    // --- REAL MULTIPLAYER LOGIC ---
    const handleConnectOnline = async () => {
        const urlToUse = supabaseUrl || HARDCODED_SUPABASE_URL;
        const keyToUse = supabaseKey || HARDCODED_SUPABASE_KEY;

        if (!urlToUse || !keyToUse) {
            if (!hasAutoConnected.current) addNotification("Missing Network Credentials", "ERROR");
            return;
        }
        setAuthLoading(true);
        const sb = initSupabase(urlToUse, keyToUse);
        if (sb) {
            const user = await signInAnonymously();
            if (user) {
                setCurrentUserId(user.id);
                setIsOnline(true);
                setConnected(true); // Ensure main UI renders
                setShowNetworkConfig(false);
                addNotification("SECURE UPLINK ESTABLISHED. LIVE TRADING ACTIVE.", "SUCCESS");
                
                // 1. Subscribe to Live Leaderboard
                subscribeToLeaderboard((profiles: any[]) => {
                    const mappedRivals = profiles
                        .filter((p: any) => p.id !== user.id) // Filter out SELF so we don't duplicate
                        .map((p: any) => ({
                            id: p.id,
                            name: p.username || 'Unknown',
                            netWorth: p.net_worth,
                            status: 'Active' as const, // Real status would require more backend logic
                            avatarColor: p.avatar_color || '#333',
                            isVerified: p.is_verified,
                            reputation: p.reputation_score
                        }));
                    setRivals(mappedRivals);
                });

                // 2. Start Syncing My Stats
                syncIntervalRef.current = window.setInterval(() => {
                    // Calculate TRUE NET WORTH:
                    // Liquid Cash + Bank + Market Items Value + Physical Inventory Value
                    const cash = financialsRef.current.cashOnHand + financialsRef.current.bankBalance;
                    
                    const marketValue = itemsRef.current.reduce((acc, item) => {
                        return acc + (item.price * (portfolioRef.current[item.id] || 0));
                    }, 0);

                    // Inventory Value (Cost Basis)
                    const stockValue = batchesRef.current.reduce((acc, batch) => {
                        return acc + (batch.currentStock * batch.trueCostPerGram);
                    }, 0);

                    const totalNetWorth = cash + marketValue + stockValue;

                    updateProfileStats(totalNetWorth, settings.reputationScore, settings.auditLevel === 'VERIFIED', settings.operatorAlias);
                }, 5000); // Sync every 5 seconds

            } else {
                addNotification("Authentication Handshake Failed.", "ERROR");
            }
        }
        setAuthLoading(false);
    };

    useEffect(() => {
        return () => {
            if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
        }
    }, []);

    // --- PLAYER ACTIONS ---
    const handleBuy = () => {
        const item = items.find(i => i.id === selectedItem);
        if (!item) return;

        const totalCost = item.price * buyAmount;
        if (financials.cashOnHand >= totalCost) {
            updateFinancials({
                ...financials,
                cashOnHand: financials.cashOnHand - totalCost
            });
            setPortfolio(prev => ({
                ...prev,
                [item.id]: (prev[item.id] || 0) + buyAmount
            }));
            addNotification(`Acquired ${buyAmount}x ${item.symbol}`, "SUCCESS");
        } else {
            addNotification("Insufficient Liquid Funds", "ERROR");
        }
    };

    const handleSell = () => {
        const item = items.find(i => i.id === selectedItem);
        if (!item) return;

        const currentQty = portfolio[item.id] || 0;
        if (currentQty >= buyAmount) {
            const totalRevenue = item.price * buyAmount;
            updateFinancials({
                ...financials,
                cashOnHand: financials.cashOnHand + totalRevenue
            });
            setPortfolio(prev => ({
                ...prev,
                [item.id]: prev[item.id] - buyAmount
            }));
            addNotification(`Sold ${buyAmount}x ${item.symbol}`, "SUCCESS");
        } else {
            addNotification("Insufficient Assets to Sell", "ERROR");
        }
    };

    const handleGenerateProof = () => {
        const hash = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const proofBlock = `
█▀█ █▀▀ █▀█ █▀█ █▀▄ ▀█▀
█▀▄ █▀▀ █▀▀ █▀█ █▀▄  █ 
--------------------------
OPERATOR: ${settings.operatorAlias}
STATUS: ${settings.auditLevel}
REP SCORE: ${settings.reputationScore}
NET WORTH: $${playerNetWorth.toFixed(2)}
LIQUIDITY: $${financials.cashOnHand.toFixed(2)}
HASH: ${hash.toUpperCase()}
--------------------------
AUDITED BY SHADOW COUNCIL
`;
        navigator.clipboard.writeText(proofBlock);
        addNotification("Verified Proof of Status copied to clipboard.", "SUCCESS");
    };

    const handleAuditRequest = () => {
        const AUDIT_COST = 5000;
        
        if (financials.cashOnHand < AUDIT_COST) {
            addNotification(`Audit requires $${AUDIT_COST} up-front fee.`, 'ERROR');
            return;
        }

        setIsAuditing(true);
        
        // Deduct Fee
        updateFinancials({
            ...financials,
            cashOnHand: financials.cashOnHand - AUDIT_COST
        });

        // Simulate Process
        setTimeout(() => {
            const totalAssets = playerNetWorth;
            
            if (totalAssets > 10000) {
                updateSettings({
                    ...settings,
                    auditLevel: 'VERIFIED',
                    reputationScore: settings.reputationScore + 500
                });
                addNotification("AUDIT PASSED. Verified Status Granted.", "SUCCESS");
                // Immediately sync if online
                if(isOnline) updateProfileStats(totalAssets, settings.reputationScore + 500, true, settings.operatorAlias);
            } else {
                addNotification("AUDIT FAILED. Insufficient assets to verify.", "ERROR");
            }
            setIsAuditing(false);
            setShowAuditModal(false);
        }, 3000);
    };

    // Calculate Player Net Worth for Local Display
    const playerNetWorth = financials.cashOnHand + items.reduce((acc, item) => {
        return acc + (item.price * (portfolio[item.id] || 0));
    }, 0);

    const activeItem = items.find(i => i.id === selectedItem);

    if (!connected && !isOnline && !HARDCODED_SUPABASE_URL) {
        return (
            <div className="h-full flex flex-col items-center justify-center space-y-6">
                <div className="relative">
                    <Globe size={100} className="text-cyber-purple animate-pulse" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Wifi size={40} className="text-white animate-ping" />
                    </div>
                </div>
                <div className="text-center">
                    <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-2">Connecting to GTN</h2>
                    <p className="text-cyber-purple font-mono text-sm animate-pulse">Searching for secure nodes...</p>
                </div>
                <div className="w-64 h-1 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-cyber-purple animate-[width_2s_ease-in-out_infinite]" style={{ width: '50%' }}></div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col gap-6 animate-fade-in pb-20 relative">
            
            {/* NETWORK CONFIG MODAL */}
            {showNetworkConfig && (
                <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-cyber-panel border border-white/10 rounded-2xl w-full max-w-md p-6 relative shadow-2xl">
                        <h3 className="text-xl font-bold text-white uppercase mb-4 flex items-center gap-2">
                            <Globe size={20} className="text-blue-400"/> Network Uplink Configuration
                        </h3>
                        <p className="text-xs text-gray-400 mb-4">Enter backend credentials to enable Real-Time Multiplayer.</p>
                        
                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="text-[10px] uppercase font-bold text-gray-500">Supabase URL</label>
                                <input value={supabaseUrl} onChange={e => setSupabaseUrl(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded p-2 text-white text-xs outline-none focus:border-blue-400" placeholder="https://xyz.supabase.co"/>
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-bold text-gray-500">Supabase Anon Key</label>
                                <input value={supabaseKey} onChange={e => setSupabaseKey(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded p-2 text-white text-xs outline-none focus:border-blue-400" placeholder="eyJ..."/>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setShowNetworkConfig(false)} className="flex-1 py-3 rounded-lg border border-white/10 text-gray-400 hover:text-white transition-all text-xs font-bold uppercase">Cancel</button>
                            <button onClick={handleConnectOnline} disabled={authLoading} className="flex-1 py-3 rounded-lg bg-blue-500 text-white font-bold uppercase text-xs hover:brightness-110 flex items-center justify-center gap-2">
                                {authLoading ? <Activity className="animate-spin" size={14}/> : <Wifi size={14}/>} Connect
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* AUDIT MODAL */}
            {showAuditModal && (
                <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-cyber-panel border border-white/10 rounded-2xl w-full max-w-md p-6 relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                            <ShieldCheck size={120} className="text-white"/>
                        </div>
                        
                        <div className="relative z-10">
                            <h3 className="text-xl font-bold text-white uppercase flex items-center gap-2 mb-2">
                                <Terminal size={20} className="text-cyber-gold"/> Shadow Audit Protocol
                            </h3>
                            <div className="h-[1px] w-full bg-gradient-to-r from-cyber-gold to-transparent mb-6"></div>
                            
                            {isAuditing ? (
                                <div className="text-center py-8">
                                    <Activity size={48} className="text-cyber-green animate-pulse mx-auto mb-4"/>
                                    <p className="text-cyber-green font-mono text-sm">ANALYZING ASSETS...</p>
                                    <p className="text-gray-500 text-xs mt-2">Do not close terminal.</p>
                                </div>
                            ) : (
                                <>
                                    <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                                        Submit your operational ledger to the Shadow Council for verification. 
                                        Approved dealers receive a <strong className="text-white">Global Verification Badge</strong> visible to all market participants.
                                    </p>
                                    
                                    <div className="bg-white/5 p-4 rounded-xl mb-6">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-bold text-gray-500 uppercase">Audit Fee</span>
                                            <span className="text-white font-mono">$5,000.00</span>
                                        </div>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-bold text-gray-500 uppercase">Current Status</span>
                                            <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${settings.auditLevel === 'VERIFIED' ? 'bg-cyber-green text-black' : 'bg-gray-700 text-gray-300'}`}>
                                                {settings.auditLevel}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <button onClick={() => setShowAuditModal(false)} className="flex-1 py-3 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-all text-xs font-bold uppercase">
                                            Cancel
                                        </button>
                                        <button 
                                            onClick={handleAuditRequest}
                                            disabled={settings.auditLevel === 'VERIFIED'}
                                            className="flex-1 py-3 rounded-lg bg-cyber-gold text-black font-bold uppercase text-xs hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {settings.auditLevel === 'VERIFIED' ? 'Already Verified' : 'Submit Books'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-cyber-panel border border-white/10 p-6 rounded-2xl">
                <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
                        <Globe className="text-cyber-blue" /> Global Trade Network
                    </h2>
                    <div className="flex items-center gap-4 mt-2 text-xs font-mono text-gray-400">
                        {isOnline ? (
                            <span className="flex items-center gap-1 text-cyber-green animate-pulse"><Wifi size={12}/> LIVE UPLINK ACTIVE</span>
                        ) : (
                            <span className="flex items-center gap-1 text-gray-500"><Wifi size={12}/> OFFLINE SIMULATION</span>
                        )}
                        <span className="flex items-center gap-1"><Users size={12}/> {rivals.length + 1} ACTIVE TRADERS</span>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <button 
                        onClick={() => setShowNetworkConfig(true)}
                        className={`flex-1 md:flex-none px-4 py-2 rounded-lg font-bold text-xs uppercase flex items-center justify-center gap-2 border transition-all ${isOnline ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-black/40 border-white/10 text-gray-400 hover:text-white'}`}
                    >
                        <Database size={14}/> {isOnline ? 'Connected' : 'Go Online'}
                    </button>
                    <button 
                        onClick={() => setShowAuditModal(true)}
                        className={`flex-1 md:flex-none px-4 py-2 rounded-lg font-bold text-xs uppercase flex items-center justify-center gap-2 border transition-all ${settings.auditLevel === 'VERIFIED' ? 'bg-cyber-green/20 border-cyber-green text-cyber-green' : 'bg-black/40 border-white/10 text-gray-400 hover:text-white'}`}
                    >
                        {settings.auditLevel === 'VERIFIED' ? <CheckCircle2 size={14}/> : <ShieldCheck size={14}/>}
                        {settings.auditLevel === 'VERIFIED' ? 'Verified' : 'Get Audited'}
                    </button>
                    {settings.auditLevel === 'VERIFIED' && (
                        <button 
                            onClick={handleGenerateProof}
                            className="flex-1 md:flex-none px-4 py-2 rounded-lg font-bold text-xs uppercase flex items-center justify-center gap-2 bg-cyber-purple/20 border border-cyber-purple text-cyber-purple hover:bg-cyber-purple hover:text-white transition-all"
                        >
                            <Copy size={14}/> Proof
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
                
                {/* LEFT: LEADERBOARD & RIVALS */}
                <div className="bg-cyber-panel border border-white/10 rounded-2xl flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
                        <h3 className="font-bold text-white text-sm uppercase flex items-center gap-2"><Trophy size={14} className="text-yellow-500"/> Top Operators</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                        {/* Player Rank Insertion */}
                        {[
                            ...rivals, 
                            { 
                                id: 'player', 
                                name: settings.operatorAlias || 'YOU', 
                                netWorth: playerNetWorth, 
                                status: 'Active' as const, 
                                avatarColor: '#D4AF37', 
                                isVerified: settings.auditLevel === 'VERIFIED',
                                reputation: settings.reputationScore
                            }
                        ]
                        .sort((a,b) => b.netWorth - a.netWorth)
                        .map((trader, idx) => (
                            <div key={trader.id} className={`flex items-center justify-between p-3 rounded-xl border ${trader.id === 'player' ? 'bg-cyber-gold/10 border-cyber-gold' : 'bg-white/5 border-white/5'}`}>
                                <div className="flex items-center gap-3">
                                    <span className="text-gray-500 font-mono text-xs font-bold w-4">#{idx+1}</span>
                                    <div className="relative">
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-black" style={{ backgroundColor: trader.avatarColor }}>
                                            {trader.name.charAt(0)}
                                        </div>
                                        {trader.isVerified && (
                                            <div className="absolute -bottom-1 -right-1 bg-cyber-panel rounded-full p-0.5">
                                                <CheckCircle2 size={12} className="text-cyber-green fill-black"/>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <div className="text-white font-bold text-xs flex items-center gap-1">
                                            {trader.name}
                                        </div>
                                        <div className="text-[10px] text-gray-400 uppercase flex items-center gap-1">
                                            {trader.status}
                                            {trader.reputation > 0 && <span className="text-cyber-purple flex items-center gap-0.5"><Zap size={8}/> {trader.reputation}</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-white font-mono text-sm font-bold">${trader.netWorth.toFixed(0)}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CENTER: MARKET TERMINAL */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    
                    {/* TICKER TAPE */}
                    <div className="flex gap-4 overflow-x-auto pb-2">
                        {items.map(item => (
                            <button 
                                key={item.id}
                                onClick={() => setSelectedItem(item.id)}
                                className={`min-w-[140px] p-3 rounded-xl border transition-all ${selectedItem === item.id ? 'bg-white/10 border-white text-white' : 'bg-black/40 border-white/10 text-gray-400 hover:border-white/30'}`}
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-xs">{item.symbol}</span>
                                    {item.trend === 'UP' ? <TrendingUp size={12} className="text-green-500"/> : <TrendingDown size={12} className="text-red-500"/>}
                                </div>
                                <div className={`font-mono text-lg font-bold ${item.trend === 'UP' ? 'text-green-400' : item.trend === 'DOWN' ? 'text-red-400' : 'text-gray-300'}`}>
                                    ${item.price.toFixed(1)}
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* MAIN CHART & CONTROLS */}
                    {activeItem && (
                        <div className="flex-1 bg-cyber-panel border border-white/10 rounded-2xl p-6 relative overflow-hidden flex flex-col">
                            
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter">{activeItem.name}</h1>
                                    <div className="flex items-center gap-4 mt-2">
                                        <span className="text-gray-400 text-sm font-mono">Vol: {(activeItem.volatility * 100).toFixed(0)}%</span>
                                        <span className="text-gray-400 text-sm font-mono">Owned: {portfolio[activeItem.id] || 0} units</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-5xl font-mono font-bold text-white">${activeItem.price.toFixed(2)}</div>
                                </div>
                            </div>

                            {/* LIVE CHART */}
                            <div className="h-48 w-full bg-black/20 rounded-xl mb-6 border border-white/5 relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={activeItem.history}>
                                        <defs>
                                            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={activeItem.trend === 'UP' ? '#10B981' : '#EF4444'} stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor={activeItem.trend === 'UP' ? '#10B981' : '#EF4444'} stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <YAxis hide domain={['auto', 'auto']} />
                                        <Area 
                                            type="monotone" 
                                            dataKey="price" 
                                            stroke={activeItem.trend === 'UP' ? '#10B981' : '#EF4444'} 
                                            strokeWidth={3}
                                            fill="url(#colorPrice)" 
                                            isAnimationActive={false}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                                <div className="absolute top-2 left-2 text-[10px] text-gray-500 font-mono">LIVE FEED // {activeItem.symbol}</div>
                            </div>

                            {/* TRADING DESK */}
                            <div className="mt-auto bg-black/40 rounded-xl p-4 border border-white/10">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="text-xs text-gray-400 font-bold uppercase">Order Size</div>
                                    <div className="flex gap-2">
                                        {[1, 5, 10, 50].map(amt => (
                                            <button 
                                                key={amt} 
                                                onClick={() => setBuyAmount(amt)}
                                                className={`px-3 py-1 rounded text-xs font-bold border ${buyAmount === amt ? 'bg-white text-black border-white' : 'bg-black text-gray-500 border-gray-700'}`}
                                            >
                                                x{amt}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button 
                                        onClick={handleBuy}
                                        className="flex-1 bg-green-500/20 border border-green-500 text-green-500 hover:bg-green-500 hover:text-white py-4 rounded-xl font-black uppercase tracking-widest transition-all active:scale-95"
                                    >
                                        BUY <span className="text-xs ml-1 opacity-70">(-${(activeItem.price * buyAmount).toFixed(0)})</span>
                                    </button>
                                    <button 
                                        onClick={handleSell}
                                        disabled={!portfolio[activeItem.id]}
                                        className="flex-1 bg-red-500/20 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white py-4 rounded-xl font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        SELL <span className="text-xs ml-1 opacity-70">(+${(activeItem.price * buyAmount).toFixed(0)})</span>
                                    </button>
                                </div>
                                <div className="text-center mt-2 text-[10px] text-gray-500">
                                    Available Funds: <span className="text-white font-mono">${financials.cashOnHand.toFixed(2)}</span>
                                </div>
                            </div>

                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MarketGame;
