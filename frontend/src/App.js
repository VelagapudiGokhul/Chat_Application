import React, { useEffect } from 'react';
import './App.css';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';

import Nav from "./components/Nav";
import Home from "./components/Home";
import SignUp from "./components/AuthPages/Signup";
import Login from "./components/AuthPages/Login";
import Settings from "./components/Settings";
import Profile from "./components/Profile";

import AuthData from "./components/Hooks/AuthData";
import { Toaster } from "react-hot-toast";

function App() {
  const { authUser, checkAuth, isCheckingAuth, onlineUsers } = AuthData();

  console.log(onlineUsers);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isCheckingAuth) {
    return <div>Loading...</div>;
  }

  return (
    <HashRouter>
      <div className={authUser ? "bg-surface text-on-surface h-screen overflow-hidden flex p-4 gap-6" : ""}>
        {authUser && <Nav />}

        <main className={authUser ? "flex-1 flex gap-6 h-full" : ""}>
          <Routes>
            <Route path="/" element={authUser ? <Home /> : <Navigate to="/login" />} />
            <Route path="/signup" element={!authUser ? <SignUp /> : <Navigate to="/" />} />
            <Route path="/login" element={!authUser ? <Login /> : <Navigate to="/" />} />
            <Route path="/settings" element={authUser ? <Settings /> : <Navigate to="/login" />} />
            <Route path="/profile" element={authUser ? <Profile /> : <Navigate to="/login" />} />
          </Routes>
        </main>

        <Toaster />
      </div>
    </HashRouter>
  );
}

export default App;
