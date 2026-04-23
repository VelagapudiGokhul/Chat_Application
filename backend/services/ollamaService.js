const Groq = require("groq-sdk");
const { callToolForUser, getToolNames, findToolByName } = require("./mcpClient");
const { isUserConnected } = require("./swiggyAuthService");

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

const groq = new Groq({ apiKey: GROQ_API_KEY });

// ══════════════════════════════════════════════════
// SIMPLE 3-QUERY INTENT ROUTER
// No multi-step agent loops. No conversation history.
// Each message = ONE intent = ONE tool call = ONE response.
//
// 1. "see [item]"    → search_menu → restaurants + ratings
// 2. "cart [item]"   → update_food_cart → confirm added
// 3. "book"          → place_order → confirm order
// ══════════════════════════════════════════════════

/**
 * Parse user intent from message. Returns { intent, itemName }.
 */
function parseIntent(message) {
  const msg = message.trim().toLowerCase();

  // Intent: SEE / SEARCH items
  const seePatterns = [
    /^see\s+(.+)/i,
    /^search\s+(.+)/i,
    /^find\s+(.+)/i,
    /^show\s+(.+)/i,
    /^look\s*(?:for)?\s+(.+)/i,
    /^(?:i\s+want|give\s+me|get\s+me)\s+(.+)/i,
    /^(.+?)\s+(?:restaurants?|near\s+me|available)/i,
  ];

  for (const pattern of seePatterns) {
    const match = msg.match(pattern);
    if (match) {
      return { intent: "see", itemName: match[1].trim() };
    }
  }

  // Intent: CART / ADD to cart
  const cartPatterns = [
    /^cart\s+(.+)/i,
    /^add\s+(.+?)(?:\s+to\s+cart)?$/i,
    /^add\s+to\s+cart\s+(.+)/i,
  ];

  for (const pattern of cartPatterns) {
    const match = msg.match(pattern);
    if (match) {
      return { intent: "cart", itemName: match[1].trim() };
    }
  }

  // Intent: BOOK / ORDER
  if (/^(book|order|place\s+order|confirm|checkout|buy)/i.test(msg)) {
    return { intent: "book", itemName: null };
  }

  // No match — treat as general chat
  return { intent: "chat", itemName: msg };
}

/**
 * Process user message — SIMPLE 3-query flow, no history, no multi-call.
 */
async function processSwiggyChat(senderUserId, userMessage, _conversationHistory = []) {
  const connected = await isUserConnected(senderUserId);
  if (!connected) {
    return {
      reply: "🔐 Connect your Swiggy account first! Click **Connect Swiggy** in the header.",
      toolsUsed: false,
    };
  }

  const { intent, itemName } = parseIntent(userMessage);
  console.log(`🎯 Intent:       ${intent.toUpperCase()}`);
  console.log(`🏷️  Item:         ${itemName || "—"}`);
  console.log("──────────────────────────────────────────────────────────");

  try {
    let result;
    switch (intent) {
      case "see":
        result = await handleSeeItems(senderUserId, itemName);
        break;
      case "cart":
        result = await handleCartItem(senderUserId, itemName);
        break;
      case "book":
        result = await handleBookOrder(senderUserId);
        break;
      default:
        result = await handleGeneralChat(userMessage);
        break;
    }
    return result;
  } catch (err) {
    console.error(`❌ Error handling ${intent}:`, err.message);
    return {
      reply: `😅 Something went wrong: ${err.message}. Please try again!`,
      toolsUsed: false,
      error: err.message,
    };
  }
}

// ══════════════════════════════════════════════════
// INTENT HANDLERS — Each makes exactly ONE tool call
// ══════════════════════════════════════════════════

/**
 * Helper to fetch a valid addressId for the user using get_addresses tool
 */
async function getDefaultAddressId(userId) {
  try {
    const getAddrTool = await findToolByName(userId, "get_addresses") || await findToolByName(userId, "get_address");
    if (!getAddrTool) return null;
    
    console.log("📍 Fetching user addresses to get a valid addressId...");
    const addrResult = await callToolForUser(userId, getAddrTool, {});
    const addrStr = typeof addrResult === "string" ? addrResult : JSON.stringify(addrResult);
    
    // Look for common ID patterns
    const matchIdStr = addrStr.match(/"id"\s*:\s*"([^"]+)"/);
    const matchIdNum = addrStr.match(/"id"\s*:\s*(\d+)/);
    const matchAddrIdStr = addrStr.match(/"address_id"\s*:\s*"([^"]+)"/);
    const matchAddrIdNum = addrStr.match(/"address_id"\s*:\s*(\d+)/);
    
    let addressId = null;
    if (matchIdStr) addressId = matchIdStr[1];
    else if (matchIdNum) addressId = matchIdNum[1];
    else if (matchAddrIdStr) addressId = matchAddrIdStr[1];
    else if (matchAddrIdNum) addressId = matchAddrIdNum[1];
    
    console.log("📍 Extracted addressId:", addressId);
    return addressId;
  } catch (err) {
    console.error("❌ Failed to fetch addressId:", err.message);
    return null;
  }
}

