const bcrypt = require("bcrypt");
const User = require("../model/userSchema");

const SWIGGY_BOT_EMAIL = "swiggy-bot@chatapp.local";
const SWIGGY_BOT_USERNAME = "Swiggy Assistant 🍕";
const SWIGGY_BOT_PROFILE_PIC = ""; // Will be set via generated image

/**
 * Creates or finds the Swiggy Bot user in the database.
 * Called on server startup to ensure the bot is always available.
 */
async function ensureSwiggyBotUser() {
  try {
    let botUser = await User.findOne({ email: SWIGGY_BOT_EMAIL });

    if (!botUser) {
      // Create the bot user with a random password (it won't be used for login)
      const randomPassword = require("crypto").randomBytes(32).toString("hex");
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      botUser = await User.create({
        username: SWIGGY_BOT_USERNAME,
        email: SWIGGY_BOT_EMAIL,
        password: hashedPassword,
        profilepic: "",
        isBot: true,
        botType: "swiggy",
      });

      console.log("🤖 Swiggy Bot user created successfully! ID:", botUser._id);
    } else {
      // Update bot flag if it wasn't set before
      if (!botUser.isBot) {
        botUser.isBot = true;
        botUser.botType = "swiggy";
        await botUser.save();
      }
      console.log("🤖 Swiggy Bot user found. ID:", botUser._id);
    }

    return botUser;
  } catch (err) {
    console.error("❌ Error creating Swiggy Bot user:", err.message);
    return null;
  }
}

/**
 * Get the Swiggy Bot user ID
 */
async function getSwiggyBotId() {
  const bot = await User.findOne({ email: SWIGGY_BOT_EMAIL, isBot: true });
  return bot?._id?.toString() || null;
}

/**
 * Check if a given user ID belongs to the Swiggy Bot
 */
async function isSwiggyBot(userId) {
  const bot = await User.findOne({ _id: userId, isBot: true, botType: "swiggy" });
  return !!bot;
}

module.exports = {
  ensureSwiggyBotUser,
  getSwiggyBotId,
  isSwiggyBot,
  SWIGGY_BOT_EMAIL,
};
