import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { Ghost, DollarSign, Package, Zap, Cherry, Coins, AlertTriangle, PlayCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { safeFloat } from '../utils/formatting';

const SYMBOLS = [
    { id: 'CHERRY', icon: Cherry, color: 'text-red-500', val: 2 },
    { id: 'ENERGY', icon: Zap, color: 'text-blue-400', val: 5 },
    { id: 'CASH', icon: DollarSign, color: 'text-green-400', val: 10 },
    { id: 'STOCK', icon: Package, color: 'text-yellow-500', val: 25 },
    { id: 'GHOST', icon: Ghost, color: 'text-cyber-purple', val: 100 } // Jackpot
];

const SPIN_COST = 50;

const Reel = ({ symbol, spinning }: { symbol: typeof SYMBOLS[0], spinning: boolean }) => {
    return (
        <div className="h-32 w-full bg-black/60 border-y-4 border-cyber-gold/20 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black pointer-events-none z-10"></div>
            <motion.div
                animate={spinning ? { y: [0, -100, 0] } : { y: 0 }}
                transition={spinning ? { repeat: Infinity, duration: 0.1, ease: "linear" } : { type: "spring", stiffness: 300, damping: 15 }}
                className="flex items-center justify-center"
            >
                {spinning ? (
                    <div className="blur-sm flex flex-col gap-8">
                        <symbol.icon size={48} className="opacity-50"/>
                        <symbol.icon size={48} className="opacity-50"/>
                    </div>
                ) : (
                    <symbol.icon size={64} className={`${symbol.color} filter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]`} />
                )}
            </motion.div>
        </div>
    );
};

const Casino: React.FC = () => {
    const cashOnHand = useAppStore(state => state.financials.cashOnHand);
    const updateFinancials = useAppStore(state => state.updateFinancials);
    const addNotification = useAppStore(state => state.addNotification);

    const [reels, setReels] = useState([SYMBOLS[0], SYMBOLS[1], SYMBOLS[2]]);
    const [spinning, setSpinning] = useState(false);
    const [win, setWin] = useState<number | null>(null);

    const handleSpin = () => {
        if (cashOnHand < SPIN_COST) {
            addNotification("Insufficient Funds for Spin", "ERROR");
            return;
        }
        if (spinning) return;

        updateFinancials({ cashOnHand: safeFloat(cashOnHand - SPIN_COST) });
        setSpinning(true);
        setWin(null);

        // Randomize outcomes
        const results = [
            SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
            SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
            SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
        ];

        // Delays for reel stops
        setTimeout(() => {
            setReels(prev => [results[0], prev[1], prev[2]]); // Stop Reel 1
        }, 1000);
        setTimeout(() => {
            setReels(prev => [results[0], results[1], prev[2]]); // Stop Reel 2
        }, 1500);
        setTimeout(() => {
            setReels(results); // Stop Reel 3
            setSpinning(false);
            checkWin(results);
        }, 2000);
    };

    const checkWin = (results: typeof SYMBOLS) => {
        let payout = 0;
        
        // 3 of a kind
        if (results[0].id === results[1].id && results[1].id === results[2].id) {
            payout = SPIN_COST * results[0].val;
        } 
        // 2 of a kind (Ghost)
        else if (results.filter(r => r.id === 'GHOST').length === 2) {
            payout = SPIN_COST * 5;
        }
        // Any 2 match
        else if (results[0].id === results[1].id || results[1].id === results[2].id || results[0].id === results[2].id) {
            payout = SPIN_COST * 1.5; 
        }

        if (payout > 0) {
            setWin(payout);
            updateFinancials({ cashOnHand: safeFloat(cashOnHand + payout) });
            addNotification(`WIN: $${payout}`, "SUCCESS");
        }
    };

    return (
        <div className="h-full flex flex-col items-center justify-center p-4 relative overflow-hidden animate-fade-in">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none"></div>
            
            {/* Header */}
            <div className="mb-8 text-center relative z-10">
                <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyber-purple via-white to-cyber-purple uppercase tracking-tighter animate-pulse">
                    NEON SLOTS
                </h2>
                <div className="text-xs font-mono text-gray-500 uppercase tracking-[0.5em] mt-2">High Risk // High Reward</div>
            </div>

            {/* Machine */}
            <div className="bg-black border-4 border-cyber-purple rounded-3xl p-8 shadow-[0_0_50px_rgba(99,102,241,0.3)] relative max-w-2xl w-full">
                {/* Balance Display */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black border border-cyber-gold px-6 py-2 rounded-full shadow-lg flex items-center gap-3">
                    <span className="text-cyber-gold font-bold uppercase text-xs">Credits</span>
                    <span className="text-white font-mono text-xl font-bold">${cashOnHand.toFixed(2)}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-gray-900 p-4 rounded-xl border border-white/10 mb-8">
                    <Reel symbol={reels[0]} spinning={spinning} />
                    <Reel symbol={reels[1]} spinning={spinning} />
                    <Reel symbol={reels[2]} spinning={spinning} />
                </div>

                {/* Controls */}
                <div className="flex justify-between items-center">
                    <div className="text-left">
                        <div className="text-[10px] text-gray-500 uppercase font-bold">Bet</div>
                        <div className="text-xl text-white font-mono font-bold">${SPIN_COST}</div>
                    </div>

                    <button 
                        onClick={handleSpin} 
                        disabled={spinning || cashOnHand < SPIN_COST}
                        className="bg-gradient-to-r from-cyber-purple to-blue-600 hover:from-cyber-purple/80 hover:to-blue-500 text-white font-black uppercase text-xl px-12 py-6 rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.5)] transform active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                    >
                       {spinning ? <Zap className="animate-spin" /> : <PlayCircle size={28} />} SPIN
                    </button>

                    <div className="text-right">
                        <div className="text-[10px] text-gray-500 uppercase font-bold">Last Win</div>
                        <div className={`text-xl font-mono font-bold ${win ? 'text-cyber-green animate-bounce' : 'text-gray-600'}`}>
                            ${win || 0}
                        </div>
                    </div>
                </div>
            </div>

            {/* Payout Table */}
            <div className="mt-8 grid grid-cols-3 md:grid-cols-5 gap-4 text-center opacity-70">
                {SYMBOLS.map(s => (
                    <div key={s.id} className="bg-black/40 p-2 rounded border border-white/5">
                        <s.icon size={20} className={`${s.color} mx-auto mb-1`}/>
                        <div className="text-[10px] text-gray-400">3x = {s.val}x</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Casino;