import React, { useState, useEffect } from 'react';
import { Shield, Ghost, ArrowRight, Settings, Download, X, Zap, Wifi, Database } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';

interface BootSequenceProps {
    onSelectOperator: () => void;
    onConnectGhost: (channelId: string) => void;
}

const BOOT_MESSAGES = [
    { text: 'INITIATING SMP-AI KERNEL V2.6.0...', delay: 100 },
    { text: 'LOADING NEURAL INTERFACE...', delay: 300 },
    { text: 'CHECKING SECURE UPLINK...', delay: 200 },
    { text: 'CONNECTION ESTABLISHED.', delay: 500, color: 'text-cyber-green' },
    { text: 'DECRYPTING DATA STREAMS...', delay: 400 },
    { text: 'ACCESS PROTOCOL:', delay: 800 },
];

const BootSequence: React.FC<BootSequenceProps> = ({ onSelectOperator, onConnectGhost }) => {
    const [bootLog, setBootLog] = useState<any[]>([]);
    const [sequenceComplete, setSequenceComplete] = useState(false);
    const [showOptions, setShowOptions] = useState(false);

    const { highFidelityMode, toggleHighFidelityMode, isInstallable, triggerInstallPrompt } = useAppStore(state => ({
        highFidelityMode: state.highFidelityMode,
        toggleHighFidelityMode: state.toggleHighFidelityMode,
        isInstallable: state.isInstallable,
        triggerInstallPrompt: state.triggerInstallPrompt
    }));

    useEffect(() => {
        let timer = 0;
        BOOT_MESSAGES.forEach((msg, index) => {
            timer += msg.delay;
            setTimeout(() => {
                setBootLog(prev => [...prev, msg]);
                if (index === BOOT_MESSAGES.length - 1) {
                    setTimeout(() => setSequenceComplete(true), 500);
                }
            }, timer);
        });
    }, []);

    const handleGhostConnect = () => {
        // For simplicity, we use a placeholder that CustomerPortal will handle.
        onConnectGhost("GHOST-CONNECT");
    }

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden font-mono">
            {/* Background FX */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:30px_30px] opacity-50 animate-pulse-slow"></div>
            <div className="absolute inset-0 bg-gradient-radial from-transparent to-black pointer-events-none"></div>

            <div className="w-full max-w-2xl text-left">
                <div className="bg-black/80 backdrop-blur-sm border border-white/10 rounded-xl p-6 shadow-2xl h-96 flex flex-col">
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-4">
                        {bootLog.map((msg, i) => (
                            <p key={i} className={`text-xs md:text-sm animate-fade-in ${msg.color || 'text-gray-400'}`}>
                                <span className="text-gray-600 mr-2">&gt;</span>{msg.text}
                            </p>
                        ))}
                    </div>

                    {sequenceComplete && (
                        <div className="mt-auto pt-4 border-t border-white/10 animate-fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button onClick={onSelectOperator} className="group flex items-center justify-between p-4 bg-white/5 hover:bg-cyber-gold hover:text-black border border-white/10 hover:border-cyber-gold rounded-lg transition-all">
                                    <div className="flex items-center gap-3">
                                        <Shield className="text-cyber-gold group-hover:text-black" />
                                        <span className="font-bold uppercase tracking-wider">Operator</span>
                                    </div>
                                    <ArrowRight className="group-hover:translate-x-1 transition-transform"/>
                                </button>
                                <button onClick={handleGhostConnect} className="group flex items-center justify-between p-4 bg-white/5 hover:bg-cyber-green hover:text-black border border-white/10 hover:border-cyber-green rounded-lg transition-all">
                                     <div className="flex items-center gap-3">
                                        <Ghost className="text-cyber-green group-hover:text-black" />
                                        <span className="font-bold uppercase tracking-wider">Ghost Portal</span>
                                    </div>
                                    <ArrowRight className="group-hover:translate-x-1 transition-transform"/>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="text-center mt-4">
                     <button onClick={() => setShowOptions(true)} className="text-gray-600 hover:text-white text-xs uppercase font-bold flex items-center gap-2 mx-auto">
                        <Settings size={12}/> System Options
                    </button>
                </div>
            </div>

            {/* System Options Modal */}
            {showOptions && (
                 <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-cyber-panel border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
                        <button onClick={() => setShowOptions(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20}/></button>
                        <h3 className="text-lg font-bold text-white uppercase mb-6 flex items-center gap-2"><Database size={16}/> System Options</h3>
                        
                        <div className="space-y-4">
                            <div className="flex justify-between items-center bg-white/5 p-4 rounded-lg border border-white/5">
                                <div>
                                    <label className="font-bold text-white flex items-center gap-2"><Zap size={14}/> High Fidelity Mode</label>
                                    <p className="text-[10px] text-gray-500">Enable GPU-accelerated background effects.</p>
                                </div>
                                <button onClick={toggleHighFidelityMode} className={`w-12 h-6 rounded-full p-1 transition-colors ${highFidelityMode ? 'bg-cyber-green' : 'bg-gray-700'}`}>
                                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${highFidelityMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                </button>
                            </div>

                            {isInstallable && (
                                <button onClick={triggerInstallPrompt} className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-left transition-colors">
                                    <div>
                                        <label className="font-bold text-white flex items-center gap-2"><Download size={14}/> Install to Device</label>
                                        <p className="text-[10px] text-gray-500">Add SMP-AI to your home screen for a native app experience.</p>
                                    </div>
                                    <ArrowRight />
                                </button>
                            )}
                        </div>
                    </div>
                 </div>
            )}

        </div>
    );
};

export default BootSequence;