import React, { useState, useEffect } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { ViewState } from '../types';
import { generateDailyBriefing } from '../services/geminiService';
import { LayoutDashboard, Package, ShoppingCart, Users, PieChart, FileText, Settings as SettingsIcon, Zap, RefreshCw, AlertTriangle, TrendingUp, DollarSign, Activity, Wifi, Gamepad2, Globe, Share2, Copy, User } from 'lucide-react';

const Dashboard = ({ onNavigate }: { onNavigate: (v: ViewState) => void }) => {
    const { sales, batches, customers, inventoryTerms, storeChannelId, addNotification } = useAppStore(state => ({
        sales: state.sales,
        batches: state.batches,
        customers: state.customers,
        inventoryTerms: state.inventoryTerms,
        storeChannelId: state.storeChannelId,
        addNotification: state.addNotification
    }));
    const [briefing, setBriefing] = useState<string | null>(null);
    const [loadingBriefing, setLoadingBriefing] = useState(false);

    // Calc Daily Stats
    const today = new Date().toLocaleDateString();
    const todaysSales = sales.filter(s => new Date(s.timestamp).toLocaleDateString() === today);
    const dailyRevenue = todaysSales.reduce((acc, s) => acc + s.amount, 0);
    const dailyProfit = todaysSales.reduce((acc, s) => acc + s.profit, 0);
    const activeStock = batches.filter(b => b.currentStock > 0).length;
    const lowStock = batches.filter(b => b.currentStock < b.actualWeight * 0.2).length;

    // Reactive Background Logic
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const x = e.clientX / window.innerWidth;
            const y = e.clientY / window.innerHeight;
            document.documentElement.style.setProperty('--mouse-x', x.toString());
            document.documentElement.style.setProperty('--mouse-y', y.toString());
        };

        // Dynamic pulse based on revenue (0-1000 range)
        const pulseRate = Math.max(0.5, 4 - (dailyRevenue / 500)); // Faster pulse (lower number) as revenue goes up
        const opacity = Math.min(0.1, 0.03 + (dailyRevenue / 5000)); // Brighter grid
        
        document.documentElement.style.setProperty('--pulse-rate', `${pulseRate}s`);
        document.documentElement.style.setProperty('--grid-opacity', opacity.toString());

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [dailyRevenue]);

    const handleGetBriefing = async () => {
        setLoadingBriefing(true);
        const text = await generateDailyBriefing(sales, batches, customers);
        setBriefing(text);
        setLoadingBriefing(false);
    };

    const copyStoreLink = () => {
        const url = `${window.location.origin}/?mode=ghost&channel=${storeChannelId}`;
        navigator.clipboard.writeText(url);
        addNotification("Ghost Portal Link copied to clipboard.", "SUCCESS");
    };

    return (
        <div className="space-y-6 animate-fade-in relative z-10 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter">
                        Command <span className="text-cyber-gold text-outline">Center</span>
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-green opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyber-green"></span>
                        </span>
                        <p className="text-gray-400 text-xs font-mono">SYSTEM ONLINE • {new Date().toLocaleDateString()}</p>
                    </div>
                </div>
                <div className="flex gap-2 items-center">
                    
                    {/* STORE UPLINK WIDGET */}
                    <div className="hidden md:flex bg-black/40 border border-white/10 rounded-lg p-1 mr-2 items-center">
                        <div className="px-3 py-1 border-r border-white/10">
                            <div className="text-[9px] text-gray-500 uppercase font-bold">Store ID</div>
                            <div className="text-xs font-mono text-cyber-gold">{storeChannelId.substring(0,8)}...</div>
                        </div>
                        <button onClick={copyStoreLink} className="p-2 hover:text-white text-gray-400 transition-colors" title="Copy Store Link">
                            <Share2 size={16}/>
                        </button>
                    </div>

                    <button onClick={() => onNavigate('SETTINGS')} className="bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 hover:text-white px-3 py-2 rounded-lg font-bold transition-all" title="Settings">
                        <SettingsIcon size={20} />
                    </button>
                    <button onClick={handleGetBriefing} className="bg-cyber-purple/20 border border-cyber-purple text-cyber-purple hover:bg-cyber-purple hover:text-white px-4 py-2 rounded-lg font-bold text-xs uppercase flex items-center gap-2 transition-all">
                        {loadingBriefing ? <RefreshCw className="animate-spin" size={14}/> : <Zap size={14}/>}
                        {briefing ? "Refresh Briefing" : "AI Briefing"}
                    </button>
                </div>
            </div>

            {/* Mobile Store Link Button */}
            <button onClick={copyStoreLink} className="md:hidden w-full bg-white/5 border border-white/10 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-cyber-gold uppercase">
                <Share2 size={16}/> Share Store Uplink
            </button>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-cyber-panel border border-white/10 rounded-xl p-5 relative overflow-hidden group hover:border-white/20 transition-all">
                    <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-all"><DollarSign size={40}/></div>
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs text-gray-500 uppercase font-bold">Daily Revenue</span>
                        <DollarSign size={16} className="text-cyber-green"/>
                    </div>
                    <div className="text-2xl font-mono text-white font-bold">${dailyRevenue.toFixed(2)}</div>
                    <div className="text-[10px] text-gray-400 mt-1">{todaysSales.length} Transactions</div>
                </div>
                <div className="bg-cyber-panel border border-white/10 rounded-xl p-5 relative overflow-hidden group hover:border-white/20 transition-all">
                    <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-all"><TrendingUp size={40}/></div>
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs text-gray-500 uppercase font-bold">Net Profit</span>
                        <TrendingUp size={16} className="text-cyber-gold"/>
                    </div>
                    <div className="text-2xl font-mono text-cyber-gold font-bold">${dailyProfit.toFixed(2)}</div>
                    <div className="text-[10px] text-gray-400 mt-1">Margin: {dailyRevenue > 0 ? ((dailyProfit/dailyRevenue)*100).toFixed(0) : 0}%</div>
                </div>
                <div className="bg-cyber-panel border border-white/10 rounded-xl p-5 relative overflow-hidden group hover:border-white/20 transition-all">
                     <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-all"><Package size={40}/></div>
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs text-gray-500 uppercase font-bold">Active Inventory</span>
                        <Package size={16} className="text-blue-400"/>
                    </div>
                    <div className="text-2xl font-mono text-white font-bold">{activeStock} <span className="text-sm text-gray-500 font-sans font-normal">Batches</span></div>
                    <div className="text-[10px] text-gray-400 mt-1">{batches.length} Total Assets</div>
                </div>
                <div className="bg-cyber-panel border border-white/10 rounded-xl p-5 relative overflow-hidden group hover:border-white/20 transition-all">
                     <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-all"><AlertTriangle size={40}/></div>
                     <div className="flex justify-between items-start mb-2">
                        <span className="text-xs text-gray-500 uppercase font-bold">Alerts</span>
                        <AlertTriangle size={16} className={lowStock > 0 ? "text-red-500" : "text-gray-600"}/>
                    </div>
                    <div className={`text-2xl font-mono font-bold ${lowStock > 0 ? 'text-red-500' : 'text-gray-500'}`}>
                        {lowStock}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1">Low {inventoryTerms.stockLabel} Warnings</div>
                </div>
            </div>

            {/* AI Briefing Card */}
            {briefing && (
                <div className="bg-gradient-to-r from-cyber-purple/10 to-blue-500/10 border-l-4 border-l-cyber-purple rounded-r-xl p-6 backdrop-blur-md animate-fade-in shadow-lg">
                    <h3 className="text-cyber-purple font-bold uppercase text-xs mb-2 flex items-center gap-2"><Zap size={14}/> Executive AI Briefing</h3>
                    <p className="text-white text-lg leading-relaxed font-medium italic">"{briefing}"</p>
                </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button onClick={() => onNavigate('POS')} className="group relative bg-cyber-panel border border-white/10 hover:border-cyber-gold rounded-2xl p-8 transition-all overflow-hidden text-left shadow-lg">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
                        <ShoppingCart size={100} />
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-cyber-gold transition-colors">Point of Sale</h3>
                        <p className="text-gray-500 text-sm max-w-xs group-hover:text-gray-300">Launch the sales interface. Access tactical negotiation HUD and process transactions.</p>
                    </div>
                </button>
                
                <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => onNavigate('STOCK')} className="bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-2xl p-6 flex flex-col justify-center items-center gap-2 transition-all group">
                        <Package size={32} className="text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-white">Manage Stock</span>
                    </button>
                    <button onClick={() => onNavigate('MARKET_GAME')} className="bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-2xl p-6 flex flex-col justify-center items-center gap-2 transition-all group">
                        <Gamepad2 size={32} className="text-cyber-gold mb-2 group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-white">Global Trade</span>
                    </button>
                    <button onClick={() => onNavigate('NETWORK')} className="bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-2xl p-6 flex flex-col justify-center items-center gap-2 transition-all group">
                        <Globe size={32} className="text-cyber-purple mb-2 group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-white">Network</span>
                    </button>
                    <button onClick={() => onNavigate('LEDGER')} className="bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-2xl p-6 flex flex-col justify-center items-center gap-2 transition-all group">
                        <FileText size={32} className="text-gray-400 mb-2 group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-white">Ledger</span>
                    </button>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-cyber-panel border border-white/10 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-white font-bold uppercase text-sm flex items-center gap-2"><Activity size={16}/> Live Data Stream</h3>
                    <div className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
                        <Wifi size={10} className="text-cyber-green"/> SIGNAL STRONG
                    </div>
                </div>
                <div className="space-y-2 font-mono text-sm">
                    {sales.length > 0 ? sales.slice().reverse().slice(0, 5).map(s => (
                        <div key={s.id} className="flex justify-between items-center bg-black/40 p-3 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                            <div className="flex items-center gap-3">
                                <span className="text-cyber-green text-xs font-bold mr-2">[SALE]</span>
                                <div>
                                    <div className="text-gray-300 text-xs">{s.customerName}</div>
                                    <div className="text-[10px] text-gray-600">{s.batchName} / {s.weight}{inventoryTerms.unit}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-white font-bold">+${s.amount.toFixed(2)}</div>
                                <div className="text-[10px] text-gray-600">{new Date(s.timestamp).toLocaleTimeString()}</div>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center text-gray-600 py-6 text-xs border border-dashed border-gray-800 rounded">
                            <Activity className="mx-auto mb-2 opacity-20"/>
                            Awaiting transaction data stream...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;