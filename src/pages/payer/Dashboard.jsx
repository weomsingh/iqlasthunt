import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';
import {
    Target, Plus, TrendingUp, Clock, Users, CheckCircle, AlertCircle,
    MessageSquare, Briefcase, ArrowRight, Zap, DollarSign, Settings, Star
} from 'lucide-react';

export default function PayerDashboard() {
    const { currentUser } = useAuth();
    const [stats, setStats] = useState({ active: 0, pendingReviews: 0, completed: 0, totalSpent: 0 });
    const [activeBounties, setActiveBounties] = useState([]);
    const [pendingSubmissions, setPendingSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (currentUser) loadDashboardData();
    }, [currentUser]);

    async function loadDashboardData() {
        try {
            const { data: bounties } = await supabase
                .from('bounties')
                .select('*, submissions(*)')
                .eq('payer_id', currentUser.id);

            if (bounties) {
                const active = bounties.filter(b => b.status === 'live');
                const completed = bounties.filter(b => b.status === 'completed');
                const pending = bounties.reduce((acc, b) =>
                    acc + (b.submissions?.filter(s => s.status === 'pending_review').length || 0), 0);

                const submissions = [];
                bounties.forEach(b => {
                    b.submissions?.filter(s => s.status === 'pending_review')
                        .forEach(s => submissions.push({ ...s, bounty_title: b.title, bounty_id: b.id }));
                });

                setActiveBounties(active.slice(0, 4));
                setPendingSubmissions(submissions.slice(0, 3));
                setStats({
                    active: active.length,
                    pendingReviews: pending,
                    completed: completed.length,
                    totalSpent: completed.reduce((sum, b) => sum + (b.reward || 0), 0)
                });
            }
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

    const statsData = [
        {
            label: 'Active Bounties', value: stats.active, icon: Briefcase,
            color: '#06B6D4', bg: 'rgba(139, 92, 246,0.08)', border: 'rgba(139, 92, 246,0.15)',
        },
        {
            label: 'Pending Reviews', value: stats.pendingReviews, icon: AlertCircle,
            color: '#F59E0B', bg: 'rgba(255,230,0,0.08)', border: 'rgba(255,230,0,0.15)',
            urgent: stats.pendingReviews > 0,
        },
        {
            label: 'Completed', value: stats.completed, icon: CheckCircle,
            color: '#06B6D4', bg: 'rgba(6, 182, 212,0.08)', border: 'rgba(6, 182, 212,0.15)',
        },
        {
            label: 'Total Spent', value: `${currency}${stats.totalSpent.toLocaleString()}`, icon: DollarSign,
            color: '#8B5CF6', bg: 'rgba(168,85,247,0.08)', border: 'rgba(168,85,247,0.15)',
        },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', animation: 'fadeInUp 0.4s ease' }}>

            {/* ===== WELCOME HEADER ===== */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <p style={{ color: '#8892AA', fontSize: '14px' }}>
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
                <h1 style={{
                    fontSize: 'clamp(24px, 5vw, 36px)',
                    fontWeight: '800', fontFamily: 'Space Grotesk',
                    color: '#F0F4FF', lineHeight: 1.2,
                }}>
                    Welcome back,{' '}
                    <span style={{
                        background: 'linear-gradient(135deg, #06B6D4, #8B5CF6)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
                    }}>
                        {currentUser?.username}
                    </span>
                </h1>
                <p style={{ color: '#8892AA' }}>
                    {stats.pendingReviews > 0
                        ? `⚠️ You have ${stats.pendingReviews} submission${stats.pendingReviews > 1 ? 's' : ''} awaiting review!`
                        : 'Manage your bounties and track submissions.'}
                </p>
            </div>

            {/* ===== STATS GRID ===== */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                {statsData.map((stat, i) => (
                    <div key={i} style={{
                        padding: '20px',
                        borderRadius: '16px',
                        background: stat.bg,
                        border: `1px solid ${stat.border}`,
                        display: 'flex', alignItems: 'center', gap: '14px',
                        position: 'relative', overflow: 'hidden',
                        cursor: 'default',
                        transition: 'all 0.2s ease',
                    }}
                        onMouseOver={e => e.currentTarget.style.boxShadow = `0 8px 30px ${stat.color}15`}
                        onMouseOut={e => e.currentTarget.style.boxShadow = 'none'}
                    >
                        {stat.urgent && (
                            <div style={{
                                position: 'absolute', top: '8px', right: '8px',
                                width: '8px', height: '8px', borderRadius: '50%',
                                background: stat.color, animation: 'pulseDot 1.5s infinite',
                            }} />
                        )}
                        <div style={{
                            width: '44px', height: '44px', borderRadius: '12px',
                            background: `${stat.color}15`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                        }}>
                            <stat.icon size={22} style={{ color: stat.color }} />
                        </div>
                        <div>
                            <p style={{ fontSize: '11px', color: '#8892AA', fontWeight: '600', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '2px' }}>
                                {stat.label}
                            </p>
                            <p style={{ fontSize: typeof stat.value === 'string' && stat.value.length > 6 ? '16px' : '22px', fontWeight: '900', color: '#F0F4FF', fontFamily: 'Space Grotesk', lineHeight: 1 }}>
                                {stat.value}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ===== PENDING REVIEWS (Urgent!) ===== */}
            {pendingSubmissions.length > 0 && (
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <AlertCircle size={20} style={{ color: '#F59E0B' }} />
                            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#F0F4FF', fontFamily: 'Space Grotesk' }}>
                                Pending Reviews
                            </h2>
                            <span style={{
                                padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '800',
                                background: 'rgba(255,230,0,0.15)', color: '#F59E0B', border: '1px solid rgba(255,230,0,0.3)',
                                animation: 'pulseDot 2s infinite',
                            }}>
                                {pendingSubmissions.length} WAITING
                            </span>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                        {pendingSubmissions.map((submission, idx) => (
                            <div key={idx} style={{
                                padding: '18px', borderRadius: '16px',
                                background: 'rgba(255,230,0,0.05)',
                                border: '1px solid rgba(255,230,0,0.2)',
                                transition: 'all 0.2s ease',
                            }}
                                onMouseOver={e => e.currentTarget.style.background = 'rgba(255,230,0,0.08)'}
                                onMouseOut={e => e.currentTarget.style.background = 'rgba(255,230,0,0.05)'}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                    <div style={{
                                        width: '40px', height: '40px', borderRadius: '50%',
                                        background: 'rgba(255,230,0,0.12)', border: '1px solid rgba(255,230,0,0.25)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: '#F59E0B', fontWeight: '800', fontSize: '13px',
                                    }}>H</div>
                                    <div>
                                        <p style={{ color: '#F0F4FF', fontWeight: '700', fontSize: '14px' }}>Hunter Submission</p>
                                        <p style={{ color: '#8892AA', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>
                                            {submission.bounty_title}
                                        </p>
                                    </div>
                                </div>
                                <Link
                                    to={`/payer/bounty/${submission.bounty_id}`}
                                    style={{
                                        display: 'block', textAlign: 'center',
                                        padding: '10px', borderRadius: '10px',
                                        background: 'rgba(255,230,0,0.12)', color: '#F59E0B',
                                        border: '1px solid rgba(255,230,0,0.3)',
                                        fontWeight: '700', fontSize: '13px', textDecoration: 'none',
                                        transition: 'all 0.2s ease',
                                    }}>
                                    Review Now →
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ===== ACTIVE BOUNTIES ===== */}
            <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Zap size={20} style={{ color: '#06B6D4' }} />
                        <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#F0F4FF', fontFamily: 'Space Grotesk' }}>
                            Active Bounties
                        </h2>
                    </div>
                    <Link to="/payer/live-bounties" style={{
                        display: 'flex', alignItems: 'center', gap: '4px',
                        color: '#06B6D4', fontSize: '13px', fontWeight: '700', textDecoration: 'none',
                    }}>
                        View All <ArrowRight size={14} />
                    </Link>
                </div>

                {activeBounties.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                        {activeBounties.map(bounty => (
                            <PayerBountyCard key={bounty.id} bounty={bounty} currency={currency} />
                        ))}
                    </div>
                ) : (
                    <div style={{
                        padding: '40px 24px', textAlign: 'center',
                        border: '2px dashed rgba(255,255,255,0.06)', borderRadius: '16px',
                    }}>
                        <Briefcase size={32} style={{ color: '#4A5568', margin: '0 auto 12px' }} />
                        <p style={{ color: '#F0F4FF', fontWeight: '700', marginBottom: '6px' }}>No active bounties yet</p>
                        <p style={{ color: '#8892AA', fontSize: '14px', marginBottom: '20px' }}>Post your first bounty to start finding talent</p>
                        <Link to="/payer/post-bounty" className="btn-primary" style={{ textDecoration: 'none', padding: '12px 24px', fontSize: '14px' }}>
                            <Plus size={18} /> Post Bounty
                        </Link>
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
                        { to: '/payer/post-bounty', icon: Plus, label: 'Post Bounty', desc: 'Create new task', color: '#06B6D4', bg: 'rgba(6, 182, 212,0.08)', border: 'rgba(6, 182, 212,0.2)', featured: true },
                        { to: '/payer/live-bounties', icon: Target, label: 'My Bounties', desc: 'View all bounties', color: '#06B6D4', bg: 'rgba(139, 92, 246,0.08)', border: 'rgba(139, 92, 246,0.15)' },
                        { to: '/payer/war-room', icon: MessageSquare, label: 'War Room', desc: 'Talk to hunters', color: '#8B5CF6', bg: 'rgba(168,85,247,0.08)', border: 'rgba(168,85,247,0.15)' },
                        { to: '/payer/vault', icon: TrendingUp, label: 'Payments', desc: 'Transaction history', color: '#F59E0B', bg: 'rgba(255,230,0,0.08)', border: 'rgba(255,230,0,0.15)' },
                    ].map((action) => (
                        <Link
                            key={action.to}
                            to={action.to}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '14px',
                                padding: '18px 16px', borderRadius: '16px',
                                background: action.featured
                                    ? 'linear-gradient(135deg, rgba(6, 182, 212,0.1), rgba(139, 92, 246,0.05))'
                                    : action.bg,
                                border: `1px solid ${action.border}`,
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
                                background: action.featured
                                    ? 'linear-gradient(135deg, #06B6D4, #06B6D4)'
                                    : `${action.color}15`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0,
                            }}>
                                <action.icon size={22} style={{ color: action.featured ? '#000' : action.color }} />
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

// Compact Payer Bounty Card
function PayerBountyCard({ bounty, currency }) {
    const deadline = new Date(bounty.submission_deadline);
    const now = new Date();
    const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
    const isUrgent = daysLeft <= 2 && daysLeft > 0;
    const isExpired = daysLeft <= 0;

    const subCount = bounty.submissions?.length || 0;

    return (
        <Link
            to={`/payer/bounty/${bounty.id}`}
            style={{
                display: 'block', padding: '18px', borderRadius: '16px',
                background: 'rgba(23,30,46,0.8)',
                border: '1px solid rgba(255,255,255,0.07)',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
            }}
            onMouseOver={e => {
                e.currentTarget.style.borderColor = 'rgba(139, 92, 246,0.25)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(139, 92, 246,0.08)';
            }}
            onMouseOut={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <span style={{
                    padding: '3px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: '700',
                    background: isExpired ? 'rgba(74,85,104,0.2)' : 'rgba(6, 182, 212,0.1)',
                    color: isExpired ? '#4A5568' : '#06B6D4',
                    border: `1px solid ${isExpired ? 'rgba(74,85,104,0.2)' : 'rgba(6, 182, 212,0.2)'}`,
                    letterSpacing: '0.08em',
                }}>
                    {isExpired ? 'CLOSED' : 'LIVE'}
                </span>
                <span style={{
                    fontSize: '16px', fontWeight: '900', color: '#06B6D4',
                    fontFamily: 'Space Grotesk',
                }}>
                    {currency}{(bounty.reward || 0).toLocaleString()}
                </span>
            </div>

            <h3 style={{
                fontSize: '14px', fontWeight: '700', color: '#F0F4FF',
                marginBottom: '10px', lineHeight: 1.4,
                display: '-webkit-box', WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical', overflow: 'hidden',
                fontFamily: 'Space Grotesk',
            }}>
                {bounty.title}
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Users size={12} style={{ color: '#8892AA' }} />
                    <span style={{ fontSize: '11px', color: '#8892AA', fontWeight: '600' }}>{subCount} submissions</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Clock size={12} style={{ color: isUrgent ? '#F97316' : '#8892AA' }} />
                    <span style={{ fontSize: '11px', color: isUrgent ? '#F97316' : '#8892AA', fontWeight: isUrgent ? '700' : '600' }}>
                        {isExpired ? 'Expired' : `${daysLeft}d left`}
                    </span>
                </div>
            </div>
        </Link>
    );
}
