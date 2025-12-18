

// --- EXISTING TYPES ---
export interface BatchExpense {
  id: string;
  description: string;
  amount: number;
  timestamp: string;
}

export interface OperationalExpense {
    id: string;
    description: string;
    amount: number;
    timestamp: string;
    category: string; 
}

export interface Batch {
  id: string;
  name: string;
  strainType: 'Rock' | 'Wet'; // Kept as internal keys, mapped via UI labels
  orderedWeight: number; 
  providerCut: number; 
  personalUse: number; 
  loss: number; 
  actualWeight: number; 
  purchasePrice: number; 
  fees: number; 
  expenses: BatchExpense[]; 
  trueCostPerGram: number; 
  wholesalePrice: number; 
  targetRetailPrice: number; 
  currentStock: number;
  status: 'Active' | 'Low' | 'Sold Out';
  dateAdded: string;
  notes?: string; 
}

export interface Sale {
  id: string;
  batchId: string;
  batchName: string;
  customerId: string;
  customerName: string;
  salesRep: string; 
  weight: number;
  amount: number;
  costBasis: number;
  profit: number;
  variance: number; 
  timestamp: string;
  paymentMethod: 'CASH' | 'BANK';
}

export interface ThemeConfig {
    backgroundImage?: string;
    lastGenerated: string;
    stylePrompt: string;
    userPreferences: string;
}

export type InventoryType = 'GRASS' | 'GLASS' | 'LIQUID';

export interface InventoryTerms {
    unit: string;
    productTypeLabel: string;
    stockLabel: string;
    strainLabel: string;
    variant1: string; // e.g., Indica / Rock / Thick
    variant2: string; // e.g., Sativa / Wet / Thin
}

export interface AppSettings {
  inventoryType: InventoryType; 
  defaultPricePerGram: number; 
  defaultWholesalePrice: number; 
  defaultCostEstimate: number; 
  currencySymbol: string;
  lowStockThreshold: number;
  staffMembers: string[]; 
  expenseCategories: string[]; 
  commissionRate: number; 
  appPin: string; 
  themeConfig?: ThemeConfig;
  
  // REPUTATION SYSTEM
  auditLevel: 'NONE' | 'PENDING' | 'VERIFIED' | 'ELITE';
  reputationScore: number;
  operatorAlias: string;
  publicDealerId: string; // NEW: Custom Dealer Number (e.g. #1)

  // SKILLS & MISSIONS
  skillPoints: number;
  unlockedSkills: string[];
}

export interface POSState {
    batchId: string;
    customerId: string;
    salesRep: string;
    pricingTier: 'RETAIL' | 'WHOLESALE';
    cashInput: string;
    weightInput: string;
    targetPrice: number;
    paymentMethod: 'CASH' | 'BANK';
}

export type ViewState = 'DASHBOARD' | 'STOCK' | 'POS' | 'CUSTOMERS' | 'ANALYTICS' | 'LEDGER' | 'SETTINGS' | 'PLANNER' | 'NETWORK' | 'MARKET_GAME' | 'PROFILE' | 'MISSIONS' | 'SKILLS';

export interface Partner {
    id: string;
    name: string;
    type: 'Supplier' | 'Distributor';
    notes: string;
    totalVolumeGenerated: number;
    totalCommissionEarned: number;
}

export interface Referral {
    id: string;
    partnerId: string;
    partnerName: string;
    customerId: string;
    customerName: string;
    timestamp: string;
    amount: number;
    commission: number;
    notes: string;
}

export interface MicroSignal {
    id: string;
    timestamp: string;
    category: 'VERBAL' | 'NON_VERBAL' | 'TRANSACTIONAL' | 'DIGITAL';
    event: string; 
    intensity: number; 
}

export interface SituationalEncounter {
    id: string;
    timestamp: string;
    situation: string; 
    reaction: string;
    outcome: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
}

export interface AssessmentData {
    defaultBehavior: string;
    unexpectedReaction: string;
    disagreementStyle: string;
    controlFocus: string;
    avoidance: string;
    focusObject: string; 
    responseSpeed: string;
    frustrationTrigger: string;
    calmingTrigger: string;
    coreDrive: string; 
    impulsivityScore: number; 
    loyaltyScore: number; 
    riskScore: number; 
}

export interface RPGStats {
    negotiation: number; 
    intellect: number;
    patience: number;
    volatility: number;
    loyalty: number;
    riskPerception: number;
    trustworthiness?: number; 
}

export interface DISC {
    dominance: number;
    influence: number;
    steadiness: number;
    conscientiousness: number;
}

export interface OCEAN {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
}

