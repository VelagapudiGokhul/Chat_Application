require("dotenv").config();
const { getUserMCPClients } = require("./services/mcpClient.js");
const mongoose = require("mongoose");
const fs = require("fs");

async function main() {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb+srv://mcp:mcppassword@cluster0.z5iwe.mongodb.net/chat_app?retryWrites=true&w=majority&appName=Cluster0");
  
  const userId = "6786828e0485354d43b39fd3"; // From the logs
  const clients = await getUserMCPClients(userId);
  
  fs.writeFileSync("tools_dump.json", JSON.stringify(clients.allTools, null, 2));
  console.log("Dumped tools to tools_dump.json");
  
  process.exit(0);
}

main().catch(console.error);
