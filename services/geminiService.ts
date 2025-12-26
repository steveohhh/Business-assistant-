import { GoogleGenAI, Type } from "@google/genai";
import { Customer, ArchetypeProfile, Sale, Batch, BusinessIntelligence, Achievement, InventoryType } from '../types';
import { customerPerksData } from '../data/customer_perks';

// Updated initialization to strictly match guidelines using process.env.API_KEY directly
const getClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// --- IMAGE GENERATION ---
export const generateAvatar = async (
    description: string, 
    achievements: Achievement[], 
    quality: 'fast' | 'detailed' = 'fast',
    achievementTrigger?: string
): Promise<string | null> => {
    if (!process.env.API_KEY) return null;
    const ai = getClient();
    
    // Build context from achievements (Badges influence the look)
    let visualModifiers = "";
    
    // If a specific achievement triggered this, override with intense focus
    if (achievementTrigger) {
        if (achievementTrigger === 'The Bender' || achievementTrigger.includes('Days Up')) visualModifiers += ", extreme exhaustion, dark bags under eyes, pale skin, sweaty, 3 days awake look, disheveled";
        else if (achievementTrigger === 'Paranoid Android') visualModifiers += ", looking over shoulder, paranoid expression, hiding face, peeking through blinds, nervous sweat";
        else if (achievementTrigger === 'Glass Blower') visualModifiers += ", holding a glass pipe, manic wide eyes, dilated pupils, gritty texture, smoke";
        else if (achievementTrigger === 'The Plug') visualModifiers += ", holding large stack of cash, wearing gold chains, confident smirk, low angle shot";
        else if (achievementTrigger === 'Pin Cushion') visualModifiers += ", track marks visible, bruised skin, intense gaze, medical realism";
        else visualModifiers += `, ${achievementTrigger} vibe, intense atmosphere`;
    } else {
        // Standard Profile Generation
        if (achievements.some(a => a.id === 'smurf')) visualModifiers += ", small nervous stature, looking down";
        if (achievements.some(a => a.id === 'the_plug')) visualModifiers += ", wearing expensive jewelry, confident posture, luxury streetwear";
        if (achievements.some(a => a.id === 'bender_3')) visualModifiers += ", tired eyes, disheveled look, unkempt hair";
        if (achievements.some(a => a.id === 'gummy_bear')) visualModifiers += ", missing a tooth, rugged grin, street hardened";
        if (achievements.some(a => a.id === 'copper_king')) visualModifiers += ", carrying scrap metal or wire, dirty hands, grease stains";
    }

    // VARIETY INJECTION: Realism / Street / Mugshot (NO CYBORG)
    const styles = [
        'Flash Photography, Night', 
        'CCTV Footage Still, Grainy, High Angle', 
        '35mm Film Scan, Gritty Realism', 
        'Police Mugshot Style, Harsh Lighting', 
        'Candid Street Photography, Low Light'
    ];
    const randomStyle = styles[Math.floor(Math.random() * styles.length)];

    // STRICT PROMPT ENGINEERING: explicit negation of sci-fi elements
    const basePrompt = achievementTrigger 
        ? `A hyper-realistic photo of a person experiencing "${achievementTrigger}". Visual details: ${visualModifiers}. Base description: ${description}. Style: ${randomStyle}. Context: Real world, gritty urban life. NO cyborg parts, NO robot arms, NO sci-fi armor, NO neon glowing eyes. Pure grit.`
        : `A hyper-realistic street portrait of ${description}. Visual traits: ${visualModifiers}. Style: ${randomStyle}. Context: Gritty urban underground. NO cyborg parts, NO sci-fi elements, NO robotic limbs. Just realistic human details.`;

    try {
        // Use Gemini Flash Image for reliable generation
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: basePrompt }]
            },
            config: {
                imageConfig: {
                    aspectRatio: "1:1"
                }
            }
        });
        
        // Find the image part iterating through parts as per guidelines
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

// --- THEME GENERATOR ---
export const generateAppTheme = async (
    customPrompt: string,
    inventoryType: InventoryType,
    stockLevel: 'HIGH' | 'LOW' | 'CRITICAL', 
    financialHealth: 'RICH' | 'STABLE' | 'POOR'
): Promise<string | null> => {
    if (!process.env.API_KEY) return null;
    const ai = getClient();

    let systemMood = "";
    if (stockLevel === 'CRITICAL' && financialHealth === 'POOR') systemMood = "Atmosphere: Desperate, empty shelves, rain, dark grey.";
    else if (stockLevel === 'HIGH' && financialHealth === 'RICH') systemMood = "Atmosphere: Thriving, golden hour, successful, high-tech.";
    else if (financialHealth === 'POOR') systemMood = "Atmosphere: Gritty, shadowy, red warning lights, underground.";
    else systemMood = "Atmosphere: Professional, balanced, industrial.";

    // Context based on inventory type
    let productContext = "";
    if (inventoryType === 'GRASS') productContext = "Botany, greenhouse, organic textures, smoke haze.";
    if (inventoryType === 'GLASS') productContext = "Crystalline structures, sharp edges, refractive light, laboratory.";
    if (inventoryType === 'LIQUID') productContext = "Fluid dynamics, chemistry, vials, liquid viscosity, droplets.";

    const prompt = `
        Abstract background wallpaper for a UI.
        Theme: "${customPrompt}".
        Context: ${productContext}
        Mood: ${systemMood}
        Style: Abstract, textured, cinematic lighting, dark mode optimized, no text, no people.
    `;

    try {
        // Use Gemini Flash Image for reliable background generation
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            config: {
                imageConfig: {
                    aspectRatio: "16:9"
                }
            }
        });
        
        // Find the image part iterating through parts as per guidelines
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData && part.inlineData.data) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        return null;
    } catch (e) {
        console.error("Theme Gen Failed", e);
        return null;
    }
};

