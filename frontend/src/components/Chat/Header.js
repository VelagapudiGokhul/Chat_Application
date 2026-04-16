import { X } from "lucide-react";
import ChatData from '../Hooks/ChatData';
import AuthData from '../Hooks/AuthData';
import { useEffect } from "react";

const ChatHeader = () => {
    const { selectedUser, setSelectedUser } = ChatData();
    const { onlineUsers } = AuthData();

    useEffect(() => {
        console.log("Selected User:", selectedUser);
        console.log("Online Users:", onlineUsers);
    }, [selectedUser, onlineUsers]);

    if (!selectedUser) {
        return (
            <div className="px-6 py-4 border-b border-outline-variant/15 flex items-center justify-between bg-surface/50 backdrop-blur-md rounded-t-2xl flex-shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full border-2 border-surface-container-lowest bg-surface-container flex items-center justify-center shadow-sm">
                        <span className="material-symbols-outlined text-outline">person_off</span>
                    </div>
                    <div>
                        <h5 className="font-bold text-on-surface m-0">No user selected</h5>
                    </div>
                </div>
            </div>
        );
    }

    const isOnline = onlineUsers && onlineUsers.includes(selectedUser._id);

    return (
        <div className="px-6 py-4 border-b border-outline-variant/15 flex items-center justify-between bg-surface/50 backdrop-blur-md rounded-t-2xl flex-shrink-0 shadow-sm z-10 transition-colors">
            <div className="flex items-center gap-4 group cursor-pointer flex-1" onClick={() => {/* Future: show profile */}}>
                <div className="relative">
                    <img
                        src={selectedUser.profilepic || "/avatar.png"}
                        alt={selectedUser.username || "User"}
                        className="w-12 h-12 rounded-full object-cover border-2 border-surface-container-lowest shadow-sm transition-transform group-hover:scale-105"
                    />
                    {isOnline && (
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-surface-container-lowest rounded-full shadow-sm animate-pulse"></span>
                    )}
                </div>

                <div className="flex-1">
                    <h5 className="font-bold text-on-surface text-lg m-0 group-hover:text-primary transition-colors flex items-center gap-2">
                        {selectedUser.username || "Unnamed User"}
                    </h5>
                    <p className={`text-sm m-0 font-medium ${isOnline ? 'text-green-600' : 'text-outline'} flex items-center gap-1.5`}>
                        {isOnline ? 'Active now' : 'Offline'}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <button className="p-2.5 rounded-full hover:bg-surface-container-low text-outline transition-colors border-none bg-transparent cursor-pointer flex items-center justify-center">
                    <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>call</span>
                </button>
                <button className="p-2.5 rounded-full hover:bg-surface-container-low text-outline transition-colors border-none bg-transparent cursor-pointer flex items-center justify-center">
                    <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>videocam</span>
                </button>
                <button className="p-2.5 rounded-full hover:bg-surface-container-low text-outline transition-colors border-none bg-transparent cursor-pointer flex items-center justify-center">
                    <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>more_vert</span>
                </button>
                <button
                    className="w-10 h-10 ml-2 rounded-full hover:bg-surface-container-low flex items-center justify-center text-outline hover:text-error transition-all hover:rotate-90 active:scale-95 border-none outline-none bg-transparent cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); setSelectedUser(null); }}
                    title="Close chat"
                >
                    <X size={20} className="stroke-[2.5]" />
                </button>
            </div>
        </div>
    );
};

export default ChatHeader;
