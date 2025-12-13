import React, { useState, useEffect, useRef } from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle, ChevronRight } from 'lucide-react';
import { getPublicQuiz, submitQuizResponse } from '../services/quizService';

// Shuffle array helper
const shuffleArray = (array) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

const QuizTakePage = ({ quizId }) => {
    const [quiz, setQuiz] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [results, setResults] = useState(null);
    const [timeLeft, setTimeLeft] = useState(null);
    const [startedAt] = useState(new Date());
    const [participantName, setParticipantName] = useState('');
    const [participantClass, setParticipantClass] = useState('');
    const [hasStarted, setHasStarted] = useState(false);

    const timerRef = useRef(null);

    // Fetch quiz
    useEffect(() => {
        const fetchQuiz = async () => {
            setLoading(true);
            try {
                const data = await getPublicQuiz(quizId);
                setQuiz(data);
                
                // Process questions (shuffle if needed)
                let processedQuestions = data.questions;
                if (data.settings?.shuffleQuestions) {
                    processedQuestions = shuffleArray(processedQuestions);
                }
                if (data.settings?.shuffleOptions) {
                    processedQuestions = processedQuestions.map(q => ({
                        ...q,
                        options: shuffleArray(q.options)
                    }));
                }
                setQuestions(processedQuestions);
                
                // Set timer if time limit exists
                if (data.settings?.timeLimit > 0) {
                    setTimeLeft(data.settings.timeLimit * 60);
                }
            } catch (err) {
                setError(err.message || 'Quiz not found');
            } finally {
                setLoading(false);
            }
        };
        fetchQuiz();
    }, [quizId]);

    // Timer countdown
    useEffect(() => {
        if (hasStarted && timeLeft !== null && timeLeft > 0 && !isSubmitted) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        handleSubmit(true); // Auto-submit
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timerRef.current);
    }, [hasStarted, isSubmitted]);

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

    const handleSubmit = async (autoSubmit = false) => {
        if (!autoSubmit && !window.confirm('Submit your quiz? You cannot change answers after submission.')) {
            return;
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
                timeTaken,
                startedAt: startedAt.toISOString()
            });

            setResults(result);
            setIsSubmitted(true);
        } catch (err) {
            setError(err.message || 'Failed to submit quiz');
        } finally {
            setLoading(false);
        }
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

    if (error) {
        return (
            <div className="max-w-xl mx-auto p-10 mt-10 text-center bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-red-700 mb-2">Error</h2>
                <p className="text-red-600">{error}</p>
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">Your Name (optional)</label>
                        <input
                            type="text"
                            value={participantName}
                            onChange={(e) => setParticipantName(e.target.value)}
                            className="w-full max-w-xs mx-auto p-3 border border-gray-300 rounded-lg text-center"
                            placeholder="Enter your name"
                        />
                    </div>

                    {quiz.classes && quiz.classes.length > 0 && (
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Select Your Class</label>
                            <select
                                value={participantClass}
                                onChange={(e) => setParticipantClass(e.target.value)}
                                className="w-full max-w-xs mx-auto p-3 border border-gray-300 rounded-lg text-center bg-white"
                            >
                                <option value="">-- Select Class --</option>
                                {quiz.classes.map((cls, idx) => (
                                    <option key={idx} value={cls}>{cls}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <button
                        onClick={() => setHasStarted(true)}
                        className="px-8 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium text-lg shadow-lg"
                    >
                        Start Quiz
                    </button>
                </div>
            </div>
        );
    }

    // Quiz Taking Screen
    return (
        <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
            {/* Header with Timer and Progress */}
            <div className="bg-white rounded-xl shadow-lg p-4 mb-6 sticky top-0 z-10">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">
                        Question {currentIndex + 1} of {questions.length}
                    </span>
                    {timeLeft !== null && (
                        <div className={`flex items-center font-mono text-lg font-bold ${
                            timeLeft < 60 ? 'text-red-600' : 'text-emerald-600'
                        }`}>
                            <Clock size={20} className="mr-1" />
                            {formatTime(timeLeft)}
                        </div>
                    )}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                        className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Question Card */}
            {currentQuestion && (
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <div className="flex justify-between items-start mb-4">
                        <h2 className="text-xl font-semibold text-gray-800">
                            {currentQuestion.questionText}
                        </h2>
                        <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-sm font-medium">
                            {currentQuestion.points} pts
                        </span>
                    </div>

                    {/* Question Image */}
                    {currentQuestion.questionImage?.url && (
                        <div className="mb-4">
                            <img 
                                src={currentQuestion.questionImage.url} 
                                alt="Question diagram" 
                                className="max-w-full max-h-64 rounded-lg border border-gray-200 object-contain mx-auto"
                            />
                        </div>
                    )}

                    <p className="text-sm text-gray-500 mb-4">
                        {currentQuestion.questionType === 'MULTIPLE' 
                            ? 'Select all that apply' 
                            : 'Select one answer'}
                    </p>

                    <div className="space-y-3">
                        {currentQuestion.options.map((option, idx) => {
                            const isSelected = (answers[currentQuestion._id] || []).includes(option.optionText);
                            const isMultiple = currentQuestion.questionType === 'MULTIPLE';
                            
                            return (
                                <button
                                    key={idx}
                                    onClick={() => handleOptionSelect(currentQuestion._id, option.optionText, isMultiple)}
                                    className={`w-full p-4 text-left rounded-lg border-2 transition ${
                                        isSelected 
                                            ? 'border-emerald-500 bg-emerald-50 text-emerald-800' 
                                            : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'
                                    }`}
                                >
                                    <div className="flex items-center">
                                        <div className={`w-5 h-5 mr-3 rounded-${isMultiple ? 'md' : 'full'} border-2 flex items-center justify-center flex-shrink-0 ${
                                            isSelected ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'
                                        }`}>
                                            {isSelected && <CheckCircle size={14} className="text-white" />}
                                        </div>
                                        <div className="flex-1">
                                            <span>{option.optionText}</span>
                                            {/* Option Image */}
                                            {option.optionImage?.url && (
                                                <img 
                                                    src={option.optionImage.url} 
                                                    alt={`Option ${idx + 1}`} 
                                                    className="mt-2 max-w-full max-h-32 rounded border border-gray-200 object-contain"
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
            <div className="flex justify-between items-center">
                <button
                    onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentIndex === 0}
                    className="px-4 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                >
                    Previous
                </button>

                <div className="flex space-x-2">
                    {questions.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={`w-8 h-8 rounded-full text-sm font-medium transition ${
                                idx === currentIndex 
                                    ? 'bg-emerald-600 text-white' 
                                    : answers[questions[idx]._id] 
                                        ? 'bg-emerald-100 text-emerald-700' 
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {idx + 1}
                        </button>
                    ))}
                </div>

                {currentIndex < questions.length - 1 ? (
                    <button
                        onClick={() => setCurrentIndex(prev => prev + 1)}
                        className="px-4 py-2 rounded-lg font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition flex items-center"
                    >
                        Next <ChevronRight size={20} />
                    </button>
                ) : (
                    <button
                        onClick={() => handleSubmit(false)}
                        disabled={loading}
                        className="px-6 py-2 rounded-lg font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition disabled:opacity-50"
                    >
                        {loading ? 'Submitting...' : 'Submit Quiz'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default QuizTakePage;
