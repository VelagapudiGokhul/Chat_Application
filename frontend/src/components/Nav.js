import { Link, useNavigate } from "react-router-dom";
import { LogOut, MessageSquare, Settings, User } from "lucide-react";
import { useStore } from "zustand";  // Import Zustand store
import AuthData from "./Hooks/AuthData";  // Update with the actual path to your Zustand store

const Navbar = () => {
  const navigate = useNavigate();
  const { logout } = useStore(AuthData);  

  const handleLogout = async () => {
    await logout();  
    navigate("/login");  
  };

  return (
    <header className="bg-light border-bottom fixed-top w-100 shadow-sm" style={{ backdropFilter: 'blur(10px)' }}>
      <div className="container-fluid px-4 py-2">
        <div className="d-flex justify-content-between align-items-center">
          {/* Logo Section */}
          <div className="d-flex align-items-center gap-2">
            <Link to="/" className="d-flex align-items-center text-decoration-none text-dark">
              <div className="rounded-circle bg-primary p-2">
                <MessageSquare className="w-20 h-20 text-white" />
              </div>
              <h1 className="h5 mb-0 ms-2">TChatter</h1>
            </Link>
          </div>

          {/* Navbar Buttons (Settings, Profile, Logout) */}
          <div className="d-flex align-items-center gap-3">
            <Link to="/settings" className="btn btn-outline-secondary btn-sm d-flex align-items-center">
              <Settings className="w-16 h-16" />
              <span className="d-none d-sm-inline ms-2">Settings</span>
            </Link>

            <Link to="/profile" className="btn btn-outline-secondary btn-sm d-flex align-items-center">
              <User className="w-16 h-16" />
              <span className="d-none d-sm-inline ms-2">Profile</span>
            </Link>

            <button
              onClick={handleLogout}  
              className="btn btn-outline-secondary btn-sm d-flex align-items-center"
            >
              <LogOut className="w-16 h-16" />
              <span className="d-none d-sm-inline ms-2">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
