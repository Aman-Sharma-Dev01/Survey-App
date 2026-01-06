import React, { useState } from 'react';
import { PlusCircle, Trash2, Loader, Clock } from 'lucide-react';
import { generateTempId } from '../services/api';
import { createCodingTest } from '../services/codingTestService';
import CodingAIPanel from '../components/CodingAIPanel';

const defaultQuestion = () => ({
  tempId: generateTempId(),
  title: '',
  prompt: '',
  starterCode: '// use readInput() to read input',
  points: 1,
  timeLimitMs: 2000,
  testCases: [{ tempId: generateTempId(), input: '2 3', expectedOutput: '5' }],
});

const CodingTestCreate = ({ navigate }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [classesInput, setClassesInput] = useState('');
  const [classes, setClasses] = useState([]);
  const [questions, setQuestions] = useState([defaultQuestion()]);
  const [settings, setSettings] = useState({
    timeLimit: 0,
    passingScore: 60,
    tabSwitchingEnabled: true,
    preventDuplicateRollNo: false,
    fullscreenModeEnabled: true,
    showExpectedOutputs: true,
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const addClass = () => {
    const trimmed = classesInput.trim();
    if (trimmed && !classes.includes(trimmed)) {
      setClasses([...classes, trimmed]);
      setClassesInput('');
    }
  };

  const removeClass = (cls) => setClasses(classes.filter((c) => c !== cls));

  const addQuestion = () => setQuestions([...questions, defaultQuestion()]);

  const removeQuestion = (tempId) => setQuestions(questions.filter((q) => q.tempId !== tempId));

  const updateQuestion = (tempId, updates) => {
    setQuestions((prev) => prev.map((q) => (q.tempId === tempId ? { ...q, ...updates } : q)));
  };

  const addTestCase = (qid) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.tempId === qid
          ? { ...q, testCases: [...q.testCases, { tempId: generateTempId(), input: '', expectedOutput: '' }] }
          : q
      )
    );
  };

  const updateTestCase = (qid, tcid, field, value) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.tempId === qid
          ? {
              ...q,
              testCases: q.testCases.map((tc) => (tc.tempId === tcid ? { ...tc, [field]: value } : tc)),
            }
          : q
      )
    );
  };

  const removeTestCase = (qid, tcid) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.tempId === qid
          ? { ...q, testCases: q.testCases.filter((tc) => tc.tempId !== tcid) }
          : q
      )
    );
  };

  const handleImport = (imported) => {
    setQuestions(
      imported.map((q) => ({
        tempId: generateTempId(),
        title: q.title || 'Untitled',
        prompt: q.prompt || '',
        starterCode: q.starterCode || '',
        points: q.points || 1,
        timeLimitMs: q.timeLimitMs || 2000,
        testCases: (q.testCases || []).map((tc) => ({
          tempId: generateTempId(),
          input: tc.input || '',
          expectedOutput: tc.expectedOutput || '',
        })),
      }))
    );
  };

  const handleSubmit = async () => {
    if (!title.trim() || questions.length === 0) {
      setStatus('Title and at least one question are required');
      return;
    }

    // Basic validation to avoid server-side validation errors
    const invalid = questions.find((q) => {
      const hasMissingFields = !(q.title || '').trim() || !(q.prompt || '').trim();
      const hasEmptyTestCase = (q.testCases || []).some((tc) => !(tc.input || '').trim() || !(tc.expectedOutput || '').trim());
      return hasMissingFields || hasEmptyTestCase;
    });

    if (invalid) {
      setStatus('Each question needs a title, prompt, and complete test cases (input and expected output).');
      return;
    }

    const payload = {
      title: title.trim(),
      description,
      classes,
      questions: questions.map((q) => ({
        title: q.title,
        prompt: q.prompt,
        starterCode: q.starterCode,
        points: q.points,
        timeLimitMs: q.timeLimitMs,
        language: 'javascript',
        testCases: q.testCases.map((tc) => ({ input: tc.input, expectedOutput: tc.expectedOutput })),
      })),
      settings,
    };

    setLoading(true);
    setStatus('');
    try {
      await createCodingTest(payload);
      setStatus('Saved. Redirecting...');
      navigate('coding-dashboard');
    } catch (err) {
      setStatus(err?.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-emerald-800">Create Coding Test</h1>
          <p className="text-sm text-gray-600">JavaScript-only, runs in-browser. Students will see test cases.</p>
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-60"
        >
          {loading ? <Loader size={16} className="animate-spin" /> : 'Save & Publish Later'}
        </button>
      </div>

      {status && <div className="p-3 rounded bg-amber-50 text-amber-700 text-sm">{status}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl shadow border p-4 space-y-3">
            <label className="text-sm font-semibold text-gray-700">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border rounded-lg p-3"
              placeholder="DSA Round 1 - JS"
            />
            <label className="text-sm font-semibold text-gray-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full border rounded-lg p-3"
              placeholder="Short context for candidates"
            />
          </div>

          {questions.map((q, idx) => (
            <div key={q.tempId} className="bg-white rounded-xl shadow border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-gray-800">Question {idx + 1}</div>
                <button onClick={() => removeQuestion(q.tempId)} className="text-red-500 hover:text-red-600 flex items-center text-sm">
                  <Trash2 size={16} className="mr-1" /> Remove
                </button>
              </div>
              <input
                value={q.title}
                onChange={(e) => updateQuestion(q.tempId, { title: e.target.value })}
                className="w-full border rounded-lg p-2"
                placeholder="Problem title"
              />
              <textarea
                value={q.prompt}
                onChange={(e) => updateQuestion(q.tempId, { prompt: e.target.value })}
                rows={4}
                className="w-full border rounded-lg p-3 font-mono text-sm"
                placeholder="Describe the task, input/output format, constraints..."
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-gray-600">Points</label>
                  <input
                    type="number"
                    value={q.points}
                    onChange={(e) => updateQuestion(q.tempId, { points: parseInt(e.target.value) || 1 })}
                    className="w-full border rounded-lg p-2"
                    min={1}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Run time limit (ms)</label>
                  <input
                    type="number"
                    value={q.timeLimitMs}
                    onChange={(e) => updateQuestion(q.tempId, { timeLimitMs: parseInt(e.target.value) || 2000 })}
                    className="w-full border rounded-lg p-2"
                    min={500}
                  />
                </div>
                <div className="flex items-end text-xs text-gray-500">
                  Code executes in a sandboxed Web Worker. No network or DOM access.
                </div>
              </div>
              <label className="text-xs text-gray-600">Starter code (shown to students)</label>
              <textarea
                value={q.starterCode}
                onChange={(e) => updateQuestion(q.tempId, { starterCode: e.target.value })}
                rows={4}
                className="w-full border rounded-lg p-3 font-mono text-sm bg-slate-900 text-slate-50"
              />

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">Test Cases</span>
                  <button onClick={() => addTestCase(q.tempId)} className="text-emerald-600 text-sm flex items-center">
                    <PlusCircle size={16} className="mr-1" /> Add Test
                  </button>
                </div>
                <div className="space-y-2">
                  {q.testCases.map((tc) => (
                    <div key={tc.tempId} className="border rounded-lg p-3 bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-gray-600">Input</label>
                          <textarea
                            value={tc.input}
                            onChange={(e) => updateTestCase(q.tempId, tc.tempId, 'input', e.target.value)}
                            rows={2}
                            className="w-full border rounded-lg p-2 font-mono text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">Expected Output</label>
                          <textarea
                            value={tc.expectedOutput}
                            onChange={(e) => updateTestCase(q.tempId, tc.tempId, 'expectedOutput', e.target.value)}
                            rows={2}
                            className="w-full border rounded-lg p-2 font-mono text-xs"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end mt-2">
                        <button onClick={() => removeTestCase(q.tempId, tc.tempId)} className="text-red-500 text-xs flex items-center">
                          <Trash2 size={14} className="mr-1" /> Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          <button onClick={addQuestion} className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg">
            <PlusCircle size={16} /> Add Question
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow border p-4 space-y-3">
            <div className="font-semibold text-gray-800">Settings</div>
            <label className="text-xs text-gray-600">Time limit (minutes, 0 = none)</label>
            <input
              type="number"
              value={settings.timeLimit}
              onChange={(e) => setSettings({ ...settings, timeLimit: parseInt(e.target.value) || 0 })}
              className="w-full border rounded-lg p-2"
            />
            <label className="text-xs text-gray-600">Passing score (%)</label>
            <input
              type="number"
              value={settings.passingScore}
              onChange={(e) => setSettings({ ...settings, passingScore: parseInt(e.target.value) || 60 })}
              className="w-full border rounded-lg p-2"
            />
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={settings.tabSwitchingEnabled}
                onChange={(e) => setSettings({ ...settings, tabSwitchingEnabled: e.target.checked })}
              />
              Detect tab switching (auto-submit after 3)
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={settings.fullscreenModeEnabled}
                onChange={(e) => setSettings({ ...settings, fullscreenModeEnabled: e.target.checked })}
              />
              Enforce fullscreen & anti split-screen
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={settings.preventDuplicateRollNo}
                onChange={(e) => setSettings({ ...settings, preventDuplicateRollNo: e.target.checked })}
              />
              Prevent duplicate roll numbers
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={settings.showExpectedOutputs}
                onChange={(e) => setSettings({ ...settings, showExpectedOutputs: e.target.checked })}
              />
              Show expected outputs to students
            </label>
          </div>

          <div className="bg-white rounded-xl shadow border p-4 space-y-3">
            <div className="font-semibold text-gray-800">Classes</div>
            <div className="flex gap-2">
              <input
                value={classesInput}
                onChange={(e) => setClassesInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addClass();
                  }
                }}
                className="flex-1 border rounded-lg p-2"
                placeholder="CSE 5A"
              />
              <button onClick={addClass} className="px-3 py-2 bg-gray-100 rounded-lg">Add</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {classes.map((c) => (
                <span key={c} className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs flex items-center gap-1">
                  {c}
                  <button onClick={() => removeClass(c)} className="text-emerald-900">×</button>
                </span>
              ))}
            </div>
          </div>

          <CodingAIPanel onImportQuestions={handleImport} />
        </div>
      </div>
    </div>
  );
};

export default CodingTestCreate;
