import React, { useState, useMemo } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { Partner, Referral } from '../types';
import { Users, Plus, DollarSign, ArrowUpRight, TrendingUp, Link2, Trash2, Briefcase, Grid, Activity, Map, BarChart2, Radio, Zap, Globe, Hexagon, Layers, Crosshair, TrendingDown, AlertCircle, Wallet, Share2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ReferenceLine, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ComposedChart, Line } from 'recharts';

const Network: React.FC = () => {
    // REFACTORED: Individual selectors to prevent Error 185
    const partners = useAppStore(s => s.partners);
    const referrals = useAppStore(s => s.referrals);
    const customers = useAppStore(s => s.customers);
    const storeChannelId = useAppStore(s => s.storeChannelId);
    
    const addPartner = useAppStore(s => s.addPartner);
    const deletePartner = useAppStore(s => s.deletePartner);
    const addReferral = useAppStore(s => s.addReferral);
    const addNotification = useAppStore(s => s.addNotification);

    const [viewMode, setViewMode] = useState<'MAP' | 'DEPTH' | 'FINANCIAL'>('MAP');
    const [selectedSector, setSelectedSector] = useState<string | null>(null);
    const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
    const [showTools, setShowTools] = useState(false);

    const [pName, setPName] = useState('');
    const [pType, setPType] = useState<'Supplier' | 'Distributor'>('Supplier');
    const [rCustomer, setRCustomer] = useState('');
    const [rPartner, setRPartner] = useState('');
    const [rAmount, setRAmount] = useState('');
    const [rComm, setRComm] = useState('');

    const gridData = useMemo(() => {
        const grid = Array(36).fill(null).map((_, i) => ({ id: i, volume: 0, partners: [] as Partner[], activityLevel: 0 }));
        partners.forEach(p => {
            const index = p.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 36;
            grid[index].partners.push(p);
            grid[index].volume += p.totalVolumeGenerated;
        });
        const maxVol = Math.max(...grid.map(g => g.volume)) || 1;
        grid.forEach(g => g.activityLevel = g.volume / maxVol);
        return grid;
    }, [partners]);

    const financialData = useMemo(() => {
        const metrics = partners.map(p => {
            const pTx = referrals.filter(r => r.partnerId === p.id);
            const gross = pTx.reduce((sum, r) => sum + r.amount, 0);
            const cost = pTx.reduce((sum, r) => sum + r.commission, 0);
            return { id: p.id, name: p.name, grossRevenue: gross, totalCost: cost, netProfit: gross - cost };
        }).sort((a,b) => b.netProfit - a.netProfit);
        return { metrics, totalNet: metrics.reduce((s, m) => s + m.netProfit, 0), totalBleed: metrics.reduce((s, m) => s + m.totalCost, 0) };
    }, [partners, referrals]);

    const activePartner = partners.find(p => p.id === selectedPartnerId);

    const handleCopyGhostLink = () => {
        const url = `${window.location.origin}/?mode=ghost&channel=${storeChannelId}`;
        navigator.clipboard.writeText(url);
        addNotification("Secure Storefront Link copied.", "SUCCESS");
    };

    return (
        <div className="h-full flex flex-col space-y-6 animate-fade-in relative pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-cyber-panel border border-white/10 p-6 rounded-2xl">
                <div><h2 className="text-2xl font-bold text-white uppercase flex items-center gap-2"><Globe size={24} className="text-cyber-purple"/> Neural Grid</h2></div>
                <div className="flex gap-2">
                    <button onClick={handleCopyGhostLink} className="px-4 py-2 rounded-lg text-xs font-bold uppercase flex items-center gap-2 border bg-cyber-gold/20 border-cyber-gold text-cyber-gold transition-all"><Share2 size={14}/> Ghost Link</button>
                    <button onClick={() => setViewMode('MAP')} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${viewMode === 'MAP' ? 'bg-cyber-purple/20 border-cyber-purple text-white' : 'border-white/10 text-gray-500'}`}>Map</button>
                    <button onClick={() => setViewMode('FINANCIAL')} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${viewMode === 'FINANCIAL' ? 'bg-cyber-green/20 border-cyber-green text-white' : 'border-white/10 text-gray-500'}`}>Ledger</button>
                    <button onClick={() => setShowTools(!showTools)} className="px-4 py-2 rounded-lg text-xs font-bold uppercase border border-white/10 text-gray-400">+</button>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
                <div className={`bg-cyber-panel border border-white/10 rounded-2xl relative overflow-hidden flex flex-col ${viewMode === 'FINANCIAL' ? 'lg:col-span-3' : 'lg:col-span-2'}`}>
                    {viewMode === 'MAP' && (
                        <div className="p-8 h-full flex items-center justify-center">
                            <div className="grid grid-cols-6 gap-2 w-full max-w-lg aspect-square">
                                {gridData.map((cell) => (
                                    <div key={cell.id} onClick={() => { setSelectedSector(cell.id.toString()); setSelectedPartnerId(null); }} className={`rounded-md border ${cell.activityLevel > 0.7 ? 'bg-cyber-gold/40 border-cyber-gold' : cell.activityLevel > 0 ? 'bg-cyber-purple/40 border-cyber-purple' : 'bg-white/5 border-white/5'} transition-all cursor-pointer flex items-center justify-center`}>
                                        {cell.partners.length > 0 && <div className="text-[10px] font-mono text-white opacity-50">{cell.partners.length}</div>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {viewMode === 'FINANCIAL' && (
                        <div className="p-6 h-full flex flex-col space-y-6">
                            <div className="grid grid-cols-3 gap-6">
                                <div className="bg-black/30 rounded-xl p-4 border border-white/5"><div>Rev</div><div className="text-2xl font-mono font-bold">${partners.reduce((a,b) => a + b.totalVolumeGenerated, 0).toFixed(0)}</div></div>
                                <div className="bg-black/30 rounded-xl p-4 border border-red-500/20"><div>Bleed</div><div className="text-2xl font-mono text-red-500 font-bold">-${financialData.totalBleed.toFixed(0)}</div></div>
                                <div className="bg-black/30 rounded-xl p-4 border border-cyber-green/20"><div>Net</div><div className="text-2xl font-mono text-cyber-green font-bold">${financialData.totalNet.toFixed(0)}</div></div>
                            </div>
                            <div className="flex-1 min-h-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={financialData.metrics} layout="vertical"><XAxis type="number" hide /><YAxis dataKey="name" type="category" stroke="#fff" fontSize={10} width={80} /><Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }} /><Bar dataKey="grossRevenue" fill="#10B981" barSize={12} stackId="a" /><Bar dataKey="totalCost" fill="#EF4444" barSize={12} stackId="a" /></ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>
                {viewMode !== 'FINANCIAL' && (
                    <div className="bg-cyber-panel border border-white/10 rounded-2xl flex flex-col p-6 overflow-hidden">
                        {selectedSector && gridData[parseInt(selectedSector)].partners.length > 0 ? (
                            <>
                                <h3 className="text-white font-bold uppercase text-sm mb-6">Sector {selectedSector} Nodes</h3>
                                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 mb-4">
                                    {gridData[parseInt(selectedSector)].partners.map(p => (
                                        <div key={p.id} onClick={() => setSelectedPartnerId(p.id)} className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedPartnerId === p.id ? 'bg-cyber-gold/20 border-cyber-gold' : 'bg-white/5 border-white/5'}`}>{p.name}</div>
                                    ))}
                                </div>
                                {activePartner && (
                                    <div className="bg-black/40 rounded-xl p-4 border border-white/10 animate-fade-in">
                                        <div className="text-xs text-gray-500">Vol: <span className="text-white">${activePartner.totalVolumeGenerated}</span></div>
                                        <button onClick={() => deletePartner(activePartner.id)} className="w-full mt-4 text-red-500 text-xs font-bold border border-red-500/20 py-2 rounded">Disconnect</button>
                                    </div>
                                )}
                            </>
                        ) : <div className="h-full flex items-center justify-center text-gray-600 text-xs text-center">Empty Sector</div>}
                    </div>
                )}
            </div>

            {showTools && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-cyber-panel border border-white/10 rounded-2xl w-full max-w-2xl p-6 shadow-2xl relative">
                        <button onClick={() => setShowTools(false)} className="absolute top-4 right-4 text-gray-500">X</button>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <form onSubmit={(e) => { e.preventDefault(); addPartner({ id: Date.now().toString(), name: pName, type: pType, notes: '', totalVolumeGenerated: 0, totalCommissionEarned: 0 }); setShowTools(false); }} className="space-y-3">
                                <h3 className="text-white text-xs font-bold uppercase">New Node</h3>
                                <input value={pName} onChange={e => setPName(e.target.value)} required className="w-full bg-black border border-white/10 rounded p-2 text-white text-xs" placeholder="Entity Name"/>
                                <select value={pType} onChange={e => setPType(e.target.value as any)} className="w-full bg-black border border-white/10 rounded p-2 text-white text-xs"><option value="Supplier">Supplier</option><option value="Distributor">Distributor</option></select>
                                <button type="submit" className="w-full bg-cyber-green/20 text-cyber-green py-2 rounded text-xs font-bold">Initialize</button>
                            </form>
                            <form onSubmit={(e) => { e.preventDefault(); const p = partners.find(x => x.id === rPartner); const c = customers.find(x => x.id === rCustomer); if(p && c) addReferral({ id: Date.now().toString(), partnerId: p.id, partnerName: p.name, customerId: c.id, customerName: c.name, timestamp: new Date().toISOString(), amount: parseFloat(rAmount), commission: parseFloat(rComm) || 0, notes: '' }); setShowTools(false); }} className="space-y-3">
                                <h3 className="text-white text-xs font-bold uppercase">Log Tx</h3>
                                <select value={rPartner} onChange={e => setRPartner(e.target.value)} className="w-full bg-black border border-white/10 p-2 text-white text-xs">{partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                                <select value={rCustomer} onChange={e => setRCustomer(e.target.value)} className="w-full bg-black border border-white/10 p-2 text-white text-xs">{customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                                <input type="number" value={rAmount} onChange={e => setRAmount(e.target.value)} className="w-full bg-black border border-white/10 p-2 text-white text-xs" placeholder="Amount"/>
                                <button type="submit" className="w-full bg-cyber-gold/20 text-cyber-gold py-2 rounded text-xs font-bold">Log Record</button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Network;