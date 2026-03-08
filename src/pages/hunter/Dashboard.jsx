import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    Target, TrendingUp, Plus, ChevronRight, Clock, Zap,
    Wallet, Trophy, Flame, Star, ArrowRight, Shield,
    CheckCircle, Search, BarChart2, AlertCircle
} from 'lucide-react';
import {
    getHunterActiveStake, getTopBounties, getHunterStakes,
    getLiveBounties
} from '../../lib/firebaseService';

// Countdown component
function Countdown({ deadline }) {
    const [timeLeft, setTimeLeft] = useState(null);

    useEffect(() => {
        if (!deadline) return;
        const deadlineMs = deadline.toDate ? deadline.toDate().getTime() : new Date(deadline).getTime();
        const update = () => {
            const diff = deadlineMs - Date.now();
            if (diff <= 0) { setTimeLeft(null); return; }
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setTimeLeft({ h, m, s, total: diff });
        };
        update();
        const id = setInterval(update, 1000);
        return () => clearInterval(id);
    }, [deadline]);

    if (!timeLeft) return <span style={{ color: '#F72585', fontFamily: 'JetBrains Mono', fontWeight: '900', fontSize: '1.5rem' }}>EXPIRED</span>;

    const isUrgent = timeLeft.total < 3600000;
    const color = isUrgent ? '#F72585' : timeLeft.total < 7200000 ? '#F6C90E' : '#06FFA5';

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {[
                { val: String(timeLeft.h).padStart(2, '0'), label: 'hr' },
                { val: String(timeLeft.m).padStart(2, '0'), label: 'min' },
                { val: String(timeLeft.s).padStart(2, '0'), label: 'sec' },
            ].map(({ val, label }, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{
                        padding: '6px 10px', borderRadius: '8px',
                        background: `${color}12`, border: `1px solid ${color}25`,
                        fontFamily: 'JetBrains Mono', fontWeight: '900', fontSize: '1.5rem',
                        color, textShadow: `0 0 25px ${color}60`,
                        minWidth: '56px', textAlign: 'center', lineHeight: 1,
                    }}>
                        {val}
                    </div>
                    <span style={{ fontSize: '10px', color: '#4B5563', fontWeight: '600', marginTop: '4px', letterSpacing: '0.08em' }}>{label}</span>
                </div>
            ))}
        </div>
    );
}

