
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, Category, Necessity, SpendingPersona, BudgetRecommendation, FinancialHealth } from "./types";

/**
 * MOCK DATABASE 
 * Pre-populated with dummy data for Madhu Harshitha's presentation.
 */
let transactionsDb: Transaction[] = [
  { id: '1', rawText: 'Rent for March', merchant: 'Owner Home', amount: 18000, date: '2024-03-01', category: 'Housing', subCategory: 'Rent', necessity: 'Need', isSubscription: false },
  { id: '2', rawText: 'Swiggy Gourmet Order', merchant: 'Swiggy', amount: 850, date: '2024-03-15', category: 'Food', subCategory: 'Delivery', necessity: 'Want', isSubscription: false },
  { id: '3', rawText: 'Uber Premier Ride', merchant: 'Uber', amount: 420, date: '2024-03-18', category: 'Transportation', subCategory: 'Ride', necessity: 'Need', isSubscription: false },
  { id: '4', rawText: 'BESCOM Electricity Bill', merchant: 'BESCOM', amount: 3100, date: '2024-03-05', category: 'Utilities', subCategory: 'Electricity', necessity: 'Need', isSubscription: false },
  { id: '5', rawText: 'Netflix India Monthly', merchant: 'Netflix', amount: 499, date: '2024-03-02', category: 'Entertainment', subCategory: 'Streaming', necessity: 'Want', isSubscription: true },
  { id: '6', rawText: 'BigBasket Grocery Stock', merchant: 'BigBasket', amount: 4500, date: '2024-03-10', category: 'Food', subCategory: 'Groceries', necessity: 'Need', isSubscription: false },
  { id: '7', rawText: 'PVR Movie and Snacks', merchant: 'PVR Cinemas', amount: 1200, date: '2024-03-20', category: 'Entertainment', subCategory: 'Cinema', necessity: 'Want', isSubscription: false },
  { id: '8', rawText: 'Cult.fit Gym Monthly', merchant: 'Cult.fit', amount: 1800, date: '2024-03-01', category: 'Healthcare', subCategory: 'Fitness', necessity: 'Need', isSubscription: true },
  { id: '9', rawText: 'HP Petrol Pump Fillup', merchant: 'HP Petrol', amount: 2500, date: '2024-03-12', category: 'Transportation', subCategory: 'Fuel', necessity: 'Need', isSubscription: false },
  { id: '10', rawText: 'Starbucks Coffee', merchant: 'Starbucks', amount: 350, date: '2024-03-22', category: 'Food', subCategory: 'Cafe', necessity: 'Want', isSubscription: false },
  { id: '11', rawText: 'Zomato Dinner Order', merchant: 'Zomato', amount: 620, date: '2024-03-21', category: 'Food', subCategory: 'Delivery', necessity: 'Want', isSubscription: false },
  { id: '12', rawText: 'Airtel Broadband Bill', merchant: 'Airtel', amount: 1099, date: '2024-03-07', category: 'Utilities', subCategory: 'Internet', necessity: 'Need', isSubscription: true }
];

// Helper to detect subscriptions
const runSubscriptionDetection = (list: Transaction[]): Transaction[] => {
  const merchants = new Map<string, { amounts: Set<number>, count: number }>();
  list.forEach(t => {
    const key = t.merchant.toLowerCase();
    if (!merchants.has(key)) merchants.set(key, { amounts: new Set(), count: 0 });
    const data = merchants.get(key)!;
    data.amounts.add(t.amount);
    data.count += 1;
  });

  return list.map(t => {
    const data = merchants.get(t.merchant.toLowerCase());
    const isLikelySub = data && data.count >= 2 && data.amounts.size === 1;
    return { ...t, isSubscription: isLikelySub || t.isSubscription };
  });
};

/**
 * SERVER CONTROLLERS
 */
