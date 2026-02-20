import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Clock, Target, Users, ArrowRight, Zap, Eye, AlertTriangle, Plus } from 'lucide-react';

export default function PayerWarRoom() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [activeBounties, setActiveBounties] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (currentUser) loadActiveBounties();
    }, [currentUser]);

    const loadActiveBounties = async () => {
        try {
            const { data, error } = await supabase
                .from('bounties')
                .select(`
                    *,
                    hunter_stakes(
                        id,
                        hunter_id,
                        status,
                        stake_amount,
                        hunter:profiles(username, id)
                    )
                `)
                .eq('payer_id', currentUser.id)
                .in('status', ['live', 'active'])
                .order('submission_deadline', { ascending: true });

            if (data) setActiveBounties(data);
            if (error) console.error('War Room load error:', error);
        } catch (error) {
            console.error('Error loading bounties:', error);
        } finally {
            setLoading(false);
        }
    };

    const currency = currentUser?.currency === 'INR' ? '₹' : '$';

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
            <div className="spinner" />
        </div>
    );

    return (
        <div style={{ animation: 'fadeInUp 0.4s ease', paddingBottom: '80px' }}>

            {/* Page Header */}
            <div style={{ marginBottom: '36px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <div style={{ width: '3px', height: '22px', borderRadius: '2px', background: '#06B6D4' }} />
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#06B6D4', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                        Command Center
                    </span>
                </div>
                <h1 style={{ fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: '900', color: '#F0F4FF', fontFamily: 'Space Grotesk', marginBottom: '8px', letterSpacing: '-0.02em' }}>
                    War Room
                </h1>
                <p style={{ color: '#6B7A99', fontSize: '15px', maxWidth: '480px' }}>
                    Monitor your active bounties in real time. The countdown begins only once hunters have staked their entry.
                </p>
            </div>

            {activeBounties.length === 0 ? (
                <EmptyWarRoom navigate={navigate} />
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {activeBounties.map((bounty, index) => (
                        <BountyMissionCard key={bounty.id} bounty={bounty} index={index} navigate={navigate} currency={currency} />
                    ))}
                </div>
            )}
        </div>
    );
}

function EmptyWarRoom({ navigate }) {
    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '80px 20px', textAlign: 'center',
            border: '1px dashed rgba(0,229,255,0.15)', borderRadius: '20px',
            background: 'linear-gradient(135deg, rgba(0,229,255,0.02), rgba(8,11,20,0))',
        }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '20px', background: 'rgba(0,229,255,0.07)', border: '1px solid rgba(0,229,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                <Target size={32} style={{ color: '#06B6D4' }} />
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#F0F4FF', fontFamily: 'Space Grotesk', marginBottom: '10px' }}>No Active Missions</h2>
            <p style={{ color: '#6B7A99', maxWidth: '360px', marginBottom: '28px', lineHeight: '1.6' }}>
                Post a bounty and set your reward. Once hunters stake their entry fee, the mission goes live here.
            </p>
            <button
                onClick={() => navigate('/payer/post-bounty')}
                style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    padding: '13px 28px', borderRadius: '12px', fontSize: '14px', fontWeight: '700',
                    background: 'linear-gradient(135deg, #10B981, #06B6D4)',
                    color: '#090E17', border: 'none', cursor: 'pointer',
                    boxShadow: '0 8px 30px rgba(0,255,148,0.25)',
                }}
            >
                <Plus size={16} /> Post a Bounty
            </button>
        </div>
    );
}

