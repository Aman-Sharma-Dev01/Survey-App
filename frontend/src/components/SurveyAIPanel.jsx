import React, { useMemo, useRef, useState } from 'react';
import { Send, Copy, Download, Coins, Sparkles, CheckCircle, X } from 'lucide-react';
import { chatAI } from '../services/ai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { generateTempId } from '../services/api';
import { useAuth } from '../context/AuthContext.jsx';

// -------- JSON-first extractor (```json ... ```) -----------------------------
function extractJsonQuestionsFromMessage(content) {
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
  if (/^\d+[\.\)]\s+.+\?$/.test(line)) return true;
  if (/^\*{2}.+\?\*{2}$/.test(line)) return true;
  return /\?$/.test(line);
};

const extractQuestionText = (line) => {
  let q = line.replace(/^\d+[\.\)]\s+/, '').trim();
  if (/^\*\*/.test(q)) q = q.replace(/^\*\*/, '').replace(/\*\*$/, '').trim();

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
  if (/^[-*•]\s+.+/.test(line)) return true;
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
      });
      continue;
    }
    i += 1;
  }

  return results;
}

export default function SurveyAIPanel({ survey, onImportQuestions, navigate }) {
  const { credits, useCredits: deductCredits } = useAuth();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCreditWarning, setShowCreditWarning] = useState(false);
  const [importedQuestions, setImportedQuestions] = useState(null);
  const [showImportPopup, setShowImportPopup] = useState(false);
  const [thread, setThread] = useState([
    {
      role: 'assistant',
      content:
        'Hi! I can help you write questions, pick presets, or improve wording. I will include a JSON block you can import. Each AI generation uses 20 credits.',
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

    if (credits < 20) {
      setShowCreditWarning(true);
      return;
    }

    const newThread = [...thread, { role: 'user', content: text }];
    setThread(newThread);
    setInput('');
    setLoading(true);

    try {
      const creditResult = await deductCredits(20);
      if (!creditResult.success) {
        if (creditResult.needsPurchase) {
          setShowCreditWarning(true);
          setThread((t) => t.slice(0, -1));
          return;
        }
        throw new Error(creditResult.message);
      }

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
    } catch { /* ignore */ }
  };

  const importFromMessage = (content) => {
    let parsed =
      extractJsonQuestionsFromMessage(content) ||
      parseQuestionsFromMarkdown(content);

    if (!parsed || parsed.length === 0) {
      alert('Could not detect any questions to import. Please ask the AI again.');
      return;
    }

    const newQs = parsed.map((item) => {
      const hasOptions = Array.isArray(item.options) && item.options.length > 0;
      const type = item.questionType || (hasOptions ? 'RADIO' : 'TEXT');

      return {
        tempId: generateTempId(),
        questionText: item.questionText,
        questionType: type,
        isRequired: true,
        options: hasOptions
          ? item.options.map((o) => ({
              optionText: typeof o === 'string' ? o : String(o),
              value: typeof o === 'string' ? o : String(o),
            }))
          : [],
      };
    });

    setImportedQuestions(newQs);
    setShowImportPopup(true);
  };

  const confirmImport = () => {
    if (importedQuestions && importedQuestions.length > 0) {
      onImportQuestions?.(importedQuestions);
    }
    setShowImportPopup(false);
    setImportedQuestions(null);
  };

  const lastAssistantMsg = [...thread].reverse().find((m) => m.role === 'assistant');

  return (
    <div className="bg-white rounded-xl shadow-lg border border-indigo-100 flex flex-col h-full overflow-hidden">
      {/* Import Review Popup */}
      {showImportPopup && importedQuestions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-lg mx-4 w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle size={28} className="text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Questions Ready to Import</h2>
                  <p className="text-sm text-gray-500">{importedQuestions.length} question{importedQuestions.length > 1 ? 's' : ''} detected</p>
                </div>
              </div>
              <button onClick={() => setShowImportPopup(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2">
              {importedQuestions.map((q, idx) => (
                <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-start gap-2">
                    <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded">Q{idx + 1}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{q.questionText}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Type: {q.questionType} • {q.options?.length || 0} options • {q.isRequired ? 'Required' : 'Optional'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex gap-3 justify-end pt-3 border-t">
              <button
                onClick={() => setShowImportPopup(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmImport}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
              >
                <CheckCircle size={16} /> Add to Survey
              </button>
            </div>
          </div>
        </div>
      )}

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
                  navigate && navigate('pricing');
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
              >
                <Coins size={16} /> Buy Credits
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles size={18} />
          <span className="font-semibold">AI Assistant</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white/20 px-2 py-0.5 rounded text-xs">
            <Coins size={12} className="text-yellow-300 mr-1" />
            <span>{credits}</span>
          </div>
          <button
            type="button"
            disabled={!lastAssistantMsg}
            onClick={() => lastAssistantMsg && importFromMessage(lastAssistantMsg.content)}
            className="disabled:opacity-40 bg-white text-indigo-700 px-2 py-1 rounded-md flex items-center gap-1 hover:bg-indigo-50 text-sm font-medium"
            title="Import last answer into survey"
          >
            <Download size={14} /> Import
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={listRef} className="flex-1 p-3 space-y-3 overflow-y-auto min-h-0">
        {thread.map((m, i) => {
          const mine = m.role === 'user';
          return (
            <div key={i} className={`text-sm ${mine ? 'text-right' : ''}`}>
              <div
                className={`inline-block px-3 py-2 rounded-lg max-w-[95%] ${
                  mine ? 'bg-indigo-100 text-gray-800' : 'bg-gray-50 text-gray-700'
                }`}
              >
                {mine ? (
                  <span>{m.content}</span>
                ) : (
                  <div className="relative">
                    <div className="absolute -top-2 -right-2 flex gap-1">
                      <button
                        type="button"
                        title="Copy"
                        onClick={() => copyToClipboard(m.content)}
                        className="p-1 rounded-md border bg-white shadow hover:bg-gray-50"
                      >
                        <Copy size={12} />
                      </button>
                      <button
                        type="button"
                        title="Import"
                        onClick={() => importFromMessage(m.content)}
                        className="p-1 rounded-md border bg-white shadow hover:bg-gray-50"
                      >
                        <Download size={12} />
                      </button>
                    </div>
                    <div className="prose prose-sm max-w-none [&_code]:break-words [&_pre]:overflow-x-auto [&_pre]:text-xs">
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
        {loading && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="animate-pulse flex gap-1">
              <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
              <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
            </div>
            <span>Generating...</span>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-100 shrink-0">
        <div className="flex gap-2">
          <input
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Generate 5 feedback questions..."
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
            className="bg-indigo-600 text-white p-2 rounded-lg disabled:opacity-50 hover:bg-indigo-700 transition"
            onClick={send}
            disabled={loading || !input.trim()}
            aria-label="Send"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">Each generation uses 20 credits</p>
      </div>
    </div>
  );
}
