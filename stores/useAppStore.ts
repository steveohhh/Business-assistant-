import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  Batch, Customer, Sale, AppSettings, StagedTransaction, Notification,
  OperationalExpense, BackupData, POSState, BusinessIntelligence, Partner,
  Referral, Financials, Achievement, InventoryType, InventoryTerms,
  ChatMessage, Mission
} from '../types';
import { generateAvatar } from '../services/geminiService';
import { getSupabase } from '../services/supabaseService';
import { scramble, unscramble } from '../services/cryptoUtils';
import { missionsData } from '../data/missions';
import { skillsData } from '../data/skills';

// --- STORE TYPE DEFINITION ---
interface AppState {
  batches: Batch[];
  customers: Customer[];
  sales: Sale[];
  operationalExpenses: OperationalExpense[];
  partners: Partner[];
  referrals: Referral[];
  financials: Financials;
  settings: AppSettings;
  stagedTransaction: StagedTransaction | null;
  notifications: Notification[];
  posState: POSState;
  biData: BusinessIntelligence | null;
  stealthMode: boolean;
  inventoryTerms: InventoryTerms;
  highFidelityMode: boolean;
  isInstallable: boolean;
  deferredPrompt: any;
  missions: Mission[];
  storeChannelId: string;
  chatMessages: ChatMessage[];
  
  // Actions
  initialize: () => void;
  claimMissionReward: (missionId: string) => void;
  unlockSkill: (skillId: string) => void;
  sendManagerMessage: (text: string) => void;
  clearChat: () => void;
  toggleHighFidelityMode: () => void;
  triggerInstallPrompt: () => void;
  setDeferredPrompt: (prompt: any) => void;
  toggleStealthMode: () => void;
  setBiData: (data: BusinessIntelligence | null) => void;
  updatePOSState: (state: Partial<POSState>) => void;
  addBatch: (batch: Batch) => void;
  updateBatch: (batch: Batch) => void;
  deleteBatch: (id: string) => void;
  addCustomer: (customer: Customer) => void;
  updateCustomer: (customer: Customer) => void;
  processSale: (
    batchId: string, customerId: string, salesRep: string, weight: number, 
    amount: number, profit: number, targetPrice: number, paymentMethod: 'CASH' | 'BANK'
  ) => void;
  addOperationalExpense: (expense: OperationalExpense) => void;
  deleteOperationalExpense: (id: string) => void;
  addPartner: (partner: Partner) => void;
  deletePartner: (id: string) => void;
  addReferral: (referral: Referral) => void;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  updateFinancials: (newFinancials: Partial<Financials>) => void;
  stageTransaction: (tx: StagedTransaction | null) => void;
  addNotification: (message: string, type?: 'SUCCESS' | 'ERROR' | 'INFO' | 'WARNING') => void;
  removeNotification: (id: string) => void;
  loadBackup: (data: BackupData) => void;
  triggerPrestige: (customerId: string) => void;
  _setChatMessages: (messages: ChatMessage[]) => void;
  _setStoreChannelId: (id: string) => void;
  _setBatches: (batches: Batch[]) => void;
  _setCustomers: (customers: Customer[]) => void;
}

// --- TERMINOLOGY HELPER ---
const getInventoryTerms = (type: InventoryType): InventoryTerms => {
    switch (type) {
        case 'GRASS':
            return { unit: 'g', productTypeLabel: 'Strain Type', stockLabel: 'Weight', strainLabel: 'Strain', variant1: 'Rock (Flower)', variant2: 'Wet (Extract)' };
        case 'GLASS':
            return { unit: 'g', productTypeLabel: 'Structure', stockLabel: 'Weight', strainLabel: 'Batch', variant1: 'Shard', variant2: 'Powder' };
        case 'LIQUID':
            return { unit: 'ml', productTypeLabel: 'Viscosity', stockLabel: 'Volume', strainLabel: 'Mix', variant1: 'Thick', variant2: 'Thin' };
        default:
            return { unit: 'g', productTypeLabel: 'Type', stockLabel: 'Stock', strainLabel: 'Item', variant1: 'Type A', variant2: 'Type B' };
    }
};

