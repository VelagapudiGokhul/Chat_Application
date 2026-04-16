const dotenv = require("dotenv");
const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser")
const bodyParser = require('body-parser');
const authRoute = require("./router/authRoute")
const messageRoute = require("./router/messageRoute")
const groupRoute = require("./router/groupRoute")

const { io, app, server } = require("./socket/socket");

dotenv.config()


app.use(bodyParser.json({ limit: '50mb' }));  
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));  

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const cors = require("cors");
const corsOptions = {
    origin: "http://localhost:3000", 
    credentials: true, 
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], 
    allowedHeaders: ["Content-Type", "Authorization"], 
};
app.use(cors(corsOptions));


app.use('/api/authRoute', authRoute);
app.use('/api/messageRoute', messageRoute);
app.use('/api/groupRoute', groupRoute);

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("Connected to MongoDB");
    })
    .catch((err) => {
        console.error("MongoDB connection error:", err);
    });

server.listen(process.env.PORT,()=>{
    console.log("Server is running in the port:" + process.env.PORT);
})
