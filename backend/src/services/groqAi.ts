import OpenAI from 'openai';
import { env } from '../config/env';

const client = new OpenAI({
  apiKey: env.groqApiKey || 'missing',
  baseURL: 'https://api.groq.com/openai/v1',
});

const MODEL = 'llama-3.1-8b-instant';

export interface AiErrorShape {
  status: number;
  code: string;
  message: string;
}

export function mapGroqError(err: unknown): AiErrorShape {
  const any = err as { status?: number; code?: string; message?: string; error?: { message?: string } };
  const status =
    typeof any.status === 'number'
      ? any.status
      : err instanceof Error && 'status' in err && typeof (err as { status?: number }).status === 'number'
        ? (err as { status: number }).status
        : 500;
  const msg =
    any.error?.message ||
    any.message ||
    (typeof err === 'object' && err && 'message' in err && typeof (err as Error).message === 'string'
      ? (err as Error).message
      : 'AI request failed');

  if (status === 429 || msg.toLowerCase().includes('rate limit')) {
    return {
      status: 429,
      code: 'AI_RATE_LIMIT',
      message: 'AI is busy, try again in a few seconds',
    };
  }
  return { status: 500, code: 'AI_ERROR', message: msg };
}

export async function chatTextStream(system: string, user: string, maxTokens: number): Promise<string> {
  if (!env.groqApiKey) {
    throw Object.assign(new Error('GROQ_API_KEY is not configured'), { status: 503 });
  }
  const stream = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    max_tokens: maxTokens,
    temperature: 0.4,
    stream: true,
  });

  let full = '';
  for await (const chunk of stream) {
    const piece = chunk.choices[0]?.delta?.content;
    if (piece) full += piece;
  }
  return full.trim();
}

export async function chatText(system: string, user: string, maxTokens: number): Promise<string> {
  return chatTextStream(system, user, maxTokens);
}

export function normalizeSolutionCode(solution: string, language: string): string {
  let s = solution.replace(/```[\w+#-]*\n?/g, '').replace(/```/g, '');
  const lines = s.split('\n');
  let codeStartIndex = 0;
  const lang = language.toLowerCase();
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (
      trimmed.startsWith('class ') ||
      trimmed.startsWith('def ') ||
      trimmed.startsWith('function ') ||
      trimmed.startsWith('var ') ||
      trimmed.startsWith('public ') ||
      trimmed.startsWith('private ') ||
      trimmed.startsWith('struct ') ||
      trimmed.startsWith('impl ') ||
      trimmed.includes('Solution') ||
      (lang.includes('javascript') && trimmed.startsWith('const ')) ||
      (lang.includes('typescript') && trimmed.startsWith('function '))
    ) {
      codeStartIndex = i;
      break;
    }
  }
  return lines.slice(codeStartIndex).join('\n').trim();
}
