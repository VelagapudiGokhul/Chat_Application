const mongoose = require("mongoose");

const swiggyAuthSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  // PKCE flow
  codeVerifier: { type: String, default: null },
  codeChallenge: { type: String, default: null },
  // OAuth tokens
  accessToken: { type: String, default: null },
  refreshToken: { type: String, default: null },
  tokenType: { type: String, default: "Bearer" },
  expiresAt: { type: Date, default: null },
  // Connection state
  isConnected: { type: Boolean, default: false },
  connectedAt: { type: Date, default: null },
  lastUsedAt: { type: Date, default: null },
}, {
  versionKey: false,
  timestamps: true,
});

const SwiggyAuth = mongoose.model("SwiggyAuth", swiggyAuthSchema);

module.exports = SwiggyAuth;