export const analyzeCustomerProfile = async (customer: Customer, history: Sale[]): Promise<Customer | null> => {
  if (!process.env.API_KEY) return null;
  const ai = getClient();
  const assessment = customer.assessmentData ? JSON.stringify(customer.assessmentData) : "No formal assessment.";
  const transactionLog = history.map(s => ({ date: s.timestamp, amount: s.amount, item: s.batchName }));
  const historySummary = `Transactions: ${history.length}, Total Spent: $${customer.totalSpent}, Last Purchase: ${customer.lastPurchase}`;
  const microSignalsLog = customer.microSignals ? customer.microSignals.slice(-20).map(s => `[${s.category}] ${s.event} (Intensity: ${s.intensity})`).join("; ") : "No observable micro-signals recorded.";
  const encountersLog = customer.encounters ? customer.encounters.map(e => `SITUATION: ${e.situation} -> REACTION: ${e.reaction} (Outcome: ${e.outcome})`).join("\n") : "No detailed situational encounters logged.";
  
  // NEW: Integrate equipped perks into the analysis context
  const equippedPerks = (customer.equippedPerks || [])
    .map(perkId => customerPerksData.find(p => p.id === perkId))
    .filter(p => p);
  
  const perksLog = equippedPerks.length > 0
    ? `OPERATOR-ASSIGNED TRAITS (High Priority):\n${equippedPerks.map(p => `- ${p.name}: ${p.description}`).join('\n')}`
    : "No operator-assigned traits.";
  
  const prompt = `
    ACT AS THE ARCHETYPE ENGINE V3.0. 
    Analyze subject:
    Name: ${customer.name}
    History: ${historySummary}
    Log: ${JSON.stringify(transactionLog)}
    Assessment: ${assessment}
    Signals: ${microSignalsLog}
    Encounters: ${encountersLog}
    ${perksLog}

    TASK:
    1. Construct 'psychProfile'.
    2. Estimate DISC personality scores (0-100) for Dominance, Influence, Steadiness, Conscientiousness.
    3. Estimate OCEAN personality scores (0-100) for Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism.
    4. Estimate RPG Stats (0-100): Trustworthiness, Loyalty, Risk Perception, Intellect, Negotiation, Patience, Volatility.
    5. Construct 'temporalMetrics'.
    6. CRUCIALLY, factor the 'OPERATOR-ASSIGNED TRAITS' into your final analysis. Adjust the 'interactionStrategy' to leverage or mitigate these observed traits.

    Output strictly valid JSON schema matching the 'Customer' typescript interface for keys 'psychProfile' and 'temporalMetrics'.
  `;
  
  try {
    const response = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: prompt, config: { responseMimeType: "application/json" } });
    // Correct extraction using .text property as per guidelines
    const text = response.text;
    if (!text) return null;
    const result = JSON.parse(text);
    return { ...customer, psychProfile: { ...result.psychProfile, lastUpdated: new Date().toISOString() }, temporalMetrics: result.temporalMetrics };
  } catch (error) { return null; }
};

export const generateBusinessIntelligence = async (batches: Batch[], sales: Sale[]): Promise<BusinessIntelligence | null> => {
    if (!process.env.API_KEY) return null;
    const ai = getClient();
    const stockData = batches.map(b => ({ id: b.id, name: b.name, current: b.currentStock, initial: b.actualWeight }));
    const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentSales = sales.filter(s => new Date(s.timestamp) > thirtyDaysAgo);
    const prompt = `ACT AS PREDICTIVE ANALYST. STOCK: ${JSON.stringify(stockData)}. SALES: ${JSON.stringify(recentSales.map(s => ({ date: s.timestamp, batch: s.batchName, weight: s.weight, amount: s.amount })))}. TASKS: Burn rate, stockout dates, 7-day forecast, archetype analysis. Output JSON schema for BusinessIntelligence.`;
    try {
        const response = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: prompt, config: { responseMimeType: "application/json" } });
        // Correct extraction using .text property as per guidelines
        const text = response.text;
        if (!text) return null;
        const bi = JSON.parse(text) as BusinessIntelligence;
        bi.lastGenerated = new Date().toISOString();
        return bi;
    } catch (e) { return null; }
}

export const generateDailyBriefing = async (sales: Sale[], batches: Batch[], customers: Customer[]): Promise<string | null> => {
    if (!process.env.API_KEY) return null;
    const ai = getClient();
    const today = new Date().toLocaleDateString();
    const todaysSales = sales.filter(s => new Date(s.timestamp).toLocaleDateString() === today);
    const revenueToday = todaysSales.reduce((sum, s) => sum + s.amount, 0);
    const lowStockBatches = batches.filter(b => b.currentStock < b.actualWeight * 0.2).map(b => b.name);
    const prompt = `Executive Assistant Briefing. Date: ${today}. Revenue: $${revenueToday}. Tx: ${todaysSales.length}. Alerts: ${lowStockBatches.join(', ') || "None"}. Active Clients: ${customers.length}. Tone: Cyberpunk Professional. Max 3 sentences.`;
    try {
        const response = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: prompt });
        // Correct extraction using .text property as per guidelines
        return response.text;
    } catch (e) { return "System offline."; }
}