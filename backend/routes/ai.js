import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

/**
 * POST /api/ai/chat
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

    // Build a system prompt that injects survey builder context
   const system = {
  role: 'system',
  content: `
You are SurveyGenius, an expert survey design copilot.

ALWAYS produce two parts in your response:
1) A human-friendly Markdown section (headings, lists).
2) A final fenced JSON code block with EXACTLY this schema and nothing else:

\`\`\`json
{
  "questions": [
    {
      "text": "Question text here",
      "type": "RADIO" | "CHECKBOX" | "TEXT",
      "options": ["Option 1","Option 2"]    // required for RADIO/CHECKBOX, omit for TEXT
    }
  ]
}
\`\`\`

STRICT RULES:
- The JSON block must be valid JSON.
- Do not include comments in the JSON.
- Do not add trailing commas.
- Do not add any text after the JSON code block.
- For "Select all that apply" questions, set "type":"CHECKBOX".
- For Likert scales, set "type":"RADIO" and provide all options.
- Keep question texts concise and options clear.

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
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        // Optional but recommended:
        'HTTP-Referer': process.env.PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'Survey Builder',
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
    console.error('OpenRouter proxy error:', err);
    res.status(500).json({ error: 'AI request failed' });
  }
});

export default router;
