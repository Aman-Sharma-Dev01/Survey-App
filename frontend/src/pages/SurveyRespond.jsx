import React, { useState, useEffect } from 'react';
import { User, Send } from 'lucide-react';
import { getPublicSurvey, submitAnonymousResponse } from '../services/responseService';
import QuestionRenderer from '../components/QuestionRenderer';

const SurveyRespondPage = ({ surveyId }) => {
    const [survey, setSurvey] = useState(null);
    const [answers, setAnswers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);

    useEffect(() => {
        const fetchSurvey = async () => {
            setLoading(true);
            try {
                // API Call: GET /responses/public/:surveyId (Phase III, Step 6)
                const data = await getPublicSurvey(surveyId);
                setSurvey(data);
                setError('');
            } catch (err) {
                setSurvey(null);
                setError(err.message || 'Survey not found or is not currently active.');
            } finally {
                setLoading(false);
            }
        };
        fetchSurvey();
    }, [surveyId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Basic validation: check if all required questions are answered
        const requiredQuestions = survey.questions.filter(q => q.isRequired);
        const missingAnswers = requiredQuestions.some(rq => {
            const answer = answers.find(a => a.questionId === rq._id);
            if (!answer) return true;
            if (rq.questionType === 'TEXT' && (!answer.answerValue || !answer.answerValue.trim())) return true;
            if (rq.questionType === 'CHECKBOX' && (!Array.isArray(answer.answerValue) || answer.answerValue.length === 0)) return true;
            if (rq.questionType === 'RADIO' && !answer.answerValue) return true;
            return false;
        });

        if (missingAnswers) {
            setError('Please answer all required fields before submitting.');
            return;
        }

        setLoading(true);
        try {
            // API Call: POST /responses/:surveyId (Phase III, Step 7)
            await submitAnonymousResponse(surveyId, answers);
            setIsSubmitted(true);
            setAnswers([]);
        } catch (err) {
            setError(err.message || 'Submission failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-xl text-indigo-600">Loading Survey...</div>;

    if (error) return (
        <div className="max-w-xl mx-auto p-10 mt-10 text-center bg-red-50 border border-red-200 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold text-red-700 mb-4">Error</h2>
            <p className="text-red-600">{error}</p>
        </div>
    );

    if (isSubmitted) return (
        <div className="max-w-xl mx-auto p-10 mt-10 text-center bg-green-50 border border-green-200 rounded-xl shadow-lg">
            <h2 className="text-3xl font-bold text-green-700 mb-4">Thank You!</h2>
            <p className="text-lg text-green-600">Your response has been submitted anonymously.</p>
            <p className="mt-4 text-sm text-gray-500">You can now close this window.</p>
        </div>
    );

    return (
        <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
            <div className="bg-indigo-700 text-white p-8 rounded-xl shadow-2xl mb-6">
                <h1 className="text-4xl font-extrabold mb-2">{survey.title}</h1>
                <p className="text-indigo-200">{survey.description}</p>
                <div className="mt-4 flex items-center text-sm font-medium bg-indigo-600 p-2 rounded-lg w-fit">
                    <User size={16} className="mr-1" /> All responses are strictly anonymous.
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                    {survey.questions.map((q, index) => (
                        <QuestionRenderer
                            key={q._id}
                            question={q}
                            index={index}
                            answers={answers}
                            setAnswers={setAnswers}
                        />
                    ))}
                </div>

                {error && <p className="text-red-500 text-center text-sm bg-red-100 p-3 rounded-lg mt-6">{error}</p>}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center items-center mt-8 py-3 px-4 rounded-lg shadow-xl text-xl font-semibold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 transition"
                >
                    <Send size={20} className="mr-2" /> {loading ? 'Submitting...' : 'Submit Anonymous Response'}
                </button>
            </form>
        </div>
    );
};

export default SurveyRespondPage;
