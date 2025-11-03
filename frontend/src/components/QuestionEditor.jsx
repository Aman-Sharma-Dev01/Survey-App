import React, { useState } from 'react';
import { ChevronDown, ChevronUp, PlusCircle } from 'lucide-react';

const QuestionEditor = ({ question, index, updateQuestion, removeQuestion }) => {
    const [isOpen, setIsOpen] = useState(true);

    const handleOptionChange = (optionIndex, newText) => {
        const newOptions = question.options.map((opt, i) =>
            i === optionIndex ? { ...opt, optionText: newText, value: newText } : opt
        );
        updateQuestion(question.tempId, { options: newOptions });
    };

    const addOption = () => {
        updateQuestion(question.tempId, { options: [...question.options, { optionText: `Option ${question.options.length + 1}`, value: `Option ${question.options.length + 1}` }] });
    };

    const removeOption = (optionIndex) => {
        updateQuestion(question.tempId, { options: question.options.filter((_, i) => i !== optionIndex) });
    };

    return (
        <div className="bg-gray-50 p-4 rounded-xl shadow-md border border-gray-200 mb-4">
            <header className="flex justify-between items-center cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
                <h4 className="text-lg font-semibold text-gray-800">
                    {index + 1}. {question.questionText || 'New Question'}
                </h4>
                <div className="flex items-center space-x-3">
                    <span className={`text-sm font-medium ${question.questionType === 'TEXT' ? 'text-blue-600' : 'text-indigo-600'}`}>
                        {question.questionType}
                    </span>
                    {isOpen ? <ChevronUp size={20} className="text-indigo-500" /> : <ChevronDown size={20} className="text-indigo-500" />}
                </div>
            </header>

            {isOpen && (
                <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                    {/* Question Text Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Question Text</label>
                        <input
                            type="text"
                            value={question.questionText}
                            onChange={(e) => updateQuestion(question.tempId, { questionText: e.target.value })}
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Type your question here..."
                        />
                    </div>

                    {/* Question Type Selector */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Question Type</label>
                        <select
                            value={question.questionType}
                            onChange={(e) => {
                                const newType = e.target.value;
                                const updates = { questionType: newType };
                                // Clear options if switching to TEXT
                                if (newType === 'TEXT') {
                                    updates.options = [];
                                } else if (question.options.length === 0) {
                                    // Add default option if switching from TEXT
                                    updates.options = [{ optionText: 'Option 1', value: 'Option 1' }];
                                }
                                updateQuestion(question.tempId, updates);
                            }}
                            className="mt-1 block w-full p-2 border border-gray-300 bg-white rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="RADIO">Single Choice (Radio)</option>
                            <option value="CHECKBOX">Multiple Choice (Checkbox)</option>
                            <option value="TEXT">Free Text (Short/Long Answer)</option>
                        </select>
                    </div>

                    {/* Options (for RADIO/CHECKBOX) */}
                    {(question.questionType === 'RADIO' || question.questionType === 'CHECKBOX') && (
                        <div className="space-y-2 border p-3 rounded-lg bg-white">
                            <label className="block text-sm font-medium text-gray-700">Options</label>
                            {question.options.map((option, optIdx) => (
                                <div key={optIdx} className="flex items-center space-x-2">
                                    <input
                                        type="text"
                                        value={option.optionText}
                                        onChange={(e) => handleOptionChange(optIdx, e.target.value)}
                                        className="block w-full p-1.5 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-indigo-500"
                                        placeholder={`Option ${optIdx + 1}`}
                                    />
                                    <button
                                        onClick={() => removeOption(optIdx)}
                                        className="text-red-500 hover:text-red-700 transition"
                                        title="Remove option"
                                    >
                                        &times;
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={addOption}
                                className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
                            >
                                <PlusCircle size={16} className="mr-1" /> Add Option
                            </button>
                        </div>
                    )}

                    {/* Controls */}
                    <div className="flex justify-end space-x-3 pt-3 border-t border-gray-100">
                        <label className="flex items-center text-sm font-medium text-gray-700">
                            <input
                                type="checkbox"
                                checked={question.isRequired}
                                onChange={(e) => updateQuestion(question.tempId, { isRequired: e.target.checked })}
                                className="mr-2 h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            Required
                        </label>
                        <button
                            type="button"
                            onClick={() => removeQuestion(question.tempId)}
                            className="text-sm text-red-500 hover:text-red-700 font-medium"
                        >
                            Delete Question
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuestionEditor;
