const mongoose = require('mongoose');

const groupMessageSchema = new mongoose.Schema({
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    senderID: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String },
    imageUrl: { type: String },
    audioUrl: { type: String }
}, {
    versionKey: false,
    timestamps: true
});

const GroupMessage = mongoose.model("GroupMessage", groupMessageSchema);

module.exports = GroupMessage;
