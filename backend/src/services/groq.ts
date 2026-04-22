import OpenAI from 'openai';
import { resilientChat } from './aiAgents';

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || '',
  baseURL: 'https://api.groq.com/openai/v1',
});

// Legacy single-agent call (used by non-interview routes)
export async function chatCompletion(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 1000
): Promise<string> {
  // Use resilient multi-agent for all calls now
  return resilientChat([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ], maxTokens);
}
