import { GoogleGenAI, Type } from "@google/genai";
import { Customer, ArchetypeProfile, Sale, Batch, BusinessIntelligence } from '../types';

const getClient = () => {
  const apiKey = process.env.API_KEY || ''; 
  return new GoogleGenAI({ apiKey });
};

// --- IMAGE GENERATION ---
export const generateAvatar = async (description: string): Promise<string | null> => {
    if (!process.env.API_KEY) return null;
    const ai = getClient();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: `Generate a cyberpunk RPG style character portrait for a character described as: ${description}. The style should be high contrast, digital art, dark futuristic aesthetic, neon accents. Head and shoulders shot.` }]
            }
        });
        
        // The SDK might return multiple parts, find the image part
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData && part.inlineData.data) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        return null;
    } catch (e) {
        console.error("Avatar Gen Failed", e);
        return null;
    }
}

// --- ARCHETYPE ENGINE V3.0 ---
export const analyzeCustomerProfile = async (
  customer: Customer, 
  history: Sale[]
): Promise<ArchetypeProfile | null> => {
  if (!process.env.API_KEY) return null;
  const ai = getClient();

  const assessment = customer.assessmentData ? JSON.stringify(customer.assessmentData) : "No formal assessment.";
  const historySummary = `Transactions: ${history.length}, Total Spent: $${customer.totalSpent}, Last Purchase: ${customer.lastPurchase}`;

  // Process Micro-Signals
  const microSignalsLog = customer.microSignals 
      ? customer.microSignals
          .slice(-20) // Take last 20
          .map(s => `[${s.category}] ${s.event} (Intensity: ${s.intensity})`)
          .join("; ")
      : "No observable micro-signals recorded.";

  const prompt = `
    ACT AS THE ARCHETYPE ENGINE V3.0.
    Analyze this subject based on the 10-point behavioral interrogation, transaction history, and OBSERVED MICRO-SIGNALS.

    SUBJECT DATA:
    Name: ${customer.name}
    History: ${historySummary}
    Behavioral Interrogation: ${assessment}
    Notes: ${customer.notes}
    
    *** CRITICAL: MICRO-SIGNALS LOG ***
    ${microSignalsLog}
    ***********************************

    ALGORITHM INSTRUCTIONS:
    1. EXTRACT BEHAVIOURAL FEATURES from both the Assessment AND the Micro-Signals.
    2. MAP TO ARCHETYPES (Controller, Analyst, Reactor, Drifter, Optimiser, Validator, Challenger, Minimalist, Opportunist, Navigator).
    3. GENERATE TACTICAL HUD DATA (Short, 1-3 words for HUD display).
    4. PREDICT LIFECYCLE METRICS.

    OUTPUT JSON ONLY:
    {
        "primary": "string",
        "secondary": "string",
        "scorePrimary": number,
        "scoreSecondary": number,
        "drives": ["string"],
        "insecurity": ["string"],
        "interactionStrategy": {
            "tone": "string (Max 2 words, e.g. 'Direct & Firm')",
            "detailLevel": "string",
            "avoid": ["string (Short topics)"],
            "stabiliseWith": ["string (Short tactics)"],
            "persuasionAnchor": "string (Max 2 words, e.g. 'Efficiency' or 'Status')"
        },
        "cognitive": {
            "abstraction": "Abstract" | "Concrete",
            "tempo": "Fast" | "Slow" | "Variable",
            "frictionAversion": number
        },
        "lifecycle": {
            "churnProbability": number,
            "predictedNextPurchase": "string",
            "engagementScore": number,
            "retentionFactor": number
        },
        "summary": "string"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    const text = response.text;
    if (!text) return null;
    const profile = JSON.parse(text) as ArchetypeProfile;
    profile.lastUpdated = new Date().toISOString();
    return profile;
  } catch (error) {
    console.error("Archetype Engine Failed", error);
    return null;
  }
};

// --- PREDICTIVE BUSINESS INTELLIGENCE ---
export const generateBusinessIntelligence = async (
    batches: Batch[],
    sales: Sale[]
): Promise<BusinessIntelligence | null> => {
    if (!process.env.API_KEY) return null;
    const ai = getClient();

    // Prepare dataset
    const stockData = batches.map(b => ({
        id: b.id, name: b.name, current: b.currentStock, initial: b.actualWeight
    }));
    
    // Summarize sales by batch last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentSales = sales.filter(s => new Date(s.timestamp) > thirtyDaysAgo);

    const prompt = `
        ACT AS A PREDICTIVE RETAIL ANALYST.
        
        STOCK DATA: ${JSON.stringify(stockData)}
        RECENT SALES LOG (30 DAYS): ${JSON.stringify(recentSales.map(s => ({ batch: s.batchName, weight: s.weight, amount: s.amount })))}

        TASKS:
        1. Calculate burn rate for each batch.
        2. Predict stockout dates.
        3. Forecast next 7 days revenue based on trends.
        4. Suggest a specific customer archetype to target to maximize revenue.

        OUTPUT JSON ONLY:
        {
            "restock": [
                { "batchId": "id", "batchName": "name", "daysRemaining": number, "stockoutDate": "YYYY-MM-DD", "confidence": number (0-100), "suggestedReorder": number }
            ],
            "forecast": {
                "period": "Next 7 Days",
                "predictedRevenue": number,
                "predictedVolume": number,
                "topArchetypeTarget": "string"
            }
        }
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        const text = response.text;
        if (!text) return null;
        
        const bi = JSON.parse(text) as BusinessIntelligence;
        bi.lastGenerated = new Date().toISOString();
        return bi;
    } catch (e) {
        console.error("BI Generation Failed", e);
        return null;
    }
}

// --- EXECUTIVE BRIEFING AGENT ---
export const generateDailyBriefing = async (
    sales: Sale[], 
    batches: Batch[], 
    customers: Customer[]
): Promise<string | null> => {
    if (!process.env.API_KEY) return null;
    const ai = getClient();

    const today = new Date().toLocaleDateString();
    const todaysSales = sales.filter(s => new Date(s.timestamp).toLocaleDateString() === today);
    const revenueToday = todaysSales.reduce((sum, s) => sum + s.amount, 0);
    const lowStockBatches = batches.filter(b => b.currentStock < b.actualWeight * 0.2).map(b => b.name);

    const prompt = `
        You are the AI Executive Assistant for a high-end retail operation.
        Generate a concise, cyberpunk-styled "Morning Briefing" (max 3 sentences).
        
        CONTEXT:
        Date: ${today}
        Revenue Today So Far: $${revenueToday}
        Transactions Today: ${todaysSales.length}
        Critical Stock Alerts: ${lowStockBatches.join(', ') || "None"}
        Total Active Customers: ${customers.length}

        TONE: Professional, tactical, motivating.
        GOAL: Summarize current status and give one strategic focus for the day.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });
        return response.text;
    } catch (e) {
        return "System offline. Unable to generate tactical briefing.";
    }
}