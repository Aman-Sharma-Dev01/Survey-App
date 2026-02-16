import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PlusCircle, Loader, Trash2, BarChart3, Link, Play, Eye, EyeOff, Edit, Search, QrCode, Users, ExternalLink, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { getCreatorQuizzes, deleteQuiz, updateQuizPublishStatus, getQuizQRCodeUrl, getQuizShareUrl } from '../services/quizService';

// ── Time helpers ──
const getDateBucket = (dateStr) => {
    const now = new Date();
    const date = new Date(dateStr);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);

    if (date >= todayStart) return 'today';
    if (date >= yesterdayStart) return 'yesterday';
    if (date >= weekStart) return 'thisWeek';
    return 'older';
};

const BUCKET_LABELS = {
    today: { label: '🕐 Today', color: 'text-emerald-700' },
    yesterday: { label: '📅 Yesterday', color: 'text-blue-700' },
    thisWeek: { label: '📆 This Week', color: 'text-purple-700' },
    older: { label: '📁 Older', color: 'text-gray-600' }
};

const groupByTime = (quizzes) => {
    const groups = { today: [], yesterday: [], thisWeek: [], older: [] };
    quizzes.forEach(q => {
        const bucket = getDateBucket(q.createdAt);
        groups[bucket].push(q);
    });
    return groups;
};

