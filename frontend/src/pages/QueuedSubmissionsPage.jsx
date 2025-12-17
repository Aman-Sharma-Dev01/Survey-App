import React from 'react';
import QueuedSubmissions from '../components/QueuedSubmissions';

const QueuedSubmissionsPage = ({ navigate }) => {
    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Pending / Offline Submissions</h1>
            <p className="text-sm text-gray-600 mb-4">This page shows all queued submissions stored locally. You can retry or remove individual items.</p>
            <QueuedSubmissions />
        </div>
    );
};

export default QueuedSubmissionsPage;
