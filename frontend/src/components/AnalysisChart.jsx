import React from 'react';
import { Bar, Pie } from 'react-chartjs-2';
// import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend, ArcController, PieController } from 'chart.js';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
// ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend, ArcController, PieController);
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

// Define a palette of professional and decent colors
const chartColors = [
    '#4C51BF', // Indigo (Primary)
    '#38B2AC', // Teal
    '#F6AD55', // Orange
    '#9F7AEA', // Violet
    '#48BB78', // Green
    '#F687B3', // Pink
    '#63B3ED', // Blue
    '#E53E3E', // Red
];

/**
 * Generates Chart.js data sets for Bar and Pie charts.
 */
const getChartDataSets = (dataCounts, chartType) => {
    const backgroundColors = dataCounts.map((_, index) => chartColors[index % chartColors.length]);
    
    if (chartType === 'Bar') {
        return [{
            label: 'Response Count',
            data: dataCounts,
            backgroundColor: backgroundColors,
            borderColor: backgroundColors,
            borderWidth: 1,
            borderRadius: 5,
        }];
    } else if (chartType === 'Pie') {
        return [{
            label: 'Response Percentage',
            data: dataCounts,
            backgroundColor: backgroundColors,
            borderColor: '#FFFFFF', // White border for Pie slices
            borderWidth: 2,
        }];
    }
    return [];
};

/**
 * Renders the quantitative charts (Bar, Pie, or Custom Detailed Bar).
 */
