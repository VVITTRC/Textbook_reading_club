import { useState, useEffect } from 'react';
import {
    createPrivateNote,
    getPrivateNotes,
    createPublicNote,
    getPublicNotes,
    createChatMessage,
    getChatMessages,
} from '../services/api';

function Sidebar({ cohortId, userId, currentPage }) {
    const [activeTab, setActiveTab] = useState('private');
    const [privateNotes, setPrivateNotes] = useState([]);
    const [publicNotes, setPublicNotes] = useState([]);
    const [chatMessages, setChatMessages] = useState([]);
    const [newNote, setNewNote] = useState('');
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const tabs = [
        { id: 'private', label: '📝 Private Notes', color: 'blue' },
        { id: 'public', label: '🌐 Public Notes', color: 'green' },
        { id: 'chat', label: '💬 Group Chat', color: 'purple' },
    ];

    useEffect(() => {
        loadData();
    }, [activeTab, cohortId, userId]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'private') {
                const response = await getPrivateNotes(userId, cohortId);
                setPrivateNotes(response.data);
            } else if (activeTab === 'public') {
                const response = await getPublicNotes(cohortId);
                setPublicNotes(response.data);
            } else if (activeTab === 'chat') {
                const response = await getChatMessages(cohortId);
                setChatMessages(response.data);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddNote = async () => {
        if (!newNote.trim()) return;

        try {
            const noteData = {
                user_id: userId,
                cohort_id: cohortId,
                document_id: `cohort_${cohortId}`,
                content: newNote,
                page_number: currentPage || 1,
                highlight_data: null,
            };

            if (activeTab === 'private') {
                const response = await createPrivateNote(noteData);
                setPrivateNotes([...privateNotes, response.data]);
            } else {
                const response = await createPublicNote(noteData);
                setPublicNotes([...publicNotes, response.data]);
            }

            setNewNote('');
        } catch (error) {
            console.error('Error creating note:', error);
            alert('Failed to save note. Please try again.');
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;

        try {
            const messageData = {
                user_id: userId,
                cohort_id: cohortId,
                document_id: `cohort_${cohortId}`,
                message: newMessage,
            };

            const response = await createChatMessage(messageData);
            setChatMessages([...chatMessages, response.data]);
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message. Please try again.');
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="flex flex-col h-full bg-white border-l border-gray-200">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 bg-gray-50">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 px-3 py-3 text-xs font-medium transition-all ${activeTab === tab.id
                                ? 'bg-white text-blue-600 border-b-2 border-blue-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-auto p-4">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="text-gray-500">Loading...</div>
                    </div>
                ) : activeTab === 'chat' ? (
                    <div className="space-y-3">
                        {chatMessages.length === 0 ? (
                            <p className="text-gray-400 text-center py-8">No messages yet. Start the conversation!</p>
                        ) : (
                            chatMessages.map((msg) => (
                                <div key={msg.id} className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-100">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-medium text-sm text-purple-900">
                                            User {msg.user_id}
                                        </span>
                                        <span className="text-xs text-purple-600">{formatDate(msg.created_at)}</span>
                                    </div>
                                    <p className="text-gray-800 text-sm">{msg.message}</p>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {(activeTab === 'private' ? privateNotes : publicNotes).length === 0 ? (
                            <p className="text-gray-400 text-center py-8">
                                No notes yet. Add your first note below!
                            </p>
                        ) : (
                            (activeTab === 'private' ? privateNotes : publicNotes).map((note) => (
                                <div
                                    key={note.id}
                                    className={`${activeTab === 'private'
                                            ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-400'
                                            : 'bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-400'
                                        } rounded p-3 shadow-sm`}
                                >
                                    <div className="text-xs text-gray-600 mb-2 flex items-center justify-between">
                                        <span>📄 Page {note.page_number}</span>
                                        <span>{formatDate(note.created_at)}</span>
                                    </div>
                                    <p className="text-gray-800 text-sm whitespace-pre-wrap">{note.content}</p>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200 p-4 bg-gray-50">
                {activeTab === 'chat' ? (
                    <div className="flex space-x-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Type a message..."
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <button
                            onClick={handleSendMessage}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                        >
                            Send
                        </button>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <textarea
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            placeholder={`Write a ${activeTab} note...`}
                            rows="3"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                        <button
                            onClick={handleAddNote}
                            className={`w-full px-4 py-2 text-white rounded-lg transition-colors font-medium ${activeTab === 'private'
                                    ? 'bg-yellow-500 hover:bg-yellow-600'
                                    : 'bg-green-600 hover:bg-green-700'
                                }`}
                        >
                            Add {activeTab === 'private' ? 'Private' : 'Public'} Note
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Sidebar;