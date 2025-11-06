import React, { useState } from 'react';
import { ChevronDown, ChevronUp, PlusCircle, Sparkles } from 'lucide-react';

// ---- Preset Library (extend as you like) -----------------------------------
const ANSWER_PRESETS = [
  { key: 'YES_NO', label: 'Yes - No', options: ['Yes', 'No'] },
  { key: 'TRUE_FALSE', label: 'True - False', options: ['True', 'False'] },

  { key: 'AGREE_DISAGREE', label: 'Agree - Disagree', options: ['Strongly agree', 'Agree', 'Neither agree nor disagree', 'Disagree', 'Strongly disagree'] },
  { key: 'SATISFIED_DISSATISFIED', label: 'Satisfied - Dissatisfied', options: ['Very satisfied', 'Satisfied', 'Neutral', 'Dissatisfied', 'Very dissatisfied'] },
  { key: 'LIKELY_UNLIKELY', label: 'Likely - Unlikely', options: ['Very likely', 'Likely', 'Neutral', 'Unlikely', 'Very unlikely'] },
  { key: 'ALWAYS_NEVER', label: 'Always - Never', options: ['Always', 'Usually', 'Sometimes', 'Rarely', 'Never'] },
  { key: 'HIGH_LOW', label: 'High quality - Low quality', options: ['Very high quality', 'High quality', 'Neutral', 'Low quality', 'Very low quality'] },
  { key: 'USEFUL_NOT_USEFUL', label: 'Useful - Not useful', options: ['Very useful', 'Useful', 'Neutral', 'Not useful', 'Not useful at all'] },
  { key: 'VALUABLE_NOT_VALUABLE', label: 'Valuable - Not valuable', options: ['Very valuable', 'Valuable', 'Neutral', 'Not valuable', 'Not valuable at all'] },
  { key: 'CLEAR_NOT_CLEAR', label: 'Clear - Not clear', options: ['Very clear', 'Clear', 'Neutral', 'Not clear', 'Very unclear'] },
  { key: 'HELPFUL_NOT_HELPFUL', label: 'Helpful - Not helpful', options: ['Very helpful', 'Helpful', 'Neutral', 'Not helpful', 'Not helpful at all'] },
];

const buildOptionsFromPreset = (key) => {
  const preset = ANSWER_PRESETS.find(p => p.key === key);
  if (!preset) return [];
  return preset.options.map(o => ({ optionText: o, value: o }));
};

const isChoiceType = (t) => t === 'RADIO' || t === 'CHECKBOX';
// ----------------------------------------------------------------------------

const QuestionEditor = ({ question, index, updateQuestion, removeQuestion }) => {
    const [isOpen, setIsOpen] = useState(true);

    const handleOptionChange = (optionIndex, newText) => {
        const current = question.options || [];
        const newOptions = current.map((opt, i) =>
            i === optionIndex ? { ...opt, optionText: newText, value: newText } : opt
        );
        updateQuestion(question.tempId, { options: newOptions, presetKey: null }); // editing breaks preset lock
    };

    const addOption = () => {
        const current = question.options || [];
        updateQuestion(question.tempId, {
            options: [
                ...current,
                { optionText: `Option ${current.length + 1}`, value: `Option ${current.length + 1}` },
            ],
            presetKey: null,
        });
    };

    const removeOption = (optionIndex) => {
        const current = question.options || [];
        updateQuestion(question.tempId, {
            options: current.filter((_, i) => i !== optionIndex),
            presetKey: null,
        });
    };

    const applyPreset = (key) => {
        if (!key) {
            updateQuestion(question.tempId, { presetKey: null });
            return;
        }
        const newOptions = buildOptionsFromPreset(key);
        updateQuestion(question.tempId, { presetKey: key, options: newOptions });
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
                                if (newType === 'TEXT') {
                                    updates.options = [];
                                    updates.presetKey = null;
                                } else {
                                    const hasOptions = (question.options || []).length > 0;
                                    if (!hasOptions) {
                                        updates.options = [{ optionText: 'Option 1', value: 'Option 1' }];
                                    }
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

                    {/* Answer Presets (visible for choice types) */}
                    {isChoiceType(question.questionType) && (
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                <span className="inline-flex items-center gap-1">
                                    <Sparkles size={16} className="text-indigo-600" /> Answer presets
                                </span>
                            </label>
                            <select
                                value={question.presetKey || ''}
                                onChange={(e) => applyPreset(e.target.value)}
                                className="block w-full p-2 border border-gray-300 bg-white rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="">Select type</option>
                                {ANSWER_PRESETS.map(p => (
                                    <option key={p.key} value={p.key}>{p.label}</option>
                                ))}
                            </select>
                            {question.presetKey && (
                                <p className="text-xs text-gray-500">Preset applied: {ANSWER_PRESETS.find(p => p.key === question.presetKey)?.label}</p>
                            )}
                        </div>
                    )}

                    {/* Options (for RADIO/CHECKBOX) */}
                    {isChoiceType(question.questionType) && (
                        <div className="space-y-2 border p-3 rounded-lg bg-white">
                            <label className="block text-sm font-medium text-gray-700">Options</label>
                            {(question.options || []).map((option, optIdx) => (
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
                                        type="button"
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
