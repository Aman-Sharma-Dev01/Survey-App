import React, { useState, useEffect, useCallback } from 'react';
import { PlusCircle, Loader, Trash2, BarChart3, Link, Play, Eye, EyeOff, Edit } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { getCreatorQuizzes, deleteQuiz, updateQuizPublishStatus } from '../services/quizService';

const QuizCard = ({ quiz, onPublish, onDelete, onAnalytics, onEdit, onCopyLink }) => {
    const [copying, setCopying] = useState(false);

    const handleCopy = async () => {
        setCopying(true);
        const link = `${window.location.origin}/#quiz/${quiz._id}`;
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
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    quiz.isPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                }`}>
                    {quiz.isPublished ? 'Published' : 'Draft'}
                </span>
            </div>

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
                    className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                        quiz.isPublished 
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                            : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                    }`}
                >
                    {quiz.isPublished ? <EyeOff size={16} className="mr-1" /> : <Eye size={16} className="mr-1" />}
                    {quiz.isPublished ? 'Unpublish' : 'Publish'}
                </button>

                {quiz.isPublished && (
                    <button
                        onClick={handleCopy}
                        className="flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition"
                    >
                        <Link size={16} className="mr-1" />
                        {copying ? 'Copied!' : 'Copy Link'}
                    </button>
                )}

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

                <button
                    onClick={() => onDelete(quiz._id)}
                    className="flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 transition"
                >
                    <Trash2 size={16} className="mr-1" /> Delete
                </button>
            </div>
        </div>
    );
};

const QuizDashboardPage = ({ navigate }) => {
    const { isAuthenticated } = useAuth();
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader className="animate-spin text-emerald-600" size={48} />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
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

            {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>
            )}

            {quizzes.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                    <Play size={48} className="mx-auto text-gray-400 mb-4" />
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">No quizzes yet</h2>
                    <p className="text-gray-500 mb-4">Create your first quiz to get started</p>
                    <button
                        onClick={() => navigate('quiz-create')}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                    >
                        Create Your First Quiz
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {quizzes.map(quiz => (
                        <QuizCard
                            key={quiz._id}
                            quiz={quiz}
                            onPublish={handlePublish}
                            onDelete={handleDelete}
                            onEdit={handleEdit}
                            onAnalytics={handleAnalytics}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default QuizDashboardPage;
