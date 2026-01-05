import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, SpendingPersona, BudgetRecommendation, FinancialHealth, Necessity, Sentiment } from "../types";

// STABLE MODEL: Primary production model.
const MODEL_NAME = "gemini-2.5-flash";








/**
 * Helper to get a fresh instance of the AI client.
 * Using a function ensures we use the most up-to-date process.env.VITE_API_KEY.
 */
const getAI = () => {
  const apiKey = import.meta.env.VITE_API_KEY;
  if (!apiKey || apiKey === "undefined" || apiKey === "") {
    console.warn("Gemini API Key is missing. AI features will be disabled.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const categorizeTransaction = async (rawText: string, amount: number): Promise<Partial<Transaction>> => {
  try {
    const ai = getAI();
    if (!ai) throw new Error("Missing API Key");

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Analyze this transaction semantically: "${rawText}" for ₹${amount}.
      
      Classify into one of these CATEGORIES:
      - Food (e.g., "Biryani", "Pizza", "Dosa", "Burger", "Sandwich")
      - Transportation (e.g., "Uber ride", "Bus ticket", "Metro", "Flight", "Petrol")
      - Entertainment (e.g., "Netflix", "Spotify", "Steam", "Movies")
      - Shopping (e.g., "Shirt", "Shoes", "Myntra", "Amazon")
      - Utilities (e.g., "Rent", "Electricity", "Recharge")
      - Groceries (e.g., "Milk", "Vegetables")
      - Medical (e.g., "Pharmacy", "Doctor")
      - Housing
      - Education
      - Personal Care
      - Travel (Long distance/Vacation)
      - Investments
      
      Use SEMANTIC understanding:
      - "Chicken Dum Biryani" -> Food (even if "Food" word is missing)
      - "HP Petrol Pump" -> Transportation (Fuel context)
      - "Swiggy" -> Food
      - "Ola" -> Transportation
      
      Perform SENTIMENT ANALYSIS (Sentiment):
      - Positive: Spend makes user happy (e.g. Good Food, Shopping, Concerts, Savings)
      - Neutral: Necessary routines (e.g. Fuel, Groceries, Rent, Bills)
      - Negative: Stressful or waste (e.g. Fines, Medical emergencies, Debt interest)

      Determine:
      1. Merchant name (Cleaned up, proper casing)
      2. Primary category (Strictly from the list above)
      3. Specific sub-category (e.g. "Dining Out", "Fuel", "Streaming")
      4. Necessity: 'Need' (Essentials) vs 'Want' (Discretionary) vs 'Savings' vs 'Debt'
      5. Sentiment: 'Positive' vs 'Neutral' vs 'Negative'
      
      Return valid JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            merchant: { type: Type.STRING },
            category: { type: Type.STRING },
            subCategory: { type: Type.STRING },
            necessity: { type: Type.STRING, enum: ['Need', 'Want', 'Savings', 'Debt'] },
            sentiment: { type: Type.STRING, enum: ['Positive', 'Neutral', 'Negative'] }
          },
          required: ["merchant", "category", "subCategory", "necessity", "sentiment"]
        }
      }
    });

    const text = response.text || "{}";
    const result = JSON.parse(text);

    // HYBRID OVERRIDE: Prioritize local rules ("User Taught") over AI
    // faster, cheaper, and guarantees "Biryani" -> "Food" if we have a rule for it.
    const localAttempt = localClassify(rawText);
    if (localAttempt.category !== 'Uncategorized') {
      // We explicitly trust our local dictionary for Category/SubCategory/Sentiment
      return {
        ...result,
        category: localAttempt.category,
        subCategory: localAttempt.subCategory,
        // Optional: Keep AI's sentiment if it's nuanced? 
        // User asked "I TAUGHT IT", so we trust local rules fully for consistency.
        sentiment: localAttempt.sentiment as Sentiment,
        necessity: localAttempt.necessity as Necessity
      };
    }

    return result;
  } catch (e) {
    console.warn("AI Categorization failed (Rate Limit or Network), using heuristic fallback.", e);
    return localClassify(rawText);
  }
};

