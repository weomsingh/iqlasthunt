import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Target, Wallet, ChevronDown, LogOut, User, Settings,
    Menu, X, Grid, Trophy, FileText, Plus, BarChart2, Star, Bell, Home,
    Zap, Search
} from 'lucide-react';

// Role-specific nav configs
const HUNTER_NAV = [
    { to: '/hunter/dashboard', icon: Home, label: 'Dashboard' },
    { to: '/bounties', icon: Search, label: 'Explore' },
    { to: '/hunter/vault', icon: Wallet, label: 'Vault' },
    { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
];

const PAYER_NAV = [
    { to: '/payer/dashboard', icon: Home, label: 'Dashboard' },
    { to: '/payer/post-bounty', icon: Plus, label: 'Post Bounty' },
    { to: '/payer/vault', icon: Wallet, label: 'Vault' },
    { to: '/payer/bounties', icon: Grid, label: 'My Bounties' },
];

const ADMIN_NAV = [
    { to: '/admin/dashboard', icon: BarChart2, label: 'Overview' },
    { to: '/admin/transactions', icon: FileText, label: 'Transactions' },
    { to: '/admin/hunters', icon: User, label: 'Hunters' },
    { to: '/admin/bounties', icon: Grid, label: 'Bounties' },
];

export default function Header() {
    const { currentUser, signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const dropdownRef = useRef(null);

    const role = currentUser?.role;
    const navLinks = role === 'hunter' ? HUNTER_NAV : role === 'payer' ? PAYER_NAV : role === 'admin' ? ADMIN_NAV : [];

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 8);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const handleClick = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    useEffect(() => { setMobileOpen(false); }, [location.pathname]);

    async function handleSignOut() {
        setProfileOpen(false);
        await signOut();
    }

    const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

    if (!currentUser) return null;

    const wallet = currentUser?.wallet_balance ?? 0;
    const currency = currentUser?.currency ?? 'INR';
    const symbol = currency === 'INR' ? '₹' : '$';
    const initials = (currentUser?.username || currentUser?.full_name || 'U').slice(0, 2).toUpperCase();

    return (
        <>
            {/* ─── Desktop Header ─── */}
            <header style={{
                position: 'sticky', top: 0, zIndex: 100,
                background: scrolled ? 'rgba(5,8,20,0.95)' : 'rgba(5,8,20,0.85)',
                backdropFilter: 'blur(24px)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                boxShadow: scrolled ? '0 4px 30px rgba(0,0,0,0.5)' : 'none',
                transition: 'all 0.3s ease',
                padding: '0 24px',
                height: '64px',
                display: 'flex', alignItems: 'center',
            }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', gap: '32px' }}>

                    {/* Logo */}
                    <Link to={`/${role}/dashboard`} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                        <img src="/finallandstrans.png" alt="IQHUNT" style={{ height: '36px', objectFit: 'contain', filter: 'brightness(1.1)' }} />
                    </Link>

                    {/* Nav links */}
                    <nav style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }} className="hidden md:flex">
                        {navLinks.map(({ to, icon: Icon, label }) => {
                            const active = isActive(to);
                            return (
                                <Link key={to} to={to} style={{
                                    display: 'flex', alignItems: 'center', gap: '7px',
                                    padding: '8px 14px', borderRadius: '10px',
                                    textDecoration: 'none',
                                    fontSize: '13px', fontWeight: active ? '700' : '500',
                                    color: active ? '#FF6B35' : '#8892AA',
                                    background: active ? 'rgba(255,107,53,0.1)' : 'transparent',
                                    border: active ? '1px solid rgba(255,107,53,0.2)' : '1px solid transparent',
                                    transition: 'all 0.2s ease', minHeight: '36px',
                                    letterSpacing: active ? '0.01em' : '0',
                                }}
                                    onMouseOver={e => { if (!active) { e.currentTarget.style.color = '#C4CFED'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; } }}
                                    onMouseOut={e => { if (!active) { e.currentTarget.style.color = '#8892AA'; e.currentTarget.style.background = 'transparent'; } }}>
                                    <Icon size={15} /> {label}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Right side */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto' }}>
                        {/* Wallet balance */}
                        <Link to={`/${role === 'hunter' ? 'hunter' : 'payer'}/vault`} style={{ textDecoration: 'none' }}>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '8px 14px', borderRadius: '10px',
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                cursor: 'pointer', transition: 'all 0.2s ease',
                            }}
                                onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = 'rgba(255,107,53,0.2)'; }}
                                onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}>
                                <Wallet size={14} style={{ color: '#06FFA5' }} />
                                <span style={{ fontSize: '13px', fontWeight: '800', color: '#06FFA5', fontFamily: 'JetBrains Mono', letterSpacing: '-0.02em' }}>
                                    {symbol}{wallet.toLocaleString()}
                                </span>
                            </div>
                        </Link>

                        {/* Profile dropdown */}
                        <div style={{ position: 'relative' }} ref={dropdownRef}>
                            <button onClick={() => setProfileOpen(!profileOpen)} style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '6px 10px 6px 6px', borderRadius: '10px',
                                background: profileOpen ? 'rgba(255,107,53,0.1)' : 'rgba(255,255,255,0.04)',
                                border: profileOpen ? '1px solid rgba(255,107,53,0.3)' : '1px solid rgba(255,255,255,0.08)',
                                cursor: 'pointer', transition: 'all 0.2s ease', minHeight: '44px',
                            }}>
                                <div style={{
                                    width: '30px', height: '30px', borderRadius: '8px',
                                    background: 'linear-gradient(135deg, #FF6B35, #9B5DE5)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '11px', fontWeight: '900', color: '#ffffff',
                                    fontFamily: 'Space Grotesk',
                                }}>
                                    {currentUser?.avatar_url ? (
                                        <img src={currentUser.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '8px', objectFit: 'cover' }} />
                                    ) : initials}
                                </div>
                                <div className="hidden md:block text-left" style={{ lineHeight: 1.2 }}>
                                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#F0F4FF', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {currentUser?.username || 'User'}
                                    </div>
                                    <div style={{ fontSize: '10px', fontWeight: '600', color: role === 'hunter' ? '#FF6B35' : role === 'payer' ? '#4361EE' : '#9B5DE5', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                        {role === 'admin' ? '⭐ ADMIN' : role}
                                    </div>
                                </div>
                                <ChevronDown size={14} style={{ color: '#8892AA', transform: profileOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
                            </button>

                            {/* Dropdown */}
                            {profileOpen && (
                                <div style={{
                                    position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                                    width: '240px', borderRadius: '16px',
                                    background: 'rgba(8,12,28,0.98)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    backdropFilter: 'blur(24px)',
                                    boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
                                    overflow: 'hidden',
                                    animation: 'scaleIn 0.15s ease',
                                }}>
                                    {/* User info */}
                                    <div style={{ padding: '20px 18px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{
                                                width: '40px', height: '40px', borderRadius: '10px',
                                                background: 'linear-gradient(135deg, #FF6B35, #9B5DE5)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '14px', fontWeight: '900', color: '#fff', fontFamily: 'Space Grotesk',
                                                flexShrink: 0,
                                            }}>
                                                {currentUser?.avatar_url ? (
                                                    <img src={currentUser.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '10px', objectFit: 'cover' }} />
                                                ) : initials}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '700', color: '#F0F4FF', fontSize: '14px', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {currentUser?.full_name || currentUser?.username || 'User'}
                                                </div>
                                                <div style={{ fontSize: '12px', color: '#8892AA', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {currentUser?.email}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: '8px',
                                            marginTop: '12px', padding: '8px 12px', borderRadius: '10px',
                                            background: 'rgba(6,255,165,0.06)', border: '1px solid rgba(6,255,165,0.15)',
                                        }}>
                                            <Wallet size={14} style={{ color: '#06FFA5' }} />
                                            <span style={{ fontSize: '13px', fontWeight: '800', color: '#06FFA5', fontFamily: 'JetBrains Mono' }}>
                                                {symbol}{wallet.toLocaleString()}
                                            </span>
                                            <span style={{ fontSize: '11px', color: '#4B5563', marginLeft: 'auto' }}>BALANCE</span>
                                        </div>
                                    </div>

                                    {/* Menu items */}
                                    <div style={{ padding: '8px' }}>
                                        {[
                                            { icon: User, label: 'Profile', to: `/${role}/settings` },
                                            { icon: Settings, label: 'Settings', to: `/${role}/settings?tab=settings` },
                                        ].map((item) => (
                                            <Link key={item.label} to={item.to} onClick={() => setProfileOpen(false)} style={{
                                                display: 'flex', alignItems: 'center', gap: '10px',
                                                padding: '10px 12px', borderRadius: '10px',
                                                color: '#C4CFED', textDecoration: 'none',
                                                fontSize: '14px', fontWeight: '500',
                                                transition: 'all 0.15s ease',
                                                minHeight: '44px',
                                            }}
                                                onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#F0F4FF'; }}
                                                onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#C4CFED'; }}>
                                                <item.icon size={15} style={{ color: '#8892AA' }} />
                                                {item.label}
                                            </Link>
                                        ))}

                                        <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '8px 0' }} />

                                        <button onClick={handleSignOut} style={{
                                            width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                                            padding: '10px 12px', borderRadius: '10px',
                                            color: '#F72585', background: 'none', border: 'none',
                                            fontSize: '14px', fontWeight: '600', cursor: 'pointer',
                                            transition: 'all 0.15s ease', minHeight: '44px',
                                        }}
                                            onMouseOver={e => e.currentTarget.style.background = 'rgba(247,37,133,0.08)'}
                                            onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                                            <LogOut size={15} /> Sign Out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Mobile menu toggle */}
                        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden" style={{
                            width: '40px', height: '40px', borderRadius: '10px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            color: '#F0F4FF', cursor: 'pointer',
                        }}>
                            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </div>
            </header>

            {/* ─── Mobile Sidebar ─── */}
            {mobileOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 99 }}>
                    {/* Overlay */}
                    <div onClick={() => setMobileOpen(false)} style={{
                        position: 'absolute', inset: 0,
                        background: 'rgba(5,8,20,0.8)', backdropFilter: 'blur(8px)',
                    }} />

                    {/* Sidebar */}
                    <div style={{
                        position: 'absolute', left: 0, top: 0, bottom: 0, width: '300px',
                        background: 'rgba(8,12,28,0.99)',
                        borderRight: '1px solid rgba(255,255,255,0.06)',
                        padding: '24px 16px',
                        overflowY: 'auto',
                        animation: 'slideInLeft 0.25s ease',
                    }}>
                        {/* Logo */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', paddingHorizontal: '8px' }}>
                            <img src="/finallandstrans.png" alt="IQHUNT" style={{ height: '32px', objectFit: 'contain', filter: 'brightness(1.1)' }} />
                            <button onClick={() => setMobileOpen(false)} style={{
                                width: '36px', height: '36px', borderRadius: '8px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                                color: '#F0F4FF', cursor: 'pointer',
                            }}>
                                <X size={18} />
                            </button>
                        </div>

                        {/* User info */}
                        <div style={{
                            padding: '16px', borderRadius: '14px', marginBottom: '24px',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.06)',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                <div style={{
                                    width: '44px', height: '44px', borderRadius: '10px',
                                    background: 'linear-gradient(135deg, #FF6B35, #9B5DE5)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '16px', fontWeight: '900', color: '#fff', fontFamily: 'Space Grotesk',
                                }}>
                                    {initials}
                                </div>
                                <div>
                                    <div style={{ fontWeight: '700', color: '#F0F4FF', fontSize: '14px' }}>{currentUser?.username || 'User'}</div>
                                    <div style={{ fontSize: '11px', color: '#FF6B35', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{role}</div>
                                </div>
                            </div>
                            <div style={{
                                padding: '10px 14px', borderRadius: '10px',
                                background: 'rgba(6,255,165,0.06)',
                                border: '1px solid rgba(6,255,165,0.15)',
                                display: 'flex', alignItems: 'center', gap: '8px',
                            }}>
                                <Wallet size={16} style={{ color: '#06FFA5' }} />
                                <span style={{ fontSize: '16px', fontWeight: '900', color: '#06FFA5', fontFamily: 'JetBrains Mono' }}>
                                    {symbol}{wallet.toLocaleString()}
                                </span>
                            </div>
                        </div>

                        {/* Nav */}
                        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {navLinks.map(({ to, icon: Icon, label }) => {
                                const active = isActive(to);
                                return (
                                    <Link key={to} to={to} onClick={() => setMobileOpen(false)} style={{
                                        display: 'flex', alignItems: 'center', gap: '12px',
                                        padding: '14px 16px', borderRadius: '12px', textDecoration: 'none',
                                        fontSize: '14px', fontWeight: active ? '700' : '500',
                                        color: active ? '#FF6B35' : '#8892AA',
                                        background: active ? 'rgba(255,107,53,0.1)' : 'transparent',
                                        border: active ? '1px solid rgba(255,107,53,0.2)' : '1px solid transparent',
                                        transition: 'all 0.2s ease', minHeight: '50px',
                                    }}>
                                        <Icon size={18} /> {label}
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* Bottom actions */}
                        <div style={{ marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <Link to={`/${role}/settings`} onClick={() => setMobileOpen(false)} style={{
                                display: 'flex', alignItems: 'center', gap: '12px',
                                padding: '14px 16px', borderRadius: '12px', textDecoration: 'none',
                                fontSize: '14px', fontWeight: '500', color: '#8892AA', minHeight: '50px',
                            }}
                                onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#C4CFED'; }}
                                onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8892AA'; }}>
                                <Settings size={18} /> Settings
                            </Link>
                            <button onClick={handleSignOut} style={{
                                display: 'flex', alignItems: 'center', gap: '12px',
                                padding: '14px 16px', borderRadius: '12px', background: 'rgba(247,37,133,0.08)',
                                border: '1px solid rgba(247,37,133,0.2)',
                                color: '#F72585', fontWeight: '700', fontSize: '14px',
                                cursor: 'pointer', textAlign: 'left', minHeight: '50px', width: '100%',
                            }}>
                                <LogOut size={18} /> Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
