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

  // Swiggy Auth State
  swiggyConnected: false,
  swiggyAuthLoading: false,

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
    console.log("Fetching messages for userId:", userId);
    set({ isMessagesLoading: true });
    try {
      const res = await axios.get(`http://localhost:5000/api/messageRoute/${userId}`);
      console.log("Fetched messages:", res.data);
  
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

  // ── Swiggy Auth Methods ──

  checkSwiggyAuth: async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/swiggyRoute/auth-status');
      set({ swiggyConnected: res.data.connected });
      return res.data.connected;
    } catch (error) {
      console.error("Error checking Swiggy auth:", error);
      set({ swiggyConnected: false });
      return false;
    }
  },

  connectSwiggy: async () => {
    set({ swiggyAuthLoading: true });
    try {
      const res = await axios.get('http://localhost:5000/api/swiggyRoute/auth/connect');
      const { authUrl } = res.data;

      // Open Swiggy login in a popup window
      const popup = window.open(
        authUrl,
        'SwiggyAuth',
        'width=500,height=700,scrollbars=yes,resizable=yes,left=200,top=100'
      );

      // Poll for popup close (means auth completed)
      const pollTimer = setInterval(async () => {
        if (popup?.closed) {
          clearInterval(pollTimer);
          // Check if auth succeeded
          const connected = await get().checkSwiggyAuth();
          set({ swiggyAuthLoading: false });
          if (connected) {
            toast.success('🎉 Connected to Swiggy!', {
              style: { background: '#FFF5F0', color: '#E65100', border: '1px solid #FFE0CC' },
              iconTheme: { primary: '#FF6F3C', secondary: '#FFF' }
            });
          }
        }
      }, 1000);

    } catch (error) {
      console.error("Error connecting Swiggy:", error);
      toast.error('Failed to start Swiggy authentication');
      set({ swiggyAuthLoading: false });
    }
  },

  disconnectSwiggy: async () => {
    set({ swiggyAuthLoading: true });
    try {
      await axios.post('http://localhost:5000/api/swiggyRoute/auth/disconnect');
      set({ swiggyConnected: false, swiggyAuthLoading: false });
      toast.success('Disconnected from Swiggy', {
        style: { background: '#F5F5F5', color: '#333', border: '1px solid #E0E0E0' },
      });
    } catch (error) {
      console.error("Error disconnecting Swiggy:", error);
      toast.error('Failed to disconnect from Swiggy');
      set({ swiggyAuthLoading: false });
    }
  },

  clearSwiggyChat: async () => {
    try {
      await axios.post('http://localhost:5000/api/swiggyRoute/clear-history');
      // Clear messages from UI immediately
      set({ messages: [] });
      toast.success('🗑️ Swiggy chat cleared', {
        style: { background: '#FFF5F0', color: '#E65100', border: '1px solid #FFE0CC' },
      });
    } catch (error) {
      console.error("Error clearing Swiggy history:", error);
      toast.error('Failed to clear chat history');
    }
  },
}));

export default ChatData;

