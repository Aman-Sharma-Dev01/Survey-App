import React, { useState, useEffect } from 'react';
import { 
    Mail, 
    MessageSquare, 
    Clock, 
    CheckCircle, 
    Archive, 
    Trash2, 
    RefreshCw,
    ChevronDown,
    ExternalLink,
    User,
    Calendar,
    Filter,
    Inbox
} from 'lucide-react';
import { fetchApi } from '../services/api';

const statusColors = {
    new: 'bg-blue-100 text-blue-700',
    read: 'bg-gray-100 text-gray-700',
    replied: 'bg-green-100 text-green-700',
    archived: 'bg-slate-100 text-slate-500'
};

const statusIcons = {
    new: <Inbox size={14} />,
    read: <Mail size={14} />,
    replied: <CheckCircle size={14} />,
    archived: <Archive size={14} />
};

export default function ContactAdmin() {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedContact, setSelectedContact] = useState(null);
    const [filter, setFilter] = useState('all');
    const [newCount, setNewCount] = useState(0);
    const [updating, setUpdating] = useState(false);

    const fetchContacts = async () => {
        try {
            setLoading(true);
            const data = await fetchApi(`/contact/admin?status=${filter}`, 'GET', null, true);
            setContacts(data.contacts);
            setNewCount(data.newCount);
        } catch (error) {
            console.error('Error fetching contacts:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContacts();
    }, [filter]);

    const updateStatus = async (id, status) => {
        try {
            setUpdating(true);
            await fetchApi(`/contact/admin/${id}`, 'PATCH', { status }, true);
            
            // Update local state
            setContacts(prev => prev.map(c => 
                c._id === id ? { ...c, status } : c
            ));
            
            if (selectedContact?._id === id) {
                setSelectedContact(prev => ({ ...prev, status }));
            }
            
            // Update new count
            if (status !== 'new') {
                setNewCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Error updating status:', error);
        } finally {
            setUpdating(false);
        }
    };

    const deleteContact = async (id) => {
        if (!window.confirm('Are you sure you want to delete this message?')) return;
        
        try {
            await fetchApi(`/contact/admin/${id}`, 'DELETE', null, true);
            setContacts(prev => prev.filter(c => c._id !== id));
            if (selectedContact?._id === id) {
                setSelectedContact(null);
            }
        } catch (error) {
            console.error('Error deleting contact:', error);
        }
    };

    const handleSelectContact = (contact) => {
        setSelectedContact(contact);
        // Mark as read if new
        if (contact.status === 'new') {
            updateStatus(contact._id, 'read');
        }
    };

    const formatDate = (date) => {
        const d = new Date(date);
        const now = new Date();
        const diffMs = now - d;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return d.toLocaleDateString();
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Contact Messages</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            {newCount > 0 ? (
                                <span className="text-blue-600 font-medium">{newCount} new message{newCount > 1 ? 's' : ''}</span>
                            ) : (
                                'All caught up!'
                            )}
                        </p>
                    </div>
                    <button
                        onClick={fetchContacts}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>
            </div>

            <div className="flex h-[calc(100vh-80px)]">
                {/* Sidebar - Message List */}
                <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
                    {/* Filter */}
                    <div className="p-4 border-b border-gray-200">
                        <div className="flex items-center gap-2">
                            <Filter size={16} className="text-gray-500" />
                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="all">All Messages</option>
                                <option value="new">New</option>
                                <option value="read">Read</option>
                                <option value="replied">Replied</option>
                                <option value="archived">Archived</option>
                            </select>
                        </div>
                    </div>

                    {/* Message List */}
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="p-8 text-center text-gray-500">
                                <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
                                Loading messages...
                            </div>
                        ) : contacts.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <Inbox size={48} className="mx-auto mb-3 text-gray-300" />
                                <p>No messages found</p>
                            </div>
                        ) : (
                            contacts.map((contact) => (
                                <div
                                    key={contact._id}
                                    onClick={() => handleSelectContact(contact)}
                                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition ${
                                        selectedContact?._id === contact._id ? 'bg-indigo-50 border-l-4 border-l-indigo-500' : ''
                                    } ${contact.status === 'new' ? 'bg-blue-50/50' : ''}`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className={`font-medium truncate ${contact.status === 'new' ? 'text-gray-900' : 'text-gray-700'}`}>
                                                    {contact.name}
                                                </span>
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${statusColors[contact.status]}`}>
                                                    {statusIcons[contact.status]}
                                                    {contact.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 truncate mt-0.5">{contact.email}</p>
                                            <p className="text-sm font-medium text-gray-600 truncate mt-1">{contact.subject}</p>
                                            <p className="text-sm text-gray-400 truncate mt-0.5">{contact.message.substring(0, 80)}...</p>
                                        </div>
                                        <span className="text-xs text-gray-400 whitespace-nowrap">
                                            {formatDate(contact.createdAt)}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Main Content - Message Detail */}
                <div className="flex-1 flex flex-col">
                    {selectedContact ? (
                        <>
                            {/* Message Header */}
                            <div className="bg-white border-b border-gray-200 p-6">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h2 className="text-xl font-semibold text-gray-900">{selectedContact.subject}</h2>
                                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <User size={14} />
                                                {selectedContact.name}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Mail size={14} />
                                                <a href={`mailto:${selectedContact.email}`} className="text-indigo-600 hover:underline">
                                                    {selectedContact.email}
                                                </a>
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar size={14} />
                                                {new Date(selectedContact.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${statusColors[selectedContact.status]}`}>
                                            {statusIcons[selectedContact.status]}
                                            {selectedContact.status}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Message Body */}
                            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                                        {selectedContact.message}
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="bg-white border-t border-gray-200 p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <a
                                            href={`mailto:${selectedContact.email}?subject=Re: ${selectedContact.subject}`}
                                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                                            onClick={() => updateStatus(selectedContact._id, 'replied')}
                                        >
                                            <ExternalLink size={16} />
                                            Reply via Email
                                        </a>
                                        
                                        {selectedContact.status !== 'replied' && (
                                            <button
                                                onClick={() => updateStatus(selectedContact._id, 'replied')}
                                                disabled={updating}
                                                className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
                                            >
                                                <CheckCircle size={16} />
                                                Mark as Replied
                                            </button>
                                        )}
                                        
                                        {selectedContact.status !== 'archived' && (
                                            <button
                                                onClick={() => updateStatus(selectedContact._id, 'archived')}
                                                disabled={updating}
                                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                                            >
                                                <Archive size={16} />
                                                Archive
                                            </button>
                                        )}
                                    </div>
                                    
                                    <button
                                        onClick={() => deleteContact(selectedContact._id)}
                                        className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                    >
                                        <Trash2 size={16} />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center bg-gray-50">
                            <div className="text-center text-gray-500">
                                <MessageSquare size={64} className="mx-auto mb-4 text-gray-300" />
                                <p className="text-lg font-medium">Select a message to view</p>
                                <p className="text-sm mt-1">Choose a message from the list to see its details</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
