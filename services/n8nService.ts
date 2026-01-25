import { Capacitor } from '@capacitor/core';
import { FinancialInsight } from '../types';

// Get n8n webhook URL from environment variables
const getBaseUrl = () => {
  const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn(
      'VITE_N8N_WEBHOOK_URL not set in .env.local. ' +
      'n8n features will not work properly.'
    );
    return 'http://localhost:5678/webhook'; // fallback to local development
  }

  return webhookUrl;
};

const BASE_URL = getBaseUrl();

export interface N8nChatResponse {
  reply: string;
  action?: string;
}

export const n8nService = {
  /**
   * Send a message to the n8n "Financial Brain"
   * @param message - User's message
   * @param userId - Current user's ID (for personalized debt data)
   */
  async chat(message: string, userId?: string): Promise<string> {
    try {
      console.log(`Sending to n8n: ${BASE_URL}/chat`);
      const response = await fetch(`${BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true', // Bypass ngrok warning page
        },
        body: JSON.stringify({
          message,
          userId: userId || null,
          timestamp: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error(`n8n error: ${response.statusText}`);
      }

      // Try to get response as text first (handles both plain text and JSON)
      const responseText = await response.text();
      
      // Try to parse as JSON
      try {
        const data = JSON.parse(responseText);
        // Handle various possible field names from n8n
        return data.output || data.text || data.content || data.reply || data.response || JSON.stringify(data);
      } catch {
        // If not JSON, return as plain text
        return responseText;
      }
    } catch (error) {
      console.error('n8n Chat Error:', error);
      return "I'm having trouble reaching my financial brain (n8n). Ensure the n8n server is running.";
    }
  },

  /**
   * Sync user data on startup
   */
  async syncData(): Promise<any> {
    try {
      const response = await fetch(`${BASE_URL}/sync`);
      if (!response.ok) throw new Error('Sync failed');
      return await response.json();
    } catch (error) {
      console.error('n8n Sync Error:', error);
      return null;
    }
  }
};
