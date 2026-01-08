import React, { useState, useEffect } from 'react';
import { 
    ArrowLeft, 
    Calendar, 
    Clock, 
    Users, 
    Video,
    MessageSquare,
    Save,
    Crown,
    CheckCircle,
    XCircle,
    AlertCircle,
    Pause,
    RefreshCw,
    Mail,
    User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { 
    getInterviewById, 
    updateInterviewOutcome,
    formatInterviewDateTime,
    getStatusBadgeClasses,
    getOutcomeBadgeClasses,
    getInterviewTimeStatus
} from '../services/interviewService.js';
import toast from 'react-hot-toast';

const InterviewDetails = ({ interviewId, navigate }) => {
    const { user } = useAuth();
    const [interview, setInterview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Editable fields (host only)
    const [outcome, setOutcome] = useState('pending');
    const [privateNotes, setPrivateNotes] = useState('');

    const isHost = interview?.hostEmail?.toLowerCase() === user?.email?.toLowerCase();

    useEffect(() => {
        fetchInterview();
    }, [interviewId]);

    const fetchInterview = async () => {
        try {
            setLoading(true);
            const data = await getInterviewById(interviewId);
            setInterview(data);
            setOutcome(data.outcome || 'pending');
            setPrivateNotes(data.privateNotes || '');
        } catch (error) {
            console.error('Error fetching interview:', error);
            toast.error(error.message || 'Failed to load interview details');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveOutcome = async () => {
        try {
            setSaving(true);
            await updateInterviewOutcome(interviewId, { outcome, privateNotes });
            toast.success('Interview outcome saved');
        } catch (error) {
            toast.error(error.message || 'Failed to save outcome');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    if (!interview) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle size={64} className="text-gray-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-700 mb-2">Interview Not Found</h2>
                    <p className="text-gray-500 mb-6">This interview may have been deleted or you don't have access.</p>
                    <button
                        onClick={() => navigate('interview-dashboard')}
                        className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const { dateStr, timeStr } = formatInterviewDateTime(interview.scheduledAt, interview.timeZone);
    const timeStatus = getInterviewTimeStatus(interview);

    const outcomeOptions = [
        { value: 'pending', label: 'Pending', icon: Clock, color: 'text-gray-500' },
        { value: 'passed', label: 'Passed', icon: CheckCircle, color: 'text-green-500' },
        { value: 'failed', label: 'Failed', icon: XCircle, color: 'text-red-500' },
        { value: 'on-hold', label: 'On Hold', icon: Pause, color: 'text-yellow-500' },
        { value: 'rescheduled', label: 'Rescheduled', icon: RefreshCw, color: 'text-blue-500' },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => navigate('interview-dashboard')}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-all"
                    >
                        <ArrowLeft size={24} className="text-gray-600" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-gray-900">{interview.title}</h1>
                        <div className="flex items-center gap-3 mt-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClasses(interview.status)}`}>
                                {interview.status.replace('-', ' ')}
                            </span>
                            {isHost && (
                                <span className="flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 text-sm rounded-full">
                                    <Crown size={14} />
                                    You're the host
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Join button if joinable */}
                    {timeStatus.canJoin && interview.status !== 'cancelled' && interview.status !== 'completed' && (
                        <button
                            onClick={() => navigate(`interview-room/${interview._id}`)}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                        >
                            <Video size={20} />
                            Join Interview
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Schedule Info */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Calendar className="text-emerald-600" size={20} />
                                Schedule
                            </h2>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">Date</p>
                                    <p className="font-medium text-gray-900">{dateStr}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Time</p>
                                    <p className="font-medium text-gray-900">{timeStr}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Duration</p>
                                    <p className="font-medium text-gray-900">{interview.duration} minutes</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Timezone</p>
                                    <p className="font-medium text-gray-900">{interview.timeZone}</p>
                                </div>
                            </div>

                            {/* Time status message */}
                            {timeStatus.isUpcoming && (
                                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2 text-blue-700">
                                    <Clock size={18} />
                                    <span>Starts in {timeStatus.timeUntilStart}</span>
                                </div>
                            )}
                            
                            {timeStatus.canJoin && interview.status !== 'completed' && (
                                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
                                    <Video size={18} />
                                    <span>You can join now!</span>
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        {interview.description && (
                            <div className="bg-white rounded-xl shadow-sm p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
                                <p className="text-gray-600 whitespace-pre-wrap">{interview.description}</p>
                            </div>
                        )}

                        {/* Participants */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Users className="text-emerald-600" size={20} />
                                Participants ({interview.participants.length + 1})
                            </h2>

                            <div className="space-y-3">
                                {/* Host */}
                                <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
                                    <div className="w-10 h-10 bg-emerald-200 rounded-full flex items-center justify-center">
                                        <User size={20} className="text-emerald-700" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-emerald-800">
                                            {interview.host?.name || 'Host'}
                                        </p>
                                        <p className="text-sm text-emerald-600">{interview.hostEmail}</p>
                                    </div>
                                    <span className="px-2 py-1 bg-emerald-200 text-emerald-800 text-xs rounded-full font-medium">
                                        Host
                                    </span>
                                </div>

                                {/* Other participants */}
                                {interview.participants.map((participant, idx) => (
                                    <div 
                                        key={idx}
                                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                                    >
                                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                            <Mail size={18} className="text-gray-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-800">{participant.name}</p>
                                            <p className="text-sm text-gray-500">{participant.email}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full capitalize">
                                                {participant.role}
                                            </span>
                                            {participant.hasJoined && (
                                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                                                    Joined
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Chat History (if any) */}
                        {interview.chatMessages && interview.chatMessages.length > 0 && (
                            <div className="bg-white rounded-xl shadow-sm p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <MessageSquare className="text-emerald-600" size={20} />
                                    Chat History ({interview.chatMessages.length} messages)
                                </h2>

                                <div className="max-h-64 overflow-y-auto space-y-3">
                                    {interview.chatMessages.map((msg, idx) => (
                                        <div key={idx} className="flex gap-3">
                                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                                                <span className="text-xs font-bold text-gray-600">
                                                    {msg.senderName?.[0]?.toUpperCase() || 'U'}
                                                </span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-gray-800 text-sm">
                                                        {msg.senderName}
                                                    </span>
                                                    <span className="text-xs text-gray-400">
                                                        {new Date(msg.timestamp).toLocaleString()}
                                                    </span>
                                                </div>
                                                <p className="text-gray-600 text-sm">{msg.message}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Outcome & Notes (Host only, for completed interviews) */}
                        {isHost && (
                            <div className="bg-white rounded-xl shadow-sm p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                    Interview Outcome
                                </h2>

                                {/* Outcome Selection */}
                                <div className="space-y-2 mb-6">
                                    {outcomeOptions.map(option => {
                                        const Icon = option.icon;
                                        return (
                                            <label
                                                key={option.value}
                                                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border-2 transition-all ${
                                                    outcome === option.value
                                                        ? 'border-emerald-500 bg-emerald-50'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="outcome"
                                                    value={option.value}
                                                    checked={outcome === option.value}
                                                    onChange={(e) => setOutcome(e.target.value)}
                                                    className="hidden"
                                                />
                                                <Icon size={20} className={option.color} />
                                                <span className="font-medium">{option.label}</span>
                                            </label>
                                        );
                                    })}
                                </div>

                                {/* Private Notes */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Private Notes (only visible to you)
                                    </label>
                                    <textarea
                                        value={privateNotes}
                                        onChange={(e) => setPrivateNotes(e.target.value)}
                                        rows={5}
                                        placeholder="Add your notes about the interview..."
                                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                                    />
                                </div>

                                {/* Save Button */}
                                <button
                                    onClick={handleSaveOutcome}
                                    disabled={saving}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-all disabled:opacity-50"
                                >
                                    {saving ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={18} />
                                            Save Outcome
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        {/* Current Outcome (for non-host viewing completed interviews) */}
                        {!isHost && interview.status === 'completed' && interview.outcome !== 'pending' && (
                            <div className="bg-white rounded-xl shadow-sm p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                    Interview Outcome
                                </h2>
                                <div className={`px-4 py-3 rounded-lg text-center ${getOutcomeBadgeClasses(interview.outcome)}`}>
                                    <span className="font-medium text-lg capitalize">{interview.outcome}</span>
                                </div>
                            </div>
                        )}

                        {/* Settings */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Settings</h2>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Video</span>
                                    <span className={interview.settings?.enableVideo ? 'text-green-600' : 'text-gray-400'}>
                                        {interview.settings?.enableVideo ? 'Enabled' : 'Disabled'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Audio</span>
                                    <span className={interview.settings?.enableAudio ? 'text-green-600' : 'text-gray-400'}>
                                        {interview.settings?.enableAudio ? 'Enabled' : 'Disabled'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Chat</span>
                                    <span className={interview.settings?.enableChat ? 'text-green-600' : 'text-gray-400'}>
                                        {interview.settings?.enableChat ? 'Enabled' : 'Disabled'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Screen Share</span>
                                    <span className={interview.settings?.enableScreenShare ? 'text-green-600' : 'text-gray-400'}>
                                        {interview.settings?.enableScreenShare ? 'Enabled' : 'Disabled'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Timestamps */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h2>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Created</span>
                                    <span className="text-gray-900">
                                        {new Date(interview.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                {interview.endedAt && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600">Ended</span>
                                        <span className="text-gray-900">
                                            {new Date(interview.endedAt).toLocaleString()}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InterviewDetails;
