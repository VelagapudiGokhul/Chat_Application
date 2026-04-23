const express = require("express");
const verifyToken = require("../middleware/authMiddleware");
const { getSwiggyBotStatus, clearSwiggyHistory } = require("../controller/swiggyController");
const {
  getAuthUrl,
  exchangeCodeForTokens,
  isUserConnected,
  disconnectUser,
} = require("../services/swiggyAuthService");
const { clearUserClients } = require("../services/mcpClient");

const swiggyRoute = express.Router();

// ── Status Endpoints ──

// Get bot status + user's Swiggy auth status
swiggyRoute.get("/status", verifyToken, getSwiggyBotStatus);

// Check current user's Swiggy connection
swiggyRoute.get("/auth-status", verifyToken, async (req, res) => {
  try {
    const connected = await isUserConnected(req.user._id);
    res.json({ connected, userId: req.user._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Chat Endpoints ──

// Clear conversation history with the bot
swiggyRoute.post("/clear-history", verifyToken, clearSwiggyHistory);

// ── OAuth Flow ──

// Step 1: Get the Swiggy auth URL for the current user
swiggyRoute.get("/auth/connect", verifyToken, async (req, res) => {
  try {
    const authUrl = await getAuthUrl(req.user._id);
    res.json({ authUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Step 2: OAuth callback — Swiggy redirects here after user logs in
swiggyRoute.get("/oauth/callback", async (req, res) => {
  const { code, state } = req.query;

  if (!code) {
    return res.status(400).send(renderAuthPage(
      "error",
      "Authentication Failed",
      "No authorization code received. Please try again from the chat app."
    ));
  }

  // 'state' contains the userId
  const userId = state;
  if (!userId) {
    return res.status(400).send(renderAuthPage(
      "error",
      "Authentication Failed",
      "Missing user state. Please try connecting again from the chat app."
    ));
  }

  try {
    await exchangeCodeForTokens(code, userId);

    return res.send(renderAuthPage(
      "success",
      "Swiggy Connected! 🎉",
      "Your Swiggy account is now linked. You can close this tab and go back to the chat app to start ordering food!"
    ));
  } catch (err) {
    console.error("OAuth callback error:", err.message);
    return res.status(500).send(renderAuthPage(
      "error",
      "Connection Failed",
      `Could not complete authentication: ${err.message}. Please try again.`
    ));
  }
});

// Disconnect from Swiggy (logout)
swiggyRoute.post("/auth/disconnect", verifyToken, async (req, res) => {
  try {
    await disconnectUser(req.user._id);
    clearUserClients(req.user._id);
    res.json({ message: "Disconnected from Swiggy", connected: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Render a styled HTML page for OAuth callback results.
 */
function renderAuthPage(type, title, message) {
  const isSuccess = type === "success";
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', system-ui, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
      color: white;
    }
    .card {
      text-align: center;
      padding: 48px 40px;
      background: rgba(255,255,255,0.06);
      border-radius: 28px;
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255,255,255,0.1);
      max-width: 420px;
      box-shadow: 0 24px 48px rgba(0,0,0,0.3);
    }
    .icon { font-size: 72px; margin-bottom: 20px; }
    h1 {
      font-size: 24px;
      font-weight: 800;
      margin-bottom: 12px;
      color: ${isSuccess ? '#ff6f3c' : '#ff4757'};
    }
    p {
      color: #a0a0b8;
      font-size: 15px;
      line-height: 1.6;
      margin-bottom: 28px;
    }
    .btn {
      display: inline-block;
      padding: 12px 32px;
      border-radius: 14px;
      font-weight: 600;
      font-size: 14px;
      text-decoration: none;
      transition: all 0.2s;
      cursor: pointer;
      border: none;
    }
    .btn-primary {
      background: linear-gradient(135deg, #ff6f3c, #ff9a3c);
      color: white;
    }
    .btn-primary:hover { transform: scale(1.03); box-shadow: 0 8px 24px rgba(255,111,60,0.3); }
    .hint {
      margin-top: 20px;
      font-size: 12px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${isSuccess ? '🎉' : '❌'}</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <button class="btn btn-primary" onclick="window.close()">Close Tab</button>
    <p class="hint">This tab will auto-close in 5 seconds...</p>
  </div>
  <script>setTimeout(() => { window.close(); }, 5000);</script>
</body>
</html>`;
}

module.exports = swiggyRoute;
