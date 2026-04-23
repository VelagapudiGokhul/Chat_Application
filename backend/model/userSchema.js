const mongoose=require('mongoose')

const userSchema=new mongoose.Schema({
    username:{ type:String, required:true},
    email:{ type:String, required:true, unique: true},
    password:{ type:String, required:true},
    profilepic: { type: String, default: "" },
    isBot: { type: Boolean, default: false },
    botType: { type: String, default: null } // e.g., "swiggy"
},
{ versionKey: false,
  timestamps: true
}
)

const User = mongoose.model("User",userSchema)

module.exports = User