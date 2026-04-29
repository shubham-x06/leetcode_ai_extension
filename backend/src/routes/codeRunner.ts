import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../lib/asyncHandler';
import { resilientCodeAnalysis } from '../services/aiAgents';
import axios from 'axios';

export const codeRunnerRouter = Router();

const WRAPPER_SYSTEM = `You are an expert programmer. Your task is to take a LeetCode-style solution snippet and write a COMPLETE, EXECUTABLE script in the requested language.
The script MUST include a 'main' function/entry point that:
1. Instantiates the solution class/function.
2. Runs the provided test cases.
3. Prints the results to STDOUT EXACTLY as a SINGLE valid JSON object and nothing else. No other print statements.

Required JSON shape to print to stdout:
{
  "results": [
    {
      "testCase": 1,
      "input": "<input string>",
      "expected": "<expected output>",
      "actual": "<actual output from code>",
      "passed": <boolean>,
      "executionTime": "<e.g. 1ms>",
      "error": <null or string if runtime error>
    }
  ],
  "allPassed": <boolean>,
  "summary": "<one sentence summary>",
  "timeComplexity": "O(?)",
  "spaceComplexity": "O(?)"
}

Output ONLY the raw executable code. No markdown formatting, no \`\`\` language tags, no explanations. Just the code.`;

const LANGUAGE_IDS: Record<string, number> = {
  'cpp': 54,
  'java': 62,
  'python': 71,
  'javascript': 63,
  'typescript': 74,
};

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

User's Code:
${code}

Test Cases to execute:
${testCases.map((tc, i) => `Test ${i + 1}:\n  Input: ${tc.input}\n  Expected: ${tc.expected}`).join('\n\n')}

Write the complete executable script that runs this and prints the JSON output.
`;

    try {
      // 1. Ask LLM to generate the executable wrapper
      const generatedScriptRaw = await resilientCodeAnalysis([
        { role: 'system', content: WRAPPER_SYSTEM },
        { role: 'user', content: userPrompt },
      ]);
      
      const executableCode = generatedScriptRaw.replace(/\`\`\`(cpp|java|python|javascript|typescript|js|ts)?\n?|\`\`\`/g, '').trim();

      // 2. Send to Judge0 if we have an API key/URL, or fallback
      const judge0Url = process.env.JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com';
      const judge0Key = process.env.JUDGE0_API_KEY;
      
      let parsedResult: unknown = null;

      if (judge0Key) {
        const langId = LANGUAGE_IDS[language.toLowerCase()] || 71; // default python
        
        const submission = await axios.post(`${judge0Url}/submissions?base64_encoded=false&wait=true`, {
          source_code: executableCode,
          language_id: langId,
        }, {
          headers: {
            'Content-Type': 'application/json',
            'X-RapidAPI-Host': judge0Url.replace('https://', ''),
            'X-RapidAPI-Key': judge0Key,
          }
        });

        const { stdout, stderr, compile_output, status } = submission.data;

        if (status.id > 3) { // Compilation Error, Runtime Error, TLE, etc.
          parsedResult = {
            results: testCases.map((tc, i) => ({
              testCase: i + 1,
              input: tc.input,
              expected: tc.expected,
              actual: 'Error',
              passed: false,
              executionTime: 'N/A',
              error: compile_output || stderr || status.description,
            })),
            allPassed: false,
            summary: `Execution failed: ${status.description}`,
            timeComplexity: 'N/A',
            spaceComplexity: 'N/A',
          };
        } else if (stdout) {
          try {
            parsedResult = JSON.parse(stdout.trim());
          } catch {
            // failed to parse stdout as JSON
            console.error("Failed to parse Judge0 stdout:", stdout);
          }
        }
      }

      // 3. Fallback: If Judge0 was skipped (no key) or failed to return valid JSON, ask LLM to simulate
      if (!parsedResult) {
        const SIMULATION_SYSTEM = `You are a code execution engine. Simulate running the provided code against the test cases. RESPOND WITH VALID JSON ONLY matching the required format. No markdown, no backticks.`;
        const rawSim = await resilientCodeAnalysis([
          { role: 'system', content: SIMULATION_SYSTEM },
          { role: 'user', content: userPrompt },
        ]);
        parsedResult = JSON.parse(rawSim.replace(/\`\`\`json\n?|\`\`\`/g, '').trim());
      }

      res.json(parsedResult);
    } catch (error) {
      console.error(error);
      res.json({
        results: testCases.map((tc, i) => ({
          testCase: i + 1,
          input: tc.input,
          expected: tc.expected,
          actual: 'Could not evaluate',
          passed: false,
          executionTime: 'N/A',
          error: 'Code analysis unavailable.',
        })),
        allPassed: false,
        summary: 'Server error during execution.',
        timeComplexity: 'O(?)',
        spaceComplexity: 'O(?)',
      });
    }
  })
);