// Stat card component
function StatCard({ icon: Icon, label, value, color, glow, trend }) {
    return (
        <div style={{
            padding: '24px', borderRadius: '20px',
            background: `${color}08`,
            border: `1px solid ${color}18`,
            transition: 'all 0.3s ease', cursor: 'default',
        }}
            onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 15px 40px ${glow}`; e.currentTarget.style.borderColor = `${color}30`; }}
            onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = `${color}18`; }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{
                    width: '44px', height: '44px', borderRadius: '12px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: `${color}12`, border: `1px solid ${color}25`,
                    boxShadow: `0 0 15px ${color}15`,
                }}>
                    <Icon size={22} style={{ color }} />
                </div>
                {trend !== undefined && (
                    <span style={{
                        padding: '3px 8px', borderRadius: '100px',
                        fontSize: '11px', fontWeight: '700',
                        background: trend >= 0 ? 'rgba(6,255,165,0.1)' : 'rgba(247,37,133,0.1)',
                        color: trend >= 0 ? '#06FFA5' : '#F72585',
                        border: `1px solid ${trend >= 0 ? 'rgba(6,255,165,0.2)' : 'rgba(247,37,133,0.2)'}`,
                    }}>
                        {trend >= 0 ? '+' : ''}{trend}%
                    </span>
                )}
            </div>
            <div style={{ fontSize: '26px', fontWeight: '900', color: '#F0F4FF', fontFamily: 'Space Grotesk', letterSpacing: '-0.02em', marginBottom: '4px' }}>
                {value}
            </div>
            <div style={{ fontSize: '12px', color: '#8892AA', fontWeight: '600', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</div>
        </div>
    );
}

// Bounty card
function BountyCard({ bounty, onClick }) {
    const palettes = {
        hard: { color: '#FF6B35', bg: 'rgba(255,107,53,0.06)', border: 'rgba(255,107,53,0.15)', glow: 'rgba(255,107,53,0.12)' },
        extreme: { color: '#F72585', bg: 'rgba(247,37,133,0.06)', border: 'rgba(247,37,133,0.15)', glow: 'rgba(247,37,133,0.12)' },
        medium: { color: '#F6C90E', bg: 'rgba(246,201,14,0.06)', border: 'rgba(246,201,14,0.15)', glow: 'rgba(246,201,14,0.12)' },
        easy: { color: '#06FFA5', bg: 'rgba(6,255,165,0.06)', border: 'rgba(6,255,165,0.15)', glow: 'rgba(6,255,165,0.12)' },
    };
    const key = (bounty.difficulty || 'medium').toLowerCase();
    const pal = palettes[key] || palettes.medium;

    return (
        <div onClick={onClick} style={{
            padding: '20px 22px', borderRadius: '16px',
            background: 'rgba(10,15,35,0.7)',
            border: '1px solid rgba(255,255,255,0.06)',
            cursor: 'pointer', transition: 'all 0.3s ease',
            display: 'flex', alignItems: 'center', gap: '16px',
        }}
            onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 12px 35px ${pal.glow}`; e.currentTarget.style.borderColor = pal.border; }}
            onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}>
            <div style={{
                width: '50px', height: '50px', borderRadius: '14px', flexShrink: 0,
                background: pal.bg, border: `1px solid ${pal.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <Target size={22} style={{ color: pal.color }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '15px', fontWeight: '700', color: '#F0F4FF', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {bounty.title}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: pal.color, background: pal.bg, border: `1px solid ${pal.border}`, padding: '2px 8px', borderRadius: '100px' }}>
                        {bounty.difficulty || 'MEDIUM'}
                    </span>
                    {bounty.category && (
                        <span style={{ fontSize: '11px', color: '#4B5563', fontWeight: '500' }}>· {bounty.category}</span>
                    )}
                </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '18px', fontWeight: '900', color: pal.color, fontFamily: 'JetBrains Mono', textShadow: `0 0 15px ${pal.glow}` }}>
                    ₹{(bounty.reward || 0).toLocaleString()}
                </div>
                <div style={{ fontSize: '11px', color: '#4B5563', fontWeight: '500' }}>
                    {bounty.hunter_count || 0} hunters
                </div>
            </div>
        </div>
    );
}

export default function HunterDashboard() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const [activeStake, setActiveStake] = useState(null);
    const [activeBounty, setActiveBounty] = useState(null);
    const [hotBounties, setHotBounties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (currentUser?.id) loadData();
    }, [currentUser]);

    async function loadData() {
        try {
            setLoading(true);
            const [stake, bounties] = await Promise.all([
                getHunterActiveStake(currentUser.id),
                getTopBounties(4),
            ]);
            setActiveStake(stake);
            setHotBounties(bounties || []);
            // The bounty details are embedded in the stake for now
            if (stake?.bounty_id) {
                setActiveBounty({
                    title: stake.bounty_title || 'Active Mission',
                    reward: stake.bounty_reward || 0,
                    deadline: stake.deadline,
                });
            }
        } catch (err) {
            console.error('Dashboard load error:', err);
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    }

    const stats = [
        {
            icon: Wallet, label: 'Vault Balance',
            value: `₹${(currentUser?.wallet_balance || 0).toLocaleString()}`,
            color: '#06FFA5', glow: 'rgba(6,255,165,0.15)',
        },
        {
            icon: Trophy, label: 'Total Earned',
            value: `₹${(currentUser?.total_earnings || 0).toLocaleString()}`,
            color: '#F6C90E', glow: 'rgba(246,201,14,0.15)',
        },
        {
            icon: CheckCircle, label: 'Completed',
            value: String(currentUser?.hunts_completed || 0),
            color: '#9B5DE5', glow: 'rgba(155,93,229,0.15)',
        },
        {
            icon: BarChart2, label: 'Success Rate',
            value: `${currentUser?.success_rate || 0}%`,
            color: '#00E5FF', glow: 'rgba(0,229,255,0.15)',
        },
    ];

    const greetingTime = new Date().getHours();
    const greeting = greetingTime < 12 ? 'Good Morning' : greetingTime < 18 ? 'Good Afternoon' : 'Good Evening';

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px', color: '#F0F4FF' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '24px', marginBottom: '40px' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '14px', color: '#8892AA', fontWeight: '500' }}>{greeting}, Hunter</span>
                        <span style={{ fontSize: '20px' }}>⚡</span>
                    </div>
                    <h1 style={{ fontSize: 'clamp(1.8rem, 5vw, 3rem)', fontWeight: '900', fontFamily: 'Space Grotesk', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                        {currentUser?.username || 'Hunter'}<span style={{ color: '#FF6B35', opacity: 0.4 }}>.</span>
                    </h1>
                    <p style={{ color: '#8892AA', marginTop: '8px', fontWeight: '500' }}>
                        Your battle station is <span style={{ color: '#06FFA5', fontWeight: '700' }}>armed and ready.</span>
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <Link to="/bounties" style={{ textDecoration: 'none' }}>
                        <button className="btn-secondary" style={{ minHeight: '44px', padding: '12px 20px', fontSize: '13px', gap: '8px', borderRadius: '12px', letterSpacing: '0.04em' }}>
                            <Search size={16} /> Explore Bounties
                        </button>
                    </Link>
                    <Link to="/hunter/vault" style={{ textDecoration: 'none' }}>
                        <button className="btn-primary" style={{ minHeight: '44px', padding: '12px 20px', fontSize: '13px', gap: '8px', borderRadius: '12px', letterSpacing: '0.04em' }}>
                            <Wallet size={16} /> Vault
                        </button>
                    </Link>
                </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }} className="grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, i) => (
                    <StatCard key={i} {...stat} />
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }} className="grid-cols-1 lg:grid-cols-2">
                {/* Active Mission */}
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '800', fontFamily: 'Space Grotesk', color: '#F0F4FF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Zap size={18} style={{ color: '#FF6B35' }} /> Active Mission
                        </h2>
                    </div>

                    {loading ? (
                        <div style={{ padding: '40px', borderRadius: '20px', background: 'rgba(10,15,35,0.6)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
                            <div className="spinner" style={{ margin: '0 auto 16px' }} />
                            <p style={{ color: '#8892AA', fontSize: '14px' }}>Loading mission...</p>
                        </div>
                    ) : activeStake && activeBounty ? (
                        <div style={{
                            padding: '28px', borderRadius: '20px',
                            background: 'rgba(10,15,35,0.85)',
                            border: '1px solid rgba(255,107,53,0.2)',
                            boxShadow: '0 0 40px rgba(255,107,53,0.06)',
                            position: 'relative', overflow: 'hidden',
                        }}>
                            <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: 'radial-gradient(circle, rgba(255,107,53,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FF6B35', display: 'inline-block', animation: 'pulseDot 1.5s ease-in-out infinite', boxShadow: '0 0 8px rgba(255,107,53,0.6)' }} />
                                <span style={{ fontSize: '11px', fontWeight: '800', color: '#FF6B35', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Active Hunt</span>
                            </div>

                            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#F0F4FF', fontFamily: 'Space Grotesk', marginBottom: '8px' }}>
                                {activeBounty.title}
                            </h3>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Wallet size={14} style={{ color: '#FF6B35' }} />
                                    <span style={{ fontSize: '13px', color: '#8892AA' }}>Staked: </span>
                                    <span style={{ fontSize: '14px', fontWeight: '800', color: '#FF6B35', fontFamily: 'JetBrains Mono' }}>
                                        ₹{(activeStake.stake_amount || 0).toLocaleString()}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Trophy size={14} style={{ color: '#F6C90E' }} />
                                    <span style={{ fontSize: '13px', color: '#8892AA' }}>Prize: </span>
                                    <span style={{ fontSize: '14px', fontWeight: '800', color: '#F6C90E', fontFamily: 'JetBrains Mono' }}>
                                        ₹{(activeBounty.reward || 0).toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            {activeBounty.deadline && (
                                <div style={{ marginBottom: '24px' }}>
                                    <div style={{ fontSize: '12px', color: '#8892AA', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }}>
                                        Time Remaining
                                    </div>
                                    <Countdown deadline={activeBounty.deadline} />
                                </div>
                            )}

                            <Link to={`/bounties/${activeStake.bounty_id}`} style={{ textDecoration: 'none' }}>
                                <button className="btn-primary" style={{ width: '100%', gap: '8px', fontSize: '13px', borderRadius: '12px', letterSpacing: '0.04em' }}>
                                    View Mission <ArrowRight size={16} />
                                </button>
                            </Link>
                        </div>
                    ) : (
                        <div style={{
                            padding: '40px 28px', borderRadius: '20px', textAlign: 'center',
                            background: 'rgba(10,15,35,0.5)',
                            border: '1px dashed rgba(255,255,255,0.1)',
                        }}>
                            <div style={{
                                width: '60px', height: '60px', borderRadius: '18px',
                                background: 'rgba(255,107,53,0.08)', border: '1px solid rgba(255,107,53,0.2)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 20px', boxShadow: '0 0 25px rgba(255,107,53,0.08)',
                            }}>
                                <Target size={28} style={{ color: '#FF6B35', opacity: 0.6 }} />
                            </div>
                            <p style={{ color: '#8892AA', marginBottom: '20px', fontWeight: '500', lineHeight: 1.6 }}>
                                No active mission. <br />
                                <span style={{ color: '#FF6B35', fontWeight: '700' }}>Explore the Arena to stake your first hunt.</span>
                            </p>
                            <Link to="/bounties" style={{ textDecoration: 'none' }}>
                                <button className="btn-primary" style={{ gap: '8px', fontSize: '13px', borderRadius: '12px' }}>
                                    <Target size={16} /> Find a Mission
                                </button>
                            </Link>
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div>
                    <h2 style={{ fontSize: '18px', fontWeight: '800', fontFamily: 'Space Grotesk', color: '#F0F4FF', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Flame size={18} style={{ color: '#FF6B35' }} /> Quick Actions
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {[
                            { to: '/bounties', icon: Search, label: 'Explore Bounties', desc: 'Browse all live missions', color: '#00E5FF', bg: 'rgba(0,229,255,0.06)', border: 'rgba(0,229,255,0.15)' },
                            { to: '/hunter/vault', icon: Wallet, label: 'Manage Vault', desc: 'Deposit, withdraw, or stake', color: '#06FFA5', bg: 'rgba(6,255,165,0.06)', border: 'rgba(6,255,165,0.15)' },
                            { to: '/hunter/submissions', icon: CheckCircle, label: 'My Submissions', desc: 'Track your submitted work', color: '#9B5DE5', bg: 'rgba(155,93,229,0.06)', border: 'rgba(155,93,229,0.15)' },
                            { to: '/leaderboard', icon: Trophy, label: 'Leaderboard', desc: 'See how you rank among hunters', color: '#F6C90E', bg: 'rgba(246,201,14,0.06)', border: 'rgba(246,201,14,0.15)' },
                        ].map((action, i) => (
                            <Link key={i} to={action.to} style={{ textDecoration: 'none' }}>
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 18px',
                                    borderRadius: '14px', background: action.bg,
                                    border: `1px solid ${action.border.replace('0.15', '0.12')}`,
                                    cursor: 'pointer', transition: 'all 0.2s ease',
                                    minHeight: '68px',
                                }}
                                    onMouseOver={e => { e.currentTarget.style.transform = 'translateX(4px)'; e.currentTarget.style.boxShadow = `0 6px 20px ${action.border.replace('0.15', '0.12')}`; e.currentTarget.style.borderColor = action.border; }}
                                    onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = action.border.replace('0.15', '0.12'); }}>
                                    <div style={{
                                        width: '42px', height: '42px', flexShrink: 0, borderRadius: '12px',
                                        background: `${action.color}12`,
                                        border: `1px solid ${action.color}25`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        boxShadow: `0 0 12px ${action.color}10`,
                                    }}>
                                        <action.icon size={20} style={{ color: action.color }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#F0F4FF', marginBottom: '2px' }}>{action.label}</div>
                                        <div style={{ fontSize: '12px', color: '#8892AA', fontWeight: '500' }}>{action.desc}</div>
                                    </div>
                                    <ChevronRight size={16} style={{ color: '#4B5563', flexShrink: 0 }} />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* Hot Bounties */}
            <div style={{ marginTop: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '800', fontFamily: 'Space Grotesk', color: '#F0F4FF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Flame size={18} style={{ color: '#FF6B35' }} /> Hot Bounties
                    </h2>
                    <Link to="/bounties" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', color: '#00E5FF', fontSize: '13px', fontWeight: '700' }}>
                        View all <ChevronRight size={16} />
                    </Link>
                </div>

                {error && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', borderRadius: '12px', background: 'rgba(247,37,133,0.08)', border: '1px solid rgba(247,37,133,0.2)', color: '#F72585', marginBottom: '16px' }}>
                        <AlertCircle size={16} />
                        <span style={{ fontSize: '13px' }}>{error}</span>
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {loading ? (
                        [1, 2, 3].map(i => (
                            <div key={i} style={{ height: '82px', borderRadius: '16px', background: 'rgba(10,15,35,0.5)' }} className="skeleton" />
                        ))
                    ) : hotBounties.length > 0 ? (
                        hotBounties.map(bounty => (
                            <BountyCard key={bounty.id} bounty={bounty} onClick={() => navigate(`/bounties/${bounty.id}`)} />
                        ))
                    ) : (
                        <div style={{ padding: '32px', borderRadius: '16px', textAlign: 'center', background: 'rgba(10,15,35,0.5)', border: '1px dashed rgba(255,255,255,0.08)' }}>
                            <p style={{ color: '#8892AA', fontWeight: '500' }}>No live bounties at the moment. Check back soon!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
