require("dotenv").config();
const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const { StreamableHTTPClientTransport } = require("@modelcontextprotocol/sdk/client/streamableHttp.js");
const { getValidToken } = require("./services/swiggyAuthService.js");

async function main() {
  // get a valid token for some user, say user b39fd3 from the logs.
  // actually wait, I can just require mcpClient and look at the schema.
  // Or I can just simulate it. 
  // Let me just print the tools from mcpClient.
  const { getUserMCPClients } = require("./services/mcpClient.js");
  const mongoose = require("mongoose");
  
  await mongoose.connect(process.env.MONGODB_URI || "mongodb+srv://mcp:mcppassword@cluster0.z5iwe.mongodb.net/chat_app?retryWrites=true&w=majority&appName=Cluster0");
  
  const userId = "6786828e0485354d43b39fd3"; // From the logs
  const clients = await getUserMCPClients(userId);
  if (!clients) {
    console.log("No clients found");
    process.exit(1);
  }
  
  const tool = clients.toolsMap["search_restaurants_dineout"];
  console.log("ORIGINAL SCHEMA:", JSON.stringify(tool.toolDef.inputSchema, null, 2));
  console.log("-------------------");
  const simplified = clients.allTools.find(t => t.function.name === "search_restaurants_dineout");
  console.log("SIMPLIFIED SCHEMA:", JSON.stringify(simplified.function.parameters, null, 2));
  
  process.exit(0);
}

main().catch(console.error);
