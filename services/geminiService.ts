
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, Category, Necessity, SpendingPersona, BudgetRecommendation } from "../types";

export const categorizeTransaction = async (rawText: string, amount: number): Promise<Partial<Transaction>> => {
  // Initialize AI inside the function to ensure the latest API key is used
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Parse this bank transaction: "${rawText}" with amount ₹${amount}. Extract merchant name and categorize accurately for an Indian user context if relevant.`,
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

  return JSON.parse(response.text || '{}');
};

export const talkToYourMoney = async (query: string, transactions: Transaction[]): Promise<{ text: string; references: string[] }> => {
  // Initialize AI inside the function to ensure the latest API key is used
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const context = transactions
    .slice(-50)
    .map(t => `[${t.id}] ${t.date}: ${t.merchant} (₹${t.amount}) - ${t.category}`)
    .join('\n');

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Context: Recent Transactions (Amounts in Indian Rupees ₹):\n${context}\n\nUser Question: ${query}\n\nTask: Answer the question. If you mention specific spending, include the transaction IDs in brackets like [id]. Use ₹ symbol in your response.`,
    config: {
      systemInstruction: "You are PennyWise AI. Be witty but professional. Help the user find semantic matches (e.g., if they ask for 'chai', look for local cafes or tea stalls). Always summarize totals in ₹ if asked."
    }
  });

  const text = response.text || "I'm sorry, I couldn't process that.";
  const references = Array.from(text.matchAll(/\[(\d+)\]/g)).map(m => m[1]);

  return { text, references };
};

export const generateSpendingPersona = async (transactions: Transaction[]): Promise<SpendingPersona> => {
  // Initialize AI inside the function to ensure the latest API key is used
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const summary = transactions.reduce((acc: any, t) => {
    acc[t.necessity] = (acc[t.necessity] || 0) + t.amount;
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {});

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze this spending data summary (Amounts in ₹): ${JSON.stringify(summary)}. 
    Assign a creative financial persona (e.g., 'The Subscription Sultan', 'The Stealth Saver', 'The Impulse Icon').
    Provide a 2-sentence justification based on percentages and 3 actionable recommendations.`,
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
  });

  return JSON.parse(response.text || '{}');
};

export const getSmartBudgets = async (transactions: Transaction[]): Promise<BudgetRecommendation[]> => {
  // Initialize AI inside the function to ensure the latest API key is used
  // Switched to 'gemini-3-flash-preview' as 'pro' models are hitting quota limits in free tier environments
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const history = transactions.slice(-100);
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Based on this transaction history (Amounts in ₹): ${JSON.stringify(history)}, generate 4 smart budget recommendations. 
    Focus on categories where spending is high. Recommendations should be in Indian Rupees (₹).`,
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
  });

  return JSON.parse(response.text || '[]');
};

export const getFinancialHealth = async (transactions: Transaction[]): Promise<any> => {
    // Initialize AI inside the function to ensure the latest API key is used
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const total = transactions.reduce((s, t) => s + t.amount, 0);
    const needs = transactions.filter(t => t.necessity === 'Need').reduce((s, t) => s + t.amount, 0);
    const wants = transactions.filter(t => t.necessity === 'Want').reduce((s, t) => s + t.amount, 0);
    
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze these metrics (in ₹): Total Spend: ₹${total}, Needs: ₹${needs}, Wants: ₹${wants}.
        Calculate a health score (0-100) and provide a short label and one sentence of advice.`,
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
    return JSON.parse(response.text || '{}');
};
