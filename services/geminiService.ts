
import { GoogleGenAI, Type } from "@google/genai";
import { Expense } from "../types";

// Helper to get AI instance safely
const getAI = () => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY is missing in environment variables.");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const parseExpenseFromText = async (text: string): Promise<Partial<Expense>> => {
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

  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    console.error("JSON parsing error:", e);
    return {};
  }
};

export const getBudgetInsights = async (expenses: Expense[]): Promise<string> => {
  if (expenses.length === 0) return "Hozircha ma'lumotlar yo'q. Harajatlaringizni kiriting va men tahlil qilaman.";

  const ai = getAI();
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const byCategory = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  const prompt = `Men harajatlarimni nazorat qilyapman. Mana mening bu oydagi harajatlarim:
  Umumiy: ${total} so'm.
  Kategoriyalar bo'yicha: ${JSON.stringify(byCategory)}.
  Menga qisqa (3-4 ta gap), tushunarli va foydali moliya maslahati ber. Qayerda tejashim mumkinligini ayt. O'zbek tilida javob ber. Markdown ishlatma, faqat oddiy matn.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      temperature: 0.7,
    }
  });

  return response.text || "Tahlil qilishda xatolik yuz berdi.";
};

export const analyzeReceipt = async (base64Image: string): Promise<Partial<Expense>> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Image
        }
      },
      {
        text: "Ushbu chekdan umumiy summa va harajat turini aniqla. O'zbek tilida JSON formatida qaytar."
      }
    ],
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

  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    return {};
  }
};
