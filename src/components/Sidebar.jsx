import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, Target, Wallet, LogOut, Zap, History as HistoryIcon, Shield, MessageSquare, Menu, Settings } from 'lucide-react';

export default function Sidebar({ role }) {
    const location = useLocation();
    const { signOut } = useAuth();

    const hunterLinks = [
        { path: '/hunter/dashboard', label: 'Dashboard', icon: Home },
        { path: '/hunter/arena', label: 'Arena', icon: Target },
        { path: '/hunter/war-room', label: 'War Room', icon: MessageSquare },
        { path: '/hunter/history', label: 'History', icon: HistoryIcon },
        { path: '/hunter/vault', label: 'Vault', icon: Wallet },
        { path: '/hunter/settings', label: 'Settings', icon: Settings },
    ];

    const payerLinks = [
        { path: '/payer/dashboard', label: 'Dashboard', icon: Home },
        { path: '/payer/live-bounties', label: 'My Bounties', icon: Zap },
        { path: '/payer/war-room', label: 'War Room', icon: MessageSquare },
        { path: '/payer/history', label: 'History', icon: HistoryIcon },
        { path: '/payer/vault', label: 'Vault', icon: Wallet },
        { path: '/payer/settings', label: 'Settings', icon: Settings },
    ];

    const adminLinks = [
        { path: '/admin/dashboard', label: 'Dashboard', icon: Shield },
    ];

    const links = role === 'hunter' ? hunterLinks : role === 'payer' ? payerLinks : adminLinks;

    return (
        <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 bg-iq-background border-r border-white/5 z-40 pt-20 pb-6 px-4">
            <nav className="flex-1 space-y-2 mt-6">
                {links.map(link => {
                    const Icon = link.icon;
                    const isActive = location.pathname === link.path;
                    return (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                ? 'bg-iq-primary/10 text-iq-primary font-medium'
                                : 'text-iq-text-secondary hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <Icon size={20} className={isActive ? 'text-iq-primary' : 'group-hover:text-white'} />
                            <span>{link.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <button
                onClick={signOut}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-iq-text-secondary hover:bg-iq-error/10 hover:text-iq-error transition-all mt-auto"
            >
                <LogOut size={20} />
                <span>Sign Out</span>
            </button>
        </aside>
    );
}

