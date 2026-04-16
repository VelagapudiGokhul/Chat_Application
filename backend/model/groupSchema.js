const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    avatar: { type: String, default: "" },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    maxMembers: { type: Number, default: 32 }
}, {
    versionKey: false,
    timestamps: true
});

const Group = mongoose.model("Group", groupSchema);

module.exports = Group;
