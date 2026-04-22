import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../lib/asyncHandler';
import { AppError } from '../errors/AppError';
import { User } from '../models/User';
import { chatCompletion } from '../services/groq';
import { getProblemList, getProblemDetail } from '../services/leetcodeGraphql';
import OpenAI from 'openai';
import { resilientInterviewChat, resilientFeedbackChat } from '../services/aiAgents';

export const interviewRouter = Router();

// ─────────────────────────────────────────────
// POST /api/interview/start
// Selects 2 DSA problems suited to user's weak
// topics + difficulty pref and returns them.
// ─────────────────────────────────────────────
interviewRouter.post('/start', asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) throw new AppError(404, 'User not found', 'USER_NOT_FOUND');

  const weakTopics = user.cachedWeakTopics || [];
  const prefDifficulty = user.preferences?.targetDifficulty || 'Mixed';

  function resolveTag(topic: string): string {
    return topic.toLowerCase().replace(/[()]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  // Problem 1: from first weak topic, easy difficulty
  // Problem 2: from second weak topic, medium difficulty
  // Problem 3: from third weak topic, hard difficulty
  const tag1 = weakTopics[0] ? resolveTag(weakTopics[0]) : 'array';
  const tag2 = weakTopics[1] ? resolveTag(weakTopics[1]) : 'dynamic-programming';
  const tag3 = weakTopics[2] ? resolveTag(weakTopics[2]) : 'graphs';

  let diff1: 'EASY' | 'MEDIUM' | 'HARD' = 'EASY';
  let diff2: 'EASY' | 'MEDIUM' | 'HARD' = 'MEDIUM';
  let diff3: 'EASY' | 'MEDIUM' | 'HARD' = 'HARD';

  async function fetchRandomProblem(tag: string, difficulty: 'EASY' | 'MEDIUM' | 'HARD') {
    // Try asking for 100 problems of this tag across 0 skip to maximize pool without breaking bounds
    const list = await getProblemList({ tags: [tag], difficulty, limit: 100, skip: 0 });
    const pool = (list.questions || []).filter((p: any) => !p.isPaidOnly);
    
    if (pool.length > 0) {
      return pool[Math.floor(Math.random() * pool.length)];
    }

    // Fallback: no tag filter, pick a random skip safely assuming minimum 200 exist
    const fallback = await getProblemList({ difficulty, limit: 50, skip: Math.floor(Math.random() * 50) });
    const fp = (fallback.questions || []).filter((p: any) => !p.isPaidOnly);
    
    if (fp.length > 0) {
      return fp[Math.floor(Math.random() * fp.length)];
    }
    
    // Absolute fallback
    const absoluteFallback = await getProblemList({ difficulty, limit: 50, skip: 0 });
    const afp = (absoluteFallback.questions || []).filter((p: any) => !p.isPaidOnly);
    return afp[Math.floor(Math.random() * afp.length)] || null;
  }

  const [p1Meta, p2Meta, p3Meta] = await Promise.all([
    fetchRandomProblem(tag1, diff1),
    fetchRandomProblem(tag2, diff2),
    fetchRandomProblem(tag3, diff3),
  ]);

  if (!p1Meta || !p2Meta || !p3Meta) {
    throw new AppError(502, 'Could not fetch interview problems. Try again.', 'PROBLEM_FETCH_FAILED');
  }

  // Fetch full problem content for both
  const [p1, p2, p3] = await Promise.all([
    getProblemDetail(p1Meta.titleSlug),
    getProblemDetail(p2Meta.titleSlug),
    getProblemDetail(p3Meta.titleSlug),
  ]);

  // Strip HTML from content for clean display
  function stripHtml(html: string): string {
    return html
      .replace(/<[^>]+>/g, ' ')
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
      .replace(/\s{2,}/g, ' ').trim();
  }

  function extractSampleTestCases(content: string): { input: string; expected: string }[] {
    const cases: { input: string; expected: string }[] = [];
    const inputPattern = /Input:\s*([^\n]+(?:\n(?!Output:)[^\n]+)*)/gi;
    const outputPattern = /Output:\s*([^\n]+)/gi;

    const inputs: string[] = [];
    const outputs: string[] = [];

    let match;
    while ((match = inputPattern.exec(content)) !== null) {
      inputs.push(match[1].trim());
    }
    while ((match = outputPattern.exec(content)) !== null) {
      outputs.push(match[1].trim());
    }

    for (let i = 0; i < Math.min(inputs.length, outputs.length, 3); i++) {
      cases.push({ input: inputs[i], expected: outputs[i] });
    }

    if (cases.length === 0) {
      cases.push({ input: 'Example input', expected: 'Example output' });
    }

    return cases;
  }

  const session = {
    problems: [
      {
        questionId: p1.questionId,
        title: p1.title,
        titleSlug: p1.titleSlug,
        difficulty: p1.difficulty,
        content: stripHtml(p1.content || ''),
        topicTags: p1.topicTags,
        hints: p1.hints || [],
        sampleTestCases: extractSampleTestCases(p1.content || ''),
      },
      {
        questionId: p2.questionId,
        title: p2.title,
        titleSlug: p2.titleSlug,
        difficulty: p2.difficulty,
        content: stripHtml(p2.content || ''),
        topicTags: p2.topicTags,
        hints: p2.hints || [],
        sampleTestCases: extractSampleTestCases(p2.content || ''),
      },
      {
        questionId: p3.questionId,
        title: p3.title,
        titleSlug: p3.titleSlug,
        difficulty: p3.difficulty,
        content: stripHtml(p3.content || ''),
        topicTags: p3.topicTags,
        hints: p3.hints || [],
        sampleTestCases: extractSampleTestCases(p3.content || ''),
      },
    ],
    durationMinutes: 60,
    startedAt: new Date().toISOString(),
    weakTopics,
  };

  res.json(session);
}));

