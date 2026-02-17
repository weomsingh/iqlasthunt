import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Menu, Wallet, User, Settings, LogOut, Search, X,
    Home, Target, Briefcase, MessageSquare, HelpCircle, ChevronDown, Trophy
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Header() {
    const { currentUser, signOut } = useAuth();
    const navigate = useNavigate();
    const [showSidebar, setShowSidebar] = useState(false);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowProfileDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef]);

    if (!currentUser) return null;

    const role = currentUser.role || 'hunter';
    const currency = currentUser.currency === 'INR' ? '₹' : '$';
    const walletBalance = (currentUser.wallet_balance || 0).toLocaleString();

    const handleLogout = async () => {
        try {
            // Call signOut from context first
            await signOut();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Robust cleanup
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Check if there are any other specific keys to clear, or clear all
            // localStorage.clear(); // Use with caution if other apps share domain, but usually fine for separate apps
            sessionStorage.clear();

            // Redirect
            navigate('/');

            // Force reload to clear states
            setTimeout(() => {
                window.location.reload();
            }, 100);
        }
    };

    // Navigation Helper
    const goTo = (path) => {
        navigate(path);
        setShowSidebar(false);
        setShowProfileDropdown(false);
    };

    return (
        <>
            <header className="sticky top-0 z-50 w-full h-16 bg-iq-background/95 backdrop-blur-lg border-b border-white/5 flex items-center justify-between px-4 md:px-6 shadow-lg">
                {/* Left Side: Hamburger + Logo */}
                <div className="flex items-center gap-4">
                    {/* Hamburger Menu - Mobile Navigation */}
                    <button
                        onClick={() => setShowSidebar(true)}
                        className="md:hidden text-gray-400 hover:text-white transition-colors p-1"
                    >
                        <Menu size={24} />
                    </button>

                    {/* Brand Logo */}
                    <Link to={`/${role}/dashboard`} className="flex items-center gap-2 group">
                        {/* Using explicit image if available, else fallback to icon or nothing */}
                        <div className="relative h-8 w-8">
                            <img
                                src="/logo-icon.png"
                                alt="IQHUNT"
                                className="h-full w-full object-contain"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.style.display = 'none';
                                    e.target.parentNode.classList.add('hidden');
                                }}
                            />
                        </div>
                        <span className="text-xl font-bold text-iq-primary tracking-tight group-hover:text-neon-cyan transition-colors">IQHUNT</span>
                    </Link>
                </div>

                {/* Right Side: Wallet + Profile */}
                <div className="flex items-center gap-3 md:gap-4">
                    {/* Wallet Balance - Clickable */}
                    <button
                        onClick={() => goTo(`/${role}/vault`)}
                        className="flex items-center gap-2 bg-iq-primary/10 border border-iq-primary/30 rounded-lg px-3 py-1.5 hover:bg-iq-primary/20 transition-all cursor-pointer group"
                    >
                        <Wallet size={16} className="text-iq-primary group-hover:text-neon-cyan" />
                        <span className="text-iq-primary font-semibold font-mono text-sm group-hover:text-neon-cyan">
                            {currency}{walletBalance}
                        </span>
                    </button>

                    {/* Profile Menu - With Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                            className="flex items-center gap-2 focus:outline-none group"
                        >
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-iq-primary to-iq-accent p-[2px] cursor-pointer group-hover:shadow-glow transition-all">
                                <div className="w-full h-full rounded-full bg-iq-background flex items-center justify-center overflow-hidden">
                                    {currentUser.avatar_url ? (
                                        <img src={currentUser.avatar_url} alt={currentUser.username} className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={16} className="text-iq-primary" />
                                    )}
                                </div>
                            </div>
                            <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${showProfileDropdown ? 'rotate-180' : ''} hidden md:block group-hover:text-white`} />
                        </button>

                        {/* Profile Dropdown */}
                        {showProfileDropdown && (
                            <div className="absolute right-0 top-12 w-64 bg-iq-surface border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                {/* User Info Header */}
                                <div className="px-4 py-3 bg-iq-primary/10 border-b border-white/5">
                                    <p className="font-bold text-white truncate text-sm">{currentUser.username}</p>
                                    <p className="text-xs text-iq-text-secondary truncate">{currentUser.email}</p>
                                </div>

                                {/* Menu Items */}
                                <div className="p-2 space-y-1">


                                    <button
                                        onClick={() => goTo(`/${role}/profile`)}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-left"
                                    >
                                        <User size={16} className="text-blue-400" />
                                        <span>View Profile</span>
                                    </button>

                                    <button
                                        onClick={() => goTo(`/${role}/settings`)}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-left"
                                    >
                                        <Settings size={16} className="text-purple-400" />
                                        <span>Profile Settings</span>
                                    </button>

                                    {/* Leaderboard Option - Hunters Only */}
                                    {role === 'hunter' && (
                                        <button
                                            onClick={() => goTo(`/${role}/leaderboard`)}
                                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-left"
                                        >
                                            <Trophy size={16} className="text-yellow-400" />
                                            <span>Leaderboard</span>
                                        </button>
                                    )}

                                    <button
                                        onClick={() => goTo(`/${role}/vault`)}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-left"
                                    >
                                        <Wallet size={16} className="text-green-400" />
                                        <span>My Vault</span>
                                    </button>

                                    {role === 'hunter' && (
                                        <button
                                            onClick={() => goTo(`/${role}/war-room`)}
                                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-left"
                                        >
                                            <Briefcase size={16} className="text-orange-400" />
                                            <span>My Missions</span>
                                        </button>
                                    )}

                                    <div className="h-px bg-gray-800 my-1 mx-2"></div>

                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors text-left"
                                    >
                                        <LogOut size={16} />
                                        <span>Logout</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Mobile Sidebar Drawer */}
            {showSidebar && (
                <div className="fixed inset-0 z-50 flex md:hidden isolate">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                        onClick={() => setShowSidebar(false)}
                    />

                    {/* Drawer Content */}
                    <div className="relative w-72 max-w-[85vw] h-full bg-[#0A0E14] border-r border-gray-800 shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col z-50">
                        <div className="flex items-center justify-between p-4 border-b border-gray-800">
                            <div className="flex items-center gap-2">
                                <span className="text-xl font-bold text-green-400">IQHUNT</span>
                            </div>
                            <button
                                onClick={() => setShowSidebar(false)}
                                className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                            <button onClick={() => goTo(`/${role}/dashboard`)} className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors text-left">
                                <Home size={20} className="text-blue-400" />
                                <span>Home</span>
                            </button>

                            {/* Hunter Specific Links */}
                            {role === 'hunter' && (
                                <>
                                    <button onClick={() => goTo(`/${role}/arena`)} className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors text-left">
                                        <Target size={20} className="text-red-400" />
                                        <span>Browse Arena</span>
                                    </button>

                                    <button onClick={() => goTo(`/${role}/war-room`)} className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors text-left">
                                        <MessageSquare size={20} className="text-orange-400" />
                                        <span>My Missions</span>
                                    </button>

                                    <button onClick={() => goTo(`/${role}/leaderboard`)} className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors text-left">
                                        <Trophy size={20} className="text-yellow-400" />
                                        <span>Leaderboard</span>
                                    </button>

                                    <button onClick={() => goTo(`/${role}/settings`)} className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors text-left">
                                        <User size={20} className="text-purple-400" />
                                        <span>View Profile</span>
                                    </button>
                                </>
                            )}

                            {/* Payer Specific Links */}
                            {role === 'payer' && (
                                <button onClick={() => goTo(`/${role}/live-bounties`)} className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors text-left">
                                    <Target size={20} className="text-orange-400" />
                                    <span>My Bounties</span>
                                </button>
                            )}

                            <button onClick={() => goTo(`/${role}/vault`)} className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors text-left">
                                <Wallet size={20} className="text-green-400" />
                                <span>My Vault</span>
                            </button>

                            <div className="h-px bg-gray-800 my-2 mx-4"></div>

                            <button onClick={() => goTo(`/${role}/settings`)} className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors text-left">
                                <Settings size={20} className="text-purple-400" />
                                <span>Settings</span>
                            </button>

                            <button onClick={() => goTo('/help')} className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors text-left">
                                <HelpCircle size={20} className="text-yellow-400" />
                                <span>Help & Support</span>
                            </button>
                        </div>

                        <div className="p-4 border-t border-gray-800">
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-900/10 rounded-xl transition-colors text-left font-medium"
                            >
                                <LogOut size={20} />
                                <span>Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
