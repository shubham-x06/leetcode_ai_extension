import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const app = express();
const port = 3001;

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1"
});

app.use(cors());
app.use(express.json());

app.post('/api/get-hint', async (req: Request, res: Response) => {
  try {
    const { problemDescription, userCode, language } = req.body;
    
    console.log("Hint request received!");
    console.log("Language:", language);
    
    const systemPrompt = `You are a LeetCode assistant. Provide ONE concise hint to help the user. It should be specific to the problem and code provided. The hint should guide the user towards the next step in solving the problem without giving away the full solution. DO NOT provide a full solution or code snippet. Maximum 30 words.`;
    const userPrompt = `Problem: ${problemDescription}\n\nMy code (in ${language}):\n${userCode}\n\nWhat's my next step?`;

    console.log("Calling AI API for hint...");
    const completion = await openai.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 100,
    });

    const hint = completion.choices[0].message.content;
    console.log("Success! Hint:", hint);
    res.json({ hint });

  } catch (error: any) {
    console.error("FULL ERROR:", error);
    res.status(500).json({ error: 'Failed to get hint from AI' });
  }
});

app.post('/api/get-solution', async (req: Request, res: Response) => {
  try {
    const { problemDescription, userCode, language } = req.body;
    
    console.log("Solution request received!");
    console.log("Language:", language);
    
    // Normalize language name (handle Python3 -> Python, etc.)
    let normalizedLanguage = language;
    if (language.toLowerCase().includes('python')) {
      normalizedLanguage = 'Python';
    } else if (language === 'C++') {
      normalizedLanguage = 'C++';
    } else if (language === 'C#') {
      normalizedLanguage = 'C#';
    }
    
    const systemPrompt = `You are a code generator. Return ONLY valid ${normalizedLanguage} code. No explanations. No examples. No text before or after the code.`;
    
    const userPrompt = `Write a complete solution for this LeetCode problem in ${normalizedLanguage}. Return ONLY the code, nothing else:

${problemDescription}

Rules:
1. Only output the code
2. No explanations or comments
3. No examples or test cases
4. Code must be correct and efficient
5. Start directly with the class/function definition`;

    console.log("Calling AI API for solution...");
    const completion = await openai.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 1000,
      temperature: 0.3,
    });

    let solution = completion.choices[0].message.content || '';
    
    // More aggressive cleaning
    // Remove markdown code blocks
    solution = solution.replace(/```[\w+#-]*\n?/g, '').replace(/```/g, '');
    
    // Remove common explanation patterns at the start
    const lines = solution.split('\n');
    let codeStartIndex = 0;
    
    // Find where actual code starts (look for class, def, function, etc.)
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
        trimmed.includes('Solution')
      ) {
        codeStartIndex = i;
        break;
      }
    }
    
    solution = lines.slice(codeStartIndex).join('\n').trim();
    
    console.log("Success! Solution generated in", normalizedLanguage);
    res.json({ solution });

  } catch (error: any) {
    console.error("FULL ERROR:", error);
    res.status(500).json({ error: 'Failed to get solution from AI' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});