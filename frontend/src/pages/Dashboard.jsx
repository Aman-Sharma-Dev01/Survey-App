import React, { useState, useEffect, useCallback } from 'react';
import { PlusCircle, Loader, Settings, AlertTriangle, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { fetchApi, deleteSurvey } from '../services/api'; 
import SurveyCard from '../components/SurveyCard';

/**
 * Survey Dashboard Page Component
 * Displays a list of user's surveys and provides actions (create, publish/unpublish, delete, analyze).
 */
const DashboardPage = ({ navigate }) => {
    const { isAuthenticated } = useAuth();
    const [surveys, setSurveys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false); // New state for refreshing

    /**
     * Fetches all surveys for the current user.
     */
    const fetchSurveys = useCallback(async () => {
        // Only show full loading spinner on initial load
        if (!isRefreshing) setLoading(true); 
        setError('');
        try {
            // API Call: GET /surveys
            const data = await fetchApi('/surveys', 'GET', null, true);
            // Sort surveys: published first, then by creation date descending
            const sortedData = data.sort((a, b) => {
                if (a.isPublished !== b.isPublished) {
                    return a.isPublished ? -1 : 1; // Published surveys come first
                }
                return new Date(b.createdAt) - new Date(a.createdAt); // Newest first
            });
            setSurveys(sortedData);
        } catch (err) {
            console.error("Fetch Surveys Error:", err);
            setError('Failed to load surveys. Please ensure the backend server is reachable and you are logged in.');
            setSurveys([]);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, [isRefreshing]);

    // Run on mount or when authentication status changes
    useEffect(() => {
        if (isAuthenticated) {
            fetchSurveys();
        }
    }, [isAuthenticated, fetchSurveys]);

    /**
     * Handles publishing or unpublishing a survey.
     */
    const handlePublish = async (survey, isPublished) => {
        setIsRefreshing(true); // Indicate a short refresh is starting
        try {
            // API Call: PUT /surveys/:surveyId
            await fetchApi(`/surveys/${survey._id}`, 'PUT', { isPublished }, true);
            fetchSurveys(); // Refresh after update
        } catch (err) {
            setError(`Failed to ${isPublished ? 'publish' : 'unpublish'} survey. Error: ${err.message}`);
            setIsRefreshing(false);
        }
    };

    /**
     * Handles survey deletion after confirmation.
     */
    const handleDelete = async (surveyId) => {
        if (!window.confirm('Are you absolutely sure you want to delete this survey? This action cannot be undone.')) return;

        setIsRefreshing(true); // Indicate a short refresh is starting
        try {
            await deleteSurvey(surveyId); // API Call: DELETE /surveys/:id
            // No need for alert, UI refresh confirms success
            fetchSurveys(); // Refresh list
        } catch (err) {
            setError(`Failed to delete survey. Error: ${err.message}`);
            setIsRefreshing(false);
        }
    };

    // --- Conditional Renderings ---

    // 1. Initial Loading State
    if (loading)
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="flex flex-col items-center p-10 bg-white rounded-xl shadow-2xl">
                    <Loader size={36} className="animate-spin text-indigo-500 mb-4" />
                    <p className="text-xl font-semibold text-indigo-700">
                        Loading Your Survey Dashboard...
                    </p>
                </div>
            </div>
        );

    // 2. Error State
    if (error)
        return (
            <div className="max-w-xl mx-auto mt-12 p-6 text-center text-red-700 bg-red-50 border border-red-300 rounded-xl shadow-lg">
                <AlertTriangle size={32} className="mx-auto mb-3 text-red-500" />
                <h2 className="text-xl font-bold mb-2">Operation Failed</h2>
                <p className="font-medium">{error}</p>
                <button
                    onClick={() => fetchSurveys()}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                    Try Reloading
                </button>
            </div>
        );

    // 3. Main Content
    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
            
            {/* Header */}
            <header className="flex justify-between items-center mb-8 pb-4">
                <h1 className="text-4xl font-extrabold text-indigo-900 tracking-tight">
                    Your Surveys <span className="text-indigo-500">({surveys.length})</span>
                </h1>
                <div className="flex items-center space-x-3">
                    {/* Refresh Indicator */}
                    {isRefreshing && (
                        <Loader size={20} className="animate-spin text-indigo-500" title="Refreshing List..." />
                    )}

                    {/* New Survey Button */}
                    <button
                        onClick={() => navigate('create')}
                        className="flex items-center px-6 py-3 bg-indigo-600 text-white font-semibold text-lg rounded-xl shadow-lg hover:bg-indigo-700 transition transform hover:scale-[1.02]"
                    >
                        <PlusCircle size={24} className="mr-2" /> Create New
                    </button>
                </div>
            </header>

            {/* Empty State */}
            {surveys.length === 0 ? (
                <div className="text-center p-20 mt-10 bg-white rounded-2xl shadow-xl border border-indigo-200">
                    <MessageSquare size={64} className="text-indigo-500 mx-auto mb-6" />
                    <p className="text-2xl text-gray-700 font-bold">
                        Ready to gather insights?
                    </p>
                    <p className="text-gray-500 mt-3 text-lg">
                        You haven't created any surveys yet. Click 'Create New' to start building your first questionnaire.
                    </p>
                </div>
            ) : (
                // Survey Grid
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {surveys.map((survey) => (
                        <SurveyCard
                            key={survey._id}
                            survey={survey}
                            onAnalyze={() => navigate(`analysis/${survey._id}`)}
                            onPublish={(s) => handlePublish(s, true)}
                            onUnpublish={(s) => handlePublish(s, false)}
                            onDelete={handleDelete}
                            navigate={navigate} // Pass navigate for edit/view links within the card
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default DashboardPage;