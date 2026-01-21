
import { GoogleGenAI } from "@google/genai";
import { Transaction } from "../types";

// Xavfsiz API key olish: Brauzerda process.env bo'lmasa xatolik bermaydi
const getApiKey = () => {
  try {
    return (typeof process !== 'undefined' && process.env?.API_KEY) ? process.env.API_KEY : "";
  } catch {
    return "";
  }
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

export const getFinancialInsights = async (transactions: Transaction[]) => {
  const apiKey = getApiKey();
  if (!apiKey) return "AI xizmati hozircha mavjud emas (API_KEY sozlanmagan).";

  const summary = transactions.reduce((acc, curr) => {
    if (curr.type === 'kirim') acc.totalIn += curr.amount;
    else acc.totalOut += curr.amount;
    return acc;
  }, { totalIn: 0, totalOut: 0 });

  const prompt = `
    Men kassa hisoboti tizimidan foydalanayapman. 
    Mening joriy holatim:
    Jami kirim: ${summary.totalIn} so'm
    Jami chiqim: ${summary.totalOut} so'm
    Farq: ${summary.totalIn - summary.totalOut} so'm
    Tranzaksiyalar soni: ${transactions.length}
    
    Iltimos, menga qisqa va foydali moliyaviy maslahat ber. 
    Chiqimlar ko'p bo'lsa ogohlantir, kirim yaxshi bo'lsa tabrikla. 
    Javob o'zbek tilida bo'lsin va maksimal 2-3 jumlada bo'lsin.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("AI insight error:", error);
    return "Xatolik yuz berdi. Keyinroq urinib ko'ring.";
  }
};
