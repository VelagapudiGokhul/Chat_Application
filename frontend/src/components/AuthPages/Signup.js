import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

export default function Signup() {
    const navigate = useNavigate();
    const [username, setUserName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [otp, setOtp] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [otpSent, setOtpSent] = useState(false);

    async function submit(e) {
        e.preventDefault();
        if (password !== confirmPassword) {
            setErrorMessage("Passwords do not match. Please try again.");
            setPassword("");
            setConfirmPassword("");
        } else {
            try {
                const res = await axios.post("http://localhost:5000/api/authRoute/signup", {
                    username, email, password
                });
    
                if (res.data === "email already exists") {
                    setErrorMessage("User already exists. Please use a different email.");                   
                } else if (res.data.message === "OTP sent") {
                    setOtpSent(true);
                    alert("OTP sent to your email. Please check your inbox.");
                }
            } catch (e) {
                alert("An error occurred");
                console.log(e);
            }
        }
    }    

    async function verifyOtp(e) {
        e.preventDefault();
        try {
            const res = await axios.post("http://localhost:5000/api/authRoute/verify-otp", {
                email, otp
            });

            if (res.status === 201) {
                alert("Signup successful. Please log in.");
                navigate("/login");
            } else {
                alert("Invalid OTP. Please try again.");
            }
        } catch (e) {
            alert("An error occurred in Login");
            console.log(e);
        }
    }

    return (
        <>
            <div className="container">
                <div className="card mt-5 mx-auto" style={{ maxWidth: '425px' }}>
                    <div className="card-body">
                        <h2 className="card-title text-center">Sign Up</h2>
                        <h6 className="card-subtitle mb-2 text-muted text-center">Create your account</h6>
                        <form onSubmit={otpSent ? verifyOtp : submit}>
                            <div className="form-group">
                                <label htmlFor="userName">UserName</label>
                                <input
                                    onChange={(event) => setUserName(event.target.value)}
                                    className="form-control"
                                    placeholder="Enter User Name"
                                    type="text"
                                    id="userName"
                                    required
                                    disabled={otpSent}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="email">Email</label>
                                <input
                                    onChange={(event) => setEmail(event.target.value)}
                                    className="form-control"
                                    placeholder="Enter Email"
                                    type="email"
                                    id="email"
                                    required
                                    disabled={otpSent}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="password">Password</label>
                                <input
                                    onChange={(event) => setPassword(event.target.value)}
                                    className="form-control"
                                    placeholder="Enter Password"
                                    type="password"
                                    id="password"
                                    required
                                    disabled={otpSent}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="re-password">Confirm Password</label>
                                <input
                                    onChange={(event) => setConfirmPassword(event.target.value)}
                                    className="form-control"
                                    placeholder="Re-Enter Password"
                                    type="password"
                                    id="re-password"
                                    required
                                    disabled={otpSent}
                                />
                            </div>
                            {otpSent && (
                                <div className="form-group">
                                    <label htmlFor="otp">OTP</label>
                                    <input
                                        onChange={(event) => setOtp(event.target.value)}
                                        className="form-control"
                                        placeholder="Enter OTP"
                                        type="text"
                                        id="otp"
                                        required
                                    />
                                </div>
                            )}
                            {errorMessage && <div className="text-danger">{errorMessage}</div>}
                            <button type="submit" className="btn btn-primary btn-block">
                                {otpSent ? "Verify OTP" : "Get Started"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
            <div className="col-12 d-flex justify-content-center">
                <label className="col-form-label me-2">Already a member?</label>
                <Link to="/login" className="mt-1">Login Now</Link>
            </div>
        </>
    );
}