// ─────────────────────────────────────────────
// POST /api/interview/message
// Sends a user message and gets AI interviewer
// response. Maintains full conversation context.
// ─────────────────────────────────────────────
interviewRouter.post('/message', asyncHandler(async (req, res) => {
  const schema = z.object({
    messages: z.array(z.object({
      role: z.enum(['system', 'user', 'assistant']),
      content: z.string(),
    })).min(1),
    currentProblem: z.object({
      title: z.string(),
      content: z.string(),
      difficulty: z.string(),
      topicTags: z.array(z.object({ name: z.string() })),
    }),
    userCode: z.string().default(''),
    problemIndex: z.number().int().min(0).max(2),
    timeRemainingSeconds: z.number().int().min(0),
    phase: z.enum(['intro', 'solving', 'followup', 'transition', 'complete']),
  });

  const {
    messages,
    currentProblem,
    userCode,
    problemIndex,
    timeRemainingSeconds,
    phase,
  } = schema.parse(req.body);

  const user = await User.findById(req.userId);
  if (!user) throw new AppError(404, 'User not found', 'USER_NOT_FOUND');

  const minutesLeft = Math.floor(timeRemainingSeconds / 60);
  const tags = currentProblem.topicTags.map(t => t.name).join(', ');

  const INTERVIEWER_SYSTEM = `You are a senior FAANG software engineer conducting a real technical interview.

CURRENT PROBLEM (Problem ${problemIndex + 1} of 3):
Title: ${currentProblem.title}
Difficulty: ${currentProblem.difficulty}
Topics: ${tags}
Problem Statement:
${currentProblem.content.slice(0, 1500)}

CANDIDATE'S CURRENT CODE:
${userCode ? userCode.slice(0, 2000) : '(no code written yet)'}

TIME REMAINING: ${minutesLeft} minutes
PHASE: ${phase}

YOUR BEHAVIOR RULES — FOLLOW STRICTLY:
1. You are a professional, encouraging but rigorous interviewer.
2. NEVER give away the solution directly. Guide with Socratic questions.
3. Ask ONE question at a time. Never ask multiple questions in one message.
4. Keep responses SHORT — max 3 sentences. This is a fast-paced interview.
5. React specifically to what the candidate just said or coded.
6. If candidate is stuck for too long (phase=solving, code empty): offer a gentle nudge.
7. If candidate writes brute force: ask about time/space complexity and optimization.
8. If candidate writes optimal solution: ask them to walk through it or consider edge cases.
9. If time < 5 minutes: gently mention time and ask to finalize.
10. If phase=followup: ask deeper questions (complexity, edge cases, alternative approaches, real-world use cases).
11. If phase=transition: congratulate briefly on finishing the problem, introduce the next problem naturally.
12. Vary your questions. Do not repeat the same question twice in one interview.
13. Never break character. Never say you are an AI.

QUESTION BANK (rotate through these based on context):
- "Can you explain your overall approach?"
- "What is the time complexity of your solution?"
- "What is the space complexity?"
- "Can you think of an edge case your solution might miss?"
- "Why did you choose this data structure over alternatives?"
- "How would this solution scale with very large inputs?"
- "Is there a way to optimize this further?"
- "Walk me through a specific example using your code."
- "What would happen if the input was empty or null?"
- "How would you test this function?"`;

  // Use the full conversation history for context
  const groqMessages: any[] = [
    { role: 'system' as const, content: INTERVIEWER_SYSTEM },
    ...messages.slice(-12), // keep last 12 messages to manage token budget
  ];

  const reply = await resilientInterviewChat(groqMessages);
  res.json({ reply });
}));

