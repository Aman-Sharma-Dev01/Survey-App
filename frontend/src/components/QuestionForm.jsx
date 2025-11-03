import React, { useState, useCallback, useEffect } from 'react';
import { generateTempId } from '../services/api';
import { Trash2, Plus, GripVertical, CheckSquare, List, Type } from 'lucide-react';

/**
 * Handles the creation and editing of a single survey question.
 * Manages question text, type, options, and required status.
 */
const QuestionEditor = ({ question, index, onUpdate, onDelete, onMove }) => {
    const [qData, setQData] = useState(question);

    // Update internal state when external 'question' prop changes (e.g., reset)
    useEffect(() => {
        setQData(question);
    }, [question]);

    // Debounced update to propagate changes back to parent (SurveyCreate)
    const handleUpdate = useCallback((newData) => {
        const updatedData = { ...qData, ...newData };
        setQData(updatedData);
        onUpdate(updatedData);
    }, [qData, onUpdate]);

    const handleOptionChange = (optionIndex, newText) => {
        const newOptions = qData.options.map((opt, i) => {
            if (i === optionIndex) {
                // Ensure value and text are the same for simplicity in this MVP
                return { ...opt, optionText: newText, value: newText };
            }
            return opt;
        });
        handleUpdate({ options: newOptions });
    };

    const addOption = () => {
        handleUpdate({
            options: [...qData.options, { optionText: `Option ${qData.options.length + 1}`, value: generateTempId() }]
        });
    };

    const deleteOption = (optionIndex) => {
        const newOptions = qData.options.filter((_, i) => i !== optionIndex);
        handleUpdate({ options: newOptions });
    };

    const renderQuestionTypeIcon = (type) => {
        switch (type) {
            case 'RADIO': return <List className="w-4 h-4 text-indigo-500" />;
            case 'CHECKBOX': return <CheckSquare className="w-4 h-4 text-green-500" />;
            case 'TEXT':
            case 'TEXTAREA': return <Type className="w-4 h-4 text-yellow-500" />;
            default: return null;
        }
    };

    const hasOptions = qData.questionType === 'RADIO' || qData.questionType === 'CHECKBOX';

    return (
        <div className="bg-white p-6 shadow-lg rounded-xl border border-gray-200 hover:shadow-xl transition duration-300">
            {/* Drag Handle and Index */}
            <div className="flex items-center justify-between border-b pb-4 mb-4">
                <div className="flex items-center space-x-3">
                    <GripVertical className="w-5 h-5 text-gray-400 cursor-grab" title="Drag to reorder" />
                    <span className="text-sm font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        Question {index + 1}
                    </span>
                </div>
                <div className="flex space-x-3">
                    {/* Required Checkbox */}
                    <label className="flex items-center text-sm text-gray-600 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={qData.isRequired}
                            onChange={(e) => handleUpdate({ isRequired: e.target.checked })}
                            className="mr-2 h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        Required
                    </label>

                    {/* Delete Button */}
                    <button
                        onClick={onDelete}
                        className="p-2 rounded-full text-red-500 hover:bg-red-50 transition duration-150"
                        title="Delete Question"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Question Text and Type */}
            <div className="flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0 mb-6">
                <div className="flex-1">
                    <label htmlFor={`question-text-${qData._id}`} className="block text-sm font-medium text-gray-700 mb-1">
                        Question Text
                    </label>
                    <input
                        id={`question-text-${qData._id}`}
                        type="text"
                        value={qData.questionText}
                        onChange={(e) => handleUpdate({ questionText: e.target.value })}
                        placeholder="Type your question here..."
                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition"
                    />
                </div>

                <div>
                    <label htmlFor={`question-type-${qData._id}`} className="block text-sm font-medium text-gray-700 mb-1">
                        Type
                    </label>
                    <select
                        id={`question-type-${qData._id}`}
                        value={qData.questionType}
                        onChange={(e) => handleUpdate({ questionType: e.target.value, options: (e.target.value === 'TEXT' || e.target.value === 'TEXTAREA') ? [] : qData.options })}
                        className="w-full md:w-40 border border-gray-300 bg-white rounded-lg p-3 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 appearance-none transition"
                    >
                        <option value="RADIO">Radio Button (Single Choice)</option>
                        <option value="CHECKBOX">Checkbox (Multiple Choice)</option>
                        <option value="TEXT">Short Answer (Text)</option>
                        <option value="TEXTAREA">Long Answer (Paragraph)</option>
                    </select>
                </div>
            </div>

            {/* Options Management (if applicable) */}
            {hasOptions && (
                <div className="mt-4 p-4 border border-dashed border-gray-300 rounded-lg bg-indigo-50">
                    <p className="text-sm font-semibold text-indigo-700 mb-3 flex items-center">
                        {renderQuestionTypeIcon(qData.questionType)}
                        <span className="ml-2">Options</span>
                    </p>
                    <div className="space-y-2">
                        {qData.options.map((option, optIndex) => (
                            <div key={optIndex} className="flex items-center space-x-2">
                                <span className={`text-gray-500 ${qData.questionType === 'RADIO' ? 'w-4 h-4 border border-gray-400 rounded-full' : 'w-4 h-4 border border-gray-400 rounded-md'}`} />
                                <input
                                    type="text"
                                    value={option.optionText}
                                    onChange={(e) => handleOptionChange(optIndex, e.target.value)}
                                    placeholder={`Option ${optIndex + 1}`}
                                    className="flex-1 border-b border-gray-300 p-2 text-sm focus:border-indigo-500 focus:outline-none transition"
                                />
                                <button
                                    onClick={() => deleteOption(optIndex)}
                                    className="p-1 text-gray-400 hover:text-red-500 transition"
                                    title="Delete Option"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={addOption}
                        className="mt-4 flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 transition duration-150"
                    >
                        <Plus className="w-4 h-4 mr-1" /> Add Option
                    </button>
                </div>
            )}
        </div>
    );
};

export default QuestionEditor;
