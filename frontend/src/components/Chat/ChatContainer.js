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
        swiggyConnected,
        swiggyAuthLoading,
        connectSwiggy,
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
                        {selectedUser.isBot ? '🤖 AI-Powered Conversation' : 'Encrypted Connection'}
                    </span>
                </div>

                {/* Swiggy Bot Welcome Banner */}
                {selectedUser.isBot && messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 gap-4 flex-shrink-0">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-4xl shadow-lg">
                            🍕
                        </div>
                        <h3 className="text-on-surface font-bold text-xl m-0">Swiggy Assistant</h3>
                        <p className="text-outline text-sm text-center max-w-md m-0 leading-relaxed">
                            Hi! Just type one of these commands:
                        </p>
                        <div className="flex flex-col gap-2 max-w-sm w-full">
                            {[
                                { cmd: 'see biryani', desc: 'Search restaurants & items', icon: '🔍' },
                                { cmd: 'cart biryani', desc: 'Add an item to your cart', icon: '🛒' },
                                { cmd: 'book', desc: 'Place your order (COD)', icon: '📦' },
                            ].map(({ cmd, desc, icon }) => (
                                <div key={cmd} className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl">
                                    <span className="text-xl">{icon}</span>
                                    <div className="flex-1">
                                        <code className="text-orange-600 font-bold text-sm">{cmd}</code>
                                        <p className="text-outline text-xs m-0">{desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Connection Status Card */}
                        {!swiggyConnected ? (
                            <div className="mt-4 p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/10 rounded-2xl border border-orange-200/40 max-w-sm w-full text-center">
                                <p className="text-orange-700 text-sm font-medium m-0 mb-3">
                                    🔐 Connect your Swiggy account to get started
                                </p>
                                <button
                                    className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center gap-2 mx-auto bg-gradient-to-r from-orange-500 to-orange-600 text-white border-none hover:shadow-lg hover:shadow-orange-500/30 hover:scale-[1.03] active:scale-[0.97] disabled:opacity-50"
                                    onClick={connectSwiggy}
                                    disabled={swiggyAuthLoading}
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>link</span>
                                    {swiggyAuthLoading ? 'Opening Swiggy Login...' : 'Connect Swiggy Account'}
                                </button>
                                <p className="text-orange-500/50 text-[10px] m-0 mt-2">
                                    Opens Swiggy login in a popup window
                                </p>
                            </div>
                        ) : (
                            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/10 rounded-2xl border border-green-200/40 max-w-sm w-full text-center">
                                <p className="text-green-600 text-sm font-medium m-0 flex items-center justify-center gap-1.5">
                                    <span className="material-symbols-outlined" style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                    Swiggy account connected — start chatting!
                                </p>
                            </div>
                        )}

                        <p className="text-outline/60 text-xs text-center max-w-sm m-0">
                            Powered by Groq AI + Swiggy MCP
                        </p>
                    </div>
                )}

                {isMessagesLoading ? (
                    <MessageSkeleton />
                ) : (
                    messages.map((message) => {
                        if (!message || !message._id) return null;

                        const isSender = message.senderID === authUser._id;
                        const isBotMessage = selectedUser.isBot && !isSender;

                        return (
                            <div
                                key={message._id}
                                className={`flex ${isSender ? "flex-col items-end gap-1.5 ml-auto text-right" : "items-end gap-3"} max-w-[70%] flex-shrink-0`}
                            >
                                {!isSender && (
                                    isBotMessage ? (
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-sm shadow-sm flex-shrink-0">
                                            🍕
                                        </div>
                                    ) : (
                                        <img
                                            src={selectedUser.profilepic || "/avatar.png"}
                                            alt={selectedUser.username}
                                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                        />
                                    )
                                )}
                                
                                <div className={isSender ? "w-full flex-col px-3" : ""}>
                                    {!isSender && (
                                        <p className="text-[10px] text-outline font-medium mb-1 pl-1 flex items-center gap-1.5">
                                            {selectedUser.username}
                                            {isBotMessage && (
                                                <span className="text-[8px] bg-orange-500/15 text-orange-500 px-1 py-0.5 rounded-full font-bold">AI</span>
                                            )}
                                        </p>
                                    )}
                                    <div className={`p-4 rounded-2xl ${
                                        isSender 
                                            ? "bg-primary text-on-primary rounded-br-none shadow-sm" 
                                            : isBotMessage
                                                ? "bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/10 text-on-surface rounded-bl-none border border-orange-200/30"
                                                : "bg-surface-container-low text-on-surface rounded-bl-none"
                                    } text-left w-full`}>
                                        {message.content && (
                                            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ margin: 0 }}>
                                                {message.content}
                                            </p>
                                        )}
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
