import { X } from "lucide-react";
import ChatData from '../Hooks/ChatData';
import AuthData from '../Hooks/AuthData';

import { useEffect } from "react";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser } = ChatData();
  const { onlineUsers } = AuthData();

  // Log whenever selectedUser or onlineUsers change
  useEffect(() => {
    console.log("Selected User:", selectedUser);
    console.log("Online Users:", onlineUsers);
  }, [selectedUser, onlineUsers]); 

  if (!selectedUser) {
    return (
      <div className="p-1 border-bottom">
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <div className="rounded-circle border" style={{ width: '40px', height: '40px' }}>
              <img src="/avatar.png" alt="No user selected" className="w-100 h-100 rounded-circle" />
            </div>
            <div>
              <h5 className="mb-0 ms-3" style={{ fontSize: '0.9rem' }}>No user selected</h5>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-1 border-bottom">
      <div className="d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center">
          <div className="rounded-circle border" style={{ width: '40px', height: '40px' }}>
            <img
              src={selectedUser.profilepic || "/avatar.png"}
              alt={selectedUser.username || "User"}
              className="w-100 h-100 rounded-circle"
            />
          </div>

          <div style={{ marginLeft: '16px', marginTop: '6px' }}>
            <h5 className="mb-0" style={{ fontSize: '0.9rem' }}>{selectedUser.username || "Unnamed User"}</h5>
            <p className="text-muted small" style={{ marginTop: '3px', fontSize: '0.8rem' }}>
              {onlineUsers && onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        <button className="btn btn-link" onClick={() => setSelectedUser(null)}>
          <X size={20} />
        </button>
      </div>
    </div>
  );
};


export default ChatHeader;
