import React from 'react';
import { useAppStore } from '../stores/useAppStore';
import { Briefcase, Zap, Star, CheckCircle, Gift, DollarSign, Package, Users, Brain } from 'lucide-react';
import { Mission } from '../types';

const MissionCard: React.FC<{ mission: Mission, onClaim: (id: string) => void }> = ({ mission, onClaim }) => {
    const progressPercent = Math.min(100, (mission.progress / mission.goal) * 100);
    const categoryIcon = {
        'FINANCIAL': <DollarSign size={20} className="text-cyber-green"/>,
        'LOGISTICS': <Package size={20} className="text-blue-400"/>,
        'CLIENTELE': <Users size={20} className="text-cyber-purple"/>,
        'STRATEGIC': <Brain size={20} className="text-cyber-gold"/>,
    }[mission.category];

    return (
        <div className={`bg-cyber-panel border rounded-2xl p-6 relative overflow-hidden transition-all duration-300 ${mission.isComplete ? 'border-cyber-gold/50 shadow-lg shadow-cyber-gold/5' : 'border-white/10'}`}>
            <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-shrink-0 w-16 h-16 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
                    {categoryIcon}
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{mission.category}</div>
                            <h3 className="text-white font-bold text-lg">{mission.title}</h3>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-bold">
                            <span className="flex items-center gap-1 text-cyber-gold"><Star size={12}/> +{mission.rewards.rep} REP</span>
                            <span className="flex items-center gap-1 text-cyber-purple"><Zap size={12}/> +{mission.rewards.sp} SP</span>
                        </div>
                    </div>
                    <p className="text-gray-400 text-sm mt-2 mb-4 h-10">{mission.description}</p>
                    
                    <div className="flex items-center gap-4">
                        <div className="flex-1 bg-black/40 h-2 rounded-full border border-white/5">
                            <div className="h-full bg-cyber-gold rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
                        </div>
                        <span className="text-xs font-mono text-gray-400">{Math.floor(mission.progress)} / {mission.goal}</span>
                    </div>
                </div>

                {mission.isComplete && !mission.isClaimed && (
                    <button 
                        onClick={() => onClaim(mission.id)}
                        className="w-full md:w-auto mt-4 md:mt-0 bg-cyber-gold text-black font-bold uppercase text-sm px-6 py-3 rounded-lg flex items-center justify-center gap-2 hover:brightness-110 transition-all animate-pulse"
                    >
                        <Gift size={16}/> Claim Reward
                    </button>
                )}
                
                {mission.isClaimed && (
                    <div className="w-full md:w-auto mt-4 md:mt-0 flex items-center justify-center gap-2 text-cyber-green text-sm font-bold uppercase px-6">
                        <CheckCircle size={16}/> Claimed
                    </div>
                )}
            </div>
        </div>
    );
};

const Missions: React.FC = () => {
    // REFACTORED: Atomic store access
    const missions = useAppStore(s => s.missions);
    const claimMissionReward = useAppStore(s => s.claimMissionReward);

    const inProgress = missions.filter(m => !m.isComplete);
    const completable = missions.filter(m => m.isComplete && !m.isClaimed);
    const claimed = missions.filter(m => m.isClaimed);

    return (
        <div className="h-full flex flex-col space-y-6 animate-fade-in pb-20">
            <div className="flex items-center gap-3">
                <div className="bg-cyber-purple/20 p-2 rounded-lg text-cyber-purple">
                    <Briefcase size={24} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-white uppercase tracking-tight">Contracts Board</h2>
                    <p className="text-xs text-gray-500">Complete objectives to earn Reputation (REP) and Skill Points (SP).</p>
                </div>
            </div>

            {completable.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-cyber-gold font-bold uppercase text-xs tracking-widest">Ready to Claim</h3>
                    {completable.map(m => <MissionCard key={m.id} mission={m} onClaim={claimMissionReward} />)}
                </div>
            )}
            
            <div className="space-y-4">
                <h3 className="text-gray-400 font-bold uppercase text-xs tracking-widest">In Progress</h3>
                {inProgress.length > 0 ? (
                    inProgress.map(m => <MissionCard key={m.id} mission={m} onClaim={claimMissionReward} />)
                ) : (
                    <div className="text-center text-gray-500 py-10 border border-dashed border-white/10 rounded-xl">
                        All available contracts are complete! More will unlock as you progress.
                    </div>
                )}
            </div>

            {claimed.length > 0 && (
                <div className="space-y-4 opacity-50">
                    <h3 className="text-gray-600 font-bold uppercase text-xs tracking-widest">Claimed</h3>
                    {claimed.map(m => <MissionCard key={m.id} mission={m} onClaim={claimMissionReward} />)}
                </div>
            )}
        </div>
    );
};

export default Missions;