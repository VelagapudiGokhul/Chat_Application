const nodemailer = require('nodemailer');
const dotenv = require("dotenv");
dotenv.config()

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'velagapudigokhul26@gmail.com',
        pass: process.env.MAIL_PWD
    }
});

const sendOTPEmail = (email, otp) => {
    const mailOptions = {
        from: 'velagapudigokhul26@gmail.com',
        to: email,
        subject: 'Your OTP Code',
        text: `Your OTP code is ${otp}`
    };

    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.log('Error sending email:', error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
};

module.exports = sendOTPEmail;
