import React, { useState, useEffect } from 'react';
import { 
    Calendar, 
    Plus, 
    Clock, 
    Users, 
    Video, 
    ChevronRight, 
    Search,
    Filter,
    Trash2,
    Edit2,
    CheckCircle,
    XCircle,
    AlertCircle,
    RefreshCw,
    Crown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { 
    getInterviews, 
    deleteInterview, 
    formatInterviewDateTime, 
    getInterviewTimeStatus,
    getStatusBadgeClasses,
    getOutcomeBadgeClasses
} from '../services/interviewService.js';
import toast from 'react-hot-toast';

const InterviewDashboard = ({ navigate }) => {
    const { user } = useAuth();
    const [interviews, setInterviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, upcoming, completed, cancelled
    const [searchQuery, setSearchQuery] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    // Check if user has premium access
    const hasPremium = user?.plan !== 'free' || user?.email?.endsWith('@mru.edu.in');

    useEffect(() => {
        if (!hasPremium) {
            toast.error('Interview scheduling is a Pro feature');
            navigate('home');
            return;
        }
        fetchInterviews();
    }, [hasPremium]);

    const fetchInterviews = async () => {
        try {
            setLoading(true);
            const data = await getInterviews();
            setInterviews(data);
        } catch (error) {
            console.error('Error fetching interviews:', error);
            toast.error('Failed to load interviews');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (interviewId) => {
        try {
            await deleteInterview(interviewId);
            toast.success('Interview cancelled successfully');
            setDeleteConfirm(null);
            fetchInterviews();
        } catch (error) {
            toast.error(error.message || 'Failed to cancel interview');
        }
    };

    const handleJoin = async (interview) => {
        navigate(`interview-room/${interview._id}`);
    };

    // Filter and search interviews
    const filteredInterviews = interviews.filter(interview => {
        // Apply status filter
        if (filter === 'upcoming' && interview.status !== 'scheduled') return false;
        if (filter === 'in-progress' && interview.status !== 'in-progress') return false;
        if (filter === 'completed' && interview.status !== 'completed') return false;
        if (filter === 'cancelled' && interview.status !== 'cancelled') return false;
        
        // Apply search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchesTitle = interview.title.toLowerCase().includes(query);
            const matchesParticipant = interview.participants.some(p => 
                p.email.toLowerCase().includes(query) || 
                p.name?.toLowerCase().includes(query)
            );
            return matchesTitle || matchesParticipant;
        }
        
        return true;
    });

    // Sort: in-progress first, then upcoming (by date), then rest
    const sortedInterviews = [...filteredInterviews].sort((a, b) => {
        if (a.status === 'in-progress' && b.status !== 'in-progress') return -1;
        if (b.status === 'in-progress' && a.status !== 'in-progress') return 1;
        if (a.status === 'scheduled' && b.status !== 'scheduled') return -1;
        if (b.status === 'scheduled' && a.status !== 'scheduled') return 1;
        return new Date(a.scheduledAt) - new Date(b.scheduledAt);
    });

    if (!hasPremium) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 flex items-center justify-center">
                <div className="text-center">
                    <Crown size={64} className="mx-auto text-yellow-500 mb-4" />
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Pro Feature</h2>
                    <p className="text-gray-600 mb-4">Interview scheduling is available for Pro users only.</p>
                    <button
                        onClick={() => navigate('pricing')}
                        className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                    >
                        Upgrade to Pro
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <Calendar className="text-emerald-600" />
                            Interview Dashboard
                        </h1>
                        <p className="text-gray-600 mt-1">Schedule and manage your interviews</p>
                    </div>
                    <button
                        onClick={() => navigate('interview-schedule')}
                        className="mt-4 sm:mt-0 flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all transform hover:scale-105"
                    >
                        <Plus size={20} />
                        Schedule Interview
                    </button>
                </div>

                {/* Filters and Search */}
                <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search interviews by title or participant..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            />
                        </div>
                        
                        {/* Filter Tabs */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-1">
                            {[
                                { id: 'all', label: 'All' },
                                { id: 'upcoming', label: 'Upcoming' },
                                { id: 'in-progress', label: 'In Progress' },
                                { id: 'completed', label: 'Completed' },
                                { id: 'cancelled', label: 'Cancelled' },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setFilter(tab.id)}
                                    className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                                        filter === tab.id
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Refresh Button */}
                        <button
                            onClick={fetchInterviews}
                            className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-gray-100 rounded-lg transition-all"
                            title="Refresh"
                        >
                            <RefreshCw size={20} />
                        </button>
                    </div>
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
                    </div>
                ) : sortedInterviews.length === 0 ? (
                    /* Empty State */
                    <div className="text-center py-20 bg-white rounded-xl shadow-sm">
                        <Calendar size={64} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">
                            {filter === 'all' ? 'No Interviews Yet' : `No ${filter} Interviews`}
                        </h3>
                        <p className="text-gray-500 mb-6">
                            {filter === 'all' 
                                ? 'Schedule your first interview to get started'
                                : 'Try changing the filter or schedule a new interview'
                            }
                        </p>
                        <button
                            onClick={() => navigate('interview-schedule')}
                            className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-all"
                        >
                            <Plus size={18} />
                            Schedule Interview
                        </button>
                    </div>
                ) : (
                    /* Interview Cards Grid */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sortedInterviews.map(interview => {
                            const { dateStr, timeStr } = formatInterviewDateTime(interview.scheduledAt, interview.timeZone);
                            const timeStatus = getInterviewTimeStatus(interview);
                            const isHost = interview.hostEmail?.toLowerCase() === user?.email?.toLowerCase();

                            return (
                                <div
                                    key={interview._id}
                                    className={`bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all ${
                                        interview.status === 'in-progress' ? 'ring-2 ring-green-500' : ''
                                    }`}
                                >
                                    {/* Card Header */}
                                    <div className={`p-4 ${
                                        interview.status === 'in-progress' 
                                            ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                                            : 'bg-gradient-to-r from-emerald-500 to-green-600'
                                    }`}>
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h3 className="font-bold text-white text-lg truncate">
                                                    {interview.title}
                                                </h3>
                                                <p className="text-white/80 text-sm mt-1">
                                                    {isHost ? 'You are the host' : `Host: ${interview.host?.name || 'Unknown'}`}
                                                </p>
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClasses(interview.status)}`}>
                                                {interview.status.replace('-', ' ')}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Card Body */}
                                    <div className="p-4 space-y-3">
                                        {/* Date & Time */}
                                        <div className="flex items-center gap-3 text-gray-600">
                                            <Clock size={18} className="text-emerald-600" />
                                            <div>
                                                <p className="font-medium">{dateStr}</p>
                                                <p className="text-sm">{timeStr} • {interview.duration} mins</p>
                                            </div>
                                        </div>

                                        {/* Participants */}
                                        <div className="flex items-center gap-3 text-gray-600">
                                            <Users size={18} className="text-emerald-600" />
                                            <div className="flex-1">
                                                <p className="font-medium">
                                                    {interview.participants.length} Participant{interview.participants.length !== 1 ? 's' : ''}
                                                </p>
                                                <p className="text-sm truncate">
                                                    {interview.participants.slice(0, 2).map(p => p.name || p.email.split('@')[0]).join(', ')}
                                                    {interview.participants.length > 2 && ` +${interview.participants.length - 2} more`}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Time Status */}
                                        {timeStatus.isUpcoming && (
                                            <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-3 py-2 rounded-lg text-sm">
                                                <AlertCircle size={16} />
                                                <span>Starts in {timeStatus.timeUntilStart}</span>
                                            </div>
                                        )}

                                        {timeStatus.inProgress && interview.status === 'in-progress' && (
                                            <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-2 rounded-lg text-sm animate-pulse">
                                                <Video size={16} />
                                                <span>Interview in progress</span>
                                            </div>
                                        )}

                                        {/* Outcome (for completed interviews) */}
                                        {interview.status === 'completed' && interview.outcome !== 'pending' && (
                                            <div className={`px-3 py-2 rounded-lg text-sm ${getOutcomeBadgeClasses(interview.outcome)}`}>
                                                Outcome: {interview.outcome}
                                            </div>
                                        )}
                                    </div>

                                    {/* Card Actions */}
                                    <div className="px-4 pb-4 pt-2 border-t border-gray-100 flex items-center gap-2">
                                        {/* Join Button */}
                                        {timeStatus.canJoin && interview.status !== 'cancelled' && (
                                            <button
                                                onClick={() => handleJoin(interview)}
                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-all"
                                            >
                                                <Video size={18} />
                                                Join Now
                                            </button>
                                        )}

                                        {!timeStatus.canJoin && timeStatus.canJoinIn && interview.status === 'scheduled' && (
                                            <button
                                                disabled
                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-500 rounded-lg font-medium cursor-not-allowed"
                                            >
                                                <Clock size={18} />
                                                Join {timeStatus.canJoinIn}
                                            </button>
                                        )}

                                        {/* View Details */}
                                        <button
                                            onClick={() => navigate(`interview-details/${interview._id}`)}
                                            className="px-3 py-2 text-gray-600 hover:text-emerald-600 hover:bg-gray-100 rounded-lg transition-all"
                                            title="View Details"
                                        >
                                            <ChevronRight size={20} />
                                        </button>

                                        {/* Edit (host only, not completed/cancelled) */}
                                        {isHost && !['completed', 'cancelled'].includes(interview.status) && (
                                            <button
                                                onClick={() => navigate(`interview-edit/${interview._id}`)}
                                                className="px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-all"
                                                title="Edit"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                        )}

                                        {/* Delete (host only) */}
                                        {isHost && interview.status !== 'completed' && (
                                            <button
                                                onClick={() => setDeleteConfirm(interview._id)}
                                                className="px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded-lg transition-all"
                                                title="Cancel Interview"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {deleteConfirm && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                    <Trash2 className="text-red-600" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Cancel Interview?</h3>
                                    <p className="text-gray-600 text-sm">This action cannot be undone.</p>
                                </div>
                            </div>
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                                >
                                    Keep It
                                </button>
                                <button
                                    onClick={() => handleDelete(deleteConfirm)}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
                                >
                                    Yes, Cancel Interview
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InterviewDashboard;
