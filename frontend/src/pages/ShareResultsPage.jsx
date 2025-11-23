import React, { useEffect, useState } from "react";
import { getPublicSharedResults } from "../services/responseService";
import AnalysisChart from "../components/AnalysisChart";

const ShareResultsPage = ({ surveyId }) => {
    const [data, setData] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
  const loadData = async () => {
    try {
      const response = await getPublicSharedResults(surveyId);
      setData(response);
    } catch (err) {
      setError("This survey is not publicly shared.");
    }
  };
  loadData();
}, [surveyId]);


    if (error) return <p className="text-center text-red-600 mt-20">{error}</p>;
    if (!data) return <p className="text-center mt-20 text-xl">Loading results...</p>;

    return (
        <div className="max-w-5xl mx-auto p-8">
            <h1 className="text-3xl font-bold text-center mb-5">Public Survey Results</h1>
            <p className="text-center mb-6 text-gray-600">Total Responses: {data.totalResponses}</p>

            <div className="space-y-6">
                {data.questions.map(q => (
                    <div key={q.questionId} className="bg-white p-5 rounded-xl shadow">
                        <h2 className="font-bold text-lg mb-3">{q.questionText}</h2>
                        <AnalysisChart
                            title="Results"
                            data={q.type === "TEXT" ? q.freeTextResponses : q.options}
                            questionType={q.type}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ShareResultsPage;
