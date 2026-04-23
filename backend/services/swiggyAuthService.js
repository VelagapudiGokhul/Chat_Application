const crypto = require("crypto");
const axios = require("axios");
const SwiggyAuth = require("../model/swiggyAuthSchema");

// Swiggy MCP OAuth Config
const SWIGGY_AUTH_BASE = "https://mcp.swiggy.com/auth";
const SWIGGY_CLIENT_ID = "swiggy-mcp";
const CALLBACK_URL = "http://localhost:5000/api/swiggyRoute/oauth/callback";

/**
 * Generate PKCE code_verifier and code_challenge (S256)
 */
function generatePKCE() {
  // code_verifier: 43-128 chars, unreserved URI chars
  const verifier = crypto.randomBytes(32).toString("base64url");

  // code_challenge: base64url(sha256(code_verifier))
  const challenge = crypto
    .createHash("sha256")
    .update(verifier)
    .digest("base64url");

  return { verifier, challenge };
}

/**
 * Build the Swiggy OAuth authorization URL for a user.
 * Generates PKCE pair and stores it for later verification.
 */
async function getAuthUrl(userId) {
  const { verifier, challenge } = generatePKCE();

  // Store PKCE verifier for this user (upsert)
  await SwiggyAuth.findOneAndUpdate(
    { userId },
    {
      userId,
      codeVerifier: verifier,
      codeChallenge: challenge,
      isConnected: false,
    },
    { upsert: true, new: true }
  );

  // Build the authorization URL
  const params = new URLSearchParams({
    response_type: "code",
    client_id: SWIGGY_CLIENT_ID,
    code_challenge: challenge,
    code_challenge_method: "S256",
    redirect_uri: CALLBACK_URL,
    state: userId.toString(), // Pass userId in state to identify user on callback
  });

  return `${SWIGGY_AUTH_BASE}/authorize?${params.toString()}`;
}

/**
 * Exchange the authorization code for tokens.
 * Called after Swiggy redirects back to our callback.
 */
async function exchangeCodeForTokens(code, userId) {
  // Retrieve stored PKCE verifier
  const authRecord = await SwiggyAuth.findOne({ userId });
  if (!authRecord || !authRecord.codeVerifier) {
    throw new Error("No PKCE verifier found. Please initiate auth flow again.");
  }

  try {
    // Exchange code for tokens at Swiggy's token endpoint
    const response = await axios.post(
      `${SWIGGY_AUTH_BASE}/token`,
      new URLSearchParams({
        grant_type: "authorization_code",
        client_id: SWIGGY_CLIENT_ID,
        code: code,
        code_verifier: authRecord.codeVerifier,
        redirect_uri: CALLBACK_URL,
      }).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const { access_token, refresh_token, token_type, expires_in } = response.data;

    // Calculate expiry
    const expiresAt = expires_in
      ? new Date(Date.now() + expires_in * 1000)
      : new Date(Date.now() + 3600 * 1000); // Default 1 hour

    // Store tokens
    await SwiggyAuth.findOneAndUpdate(
      { userId },
      {
        accessToken: access_token,
        refreshToken: refresh_token || null,
        tokenType: token_type || "Bearer",
        expiresAt,
        isConnected: true,
        connectedAt: new Date(),
        codeVerifier: null, // Clear verifier after use
        codeChallenge: null,
      }
    );

    console.log(`🔑 Swiggy tokens saved for user ${userId}`);
    return true;
  } catch (err) {
    console.error("Token exchange error:", err.response?.data || err.message);
    throw new Error(
      `Token exchange failed: ${err.response?.data?.error_description || err.message}`
    );
  }
}

/**
 * Refresh an expired access token using the refresh token.
 */
async function refreshTokens(userId) {
  const authRecord = await SwiggyAuth.findOne({ userId });
  if (!authRecord || !authRecord.refreshToken) {
    return false;
  }

  try {
    const response = await axios.post(
      `${SWIGGY_AUTH_BASE}/token`,
      new URLSearchParams({
        grant_type: "refresh_token",
        client_id: SWIGGY_CLIENT_ID,
        refresh_token: authRecord.refreshToken,
      }).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const { access_token, refresh_token, expires_in } = response.data;

    const expiresAt = expires_in
      ? new Date(Date.now() + expires_in * 1000)
      : new Date(Date.now() + 3600 * 1000);

    await SwiggyAuth.findOneAndUpdate(
      { userId },
      {
        accessToken: access_token,
        refreshToken: refresh_token || authRecord.refreshToken,
        expiresAt,
        isConnected: true,
      }
    );

    console.log(`🔄 Swiggy tokens refreshed for user ${userId}`);
    return true;
  } catch (err) {
    console.error("Token refresh error:", err.response?.data || err.message);
    // Mark as disconnected on refresh failure
    await SwiggyAuth.findOneAndUpdate({ userId }, { isConnected: false });
    return false;
  }
}

/**
 * Get a valid access token for a user (auto-refreshing if expired).
 */
async function getValidToken(userId) {
  const authRecord = await SwiggyAuth.findOne({ userId });
  if (!authRecord || !authRecord.accessToken) {
    return null;
  }

  // Check if token is expired (with 5 minute buffer)
  if (authRecord.expiresAt && new Date(authRecord.expiresAt) < new Date(Date.now() + 5 * 60 * 1000)) {
    const refreshed = await refreshTokens(userId);
    if (!refreshed) return null;

    // Re-fetch after refresh
    const updated = await SwiggyAuth.findOne({ userId });
    return updated?.accessToken || null;
  }

  // Update last used
  await SwiggyAuth.findOneAndUpdate({ userId }, { lastUsedAt: new Date() });
  return authRecord.accessToken;
}

/**
 * Check if a user is connected to Swiggy.
 */
async function isUserConnected(userId) {
  const auth = await SwiggyAuth.findOne({ userId });
  return auth?.isConnected === true && !!auth?.accessToken;
}

/**
 * Disconnect a user from Swiggy (logout).
 */
async function disconnectUser(userId) {
  await SwiggyAuth.findOneAndUpdate(
    { userId },
    {
      accessToken: null,
      refreshToken: null,
      isConnected: false,
      codeVerifier: null,
      codeChallenge: null,
      expiresAt: null,
    }
  );
  console.log(`🔌 User ${userId} disconnected from Swiggy`);
}

module.exports = {
  getAuthUrl,
  exchangeCodeForTokens,
  getValidToken,
  isUserConnected,
  disconnectUser,
  refreshTokens,
  CALLBACK_URL,
};
