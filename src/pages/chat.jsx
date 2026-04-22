import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Link } from 'react-router-dom';
import { v5 as uuidv5 } from 'uuid';

const NAMESPACE_DNS = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

function getDeterministicRoomId(userId1, userId2) {
    const sorted = [userId1, userId2].sort();
    const name = sorted.join('-');
    return uuidv5(name, NAMESPACE_DNS);
}

export default function Chat() {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [chatRooms, setChatRooms] = useState([]);

    // Online & typing states
    const [isOtherUserOnline, setIsOtherUserOnline] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [lastSeen, setLastSeen] = useState(null);
    const [typingTimeout, setTypingTimeout] = useState(null);

    // Edit mode
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [editMessageContent, setEditMessageContent] = useState('');

    // Upload states
    const [uploadingImage, setUploadingImage] = useState(false);
    const [uploadingFile, setUploadingFile] = useState(false);
    const imageInputRef = useRef(null);
    const fileInputRef = useRef(null);

    const { user } = useAuth();
    const ws = useRef(null);
    const messagesEndRef = useRef(null);

    // ------------------- Helper: format file size -------------------
    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    // ------------------- Helper: get file icon based on extension -------------------
    const getFileIcon = (url) => {
        if (url.match(/\.(jpeg|jpg|gif|png|webp)$/i)) return '🖼️';
        if (url.match(/\.pdf$/i)) return '📕';
        if (url.match(/\.(doc|docx)$/i)) return '📘';
        if (url.match(/\.(ppt|pptx)$/i)) return '📙';
        if (url.match(/\.(txt)$/i)) return '📄';
        return '📎';
    };

    // ------------------- Helper: render message content (with image preview) -------------------
    const renderMessageContent = (content) => {
        const urlMatch = content.match(/(https?:\/\/[^\s]+)/);
        if (urlMatch) {
            const url = urlMatch[0];
            const isImage = url.match(/\.(jpeg|jpg|gif|png|webp)$/i);
            if (isImage) {
                return (
                    <div>
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-300 underline break-all">{url}</a>
                        <img src={url} alt="uploaded" className="max-w-full h-auto mt-1 rounded" style={{ maxHeight: '200px' }} />
                    </div>
                );
            } else {
                const icon = getFileIcon(url);
                return (
                    <div className="flex items-center gap-2">
                        <span className="text-xl">{icon}</span>
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-300 underline break-all">{content}</a>
                    </div>
                );
            }
        }
        return <p className="whitespace-pre-wrap break-words">{content}</p>;
    };

    // ------------------- 1. Search users -------------------
    useEffect(() => {
        if (searchQuery.length > 1) {
            api.get(`/auth/users/?search=${searchQuery}`)
                .then(res => setUsers(res.data.filter(u => u.id !== user?.id)))
                .catch(console.error);
        } else {
            setUsers([]);
        }
    }, [searchQuery, user?.id]);

    // ------------------- 2. Load existing chat rooms -------------------
    useEffect(() => {
        if (user) {
            api.get('/chat/rooms/')
                .then(res => setChatRooms(res.data))
                .catch(console.error);
        }
    }, [user]);

    // ------------------- 3. WebSocket for real‑time messages -------------------
    useEffect(() => {
        if (!selectedUser || !user) return;

        const roomId = getDeterministicRoomId(user.id, selectedUser.id);
        const wsUrl = `ws://127.0.0.1:8000/ws/chat/${roomId}/`;
        console.log('Connecting WebSocket:', wsUrl);

        ws.current = new WebSocket(wsUrl);

        ws.current.onopen = () => console.log('WebSocket connected');
        ws.current.onclose = () => console.log('WebSocket disconnected');
        ws.current.onerror = (err) => console.error('WebSocket error:', err);

        ws.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('Message received:', data);
            setMessages(prev => [...prev, {
                id: data.id,
                sender_id: data.sender_id,
                content: data.message,
                created_at: new Date().toISOString()
            }]);
        };

        return () => {
            if (ws.current) ws.current.close();
        };
    }, [selectedUser, user]);

    // ------------------- 4. Load previous messages & poll for new ones (fallback) -------------------
    const fetchMessages = async () => {
        if (!selectedUser) return;
        try {
            const res = await api.get(`/chat/messages/${selectedUser.id}/`);
            setMessages(res.data);
        } catch (err) {
            console.error('Fetch messages error:', err);
        }
    };

    useEffect(() => {
        if (selectedUser && user) {
            fetchMessages();
            const interval = setInterval(fetchMessages, 3000);
            return () => clearInterval(interval);
        }
    }, [selectedUser, user]);

    // ------------------- 5. Poll online status every 5 seconds -------------------
    useEffect(() => {
        if (!selectedUser) return;
        const interval = setInterval(() => {
            api.get(`/auth/status/${selectedUser.id}/`)
                .then(res => {
                    setIsOtherUserOnline(res.data.is_online);
                    setLastSeen(res.data.last_seen);
                })
                .catch(console.error);
        }, 5000);
        return () => clearInterval(interval);
    }, [selectedUser]);

    // ------------------- 6. Poll typing status every 1.5 seconds -------------------
    useEffect(() => {
        if (!selectedUser) return;
        const interval = setInterval(() => {
            api.get(`/chat/typing/${selectedUser.id}/`)
                .then(res => {
                    setIsTyping(res.data.typing_user_ids.includes(selectedUser.id));
                })
                .catch(console.error);
        }, 1500);
        return () => clearInterval(interval);
    }, [selectedUser]);

    // ------------------- 7. Update online status on mount/unmount -------------------
    useEffect(() => {
        if (!user) return;
        api.post('/auth/online/', { is_online: true }).catch(console.error);
        const handleBeforeUnload = () => {
            api.post('/auth/online/', { is_online: false }).catch(console.error);
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            api.post('/auth/online/', { is_online: false }).catch(console.error);
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [user]);

    // ------------------- 8. Send typing indicator -------------------
    const handleTyping = () => {
        if (!selectedUser) return;
        api.post('/chat/typing/', {
            recipient_id: selectedUser.id,
            is_typing: true
        }).catch(console.error);

        if (typingTimeout) clearTimeout(typingTimeout);
        const newTimeout = setTimeout(() => {
            api.post('/chat/typing/', {
                recipient_id: selectedUser.id,
                is_typing: false
            }).catch(console.error);
        }, 2000);
        setTypingTimeout(newTimeout);
    };

    // ------------------- 9. Send text message via WebSocket -------------------
    const sendMessage = () => {
        if (!newMessage.trim()) return;
        if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
            console.log('WebSocket not open. State:', ws.current?.readyState);
            return;
        }
        const payload = {
            message: newMessage,
            sender_id: user.id,
            recipient_id: selectedUser.id
        };
        console.log('Sending:', payload);
        ws.current.send(JSON.stringify(payload));
        setNewMessage('');
        setTimeout(() => fetchMessages(), 500);
    };

    // ------------------- 10. Image upload handler (🖼️) -------------------
    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }
        setUploadingImage(true);
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await api.post('/chat/upload/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const fileData = res.data;
            const sizeStr = formatFileSize(fileData.size);
            const messageContent = `🖼️ **${fileData.filename}** (${sizeStr})\n${fileData.url}`;
            if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                ws.current.send(JSON.stringify({
                    message: messageContent,
                    sender_id: user.id,
                    recipient_id: selectedUser.id
                }));
                setTimeout(() => fetchMessages(), 500);
            }
            if (imageInputRef.current) imageInputRef.current.value = '';
        } catch (err) {
            console.error('Upload error:', err);
            alert('Failed to upload image');
        } finally {
            setUploadingImage(false);
        }
    };

    // ------------------- 11. Document file upload handler (📎) -------------------
    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        setUploadingFile(true);
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await api.post('/chat/upload/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const fileData = res.data;
            const sizeStr = formatFileSize(fileData.size);
            const messageContent = `📎 **${fileData.filename}** (${sizeStr})\n${fileData.url}`;
            if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                ws.current.send(JSON.stringify({
                    message: messageContent,
                    sender_id: user.id,
                    recipient_id: selectedUser.id
                }));
                setTimeout(() => fetchMessages(), 500);
            }
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (err) {
            console.error('Upload error:', err);
            alert('Failed to upload file');
        } finally {
            setUploadingFile(false);
        }
    };

    // ------------------- 12. Edit & Delete functions -------------------
    const handleDeleteMessage = async (messageId) => {
        if (!window.confirm('Delete this message?')) return;
        try {
            await api.delete(`/chat/delete/${messageId}/`);
            setMessages(prev => prev.filter(m => m.id !== messageId));
        } catch (err) {
            console.error('Delete error:', err);
            alert('Failed to delete message');
        }
    };

    const startEditMessage = (msg) => {
        setEditingMessageId(msg.id);
        setEditMessageContent(msg.content);
    };

    const cancelEditMessage = () => {
        setEditingMessageId(null);
        setEditMessageContent('');
    };

    const saveEditMessage = async (messageId) => {
        if (!editMessageContent.trim()) return;
        try {
            const res = await api.put(`/chat/edit/${messageId}/`, { content: editMessageContent });
            setMessages(prev => prev.map(m =>
                m.id === messageId ? { ...m, content: res.data.content } : m
            ));
            setEditingMessageId(null);
            setEditMessageContent('');
        } catch (err) {
            console.error('Edit error:', err);
            alert('Failed to edit message');
        }
    };

    // ------------------- 13. Auto-scroll -------------------
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // ------------------- 14. Start chat -------------------
    const startChat = (selected) => {
        setSelectedUser(selected);
        setMessages([]);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') sendMessage();
    };

    if (!user) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    // ------------------- Render -------------------
    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* Sidebar */}
            <div className="w-80 bg-white border-r flex flex-col">
                <div className="p-4 border-b">
                    <h2 className="text-xl font-bold">Chats</h2>
                    <input
                        type="text"
                        placeholder="Search users..."
                        className="w-full p-2 border rounded-lg mt-2"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex-1 overflow-y-auto">
                    {searchQuery && users.map(u => (
                        <div
                            key={u.id}
                            onClick={() => startChat(u)}
                            className="p-3 hover:bg-gray-100 cursor-pointer border-b flex items-center gap-3"
                        >
                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white">
                                {u.username[0].toUpperCase()}
                            </div>
                            <div>
                                <div className="font-semibold">{u.username}</div>
                                <div className="text-sm text-gray-500">{u.email}</div>
                            </div>
                        </div>
                    ))}
                    {!searchQuery && chatRooms.map(room => (
                        <div
                            key={room.id}
                            onClick={() => startChat(room.other_user)}
                            className="p-3 hover:bg-gray-100 cursor-pointer border-b flex items-center gap-3"
                        >
                            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white">
                                {room.other_user?.username?.[0].toUpperCase() || 'U'}
                            </div>
                            <div>
                                <div className="font-semibold">{room.other_user?.username || 'User'}</div>
                                <div className="text-sm text-gray-500 truncate">{room.last_message}</div>
                            </div>
                        </div>
                    ))}
                    {!searchQuery && chatRooms.length === 0 && (
                        <div className="p-4 text-center text-gray-500">No chats yet. Search for users.</div>
                    )}
                </div>
                <div className="p-4 border-t">
                    <Link to="/" className="text-blue-500">← Back to Feed</Link>
                </div>
            </div>

            {/* Chat Area */}
            {selectedUser ? (
                <div className="flex-1 flex flex-col">
                    {/* Header with online status */}
                    <div className="bg-white p-4 border-b flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white">
                                {selectedUser.username[0].toUpperCase()}
                            </div>
                            <div>
                                <div className="font-semibold">{selectedUser.username}</div>
                                <div className="flex items-center gap-2 text-sm">
                                    <div className={`w-2 h-2 rounded-full ${isOtherUserOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                    <span className="text-gray-500">
                                        {isOtherUserOnline ? 'Online' : lastSeen ? `Last seen ${new Date(lastSeen).toLocaleTimeString()}` : 'Offline'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                        {messages.length === 0 && (
                            <div className="text-center text-gray-500 mt-10">No messages yet. Say hi!</div>
                        )}
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`mb-3 flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[70%] p-3 rounded-lg ${msg.sender_id === user.id ? 'bg-blue-500 text-white' : 'bg-white text-gray-800'}`}>
                                    {editingMessageId === msg.id ? (
                                        <div>
                                            <input
                                                type="text"
                                                className="w-full p-1 rounded text-black"
                                                value={editMessageContent}
                                                onChange={(e) => setEditMessageContent(e.target.value)}
                                                autoFocus
                                            />
                                            <div className="flex gap-2 mt-2">
                                                <button onClick={() => saveEditMessage(msg.id)} className="text-green-300 text-sm">Save</button>
                                                <button onClick={cancelEditMessage} className="text-gray-300 text-sm">Cancel</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {renderMessageContent(msg.content)}
                                            <div className={`text-xs mt-1 ${msg.sender_id === user.id ? 'text-blue-100' : 'text-gray-400'}`}>
                                                {new Date(msg.created_at).toLocaleTimeString()}
                                            </div>
                                            {msg.sender_id === user.id && (
                                                <div className="flex justify-end gap-2 mt-1">
                                                    <button onClick={() => startEditMessage(msg)} className="text-xs text-gray-400 hover:text-white">✏️</button>
                                                    <button onClick={() => handleDeleteMessage(msg.id)} className="text-xs text-gray-400 hover:text-red-400">🗑️</button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Typing indicator at bottom */}
                        {isTyping && (
                            <div className="text-sm text-gray-500 italic mt-2 mb-1">
                                {selectedUser?.username} is typing...
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Message Input with TWO separate buttons (image & document) */}
                    <div className="bg-white p-4 border-t flex gap-2 items-center">
                        {/* Image upload button */}
                        <input
                            type="file"
                            ref={imageInputRef}
                            onChange={handleImageUpload}
                            className="hidden"
                            id="chat-image-input"
                            accept="image/*"
                        />
                        <label
                            htmlFor="chat-image-input"
                            className={`bg-gray-200 text-gray-700 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-300 transition ${uploadingImage ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title="Send image"
                        >
                            {uploadingImage ? '📤' : '🖼️'}
                        </label>

                        {/* Document upload button */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            className="hidden"
                            id="chat-file-input"
                            accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain"
                        />
                        <label
                            htmlFor="chat-file-input"
                            className={`bg-gray-200 text-gray-700 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-300 transition ${uploadingFile ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title="Send document"
                        >
                            {uploadingFile ? '📤' : '📎'}
                        </label>

                        <input
                            type="text"
                            placeholder="Type a message..."
                            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={newMessage}
                            onChange={(e) => {
                                setNewMessage(e.target.value);
                                handleTyping();
                            }}
                            onKeyPress={handleKeyPress}
                        />
                        <button
                            onClick={sendMessage}
                            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
                        >
                            Send
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                    Select a user to start chatting
                </div>
            )}
        </div>
    );
}