import React, { useEffect, useState } from "react";
import AuthData from "../Hooks/AuthData";
import ChatData from "../Hooks/ChatData";
import { Loader } from "lucide-react";

const Sidebar = () => {
    const { onlineUsers } = AuthData();
    const {
        users,
        selectedUser,
        setSelectedUser,
        getUsers,
        isUsersLoading,
    } = ChatData();

    const [showOnlineOnly, setShowOnlineOnly] = useState(false);

    useEffect(() => {
        getUsers();
    }, [getUsers]);

    const filteredUsers = showOnlineOnly
        ? users.filter((user) => onlineUsers.includes(user._id))
        : users;

    return (
        <section className="w-80 flex flex-col bg-surface-container-lowest rounded-2xl shadow-[0_4px_20px_rgba(25,28,30,0.04)] overflow-hidden flex-shrink-0">
            {/* Header + Actions */}
            <div className="p-6 border-b border-outline-variant/15 flex-shrink-0">
                <div className="flex items-center justify-between mb-4">
                    <span className="font-bold text-on-surface text-base">Direct Messages</span>
                    <span className="text-primary font-bold text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                        {onlineUsers.length > 0 ? onlineUsers.length - 1 : 0} Online
                    </span>
                </div>
                
                {/* Search */}
                <div className="relative mb-4 group">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors" data-icon="search" style={{ fontSize: '20px' }}>search</span>
                    <input type="text" placeholder="Search contacts..." className="w-full bg-surface-container-low border-0 outline-none focus:ring-2 focus:ring-primary/20 rounded-xl py-2.5 pl-10 pr-4 text-sm text-on-surface transition-all placeholder:text-outline-variant" />
                </div>
            </div>

            {/* Contacts List */}
            <div className="flex-1 overflow-y-auto scrollbar-hide py-2">
                {isUsersLoading ? (
                    <div className="flex justify-center p-4">
                        <Loader className="w-6 h-6 animate-spin text-primary" />
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="text-center text-outline text-sm p-4">No contacts found.</div>
                ) : (
                    filteredUsers.map((user) => {
                        const isOnline = onlineUsers.includes(user._id);
                        const isSelected = selectedUser?._id === user._id;
                        const isBot = user.isBot;
                        
                        return (
                            <div className="px-3 py-1" key={user._id}>
                                <button
                                    onClick={() => setSelectedUser(user)}
                                    className={`w-full flex items-center gap-4 p-3 rounded-xl border-none outline-none text-left transition-all duration-200 ${
                                        isSelected 
                                        ? 'bg-primary-fixed/20 text-on-primary-fixed-variant scale-[1.02] shadow-sm' 
                                        : 'hover:bg-surface-container-low text-on-surface bg-transparent'
                                    }`}
                                >
                                    <div className="relative flex-shrink-0">
                                        {isBot ? (
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xl shadow-md border-2 border-surface-container-lowest">
                                                🍕
                                            </div>
                                        ) : (
                                            <img
                                                src={user.profilepic || "/avatar.png"}
                                                alt={user.username}
                                                className="w-12 h-12 rounded-full object-cover border-2 border-surface-container-lowest shadow-sm"
                                            />
                                        )}
                                        {isBot ? (
                                            <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-orange-500 border-2 border-surface-container-lowest rounded-full flex items-center justify-center text-[8px]">🤖</span>
                                        ) : isOnline ? (
                                            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-surface-container-lowest rounded-full"></span>
                                        ) : null}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <span className={`font-bold text-sm truncate ${isSelected ? 'text-primary' : 'text-on-surface'}`}>
                                                {user.username}
                                            </span>
                                            {isBot && (
                                                <span className="text-[9px] font-bold bg-orange-500/15 text-orange-600 px-1.5 py-0.5 rounded-full uppercase tracking-wider">AI</span>
                                            )}
                                        </div>
                                        <div className="text-xs text-outline flex items-center gap-1.5 truncate">
                                            {isBot ? (
                                                <span className="text-orange-500 font-medium">AI Assistant • Swiggy</span>
                                            ) : isOnline ? 'Active now' : 'Offline'}
                                        </div>
                                    </div>
                                </button>
                            </div>
                        );
                    })
                )}
            </div>
        </section>
    );
};

export default Sidebar;
