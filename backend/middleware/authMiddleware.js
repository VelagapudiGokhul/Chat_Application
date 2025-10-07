const jwt = require("jsonwebtoken");
const User = require("../model/userSchema");
const dotenv = require("dotenv");

dotenv.config()

const SECRET_KEY = process.env.JWT_SECRET
const verifyToken = async (req, res, next) => {
 
    try {
        const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
        
        if (!token) {
            return res.status(403).send({ message: "No Token found" });
        }
        
        const decoded = jwt.verify(token, SECRET_KEY); 
        
        if (!decoded) {
            return res.status(403).send({ message: "Invalid Token" });
        }

        req.user = await User.findById(decoded.userId).select("-password"); 
        
        next();
    } catch (e) {
        return res.status(401).send({ message: "Middleware Error", error: e.message });
    }
};

module.exports = verifyToken;
