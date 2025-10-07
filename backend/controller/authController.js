const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cloudinary = require('../config/cloudinary');
const User = require("../model/userSchema");
const { v4: uuidv4 } = require("uuid");
const sendOTPEmail = require("../utils/mailer");

let otps = {};

const JWT_SECRET = process.env.JWT_SECRET;

exports.signup = async (req, res) => {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const check = await User.findOne({ email });

        if (check) {
            return res.json("email already exists");
        }

        const otp = uuidv4().slice(0, 6);
        otps[email] = otp;

        sendOTPEmail(email, otp);

        const data = {
            username,
            email,
            password: hashedPassword,
            profilepic: "",
        };

        otps[email] = { otp, data };
        return res.json({ message: "OTP sent", email });

    } catch (e) {
        return res.status(500).json({ message: "Internal Server Error", error: e });
    }
};

exports.verifyOTP = async (req, res) => {
    const { email, otp } = req.body;

    if (otps[email] && otps[email].otp === otp) {
        const userData = otps[email].data;
        const newUser = await User.create(userData);
        delete otps[email];

        return res.status(201).json({
            _id: newUser._id,
            username: newUser.username,
            email: newUser.email,
            profilepic: newUser.profilepic,
        });
    } else {
        return res.status(400).json("Invalid OTP");
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (user) {
            const validPassword = await bcrypt.compare(password, user.password);
            
            if (validPassword) {
                const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "24h" });

                res.cookie("token", token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV !== "production",
                    sameSite: "Strict",
                    maxAge: 5 * 60 * 60 * 1000,
                });
                return res.json({
                    message: "Login successful",
                    user: { _id: user._id, username: user.username, email: user.email },
                });
            } else {
                return res.json("Invalid credentials");
            }
        } else {
            return res.status(404).json({ message: "User does not exist" });
        }
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: "Login server error" });
    }
};

exports.logout = (req, res) => {
    try {
        res.cookie("token", "", { maxAge: 0 });
        return res.status(200).json({ message: "Logged out successfully" });
    } catch (e) {
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

exports.updateProfile = async (req, res) => {
    const { userId, username, email, password, pic } = req.body;

    if (!userId || (!username && !email && !password && !pic)) {
        return res.status(400).json({ message: "At least one field is required to update" });
    }

    try {
        let updateFields = {};

        if (pic) {
            const uploadpic = await cloudinary.uploader.upload(pic);
            updateFields.profilepic = uploadpic.secure_url;
        }

        if (username) updateFields.username = username;
        if (email) updateFields.email = email;
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateFields.password = hashedPassword;
        }

        const updatedUser = await User.findByIdAndUpdate(userId, updateFields, { new: true });

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            message: "Profile updated successfully",
            user: updatedUser,
        });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: "Error updating profile", error: e.message });
    }
};

exports.verifyAuth = async (req, res) => {
    try {
        res.status(200).json(req.user);
      } catch (e) {
        console.log("Authentication Error", e.message);
        res.status(500).json({ message: "Internal Server Error" });
      }
};