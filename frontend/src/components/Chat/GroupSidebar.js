import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from 'zustand';
import GroupData from '../Hooks/GroupData';
import AuthData from '../Hooks/AuthData';
import ChatData from '../Hooks/ChatData';

const GroupSidebar = () => {
    const { groups, getMyGroups, isGroupsLoading, selectedGroup, setSelectedGroup } = GroupData();
    const { authUser } = AuthData();
    const { setSelectedUser } = ChatData();
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        getMyGroups();
    }, [getMyGroups]);

    const handleSelectGroup = (group) => {
        setSelectedUser(null); // deselect direct chat user
        setSelectedGroup(group);
    };

    return (
        <section className="w-80 flex flex-col bg-surface-container-lowest rounded-2xl shadow-[0_4px_20px_rgba(25,28,30,0.04)] overflow-hidden flex-shrink-0">
            <div className="p-6 border-b border-outline-variant/15 flex-shrink-0 flex items-center justify-between">
                <span className="font-bold text-on-surface text-base">Groups</span>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-on-primary rounded-full text-xs font-bold hover:bg-primary-container transition-colors border-none shadow-sm"
                >
                    <span className="material-symbols-outlined text-base" style={{ fontSize: 16 }}>add</span>
                    New Group
                </button>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide py-2">
                {isGroupsLoading ? (
                    <div className="text-center text-outline py-8 text-sm">Loading groups...</div>
                ) : groups.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3 text-outline">
                        <span className="material-symbols-outlined text-4xl opacity-30">group</span>
                        <p className="text-sm">No groups yet</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="text-primary text-xs font-bold hover:underline bg-transparent border-none"
                        >
                            Create your first group
                        </button>
                    </div>
                ) : (
                    groups.map((group) => (
                        <div className="px-3 py-1" key={group._id}>
                            <button
                                onClick={() => handleSelectGroup(group)}
                                className={`w-full flex items-center gap-4 p-3 rounded-xl border-none text-left transition-all duration-200 ${selectedGroup?._id === group._id
                                    ? 'bg-primary-fixed/20 text-on-primary-fixed-variant scale-[1.02] shadow-sm'
                                    : 'hover:bg-surface-container-low text-on-surface bg-transparent'}`}
                            >
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    {group.avatar
                                        ? <img src={group.avatar} alt={group.name} className="w-12 h-12 rounded-full object-cover" />
                                        : <span className="material-symbols-outlined text-primary text-xl">group</span>
                                    }
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-sm truncate">{group.name}</h4>
                                    <p className="text-xs text-outline truncate">{group.members.length} member{group.members.length !== 1 ? 's' : ''}</p>
                                </div>
                            </button>
                        </div>
                    ))
                )}
            </div>

            {showCreateModal && (
                <CreateGroupModal
                    onClose={() => setShowCreateModal(false)}
                    onCreated={() => { setShowCreateModal(false); getMyGroups(); }}
                    authUser={authUser}
                />
            )}
        </section>
    );
};

// ------------------------------------------------------------------
// Create Group Modal
// ------------------------------------------------------------------
const CreateGroupModal = ({ onClose, onCreated, authUser }) => {
    const { createGroup } = GroupData();
    const { users, getUsers } = ChatData();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selected, setSelected] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => { getUsers(); }, [getUsers]);

    const toggleMember = (userId) => {
        setSelected(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : prev.length >= 31 ? prev : [...prev, userId]
        );
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        setLoading(true);
        await createGroup(name.trim(), description.trim(), selected);
        setLoading(false);
        onCreated();
    };

    const filtered = users.filter(u =>
        u.username.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(25,28,30,0.35)', backdropFilter: 'blur(4px)' }}>
            <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden flex flex-col" style={{ maxHeight: '90vh' }}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-outline-variant/15">
                    <h2 className="font-bold text-on-surface text-lg">Create New Group</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-container-low text-outline transition-colors border-none bg-transparent">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <form onSubmit={handleCreate} className="flex flex-col flex-1 overflow-hidden">
                    <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
                        {/* Group Name */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Group Name *</label>
                            <input
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="e.g. Design Team"
                                required
                                className="w-full h-11 px-4 bg-surface-container-low border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 placeholder:text-outline/50"
                            />
                        </div>
                        {/* Description */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Description</label>
                            <input
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="What's this group about?"
                                className="w-full h-11 px-4 bg-surface-container-low border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 placeholder:text-outline/50"
                            />
                        </div>
                        {/* Members */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Add Members</label>
                                <span className="text-xs text-outline">{selected.length + 1}/32</span>
                            </div>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline" style={{ fontSize: 16 }}>search</span>
                                <input
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Search users..."
                                    className="w-full pl-9 pr-4 py-2 bg-surface-container-low border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 placeholder:text-outline/50"
                                />
                            </div>
                            <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-hide">
                                {filtered.map(user => (
                                    <button
                                        type="button"
                                        key={user._id}
                                        onClick={() => toggleMember(user._id)}
                                        className={`w-full flex items-center gap-3 p-2.5 rounded-xl border-none text-left transition-all ${selected.includes(user._id) ? 'bg-primary/10' : 'bg-transparent hover:bg-surface-container-low'}`}
                                    >
                                        <img src={user.profilepic || '/avatar.png'} alt={user.username} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                                        <span className="text-sm font-medium text-on-surface flex-1 truncate">{user.username}</span>
                                        {selected.includes(user._id) && (
                                            <span className="material-symbols-outlined text-primary" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                            {/* Selected chips */}
                            {selected.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                    {users.filter(u => selected.includes(u._id)).map(u => (
                                        <span key={u._id} className="flex items-center gap-1 pl-2 pr-1 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
                                            {u.username}
                                            <button type="button" onClick={() => toggleMember(u._id)} className="flex items-center bg-transparent border-none text-primary hover:text-error transition-colors">
                                                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-outline-variant/15 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 h-11 rounded-full border border-outline-variant/30 text-on-surface-variant text-sm font-bold hover:bg-surface-container-low transition-colors bg-transparent">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!name.trim() || loading}
                            className="flex-1 h-11 rounded-full bg-primary text-on-primary text-sm font-bold hover:bg-primary-container transition-colors border-none disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating...' : 'Create Group'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default GroupSidebar;
