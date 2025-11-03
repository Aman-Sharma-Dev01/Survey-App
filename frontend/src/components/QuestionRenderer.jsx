import React from 'react';

const QuestionRenderer = ({ question, index, answers, setAnswers }) => {
    const handleAnswerChange = (value) => {
        setAnswers(prevAnswers => {
            const existingIndex = prevAnswers.findIndex(a => a.questionId === question._id);
            const newAnswer = { questionId: question._id, answerValue: value };

            if (existingIndex > -1) {
                // Update existing answer
                return prevAnswers.map((a, i) => i === existingIndex ? newAnswer : a);
            } else {
                // Add new answer
                return [...prevAnswers, newAnswer];
            }
        });
    };

    const handleCheckboxChange = (optionValue, isChecked) => {
        const currentAnswer = answers.find(a => a.questionId === question._id) || { questionId: question._id, answerValue: [] };
        // Ensure answerValue is treated as an array for CHECKBOX
        let newValues = Array.isArray(currentAnswer.answerValue) ? [...currentAnswer.answerValue] : [];

        if (isChecked) {
            newValues.push(optionValue);
        } else {
            newValues = newValues.filter(v => v !== optionValue);
        }
        handleAnswerChange(newValues);
    };

    const currentAnswer = answers.find(a => a.questionId === question._id);

    return (
        <div className="p-5 bg-white rounded-xl shadow-md mb-6 border border-indigo-100">
            <h4 className="text-lg font-semibold text-gray-800 mb-3">
                {index + 1}. {question.questionText}
                {question.isRequired && <span className="text-red-500 ml-1">*</span>}
            </h4>

            {question.questionType === 'TEXT' && (
                <textarea
                    rows="3"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Type your answer here..."
                    value={currentAnswer?.answerValue || ''}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                />
            )}

            {question.questionType === 'RADIO' && (
                <div className="space-y-2">
                    {question.options.map((option, idx) => (
                        <label key={idx} className="flex items-center p-2 rounded-lg hover:bg-indigo-50 cursor-pointer">
                            <input
                                type="radio"
                                name={question._id}
                                value={option.optionText}
                                checked={currentAnswer?.answerValue === option.optionText}
                                onChange={() => handleAnswerChange(option.optionText)}
                                className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                            />
                            <span className="ml-3 text-gray-700">{option.optionText}</span>
                        </label>
                    ))}
                </div>
            )}

            {question.questionType === 'CHECKBOX' && (
                <div className="space-y-2">
                    {question.options.map((option, idx) => (
                        <label key={idx} className="flex items-center p-2 rounded-lg hover:bg-indigo-50 cursor-pointer">
                            <input
                                type="checkbox"
                                name={question._id}
                                value={option.optionText}
                                checked={Array.isArray(currentAnswer?.answerValue) && currentAnswer.answerValue.includes(option.optionText)}
                                onChange={(e) => handleCheckboxChange(option.optionText, e.target.checked)}
                                className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                            />
                            <span className="ml-3 text-gray-700">{option.optionText}</span>
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
};

export default QuestionRenderer;
