import React, { useMemo } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { User, Shield, TrendingUp, Activity, Terminal, Crosshair, Hexagon, Zap, Award, Star, Lock } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

const DealerProfile: React.FC = () => {
    const { settings, sales, financials, batches, operationalExpenses, inventoryTerms } = useAppStore(state => ({
        settings: state.settings,
        sales: state.sales,
        financials: state.financials,
        batches: state.batches,
        operationalExpenses: state.operationalExpenses,
        inventoryTerms: state.inventoryTerms
    }));

    // --- DEALER STAT CALCULATIONS ---
    const stats = useMemo(() => {
        // 1. Negotiation (Avg Profit Margin)
        const totalRev = sales.reduce((a, b) => a + b.amount, 0);
        const totalProfit = sales.reduce((a, b) => a + b.profit, 0);
        const margin = totalRev > 0 ? (totalProfit / totalRev) * 100 : 0;
        const negScore = Math.min(100, Math.max(0, margin * 2)); // 50% margin = 100 score

        // 2. Logistics (Stock Turnover)
        const activeBatches = batches.length;
        const totalSalesCount = sales.length;
        const logScore = Math.min(100, (totalSalesCount / (activeBatches || 1)) * 10);

        // 3. Heat Res (Risk Management)
        const cashRatio = financials.cashOnHand / (financials.cashOnHand + financials.bankBalance + 1);
        const heatScore = Math.min(100, cashRatio * 100); // More cash on hand = Higher Risk tolerance/Heat handling

        // 4. Influence (Reputation)
        const repScore = Math.min(100, settings.reputationScore / 20);

        // 5. Volume (Scale)
        const volScore = Math.min(100, totalRev / 100); 

        return {
            negotiation: Math.round(negScore),
            logistics: Math.round(logScore),
            heat: Math.round(heatScore),
            influence: Math.round(repScore),
            volume: Math.round(volScore)
        };
    }, [sales, batches, financials, settings.reputationScore]);

    // --- ARCHETYPE DETERMINATION ---
    const archetype = useMemo(() => {
        if (stats.volume > 80 && stats.negotiation < 40) return { title: "THE WHALE", desc: "High volume, low margin mover.", color: "text-blue-400" };
        if (stats.negotiation > 80) return { title: "THE SHARK", desc: "Ruthless efficiency. Maximum profit.", color: "text-red-500" };
        if (stats.heat > 80) return { title: "THE GHOST", desc: "High liquidity. Hard to track.", color: "text-gray-400" };
        if (stats.influence > 80) return { title: "THE DON", desc: "Authority figure. High reputation.", color: "text-cyber-gold" };
        return { title: "THE OPERATOR", desc: "Balanced stats. Adaptive strategy.", color: "text-cyber-green" };
    }, [stats]);

    // --- MOCK AUDIT LOG (Derived from recent data) ---
    const auditLog = useMemo(() => {
        const logs = [];
        // Add recent sales
        sales.slice(-5).forEach(s => logs.push({ type: 'SALE', text: `Transaction: $${s.amount.toFixed(2)} - ${s.customerName}`, time: s.timestamp }));
        // Add batch adds
        batches.slice(0, 3).forEach(b => logs.push({ type: 'STOCK', text: `Acquired Asset: ${b.name}`, time: b.dateAdded }));
        // Add expenses
        operationalExpenses.slice(-3).forEach(e => logs.push({ type: 'EXPENSE', text: `Ledger Deduction: $${e.amount}`, time: e.timestamp }));
        
        return logs.sort((a,b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    }, [sales, batches, operationalExpenses]);

    const radarData = [
        { subject: 'NEG', value: stats.negotiation, fullMark: 100 },
        { subject: 'LOG', value: stats.logistics, fullMark: 100 },
        { subject: 'RISK', value: stats.heat, fullMark: 100 },
        { subject: 'REP', value: stats.influence, fullMark: 100 },
        { subject: 'VOL', value: stats.volume, fullMark: 100 },
    ];

    return (
        <div className="h-full flex flex-col gap-6 animate-fade-in pb-20">
            {/* HEADER CARD */}
            <div className="bg-cyber-panel border border-white/10 rounded-2xl p-8 relative overflow-hidden">
                <div className={`absolute top-0 right-0 p-8 opacity-10 pointer-events-none transform scale-150`}>
                    <User size={200} />
                </div>
                
                <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                    <div className="w-32 h-32 rounded-full border-4 border-cyber-gold bg-black flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.3)]">
                        <span className="text-4xl font-black text-cyber-gold">{settings.operatorAlias.substring(0, 1)}</span>
                    </div>
                    
                    <div className="text-center md:text-left">
                        <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
                            <h2 className="text-4xl font-black text-white uppercase tracking-tighter">{settings.operatorAlias}</h2>
                            {settings.auditLevel === 'VERIFIED' && <Shield size={24} className="text-cyber-green" />}
                        </div>
                        <div className={`text-xl font-bold uppercase tracking-widest mb-4 ${archetype.color}`}>{archetype.title}</div>
                        <div className="flex gap-4 justify-center md:justify-start">
                            <div className="bg-black/40 px-4 py-2 rounded-lg border border-white/10">
                                <span className="text-[10px] text-gray-500 uppercase font-bold block">Net Worth</span>
                                <span className="text-white font-mono font-bold">${(financials.cashOnHand + financials.bankBalance).toFixed(0)}</span>
                            </div>
                            <div className="bg-black/40 px-4 py-2 rounded-lg border border-white/10">
                                <span className="text-[10px] text-gray-500 uppercase font-bold block">Rep Score</span>
                                <span className="text-cyber-gold font-mono font-bold">{settings.reputationScore}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
                
                {/* SKILL TREE & STATS */}
                <div className="bg-cyber-panel border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center relative">
                    <h3 className="absolute top-6 left-6 text-white font-bold uppercase text-sm flex items-center gap-2"><Hexagon size={16}/> Dealer Metrics</h3>
                    
                    <div className="w-full h-64 mt-8">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                <PolarGrid stroke="#333" strokeDasharray="3 3"/>
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#666', fontSize: 10, fontWeight: 'bold' }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar name="Skills" dataKey="value" stroke="#D4AF37" strokeWidth={3} fill="#D4AF37" fillOpacity={0.4} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-2 gap-4 w-full mt-4">
                        <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-xs text-gray-400 font-bold uppercase">Neg.</span>
                                <span className="text-cyber-green font-bold">{stats.negotiation}</span>
                            </div>
                            <div className="w-full bg-gray-800 h-1 rounded-full"><div style={{width: `${stats.negotiation}%`}} className="bg-cyber-green h-full rounded-full"></div></div>
                        </div>
                        <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-xs text-gray-400 font-bold uppercase">Vol.</span>
                                <span className="text-blue-400 font-bold">{stats.volume}</span>
                            </div>
                            <div className="w-full bg-gray-800 h-1 rounded-full"><div style={{width: `${stats.volume}%`}} className="bg-blue-400 h-full rounded-full"></div></div>
                        </div>
                    </div>
                </div>

                {/* SKILL NODES (VISUAL ONLY FOR NOW) */}
                <div className="bg-cyber-panel border border-white/10 rounded-2xl p-6 overflow-hidden relative">
                    <h3 className="text-white font-bold uppercase text-sm flex items-center gap-2 mb-6"><Zap size={16} className="text-cyber-purple"/> Active Traits</h3>
                    
                    <div className="space-y-4 relative z-10">
                        <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/10 group hover:border-cyber-purple/50 transition-all">
                            <div className="p-3 bg-cyber-purple/20 text-cyber-purple rounded-lg"><Star size={20}/></div>
                            <div>
                                <h4 className="text-white font-bold text-sm">{archetype.title} Protocol</h4>
                                <p className="text-gray-500 text-xs mt-1">{archetype.desc}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/10 group hover:border-cyber-gold/50 transition-all">
                            <div className="p-3 bg-cyber-gold/20 text-cyber-gold rounded-lg"><Award size={20}/></div>
                            <div>
                                <h4 className="text-white font-bold text-sm">Verified Status</h4>
                                <p className="text-gray-500 text-xs mt-1">
                                    {settings.auditLevel === 'VERIFIED' ? "Shadow Council Approved. Access to global market." : "Pending Audit. Market access restricted."}
                                </p>
                            </div>
                        </div>

                        <div className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${stats.negotiation > 70 ? 'bg-white/5 border-white/10' : 'bg-black/40 border-white/5 opacity-50'}`}>
                            <div className={`p-3 rounded-lg ${stats.negotiation > 70 ? 'bg-cyber-green/20 text-cyber-green' : 'bg-gray-800 text-gray-500'}`}><Lock size={20}/></div>
                            <div>
                                <h4 className={`font-bold text-sm ${stats.negotiation > 70 ? 'text-white' : 'text-gray-500'}`}>Deep Margin (Locked)</h4>
                                <p className="text-gray-500 text-xs mt-1">Requires Negotiation 70+. Unlocks advanced pricing analytics.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* AUDIT LOG */}
                <div className="bg-black border border-white/10 rounded-2xl p-6 font-mono text-xs overflow-hidden flex flex-col">
                    <h3 className="text-cyber-green font-bold uppercase text-sm flex items-center gap-2 mb-4"><Terminal size={16}/> System Audit Log</h3>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
                        {auditLog.map((log, i) => (
                            <div key={i} className="flex gap-3 items-start opacity-80 hover:opacity-100 transition-opacity">
                                <span className="text-gray-600 shrink-0">{new Date(log.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                <div>
                                    <span className={`font-bold mr-2 ${
                                        log.type === 'SALE' ? 'text-cyber-green' : 
                                        log.type === 'EXPENSE' ? 'text-red-500' : 'text-blue-400'
                                    }`}>[{log.type}]</span>
                                    <span className="text-gray-300">{log.text}</span>
                                </div>
                            </div>
                        ))}
                        <div className="text-gray-600 mt-4 pt-4 border-t border-gray-800">
                            > END OF STREAM_
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default DealerProfile;