/**
 * INTENT 1: "see [item]" → search for the item → show restaurants + ratings
 */
async function handleSeeItems(userId, itemName) {
  const addressId = await getDefaultAddressId(userId);

  let toolName = null;
  let toolArgs = {};

  // Check if user is asking to see the menu for a specific restaurant ID (e.g., "see 412753" or "see 412753 burger")
  const menuMatch = itemName.match(/^(?:menu\s+)?(\d+)(?:\s+(.+))?$/i);
  if (menuMatch) {
    const rId = parseInt(menuMatch[1], 10);
    const textQuery = menuMatch[2];
    
    if (!textQuery) {
      return { 
        reply: `❌ Swiggy's menu search requires a dish name. \n\n💡 **Try again using:** \`see ${rId} [Dish Name]\`\n*(Example: \`see ${rId} burger\` or \`see ${rId} fries\`)*`,
        toolsUsed: false 
      };
    }

    toolName = await findToolByName(userId, "get_menu") || await findToolByName(userId, "menu") || await findToolByName(userId, "search_menu");
    toolArgs = { restaurantId: rId, query: textQuery };
  } else {
    toolName = await findToolByName(userId, "search_restaurant") 
                 || await findToolByName(userId, "search_menu")
                 || await findToolByName(userId, "search");
    toolArgs = { query: itemName };
  }

  if (!toolName) {
    console.log("❌ No search/menu tool found in MCP tools");
    return { reply: "❌ Search/Menu tool not available. Try reconnecting Swiggy.", toolsUsed: false };
  }

  console.log(`🔍 Tool:         ${toolName}`);
  console.log(`🔍 Args:         ${JSON.stringify(toolArgs)} + addressId: ${addressId}`);

  const result = await callToolForUser(userId, toolName, { 
    ...toolArgs,
    ...(addressId && { addressId })
  });
  
  const rawPreview = typeof result === "string" ? result.substring(0, 300) : JSON.stringify(result).substring(0, 300);
  console.log(`📦 MCP Raw Response (preview):`);
  console.log(`   ${rawPreview}...`);

  if (!result || result.error) {
    console.log(`❌ Tool error: ${result?.error}`);
    return { reply: `❌ Couldn't search for "${itemName}": ${result?.error || "Unknown error"}`, toolsUsed: true };
  }

  console.log("🤖 Formatting with Groq...");
  const formatted = await formatWithGroq(
    `The user asked to see "${itemName}" on Swiggy. Here is the RAW API response.
If the data contains restaurants, extract and display: restaurant names, their **Restaurant ID** (critical), ratings, delivery time. 
If the data contains specific menu items, extract and display: item name, **Menu Item ID** (critical), and price. 
Format as a clean numbered list with emojis. Keep it SHORT and readable.

At the bottom, add these instructions:
💡 **To search a restaurant's menu, type:** \`see [Restaurant ID] [Dish]\` (Example: \`see 412753 burger\`)
💡 **To add an item to your cart, type:** \`cart [Restaurant ID] [Menu Item ID]\` (Example: \`cart 12345 987654\`)
If no results, say so.\n\nRAW DATA:\n${typeof result === "string" ? result.substring(0, 3000) : JSON.stringify(result).substring(0, 3000)}`
  );

  console.log(`✅ Groq formatted response ready (${formatted.length} chars)`);
  return { reply: formatted, toolsUsed: true };
}

/**
 * INTENT 2: "cart [item]" → add item to cart
 */
async function handleCartItem(userId, itemName) {
  const toolName = await findToolByName(userId, "update_food_cart") 
                 || await findToolByName(userId, "add_to_cart")
                 || await findToolByName(userId, "cart");

  if (!toolName) {
    console.log("❌ No cart tool found in MCP tools");
    return { reply: "❌ Cart tool not available. Try reconnecting Swiggy.", toolsUsed: false };
  }

  const addressId = await getDefaultAddressId(userId);

  // Parse optional restaurant ID and menu item ID from "cart 12345 987654"
  let restaurantId = null;
  let cartItems = null;
  let query = itemName;
  
  const matchIds = itemName.match(/^(\d+)\s+(\d+)$/);
  if (matchIds) {
    restaurantId = parseInt(matchIds[1], 10);
    cartItems = [{ menuItemId: parseInt(matchIds[2], 10), quantity: 1 }];
    query = undefined; // Don't send query if we have exact IDs
  } else {
    const matchRestName = itemName.match(/^(\d+)\s+(.+)$/);
    if (matchRestName) {
      restaurantId = parseInt(matchRestName[1], 10);
      query = matchRestName[2];
    }
  }

  if (toolName === "update_food_cart" && !cartItems) {
    return {
      reply: "❌ Swiggy requires exact item IDs to add to the cart. Please search first using `see [item]` and then use the format: `cart [Restaurant ID] [Menu Item ID]` (Example: `cart 12345 987654`).",
      toolsUsed: false
    };
  }

  console.log(`🛒 Tool:         ${toolName}`);
  console.log(`🛒 Args:         { query: "${query || 'none'}", restaurantId: "${restaurantId || 'none'}", cartItems: ${cartItems ? 'provided' : 'none'}, addressId: "${addressId}" }`);

  const args = {
    ...(query && { query }),
    ...(restaurantId && { restaurantId }),
    ...(cartItems && { cartItems }),
    ...(addressId && { addressId })
  };

  const result = await callToolForUser(userId, toolName, args);

  const rawPreview = typeof result === "string" ? result.substring(0, 300) : JSON.stringify(result).substring(0, 300);
  console.log(`📦 MCP Raw Response (preview):`);
  console.log(`   ${rawPreview}...`);

  if (!result || result.error) {
    console.log(`❌ Tool error: ${result?.error}`);
    return { reply: `❌ Couldn't add "${itemName}" to cart: ${result?.error || "Unknown error"}`, toolsUsed: true };
  }

  console.log("🤖 Formatting with Groq...");
  const formatted = await formatWithGroq(
    `The user asked to add "${itemName}" to their Swiggy cart. Here is the API response. Tell the user what was added, the price, and confirm it's in the cart. Be brief and use emojis.\n\nRAW DATA:\n${typeof result === "string" ? result.substring(0, 2000) : JSON.stringify(result).substring(0, 2000)}`
  );

  console.log(`✅ Groq formatted response ready (${formatted.length} chars)`);
  return { reply: formatted, toolsUsed: true };
}

