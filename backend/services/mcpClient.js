const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const { StreamableHTTPClientTransport } = require("@modelcontextprotocol/sdk/client/streamableHttp.js");
const { getValidToken } = require("./swiggyAuthService");

// Swiggy MCP Server URLs
const SWIGGY_MCP_SERVERS = {
  food: "https://mcp.swiggy.com/food",
  instamart: "https://mcp.swiggy.com/im",
  dineout: "https://mcp.swiggy.com/dineout",
};

// Cache of per-user MCP clients: userId -> { clients, tools, toolsMap, timestamp }
const userClientCache = new Map();
const CLIENT_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Simplify a JSON Schema for Groq/LLM consumption.
 * 
 * CRITICAL: Converts "number" and "integer" types to "string" because
 * Groq strictly validates tool args and models often wrap numbers in quotes.
 * We convert strings back to numbers in sanitizeToolArgs() before calling MCP.
 * 
 * Also stores the original types so we can coerce them back.
 */
function simplifySchema(schema) {
  if (!schema || typeof schema !== "object") {
    return { type: "object", properties: {} };
  }

  const simplified = { type: "object" };

  if (schema.properties) {
    simplified.properties = {};
    for (const [key, prop] of Object.entries(schema.properties)) {
      const originalType = prop.type || "string";

      let isNumber = false;
      if (Array.isArray(originalType)) {
        isNumber = originalType.includes("number") || originalType.includes("integer");
      } else {
        isNumber = originalType === "number" || originalType === "integer";
      }

      const safeType = isNumber ? "string" : originalType;

      const simpleProp = { type: safeType };
      
      // Add description noting it should be a number (helps model output correct format)
      if (originalType === "number" || originalType === "integer") {
        simpleProp.description = prop.description 
          ? `${prop.description.substring(0, 50)} (numeric value)` 
          : `Numeric value`;
      } else if (prop.description && prop.description.length < 80) {
        simpleProp.description = prop.description;
      }

      // Keep enums
      if (prop.enum) {
        simpleProp.enum = prop.enum;
      }

      // Keep default values
      if (prop.default !== undefined) {
        simpleProp.default = prop.default;
      }

      simplified.properties[key] = simpleProp;
    }
  }

  if (schema.required && Array.isArray(schema.required)) {
    simplified.required = schema.required;
  }

  return simplified;
}

/**
 * Sanitize and coerce tool arguments before calling MCP.
 * Converts string values back to numbers/integers based on the original MCP schema.
 */
function sanitizeToolArgs(args, toolSchema) {
  if (!args || typeof args !== "object") return args || {};

  const cleaned = {};
  const properties = toolSchema?.inputSchema?.properties || {};

  for (const [key, value] of Object.entries(args)) {
    // Skip hallucinated schema descriptions
    if (typeof value === "string" && (
      value.includes('"type":') ||
      value.includes('"description":') ||
      value.startsWith('{"type"')
    )) {
      console.warn(`  ⚠️  Skipping hallucinated schema arg: ${key}`);
      continue;
    }

    const propDef = properties[key];

    // Coerce strings to numbers if the original MCP schema expects a number
    if (propDef && (propDef.type === "number" || propDef.type === "integer") && typeof value === "string") {
      const num = propDef.type === "integer" ? parseInt(value, 10) : parseFloat(value);
      if (!isNaN(num)) {
        cleaned[key] = num;
        continue;
      }
    }

    // Coerce strings to numbers if the value looks numeric (catch-all for lat/lng etc.)
    if (typeof value === "string" && /^-?\d+\.?\d*$/.test(value.trim())) {
      const num = parseFloat(value);
      if (!isNaN(num)) {
        // Check if the key name suggests it should be a number
        const numericKeys = ["latitude", "longitude", "lat", "lng", "price", "quantity", "count", "limit", "offset", "page"];
        if (numericKeys.some(nk => key.toLowerCase().includes(nk))) {
          cleaned[key] = num;
          continue;
        }
      }
    }

    // Fix open-source LLM snake_case hallucinations for common parameters like menu_item_id
    let finalValue = value;
    if (key === "cartItems" && Array.isArray(value)) {
      finalValue = value.map(item => {
        const newItem = { ...item };
        if (newItem.menu_item_id && !newItem.menuItemId) {
          newItem.menuItemId = newItem.menu_item_id;
          delete newItem.menu_item_id;
        }
        return newItem;
      });
    }

    cleaned[key] = finalValue;
  }

  return cleaned;
}

