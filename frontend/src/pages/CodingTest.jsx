import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Play,
  RotateCcw,
  ShieldCheck,
  Timer as TimerIcon,
  Copy,
  Lock,
  TerminalSquare,
  EyeOff,
  Code2,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { JS_SANDBOX_WORKER_SOURCE } from '../workers/jsSandboxSource';

const STARTER_CODE = `// JavaScript-only coding test
// Input arrives via readInput(). Example: const [a, b] = readInput().split(" ").map(Number);
// Output using console.log

const [a, b] = readInput().split(" ").map(Number);
console.log(a + b);
`;

const DEFAULT_TEST_CASES = [
  { input: '2 3', expected: '5' },
  { input: '10 15', expected: '25' },
];

const TIME_LIMIT_MS = 2000;
const EXAM_DURATION_SECONDS = 15 * 60;
const MAX_VIOLATIONS = 3;

const formatSeconds = (totalSeconds) => {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, '0');
  return `${minutes}:${seconds}`;
};

const createWorker = () => {
  const blob = new Blob([JS_SANDBOX_WORKER_SOURCE], {
    type: 'application/javascript',
  });
  const url = URL.createObjectURL(blob);
  const worker = new Worker(url, { type: 'module' });
  return { worker, url };
};

const normalizeOutput = (value) => {
  return String(value ?? '')
    .replace(/\r\n/g, '\n')
    .trim();
};

