import React, { useState, useRef } from 'react';
import { PlusCircle, Trash2, ChevronDown, ChevronUp, Check, Settings, Clock, HelpCircle, Image, X, Loader, Eye, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { generateTempId } from '../services/api';
import { createQuiz } from '../services/quizService';
import { uploadImage, deleteImage } from '../services/uploadService';
import QuizAIPanel from '../components/QuizAIPanel';
import { useAuth } from '../context/AuthContext.jsx';
import { PremiumSettingRow, PremiumUpgradeModal } from '../components/PremiumFeatureLock';

// Image Upload Component
const ImageUploader = ({ image, onUpload, onRemove, label }) => {
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);

    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        // Validate file size (5MB limit)
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

// Helper: parse bulk-pasted roll numbers into a clean, deduped, sorted array
const parseRollNumbers = (text) => {
    if (!text || !text.trim()) return [];
    return [...new Set(
        text
            .split(/[\n,;\t]+/)
            .map(s => s.trim().toUpperCase())
            .filter(Boolean)
    )].sort();
};

// Question types for quiz
const QUESTION_TYPES = [
    { value: 'SINGLE', label: 'Single Choice', description: 'One correct answer' },
    { value: 'MULTIPLE', label: 'Multiple Choice', description: 'Multiple correct answers' },
    { value: 'TRUE_FALSE', label: 'True/False', description: 'Binary choice' },
    { value: 'RATING', label: 'Rating', description: 'Star rating' },
    { value: 'SHORT_TEXT', label: 'Short Answer', description: 'One line text' },
    { value: 'LONG_TEXT', label: 'Paragraph', description: 'Multi-line text' },
    { value: 'DATE', label: 'Date', description: 'Date picker' }
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

    // Handle paste: split multi-line text into separate options (Google Forms-style)
    const handleOptionPaste = (e, optIndex) => {
        const pastedText = e.clipboardData.getData('text');
        const lines = pastedText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        if (lines.length <= 1) return; // single line = normal paste

        e.preventDefault();
        const newOptions = [...question.options];
        // Put first line into the current option
        newOptions[optIndex] = { ...newOptions[optIndex], optionText: lines[0] };
        // Insert remaining lines as new options after the current one
        const extraOptions = lines.slice(1).map(text => ({ optionText: text, isCorrect: false }));
        newOptions.splice(optIndex + 1, 0, ...extraOptions);
        updateQuestion(question.tempId, { options: newOptions });
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

        const updates = { questionType: newType, options: newOptions };
        updateQuestion(question.tempId, updates);
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

                    {/* Question Image */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Question Image <span className="text-gray-400">(optional - for diagrams, charts, etc.)</span>
                        </label>
                        <ImageUploader
                            image={question.questionImage}
                            onUpload={(img) => updateQuestion(question.tempId, { questionImage: img })}
                            onRemove={() => updateQuestion(question.tempId, { questionImage: null })}
                            label="Add Question Image"
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

                        {/* Rating Scale (Only for RATING) */}
                        {question.questionType === 'RATING' && (
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Max Rating (Stars)</label>
                                <input
                                    type="number"
                                    min="3"
                                    max="10"
                                    value={question.ratingScale || 5}
                                    onChange={(e) => updateQuestion(question.tempId, { ratingScale: parseInt(e.target.value) || 5 })}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                        )}
                    </div>

                    {/* Answer Options or Input Preview */}
                    {['SINGLE', 'MULTIPLE', 'TRUE_FALSE'].includes(question.questionType) ? (
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
                                                className={`p-2 rounded-lg border-2 transition ${option.isCorrect
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
                                                onPaste={question.questionType !== 'TRUE_FALSE' ? (e) => handleOptionPaste(e, optIndex) : undefined}
                                                className={`flex-1 p-2 border rounded-lg ${option.isCorrect ? 'border-emerald-300 bg-emerald-50' : 'border-gray-300 bg-white'
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
                                        {/* Option Image */}
                                        {question.questionType !== 'TRUE_FALSE' && (
                                            <div className="mt-2 ml-10">
                                                <ImageUploader
                                                    image={option.optionImage}
                                                    onUpload={(img) => handleOptionChange(optIndex, 'optionImage', img)}
                                                    onRemove={() => handleOptionChange(optIndex, 'optionImage', null)}
                                                    label="Add Option Image"
                                                />
                                            </div>
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
                    ) : (
                        <div className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300">
                            <label className="block text-sm font-medium text-gray-500 mb-2">Student Answer Preview</label>
                            {question.questionType === 'RATING' && (
                                <div className="flex gap-1" title={`Rating out of ${question.ratingScale || 5}`}>
                                    {[...Array(parseInt(question.ratingScale) || 5)].map((_, i) => (
                                        <img
                                            key={i}
                                            src="https://img.icons8.com/fluency/48/star.png"
                                            alt="star"
                                            className="w-8 h-8 opacity-50 grayscale"
                                        />
                                    ))}
                                </div>
                            )}
                            {question.questionType === 'SHORT_TEXT' && (
                                <input disabled className="w-full p-2 border rounded bg-white text-gray-400" placeholder="Short answer text..." />
                            )}
                            {question.questionType === 'LONG_TEXT' && (
                                <textarea disabled className="w-full p-2 border rounded bg-white text-gray-400" rows="3" placeholder="Long answer text..." />
                            )}
                            {question.questionType === 'DATE' && (
                                <input disabled type="date" className="w-full p-2 border rounded bg-white text-gray-400" />
                            )}
                        </div>
                    )}

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


// Quiz Preview Modal Component
const QuizPreviewModal = ({ isOpen, onClose, title, description, questions, settings }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [previewAnswers, setPreviewAnswers] = useState({});
    const [hoveredStar, setHoveredStar] = useState(null);

    if (!isOpen || questions.length === 0) return null;

    const currentQ = questions[currentIndex];
    const totalPoints = questions.reduce((sum, q) => sum + (q.points || 1), 0);

    const handleOptionClick = (qIdx, optionText, isMultiple) => {
        const key = `q${qIdx}`;
        setPreviewAnswers(prev => {
            const current = prev[key] || [];
            if (isMultiple) {
                return { ...prev, [key]: current.includes(optionText) ? current.filter(o => o !== optionText) : [...current, optionText] };
            }
            return { ...prev, [key]: [optionText] };
        });
    };

    const handleTextChange = (qIdx, value) => {
        setPreviewAnswers(prev => ({ ...prev, [`q${qIdx}`]: [value] }));
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-5 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Eye size={20} />
                            <span className="text-xs font-medium bg-white/20 px-2 py-0.5 rounded">PREVIEW MODE</span>
                        </div>
                        <h2 className="text-xl font-bold">{title || 'Untitled Quiz'}</h2>
                        {description && <p className="text-sm text-emerald-100 mt-1">{description}</p>}
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition">
                        <X size={24} />
                    </button>
                </div>

                {/* Quiz Info Bar */}
                <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b text-sm text-gray-600">
                    <span>{questions.length} Questions • {totalPoints} Points</span>
                    {settings.timeLimit > 0 && <span className="flex items-center gap-1"><Clock size={14} /> {settings.timeLimit} min</span>}
                </div>

                {/* Question Area */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Question Header */}
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                                Question {currentIndex + 1} of {questions.length}
                            </span>
                            <span className="text-xs text-gray-400 ml-2">{currentQ.points || 1} pt{(currentQ.points || 1) > 1 ? 's' : ''}</span>
                        </div>
                        <span className="text-xs text-gray-400 capitalize">
                            {QUESTION_TYPES.find(t => t.value === currentQ.questionType)?.label || currentQ.questionType}
                        </span>
                    </div>

                    {/* Question Text */}
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">
                        {currentQ.questionText || <span className="italic text-gray-400">No question text</span>}
                    </h3>

                    {/* Question Image */}
                    {currentQ.questionImage?.url && (
                        <img src={currentQ.questionImage.url} alt="Question" className="mt-2 mb-4 max-h-48 rounded-lg border object-contain" />
                    )}

                    {/* Answer Area */}
                    <div className="mt-5 space-y-3">
                        {['SINGLE', 'MULTIPLE', 'TRUE_FALSE'].includes(currentQ.questionType) ? (
                            currentQ.options.map((opt, idx) => {
                                const key = `q${currentIndex}`;
                                const isSelected = (previewAnswers[key] || []).includes(opt.optionText);
                                const isMultiple = currentQ.questionType === 'MULTIPLE';
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => handleOptionClick(currentIndex, opt.optionText, isMultiple)}
                                        className={`w-full p-4 text-left rounded-xl border-2 transition-all ${isSelected
                                            ? 'border-emerald-500 bg-emerald-50 shadow-md'
                                            : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded-${isMultiple ? 'md' : 'full'} border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'
                                                }`}>
                                                {isSelected && <Check size={12} className="text-white" />}
                                            </div>
                                            <span className="text-base">{opt.optionText}</span>
                                        </div>
                                        {opt.optionImage?.url && (
                                            <img src={opt.optionImage.url} alt={`Option ${idx + 1}`} className="mt-2 max-h-24 rounded border object-contain" />
                                        )}
                                    </button>
                                );
                            })
                        ) : currentQ.questionType === 'RATING' ? (
                            <div className="flex flex-col items-center py-6">
                                <div className="flex gap-2">
                                    {[...Array(currentQ.ratingScale || 5)].map((_, i) => {
                                        const val = i + 1;
                                        const selected = parseInt(previewAnswers[`q${currentIndex}`]?.[0] || 0);
                                        const isActive = (hoveredStar !== null ? hoveredStar >= val : selected >= val);
                                        return (
                                            <button
                                                key={i}
                                                onClick={() => handleTextChange(currentIndex, val.toString())}
                                                onMouseEnter={() => setHoveredStar(val)}
                                                onMouseLeave={() => setHoveredStar(null)}
                                                className="focus:outline-none transition-transform hover:scale-125"
                                            >
                                                <Star size={36} className={isActive ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
                                            </button>
                                        );
                                    })}
                                </div>
                                <p className="mt-3 text-gray-500 font-medium">
                                    {previewAnswers[`q${currentIndex}`]?.[0] || '0'} / {currentQ.ratingScale || 5}
                                </p>
                            </div>
                        ) : currentQ.questionType === 'SHORT_TEXT' ? (
                            <input
                                type="text"
                                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                placeholder="Type your answer here..."
                                value={previewAnswers[`q${currentIndex}`]?.[0] || ''}
                                onChange={(e) => handleTextChange(currentIndex, e.target.value)}
                            />
                        ) : currentQ.questionType === 'LONG_TEXT' ? (
                            <textarea
                                rows={5}
                                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                placeholder="Type your detailed answer here..."
                                value={previewAnswers[`q${currentIndex}`]?.[0] || ''}
                                onChange={(e) => handleTextChange(currentIndex, e.target.value)}
                            />
                        ) : currentQ.questionType === 'DATE' ? (
                            <input
                                type="date"
                                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                value={previewAnswers[`q${currentIndex}`]?.[0] || ''}
                                onChange={(e) => handleTextChange(currentIndex, e.target.value)}
                            />
                        ) : null}
                    </div>
                </div>

                {/* Footer Navigation */}
                <div className="flex items-center justify-between p-4 border-t bg-gray-50">
                    <button
                        onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                        disabled={currentIndex === 0}
                        className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    >
                        <ChevronLeft size={18} /> Previous
                    </button>

                    {/* Question Dots */}
                    <div className="flex gap-1.5 flex-wrap justify-center max-w-[60%]">
                        {questions.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentIndex(idx)}
                                className={`w-3 h-3 rounded-full transition-all ${idx === currentIndex
                                    ? 'bg-emerald-600 scale-125'
                                    : previewAnswers[`q${idx}`]
                                        ? 'bg-emerald-300'
                                        : 'bg-gray-300'
                                    }`}
                            />
                        ))}
                    </div>

                    <button
                        onClick={() => setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))}
                        disabled={currentIndex === questions.length - 1}
                        className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    >
                        Next <ChevronRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

const QuizCreatePage = ({ navigate }) => {
    const { user } = useAuth();
    const isPremiumUser = user?.isPlanActive || false;

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
    const [loading, setLoading] = useState(false);
    const [showPremiumModal, setShowPremiumModal] = useState(false);
    // Scheduling state
    const [isScheduled, setIsScheduled] = useState(false);
    const [startAtLocal, setStartAtLocal] = useState(''); // datetime-local string
    const [endAtLocal, setEndAtLocal] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [rollNumbers, setRollNumbers] = useState([]);

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
            ratingScale: 5,
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

        const normalized = newQs.map(normalizeImportedQuestion);

        setQuestions((prev) => [...prev, ...normalized]);
        setStatus(`Imported ${normalized.length} question${normalized.length > 1 ? 's' : ''} from AI.`);
    };

    const normalizeImportedQuestion = (q) => ({
        tempId: q.tempId || generateTempId(),
        questionText: q.questionText?.trim() || '',
        questionType: q.questionType || 'SINGLE',
        ratingScale: q.ratingScale || 5,
        options: Array.isArray(q.options) ? q.options.map((o, idx) => ({
            optionText: typeof o === 'string' ? o : (o.optionText || `Option ${idx + 1}`),
            isCorrect: typeof o === 'object' ? Boolean(o.isCorrect) : false
        })) : [
            { optionText: 'Option 1', isCorrect: false },
            { optionText: 'Option 2', isCorrect: false }
        ],
        points: q.points || 1,
        explanation: q.explanation || ''
    });

    const validateQuiz = () => {
        if (!title.trim()) return 'Quiz title is required';
        if (questions.length === 0) return 'Add at least one question';

        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            if (!q.questionText.trim()) return `Question ${i + 1} needs text`;

            // Only validate options for choice-based questions
            if (['SINGLE', 'MULTIPLE', 'TRUE_FALSE'].includes(q.questionType)) {
                if (q.options.some(opt => !opt.optionText.trim())) return `Question ${i + 1} has empty options`;
                if (!q.options.some(opt => opt.isCorrect)) return `Question ${i + 1} needs a correct answer marked`;
            }
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
                classes,
                rollNumbers,
                questions: cleanQuestions,
                settings,
                isScheduled: !!isScheduled,
                startAt: startAtLocal ? new Date(startAtLocal).toISOString() : null,
                endAt: endAtLocal ? new Date(endAtLocal).toISOString() : null,
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
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
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-emerald-800 mb-6 border-b pb-2">Create New Quiz</h1>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Left Column - Quiz Form */}
                <div className="flex-1 min-w-0">
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

                            {/* Classes/Sections Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Classes/Sections <span className="text-gray-400">(optional - for student grouping)</span>
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={classesInput}
                                        onChange={(e) => setClassesInput(e.target.value)}
                                        onKeyDown={handleClassKeyDown}
                                        className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                                        placeholder="e.g., CSE 5A (press Enter to add)"
                                    />
                                    <button
                                        type="button"
                                        onClick={addClass}
                                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                                    >
                                        Add
                                    </button>
                                </div>
                                {classes.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {classes.map((cls, idx) => (
                                            <span
                                                key={idx}
                                                className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm"
                                            >
                                                {cls}
                                                <button
                                                    type="button"
                                                    onClick={() => removeClass(cls)}
                                                    className="ml-1 text-emerald-600 hover:text-red-500"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Roll Numbers Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Roll Numbers <span className="text-gray-400">(optional - students select from dropdown)</span>
                                </label>
                                <textarea
                                    rows={4}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono text-sm"
                                    placeholder={"Paste roll numbers here...\nOne per line, comma or tab separated\nExample: 101, 102, 103"}
                                    value={rollNumbers.join('\n')}
                                    onChange={(e) => {
                                        const cleaned = parseRollNumbers(e.target.value);
                                        setRollNumbers(cleaned);
                                    }}
                                    onPaste={(e) => {
                                        e.preventDefault();
                                        const pasted = e.clipboardData.getData('text');
                                        const merged = [...new Set([...rollNumbers, ...parseRollNumbers(pasted)])].sort();
                                        setRollNumbers(merged);
                                    }}
                                />
                                <div className="flex items-center justify-between mt-2">
                                    <span className="text-sm text-gray-500">
                                        {rollNumbers.length} roll number{rollNumbers.length !== 1 ? 's' : ''} added
                                    </span>
                                    {rollNumbers.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setRollNumbers([])}
                                            className="text-xs text-red-500 hover:text-red-700"
                                        >
                                            Clear All
                                        </button>
                                    )}
                                </div>
                                {rollNumbers.length > 0 && (
                                    <div className="mt-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-gray-50">
                                        <div className="flex flex-wrap gap-1">
                                            {rollNumbers.slice(0, 100).map((rn, i) => (
                                                <span key={i} className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full">
                                                    {rn}
                                                </span>
                                            ))}
                                            {rollNumbers.length > 100 && (
                                                <span className="text-xs text-gray-400">+{rollNumbers.length - 100} more</span>
                                            )}
                                        </div>
                                    </div>
                                )}
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
                            {/* Scheduling */}
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-800">Schedule Quiz</h3>
                                        <p className="text-xs text-gray-500">Optional — make the quiz available only during the scheduled window.</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <label className="inline-flex items-center">
                                            <input type="checkbox" className="mr-2" checked={isScheduled} onChange={(e) => setIsScheduled(e.target.checked)} />
                                            <span className="text-sm">Enable Schedule</span>
                                        </label>
                                    </div>
                                </div>

                                {isScheduled && (
                                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs text-gray-600">Start (local)</label>
                                            <input
                                                type="datetime-local"
                                                value={startAtLocal}
                                                onChange={(e) => setStartAtLocal(e.target.value)}
                                                className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-600">End (local)</label>
                                            <input
                                                type="datetime-local"
                                                value={endAtLocal}
                                                onChange={(e) => setEndAtLocal(e.target.value)}
                                                className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
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
                            <p className={`p-3 rounded-lg text-sm font-medium ${status.startsWith('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                }`}>
                                {status}
                            </p>
                        )}

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    const error = validateQuiz();
                                    if (error) {
                                        setStatus(`Error: ${error}`);
                                        return;
                                    }
                                    setShowPreview(true);
                                }}
                                disabled={questions.length === 0}
                                className="flex-1 py-3 px-4 rounded-lg shadow-lg text-xl font-semibold text-emerald-700 bg-emerald-50 border-2 border-emerald-300 hover:bg-emerald-100 focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:opacity-50 transition flex items-center justify-center gap-2"
                            >
                                <Eye size={22} /> Preview
                            </button>
                            <button
                                type="submit"
                                disabled={loading || questions.length === 0}
                                className="flex-[2] py-3 px-4 rounded-lg shadow-lg text-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-500 disabled:opacity-50 transition"
                            >
                                {loading ? 'Creating Quiz...' : 'Create Quiz'}
                            </button>
                        </div>

                        {/* Quiz Preview Modal */}
                        <QuizPreviewModal
                            isOpen={showPreview}
                            onClose={() => setShowPreview(false)}
                            title={title}
                            description={description}
                            questions={questions}
                            settings={settings}
                        />
                    </form>
                </div>

                {/* Right Column - AI Assistant Panel */}
                <div className="lg:w-96 lg:shrink-0">
                    <div className="lg:sticky lg:top-4 h-[calc(100vh-8rem)] min-h-[500px]">
                        <QuizAIPanel
                            quiz={{ title, description, questions }}
                            onImportQuestions={onImportQuestions}
                            navigate={navigate}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuizCreatePage;
