import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Clock, Play, RefreshCw, AlertTriangle, CheckCircle, Loader } from 'lucide-react';
import {
  getPublicCodingTest,
  submitCodingTestResponse,
  checkCodingRollNoExists,
} from '../services/codingTestService';
import { JS_SANDBOX_WORKER_SOURCE } from '../workers/jsSandboxSource';
import QueuedSubmissions from '../components/QueuedSubmissions';

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const createWorker = () => {
  const blob = new Blob([JS_SANDBOX_WORKER_SOURCE], { type: 'application/javascript' });
  const url = URL.createObjectURL(blob);
  const worker = new Worker(url, { type: 'module' });
  return { worker, url };
};

const CodingTestTake = ({ codingTestId }) => {
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [codes, setCodes] = useState({});
  const [results, setResults] = useState({});
  const [logs, setLogs] = useState({});
  const [violations, setViolations] = useState(0);
  const [fullscreenViolations, setFullscreenViolations] = useState(0);
  const [splitViolations, setSplitViolations] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [startedAt, setStartedAt] = useState(null);
  const [participantName, setParticipantName] = useState('');
  const [participantClass, setParticipantClass] = useState('');
  const [participantRollNo, setParticipantRollNo] = useState('');
  const [rollNoError, setRollNoError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [scheduledInfo, setScheduledInfo] = useState(null);
  const [scheduledTimeLeft, setScheduledTimeLeft] = useState(null);

  const timerRef = useRef(null);
  const tabSwitchRef = useRef(0);
  const fullscreenRef = useRef(0);
  const splitRef = useRef(0);

  useEffect(() => {
    let mounted = true;
    const fetchTest = async () => {
      setLoading(true);
      try {
        const data = await getPublicCodingTest(codingTestId);
        if (!mounted) return;
        setTest(data);
        setCodes(
          (data.questions || []).reduce((acc, q) => {
            acc[q._id] = q.starterCode || '';
            return acc;
          }, {})
        );
        if (data.settings?.timeLimit > 0) {
          setTimeLeft(data.settings.timeLimit * 60);
        }
      } catch (err) {
        if (err?.data?.isScheduled && err?.data?.startAt) {
          const info = err.data;
          setScheduledInfo(info);
          const start = new Date(info.startAt);
          const diff = Math.max(0, Math.floor((start - new Date()) / 1000));
          setScheduledTimeLeft(diff);
        } else {
          setError(err?.message || 'Failed to load test');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchTest();
    return () => {
      mounted = false;
      clearInterval(timerRef.current || undefined);
    };
  }, [codingTestId]);

  // Scheduled countdown
  useEffect(() => {
    if (!scheduledInfo) return;
    const start = new Date(scheduledInfo.startAt);
    const iv = setInterval(async () => {
      const diff = Math.max(0, Math.floor((start - new Date()) / 1000));
      setScheduledTimeLeft(diff);
      if (diff <= 0) {
        clearInterval(iv);
        try {
          const data = await getPublicCodingTest(codingTestId);
          setScheduledInfo(null);
          setTest(data);
          setCodes((data.questions || []).reduce((acc, q) => { acc[q._id] = q.starterCode || ''; return acc; }, {}));
          if (data.settings?.timeLimit > 0) setTimeLeft(data.settings.timeLimit * 60);
        } catch (_) {}
      }
    }, 1000);
    return () => clearInterval(iv);
  }, [scheduledInfo, codingTestId]);

  // Visibility change handler (tab switch)
  useEffect(() => {
    const handleVisibility = () => {
      if (!hasStarted || submitted || !test?.settings?.tabSwitchingEnabled) return;
      if (document.hidden) {
        tabSwitchRef.current += 1;
        setViolations(tabSwitchRef.current);
        if (tabSwitchRef.current >= 3) {
          handleSubmit(true, true, false, false);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [hasStarted, submitted, test]);

  // Fullscreen enforcement
  const checkFullscreen = useCallback(() => !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement), []);

  useEffect(() => {
    if (!hasStarted || submitted || !test?.settings?.fullscreenModeEnabled) return;
    const onChange = () => {
      const inFs = checkFullscreen();
      if (!inFs) {
        fullscreenRef.current += 1;
        setFullscreenViolations(fullscreenRef.current);
        if (fullscreenRef.current >= 3) {
          handleSubmit(true, false, true, false);
        }
      }
    };
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('webkitfullscreenchange', onChange);
    document.addEventListener('msfullscreenchange', onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.removeEventListener('webkitfullscreenchange', onChange);
      document.removeEventListener('msfullscreenchange', onChange);
    };
  }, [hasStarted, submitted, test, checkFullscreen]);

  // Split screen detection (basic resize heuristic)
  useEffect(() => {
    if (!hasStarted || submitted || !test?.settings?.fullscreenModeEnabled) return;
    const initial = { w: window.innerWidth, h: window.innerHeight };
    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const ratioW = w / window.screen.availWidth;
      const ratioH = h / window.screen.availHeight;
      const shrunk = w < initial.w * 0.7 || h < initial.h * 0.7;
      if (ratioW < 0.75 || ratioH < 0.75 || shrunk) {
        splitRef.current += 1;
        setSplitViolations(splitRef.current);
        if (splitRef.current >= 3) {
          handleSubmit(true, false, false, true);
        }
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [hasStarted, submitted, test]);

  // Timer countdown
  useEffect(() => {
    if (!timeLeft || !hasStarted || submitted) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null) return prev;
        if (prev <= 1) {
          clearInterval(timerRef.current || undefined);
          handleSubmit(true, false, false, false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current || undefined);
  }, [timeLeft, hasStarted, submitted]);

  const runTests = async (question) => {
    const code = codes[question._id] || '';
    const tests = (question.testCases || []).map((t) => ({ input: t.input, expected: t.expectedOutput }));
    const { worker, url } = createWorker();
    return new Promise((resolve) => {
      worker.onmessage = (event) => {
        URL.revokeObjectURL(url);
        const data = event.data || {};
        resolve({ logs: data.logs || [], errors: data.errors || [], results: data.results || [] });
      };
      worker.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({ logs: [], errors: ['Worker error'], results: [] });
      };
      worker.postMessage({ type: 'run', code, testCases: tests, timeLimitMs: question.timeLimitMs || 2000 });
    });
  };

  const handleRun = async (question) => {
    const { logs: l, errors: e, results: r } = await runTests(question);
    setLogs((prev) => ({ ...prev, [question._id]: l.join('\n') }));
    setResults((prev) => ({ ...prev, [question._id]: r.map((res, idx) => ({ ...res, input: question.testCases[idx]?.input || '' })) }));
    if (e?.length) {
      setError(e.join('\n'));
    } else {
      setError('');
    }
  };

  const handleSubmit = async (
    autoSubmit = false,
    dueToTab = false,
    dueToFullscreen = false,
    dueToSplit = false
  ) => {
    if (submitted) return;
    if (!autoSubmit && !window.confirm('Submit your coding test?')) return;
    setSubmitting(true);

    // Evaluate all questions once before submit if not already
    for (const q of test.questions) {
      if (!results[q._id]) {
        await handleRun(q);
      }
    }

    const payload = {
      participantName: participantName || 'Anonymous',
      participantClass,
      participantRollNo,
      timeTaken: timeLeft ? (test.settings?.timeLimit * 60 - timeLeft) : null,
      startedAt: startedAt || new Date(),
      autoSubmittedDueToTabSwitch: dueToTab,
      autoSubmittedDueToFullscreenExit: dueToFullscreen,
      autoSubmittedDueToSplitScreen: dueToSplit,
      submissions: test.questions.map((q) => {
        const resList = results[q._id] || [];
        const passedCount = resList.filter((r) => r.pass).length;
        return {
          questionId: q._id,
          code: codes[q._id] || '',
          passedCount,
          totalTests: resList.length,
          results: resList.map((r, idx) => ({
            input: r.input || q.testCases[idx]?.input || '',
            expected: r.expected || q.testCases[idx]?.expectedOutput || '',
            output: r.output || '',
            pass: !!r.pass,
            error: r.error || null,
          })),
        };
      }),
    };

    try {
      const resp = await submitCodingTestResponse(codingTestId, payload);
      setSubmissionResult(resp);
      setSubmitted(true);
    } catch (err) {
      setError(err?.message || 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStart = async () => {
    if (test.settings?.preventDuplicateRollNo && participantRollNo) {
      try {
        const res = await checkCodingRollNoExists(codingTestId, participantRollNo.trim());
        if (res.exists) {
          setRollNoError(res.message || 'Roll number already used');
          return;
        }
        setRollNoError('');
      } catch (_) {
        // ignore
      }
    }
    setHasStarted(true);
    setStartedAt(new Date());
    if (test.settings?.fullscreenModeEnabled && document.documentElement.requestFullscreen) {
      try { await document.documentElement.requestFullscreen(); } catch (_) { /* ignore */ }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader className="animate-spin text-emerald-600" size={48} />
      </div>
    );
  }

  if (scheduledInfo && scheduledTimeLeft !== null) {
    return (
      <div className="max-w-xl mx-auto p-6 mt-10 bg-white rounded-xl shadow">
        <h1 className="text-xl font-bold text-gray-800 mb-2">This coding test is scheduled</h1>
        <p className="text-gray-600">Starts at: {new Date(scheduledInfo.startAt).toLocaleString()}</p>
        <p className="text-emerald-600 font-semibold mt-2">Starts in {formatTime(scheduledTimeLeft)}</p>
      </div>
    );
  }

  if (error && !test) {
    return (
      <div className="max-w-xl mx-auto p-6 mt-10 bg-red-50 border border-red-200 rounded-xl">
        <h1 className="text-xl font-bold text-red-700 mb-2">Error</h1>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!test) return null;

  if (submitted) {
    return (
      <div className="max-w-3xl mx-auto p-6 mt-8 bg-white rounded-xl shadow">
        <h1 className="text-2xl font-bold text-emerald-700 mb-2">Submission received</h1>
        {submissionResult ? (
          <p className="text-gray-700">Score: {submissionResult.score}/{submissionResult.totalPoints} ({submissionResult.percentage}%)</p>
        ) : null}
        <QueuedSubmissions />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-emerald-800">{test.title}</h1>
          <p className="text-gray-600">{test.description}</p>
        </div>
        {test.settings?.timeLimit > 0 && (
          <div className="flex items-center gap-2 bg-white shadow px-3 py-2 rounded-lg border">
            <Clock size={18} className="text-emerald-600" />
            <span className="font-semibold text-gray-800">{hasStarted ? formatTime(timeLeft || 0) : `${test.settings.timeLimit} min`}</span>
          </div>
        )}
      </div>

      {!hasStarted ? (
        <div className="bg-white rounded-xl shadow border p-4 space-y-3">
          <p className="text-sm text-gray-700">Enter your details to begin. Anti-cheat: tab switching and fullscreen exits will auto-submit after 3 violations.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input value={participantName} onChange={(e) => setParticipantName(e.target.value)} className="border rounded-lg p-2" placeholder="Name (optional)" />
            <input value={participantClass} onChange={(e) => setParticipantClass(e.target.value)} className="border rounded-lg p-2" placeholder="Class/Section" />
            <input value={participantRollNo} onChange={(e) => setParticipantRollNo(e.target.value)} className="border rounded-lg p-2" placeholder="Roll No" />
          </div>
          {rollNoError && <p className="text-sm text-red-600">{rollNoError}</p>}
          <button onClick={handleStart} className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
            <Play size={16} /> Start Test
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            <div className="bg-white border rounded-lg p-3">
              <p className="text-sm text-gray-600">Tab switches</p>
              <p className={`text-lg font-bold ${violations >= 3 ? 'text-red-600' : 'text-emerald-700'}`}>{violations} / 3</p>
            </div>
            <div className="bg-white border rounded-lg p-3">
              <p className="text-sm text-gray-600">Fullscreen exits</p>
              <p className={`text-lg font-bold ${fullscreenViolations >= 3 ? 'text-red-600' : 'text-emerald-700'}`}>{fullscreenViolations} / 3</p>
            </div>
            <div className="bg-white border rounded-lg p-3">
              <p className="text-sm text-gray-600">Split-screen</p>
              <p className={`text-lg font-bold ${splitViolations >= 3 ? 'text-red-600' : 'text-emerald-700'}`}>{splitViolations} / 3</p>
            </div>
          </div>

          <div className="space-y-6">
            {test.questions.map((q, idx) => {
              const qResults = results[q._id] || [];
              const allPass = qResults.length > 0 && qResults.every((r) => r.pass);
              return (
                <div key={q._id} className="bg-white rounded-xl shadow border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-gray-800">Q{idx + 1}. {q.title}</div>
                    {allPass ? (
                      <span className="flex items-center text-emerald-600 text-sm font-semibold"><CheckCircle size={16} className="mr-1" /> All tests passed</span>
                    ) : null}
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{q.prompt}</p>
                  <div className="text-xs text-gray-600 bg-gray-50 border rounded p-3">
                    <p className="font-semibold mb-1">Test Cases</p>
                    {(q.testCases || []).map((tc, i) => (
                      <div key={i} className="flex flex-col md:flex-row md:items-center md:gap-3 py-1 border-b last:border-0 border-gray-200">
                        <span className="text-gray-500">#{i + 1}</span>
                        <span className="font-mono text-gray-800">Input: {tc.input}</span>
                        {test.settings?.showExpectedOutputs !== false && (
                          <span className="font-mono text-emerald-700">Expected: {tc.expectedOutput}</span>
                        )}
                      </div>
                    ))}
                  </div>
                  <textarea
                    value={codes[q._id] || ''}
                    onChange={(e) => setCodes({ ...codes, [q._id]: e.target.value })}
                    className="w-full h-48 font-mono text-sm bg-slate-900 text-slate-50 rounded-lg p-3"
                    spellCheck={false}
                  />
                  <div className="flex gap-2">
                    <button onClick={() => handleRun(q)} className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg">
                      <RefreshCw size={16} /> Run Tests
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-slate-900 text-slate-50 rounded-lg p-3 text-xs h-32 overflow-auto">
                      <p className="text-emerald-300 mb-1">Logs</p>
                      <pre className="whitespace-pre-wrap">{logs[q._id] || 'Run to see logs'}</pre>
                    </div>
                    <div className="bg-white border rounded-lg p-3 text-xs h-32 overflow-auto">
                      <p className="text-gray-700 font-semibold mb-1">Results</p>
                      {qResults.length === 0 ? 'Not run yet' : qResults.map((r, i) => (
                        <div key={i} className={`flex items-center justify-between border-b last:border-0 py-1 ${r.pass ? 'text-emerald-700' : 'text-red-600'}`}>
                          <span>Test {i + 1}</span>
                          <span>{r.pass ? 'PASS' : 'FAIL'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex justify-end">
            <button onClick={() => handleSubmit(false, false, false, false)} disabled={submitting} className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800">
              {submitting ? <Loader size={16} className="animate-spin" /> : <Play size={16} />}
              Submit Test
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CodingTestTake;
