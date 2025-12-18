
import { Skill } from '../types';

export const skillsData: Skill[] = [
  // --- TRADE BRANCH ---
  { 
    id: 'TRADE_1', 
    name: 'Haggler', 
    description: 'Improves average profit margin on all sales by 2%. A foundational negotiation tactic.', 
    cost: 1, 
    branch: 'TRADE', 
    dependencies: [] 
  },
  { 
    id: 'TRADE_2', 
    name: 'XP Boost', 
    description: 'Gain 10% more XP from all client transactions, accelerating relationship growth.', 
    cost: 2, 
    branch: 'TRADE', 
    dependencies: ['TRADE_1'] 
  },
  { 
    id: 'TRADE_3', 
    name: 'High Roller', 
    description: 'Unlocks rare, high-value achievement opportunities from VIP clients (Level 10+).', 
    cost: 3, 
    branch: 'TRADE', 
    dependencies: ['TRADE_2'] 
  },
  
  // --- LOGISTICS BRANCH ---
  { 
    id: 'LOGISTICS_1', 
    name: 'Efficient Packer', 
    description: 'Reduces the calculated provider cut/loss on new batches by a flat 5%, increasing yield.', 
    cost: 1, 
    branch: 'LOGISTICS', 
    dependencies: [] 
  },
  { 
    id: 'LOGISTICS_2', 
    name: 'AI Forecast', 
    description: 'AI-driven analytics predictions (restock & revenue) are 10% more accurate.', 
    cost: 2, 
    branch: 'LOGISTICS', 
    dependencies: ['LOGISTICS_1'] 
  },
  { 
    id: 'LOGISTICS_3', 
    name: 'Supply Chain Master', 
    description: 'Unlocks the ability to pre-order rare inventory through the Network tab.', 
    cost: 3, 
    branch: 'LOGISTICS', 
    dependencies: ['LOGISTICS_2'] 
  },

  // --- INFLUENCE BRANCH ---
  { 
    id: 'INFLUENCE_1', 
    name: 'Street Cred', 
    description: 'New clients start with a higher base Trust Score, making them easier to manage.', 
    cost: 1, 
    branch: 'INFLUENCE', 
    dependencies: [] 
  },
  { 
    id: 'INFLUENCE_2', 
    name: 'Smooth Talker', 
    description: 'Reduces the negative reputation impact of failed behavioral experiments.', 
    cost: 2, 
    branch: 'INFLUENCE', 
    dependencies: ['INFLUENCE_1'] 
  },
  { 
    id: 'INFLUENCE_3', 
    name: 'The Don', 
    description: 'Gain a small amount of passive Reputation (REP) income over time automatically.', 
    cost: 3, 
    branch: 'INFLUENCE', 
    dependencies: ['INFLUENCE_2'] 
  },
];
