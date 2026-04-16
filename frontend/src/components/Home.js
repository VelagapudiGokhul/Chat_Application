import React from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "./Chat/Sidebar";
import InitialChat from "./Chat/InitialChat";
import ChatContainer from "./Chat/ChatContainer";
import GroupSidebar from "./Chat/GroupSidebar";
import GroupChatContainer from "./Chat/GroupChatContainer";
import ChatData from "./Hooks/ChatData";
import GroupData from "./Hooks/GroupData";

const Home = () => {
    const location = useLocation();
    const hashParams = new URLSearchParams(location.search || window.location.hash.split('?')[1] || '');
    const isGroupTab = hashParams.get('tab') === 'groups';

    const { selectedUser, loadingUsers } = ChatData();
    const { selectedGroup } = GroupData();

    if (loadingUsers) {
        return <div className="flex-1 flex items-center justify-center text-outline text-sm">Loading...</div>;
    }

    if (isGroupTab) {
        return (
            <>
                <GroupSidebar />
                {!selectedGroup ? (
                    <section className="flex-1 flex flex-col bg-surface-container-lowest rounded-2xl shadow-[0_4px_20px_rgba(25,28,30,0.04)] overflow-hidden items-center justify-center p-5">
                        <div className="text-center" style={{ maxWidth: '30rem' }}>
                            <div className="flex justify-center mb-6">
                                <div className="flex items-center justify-center bg-primary/10 rounded-2xl w-20 h-20 animate-bounce">
                                    <span className="material-symbols-outlined text-5xl text-primary">group</span>
                                </div>
                            </div>
                            <h2 className="text-3xl font-bold text-on-surface mb-3">Your Groups</h2>
                            <p className="text-on-surface-variant text-lg">Select a group to start chatting, or create a new one!</p>
                        </div>
                    </section>
                ) : (
                    <GroupChatContainer />
                )}
            </>
        );
    }

    return (
        <>
            <Sidebar />
            {!selectedUser ? <InitialChat /> : <ChatContainer />}
        </>
    );
};

export default Home;
