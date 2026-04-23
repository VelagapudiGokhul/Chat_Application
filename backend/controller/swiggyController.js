const Message = require("../model/messageSchema");
const { processSwiggyChat, checkOllamaStatus } = require("../services/ollamaService");
const { isSwiggyBot, getSwiggyBotId } = require("../utils/botSetup");
const { isUserConnected } = require("../services/swiggyAuthService");
const { getReceiverSocketId, io } = require("../socket/socket");

// Fixed response when user hasn't connected Swiggy
const NOT_CONNECTED_RESPONSE = `🔐 **Connect your Swiggy account first!**

👉 Click **"Connect Swiggy"** in the chat header above.

Once connected, you can:
• \`see biryani\` — search restaurants for an item
• \`cart biryani\` — add an item to your cart  
• \`book\` — place your order`;

/**
 * Handle messages sent to the Swiggy Bot.
 * No conversation history — each message is independent.
 */
async function handleSwiggyBotMessage(senderID, messageContent) {
  const startTime = Date.now();
  const botId = await getSwiggyBotId();
  
  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log("║           🍕 SWIGGY BOT — INCOMING MESSAGE             ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  console.log(`📩 From User:    ${senderID}`);
  console.log(`💬 Message:      "${messageContent}"`);
  console.log(`⏰ Time:         ${new Date().toLocaleTimeString()}`);
  console.log("──────────────────────────────────────────────────────────");

  if (!botId) {
    console.log("❌ Bot not found — cannot respond");
    return { success: false, reply: "❌ Swiggy Bot is not available right now." };
  }

  // STRICT CHECK: Is user connected to Swiggy?
  const connected = await isUserConnected(senderID);
  console.log(`🔗 Swiggy Auth:  ${connected ? "✅ CONNECTED" : "❌ NOT CONNECTED"}`);

  if (!connected) {
    const botMessage = new Message({
      senderID: botId,
      receiverID: senderID,
      content: NOT_CONNECTED_RESPONSE,
    });
    await botMessage.save();

    const senderSocketId = getReceiverSocketId(senderID.toString());
    if (senderSocketId) {
      io.to(senderSocketId).emit("newMessage", botMessage);
    }

    const elapsed = Date.now() - startTime;
    console.log("──────────────────────────────────────────────────────────");
    console.log(`📤 RESPONSE SENT TO FRONTEND (${elapsed}ms)`);
    console.log(`📋 Type:         NOT_CONNECTED (fixed message)`);
    console.log(`📡 Socket:       ${senderSocketId ? "✅ Delivered via socket" : "⚠️ User offline — saved to DB only"}`);
    console.log("══════════════════════════════════════════════════════════\n");

    return { success: true, reply: NOT_CONNECTED_RESPONSE, botMessage };
  }

  // User IS connected — process with simple intent router (NO history)
  try {
    console.log("🔄 Processing with intent router...");
    const result = await processSwiggyChat(senderID, messageContent);

    const botMessage = new Message({
      senderID: botId,
      receiverID: senderID,
      content: result.reply,
    });
    await botMessage.save();

    const senderSocketId = getReceiverSocketId(senderID.toString());
    if (senderSocketId) {
      io.to(senderSocketId).emit("newMessage", botMessage);
    }

    const elapsed = Date.now() - startTime;
    console.log("──────────────────────────────────────────────────────────");
    console.log(`📤 RESPONSE SENT TO FRONTEND (${elapsed}ms)`);
    console.log(`📋 Tools Used:   ${result.toolsUsed ? "✅ Yes" : "❌ No (general chat)"}`);
    console.log(`📡 Socket:       ${senderSocketId ? "✅ Delivered via socket" : "⚠️ User offline — saved to DB only"}`);
    console.log(`💬 Response Preview:`);
    console.log(`   "${result.reply.substring(0, 200)}${result.reply.length > 200 ? '...' : ''}"`);
    console.log("══════════════════════════════════════════════════════════\n");

    return { success: true, reply: result.reply, botMessage };
  } catch (err) {
    console.error("──────────────────────────────────────────────────────────");
    console.error(`❌ ERROR: ${err.message}`);

    const errorReply = "😅 Something went wrong. Please try again!";
    const errorMessage = new Message({
      senderID: botId,
      receiverID: senderID,
      content: errorReply,
    });
    await errorMessage.save();

    const senderSocketId = getReceiverSocketId(senderID.toString());
    if (senderSocketId) {
      io.to(senderSocketId).emit("newMessage", errorMessage);
    }

    const elapsed = Date.now() - startTime;
    console.log(`📤 ERROR RESPONSE SENT (${elapsed}ms)`);
    console.log("══════════════════════════════════════════════════════════\n");

    return { success: false, reply: errorReply, botMessage: errorMessage };
  }
}

/**
 * Get Swiggy bot status
 */
async function getSwiggyBotStatus(req, res) {
  try {
    const groqStatus = await checkOllamaStatus();
    const botId = await getSwiggyBotId();
    const userId = req.user?._id;
    const connected = userId ? await isUserConnected(userId) : false;

    res.status(200).json({
      bot: { exists: !!botId, id: botId },
      ai: groqStatus,
      swiggyAuth: { connected },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * Clear all Swiggy chat messages from DB
 */
async function clearSwiggyHistory(req, res) {
  try {
    const userId = req.user._id;
    const botId = await getSwiggyBotId();

    if (botId) {
      const deleteResult = await Message.deleteMany({
        $or: [
          { senderID: userId, receiverID: botId },
          { senderID: botId, receiverID: userId },
        ],
      });
      console.log(`🗑️ Cleared ${deleteResult.deletedCount} Swiggy messages for user ${userId}`);
    }

    res.status(200).json({ message: "Swiggy chat history cleared", success: true });
  } catch (err) {
    console.error("Error clearing Swiggy history:", err.message);
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  handleSwiggyBotMessage,
  getSwiggyBotStatus,
  clearSwiggyHistory,
};
