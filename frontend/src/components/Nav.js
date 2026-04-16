import { Link, useNavigate, useLocation } from "react-router-dom";
import { useStore } from "zustand";
import AuthData from "./Hooks/AuthData";

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout } = useStore(AuthData);

    const hashParams = new URLSearchParams(location.search || window.location.hash.split('?')[1] || '');
    const isGroupTab = hashParams.get('tab') === 'groups';

    if (location.pathname === "/login" || location.pathname === "/signup") {
        return null;
    }

    const handleLogout = async () => {
        await logout();
        navigate("/login");
    };

    return (
        <aside className="h-full z-50 flex flex-col justify-between w-20 items-center py-8 rounded-2xl bg-surface-container-low shadow-[40px_0_40px_rgba(25,28,30,0.04)] relative flex-shrink-0">
            <div className="flex flex-col items-center gap-8">
                <Link to="/" className="text-2xl font-black text-primary tracking-tighter no-underline hover:opacity-80 transition-opacity" title="TChatter">
                    TC
                </Link>
                <nav className="flex flex-col gap-4">
                    <Link
                        to="/?tab=chats"
                        title="Chats"
                        className={`p-3 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 flex no-underline ${!isGroupTab
                                ? 'bg-surface-container-lowest text-primary shadow-sm'
                                : 'text-outline hover:text-primary hover:bg-surface-container-lowest/50'
                            }`}
                    >
                        <span className="material-symbols-outlined" data-icon="chat">chat</span>
                    </Link>
                    <Link
                        to="/?tab=groups"
                        title="Groups"
                        className={`p-3 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 flex no-underline ${isGroupTab
                                ? 'bg-surface-container-lowest text-primary shadow-sm'
                                : 'text-outline hover:text-primary hover:bg-surface-container-lowest/50'
                            }`}
                    >
                        <span className="material-symbols-outlined" data-icon="group">group</span>
                    </Link>
                </nav>
            </div>
            <div className="flex flex-col items-center gap-4">
                <Link to="/settings" className="text-outline p-3 hover:text-primary hover:bg-surface-container-lowest/50 rounded-xl transition-all hover:scale-105 active:scale-95 flex no-underline" title="Settings">
                    <span className="material-symbols-outlined" data-icon="settings">settings</span>
                </Link>
                <Link to="/profile" className="text-outline p-3 hover:text-primary hover:bg-surface-container-lowest/50 rounded-xl transition-all hover:scale-105 active:scale-95 flex no-underline" title="Profile">
                    <span className="material-symbols-outlined" data-icon="account_circle">account_circle</span>
                </Link>
                <button onClick={handleLogout} className="text-outline p-3 hover:text-error hover:bg-error-container/50 rounded-xl transition-all hover:scale-105 active:scale-95 flex border-none bg-transparent" title="Logout">
                    <span className="material-symbols-outlined" data-icon="logout">logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Navbar;
