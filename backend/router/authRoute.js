const express = require("express");
const authController = require("../controller/authController");
const User = require("../model/userSchema");
const verifyToken = require("../middleware/authMiddleware");
const authRoute = express.Router();

authRoute.get("/userSchema", (req, res) => {
    User.find()
        .then((data) => {
            res.json(data);
        })
        .catch((err) => {
            res.status(400).json({ error: err });
        });
});

authRoute.post("/signup", authController.signup);

authRoute.post("/verify-otp", authController.verifyOTP);

authRoute.post("/login", authController.login);

authRoute.post("/logout", authController.logout);

authRoute.post("/update-profile", verifyToken, authController.updateProfile);

authRoute.get("/verify-auth", verifyToken, authController.verifyAuth);

module.exports = authRoute;

