import React, { useState } from 'react';
import { 
    Calendar, 
    Clock, 
    Users, 
    Plus, 
    X, 
    Mail, 
    ArrowLeft,
    Save,
    AlertCircle,
    Video,
    Mic,
    MessageSquare,
    Monitor,
    Crown,
    User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { createInterview } from '../services/interviewService.js';
import toast from 'react-hot-toast';

const InterviewSchedule = ({ navigate }) => {
    const { user } = useAuth();
    
    // Check if user has premium access
    const hasPremium = user?.plan !== 'free' || user?.email?.endsWith('@mru.edu.in');

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        scheduledDate: '',
        scheduledTime: '',
        duration: 60,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        settings: {
            enableVideo: true,
            enableAudio: true,
            enableChat: true,
            enableScreenShare: true,
            maxParticipants: 10
        }
    });

    const [participants, setParticipants] = useState([]);
    const [newParticipant, setNewParticipant] = useState({ email: '', name: '', role: 'candidate' });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    // Validate email format
    const isValidEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    // Add participant
    const addParticipant = () => {
        const email = newParticipant.email.trim().toLowerCase();
        
        if (!email) {
            toast.error('Please enter an email address');
            return;
        }

        if (!isValidEmail(email)) {
            toast.error('Please enter a valid email address');
            return;
        }

        if (email === user?.email?.toLowerCase()) {
            toast.error('You are automatically added as the host');
            return;
        }

        if (participants.some(p => p.email.toLowerCase() === email)) {
            toast.error('This participant is already added');
            return;
        }

        setParticipants([...participants, {
            email,
            name: newParticipant.name.trim() || email.split('@')[0],
            role: newParticipant.role
        }]);

        setNewParticipant({ email: '', name: '', role: 'candidate' });
    };

    // Remove participant
    const removeParticipant = (email) => {
        setParticipants(participants.filter(p => p.email !== email));
    };

    // Handle form field change
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        if (name.startsWith('settings.')) {
            const settingKey = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                settings: {
                    ...prev.settings,
                    [settingKey]: type === 'checkbox' ? checked : value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }

        // Clear error when field is edited
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    // Validate form
    const validateForm = () => {
        const newErrors = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Interview title is required';
        }

        if (!formData.scheduledDate) {
            newErrors.scheduledDate = 'Please select a date';
        }

        if (!formData.scheduledTime) {
            newErrors.scheduledTime = 'Please select a time';
        }

        // Check if scheduled time is in the future
        if (formData.scheduledDate && formData.scheduledTime) {
            const scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);
            if (scheduledDateTime <= new Date()) {
                newErrors.scheduledDate = 'Interview must be scheduled for a future time';
            }
        }

        if (participants.length === 0) {
            newErrors.participants = 'Please add at least one participant';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Submit form
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error('Please fix the errors before submitting');
            return;
        }

        try {
            setLoading(true);

            // Combine date and time
            const scheduledAt = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`).toISOString();

            const interviewData = {
                title: formData.title.trim(),
                description: formData.description.trim(),
                scheduledAt,
                duration: parseInt(formData.duration),
                timeZone: formData.timeZone,
                participants,
                settings: formData.settings
            };

            await createInterview(interviewData);
            
            toast.success('Interview scheduled successfully! Invitations sent.');
            navigate('interview-dashboard');
        } catch (error) {
            console.error('Error scheduling interview:', error);
            toast.error(error.message || 'Failed to schedule interview');
        } finally {
            setLoading(false);
        }
    };

    // Get minimum date (today)
    const getMinDate = () => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };

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
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => navigate('interview-dashboard')}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-all"
                    >
                        <ArrowLeft size={24} className="text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <Calendar className="text-emerald-600" />
                            Schedule Interview
                        </h1>
                        <p className="text-gray-600 mt-1">Set up a new interview with participants</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Details */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Interview Details</h2>
                        
                        {/* Title */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Interview Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="e.g., Frontend Developer Interview - Round 1"
                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                                    errors.title ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                }`}
                            />
                            {errors.title && (
                                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                    <AlertCircle size={14} />
                                    {errors.title}
                                </p>
                            )}
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description (Optional)
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={3}
                                placeholder="Add any notes or agenda for the interview..."
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                            />
                        </div>
                    </div>

                    {/* Schedule */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Clock className="text-emerald-600" size={20} />
                            Schedule
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Date */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    name="scheduledDate"
                                    value={formData.scheduledDate}
                                    onChange={handleChange}
                                    min={getMinDate()}
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                                        errors.scheduledDate ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                    }`}
                                />
                                {errors.scheduledDate && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                        <AlertCircle size={14} />
                                        {errors.scheduledDate}
                                    </p>
                                )}
                            </div>

                            {/* Time */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Time <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="time"
                                    name="scheduledTime"
                                    value={formData.scheduledTime}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                                        errors.scheduledTime ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                    }`}
                                />
                                {errors.scheduledTime && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                        <AlertCircle size={14} />
                                        {errors.scheduledTime}
                                    </p>
                                )}
                            </div>

                            {/* Duration */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Duration
                                </label>
                                <select
                                    name="duration"
                                    value={formData.duration}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                >
                                    <option value={15}>15 minutes</option>
                                    <option value={30}>30 minutes</option>
                                    <option value={45}>45 minutes</option>
                                    <option value={60}>1 hour</option>
                                    <option value={90}>1.5 hours</option>
                                    <option value={120}>2 hours</option>
                                </select>
                            </div>
                        </div>

                        <p className="mt-3 text-sm text-gray-500">
                            Timezone: {formData.timeZone}
                        </p>
                    </div>

                    {/* Participants */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Users className="text-emerald-600" size={20} />
                            Participants
                        </h2>

                        <p className="text-sm text-gray-600 mb-4">
                            Add participants by their Gmail ID. Only invited Gmail IDs will be able to join the interview.
                        </p>

                        {/* Host Info */}
                        <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg mb-4">
                            <div className="w-10 h-10 bg-emerald-200 rounded-full flex items-center justify-center">
                                <User size={20} className="text-emerald-700" />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-emerald-800">{user?.name || 'You'}</p>
                                <p className="text-sm text-emerald-600">{user?.email} (Host)</p>
                            </div>
                        </div>

                        {/* Add Participant Form */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                            <div className="md:col-span-2">
                                <input
                                    type="email"
                                    placeholder="participant@gmail.com"
                                    value={newParticipant.email}
                                    onChange={(e) => setNewParticipant(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addParticipant())}
                                />
                            </div>
                            <div>
                                <input
                                    type="text"
                                    placeholder="Name (optional)"
                                    value={newParticipant.name}
                                    onChange={(e) => setNewParticipant(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <button
                                    type="button"
                                    onClick={addParticipant}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-all"
                                >
                                    <Plus size={18} />
                                    Add
                                </button>
                            </div>
                        </div>

                        {/* Role selector */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Role for new participant:
                            </label>
                            <div className="flex gap-4">
                                {['candidate', 'interviewer', 'observer'].map(role => (
                                    <label key={role} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="participantRole"
                                            checked={newParticipant.role === role}
                                            onChange={() => setNewParticipant(prev => ({ ...prev, role }))}
                                            className="text-emerald-600 focus:ring-emerald-500"
                                        />
                                        <span className="text-sm capitalize">{role}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Error */}
                        {errors.participants && (
                            <p className="mb-4 text-sm text-red-600 flex items-center gap-1">
                                <AlertCircle size={14} />
                                {errors.participants}
                            </p>
                        )}

                        {/* Participants List */}
                        {participants.length > 0 && (
                            <div className="space-y-2">
                                {participants.map((participant, idx) => (
                                    <div 
                                        key={idx}
                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                                <Mail size={18} className="text-gray-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-800">{participant.name}</p>
                                                <p className="text-sm text-gray-500">{participant.email}</p>
                                            </div>
                                            <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full capitalize">
                                                {participant.role}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeParticipant(participant.email)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Interview Settings */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Interview Settings</h2>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-all">
                                <input
                                    type="checkbox"
                                    name="settings.enableVideo"
                                    checked={formData.settings.enableVideo}
                                    onChange={handleChange}
                                    className="w-5 h-5 text-emerald-600 focus:ring-emerald-500 rounded"
                                />
                                <div className="flex items-center gap-2">
                                    <Video size={20} className="text-gray-600" />
                                    <span className="text-sm font-medium">Video</span>
                                </div>
                            </label>

                            <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-all">
                                <input
                                    type="checkbox"
                                    name="settings.enableAudio"
                                    checked={formData.settings.enableAudio}
                                    onChange={handleChange}
                                    className="w-5 h-5 text-emerald-600 focus:ring-emerald-500 rounded"
                                />
                                <div className="flex items-center gap-2">
                                    <Mic size={20} className="text-gray-600" />
                                    <span className="text-sm font-medium">Audio</span>
                                </div>
                            </label>

                            <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-all">
                                <input
                                    type="checkbox"
                                    name="settings.enableChat"
                                    checked={formData.settings.enableChat}
                                    onChange={handleChange}
                                    className="w-5 h-5 text-emerald-600 focus:ring-emerald-500 rounded"
                                />
                                <div className="flex items-center gap-2">
                                    <MessageSquare size={20} className="text-gray-600" />
                                    <span className="text-sm font-medium">Chat</span>
                                </div>
                            </label>

                            <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-all">
                                <input
                                    type="checkbox"
                                    name="settings.enableScreenShare"
                                    checked={formData.settings.enableScreenShare}
                                    onChange={handleChange}
                                    className="w-5 h-5 text-emerald-600 focus:ring-emerald-500 rounded"
                                />
                                <div className="flex items-center gap-2">
                                    <Monitor size={20} className="text-gray-600" />
                                    <span className="text-sm font-medium">Screen</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex items-center justify-end gap-4">
                        <button
                            type="button"
                            onClick={() => navigate('interview-dashboard')}
                            className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Scheduling...
                                </>
                            ) : (
                                <>
                                    <Save size={20} />
                                    Schedule Interview
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default InterviewSchedule;
