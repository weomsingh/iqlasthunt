import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Menu, Wallet, User, Settings, LogOut, X,
    Home, Target, Briefcase, MessageSquare, HelpCircle,
    ChevronDown, Trophy, Clock, Bell, TrendingUp, Zap
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function Header() {
    const { currentUser, signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
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
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Lock body scroll when sidebar is open (prevents background scroll on mobile)
    useEffect(() => {
        if (showSidebar) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [showSidebar]);

    // Close sidebar on route change
    useEffect(() => {
        setShowSidebar(false);
    }, [location.pathname]);


    if (!currentUser) return null;

    const role = currentUser.role || 'hunter';
    const currency = currentUser.currency === 'INR' ? '₹' : '$';
    const walletBalance = (currentUser.wallet_balance || 0).toLocaleString();
    const initials = (currentUser.username || 'U').substring(0, 2).toUpperCase();

    const handleLogout = async () => {
        try {
            setShowProfileDropdown(false);
            setShowSidebar(false);
            await signOut();
        } catch (error) {
            console.error('Logout error:', error);
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = '/';
        }
    };

    const goTo = (path) => {
        navigate(path);
        setShowSidebar(false);
        setShowProfileDropdown(false);
    };

    // Role-specific config
    const roleConfig = {
        hunter: {
            color: '#00FF94',
            label: 'HUNTER',
            bg: 'rgba(0,255,148,0.1)',
            border: 'rgba(0,255,148,0.2)',
            navLinks: [
                { icon: Home, label: 'Dashboard', path: '/hunter/dashboard', color: '#00E5FF' },
                { icon: Target, label: 'Arena', path: '/hunter/arena', color: '#FF6B35' },
                { icon: MessageSquare, label: 'War Room', path: '/hunter/war-room', color: '#A855F7' },
                { icon: Clock, label: 'History', path: '/hunter/history', color: '#6366F1' },
                { icon: Trophy, label: 'Leaderboard', path: '/hunter/leaderboard', color: '#FFE600' },
                { icon: Wallet, label: 'Vault', path: '/hunter/vault', color: '#00FF94' },
                { icon: Settings, label: 'Settings', path: '/hunter/settings', color: '#8892AA' },
            ]
        },
        payer: {
            color: '#00E5FF',
            label: 'PAYER',
            bg: 'rgba(0,229,255,0.1)',
            border: 'rgba(0,229,255,0.2)',
            navLinks: [
                { icon: Home, label: 'Dashboard', path: '/payer/dashboard', color: '#00E5FF' },
                { icon: Target, label: 'My Bounties', path: '/payer/live-bounties', color: '#FF6B35' },
                { icon: Briefcase, label: 'Post Bounty', path: '/payer/post-bounty', color: '#00FF94' },
                { icon: MessageSquare, label: 'War Room', path: '/payer/war-room', color: '#A855F7' },
                { icon: Clock, label: 'History', path: '/payer/history', color: '#6366F1' },
                { icon: Wallet, label: 'Vault', path: '/payer/vault', color: '#00FF94' },
                { icon: Settings, label: 'Settings', path: '/payer/settings', color: '#8892AA' },
            ]
        },
        admin: {
            color: '#FF2D78',
            label: 'ADMIN',
            bg: 'rgba(255,45,120,0.1)',
            border: 'rgba(255,45,120,0.2)',
            navLinks: [
                { icon: Home, label: 'Dashboard', path: '/admin/dashboard', color: '#FF2D78' },
            ]
        }
    };

    const config = roleConfig[role] || roleConfig.hunter;

    const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

    return (
        <>
            {/* ===== MAIN HEADER ===== */}
            <header style={{
                position: 'sticky',
                top: 0,
                zIndex: 50,
                width: '100%',
                height: '64px',
                background: 'rgba(8,11,20,0.92)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 16px',
            }}>
                {/* Left: Hamburger + Logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                        onClick={() => setShowSidebar(true)}
                        aria-label="Open menu"
                        className="md:hidden transition-colors"
                        style={{
                            color: '#8892AA',
                            padding: '8px',
                            borderRadius: '10px',
                            border: '1px solid rgba(255,255,255,0.08)',
                            background: 'rgba(255,255,255,0.04)',
                            minHeight: '40px',
                            minWidth: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                        onMouseOver={e => { e.currentTarget.style.color = '#F0F4FF'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                        onMouseOut={e => { e.currentTarget.style.color = '#8892AA'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                    >
                        <Menu size={20} />
                    </button>

                    <Link to={`/${role}/dashboard`} style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
                        <img
                            src="/finallandstrans.png"
                            alt="IQHUNT"
                            style={{ height: '36px', width: 'auto', objectFit: 'contain' }}
                        />
                    </Link>
                </div>

                {/* Center: Desktop Nav */}
                <nav className="hidden md:flex items-center gap-1">
                    {config.navLinks.slice(0, 5).map((link) => {
                        const active = isActive(link.path);
                        return (
                            <Link
                                key={link.path}
                                to={link.path}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '8px 14px',
                                    borderRadius: '10px',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    textDecoration: 'none',
                                    transition: 'all 0.2s ease',
                                    color: active ? link.color : '#8892AA',
                                    background: active ? `${link.color}12` : 'transparent',
                                    border: active ? `1px solid ${link.color}25` : '1px solid transparent',
                                    minHeight: '36px',
                                }}
                                onMouseOver={e => {
                                    if (!active) {
                                        e.currentTarget.style.color = '#F0F4FF';
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                    }
                                }}
                                onMouseOut={e => {
                                    if (!active) {
                                        e.currentTarget.style.color = '#8892AA';
                                        e.currentTarget.style.background = 'transparent';
                                    }
                                }}
                            >
                                <link.icon size={15} />
                                <span>{link.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Right: Wallet + Profile */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* Role Badge (desktop) */}
                    <span className="hidden md:inline-block text-[10px] font-black tracking-[0.15em] px-2.5 py-1 rounded-md"
                        style={{ background: config.bg, color: config.color, border: `1px solid ${config.border}` }}>
                        {config.label}
                    </span>

                    {/* Wallet */}
                    <button
                        onClick={() => goTo(`/${role}/vault`)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '7px',
                            background: 'rgba(0,255,148,0.08)',
                            border: '1px solid rgba(0,255,148,0.2)',
                            borderRadius: '10px',
                            padding: '7px 12px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            minHeight: '38px',
                        }}
                        onMouseOver={e => {
                            e.currentTarget.style.background = 'rgba(0,255,148,0.14)';
                            e.currentTarget.style.boxShadow = '0 0 20px rgba(0,255,148,0.15)';
                        }}
                        onMouseOut={e => {
                            e.currentTarget.style.background = 'rgba(0,255,148,0.08)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        <Wallet size={15} style={{ color: '#00FF94' }} />
                        <span style={{ color: '#00FF94', fontWeight: '700', fontFamily: 'JetBrains Mono', fontSize: '13px' }}>
                            {currency}{walletBalance}
                        </span>
                    </button>

                    {/* Profile Dropdown */}
                    <div ref={dropdownRef} style={{ position: 'relative' }}>
                        <button
                            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '4px',
                                borderRadius: '12px',
                                minHeight: '44px',
                            }}
                        >
                            {/* Avatar */}
                            <div style={{
                                width: '36px', height: '36px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #00FF94, #00E5FF)',
                                padding: '2px',
                            }}>
                                <div style={{
                                    width: '100%', height: '100%',
                                    borderRadius: '50%',
                                    background: 'rgba(8,11,20,0.9)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    overflow: 'hidden',
                                }}>
                                    {currentUser.avatar_url ? (
                                        <img src={currentUser.avatar_url} alt={currentUser.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <span style={{ color: '#00FF94', fontSize: '12px', fontWeight: '800', fontFamily: 'Space Grotesk' }}>
                                            {initials}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <ChevronDown size={14} style={{
                                color: '#8892AA',
                                transition: 'transform 0.2s ease',
                                transform: showProfileDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                            }} className="hidden md:block" />
                        </button>

                        {/* Dropdown Menu */}
                        {showProfileDropdown && (
                            <div style={{
                                position: 'absolute',
                                right: 0, top: '48px',
                                width: '220px',
                                background: 'rgba(13,18,32,0.97)',
                                backdropFilter: 'blur(20px)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '16px',
                                padding: '8px',
                                boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(0,255,148,0.05)',
                                zIndex: 100,
                                animation: 'scaleIn 0.15s ease',
                            }}>
                                {/* User info */}
                                <div style={{
                                    padding: '12px 14px',
                                    borderRadius: '10px',
                                    marginBottom: '6px',
                                    background: 'rgba(255,255,255,0.04)',
                                }}>
                                    <p style={{ fontWeight: '700', color: '#F0F4FF', fontSize: '14px', marginBottom: '2px' }}>
                                        {currentUser.username}
                                    </p>
                                    <p style={{ color: '#8892AA', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {currentUser.email}
                                    </p>
                                </div>

                                {/* Menu items */}
                                {[
                                    { icon: User, label: 'View Profile', action: () => goTo(`/${role}/profile`), color: '#00E5FF' },
                                    { icon: Settings, label: 'Account Settings', action: () => goTo(`/${role}/settings`), color: '#A855F7' },
                                    { icon: Wallet, label: 'My Vault', action: () => goTo(`/${role}/vault`), color: '#00FF94' },
                                    ...(role === 'hunter' ? [{ icon: Trophy, label: 'Leaderboard', action: () => goTo('/hunter/leaderboard'), color: '#FFE600' }] : []),
                                    ...(role === 'hunter' ? [{ icon: MessageSquare, label: 'War Room', action: () => goTo('/hunter/war-room'), color: '#FF6B35' }] : []),
                                    ...(role === 'payer' ? [{ icon: Briefcase, label: 'Post Bounty', action: () => goTo('/payer/post-bounty'), color: '#FF6B35' }] : []),
                                ].map((item, i) => (
                                    <button
                                        key={i}
                                        onClick={item.action}
                                        style={{
                                            width: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            padding: '10px 12px',
                                            borderRadius: '10px',
                                            border: 'none',
                                            background: 'none',
                                            cursor: 'pointer',
                                            fontSize: '13px',
                                            color: '#C0C8D8',
                                            fontWeight: '500',
                                            textAlign: 'left',
                                            transition: 'all 0.15s ease',
                                            minHeight: '40px',
                                        }}
                                        onMouseOver={e => {
                                            e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                                            e.currentTarget.style.color = '#F0F4FF';
                                        }}
                                        onMouseOut={e => {
                                            e.currentTarget.style.background = 'none';
                                            e.currentTarget.style.color = '#C0C8D8';
                                        }}
                                    >
                                        <item.icon size={15} style={{ color: item.color, flexShrink: 0 }} />
                                        <span>{item.label}</span>
                                    </button>
                                ))}

                                <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '6px 0' }} />

                                <button
                                    onClick={handleLogout}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        padding: '10px 12px',
                                        borderRadius: '10px',
                                        border: 'none',
                                        background: 'none',
                                        cursor: 'pointer',
                                        fontSize: '13px',
                                        color: '#F43F5E',
                                        fontWeight: '600',
                                        textAlign: 'left',
                                        transition: 'all 0.15s ease',
                                        minHeight: '40px',
                                    }}
                                    onMouseOver={e => e.currentTarget.style.background = 'rgba(244,63,94,0.1)'}
                                    onMouseOut={e => e.currentTarget.style.background = 'none'}
                                >
                                    <LogOut size={15} style={{ flexShrink: 0 }} />
                                    <span>Sign Out</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* ===== MOBILE SIDEBAR ===== */}
            {showSidebar && (
                <div className="fixed inset-0 z-50 flex md:hidden">
                    {/* Backdrop */}
                    <div
                        onClick={() => setShowSidebar(false)}
                        style={{
                            position: 'fixed', inset: 0,
                            background: 'rgba(0,0,0,0.7)',
                            backdropFilter: 'blur(8px)',
                            animation: 'fadeIn 0.2s ease',
                        }}
                    />

                    {/* Drawer */}
                    <div style={{
                        position: 'relative',
                        width: '280px',
                        maxWidth: '85vw',
                        height: '100%',
                        background: 'rgba(8,11,20,0.98)',
                        backdropFilter: 'blur(30px)',
                        borderRight: '1px solid rgba(255,255,255,0.08)',
                        display: 'flex',
                        flexDirection: 'column',
                        animation: 'slideInLeft 0.3s cubic-bezier(0.4,0,0.2,1)',
                        zIndex: 51,
                    }}>
                        {/* Sidebar Header */}
                        <div style={{
                            padding: '20px 16px',
                            borderBottom: '1px solid rgba(255,255,255,0.07)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {/* Avatar */}
                                <div style={{
                                    width: '42px', height: '42px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #00FF94, #00E5FF)',
                                    padding: '2px',
                                    flexShrink: 0,
                                }}>
                                    <div style={{
                                        width: '100%', height: '100%',
                                        borderRadius: '50%',
                                        background: 'rgba(8,11,20,0.9)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        overflow: 'hidden',
                                    }}>
                                        {currentUser.avatar_url ? (
                                            <img src={currentUser.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <span style={{ color: '#00FF94', fontSize: '13px', fontWeight: '800' }}>{initials}</span>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <p style={{ color: '#F0F4FF', fontWeight: '700', fontSize: '14px' }}>{currentUser.username}</p>
                                    <span style={{
                                        fontSize: '10px', fontWeight: '800',
                                        color: config.color, letterSpacing: '0.12em',
                                        background: config.bg,
                                        padding: '2px 8px', borderRadius: '4px',
                                        border: `1px solid ${config.border}`,
                                    }}>
                                        {config.label}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowSidebar(false)}
                                style={{
                                    color: '#8892AA',
                                    padding: '8px',
                                    borderRadius: '10px',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    background: 'rgba(255,255,255,0.04)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    minHeight: '36px', minWidth: '36px',
                                }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Wallet Balance in sidebar */}
                        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                            <button
                                onClick={() => goTo(`/${role}/vault`)}
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '12px 16px',
                                    background: 'rgba(0,255,148,0.08)',
                                    border: '1px solid rgba(0,255,148,0.2)',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    minHeight: '50px',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Wallet size={18} style={{ color: '#00FF94' }} />
                                    <div style={{ textAlign: 'left' }}>
                                        <p style={{ color: '#8892AA', fontSize: '11px', fontWeight: '600' }}>Available Balance</p>
                                        <p style={{ color: '#00FF94', fontWeight: '800', fontFamily: 'JetBrains Mono', fontSize: '16px' }}>
                                            {currency}{walletBalance}
                                        </p>
                                    </div>
                                </div>
                                <TrendingUp size={16} style={{ color: '#00FF9480' }} />
                            </button>
                        </div>

                        {/* Nav Links */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
                            {config.navLinks.map((link) => {
                                const active = isActive(link.path);
                                return (
                                    <button
                                        key={link.path}
                                        onClick={() => goTo(link.path)}
                                        style={{
                                            width: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            padding: '12px 14px',
                                            borderRadius: '12px',
                                            border: active ? `1px solid ${link.color}25` : '1px solid transparent',
                                            background: active ? `${link.color}12` : 'none',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            fontWeight: active ? '700' : '500',
                                            color: active ? link.color : '#8892AA',
                                            textAlign: 'left',
                                            transition: 'all 0.15s ease',
                                            minHeight: '48px',
                                            marginBottom: '2px',
                                        }}
                                        onMouseOver={e => {
                                            if (!active) {
                                                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                                e.currentTarget.style.color = '#F0F4FF';
                                            }
                                        }}
                                        onMouseOut={e => {
                                            if (!active) {
                                                e.currentTarget.style.background = 'none';
                                                e.currentTarget.style.color = '#8892AA';
                                            }
                                        }}
                                    >
                                        <link.icon size={20} style={{ color: link.color, flexShrink: 0 }} />
                                        <span>{link.label}</span>
                                    </button>
                                );
                            })}

                            <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', margin: '8px 6px' }} />

                            <button
                                onClick={() => goTo('/help')}
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '12px 14px',
                                    borderRadius: '12px',
                                    border: '1px solid transparent',
                                    background: 'none',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    color: '#8892AA',
                                    textAlign: 'left',
                                    transition: 'all 0.15s ease',
                                    minHeight: '48px',
                                }}
                                onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#F0F4FF'; }}
                                onMouseOut={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#8892AA'; }}
                            >
                                <HelpCircle size={20} style={{ color: '#FFE600', flexShrink: 0 }} />
                                <span>Help & Support</span>
                            </button>
                        </div>

                        {/* Logout */}
                        <div style={{ padding: '12px 8px 24px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                            <button
                                onClick={handleLogout}
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '14px',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(244,63,94,0.2)',
                                    background: 'rgba(244,63,94,0.08)',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '700',
                                    color: '#F43F5E',
                                    textAlign: 'left',
                                    transition: 'all 0.15s ease',
                                    minHeight: '48px',
                                }}
                                onMouseOver={e => e.currentTarget.style.background = 'rgba(244,63,94,0.15)'}
                                onMouseOut={e => e.currentTarget.style.background = 'rgba(244,63,94,0.08)'}
                            >
                                <LogOut size={20} style={{ flexShrink: 0 }} />
                                <span>Sign Out</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
