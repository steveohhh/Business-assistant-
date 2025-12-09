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
  strainType: 'Rock' | 'Wet'; 
  orderedWeight: number; 
  providerCut: number; 
  personalUse: number; 
  loss: number; // New: Track wasted/stolen product
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
  timestamp: string;
}

export interface AppSettings {
  defaultPricePerGram: number; 
  defaultWholesalePrice: number; 
  defaultCostEstimate: number; 
  currencySymbol: string;
  lowStockThreshold: number;
  staffMembers: string[]; 
  expenseCategories: string[]; 
  commissionRate: number; 
  appPin: string; 
}

export interface POSState {
    batchId: string;
    customerId: string;
    salesRep: string;
    pricingTier: 'RETAIL' | 'WHOLESALE';
    cashInput: string;
    weightInput: string;
    targetPrice: number;
}

export type ViewState = 'DASHBOARD' | 'STOCK' | 'POS' | 'CUSTOMERS' | 'ANALYTICS' | 'LEDGER' | 'SETTINGS' | 'PLANNER';

// --- PSYCHOLOGY ENGINE V3.0 TYPES ---

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
    situation: string; // e.g. "Police drove by during deal"
    reaction: string; // e.g. "Stayed calm, made a joke"
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
    negotiation: number; // 0-100
    intellect: number;
    patience: number;
    volatility: number;
    loyalty: number;
    riskPerception: number;
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

    rpgStats?: RPGStats; // New: Video game style stats

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

export interface SalesForecast {
    period: string; 
    predictedRevenue: number;
    predictedVolume: number;
    topArchetypeTarget: string; 
}

export interface BusinessIntelligence {
    restock: RestockPrediction[];
    forecast: SalesForecast;
    lastGenerated: string;
}

export interface Customer {
  id: string;
  name: string;
  notes: string;
  visualDescription?: string; 
  avatarImage?: string; 
  tags: string[]; 
  microSignals: MicroSignal[];
  encounters?: SituationalEncounter[]; // New: Detailed situational logs 
  assessmentData?: AssessmentData;
  behavioralMatrix?: Record<string, string>; // New: Stores QID -> AnswerValue mapping
  psychProfile?: ArchetypeProfile; 
  totalSpent: number;
  lastPurchase: string;
  transactionHistory: Sale[];
}

export interface StagedTransaction {
    batchId: string;
    weight: number;
    amount: number;
}

export interface Notification {
  id: string;
  message: string;
  type: 'SUCCESS' | 'ERROR' | 'INFO' | 'WARNING';
}

export interface BackupData {
    version: string;
    timestamp: string;
    batches: Batch[];
    customers: Customer[];
    sales: Sale[];
    operationalExpenses: OperationalExpense[];
    settings: AppSettings;
}