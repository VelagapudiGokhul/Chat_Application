import React, { useEffect, useRef, useState } from 'react';
import { useRef as useRefAlias } from 'react';
import GroupData from '../Hooks/GroupData';
import AuthData from '../Hooks/AuthData';
import ChatData from '../Hooks/ChatData';
import { X, Image } from 'lucide-react';
import toast from 'react-hot-toast';

const GroupChatContainer = () => {
    const {
        selectedGroup, setSelectedGroup,
        groupMessages, getGroupMessages, isGroupMessagesLoading,
        sendGroupMessage,
        subscribeToGroupMessages, unsubscribeFromGroupMessages,
        addMember, removeMember, groups
    } = GroupData();
    const { authUser } = AuthData();

    const [text, setText] = useState('');
    const [imagePreview, setImagePreview] = useState(null);
    const [showInfo, setShowInfo] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const [audioDuration, setAudioDuration] = useState(0);
    const fileInputRef = useRef(null);
    const bottomRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerRef = useRef(null);

    useEffect(() => {
        if (!selectedGroup) return;
        getGroupMessages(selectedGroup._id);
        subscribeToGroupMessages();
        return () => unsubscribeFromGroupMessages();
    }, [selectedGroup?._id]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [groupMessages]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file?.type.startsWith('image/')) { toast.error('Please select an image'); return; }
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result);
        reader.readAsDataURL(file);
    };

    // --- Voice Recording ---
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];
            setAudioDuration(0);

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                stream.getTracks().forEach(track => track.stop());
                clearInterval(timerRef.current);
            };

            mediaRecorder.start();
            setIsRecording(true);
            const startTime = Date.now();
            timerRef.current = setInterval(() => {
                setAudioDuration(Math.floor((Date.now() - startTime) / 1000));
            }, 1000);
        } catch (err) {
            console.error('Microphone access denied:', err);
            toast.error('Microphone access denied.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const cancelRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
        setAudioBlob(null);
        setAudioDuration(0);
        clearInterval(timerRef.current);
    };

    const removeAudio = () => { setAudioBlob(null); setAudioDuration(0); };

    const formatDuration = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const blobToBase64 = (blob) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });

    const handleSend = async (e) => {
        e.preventDefault();
        if (!text.trim() && !imagePreview && !audioBlob) return;
        const payload = { message: text.trim(), image: imagePreview };
        if (audioBlob) payload.audio = await blobToBase64(audioBlob);
        await sendGroupMessage(payload);
        setText('');
        setImagePreview(null);
        setAudioBlob(null);
        setAudioDuration(0);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const isAdmin = selectedGroup?.admin?._id === authUser?._id || selectedGroup?.admin === authUser?._id;

    return (
        <section className="flex-1 flex flex-col bg-surface-container-lowest rounded-2xl shadow-[0_4px_20px_rgba(25,28,30,0.04)] overflow-hidden min-w-0">
            {/* Header */}
            <header className="h-20 px-8 flex flex-shrink-0 items-center justify-between border-b border-outline-variant/15">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-primary">group</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-primary tracking-tight">{selectedGroup?.name}</h3>
                        <p className="text-xs text-outline font-medium">{selectedGroup?.members?.length} member{selectedGroup?.members?.length !== 1 ? 's' : ''}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button className="p-2.5 rounded-full hover:bg-surface-container-low text-outline transition-colors border-none bg-transparent cursor-pointer flex items-center justify-center">
                        <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>call</span>
                    </button>
                    <button className="p-2.5 rounded-full hover:bg-surface-container-low text-outline transition-colors border-none bg-transparent cursor-pointer flex items-center justify-center">
                        <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>videocam</span>
                    </button>
                    <button onClick={() => setShowInfo(!showInfo)} className="p-2.5 rounded-full hover:bg-surface-container-low text-outline transition-colors border-none bg-transparent cursor-pointer flex items-center justify-center">
                        <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>info</span>
                    </button>
                    <button onClick={() => setSelectedGroup(null)} className="p-2.5 rounded-full hover:bg-surface-container-low text-outline transition-colors border-none bg-transparent cursor-pointer flex items-center justify-center">
                        <span className="material-symbols-outlined text-error" style={{ fontSize: '24px' }}>close</span>
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6 scrollbar-hide">
                    <div className="flex justify-center flex-shrink-0">
                        <span className="px-3 py-1 bg-surface-container-low rounded-full text-[10px] font-bold uppercase tracking-wider text-outline">Group Chat</span>
                    </div>
                    {isGroupMessagesLoading ? (
                        <div className="text-center text-outline text-sm py-10">Loading messages...</div>
                    ) : groupMessages.length === 0 ? (
                        <div className="text-center text-outline text-sm py-10">No messages yet. Say hi to the group!</div>
                    ) : (
                        groupMessages.map((msg) => {
                            if (!msg || !msg._id) return null;
                            const isMine = (msg.senderID?._id || msg.senderID) === authUser._id;
                            return isMine ? (
                                <div key={msg._id} className="flex flex-col items-end gap-1.5 ml-auto max-w-[70%] flex-shrink-0">
                                    <div className="bg-primary text-on-primary p-4 rounded-2xl rounded-br-none shadow-sm text-left">
                                        {msg.content && <p className="text-sm leading-relaxed">{msg.content}</p>}
                                        {msg.imageUrl && <img src={msg.imageUrl} alt="Attachment" className="img-fluid rounded mt-2 max-w-xs" />}
                                        {msg.audioUrl && (
                                            <div className={`mt-2 flex items-center gap-2 ${msg.content ? 'pt-1' : ''}`}>
                                                <span className="material-symbols-outlined text-on-primary/70" style={{ fontVariationSettings: "'FILL' 1", fontSize: '20px' }}>graphic_eq</span>
                                                <audio controls src={msg.audioUrl} className="h-8 flex-1" style={{ maxWidth: '250px', filter: 'invert(1) brightness(2)' }} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="text-[10px] text-outline">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        <span className="material-symbols-outlined text-[12px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>done_all</span>
                                    </div>
                                </div>
                            ) : (
                                <div key={msg._id} className="flex items-end gap-3 max-w-[70%] flex-shrink-0">
                                    <img alt="Avatar" className="w-8 h-8 rounded-full object-cover flex-shrink-0" src={msg.senderID?.profilepic || '/avatar.png'} />
                                    <div>
                                        <p className="text-[10px] text-outline font-medium mb-1 pl-1">{msg.senderID?.username}</p>
                                        <div className="bg-surface-container-low p-4 rounded-2xl rounded-bl-none text-left">
                                            {msg.content && <p className="text-sm leading-relaxed text-on-surface">{msg.content}</p>}
                                            {msg.imageUrl && <img src={msg.imageUrl} alt="Attachment" className="img-fluid rounded mt-2 max-w-xs" />}
                                            {msg.audioUrl && (
                                                <div className={`mt-2 flex items-center gap-2 ${msg.content ? 'pt-1' : ''}`}>
                                                    <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1", fontSize: '20px' }}>graphic_eq</span>
                                                    <audio controls src={msg.audioUrl} className="h-8 flex-1" style={{ maxWidth: '250px' }} />
                                                </div>
                                            )}
                                            <span className="block mt-1 text-[10px] text-outline text-right">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={bottomRef} />
                </div>

                {/* Group Info Panel */}
                {showInfo && (
                    <GroupInfoPanel
                        group={selectedGroup}
                        authUser={authUser}
                        isAdmin={isAdmin}
                        onClose={() => setShowInfo(false)}
                        onAddMember={addMember}
                        onRemoveMember={removeMember}
                    />
                )}
            </div>

            {/* Message Input */}
            <footer className="p-6 bg-surface-container-lowest flex-shrink-0 border-t border-outline-variant/15">
                {imagePreview && (
                    <div className="mb-3 flex items-center gap-2">
                        <div className="relative inline-block">
                            <img src={imagePreview} alt="Preview" className="w-24 h-24 object-cover rounded-xl border border-outline-variant/20" />
                            <button onClick={() => { setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="absolute -top-2 -right-2 bg-error text-on-error rounded-full p-1 shadow-md border-none" type="button">
                                <X size={14} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Audio Preview */}
                {audioBlob && !isRecording && (
                    <div className="mb-3">
                        <div className="flex items-center gap-3 bg-surface-container-low rounded-2xl p-3 max-w-sm border border-primary/20">
                            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>graphic_eq</span>
                            <audio controls src={URL.createObjectURL(audioBlob)} className="h-8 flex-1" style={{ maxWidth: '240px' }} />
                            <button onClick={removeAudio} className="w-6 h-6 bg-error flex items-center justify-center text-on-error rounded-full shadow-md hover:scale-110 active:scale-95 transition-transform border-none outline-none" type="button" title="Remove audio">
                                <X size={14} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Recording Indicator */}
                {isRecording && (
                    <div className="mb-3">
                        <div className="flex items-center gap-3 bg-error/5 border border-error/20 rounded-2xl p-3 max-w-sm animate-pulse">
                            <span className="w-3 h-3 bg-error rounded-full animate-ping" />
                            <span className="text-sm font-medium text-error">Recording... {formatDuration(audioDuration)}</span>
                            <div className="flex items-center gap-2 ml-auto">
                                <button onClick={cancelRecording} className="p-1.5 rounded-full hover:bg-error/10 text-error transition-colors border-none bg-transparent cursor-pointer flex items-center justify-center" type="button" title="Cancel">
                                    <X size={18} />
                                </button>
                                <button onClick={stopRecording} className="p-1.5 px-3 rounded-full bg-error text-on-error text-xs font-bold border-none cursor-pointer hover:bg-error/90 transition-colors flex items-center gap-1" type="button" title="Stop">
                                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>stop</span> Stop
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSend} className="flex items-center gap-4 bg-surface-container-low p-2 rounded-2xl w-full">
                    <div className="flex items-center px-1">
                        <button type="button" className="p-2 hover:bg-surface-container-high rounded-full text-outline transition-colors border-none bg-transparent cursor-pointer flex items-center justify-center" title="More options">
                            <span className="material-symbols-outlined">add_circle</span>
                        </button>
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-surface-container-high rounded-full text-outline transition-colors border-none bg-transparent outline-none cursor-pointer flex items-center justify-center" title="Attach image">
                            <span className={`material-symbols-outlined ${imagePreview ? 'text-primary' : ''}`}>image</span>
                        </button>
                        <input type="file" accept="image/*" className="hidden" style={{ display: 'none' }} ref={fileInputRef} onChange={handleImageChange} />
                    </div>
                    <input
                        type="text"
                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm placeholder:text-outline/60 text-on-surface outline-none shadow-none"
                        placeholder={`Message ${selectedGroup?.name}...`}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                    />
                    <div className="flex items-center gap-2">
                        <button 
                            type="button" 
                            onClick={isRecording ? stopRecording : startRecording}
                            className={`p-2 rounded-full transition-colors border-none bg-transparent cursor-pointer flex items-center justify-center ${
                                isRecording 
                                    ? 'text-error bg-error/10 animate-pulse' 
                                    : audioBlob 
                                        ? 'text-primary bg-primary/10'
                                        : 'text-outline hover:bg-surface-container-high'
                            }`} 
                            title={isRecording ? 'Stop recording' : 'Voice message'}
                        >
                            <span className="material-symbols-outlined">{isRecording ? 'stop_circle' : 'mic'}</span>
                        </button>
                        <button type="submit" disabled={!text.trim() && !imagePreview && !audioBlob} className="bg-primary hover:bg-primary-container text-on-primary p-2.5 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 border-none outline-none flex items-center justify-center">
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                        </button>
                    </div>
                </form>
            </footer>
        </section>
    );
};

// ------------------------------------------------------------------
// Group Info Panel (members list + add member)
// ------------------------------------------------------------------

const GroupInfoPanel = ({ group, authUser, isAdmin, onClose, onAddMember, onRemoveMember }) => {
    const { users, getUsers } = ChatData();
    const [search, setSearch] = useState('');
    const [adding, setAdding] = useState(false);

    useEffect(() => { if (isAdmin) getUsers(); }, [isAdmin]);

    const memberIds = group.members.map(m => m._id || m);
    const nonMembers = users.filter(u => !memberIds.includes(u._id));
    const filtered = nonMembers.filter(u => u.username.toLowerCase().includes(search.toLowerCase()));

    return (
        <aside className="w-72 flex-shrink-0 border-l border-outline-variant/15 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/15">
                <span className="font-bold text-on-surface text-sm">Group Info</span>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-surface-container-low text-outline border-none bg-transparent">
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
                </button>
            </div>

            {/* Description */}
            {group.description && (
                <div className="px-5 py-3 text-xs text-on-surface-variant border-b border-outline-variant/10">
                    {group.description}
                </div>
            )}

            {/* Members */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
                <p className="px-5 pt-4 pb-2 text-[10px] font-bold uppercase tracking-wider text-outline">
                    Members ({group.members.length}/32)
                </p>
                {group.members.map(member => {
                    const isCurrentUser = (member._id || member) === authUser._id;
                    const memberId = member._id || member;
                    return (
                        <div key={memberId} className="flex items-center gap-3 px-5 py-2.5 hover:bg-surface-container-low transition-colors">
                            <img src={member.profilepic || '/avatar.png'} alt={member.username} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-on-surface truncate">
                                    {member.username || 'Unknown'} {isCurrentUser && <span className="text-outline text-xs">(you)</span>}
                                </p>
                                {(group.admin?._id || group.admin) === memberId && (
                                    <span className="text-[10px] text-primary font-bold">Admin</span>
                                )}
                            </div>
                            {isAdmin && !isCurrentUser && (
                                <button
                                    onClick={() => onRemoveMember(group._id, memberId)}
                                    className="p-1 rounded-full hover:bg-error/10 text-error border-none bg-transparent transition-colors"
                                    title="Remove member"
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>person_remove</span>
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Add member section (admin only) */}
            {isAdmin && group.members.length < 32 && (
                <div className="border-t border-outline-variant/15 p-4 space-y-2">
                    <button
                        onClick={() => setAdding(!adding)}
                        className="w-full flex items-center gap-2 justify-center px-4 py-2 bg-primary/10 text-primary rounded-xl text-sm font-bold hover:bg-primary/20 transition-colors border-none"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>person_add</span>
                        Add Member
                    </button>
                    {adding && (
                        <div className="space-y-2">
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline" style={{ fontSize: 15 }}>search</span>
                                <input
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Search users..."
                                    className="w-full pl-8 pr-3 py-2 bg-surface-container-low border-none rounded-lg text-xs focus:ring-2 focus:ring-primary/20 placeholder:text-outline/50"
                                />
                            </div>
                            <div className="max-h-36 overflow-y-auto space-y-1 scrollbar-hide">
                                {filtered.map(user => (
                                    <button
                                        key={user._id}
                                        type="button"
                                        onClick={() => { onAddMember(group._id, user._id); setAdding(false); setSearch(''); }}
                                        className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-surface-container-low text-left border-none bg-transparent transition-colors"
                                    >
                                        <img src={user.profilepic || '/avatar.png'} alt={user.username} className="w-7 h-7 rounded-full object-cover" />
                                        <span className="text-xs font-medium text-on-surface truncate">{user.username}</span>
                                    </button>
                                ))}
                                {filtered.length === 0 && <p className="text-xs text-outline text-center py-2">No users found</p>}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </aside>
    );
};

export default GroupChatContainer;
