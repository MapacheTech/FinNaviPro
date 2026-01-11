import { GoogleGenAI, Type } from "@google/genai";
import { FinancialInsight } from "../types";

let client: GoogleGenAI | null = null;

export const initializeGemini = () => {
  if (!client && process.env.API_KEY) {
    client = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
};

export const getFinancialAdvice = async (
  history: { role: 'user' | 'model'; text: string }[],
  userContext: string
): Promise<string> => {
  if (!client) {
    initializeGemini();
    if (!client) {
      // Graceful fallback if no API key is present in demo environment
      return "I'm currently in offline demo mode. Please configure the API_KEY to receive real-time financial advice powered by Gemini.";
    }
  }

  try {
    // Format history for the API, excluding the last message which is the new prompt
    const previousHistory = history.slice(0, -1).map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    }));

    const chat = client.chats.create({
        model: 'gemini-3-flash-preview',
        history: previousHistory,
        config: {
            systemInstruction: `You are FinNavi, an empathetic, motivational financial ally. 
            You speak to Humans, not Econs. You understand behavioral economics (Thaler).
            Your goal is to reduce debt stress and build positive habits.
            Context: ${userContext}
            Keep responses concise (under 100 words), encouraging, and actionable.`,
        }
    });

    // Send the last message
    const lastMessage = history[history.length - 1];
    const response = await chat.sendMessage({ message: lastMessage.text });
    return response.text || "I couldn't generate a response right now.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm having trouble connecting to my financial brain right now. Please try again later.";
  }
};

export const generateDashboardInsights = async (
  userProfile: any,
  debts: any[]
): Promise<FinancialInsight[]> => {
  if (!client) {
    initializeGemini();
  }

  // Fallback / Demo data if API fails or no key
  const fallbackInsights: FinancialInsight[] = [
    {
      title: "High Interest Alert",
      description: "Your Sapphire Preferred card has a 24.99% APR. Paying an extra $50/mo could save you significantly on interest over time.",
      type: "warning",
      impact: "High Interest"
    },
    {
      title: "Refinance Opportunity",
      description: "With your credit score of 680, you might qualify for a consolidation loan at a lower rate than your credit cards.",
      type: "opportunity",
      impact: "Save ~$150/mo"
    }
  ];

  if (!client) return fallbackInsights;

  try {
    const prompt = `Analyze the following financial profile and debts. Provide 2 distinct, actionable financial insights to help the user save money or pay off debt faster.
    User Profile: ${JSON.stringify(userProfile)}
    Debts: ${JSON.stringify(debts)}`;

    const response = await client.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are an expert financial analyst. Provide output in JSON format.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              type: { type: Type.STRING, enum: ['saving', 'warning', 'opportunity'] },
              impact: { type: Type.STRING }
            },
            required: ['title', 'description', 'type', 'impact']
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return fallbackInsights;
  } catch (error) {
    console.error("Error generating insights:", error);
    return fallbackInsights;
  }
};

export const parseReceipt = async (base64Image: string): Promise<any> => {
  if (!client) {
    initializeGemini();
    if (!client) return null;
  }

  try {
      const response = await client.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: {
              parts: [
                  {
                      inlineData: {
                          mimeType: 'image/jpeg',
                          data: base64Image
                      }
                  },
                  {
                      text: "Analyze this image. It is a receipt, invoice, or income statement. Extract: type ('expense' or 'income'), amount (number), date (YYYY-MM-DD), merchant (string), category (one word string). Return JSON."
                  }
              ]
          },
          config: {
              responseMimeType: "application/json",
              // We use simple JSON mode without schema for broader flexibility with receipts
          }
      });

      if (response.text) {
          return JSON.parse(response.text);
      }
      return null;
  } catch (e) {
      console.error("Receipt Parsing Error:", e);
      return null;
  }
};
