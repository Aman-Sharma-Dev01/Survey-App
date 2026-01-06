import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

router.post('/chat', async (req, res) => {
  try {
    const { messages = [], model = 'openai/gpt-4o-mini', temperature = 0.4 } = req.body || {};

    const system = {
      role: 'system',
      content: `
You are CodeExaminer, an expert who authors coding test problems with deterministic test cases.
Always return TWO parts:
1) Brief Markdown guidance.
2) A fenced JSON code block that strictly matches this schema:

\n\n\n\n{
  "questions": [
    {
      "title": "Add Two Numbers",
      "prompt": "Given two integers, output their sum.",
      "starterCode": "const input = readInput();\nconst [a,b] = input.split(' ').map(Number);\n// your code",
      "points": 1,
      "timeLimitMs": 2000,
      "language": "javascript",
      "testCases": [
        { "input": "2 3", "expectedOutput": "5" },
        { "input": "10 15", "expectedOutput": "25" }
      ]
    }
  ]
}
\n\n\n\n
RULES:
- Valid JSON only; no comments; no trailing commas.
- Always JavaScript.
- Provide 3-6 testCases; keep inputs small; outputs exact.
- expectedOutput must match console.log outputs after trimming whitespace.
- Do not include hidden data; students will see test cases.
- Keep prompts concise and unambiguous; avoid external resources.
- Do not add text after the JSON code block.
`,
    };

    const payload = { model, messages: [system, ...messages], temperature };

    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_CODING_API_KEY || process.env.OPENROUTER_QUIZ_API_KEY || ''}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'Coding Test Builder',
      },
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      const text = await r.text();
      return res.status(r.status).json({ error: text });
    }

    const data = await r.json();
    const content = data?.choices?.[0]?.message?.content ?? '';
    res.json({ content, raw: data });
  } catch (err) {
    console.error('OpenRouter Coding AI error:', err);
    res.status(500).json({ error: 'AI request failed' });
  }
});

export default router;
