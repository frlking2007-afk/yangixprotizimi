
import { GoogleGenAI } from "@google/genai";
import { Transaction } from "../types";

// Xavfsiz tashabbuskor (initialization)
const getAIClient = () => {
  const apiKey = typeof process !== 'undefined' ? process.env.API_KEY : '';
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const getFinancialInsights = async (transactions: Transaction[]) => {
  const ai = getAIClient();
  if (!ai) return "AI tahlili uchun kalit topilmadi.";

  const summary = transactions.reduce((acc, curr) => {
    if (curr.type === 'kirim') acc.totalIn += (curr.amount || 0);
    else acc.totalOut += (curr.amount || 0);
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
    Javob o'zbek tilida bo'lsin va maksimal 2 jumlada bo'lsin.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Tahlil tayyor emas.";
  } catch (error) {
    console.error("AI insight error:", error);
    return "Xatolik yuz berdi.";
  }
};
