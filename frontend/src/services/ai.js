export async function chatAI({ messages, context, model, temperature }) {
  const r = await fetch('http://localhost:5000/api/ai/chat', {
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
