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
    let contextInfo = '';
    if (context.title || context.description) {
      contextInfo += `\nCurrent Survey: "${context.title || 'Untitled'}"`;
      if (context.description) contextInfo += ` - ${context.description}`;
    }
    if (context.documentContent) {
      contextInfo += `\n\nDOCUMENT CONTENT TO BASE QUESTIONS ON:\n---\n${context.documentContent}\n---\n\nGenerate questions based on the content above. The questions should test understanding and cover key concepts from the document.`;
    }

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
${contextInfo}
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

// POST /api/ai/insights
// Generates AI-driven insights for survey analytics with a dedicated analytics key
router.post('/insights', async (req, res) => {
  try {
    const {
      surveyId,
      surveyTitle = 'Survey',
      analysis = {},
      model = 'openai/gpt-4o-mini',
      temperature = 0.4,
    } = req.body || {};

    const apiKey = process.env.OPENROUTER_ANALYTICS_API_KEY || process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Analytics OpenRouter API key missing.' });
    }

    // Build a compact summary payload so we don't send overly large requests
    const { totalResponses = 0, questions = [] } = analysis;

    const system = {
      role: 'system',
      content: `You are an expert Survey Analytics Copilot. Produce concise, actionable insights based ONLY on the provided survey stats.

Output MUST be clean Markdown with these sections:
1) Executive Summary (3-5 bullet points)
2) Key Trends & Themes
3) Risks / Drop-offs / Anomalies
4) Recommendations (specific and prioritized)
5) Follow-up Questions (3 short prompts to explore further)
6) Compact KPI Table (if data permits)

Rules:
- Do not invent data; rely solely on supplied counts.
- If free-text samples are provided, summarize themes briefly.
- Keep under 500 words.
- Make it skimmable for a PM/insights lead.
`
    };

    const user = {
      role: 'user',
      content: `Survey Title: ${surveyTitle}
Survey ID: ${surveyId || 'n/a'}
Total Responses: ${totalResponses}

Questions:
${questions
  .map((q, idx) => {
    const options = (q.options || [])
      .map((opt) => `- ${opt.label || opt.option || 'Option'}: count=${opt.count ?? opt.responses ?? 0}${opt.percentage ? ` (${opt.percentage}%)` : ''}`)
      .join('\n');

    const samples = (q.freeTextSamples || [])
      .slice(0, 5)
      .map((s) => `• ${s}`)
      .join('\n');

    return `${idx + 1}. ${q.text} [${q.type || 'unknown'}]
Counts:
${options || '- (no option counts)'}
Free-text samples:
${samples || '- none provided'}`;
  })
  .join('\n\n')}
`
    };

    const payload = {
      model,
      messages: [system, user],
      temperature,
    };

    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'Survey Analytics',
      },
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      const text = await r.text();
      return res.status(r.status).json({ error: text });
    }

    const data = await r.json();
    const content = data?.choices?.[0]?.message?.content ?? '';
    return res.json({ insights: content, raw: data });
  } catch (err) {
    console.error('OpenRouter analytics error:', err);
    res.status(500).json({ error: 'AI analytics request failed' });
  }
});

export default router;
