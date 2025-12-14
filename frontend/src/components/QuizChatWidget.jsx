import React, { useMemo, useRef, useState } from 'react';
import { MessageCircle, X, Send, Copy, Download, Coins, AlertTriangle } from 'lucide-react';
import { chatQuizAI } from '../services/quizAi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { generateTempId } from '../services/api';
import { useAuth } from '../context/AuthContext.jsx';

// -------- JSON-first extractor (```json ... ```) -----------------------------
function extractJsonQuestionsFromMessage(content) {
  // Match ```json ... ``` or plain ``` ... ```
  const fence =
    content.match(/```json\s*([\s\S]*?)```/i) ||
    content.match(/```\s*([\s\S]*?)```/i);
  if (!fence) return null;

  try {
    const obj = JSON.parse(fence[1]);
    if (!obj || !Array.isArray(obj.questions)) return null;

    return obj.questions.map((q) => {
      const type = (q.questionType || '').toUpperCase();
      const normalizedType = ['SINGLE', 'MULTIPLE', 'TRUE_FALSE'].includes(type)
        ? type
        : 'SINGLE';

      return {
        questionText: String(q.questionText || '').trim(),
        questionType: normalizedType,
        options: Array.isArray(q.options) ? q.options.map(opt => ({
          optionText: String(opt.optionText || '').trim(),
          isCorrect: Boolean(opt.isCorrect)
        })) : [],
        points: q.points || 1,
        explanation: q.explanation || ''
      };
    });
  } catch {
    return null;
  }
}

// -------- Markdown fallback parser for quizzes ------------------------------------------
function parseQuizQuestionsFromMarkdown(md) {
  const lines = md
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

  const results = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Check if line is a question (starts with number or has ?)
    if (/^\d+[.)]\s+.+\?/.test(line) || /\?$/.test(line)) {
      let questionText = line.replace(/^\d+[.)]\s+/, '').replace(/\*\*/g, '').trim();
      const options = [];
      i += 1;

      // Collect options (lines starting with -, *, •, or A), B), etc.)
      while (i < lines.length && !/^\d+[.)]\s+.+\?/.test(lines[i]) && !/\?$/.test(lines[i])) {
        const l = lines[i];
        // Match option lines
        const optMatch = l.match(/^[-*•]\s*(.+)$/) || l.match(/^[A-D][.)]\s*(.+)$/i);
        if (optMatch) {
          let optionText = optMatch[1].trim();
          // Check if marked as correct (✓, ✔, (correct), etc.)
          const isCorrect = /[✓✔]|\(correct\)|\*\*correct\*\*/i.test(optionText);
          optionText = optionText.replace(/[✓✔]|\(correct\)|\*\*correct\*\*/gi, '').trim();
          options.push({ optionText, isCorrect });
        }
        i += 1;
      }

      if (options.length > 0) {
        results.push({
          questionText,
          questionType: 'SINGLE',
          options,
          points: 1,
          explanation: ''
        });
      }
      continue;
    }
    i += 1;
  }

  return results;
}
// ---------------------------------------------------------------------------

