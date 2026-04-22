import { apiClient } from './axios';

export interface InterviewProblem {
  questionId: string;
  title: string;
  titleSlug: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  content: string;
  topicTags: { name: string; slug?: string }[];
  hints: string[];
  sampleTestCases: { input: string; expected: string }[];
}

export interface TestCaseResult {
  testCase: number;
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
  executionTime: string;
  error: string | null;
}

export interface RunResult {
  results: TestCaseResult[];
  allPassed: boolean;
  summary: string;
  timeComplexity: string;
  spaceComplexity: string;
}

export interface InterviewSession {
  problems: InterviewProblem[];
  durationMinutes: number;
  startedAt: string;
  weakTopics: string[];
}

export type InterviewPhase = 'intro' | 'solving' | 'followup' | 'transition' | 'complete';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface FeedbackReport {
  overallVerdict: string;
  overallScore: number;
  summary: string;
  scores: {
    problemSolving: { score: number; comment: string };
    codeQuality: { score: number; comment: string };
    optimization: { score: number; comment: string };
    communication: { score: number; comment: string };
    edgeCases: { score: number; comment: string };
    timeManagement: { score: number; comment: string };
  };
  strengths: string[];
  improvements: string[];
  problemFeedback: {
    problemTitle: string;
    solved: boolean;
    approach: string;
    optimalApproach: string;
    complexityAchieved: string;
    complexityOptimal: string;
    missedEdgeCases: string[];
  }[];
  recommendedTopics: string[];
  nextSteps: string;
}

export async function startInterview(): Promise<InterviewSession> {
  const { data } = await apiClient.post('/interview/start');
  return data;
}

export async function sendMessage(payload: {
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
  currentProblem: InterviewProblem;
  userCode: string;
  problemIndex: number;
  timeRemainingSeconds: number;
  phase: InterviewPhase;
}): Promise<{ reply: string }> {
  const { data } = await apiClient.post('/interview/message', payload);
  return data;
}

export async function generateFeedback(payload: {
  transcript: { role: 'user' | 'assistant'; content: string; timestamp?: string }[];
  problems: InterviewProblem[];
  finalCode: string[];
  durationUsedSeconds: number;
  totalDurationSeconds: number;
  weakTopics: string[];
}): Promise<FeedbackReport> {
  const { data } = await apiClient.post('/interview/feedback', payload);
  return data;
}

export async function runCode(payload: {
  code: string;
  language: string;
  problem: {
    title: string;
    content: string;
    topicTags: { name: string }[];
  };
  testCases: { input: string; expected: string }[];
}): Promise<RunResult> {
  const { data } = await apiClient.post('/code/run', payload);
  return data;
}
