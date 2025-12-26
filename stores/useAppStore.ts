import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  Batch, Customer, Sale, AppSettings, StagedTransaction, Notification,
  OperationalExpense, BackupData, POSState, BusinessIntelligence, Partner,
  Referral, Financials, Achievement, InventoryType, InventoryTerms,
  ChatMessage, Mission
} from '../types';
import { getSupabase } from '../services/supabaseService';
import { scramble, unscramble } from '../services/cryptoUtils';
import { missionsData } from '../data/missions';
import { skillsData } from '../data/skills';

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

const recalculateBatchCost = (b: Batch): Batch => {
  const extraExpenses = b.expenses ? b.expenses.reduce((acc, e) => acc + e.amount, 0) : 0;
  const totalCost = b.purchasePrice + b.fees + extraExpenses;
  const sellableWeight = Math.max(0.1, b.orderedWeight - b.providerCut - b.personalUse - (b.loss || 0));
  const trueCostPerGram = sellableWeight > 0 ? totalCost / sellableWeight : 0;
  return { ...b, actualWeight: sellableWeight, trueCostPerGram, currentStock: Math.min(b.currentStock, sellableWeight) };
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
    unlockedSkills: [],
    storefrontMessage: 'System is online. Place orders through the terminal.'
};

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
  isInitialized: boolean;
  
  initialize: () => (() => void);
  updateStorefront: (message: string, visibleBatchIds: string[]) => void;
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
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
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
      isInitialized: false,

      initialize: () => {
        if (get().isInitialized) return () => {};
        set({ isInitialized: true });

        const installHandler = (e: any) => {
          e.preventDefault();
          set({ deferredPrompt: e, isInstallable: true });
        };
        window.addEventListener('beforeinstallprompt', installHandler);

        let cid = localStorage.getItem('smp_store_channel_id');
        if (!cid) {
            cid = 'store_' + Math.random().toString(36).substring(2, 15);
            localStorage.setItem('smp_store_channel_id', cid);
        }
        set({ storeChannelId: cid });

        const sb = getSupabase();
        let channel: any = null;
        if (sb && cid) {
          channel = sb.channel(cid);
          channel
            .on('broadcast', { event: 'REQUEST_STOCK' }, () => {
                const visibleBatches = get().batches.filter(b => b.isVisibleToCustomer);
                const storefrontMessage = get().settings.storefrontMessage;
                channel.send({ type: 'broadcast', event: 'STOCK_UPDATE', payload: visibleBatches });
                channel.send({ type: 'broadcast', event: 'STOREFRONT_UPDATE', payload: { message: storefrontMessage } });
            })
            .on('broadcast', { event: 'NEW_ORDER' }, ({ payload }: any) => {
                const order = payload;
                const linked = get().customers.find(c => c.ghostId === order.ghostId);
                const name = linked ? linked.name : (order.customer || "Ghost Guest");
                get().addNotification(`New Remote Order from ${name}`, 'SUCCESS');
                if (order.items?.length > 0) {
                    const item = order.items[0];
                    get().stageTransaction({
                        batchId: item.batchId, weight: item.weight, amount: item.price * item.weight,
                        customerName: name, customerId: linked?.id, isRemote: true, ghostId: order.ghostId
                    });
                }
            })
            .on('broadcast', { event: 'CHAT_MESSAGE' }, ({ payload }: any) => {
                if (payload.sender === 'CUSTOMER') {
                    const text = unscramble(payload.text, cid!);
                    set(state => ({ chatMessages: [...state.chatMessages, { ...payload, text }] }));
                    get().addNotification("Secure message received.", 'INFO');
                }
            })
            .subscribe();
        }

        const missionInterval = setInterval(() => {
          const { sales, customers, batches, missions } = get();
          let changed = false;
          const updatedMissions = missions.map(m => {
            if (m.isClaimed) return m;
            const progress = m.check({ sales, customers, batches });
            const isComplete = progress >= m.goal;
            if (isComplete && !m.isComplete) {
              changed = true;
              setTimeout(() => get().addNotification(`Contract Cleared: ${m.title}`, 'SUCCESS'), 0);
            }
            return { ...m, progress, isComplete };
          });
          if (changed) set({ missions: updatedMissions });
        }, 15000);

        return () => {
            window.removeEventListener('beforeinstallprompt', installHandler);
            clearInterval(missionInterval);
            if (channel) channel.unsubscribe();
            set({ isInitialized: false });
        };
      },

      addNotification: (message, type = 'INFO') => {
        const id = Date.now().toString();
        set(state => ({ notifications: [...state.notifications, { id, message, type }] }));
        setTimeout(() => set(state => ({ notifications: state.notifications.filter(n => n.id !== id) })), 4000);
      },

      removeNotification: (id) => set(state => ({ notifications: state.notifications.filter(n => n.id !== id) })),
      
      updateSettings: (newS) => set(state => {
          const updatedSettings = { ...state.settings, ...newS };
          return {
              settings: updatedSettings,
              inventoryTerms: getInventoryTerms(updatedSettings.inventoryType)
          };
      }),

      addBatch: (batch) => set(state => {
        const hasPacker = state.settings.unlockedSkills.includes('LOGISTICS_1');
        const newBatchWithDefaults = { ...batch, isVisibleToCustomer: false };
        const updatedBatch = recalculateBatchCost({ ...newBatchWithDefaults, providerCut: batch.providerCut * (hasPacker ? 0.95 : 1) });
        return {
          batches: [updatedBatch, ...state.batches],
          financials: { ...state.financials, cashOnHand: state.financials.cashOnHand - (batch.purchasePrice + batch.fees) }
        }
      }),

      updateBatch: (batch) => set(state => {
        const updated = recalculateBatchCost(batch);
        const newBatches = state.batches.map(b => b.id === batch.id ? updated : b);
        // Do not broadcast here, let updateStorefront handle it
        return { batches: newBatches };
      }),

      deleteBatch: (id) => set(state => ({ batches: state.batches.filter(b => b.id !== id) })),
      addCustomer: (c) => set(state => ({ customers: [c, ...state.customers] })),
      updateCustomer: (c) => set(state => ({ customers: state.customers.map(old => old.id === c.id ? c : old) })),

      processSale: (batchId, customerId, salesRep, weight, amount, profit, targetPrice, paymentMethod) => {
        const { batches, customers, settings } = get();
        const batch = batches.find(b => b.id === batchId);
        const customer = customers.find(c => c.id === customerId);
        if(!batch || !customer) return;

        const hasHaggler = settings.unlockedSkills.includes('TRADE_1');
        const xpBoost = settings.unlockedSkills.includes('TRADE_2');
        
        const finalProfit = profit * (hasHaggler ? 1.02 : 1);
        const earnedXP = Math.floor(amount * (xpBoost ? 1.1 : 1));

        const newSale: Sale = {
          id: Date.now().toString(), batchId, batchName: batch.name, customerId, customerName: customer.name,
          salesRep, weight, amount, costBasis: weight * batch.trueCostPerGram, profit: finalProfit,
          variance: parseFloat((amount - (weight * targetPrice)).toFixed(2)), paymentMethod, timestamp: new Date().toISOString()
        };

        const totalNewXP = (customer.xp || 0) + earnedXP;
        const finalLevel = Math.floor(Math.sqrt(totalNewXP / 100)) + 1;

        const updatedCustomer: Customer = {
            ...customer,
            totalSpent: customer.totalSpent + amount,
            lastPurchase: newSale.timestamp,
            transactionHistory: [...customer.transactionHistory, newSale],
            xp: totalNewXP,
            level: finalLevel
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
      },

      addOperationalExpense: (e) => set(state => ({
          operationalExpenses: [...state.operationalExpenses, e],
          financials: { ...state.financials, cashOnHand: state.financials.cashOnHand - e.amount }
      })),
      deleteOperationalExpense: (id) => set(state => ({ operationalExpenses: state.operationalExpenses.filter(e => e.id !== id) })),
      addPartner: (p) => set(state => ({ partners: [...state.partners, p] })),
      deletePartner: (id) => set(state => ({ partners: state.partners.filter(p => p.id !== id) })),
      addReferral: (ref) => set(state => ({
          referrals: [...state.referrals, ref],
          financials: { ...state.financials, cashOnHand: state.financials.cashOnHand + ref.commission },
          partners: state.partners.map(p => p.id === ref.partnerId ? { ...p, totalVolumeGenerated: p.totalVolumeGenerated + ref.amount, totalCommissionEarned: p.totalCommissionEarned + ref.commission } : p)
      })),
      updateFinancials: (f) => set(state => ({ financials: { ...state.financials, ...f } })),
      stageTransaction: (tx) => set({ stagedTransaction: tx }),
      updatePOSState: (pos) => set(state => ({ posState: { ...state.posState, ...pos } })),
      setBiData: (bi) => set({ biData: bi }),
      toggleStealthMode: () => set(state => ({ stealthMode: !state.stealthMode })),
      toggleHighFidelityMode: () => set(state => ({ highFidelityMode: !state.highFidelityMode })),
      setDeferredPrompt: (p) => set({ deferredPrompt: p }),
      triggerInstallPrompt: () => {
        const { deferredPrompt } = get();
        if(deferredPrompt) {
          deferredPrompt.prompt();
          deferredPrompt.userChoice.then(({ outcome }: any) => {
            if (outcome === 'accepted') set({ deferredPrompt: null, isInstallable: false });
          });
        }
      },
      updateStorefront: (message, visibleBatchIds) => {
        set(state => ({
            settings: { ...state.settings, storefrontMessage: message },
            batches: state.batches.map(b => ({...b, isVisibleToCustomer: visibleBatchIds.includes(b.id)}))
        }));
        const { storeChannelId, batches, settings } = get();
        const sb = getSupabase();
        const channel = sb?.channel(storeChannelId);
        if (channel) {
            const visibleBatches = batches.filter(b => b.isVisibleToCustomer);
            channel.send({ type: 'broadcast', event: 'STOCK_UPDATE', payload: visibleBatches });
            channel.send({ type: 'broadcast', event: 'STOREFRONT_UPDATE', payload: { message: settings.storefrontMessage } });
        }
      },
      claimMissionReward: (id) => set(state => {
        const mission = state.missions.find(m => m.id === id);
        if (!mission || !mission.isComplete || mission.isClaimed) return state;
        return {
          missions: state.missions.map(m => m.id === id ? { ...m, isClaimed: true } : m),
          settings: { ...state.settings, reputationScore: state.settings.reputationScore + mission.rewards.rep, skillPoints: state.settings.skillPoints + mission.rewards.sp }
        }
      }),
      unlockSkill: (id) => set(state => {
        const skill = skillsData.find(s => s.id === id);
        if(!skill || state.settings.skillPoints < skill.cost) return state;
        return { settings: { ...state.settings, skillPoints: state.settings.skillPoints - skill.cost, unlockedSkills: [...state.settings.unlockedSkills, id] } };
      }),
      sendManagerMessage: (text) => {
        const { storeChannelId } = get();
        const sb = getSupabase();
        if(!sb || !storeChannelId) return;
        const encrypted = scramble(text, storeChannelId);
        const msg: ChatMessage = { id: Date.now().toString(), sender: 'MANAGER', text, timestamp: new Date().toISOString(), isEncrypted: true };
        set(state => ({ chatMessages: [...state.chatMessages, msg] }));
        sb.channel(storeChannelId).send({ type: 'broadcast', event: 'CHAT_MESSAGE', payload: { ...msg, text: encrypted } });
      },
      clearChat: () => set({ chatMessages: [] }),
      loadBackup: (data: BackupData) => {
        if (data.missions) {
          const missionsWithLogic = missionsData.map(sourceMission => {
            const storedMission = data.missions.find((m: Mission) => m.id === sourceMission.id);
            if (storedMission) {
              return {
                ...sourceMission,
                progress: storedMission.progress,
                isComplete: storedMission.isComplete,
                isClaimed: storedMission.isClaimed,
              };
            }
            return sourceMission;
          });
          data.missions = missionsWithLogic;
        }
        set(state => ({...state, ...data, isInitialized: false}));
      },
      triggerPrestige: (id) => set(state => ({
          customers: state.customers.map(c => c.id === id ? { ...c, level: 1, xp: 0, prestige: (c.prestige || 0) + 1 } : c)
      })),
    }),
    {
      name: 'smp-ai-storage-v3',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: (state) => (rehydratedState) => {
          if (rehydratedState) {
            // Force re-inject the mandatory guest customer if missing
            const hasWalkIn = rehydratedState.customers.some(c => c.id === 'WALK_IN');
            if (!hasWalkIn) {
                rehydratedState.customers = [{
                    id: 'WALK_IN', name: 'Walk-in / Guest', notes: 'Anonymous interactions.', tags: ['GUEST'],
                    microSignals: [], totalSpent: 0, lastPurchase: new Date().toISOString(),
                    transactionHistory: [], xp: 0, level: 1, prestige: 0, achievements: [], gallery: [], equippedPerks: []
                }, ...rehydratedState.customers];
            }
            
            // Re-attach mission logic and sync with source data
            const missionsWithLogic = missionsData.map(sourceMission => {
                const storedMission = rehydratedState.missions?.find((m: Mission) => m.id === sourceMission.id);
                if (storedMission) {
                    // Keep progress from storage, but use latest static data and function from source
                    return {
                        ...sourceMission,
                        progress: storedMission.progress,
                        isComplete: storedMission.isComplete,
                        isClaimed: storedMission.isClaimed,
                    };
                }
                return sourceMission; // New mission from source data
            });
            rehydratedState.missions = missionsWithLogic;

            // Sync UI terms immediately
            rehydratedState.inventoryTerms = getInventoryTerms(rehydratedState.settings.inventoryType);
            // Reset initialization flag to trigger fresh session boot
            rehydratedState.isInitialized = false;
          }
      }
    }
  )
);