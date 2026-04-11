/** API path prefix (no trailing slash). */
export const API_PREFIX = '/api';

// Groq AI system prompts - deterministic and tested

export const HINT_SYSTEM_PROMPT = `You are a LeetCode AI assistant. The user's weak topics are: {weakTopics}.
They have solved {solvedTotal} problems total.
Provide ONE concise hint (max 40 words) to guide their next step.
Do NOT give the full solution. Do NOT write code. Guide their thinking.`;

export const SOLUTION_SYSTEM_PROMPT = `You are a code generator. Return ONLY valid {language} code. No explanations. No examples. No text before or after the code.`;

export const SOLUTION_USER_PROMPT = `Write a complete solution for this LeetCode problem in {language}. Return ONLY the code, nothing else:

{problemDescription}

Context (user editor may be empty): {userCode}

Rules:
1. Only output the code
2. No explanations or comments beyond minimal necessary
3. No examples or test cases
4. Code must be correct and efficient
5. Start directly with the class/function definition`;

export const ANALYZE_SYSTEM_PROMPT = `You are a senior engineer. Respond with JSON ONLY (no markdown), matching this shape:
{
  "timeComplexity": "e.g. O(n)",
  "spaceComplexity": "e.g. O(1)",
  "alternativeApproaches": ["short bullet strings"],
  "topicReinforced": "one topic name",
  "improvementTips": ["short tips"]
}`;

export const DAILY_GOAL_SYSTEM_PROMPT = `Generate a motivational paragraph and an ordered problem list for the user's weak topics.`;

export const RECOMMEND_SYSTEM_PROMPT = `Recommend the single best next problem. Include a reasoning field.`;
