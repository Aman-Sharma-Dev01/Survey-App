import React, { useState, useEffect } from 'react';
import { BarChart } from 'lucide-react';
import { getSurveyAnalysis } from '../services/responseService';
import AnalysisChart from '../components/AnalysisChart';

const AnalysisPage = ({ surveyId }) => {
    const [analysisData, setAnalysisData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchAnalysis = async () => {
            setLoading(true);
            setError('');
            try {
                // API Call: GET /responses/analysis/:surveyId (Phase IV, Step 8)
                const data = await getSurveyAnalysis(surveyId);
                setAnalysisData(data);
            } catch (err) {
                setError(err.message || 'Failed to load analysis data. Ensure the survey is published and you are logged in.');
                setAnalysisData(null);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalysis();
    }, [surveyId]);

    if (loading) return <div className="p-8 text-center text-xl text-indigo-600">Calculating Analysis...</div>;
    if (error) return <div className="p-8 text-center text-red-600 bg-red-100 rounded-lg max-w-xl mx-auto mt-10">{error}</div>;
    if (!analysisData || analysisData.totalResponses === 0) return (
        <div className="max-w-3xl mx-auto p-10 mt-10 text-center bg-yellow-50 border border-yellow-200 rounded-xl shadow-lg">
            <BarChart size={48} className="text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-yellow-700 mb-2">No Responses Yet</h2>
            <p className="text-yellow-600">Share your survey link to start collecting data.</p>
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
            <header className="bg-indigo-600 text-white p-6 rounded-xl shadow-lg mb-6">
                <h1 className="text-3xl font-extrabold">Survey Results Dashboard</h1>
                <p className="text-indigo-200 mt-1">Data for Survey ID: <span className="font-mono text-sm">{surveyId}</span></p>
                <div className="mt-3 text-lg font-bold bg-white text-indigo-800 p-2 rounded-lg w-fit shadow-md">
                    Total Responses: {analysisData.totalResponses}
                </div>
            </header>

            <div className="space-y-8">
                {/* Iterate over the questionBreakdown object returned by the backend */}
                {Object.entries(analysisData.questionBreakdown).map(([key, breakdown]) => (
                    <div key={key} className="p-6 bg-white rounded-xl shadow-lg border border-gray-100">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">{breakdown.questionText}</h3>
                        <div className="text-sm font-medium text-gray-500 mb-4">Type: {breakdown.questionType}</div>

                        <AnalysisChart
                            title={breakdown.questionType === 'TEXT' ? 'Free Text Responses' : 'Option Breakdown'}
                            data={breakdown.questionType === 'TEXT' ? breakdown.freeTextResponses : breakdown.options}
                            questionType={breakdown.questionType}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AnalysisPage;