const defaultSettings: AppSettings = {
    inventoryType: 'GRASS',
    defaultPricePerGram: 10,
    defaultWholesalePrice: 6,
    defaultCostEstimate: 3,
    currencySymbol: '$',
    lowStockThreshold: 28,
    staffMembers: ['Admin'],
    expenseCategories: ['Payout', 'Supplies', 'Transport', 'Marketing', 'Misc'],
    commissionRate: 5,
    appPin: '',
    auditLevel: 'NONE',
    reputationScore: 500,
    operatorAlias: 'Unknown_Operator',
    publicDealerId: '1',
    skillPoints: 0,
    unlockedSkills: []
};

// --- ZUSTAND STORE CREATION ---
export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // --- STATE ---
      batches: [],
      customers: [],
      sales: [],
      operationalExpenses: [],
      partners: [],
      referrals: [],
      financials: { cashOnHand: 0, bankBalance: 0 },
      settings: defaultSettings,
      stagedTransaction: null,
      notifications: [],
      posState: {
        batchId: '', customerId: '', salesRep: 'Admin', pricingTier: 'RETAIL',
        cashInput: '', weightInput: '', targetPrice: 10, paymentMethod: 'CASH'
      },
      biData: null,
      stealthMode: false,
      inventoryTerms: getInventoryTerms('GRASS'),
      highFidelityMode: false,
      isInstallable: false,
      deferredPrompt: null,
      missions: missionsData,
      storeChannelId: '',
      chatMessages: [],

      // --- ACTIONS ---
      initialize: () => {
        // This function is called once in App.tsx to setup listeners.
        // The `persist` middleware handles loading from localStorage automatically.
        // We just need to setup non-serializable stuff here.

        // PWA Install Listener
        const handler = (e: any) => {
          e.preventDefault();
          get().setDeferredPrompt(e);
          set({ isInstallable: true });
        };
        window.addEventListener('beforeinstallprompt', handler);

        // Supabase/Chat Listener
        let cid = localStorage.getItem('smp_store_channel_id');
        if (!cid) {
            cid = 'store_' + Math.random().toString(36).substring(2, 15);
            localStorage.setItem('smp_store_channel_id', cid);
        }
        get()._setStoreChannelId(cid);

        const sb = getSupabase();
        if (sb && cid) {
          const channel = sb.channel(cid);
          channel
            .on('broadcast', { event: 'REQUEST_STOCK' }, () => {
                channel.send({
                    type: 'broadcast', event: 'STOCK_UPDATE',
                    payload: get().batches
                });
            })
            .on('broadcast', { event: 'NEW_ORDER' }, ({ payload }) => {
                const order = payload;
                let linkedCustomer = null;
                if (order.ghostId) {
                    linkedCustomer = get().customers.find(c => c.ghostId === order.ghostId);
                }
                const displayName = linkedCustomer ? linkedCustomer.name : (order.customer || "Ghost Guest");
                get().addNotification(`New Remote Order from ${displayName}: $${order.total.toFixed(2)}`, 'SUCCESS');
                if (order.items && order.items.length > 0) {
                    const item = order.items[0];
                    get().stageTransaction({
                        batchId: item.batchId, weight: item.weight, amount: item.price * item.weight,
                        customerName: displayName, customerId: linkedCustomer ? linkedCustomer.id : undefined,
                        isRemote: true, ghostId: order.ghostId
                    });
                }
            })
            .on('broadcast', { event: 'CHAT_MESSAGE' }, ({ payload }) => {
                const msg = payload;
                if (msg.sender === 'CUSTOMER') {
                    const decryptedText = unscramble(msg.text, cid!);
                    const decryptedMsg = { ...msg, text: decryptedText };
                    get()._setChatMessages([...get().chatMessages, decryptedMsg]);
                    get().addNotification("New encrypted message received.", 'INFO');
                }
            })
            .subscribe();
        }

        // Mission Game Loop
        setInterval(() => {
          const { sales, customers, batches } = get();
          set(state => ({
            missions: state.missions.map(mission => {
              if (mission.isComplete || !mission.check) return mission;
              const progress = mission.check({ sales, customers, batches });
              const isComplete = progress >= mission.goal;
              if (isComplete && !mission.isComplete) {
                  get().addNotification(`Contract Complete: ${mission.title}`, 'SUCCESS');
              }
              return { ...mission, progress, isComplete };
            })
          }));
        }, 5000);
      },
      
      _setChatMessages: (messages) => set({ chatMessages: messages }),
      _setStoreChannelId: (id) => set({ storeChannelId: id }),
      _setBatches: (batches) => set({ batches: batches }),
      _setCustomers: (customers) => set({ customers: customers }),

      addNotification: (message, type = 'INFO') => {
        const id = Date.now().toString();
        set(state => ({ notifications: [...state.notifications, { id, message, type }] }));
        setTimeout(() => get().removeNotification(id), 4000);
      },
      removeNotification: (id) => set(state => ({ notifications: state.notifications.filter(n => n.id !== id) })),
      
      updateSettings: (newSettings) => {
        set(state => ({
          settings: { ...state.settings, ...newSettings },
          inventoryTerms: getInventoryTerms(newSettings.inventoryType || state.settings.inventoryType)
        }));
        get().addNotification("System settings saved.", 'SUCCESS');
      },

      recalculateBatchCost: (b: Batch): Batch => {
        const extraExpenses = b.expenses ? b.expenses.reduce((acc, e) => acc + e.amount, 0) : 0;
        const totalCost = b.purchasePrice + b.fees + extraExpenses;
        const sellableWeight = Math.max(0.1, b.orderedWeight - b.providerCut - b.personalUse - (b.loss || 0));
        const trueCostPerGram = totalCost / sellableWeight;
        return { ...b, actualWeight: sellableWeight, trueCostPerGram };
      },
      
      addBatch: (batch) => set(state => {
        const hasPacker = state.settings.unlockedSkills.includes('LOGISTICS_1');
        const providerCutReduction = hasPacker ? 0.05 : 0;
        const effectiveBatch = { ...batch, providerCut: batch.providerCut * (1 - providerCutReduction) };
        const newBatch = state.recalculateBatchCost(effectiveBatch);
        
        // Broadcast stock update
        const sb = getSupabase();
        if(sb && state.storeChannelId) {
            sb.channel(state.storeChannelId).send({
                type: 'broadcast', event: 'STOCK_UPDATE',
                payload: [newBatch, ...state.batches]
            });
        }

        get().addNotification(`Batch "${batch.name}" added successfully.`, 'SUCCESS');
        return {
          batches: [newBatch, ...state.batches],
          financials: { ...state.financials, cashOnHand: state.financials.cashOnHand - (batch.purchasePrice + batch.fees) }
        }
      }),

      updateBatch: (batch) => set(state => {
        const updatedBatch = state.recalculateBatchCost(batch);
        get().addNotification(`Batch "${batch.name}" updated.`, 'SUCCESS');
        const newBatches = state.batches.map(b => b.id === batch.id ? updatedBatch : b);
        
        // Broadcast stock update
        const sb = getSupabase();
        if(sb && state.storeChannelId) {
            sb.channel(state.storeChannelId).send({
                type: 'broadcast', event: 'STOCK_UPDATE',
                payload: newBatches
            });
        }
        
        return { batches: newBatches };
      }),

      deleteBatch: (id) => set(state => {
        get().addNotification("Batch deleted.", 'WARNING');
        const newBatches = state.batches.filter(b => b.id !== id);
         // Broadcast stock update
        const sb = getSupabase();
        if(sb && state.storeChannelId) {
            sb.channel(state.storeChannelId).send({
                type: 'broadcast', event: 'STOCK_UPDATE',
                payload: newBatches
            });
        }
        return { batches: newBatches };
      }),
      
      addCustomer: (customer) => set(state => {
        get().addNotification("New client registered.", 'SUCCESS');
        return { customers: [customer, ...state.customers] };
      }),

      updateCustomer: (customer) => set(state => {
        get().addNotification("Client data updated.", 'SUCCESS');
        return { customers: state.customers.map(c => c.id === customer.id ? customer : c) };
      }),

      processSale: (batchId, customerId, salesRep, weight, amount, profit, targetPrice, paymentMethod) => {
        const { batches, customers, settings, addNotification, updateFinancials } = get();
        const batch = batches.find(b => b.id === batchId);
        const customer = customers.find(c => c.id === customerId);

        if(!batch || !customer) return;

        const hasHaggler = settings.unlockedSkills.includes('TRADE_1');
        const profitBonus = hasHaggler ? 0.02 : 0;
        const finalProfit = profit * (1 + profitBonus);
        
        const hasXpBoost = settings.unlockedSkills.includes('TRADE_2');
        const xpMultiplier = hasXpBoost ? 1.1 : 1.0;

        const variance = amount - (weight * targetPrice);

        const newSale: Sale = {
          id: Date.now().toString(), batchId, batchName: batch.name, customerId, customerName: customer.name,
          salesRep, weight, amount, costBasis: weight * batch.trueCostPerGram, profit: finalProfit,
          variance: parseFloat(variance.toFixed(2)), paymentMethod, timestamp: new Date().toISOString()
        };

        const checkAchievements = (c: Customer): Achievement[] => {
            const newAchievements: Achievement[] = [];
            const currentIds = c.achievements.map(a => a.id);
            const unlocked = (id: string, title: string, desc: string, icon: string, xp: number, rarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'LEGENDARY', discount: number) => {
                if (!currentIds.includes(id)) {
                    newAchievements.push({ id, title, description: desc, icon, xpValue: xp, unlockedAt: new Date().toISOString(), rarity, discountMod: discount });
                }
            };
            // Simplified achievement logic from DataContext
            if (amount >= 500) unlocked('the_plug', 'The Plug', 'Dropped $500+ in one go.', '🔌', 500, 'LEGENDARY', 5.0);
            if (c.transactionHistory.length === 0) unlocked('fresh_meat', 'Fresh Meat', 'First time buyer.', '🥩', 100, 'COMMON', 0.5);
            return newAchievements;
        };

        const earnedXP = Math.floor(amount * xpMultiplier);
        const newAchievements = checkAchievements(customer);
        const achievementXP = newAchievements.reduce((sum, a) => sum + a.xpValue, 0);
        const totalNewXP = (customer.xp || 0) + earnedXP + achievementXP;
        const finalLevel = Math.floor(Math.sqrt(totalNewXP / 100)) + 1;

        const updatedCustomer: Customer = {
            ...customer,
            totalSpent: customer.totalSpent + amount,
            lastPurchase: newSale.timestamp,
            transactionHistory: [...customer.transactionHistory, newSale],
            xp: totalNewXP,
            level: finalLevel,
            achievements: [...(customer.achievements || []), ...newAchievements]
        };

        set(state => ({
            sales: [...state.sales, newSale],
            batches: state.batches.map(b => b.id === batchId ? { ...b, currentStock: b.currentStock - weight } : b),
            customers: state.customers.map(c => c.id === customerId ? updatedCustomer : c),
            financials: {
              ...state.financials,
              cashOnHand: paymentMethod === 'CASH' ? state.financials.cashOnHand + amount : state.financials.cashOnHand,
              bankBalance: paymentMethod === 'BANK' ? state.financials.bankBalance + amount : state.financials.bankBalance
            },
            posState: { ...state.posState, weightInput: '', cashInput: '' }
        }));
        
        let notifMsg = `Sale Processed. +${earnedXP} XP.`;
        if (newAchievements.length > 0) notifMsg += ` 🏆 ${newAchievements.length} Badges!`;
        if (finalLevel > (customer.level || 1)) notifMsg += ` ⚡ LEVEL UP to ${finalLevel}!`;
        addNotification(notifMsg, 'SUCCESS');
      },
      
      // Other actions...
      addOperationalExpense: (expense) => set(state => {
        get().addNotification("Drawer deduction recorded.", 'WARNING');
        return {
          operationalExpenses: [...state.operationalExpenses, expense],
          financials: { ...state.financials, cashOnHand: state.financials.cashOnHand - expense.amount }
        }
      }),
      deleteOperationalExpense: (id) => set(state => ({ operationalExpenses: state.operationalExpenses.filter(e => e.id !== id) })),
      addPartner: (partner) => set(state => ({ partners: [...state.partners, partner] })),
      deletePartner: (id) => set(state => ({ partners: state.partners.filter(p => p.id !== id) })),
      addReferral: (referral) => set(state => {
        get().addNotification(`Referral logged. +$${referral.commission} to Wallet.`, 'SUCCESS');
        return {
          referrals: [...state.referrals, referral],
          financials: { ...state.financials, cashOnHand: state.financials.cashOnHand + referral.commission },
          partners: state.partners.map(p => p.id === referral.partnerId ? { ...p, totalVolumeGenerated: p.totalVolumeGenerated + referral.amount, totalCommissionEarned: p.totalCommissionEarned + referral.commission } : p)
        }
      }),
      updateFinancials: (newFinancials) => set(state => ({ financials: { ...state.financials, ...newFinancials } })),
      stageTransaction: (tx) => set({ stagedTransaction: tx }),
      updatePOSState: (newState) => set(state => ({ posState: { ...state.posState, ...newState } })),
      setBiData: (data) => set({ biData: data }),
      toggleStealthMode: () => set(state => ({ stealthMode: !state.stealthMode })),
      toggleHighFidelityMode: () => set(state => ({ highFidelityMode: !state.highFidelityMode })),
      triggerInstallPrompt: () => {
        const { deferredPrompt, addNotification } = get();
        if(deferredPrompt) {
          deferredPrompt.prompt();
          deferredPrompt.userChoice.then(({ outcome }: { outcome: string }) => {
            if (outcome === 'accepted') {
              addNotification("Installing Application...", 'SUCCESS');
              set({ deferredPrompt: null, isInstallable: false });
            }
          });
        }
      },
      setDeferredPrompt: (prompt) => set({ deferredPrompt: prompt }),
      claimMissionReward: (missionId) => {
        const { missions } = get();
        const mission = missions.find(m => m.id === missionId);
        if (!mission || !mission.isComplete || mission.isClaimed) return;
        set(state => ({
          missions: state.missions.map(m => m.id === missionId ? { ...m, isClaimed: true } : m),
          settings: { ...state.settings, reputationScore: state.settings.reputationScore + mission.rewards.rep, skillPoints: state.settings.skillPoints + mission.rewards.sp }
        }));
        get().addNotification(`Reward Claimed: +${mission.rewards.rep} REP, +${mission.rewards.sp} SP`, 'SUCCESS');
      },
      unlockSkill: (skillId) => {
        const { settings, addNotification } = get();
        const skill = skillsData.find(s => s.id === skillId);
        if(!skill || settings.skillPoints < skill.cost || settings.unlockedSkills.includes(skillId) || !skill.dependencies.every(dep => settings.unlockedSkills.includes(dep))) {
          addNotification("Unlock failed: Requirements not met.", "ERROR");
          return;
        }
        set(state => ({
          settings: { ...state.settings, skillPoints: state.settings.skillPoints - skill.cost, unlockedSkills: [...state.settings.unlockedSkills, skillId] }
        }));
        addNotification(`Skill Unlocked: ${skill.name}`, "SUCCESS");
      },
      sendManagerMessage: (text) => {
        const { storeChannelId, addNotification } = get();
        const sb = getSupabase();
        if(!sb || !storeChannelId) return;
        const encryptedText = scramble(text, storeChannelId);
        const msg: ChatMessage = { id: Date.now().toString(), sender: 'MANAGER', text, timestamp: new Date().toISOString(), isEncrypted: true };
        set(state => ({ chatMessages: [...state.chatMessages, msg] }));
        sb.channel(storeChannelId).send({ type: 'broadcast', event: 'CHAT_MESSAGE', payload: { ...msg, text: encryptedText } });
      },
      clearChat: () => set({ chatMessages: [] }),
      loadBackup: (data) => {
        // Omitting for brevity - assumes simple state replacement
        set(state => ({...state, ...data}));
        get().addNotification("Database restored.", "SUCCESS");
      },
      triggerPrestige: (customerId) => {
        const { customers, addNotification } = get();
        const customer = customers.find(c => c.id === customerId);
        if (!customer || (customer.level || 1) < 50) {
          addNotification("Prestige Requirements Not Met.", 'ERROR');
          return;
        }
        const updatedCustomer: Customer = { ...customer, level: 1, xp: 0, prestige: (customer.prestige || 0) + 1 };
        set(state => ({ customers: state.customers.map(c => c.id === customerId ? updatedCustomer : c) }));
        addNotification(`${customer.name} has entered Prestige!`, 'SUCCESS');
      },
    }),
    {
      name: 'smp-ai-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
      onRehydrateStorage: () => (state) => {
          if (state) {
            // Ensure default customer exists after loading
            if (!state.customers.find(c => c.id === 'WALK_IN')) {
                state.customers.push({
                    id: 'WALK_IN', name: 'Walk-in / Guest', notes: 'Anonymous interactions.', tags: ['GUEST'],
                    microSignals: [], totalSpent: 0, lastPurchase: new Date().toISOString(),
                    transactionHistory: [], xp: 0, level: 1, prestige: 0, achievements: [], gallery: [], equippedPerks: []
                });
            }
            // Set inventory terms based on loaded settings
            state.inventoryTerms = getInventoryTerms(state.settings.inventoryType);
          }
      }
    }
  )
);
