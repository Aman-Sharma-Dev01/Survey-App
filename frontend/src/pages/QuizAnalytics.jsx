import React, { useState, useEffect, useMemo } from 'react';
import { BarChart3, Users, CheckCircle, XCircle, Clock, TrendingUp, Loader, Filter, Trophy } from 'lucide-react';
import { getQuizAnalytics } from '../services/quizService';

const QuizAnalyticsPage = ({ quizId, navigate }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedClass, setSelectedClass] = useState('');

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

    // Get unique classes from responses - must be before conditional returns
    const availableClasses = useMemo(() => {
        if (!data?.recentResponses) return [];
        const classes = data.recentResponses
            .map(r => r.participantClass)
            .filter(c => c && c.trim() !== '');
        return [...new Set(classes)].sort();
    }, [data?.recentResponses]);

    // Filter responses by selected class
    const filteredResponses = useMemo(() => {
        if (!data?.recentResponses) return [];
        if (!selectedClass) return data.recentResponses;
        return data.recentResponses.filter(r => r.participantClass === selectedClass);
    }, [data?.recentResponses, selectedClass]);

    // Calculate filtered stats
    const filteredStats = useMemo(() => {
        if (!data?.analytics) {
            return { totalResponses: 0, passRate: 0, avgScore: 0, avgTime: 0 };
        }
        if (!selectedClass || filteredResponses.length === 0) {
            return {
                totalResponses: data.analytics.totalResponses,
                passRate: data.analytics.passRate,
                avgScore: data.analytics.avgScore,
                avgTime: data.analytics.avgTime
            };
        }
        const total = filteredResponses.length;
        const passed = filteredResponses.filter(r => r.passed).length;
        const avgScore = Math.round(filteredResponses.reduce((sum, r) => sum + r.percentage, 0) / total);
        const avgTime = Math.round(filteredResponses.reduce((sum, r) => sum + (r.timeTaken || 0), 0) / total);
        return {
            totalResponses: total,
            passRate: Math.round((passed / total) * 100),
            avgScore,
            avgTime
        };
    }, [filteredResponses, selectedClass, data?.analytics]);

    // Calculate top performer (highest score, with time as tiebreaker)
    const topPerformer = useMemo(() => {
        if (filteredResponses.length === 0) return null;
        
        // Sort by percentage (desc), then by timeTaken (asc) for tiebreaker
        const sorted = [...filteredResponses].sort((a, b) => {
            if (b.percentage !== a.percentage) {
                return b.percentage - a.percentage; // Higher percentage first
            }
            return (a.timeTaken || Infinity) - (b.timeTaken || Infinity); // Less time wins
        });
        
        return sorted[0];
    }, [filteredResponses]);

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

    const { quiz, questionStats } = data;

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

            {/* Class Filter */}
            {availableClasses.length > 0 && (
                <div className="mb-6 flex items-center gap-3">
                    <Filter size={20} className="text-gray-500" />
                    <label className="text-sm font-medium text-gray-700">Filter by Class:</label>
                    <select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                        <option value="">All Classes</option>
                        {availableClasses.map((cls) => (
                            <option key={cls} value={cls}>{cls}</option>
                        ))}
                    </select>
                    {selectedClass && (
                        <button
                            onClick={() => setSelectedClass('')}
                            className="text-sm text-emerald-600 hover:text-emerald-700 underline"
                        >
                            Clear filter
                        </button>
                    )}
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-xl shadow-lg p-5 border border-emerald-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Attempts</p>
                            <p className="text-3xl font-bold text-emerald-600">{filteredStats.totalResponses}</p>
                        </div>
                        <Users className="text-emerald-400" size={32} />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-5 border border-emerald-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Pass Rate</p>
                            <p className="text-3xl font-bold text-emerald-600">{filteredStats.passRate}%</p>
                        </div>
                        <CheckCircle className="text-emerald-400" size={32} />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-5 border border-emerald-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Avg Score</p>
                            <p className="text-3xl font-bold text-emerald-600">{filteredStats.avgScore}%</p>
                        </div>
                        <TrendingUp className="text-emerald-400" size={32} />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-5 border border-emerald-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Avg Time</p>
                            <p className="text-3xl font-bold text-emerald-600">
                                {Math.floor(filteredStats.avgTime / 60)}m
                            </p>
                        </div>
                        <Clock className="text-emerald-400" size={32} />
                    </div>
                </div>
            </div>

            {/* Top Performer */}
            {topPerformer && (
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl shadow-lg p-6 mb-8 border border-amber-200">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                        <Trophy size={24} className="mr-2 text-amber-500" />
                        Top Performer {selectedClass && `- ${selectedClass}`}
                    </h2>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                                <Trophy size={32} className="text-white" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-800">{topPerformer.participantName}</p>
                                {topPerformer.participantClass && (
                                    <p className="text-sm text-gray-600">Class: {topPerformer.participantClass}</p>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-6 md:gap-8">
                            <div className="text-center">
                                <p className="text-3xl font-bold text-amber-600">{topPerformer.percentage}%</p>
                                <p className="text-sm text-gray-500">Score</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-bold text-amber-600">{topPerformer.score}/{topPerformer.totalPoints}</p>
                                <p className="text-sm text-gray-500">Points</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-bold text-amber-600">
                                    {topPerformer.timeTaken 
                                        ? `${Math.floor(topPerformer.timeTaken / 60)}m ${topPerformer.timeTaken % 60}s`
                                        : '-'}
                                </p>
                                <p className="text-sm text-gray-500">Time Taken</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                    {selectedClass ? `Responses - ${selectedClass}` : 'Recent Responses'}
                    {selectedClass && ` (${filteredResponses.length})`}
                </h2>
                {filteredResponses.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                        {selectedClass ? `No responses from ${selectedClass}` : 'No responses yet'}
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Participant</th>
                                    {availableClasses.length > 0 && (
                                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Class</th>
                                    )}
                                    {availableClasses.length > 0 && (
                                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Roll No</th>
                                    )}
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Score</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Percentage</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Time</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredResponses.map((response) => (
                                    <tr key={response._id} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-3 px-4 text-gray-800">{response.participantName}</td>
                                        {availableClasses.length > 0 && (
                                            <td className="py-3 px-4 text-gray-600">
                                                {response.participantClass || '-'}
                                            </td>
                                        )}
                                        {availableClasses.length > 0 && (
                                            <td className="py-3 px-4 text-gray-600">
                                                {response.participantRollNo || '-'}
                                            </td>
                                        )}
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
