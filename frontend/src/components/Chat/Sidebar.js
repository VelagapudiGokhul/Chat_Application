import React, { useEffect } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { Users, Settings, User, LogOut } from "lucide-react";
import { useStore } from "zustand";
import ChatData from '../Hooks/ChatData';
import AuthData from '../Hooks/AuthData';

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } = ChatData();
  const { onlineUsers } = AuthData(); 
  const navigate = useNavigate();
  const { logout } = useStore(AuthData);

  useEffect(() => {
    getUsers(); 
  }, [getUsers]);

  const handleLogout = async () => {
    await logout();  
    navigate("/login");  
  };

  if (isUsersLoading) return <div>Loading...</div>; 

  return (
    <div className="h-100 w-100 border-end p-3 d-flex flex-column" style={{ overflow: 'visible' }}>
      
      <div className="d-flex align-items-center gap-4 mb-2">
        <Users className="fs-4" />
        <span className="fw-semibold d-none d-lg-block">Contacts</span>
        <div className="d-flex align-items-center ml-auto">
          <div className="btn">
            <Settings className="w-16 h-16" />
          </div>
          <div className="btn"> 
            <User className="w-16 h-16" />
          </div>
          <button onClick={handleLogout} 
            style={{
              all: "unset"
            }}
          >
            <div className="btn"> 
              <LogOut className="w-16 h-16" />
            </div>
          </button>
        </div>
        <div style={{ borderTop: "1px solid #ffdfdd", marginTop: 'auto' }}></div>
      </div>
      

      <div className="py-3 style={{ overflowY: 'auto'}}">
        {users.map((user) => (
          <button
          key={user._id}
          onClick={() => setSelectedUser(user)} 
          className={`w-100 p-3 d-flex align-items-center gap-3 mb-2 border-0 rounded-3 
            ${selectedUser?._id === user._id ? "text-white transform-scale-up" : "bg-white"}
            hover:bg-light`}
          style={{
            backgroundColor: selectedUser?._id === user._id ? "#493D9E" : "",
            transition: "all 0.3s ease-in-out", 
            transform: selectedUser?._id === user._id ? "scale(1.2)" : "scale(1)", 
            zIndex: selectedUser?._id === user._id ? 1 : "auto",
            outline: 'none'
          }}
        >
            <div className="position-relative">
              <img
                src={user.profilepic || "/avatar.png"}
                alt={user.username}
                className="rounded-circle img-fluid"
                style={{ width: "48px", height: "48px", objectFit: "cover" }}
              />
              {onlineUsers.includes(user._id) && (
                <span
                  className="position-absolute bottom-0 end-0 bg-success rounded-circle border-2 border-light"
                  style={{ width: "12px", height: "12px" }}
                />
              )}
            </div>

            <div className="d-flex flex-column ml-3">
                <div className="fw-semibold text-truncate">{user.username}</div>
                <div className="text-muted small" style={{ alignSelf: 'flex-start' }}>
                  {onlineUsers && onlineUsers.includes(user._id) ? "Online" : "Offline"}
                </div>
              </div>
          </button>
        ))}

        {users.length === 0 && (
          <div className="text-center text-muted py-4">No users available</div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