function BountyMissionCard({ bounty, index, navigate, currency }) {
    const activeHunters = (bounty.hunter_stakes || []).filter(s => s.status === 'active');
    const maxHunters = bounty.max_hunters || 4;
    const hasHunters = activeHunters.length >= maxHunters;

    // Timer ONLY runs if hunters have staked
    const [timeLeft, setTimeLeft] = useState(() =>
        hasHunters ? calculateTimeLeft(bounty.submission_deadline) : null
    );

    useEffect(() => {
        if (!hasHunters) {
            setTimeLeft(null);
            return;
        }
        setTimeLeft(calculateTimeLeft(bounty.submission_deadline));
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft(bounty.submission_deadline));
        }, 1000);
        return () => clearInterval(timer);
    }, [bounty.submission_deadline, hasHunters]);

    function calculateTimeLeft(deadline) {
        const total = Date.parse(deadline) - Date.now();
        if (total <= 0) return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
        return {
            total,
            days: Math.floor(total / (1000 * 60 * 60 * 24)),
            hours: Math.floor((total / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((total / 1000 / 60) % 60),
            seconds: Math.floor((total / 1000) % 60),
        };
    }

    const isUrgent = timeLeft && timeLeft.days < 2 && timeLeft.total > 0;
    const accentColor = !hasHunters ? '#6B7A99' : isUrgent ? '#F97316' : '#06B6D4';
    const fillRatio = activeHunters.length / maxHunters;

    return (
        <div style={{
            background: 'rgba(13,18,32,0.95)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '20px',
            overflow: 'hidden',
            transition: 'border-color 0.3s ease',
        }}
            onMouseOver={e => e.currentTarget.style.borderColor = accentColor + '30'}
            onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}
        >
            {/* Top progress bar */}
            <div style={{ height: '3px', background: 'rgba(255,255,255,0.05)' }}>
                <div style={{
                    height: '100%',
                    width: (fillRatio * 100) + '%',
                    background: `linear-gradient(90deg, ${accentColor}, ${accentColor}90)`,
                    transition: 'width 0.5s ease',
                }} />
            </div>

            <div style={{ padding: '28px 32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap' }}>

                    {/* Left: Mission info */}
                    <div style={{ flex: 1, minWidth: '240px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                            <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                fontSize: '10px', fontWeight: '800', letterSpacing: '0.14em',
                                textTransform: 'uppercase', color: '#6B7A99',
                                padding: '4px 10px', borderRadius: '6px',
                                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                            }}>
                                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: hasHunters ? '#10B981' : '#6B7A99', animation: hasHunters ? 'pulseDot 2s infinite' : 'none' }} />
                                Mission {index + 1}
                            </span>
                            <span style={{ fontSize: '12px', color: '#6B7A99' }}>
                                Due {new Date(bounty.submission_deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                        </div>

                        <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#F0F4FF', fontFamily: 'Space Grotesk', marginBottom: '14px', letterSpacing: '-0.01em' }}>
                            {bounty.title}
                        </h3>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                <Zap size={14} style={{ color: '#10B981' }} />
                                <span style={{ color: '#10B981', fontFamily: 'JetBrains Mono', fontWeight: '700', fontSize: '15px' }}>
                                    {currency}{(bounty.reward || 0).toLocaleString()}
                                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                <Users size={14} style={{ color: '#6B7A99' }} />
                                <span style={{ color: '#C0C8D8', fontSize: '13px' }}>
                                    {activeHunters.length} / {maxHunters} Hunters
                                </span>
                            </div>
                        </div>

                        {/* Hunter fill bar */}
                        <div style={{ marginTop: '16px' }}>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                {Array.from({ length: maxHunters }).map((_, i) => (
                                    <div key={i} style={{
                                        height: '6px', flex: 1, borderRadius: '3px',
                                        background: i < activeHunters.length ? '#10B981' : 'rgba(255,255,255,0.08)',
                                        transition: 'background 0.3s',
                                    }} />
                                ))}
                            </div>
                            <p style={{ fontSize: '11px', color: '#6B7A99', marginTop: '6px' }}>
                                {hasHunters
                                    ? `${maxHunters - activeHunters.length} slot${maxHunters - activeHunters.length !== 1 ? 's' : ''} remaining`
                                    : 'Waiting for hunters to stake and join'}
                            </p>
                        </div>
                    </div>

                    {/* Right: Timer panel */}
                    <div style={{
                        padding: '20px 24px', borderRadius: '16px', textAlign: 'center',
                        background: 'rgba(0,0,0,0.3)',
                        border: `1px solid ${accentColor}20`,
                        minWidth: '200px',
                    }}>
                        {!hasHunters ? (
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
                                    <AlertTriangle size={16} style={{ color: '#F59E0B' }} />
                                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#F59E0B', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                                        Awaiting Hunters
                                    </span>
                                </div>
                                <p style={{ fontSize: '12px', color: '#6B7A99', lineHeight: '1.5' }}>
                                    Timer starts when all hunter slots are filled
                                </p>
                            </div>
                        ) : timeLeft && timeLeft.total <= 0 ? (
                            <div>
                                <span style={{ fontSize: '11px', fontWeight: '800', color: '#F97316', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Deadline Passed</span>
                                <p style={{ color: '#F43F5E', fontFamily: 'JetBrains Mono', fontWeight: '900', fontSize: '20px', marginTop: '8px' }}>CLOSED</p>
                            </div>
                        ) : timeLeft ? (
                            <div>
                                <p style={{ fontSize: '10px', color: '#6B7A99', fontWeight: '700', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '12px' }}>Time Remaining</p>
                                <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', alignItems: 'flex-end' }}>
                                    {[
                                        { v: timeLeft.days, l: 'D' },
                                        { v: timeLeft.hours, l: 'H' },
                                        { v: timeLeft.minutes, l: 'M' },
                                        { v: timeLeft.seconds, l: 'S' },
                                    ].map(({ v, l }, i, arr) => (
                                        <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{
                                                    fontSize: '26px', fontWeight: '900', fontFamily: 'JetBrains Mono',
                                                    color: isUrgent ? '#F97316' : '#06B6D4',
                                                    textShadow: `0 0 20px ${isUrgent ? '#F9731660' : '#06B6D440'}`,
                                                    lineHeight: 1, minWidth: '36px',
                                                }}>
                                                    {String(v).padStart(2, '0')}
                                                </div>
                                                <div style={{ fontSize: '9px', color: '#6B7A99', fontWeight: '700', marginTop: '3px' }}>{l}</div>
                                            </div>
                                            {i < arr.length - 1 && (
                                                <span style={{ color: '#6B7A99', fontSize: '20px', fontFamily: 'JetBrains Mono', marginBottom: '12px', opacity: 0.5 }}>:</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>

                {/* Hunters list */}
                {activeHunters.length > 0 && (
                    <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <p style={{ fontSize: '11px', color: '#6B7A99', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '10px' }}>
                            Active Hunters
                        </p>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {activeHunters.map(stake => (
                                <div key={stake.id} style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    padding: '6px 12px', borderRadius: '8px',
                                    background: 'rgba(0,255,148,0.06)', border: '1px solid rgba(0,255,148,0.15)',
                                }}>
                                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(0,255,148,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: '900', color: '#10B981' }}>
                                        {stake.hunter?.username?.substring(0, 2).toUpperCase() || '??'}
                                    </div>
                                    <span style={{ color: '#C0C8D8', fontSize: '13px', fontWeight: '600' }}>{stake.hunter?.username || 'Hunter'}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Action */}
                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                        onClick={() => navigate('/payer/bounty/' + bounty.id)}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: '700',
                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                            color: '#C0C8D8', cursor: 'pointer', transition: 'all 0.2s ease',
                        }}
                        onMouseOver={e => { e.currentTarget.style.background = 'rgba(0,229,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(0,229,255,0.3)'; e.currentTarget.style.color = '#06B6D4'; }}
                        onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#C0C8D8'; }}
                    >
                        <Eye size={15} /> View Full Details <ArrowRight size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}
