import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import axios from "axios";

export default function Signup() {
    const navigate = useNavigate();
    const [username, setUserName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [otp, setOtp] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [otpSent, setOtpSent] = useState(false);

    async function submit(e) {
        e.preventDefault();
        setErrorMessage("");
        if (password !== confirmPassword) {
            setErrorMessage("Passwords do not match. Please try again.");
            setPassword("");
            setConfirmPassword("");
            return;
        } 
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
            setErrorMessage("An error occurred during signup.");
            console.log(e);
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
                setErrorMessage("Invalid OTP. Please try again.");
            }
        } catch (e) {
            setErrorMessage("An error occurred during verification.");
            console.log(e);
        }
    }

    return (
        <div className="bg-surface text-on-surface min-h-screen font-body selection:bg-primary-fixed selection:text-on-primary-fixed">
            <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
                <div className="absolute top-[-20%] right-[-10%] w-[70vw] h-[70vw] rounded-full bg-gradient-to-br from-primary-fixed/40 to-transparent blur-3xl -z-10 pointer-events-none"></div>
                <div className="absolute bottom-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tr from-secondary-fixed/30 to-transparent blur-3xl -z-10 pointer-events-none"></div>
                
                <div className="w-full max-w-[1000px] bg-surface-container-lowest/80 backdrop-blur-2xl rounded-3xl shadow-[0_8px_32px_rgba(25,28,30,0.08)] border border-white/50 flex flex-col md:flex-row overflow-hidden relative">
                    <div className="hidden md:flex md:w-5/12 bg-surface p-12 flex-col justify-between relative overflow-hidden group">
                        <div className="relative z-10">
                            <span className="inline-block px-4 py-1.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant text-xs font-bold tracking-wider uppercase mb-8 shadow-sm">
                                Join the Network
                            </span>
                            <h2 className="text-4xl font-headline font-extrabold leading-tight tracking-tight text-on-surface">
                                Start<br />Building.
                            </h2>
                            <p className="mt-6 text-on-surface-variant font-medium leading-relaxed">
                                Create an account to access shared blueprints, project timelines, and real-time architectural discussions.
                            </p>
                        </div>
                        <div className="relative z-10 mt-12 bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/20 inline-block self-start transition-transform group-hover:-translate-y-2">
                            <div className="flex gap-1 mb-2">
                                <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                            </div>
                            <p className="text-sm font-medium text-on-surface">"The best platform for our firm."</p>
                            <p className="text-xs text-outline mt-1 font-bold">— Principal Architect</p>
                        </div>
                        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-primary-fixed rounded-full blur-[80px] opacity-60"></div>
                    </div>
                
                    <div className="w-full md:w-7/12 p-8 sm:p-12 relative z-10">
                        <div className="text-center mb-10">
                            <span className="w-16 h-16 bg-primary-fixed rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm rotate-3">
                                <span className="material-symbols-outlined text-on-primary-fixed-variant text-3xl font-bold -rotate-3" data-icon="edit_square">edit_square</span>
                            </span>
                            <h1 className="text-3xl font-headline font-bold text-on-surface">Create Account</h1>
                            <p className="text-on-surface-variant mt-2 font-medium">Join TChatter for free</p>
                        </div>
                        
                        <form onSubmit={otpSent ? verifyOtp : submit} className="space-y-5 max-w-sm mx-auto">
                            {!otpSent && (
                                <>
                                <div className="space-y-2">
                                    <label className="block text-[0.875rem] font-bold text-on-surface-variant px-1">Full Name</label>
                                    <input onChange={(event) => setUserName(event.target.value)} disabled={otpSent} className="w-full h-14 pl-4 pr-4 bg-surface-container-lowest border-none rounded-lg focus:ring-2 focus:ring-primary/20 focus:bg-primary-fixed/20 transition-all placeholder:text-outline/50 shadow-[inset_0_0_0_1px_rgba(197,197,212,0.15)] disabled:opacity-50 outline-none" placeholder="Jane Doe" type="text" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[0.875rem] font-bold text-on-surface-variant px-1">Email Address</label>
                                    <input onChange={(event) => setEmail(event.target.value)} disabled={otpSent} className="w-full h-14 pl-4 pr-4 bg-surface-container-lowest border-none rounded-lg focus:ring-2 focus:ring-primary/20 focus:bg-primary-fixed/20 transition-all placeholder:text-outline/50 shadow-[inset_0_0_0_1px_rgba(197,197,212,0.15)] disabled:opacity-50 outline-none" placeholder="jane@studio.com" type="email" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[0.875rem] font-bold text-on-surface-variant px-1">Password</label>
                                    <div className="relative">
                                        <input onChange={(event) => setPassword(event.target.value)} disabled={otpSent} className="w-full h-14 pl-4 pr-12 bg-surface-container-lowest border-none rounded-lg focus:ring-2 focus:ring-primary/20 focus:bg-primary-fixed/20 transition-all placeholder:text-outline/50 shadow-[inset_0_0_0_1px_rgba(197,197,212,0.15)] disabled:opacity-50 outline-none" placeholder="••••••••" type={showPassword ? "text" : "password"} required />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} disabled={otpSent} className="absolute right-4 top-1/2 -translate-y-1/2 text-outline-variant hover:text-primary transition-colors disabled:opacity-50 focus:outline-none focus:ring-0 border-none bg-transparent">
                                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[0.875rem] font-bold text-on-surface-variant px-1">Confirm Password</label>
                                    <div className="relative">
                                        <input onChange={(event) => setConfirmPassword(event.target.value)} disabled={otpSent} className="w-full h-14 pl-4 pr-12 bg-surface-container-lowest border-none rounded-lg focus:ring-2 focus:ring-primary/20 focus:bg-primary-fixed/20 transition-all placeholder:text-outline/50 shadow-[inset_0_0_0_1px_rgba(197,197,212,0.15)] disabled:opacity-50 outline-none" placeholder="••••••••" type={showConfirmPassword ? "text" : "password"} required />
                                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} disabled={otpSent} className="absolute right-4 top-1/2 -translate-y-1/2 text-outline-variant hover:text-primary transition-colors disabled:opacity-50 focus:outline-none focus:ring-0 border-none bg-transparent">
                                            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                </div>
                                </>
                            )}
                            {otpSent && (
                                <div className="space-y-2">
                                    <label className="block text-[0.875rem] font-bold text-on-surface-variant px-1">Verification OTP</label>
                                    <input onChange={(event) => setOtp(event.target.value)} className="w-full h-14 px-4 bg-surface-container-lowest border-none rounded-lg focus:ring-2 focus:ring-primary/20 focus:bg-primary-fixed/20 transition-all placeholder:text-outline/50 shadow-[inset_0_0_0_1px_rgba(197,197,212,0.15)] tracking-widest font-mono text-lg text-center outline-none" placeholder="000000" type="text" required />
                                    <p className="text-xs text-outline text-center mt-2 px-4">We've sent a code to your email. Please enter it above.</p>
                                </div>
                            )}
                            
                            {errorMessage && <div className="text-error text-center text-sm font-bold bg-error-container p-2 rounded-lg">{errorMessage}</div>}
                            
                            <button type="submit" className="w-full h-14 bg-primary hover:bg-primary-container active:scale-[0.98] text-on-primary font-bold rounded-lg shadow-[0_8px_16px_rgba(35,56,156,0.15)] hover:shadow-[0_12px_20px_rgba(35,56,156,0.25)] transition-all duration-200 mt-4 border-none relative overflow-hidden group">
                                <span className="relative z-10">{otpSent ? "Complete Account" : "Access Network"}</span>
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                            </button>
                        </form>
                        
                        <div className="mt-8 pt-8 border-t border-outline-variant/20 text-center max-w-sm mx-auto">
                            <p className="text-on-surface-variant font-medium text-sm">
                                Already integrated? <Link to="/login" className="text-primary font-bold hover:text-primary-container transition-colors ml-1 no-underline">Return to Login</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
