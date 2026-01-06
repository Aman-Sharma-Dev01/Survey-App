import React, { useEffect, useState, useCallback } from 'react';
import { PlusCircle, Loader, Trash2, BarChart3, Link, Eye, EyeOff, QrCode } from 'lucide-react';
import {
  getCreatorCodingTests,
  deleteCodingTest,
  updateCodingTestPublishStatus,
  getCodingTestShareUrl,
  getCodingTestQRCodeUrl,
} from '../services/codingTestService';

const CodingCard = ({ test, onPublish, onDelete, onAnalytics, onCopyLink, onShowQR }) => {
  const [copying, setCopying] = useState(false);

  const handleCopy = async () => {
    setCopying(true);
    try {
      await navigator.clipboard.writeText(getCodingTestShareUrl(test._id));
    } catch (_) {
      // ignore
    }
    setTimeout(() => setCopying(false), 1200);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-emerald-100 p-5">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-bold text-gray-800">{test.title}</h3>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{test.description || 'No description'}</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${test.isPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
          {test.isPublished ? 'Published' : 'Draft'}
        </span>
      </div>
      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
        <span>{test.questions?.length || 0} coding questions</span>
        <span>•</span>
        <span>{test.attemptCount || 0} attempts</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onPublish(test, !test.isPublished)}
          className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition ${test.isPublished ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}
        >
          {test.isPublished ? <EyeOff size={16} className="mr-1" /> : <Eye size={16} className="mr-1" />}
          {test.isPublished ? 'Unpublish' : 'Publish'}
        </button>

        {test.isPublished && (
          <>
            <button onClick={handleCopy} className="flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition">
              <Link size={16} className="mr-1" />
              {copying ? 'Copied' : 'Copy Link'}
            </button>
            <button onClick={() => onShowQR(test)} className="flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition">
              <QrCode size={16} className="mr-1" /> QR
            </button>
          </>
        )}

        <button onClick={() => onAnalytics(test._id)} className="flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 transition">
          <BarChart3 size={16} className="mr-1" /> Analytics
        </button>

        <button onClick={() => onDelete(test._id)} className="flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 transition">
          <Trash2 size={16} className="mr-1" /> Delete
        </button>
      </div>
    </div>
  );
};

const CodingTestDashboard = ({ navigate }) => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showQRModal, setShowQRModal] = useState(false);
  const [selected, setSelected] = useState(null);

  const fetchTests = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getCreatorCodingTests();
      setTests(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (err) {
      setError('Failed to load coding tests');
      setTests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  const handlePublish = async (test, isPublished) => {
    try {
      await updateCodingTestPublishStatus(test._id, isPublished);
      fetchTests();
    } catch (err) {
      setError('Failed to update publish state');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this coding test and all responses?')) return;
    try {
      await deleteCodingTest(id);
      fetchTests();
    } catch (err) {
      setError('Failed to delete coding test');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader className="animate-spin text-emerald-600" size={48} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-emerald-800">Coding Tests</h1>
          <p className="text-gray-600 mt-1">Create and manage coding exams</p>
        </div>
        <button onClick={() => navigate('coding-create')} className="flex items-center justify-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium shadow-lg">
          <PlusCircle size={20} className="mr-2" /> New Coding Test
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>}

      {tests.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No coding tests yet</h2>
          <p className="text-gray-500 mb-4">Create your first coding test to get started</p>
          <button onClick={() => navigate('coding-create')} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition">
            Create Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tests.map((t) => (
            <CodingCard
              key={t._id}
              test={t}
              onPublish={handlePublish}
              onDelete={handleDelete}
              onAnalytics={(id) => navigate(`coding-analytics/${id}`)}
              onCopyLink={() => {}}
              onShowQR={(test) => {
                setSelected(test);
                setShowQRModal(true);
              }}
            />
          ))}
        </div>
      )}

      {showQRModal && selected && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Coding Test QR Code</h2>
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <p className="text-sm text-gray-600 mb-2">{selected.title}</p>
                <p className="font-mono text-sm bg-white px-3 py-1 rounded inline-block">{selected._id}</p>
              </div>
              <img src={getCodingTestQRCodeUrl(selected._id)} alt="QR" className="mx-auto w-48 h-48 rounded-lg shadow-lg mb-4" />
              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-500">Share URL:</p>
                <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
                  <input type="text" value={getCodingTestShareUrl(selected._id)} readOnly className="flex-1 text-xs bg-transparent outline-none" />
                  <button onClick={() => navigator.clipboard.writeText(getCodingTestShareUrl(selected._id))} className="px-2 py-1 text-xs bg-emerald-600 text-white rounded">Copy</button>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowQRModal(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Close</button>
                <a href={getCodingTestQRCodeUrl(selected._id)} download={`coding-test-${selected._id}-qr.png`} className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-center">Download QR</a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodingTestDashboard;