/**
 * INTENT 3: "book" → confirm and place order from cart
 */
async function handleBookOrder(userId) {
  const toolName = await findToolByName(userId, "place_order") 
                 || await findToolByName(userId, "checkout")
                 || await findToolByName(userId, "order");

  if (!toolName) {
    console.log("❌ No order tool found in MCP tools");
    return { reply: "❌ Order tool not available. Try reconnecting Swiggy.", toolsUsed: false };
  }

  const addressId = await getDefaultAddressId(userId);

  console.log(`📦 Tool:         ${toolName}`);
  console.log(`📦 Args:         { addressId: "${addressId}" }`);

  const result = await callToolForUser(userId, toolName, {
    ...(addressId && { addressId })
  });

  const rawPreview = typeof result === "string" ? result.substring(0, 300) : JSON.stringify(result).substring(0, 300);
  console.log(`📦 MCP Raw Response (preview):`);
  console.log(`   ${rawPreview}...`);

  if (!result || result.error) {
    console.log(`❌ Tool error: ${result?.error}`);
    return { reply: `❌ Couldn't place order: ${result?.error || "Unknown error"}`, toolsUsed: true };
  }

  console.log("🤖 Formatting with Groq...");
  const formatted = await formatWithGroq(
    `The user placed an order on Swiggy. Here is the API response. Confirm the order was placed, mention order details if available, delivery time, and payment method (COD). Be celebratory! 🎉\n\nRAW DATA:\n${typeof result === "string" ? result.substring(0, 2000) : JSON.stringify(result).substring(0, 2000)}`
  );

  console.log(`✅ Groq formatted response ready (${formatted.length} chars)`);
  return { reply: formatted, toolsUsed: true };
}

/**
 * General chat — just respond conversationally, no tools.
 */
async function handleGeneralChat(userMessage) {
  console.log("💬 General chat — no tool call needed");
  console.log("🤖 Formatting with Groq...");
  const formatted = await formatWithGroq(
    `You are Swiggy Assistant 🍕. The user said: "${userMessage}". Respond conversationally. If they seem to want food/restaurants, tell them to use:\n• "see [item name]" — to search restaurants\n• "cart [item name]" — to add to cart\n• "book" — to place order\nKeep it brief and friendly.`
  );

  return { reply: formatted, toolsUsed: false };
}

// ══════════════════════════════════════════════════
// GROQ FORMATTER — Only used to make raw data readable
// ══════════════════════════════════════════════════

/**
 * Use Groq to format raw API data into a nice chat message.
 * NO tool calling here — just text formatting.
 */
async function formatWithGroq(prompt) {
  try {
    const response = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        {
          role: "system",
          content: "You are a helpful food assistant. Format the given data into a clean, concise chat message. Use emojis. NEVER invent data — only use what's provided. If data is empty or has errors, say so honestly."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 1024,
    });

    return response.choices[0]?.message?.content || "Couldn't format the response.";
  } catch (err) {
    console.error("Groq format error:", err.message);
    
    if (err.status === 429) {
      return "⏳ AI is rate-limited right now. Here's the raw data — try again in a moment!";
    }
    
    return "😅 Couldn't format the response. Please try again!";
  }
}

/**
 * Check Groq API status
 */
async function checkOllamaStatus() {
  try {
    await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: "hi" }],
      max_tokens: 5,
    });
    return { available: true, provider: "Groq", model: GROQ_MODEL };
  } catch (err) {
    return { available: false, provider: "Groq", error: err.message };
  }
}

module.exports = {
  processSwiggyChat,
  checkOllamaStatus,
};
