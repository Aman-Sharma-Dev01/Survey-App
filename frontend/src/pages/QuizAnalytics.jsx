import React, { useState, useEffect } from 'react';
import { BarChart3, Users, CheckCircle, XCircle, Clock, TrendingUp, Loader } from 'lucide-react';
import { getQuizAnalytics } from '../services/quizService';

const QuizAnalyticsPage = ({ quizId, navigate }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const result = await getQuizAnalytics(quizId);
                setData(result);
            } catch (err) {
                setError(err.message || 'Failed to load analytics');
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, [quizId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader className="animate-spin text-emerald-600" size={48} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-xl mx-auto p-10 mt-10 text-center bg-red-50 border border-red-200 rounded-xl">
                <h2 className="text-2xl font-bold text-red-700 mb-2">Error</h2>
                <p className="text-red-600">{error}</p>
            </div>
        );
    }

    const { quiz, analytics, questionStats, recentResponses } = data;

    return (
        <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
            <div className="mb-6">
                <button
                    onClick={() => navigate('quiz-dashboard')}
                    className="text-emerald-600 hover:text-emerald-700 font-medium mb-2"
                >
                    ← Back to Dashboard
                </button>
                <h1 className="text-3xl font-extrabold text-emerald-800">{quiz.title}</h1>
                <p className="text-gray-600">Quiz Analytics & Responses</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-xl shadow-lg p-5 border border-emerald-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Attempts</p>
                            <p className="text-3xl font-bold text-emerald-600">{analytics.totalResponses}</p>
                        </div>
                        <Users className="text-emerald-400" size={32} />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-5 border border-emerald-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Pass Rate</p>
                            <p className="text-3xl font-bold text-emerald-600">{analytics.passRate}%</p>
                        </div>
                        <CheckCircle className="text-emerald-400" size={32} />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-5 border border-emerald-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Avg Score</p>
                            <p className="text-3xl font-bold text-emerald-600">{analytics.avgScore}%</p>
                        </div>
                        <TrendingUp className="text-emerald-400" size={32} />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-5 border border-emerald-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Avg Time</p>
                            <p className="text-3xl font-bold text-emerald-600">
                                {Math.floor(analytics.avgTime / 60)}m
                            </p>
                        </div>
                        <Clock className="text-emerald-400" size={32} />
                    </div>
                </div>
            </div>

            {/* Question Performance */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-emerald-100">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <BarChart3 size={24} className="mr-2 text-emerald-600" />
                    Question Performance
                </h2>
                <div className="space-y-4">
                    {questionStats.map((q, idx) => (
                        <div key={q.questionId} className="p-4 bg-gray-50 rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                                <p className="font-medium text-gray-800">
                                    Q{idx + 1}. {q.questionText}
                                </p>
                                <span className={`px-2 py-1 rounded text-sm font-medium ${
                                    q.accuracy >= 70 ? 'bg-emerald-100 text-emerald-700' :
                                    q.accuracy >= 40 ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                }`}>
                                    {q.accuracy}% correct
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                    className={`h-2 rounded-full transition-all ${
                                        q.accuracy >= 70 ? 'bg-emerald-500' :
                                        q.accuracy >= 40 ? 'bg-yellow-500' :
                                        'bg-red-500'
                                    }`}
                                    style={{ width: `${q.accuracy}%` }}
                                />
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                                {q.correctCount} / {q.totalAttempts} answered correctly
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent Responses */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-emerald-100">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Responses</h2>
                {recentResponses.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No responses yet</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Participant</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Score</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Percentage</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Time</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentResponses.map((response) => (
                                    <tr key={response._id} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-3 px-4 text-gray-800">{response.participantName}</td>
                                        <td className="py-3 px-4 text-gray-800">
                                            {response.score} / {response.totalPoints}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="font-medium text-emerald-600">{response.percentage}%</span>
                                        </td>
                                        <td className="py-3 px-4">
                                            {response.passed ? (
                                                <span className="flex items-center text-emerald-600">
                                                    <CheckCircle size={16} className="mr-1" /> Passed
                                                </span>
                                            ) : (
                                                <span className="flex items-center text-red-600">
                                                    <XCircle size={16} className="mr-1" /> Failed
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-gray-600">
                                            {response.timeTaken 
                                                ? `${Math.floor(response.timeTaken / 60)}m ${response.timeTaken % 60}s`
                                                : '-'}
                                        </td>
                                        <td className="py-3 px-4 text-gray-600">
                                            {new Date(response.submittedAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuizAnalyticsPage;
