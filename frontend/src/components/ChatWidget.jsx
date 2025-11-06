import React, { useMemo, useRef, useState } from 'react';
import { MessageCircle, X, Send, Copy, Download } from 'lucide-react';
import { chatAI } from '../services/ai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { generateTempId } from '../services/api';

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
      const type = (q.type || '').toUpperCase();
      const options = Array.isArray(q.options) ? q.options : [];
      const normalizedType = ['RADIO', 'CHECKBOX', 'TEXT'].includes(type)
        ? type
        : options.length ? 'RADIO' : 'TEXT';

      return {
        questionText: String(q.text || '').trim(),
        questionType: normalizedType,
        options,
      };
    });
  } catch {
    return null;
  }
}

// -------- Markdown fallback parser ------------------------------------------
const isQuestionLine = (line) => {
  if (/^\d+[\.\)]\s+.+\?$/.test(line)) return true; // 1. Question?
  if (/^\*{2}.+\?\*{2}$/.test(line)) return true;   // **Question?**
  return /\?$/.test(line);
};

const extractQuestionText = (line) => {
  let q = line.replace(/^\d+[\.\)]\s+/, '').trim();
  if (/^\*\*/.test(q)) q = q.replace(/^\*\*/, '').replace(/\*\*$/, '').trim();

  // Inline options: "Question? - A - B - C"
  const inline = q.match(/(.+\?)\s*[-–—]\s*(.+)$/);
  if (inline) {
    return {
      q: inline[1].trim(),
      inlineOptions: inline[2]
        .split(/\s*[-–—]\s*/)
        .map((s) => s.trim())
        .filter(Boolean),
    };
  }
  return { q, inlineOptions: null };
};

const isOptionLine = (line) => {
  if (/^[-*•]\s+.+/.test(line)) return true; // bullets
  if (!line.includes('?')) return true;
  return false;
};

function parseQuestionsFromMarkdown(md) {
  const lines = md
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

  const results = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (isQuestionLine(line)) {
      const { q, inlineOptions } = extractQuestionText(line);
      let options = [];

      if (inlineOptions && inlineOptions.length) {
        options = inlineOptions;
        i += 1;
      } else {
        i += 1;
        while (i < lines.length && !isQuestionLine(lines[i])) {
          const l = lines[i];
          if (isOptionLine(l)) {
            const m = l.match(/^[-*•]\s*(.+)$/);
            const text = (m ? m[1] : l).trim();
            if (text) options.push(text);
          } else {
            break;
          }
          i += 1;
        }
      }

      results.push({
        questionText: q.replace(/\*\*/g, '').trim(),
        options: options.map((o) => o.replace(/\*\*/g, '').trim()).filter(Boolean),
        // type decided later
      });
      continue;
    }
    i += 1;
  }

  return results;
}
// ---------------------------------------------------------------------------

export default function ChatWidget({ survey, onImportQuestions }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [thread, setThread] = useState([
    {
      role: 'assistant',
      content:
        'Hi! I can help you write questions, pick presets, or improve wording. I will include a JSON block you can import.',
    },
  ]);
  const listRef = useRef(null);

  const context = useMemo(
    () => ({
      title: survey.title,
      description: survey.description,
      questions: survey.questions?.map((q) => ({
        questionText: q.questionText,
        questionType: q.questionType,
        options: (q.options || []).map((o) => o.optionText),
        isRequired: q.isRequired,
      })),
    }),
    [survey]
  );

  const send = async () => {
    const text = input.trim();
    if (!text) return;

    const newThread = [...thread, { role: 'user', content: text }];
    setThread(newThread);
    setInput('');
    setLoading(true);

    try {
      const { content } = await chatAI({
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
      parseQuestionsFromMarkdown(content);

    if (!parsed || parsed.length === 0) {
      alert(
        'Could not detect any questions to import. The assistant will now always include a JSON block—please ask again.'
      );
      return;
    }

    const newQs = parsed.map((item) => {
      const hasOptions = Array.isArray(item.options) && item.options.length > 0;
      const type =
        item.questionType ||
        (hasOptions ? 'RADIO' : 'TEXT');

      return {
        tempId: generateTempId(),
        questionText: item.questionText,
        questionType: type,
        isRequired: false,
        options: hasOptions
          ? item.options.map((o) => ({
              optionText: typeof o === 'string' ? o : String(o),
              value: typeof o === 'string' ? o : String(o),
            }))
          : [],
      };
    });

    onImportQuestions?.(newQs);
  };

  const lastAssistantMsg = [...thread].reverse().find((m) => m.role === 'assistant');

  return (
    <>
      {/* FAB */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 bg-indigo-600 text-white p-4 rounded-full shadow-xl hover:bg-indigo-700 transition"
          aria-label="Open survey assistant"
        >
          <MessageCircle size={22} />
        </button>
      )}

      {/* Panel */}
      {open && (
        <div className="fixed bottom-6 right-6 w-96 max-w-[92vw] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          <div className="px-4 py-3 bg-indigo-600 text-white flex items-center justify-between">
            <div className="font-semibold">Survey Assistant</div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!lastAssistantMsg}
                onClick={() => lastAssistantMsg && importFromMessage(lastAssistantMsg.content)}
                className="disabled:opacity-40 bg-white text-indigo-700 px-2 py-1 rounded-md flex items-center gap-1 hover:bg-indigo-50"
                title="Import last answer into survey"
              >
                <Download size={16} /> Import
              </button>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded hover:bg-indigo-700"
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
                      mine ? 'bg-indigo-100' : 'bg-gray-50'
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
              className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Ask me to draft 10 classroom survey questions with options…"
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
              className="bg-indigo-600 text-white px-3 rounded-lg disabled:opacity-50"
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
