
import { GoogleGenAI, Type } from "@google/genai";
import { Expense } from "../types";

// Helper to get a fresh instance of the Gemini client using the environment's API key.
// Follows guideline: Create a new GoogleGenAI instance right before making an API call.
const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY topilmadi. Iltimos, environment variable'ni tekshiring.");
  }
  return new GoogleGenAI({ apiKey });
};

// Parses expense information from a natural language text string.
export const parseExpenseFromText = async (text: string): Promise<Partial<Expense>> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Quyidagi matndan harajat ma'lumotlarini ajratib ol: "${text}". Valyuta har doim so'm (UZS) deb hisoblansin.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER, description: "Harajat miqdori" },
            category: { 
              type: Type.STRING, 
              enum: ['Oziq-ovqat', 'Transport', 'Ko\'ngilochar', 'Sog\'liq', 'Ta\'lim', 'Uy-joy', 'Boshqa'],
              description: "Harajat kategoriyasi"
            },
            description: { type: Type.STRING, description: "Qisqa izoh" }
          },
          required: ["amount", "category", "description"]
        }
      }
    });

    // Access .text property directly as per guidelines.
    return JSON.parse(response.text || '{}');
  } catch (e) {
    console.error("AI Parsing error:", e);
    throw e;
  }
};

// Provides personalized budget insights and financial advice based on a list of expenses.
export const getBudgetInsights = async (expenses: Expense[]): Promise<string> => {
  if (expenses.length === 0) return "Hozircha ma'lumotlar yo'q.";

  try {
    const ai = getAI();
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    const byCategory = expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {} as Record<string, number>);

    const prompt = `Men harajatlarimni nazorat qilyapman. Mana mening bu oydagi harajatlarim:
    Umumiy: ${total} so'm.
    Kategoriyalar bo'yicha: ${JSON.stringify(byCategory)}.
    Menga qisqa (3-4 ta gap), tushunarli va foydali moliya maslahati ber. O'zbek tilida javob ber.`;

    const response = await ai.models.generateContent({
      // Upgraded to gemini-3-pro-preview for complex reasoning/analysis as per guidelines.
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { temperature: 0.7 }
    });

    return response.text || "Tahlil olishda xatolik.";
  } catch (e) {
    return "Xizmat vaqtinchalik ishlamayapti.";
  }
};

// Analyzes a receipt image to extract transaction details.
export const analyzeReceipt = async (base64Image: string): Promise<Partial<Expense>> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      // Correct multi-part content structure as per guidelines.
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64Image } },
          { text: "Ushbu chekdan summa va harajat turini aniqla. JSON qaytar." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER },
            category: { type: Type.STRING, enum: ['Oziq-ovqat', 'Transport', 'Ko\'ngilochar', 'Sog\'liq', 'Ta\'lim', 'Uy-joy', 'Boshqa'] },
            description: { type: Type.STRING }
          }
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (e) {
    console.error("Receipt analysis error:", e);
    return {};
  }
};
