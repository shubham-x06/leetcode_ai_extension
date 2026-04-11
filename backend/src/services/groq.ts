import OpenAI from 'openai';
import { env } from '../config/env';

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || env.groqApiKey,
  baseURL: 'https://api.groq.com/openai/v1'
});

export async function chatCompletion(systemPrompt: string, userPrompt: string, maxTokens = 1000): Promise<string> {
  const completion = await openai.chat.completions.create({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    model: 'llama-3.1-8b-instant',
    max_tokens: maxTokens,
  });

  const content = completion.choices[0]?.message?.content;
  if (content == null) {
    throw new Error('Groq returned null content');
  }

  return content;
}
