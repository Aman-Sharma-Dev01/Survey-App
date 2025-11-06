import React, { useState, useEffect, useCallback } from 'react';
import { PlusCircle, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { fetchApi, deleteSurvey } from '../services/api'; // ✅ Added deleteSurvey import
import SurveyCard from '../components/SurveyCard';

const DashboardPage = ({ navigate }) => {
    const { isAuthenticated } = useAuth();
    const [surveys, setSurveys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Fetch all surveys
    const fetchSurveys = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            // API Call: GET /surveys
            const data = await fetchApi('/surveys', 'GET', null, true);
            setSurveys(data);
        } catch (err) {
            setError('Failed to load surveys. Ensure backend is running and you are logged in.');
            setSurveys([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Run on mount if authenticated
    useEffect(() => {
        if (isAuthenticated) {
            fetchSurveys();
        }
    }, [isAuthenticated, fetchSurveys]);

    // Publish / Unpublish handler
    const handlePublish = async (survey, isPublished) => {
        try {
            // API Call: PUT /surveys/:surveyId
            await fetchApi(`/surveys/${survey._id}`, 'PUT', { isPublished }, true);
            fetchSurveys(); // Refresh after update
        } catch (err) {
            setError(`Failed to ${isPublished ? 'publish' : 'unpublish'} survey. Error: ${err.message}`);
        }
    };

    //  Delete handler
    const handleDelete = async (surveyId) => {
        if (!window.confirm('Are you sure you want to delete this survey?')) return;

        try {
            await deleteSurvey(surveyId); // API Call: DELETE /surveys/:id
            alert('Survey deleted successfully!');
            fetchSurveys(); // Refresh list
        } catch (err) {
            setError(`Failed to delete survey. Error: ${err.message}`);
        }
    };

    // Loading state
    if (loading)
        return (
            <div className="p-8 text-center text-lg text-indigo-600">
                Loading Dashboard...
            </div>
        );

    // Error state
    if (error)
        return (
            <div className="p-8 text-center text-red-600 bg-red-100 rounded-lg max-w-xl mx-auto mt-10">
                {error}
            </div>
        );

    // Main content
    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <header className="flex justify-between items-center mb-8 border-b pb-4 border-indigo-100">
                <h1 className="text-3xl font-extrabold text-indigo-800">
                    Your Surveys ({surveys.length})
                </h1>
                <button
                    onClick={() => navigate('create')}
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg shadow-md hover:bg-indigo-700 transition"
                >
                    <PlusCircle size={20} className="mr-2" /> New Survey
                </button>
            </header>

            {/* Empty State */}
            {surveys.length === 0 ? (
                <div className="text-center p-12 bg-white rounded-xl shadow-lg border border-gray-200">
                    <Settings size={48} className="text-indigo-400 mx-auto mb-4" />
                    <p className="text-xl text-gray-600 font-semibold">
                        No surveys created yet.
                    </p>
                    <p className="text-gray-500 mt-2">
                        Click 'New Survey' to start collecting anonymous feedback!
                    </p>
                </div>
            ) : (
                // Survey Grid
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {surveys.map((survey) => (
                        <SurveyCard
                            key={survey._id}
                            survey={survey}
                            onAnalyze={() => navigate(`analysis/${survey._id}`)}
                            onPublish={(s) => handlePublish(s, true)}
                            onUnpublish={(s) => handlePublish(s, false)}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default DashboardPage;
