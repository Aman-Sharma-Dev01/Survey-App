import React from 'react';
import { List, BarChart } from 'lucide-react';

const SurveyCard = ({ survey, onAnalyze, onPublish, onUnpublish }) => {
    const surveyLink = `${window.location.origin}/#respond/${survey._id}`;

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition duration-300 border border-gray-100 flex flex-col justify-between">
            <div>
                <h3 className="text-xl font-bold text-indigo-800 mb-2">{survey.title}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{survey.description}</p>
                <div className="flex items-center text-sm text-gray-500 mb-4">
                    <List size={16} className="mr-1 text-indigo-500" />
                    <span className="font-semibold">{survey.questions.length} Questions</span>
                    <BarChart size={16} className="ml-4 mr-1 text-green-500" />
                    <span className="font-semibold text-green-700">{survey.responseCount} Responses</span>
                </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
                <div className={`text-center py-1 rounded-full text-xs font-semibold mb-3 ${
                    survey.isPublished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                    {survey.isPublished ? 'Live & Accepting Responses' : 'Draft / Unpublished'}
                </div>

                {survey.isPublished && (
                    <div className="mb-3">
                        <input
                            type="text"
                            readOnly
                            value={surveyLink}
                            // Using document.execCommand('copy') for better compatibility in isolated environments
                            onClick={(e) => { e.target.select(); document.execCommand('copy'); }}
                            className="w-full p-2 border border-indigo-300 rounded-lg text-xs bg-indigo-50 text-indigo-700 cursor-copy focus:ring-2 focus:ring-indigo-500"
                            title="Click to copy survey link"
                        />
                        <p className="text-xs text-gray-400 mt-1 text-center">Click link to copy for sharing.</p>
                    </div>
                )}

                <div className="flex justify-between space-x-2">
                    <button
                        onClick={() => onAnalyze()}
                        className="flex-1 px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition"
                    >
                        Analyze
                    </button>
                    {survey.isPublished ? (
                        <button
                            onClick={() => onUnpublish(survey)}
                            className="px-3 py-2 text-sm font-medium text-red-600 bg-red-100 rounded-lg hover:bg-red-200 transition"
                        >
                            Unpublish
                        </button>
                    ) : (
                        <button
                            onClick={() => onPublish(survey)}
                            className="px-3 py-2 text-sm font-medium text-green-600 bg-green-100 rounded-lg hover:bg-green-200 transition"
                        >
                            Publish
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SurveyCard;
