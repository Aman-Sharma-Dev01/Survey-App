import React, { useState, useRef, useEffect } from 'react';
import { PlusCircle, Trash2, ChevronDown, ChevronUp, Check, Settings, Clock, HelpCircle, Image, X, Loader, Save, ArrowLeft } from 'lucide-react';
import { generateTempId } from '../services/api';
import { getQuizById, updateQuiz } from '../services/quizService';
import { uploadImage, deleteImage } from '../services/uploadService';
import QuizChatWidget from '../components/QuizChatWidget';
import { useAuth } from '../context/AuthContext.jsx';
import { PremiumSettingRow, PremiumUpgradeModal } from '../components/PremiumFeatureLock';

// Image Upload Component
const ImageUploader = ({ image, onUpload, onRemove, label }) => {
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);

    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('Image must be less than 5MB');
            return;
        }

        setUploading(true);
        try {
            const result = await uploadImage(file);
            onUpload({ url: result.url, publicId: result.publicId });
        } catch (error) {
            alert('Failed to upload image: ' + error.message);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleRemove = async () => {
        if (image?.publicId) {
            try {
                await deleteImage(image.publicId);
            } catch (error) {
                console.error('Failed to delete image from cloud:', error);
            }
        }
        onRemove();
    };

    return (
        <div className="relative">
            {image?.url ? (
                <div className="relative inline-block">
                    <img 
                        src={image.url} 
                        alt={label} 
                        className="max-w-full max-h-48 rounded-lg border border-gray-200 object-contain"
                    />
                    <button
                        type="button"
                        onClick={handleRemove}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-md"
                        title="Remove image"
                    >
                        <X size={14} />
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-2 px-3 py-2 text-sm border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-emerald-400 hover:text-emerald-600 transition disabled:opacity-50"
                >
                    {uploading ? (
                        <>
                            <Loader size={16} className="animate-spin" />
                            Uploading...
                        </>
                    ) : (
                        <>
                            <Image size={16} />
                            {label}
                        </>
                    )}
                </button>
            )}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
            />
        </div>
    );
};

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
            const newOptions = question.options.map((opt, i) => ({
                ...opt,
                isCorrect: i === optIndex
            }));
            updateQuestion(question.tempId, { options: newOptions });
        } else {
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

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Question Image <span className="text-gray-400">(optional)</span>
                        </label>
                        <ImageUploader
                            image={question.questionImage}
                            onUpload={(img) => updateQuestion(question.tempId, { questionImage: img })}
                            onRemove={() => updateQuestion(question.tempId, { questionImage: null })}
                            label="Add Question Image"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
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

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Answer Options <span className="text-gray-500">(click checkmark to mark correct)</span>
                        </label>
                        <div className="space-y-3">
                            {question.options.map((option, optIndex) => (
                                <div key={optIndex} className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                                    <div className="flex items-center space-x-2">
                                        <button
                                            type="button"
                                            onClick={() => toggleCorrect(optIndex)}
                                            className={`p-2 rounded-lg border-2 transition ${
                                                option.isCorrect 
                                                    ? 'bg-emerald-500 border-emerald-500 text-white' 
                                                    : 'border-gray-300 text-gray-400 hover:border-emerald-400'
                                            }`}
                                            title={option.isCorrect ? 'Marked as correct' : 'Mark as correct'}
                                        >
                                            <Check size={16} />
                                        </button>
                                        <input
                                            type="text"
                                            value={option.optionText}
                                            onChange={(e) => handleOptionChange(optIndex, 'optionText', e.target.value)}
                                            disabled={question.questionType === 'TRUE_FALSE'}
                                            className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100"
                                            placeholder={`Option ${optIndex + 1}`}
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
                                    <div className="mt-2 ml-10">
                                        <ImageUploader
                                            image={option.optionImage}
                                            onUpload={(img) => {
                                                const newOptions = [...question.options];
                                                newOptions[optIndex] = { ...newOptions[optIndex], optionImage: img };
                                                updateQuestion(question.tempId, { options: newOptions });
                                            }}
                                            onRemove={() => {
                                                const newOptions = [...question.options];
                                                newOptions[optIndex] = { ...newOptions[optIndex], optionImage: null };
                                                updateQuestion(question.tempId, { options: newOptions });
                                            }}
                                            label="Add Option Image"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        {question.questionType !== 'TRUE_FALSE' && (
                            <button
                                type="button"
                                onClick={addOption}
                                className="mt-3 text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center"
                            >
                                <PlusCircle size={16} className="mr-1" /> Add Option
                            </button>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Explanation <span className="text-gray-400">(shown after answering)</span>
                        </label>
                        <textarea
                            value={question.explanation || ''}
                            onChange={(e) => updateQuestion(question.tempId, { explanation: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                            rows="2"
                            placeholder="Explain why the correct answer is right..."
                        />
                    </div>

                    <button
                        type="button"
                        onClick={() => removeQuestion(question.tempId)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center"
                    >
                        <Trash2 size={16} className="mr-1" /> Remove Question
                    </button>
                </div>
            )}
        </div>
    );
};

const QuizEditPage = ({ quizId, navigate }) => {
    const { user } = useAuth();
    const isPremiumUser = user?.isPlanActive || false;
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [classesInput, setClassesInput] = useState('');
    const [classes, setClasses] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [settings, setSettings] = useState({
        timeLimit: 0,
        shuffleQuestions: false,
        shuffleOptions: false,
        showCorrectAnswers: true,
        showExplanations: true,
        passingScore: 60,
        allowRetake: true,
        maxAttempts: 0,
        tabSwitchingEnabled: false,
        preventDuplicateRollNo: false,
        requireSequentialAnswering: false,
        fullscreenModeEnabled: false
    });
    const [showSettings, setShowSettings] = useState(false);
    const [status, setStatus] = useState('');
    const [showPremiumModal, setShowPremiumModal] = useState(false);

    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                const quiz = await getQuizById(quizId);
                setTitle(quiz.title || '');
                setDescription(quiz.description || '');
                setClasses(quiz.classes || []);
                // Merge quiz settings with defaults to ensure new fields are included
                setSettings(prevSettings => ({
                    ...prevSettings,
                    ...(quiz.settings || {})
                }));
                // Add tempId to each question for editing
                setQuestions(quiz.questions?.map(q => ({
                    ...q,
                    tempId: q._id || generateTempId()
                })) || []);
            } catch (err) {
                setStatus('Error: Failed to load quiz');
            } finally {
                setLoading(false);
            }
        };
        fetchQuiz();
    }, [quizId]);

    const addClass = () => {
        const trimmed = classesInput.trim();
        if (trimmed && !classes.includes(trimmed)) {
            setClasses([...classes, trimmed]);
            setClassesInput('');
        }
    };

    const removeClass = (classToRemove) => {
        setClasses(classes.filter(c => c !== classToRemove));
    };

    const handleClassKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addClass();
        }
    };

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

    // Handler for AI-imported questions
    const onImportQuestions = (newQs) => {
        if (!Array.isArray(newQs) || newQs.length === 0) {
            setStatus('Error: Nothing to import from AI.');
            return;
        }

        const normalized = newQs.map((q) => ({
            tempId: q.tempId || generateTempId(),
            questionText: q.questionText?.trim() || '',
            questionType: q.questionType || 'SINGLE',
            options: Array.isArray(q.options) ? q.options.map((o, idx) => ({
                optionText: typeof o === 'string' ? o : (o.optionText || `Option ${idx + 1}`),
                isCorrect: typeof o === 'object' ? Boolean(o.isCorrect) : false
            })) : [
                { optionText: 'Option 1', isCorrect: false },
                { optionText: 'Option 2', isCorrect: false }
            ],
            points: q.points || 1,
            explanation: q.explanation || ''
        }));

        setQuestions((prev) => [...prev, ...normalized]);
        setStatus(`Imported ${normalized.length} question${normalized.length > 1 ? 's' : ''} from AI.`);
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

        setSaving(true);
        try {
            // Remove tempId before sending
            const cleanQuestions = questions.map(({ tempId, _id, ...rest }) => rest);
            
            await updateQuiz(quizId, {
                title,
                description,
                classes,
                questions: cleanQuestions,
                settings
            });
            
            setStatus('Quiz updated successfully! Redirecting...');
            setTimeout(() => navigate('quiz-dashboard'), 1200);
        } catch (err) {
            setStatus(`Error: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    const totalPoints = questions.reduce((sum, q) => sum + (q.points || 1), 0);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader className="animate-spin text-emerald-600" size={48} />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate('quiz-dashboard')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                    <ArrowLeft size={24} className="text-gray-600" />
                </button>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-emerald-800">Edit Quiz</h1>
            </div>

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
                            className="mt-1 block w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                            placeholder="e.g., JavaScript Fundamentals Quiz"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                            rows="3"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="mt-1 block w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                            placeholder="Brief description of the quiz..."
                        />
                    </div>

                    {/* Classes/Sections */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Classes/Sections <span className="text-gray-400">(optional - for student grouping)</span>
                        </label>
                        <div className="flex gap-2 mt-1">
                            <input
                                type="text"
                                value={classesInput}
                                onChange={(e) => setClassesInput(e.target.value)}
                                onKeyDown={handleClassKeyDown}
                                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                placeholder="e.g., CSE 5A (press Enter to add)"
                            />
                            <button
                                type="button"
                                onClick={addClass}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                            >
                                Add
                            </button>
                        </div>
                        {classes.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {classes.map((cls, idx) => (
                                    <span key={idx} className="inline-flex items-center px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">
                                        {cls}
                                        <button
                                            type="button"
                                            onClick={() => removeClass(cls)}
                                            className="ml-2 text-emerald-600 hover:text-emerald-800"
                                        >
                                            <X size={14} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t">
                        <span className="text-gray-600">Total Points:</span>
                        <span className="text-2xl font-bold text-emerald-600">{totalPoints}</span>
                    </div>
                </div>

                {/* Quiz Settings */}
                <div className="bg-white p-6 rounded-xl shadow-lg border border-emerald-100">
                    <button
                        type="button"
                        onClick={() => setShowSettings(!showSettings)}
                        className="w-full flex items-center justify-between text-xl font-bold text-gray-800"
                    >
                        <span className="flex items-center">
                            <Settings size={24} className="mr-2 text-emerald-600" />
                            Quiz Settings
                        </span>
                        {showSettings ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                    </button>

                    {showSettings && (
                        <div className="mt-4 pt-4 border-t space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        <Clock size={16} className="inline mr-1" /> Time Limit (minutes)
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
                                <label htmlFor="showCorrectAnswers" className="text-sm text-gray-700">Show Correct Answers After Submission</label>
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
                            
                            {/* Premium Features Section */}
                            <div className="border-t pt-3 mt-2">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    Anti-Cheating Features
                                    {!isPremiumUser && (
                                        <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full normal-case">
                                            PRO
                                        </span>
                                    )}
                                </p>
                                
                                <div className="space-y-2">
                                    <PremiumSettingRow
                                        id="tabSwitchingEnabled"
                                        checked={settings.tabSwitchingEnabled}
                                        onChange={(e) => setSettings(s => ({ ...s, tabSwitchingEnabled: e.target.checked }))}
                                        label="Enable Tab Switch Detection"
                                        description="Auto-submits quiz after 3 tab switches"
                                        isPremiumUser={isPremiumUser}
                                        onUpgradeClick={() => setShowPremiumModal(true)}
                                    />
                                    
                                    <PremiumSettingRow
                                        id="preventDuplicateRollNo"
                                        checked={settings.preventDuplicateRollNo}
                                        onChange={(e) => setSettings(s => ({ ...s, preventDuplicateRollNo: e.target.checked }))}
                                        label="Prevent Duplicate Roll Numbers"
                                        description="Same roll number can only submit once"
                                        isPremiumUser={isPremiumUser}
                                        onUpgradeClick={() => setShowPremiumModal(true)}
                                    />
                                    
                                    <PremiumSettingRow
                                        id="requireSequentialAnswering"
                                        checked={settings.requireSequentialAnswering}
                                        onChange={(e) => setSettings(s => ({ ...s, requireSequentialAnswering: e.target.checked }))}
                                        label="Require Sequential Answering"
                                        description="Must answer current question before moving to next"
                                        isPremiumUser={isPremiumUser}
                                        onUpgradeClick={() => setShowPremiumModal(true)}
                                    />
                                    
                                    <PremiumSettingRow
                                        id="fullscreenModeEnabled"
                                        checked={settings.fullscreenModeEnabled}
                                        onChange={(e) => setSettings(s => ({ ...s, fullscreenModeEnabled: e.target.checked }))}
                                        label="Force Fullscreen Mode"
                                        description="Quiz must be taken in fullscreen. Auto-submits after 3 exits. Includes split-screen detection."
                                        isPremiumUser={isPremiumUser}
                                        onUpgradeClick={() => setShowPremiumModal(true)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Premium Upgrade Modal */}
                <PremiumUpgradeModal 
                    isOpen={showPremiumModal} 
                    onClose={() => setShowPremiumModal(false)}
                    featureName="Anti-Cheating Features"
                />

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
                    disabled={saving || questions.length === 0}
                    className="w-full py-3 px-4 rounded-lg shadow-lg text-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-500 disabled:opacity-50 transition flex items-center justify-center"
                >
                    {saving ? (
                        <>
                            <Loader className="animate-spin mr-2" size={20} />
                            Saving Changes...
                        </>
                    ) : (
                        <>
                            <Save size={20} className="mr-2" />
                            Save Changes
                        </>
                    )}
                </button>
            </form>

            {/* AI Quiz Assistant */}
            <QuizChatWidget
                quiz={{ title, description, questions }}
                onImportQuestions={onImportQuestions}
                navigate={navigate}
            />
        </div>
    );
};

export default QuizEditPage;
