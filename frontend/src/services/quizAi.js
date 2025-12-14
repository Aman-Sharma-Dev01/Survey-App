import { BASE_URL } from "./api";

export async function chatQuizAI({ messages, context, model, temperature }) {
  const r = await fetch(`${BASE_URL}/api/quiz-ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ messages, context, model, temperature }),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(t || 'AI error');
  }
  return r.json(); // { content, raw }
}

/**
 * Parse quiz questions from AI response content
 * @param {string} content - The AI response content
 * @returns {Array} - Array of quiz questions in the format expected by QuizCreate
 */
export function parseQuizQuestionsFromAI(content) {
  try {
    // Extract JSON from markdown code block
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (!jsonMatch) {
      console.warn('No JSON block found in AI response');
      return [];
    }

    const parsed = JSON.parse(jsonMatch[1]);
    
    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      console.warn('Invalid quiz questions format');
      return [];
    }

    // Map to the format expected by QuizCreate component
    return parsed.questions.map((q, index) => ({
      questionText: q.questionText || '',
      questionType: q.questionType || 'SINGLE',
      options: (q.options || []).map(opt => ({
        optionText: opt.optionText || '',
        isCorrect: opt.isCorrect || false
      })),
      points: q.points || 1,
      explanation: q.explanation || ''
    }));
  } catch (err) {
    console.error('Error parsing quiz questions from AI:', err);
    return [];
  }
}