const QuantitativeChart = ({ data, totalCount, chartOption }) => {
    const labels = data.map(item => item.text);
    const dataCounts = data.map(item => item.count || 0);

    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false, // Allows flexible height/width
        plugins: {
            legend: {
                position: chartOption === 'Bar' ? 'top' : 'right',
                labels: {
                    font: { family: 'Inter, sans-serif', size: 12 },
                    color: '#4A5568', // Gray-700
                }
            },
            tooltip: {
                callbacks: {
                    label: (context) => {
                        const label = context.label || '';
                        // context.parsed for Pie is a number, for Bar it's an object {x:..., y:...}
                        const value = chartOption === 'Pie' ? context.parsed : context.parsed.y || 0;
                        const percentage = totalCount > 0 ? ((value / totalCount) * 100).toFixed(1) : 0;
                        return `${label}: ${value} (${percentage}%)`;
                    }
                }
            },
        },
    };

    if (chartOption === 'Bar') {
        const barOptions = {
            ...commonOptions,
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { font: { family: 'Inter, sans-serif' } }
                },
                y: {
                    beginAtZero: true,
                    ticks: { precision: 0, font: { family: 'Inter, sans-serif' } },
                    title: {
                        display: true,
                        text: 'Response Count',
                        font: { family: 'Inter, sans-serif', size: 14 }
                    }
                }
            },
        };
        const chartData = {
            labels,
            datasets: getChartDataSets(dataCounts, 'Bar'),
        };
        return <Bar data={chartData} options={barOptions} />;
    } else if (chartOption === 'Pie') {
        const pieOptions = {
            ...commonOptions,
            animation: {
                animateScale: true,
                animateRotate: true
            }
        };
        const chartData = {
            labels,
            datasets: getChartDataSets(dataCounts, 'Pie'),
        };
        return <Pie data={chartData} options={pieOptions} />;
    }

    // Default to the Custom Detailed Bar visualization ('CustomBar')
    return (
        <div className="space-y-3 p-2">
            {data.map((item, index) => {
                const percentage = totalCount > 0 ? ((item.count / totalCount) * 100).toFixed(1) : 0;
                const barColor = chartColors[index % chartColors.length];
                return (
                    <div key={index} className="flex items-center">
                        <span className="w-1/3 text-sm font-medium text-gray-700 truncate">{item.text}</span>
                        <div className="w-2/3 h-7 bg-gray-100 rounded-lg overflow-hidden ml-4 flex items-center border border-gray-200">
                            <div
                                style={{ width: `${percentage}%`, backgroundColor: barColor }}
                                className="h-full transition-all duration-700 ease-out flex items-center justify-between px-3"
                            >
                                <span className="text-xs font-bold text-white tracking-wider drop-shadow-sm">{item.count}</span>
                                <span className="text-xs font-semibold text-white tracking-wider drop-shadow-sm">{percentage}%</span>
                            </div>
                            {percentage < 30 && ( // Display percentage outside if the bar is too short
                                <span className="text-xs font-semibold text-gray-600 ml-2">{percentage}%</span>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

/**
 * Generates a textual analysis based on the data.
 */
const generateAnalysis = (data, totalCount, questionType) => {
    if (questionType === 'RADIO' || questionType === 'CHECKBOX') {
        if (totalCount === 0) return "No quantifiable responses recorded yet. Analysis cannot be generated.";

        const sortedData = [...data].sort((a, b) => (b.count || 0) - (a.count || 0));
        const topItem = sortedData[0];
        const topPercentage = totalCount > 0 ? ((topItem.count / totalCount) * 100).toFixed(1) : 0;
        
        if (questionType === 'RADIO') {
            return `The majority opinion is **"${topItem.text}"** accounting for **${topPercentage}%** of the total responses. This indicates the **primary choice** or preference among respondents, suggesting a clear trend towards this option.`;
        } else if (questionType === 'CHECKBOX') {
            const secondItem = sortedData.length > 1 ? sortedData[1] : null;
            let analysis = `The most selected option is **"${topItem.text}"** with **${topPercentage}%** selection rate. `;
            if (secondItem && secondItem.count > 0) {
                analysis += `The second highest selection is **"${secondItem.text}"** with **${((secondItem.count / totalCount) * 100).toFixed(1)}%**. `;
            }
            analysis += 'This suggests the options are not mutually exclusive, highlighting the most common individual preferences or common combinations.';
            return analysis;
        }
    } else { // Qualitative (e.g., TEXTAREA)
        if (data.length === 0) return "No free text responses recorded yet. Analysis cannot be generated.";
        
        return `This question type allows for open-ended feedback. A total of **${data.length}** individual text responses have been recorded. **Manual review** is required to identify key themes, sentiments, and emerging topics within the qualitative data.`;
    }
    return "Insufficient data to provide a meaningful analysis.";
};

/**
 * Main component for rendering the chart and analysis.
 */
const AnalysisChart = ({ data, title, questionType, defaultChart = 'Bar' }) => {
    const [chartType, setChartType] = React.useState(defaultChart);
    const isQuantitative = (questionType === 'RADIO' || questionType === 'CHECKBOX');
    const totalCount = isQuantitative ? data.reduce((sum, item) => sum + (item.count || 0), 0) : 0;

    const chartOptions = [
        { key: 'Bar', label: 'Bar Chart' },
        { key: 'Pie', label: 'Pie Chart' },
        { key: 'CustomBar', label: 'Detailed Bar' }
    ];

    const analysisText = generateAnalysis(data, totalCount, questionType);

    return (
        <div className="mt-6 p-6 bg-white rounded-xl shadow-2xl border border-gray-100 transform hover:shadow-lg transition duration-300 ease-in-out">
            <header className="flex justify-between items-center mb-5 border-b pb-4">
                <h5 className="text-xl font-extrabold text-indigo-700">{title}</h5>
                {isQuantitative && (
                    <div className="flex space-x-2">
                        {chartOptions.map(option => (
                            <button
                                key={option.key}
                                onClick={() => setChartType(option.key)}
                                className={`px-3 py-1 text-sm font-medium rounded-full transition duration-150 ease-in-out ${
                                    chartType === option.key
                                        ? 'bg-indigo-600 text-white shadow-md'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                                aria-label={`View as ${option.label}`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                )}
            </header>

            {/* --- Overall Analysis Section --- */}
            <div className="mb-6 p-4 bg-indigo-50 border-l-4 border-indigo-500 rounded-lg shadow-inner">
                <h6 className="text-md font-bold text-indigo-800 mb-2 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3a1 1 0 001 1h2a1 1 0 100-2h-1V7z" clipRule="evenodd"></path></svg>
                    Overall Analysis
                </h6>
                <p className="text-sm text-gray-700 font-medium leading-relaxed" dangerouslySetInnerHTML={{ __html: analysisText }} />
            </div>
            {/* --- End Overall Analysis Section --- */}

            {isQuantitative ? (
                // Quantitative Visualization Area
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 min-h-[300px] flex items-center justify-center">
                    {totalCount > 0 ? (
                        <div style={{ height: chartType === 'CustomBar' ? 'auto' : '350px', width: '100%' }}>
                             <QuantitativeChart data={data} totalCount={totalCount} chartOption={chartType} />
                        </div>
                    ) : (
                        <p className="text-lg text-gray-500 font-medium">No quantifiable responses recorded yet.</p>
                    )}
                </div>
            ) : (
                // Qualitative (Free Text) Response Display
                <div className="space-y-3 max-h-80 overflow-y-auto p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h6 className="text-base font-semibold text-gray-800 border-b pb-2 mb-3 sticky top-0 bg-gray-50 z-10">
                        Qualitative Responses ({data.length})
                    </h6>
                    {data.length > 0 ? (
                        data.map((text, index) => (
                            <blockquote
                                key={index}
                                className="text-sm text-gray-700 p-3 bg-white rounded-lg shadow-sm border border-gray-100 italic relative"
                            >
                                <svg className="w-4 h-4 text-indigo-400 absolute top-2 left-2 opacity-50" fill="currentColor" viewBox="0 0 24 24"><path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/></svg>
                                <p className="ml-6 mr-1">"{text}"</p>
                            </blockquote>
                        ))
                    ) : (
                        <p className="text-base text-gray-500 text-center py-10">No free text responses recorded yet.</p>
                    )}
                </div>
            )}
            {isQuantitative && <p className="mt-5 text-sm font-semibold text-gray-600 text-right border-t pt-3">Total Responses Analyzed: <span className="text-indigo-600 text-base">{totalCount}</span></p>}
        </div>
    );
};

export default AnalysisChart;