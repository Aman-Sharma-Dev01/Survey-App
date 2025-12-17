import React, { useEffect, useState } from 'react';
import { RefreshCw, Trash2 } from 'lucide-react';
import { getAllRequests, deleteRequest, flushQueue } from '../services/offlineQueue';

const QueuedSubmissions = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const all = await getAllRequests();
            setItems(all.sort((a,b)=> (b.createdAt||0)-(a.createdAt||0)));
        } catch (e) {
            console.error('Failed to load queued submissions', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        const onOnline = () => load();
        window.addEventListener('online', onOnline);
        return () => window.removeEventListener('online', onOnline);
    }, []);

    const handleRetryAll = async () => {
        setBusy(true);
        try {
            await flushQueue();
            await load();
        } catch (e) {
            console.error('Retry all failed', e);
        } finally {
            setBusy(false);
        }
    };

    const handleRemove = async (id) => {
        setBusy(true);
        try {
            await deleteRequest(id);
            await load();
        } catch (e) {
            console.error('Remove queued item failed', e);
        } finally {
            setBusy(false);
        }
    };

    if (loading) return null;

    if (!items || items.length === 0) return null;

    return (
        <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-yellow-800">Pending Submissions: {items.length}</div>
                <div className="flex items-center gap-2">
                    <button onClick={handleRetryAll} disabled={busy} className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700">
                        <RefreshCw size={14} className="inline-block mr-2" /> Retry All
                    </button>
                </div>
            </div>
            <div className="space-y-2 max-h-40 overflow-auto">
                {items.map(it => (
                    <div key={it.id} className="flex items-center justify-between bg-yellow-25 p-2 rounded border border-yellow-100">
                        <div className="text-xs text-yellow-900 font-mono truncate mr-3">{it.method} {it.url} • {new Date(it.createdAt).toLocaleString()}</div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => handleRemove(it.id)} disabled={busy} title="Remove" className="p-1 rounded bg-transparent hover:bg-yellow-100">
                                <Trash2 size={14} className="text-yellow-800" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default QueuedSubmissions;