/**
 * Create MCP clients for a specific user using their Swiggy OAuth token.
 */
async function createUserClients(userId) {
  const accessToken = await getValidToken(userId);
  if (!accessToken) {
    return null;
  }

  const clients = {};
  const toolsMap = {};
  const allTools = [];

  for (const [service, url] of Object.entries(SWIGGY_MCP_SERVERS)) {
    try {
      const client = new Client({
        name: `swiggy-${service}-${userId}`,
        version: "1.0.0",
      });

      const transport = new StreamableHTTPClientTransport(new URL(url), {
        requestInit: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      });

      await client.connect(transport);
      clients[service] = client;

      // Discover tools
      const { tools } = await client.listTools();
      console.log(`✅ [User ${userId.toString().slice(-6)}] Swiggy ${service}: ${tools.length} tools`);

      for (const tool of tools) {
        toolsMap[tool.name] = { client, toolDef: tool, service };

        // Simplify the schema for Ollama (small models get confused by verbose schemas)
        const simplifiedParams = simplifySchema(tool.inputSchema);

        allTools.push({
          type: "function",
          function: {
            name: tool.name,
            // Keep description short — max 120 chars
            description: (tool.description || `Swiggy ${service}: ${tool.name}`).substring(0, 120),
            parameters: simplifiedParams,
          },
        });
      }
    } catch (err) {
      console.error(`❌ [User ${userId.toString().slice(-6)}] Swiggy ${service}:`, err.message);
    }
  }

  if (allTools.length === 0) {
    return null;
  }

  const entry = {
    clients,
    toolsMap,
    allTools,
    timestamp: Date.now(),
  };

  userClientCache.set(userId.toString(), entry);
  return entry;
}

/**
 * Get or create MCP clients for a user.
 */
async function getUserMCPClients(userId) {
  const key = userId.toString();
  const cached = userClientCache.get(key);

  if (cached && Date.now() - cached.timestamp < CLIENT_CACHE_TTL) {
    return cached;
  }

  return await createUserClients(userId);
}

/**
 * Call an MCP tool for a specific user.
 * Validates and sanitizes arguments before calling.
 */
async function callToolForUser(userId, toolName, args) {
  const userClients = await getUserMCPClients(userId);
  if (!userClients) {
    return { error: "Not connected to Swiggy. Please authenticate first." };
  }

  const mapping = userClients.toolsMap[toolName];
  if (!mapping) {
    return { error: `Tool '${toolName}' not found` };
  }

  // Sanitize arguments — fix small-model hallucination issues
  const cleanArgs = sanitizeToolArgs(args, mapping.toolDef);
  console.log(`  ✅ Sanitized args for ${toolName}:`, JSON.stringify(cleanArgs).substring(0, 200));

  try {
    const result = await mapping.client.callTool({
      name: toolName,
      arguments: cleanArgs,
    });

    if (result.content && Array.isArray(result.content)) {
      return result.content
        .map((item) => (item.type === "text" ? item.text : JSON.stringify(item)))
        .join("\n");
    }
    return JSON.stringify(result);
  } catch (err) {
    console.error(`Error calling tool '${toolName}':`, err.message);
    return { error: `Tool call failed: ${err.message}` };
  }
}

/**
 * Get Ollama-compatible tools list for a user.
 */
async function getToolsForUser(userId) {
  const userClients = await getUserMCPClients(userId);
  return userClients?.allTools || [];
}

/**
 * Clear cached MCP clients for a user (on logout).
 */
function clearUserClients(userId) {
  const key = userId.toString();
  const cached = userClientCache.get(key);
  if (cached) {
    for (const client of Object.values(cached.clients)) {
      try {
        client.close();
      } catch (e) {
        // Ignore close errors
      }
    }
    userClientCache.delete(key);
  }
}

/**
 * Get list of all available tool names for a user (for intent routing).
 */
async function getToolNames(userId) {
  const userClients = await getUserMCPClients(userId);
  if (!userClients) return [];
  return Object.keys(userClients.toolsMap);
}

/**
 * Find a tool name that matches a partial string.
 */
async function findToolByName(userId, partialName) {
  const names = await getToolNames(userId);
  return names.find(n => n.toLowerCase().includes(partialName.toLowerCase())) || null;
}

module.exports = {
  getUserMCPClients,
  callToolForUser,
  getToolsForUser,
  getToolNames,
  findToolByName,
  clearUserClients,
  SWIGGY_MCP_SERVERS,
};
