
import { Mission } from '../types';

export const missionsData: Mission[] = [
  // --- FINANCIAL ---
  { 
    id: 'FIN_1', 
    title: 'First Thousand', 
    description: 'Achieve a total revenue of $1,000 across all sales.', 
    category: 'FINANCIAL', 
    goal: 1000, 
    progress: 0, 
    rewards: { rep: 50, sp: 1 }, 
    isComplete: false, 
    isClaimed: false, 
    check: (data) => data.sales.reduce((a, b) => a + b.amount, 0) 
  },
  { 
    id: 'FIN_2', 
    title: 'Profit Engine', 
    description: 'Generate $5,000 in total net profit.', 
    category: 'FINANCIAL', 
    goal: 5000, 
    progress: 0, 
    rewards: { rep: 100, sp: 2 }, 
    isComplete: false, 
    isClaimed: false, 
    check: (data) => data.sales.reduce((a, b) => a + b.profit, 0) 
  },
  
  // --- LOGISTICS ---
  { 
    id: 'LOG_1', 
    title: 'Stocker', 
    description: 'Acquire 5 different inventory batches.', 
    category: 'LOGISTICS', 
    goal: 5, 
    progress: 0, 
    rewards: { rep: 25, sp: 1 }, 
    isComplete: false, 
    isClaimed: false, 
    check: (data) => data.batches.length 
  },
  { 
    id: 'LOG_2', 
    title: 'Full Shelf', 
    description: 'Hold over 500g of inventory at one time.', 
    category: 'LOGISTICS', 
    goal: 500, 
    progress: 0, 
    rewards: { rep: 75, sp: 1 }, 
    isComplete: false, 
    isClaimed: false, 
    check: (data) => data.batches.reduce((a, b) => a + b.currentStock, 0) 
  },

  // --- CLIENTELE ---
  { 
    id: 'CLI_1', 
    title: 'The Rolodex', 
    description: 'Register 10 unique clients in the CRM.', 
    category: 'CLIENTELE', 
    goal: 10, 
    progress: 0, 
    rewards: { rep: 50, sp: 1 }, 
    isComplete: false, 
    isClaimed: false, 
    check: (data) => data.customers.filter(c => c.id !== 'WALK_IN').length 
  },
  { 
    id: 'CLI_2', 
    title: 'The Regular', 
    description: 'Get one client to Level 10.', 
    category: 'CLIENTELE', 
    goal: 10, 
    progress: 0, 
    rewards: { rep: 150, sp: 2 }, 
    isComplete: false, 
    isClaimed: false, 
    check: (data) => Math.max(0, ...data.customers.map(c => c.level)) 
  },

  // --- STRATEGIC ---
  { 
    id: 'STR_1', 
    title: 'Diversify', 
    description: 'Sell product from 3 different batches.', 
    category: 'STRATEGIC', 
    goal: 3, 
    progress: 0, 
    rewards: { rep: 40, sp: 1 }, 
    isComplete: false, 
    isClaimed: false, 
    check: (data) => new Set(data.sales.map(s => s.batchId)).size 
  },
];
