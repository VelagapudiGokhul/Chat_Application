import { create } from 'zustand';
import toast from 'react-hot-toast';
import axios from 'axios';
import AuthData from "../Hooks/AuthData";


const ChatData = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axios.get('http://localhost:5000/api/messageRoute/users');
      set({ users: res.data.allusers });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error fetching users');
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    console.log("Fetching messages for userId:", userId); // Log userId to check if it's valid
    set({ isMessagesLoading: true });
    try {
      const res = await axios.get(`http://localhost:5000/api/messageRoute/${userId}`);
      console.log("Fetched messages:", res.data); // Log the response data to check if it’s correct
  
      // Check if the response is an array and contains the expected structure
      if (Array.isArray(res.data)) {
        set({ messages: res.data });
      } else {
        console.warn("Unexpected response format:", res.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error fetching messages');
    } finally {
      set({ isMessagesLoading: false });
    }
  },
  

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axios.post(`http://localhost:5000/api/messageRoute/sendMessage/${selectedUser._id}`, messageData);
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error sending message');
    }
  },


  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = AuthData.getState().socket;

    socket.on("newMessage", (newMessage) => {
      console.log("Received new message:", newMessage);

      console.log("Selected user ID:", selectedUser._id);  
      console.log("Sender ID from message:", newMessage.senderID);


      const isMessageForSelectedUser = newMessage.senderID === selectedUser._id || newMessage.receiverID === selectedUser._id;
      console.log(isMessageForSelectedUser);
      if (!isMessageForSelectedUser) return;

      set((state) => {
        console.log("Before update:", state.messages);  
        const updatedMessages = [...state.messages, newMessage];
        console.log("Updated messages:", updatedMessages);
        return { messages: updatedMessages };
      });
      
      
      console.log("Updated messages:", get().messages);
    });
  },

  unsubscribeFromMessages: () => {
    const socket = AuthData.getState().socket;
    socket.off("newMessage");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));

export default ChatData;
