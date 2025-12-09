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
    category: 'PAYOUT' | 'SUPPLIES' | 'MISC';
}

export interface Batch {
  id: string;
  name: string;
  strainType: 'Indica' | 'Sativa' | 'Hybrid';
  orderedWeight: number; 
  providerCut: number; 
  personalUse: number; 
  actualWeight: number; 
  purchasePrice: number; 
  fees: number; 
  expenses: BatchExpense[]; 
  trueCostPerGram: number; 
  wholesalePrice: number; // New: For bulk/resale buyers
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
  salesRep: string; // New: Track which staff member made the sale
  weight: number;
  amount: number;
  costBasis: number;
  profit: number;
  timestamp: string;
}

export interface AppSettings {
  defaultPricePerGram: number;
  currencySymbol: string;
  lowStockThreshold: number;
  staffMembers: string[]; 
  commissionRate: number; 
  appPin: string; // New: Security PIN (empty string means disabled)
}

export type ViewState = 'DASHBOARD' | 'STOCK' | 'POS' | 'CUSTOMERS' | 'ANALYTICS' | 'LEDGER' | 'SETTINGS' | 'PLANNER';

// --- PSYCHOLOGY ENGINE V3.0 TYPES ---

export interface AssessmentData {
    // The 10-Point Behavioral Interrogation
    defaultBehavior: string;
    unexpectedReaction: string;
    disagreementStyle: string;
    controlFocus: string;
    avoidance: string;
    focusObject: string; // What do they over-focus on?
    responseSpeed: string;
    frustrationTrigger: string;
    calmingTrigger: string;
    coreDrive: string; // Reassurance, efficiency, power, etc.
    // Quantitative Flags
    impulsivityScore: number; // 1-10
    loyaltyScore: number; // 1-10
    riskScore: number; // 1-10
}

export interface ArchetypeProfile {
    primary: string; // e.g., "Analyst"
    secondary: string; // e.g., "Navigator"
    scorePrimary: number;
    scoreSecondary: number;
    drives: string[]; // e.g., ["Precision", "Autonomy"]
    insecurity: string[]; // e.g., ["Being wrong"]
    
    // V3.0 Interaction Strategy
    interactionStrategy: {
        tone: string;
        detailLevel: string;
        avoid: string[];
        stabiliseWith: string[];
        persuasionAnchor: string;
    };
    
    // Cognitive Dimensions
    cognitive: {
        abstraction: 'Abstract' | 'Concrete';
        tempo: 'Fast' | 'Slow' | 'Variable';
        frictionAversion: number; // 0-100
    };

    // V3.1 Lifecycle Prediction
    lifecycle: {
        churnProbability: number; // 0-100%
        predictedNextPurchase: string; // "Within 3 days"
        engagementScore: number; // 0-100
        retentionFactor: number; // Multiplier for LTV calcs (e.g. 1.2 for loyal, 0.8 for churn risk)
    };

    summary: string;
    lastUpdated: string;
}

// --- PREDICTIVE ANALYTICS TYPES ---

export interface RestockPrediction {
    batchId: string;
    batchName: string;
    daysRemaining: number;
    stockoutDate: string;
    confidence: number;
    suggestedReorder: number;
}

export interface SalesForecast {
    period: string; // "Next 7 Days"
    predictedRevenue: number;
    predictedVolume: number;
    topArchetypeTarget: string; // e.g. "Target 'Impulsive Collectors' next week"
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
  visualDescription?: string; // New: For AI Image Gen
  avatarImage?: string; // New: Base64 Image
  tags: string[]; 
  assessmentData?: AssessmentData;
  psychProfile?: ArchetypeProfile; 
  totalSpent: number;
  lastPurchase: string;
  transactionHistory: Sale[];
}

// --- DATA CONTEXT TYPES ---
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