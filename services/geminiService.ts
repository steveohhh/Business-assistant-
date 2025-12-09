import { GoogleGenAI, Type } from "@google/genai";
import { Customer, ArchetypeProfile, Sale, Batch, BusinessIntelligence } from '../types';

const getClient = () => {
  const apiKey = process.env.API_KEY || ''; 
  return new GoogleGenAI({ apiKey });
};

// --- IMAGE GENERATION ---
export const generateAvatar = async (description: string, quality: 'fast' | 'detailed' = 'fast'): Promise<string | null> => {
    if (!process.env.API_KEY) return null;
    const ai = getClient();
    
    // Choose model based on quality setting
    const model = quality === 'detailed' ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
    
    // Adjust prompt for higher quality if requested
    const prompt = quality === 'detailed' 
        ? `Create a highly detailed, cinematic cyberpunk RPG character portrait. Dark futuristic aesthetic, neon lighting, high contrast. Character description: ${description}. 4k resolution, digital art style.`
        : `Cyberpunk RPG character portrait, digital art, neon style. Description: ${description}`;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: {
                parts: [{ text: prompt }]
            },
            // 3-pro-image-preview supports imageConfig
            config: quality === 'detailed' ? {
                imageConfig: { aspectRatio: '1:1', imageSize: '1K' }
            } : undefined
        });
        
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
          .slice(-20) 
          .map(s => `[${s.category}] ${s.event} (Intensity: ${s.intensity})`)
          .join("; ")
      : "No observable micro-signals recorded.";

  // Process Situational Encounters
  const encountersLog = customer.encounters
      ? customer.encounters
          .map(e => `SITUATION: ${e.situation} -> REACTION: ${e.reaction} (Outcome: ${e.outcome})`)
          .join("\n")
      : "No detailed situational encounters logged.";

  const prompt = `
    ACT AS THE ARCHETYPE ENGINE V3.0.
    Analyze this subject based on behavioral interrogation, sales history, micro-signals, and specific situational encounters.

    SUBJECT DATA:
    Name: ${customer.name}
    History: ${historySummary}
    Behavioral Interrogation: ${assessment}
    Notes: ${customer.notes}
    
    *** MICRO-SIGNALS ***
    ${microSignalsLog}
    
    *** SITUATIONAL ENCOUNTERS ***
    ${encountersLog}
    ***********************

    ALGORITHM INSTRUCTIONS:
    1. EXTRACT BEHAVIOURAL FEATURES from all inputs.
    2. MAP TO ARCHETYPES.
    3. GENERATE RPG STATS (0-100) based on behavior.
       - Negotiation: Ability to haggle/get value.
       - Intellect: Knowledge of product/pricing.
       - Patience: Willingness to wait.
       - Volatility: Likelihood of emotional outburst.
       - Loyalty: Probability of sticking to this vendor.
       - RiskPerception: Tolerance for sketchiness/high prices.

    OUTPUT JSON ONLY:
    {
        "primary": "string",
        "secondary": "string",
        "scorePrimary": number,
        "scoreSecondary": number,
        "drives": ["string"],
        "insecurity": ["string"],
        "interactionStrategy": {
            "tone": "string (Max 2 words)",
            "detailLevel": "string",
            "avoid": ["string"],
            "stabiliseWith": ["string"],
            "persuasionAnchor": "string"
        },
        "cognitive": {
            "abstraction": "Abstract" | "Concrete",
            "tempo": "Fast" | "Slow" | "Variable",
            "frictionAversion": number
        },
        "rpgStats": {
            "negotiation": number,
            "intellect": number,
            "patience": number,
            "volatility": number,
            "loyalty": number,
            "riskPerception": number
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
        RECENT SALES LOG (30 DAYS): ${JSON.stringify(recentSales.map(s => ({ date: s.timestamp, batch: s.batchName, weight: s.weight, amount: s.amount })))}

        TASKS:
        1. Calculate burn rate for each batch.
        2. Predict stockout dates.
        3. Forecast next 7 days revenue (Day 1 to Day 7) based on trends/seasonality in the log.
        4. Analyze which customer archetypes (Analyst, Maverick, Connector, Sentinel) are most likely to buy and estimate potential revenue from them.

        OUTPUT JSON ONLY:
        {
            "restock": [
                { "batchId": "id", "batchName": "name", "daysRemaining": number, "stockoutDate": "YYYY-MM-DD", "confidence": number (0-100), "suggestedReorder": number }
            ],
            "forecast": {
                "period": "Next 7 Days",
                "predictedRevenue": number,
                "predictedVolume": number,
                "topArchetypeTarget": "string",
                "dailyTrend": [
                    { "day": "DayName", "revenue": number }
                ],
                "archetypeBreakdown": [
                    { "archetype": "string", "potentialRevenue": number }
                ]
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