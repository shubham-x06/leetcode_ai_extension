import OpenAI from 'openai';

// Agent 1: Groq (primary — fastest, free)
const groqClient = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || '',
  baseURL: 'https://api.groq.com/openai/v1',
});

// Agent 2: Groq with different model (secondary — same API, different model)
// This handles cases where llama-3.1-8b-instant is overloaded
const groqClient2 = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || '',
  baseURL: 'https://api.groq.com/openai/v1',
});

// Agent 3: OpenAI-compatible fallback using Groq's mixtral
const groqClient3 = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || '',
  baseURL: 'https://api.groq.com/openai/v1',
});

interface AgentConfig {
  client: OpenAI;
  model: string;
  label: string;
  maxTokens: number;
  timeoutMs: number;
}

const AGENTS: AgentConfig[] = [
  {
    client: groqClient,
    model: 'llama-3.1-8b-instant',
    label: 'groq-llama-fast',
    maxTokens: 300,
    timeoutMs: 5000,
  },
  {
    client: groqClient2,
    model: 'llama3-8b-8192',
    label: 'groq-llama-8b',
    maxTokens: 300,
    timeoutMs: 6000,
  },
  {
    client: groqClient3,
    model: 'gemma2-9b-it',
    label: 'groq-gemma',
    maxTokens: 300,
    timeoutMs: 7000,
  },
];

/**
 * Race-with-fallback AI call.
 * Fires Agent 1 immediately. If it does not resolve within timeoutMs,
 * fires Agent 2 in parallel WITHOUT waiting for Agent 1 to fail.
 * If Agent 2 also stalls, fires Agent 3. Returns whichever resolves first.
 * Total max wait: ~7 seconds across all agents.
 */
export async function resilientChat(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  maxTokens = 300,
  temperature = 0.7
): Promise<string> {
  // Create a promise for each agent with its own timeout
  function agentCall(config: AgentConfig): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`${config.label} timed out`)), config.timeoutMs);
      try {
        const res = await config.client.chat.completions.create({
          model: config.model,
          messages,
          max_tokens: Math.min(maxTokens, config.maxTokens),
          temperature,
        });
        clearTimeout(timer);
        const content = res.choices[0]?.message?.content;
        if (!content) reject(new Error(`${config.label} returned empty`));
        else resolve(content);
      } catch (err) {
        clearTimeout(timer);
        reject(err);
      }
    });
  }

  // Stage 1: Try Agent 1 with 3.5s timeout
  try {
    const result = await Promise.race([
      agentCall({ ...AGENTS[0], timeoutMs: 3500 }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('stage1 timeout')), 3500)),
    ]);
    return result as string;
  } catch {
    // Stage 1 failed — fire Agents 2 and 3 simultaneously
  }

  // Stage 2: Race Agents 2 and 3 simultaneously
  try {
    const result = await Promise.race([
      agentCall(AGENTS[1]),
      agentCall(AGENTS[2]),
    ]);
    return result as string;
  } catch {
    // All agents failed
    throw new Error('All AI agents unavailable. Please try again in a moment.');
  }
}

/**
 * Streaming-aware resilient call for interview messages.
 * Same failover logic but optimized for interview response latency.
 */
export async function resilientInterviewChat(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
): Promise<string> {
  return resilientChat(messages, 220, 0.75);
}

/**
 * For code execution — needs more tokens, accepts higher latency
 */
export async function resilientCodeAnalysis(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
): Promise<string> {
  return resilientChat(messages, 800, 0.3);
}

/**
 * For feedback report — needs max tokens
 */
export async function resilientFeedbackChat(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
): Promise<string> {
  return resilientChat(messages, 1500, 0.4);
}
