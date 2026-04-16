const Group = require('../model/groupSchema');
const GroupMessage = require('../model/groupMessageSchema');
const cloudinary = require('../config/cloudinary');
const { io } = require('../socket/socket');
const axios = require('axios');

// Create a new group
exports.createGroup = async (req, res) => {
    try {
        const { name, description, memberIds } = req.body;
        const adminId = req.user._id;

        if (!name || !name.trim()) {
            return res.status(400).json({ message: "Group name is required" });
        }

        let members = Array.isArray(memberIds) ? memberIds : [];
        // Always include admin
        if (!members.includes(adminId.toString())) {
            members.push(adminId.toString());
        }

        if (members.length > 32) {
            return res.status(400).json({ message: "A group can have a maximum of 32 members" });
        }

        const group = new Group({
            name: name.trim(),
            description: description || "",
            admin: adminId,
            members
        });

        await group.save();
        const populated = await group.populate('members', '-password');
        res.status(201).json(populated);
    } catch (e) {
        console.error("createGroup error:", e.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// Get all groups the current user belongs to
exports.getMyGroups = async (req, res) => {
    try {
        const userId = req.user._id;
        const groups = await Group.find({ members: userId })
            .populate('members', '-password')
            .populate('admin', '-password')
            .sort({ updatedAt: -1 });
        res.status(200).json(groups);
    } catch (e) {
        console.error("getMyGroups error:", e.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// Get a single group by id
exports.getGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const group = await Group.findById(id)
            .populate('members', '-password')
            .populate('admin', '-password');
        if (!group) return res.status(404).json({ message: "Group not found" });
        res.status(200).json(group);
    } catch (e) {
        console.error("getGroup error:", e.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// Add a member to a group
exports.addMember = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;
        const requesterId = req.user._id;

        const group = await Group.findById(id);
        if (!group) return res.status(404).json({ message: "Group not found" });
        if (group.admin.toString() !== requesterId.toString()) {
            return res.status(403).json({ message: "Only admin can add members" });
        }
        if (group.members.length >= 32) {
            return res.status(400).json({ message: "Group is full (max 32 members)" });
        }
        if (group.members.map(m => m.toString()).includes(userId)) {
            return res.status(400).json({ message: "User is already a member" });
        }

        group.members.push(userId);
        await group.save();
        const populated = await group.populate('members', '-password');
        res.status(200).json(populated);
    } catch (e) {
        console.error("addMember error:", e.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// Remove a member from group
exports.removeMember = async (req, res) => {
    try {
        const { id, userId } = req.params;
        const requesterId = req.user._id;

        const group = await Group.findById(id);
        if (!group) return res.status(404).json({ message: "Group not found" });
        if (group.admin.toString() !== requesterId.toString() && userId !== requesterId.toString()) {
            return res.status(403).json({ message: "Not authorised" });
        }

        group.members = group.members.filter(m => m.toString() !== userId);
        await group.save();
        res.status(200).json({ message: "Member removed" });
    } catch (e) {
        console.error("removeMember error:", e.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// Get group messages
exports.getGroupMessages = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const group = await Group.findById(id);
        if (!group) return res.status(404).json({ message: "Group not found" });
        if (!group.members.map(m => m.toString()).includes(userId.toString())) {
            return res.status(403).json({ message: "You are not a member of this group" });
        }

        const messages = await GroupMessage.find({ groupId: id })
            .populate('senderID', 'username profilepic')
            .sort({ createdAt: 1 });
        res.status(200).json(messages);
    } catch (e) {
        console.error("getGroupMessages error:", e.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// Send a message to a group
exports.sendGroupMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { message, image, audio } = req.body;
        const senderID = req.user._id;

        const group = await Group.findById(id);
        if (!group) return res.status(404).json({ message: "Group not found" });
        if (!group.members.map(m => m.toString()).includes(senderID.toString())) {
            return res.status(403).json({ message: "You are not a member of this group" });
        }

        // Toxicity check
        try {
            const response = await axios.post('http://localhost:5001/predict', { message });
            if (response.data.toxic === 1) {
                return res.status(400).json({ error: "Message rejected due to toxic content" });
            }
        } catch (err) {
            console.error("Toxicity API error:", err.message);
        }

        let imageUrl = null;
        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image, {
                width: 500, height: 500, crop: 'scale',
            });
            imageUrl = uploadResponse.secure_url;
        }

        let audioUrl = null;
        if (audio) {
            const uploadResponse = await cloudinary.uploader.upload(audio, {
                resource_type: 'video',
                folder: 'voice_messages',
            });
            audioUrl = uploadResponse.secure_url;
        }

        const newMessage = new GroupMessage({
            groupId: id,
            senderID,
            content: message,
            imageUrl,
            audioUrl
        });
        await newMessage.save();
        await newMessage.populate('senderID', 'username profilepic');

        // Emit to all group members
        io.to(`group_${id}`).emit("newGroupMessage", newMessage);

        res.status(201).json(newMessage);
    } catch (e) {
        console.error("sendGroupMessage error:", e.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
