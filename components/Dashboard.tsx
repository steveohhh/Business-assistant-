import React, { useState, useEffect } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { ViewState } from '../types';
import { generateDailyBriefing } from '../services/geminiService';
import { 
  LayoutDashboard, Package, ShoppingCart, Users, PieChart, 
  FileText, Settings as SettingsIcon, Zap, RefreshCw, 
  AlertTriangle, TrendingUp, DollarSign, Activity, 
  Wifi, Gamepad2, Globe, Share2, Copy, User, ArrowUpRight, Radar 
} from 'lucide-react';

const Dashboard = ({ onNavigate }: { onNavigate: (v: ViewState) => void }) => {
    // FIXED: Granular selectors to prevent Error 185
    const sales = useAppStore(state => state.sales);
    const batches = useAppStore(state => state.batches);
    const customers = useAppStore(state => state.customers);
    const inventoryTerms = useAppStore(state => state.inventoryTerms);
    const storeChannelId = useAppStore(state => state.storeChannelId);
    const addNotification = useAppStore(state => state.addNotification);

    const [briefing, setBriefing] = useState<string | null>(null);
    const [loadingBriefing, setLoadingBriefing] = useState(false);

    const today = new Date().toLocaleDateString();
    const todaysSales = sales.filter(s => new Date(s.timestamp).toLocaleDateString() === today);
    const dailyRevenue = todaysSales.reduce((acc, s) => acc + s.amount, 0);
    const dailyProfit = todaysSales.reduce((acc, s) => acc + s.profit, 0);
    const activeStock = batches.filter(b => b.currentStock > 0).length;
    const lowStock = batches.filter(b => b.currentStock < b.actualWeight * 0.2).length;

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const x = e.clientX / window.innerWidth;
            const y = e.clientY / window.innerHeight;
            document.documentElement.style.setProperty('--mouse-x', x.toString());
            document.documentElement.style.setProperty('--mouse-y', y.toString());
        };

        const pulseRate = Math.max(0.5, 4 - (dailyRevenue / 500));
        const opacity = Math.min(0.12, 0.03 + (dailyRevenue / 5000));
        
        document.documentElement.style.setProperty('--pulse-rate', `${pulseRate}s`);
        document.documentElement.style.setProperty('--grid-opacity', opacity.toString());

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [dailyRevenue]);

    const handleGetBriefing = async () => {
        setLoadingBriefing(true);
        try {
            const text = await generateDailyBriefing(sales, batches, customers);
            setBriefing(text);
        } catch (e) {
            setBriefing("AI Subsystem Interrupted. Check connection.");
        } finally {
            setLoadingBriefing(false);
        }
    };

    const copyStoreLink = () => {
        const url = `${window.location.origin}/?mode=ghost&channel=${storeChannelId}`;
        navigator.clipboard.writeText(url);
        addNotification("Ghost Portal Link copied.", "SUCCESS");
    };

    return (
        <div className="space-y-8 animate-fade-in pb-24">
            {/* System Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-5xl font-black text-white uppercase tracking-tighter leading-none relative">
                        SYSTEM <span className="text-cyber-gold">DASHBOARD</span>
                        <div className="absolute -top-4 -right-8 opacity-20 animate-pulse">
                             <Radar size={64} className="text-cyber-green"/>
                        </div>
                    </h1>
                    <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-cyber-green/20">
                            <div className="relative w-2 h-2">
                                <div className="absolute inset-0 bg-cyber-green rounded-full animate-ping"></div>
                                <div className="relative w-2 h-2 bg-cyber-green rounded-full"></div>
                            </div>
                            <span className="text-[10px] text-cyber-green font-mono font-bold tracking-widest">NET_SCAN_ACTIVE</span>
                        </div>
                        <p className="text-gray-500 text-xs font-mono uppercase">V3.0.1 // {new Date().toLocaleTimeString()}</p>
                    </div>
                </div>
                
                <div className="flex flex-wrap gap-3">
                    <div className="hidden sm:flex bg-black/60 border border-white/10 rounded-xl p-1 items-center">
                        <div className="px-4 py-2 border-r border-white/5">
                            <div className="text-[9px] text-gray-500 uppercase font-black">Uplink ID</div>
                            <div className="text-xs font-mono text-cyber-gold">{storeChannelId.substring(0,8)}...</div>
                        </div>
                        <button onClick={copyStoreLink} className="p-3 hover:text-white text-gray-400 transition-all hover:bg-white/5 rounded-r-lg">
                            <Share2 size={18}/>
                        </button>
                    </div>
                    
                    <button onClick={handleGetBriefing} className="bg-cyber-purple/20 border border-cyber-purple/40 text-cyber-purple hover:bg-cyber-purple hover:text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                        {loadingBriefing ? <RefreshCw className="animate-spin" size={14}/> : <Zap size={14}/>}
                        {briefing ? "Refresh Intel" : "AI Intel Briefing"}
                    </button>
                </div>
            </div>

            {/* AI Briefing Segment */}
            {briefing && (
                <div className="bg-cyber-panel border border-cyber-purple/30 rounded-2xl p-6 relative overflow-hidden group shadow-2xl">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Activity size={80} className="text-cyber-purple" />
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-cyber-purple font-black uppercase text-[10px] tracking-widest mb-2 flex items-center gap-2">
                           <Activity size={12}/> STRATEGIC ADVISORY
                        </h3>
                        <p className="text-white text-xl leading-relaxed italic font-medium">"{briefing}"</p>
                    </div>
                </div>
            )}

            {/* Core Metrics Visualizer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Revenue 24h', val: `$${dailyRevenue.toFixed(2)}`, sub: `${todaysSales.length} Transactions`, icon: DollarSign, color: 'text-cyber-green' },
                    { label: 'Net Profit', val: `$${dailyProfit.toFixed(2)}`, sub: `Margin: ${dailyRevenue > 0 ? ((dailyProfit/dailyRevenue)*100).toFixed(0) : 0}%`, icon: TrendingUp, color: 'text-cyber-gold' },
                    { label: 'Inventory', val: activeStock, sub: `${batches.length} Total Units`, icon: Package, color: 'text-blue-400' },
                    { label: 'Critical Alerts', val: lowStock, sub: 'Low Stock Warnings', icon: AlertTriangle, color: lowStock > 0 ? 'text-red-500' : 'text-gray-500' },
                ].map((stat, i) => (
                    <div key={i} className="bg-cyber-panel p-6 rounded-2xl group hover:border-white/20 transition-all border border-white/5 shadow-xl">
                        <div className="flex justify-between items-start mb-3">
                            <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{stat.label}</span>
                            <stat.icon size={18} className={stat.color} />
                        </div>
                        <div className="text-3xl font-mono text-white font-black">{stat.val}</div>
                        <div className="text-[10px] text-gray-400 mt-2 font-mono uppercase">{stat.sub}</div>
                    </div>
                ))}
            </div>

            {/* Command Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Primary Action */}
                <button 
                  onClick={() => onNavigate('POS')} 
                  className="lg:col-span-2 group relative bg-gradient-to-br from-cyber-panel to-black border border-white/10 hover:border-cyber-gold rounded-3xl p-10 transition-all overflow-hidden text-left shadow-2xl"
                >
                    <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-700">
                        <ShoppingCart size={180} />
                    </div>
                    <div className="relative z-10 h-full flex flex-col justify-between">
                        <div>
                            <h3 className="text-4xl font-black text-white mb-3 group-hover:text-cyber-gold transition-colors tracking-tight">SALES TERMINAL</h3>
                            <p className="text-gray-500 text-lg max-w-md group-hover:text-gray-300 leading-relaxed">
                                Process transactions, monitor margins, and update the global ledger.
                            </p>
                        </div>
                        <div className="mt-8 flex items-center gap-2 text-cyber-gold font-black uppercase tracking-widest text-sm">
                            Initialize POS <ArrowUpRight size={18} />
                        </div>
                    </div>
                </button>
                
                {/* Secondary Actions */}
                <div className="grid grid-cols-2 gap-4">
                    {[
                        { id: 'STOCK', label: 'Inventory', icon: Package, color: 'text-blue-400' },
                        { id: 'CUSTOMERS', label: 'CRM', icon: Users, color: 'text-cyber-purple' },
                        { id: 'MARKET_GAME', label: 'GTN Trade', icon: Gamepad2, color: 'text-cyber-gold' },
                        { id: 'NETWORK', label: 'Network', icon: Globe, color: 'text-cyber-green' },
                        { id: 'ANALYTICS', label: 'Intelligence', icon: PieChart, color: 'text-pink-400' },
                        { id: 'LEDGER', label: 'The Vault', icon: FileText, color: 'text-gray-400' },
                    ].map(item => (
                        <button 
                          key={item.id}
                          onClick={() => onNavigate(item.id as ViewState)} 
                          className="bg-cyber-panel hover:bg-white/5 border border-white/5 hover:border-white/20 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 transition-all group shadow-lg"
                        >
                            <item.icon size={32} className={`${item.color} group-hover:scale-110 transition-transform`} />
                            <span className="font-black text-[10px] text-white uppercase tracking-widest">{item.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Live Telemetry */}
            <div className="bg-cyber-panel border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <h3 className="text-white font-black uppercase text-xs tracking-widest flex items-center gap-3">
                        <Activity size={18} className="text-cyber-green animate-pulse"/> TRANSACTION TELEMETRY
                    </h3>
                    <div className="text-[9px] text-gray-500 font-mono flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-white/10">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyber-green"></div>
                        <span>REAL-TIME STREAM ACTIVE</span>
                    </div>
                </div>
                <div className="p-4 space-y-3 max-h-80 overflow-y-auto custom-scrollbar bg-black/40">
                    {sales.length > 0 ? [...sales].reverse().slice(0, 8).map(s => (
                        <div key={s.id} className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5 hover:border-white/20 transition-all group">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-cyber-green/10 rounded-lg group-hover:bg-cyber-green/20 transition-colors">
                                    <TrendingUp size={16} className="text-cyber-green"/>
                                </div>
                                <div>
                                    <div className="text-white font-bold text-sm tracking-tight">{s.customerName}</div>
                                    <div className="text-[10px] text-gray-500 font-mono uppercase">{s.batchName} // {s.weight}{inventoryTerms.unit}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-white font-black font-mono">+${s.amount.toFixed(2)}</div>
                                <div className="text-[9px] text-gray-600 font-mono">{new Date(s.timestamp).toLocaleTimeString()}</div>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center text-gray-600 py-16 text-xs uppercase tracking-[0.2em] opacity-50">
                            Awaiting incoming transmission...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;