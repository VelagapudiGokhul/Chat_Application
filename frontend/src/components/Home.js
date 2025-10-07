import React from "react";
import Sidebar from "./Chat/Sidebar";
import InitialChat from "./Chat/InitialChat";
import ChatContainer from "./Chat/ChatContainer";
import ChatData from "./Hooks/ChatData";

const Home = () => {
  const {
    users,
    selectedUser,
    handleUserSelect,
    loadingUsers,
  } = ChatData();

  if (loadingUsers) {
    return <div>Loading users...</div>;
  }

  const containerStyle = {
    display: "flex",
    width: "100%",
    height: "calc(100vh - 140px)", 
    marginTop: "40px", 
    marginBottom: "20px", 
  };

  const leftStyle = {
    flex: 0.35,
    padding: "20px",
    boxSizing: "border-box",
    backgroundColor: "#ffffff", 
    marginRight: "20px", 
    height: "100%", 
    boxShadow: "4px 4px 10px rgba(0, 0, 0, 0.1)", 
  };

  const rightStyle = {
    flex: 0.65, // Takes 60% of the available space
    padding: "0", // Remove any padding to avoid extra space around InitialChat
    margin: "0", // Remove margin to ensure it fits perfectly in the container
    boxSizing: "border-box", // Makes sure padding and margin don't cause overflow
    backgroundColor: "#ffffff", // Slightly darker gray for right side
    height: "100%", // Ensures it takes the full height of the flex container
    boxShadow: "4px 4px 10px rgba(0, 0, 0, 0.1)", // Shadow for right side
  };

  return (
    <div style={{ backgroundColor: "#E8F9FF", minHeight: "100vh" }}>
      <div
        className="d-flex align-items-center justify-content-center pt-5 px-3"
        style={{ minHeight: "100vh" }}
      >
        <div style={containerStyle}>
          <div style={leftStyle}><Sidebar/></div>
          <div style={rightStyle}>
            {!selectedUser ? <InitialChat /> : <ChatContainer />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
