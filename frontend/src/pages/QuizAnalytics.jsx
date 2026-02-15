import React, { useState, useEffect, useMemo } from 'react';
import { BarChart3, Users, CheckCircle, XCircle, Clock, TrendingUp, Loader, Filter, Trophy, Download, ChevronDown, Star } from 'lucide-react';
import { getQuizAnalytics } from '../services/quizService';

const QuizAnalyticsPage = ({ quizId, navigate }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedClass, setSelectedClass] = useState('');
    const [isQuestionPerformanceOpen, setIsQuestionPerformanceOpen] = useState(false);

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

    // Export responses to Excel (CSV format)
    const exportToExcel = () => {
        if (filteredResponses.length === 0) {
            alert('No responses to export');
            return;
        }

        // Define headers
        const headers = [
            'Participant Name',
            'Class',
            'Roll No',
            'Score',
            'Total Points',
            'Percentage',
            'Status',
            'Time Taken',
            'Submitted At',
            'Tab Switch Violation'
        ];

        // Create rows
        const rows = filteredResponses.map(response => [
            response.participantName || 'Anonymous',
            response.participantClass || '-',
            response.participantRollNo || '-',
            response.score,
            response.totalPoints,
            `${response.percentage}%`,
            response.autoSubmittedDueToTabSwitch ? 'Caught (Tab Switch)' : (response.passed ? 'Passed' : 'Failed'),
            response.timeTaken ? `${Math.floor(response.timeTaken / 60)}m ${response.timeTaken % 60}s` : '-',
            new Date(response.submittedAt).toLocaleString(),
            response.autoSubmittedDueToTabSwitch ? 'Yes' : 'No'
        ]);

        // Create CSV content
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        // Add BOM for Excel UTF-8 compatibility
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

        // Create download link
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        const fileName = `${quiz.title.replace(/[^a-z0-9]/gi, '_')}_responses${selectedClass ? `_${selectedClass.replace(/[^a-z0-9]/gi, '_')}` : ''}.csv`;

        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

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
                <h1 className="text-xl sm:text-3xl font-extrabold text-emerald-800">{quiz.title}</h1>
                <p className="text-gray-600">Quiz Analytics & Responses</p>
            </div>

            {/* Class Filter and Export */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    {availableClasses.length > 0 && (
                        <>
                            <Filter size={20} className="text-gray-500" />
                            <label className="text-sm font-medium text-gray-700">Filter by Class:</label>
                            <select
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                                className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm sm:text-base"
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
                        </>
                    )}
                </div>

                {/* Export Button */}
                <button
                    onClick={exportToExcel}
                    disabled={filteredResponses.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                    <Download size={18} />
                    Export to Excel
                    {selectedClass && <span className="text-emerald-200">({selectedClass})</span>}
                </button>
            </div>

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

            {/* Question Performance - Collapsible */}
            <div className="bg-white rounded-xl shadow-lg mb-8 border border-emerald-100 overflow-hidden">
                <button
                    onClick={() => setIsQuestionPerformanceOpen(!isQuestionPerformanceOpen)}
                    className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                    <h2 className="text-xl font-bold text-gray-800 flex items-center">
                        <BarChart3 size={24} className="mr-2 text-emerald-600" />
                        Question Performance
                        <span className="ml-2 text-sm font-normal text-gray-500">({questionStats.length} questions)</span>
                    </h2>
                    <ChevronDown
                        size={24}
                        className={`text-gray-500 transition-transform duration-300 ${isQuestionPerformanceOpen ? 'rotate-180' : ''}`}
                    />
                </button>
                <div className={`transition-all duration-300 ease-in-out ${isQuestionPerformanceOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                    <div className="px-6 pb-6 space-y-4">
                        {questionStats.map((q, idx) => (
                            <div key={q.questionId} className="p-4 bg-gray-50 rounded-lg">
                                <div className="flex justify-between items-start mb-2">
                                    <p className="font-medium text-gray-800">
                                        Q{idx + 1}. {q.questionText}
                                    </p>
                                    {q.questionType === 'RATING' ? (
                                        <span className="px-2 py-1 rounded text-sm font-medium bg-blue-100 text-blue-700">
                                            Avg: {q.averageRating || 0} ★
                                        </span>
                                    ) : ['SHORT_TEXT', 'LONG_TEXT', 'DATE'].includes(q.questionType) ? (
                                        <span className="px-2 py-1 rounded text-sm font-medium bg-gray-100 text-gray-700">
                                            Text Response
                                        </span>
                                    ) : (
                                        <span className={`px-2 py-1 rounded text-sm font-medium ${q.accuracy >= 70 ? 'bg-emerald-100 text-emerald-700' :
                                                q.accuracy >= 40 ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-red-100 text-red-700'
                                            }`}>
                                            {q.accuracy}% correct
                                        </span>
                                    )}
                                </div>

                                {q.questionType === 'RATING' ? (
                                    <div className="flex items-center gap-1">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                size={16}
                                                className={`${i < Math.round(q.averageRating || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                                            />
                                        ))}
                                        <span className="text-gray-500 text-sm ml-2">({q.totalAttempts} ratings)</span>
                                    </div>
                                ) : ['SHORT_TEXT', 'LONG_TEXT', 'DATE'].includes(q.questionType) ? (
                                    <p className="text-sm text-gray-500 mt-1">
                                        {q.totalAttempts} responses received
                                    </p>
                                ) : (
                                    <>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full transition-all ${q.accuracy >= 70 ? 'bg-emerald-500' :
                                                        q.accuracy >= 40 ? 'bg-yellow-500' :
                                                            'bg-red-500'
                                                    }`}
                                                style={{ width: `${q.accuracy}%` }}
                                            />
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {q.correctCount} / {q.totalAttempts} answered correctly
                                        </p>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
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
                                    <tr
                                        key={response._id}
                                        className={`border-b border-gray-100 ${response.autoSubmittedDueToTabSwitch
                                                ? 'bg-red-50 hover:bg-red-100'
                                                : 'hover:bg-gray-50'
                                            }`}
                                        title={response.autoSubmittedDueToTabSwitch ? 'Auto-submitted due to tab switching' : ''}
                                    >
                                        <td className={`py-3 px-4 ${response.autoSubmittedDueToTabSwitch ? 'text-red-700 font-medium' : 'text-gray-800'}`}>
                                            {response.participantName}
                                            {response.autoSubmittedDueToTabSwitch && (
                                                <span className="ml-2 text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded">Tab Switch</span>
                                            )}
                                        </td>
                                        {availableClasses.length > 0 && (
                                            <td className={`py-3 px-4 ${response.autoSubmittedDueToTabSwitch ? 'text-red-600' : 'text-gray-600'}`}>
                                                {response.participantClass || '-'}
                                            </td>
                                        )}
                                        {availableClasses.length > 0 && (
                                            <td className={`py-3 px-4 ${response.autoSubmittedDueToTabSwitch ? 'text-red-600' : 'text-gray-600'}`}>
                                                {response.participantRollNo || '-'}
                                            </td>
                                        )}
                                        <td className={`py-3 px-4 ${response.autoSubmittedDueToTabSwitch ? 'text-red-700' : 'text-gray-800'}`}>
                                            {response.score} / {response.totalPoints}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`font-medium ${response.autoSubmittedDueToTabSwitch ? 'text-red-600' : 'text-emerald-600'}`}>{response.percentage}%</span>
                                        </td>
                                        <td className="py-3 px-4">
                                            {response.autoSubmittedDueToTabSwitch ? (
                                                <span className="flex items-center text-red-600">
                                                    <XCircle size={16} className="mr-1" /> Caught
                                                </span>
                                            ) : response.passed ? (
                                                <span className="flex items-center text-emerald-600">
                                                    <CheckCircle size={16} className="mr-1" /> Passed
                                                </span>
                                            ) : (
                                                <span className="flex items-center text-red-600">
                                                    <XCircle size={16} className="mr-1" /> Failed
                                                </span>
                                            )}
                                        </td>
                                        <td className={`py-3 px-4 ${response.autoSubmittedDueToTabSwitch ? 'text-red-600' : 'text-gray-600'}`}>
                                            {response.timeTaken
                                                ? `${Math.floor(response.timeTaken / 60)}m ${response.timeTaken % 60}s`
                                                : '-'}
                                        </td>
                                        <td className={`py-3 px-4 ${response.autoSubmittedDueToTabSwitch ? 'text-red-600' : 'text-gray-600'}`}>
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