/**
 * Fallback rule-based classifier for when AI is down or rate-limited.
 */
const localClassify = (text: string): Partial<Transaction> => {
  const lower = text.toLowerCase();

  const rules: { keys: string[], cat: string, sub: string, nec: Necessity, sent: Sentiment }[] = [
    { keys: ['uber eats', 'swiggy', 'zomato', 'food', 'burger', 'pizza', 'lunch', 'dinner', 'biryani', 'restaurant', 'dosa', 'mcdonalds', 'kfc', 'domineos'], cat: 'Food', sub: 'Dining', nec: Necessity.WANT, sent: Sentiment.POSITIVE },
    { keys: ['coffee', 'cofee', 'tea', 'cafe', 'starbucks', 'chai', 'blue tokai'], cat: 'Food', sub: 'Coffee', nec: Necessity.WANT, sent: Sentiment.POSITIVE },
    { keys: ['bus', 'metro', 'train', 'uber', 'ola', 'auto', 'cab', 'flight', 'ticket', 'airways', 'rapido'], cat: 'Transportation', sub: 'Commute', nec: Necessity.NEED, sent: Sentiment.NEUTRAL },
    { keys: ['grocery', 'groceries', 'milk', 'vegetable', 'fruit', 'blinkit', 'zepto', 'bigbasket', 'dmart'], cat: 'Groceries', sub: 'Essentials', nec: Necessity.NEED, sent: Sentiment.NEUTRAL },
    { keys: ['netflix', 'spotify', 'prime', 'hulu', 'movie', 'cinema', 'theatre', 'game', 'steam', 'youtube'], cat: 'Entertainment', sub: 'Subscription', nec: Necessity.WANT, sent: Sentiment.POSITIVE },
    { keys: ['petrol', 'diesel', 'fuel', 'gas', 'pump', 'shell', 'hpcl', 'bpcl'], cat: 'Transportation', sub: 'Fuel', nec: Necessity.NEED, sent: Sentiment.NEUTRAL },
    { keys: ['recharge', 'wifi', 'broadband', 'bill', 'electricity', 'water', 'rent', 'house', 'maintenance'], cat: 'Utilities', sub: 'Bills', nec: Necessity.NEED, sent: Sentiment.NEUTRAL },
    { keys: ['medicine', 'pharmacy', 'doctor', 'hospital', 'clinic', 'apollo', 'medplus'], cat: 'Medical', sub: 'Health', nec: Necessity.NEED, sent: Sentiment.NEGATIVE },
    { keys: ['shirt', 'shoes', 'myntra', 'amazon', 'flipkart', 'shopping', 'zara', 'h&m', 'uniqlo', 'nike', 'adidas'], cat: 'Shopping', sub: 'Apparel', nec: Necessity.WANT, sent: Sentiment.POSITIVE }
  ];

  for (const rule of rules) {
    if (rule.keys.some(k => lower.includes(k))) {
      return {
        merchant: text, // Best guess
        category: rule.cat,
        subCategory: rule.sub,
        necessity: rule.nec,
        sentiment: rule.sent
      };
    }
  }

  return {
    merchant: text,
    category: "Uncategorized",
    subCategory: "General",
    necessity: Necessity.WANT,
    sentiment: Sentiment.NEUTRAL
  };
};