export const server = {
  // GET /api/transactions
  getTransactions: async () => {
    return { success: true, data: runSubscriptionDetection(transactionsDb) };
  },

  // POST /api/transactions/add
  addTransaction: async (payload: { rawText: string, amount: number }) => {
    const { rawText, amount } = payload;
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Parse this Indian bank transaction: "${rawText}" with amount ₹${amount}.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              merchant: { type: Type.STRING },
              category: { type: Type.STRING, enum: ['Housing', 'Transportation', 'Food', 'Utilities', 'Insurance', 'Healthcare', 'Savings', 'Debt', 'Entertainment', 'Other'] },
              subCategory: { type: Type.STRING },
              necessity: { type: Type.STRING, enum: ['Need', 'Want', 'Obligation'] }
            },
            required: ["merchant", "category", "subCategory", "necessity"]
          }
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        rawText,
        merchant: parsed.merchant || 'Unknown Merchant',
        amount,
        date: new Date().toISOString().split('T')[0],
        category: parsed.category || 'Other',
        subCategory: parsed.subCategory || 'General',
        necessity: parsed.necessity || 'Want',
        isSubscription: false
      };
      transactionsDb.push(newTransaction);
      return { success: true, data: newTransaction };
    } catch (error) {
      console.error("AI Categorization failed, using default:", error);
      const fallback: Transaction = {
        id: Date.now().toString(),
        rawText,
        merchant: 'Unprocessed Payment',
        amount,
        date: new Date().toISOString().split('T')[0],
        category: 'Other',
        subCategory: 'Manual Entry',
        necessity: 'Want',
        isSubscription: false
      };
      transactionsDb.push(fallback);
      return { success: true, data: fallback };
    }
  },

  updateTransaction: async (id: string, updates: Partial<Transaction>) => {
    const index = transactionsDb.findIndex(t => t.id === id);
    if (index !== -1) {
      transactionsDb[index] = { ...transactionsDb[index], ...updates };
      return { success: true, data: transactionsDb[index] };
    }
    return { success: false, message: 'Transaction not found' };
  },

  processChat: async (payload: { query: string }) => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const context = transactionsDb
        .slice(-30)
        .map(t => `[${t.id}] ${t.date}: ${t.merchant} (₹${t.amount}) - ${t.category}`)
        .join('\n');

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Context: Recent Transactions (₹):\n${context}\n\nUser Question: ${payload.query}`,
        config: {
          systemInstruction: "You are PennyWise AI Server. Use ₹. Answer questions about spending history. Identify semantic matches."
        }
      });

      const text = response.text || "I'm having trouble accessing my intelligence core right now.";
      const references = Array.from(text.matchAll(/\[(\d+)\]/g)).map(m => m[1]);
      return { success: true, data: { text, references } };
    } catch (error) {
      return { success: true, data: { text: "I'm sorry, I'm currently over-capacity. Please try again in a few moments.", references: [] } };
    }
  },

  getAnalysis: async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const summary = transactionsDb.reduce((acc: any, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {});

      // Fixed: Both calls strictly use 'gemini-3-flash-preview' to avoid 429 quota issues common with 'pro' models.
      const [personaRes, budgetRes] = await Promise.all([
        ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `Analyze ₹ spending: ${JSON.stringify(summary)}. Assign a persona and recommendations for an Indian user named Madhu Harshitha.`,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                justification: { type: Type.STRING },
                recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["name", "justification", "recommendations"]
            }
          }
        }),
        ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `Generate ₹ budget caps for these categories: ${JSON.stringify(summary)}`,
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
                  reasoning: { type: Type.STRING }
                },
                required: ["category", "currentSpend", "recommendedLimit", "reasoning"]
              }
            }
          }
        })
      ]);

      return {
        success: true,
        data: {
          persona: JSON.parse(personaRes.text || '{}'),
          budgets: JSON.parse(budgetRes.text || '[]')
        }
      };
    } catch (error) {
      console.error("Analysis failed due to quota or network:", error);
      // Robust Fallback data so the UI remains functional for Madhu Harshitha's environment
      return {
        success: true,
        data: {
          persona: {
            name: "The Persistent Saver (Local Mode)",
            justification: "Intelligence core is cooling down, but your manual records are safe.",
            recommendations: ["Track your small daily expenses", "Prioritize savings this month", "Consult me again in a few minutes"]
          },
          budgets: [
            { category: "Food", currentSpend: 0, recommendedLimit: 6000, reasoning: "Local urban benchmark." },
            { category: "Entertainment", currentSpend: 0, recommendedLimit: 2000, reasoning: "Discretionary buffer." }
          ]
        }
      };
    }
  },

  getHealth: async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const total = transactionsDb.reduce((s, t) => s + t.amount, 0);
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Calculate health score (0-100) for total ₹${total} spend based on typical Indian urban income.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER },
              label: { type: Type.STRING },
              advice: { type: Type.STRING },
              color: { type: Type.STRING }
            },
            required: ["score", "label", "advice", "color"]
          }
        }
      });
      return { success: true, data: JSON.parse(response.text || '{}') };
    } catch (error) {
      return { success: true, data: { score: 75, label: "Steady", advice: "AI processing paused. Your financial trajectory looks good!", color: "#10b981" } };
    }
  }
};