export default function QuizChatWidget({ quiz, onImportQuestions, navigate }) {
  const { credits, useCredits: deductCredits } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCreditWarning, setShowCreditWarning] = useState(false);
  const [thread, setThread] = useState([
    {
      role: 'assistant',
      content:
        'Hi! I can help you create quiz questions with correct answers, explanations, and multiple choice options. Just tell me the topic and I\'ll generate questions you can import directly. Each AI generation uses 20 credits.',
    },
  ]);
  const listRef = useRef(null);

  const context = useMemo(
    () => ({
      title: quiz.title,
      description: quiz.description,
      questions: quiz.questions?.map((q) => ({
        questionText: q.questionText,
        questionType: q.questionType,
        options: (q.options || []).map((o) => ({
          optionText: o.optionText,
          isCorrect: o.isCorrect
        })),
        points: q.points,
        explanation: q.explanation
      })),
    }),
    [quiz]
  );

  const send = async () => {
    const text = input.trim();
    if (!text) return;

    // Check if user has enough credits
    if (credits < 20) {
      setShowCreditWarning(true);
      return;
    }

    const newThread = [...thread, { role: 'user', content: text }];
    setThread(newThread);
    setInput('');
    setLoading(true);

    try {
      // Deduct credits first
      const creditResult = await deductCredits(20);
      if (!creditResult.success) {
        if (creditResult.needsPurchase) {
          setShowCreditWarning(true);
          setThread((t) => t.slice(0, -1)); // Remove the user message
          return;
        }
        throw new Error(creditResult.message);
      }

      const { content } = await chatQuizAI({
        messages: newThread.map((m) => ({ role: m.role, content: m.content })),
        context,
        temperature: 0.7,
      });

      setThread((t) => [...t, { role: 'assistant', content }]);

      setTimeout(() => {
        listRef.current?.scrollTo({
          top: listRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }, 20);
    } catch (e) {
      console.error(e);
      setThread((t) => [
        ...t,
        { role: 'assistant', content: 'Sorry—AI request failed.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignore */
    }
  };

  const importFromMessage = (content) => {
    // 1) Prefer strict JSON block
    let parsed =
      extractJsonQuestionsFromMessage(content) ||
      parseQuizQuestionsFromMarkdown(content);

    if (!parsed || parsed.length === 0) {
      alert(
        'Could not detect any questions to import. The assistant will now always include a JSON block—please ask again.'
      );
      return;
    }

    const newQs = parsed.map((item) => {
      return {
        tempId: generateTempId(),
        questionText: item.questionText,
        questionType: item.questionType || 'SINGLE',
        options: item.options.map((o) => ({
          optionText: o.optionText,
          isCorrect: o.isCorrect || false
        })),
        points: item.points || 1,
        explanation: item.explanation || ''
      };
    });

    onImportQuestions?.(newQs);
  };

  const lastAssistantMsg = [...thread].reverse().find((m) => m.role === 'assistant');

  return (
    <>
      {/* Credit Warning Modal */}
      {showCreditWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md mx-4 text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Coins size={32} className="text-yellow-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Insufficient Credits</h2>
            <p className="text-gray-600 mb-4">
              You need at least 20 credits to use the AI assistant. Your current balance is <span className="font-bold text-yellow-600">{credits}</span> credits.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowCreditWarning(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowCreditWarning(false);
                  setOpen(false);
                  navigate && navigate('pricing');
                }}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
              >
                <Coins size={16} /> Buy Credits
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAB */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 bg-emerald-600 text-white p-4 rounded-full shadow-xl hover:bg-emerald-700 transition"
          aria-label="Open quiz assistant"
        >
          <MessageCircle size={22} />
        </button>
      )}

      {/* Panel */}
      {open && (
        <div className="fixed bottom-6 right-6 w-96 max-w-[92vw] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden z-40">
          <div className="px-4 py-3 bg-emerald-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Quiz Assistant</span>
              <div className="flex items-center bg-emerald-700 px-2 py-0.5 rounded text-xs">
                <Coins size={12} className="text-yellow-400 mr-1" />
                <span className="text-yellow-400">{credits}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!lastAssistantMsg}
                onClick={() => lastAssistantMsg && importFromMessage(lastAssistantMsg.content)}
                className="disabled:opacity-40 bg-white text-emerald-700 px-2 py-1 rounded-md flex items-center gap-1 hover:bg-emerald-50"
                title="Import last answer into quiz"
              >
                <Download size={16} /> Import
              </button>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded hover:bg-emerald-700"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div ref={listRef} className="p-4 space-y-3 h-80 overflow-y-auto">
            {thread.map((m, i) => {
              const mine = m.role === 'user';
              return (
                <div key={i} className={`text-sm ${mine ? 'text-right' : ''}`}>
                  <div
                    className={`inline-block px-3 py-2 rounded-lg max-w-[85%] ${
                      mine ? 'bg-emerald-100' : 'bg-gray-50'
                    }`}
                  >
                    {mine ? (
                      <span>{m.content}</span>
                    ) : (
                      <div className="relative">
                        {/* Per-bubble actions */}
                        <div className="absolute -top-2 -right-2 flex gap-1">
                          <button
                            type="button"
                            title="Copy"
                            onClick={() => copyToClipboard(m.content)}
                            className="p-1 rounded-md border bg-white shadow hover:bg-gray-50"
                          >
                            <Copy size={14} />
                          </button>
                          <button
                            type="button"
                            title="Import this answer"
                            onClick={() => importFromMessage(m.content)}
                            className="p-1 rounded-md border bg-white shadow hover:bg-gray-50"
                          >
                            <Download size={14} />
                          </button>
                        </div>

                        <div className="prose prose-sm max-w-none [&_code]:break-words [&_pre]:overflow-x-auto">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {m.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {loading && <div className="text-sm text-gray-500">Thinking…</div>}
          </div>

          <div className="p-3 border-t flex gap-2">
            <input
              className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Ask me to create 10 JavaScript quiz questions..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <button
              className="bg-emerald-600 text-white px-3 rounded-lg disabled:opacity-50"
              onClick={send}
              disabled={loading || !input.trim()}
              aria-label="Send"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
