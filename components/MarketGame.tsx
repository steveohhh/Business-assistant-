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
    volatility: number; 
    trend: 'UP' | 'DOWN' | 'STABLE';
}

interface Rival {
    id: string;
    name: string;
    netWorth: number;
    status: 'Buying' | 'Selling' | 'Holding' | 'Active';
    avatarColor: string;
    isVerified: boolean;
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
    // REFACTORED: Granular selectors to prevent Error 185
    const cashOnHand = useAppStore(state => state.financials.cashOnHand);
    const bankBalance = useAppStore(state => state.financials.bankBalance);
    const reputationScore = useAppStore(state => state.settings.reputationScore);
    const auditLevel = useAppStore(state => state.settings.auditLevel);
    const operatorAlias = useAppStore(state => state.settings.operatorAlias);
    const batches = useAppStore(state => state.batches);
    
    const updateFinancials = useAppStore(state => state.updateFinancials);
    const addNotification = useAppStore(state => state.addNotification);
    const updateSettings = useAppStore(state => state.updateSettings);

    const [connected, setConnected] = useState(false);
    const [items, setItems] = useState<MarketItem[]>(INITIAL_ITEMS);
    const [rivals, setRivals] = useState<Rival[]>([]);
    const [portfolio, setPortfolio] = useState<Record<string, number>>({}); 
    const [selectedItem, setSelectedItem] = useState<string>(INITIAL_ITEMS[0].id);
    const [buyAmount, setBuyAmount] = useState(1);
    const [showAuditModal, setShowAuditModal] = useState(false);
    const [isAuditing, setIsAuditing] = useState(false);
    const [showNetworkConfig, setShowNetworkConfig] = useState(false);
    const [isOnline, setIsOnline] = useState(false);
    const [supabaseUrl, setSupabaseUrl] = useState(HARDCODED_SUPABASE_URL);
    const [supabaseKey, setSupabaseKey] = useState(HARDCODED_SUPABASE_KEY);
    const [authLoading, setAuthLoading] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string>('');

    const intervalRef = useRef<number | null>(null);
    const syncIntervalRef = useRef<number | null>(null);
    const tickCount = useRef(0);
    const hasAutoConnected = useRef(false);
    
    const financialsRef = useRef({ cashOnHand, bankBalance });
    const portfolioRef = useRef(portfolio);
    const itemsRef = useRef(items);
    const batchesRef = useRef(batches);

    useEffect(() => { financialsRef.current = { cashOnHand, bankBalance }; }, [cashOnHand, bankBalance]);
    useEffect(() => { portfolioRef.current = portfolio; }, [portfolio]);
    useEffect(() => { itemsRef.current = items; }, [items]);
    useEffect(() => { batchesRef.current = batches; }, [batches]);

