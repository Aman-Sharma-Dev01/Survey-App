import React, { useState } from 'react';
import { Sparkles, Loader2, CheckCircle, AlertTriangle, Download } from 'lucide-react';
import { chatCodingAI } from '../services/codingAi';

const extractJson = (content) => {
  const fence = content.match(/```json\s*([\s\S]*?)```/i) || content.match(/```\s*([\s\S]*?)```/i);
  if (!fence) return null;
  try {
    return JSON.parse(fence[1]);
  } catch (e) {
    return null;
  }
};

const normalizeQuestions = (raw) => {
  if (!raw || !Array.isArray(raw.questions)) return [];
  return raw.questions.map((q) => ({
    title: String(q.title || 'Untitled').trim(),
    prompt: String(q.prompt || '').trim(),
    starterCode: q.starterCode || '',
    points: q.points || 1,
    timeLimitMs: q.timeLimitMs || 2000,
    language: 'javascript',
    testCases: Array.isArray(q.testCases)
      ? q.testCases.map((t) => ({
          input: String(t.input || ''),
          expectedOutput: String(t.expectedOutput || ''),
          explanation: t.explanation || '',
        }))
      : [],
  }));
};

const CodingAIPanel = ({ onImportQuestions }) => {
  const [prompt, setPrompt] = useState('Generate 2 beginner JavaScript coding problems with 3 test cases each.');
  const [loading, setLoading] = useState(false);
  const [lastContent, setLastContent] = useState('');
  const [status, setStatus] = useState('');

  const handleGenerate = async () => {
    const text = prompt.trim();
    if (!text) return;
    setLoading(true);
    setStatus('');
    try {
      const { content } = await chatCodingAI({ messages: [{ role: 'user', content: text }], temperature: 0.4 });
      setLastContent(content || '');
      const parsed = normalizeQuestions(extractJson(content));
      if (!parsed.length) {
        setStatus('No structured questions detected. Try again.');
        return;
      }
      onImportQuestions(parsed);
      setStatus(`Imported ${parsed.length} questions`);
    } catch (err) {
      setStatus(err?.message || 'AI request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-emerald-100 rounded-xl shadow-sm p-4 space-y-3">
      <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm">
        <Sparkles size={16} /> AI Coding Question Helper
      </div>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={3}
        className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500"
        placeholder="Describe the coding problems you want..."
      />
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-60"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
        Generate with AI
      </button>
      {status && (
        <p className="text-xs text-slate-600">{status}</p>
      )}
      {lastContent && (
        <details className="text-xs text-slate-600">
          <summary className="flex items-center gap-1 cursor-pointer select-none"><Download size={12} /> View raw AI output</summary>
          <pre className="mt-2 p-2 bg-slate-50 border rounded overflow-x-auto whitespace-pre-wrap">{lastContent}</pre>
        </details>
      )}
    </div>
  );
};

export default CodingAIPanel;
