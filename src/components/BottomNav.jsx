import { Link, useLocation } from 'react-router-dom';
import { Home, Target, Wallet, Zap, History as HistoryIcon, MessageSquare } from 'lucide-react';

export default function BottomNav({ role }) {
    const location = useLocation();

    const hunterLinks = [
        { path: '/hunter/dashboard', label: 'Home', icon: Home },
        { path: '/hunter/arena', label: 'Arena', icon: Target },
        { path: '/hunter/war-room', label: 'War Room', icon: MessageSquare },
        { path: '/hunter/vault', label: 'Vault', icon: Wallet },
    ];

    const payerLinks = [
        { path: '/payer/dashboard', label: 'Home', icon: Home },
        { path: '/payer/live-bounties', label: 'Live', icon: Zap },
        { path: '/payer/war-room', label: 'War Room', icon: MessageSquare },
        { path: '/payer/vault', label: 'Vault', icon: Wallet },
    ];

    const links = role === 'hunter' ? hunterLinks : payerLinks;

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-iq-background/90 backdrop-blur-lg border-t border-white/5 pb-safe md:hidden">
            <div className="flex justify-around items-center px-2 py-3">
                {links.map(link => {
                    const Icon = link.icon;
                    const isActive = location.pathname === link.path;
                    return (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={`flex flex-col items-center gap-1 min-w-[64px] transition-colors ${isActive ? 'text-iq-primary' : 'text-iq-text-secondary hover:text-white'
                                }`}
                        >
                            <div className={`p-1.5 rounded-full transition-all ${isActive ? 'bg-iq-primary/10' : ''
                                }`}>
                                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                            </div>
                            <span className="text-[10px] font-medium">{link.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}