    useEffect(() => {
        if (HARDCODED_SUPABASE_URL && HARDCODED_SUPABASE_KEY && !isOnline && !hasAutoConnected.current) {
            hasAutoConnected.current = true;
            handleConnectOnline();
        }
    }, []);

    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout>;
        if (!connected && !isOnline) {
            timeout = setTimeout(() => {
                setRivals(RIVAL_NAMES.map((name, i) => ({
                    id: `rival-${i}`,
                    name,
                    netWorth: 1000 + Math.random() * 20000,
                    status: 'Holding' as const,
                    avatarColor: ['#EF4444', '#10B981', '#3B82F6', '#D4AF37', '#8B5CF6'][i % 5],
                    isVerified: Math.random() > 0.6,
                    reputation: Math.floor(Math.random() * 100)
                })).sort((a,b) => b.netWorth - a.netWorth));
                setConnected(true);
            }, 2000);
        }
        return () => clearTimeout(timeout);
    }, [connected, isOnline]);

    useEffect(() => {
        if (!connected) return;
        intervalRef.current = window.setInterval(() => {
            tickCount.current += 1;
            setItems(prev => prev.map(item => {
                const change = (Math.random() - 0.5) * 2 * item.volatility;
                const newPrice = Math.max(1, item.price * (1 + change));
                return {
                    ...item,
                    price: newPrice,
                    history: [...item.history, { time: tickCount.current, price: newPrice }].slice(-20),
                    trend: newPrice > item.price ? 'UP' : 'DOWN'
                };
            }));
            if (!isOnline) {
                setRivals(prev => prev.map(r => ({ ...r, netWorth: Math.max(0, r.netWorth + (Math.random() - 0.4) * 20) })).sort((a,b) => b.netWorth - a.netWorth));
            }
        }, 2000); 
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [connected, isOnline]);

    const handleConnectOnline = async () => {
        const urlToUse = supabaseUrl || HARDCODED_SUPABASE_URL;
        const keyToUse = supabaseKey || HARDCODED_SUPABASE_KEY;
        if (!urlToUse || !keyToUse) return;
        setAuthLoading(true);
        const sb = initSupabase(urlToUse, keyToUse);
        if (sb) {
            const user = await signInAnonymously();
            if (user) {
                setCurrentUserId(user.id);
                setIsOnline(true);
                setConnected(true);
                setShowNetworkConfig(false);
                subscribeToLeaderboard((profiles: any[]) => {
                    setRivals(profiles.filter((p: any) => p.id !== user.id).map((p: any) => ({
                        id: p.id, name: p.username || 'Unknown', netWorth: p.net_worth, status: 'Active',
                        avatarColor: p.avatar_color || '#333', isVerified: p.is_verified, reputation: p.reputation_score
                    })));
                });
                syncIntervalRef.current = window.setInterval(() => {
                    const cash = financialsRef.current.cashOnHand + financialsRef.current.bankBalance;
                    const marketValue = itemsRef.current.reduce((acc, item) => acc + (item.price * (portfolioRef.current[item.id] || 0)), 0);
                    const stockValue = batchesRef.current.reduce((acc, batch) => acc + (batch.currentStock * batch.trueCostPerGram), 0);
                    updateProfileStats(cash + marketValue + stockValue, reputationScore, auditLevel === 'VERIFIED', operatorAlias);
                }, 10000);
            }
        }
        setAuthLoading(false);
    };

    const handleBuy = () => {
        const item = items.find(i => i.id === selectedItem);
        if (!item) return;
        const totalCost = item.price * buyAmount;
        if (cashOnHand >= totalCost) {
            updateFinancials({ cashOnHand: cashOnHand - totalCost });
            setPortfolio(prev => ({ ...prev, [item.id]: (prev[item.id] || 0) + buyAmount }));
            addNotification(`Acquired ${buyAmount}x ${item.symbol}`, "SUCCESS");
        } else addNotification("Insufficient Liquid Funds", "ERROR");
    };

    const handleSell = () => {
        const item = items.find(i => i.id === selectedItem);
        if (!item) return;
        if ((portfolio[item.id] || 0) >= buyAmount) {
            updateFinancials({ cashOnHand: cashOnHand + (item.price * buyAmount) });
            setPortfolio(prev => ({ ...prev, [item.id]: prev[item.id] - buyAmount }));
            addNotification(`Sold ${buyAmount}x ${item.symbol}`, "SUCCESS");
        } else addNotification("Insufficient Assets", "ERROR");
    };

    const playerNetWorth = cashOnHand + items.reduce((acc, item) => acc + (item.price * (portfolio[item.id] || 0)), 0);
    const activeItem = items.find(i => i.id === selectedItem);

    return (
        <div className="h-full flex flex-col gap-6 animate-fade-in pb-20 relative">
            {showNetworkConfig && (
                <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-cyber-panel border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <h3 className="text-xl font-bold text-white uppercase mb-4 flex items-center gap-2"><Globe size={20} className="text-blue-400"/> Network Uplink</h3>
                        <div className="space-y-4 mb-6">
                            <div><label className="text-[10px] uppercase font-bold text-gray-500">Supabase URL</label><input value={supabaseUrl} onChange={e => setSupabaseUrl(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded p-2 text-white text-xs outline-none focus:border-blue-400"/></div>
                            <div><label className="text-[10px] uppercase font-bold text-gray-500">Anon Key</label><input value={supabaseKey} onChange={e => setSupabaseKey(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded p-2 text-white text-xs outline-none focus:border-blue-400"/></div>
                        </div>
                        <div className="flex gap-3"><button onClick={() => setShowNetworkConfig(false)} className="flex-1 py-3 rounded-lg border border-white/10 text-gray-400 text-xs font-bold uppercase">Cancel</button><button onClick={handleConnectOnline} disabled={authLoading} className="flex-1 py-3 rounded-lg bg-blue-500 text-white font-bold uppercase text-xs hover:brightness-110">{authLoading ? <Activity className="animate-spin" size={14}/> : 'Connect'}</button></div>
                    </div>
                </div>
            )}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-cyber-panel border border-white/10 p-6 rounded-2xl">
                <div><h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-2"><Globe className="text-cyber-blue" /> Trade Network</h2><div className="flex items-center gap-4 mt-2 text-xs font-mono text-gray-400">{isOnline ? <span className="text-cyber-green animate-pulse">LIVE</span> : <span className="text-gray-500">LOCAL</span>}<span className="flex items-center gap-1"><Users size={12}/> {rivals.length + 1} TRADERS</span></div></div>
                <div className="flex gap-2"><button onClick={() => setShowNetworkConfig(true)} className={`px-4 py-2 rounded-lg font-bold text-xs uppercase flex items-center gap-2 border transition-all ${isOnline ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-black/40 border-white/10 text-gray-400'}`}><Database size={14}/> {isOnline ? 'Active' : 'Go Online'}</button></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
                <div className="bg-cyber-panel border border-white/10 rounded-2xl flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-white/10 bg-white/5"><h3 className="font-bold text-white text-sm uppercase flex items-center gap-2"><Trophy size={14} className="text-yellow-500"/> Leaders</h3></div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                        {[...rivals, { id: 'player', name: operatorAlias || 'YOU', netWorth: playerNetWorth, status: 'Active', avatarColor: '#D4AF37', isVerified: auditLevel === 'VERIFIED', reputation: reputationScore }].sort((a,b) => b.netWorth - a.netWorth).map((trader, idx) => (
                            <div key={trader.id} className={`flex items-center justify-between p-3 rounded-xl border ${trader.id === 'player' ? 'bg-cyber-gold/10 border-cyber-gold' : 'bg-white/5 border-white/5'}`}>
                                <div className="flex items-center gap-3"><span className="text-gray-500 font-mono text-xs w-4">#{idx+1}</span><div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-black" style={{ backgroundColor: trader.avatarColor }}>{trader.name.charAt(0)}</div><div><div className="text-white font-bold text-xs">{trader.name}</div><div className="text-[10px] text-gray-400 uppercase">{trader.status}</div></div></div>
                                <div className="text-right"><div className="text-white font-mono text-sm font-bold">${trader.netWorth.toFixed(0)}</div></div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <div className="flex gap-4 overflow-x-auto pb-2">
                        {items.map(item => (
                            <button key={item.id} onClick={() => setSelectedItem(item.id)} className={`min-w-[140px] p-3 rounded-xl border transition-all ${selectedItem === item.id ? 'bg-white/10 border-white text-white' : 'bg-black/40 border-white/10 text-gray-400'}`}>
                                <div className="flex justify-between items-center mb-1"><span className="font-bold text-xs">{item.symbol}</span>{item.trend === 'UP' ? <TrendingUp size={12} className="text-green-500"/> : <TrendingDown size={12} className="text-red-500"/>}</div>
                                <div className={`font-mono text-lg font-bold ${item.trend === 'UP' ? 'text-green-400' : 'text-red-400'}`}>${item.price.toFixed(1)}</div>
                            </button>
                        ))}
                    </div>
                    {activeItem && (
                        <div className="flex-1 bg-cyber-panel border border-white/10 rounded-2xl p-6 flex flex-col">
                            <div className="flex justify-between items-start mb-6"><div><h1 className="text-4xl font-black text-white uppercase tracking-tighter">{activeItem.name}</h1><span className="text-gray-400 text-sm font-mono">Owned: {portfolio[activeItem.id] || 0}</span></div><div className="text-5xl font-mono font-bold text-white">${activeItem.price.toFixed(2)}</div></div>
                            <div className="h-48 w-full bg-black/20 rounded-xl mb-6 border border-white/5 relative">
                                <ResponsiveContainer width="100%" height="100%"><AreaChart data={activeItem.history}><YAxis hide domain={['auto', 'auto']} /><Area type="monotone" dataKey="price" stroke={activeItem.trend === 'UP' ? '#10B981' : '#EF4444'} strokeWidth={3} fillOpacity={0.1} isAnimationActive={false}/></AreaChart></ResponsiveContainer>
                            </div>
                            <div className="mt-auto bg-black/40 rounded-xl p-4 flex flex-col gap-4">
                                <div className="flex items-center justify-between"><div className="text-xs text-gray-400 font-bold uppercase">Size</div><div className="flex gap-2">{[1, 5, 10, 50].map(amt => <button key={amt} onClick={() => setBuyAmount(amt)} className={`px-3 py-1 rounded text-xs font-bold border ${buyAmount === amt ? 'bg-white text-black border-white' : 'bg-black text-gray-500 border-gray-700'}`}>x{amt}</button>)}</div></div>
                                <div className="flex gap-4"><button onClick={handleBuy} className="flex-1 bg-green-500/20 border border-green-500 text-green-500 py-4 rounded-xl font-black uppercase">BUY</button><button onClick={handleSell} disabled={!portfolio[activeItem.id]} className="flex-1 bg-red-500/20 border border-red-500 text-red-500 py-4 rounded-xl font-black uppercase disabled:opacity-50">SELL</button></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MarketGame;