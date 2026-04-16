import { create } from 'zustand';
import toast from 'react-hot-toast';
import axios from 'axios';
import AuthData from './AuthData';

const GroupData = create((set, get) => ({
    groups: [],
    selectedGroup: null,
    groupMessages: [],
    isGroupsLoading: false,
    isGroupMessagesLoading: false,

    getMyGroups: async () => {
        set({ isGroupsLoading: true });
        try {
            const res = await axios.get('http://localhost:5000/api/groupRoute/my-groups');
            set({ groups: res.data });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error fetching groups');
        } finally {
            set({ isGroupsLoading: false });
        }
    },

    createGroup: async (name, description, memberIds) => {
        try {
            const res = await axios.post('http://localhost:5000/api/groupRoute/create', {
                name, description, memberIds
            });
            set((state) => ({ groups: [res.data, ...state.groups] }));
            toast.success('Group created successfully!');
            return res.data;
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error creating group');
        }
    },

    addMember: async (groupId, userId) => {
        try {
            const res = await axios.post(`http://localhost:5000/api/groupRoute/${groupId}/add-member`, { userId });
            set((state) => ({
                groups: state.groups.map(g => g._id === groupId ? res.data : g),
                selectedGroup: state.selectedGroup?._id === groupId ? res.data : state.selectedGroup
            }));
            toast.success('Member added!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error adding member');
        }
    },

    removeMember: async (groupId, userId) => {
        try {
            await axios.delete(`http://localhost:5000/api/groupRoute/${groupId}/remove-member/${userId}`);
            const res = await axios.get(`http://localhost:5000/api/groupRoute/${groupId}`);
            set((state) => ({
                groups: state.groups.map(g => g._id === groupId ? res.data : g),
                selectedGroup: state.selectedGroup?._id === groupId ? res.data : state.selectedGroup
            }));
            toast.success('Member removed');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error removing member');
        }
    },

    getGroupMessages: async (groupId) => {
        set({ isGroupMessagesLoading: true });
        try {
            const res = await axios.get(`http://localhost:5000/api/groupRoute/${groupId}/messages`);
            set({ groupMessages: res.data });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error fetching group messages');
        } finally {
            set({ isGroupMessagesLoading: false });
        }
    },

    sendGroupMessage: async (messageData) => {
        const { selectedGroup, groupMessages } = get();
        try {
            const res = await axios.post(
                `http://localhost:5000/api/groupRoute/${selectedGroup._id}/send`,
                messageData
            );
            set({ groupMessages: [...groupMessages, res.data] });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error sending message');
        }
    },

    subscribeToGroupMessages: () => {
        const { selectedGroup } = get();
        if (!selectedGroup) return;
        const socket = AuthData.getState().socket;
        socket.emit('joinGroup', selectedGroup._id);
        socket.on('newGroupMessage', (msg) => {
            if (msg.groupId !== selectedGroup._id) return;
            set((state) => ({ groupMessages: [...state.groupMessages, msg] }));
        });
    },

    unsubscribeFromGroupMessages: () => {
        const { selectedGroup } = get();
        const socket = AuthData.getState().socket;
        if (selectedGroup) socket.emit('leaveGroup', selectedGroup._id);
        socket.off('newGroupMessage');
    },

    setSelectedGroup: (group) => set({ selectedGroup: group, groupMessages: [] }),
}));

export default GroupData;
