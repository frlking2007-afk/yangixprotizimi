
import { GoogleGenAI } from "@google/genai";
import { Transaction } from "../types";

// Always initialize the client using process.env.API_KEY directly as a named parameter.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getFinancialInsights = async (transactions: Transaction[]) => {
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
    // Generate content using the recommended model for basic text tasks.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    // Use the .text property directly (not as a function).
    return response.text;
  } catch (error) {
    console.error("AI insight error:", error);
    return "Xatolik yuz berdi. Keyinroq urinib ko'ring.";
  }
};
