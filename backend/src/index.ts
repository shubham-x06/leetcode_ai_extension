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
    const { problemDescription, userCode } = req.body;
    
    console.log("Hint request received!");
    
    const systemPrompt = `You are a LeetCode assistant. Provide ONE concise hint to help the user. It should be specific to the problem and code provided. The hint should guide the user towards the next step in solving the problem without giving away the full solution. DO NOT provide a full solution or code snippet. Maximum 30 words.`;
    const userPrompt = `Problem: ${problemDescription}\n\nMy code:\n${userCode}\n\nWhat's my next step?`;

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
    const { problemDescription, userCode } = req.body;
    
    console.log("Solution request received!");
    
    const systemPrompt = `You are a LeetCode solution provider DIRECT CODE NO EXTRA THINGS. Just provide the complete solution IN C++ code to the problem described. Do not include any explanations, hints, or additional text. Only provide the code solution. JUST THE CODE NO COMMENTS NO ALGORITHM. NO TIME  `;
    
    const userPrompt = `Problem: ${problemDescription}`;

    console.log("Calling AI API for solution...");
    const completion = await openai.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 800,
      temperature: 0.7,
    });

    const solution = completion.choices[0].message.content;
    console.log("Success! Solution generated");
    res.json({ solution });

  } catch (error: any) {
    console.error("FULL ERROR:", error);
    res.status(500).json({ error: 'Failed to get solution from AI' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});