const User = require("../model/userSchema");
const Message = require('../model/messageSchema'); 
const cloudinary = require('../config/cloudinary');
const { getReceiverSocketId, io } = require("../socket/socket");
const axios = require('axios');

exports.allUsers = async (req, res) => {
    try {
        const userid = req.user._id;
        const allusers = await User.find({ _id: { $ne : userid } }).select("-password");
        return res.status(200).json({allusers});
    } catch (e) {
        return res.status(500).json({ message: "Internal Server Error", e });
    }
};

exports.getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;  
  
    const messages = await Message.find({
      $or: [
        { senderID: myId, receiverID: userToChatId },
        { senderID: userToChatId, receiverID: myId },  
      ],
    }).sort({ createdAt: 1 }); 

    res.status(200).json(messages);
  } catch (e) {
    console.log("Messaging Server Error: ", e.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

  

exports.sendMessage = async (req, res) => {
  try {
    const { message, image, audio } = req.body;  
    let { id: receiverID } = req.params;
    const senderID = req.user._id;

    receiverID = receiverID.trim(); 

    // 1. Call Python toxicity API
    let toxicityPrediction = {};
    try {
      const response = await axios.post('http://localhost:5001/predict', { message });  // Change port if needed
      toxicityPrediction = response.data;
      console.log("Toxicity prediction:", toxicityPrediction);
    } catch (err) {
      console.error("Error calling toxicity API:", err.message);
      // Optionally decide how to handle failure (e.g., proceed anyway)
    }

    // 2. Optionally, you can decide to reject toxic messages here:
    if (toxicityPrediction.toxic === 1) {
      return res.status(400).json({ error: "Message rejected due to toxic content" });
    }

    // 3. Upload image if present
    let imageUrl = null;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image, {
        width: 500,          
        height: 500,
        crop: 'scale',
      });

      console.log("Cloudinary response:", uploadResponse);  
      imageUrl = uploadResponse.secure_url;  
    }

    // 4. Upload audio if present
    let audioUrl = null;
    if (audio) {
      const uploadResponse = await cloudinary.uploader.upload(audio, {
        resource_type: 'video',
        folder: 'voice_messages',
      });
      console.log("Cloudinary audio response:", uploadResponse);
      audioUrl = uploadResponse.secure_url;
    }

    // 5. Save message with optional toxicity flag
    const newMessage = new Message({
      senderID,
      receiverID,
      content: message,
      imageUrl: imageUrl,
      audioUrl: audioUrl,
      toxicity: toxicityPrediction,   // Save prediction if your schema supports it
    });

    await newMessage.save();

    // 5. Emit new message to receiver
    const receiverSocketId = getReceiverSocketId(receiverID);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
      console.log(newMessage);
    }

    // 6. Respond
    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error in sendMessage controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
