import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';
import BountyCard from '../../components/BountyCard';
import {
    Target, Trophy, TrendingUp, Clock, ArrowRight, Zap, CheckCircle,
    Wallet, Settings, MessageSquare, Flame, BarChart2, Star
} from 'lucide-react';

// Live Countdown Component
function Countdown({ targetDate }) {
    const [timeLeft, setTimeLeft] = useState(calc());

    function calc() {
        const diff = new Date(targetDate) - new Date();
        if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
        return {
            days: Math.floor(diff / 86400000),
            hours: Math.floor((diff % 86400000) / 3600000),
            minutes: Math.floor((diff % 3600000) / 60000),
            seconds: Math.floor((diff % 60000) / 1000),
            expired: false
        };
    }

    useEffect(() => {
        const timer = setInterval(() => setTimeLeft(calc()), 1000);
        return () => clearInterval(timer);
    }, [targetDate]);

    if (timeLeft.expired) return <span style={{ color: '#F43F5E', fontFamily: 'JetBrains Mono', fontWeight: '900' }}>EXPIRED</span>;

    const segments = [
        { value: timeLeft.days, label: 'D' },
        { value: timeLeft.hours, label: 'H' },
        { value: timeLeft.minutes, label: 'M' },
        { value: timeLeft.seconds, label: 'S' },
    ];

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {segments.map((seg, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{
                        background: 'rgba(0,0,0,0.4)',
                        borderRadius: '8px',
                        padding: '4px 8px',
                        fontFamily: 'JetBrains Mono',
                        fontWeight: '900',
                        fontSize: '18px',
                        color: timeLeft.days === 0 && timeLeft.hours < 3 ? '#FF6B35' : '#FFE600',
                        textShadow: '0 0 15px currentcolor',
                        minWidth: '40px',
                        textAlign: 'center',
                    }}>
                        {String(seg.value).padStart(2, '0')}
                    </div>
                    <span style={{ color: '#4A5568', fontSize: '11px', fontWeight: '700' }}>{seg.label}</span>
                    {i < 3 && <span style={{ color: '#7C8FC0', fontSize: '16px', fontWeight: '900', opacity: 0.5 }}>:</span>}
                </div>
            ))}
        </div>
    );
}

