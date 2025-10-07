import React from "react";
//import "./app.css"; // Custom CSS for additional styles

const ChatApp = () => {
  const users = [
    { id: 1, name: "Harry Maguire", status: "You need to improve now", profilePic: "https://via.placeholder.com/40" },
    { id: 2, name: "Bruno Fernandes", status: "Play the game Bruno!", profilePic: "https://via.placeholder.com/40" },
    { id: 3, name: "Marcus Rashford", status: "Rashford is typing...", profilePic: "https://via.placeholder.com/40" },
  ];

  const messages = [
    {
      type: "received",
      sender: "Harry Maguire",
      text: "Hey lads, tough game yesterday. Let’s talk about what went wrong and how we can improve. 😊",
    },
    {
      type: "received",
      sender: "Bruno Fernandes",
      text: "Agreed, Harry. We had some good moments, but we need to be more clinical in front of the goal. 😔",
    },
    {
      type: "sent",
      text: "We need to control the midfield and exploit their defensive weaknesses. Bruno and Paul, I’m counting on your creativity. Marcus and Jadon, stretch their defense wide. Use your pace and take on their full-backs.",
    },
  ];

  return (
    <div className="container-fluid chat-app d-flex">
      {/* Sidebar */}
      <div className="sidebar bg-white border-end">
        <h5 className="text-center py-3">Available Users</h5>
        {users.map((user) => (
          <div className="chat-item d-flex align-items-center p-2 border-bottom" key={user.id}>
            <img
              src={user.profilePic}
              alt="Profile"
              className="profile-pic rounded-circle me-2"
            />
            <div>
              <strong>{user.name}</strong>
              <p className="text-muted mb-0 small">{user.status}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Chat Content */}
      <div className="chat-content flex-grow-1 d-flex flex-column bg-light p-3">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message mb-2 p-2 rounded ${
              message.type === "sent" ? "bg-primary text-white align-self-end" : "bg-secondary text-dark align-self-start"
            }`}
          >
            {message.sender && <strong>{message.sender}: </strong>}
            <p className="mb-0">{message.text}</p>
          </div>
        ))}

        {/* Message Input */}
        <div className="message-input d-flex mt-auto bg-white p-2 border-top">
          <textarea
            className="form-control me-2"
            rows="1"
            placeholder="Type a message..."
          ></textarea>
          <button className="btn btn-primary">Send</button>
        </div>
      </div>
    </div>
  );
};

export default ChatApp;
