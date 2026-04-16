import React, { useEffect, useRef } from 'react';
import Header from './Header';
import MessageInput from './MessageInput';
import MessageSkeleton from './MessageSkeleton';
import ChatData from '../Hooks/ChatData';
import AuthData from '../Hooks/AuthData';

const ChatContainer = () => {
    const {
        messages,
        getMessages,
        isMessagesLoading,
        selectedUser,
        subscribeToMessages,
        unsubscribeFromMessages,
    } = ChatData();

    const { authUser } = AuthData();
    const bottomRef = useRef(null);

    useEffect(() => {
        getMessages(selectedUser._id);
        subscribeToMessages();
        return () => unsubscribeFromMessages();
    }, [selectedUser._id, getMessages, subscribeToMessages, unsubscribeFromMessages]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <section className="flex-1 flex flex-col bg-surface-container-lowest rounded-2xl shadow-[0_4px_20px_rgba(25,28,30,0.04)] overflow-hidden min-w-0">
            <Header />

            <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6 scrollbar-hide">
                <div className="flex justify-center flex-shrink-0">
                    <span className="px-3 py-1 bg-surface-container-low rounded-full text-[10px] font-bold uppercase tracking-wider text-outline">
                        Encrypted Connection
                    </span>
                </div>

                {isMessagesLoading ? (
                    <MessageSkeleton />
                ) : (
                    messages.map((message) => {
                        if (!message || !message._id) return null;

                        const isSender = message.senderID === authUser._id;
                        return (
                            <div
                                key={message._id}
                                className={`flex ${isSender ? "flex-col items-end gap-1.5 ml-auto text-right" : "items-end gap-3"} max-w-[70%] flex-shrink-0`}
                            >
                                {!isSender && (
                                    <img
                                        src={selectedUser.profilepic || "/avatar.png"}
                                        alt={selectedUser.username}
                                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                    />
                                )}
                                
                                <div className={isSender ? "w-full flex-col px-3" : ""}>
                                    {!isSender && (
                                        <p className="text-[10px] text-outline font-medium mb-1 pl-1">{selectedUser.username}</p>
                                    )}
                                    <div className={`p-4 rounded-2xl ${isSender ? "bg-primary text-on-primary rounded-br-none shadow-sm" : "bg-surface-container-low text-on-surface rounded-bl-none"} text-left w-full`}>
                                        {message.content && <p className="text-sm leading-relaxed">{message.content}</p>}
                                        {message.imageUrl && (
                                            <div className="mt-2 text-center flex items-center justify-center">
                                                <img src={message.imageUrl} alt="Attachment" className="max-w-xs w-full max-h-[300px] object-cover rounded-lg border border-white/20 shadow-sm" />
                                            </div>
                                        )}
                                        {message.audioUrl && (
                                            <div className={`mt-2 flex items-center gap-2 ${message.content ? 'pt-1' : ''}`}>
                                                <span className={`material-symbols-outlined ${isSender ? 'text-on-primary/70' : 'text-primary'}`} style={{ fontVariationSettings: "'FILL' 1", fontSize: '20px' }}>graphic_eq</span>
                                                <audio controls src={message.audioUrl} className="h-8 flex-1" style={{ maxWidth: '250px', filter: isSender ? 'invert(1) brightness(2)' : 'none' }} />
                                            </div>
                                        )}
                                    </div>
                                    <div className={`flex items-center gap-1 ${isSender ? "justify-end mt-1" : "mt-1 pl-1"}`}>
                                        <span className="text-[10px] text-outline">
                                            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {isSender && (
                                            <span className="material-symbols-outlined text-[12px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                                                done_all
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                {/* Ref for auto-scrolling to bottom */}
                <div ref={bottomRef} />
            </div>

            <MessageInput />
        </section>
    );
};

export default ChatContainer;
