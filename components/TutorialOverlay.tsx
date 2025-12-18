import React, { useState } from 'react';
import { ArrowRight, X, LayoutDashboard, Package, ShoppingCart, Users, PieChart, ShieldCheck } from 'lucide-react';

interface TutorialOverlayProps {
    onClose: () => void;
}

const STEPS = [
    {
        title: "System Online",
        desc: "Welcome to SMP AI. You are now operating a high-end retail command center designed for discrete inventory management and financial dominance.",
        icon: <ShieldCheck size={48} className="text-white"/>
    },
    {
        title: "Inventory Control",
        desc: "Track your assets in the 'Stock' tab. Manage batches, track acquisition costs, and set wholesale/retail pricing strategies.",
        icon: <Package size={48} className="text-blue-400"/>
    },
    {
        title: "The Point of Sale",
        desc: "Execute transactions in the 'POS'. The system automatically calculates profit margins, updates stock levels, and logs customer XP.",
        icon: <ShoppingCart size={48} className="text-cyber-green"/>
    },
    {
        title: "Profiling & Trust",
        desc: "Analyze clients in 'CRM'. Use the new 'Street Assessment' tool to log behavioral flags (nervousness, cash quality) and build a Trust Score over time.",
        icon: <Users size={48} className="text-cyber-purple"/>
    },
    {
        title: "Financial Intelligence",
        desc: "Monitor your cash flow, bank balance, and net worth in the 'Analytics' and 'Ledger' tabs. Watch the money pile up.",
        icon: <PieChart size={48} className="text-red-500"/>
    }
];

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onClose }) => {
    const [currentStep, setCurrentStep] = useState(0);

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onClose();
        }
    };

    const progress = ((currentStep + 1) / STEPS.length) * 100;

    return (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
            <div className="relative w-full max-w-lg bg-[#0a0a0a] border border-cyber-gold/30 rounded-3xl shadow-[0_0_50px_rgba(212,175,55,0.15)] overflow-hidden flex flex-col">
                
                {/* Progress Bar */}
                <div className="absolute top-0 left-0 h-1.5 bg-gray-800 w-full">
                    <div className="h-full bg-gradient-to-r from-cyber-gold to-yellow-200 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(212,175,55,0.5)]" style={{ width: `${progress}%` }}></div>
                </div>

                <div className="p-8 md:p-12 flex flex-col items-center text-center">
                    <div className="mb-8 p-6 bg-white/5 rounded-full border border-white/10 animate-pulse-slow shadow-xl ring-1 ring-white/10">
                        {STEPS[currentStep].icon}
                    </div>
                    
                    <h2 className="text-3xl font-black text-white uppercase tracking-wider mb-6 leading-none">
                        {STEPS[currentStep].title}
                    </h2>
                    
                    <p className="text-gray-400 text-sm leading-relaxed mb-10 h-24 md:h-20 max-w-sm">
                        {STEPS[currentStep].desc}
                    </p>

                    <div className="flex flex-col-reverse md:flex-row gap-4 w-full">
                        <button 
                            onClick={onClose} 
                            className="flex-1 py-4 text-xs font-bold text-gray-600 hover:text-white uppercase tracking-widest transition-colors"
                        >
                            Skip Briefing
                        </button>
                        <button 
                            onClick={handleNext}
                            className="flex-[2] bg-cyber-gold text-black font-black uppercase tracking-widest py-4 rounded-xl hover:brightness-110 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyber-gold/20"
                        >
                            {currentStep === STEPS.length - 1 ? 'Initialize System' : 'Next'} <ArrowRight size={18}/>
                        </button>
                    </div>
                </div>

                <div className="absolute top-6 right-6 text-[10px] font-mono font-bold text-gray-600 border border-gray-800 px-2 py-1 rounded">
                    STEP {currentStep + 1}/{STEPS.length}
                </div>
            </div>
        </div>
    );
};

export default TutorialOverlay;