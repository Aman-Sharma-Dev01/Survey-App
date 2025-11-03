import React from 'react';

const AnalysisChart = ({ data, title, questionType }) => {
    // Determine the type of chart based on the data structure
    const isQuantitative = (questionType === 'RADIO' || questionType === 'CHECKBOX');
    const totalCount = isQuantitative ? data.reduce((sum, item) => sum + (item.count || 0), 0) : 0;

    return (
        <div className="mt-4 p-4 bg-white rounded-lg shadow-md border border-gray-100">
            <h5 className="text-md font-semibold text-gray-700 mb-4">{title}</h5>

            {isQuantitative ? (
                // Bar Chart Visualization for Quantifiable Data (Radio/Checkbox)
                <div className="space-y-2">
                    {data.map((item, index) => {
                        const percentage = totalCount > 0 ? ((item.count / totalCount) * 100).toFixed(1) : 0;
                        return (
                            <div key={index} className="flex items-center">
                                <span className="w-1/3 text-sm text-gray-600 truncate">{item.text}</span>
                                <div className="w-2/3 h-6 bg-gray-200 rounded-full overflow-hidden ml-4 flex items-center">
                                    <div
                                        style={{ width: `${percentage}%` }}
                                        className="h-full bg-indigo-500 transition-all duration-500 ease-out flex items-center justify-end pr-2"
                                    >
                                        <span className="text-xs font-bold text-white shadow-text">{item.count}</span>
                                    </div>
                                    <span className="text-xs font-medium text-gray-500 ml-2">{percentage}%</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                // Text Response Display
                <div className="space-y-3 max-h-60 overflow-y-auto p-2 bg-gray-50 rounded-lg border border-gray-200">
                    {data.length > 0 ? (
                        data.map((text, index) => (
                            <p key={index} className="text-sm text-gray-700 p-2 bg-white rounded-md shadow-sm border border-gray-100 italic">
                                "{text}"
                            </p>
                        ))
                    ) : (
                        <p className="text-sm text-gray-500 text-center">No free text responses recorded yet.</p>
                    )}
                </div>
            )}
            {isQuantitative && <p className="mt-4 text-sm text-gray-500">Total Responses Counted: {totalCount}</p>}
        </div>
    );
};

export default AnalysisChart;
