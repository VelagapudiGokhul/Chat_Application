require("dotenv").config();
const { processSwiggyChat } = require("./services/ollamaService");
const mongoose = require("mongoose");

async function main() {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb+srv://mcp:mcppassword@cluster0.z5iwe.mongodb.net/chat_app?retryWrites=true&w=majority&appName=Cluster0");
  
  const userId = "6786828e0485354d43b39fd3"; // Replace with valid user if needed
  
  console.log("Sending query...");
  // Force it to use search_restaurants_dineout with addressId 12345
  const response = await processSwiggyChat(userId, "I want to book a table for butter chicken at locality using addressId 12345. My coordinates are 12.8924, 80.2015", []);
  console.log("Response:", response);
  
  process.exit(0);
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
