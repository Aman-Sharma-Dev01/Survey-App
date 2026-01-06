import React, { useEffect, useMemo, useState } from 'react';
import { Loader, Users, CheckCircle, Clock, TrendingUp, Download } from 'lucide-react';
import { getCodingTestAnalytics } from '../services/codingTestService';

const CodingTestAnalytics = ({ codingTestId, navigate }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedClass, setSelectedClass] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getCodingTestAnalytics(codingTestId);
        setData(result);
      } catch (err) {
        setError(err?.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [codingTestId]);

  const availableClasses = useMemo(() => {
    if (!data?.recentResponses) return [];
    return [...new Set(data.recentResponses.map((r) => r.participantClass).filter(Boolean))].sort();
  }, [data]);

  const filteredResponses = useMemo(() => {
    if (!data?.recentResponses) return [];
    if (!selectedClass) return data.recentResponses;
    return data.recentResponses.filter((r) => r.participantClass === selectedClass);
  }, [data, selectedClass]);

  const filteredStats = useMemo(() => {
    if (!data?.analytics) return { totalResponses: 0, passRate: 0, avgScore: 0, avgTime: 0 };
    if (!selectedClass || filteredResponses.length === 0) return data.analytics;
    const total = filteredResponses.length;
    const passed = filteredResponses.filter((r) => r.passed).length;
    const avgScore = Math.round(filteredResponses.reduce((sum, r) => sum + r.percentage, 0) / total);
    const avgTime = Math.round(filteredResponses.reduce((sum, r) => sum + (r.timeTaken || 0), 0) / total);
    return { totalResponses: total, passRate: Math.round((passed / total) * 100), avgScore, avgTime };
  }, [data, filteredResponses, selectedClass]);

  const exportCsv = () => {
    if (!filteredResponses.length) return alert('No responses to export');
    const headers = ['Name', 'Class', 'Roll No', 'Score', 'Total Points', 'Percentage', 'Status', 'Time Taken', 'Submitted At'];
    const rows = filteredResponses.map((r) => [
      r.participantName || 'Anonymous',
      r.participantClass || '-',
      r.participantRollNo || '-',
      r.score,
      r.totalPoints,
      `${r.percentage}%`,
      r.passed ? 'Passed' : 'Failed',
      r.timeTaken ? `${Math.floor(r.timeTaken / 60)}m ${r.timeTaken % 60}s` : '-',
      new Date(r.submittedAt).toLocaleString(),
    ]);
    const csv = [headers.join(','), ...rows.map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${data.test.title.replace(/[^a-z0-9]/gi, '_')}_responses.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader className="animate-spin text-emerald-600" size={48} /></div>;
  if (error) return <div className="max-w-xl mx-auto p-6 mt-10 bg-red-50 border border-red-200 rounded-xl text-red-700">{error}</div>;

  const { test, questionStats } = data;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => navigate('coding-dashboard')} className="text-emerald-600 text-sm mb-1">← Back</button>
          <h1 className="text-2xl font-extrabold text-emerald-800">{test.title}</h1>
          <p className="text-gray-600">Coding test analytics</p>
        </div>
        <button onClick={exportCsv} className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm">
          <Download size={16} /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-4 border border-emerald-100">
          <p className="text-sm text-gray-500">Total Attempts</p>
          <p className="text-3xl font-bold text-emerald-600">{filteredStats.totalResponses}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 border border-emerald-100">
          <p className="text-sm text-gray-500">Pass Rate</p>
          <p className="text-3xl font-bold text-emerald-600">{filteredStats.passRate}%</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 border border-emerald-100">
          <p className="text-sm text-gray-500">Avg Score</p>
          <p className="text-3xl font-bold text-emerald-600">{filteredStats.avgScore}%</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 border border-emerald-100">
          <p className="text-sm text-gray-500">Avg Time</p>
          <p className="text-3xl font-bold text-emerald-600">{Math.floor((filteredStats.avgTime || 0) / 60)}m</p>
        </div>
      </div>

      {availableClasses.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700">Filter by class:</span>
          <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="border rounded-lg px-3 py-2">
            <option value="">All</option>
            {availableClasses.map((cls) => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg border p-4">
        <h2 className="text-lg font-bold text-gray-800 mb-3">Question Performance</h2>
        <div className="space-y-3">
          {questionStats.map((q, i) => (
            <div key={q.questionId} className="p-3 bg-gray-50 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-800">Q{i + 1}. {q.title}</div>
                <div className={`text-xs font-semibold ${q.accuracy >= 70 ? 'text-emerald-700' : q.accuracy >= 40 ? 'text-amber-700' : 'text-red-700'}`}>{q.accuracy}% correct</div>
              </div>
              <p className="text-xs text-gray-600">{q.correctCount} / {q.totalAttempts} solved</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border p-4">
        <h2 className="text-lg font-bold text-gray-800 mb-3">Recent Responses</h2>
        {filteredResponses.length === 0 ? (
          <p className="text-sm text-gray-600">No responses yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Participant</th>
                  <th className="text-left py-2">Class</th>
                  <th className="text-left py-2">Roll No</th>
                  <th className="text-left py-2">Score</th>
                  <th className="text-left py-2">Percentage</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2">Time</th>
                  <th className="text-left py-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredResponses.map((r) => (
                  <tr key={r._id} className="border-b last:border-0">
                    <td className="py-2">{r.participantName}</td>
                    <td className="py-2">{r.participantClass || '-'}</td>
                    <td className="py-2">{r.participantRollNo || '-'}</td>
                    <td className="py-2">{r.score}/{r.totalPoints}</td>
                    <td className="py-2">{r.percentage}%</td>
                    <td className={`py-2 ${r.passed ? 'text-emerald-700' : 'text-red-600'}`}>{r.passed ? 'Passed' : 'Failed'}</td>
                    <td className="py-2">{r.timeTaken ? `${Math.floor(r.timeTaken / 60)}m ${r.timeTaken % 60}s` : '-'}</td>
                    <td className="py-2">{new Date(r.submittedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodingTestAnalytics;
