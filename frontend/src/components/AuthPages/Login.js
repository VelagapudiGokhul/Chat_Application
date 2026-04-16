import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Axios from "axios";
import { useStore } from "zustand";
import AuthData from "../Hooks/AuthData";
import { Eye, EyeOff } from "lucide-react";

Axios.defaults.withCredentials = true;

export default function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const { login, isLoggingIn } = useStore(AuthData);

    async function handleSubmit(event) {
        event.preventDefault();
        try {
            await login(email, password);
        } catch (e) {
            alert("Login error");
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
                                Welcome Back
                            </span>
                            <h2 className="text-4xl font-headline font-extrabold leading-tight tracking-tight text-on-surface">
                                Continue<br />Building.
                            </h2>
                            <p className="mt-6 text-on-surface-variant font-medium leading-relaxed">
                                Sign in to access your shared blueprints, project timelines, and real-time architectural discussions.
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
                                <span className="material-symbols-outlined text-on-primary-fixed-variant text-3xl font-bold -rotate-3" data-icon="login">login</span>
                            </span>
                            <h1 className="text-3xl font-headline font-bold text-on-surface">Sign In</h1>
                            <p className="text-on-surface-variant mt-2 font-medium">Welcome back to TChatter</p>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="space-y-5 max-w-sm mx-auto">
                            <div className="space-y-2">
                                <label className="block text-[0.875rem] font-bold text-on-surface-variant px-1" htmlFor="email">Email Address</label>
                                <input onChange={(event) => setEmail(event.target.value)} className="w-full h-14 pl-4 pr-4 bg-surface-container-lowest border-none rounded-lg focus:ring-2 focus:ring-primary/20 focus:bg-primary-fixed/20 transition-all placeholder:text-outline/50 shadow-[inset_0_0_0_1px_rgba(197,197,212,0.15)] disabled:opacity-50 outline-none" id="email" placeholder="jane@studio.com" type="email" required />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between px-1">
                                    <label className="block text-[0.875rem] font-bold text-on-surface-variant" htmlFor="password">Password</label>
                                    <a className="text-[0.875rem] font-bold text-primary hover:text-primary-container transition-colors no-underline" href="#">Forgot?</a>
                                </div>
                                <div className="relative">
                                    <input onChange={(event) => setPassword(event.target.value)} className="w-full h-14 pl-4 pr-12 bg-surface-container-lowest border-none rounded-lg focus:ring-2 focus:ring-primary/20 focus:bg-primary-fixed/20 transition-all placeholder:text-outline/50 shadow-[inset_0_0_0_1px_rgba(197,197,212,0.15)] disabled:opacity-50 outline-none" id="password" placeholder="••••••••" type={showPassword ? "text" : "password"} required />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-outline-variant hover:text-primary transition-colors disabled:opacity-50 focus:outline-none focus:ring-0 border-none bg-transparent">
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>
                            
                            <button type="submit" disabled={isLoggingIn} className="w-full h-14 bg-primary hover:bg-primary-container active:scale-[0.98] text-on-primary font-bold rounded-lg shadow-[0_8px_16px_rgba(35,56,156,0.15)] hover:shadow-[0_12px_20px_rgba(35,56,156,0.25)] transition-all duration-200 mt-4 border-none relative overflow-hidden group">
                                <span className="relative z-10">{isLoggingIn ? "Signing in..." : "Access Network"}</span>
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                            </button>
                        </form>
                        
                        <div className="mt-8 pt-8 border-t border-outline-variant/20 text-center max-w-sm mx-auto">
                            <p className="text-on-surface-variant font-medium text-sm">
                                Not integrated yet? <Link to="/signup" className="text-primary font-bold hover:text-primary-container transition-colors ml-1 no-underline">Create an Account</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