export interface TemporalMetrics {
    payCycle: 'WEEKLY' | 'FORTNIGHTLY' | 'MONTHLY' | 'IRREGULAR';
    predictedNextVisit: string; 
    confidence: number; 
    usualDays: string[]; 
    avgDaysBetweenBuys: number;
    lastVisitDeviation: number; 
}

export interface ArchetypeProfile {
    primary: string; 
    secondary: string; 
    scorePrimary: number;
    scoreSecondary: number;
    drives: string[]; 
    insecurity: string[]; 
    interactionStrategy: {
        tone: string;
        detailLevel: string;
        avoid: string[];
        stabiliseWith: string[];
        persuasionAnchor: string;
    };
    cognitive: {
        abstraction: 'Abstract' | 'Concrete';
        tempo: 'Fast' | 'Slow' | 'Variable';
        frictionAversion: number; 
    };
    rpgStats?: RPGStats; 
    disc?: DISC; 
    ocean?: OCEAN; 
    lifecycle: {
        churnProbability: number; 
        predictedNextPurchase: string; 
        engagementScore: number; 
        retentionFactor: number; 
    };
    summary: string;
    lastUpdated: string;
}

export interface RestockPrediction {
    batchId: string;
    batchName: string;
    daysRemaining: number;
    stockoutDate: string;
    confidence: number;
    suggestedReorder: number;
}

export interface DailyPrediction {
    day: string;
    revenue: number;
}

export interface ArchetypePotential {
    archetype: string;
    potentialRevenue: number;
}

export interface SalesForecast {
    period: string; 
    predictedRevenue: number;
    predictedVolume: number;
    topArchetypeTarget: string; 
    dailyTrend?: DailyPrediction[]; 
    archetypeBreakdown?: ArchetypePotential[];
}

export interface BusinessIntelligence {
    restock: RestockPrediction[];
    forecast: SalesForecast;
    lastGenerated: string;
}

export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string; // Lucide icon name or emoji
    unlockedAt: string;
    xpValue: number;
    rarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'LEGENDARY'; // NEW
    discountMod: number; // NEW: Discount percentage earned (e.g. 2%)
}

export interface Customer {
  id: string;
  name: string;
  notes: string;
  ghostId?: string; // NEW: Ghost Portal ID Link
  visualDescription?: string; 
  avatarImage?: string; 
  lastAvatarGenerationDate?: string; 
  gallery?: string[]; 
  tags: string[]; 
  microSignals: MicroSignal[];
  encounters?: SituationalEncounter[]; 
  assessmentData?: AssessmentData;
  behavioralMatrix?: Record<string, string>; 
  psychProfile?: ArchetypeProfile; 
  temporalMetrics?: TemporalMetrics; 
  
  // RPG System
  xp: number; 
  level: number; 
  prestige?: number; // COD Style Prestige Level
  achievements: Achievement[]; 
  equippedPerks?: string[]; // NEW: Operator-assigned traits

  totalSpent: number;
  lastPurchase: string;
  transactionHistory: Sale[];
}

export interface StagedTransaction {
    batchId: string;
    weight: number;
    amount: number;
    customerName?: string; // For remote orders
    customerId?: string; // NEW
    isRemote?: boolean;
    ghostId?: string; // NEW
}

export interface ChatMessage {
    id: string;
    sender: 'MANAGER' | 'CUSTOMER';
    text: string;
    timestamp: string;
    isEncrypted: boolean;
}

export interface Notification {
  id: string;
  message: string;
  type: 'SUCCESS' | 'ERROR' | 'INFO' | 'WARNING';
}

export interface Financials {
  cashOnHand: number;
  bankBalance: number;
}

// --- MISSIONS & SKILLS ---
export interface Mission {
  id: string;
  title: string;
  description: string;
  category: 'FINANCIAL' | 'LOGISTICS' | 'CLIENTELE' | 'STRATEGIC';
  goal: number;
  progress: number;
  rewards: {
    rep: number;
    sp: number; // Skill Points
  };
  isComplete: boolean;
  isClaimed: boolean;
  check: (data: any) => number; // Function to check progress against context data
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  cost: number; // Skill Points cost
  branch: 'TRADE' | 'LOGISTICS' | 'INFLUENCE';
  dependencies: string[];
}

export interface BackupData {
    version: string;
    timestamp: string;
    batches: Batch[];
    customers: Customer[];
    sales: Sale[];
    operationalExpenses: OperationalExpense[];
    settings: AppSettings;
    partners: Partner[];
    referrals: Referral[];
    financials: Financials;
    missions: Mission[];
}
