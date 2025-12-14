import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

/**
 * POST /api/quiz-ai/chat
 * body: { messages: [{role, content}], context?: {...}, model?: string, temperature?: number }
 */
router.post('/chat', async (req, res) => {
  try {
    const {
      messages = [],
      context = {},
      model = 'openai/gpt-4o-mini', // fast/cheap default; change if you want
      temperature = 0.7,
    } = req.body || {};

    // Build a system prompt that injects quiz builder context
    const system = {
      role: 'system',
      content: `
You are QuizGenius, an expert quiz design copilot.

ALWAYS produce two parts in your response:
1) A human-friendly Markdown section (headings, lists).
2) A final fenced JSON code block with EXACTLY this schema and nothing else:

\`\`\`json
{
  "questions": [
    {
      "questionText": "Question text here",
      "questionType": "SINGLE" | "MULTIPLE" | "TRUE_FALSE",
      "options": [
        { "optionText": "Option 1", "isCorrect": false },
        { "optionText": "Option 2", "isCorrect": true },
        { "optionText": "Option 3", "isCorrect": false },
        { "optionText": "Option 4", "isCorrect": false }
      ],
      "points": 1,
      "explanation": "Optional explanation for the correct answer"
    }
  ]
}
\`\`\`

STRICT RULES:
- The JSON block must be valid JSON.
- Do not include comments in the JSON.
- Do not add trailing commas.
- Do not add any text after the JSON code block.
- For single correct answer questions, set "questionType":"SINGLE" and mark only ONE option as "isCorrect": true.
- For multiple correct answers (select all that apply), set "questionType":"MULTIPLE" and mark ALL correct options as "isCorrect": true.
- For True/False questions, set "questionType":"TRUE_FALSE" and provide exactly two options: "True" and "False".
- Each question MUST have at least one correct answer.
- Keep question texts concise and options clear.
- Always provide 4 options for SINGLE and MULTIPLE types (unless it's TRUE_FALSE).
- The "points" field is the score for each question (default 1).
- The "explanation" field should briefly explain why the correct answer is correct.

You may also use context from the builder if helpful.
`
    };

    const payload = {
      model,
      messages: [system, ...messages],
      temperature,
    };

    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_QUIZ_API_KEY}`,
        'Content-Type': 'application/json',
        // Optional but recommended:
        'HTTP-Referer': process.env.PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'Quiz Builder',
      },
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      const text = await r.text();
      return res.status(r.status).json({ error: text });
    }

    const data = await r.json();
    const content = data?.choices?.[0]?.message?.content ?? '';
    return res.json({ content, raw: data });
  } catch (err) {
    console.error('OpenRouter Quiz AI proxy error:', err);
    res.status(500).json({ error: 'AI request failed' });
  }
});

export default router;
