const mongoose=require('mongoose')

const messageSchema=new mongoose.Schema({
    senderID:{ type:mongoose.Schema.Types.ObjectId, ref: 'User', required:true},
    receiverID:{ type:mongoose.Schema.Types.ObjectId, ref: 'User', required:true},
    content:{ type:String },
    imageUrl: { type: String },
    mediaUrl: { type: String },
    audioUrl: { type: String }
},
{ versionKey: false,
  timestamps: true
}
)

const Message = mongoose.model("Message", messageSchema)

module.exports = Message   