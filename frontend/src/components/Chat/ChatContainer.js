import React, { useEffect } from 'react';
import Header from './Header';
import MessageInput from './MessageInput';
import MessageSkeleton from './MessageSkeleton';
import ChatData from '../Hooks/ChatData';
import AuthData from '../Hooks/AuthData';
import styles from './ChatContainer.module.css';  

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

  useEffect(() => {
    console.log("Selected User:", selectedUser); 
    
    getMessages(selectedUser._id);
    
    subscribeToMessages();

    return () => unsubscribeFromMessages();
  }, [selectedUser, getMessages, subscribeToMessages, unsubscribeFromMessages]);

  //console.log(messages);

  return (
    <div className={styles.chatContainer + " d-flex flex-column flex-grow-1 overflow-auto"} style={{height: "100%" }}>
      <Header />

      <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ paddingBottom: "80px" }}>
        {isMessagesLoading ? (
          <MessageSkeleton />
        ) : (
          messages.length > 0 ? (
            messages.map((message) => {
              if (!message || !message._id) {
                console.warn("Invalid message data", message);
                return null;
              }

              const isSender = message.senderID === authUser._id;
              return (
                <div
                  key={message._id}
                  className={`d-flex ${isSender ? "justify-content-end" : "justify-content-start"}`}
                  style={{ marginBottom: "15px" }}
                >
                  {!isSender && ( 
                    <div className="d-flex align-items-start">
                      <div
                        className="avatar"
                        style={{
                          width: "40px",
                          height: "40px",
                          marginRight: "8px"
                        }}
                      >
                        <img
                          src={selectedUser.profilePic || "/Avatar.jpg"}
                          alt="profile pic"
                          className="rounded-circle border"
                          style={{ width: "100%", height: "100%" }}
                        />
                      </div>
                    </div>
                  )}
                  <div className="ms-2" style={{ maxWidth: "75%" }}> 
                    <div className="mb-1">
                      <time className="text-muted" style={{ fontSize: "0.75rem" }}>
                        {new Date(message.createdAt).toLocaleString()}
                      </time>
                    </div>
                    <div className="chat-bubble" style={{ backgroundColor: isSender ? "#bcb6efff" : "#FFFFFF", borderRadius: "10px", padding: "8px", wordBreak: "break-word" }}>
                      {message.content && <p>{message.content}</p>}
                      {message.imageUrl && <img src={message.imageUrl} alt="Attachment" className="img-fluid rounded mb-2" />}
                    </div>
                  </div>
                  {isSender && ( 
                    <div className="d-flex align-items-start ms-2">
                      <div
                        className="avatar"
                        style={{
                          width: "40px",
                          height: "40px",
                          marginLeft: "8px" 
                        }}
                      >
                        <img
                          src={authUser.profilepic || "/Avatar.jpg"}
                          alt="profile pic"
                          className="rounded-circle border"
                          style={{ width: "100%", height: "100%" }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <MessageSkeleton />
          )
        )}
      </div>

      <MessageInput />
    </div>
  );
};

export default ChatContainer;