export default function HunterDashboard() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [activeStake, setActiveStake] = useState(null);
    const [recentBounties, setRecentBounties] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (currentUser) loadDashboardData();
    }, [currentUser]);

    async function loadDashboardData() {
        try {
            const { data: stakes } = await supabase
                .from('hunter_stakes')
                .select('*, bounty:bounties(*)')
                .eq('hunter_id', currentUser.id)
                .eq('status', 'active');

            if (stakes && stakes.length > 0) {
                const validStake = stakes.find(s => {
                    if (!s.bounty?.submission_deadline) return true;
                    return new Date(s.bounty.submission_deadline) > new Date();
                });
                setActiveStake(validStake || null);
            }

            const { data: bounties } = await supabase
                .from('bounties')
                .select('*')
                .eq('status', 'live')
                .order('created_at', { ascending: false })
                .limit(6);

            setRecentBounties(bounties || []);
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    }

    const currency = currentUser?.currency === 'INR' ? '₹' : '$';

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <div className="spinner" />
            </div>
        );
    }

    // Time progress for active mission
    let progressPct = 0;
    let isUrgent = false;
    if (activeStake?.bounty?.submission_deadline && activeStake?.bounty?.created_at) {
        const start = new Date(activeStake.bounty.created_at).getTime();
        const end = new Date(activeStake.bounty.submission_deadline).getTime();
        const now = Date.now();
        const total = end - start;
        const remaining = end - now;
        if (total > 0) progressPct = (remaining / total) * 100;
        if (progressPct < 20) isUrgent = true;
    }

    const statsCards = [
        {
            label: 'Total Earnings', value: `${currency}${(currentUser?.total_earnings || 0).toLocaleString()}`,
            icon: Wallet, color: '#00FF94', bg: 'rgba(0,255,148,0.08)', border: 'rgba(0,255,148,0.15)'
        },
        {
            label: 'Active Hunts', value: activeStake ? '1' : '0',
            icon: Target, color: '#FF6B35', bg: 'rgba(255,107,53,0.08)', border: 'rgba(255,107,53,0.15)'
        },
        {
            label: 'Completed', value: currentUser?.hunts_completed || 0,
            icon: CheckCircle, color: '#00E5FF', bg: 'rgba(0,229,255,0.08)', border: 'rgba(0,229,255,0.15)'
        },
        {
            label: 'Win Rate', value: `${currentUser?.success_rate?.toFixed(0) || 0}%`,
            icon: Trophy, color: '#FFE600', bg: 'rgba(255,230,0,0.08)', border: 'rgba(255,230,0,0.15)'
        },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', animation: 'fadeInUp 0.4s ease' }}>

            {/* ===== WELCOME HEADER ===== */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <p style={{ color: '#8892AA', fontSize: '14px', fontWeight: '500' }}>
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
                <h1 style={{
                    fontSize: 'clamp(24px, 5vw, 36px)',
                    fontWeight: '800',
                    fontFamily: 'Space Grotesk',
                    color: '#F0F4FF',
                    lineHeight: 1.2,
                }}>
                    Welcome back,{' '}
                    <span style={{
                        background: 'linear-gradient(135deg, #00FF94, #00E5FF)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
                    }}>
                        {currentUser?.username}
                    </span> 👋
                </h1>
                <p style={{ color: '#8892AA' }}>
                    {activeStake ? '🔥 You have an active mission. Stay focused!' : 'Ready to hunt? Browse new bounties below.'}
                </p>
            </div>

            {/* ===== STATS GRID ===== */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                {statsCards.map((stat, i) => (
                    <div key={i} style={{
                        padding: '20px',
                        borderRadius: '16px',
                        background: stat.bg,
                        border: `1px solid ${stat.border}`,
                        display: 'flex', alignItems: 'center', gap: '14px',
                        transition: 'all 0.2s ease',
                        cursor: 'default',
                    }}
                        onMouseOver={e => e.currentTarget.style.boxShadow = `0 8px 30px ${stat.color}15`}
                        onMouseOut={e => e.currentTarget.style.boxShadow = 'none'}
                    >
                        <div style={{
                            width: '44px', height: '44px', borderRadius: '12px',
                            background: `${stat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                        }}>
                            <stat.icon size={22} style={{ color: stat.color }} />
                        </div>
                        <div>
                            <p style={{ fontSize: '11px', color: '#8892AA', fontWeight: '600', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '2px' }}>
                                {stat.label}
                            </p>
                            <p style={{ fontSize: '22px', fontWeight: '900', color: '#F0F4FF', fontFamily: 'Space Grotesk', lineHeight: 1 }}>
                                {stat.value}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ===== ACTIVE MISSION CARD ===== */}
            {activeStake ? (
                <div style={{
                    borderRadius: '20px',
                    background: 'linear-gradient(135deg, rgba(0,255,148,0.05), rgba(0,229,255,0.05), rgba(168,85,247,0.05))',
                    border: '1px solid rgba(0,255,148,0.2)',
                    padding: '28px',
                    position: 'relative',
                    overflow: 'hidden',
                }}>
                    {/* Background glow */}
                    <div style={{
                        position: 'absolute', top: '-40px', right: '-40px',
                        width: '200px', height: '200px', borderRadius: '50%',
                        background: 'rgba(0,255,148,0.08)', filter: 'blur(60px)',
                        pointerEvents: 'none',
                    }} />

                    {/* Live badge */}
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        padding: '6px 14px', borderRadius: '20px', marginBottom: '16px',
                        background: 'rgba(255,45,120,0.12)', border: '1px solid rgba(255,45,120,0.3)',
                    }}>
                        <span style={{
                            width: '8px', height: '8px', borderRadius: '50%',
                            background: '#FF2D78', display: 'inline-block',
                            animation: 'pulseDot 1.5s ease-in-out infinite',
                        }} />
                        <span style={{ color: '#FF2D78', fontWeight: '800', fontSize: '11px', letterSpacing: '0.12em' }}>
                            LIVE MISSION IN PROGRESS
                        </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#F0F4FF', marginBottom: '8px', fontFamily: 'Space Grotesk' }}>
                                {activeStake.bounty.title}
                            </h2>

                            {/* Countdown */}
                            <div style={{
                                padding: '16px 20px', borderRadius: '14px',
                                background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                flexWrap: 'wrap', gap: '12px', marginBottom: '16px',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Clock size={16} style={{ color: '#FFE600' }} />
                                    <span style={{ color: '#8892AA', fontSize: '13px', fontWeight: '600' }}>Mission Deadline</span>
                                </div>
                                <Countdown targetDate={activeStake.bounty.submission_deadline} />
                            </div>

                            {/* Progress bar */}
                            <div style={{ marginBottom: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ color: '#8892AA', fontSize: '12px', fontWeight: '600' }}>Time Remaining</span>
                                    <span style={{
                                        color: isUrgent ? '#F43F5E' : '#00FF94',
                                        fontSize: '12px', fontWeight: '800', fontFamily: 'JetBrains Mono'
                                    }}>
                                        {Math.round(progressPct)}%
                                    </span>
                                </div>
                                <div style={{ height: '6px', background: 'rgba(255,255,255,0.07)', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{
                                        height: '100%', borderRadius: '3px',
                                        width: `${Math.min(100, Math.max(0, progressPct))}%`,
                                        background: isUrgent
                                            ? 'linear-gradient(90deg, #F43F5E, #FF6B35)'
                                            : 'linear-gradient(90deg, #00FF94, #00E5FF)',
                                        transition: 'width 1s ease, background 0.5s ease',
                                        boxShadow: isUrgent ? '0 0 15px rgba(244,63,94,0.5)' : '0 0 15px rgba(0,255,148,0.4)',
                                    }} />
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                            <div>
                                <p style={{ color: '#8892AA', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Reward Pool</p>
                                <p style={{
                                    fontSize: '28px', fontWeight: '900', fontFamily: 'Space Grotesk',
                                    background: 'linear-gradient(135deg, #00FF94, #00E5FF)',
                                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                                }}>
                                    {currency}{activeStake.bounty.reward.toLocaleString()}
                                </p>
                            </div>

                            <button
                                onClick={() => navigate('/hunter/war-room')}
                                className="btn-primary"
                                style={{ padding: '14px 24px', fontSize: '14px' }}
                            >
                                <MessageSquare size={18} />
                                War Room <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                /* Empty state for no active mission */
                <div style={{
                    padding: '40px 24px',
                    borderRadius: '20px',
                    border: '2px dashed rgba(255,255,255,0.08)',
                    textAlign: 'center',
                    background: 'rgba(23,30,46,0.4)',
                }}>
                    <div style={{
                        width: '64px', height: '64px', borderRadius: '20px',
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 16px',
                    }}>
                        <Target size={28} style={{ color: '#4A5568' }} />
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#F0F4FF', marginBottom: '8px', fontFamily: 'Space Grotesk' }}>
                        No Active Missions
                    </h3>
                    <p style={{ color: '#8892AA', marginBottom: '24px', fontSize: '14px' }}>
                        Your slate is clear. Visit the Arena to find high-value bounties.
                    </p>
                    <Link to="/hunter/arena" className="btn-primary" style={{ textDecoration: 'none', padding: '12px 24px', fontSize: '14px' }}>
                        <Target size={18} /> Browse Arena
                    </Link>
                </div>
            )}

            {/* ===== HOT BOUNTIES ===== */}
            <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Flame size={20} style={{ color: '#FF6B35' }} />
                        <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#F0F4FF', fontFamily: 'Space Grotesk' }}>
                            Hot Bounties
                        </h2>
                        {recentBounties.length > 0 && (
                            <span style={{
                                padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700',
                                background: 'rgba(255,107,53,0.1)', color: '#FF6B35', border: '1px solid rgba(255,107,53,0.2)'
                            }}>
                                {recentBounties.length} LIVE
                            </span>
                        )}
                    </div>
                    <Link to="/hunter/arena" style={{
                        display: 'flex', alignItems: 'center', gap: '4px',
                        color: '#00FF94', fontSize: '13px', fontWeight: '700', textDecoration: 'none',
                        transition: 'color 0.2s ease',
                    }}>
                        View All <ArrowRight size={14} />
                    </Link>
                </div>

                {recentBounties.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                        {recentBounties.map(bounty => (
                            <BountyCard key={bounty.id} bounty={bounty} userRole="hunter" />
                        ))}
                    </div>
                ) : (
                    <div style={{
                        padding: '48px 24px', textAlign: 'center',
                        border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '16px',
                    }}>
                        <Target size={32} style={{ color: '#4A5568', margin: '0 auto 12px' }} />
                        <p style={{ color: '#8892AA' }}>No active bounties right now. Check back soon!</p>
                    </div>
                )}
            </div>

            {/* ===== QUICK ACTIONS ===== */}
            <div>
                <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#F0F4FF', fontFamily: 'Space Grotesk', marginBottom: '16px' }}>
                    Quick Actions
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                    {[
                        { to: '/hunter/arena', icon: Target, label: 'Browse Arena', desc: 'Find new missions', color: '#FF6B35', bg: 'rgba(255,107,53,0.08)', border: 'rgba(255,107,53,0.15)' },
                        { to: '/hunter/vault', icon: Wallet, label: 'My Vault', desc: 'Manage earnings', color: '#00FF94', bg: 'rgba(0,255,148,0.08)', border: 'rgba(0,255,148,0.15)' },
                        { to: '/hunter/war-room', icon: MessageSquare, label: 'War Room', desc: 'Mission comms', color: '#A855F7', bg: 'rgba(168,85,247,0.08)', border: 'rgba(168,85,247,0.15)' },
                        { to: '/hunter/leaderboard', icon: Trophy, label: 'Leaderboard', desc: 'Your ranking', color: '#FFE600', bg: 'rgba(255,230,0,0.08)', border: 'rgba(255,230,0,0.15)' },
                    ].map((action) => (
                        <Link
                            key={action.to}
                            to={action.to}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '14px',
                                padding: '18px 16px', borderRadius: '16px',
                                background: action.bg, border: `1px solid ${action.border}`,
                                textDecoration: 'none',
                                transition: 'all 0.2s ease',
                            }}
                            onMouseOver={e => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = `0 8px 25px ${action.color}20`;
                            }}
                            onMouseOut={e => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <div style={{
                                width: '44px', height: '44px', borderRadius: '12px',
                                background: `${action.color}15`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0, border: `1px solid ${action.color}20`,
                            }}>
                                <action.icon size={22} style={{ color: action.color }} />
                            </div>
                            <div>
                                <p style={{ color: '#F0F4FF', fontWeight: '700', fontSize: '14px', marginBottom: '2px', fontFamily: 'Space Grotesk' }}>
                                    {action.label}
                                </p>
                                <p style={{ color: '#8892AA', fontSize: '12px' }}>{action.desc}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
