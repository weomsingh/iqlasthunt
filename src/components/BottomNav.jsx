import { Link, useLocation } from 'react-router-dom';
import { Home, Target, Wallet, MessageSquare, Plus, History, Trophy, Settings } from 'lucide-react';

export default function BottomNav({ role }) {
    const location = useLocation();

    const hunterLinks = [
        { path: '/hunter/dashboard', label: 'Home', icon: Home, color: '#06B6D4' },
        { path: '/hunter/arena', label: 'Arena', icon: Target, color: '#F97316' },
        { path: '/hunter/war-room', label: 'War Room', icon: MessageSquare, color: '#8B5CF6' },
        { path: '/hunter/vault', label: 'Vault', icon: Wallet, color: '#10B981' },
        { path: '/hunter/settings', label: 'Profile', icon: Settings, color: '#8892AA' },
    ];

    const payerLinks = [
        { path: '/payer/dashboard', label: 'Home', icon: Home, color: '#06B6D4' },
        { path: '/payer/live-bounties', label: 'Bounties', icon: Target, color: '#F97316' },
        { path: '/payer/post-bounty', label: 'Post', icon: Plus, color: '#10B981', isAccent: true },
        { path: '/payer/war-room', label: 'War Room', icon: MessageSquare, color: '#8B5CF6' },
        { path: '/payer/vault', label: 'Vault', icon: Wallet, color: '#F59E0B' },
    ];

    const links = role === 'hunter' ? hunterLinks : payerLinks;

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
            style={{
                background: 'rgba(8,11,20,0.95)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderTop: '1px solid rgba(255,255,255,0.08)',
                paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
            }}
        >
            <div style={{
                display: 'flex',
                justifyContent: 'space-around',
                alignItems: 'center',
                padding: '8px 8px 0',
            }}>
                {links.map(link => {
                    const Icon = link.icon;
                    const isActive = location.pathname === link.path ||
                        (link.path !== '/hunter/dashboard' && link.path !== '/payer/dashboard' &&
                            location.pathname.startsWith(link.path));

                    if (link.isAccent) {
                        return (
                            <Link
                                key={link.path}
                                to={link.path}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '3px',
                                    minWidth: '60px',
                                    textDecoration: 'none',
                                    transform: 'translateY(-6px)',
                                }}
                            >
                                <div style={{
                                    width: '52px', height: '52px',
                                    borderRadius: '16px',
                                    background: 'linear-gradient(135deg, #10B981, #06B6D4)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 8px 30px rgba(0,255,148,0.4)',
                                }}>
                                    <Icon size={24} style={{ color: '#000' }} />
                                </div>
                                <span style={{ fontSize: '9px', fontWeight: '700', color: '#10B981', letterSpacing: '0.05em' }}>
                                    {link.label}
                                </span>
                            </Link>
                        );
                    }

                    return (
                        <Link
                            key={link.path}
                            to={link.path}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '3px',
                                minWidth: '60px',
                                padding: '6px 8px',
                                borderRadius: '12px',
                                textDecoration: 'none',
                                transition: 'all 0.15s ease',
                                background: isActive ? `${link.color}12` : 'none',
                            }}
                        >
                            <div style={{
                                width: '42px', height: '42px',
                                borderRadius: '12px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: isActive ? `${link.color}15` : 'none',
                                border: isActive ? `1px solid ${link.color}30` : '1px solid transparent',
                                transition: 'all 0.15s ease',
                            }}>
                                <Icon
                                    size={20}
                                    strokeWidth={isActive ? 2.5 : 2}
                                    style={{ color: isActive ? link.color : '#8892AA' }}
                                />
                            </div>
                            <span style={{
                                fontSize: '9px',
                                fontWeight: isActive ? '700' : '500',
                                color: isActive ? link.color : '#8892AA',
                                letterSpacing: '0.03em',
                                transition: 'color 0.15s ease',
                            }}>
                                {link.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