export const generatePersona = async (transactions: Transaction[]): Promise<SpendingPersona> => {
  try {
    const ai = getAI();
    if (!ai) throw new Error("Missing API Key");

    const summary = transactions.slice(-50).map(t => `${t.category} (${t.necessity}, ${t.sentiment}): ₹${t.amount}`).join(", ");

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Based on these transactions: ${summary}. 
      Assign a spending persona (e.g., 'The Impulsive Foodie', 'The Disciplined Saver'). 
      Provide a 2-sentence justification based on spending percentages and emotional patterns.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            justification: { type: Type.STRING },
            percentages: {
              type: Type.OBJECT,
              properties: {
                needs: { type: Type.NUMBER },
                wants: { type: Type.NUMBER },
                savings: { type: Type.NUMBER }
              },
              required: ["needs", "wants", "savings"]
            }
          },
          required: ["name", "justification", "percentages"]
        }
      }
    });

    const text = response.text || "{}";
    return JSON.parse(text);
  } catch (e) {
    // Silent fallback for background persona generator
    return {
      name: "The Quiet Spender",
      justification: "PennyWise is observing your patterns. Keep logging to see your persona evolve!",
      percentages: { needs: 50, wants: 30, savings: 20 },
      analysisDate: new Date().toISOString()
    };
  }
};

export const getSpendingPersona = generatePersona;

export const getFinancialHealthScore = async (transactions: Transaction[]): Promise<FinancialHealth> => {
  try {
    const ai = getAI();
    if (!ai) throw new Error("Missing API Key");

    const summary = transactions.slice(-30).map(t => `₹${t.amount} on ${t.category} (${t.necessity})`).join("; ");

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Analyze these recent transactions and provide a financial health score (0-100).
      Data: ${summary}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER },
            status: { type: Type.STRING, enum: ['Excellent', 'Stable', 'Critical'] },
            tip: { type: Type.STRING }
          },
          required: ["score", "status", "tip"]
        }
      }
    });

    const text = response.text || "{}";
    return JSON.parse(text);
  } catch (e) {
    return { score: 50, status: 'Stable', tip: 'AI service unavailable temporarily.' };
  }
};

export const getFinancialHealth = getFinancialHealthScore;

export const getBudgetAdvice = async (transactions: Transaction[], persona: SpendingPersona | null): Promise<BudgetRecommendation[]> => {
  try {
    const ai = getAI();
    if (!ai) return [];

    const summary = transactions.slice(-100).map(t => `${t.category}: ₹${t.amount}`).join(", ");
    const personaContext = persona ? `User is a "${persona.name}" who usually spends like this: ${persona.justification}.` : "";

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Analyze expenses: ${summary}. ${personaContext}
      Generate budget caps for the top 3 spending categories.
      CRITICAL: For each category, provide a HIGHLY PURSONALIZED "actionableTip". 
      Example: If they spend a lot on "Dining Out", the tip could be "Try meal prepping lunch for 3 days next week."
      Make it specific to their behavior.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING },
              currentSpend: { type: Type.NUMBER },
              recommendedLimit: { type: Type.NUMBER },
              reasoning: { type: Type.STRING },
              actionableTip: { type: Type.STRING }
            },
            required: ["category", "currentSpend", "recommendedLimit", "reasoning", "actionableTip"]
          }
        }
      }
    });

    const text = response.text || "[]";
    return JSON.parse(text);
  } catch (e) {
    // Silent fallback for background budget advice
    return [];
  }
};

export const getBudgetRecommendations = getBudgetAdvice;

