import React, { useState, useMemo } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { Partner, Referral } from '../types';
import { Users, Plus, DollarSign, ArrowUpRight, TrendingUp, Link2, Trash2, Briefcase, Grid, Activity, Map, BarChart2, Radio, Zap, Globe, Hexagon, Layers, Crosshair, TrendingDown, AlertCircle, Wallet, Share2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ReferenceLine, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ComposedChart, Line } from 'recharts';

const Network: React.FC = () => {
    const { partners, referrals, customers, addPartner, deletePartner, addReferral, storeChannelId, addNotification } = useAppStore(state => ({
        partners: state.partners,
        referrals: state.referrals,
        customers: state.customers,
        addPartner: state.addPartner,
        deletePartner: state.deletePartner,
        addReferral: state.addReferral,
        storeChannelId: state.storeChannelId,
        addNotification: state.addNotification,
    }));
    const [viewMode, setViewMode] = useState<'MAP' | 'DEPTH' | 'FINANCIAL'>('MAP');
    const [selectedSector, setSelectedSector] = useState<string | null>(null);
    const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
    const [showTools, setShowTools] = useState(false);

    // Forms State
    const [pName, setPName] = useState('');
    const [pType, setPType] = useState<'Supplier' | 'Distributor'>('Supplier');
    const [rCustomer, setRCustomer] = useState('');
    const [rPartner, setRPartner] = useState('');
    const [rAmount, setRAmount] = useState('');
    const [rComm, setRComm] = useState('');

    // --- ANALYTICS ENGINES ---

    // 1. GRID HEATMAP ENGINE
    const gridData = useMemo(() => {
        const gridSize = 6; // 6x6 Grid
        const grid = Array(gridSize * gridSize).fill(null).map((_, i) => ({
            id: i,
            x: i % gridSize,
            y: Math.floor(i / gridSize),
            volume: 0,
            partners: [] as Partner[],
            activityLevel: 0
        }));

        partners.forEach(p => {
            // Hash ID to place in grid deterministically
            const hash = p.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const index = hash % (gridSize * gridSize);
            grid[index].partners.push(p);
            grid[index].volume += p.totalVolumeGenerated;
        });

        // Normalize activity for heat color
        const maxVol = Math.max(...grid.map(g => g.volume)) || 1;
        grid.forEach(g => {
            g.activityLevel = g.volume / maxVol;
        });

        return grid;
    }, [partners]);

    // 2. MASS DEPTH ENGINE
    const depthData = useMemo(() => {
        return partners.map(p => ({
            name: p.name,
            inflow: p.type === 'Supplier' ? p.totalVolumeGenerated : 0,
            outflow: p.type === 'Distributor' ? p.totalVolumeGenerated : 0,
            commission: p.totalCommissionEarned,
            type: p.type
        })).sort((a, b) => (b.inflow + b.outflow) - (a.inflow + a.outflow));
    }, [partners]);

    // 3. FINANCIAL FORENSICS ENGINE (P&L)
    const financialData = useMemo(() => {
        // Map partners to their real transaction history
        const data = partners.map(p => {
            const partnerTx = referrals.filter(r => r.partnerId === p.id);
            const grossRevenue = partnerTx.reduce((sum, r) => sum + r.amount, 0);
            const totalCost = partnerTx.reduce((sum, r) => sum + r.commission, 0);
            const netProfit = grossRevenue - totalCost;
            
            // Efficiency: How much of the revenue do we keep?
            const efficiency = grossRevenue > 0 ? ((grossRevenue - totalCost) / grossRevenue) * 100 : 0;

            return {
                id: p.id,
                name: p.name,
                grossRevenue,
                totalCost, // Commission Paid (Loss)
                netProfit,
                efficiency,
                txCount: partnerTx.length
            };
        }).sort((a,b) => b.netProfit - a.netProfit);

        const totalNet = data.reduce((sum, d) => sum + d.netProfit, 0);
        const totalBleed = data.reduce((sum, d) => sum + d.totalCost, 0);

        return { partnerMetrics: data, totalNet, totalBleed };
    }, [partners, referrals]);

    // 4. HIGH ENTROPY TRANSACTIONS (Specific Losses)
    const entropyLog = useMemo(() => {
        return referrals
            .map(r => ({
                ...r,
                ratio: r.amount > 0 ? (r.commission / r.amount) * 100 : 0
            }))
            .sort((a, b) => b.commission - a.commission) // Sort by highest cost
            .slice(0, 10);
    }, [referrals]);

    // 5. TELEMETRY STATS
    const activePartner = partners.find(p => p.id === selectedPartnerId);
    const partnerRadarData = activePartner ? [
        { subject: 'Volume', A: (activePartner.totalVolumeGenerated / 1000) * 100, fullMark: 100 },
        { subject: 'Reliability', A: 85 + (activePartner.totalCommissionEarned % 15), fullMark: 100 }, 
        { subject: 'Speed', A: 60 + (activePartner.id.length * 2), fullMark: 100 }, 
        { subject: 'Risk', A: activePartner.type === 'Supplier' ? 30 : 60, fullMark: 100 },
        { subject: 'Reach', A: activePartner.type === 'Distributor' ? 90 : 40, fullMark: 100 },
    ] : [];

    // HANDLERS
    const handleCreatePartner = (e: React.FormEvent) => {
        e.preventDefault();
        addPartner({
            id: Date.now().toString(),
            name: pName,
            type: pType,
            notes: 'Initialized via Grid',
            totalVolumeGenerated: 0,
            totalCommissionEarned: 0
        });
        setPName(''); setShowTools(false);
    };

    const handleLogReferral = (e: React.FormEvent) => {
        e.preventDefault();
        const partner = partners.find(p => p.id === rPartner);
        const customer = customers.find(c => c.id === rCustomer);
        if (!partner || !customer) return;

        addReferral({
            id: Date.now().toString(),
            partnerId: partner.id,
            partnerName: partner.name,
            customerId: customer.id,
            customerName: customer.name,
            timestamp: new Date().toISOString(),
            amount: parseFloat(rAmount),
            commission: parseFloat(rComm) || 0,
            notes: 'Manual Entry'
        });
        setRAmount(''); setRComm(''); setShowTools(false);
    };

    const handleCopyGhostLink = () => {
        const url = `${window.location.origin}/?mode=ghost&channel=${storeChannelId}`;
        navigator.clipboard.writeText(url);
        addNotification("Secure Storefront Link copied to clipboard.", "SUCCESS");
    };

    return (
        <div className="h-full flex flex-col space-y-6 animate-fade-in relative pb-20">
            
            {/* HEADER & CONTROL DECK */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-cyber-panel border border-white/10 p-6 rounded-2xl">
                <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight uppercase flex items-center gap-2">
                        <Globe size={24} className="text-cyber-purple"/> Neural Grid
                    </h2>
                    <div className="flex gap-4 mt-2 text-[10px] uppercase font-bold text-gray-500">
                        <span className="flex items-center gap-1"><Activity size={10} className="text-cyber-green"/> Nodes: {partners.length}</span>
                        <span className="flex items-center gap-1"><Zap size={10} className="text-cyber-gold"/> Throughput: ${partners.reduce((a,b) => a + b.totalVolumeGenerated, 0).toFixed(0)}</span>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button 
                        onClick={handleCopyGhostLink}
                        className="px-4 py-2 rounded-lg text-xs font-bold uppercase flex items-center gap-2 border bg-cyber-gold/20 border-cyber-gold text-cyber-gold hover:bg-cyber-gold hover:text-black transition-all"
                    >
                        <Share2 size={14}/> Ghost Link
                    </button>
                    <button 
                        onClick={() => setViewMode('MAP')} 
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase flex items-center gap-2 border transition-all ${viewMode === 'MAP' ? 'bg-cyber-purple/20 border-cyber-purple text-white' : 'bg-black/40 border-white/10 text-gray-500 hover:text-white'}`}
                    >
                        <Map size={14}/> Sector Map
                    </button>
                    <button 
                        onClick={() => setViewMode('DEPTH')} 
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase flex items-center gap-2 border transition-all ${viewMode === 'DEPTH' ? 'bg-cyber-gold/20 border-cyber-gold text-white' : 'bg-black/40 border-white/10 text-gray-500 hover:text-white'}`}
                    >
                        <Layers size={14}/> Mass Depth
                    </button>
                    <button 
                        onClick={() => setViewMode('FINANCIAL')} 
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase flex items-center gap-2 border transition-all ${viewMode === 'FINANCIAL' ? 'bg-cyber-green/20 border-cyber-green text-white' : 'bg-black/40 border-white/10 text-gray-500 hover:text-white'}`}
                    >
                        <DollarSign size={14}/> P&L Ledger
                    </button>
                    <button 
                        onClick={() => setShowTools(!showTools)} 
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase flex items-center gap-2 border transition-all ${showTools ? 'bg-white/10 border-white/30 text-white' : 'bg-black/40 border-white/10 text-gray-500 hover:text-white'}`}
                    >
                        <Plus size={14}/> Manage Uplinks
                    </button>
                </div>
            </div>

            {/* MAIN VISUALIZATION AREA */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
                
                {/* PRIMARY VIEWPORT (LEFT - EXPANDED) */}
                <div className={`bg-cyber-panel border border-white/10 rounded-2xl relative overflow-hidden flex flex-col ${viewMode === 'FINANCIAL' ? 'lg:col-span-3' : 'lg:col-span-2'}`}>
                    
                    {/* MODE: MAP (HEATMAP) */}
                    {viewMode === 'MAP' && (
                        <div className="p-8 h-full flex flex-col items-center justify-center relative">
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
                            
                            <div className="grid grid-cols-6 gap-2 w-full max-w-lg aspect-square relative z-10">
                                {gridData.map((cell) => {
                                    let bg = 'bg-white/5';
                                    let border = 'border-white/5';
                                    let glow = '';
                                    
                                    if (cell.activityLevel > 0) {
                                        if (cell.activityLevel > 0.7) { bg = 'bg-cyber-gold/40'; border = 'border-cyber-gold'; glow = 'shadow-[0_0_15px_rgba(212,175,55,0.4)]'; }
                                        else if (cell.activityLevel > 0.3) { bg = 'bg-cyber-purple/40'; border = 'border-cyber-purple'; glow = 'shadow-[0_0_10px_rgba(99,102,241,0.3)]'; }
                                        else { bg = 'bg-blue-500/20'; border = 'border-blue-500/50'; }
                                    }

                                    return (
                                        <div 
                                            key={cell.id}
                                            onClick={() => { setSelectedSector(cell.id.toString()); setSelectedPartnerId(null); }}
                                            className={`rounded-md border ${border} ${bg} ${glow} transition-all duration-300 hover:scale-105 cursor-pointer relative group flex items-center justify-center`}
                                        >
                                            {cell.partners.length > 0 && (
                                                <div className="text-[10px] font-mono font-bold text-white opacity-50 group-hover:opacity-100">
                                                    {cell.partners.length}
                                                </div>
                                            )}
                                            {selectedSector === cell.id.toString() && (
                                                <div className="absolute inset-0 border-2 border-white animate-pulse rounded-md pointer-events-none"></div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            
                            <div className="absolute bottom-4 left-6 flex gap-4 text-[10px] uppercase font-bold text-gray-500">
                                <span className="flex items-center gap-1"><div className="w-2 h-2 bg-cyber-gold rounded-full"></div> High Vol</span>
                                <span className="flex items-center gap-1"><div className="w-2 h-2 bg-cyber-purple rounded-full"></div> Mid Vol</span>
                                <span className="flex items-center gap-1"><div className="w-2 h-2 bg-blue-500/20 rounded-full"></div> Low Vol</span>
                            </div>
                        </div>
                    )}

                    {/* MODE: FINANCIAL P&L (NEW) */}
                    {viewMode === 'FINANCIAL' && (
                        <div className="p-6 h-full flex flex-col space-y-6">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-3 gap-6">
                                <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                                    <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Network Gross Revenue</div>
                                    <div className="text-2xl font-mono text-white font-bold">${partners.reduce((a,b) => a + b.totalVolumeGenerated, 0).toFixed(0)}</div>
                                </div>
                                <div className="bg-black/30 rounded-xl p-4 border border-red-500/20">
                                    <div className="text-[10px] text-red-400 uppercase font-bold mb-1">Commission Bleed (Cost)</div>
                                    <div className="text-2xl font-mono text-red-500 font-bold">-${financialData.totalBleed.toFixed(0)}</div>
                                </div>
                                <div className="bg-black/30 rounded-xl p-4 border border-cyber-green/20">
                                    <div className="text-[10px] text-cyber-green uppercase font-bold mb-1">Net Network Profit</div>
                                    <div className="text-2xl font-mono text-cyber-green font-bold">${financialData.totalNet.toFixed(0)}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
                                {/* P&L CHART */}
                                <div className="bg-black/20 rounded-xl p-4 border border-white/5 flex flex-col">
                                    <h3 className="text-xs text-white font-bold uppercase mb-4 flex items-center gap-2"><BarChart2 size={14}/> Revenue vs Cost per Node</h3>
                                    <div className="flex-1">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <ComposedChart data={financialData.partnerMetrics} layout="vertical" margin={{top: 0, right: 20, left: 20, bottom: 0}}>
                                                <XAxis type="number" stroke="#666" fontSize={10} tickFormatter={(val) => `$${val}`} />
                                                <YAxis dataKey="name" type="category" stroke="#fff" fontSize={10} width={80} />
                                                <Tooltip 
                                                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                                                    contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }}
                                                />
                                                <Bar dataKey="grossRevenue" name="Revenue" fill="#10B981" barSize={12} stackId="a" />
                                                <Bar dataKey="totalCost" name="Commission Cost" fill="#EF4444" barSize={12} stackId="a" />
                                            </ComposedChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* ENTROPY LOG (SPECIFIC LOSSES) */}
                                <div className="bg-black/20 rounded-xl p-4 border border-white/5 flex flex-col">
                                    <h3 className="text-xs text-red-400 font-bold uppercase mb-4 flex items-center gap-2"><TrendingDown size={14}/> High Entropy Transactions (Loss/Cost)</h3>
                                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
                                        {entropyLog.map(r => (
                                            <div key={r.id} className="flex justify-between items-center bg-white/5 p-2 rounded border border-white/5 hover:border-red-500/50 transition-all">
                                                <div>
                                                    <div className="text-xs text-white font-bold">{r.partnerName} <span className="text-gray-500">→</span> {r.customerName}</div>
                                                    <div className="text-[9px] text-gray-500">{new Date(r.timestamp).toLocaleDateString()}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs text-red-500 font-mono font-bold">-${r.commission.toFixed(0)} Cost</div>
                                                    <div className="text-[9px] text-gray-500">on ${r.amount.toFixed(0)} Vol ({r.ratio.toFixed(1)}%)</div>
                                                </div>
                                            </div>
                                        ))}
                                        {entropyLog.length === 0 && <div className="text-center text-gray-500 text-xs italic">No high-cost transactions detected.</div>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* MODE: MASS DEPTH (BID/ASK) */}
                    {viewMode === 'DEPTH' && (
                        <div className="p-6 h-full flex flex-col">
                            <h3 className="text-cyber-green font-bold uppercase text-xs mb-6 flex items-center gap-2">
                                <Layers size={14}/> Supply Inflow vs Distribution Outflow
                            </h3>
                            <div className="flex-1 w-full min-h-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        layout="vertical"
                                        data={depthData}
                                        stackOffset="sign"
                                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <XAxis type="number" stroke="#666" fontSize={10} tickFormatter={(val) => `$${Math.abs(val)}`} />
                                        <YAxis dataKey="name" type="category" stroke="#fff" fontSize={10} width={80} hide />
                                        <Tooltip 
                                            cursor={{fill: 'rgba(255,255,255,0.05)'}}
                                            contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }}
                                            formatter={(value: any) => [`$${Math.abs(value)}`, 'Volume']}
                                        />
                                        <ReferenceLine x={0} stroke="#444" />
                                        <Bar dataKey="inflow" fill="#10B981" stackId="stack" name="Supply (In)" barSize={20}>
                                            {depthData.map((entry, index) => (
                                                <Cell key={`cell-in-${index}`} fillOpacity={0.8} />
                                            ))}
                                        </Bar>
                                        <Bar dataKey="outflow" fill="#EF4444" stackId="stack" name="Distribution (Out)" barSize={20}>
                                            {depthData.map((entry, index) => (
                                                <Cell key={`cell-out-${index}`} fill={entry.outflow < 0 ? '#EF4444' : '#F59E0B'} fillOpacity={0.8} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <p className="text-center text-[10px] text-gray-500 mt-4">
                                <span className="text-cyber-green">Green: Supplier Inflow</span> | <span className="text-orange-500">Orange: Distributor Outflow</span>
                            </p>
                        </div>
                    )}
                </div>

                {/* TELEMETRY PANEL (RIGHT - Only in MAP mode or when viewing details) */}
                {viewMode !== 'FINANCIAL' && (
                    <div className="bg-cyber-panel border border-white/10 rounded-2xl flex flex-col p-6 relative overflow-hidden">
                        {selectedSector && gridData[parseInt(selectedSector)].partners.length > 0 ? (
                            <>
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-white font-bold uppercase text-sm flex items-center gap-2"><Crosshair size={16}/> Sector {selectedSector} Analysis</h3>
                                    <button onClick={() => setSelectedSector(null)} className="text-gray-500 hover:text-white"><Grid size={14}/></button>
                                </div>

                                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 mb-4">
                                    {gridData[parseInt(selectedSector)].partners.map(p => (
                                        <div 
                                            key={p.id} 
                                            onClick={() => setSelectedPartnerId(p.id)}
                                            className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedPartnerId === p.id ? 'bg-cyber-gold/20 border-cyber-gold' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                                        >
                                            <div className="flex justify-between items-center">
                                                <span className="text-white font-bold text-xs">{p.name}</span>
                                                <span className="text-[9px] bg-black/40 px-2 py-0.5 rounded text-gray-400">{p.type}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {activePartner && (
                                    <div className="animate-fade-in bg-black/40 rounded-xl p-4 border border-white/10">
                                        <div className="h-32 w-full mb-4">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={partnerRadarData}>
                                                    <PolarGrid stroke="#333" />
                                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#666', fontSize: 9 }} />
                                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                                    <Radar name={activePartner.name} dataKey="A" stroke="#D4AF37" strokeWidth={2} fill="#D4AF37" fillOpacity={0.3} />
                                                </RadarChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                                            <div className="text-gray-500">Total Vol: <span className="text-white">${activePartner.totalVolumeGenerated}</span></div>
                                            <div className="text-gray-500">My Cut: <span className="text-cyber-gold">${activePartner.totalCommissionEarned}</span></div>
                                        </div>
                                        <button onClick={() => deletePartner(activePartner.id)} className="w-full mt-4 flex items-center justify-center gap-2 text-red-500 hover:text-white bg-red-500/10 hover:bg-red-500/50 py-2 rounded text-xs font-bold transition-all">
                                            <Trash2 size={12}/> Disconnect Node
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-50">
                                <Radio size={48} className="mb-4 animate-pulse"/>
                                <p className="text-xs text-center">Select an active sector<br/>to view node telemetry.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* TOOLS MODAL (ADD / LOG) */}
            {showTools && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-cyber-panel border border-white/10 rounded-2xl w-full max-w-2xl p-6 shadow-2xl relative">
                        <button onClick={() => setShowTools(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><Grid size={20}/></button>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* ADD PARTNER */}
                            <div>
                                <h3 className="text-white font-bold uppercase text-sm mb-4 flex items-center gap-2"><Plus size={16} className="text-cyber-green"/> Establish Uplink</h3>
                                <form onSubmit={handleCreatePartner} className="space-y-3">
                                    <input value={pName} onChange={e => setPName(e.target.value)} required className="w-full bg-black/50 border border-white/10 rounded p-2 text-white text-xs outline-none focus:border-cyber-green" placeholder="Entity Name"/>
                                    <select value={pType} onChange={e => setPType(e.target.value as any)} className="w-full bg-black/50 border border-white/10 rounded p-2 text-white text-xs outline-none">
                                        <option value="Supplier">Supplier (Inflow)</option>
                                        <option value="Distributor">Distributor (Outflow)</option>
                                    </select>
                                    <button type="submit" className="w-full bg-cyber-green/20 border border-cyber-green/50 text-cyber-green font-bold py-2 rounded text-xs hover:bg-cyber-green hover:text-black transition-all">Initialize Node</button>
                                </form>
                            </div>

                            {/* LOG REFERRAL */}
                            <div className="border-l border-white/10 pl-8">
                                <h3 className="text-white font-bold uppercase text-sm mb-4 flex items-center gap-2"><Link2 size={16} className="text-cyber-gold"/> Log Transaction</h3>
                                <form onSubmit={handleLogReferral} className="space-y-3">
                                    <select value={rCustomer} onChange={e => setRCustomer(e.target.value)} required className="w-full bg-black/50 border border-white/10 rounded p-2 text-white text-xs outline-none">
                                        <option value="">Select Customer</option>
                                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                    <select value={rPartner} onChange={e => setRPartner(e.target.value)} required className="w-full bg-black/50 border border-white/10 rounded p-2 text-white text-xs outline-none">
                                        <option value="">Select Node</option>
                                        {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input type="number" value={rAmount} onChange={e => setRAmount(e.target.value)} required className="bg-black/50 border border-white/10 rounded p-2 text-white text-xs outline-none" placeholder="Total $"/>
                                        <input type="number" value={rComm} onChange={e => setRComm(e.target.value)} className="bg-black/50 border border-white/10 rounded p-2 text-cyber-gold text-xs outline-none" placeholder="Comm $"/>
                                    </div>
                                    <button type="submit" className="w-full bg-cyber-gold/20 border border-cyber-gold/50 text-cyber-gold font-bold py-2 rounded text-xs hover:bg-cyber-gold hover:text-black transition-all">Record Transfer</button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Network;