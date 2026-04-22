import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../lib/asyncHandler';
import { AppError } from '../errors/AppError';
import { resilientCodeAnalysis } from '../services/aiAgents';

export const codeRunnerRouter = Router();

const RUNNER_SYSTEM = `You are a code execution engine. Your ONLY job is to simulate running
the provided code against the given test cases and return JSON results.

RESPOND WITH VALID JSON ONLY. No markdown. No explanation. No backticks.

Required shape:
{
  "results": [
    {
      "testCase": 1,
      "input": "<input string>",
      "expected": "<expected output>",
      "actual": "<what the code would output>",
      "passed": true,
      "executionTime": "<e.g. 12ms>",
      "error": null
    }
  ],
  "allPassed": true,
  "summary": "<one sentence summary>",
  "timeComplexity": "O(?)",
  "spaceComplexity": "O(?)"
}

If code has a syntax error, set "error" to the error message and "passed" to false.
If code would cause infinite loop, set error to "Time Limit Exceeded".
Be accurate — actually trace through the logic. Do not make up results.`;

codeRunnerRouter.post(
  '/run',
  asyncHandler(async (req, res) => {
    const schema = z.object({
      code: z.string().min(1).max(10000),
      language: z.string().min(1),
      problem: z.object({
        title: z.string(),
        content: z.string(),
        topicTags: z.array(z.object({ name: z.string() })),
      }),
      testCases: z.array(z.object({
        input: z.string(),
        expected: z.string(),
      })).min(1).max(5),
    });

    const { code, language, problem, testCases } = schema.parse(req.body);

    const userPrompt = `
Language: ${language}
Problem: ${problem.title}

Code to execute:
\`\`\`${language}
${code.slice(0, 3000)}
\`\`\`

Test Cases to run:
${testCases.map((tc, i) => `Test ${i + 1}:\n  Input: ${tc.input}\n  Expected: ${tc.expected}`).join('\n\n')}

Trace through the code for each test case and determine actual output.
`;

    const raw = await resilientCodeAnalysis([
      { role: 'system', content: RUNNER_SYSTEM },
      { role: 'user', content: userPrompt },
    ]);

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw.replace(/\`\`\`json\n?|\`\`\`/g, '').trim());
    } catch {
      // Return a graceful fallback
      parsed = {
        results: testCases.map((tc, i) => ({
          testCase: i + 1,
          input: tc.input,
          expected: tc.expected,
          actual: 'Could not evaluate',
          passed: false,
          executionTime: 'N/A',
          error: 'Code analysis unavailable. Check syntax manually.',
        })),
        allPassed: false,
        summary: 'Could not evaluate code. Please check for syntax errors.',
        timeComplexity: 'O(?)',
        spaceComplexity: 'O(?)',
      };
    }

    res.json(parsed);
  })
);
