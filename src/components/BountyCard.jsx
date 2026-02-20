import { Target, Users, Clock, TrendingUp, Lock, ShieldCheck, ChevronRight, Flame, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

// Vibrant color palette for categories
const categoryColors = {
    'Design': { color: '#A855F7', bg: 'rgba(168,85,247,0.1)', border: 'rgba(168,85,247,0.2)' },
    'Development': { color: '#00E5FF', bg: 'rgba(0,229,255,0.1)', border: 'rgba(0,229,255,0.2)' },
    'Writing': { color: '#14B8A6', bg: 'rgba(20,184,166,0.1)', border: 'rgba(20,184,166,0.2)' },
    'Marketing': { color: '#FF6B35', bg: 'rgba(255,107,53,0.1)', border: 'rgba(255,107,53,0.2)' },
    'Research': { color: '#FFE600', bg: 'rgba(255,230,0,0.1)', border: 'rgba(255,230,0,0.2)' },
    'Business': { color: '#6366F1', bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.2)' },
    'Finance': { color: '#00FF94', bg: 'rgba(0,255,148,0.1)', border: 'rgba(0,255,148,0.2)' },
    'default': { color: '#8892AA', bg: 'rgba(136,146,170,0.1)', border: 'rgba(136,146,170,0.2)' },
};

const difficultyConfig = {
    'Easy': { color: '#00FF94', bg: 'rgba(0,255,148,0.1)', border: 'rgba(0,255,148,0.2)' },
    'Medium': { color: '#FFE600', bg: 'rgba(255,230,0,0.1)', border: 'rgba(255,230,0,0.2)' },
    'Hard': { color: '#FF6B35', bg: 'rgba(255,107,53,0.1)', border: 'rgba(255,107,53,0.2)' },
    'Extreme': { color: '#FF2D78', bg: 'rgba(255,45,120,0.1)', border: 'rgba(255,45,120,0.2)' },
};

export default function BountyCard({ bounty, userRole = 'hunter' }) {
    const {
        id, title, description, reward,
        currency, max_hunters = 10, submission_deadline,
        status, entry_fee = 0, difficulty = 'Medium',
        is_featured, is_urgent, vault_locked = 0,
        category = 'Mission'
    } = bounty;

    const symbol = currency === 'INR' ? '₹' : '$';
    const deadline = new Date(submission_deadline);
    const now = new Date();
    const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
    const hoursLeft = Math.ceil((deadline - now) / (1000 * 60 * 60));
    const isExpiringSoon = daysLeft <= 2 && daysLeft > 0;
    const isExpired = daysLeft <= 0;
    const isHot = hoursLeft < 48 && !isExpired;

    const catColor = categoryColors[category] || categoryColors.default;
    const diffColor = difficultyConfig[difficulty] || difficultyConfig.Medium;

    const stakedHunters = bounty.hunter_count || bounty.staked_count || 0;
    const fillPercent = max_hunters > 0 ? (stakedHunters / max_hunters) * 100 : 0;
    const isSecured = vault_locked >= reward;

    const timeDisplay = isExpired ? 'EXPIRED'
        : hoursLeft < 24 ? `${hoursLeft}h left`
            : `${daysLeft}d left`;

    return (
        <div
            className="group relative flex flex-col h-full cursor-pointer overflow-hidden"
            style={{
                background: 'rgba(23,30,46,0.85)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '20px',
                padding: '24px',
                transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
            }}
            onMouseOver={e => {
                e.currentTarget.style.borderColor = `${catColor.color}35`;
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = `0 20px 60px rgba(0,0,0,0.4), 0 0 40px ${catColor.color}10`;
            }}
            onMouseOut={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
            }}
        >
            {/* Subtle top gradient accent */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
                background: `linear-gradient(90deg, ${catColor.color}00, ${catColor.color}, ${catColor.color}00)`,
                borderRadius: '20px 20px 0 0',
                opacity: 0.6,
            }} />

            {/* ===== HEADER BADGES ===== */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {/* Category */}
                    <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        padding: '4px 10px', borderRadius: '6px',
                        background: catColor.bg, color: catColor.color, border: `1px solid ${catColor.border}`,
                        fontSize: '10px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase'
                    }}>
                        <Target size={9} /> {category}
                    </span>

                    {/* Featured */}
                    {is_featured && (
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            padding: '4px 10px', borderRadius: '6px',
                            background: 'rgba(255,230,0,0.1)', color: '#FFE600', border: '1px solid rgba(255,230,0,0.25)',
                            fontSize: '10px', fontWeight: '700'
                        }}>
                            <Star size={9} fill="currentColor" /> FEATURED
                        </span>
                    )}

                    {/* Urgent / Expiring */}
                    {(is_urgent || isExpiringSoon) && !isExpired && (
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            padding: '4px 10px', borderRadius: '6px',
                            background: 'rgba(255,107,53,0.12)', color: '#FF6B35', border: '1px solid rgba(255,107,53,0.3)',
                            fontSize: '10px', fontWeight: '700',
                            animation: 'pulseDot 2s ease-in-out infinite'
                        }}>
                            <Flame size={9} /> URGENT
                        </span>
                    )}

                    {/* Secured */}
                    {isSecured && (
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            padding: '4px 10px', borderRadius: '6px',
                            background: 'rgba(0,255,148,0.1)', color: '#00FF94', border: '1px solid rgba(0,255,148,0.2)',
                            fontSize: '10px', fontWeight: '700'
                        }}>
                            <ShieldCheck size={9} /> SECURED
                        </span>
                    )}
                </div>

                {/* Difficulty */}
                <span style={{
                    padding: '4px 10px', borderRadius: '6px',
                    background: diffColor.bg, color: diffColor.color, border: `1px solid ${diffColor.border}`,
                    fontSize: '10px', fontWeight: '800', letterSpacing: '0.06em', flexShrink: 0
                }}>
                    {difficulty.toUpperCase()}
                </span>
            </div>

            {/* ===== TITLE & DESC ===== */}
            <div style={{ flex: 1 }}>
                <h3 style={{
                    fontSize: '18px', fontWeight: '800', color: '#F0F4FF',
                    marginBottom: '8px', lineHeight: '1.3',
                    display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    fontFamily: 'Space Grotesk',
                    transition: 'color 0.2s ease',
                }}>
                    {title}
                </h3>
                <p style={{
                    color: '#8892AA', fontSize: '13px', lineHeight: '1.6',
                    display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    marginBottom: '16px',
                }}>
                    {description}
                </p>

                {/* ===== STATS GRID ===== */}
                <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr',
                    gap: '8px', marginBottom: '16px',
                    padding: '12px', borderRadius: '12px',
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
                }}>
                    {/* Time */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                        <Clock size={13} style={{ color: isExpiringSoon ? '#FFE600' : '#8892AA', flexShrink: 0 }} />
                        <span style={{
                            fontSize: '12px', fontFamily: 'JetBrains Mono',
                            fontWeight: isExpiringSoon ? '800' : '600',
                            color: isExpired ? '#F43F5E' : isExpiringSoon ? '#FFE600' : '#8892AA'
                        }}>
                            {timeDisplay}
                        </span>
                    </div>

                    {/* Hunters */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                        <Users size={13} style={{ color: '#8892AA', flexShrink: 0 }} />
                        <span style={{ fontSize: '12px', fontFamily: 'JetBrains Mono', fontWeight: '600', color: '#8892AA' }}>
                            {stakedHunters}/{max_hunters}
                        </span>
                    </div>

                    {/* Entry Fee */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                        <Lock size={13} style={{ color: '#8892AA', flexShrink: 0 }} />
                        <span style={{ fontSize: '12px', fontFamily: 'JetBrains Mono', fontWeight: '600', color: entry_fee > 0 ? '#FF6B35' : '#00FF94' }}>
                            {entry_fee > 0 ? `${symbol}${entry_fee} stake` : 'Free entry'}
                        </span>
                    </div>

                    {/* Status */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                        <span style={{
                            width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0,
                            background: isExpired ? '#4A5568' : '#00FF94',
                            animation: isExpired ? 'none' : 'pulseDot 2s ease-in-out infinite',
                        }} />
                        <span style={{ fontSize: '12px', fontWeight: '700', color: isExpired ? '#4A5568' : '#00FF94', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {isExpired ? 'Closed' : 'Live'}
                        </span>
                    </div>
                </div>

                {/* ===== FILL BAR ===== */}
                <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '10px', color: '#8892AA', fontWeight: '600' }}>SPOTS FILLED</span>
                        <span style={{ fontSize: '10px', color: catColor.color, fontWeight: '700', fontFamily: 'JetBrains Mono' }}>
                            {Math.round(fillPercent)}%
                        </span>
                    </div>
                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{
                            height: '100%', borderRadius: '2px',
                            background: fillPercent >= 80
                                ? 'linear-gradient(90deg, #FF6B35, #FF2D78)'
                                : `linear-gradient(90deg, ${catColor.color}, ${catColor.color}90)`,
                            width: `${Math.min(100, fillPercent)}%`,
                            transition: 'width 0.8s ease',
                        }} />
                    </div>
                </div>
            </div>

            {/* ===== FOOTER ===== */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)',
            }}>
                <div>
                    <p style={{ fontSize: '10px', color: '#8892AA', fontWeight: '600', letterSpacing: '0.08em', marginBottom: '2px', textTransform: 'uppercase' }}>
                        Reward Pool
                    </p>
                    <p style={{
                        fontSize: '22px', fontWeight: '900', letterSpacing: '-0.5px',
                        fontFamily: 'Space Grotesk',
                        background: `linear-gradient(135deg, ${catColor.color}, ${catColor.color}80)`,
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                    }}>
                        {symbol}{(reward || 0).toLocaleString()}
                    </p>
                </div>

                {userRole === 'hunter' && status === 'live' && !isExpired && (
                    <Link
                        to={`/hunter/bounty/${id}`}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            padding: '10px 18px', borderRadius: '12px',
                            background: `linear-gradient(135deg, ${catColor.color}, ${catColor.color}90)`,
                            color: '#000',
                            fontWeight: '800', fontSize: '13px', fontFamily: 'Space Grotesk',
                            textDecoration: 'none',
                            transition: 'all 0.2s ease',
                            boxShadow: `0 4px 20px ${catColor.color}30`,
                        }}
                        onMouseOver={e => {
                            e.currentTarget.style.transform = 'scale(1.05)';
                            e.currentTarget.style.boxShadow = `0 8px 30px ${catColor.color}50`;
                        }}
                        onMouseOut={e => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = `0 4px 20px ${catColor.color}30`;
                        }}
                    >
                        Apply <ChevronRight size={15} />
                    </Link>
                )}

                {userRole === 'hunter' && (status !== 'live' || isExpired) && (
                    <span style={{
                        padding: '8px 16px', borderRadius: '10px',
                        background: 'rgba(74,85,104,0.2)', color: '#4A5568',
                        fontSize: '12px', fontWeight: '700', border: '1px solid rgba(74,85,104,0.3)',
                    }}>
                        Closed
                    </span>
                )}

                {userRole === 'payer' && (
                    <Link
                        to={`/payer/bounty/${id}`}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            padding: '10px 16px', borderRadius: '12px',
                            background: 'rgba(255,255,255,0.06)', color: '#F0F4FF',
                            border: '1px solid rgba(255,255,255,0.12)',
                            fontWeight: '700', fontSize: '13px',
                            textDecoration: 'none',
                            transition: 'all 0.2s ease',
                        }}
                        onMouseOver={e => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
                        }}
                        onMouseOut={e => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                        }}
                    >
                        Manage <ChevronRight size={14} />
                    </Link>
                )}
            </div>
        </div>
    );
}
