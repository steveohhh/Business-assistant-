
import React, { useState } from 'react';
import { Sparkles, Palette, Layout, Terminal, Box, Droplets, Zap, Leaf } from 'lucide-react';
import { InventoryType } from '../types';

interface ThemeWizardProps {
    onComplete: (inventoryType: InventoryType, customPrompt: string) => void;
    onSkip: () => void;
}

const ThemeWizard: React.FC<ThemeWizardProps> = ({ onComplete, onSkip }) => {
    const [step, setStep] = useState(1);
    const [selectedType, setSelectedType] = useState<InventoryType | null>(null);
    const [customPrompt, setCustomPrompt] = useState('');

    const handleNext = () => {
        if (step === 1 && selectedType) {
            setStep(2);
        } else if (step === 2 && customPrompt) {
            onComplete(selectedType!, customPrompt);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/95 z-[150] overflow-y-auto animate-fade-in custom-scrollbar">
            <div className="min-h-full flex flex-col items-center justify-center p-4 md:p-8">
                
                <div className="w-full max-w-2xl text-center mb-8 shrink-0">
                    <Sparkles size={64} className="mx-auto text-cyber-gold mb-6 animate-pulse-slow" />
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">System Initialization</h2>
                    <p className="text-gray-400">Configure operational parameters and visual cortex.</p>
                </div>

                <div className="w-full max-w-3xl bg-cyber-panel border border-white/10 rounded-2xl p-6 md:p-8 relative overflow-hidden shrink-0 shadow-2xl">
                    {/* Progress Bar */}
                    <div className="absolute top-0 left-0 h-1 bg-cyber-gold transition-all duration-300" style={{ width: step === 1 ? '50%' : '100%' }}></div>
                    
                    {step === 1 && (
                        <div className="animate-slide-in">
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                                <span className="bg-white/10 w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
                                Select Supply Protocol
                            </h3>
                            <p className="text-gray-500 mb-6 text-sm">This determines the terminology used for inventory (e.g., Strains vs. Viscosity).</p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <button
                                    onClick={() => setSelectedType('GRASS')}
                                    className={`p-6 rounded-xl border flex flex-col items-center gap-4 transition-all ${selectedType === 'GRASS' ? 'bg-cyber-green/20 border-cyber-green text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                                >
                                    <Leaf size={48} className={selectedType === 'GRASS' ? 'text-cyber-green' : 'text-gray-600'} />
                                    <div className="text-center">
                                        <div className="font-bold text-lg">ORGANIC</div>
                                        <div className="text-xs opacity-70">Flowers, Strains, Grams</div>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setSelectedType('GLASS')}
                                    className={`p-6 rounded-xl border flex flex-col items-center gap-4 transition-all ${selectedType === 'GLASS' ? 'bg-blue-500/20 border-blue-500 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                                >
                                    <Box size={48} className={selectedType === 'GLASS' ? 'text-blue-500' : 'text-gray-600'} />
                                    <div className="text-center">
                                        <div className="font-bold text-lg">CRYSTALLINE</div>
                                        <div className="text-xs opacity-70">Structures, Shards, Weight</div>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setSelectedType('LIQUID')}
                                    className={`p-6 rounded-xl border flex flex-col items-center gap-4 transition-all ${selectedType === 'LIQUID' ? 'bg-purple-500/20 border-purple-500 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                                >
                                    <Droplets size={48} className={selectedType === 'LIQUID' ? 'text-purple-500' : 'text-gray-600'} />
                                    <div className="text-center">
                                        <div className="font-bold text-lg">VOLUMETRIC</div>
                                        <div className="text-xs opacity-70">Viscosity, Liquids, Mills</div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="animate-slide-in">
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                                <span className="bg-white/10 w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
                                Visual Environment
                            </h3>
                            <p className="text-gray-500 mb-6 text-sm">Describe the look and feel of your operation. The AI will generate a unique 4K interface background based on this.</p>

                            <div className="space-y-4">
                                <textarea
                                    value={customPrompt}
                                    onChange={(e) => setCustomPrompt(e.target.value)}
                                    placeholder="e.g. 'Cyberpunk high-rise apartment, neon rain, purple and gold lighting' OR 'Underground concrete bunker, industrial lights, rusty textures'"
                                    className="w-full h-32 bg-black/50 border border-white/20 rounded-xl p-4 text-white placeholder-gray-600 outline-none focus:border-cyber-gold resize-none"
                                />
                                
                                <div className="flex gap-2 flex-wrap">
                                    {['Cyberpunk Neon', 'Industrial Grime', 'Luxury Penthouse', 'Clinical Lab', 'Retro Synthwave'].map(preset => (
                                        <button 
                                            key={preset}
                                            onClick={() => setCustomPrompt(preset)}
                                            className="text-[10px] bg-white/5 hover:bg-white/10 px-3 py-2 rounded-full text-gray-400 border border-white/5"
                                        >
                                            {preset}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="mt-8 flex justify-end">
                        <button 
                            onClick={handleNext} 
                            disabled={(step === 1 && !selectedType) || (step === 2 && !customPrompt)}
                            className="bg-cyber-gold text-black font-bold uppercase px-8 py-3 rounded-xl hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {step === 1 ? 'Next Step' : 'Initialize System'}
                        </button>
                    </div>
                </div>

                <button onClick={onSkip} className="mt-8 text-gray-500 hover:text-white text-sm uppercase tracking-widest font-bold shrink-0 pb-8">
                    Skip Setup (Default Mode)
                </button>
            </div>
        </div>
    );
};

export default ThemeWizard;