// Helper to generate accurate financial context for the AI
const generateFinancialContext = (transactions: Transaction[]): string => {
  if (transactions.length === 0) return "No transactions available.";

  const totalSpend = transactions.reduce((sum, t) => sum + t.amount, 0);
  const byCategory: Record<string, number> = {};
  const byMerchant: Record<string, number> = {};
  const byMonth: Record<string, number> = {};

  transactions.forEach(t => {
    // Category
    byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;

    // Merchant (simple normalization)
    const mid = t.merchant.trim();
    byMerchant[mid] = (byMerchant[mid] || 0) + t.amount;

    // Month
    try {
      const date = new Date(t.date);
      const monthKey = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      byMonth[monthKey] = (byMonth[monthKey] || 0) + t.amount;
    } catch (e) {
      // ignore invalid dates
    }
  });

  const categoryStr = Object.entries(byCategory).map(([k, v]) => `- ${k}: ₹${v.toFixed(0)}`).join('\n');
  const merchantStr = Object.entries(byMerchant)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([k, v]) => `- ${k}: ₹${v.toFixed(0)}`)
    .join('\n');
  const monthStr = Object.entries(byMonth).map(([k, v]) => `- ${k}: ₹${v.toFixed(0)}`).join('\n');

  // Current Month Logic
  const now = new Date();
  const currentMonthKey = now.toLocaleString('default', { month: 'short', year: 'numeric' });
  const currentMonthSpend = byMonth[currentMonthKey] || 0;

  const currentMonthCategory: Record<string, number> = {};
  transactions.forEach(t => {
    try {
      const d = new Date(t.date);
      if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
        currentMonthCategory[t.category] = (currentMonthCategory[t.category] || 0) + t.amount;
      }
    } catch (e) { }
  });

  const currentMonthCatStr = Object.entries(currentMonthCategory)
    .map(([k, v]) => `- ${k}: ₹${v.toFixed(0)}`)
    .join('\n');

  return `
  REAL-TIME FINANCIAL STATS (Use these Numbers):
  
  [Total Spending (All Time)]: ₹${totalSpend.toFixed(2)}
  
  [CURRENT MONTH STATS (${currentMonthKey})]:
  Total: ₹${currentMonthSpend.toFixed(0)}
  Breakdown:
  ${currentMonthCatStr || "No spending this month yet."}

  [All Time By Category]:
  ${categoryStr}
  
  [Top Spending by Merchant]:
  ${merchantStr}

  [Monthly Breakdown]:
  ${monthStr}
  `;
};

export const talkToMoney = async (query: string, transactions: Transaction[]): Promise<string> => {
  try {
    const ai = getAI();
    if (!ai) return "I cannot analyze your data without an active API connection.";

    // 1. Generate Aggregate Context (The "Cheat Sheet")
    const statsContext = generateFinancialContext(transactions);

    // 2. Also keep recent raw transactions for specifics (last 20)
    const recentTx = transactions.slice(0, 20).map(t => `${t.date}: ${t.merchant} (${t.category}) - ₹${t.amount}`).join("\n");

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `You are PennyWise, a friendly, encouraging, and savvy personal finance advisor.
      
      Your Persona:
      - Talk like a helpful, knowledgeable friend.
      - Use warm, simple language (e.g. "Let's check...", "Great job!", "Heads up...").
      - Avoid complex financial jargon unless explained simply.
      - Be concise but conversational.

      USER QUESTION: "${query}"

      Here is the ACCURATE DATA derived from the database:
      ${statsContext}

      Recent Transactions (for context):
      ${recentTx}

      INSTRUCTIONS:
      - Use the "REAL-TIME FINANCIAL STATS" to answer questions.
      - IF user asks about "This Month" or "Current Month", STRICTLY use the [CURRENT MONTH STATS] section.
      - Example: "How much on food this month?" -> Look at [CURRENT MONTH STATS] -> Food.
      - Do NOT calculate sums yourself if they are in the stats.
      - ALWAYS try to add a small, specific, and friendly money-saving tip relevant to their spending if possible.
      `,
      config: { temperature: 0.7 } // Higher temperature for friendliness
    });

    return response.text || "I'm having trouble connecting to your data right now.";
  } catch (e: any) {
    if (e.message?.includes("429") || e.status === 429 || e.message?.toLowerCase().includes("quota")) {
      return "I'm a bit overwhelmed right now (Rate Limit Reached). Please wait 30 seconds and try again!";
    }
    // Fully silent for cleaner UI as per user request
    return "I'm having a brief connection hiccup. Could you please try asking that again in a moment?";
  }
};

export const chatWithMoney = talkToMoney;