// ── Quiz Card ──
const QuizCard = ({ quiz, onPublish, onDelete, onAnalytics, onEdit, onShowQR, onPreview, currentUserId }) => {
    const [copying, setCopying] = useState(false);
    const [showCollaborators, setShowCollaborators] = useState(false);
    const isOwner = quiz.creator?.toString() === currentUserId || (typeof quiz.creator === 'object' && quiz.creator?._id?.toString() === currentUserId);

    const creatorName = typeof quiz.creator === 'object' ? quiz.creator?.name : null;
    const creatorEmail = typeof quiz.creator === 'object' ? quiz.creator?.email : null;

    const collaborators = quiz.collaborators || [];

    const handleCopy = async () => {
        setCopying(true);
        const link = `${window.location.origin}/quiz/${quiz._id}`;
        try {
            await navigator.clipboard.writeText(link);
            setTimeout(() => setCopying(false), 1500);
        } catch {
            setCopying(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border border-emerald-100 p-5 hover:shadow-xl transition">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <h3 className="text-lg font-bold text-gray-800">{quiz.title}</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{quiz.description || 'No description'}</p>
                </div>
                <div className="flex items-center gap-2">
                    {!isOwner && (
                        <span className="relative group">
                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 flex items-center gap-1 cursor-default">
                                <Users size={12} /> Shared
                            </span>
                            {(creatorEmail || creatorName) && (
                                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30">
                                    Shared by: {creatorEmail || creatorName}
                                    <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                                </span>
                            )}
                        </span>
                    )}
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${quiz.isPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                        {quiz.isPublished ? 'Published' : 'Draft'}
                    </span>
                </div>
            </div>

            {/* Collaborators display for owned quizzes */}
            {isOwner && collaborators.length > 0 && (
                <div className="mb-3 relative">
                    <button
                        onClick={() => setShowCollaborators(!showCollaborators)}
                        className="flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-800 font-medium transition"
                    >
                        <Users size={14} />
                        Shared with {collaborators.length} {collaborators.length === 1 ? 'person' : 'people'}
                    </button>

                    {showCollaborators && (
                        <div className="absolute top-6 left-0 z-20 bg-white border border-purple-200 rounded-lg shadow-xl p-3 min-w-[240px]">
                            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Collaborators</p>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                {collaborators.map((collab, idx) => {
                                    const userName = typeof collab.user === 'object' ? collab.user?.name : null;
                                    const userEmail = collab.email || (typeof collab.user === 'object' ? collab.user?.email : null);
                                    return (
                                        <div key={idx} className="flex items-center justify-between gap-2 py-1">
                                            <div className="min-w-0">
                                                {userName && <p className="text-sm font-medium text-gray-800 truncate">{userName}</p>}
                                                <p className="text-xs text-gray-500 truncate">{userEmail || 'Unknown'}</p>
                                            </div>
                                            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${collab.role === 'editor' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                                                {collab.role || 'editor'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                            <button
                                onClick={() => setShowCollaborators(false)}
                                className="mt-2 text-xs text-gray-400 hover:text-gray-600 w-full text-center"
                            >
                                Close
                            </button>
                        </div>
                    )}
                </div>
            )}

            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                <span>{quiz.questions?.length || 0} questions</span>
                <span>•</span>
                <span>{quiz.attemptCount || 0} attempts</span>
                {quiz.settings?.timeLimit > 0 && (
                    <>
                        <span>•</span>
                        <span>{quiz.settings.timeLimit} min</span>
                    </>
                )}
            </div>

            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => onPublish(quiz, !quiz.isPublished)}
                    className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition ${quiz.isPublished
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                        }`}
                >
                    {quiz.isPublished ? <EyeOff size={16} className="mr-1" /> : <Eye size={16} className="mr-1" />}
                    {quiz.isPublished ? 'Unpublish' : 'Publish'}
                </button>

                {quiz.isPublished && (
                    <>
                        <button
                            onClick={handleCopy}
                            className="flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition"
                        >
                            <Link size={16} className="mr-1" />
                            {copying ? 'Copied!' : 'Copy Link'}
                        </button>

                        <button
                            onClick={() => onShowQR(quiz)}
                            className="flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition"
                            title="Show QR Code"
                        >
                            <QrCode size={16} className="mr-1" />
                            QR
                        </button>
                    </>
                )}

                <button
                    onClick={() => onPreview(quiz._id)}
                    className="flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-cyan-100 text-cyan-700 hover:bg-cyan-200 transition"
                    title="Preview quiz as student"
                >
                    <ExternalLink size={16} className="mr-1" /> Preview
                </button>

                <button
                    onClick={() => onEdit(quiz._id)}
                    className="flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-amber-100 text-amber-700 hover:bg-amber-200 transition"
                >
                    <Edit size={16} className="mr-1" /> Edit
                </button>

                <button
                    onClick={() => onAnalytics(quiz._id)}
                    className="flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 transition"
                >
                    <BarChart3 size={16} className="mr-1" /> Analytics
                </button>

                {isOwner && (
                    <button
                        onClick={() => onDelete(quiz._id)}
                        className="flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 transition"
                    >
                        <Trash2 size={16} className="mr-1" /> Delete
                    </button>
                )}
            </div>
        </div>
    );
};

// ── Dashboard Page ──
const QuizDashboardPage = ({ navigate }) => {
    const { isAuthenticated, user } = useAuth();
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [showQRModal, setShowQRModal] = useState(false);
    const [selectedQuiz, setSelectedQuiz] = useState(null);
    const [activeTab, setActiveTab] = useState('mine');

    const fetchQuizzes = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await getCreatorQuizzes();
            setQuizzes(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
        } catch (err) {
            setError('Failed to load quizzes');
            setQuizzes([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            fetchQuizzes();
        }
    }, [isAuthenticated, fetchQuizzes]);

    const handlePublish = async (quiz, isPublished) => {
        try {
            await updateQuizPublishStatus(quiz._id, isPublished);
            fetchQuizzes();
        } catch (err) {
            setError(`Failed to ${isPublished ? 'publish' : 'unpublish'} quiz`);
        }
    };

    const handleDelete = async (quizId) => {
        if (!window.confirm('Delete this quiz and all its responses?')) return;
        try {
            await deleteQuiz(quizId);
            fetchQuizzes();
        } catch (err) {
            setError('Failed to delete quiz');
        }
    };

    const handleEdit = (quizId) => {
        navigate(`quiz-edit/${quizId}`);
    };

    const handleAnalytics = (quizId) => {
        navigate(`quiz-analytics/${quizId}`);
    };

    const handlePreview = (quizId) => {
        window.open(`${window.location.origin}/quiz/${quizId}`, '_blank');
    };

    // QR modal handlers
    const copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
        } catch (e) {
            console.error('Copy failed', e);
        }
    };

    const closeQRModal = () => {
        setShowQRModal(false);
        setSelectedQuiz(null);
    };

    // ── Filtering & grouping logic ──
    const isOwner = useCallback((quiz) => {
        const creatorId = typeof quiz.creator === 'object' ? quiz.creator?._id : quiz.creator;
        return creatorId?.toString() === user?._id;
    }, [user]);

    const filterBySearch = useCallback((quiz) => {
        const q = searchQuery.toLowerCase().trim();
        if (!q) return true;
        return (
            quiz.title?.toLowerCase().includes(q) ||
            quiz.description?.toLowerCase().includes(q)
        );
    }, [searchQuery]);

    const myQuizzes = useMemo(() => quizzes.filter(q => isOwner(q)).filter(filterBySearch), [quizzes, isOwner, filterBySearch]);
    const sharedQuizzes = useMemo(() => quizzes.filter(q => !isOwner(q)).filter(filterBySearch), [quizzes, isOwner, filterBySearch]);
    const sharedByMe = useMemo(() => quizzes.filter(q => isOwner(q) && q.collaborators && q.collaborators.length > 0).filter(filterBySearch), [quizzes, isOwner, filterBySearch]);

    const activeQuizzes = activeTab === 'mine' ? myQuizzes : activeTab === 'shared' ? sharedQuizzes : sharedByMe;
    const groupedQuizzes = useMemo(() => groupByTime(activeQuizzes), [activeQuizzes]);

    const renderQuizGrid = (quizList) => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizList.map(quiz => (
                <QuizCard
                    key={quiz._id}
                    quiz={quiz}
                    currentUserId={user?._id}
                    onPublish={handlePublish}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                    onAnalytics={handleAnalytics}
                    onPreview={handlePreview}
                    onShowQR={(q) => {
                        setSelectedQuiz(q);
                        setShowQRModal(true);
                    }}
                />
            ))}
        </div>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader className="animate-spin text-emerald-600" size={48} />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-emerald-800">Quiz Dashboard</h1>
                    <p className="text-gray-600 mt-1">Create and manage your quizzes</p>
                </div>
                <button
                    onClick={() => navigate('quiz-create')}
                    className="flex items-center justify-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium shadow-lg"
                >
                    <PlusCircle size={20} className="mr-2" /> Create Quiz
                </button>
            </div>

            {/* Tab Bar */}
            <div className="flex border-b border-gray-200 mb-6">
                <button
                    onClick={() => setActiveTab('mine')}
                    className={`px-5 py-3 text-sm font-semibold transition-colors relative ${activeTab === 'mine'
                        ? 'text-emerald-700'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    📝 My Quizzes
                    <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${activeTab === 'mine' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                        {myQuizzes.length}
                    </span>
                    {activeTab === 'mine' && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-t" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('shared')}
                    className={`px-5 py-3 text-sm font-semibold transition-colors relative ${activeTab === 'shared'
                        ? 'text-blue-700'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Users size={16} className="inline mr-1 -mt-0.5" />
                    Shared with Me
                    <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${activeTab === 'shared' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                        {sharedQuizzes.length}
                    </span>
                    {activeTab === 'shared' && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('byMe')}
                    className={`px-5 py-3 text-sm font-semibold transition-colors relative ${activeTab === 'byMe'
                        ? 'text-purple-700'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    🔗 Shared by Me
                    <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${activeTab === 'byMe' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
                        {sharedByMe.length}
                    </span>
                    {activeTab === 'byMe' && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 rounded-t" />
                    )}
                </button>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
                <div className="relative max-w-md">
                    <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder={`Search ${activeTab === 'mine' ? 'your' : activeTab === 'shared' ? 'shared' : 'shared by you'} quizzes...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            ×
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>
            )}

            {/* Time-grouped quiz sections */}
            {activeQuizzes.length > 0 ? (
                <div className="space-y-8">
                    {searchQuery && (
                        <p className="text-sm text-gray-500">
                            Showing {activeQuizzes.length} result{activeQuizzes.length !== 1 ? 's' : ''} for "{searchQuery}"
                        </p>
                    )}

                    {Object.entries(BUCKET_LABELS).map(([key, { label, color }]) => {
                        const bucketQuizzes = groupedQuizzes[key];
                        if (!bucketQuizzes || bucketQuizzes.length === 0) return null;

                        return (
                            <div key={key}>
                                <h3 className={`text-lg font-bold ${color} mb-4 flex items-center gap-2`}>
                                    {label}
                                    <span className="text-sm font-normal text-gray-400">({bucketQuizzes.length})</span>
                                </h3>
                                {renderQuizGrid(bucketQuizzes)}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                    {activeTab === 'mine' ? (
                        <>
                            <Play size={48} className="mx-auto text-gray-400 mb-4" />
                            <h2 className="text-xl font-semibold text-gray-700 mb-2">
                                {searchQuery ? 'No quizzes found' : 'No quizzes yet'}
                            </h2>
                            <p className="text-gray-500 mb-4">
                                {searchQuery ? `No quizzes match "${searchQuery}"` : 'Create your first quiz to get started'}
                            </p>
                            {searchQuery ? (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                                >
                                    Clear Search
                                </button>
                            ) : (
                                <button
                                    onClick={() => navigate('quiz-create')}
                                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                                >
                                    Create Your First Quiz
                                </button>
                            )}
                        </>
                    ) : activeTab === 'shared' ? (
                        <>
                            <Users size={48} className="mx-auto text-blue-300 mb-4" />
                            <h2 className="text-xl font-semibold text-gray-700 mb-2">
                                {searchQuery ? 'No shared quizzes found' : 'No shared quizzes'}
                            </h2>
                            <p className="text-gray-500 mb-4">
                                {searchQuery
                                    ? `No shared quizzes match "${searchQuery}"`
                                    : 'When someone shares a quiz with you, it will appear here'}
                            </p>
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                                >
                                    Clear Search
                                </button>
                            )}
                        </>
                    ) : (
                        <>
                            <Users size={48} className="mx-auto text-purple-300 mb-4" />
                            <h2 className="text-xl font-semibold text-gray-700 mb-2">
                                {searchQuery ? 'No results found' : 'No quizzes shared by you'}
                            </h2>
                            <p className="text-gray-500 mb-4">
                                {searchQuery
                                    ? `No quizzes match "${searchQuery}"`
                                    : 'Add collaborators to a quiz and it will appear here'}
                            </p>
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                                >
                                    Clear Search
                                </button>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* QR Code Modal */}
            {showQRModal && selectedQuiz && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6">
                        <div className="text-center">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">Quiz QR Code</h2>

                            <div className="bg-gray-50 rounded-xl p-4 mb-4">
                                <p className="text-sm text-gray-600 mb-2">{selectedQuiz.title}</p>
                                <p className="font-mono text-sm bg-white px-3 py-1 rounded inline-block">{selectedQuiz._id}</p>
                            </div>

                            <img
                                src={getQuizQRCodeUrl(selectedQuiz._id)}
                                alt="Quiz QR Code"
                                className="mx-auto w-48 h-48 rounded-lg shadow-lg mb-4"
                            />

                            <div className="space-y-2 mb-4">
                                <p className="text-sm text-gray-500">Share URL:</p>
                                <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
                                    <input
                                        type="text"
                                        value={getQuizShareUrl(selectedQuiz._id)}
                                        readOnly
                                        className="flex-1 text-xs bg-transparent outline-none"
                                    />
                                    <button
                                        onClick={() => copyToClipboard(getQuizShareUrl(selectedQuiz._id))}
                                        className="px-2 py-1 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700"
                                    >
                                        Copy
                                    </button>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={closeQRModal}
                                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Close
                                </button>
                                <a
                                    href={getQuizQRCodeUrl(selectedQuiz._id)}
                                    download={`quiz-${selectedQuiz._id}-qr.png`}
                                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-center"
                                >
                                    Download QR
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuizDashboardPage;
