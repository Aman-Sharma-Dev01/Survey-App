import React, { useState, useEffect, useRef, useCallback } from 'react';
import QueuedSubmissions from '../components/QueuedSubmissions';
import { Clock, CheckCircle, XCircle, AlertCircle, ChevronRight, AlertTriangle, Maximize, RefreshCw } from 'lucide-react';
import { getPublicQuiz, submitQuizResponse, checkRollNoExists } from '../services/quizService';

// Shuffle array helper with seed for consistency
const shuffleArray = (array, seed = null) => {
    const arr = [...array];
    // If seed provided, use seeded shuffle for consistency
    if (seed) {
        const seededRandom = (s) => {
            const x = Math.sin(s++) * 10000;
            return x - Math.floor(x);
        };
        let seedNum = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(seededRandom(seedNum + i) * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    } else {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }
    return arr;
};

// Helper to generate storage key for quiz state
const getQuizStorageKey = (quizId, rollNo) => `quiz_state_${quizId}_${rollNo}`;

// Helper to save quiz state to localStorage
const saveQuizState = (quizId, rollNo, state) => {
    try {
        const key = getQuizStorageKey(quizId, rollNo);
        localStorage.setItem(key, JSON.stringify({
            ...state,
            savedAt: new Date().toISOString()
        }));
    } catch (err) {
        console.error('Failed to save quiz state:', err);
    }
};

// Helper to load quiz state from localStorage
const loadQuizState = (quizId, rollNo) => {
    try {
        const key = getQuizStorageKey(quizId, rollNo);
        const saved = localStorage.getItem(key);
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (err) {
        console.error('Failed to load quiz state:', err);
    }
    return null;
};

// Helper to clear quiz state from localStorage
const clearQuizState = (quizId, rollNo) => {
    try {
        const key = getQuizStorageKey(quizId, rollNo);
        localStorage.removeItem(key);
    } catch (err) {
        console.error('Failed to clear quiz state:', err);
    }
};

const QuizTakePage = ({ quizId }) => {
    const [quiz, setQuiz] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [scheduledInfo, setScheduledInfo] = useState(null);
    const [scheduledTimeLeft, setScheduledTimeLeft] = useState(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [results, setResults] = useState(null);
    const [timeLeft, setTimeLeft] = useState(null);
    const [startedAt, setStartedAt] = useState(new Date());
    const [participantName, setParticipantName] = useState('');
    const [participantClass, setParticipantClass] = useState('');
    const [participantRollNo, setParticipantRollNo] = useState('');
    const [hasStarted, setHasStarted] = useState(false);
    const [agreedToGuidelines, setAgreedToGuidelines] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);
    const [rollNoError, setRollNoError] = useState('');
    const [checkingRollNo, setCheckingRollNo] = useState(false);
    
    // Session restore state
    const [restoredSession, setRestoredSession] = useState(null);
    const [showResumePrompt, setShowResumePrompt] = useState(false);
    
    // Tab switch detection
    const [tabSwitchCount, setTabSwitchCount] = useState(0);
    const [showTabWarning, setShowTabWarning] = useState(false);
    const tabSwitchRef = useRef(0);

    // Fullscreen mode detection
    const [fullscreenExitCount, setFullscreenExitCount] = useState(0);
    const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const fullscreenExitRef = useRef(0);

    // Split screen / window resize detection
    const [initialViewport, setInitialViewport] = useState(null);
    const [splitScreenCount, setSplitScreenCount] = useState(0);
    const [showSplitScreenWarning, setShowSplitScreenWarning] = useState(false);
    const splitScreenRef = useRef(0);

    const timerRef = useRef(null);

    // Fetch quiz and handle visibility/tab-switch enforcement
    useEffect(() => {
        let isMounted = true;
        const fetchQuiz = async () => {
            setLoading(true);
            try {
                const data = await getPublicQuiz(quizId);
                if (!isMounted) return;
                setQuiz(data);
                setQuestions(data.questions);
                if (data.settings?.timeLimit > 0) {
                    setTimeLeft(data.settings.timeLimit * 60);
                }
            } catch (err) {
                // If server returned scheduling info, store structured info and compute time left
                if (err?.data && err.data.isScheduled && err.data.startAt) {
                    const startAt = err.data.startAt;
                    const endAt = err.data.endAt;
                    const tz = err.data.timeZone;
                    setScheduledInfo({ startAt, endAt, timeZone: tz });
                    const start = new Date(startAt);
                    const now = new Date();
                    const diffSeconds = Math.max(0, Math.floor((start - now) / 1000));
                    setScheduledTimeLeft(diffSeconds);
                } else {
                    setError(err?.message || 'Failed to load quiz');
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchQuiz();

        // Visibility change handler for tab-switch detection
        const handleVisibilityChange = () => {
            if (!hasStarted || isSubmitted || !quiz?.settings?.tabSwitchingEnabled) return;
            if (document.hidden) {
                tabSwitchRef.current += 1;
                setTabSwitchCount(tabSwitchRef.current);
                setShowTabWarning(true);
                if (tabSwitchRef.current >= 3) {
                    handleSubmit(true, true, false);
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            isMounted = false;
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [quizId, hasStarted, isSubmitted, quiz?.settings?.tabSwitchingEnabled]);

    // Countdown for scheduled quizzes — updates every second and refetches when start time arrives
    useEffect(() => {
        if (!scheduledInfo) return;

        const start = new Date(scheduledInfo.startAt);
        const now = new Date();
        const initial = Math.max(0, Math.floor((start - now) / 1000));
        setScheduledTimeLeft(initial);

        const iv = setInterval(() => {
            setScheduledTimeLeft(prev => {
                const next = (prev || 0) - 1;
                if (next <= 0) {
                    clearInterval(iv);
                    // refetch quiz when scheduled time arrives
                    (async () => {
                        try {
                            const data = await getPublicQuiz(quizId);
                            setScheduledInfo(null);
                            setQuiz(data);
                            setQuestions(data.questions || []);
                            if (data.settings?.timeLimit) setTimeLeft(data.settings.timeLimit * 60);
                        } catch (e) {
                            // ignore - fetchQuiz useEffect will handle further
                        }
                    })();
                    return 0;
                }
                return next;
            });
        }, 1000);

        return () => clearInterval(iv);
    }, [scheduledInfo, quizId]);

    // Fullscreen utility functions
    const enterFullscreen = useCallback(async () => {
        try {
            const elem = document.documentElement;
            if (elem.requestFullscreen) {
                await elem.requestFullscreen();
            } else if (elem.webkitRequestFullscreen) {
                await elem.webkitRequestFullscreen();
            } else if (elem.msRequestFullscreen) {
                await elem.msRequestFullscreen();
            }
            setIsFullscreen(true);
        } catch (err) {
            console.error('Failed to enter fullscreen:', err);
        }
    }, []);

    const checkFullscreen = useCallback(() => {
        return !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
    }, []);

    // Fullscreen mode enforcement - only if enabled in quiz settings
    useEffect(() => {
        if (!hasStarted || isSubmitted || !quiz?.settings?.fullscreenModeEnabled) return;

        const handleFullscreenChange = () => {
            const isCurrentlyFullscreen = checkFullscreen();
            setIsFullscreen(isCurrentlyFullscreen);

            if (!isCurrentlyFullscreen && hasStarted && !isSubmitted) {
                // User exited fullscreen
                fullscreenExitRef.current += 1;
                setFullscreenExitCount(fullscreenExitRef.current);

                if (fullscreenExitRef.current >= 3) {
                    // Auto-submit after 3 fullscreen exits
                    setShowFullscreenWarning(false);
                    handleSubmit(true, false, true); // autoSubmit=true, dueToTabSwitch=false, dueToFullscreenExit=true
                } else {
                    // Show warning and prompt to re-enter fullscreen
                    setShowFullscreenWarning(true);
                }
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('msfullscreenchange', handleFullscreenChange);

        // Also detect escape key press which might exit fullscreen
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && checkFullscreen()) {
                e.preventDefault();
            }
        };
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('msfullscreenchange', handleFullscreenChange);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [hasStarted, isSubmitted, quiz?.settings?.fullscreenModeEnabled, checkFullscreen]);

    // Split screen / window resize detection - only if fullscreen mode is enabled
    useEffect(() => {
        if (!hasStarted || isSubmitted || !quiz?.settings?.fullscreenModeEnabled) return;

        // Capture initial viewport when quiz starts
        if (!initialViewport) {
            setInitialViewport({
                width: window.innerWidth,
                height: window.innerHeight,
                screenWidth: window.screen.availWidth,
                screenHeight: window.screen.availHeight
            });
        }

        // Debounce flag to prevent multiple rapid detections
        let isProcessingViolation = false;
        let lastViolationTime = 0;

        const handleResize = () => {
            if (!initialViewport) return;
            
            // Debounce: only process once every 3 seconds
            const now = Date.now();
            if (isProcessingViolation || (now - lastViolationTime) < 3000) {
                return;
            }

            const currentWidth = window.innerWidth;
            const currentHeight = window.innerHeight;
            
            // Calculate the ratio of current size to initial/screen size
            const widthRatio = currentWidth / initialViewport.screenWidth;
            const heightRatio = currentHeight / initialViewport.screenHeight;
            
            // Detect split screen: if window takes less than 75% of screen width OR height
            // This catches horizontal split, vertical split, and picture-in-picture modes
            const isSplitScreen = widthRatio < 0.75 || heightRatio < 0.75;
            
            // Also detect significant window shrinking from initial size (more than 30% reduction)
            const shrunkFromInitial = (currentWidth < initialViewport.width * 0.7) || 
                                       (currentHeight < initialViewport.height * 0.7);

            if (isSplitScreen || shrunkFromInitial) {
                isProcessingViolation = true;
                lastViolationTime = now;
                
                splitScreenRef.current += 1;
                setSplitScreenCount(splitScreenRef.current);

                if (splitScreenRef.current >= 3) {
                    // Auto-submit after 3 split screen attempts
                    setShowSplitScreenWarning(false);
                    handleSubmit(true, false, false, true); // autoSubmit=true, dueToSplitScreen=true
                } else {
                    // Show warning
                    setShowSplitScreenWarning(true);
                }
                
                // Reset processing flag after delay
                setTimeout(() => {
                    isProcessingViolation = false;
                }, 3000);
            }
        };

        // Check periodically for split screen (some devices don't fire resize on split)
        const resizeInterval = setInterval(() => {
            if (initialViewport && !showSplitScreenWarning && !isProcessingViolation) {
                const currentWidth = window.innerWidth;
                const widthRatio = currentWidth / initialViewport.screenWidth;
                
                // Only check if window is significantly smaller than screen
                if (widthRatio < 0.75) {
                    handleResize();
                }
            }
        }, 5000); // Check every 5 seconds instead of 2

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            clearInterval(resizeInterval);
        };
    }, [hasStarted, isSubmitted, quiz?.settings?.fullscreenModeEnabled, initialViewport, showSplitScreenWarning]);

    // Capture initial viewport when starting the quiz
    useEffect(() => {
        if (hasStarted && !initialViewport && quiz?.settings?.fullscreenModeEnabled) {
            // Small delay to ensure fullscreen is active
            setTimeout(() => {
                setInitialViewport({
                    width: window.innerWidth,
                    height: window.innerHeight,
                    screenWidth: window.screen.availWidth,
                    screenHeight: window.screen.availHeight
                });
            }, 500);
        }
    }, [hasStarted, initialViewport, quiz?.settings?.fullscreenModeEnabled]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleOptionSelect = (questionId, optionText, isMultiple) => {
        setAnswers(prev => {
            const current = prev[questionId] || [];
            if (isMultiple) {
                // Toggle selection for multiple choice
                if (current.includes(optionText)) {
                    return { ...prev, [questionId]: current.filter(o => o !== optionText) };
                } else {
                    return { ...prev, [questionId]: [...current, optionText] };
                }
            } else {
                // Single selection
                return { ...prev, [questionId]: [optionText] };
            }
        });
    };

    const handleSubmit = async (autoSubmit = false, dueToTabSwitch = false, dueToFullscreenExit = false, dueToSplitScreen = false) => {
        if (!autoSubmit && !window.confirm('Submit your quiz? You cannot change answers after submission.')) {
            return;
        }

        // Exit fullscreen before submitting
        if (checkFullscreen()) {
            try {
                if (document.exitFullscreen) {
                    await document.exitFullscreen();
                } else if (document.webkitExitFullscreen) {
                    await document.webkitExitFullscreen();
                } else if (document.msExitFullscreen) {
                    await document.msExitFullscreen();
                }
            } catch (err) {
                console.error('Failed to exit fullscreen:', err);
            }
        }

        clearInterval(timerRef.current);
        setLoading(true);

        try {
            const formattedAnswers = questions.map(q => ({
                questionId: q._id,
                selectedOptions: answers[q._id] || []
            }));

            const timeTaken = Math.floor((new Date() - startedAt) / 1000);

            const result = await submitQuizResponse(quizId, {
                answers: formattedAnswers,
                participantName: participantName || 'Anonymous',
                participantClass: participantClass || '',
                participantRollNo: participantRollNo || '',
                timeTaken,
                startedAt: startedAt.toISOString(),
                autoSubmittedDueToTabSwitch: dueToTabSwitch,
                autoSubmittedDueToFullscreenExit: dueToFullscreenExit,
                autoSubmittedDueToSplitScreen: dueToSplitScreen
            });
            // If the request was queued for offline sync, show queued UI
            if (result && result.queued) {
                setResults({ queued: true, id: result.id, queuedAt: Date.now() });
                setIsSubmitted(true);
                // Do NOT clear saved state yet; it will be cleared after server confirms sync
            } else {
                setResults(result);
                setIsSubmitted(true);
                // Clear saved state after successful submission
                if (participantRollNo) {
                    clearQuizState(quizId, participantRollNo);
                }
            }
        } catch (err) {
            setError(err.message || 'Failed to submit quiz');
        } finally {
            setLoading(false);
        }
    };

    // Function to process questions with shuffling
    const processQuestions = (quizData, savedOrder = null) => {
        let processedQuestions = quizData.questions;
        
        if (savedOrder && savedOrder.length > 0) {
            // Restore saved question order
            const orderMap = new Map(savedOrder.map((id, idx) => [id, idx]));
            processedQuestions = [...processedQuestions].sort((a, b) => 
                (orderMap.get(a._id) ?? 999) - (orderMap.get(b._id) ?? 999)
            );
        } else if (quizData.settings?.shuffleQuestions) {
            // Shuffle with seed for new session
            const seed = participantRollNo || Date.now().toString();
            processedQuestions = shuffleArray(processedQuestions, seed);
        }
        
        if (quizData.settings?.shuffleOptions && !savedOrder) {
            // Only shuffle options for new sessions
            const seed = participantRollNo || Date.now().toString();
            processedQuestions = processedQuestions.map((q, idx) => ({
                ...q,
                options: shuffleArray(q.options, seed + idx)
            }));
        }
        
        return processedQuestions;
    };

    // Function to resume from saved session
    const resumeSession = () => {
        if (!restoredSession) return;
        
        // Restore all state from saved session
        setAnswers(restoredSession.answers || {});
        setCurrentIndex(restoredSession.currentIndex || 0);
        setTimeLeft(restoredSession.timeLeft);
        setStartedAt(new Date(restoredSession.startedAt));
        setParticipantName(restoredSession.participantName || '');
        setParticipantClass(restoredSession.participantClass || '');
        
        // Restore violation counts
        tabSwitchRef.current = restoredSession.tabSwitchCount || 0;
        setTabSwitchCount(restoredSession.tabSwitchCount || 0);
        fullscreenExitRef.current = restoredSession.fullscreenExitCount || 0;
        setFullscreenExitCount(restoredSession.fullscreenExitCount || 0);
        splitScreenRef.current = restoredSession.splitScreenCount || 0;
        setSplitScreenCount(restoredSession.splitScreenCount || 0);
        
        // Process questions with saved order
        const processedQuestions = processQuestions(quiz, restoredSession.questionsOrder);
        setQuestions(processedQuestions);
        
        setShowResumePrompt(false);
        setHasStarted(true);
        
        // Enter fullscreen if required
        if (quiz?.settings?.fullscreenModeEnabled) {
            enterFullscreen();
        }
    };

    // Function to start fresh (discard saved session)
    const startFresh = () => {
        if (participantRollNo) {
            clearQuizState(quizId, participantRollNo);
        }
        setRestoredSession(null);
        setShowResumePrompt(false);
    };

    const currentQuestion = questions[currentIndex];
    const answeredCount = Object.keys(answers).length;
    const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

    if (loading && !quiz) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading quiz...</p>
                </div>
            </div>
        );
    }

    if (scheduledInfo) {
        const start = new Date(scheduledInfo.startAt);
        const end = scheduledInfo.endAt ? new Date(scheduledInfo.endAt) : null;
        const startStr = start.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        const endStr = end ? end.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : null;
        const days = Math.floor((scheduledTimeLeft || 0) / (3600 * 24));
        const hrs = Math.floor(((scheduledTimeLeft || 0) % (3600 * 24)) / 3600);
        const mins = Math.floor(((scheduledTimeLeft || 0) % 3600) / 60);
        const secs = Math.floor((scheduledTimeLeft || 0) % 60);

        return (
            <div className="max-w-2xl mx-auto p-8 mt-10 text-center bg-white rounded-xl shadow-xl">
                <Clock size={48} className="mx-auto text-emerald-600 mb-4" />
                <h2 className="text-2xl font-bold text-emerald-800 mb-2">Scheduled</h2>
                <p className="text-gray-700 mb-3">This quiz is scheduled to start on <strong className="text-emerald-700">{startStr}</strong>.</p>
                {endStr && <p className="text-gray-700 mb-3">It will end on <strong className="text-emerald-700">{endStr}</strong>.</p>}
                <div className="text-2xl font-mono text-emerald-700 mb-4">
                    {scheduledTimeLeft > 0 ? (
                        <span>{days > 0 ? `${days}d ` : ''}{hrs.toString().padStart(2,'0')}:{mins.toString().padStart(2,'0')}:{secs.toString().padStart(2,'0')}</span>
                    ) : (
                        <span>Starting soon...</span>
                    )}
                </div>
                <p className="text-sm text-gray-600">Times shown in your local timezone.</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-xl mx-auto p-10 mt-10 text-center bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-red-700 mb-2">Error</h2>
                <p className="text-red-600">{error}</p>
            </div>
        );
    }

    // Queued Submission Screen
    if (isSubmitted && results && results.queued) {
        return (
            <div className="max-w-2xl mx-auto p-8 mt-10 text-center bg-white rounded-xl shadow-xl">
                <AlertCircle size={48} className="mx-auto text-amber-600 mb-4" />
                <h2 className="text-2xl font-bold text-amber-800 mb-2">Submission Saved Offline</h2>
                <p className="text-gray-700 mb-3">Your quiz has been saved locally and will be submitted automatically when your device is back online.</p>
                <p className="text-sm text-gray-600 mb-4">Reference ID: <span className="font-mono text-gray-800">{results.id}</span></p>
                <div className="mt-6">
                    <button
                        onClick={() => window.location.hash = '#'}
                        className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    // Results Screen
    if (isSubmitted && results) {
        return (
            <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
                <div className={`text-center p-8 rounded-xl shadow-xl mb-6 ${
                    results.passed ? 'bg-emerald-600' : 'bg-red-500'
                } text-white`}>
                    {results.passed ? (
                        <CheckCircle size={64} className="mx-auto mb-4" />
                    ) : (
                        <XCircle size={64} className="mx-auto mb-4" />
                    )}
                    <h1 className="text-3xl font-bold mb-2">
                        {results.passed ? 'Congratulations! You Passed!' : 'Quiz Completed'}
                    </h1>
                    <p className="text-xl opacity-90">
                        Your Score: {results.score} / {results.totalPoints} ({results.percentage}%)
                    </p>
                    {results.timeTaken && (
                        <p className="mt-2 opacity-75">
                            Time taken: {Math.floor(results.timeTaken / 60)}m {results.timeTaken % 60}s
                        </p>
                    )}
                </div>

                {/* Correct Answers Review */}
                {results.correctAnswers && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-gray-800">Review Answers</h2>
                        {results.correctAnswers.map((q, idx) => {
                            const userAnswer = results.gradedAnswers?.find(a => a.questionId === q.questionId);
                            const isCorrect = userAnswer?.isCorrect;
                            
                            return (
                                <div key={q.questionId} className={`p-4 rounded-lg border-2 ${
                                    isCorrect ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'
                                }`}>
                                    <div className="flex items-start justify-between">
                                        <p className="font-medium text-gray-800">
                                            {idx + 1}. {q.questionText}
                                        </p>
                                        {isCorrect ? (
                                            <CheckCircle size={20} className="text-emerald-600 flex-shrink-0" />
                                        ) : (
                                            <XCircle size={20} className="text-red-600 flex-shrink-0" />
                                        )}
                                    </div>
                                    <div className="mt-2 text-sm">
                                        <p className="text-gray-600">
                                            <span className="font-medium">Your answer:</span>{' '}
                                            {userAnswer?.selectedOptions?.join(', ') || 'No answer'}
                                        </p>
                                        <p className="text-emerald-700">
                                            <span className="font-medium">Correct answer:</span>{' '}
                                            {q.correctOptions.join(', ')}
                                        </p>
                                        {q.explanation && (
                                            <p className="mt-2 text-gray-500 italic">{q.explanation}</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="mt-8 text-center">
                    <button
                        onClick={() => window.location.hash = '#'}
                        className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    // Start Screen
    if (!hasStarted) {
        // If user chose to view instructions, show instructions as a standalone page
        if (showInstructions) {
            return (
                <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8">
                    <div className="bg-white rounded-xl shadow-xl p-8 text-left">
                        <h1 className="text-2xl font-bold text-emerald-800 mb-4">{quiz.title} — Instructions</h1>
                        <div className="mb-4">
                            <p className="text-sm text-gray-600 mb-2">Please read the instructions carefully before starting the quiz.</p>
                            <ul className="list-disc list-inside text-sm text-gray-700 space-y-2">
                                <li>Total Questions: <strong className="text-gray-800">{questions.length}</strong></li>
                                <li>Total Points: <strong className="text-gray-800">{quiz.totalPoints}</strong></li>
                                {quiz.settings?.timeLimit > 0 && (
                                    <li>Time Limit: <strong className="text-gray-800">{quiz.settings.timeLimit} minutes</strong></li>
                                )}
                                {quiz.settings?.fullscreenModeEnabled && (
                                    <li>This quiz requires <strong className="text-gray-800">fullscreen</strong>. You will be asked to enter fullscreen before starting.</li>
                                )}
                                {quiz.settings?.tabSwitchingEnabled && (
                                    <li><strong className="text-gray-800">Do not switch tabs</strong> during the quiz. Excessive tab switching may auto-submit the quiz.</li>
                                )}
                                {quiz.settings?.requireSequentialAnswering && (
                                    <li>Questions must be answered in order. You cannot jump ahead until the current question is answered.</li>
                                )}
                                {quiz.settings?.preventDuplicateRollNo && (
                                    <li>Duplicate roll numbers are not allowed. Enter your correct roll number.</li>
                                )}
                                <li>Avoid refreshing the page or using developer tools; right-click and certain shortcuts are disabled.</li>
                                <li>Ensure a stable internet connection for uninterrupted submission.</li>
                            </ul>
                        </div>

                        <label className="flex items-center space-x-3 mb-4">
                            <input
                                type="checkbox"
                                checked={agreedToGuidelines}
                                onChange={(e) => setAgreedToGuidelines(e.target.checked)}
                                className="w-4 h-4"
                            />
                            <span className="text-sm text-gray-700">I have read and agree to the instructions above</span>
                        </label>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowInstructions(false)}
                                className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
                            >
                                Back
                            </button>

                            <button
                                onClick={async () => {
                                    if (!agreedToGuidelines) {
                                        alert('Please agree to the instructions before starting the quiz.');
                                        return;
                                    }

                                    const processedQuestions = processQuestions(quiz);
                                    setQuestions(processedQuestions);

                                    if (quiz?.settings?.fullscreenModeEnabled) {
                                        await enterFullscreen();
                                    }

                                    setHasStarted(true);
                                }}
                                disabled={!agreedToGuidelines}
                                className={`px-6 py-3 rounded-lg font-medium ${!agreedToGuidelines ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                            >
                                {quiz?.settings?.fullscreenModeEnabled ? 'Enter Fullscreen & Start Quiz' : 'Start Quiz'}
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8">
                <div className="bg-white rounded-xl shadow-xl p-8 text-center">
                    <h1 className="text-3xl font-bold text-emerald-800 mb-4">{quiz.title}</h1>
                    {quiz.description && (
                        <p className="text-gray-600 mb-6">{quiz.description}</p>
                    )}
                    
                    <div className="flex justify-center space-x-8 mb-6 text-gray-700">
                        <div>
                            <p className="text-2xl font-bold text-emerald-600">{questions.length}</p>
                            <p className="text-sm">Questions</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-emerald-600">{quiz.totalPoints}</p>
                            <p className="text-sm">Total Points</p>
                        </div>
                        {quiz.settings?.timeLimit > 0 && (
                            <div>
                                <p className="text-2xl font-bold text-emerald-600">{quiz.settings.timeLimit}</p>
                                <p className="text-sm">Minutes</p>
                            </div>
                        )}
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Your Name {quiz.classes && quiz.classes.length > 0 ? <span className="text-red-500">*</span> : '(optional)'}
                        </label>
                        <input
                            type="text"
                            value={participantName}
                            onChange={(e) => setParticipantName(e.target.value)}
                            className={`w-full max-w-xs mx-auto p-3 border rounded-lg text-center ${
                                quiz.classes && quiz.classes.length > 0 && !participantName.trim() 
                                    ? 'border-orange-300' 
                                    : 'border-gray-300'
                            }`}
                            placeholder="Enter your name"
                        />
                    </div>

                    {quiz.classes && quiz.classes.length > 0 && (
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Your Class <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={participantClass}
                                onChange={(e) => setParticipantClass(e.target.value)}
                                className={`w-full max-w-xs mx-auto p-3 border rounded-lg text-center bg-white ${
                                    !participantClass ? 'border-orange-300' : 'border-gray-300'
                                }`}
                            >
                                <option value="">-- Select Class --</option>
                                {quiz.classes.map((cls, idx) => (
                                    <option key={idx} value={cls}>{cls}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    

                    {quiz.classes && quiz.classes.length > 0 && (
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Roll Number <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={participantRollNo}
                                onChange={(e) => {
                                    setParticipantRollNo(e.target.value);
                                    setRollNoError(''); // Clear error when typing
                                }}
                                className={`w-full max-w-xs mx-auto p-3 border rounded-lg text-center ${
                                    rollNoError 
                                        ? 'border-red-500 bg-red-50' 
                                        : !participantRollNo.trim() 
                                            ? 'border-orange-300' 
                                            : 'border-gray-300'
                                }`}
                                placeholder="Enter your roll number"
                            />
                            {rollNoError && (
                                <p className="text-red-600 text-sm mt-2 font-medium">{rollNoError}</p>
                            )}
                        </div>
                    )}

                    {/* Validation message */}
                    {quiz.classes && quiz.classes.length > 0 && (!participantName.trim() || !participantClass || !participantRollNo.trim()) && (
                        <p className="text-orange-600 text-sm mb-4">
                            Please fill all required fields marked with <span className="text-red-500">*</span>
                        </p>
                    )}

                    {/* Step flow: Details -> Instructions -> Start */}
                    {(quiz && (quiz.classes && quiz.classes.length > 0 ? (participantName.trim() && participantClass && participantRollNo.trim()) : true)) && (
                        <div className="mb-6">
                            {!showInstructions ? (
                                <div className="flex items-center justify-center">
                                    <button
                                        onClick={async () => {
                                            // Validate required fields (same as Start validation)
                                            if (quiz.classes && quiz.classes.length > 0) {
                                                if (!participantName.trim() || !participantClass || !participantRollNo.trim()) {
                                                    alert('Please fill all required details before proceeding to instructions');
                                                    return;
                                                }
                                            }

                                            // Optionally check duplicate roll number before showing instructions
                                            if (quiz?.settings?.preventDuplicateRollNo && participantRollNo && participantRollNo.trim()) {
                                                setCheckingRollNo(true);
                                                setRollNoError('');
                                                try {
                                                    const result = await checkRollNoExists(quizId, participantRollNo.trim());
                                                    if (result.exists) {
                                                        setRollNoError(result.message);
                                                        setCheckingRollNo(false);
                                                        return;
                                                    }
                                                } catch (err) {
                                                    console.error('Error checking roll number:', err);
                                                }
                                                setCheckingRollNo(false);
                                            }

                                            setShowInstructions(true);
                                        }}
                                        disabled={checkingRollNo}
                                        className={`px-8 py-3 rounded-lg ${checkingRollNo ? 'bg-gray-300 text-gray-600' : 'bg-emerald-600 text-white hover:bg-emerald-700'} font-medium`}
                                    >
                                        {checkingRollNo ? 'Checking...' : 'Go to Instructions'}
                                    </button>
                                </div>
                            ) : (
                                <div className="mb-6 bg-white rounded-xl shadow p-6 text-left">
                                    <h3 className="text-lg font-semibold text-emerald-800 mb-3">Instructions & Guidelines</h3>
                                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-2 mb-4">
                                        <li>Total Questions: <strong className="text-gray-800">{questions.length}</strong></li>
                                        <li>Total Points: <strong className="text-gray-800">{quiz.totalPoints}</strong></li>
                                        {quiz.settings?.timeLimit > 0 && (
                                            <li>Time Limit: <strong className="text-gray-800">{quiz.settings.timeLimit} minutes</strong></li>
                                        )}
                                        {quiz.settings?.fullscreenModeEnabled && (
                                            <li>This quiz requires <strong className="text-gray-800">fullscreen</strong>. You will be asked to enter fullscreen before starting.</li>
                                        )}
                                        {quiz.settings?.tabSwitchingEnabled && (
                                            <li><strong className="text-gray-800">Do not switch tabs</strong> during the quiz. Excessive tab switching may auto-submit the quiz.</li>
                                        )}
                                        {quiz.settings?.requireSequentialAnswering && (
                                            <li>Questions must be answered in order. You cannot jump ahead until the current question is answered.</li>
                                        )}
                                        {quiz.settings?.preventDuplicateRollNo && (
                                            <li>Duplicate roll numbers are not allowed. Enter your correct roll number.</li>
                                        )}
                                        <li>Avoid refreshing the page or using developer tools; right-click and certain shortcuts are disabled.</li>
                                        <li>Ensure a stable internet connection for uninterrupted submission.</li>
                                    </ul>

                                    <label className="flex items-center space-x-3 mb-4">
                                        <input
                                            type="checkbox"
                                            checked={agreedToGuidelines}
                                            onChange={(e) => setAgreedToGuidelines(e.target.checked)}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-sm text-gray-700">I have read and agree to the instructions above</span>
                                    </label>

                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setShowInstructions(false)}
                                            className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
                                        >
                                            Back
                                        </button>

                                        <button
                                            onClick={async () => {
                                                if (!agreedToGuidelines) {
                                                    alert('Please agree to the instructions before starting the quiz.');
                                                    return;
                                                }

                                                // Start the quiz: process questions and enter fullscreen if required
                                                const processedQuestions = processQuestions(quiz);
                                                setQuestions(processedQuestions);

                                                if (quiz?.settings?.fullscreenModeEnabled) {
                                                    await enterFullscreen();
                                                }

                                                setHasStarted(true);
                                            }}
                                            disabled={!agreedToGuidelines}
                                            className={`px-6 py-3 rounded-lg font-medium ${!agreedToGuidelines ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                                        >
                                            {quiz?.settings?.fullscreenModeEnabled ? 'Enter Fullscreen & Start Quiz' : 'Start Quiz'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Resume Session Prompt */}
                    {showResumePrompt && restoredSession && (
                        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center justify-center text-blue-700 mb-2">
                                <RefreshCw size={20} className="mr-2" />
                                <span className="font-medium">Previous Session Found!</span>
                            </div>
                            <p className="text-blue-600 text-sm mb-3">
                                You have an incomplete quiz session with {formatTime(restoredSession.timeLeft)} remaining 
                                and {Object.keys(restoredSession.answers || {}).length} question(s) answered.
                            </p>
                            <div className="flex justify-center">
                                <button
                                    onClick={resumeSession}
                                    disabled={!agreedToGuidelines}
                                    className={`px-4 py-2 ${!agreedToGuidelines ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'} rounded-lg transition font-medium text-sm flex items-center`}
                                >
                                    <RefreshCw size={16} className="mr-1" />
                                    Resume Quiz
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Fullscreen Mode Notice */}
                    {quiz?.settings?.fullscreenModeEnabled && (
                        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                            <div className="flex items-center justify-center text-amber-700">
                                <Maximize size={20} className="mr-2" />
                                <span className="font-medium">This quiz requires fullscreen mode</span>
                            </div>
                            <p className="text-amber-600 text-sm mt-1">
                                You cannot exit fullscreen during the quiz. Exiting 3 times will auto-submit your quiz.
                            </p>
                        </div>
                    )}

                    {/* Start/Resume Button - hide if resume prompt is shown */}
                    {!showResumePrompt && (
                        <button
                            onClick={async () => {
                                // Validate required fields when classes exist
                                if (quiz.classes && quiz.classes.length > 0) {
                                    if (!participantName.trim()) {
                                        alert('Please enter your name');
                                        return;
                                    }
                                    if (!participantClass) {
                                        alert('Please select your class');
                                        return;
                                    }
                                    if (!participantRollNo.trim()) {
                                        alert('Please enter your roll number');
                                        return;
                                    }
                                }
                                // Require agreement to guidelines
                                if (!agreedToGuidelines) {
                                    alert('Please agree to the instructions before starting the quiz.');
                                    return;
                                }

                                // Check if roll number exists before starting (only if setting is enabled)
                                if (quiz?.settings?.preventDuplicateRollNo && participantRollNo && participantRollNo.trim()) {
                                    setCheckingRollNo(true);
                                    setRollNoError('');
                                    try {
                                        const result = await checkRollNoExists(quizId, participantRollNo.trim());
                                        if (result.exists) {
                                            setRollNoError(result.message);
                                            setCheckingRollNo(false);
                                            return;
                                        }
                                    } catch (err) {
                                        console.error('Error checking roll number:', err);
                                    }
                                    setCheckingRollNo(false);
                                }

                                // Process questions for new session
                                const processedQuestions = processQuestions(quiz);
                                setQuestions(processedQuestions);

                                // Enter fullscreen if required
                                if (quiz?.settings?.fullscreenModeEnabled) {
                                    await enterFullscreen();
                                }

                                setHasStarted(true);
                            }}
                            disabled={checkingRollNo || (quiz.classes && quiz.classes.length > 0 && (!participantName.trim() || !participantClass || !participantRollNo.trim())) || !agreedToGuidelines}
                            className={`px-8 py-3 rounded-lg text-lg shadow-lg flex items-center justify-center mx-auto font-medium transition ${checkingRollNo || (quiz.classes && quiz.classes.length > 0 && (!participantName.trim() || !participantClass || !participantRollNo.trim())) || !agreedToGuidelines ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                        >
                            {quiz?.settings?.fullscreenModeEnabled && <Maximize size={20} className="mr-2" />}
                            {checkingRollNo ? 'Checking...' : quiz?.settings?.fullscreenModeEnabled ? 'Enter Fullscreen & Start Quiz' : 'Start Quiz'}
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // Quiz Taking Screen
    return (
        <div className="max-w-3xl mx-auto p-2 sm:p-4 md:p-6 lg:p-8 min-h-screen flex flex-col">
            {/* Tab Switch Warning Modal */}
            {showTabWarning && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl p-4 sm:p-8 max-w-md w-full text-center">
                        <div className="w-14 h-14 sm:w-20 sm:h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                            <AlertTriangle size={28} className="text-red-600 sm:hidden" />
                            <AlertTriangle size={40} className="text-red-600 hidden sm:block" />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold text-red-600 mb-2">Warning!</h2>
                        <p className="text-sm sm:text-base text-gray-700 mb-3 sm:mb-4">
                            Tab switching detected! Switches: <span className="font-bold text-red-600">{tabSwitchCount}/3</span>
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">
                            {3 - tabSwitchCount > 0 
                                ? `Auto-submit after ${3 - tabSwitchCount} more.`
                                : 'Submitting...'}
                        </p>
                        <button
                            onClick={() => setShowTabWarning(false)}
                            className="px-4 sm:px-6 py-2 sm:py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium text-sm sm:text-base"
                        >
                            Continue Quiz
                        </button>
                    </div>
                </div>
            )}

            {/* Tab Switch Warning Banner */}
            {quiz?.settings?.tabSwitchingEnabled && tabSwitchCount > 0 && !showTabWarning && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-2 sm:p-3 mb-2 sm:mb-4 flex items-center">
                    <AlertTriangle size={16} className="text-red-600 mr-2 flex-shrink-0" />
                    <span className="text-red-700 text-xs sm:text-sm font-medium">
                        Tab switches: {tabSwitchCount}/3
                    </span>
                </div>
            )}

            {/* Fullscreen Exit Warning Modal */}
            {showFullscreenWarning && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl p-4 sm:p-8 max-w-md w-full text-center">
                        <div className="w-14 h-14 sm:w-20 sm:h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                            <Maximize size={28} className="text-orange-600 sm:hidden" />
                            <Maximize size={40} className="text-orange-600 hidden sm:block" />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold text-orange-600 mb-2">Fullscreen Required!</h2>
                        <p className="text-sm sm:text-base text-gray-700 mb-3 sm:mb-4">
                            Fullscreen exits: <span className="font-bold text-orange-600">{fullscreenExitCount}/3</span>
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">
                            {3 - fullscreenExitCount > 0 
                                ? `Auto-submit after ${3 - fullscreenExitCount} more exit${3 - fullscreenExitCount > 1 ? 's' : ''}.`
                                : 'Submitting...'}
                        </p>
                        <button
                            onClick={() => {
                                setShowFullscreenWarning(false);
                                enterFullscreen();
                            }}
                            className="px-4 sm:px-6 py-2 sm:py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium flex items-center justify-center mx-auto text-sm sm:text-base"
                        >
                            <Maximize size={16} className="mr-2" />
                            Return to Fullscreen
                        </button>
                    </div>
                </div>
            )}

            {/* Fullscreen Prompt Banner */}
            {quiz?.settings?.fullscreenModeEnabled && !isFullscreen && !showFullscreenWarning && fullscreenExitCount > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 sm:p-3 mb-2 sm:mb-4 flex items-center justify-between gap-2">
                    <div className="flex items-center flex-1 min-w-0">
                        <Maximize size={16} className="text-orange-600 mr-2 flex-shrink-0" />
                        <span className="text-orange-700 text-xs sm:text-sm font-medium truncate">
                            Exits: {fullscreenExitCount}/3
                        </span>
                    </div>
                    <button
                        onClick={enterFullscreen}
                        className="px-2 sm:px-3 py-1 bg-orange-600 text-white rounded text-xs sm:text-sm hover:bg-orange-700 transition flex-shrink-0"
                    >
                        Fullscreen
                    </button>
                </div>
            )}

            {/* Split Screen / Window Resize Warning Modal */}
            {showSplitScreenWarning && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl p-4 sm:p-8 max-w-md w-full text-center">
                        <div className="w-14 h-14 sm:w-20 sm:h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                            <AlertTriangle size={28} className="text-red-600 sm:hidden" />
                            <AlertTriangle size={40} className="text-red-600 hidden sm:block" />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold text-red-600 mb-2">Split Screen Detected!</h2>
                        <p className="text-sm sm:text-base text-gray-700 mb-3 sm:mb-4">
                            Violations: <span className="font-bold text-red-600">{splitScreenCount}/3</span>
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">
                            Using split screen or resizing the window is not allowed during the quiz.
                            {3 - splitScreenCount > 0 
                                ? ` Auto-submit after ${3 - splitScreenCount} more violation${3 - splitScreenCount > 1 ? 's' : ''}.`
                                : ' Submitting...'}
                        </p>
                        <p className="text-xs text-gray-500 mb-4">
                            Please maximize your browser window to continue.
                        </p>
                        <button
                            onClick={() => {
                                setShowSplitScreenWarning(false);
                                // Try to enter fullscreen again
                                if (quiz?.settings?.fullscreenModeEnabled) {
                                    enterFullscreen();
                                }
                            }}
                            className="px-4 sm:px-6 py-2 sm:py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium flex items-center justify-center mx-auto text-sm sm:text-base"
                        >
                            <Maximize size={16} className="mr-2" />
                            I Understand, Continue
                        </button>
                    </div>
                </div>
            )}

            {/* Split Screen Warning Banner */}
            {quiz?.settings?.fullscreenModeEnabled && splitScreenCount > 0 && !showSplitScreenWarning && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-2 sm:p-3 mb-2 sm:mb-4 flex items-center justify-between gap-2">
                    <div className="flex items-center flex-1 min-w-0">
                        <AlertTriangle size={16} className="text-red-600 mr-2 flex-shrink-0" />
                        <span className="text-red-700 text-xs sm:text-sm font-medium truncate">
                            Split screen violations: {splitScreenCount}/3
                        </span>
                    </div>
                </div>
            )}

            {/* Header with Timer and Progress */}
            <div className="bg-white rounded-xl shadow-lg p-2 sm:p-4 mb-3 sm:mb-6 sticky top-0 z-10 flex-shrink-0">
                <div className="flex items-center justify-between mb-1 sm:mb-2">
                    <span className="text-xs sm:text-sm font-medium text-gray-600">
                        Q {currentIndex + 1}/{questions.length}
                    </span>
                    {timeLeft !== null && (
                        <div className={`flex items-center font-mono text-sm sm:text-lg font-bold ${
                            timeLeft < 60 ? 'text-red-600' : 'text-emerald-600'
                        }`}>
                            <Clock size={16} className="mr-1 sm:hidden" />
                            <Clock size={20} className="mr-1 hidden sm:block" />
                            {formatTime(timeLeft)}
                        </div>
                    )}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                    <div 
                        className="bg-emerald-600 h-1.5 sm:h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Queued submissions panel (shows only when there are pending items) */}
            <QueuedSubmissions />

            {/* Question Card */}
            {currentQuestion && (
                <div className="bg-white rounded-xl shadow-lg p-3 sm:p-6 mb-3 sm:mb-6 flex-1 overflow-y-auto">
                    <div className="flex justify-between items-start mb-2 sm:mb-4 gap-2">
                        <h2 className="text-base sm:text-xl font-semibold text-gray-800 flex-1">
                            {currentQuestion.questionText}
                        </h2>
                        <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs sm:text-sm font-medium flex-shrink-0">
                            {currentQuestion.points} pts
                        </span>
                    </div>

                    {/* Question Image */}
                    {currentQuestion.questionImage?.url && (
                        <div className="mb-3 sm:mb-4">
                            <img 
                                src={currentQuestion.questionImage.url} 
                                alt="Question diagram" 
                                className="max-w-full max-h-40 sm:max-h-64 rounded-lg border border-gray-200 object-contain mx-auto"
                            />
                        </div>
                    )}

                    <p className="text-xs sm:text-sm text-gray-500 mb-2 sm:mb-4">
                        {currentQuestion.questionType === 'MULTIPLE' 
                            ? 'Select all that apply' 
                            : 'Select one answer'}
                    </p>

                    <div className="space-y-2 sm:space-y-3">
                        {currentQuestion.options.map((option, idx) => {
                            const isSelected = (answers[currentQuestion._id] || []).includes(option.optionText);
                            const isMultiple = currentQuestion.questionType === 'MULTIPLE';
                            
                            return (
                                <button
                                    key={idx}
                                    onClick={() => handleOptionSelect(currentQuestion._id, option.optionText, isMultiple)}
                                    className={`w-full p-2.5 sm:p-4 text-left rounded-lg border-2 transition ${
                                        isSelected 
                                            ? 'border-emerald-500 bg-emerald-50 text-emerald-800' 
                                            : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'
                                    }`}
                                >
                                    <div className="flex items-center">
                                        <div className={`w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 rounded-${isMultiple ? 'md' : 'full'} border-2 flex items-center justify-center flex-shrink-0 ${
                                            isSelected ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'
                                        }`}>
                                            {isSelected && <CheckCircle size={10} className="text-white sm:hidden" />}
                                            {isSelected && <CheckCircle size={14} className="text-white hidden sm:block" />}
                                        </div>
                                        <div className="flex-1">
                                            <span className="text-sm sm:text-base">{option.optionText}</span>
                                            {/* Option Image */}
                                            {option.optionImage?.url && (
                                                <img 
                                                    src={option.optionImage.url} 
                                                    alt={`Option ${idx + 1}`} 
                                                    className="mt-2 max-w-full max-h-20 sm:max-h-32 rounded border border-gray-200 object-contain"
                                                />
                                            )}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between items-center gap-2 pb-2 sm:pb-0 flex-shrink-0 bg-gray-50 sm:bg-transparent -mx-2 sm:mx-0 px-2 sm:px-0 py-2 sm:py-0 sticky bottom-0 sm:static">
                <button
                    onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentIndex === 0}
                    className="px-3 sm:px-4 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed bg-gray-100 text-gray-700 hover:bg-gray-200 transition text-sm sm:text-base"
                >
                    Prev
                </button>

                {/* Question indicators - hidden on small mobile, scrollable on larger screens */}
                <div className="hidden sm:flex space-x-1 sm:space-x-2 overflow-x-auto max-w-[40%] scrollbar-hide">
                    {questions.map((_, idx) => {
                        // Check if this question can be accessed based on sequential answering setting
                        const canAccess = !quiz?.settings?.requireSequentialAnswering || 
                            idx <= currentIndex || 
                            // Can access if all previous questions are answered
                            questions.slice(0, idx).every(q => answers[q._id] && answers[q._id].length > 0);
                        
                        return (
                            <button
                                key={idx}
                                onClick={() => canAccess && setCurrentIndex(idx)}
                                disabled={!canAccess}
                                className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full text-xs sm:text-sm font-medium transition flex-shrink-0 ${
                                    idx === currentIndex 
                                        ? 'bg-emerald-600 text-white' 
                                        : answers[questions[idx]._id] 
                                            ? 'bg-emerald-100 text-emerald-700' 
                                            : canAccess
                                                ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                                }`}
                                title={!canAccess ? 'Answer the current question first' : `Go to question ${idx + 1}`}
                            >
                                {idx + 1}
                            </button>
                        );
                    })}
                </div>

                {/* Mobile: Show simple indicator instead of all buttons */}
                <div className="sm:hidden text-xs text-gray-500 font-medium">
                    {currentIndex + 1} / {questions.length}
                </div>

                {currentIndex < questions.length - 1 ? (
                    <button
                        onClick={() => {
                            // Check if sequential answering is required and current question is unanswered
                            if (quiz?.settings?.requireSequentialAnswering && 
                                (!answers[currentQuestion._id] || answers[currentQuestion._id].length === 0)) {
                                alert('Please answer the current question before moving to the next one.');
                                return;
                            }
                            setCurrentIndex(prev => prev + 1);
                        }}
                        className="px-3 sm:px-4 py-2 rounded-lg font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition flex items-center text-sm sm:text-base"
                    >
                        Next <ChevronRight size={16} className="sm:hidden" /><ChevronRight size={20} className="hidden sm:block" />
                    </button>
                ) : (
                    <button
                        onClick={() => handleSubmit(false)}
                        disabled={loading}
                        className="px-4 sm:px-6 py-2 rounded-lg font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition disabled:opacity-50 text-sm sm:text-base"
                    >
                        {loading ? 'Submitting...' : 'Submit'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default QuizTakePage;
