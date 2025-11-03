import React, { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { fetchApi, generateTempId } from '../services/api';
import QuestionEditor from '../components/QuestionEditor';

const SurveyCreatePage = ({ handleNavigate }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [questions, setQuestions] = useState([]);
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);

    const addQuestion = () => {
        const newQuestion = {
            tempId: generateTempId(), // Use tempId for local React keying/editing
            questionText: '',
            questionType: 'RADIO',
            isRequired: false,
            options: [{ optionText: 'Option 1', value: 'Option 1' }],
        };
        setQuestions([...questions, newQuestion]);
    };

    const updateQuestion = (tempId, updates) => {
        setQuestions(questions.map(q => q.tempId === tempId ? { ...q, ...updates } : q));
    };

    const removeQuestion = (tempId) => {
        setQuestions(questions.filter(q => q.tempId !== tempId));
    };

    const validateQuestions = () => {
        return questions.every(q => {
            if (!q.questionText.trim()) return false;
            // For choice questions, ensure at least one option exists and has text
            if (q.questionType !== 'TEXT' && (!q.options || q.options.length < 1 || q.options.some(opt => !opt.optionText.trim()))) return false;
            return true;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('');

        if (!title.trim() || questions.length === 0) {
            setStatus('Error: Title and at least one question are required.');
            return;
        }

        if (!validateQuestions()) {
            setStatus('Error: All questions must have text and valid options (if applicable).');
            return;
        }

        setLoading(true);
        // Clean up the questions for the backend payload (remove tempId)
        const payloadQuestions = questions.map(q => {
            const { tempId, ...rest } = q;
            return rest;
        });

        try {
            // API Call: POST /surveys (Phase II, Step 3)
            await fetchApi('/surveys', 'POST', { title, description, questions: payloadQuestions }, true);
            setStatus('Survey created successfully! Redirecting to dashboard...');
            setTimeout(() => handleNavigate('dashboard'), 1500);
        } catch (err) {
            setStatus(`Error creating survey: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-extrabold text-indigo-800 mb-6 border-b pb-2">Create New Survey</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Survey Metadata */}
                <div className="bg-white p-6 rounded-xl shadow-lg border border-indigo-100 space-y-4">
                    <h2 className="text-xl font-bold text-gray-800">Survey Details</h2>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Survey Title (Required)</label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-lg"
                            placeholder="e.g., Annual Employee Feedback"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Description (Optional)</label>
                        <textarea
                            rows="3"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Brief description for respondents..."
                        />
                    </div>
                </div>

                {/* Question Editor Area */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-800">Survey Questions</h2>
                    {questions.map((q, index) => (
                        <QuestionEditor
                            key={q.tempId}
                            question={q}
                            index={index}
                            updateQuestion={updateQuestion}
                            removeQuestion={removeQuestion}
                        />
                    ))}

                    <button
                        type="button"
                        onClick={addQuestion}
                        className="w-full flex items-center justify-center p-3 border-2 border-dashed border-indigo-300 text-indigo-600 rounded-lg hover:bg-indigo-50 transition font-medium"
                    >
                        <PlusCircle size={20} className="mr-2" /> Add New Question
                    </button>
                </div>

                {/* Submission & Status */}
                {status && (
                    <p className={`p-3 rounded-lg text-sm font-medium ${
                        status.startsWith('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                    }`}>
                        {status}
                    </p>
                )}
                <button
                    type="submit"
                    disabled={loading || questions.length === 0}
                    className="w-full flex justify-center py-3 px-4 rounded-lg shadow-lg text-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 transition"
                >
                    {loading ? 'Saving Survey...' : 'Save & Prepare for Launch'}
                </button>
            </form>
        </div>
    );
};

export default SurveyCreatePage;
