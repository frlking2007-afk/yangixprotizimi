
import { GoogleGenAI } from "@google/genai";
import { Transaction } from "../types";

// Always use a named parameter for apiKey and use it directly from process.env
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getFinancialInsights = async (transactions: Transaction[]) => {
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
    // The .text property is a getter, not a method
    return response.text || "Tahlil tayyor emas.";
  } catch (error) {
    console.error("AI insight error:", error);
    return "Xatolik yuz berdi.";
  }
};