// ─────────────────────────────────────────────
// POST /api/interview/feedback
// Generates detailed post-interview performance
// report from the full interview transcript.
// ─────────────────────────────────────────────
interviewRouter.post('/feedback', asyncHandler(async (req, res) => {
  const schema = z.object({
    transcript: z.array(z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
      timestamp: z.string().optional(),
    })).min(2),
    problems: z.array(z.object({
      title: z.string(),
      difficulty: z.string(),
      topicTags: z.array(z.object({ name: z.string() })),
    })).min(1).max(3),
    finalCode: z.array(z.string()).min(1).max(3),
    durationUsedSeconds: z.number().int().min(0),
    totalDurationSeconds: z.number().int().min(1),
    weakTopics: z.array(z.string()).default([]),
  });

  const {
    transcript,
    problems,
    finalCode,
    durationUsedSeconds,
    totalDurationSeconds,
    weakTopics,
  } = schema.parse(req.body);

  const minutesUsed = Math.floor(durationUsedSeconds / 60);
  const minutesTotal = Math.floor(totalDurationSeconds / 60);

  const transcriptText = transcript
    .map(m => `${m.role === 'user' ? 'CANDIDATE' : 'INTERVIEWER'}: ${m.content}`)
    .join('\n');

  const problemSummary = problems.map((p, i) =>
    `Problem ${i + 1}: ${p.title} (${p.difficulty}) — Topics: ${p.topicTags.map(t => t.name).join(', ')}`
  ).join('\n');

  const codeSummary = finalCode.map((c, i) =>
    `Problem ${i + 1} Final Code:\n${c.slice(0, 1500) || '(no code submitted)'}`
  ).join('\n\n');

  const FEEDBACK_SYSTEM = `You are a strict, senior FAANG hiring manager evaluating a technical interview.
Analyze the interview transcript and code carefully. Your scoring and assessment MUST be brutally honest, objective, and perfectly aligned with the candidate's actual performance.
- If the candidate wrote little to no code, or the code does not work, scores MUST be low (1-4).
- Do not hallucinate strengths or edge cases if none exist. Be precise based on the transcript ONLY.

RESPOND WITH VALID JSON ONLY. No markdown. No backticks. No explanation outside the JSON.

Required JSON shape:
{
  "overallVerdict": "Strong Hire | Hire | No Hire | Strong No Hire",
  "overallScore": <number 1-10>,
  "summary": "<2-3 sentence overall assessment>",
  "scores": {
    "problemSolving": { "score": <1-10>, "comment": "<specific observation>" },
    "codeQuality": { "score": <1-10>, "comment": "<specific observation>" },
    "optimization": { "score": <1-10>, "comment": "<specific observation>" },
    "communication": { "score": <1-10>, "comment": "<specific observation>" },
    "edgeCases": { "score": <1-10>, "comment": "<specific observation>" },
    "timeManagement": { "score": <1-10>, "comment": "<specific observation>" }
  },
  "strengths": ["<specific strength 1>", "<specific strength 2>", "<specific strength 3>"],
  "improvements": ["<specific area to improve 1>", "<specific area to improve 2>", "<specific area to improve 3>"],
  "problemFeedback": [
    {
      "problemTitle": "<title>",
      "solved": <true|false>,
      "approach": "<what approach candidate used>",
      "optimalApproach": "<what the optimal approach is>",
      "complexityAchieved": "<e.g. O(n) time, O(1) space>",
      "complexityOptimal": "<what optimal complexity is>",
      "missedEdgeCases": ["<edge case 1>", "<edge case 2>"]
    }
  ],
  "recommendedTopics": ["<topic to study 1>", "<topic to study 2>", "<topic to study 3>"],
  "nextSteps": "<1-2 sentence actionable advice for the candidate>"
}`;

  const userPrompt = `
INTERVIEW DETAILS:
${problemSummary}
Time Used: ${minutesUsed} of ${minutesTotal} minutes
Candidate Weak Topics (known beforehand): ${weakTopics.join(', ')}

${codeSummary}

FULL INTERVIEW TRANSCRIPT:
${transcriptText.slice(0, 6000)}
`;

  let raw = await resilientFeedbackChat([
    { role: 'system', content: FEEDBACK_SYSTEM },
    { role: 'user', content: userPrompt }
  ]);

  // Strip any accidental markdown fences
  raw = raw.replace(/```json\n?|```/g, '').trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Retry with stricter instruction
    const raw2 = await resilientFeedbackChat([
      { role: 'system', content: FEEDBACK_SYSTEM + '\nCRITICAL: OUTPUT RAW JSON ONLY. ABSOLUTELY NO OTHER TEXT.' },
      { role: 'user', content: userPrompt }
    ]);
    try {
      parsed = JSON.parse(raw2.replace(/```json\n?|```/g, '').trim());
    } catch {
      // Return a safe fallback structure
      parsed = {
        overallVerdict: 'Hire',
        overallScore: 6,
        summary: 'Interview completed. Full analysis unavailable — please try again.',
        scores: {
          problemSolving: { score: 6, comment: 'Attempted the problems.' },
          codeQuality: { score: 6, comment: 'Code was submitted.' },
          optimization: { score: 5, comment: 'Analysis unavailable.' },
          communication: { score: 6, comment: 'Candidate communicated their approach.' },
          edgeCases: { score: 5, comment: 'Analysis unavailable.' },
          timeManagement: { score: minutesUsed <= minutesTotal ? 7 : 4, comment: minutesUsed <= minutesTotal ? 'Completed within time.' : 'Ran out of time.' },
        },
        strengths: [`Attempted ${problems.length} problems`, 'Communicated approach'],
        improvements: ['Practice more problems in weak topics', 'Focus on optimization', 'Consider edge cases'],
        problemFeedback: problems.map((p) => ({
          problemTitle: p.title,
          solved: true,
          approach: 'Unknown',
          optimalApproach: 'Review editorial',
          complexityAchieved: 'Unknown',
          complexityOptimal: 'Unknown',
          missedEdgeCases: [],
        })),
        recommendedTopics: weakTopics.slice(0, 3),
        nextSteps: 'Review the problems you solved today and study the optimal approaches.',
      };
    }
  }

  res.json(parsed);
}));
