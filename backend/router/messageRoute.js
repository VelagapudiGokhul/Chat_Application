const express = require("express");
const messageController = require("../controller/messageController");
const Messsage = require("../model/messageSchema");
const verifyToken = require("../middleware/authMiddleware");
const messageRoute = express.Router();

messageRoute.get("/messageSchema", (req, res) => {
    Messsage.find()
        .then((data) => {
            res.json(data);
        })
        .catch((err) => {
            res.status(400).json({ error: err });
        });
});

messageRoute.get("/users", verifyToken, messageController.allUsers);

messageRoute.get("/:id", verifyToken, messageController.getMessages);

messageRoute.post("/sendMessage/:id", verifyToken, messageController.sendMessage);

module.exports = messageRoute;