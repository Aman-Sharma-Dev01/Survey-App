import React, { useState, useEffect } from "react";
import { BarChart, Share2, Download, Sparkles, FileDown, Loader2 } from "lucide-react";
import {
  getSurveyAnalysis,
  exportSurveyCSV,
} from "../services/responseService";
import { updateSurveyShareStatus, getSurveyDetails } from "../services/surveyService";
import AnalysisChart from "../components/AnalysisChart";
import { generateSurveyInsights } from "../services/aiAnalyticsService";

const AnalysisPage = ({ surveyId }) => {
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isShareable, setIsShareable] = useState(false);
  const [surveyTitle, setSurveyTitle] = useState("Survey");

  const [aiReport, setAiReport] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  // Fetch share status & survey info
  useEffect(() => {
    const loadSurveyDetails = async () => {
      try {
        const data = await getSurveyDetails(surveyId);
        setIsShareable(data.isShareable || false);
        setSurveyTitle(data.title || "Survey");
      } catch (err) {
        console.error("Error loading survey details");
      }
    };
    loadSurveyDetails();
  }, [surveyId]);

  // Fetch analysis data
  useEffect(() => {
    const loadAnalysis = async () => {
      try {
        setLoading(true);
        const data = await getSurveyAnalysis(surveyId);
        setAnalysisData(data);
      } catch (err) {
        setError(err.message || "Failed to load analysis data.");
      } finally {
        setLoading(false);
      }
    };
    loadAnalysis();
  }, [surveyId]);

  // Toggle share status
  const handleShareToggle = async () => {
    try {
      const newStatus = !isShareable;
      await updateSurveyShareStatus(surveyId, newStatus);
      setIsShareable(newStatus);
      alert(newStatus ? "Survey is now public!" : "Survey is now private.");
    } catch (err) {
      alert("Failed to update share setting.");
    }
  };

  // Copy the public share link
  const copyShareLink = () => {
    const shareURL = `${window.location.origin}/#/share/${surveyId}`;
    navigator.clipboard.writeText(shareURL);
    alert("Public share link copied!");
  };

  // Download CSV
  const downloadCSV = () => {
    exportSurveyCSV(surveyId);
  };

  // Build a compact summary for the AI service
  const buildAnalysisSummary = (analysis) => {
    if (!analysis) return { totalResponses: 0, questions: [] };
    const questions = Object.values(analysis.questionBreakdown || {}).map((q) => ({
      text: q.questionText,
      type: q.questionType,
      options: (q.options || []).map((opt) => ({
        label: opt.option || opt.label,
        count: opt.count,
        percentage: opt.percentage,
      })),
      freeTextSamples: (q.freeTextResponses || []).slice(0, 6),
    }));

    return {
      totalResponses: analysis.totalResponses || 0,
      questions,
    };
  };

  const handleGenerateInsights = async () => {
    if (!analysisData) return;
    setAiLoading(true);
    setAiError("");
    try {
      const summary = buildAnalysisSummary(analysisData);
      const insights = await generateSurveyInsights({
        surveyId,
        surveyTitle,
        analysisSummary: summary,
      });
      setAiReport(insights || "");
    } catch (err) {
      setAiError(err.message || "Failed to generate AI insights");
    } finally {
      setAiLoading(false);
    }
  };

  const downloadAIReport = () => {
    if (!aiReport) return;
    const blob = new Blob([aiReport], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `survey-${surveyId}-ai-insights.md`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  // UI rendering
  if (loading) {
    return <div className="p-8 text-center text-xl text-indigo-600">Calculating Analysis...</div>;
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-600 bg-red-100 rounded-lg max-w-xl mx-auto mt-10">
        {error}
      </div>
    );
  }

  if (!analysisData || analysisData.totalResponses === 0) {
    return (
      <div className="max-w-3xl mx-auto p-10 mt-10 text-center bg-yellow-50 border border-yellow-200 rounded-xl shadow-lg">
        <BarChart size={48} className="text-yellow-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-yellow-700 mb-2">No Responses Yet</h2>
        <p className="text-yellow-600">Share your survey link to start collecting data.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
      <header className="bg-indigo-600 text-white p-6 rounded-xl shadow-lg mb-6">
        <div className="flex flex-col sm:flex-row justify-between">
          <div>
            <h1 className="text-3xl font-extrabold">Survey Results Dashboard</h1>
            <p className="text-indigo-200 mt-1">
              Survey ID: <span className="font-mono text-sm">{surveyId}</span>
            </p>
            <div className="mt-3 text-lg font-bold bg-white text-indigo-800 p-2 rounded-lg w-fit shadow-md">
              Total Responses: {analysisData.totalResponses}
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-0">
            <button
              onClick={handleShareToggle}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow transition ${
                isShareable
                  ? "bg-green-600 text-white hover:bg-green-500"
                  : "bg-gray-300 text-gray-800 hover:bg-gray-200"
              }`}
            >
              {isShareable ? "Disable Public Share" : "Enable Public Share"}
            </button>

            {isShareable && (
              <button
                onClick={copyShareLink}
                className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white px-4 py-2 rounded-lg shadow transition"
              >
                <Share2 size={18} /> Copy Share Link
              </button>
            )}

            <button
              onClick={downloadCSV}
              className="flex items-center gap-2 bg-white text-indigo-700 border border-indigo-300 hover:bg-indigo-50 px-4 py-2 rounded-lg shadow transition"
            >
              <Download size={18} /> Export CSV
            </button>
          </div>
        </div>
      </header>

      {/* AI Insights Section */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-8">
        <div className="flex items-start gap-3">
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
            <Sparkles size={24} />
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">AI Insights & Report</h2>
                <p className="text-gray-600">Get concise, actionable insights based on collected responses.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleGenerateInsights}
                  disabled={aiLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition disabled:opacity-60"
                >
                  {aiLoading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                  {aiLoading ? 'Generating...' : aiReport ? 'Regenerate' : 'Generate Insights'}
                </button>
                <button
                  onClick={downloadAIReport}
                  disabled={!aiReport}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-800 font-semibold border border-gray-200 hover:bg-gray-200 transition disabled:opacity-60"
                >
                  <FileDown size={18} />
                  Export Report
                </button>
              </div>
            </div>

            {aiError && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
                {aiError}
              </div>
            )}

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 min-h-[160px]">
              {aiLoading && (
                <div className="flex items-center gap-2 text-indigo-600 font-medium">
                  <Loader2 className="animate-spin" size={18} /> Preparing insights...
                </div>
              )}
              {!aiLoading && aiReport && (
                <div className="prose prose-indigo max-w-none whitespace-pre-wrap text-gray-800">
                  {aiReport}
                </div>
              )}
              {!aiLoading && !aiReport && !aiError && (
                <p className="text-gray-500">Click "Generate Insights" to produce an AI-powered summary of this survey.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {Object.entries(analysisData.questionBreakdown).map(([id, breakdown]) => (
          <div key={id} className="p-6 bg-white rounded-xl shadow-lg border border-gray-100">
            <h3 className="text-xl font-bold mb-4">{breakdown.questionText}</h3>
            <div className="text-sm font-medium text-gray-500 mb-4">
              Type: {breakdown.questionType}
            </div>
            <AnalysisChart
              title={breakdown.questionType === "TEXT" ? "Free Text Responses" : "Option Breakdown"}
              data={breakdown.questionType === "TEXT" ? breakdown.freeTextResponses : breakdown.options}
              questionType={breakdown.questionType}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnalysisPage;
