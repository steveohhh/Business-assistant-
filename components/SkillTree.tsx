import React, { useState, useMemo } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { skillsData } from '../data/skills';
import { Skill } from '../types';
import { Zap, Lock, CheckCircle, Star, Briefcase, TrendingUp } from 'lucide-react';

interface SkillNodeProps {
    skill: Skill;
    isUnlocked: boolean;
    canUnlock: boolean;
    onClick: () => void;
}

const SkillNode: React.FC<SkillNodeProps> = ({ skill, isUnlocked, canUnlock, onClick }) => {
    let stateClasses = 'bg-gray-900/50 border-gray-700 text-gray-500';
    let icon = <Lock size={24} />;
    
    if (isUnlocked) {
        stateClasses = 'bg-cyber-gold/20 border-cyber-gold text-cyber-gold shadow-[0_0_15px_rgba(212,175,55,0.3)]';
        icon = <CheckCircle size={24} />;
    } else if (canUnlock) {
        stateClasses = 'bg-cyber-purple/20 border-cyber-purple text-cyber-purple cursor-pointer hover:bg-cyber-purple/40 hover:text-white animate-pulse';
        icon = <Zap size={24} />;
    }

    return (
        <div 
            onClick={onClick}
            className={`relative p-4 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 ${stateClasses}`}
        >
            <div className="flex items-center gap-4">
                <div className="flex-shrink-0">{icon}</div>
                <div>
                    <h4 className={`font-bold text-sm ${isUnlocked || canUnlock ? 'text-white' : 'text-gray-500'}`}>{skill.name}</h4>
                    <p className="text-xs text-gray-400 mt-1">{skill.description}</p>
                </div>
            </div>
        </div>
    );
};

const SkillTree: React.FC = () => {
    const { settings, unlockSkill } = useAppStore(state => ({
        settings: state.settings,
        unlockSkill: state.unlockSkill
    }));
    const { skillPoints, unlockedSkills } = settings;
    const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

    const branches = useMemo(() => {
        const tree: Record<string, Skill[]> = {
            TRADE: [],
            LOGISTICS: [],
            INFLUENCE: [],
        };
        skillsData.forEach(skill => {
            tree[skill.branch].push(skill);
        });
        // You can add sorting logic here if needed
        return tree;
    }, []);

    const handleUnlock = () => {
        if (selectedSkill) {
            unlockSkill(selectedSkill.id);
            setSelectedSkill(null);
        }
    };

    return (
        <div className="h-full flex flex-col space-y-6 animate-fade-in pb-20">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="bg-cyber-purple/20 p-2 rounded-lg text-cyber-purple">
                        <Star size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white uppercase tracking-tight">Operator Skills</h2>
                        <p className="text-xs text-gray-500">Spend Skill Points (SP) to unlock permanent system upgrades.</p>
                    </div>
                </div>
                <div className="bg-cyber-panel border border-white/10 rounded-xl px-6 py-3 text-center">
                    <div className="text-xs text-gray-400 uppercase font-bold tracking-widest">Available SP</div>
                    <div className="text-3xl font-black text-cyber-purple font-mono">{skillPoints}</div>
                </div>
            </div>

            {/* Skill Branches */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {Object.keys(branches).map(branchName => {
                    const skills = branches[branchName as keyof typeof branches];
                    return (
                        <div key={branchName} className="space-y-6 relative">
                            <h3 className="text-lg font-black text-white uppercase tracking-widest text-center mb-4">{branchName}</h3>
                            {/* Connecting Lines */}
                            {skills.map((skill, index) => {
                                if (index < skills.length - 1) {
                                    return (
                                        <div 
                                            key={`line-${skill.id}`}
                                            className="absolute left-1/2 -translate-x-1/2 w-0.5 h-6 bg-gray-700"
                                            style={{ top: `${index * 116 + 88}px` }} // Adjust based on node height
                                        ></div>
                                    );
                                }
                                return null;
                            })}
                            {skills.map(skill => {
                                const isUnlocked = unlockedSkills.includes(skill.id);
                                const canUnlock = skill.dependencies.every(dep => unlockedSkills.includes(dep)) && !isUnlocked && skillPoints >= skill.cost;
                                return (
                                    <SkillNode
                                        key={skill.id}
                                        skill={skill}
                                        isUnlocked={isUnlocked}
                                        canUnlock={canUnlock}
                                        onClick={() => canUnlock && setSelectedSkill(skill)}
                                    />
                                );
                            })}
                        </div>
                    );
                })}
            </div>

            {/* Unlock Modal */}
            {selectedSkill && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-cyber-panel border border-cyber-purple rounded-2xl w-full max-w-md p-6 shadow-2xl text-center">
                        <div className="w-16 h-16 bg-cyber-purple/20 text-cyber-purple rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-cyber-purple">
                            <Zap size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">{selectedSkill.name}</h3>
                        <p className="text-gray-400 text-sm mb-6">{selectedSkill.description}</p>
                        
                        <div className="bg-black/40 p-4 rounded-xl border border-white/10 mb-6">
                            <div className="text-xs text-gray-500 uppercase font-bold">Unlock Cost</div>
                            <div className="text-2xl font-mono text-cyber-purple font-bold">{selectedSkill.cost} SP</div>
                        </div>

                        <div className="flex gap-4">
                            <button onClick={() => setSelectedSkill(null)} className="flex-1 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold uppercase text-xs">
                                Cancel
                            </button>
                            <button onClick={handleUnlock} className="flex-1 py-3 rounded-lg bg-cyber-purple text-white font-bold uppercase text-xs hover:brightness-110">
                                Unlock Skill
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SkillTree;