const CodingTest = ({ navigate }) => {
  const [code, setCode] = useState(STARTER_CODE);
  const [logs, setLogs] = useState('');
  const [errors, setErrors] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const [status, setStatus] = useState('idle');
  const [timer, setTimer] = useState(EXAM_DURATION_SECONDS);
  const [violations, setViolations] = useState([]);
  const [locked, setLocked] = useState(false);
  const [shareStatus, setShareStatus] = useState(null);

  const workerRef = useRef(null);
  const runTimeoutRef = useRef(null);

  const terminateWorker = useCallback(() => {
    if (runTimeoutRef.current) {
      clearTimeout(runTimeoutRef.current);
      runTimeoutRef.current = null;
    }
    if (workerRef.current) {
      const { worker, url } = workerRef.current;
      try {
        worker.terminate();
      } catch (err) {
        // ignore termination issues
      }
      if (url) URL.revokeObjectURL(url);
      workerRef.current = null;
    }
  }, []);

  const handleRun = useCallback(
    (finalize = false) => {
      if (locked) return;
      terminateWorker();
      setStatus('running');
      setLogs('');
      setErrors([]);
      setTestResults([]);

      const pkg = createWorker();
      workerRef.current = pkg;

      runTimeoutRef.current = setTimeout(() => {
        terminateWorker();
        setStatus('timeout');
        setErrors(['Time Limit Exceeded (2 seconds). Possible infinite loop.']);
        if (finalize) setLocked(true);
      }, TIME_LIMIT_MS + 150);

      pkg.worker.onmessage = (event) => {
        const data = event.data || {};
        if (data.type === 'timeout') {
          setStatus('timeout');
          setErrors(data.errors || ['Time Limit Exceeded']);
        }
        if (data.type === 'result') {
          const passCount = (data.results || []).filter((r) => r.pass).length;
          setLogs((data.logs || []).join('\n'));
          setErrors(data.errors || []);
          setTestResults(data.results || []);
          if ((data.errors || []).length) {
            setStatus('error');
          } else if (passCount === DEFAULT_TEST_CASES.length) {
            setStatus('success');
          } else {
            setStatus('partial');
          }
        }
        terminateWorker();
        if (finalize) setLocked(true);
      };

      pkg.worker.onerror = (err) => {
        setErrors([err?.message || 'Worker error occurred']);
        setStatus('error');
        terminateWorker();
        if (finalize) setLocked(true);
      };

      pkg.worker.postMessage({
        type: 'run',
        code,
        testCases: DEFAULT_TEST_CASES,
        timeLimitMs: TIME_LIMIT_MS,
      });
    },
    [code, locked, terminateWorker]
  );

  const handleSubmit = useCallback(
    (auto = false) => {
      if (locked) return;
      handleRun(true);
      if (auto) {
        setStatus('auto-submitted');
      }
    },
    [handleRun, locked]
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [handleSubmit]);

  useEffect(() => {
    const onBlur = () => setViolations((prev) => [...prev, { reason: 'Window blur', at: Date.now() }]);
    const onHidden = () => {
      if (document.hidden) {
        setViolations((prev) => [...prev, { reason: 'Tab switch/hidden', at: Date.now() }]);
      }
    };
    const onCopy = () => setViolations((prev) => [...prev, { reason: 'Copy detected', at: Date.now() }]);
    const onPaste = () => setViolations((prev) => [...prev, { reason: 'Paste detected', at: Date.now() }]);

    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onHidden);
    document.addEventListener('copy', onCopy);
    document.addEventListener('paste', onPaste);

    return () => {
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onHidden);
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('paste', onPaste);
    };
  }, []);

  useEffect(() => {
    if (locked) return undefined;
    if (violations.length >= MAX_VIOLATIONS) {
      handleSubmit(true);
    }
  }, [violations, locked, handleSubmit]);

  useEffect(() => () => terminateWorker(), [terminateWorker]);

  const handleReset = () => {
    if (locked) return;
    setCode(STARTER_CODE);
    setLogs('');
    setErrors([]);
    setTestResults([]);
    setStatus('idle');
  };

  const copyShareLink = async () => {
    const url = `${window.location.origin}/#/coding-test`;
    try {
      await navigator.clipboard.writeText(url);
      setShareStatus('Link copied');
    } catch (err) {
      setShareStatus('Copy failed');
    } finally {
      setTimeout(() => setShareStatus(null), 1800);
    }
  };

  const allPassed = useMemo(
    () =>
      testResults.length > 0 &&
      testResults.every((r) => normalizeOutput(r.output) === normalizeOutput(r.expected)),
    [testResults]
  );

  const statusLabel = useMemo(() => {
    switch (status) {
      case 'running':
        return 'Running...';
      case 'success':
        return 'All tests passed';
      case 'partial':
        return 'Partial pass';
      case 'timeout':
        return 'Time limit exceeded';
      case 'error':
        return 'Runtime/Syntax error';
      case 'auto-submitted':
        return 'Auto-submitted';
      default:
        return 'Idle';
    }
  }, [status]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 py-10 px-4 sm:px-6 lg:px-10">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm font-semibold">
              <ShieldCheck size={16} /> JavaScript Only · Browser Sandboxed
            </div>
            <h1 className="mt-3 text-3xl sm:text-4xl font-bold text-slate-900">Coding Test (JS)</h1>
            <p className="text-slate-600 mt-1 text-sm sm:text-base">
              Runs fully in your browser using a secure Web Worker sandbox. Use readInput() to read the provided test input.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white shadow-sm border border-slate-200">
              <TimerIcon size={18} className="text-indigo-600" />
              <span className="font-semibold text-slate-800">{formatSeconds(timer)}</span>
            </div>
            <button
              onClick={copyShareLink}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold shadow hover:bg-indigo-700"
            >
              <Copy size={16} /> Share Test Link
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Status</p>
              <p className="text-lg font-semibold text-slate-900">{statusLabel}</p>
            </div>
            <TerminalSquare className="text-indigo-500" />
          </div>
          <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Violations</p>
              <p className="text-lg font-semibold text-slate-900">{violations.length} / {MAX_VIOLATIONS}</p>
            </div>
            <EyeOff className="text-amber-500" />
          </div>
          <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Result</p>
              <p className={`text-lg font-semibold ${allPassed ? 'text-emerald-600' : 'text-slate-900'}`}>
                {testResults.length ? `${testResults.filter((r) => r.pass).length}/${DEFAULT_TEST_CASES.length} Passed` : 'Not evaluated'}
              </p>
            </div>
            {allPassed ? <CheckCircle className="text-emerald-500" /> : <AlertTriangle className="text-amber-500" />}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 sm:p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase font-semibold text-slate-500">Editor</p>
                <p className="text-sm text-slate-600">JavaScript only · Uses textarea fallback (Monaco optional)</p>
              </div>
              {locked && (
                <div className="flex items-center gap-2 text-rose-600 font-semibold">
                  <Lock size={16} /> Locked
                </div>
              )}
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-96 font-mono text-sm bg-slate-900 text-slate-50 rounded-lg p-3 outline-none border border-slate-800 shadow-inner"
              spellCheck={false}
              disabled={locked}
            />
            <div className="flex flex-wrap gap-3 justify-between items-center">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Code2 size={14} /> Use readInput() to access test input. console.log for output.
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleRun(false)}
                  disabled={locked || status === 'running'}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold shadow hover:bg-indigo-700 disabled:opacity-60"
                >
                  <Play size={16} /> Run
                </button>
                <button
                  onClick={handleReset}
                  disabled={locked}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 text-slate-800 text-sm font-semibold border border-slate-200 hover:bg-slate-200 disabled:opacity-60"
                >
                  <RotateCcw size={16} /> Reset
                </button>
                <button
                  onClick={() => handleSubmit(false)}
                  disabled={locked || status === 'running'}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold shadow hover:bg-emerald-700 disabled:opacity-60"
                >
                  Submit & Lock
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-slate-800">Test Cases</p>
                <span className="text-xs text-slate-500">Time limit: 2s (per run)</span>
              </div>
              <div className="space-y-2">
                {DEFAULT_TEST_CASES.map((tc, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <p className="text-xs text-slate-500">Input</p>
                    <p className="font-mono text-sm text-slate-800">{tc.input}</p>
                    <p className="text-xs text-slate-500 mt-1">Expected Output</p>
                    <p className="font-mono text-sm text-emerald-700">{tc.expected}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
              <p className="text-sm font-semibold text-slate-800 mb-2">Output Console</p>
              <pre className="bg-slate-900 text-slate-50 rounded-lg p-3 text-xs h-32 overflow-auto">
                {logs || 'Run the code to see output'}
              </pre>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
              <p className="text-sm font-semibold text-slate-800 mb-2">Errors</p>
              {errors.length === 0 ? (
                <p className="text-xs text-emerald-600">No errors detected.</p>
              ) : (
                <ul className="list-disc list-inside text-xs text-rose-600 space-y-1">
                  {errors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-slate-800">Anti-cheat log</p>
                <span className="text-xs text-slate-500">Auto-submit after {MAX_VIOLATIONS} violations</span>
              </div>
              {violations.length === 0 ? (
                <p className="text-xs text-slate-500">No violations detected.</p>
              ) : (
                <ul className="text-xs text-amber-700 space-y-1">
                  {violations.map((v, idx) => (
                    <li key={idx}>{new Date(v.at).toLocaleTimeString()} - {v.reason}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
              <p className="text-sm font-semibold text-slate-800 mb-2">Share</p>
              <p className="text-xs text-slate-600 mb-2">Send this link to candidates. Execution stays fully client-side.</p>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={`${window.location.origin}/#/coding-test`}
                  className="flex-1 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700"
                />
                <button
                  onClick={copyShareLink}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
                >
                  <Copy size={14} /> Copy
                </button>
              </div>
              {shareStatus && <p className="text-xs text-slate-500 mt-2">{shareStatus}</p>}
            </div>
          </div>
        </div>

        {testResults.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-800">Evaluation</p>
              <p className="text-xs text-slate-500">PASS/FAIL based on normalized output</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {testResults.map((res, idx) => (
                <div key={idx} className={`p-3 rounded-lg border ${res.pass ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-slate-800">Test {idx + 1}</span>
                    <span className={`text-xs font-semibold ${res.pass ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {res.pass ? 'PASS' : 'FAIL'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">Expected: <span className="font-mono text-slate-800">{res.expected}</span></p>
                  <p className="text-xs text-slate-600">Output: <span className="font-mono text-slate-800">{res.output || '—'}</span></p>
                  {res.error && (
                    <p className="text-xs text-rose-700 mt-1">Error: {res.error}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodingTest;
