import React, { useState } from 'react';
import { PlusCircle, Trash2, ChevronDown, ChevronUp, Check, Settings, Clock, HelpCircle } from 'lucide-react';
import { generateTempId } from '../services/api';
import { createQuiz } from '../services/quizService';

// Question types for quiz
const QUESTION_TYPES = [
    { value: 'SINGLE', label: 'Single Choice', description: 'One correct answer' },
    { value: 'MULTIPLE', label: 'Multiple Choice', description: 'Multiple correct answers' },
    { value: 'TRUE_FALSE', label: 'True/False', description: 'Binary choice' }
];

const QuizQuestionEditor = ({ question, index, updateQuestion, removeQuestion }) => {
    const [isOpen, setIsOpen] = useState(true);

    const handleOptionChange = (optIndex, field, value) => {
        const newOptions = question.options.map((opt, i) =>
            i === optIndex ? { ...opt, [field]: value } : opt
        );
        updateQuestion(question.tempId, { options: newOptions });
    };

    const addOption = () => {
        updateQuestion(question.tempId, {
            options: [...question.options, { optionText: `Option ${question.options.length + 1}`, isCorrect: false }]
        });
    };

    const removeOption = (optIndex) => {
        if (question.options.length <= 2) return;
        updateQuestion(question.tempId, {
            options: question.options.filter((_, i) => i !== optIndex)
        });
    };

    const toggleCorrect = (optIndex) => {
        if (question.questionType === 'SINGLE' || question.questionType === 'TRUE_FALSE') {
            // Single choice - only one can be correct
            const newOptions = question.options.map((opt, i) => ({
                ...opt,
                isCorrect: i === optIndex
            }));
            updateQuestion(question.tempId, { options: newOptions });
        } else {
            // Multiple choice - toggle individual
            handleOptionChange(optIndex, 'isCorrect', !question.options[optIndex].isCorrect);
        }
    };

    const handleTypeChange = (newType) => {
        let newOptions = question.options;
        
        if (newType === 'TRUE_FALSE') {
            newOptions = [
                { optionText: 'True', isCorrect: false },
                { optionText: 'False', isCorrect: false }
            ];
        }
        
        // Reset correct answers when changing type
        if (newType === 'SINGLE' || newType === 'TRUE_FALSE') {
            newOptions = newOptions.map(opt => ({ ...opt, isCorrect: false }));
        }
        
        updateQuestion(question.tempId, { questionType: newType, options: newOptions });
    };

    return (
        <div className="bg-white p-4 rounded-xl shadow-md border border-gray-200 mb-4">
            <header className="flex justify-between items-center cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
                <h4 className="text-lg font-semibold text-gray-800">
                    Q{index + 1}. {question.questionText || 'New Question'}
                </h4>
                <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                        {question.points || 1} pts
                    </span>
                    <span className="text-sm font-medium text-indigo-600">
                        {QUESTION_TYPES.find(t => t.value === question.questionType)?.label}
                    </span>
                    {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
            </header>

            {isOpen && (
                <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                    {/* Question Text */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
                        <input
                            type="text"
                            value={question.questionText}
                            onChange={(e) => updateQuestion(question.tempId, { questionText: e.target.value })}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder="Enter your question..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Question Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Question Type</label>
                            <select
                                value={question.questionType}
                                onChange={(e) => handleTypeChange(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                            >
                                {QUESTION_TYPES.map(type => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Points */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Points</label>
                            <input
                                type="number"
                                min="1"
                                value={question.points || 1}
                                onChange={(e) => updateQuestion(question.tempId, { points: parseInt(e.target.value) || 1 })}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                    </div>

                    {/* Options */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Answer Options <span className="text-gray-500">(click checkmark to mark correct)</span>
                        </label>
                        <div className="space-y-2">
                            {question.options.map((option, optIndex) => (
                                <div key={optIndex} className="flex items-center space-x-2">
                                    <button
                                        type="button"
                                        onClick={() => toggleCorrect(optIndex)}
                                        className={`p-2 rounded-lg border-2 transition ${
                                            option.isCorrect 
                                                ? 'bg-emerald-500 border-emerald-500 text-white' 
                                                : 'border-gray-300 text-gray-400 hover:border-emerald-400'
                                        }`}
                                        title={option.isCorrect ? 'Correct answer' : 'Mark as correct'}
                                    >
                                        <Check size={16} />
                                    </button>
                                    <input
                                        type="text"
                                        value={option.optionText}
                                        onChange={(e) => handleOptionChange(optIndex, 'optionText', e.target.value)}
                                        className={`flex-1 p-2 border rounded-lg ${
                                            option.isCorrect ? 'border-emerald-300 bg-emerald-50' : 'border-gray-300'
                                        }`}
                                        placeholder={`Option ${optIndex + 1}`}
                                        disabled={question.questionType === 'TRUE_FALSE'}
                                    />
                                    {question.questionType !== 'TRUE_FALSE' && question.options.length > 2 && (
                                        <button
                                            type="button"
                                            onClick={() => removeOption(optIndex)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        {question.questionType !== 'TRUE_FALSE' && (
                            <button
                                type="button"
                                onClick={addOption}
                                className="mt-2 text-sm text-emerald-600 hover:text-emerald-700 flex items-center"
                            >
                                <PlusCircle size={16} className="mr-1" /> Add Option
                            </button>
                        )}
                    </div>

                    {/* Explanation (optional) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Explanation <span className="text-gray-400">(shown after answering)</span>
                        </label>
                        <textarea
                            value={question.explanation || ''}
                            onChange={(e) => updateQuestion(question.tempId, { explanation: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                            rows="2"
                            placeholder="Why is this answer correct? (optional)"
                        />
                    </div>

                    {/* Remove Question Button */}
                    <button
                        type="button"
                        onClick={() => removeQuestion(question.tempId)}
                        className="text-red-500 hover:text-red-700 text-sm flex items-center"
                    >
                        <Trash2 size={16} className="mr-1" /> Remove Question
                    </button>
                </div>
            )}
        </div>
    );
};

const QuizCreatePage = ({ navigate }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [questions, setQuestions] = useState([]);
    const [settings, setSettings] = useState({
        timeLimit: 0,
        shuffleQuestions: false,
        shuffleOptions: false,
        showCorrectAnswers: true,
        showExplanations: true,
        passingScore: 60,
        allowRetake: true,
        maxAttempts: 0
    });
    const [showSettings, setShowSettings] = useState(false);
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);

    const addQuestion = () => {
        const newQuestion = {
            tempId: generateTempId(),
            questionText: '',
            questionType: 'SINGLE',
            options: [
                { optionText: 'Option 1', isCorrect: false },
                { optionText: 'Option 2', isCorrect: false }
            ],
            points: 1,
            explanation: ''
        };
        setQuestions(prev => [...prev, newQuestion]);
    };

    const updateQuestion = (tempId, updates) => {
        setQuestions(prev => prev.map(q => q.tempId === tempId ? { ...q, ...updates } : q));
    };

    const removeQuestion = (tempId) => {
        setQuestions(prev => prev.filter(q => q.tempId !== tempId));
    };

    const validateQuiz = () => {
        if (!title.trim()) return 'Quiz title is required';
        if (questions.length === 0) return 'Add at least one question';
        
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            if (!q.questionText.trim()) return `Question ${i + 1} needs text`;
            if (q.options.some(opt => !opt.optionText.trim())) return `Question ${i + 1} has empty options`;
            if (!q.options.some(opt => opt.isCorrect)) return `Question ${i + 1} needs a correct answer marked`;
        }
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('');

        const error = validateQuiz();
        if (error) {
            setStatus(`Error: ${error}`);
            return;
        }

        setLoading(true);
        try {
            // Remove tempId before sending
            const cleanQuestions = questions.map(({ tempId, ...rest }) => rest);
            
            await createQuiz({
                title,
                description,
                questions: cleanQuestions,
                settings
            });
            
            setStatus('Quiz created successfully! Redirecting...');
            setTimeout(() => navigate('quiz-dashboard'), 1200);
        } catch (err) {
            setStatus(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const totalPoints = questions.reduce((sum, q) => sum + (q.points || 1), 0);

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-extrabold text-emerald-800 mb-6 border-b pb-2">Create New Quiz</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Quiz Details */}
                <div className="bg-white p-6 rounded-xl shadow-lg border border-emerald-100 space-y-4">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center">
                        <HelpCircle size={24} className="mr-2 text-emerald-600" />
                        Quiz Details
                    </h2>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Quiz Title *</label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="mt-1 block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500 text-lg"
                            placeholder="e.g., JavaScript Fundamentals Quiz"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                            rows="2"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="mt-1 block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder="Brief description of the quiz..."
                        />
                    </div>
                    
                    {/* Total Points Display */}
                    <div className="flex items-center justify-between bg-emerald-50 p-3 rounded-lg">
                        <span className="text-emerald-800 font-medium">Total Points:</span>
                        <span className="text-2xl font-bold text-emerald-600">{totalPoints}</span>
                    </div>
                </div>

                {/* Quiz Settings */}
                <div className="bg-white p-6 rounded-xl shadow-lg border border-emerald-100">
                    <button
                        type="button"
                        onClick={() => setShowSettings(!showSettings)}
                        className="w-full flex items-center justify-between text-left"
                    >
                        <h2 className="text-xl font-bold text-gray-800 flex items-center">
                            <Settings size={24} className="mr-2 text-emerald-600" />
                            Quiz Settings
                        </h2>
                        {showSettings ? <ChevronUp /> : <ChevronDown />}
                    </button>
                    
                    {showSettings && (
                        <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Clock size={16} className="inline mr-1" />
                                    Time Limit (minutes)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={settings.timeLimit}
                                    onChange={(e) => setSettings(s => ({ ...s, timeLimit: parseInt(e.target.value) || 0 }))}
                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                    placeholder="0 = No limit"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Passing Score (%)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={settings.passingScore}
                                    onChange={(e) => setSettings(s => ({ ...s, passingScore: parseInt(e.target.value) || 0 }))}
                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                />
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="shuffleQuestions"
                                    checked={settings.shuffleQuestions}
                                    onChange={(e) => setSettings(s => ({ ...s, shuffleQuestions: e.target.checked }))}
                                    className="mr-2"
                                />
                                <label htmlFor="shuffleQuestions" className="text-sm text-gray-700">Shuffle Questions</label>
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="shuffleOptions"
                                    checked={settings.shuffleOptions}
                                    onChange={(e) => setSettings(s => ({ ...s, shuffleOptions: e.target.checked }))}
                                    className="mr-2"
                                />
                                <label htmlFor="shuffleOptions" className="text-sm text-gray-700">Shuffle Options</label>
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="showCorrectAnswers"
                                    checked={settings.showCorrectAnswers}
                                    onChange={(e) => setSettings(s => ({ ...s, showCorrectAnswers: e.target.checked }))}
                                    className="mr-2"
                                />
                                <label htmlFor="showCorrectAnswers" className="text-sm text-gray-700">Show Correct Answers After</label>
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="showExplanations"
                                    checked={settings.showExplanations}
                                    onChange={(e) => setSettings(s => ({ ...s, showExplanations: e.target.checked }))}
                                    className="mr-2"
                                />
                                <label htmlFor="showExplanations" className="text-sm text-gray-700">Show Explanations</label>
                            </div>
                        </div>
                    )}
                </div>

                {/* Questions */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-800">Quiz Questions</h2>
                    
                    {questions.map((q, index) => (
                        <QuizQuestionEditor
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
                        className="w-full flex items-center justify-center p-4 border-2 border-dashed border-emerald-300 text-emerald-600 rounded-xl hover:bg-emerald-50 transition font-medium"
                    >
                        <PlusCircle size={24} className="mr-2" /> Add Question
                    </button>
                </div>

                {/* Status & Submit */}
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
                    className="w-full py-3 px-4 rounded-lg shadow-lg text-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-500 disabled:opacity-50 transition"
                >
                    {loading ? 'Creating Quiz...' : 'Create Quiz'}
                </button>
            </form>
        </div>
    );
};

export default QuizCreatePage;
