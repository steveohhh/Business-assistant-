import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Batch, ChatMessage, InventoryTerms, Achievement } from '../types';
import { getSupabase } from '../services/supabaseService';
import { scramble, unscramble } from '../services/cryptoUtils';
import { ShoppingCart, MessageSquare, Send, X, Plus, Minus, Lock, AlertTriangle, Zap, CheckCircle2, ChevronRight, Package, Loader2, Copy, History, Link as LinkIcon, Box, Wallet, User, Trophy, CreditCard, Award, Star, TrendingUp, Grid, Shield, LayoutDashboard, Eye, EyeOff, PieChart as PieIcon, BarChart2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';

// --- GAMIFIED 3D ASSETS ---
const BadgeCard: React.FC<{ achievement: Achievement }> = ({ achievement }) => {
    const getRarityColor = (r: string) => {
        switch(r) {
            case 'LEGENDARY': return 'from-yellow-600 via-yellow-400 to-yellow-600 border-yellow-400 shadow-yellow-500/50';
            case 'RARE': return 'from-purple-600 via-purple-400 to-purple-600 border-purple-400 shadow-purple-500/50';
            case 'UNCOMMON': return 'from-blue-600 via-blue-400 to-blue-600 border-blue-400 shadow-blue-500/50';
            default: return 'from-gray-600 via-gray-400 to-gray-600 border-gray-400 shadow-gray-500/50';
        }
    }

    const colorClass = getRarityColor(achievement.rarity || 'COMMON');

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05, rotateY: 15, z: 50 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className={`relative w-full aspect-[3/4] rounded-2xl p-1 bg-gradient-to-br ${colorClass} shadow-xl cursor-pointer group perspective-1000`}
        >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-30 transition-opacity rounded-2xl pointer-events-none z-10"></div>
            <div className="h-full w-full bg-black/90 rounded-xl p-4 flex flex-col items-center justify-between relative overflow-hidden backdrop-blur-sm">
                
                {/* Holographic Shine */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none transform -translate-x-full group-hover:translate-x-full"></div>

                <div className="text-[10px] font-black uppercase tracking-widest text-white/50">{achievement.rarity || 'COMMON'}</div>
                
                <div className="text-5xl filter drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] transform group-hover:scale-110 transition-transform duration-300">
                    {achievement.icon}
                </div>
                
                <div className="text-center z-10">
                    <h3 className="font-black text-white text-sm uppercase tracking-tighter mb-1">{achievement.title}</h3>
                    <p className="text-[9px] text-gray-400 leading-tight line-clamp-2">{achievement.description}</p>
                </div>

                <div className="w-full pt-2 border-t border-white/10 mt-2 flex justify-between items-center">
                    <span className="text-[9px] font-mono text-cyber-gold font-bold">+{achievement.xpValue} XP</span>
                    {achievement.discountMod && achievement.discountMod > 0 && (
                        <span className="text-[9px] bg-cyber-green/20 text-cyber-green px-1.5 py-0.5 rounded font-bold">-{achievement.discountMod}%</span>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

interface CustomerPortalProps {
    channelId: string;
    inventoryTerms: InventoryTerms;
}

interface OrderRecord {
    id: string;
    date: string;
    items: string; // Simplified string for display
    total: number;
    status: 'PENDING' | 'ACCEPTED';
}

const CustomerPortal: React.FC<CustomerPortalProps> = ({ channelId, inventoryTerms }) => {
    const [stock, setStock] = useState<Batch[]>([]);
    const [cart, setCart] = useState<{batchId: string, name: string, weight: number, price: number}[]>([]);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [orderSent, setOrderSent] = useState(false);
    const [showDossier, setShowDossier] = useState(false); // Toggle for stats
    
    const [viewMode, setViewMode] = useState<'DASHBOARD' | 'SHOP' | 'LEADERBOARD' | 'TRADING'>('DASHBOARD');
    
    const [orders, setOrders] = useState<OrderRecord[]>([]);
    
    // Ghost Identity
    const [ghostId, setGhostId] = useState('');
    
    // Simulated User Profile State
    const [profile, setProfile] = useState({
        level: 5,
        xp: 2450,
        nextLevelXp: 3000,
        rank: 12,
        tokens: 3,
        achievements: [] as Achievement[]
    });

    // Auto-scroll chat
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Init Ghost Identity
        let id = localStorage.getItem('smp_ghost_id');
        if (!id) {
            id = `GHOST-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.floor(Math.random() * 99)}`;
            localStorage.setItem('smp_ghost_id', id);
        }
        setGhostId(id);

        // Simulated Badge Load
        const mockAchievements: Achievement[] = [
            { id: '1', title: 'First Contact', description: 'Established secure link.', icon: '📡', xpValue: 100, unlockedAt: '', rarity: 'COMMON', discountMod: 0 },
            { id: '2', title: 'High Roller', description: 'Spent over $500 in one go.', icon: '💎', xpValue: 500, unlockedAt: '', rarity: 'LEGENDARY', discountMod: 5 },
            { id: '3', title: 'Loyalist', description: '5th consecutive order.', icon: '🔥', xpValue: 300, unlockedAt: '', rarity: 'RARE', discountMod: 2 },
        ];
        setProfile(prev => ({ ...prev, achievements: mockAchievements }));

        // Load Local Order History
        const savedOrders = localStorage.getItem('smp_ghost_orders');
        if (savedOrders) setOrders(JSON.parse(savedOrders));

        const supabase = getSupabase();
        if (!supabase || !channelId) return;

        const channel = supabase.channel(channelId);

        channel
            .on('broadcast', { event: 'STOCK_UPDATE' }, (payload) => {
                if (payload.payload) setStock(payload.payload);
                setIsConnected(true);
            })
            .on('broadcast', { event: 'CHAT_MESSAGE' }, (payload) => {
                const msg = payload.payload;
                // Decrypt
                const decryptedText = unscramble(msg.text, channelId);
                const decryptedMsg = { ...msg, text: decryptedText };
                setMessages(prev => [...prev, decryptedMsg]);
                // Scroll if chat is open
                if (showChat) setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    setIsConnected(true);
                    // Request initial stock
                    channel.send({ type: 'broadcast', event: 'REQUEST_STOCK', payload: {} });
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [channelId, showChat]);

    const addToCart = (batch: Batch) => {
        const existing = cart.find(c => c.batchId === batch.id);
        if (existing) return;
        setCart([...cart, { batchId: batch.id, name: batch.name, weight: 3.5, price: batch.targetRetailPrice }]);
    };

    const updateCartWeight = (batchId: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.batchId === batchId) {
                const newW = Math.max(1, item.weight + delta);
                return { ...item, weight: newW };
            }
            return item;
        }));
    };

    const removeFromCart = (batchId: string) => {
        setCart(prev => prev.filter(c => c.batchId !== batchId));
    };

    const submitOrder = async () => {
        const supabase = getSupabase();
        if (!supabase) return;

        const totalAmount = cart.reduce((acc, item) => acc + (item.weight * item.price), 0);
        
        const payload = {
            customer: `Ghost_${ghostId}`,
            items: cart,
            total: totalAmount,
            ghostId: ghostId // Include ID for linking
        };

        await supabase.channel(channelId).send({
            type: 'broadcast',
            event: 'NEW_ORDER',
            payload: payload
        });

        const newOrder: OrderRecord = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            items: cart.map(i => `${i.weight}g ${i.name}`).join(', '),
            total: totalAmount,
            status: 'PENDING'
        };
        const updatedHistory = [newOrder, ...orders];
        setOrders(updatedHistory);
        localStorage.setItem('smp_ghost_orders', JSON.stringify(updatedHistory));

        setCart([]);
        setOrderSent(true);
        setTimeout(() => setOrderSent(false), 5000);
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const supabase = getSupabase();
        if (!supabase) return;

        const rawText = input;
        const encryptedText = scramble(rawText, channelId);

        const msg: ChatMessage = {
            id: Date.now().toString(),
            sender: 'CUSTOMER',
            text: rawText,
            timestamp: new Date().toISOString(),
            isEncrypted: true
        };

        setMessages(prev => [...prev, msg]);
        setInput('');
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);

        await supabase.channel(channelId).send({
            type: 'broadcast',
            event: 'CHAT_MESSAGE',
            payload: { ...msg, text: encryptedText }
        });
    };

    const copyGhostId = () => {
        navigator.clipboard.writeText(ghostId);
        alert("Ghost ID Copied");
    };

    // --- DOSSIER STATS ENGINE ---
    const { historyData, preferenceData, totalSpent } = useMemo(() => {
        // Use real orders if they exist, else use placeholders for a cold start
        const hasRealOrders = orders.length > 0;
        const data = hasRealOrders ? orders : [
            { id: 'placeholder-1', date: new Date(Date.now() - 1000000000).toISOString(), total: 0, items: 'None' }
        ];

        const history = data.map(o => ({ 
            date: new Date(o.date).toLocaleDateString(), 
            value: o.total 
        })).reverse();
        
        const prefs: Record<string, number> = { 'Organic': 0, 'Extract': 1, 'Edible': 0 };
        if (hasRealOrders) {
            orders.forEach(o => {
                if (o.total > 150) prefs['Extract'] += 1;
                else if (o.total > 50) prefs['Organic'] += 1;
                else prefs['Edible'] += 1;
            });
        }
        
        const pieData = Object.entries(prefs).map(([name, value]) => ({ name, value }));
        const total = orders.reduce((a,b) => a + b.total, 0);

        return { historyData: history, preferenceData: pieData, totalSpent: total };
    }, [orders]);

    if (!isConnected && stock.length === 0) {
        return (
            <div className="h-screen bg-black flex flex-col items-center justify-center p-8 text-center font-mono">
                <Loader2 size={64} className="text-cyber-green animate-spin mb-6"/>
                <h1 className="text-2xl text-white font-bold mb-2 uppercase tracking-widest">Establishing Secure Uplink</h1>
                <p className="text-gray-500 text-xs">Handshaking with Ghost Node...</p>
                <div className="mt-8 w-64 h-1 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-cyber-green animate-[width_2s_ease-in-out_infinite]" style={{ width: '50%' }}></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] font-sans text-gray-200 pb-24 relative overflow-hidden">
            
            {/* Background Grid */}
            <div className="fixed inset-0 bg-[linear-gradient(rgba(20,184,166,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(20,184,166,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

            {/* Header */}
            <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-lg border-b border-cyber-green/20 p-4">
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                        <Lock size={16} className="text-cyber-green"/>
                        <span className="text-cyber-green font-bold text-sm tracking-[0.2em] uppercase">Ghost Market</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-cyber-green animate-pulse' : 'bg-red-500'}`}></div>
                        <span className="text-[10px] text-gray-500 font-mono">{isConnected ? 'ENCRYPTED' : 'OFFLINE'}</span>
                    </div>
                </div>
                
                {/* Navigation */}
                <div className="flex bg-gray-900 rounded-lg p-1 overflow-x-auto">
                    <button onClick={() => setViewMode('DASHBOARD')} className={`flex-1 min-w-[80px] py-2 text-xs font-bold uppercase rounded-md transition-all ${viewMode === 'DASHBOARD' ? 'bg-cyber-green text-black shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'text-gray-500'}`}>
                        Profile
                    </button>
                    <button onClick={() => setViewMode('SHOP')} className={`flex-1 min-w-[80px] py-2 text-xs font-bold uppercase rounded-md transition-all ${viewMode === 'SHOP' ? 'bg-cyber-green text-black shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'text-gray-500'}`}>
                        Supply
                    </button>
                    <button onClick={() => setViewMode('LEADERBOARD')} className={`flex-1 min-w-[80px] py-2 text-xs font-bold uppercase rounded-md transition-all ${viewMode === 'LEADERBOARD' ? 'bg-cyber-green text-black shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'text-gray-500'}`}>
                        Ranking
                    </button>
                    <button onClick={() => setViewMode('TRADING')} className={`flex-1 min-w-[80px] py-2 text-xs font-bold uppercase rounded-md transition-all ${viewMode === 'TRADING' ? 'bg-cyber-green text-black shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'text-gray-500'}`}>
                        Trade
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="p-4 max-w-lg mx-auto space-y-6 relative z-10">
                
                {/* 3D DASHBOARD VIEW */}
                {viewMode === 'DASHBOARD' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        
                        {/* 3D Identity Card */}
                        <motion.div 
                            whileHover={{ rotateX: 5, rotateY: 5, scale: 1.02 }}
                            className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl p-6 relative overflow-hidden shadow-2xl perspective-1000"
                        >
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                            <div className="relative z-10 flex justify-between items-start">
                                <div>
                                    <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Operative ID</div>
                                    <div className="text-2xl font-mono font-bold text-white tracking-wider flex items-center gap-2" onClick={copyGhostId}>
                                        {ghostId} <Copy size={14} className="text-gray-500 cursor-pointer hover:text-white"/>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] text-cyber-gold uppercase font-bold tracking-widest mb-1">Rank</div>
                                    <div className="text-3xl font-black text-white italic">#{profile.rank}</div>
                                </div>
                            </div>

                            <div className="mt-6">
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-xs text-cyber-green font-bold uppercase">Level {profile.level}</span>
                                    <span className="text-[10px] text-gray-400">{profile.xp} / {profile.nextLevelXp} XP</span>
                                </div>
                                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden border border-white/5">
                                    <motion.div 
                                        initial={{ width: 0 }} 
                                        animate={{ width: `${(profile.xp / profile.nextLevelXp) * 100}%` }}
                                        className="h-full bg-gradient-to-r from-cyber-green to-emerald-400 shadow-[0_0_10px_#10B981]"
                                    ></motion.div>
                                </div>
                            </div>
                        </motion.div>

                        {/* PERSONAL DOSSIER TOGGLE */}
                        <div className="bg-cyber-panel border border-white/10 rounded-xl p-4">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-white font-bold uppercase text-sm flex items-center gap-2">
                                    <BarChart2 size={16} className="text-blue-400"/> Personal Dossier
                                </h3>
                                <button 
                                    onClick={() => setShowDossier(!showDossier)}
                                    className={`p-2 rounded-lg transition-all ${showDossier ? 'bg-blue-500 text-white' : 'bg-white/5 text-gray-500 hover:text-white'}`}
                                >
                                    {showDossier ? <Eye size={16}/> : <EyeOff size={16}/>}
                                </button>
                            </div>

                            <AnimatePresence>
                                {showDossier && (
                                    <motion.div 
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden space-y-4"
                                    >
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-black/30 p-3 rounded-lg border border-white/5 text-center">
                                                <div className="text-[9px] text-gray-500 uppercase font-bold">Lifetime Spend</div>
                                                <div className="text-white font-mono font-bold">${totalSpent.toFixed(0)}</div>
                                            </div>
                                            <div className="bg-black/30 p-3 rounded-lg border border-white/5 text-center">
                                                <div className="text-[9px] text-gray-500 uppercase font-bold">Orders</div>
                                                <div className="text-white font-mono font-bold">{orders.length}</div>
                                            </div>
                                        </div>

                                        {/* HISTORY CHART */}
                                        <div className="h-40 bg-black/20 rounded-lg p-2 border border-white/5">
                                            <div className="text-[9px] text-gray-500 uppercase font-bold mb-2">Expenditure History</div>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={historyData}>
                                                    <defs>
                                                        <linearGradient id="colorHistory" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                                                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                                                        </linearGradient>
                                                    </defs>
                                                    <XAxis dataKey="date" hide />
                                                    <Tooltip contentStyle={{backgroundColor: '#000', border: '1px solid #333', color: '#fff', fontSize: '10px'}} />
                                                    <Area type="monotone" dataKey="value" stroke="#3B82F6" fillOpacity={1} fill="url(#colorHistory)" strokeWidth={2} />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>

                                        {/* PREFERENCE CHART */}
                                        <div className="h-40 bg-black/20 rounded-lg p-2 border border-white/5 flex">
                                            <div className="w-1/2 flex flex-col justify-center pl-4">
                                                <div className="text-[9px] text-gray-500 uppercase font-bold mb-2">Preferences</div>
                                                {preferenceData.map((p, i) => (
                                                    <div key={i} className="flex items-center gap-2 mb-1">
                                                        <div className="w-2 h-2 rounded-full" style={{backgroundColor: ['#10B981', '#F59E0B', '#6366F1'][i%3]}}></div>
                                                        <span className="text-[10px] text-gray-300">{p.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="w-1/2">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie data={preferenceData} dataKey="value" innerRadius={25} outerRadius={40} paddingAngle={5}>
                                                            {preferenceData.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={['#10B981', '#F59E0B', '#6366F1'][index % 3]} stroke="none"/>
                                                            ))}
                                                        </Pie>
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Wallet / Tokens */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-black/40 border border-cyber-gold/30 rounded-xl p-4 flex items-center gap-4 relative overflow-hidden">
                                <div className="p-3 bg-cyber-gold/10 rounded-full text-cyber-gold">
                                    <Trophy size={24}/>
                                </div>
                                <div>
                                    <div className="text-2xl font-black text-white">{profile.tokens}</div>
                                    <div className="text-[10px] text-gray-500 uppercase font-bold">Reward Tokens</div>
                                </div>
                            </div>
                            <div className="bg-black/40 border border-cyber-green/30 rounded-xl p-4 flex items-center gap-4 relative overflow-hidden">
                                <div className="p-3 bg-cyber-green/10 rounded-full text-cyber-green">
                                    <Wallet size={24}/>
                                </div>
                                <div>
                                    <div className="text-2xl font-black text-white">{profile.achievements.length}</div>
                                    <div className="text-[10px] text-gray-500 uppercase font-bold">Badges Earned</div>
                                </div>
                            </div>
                        </div>

                        {/* 3D BADGE CASE */}
                        <div>
                            <h3 className="text-white font-bold uppercase text-sm mb-4 flex items-center gap-2">
                                <Award size={16} className="text-cyber-purple"/> Service Record
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                {profile.achievements.map(ach => (
                                    <BadgeCard key={ach.id} achievement={ach} />
                                ))}
                                {/* Empty Slot Placeholder */}
                                <div className="aspect-[3/4] rounded-2xl border-2 border-dashed border-white/5 bg-white/5 flex flex-col items-center justify-center text-gray-600">
                                    <Lock size={24} className="mb-2 opacity-50"/>
                                    <span className="text-[10px] uppercase font-bold">Locked</span>
                                </div>
                            </div>
                        </div>

                    </motion.div>
                )}

                {/* SHOP VIEW */}
                {viewMode === 'SHOP' && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                        {orderSent && (
                            <div className="bg-cyber-green/10 border border-cyber-green text-cyber-green p-4 rounded-xl flex items-center gap-3 animate-fade-in">
                                <CheckCircle2 size={24}/>
                                <div>
                                    <div className="font-bold text-sm uppercase">Order Transmitted</div>
                                    <div className="text-[10px]">Operator has received your request.</div>
                                </div>
                            </div>
                        )}
                        {stock.length === 0 ? (
                            <div className="text-center py-10 text-gray-600 italic">
                                Store is currently closed or restocking.
                            </div>
                        ) : (
                            stock.filter(i => i.currentStock > 0).map(item => (
                                <motion.div 
                                    key={item.id} 
                                    whileHover={{ scale: 1.02 }}
                                    className="bg-gray-900/50 border border-white/10 rounded-xl p-4 flex justify-between items-center hover:border-cyber-green/50 transition-all group"
                                >
                                    <div>
                                        <div className="font-bold text-white text-lg flex items-center gap-2">
                                            {item.name}
                                            <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-gray-400 uppercase">{item.strainType}</span>
                                        </div>
                                        <div className="text-cyber-green font-mono font-bold mt-1">
                                            ${item.targetRetailPrice}/{inventoryTerms.unit}
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => addToCart(item)}
                                        className="bg-white/5 hover:bg-cyber-green hover:text-black border border-white/10 text-white p-3 rounded-xl transition-all active:scale-95"
                                    >
                                        <Plus size={20}/>
                                    </button>
                                </motion.div>
                            ))
                        )}
                    </motion.div>
                )}

                {/* LEADERBOARD VIEW */}
                {viewMode === 'LEADERBOARD' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                        <div className="bg-cyber-gold/10 border border-cyber-gold/30 p-4 rounded-xl text-center mb-6">
                            <Trophy size={32} className="text-cyber-gold mx-auto mb-2 animate-bounce"/>
                            <h3 className="text-cyber-gold font-black uppercase tracking-widest text-xl">Top Operators</h3>
                            <p className="text-[10px] text-gray-400">Rank up to unlock exclusive discounts.</p>
                        </div>

                        <div className="space-y-2">
                            {[1, 2, 3, 4, 5].map((rank) => (
                                <div key={rank} className={`flex items-center justify-between p-4 rounded-xl border ${rank === 1 ? 'bg-cyber-gold/20 border-cyber-gold' : 'bg-white/5 border-white/5'}`}>
                                    <div className="flex items-center gap-4">
                                        <span className={`font-black text-lg w-6 ${rank === 1 ? 'text-cyber-gold' : 'text-gray-500'}`}>#{rank}</span>
                                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center font-bold text-xs">
                                            {String.fromCharCode(64 + rank)}
                                        </div>
                                        <div>
                                            <div className="text-white font-bold text-sm">Agent {String.fromCharCode(64 + rank)}***</div>
                                            <div className="text-[9px] text-gray-500 uppercase">Level {20 - rank} • Prestige {rank === 1 ? 2 : 0}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-white font-mono font-bold text-sm">{10000 - (rank * 1500)} XP</div>
                                    </div>
                                </div>
                            ))}
                            {/* Player Rank */}
                            <div className="mt-4 pt-4 border-t border-white/10">
                                <div className="flex items-center justify-between p-4 rounded-xl border border-cyber-green bg-cyber-green/10">
                                    <div className="flex items-center gap-4">
                                        <span className="font-black text-lg w-6 text-cyber-green">#{profile.rank}</span>
                                        <div className="w-8 h-8 rounded-full bg-cyber-green text-black flex items-center justify-center font-bold text-xs">
                                            U
                                        </div>
                                        <div>
                                            <div className="text-white font-bold text-sm">YOU</div>
                                            <div className="text-[9px] text-cyber-green uppercase">Level {profile.level}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-white font-mono font-bold text-sm">{profile.xp} XP</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* TRADING VIEW (Coming Soon) */}
                {viewMode === 'TRADING' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[60vh] flex flex-col items-center justify-center text-center p-8 border border-dashed border-white/10 rounded-2xl bg-black/40">
                        <div className="relative mb-6">
                            <LayoutDashboard size={64} className="text-gray-700"/>
                            <Lock size={32} className="text-white absolute -bottom-2 -right-2 bg-black rounded-full p-1"/>
                        </div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-2">Trade Floor Locked</h2>
                        <p className="text-gray-500 text-sm max-w-xs">
                            Peer-to-Peer badge trading and discount swapping is currently in development.
                        </p>
                        <div className="mt-8 px-4 py-2 bg-white/5 rounded-full text-[10px] uppercase font-bold text-gray-400 border border-white/5">
                            ETA: Season 3 Update
                        </div>
                    </motion.div>
                )}

            </div>

            {/* Bottom Cart Bar */}
            {cart.length > 0 && viewMode === 'SHOP' && (
                <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-xl border-t border-white/10 p-4 z-50 animate-slide-in">
                    <div className="max-w-md mx-auto">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-xs text-gray-400 uppercase font-bold">Current Order</span>
                            <span className="text-white font-mono font-bold">${cart.reduce((a,b)=>a+(b.weight*b.price),0).toFixed(0)}</span>
                        </div>
                        
                        <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                            {cart.map(item => (
                                <div key={item.batchId} className="flex justify-between items-center bg-white/5 p-2 rounded-lg text-sm">
                                    <div className="flex-1 truncate pr-2">{item.name}</div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center bg-black rounded">
                                            <button onClick={() => updateCartWeight(item.batchId, -1)} className="p-1 hover:text-cyber-green"><Minus size={12}/></button>
                                            <span className="w-8 text-center font-mono text-xs">{item.weight}</span>
                                            <button onClick={() => updateCartWeight(item.batchId, 1)} className="p-1 hover:text-cyber-green"><Plus size={12}/></button>
                                        </div>
                                        <button onClick={() => removeFromCart(item.batchId)} className="text-red-500"><X size={14}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button 
                            onClick={submitOrder}
                            className="w-full bg-cyber-green text-black font-black uppercase py-4 rounded-xl tracking-widest flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all"
                        >
                            <ShoppingCart size={18}/> Place Order
                        </button>
                    </div>
                </div>
            )}

            {/* Chat Widget */}
            <div className={`fixed z-50 transition-all duration-300 ${showChat ? 'inset-0 bg-black flex flex-col' : 'bottom-24 right-4 w-auto h-auto'}`}>
                {showChat ? (
                    <div className="flex flex-col h-full">
                        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-gray-900">
                            <h3 className="text-cyber-green font-mono uppercase text-sm">Encrypted Uplink</h3>
                            <button onClick={() => setShowChat(false)}><X size={24} className="text-gray-400"/></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-black/90">
                            {messages.map(msg => (
                                <div key={msg.id} className={`flex flex-col ${msg.sender === 'CUSTOMER' ? 'items-end' : 'items-start'}`}>
                                    <div className={`max-w-[80%] p-3 rounded-xl text-sm ${msg.sender === 'CUSTOMER' ? 'bg-cyber-green text-black' : 'bg-gray-800 text-white'}`}>
                                        {msg.text}
                                    </div>
                                    <span className="text-[9px] text-gray-600 mt-1">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                                </div>
                            ))}
                            <div ref={messagesEndRef}></div>
                        </div>
                        <form onSubmit={sendMessage} className="p-4 border-t border-white/10 bg-gray-900 flex gap-2">
                            <input 
                                value={input} onChange={e => setInput(e.target.value)}
                                className="flex-1 bg-black border border-white/20 rounded-xl px-4 text-white outline-none focus:border-cyber-green"
                                placeholder="Message Operator..."
                            />
                            <button type="submit" className="bg-cyber-green text-black p-3 rounded-xl"><Send size={18}/></button>
                        </form>
                    </div>
                ) : (
                    <button 
                        onClick={() => setShowChat(true)}
                        className="bg-gray-800 border border-white/20 text-white p-4 rounded-full shadow-2xl relative group"
                    >
                        <MessageSquare size={24} />
                        {messages.length > 0 && <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>}
                    </button>
                )}
            </div>

        </div>
    );
};

export default CustomerPortal;