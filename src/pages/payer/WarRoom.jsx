import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Clock, Target, AlertCircle, MessageSquare, Users, ArrowRight, Zap, Plus } from 'lucide-react';

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
                        hunter:profiles(username, id),
                        status
                    )
                `)
                .eq('payer_id', currentUser.id)
                .in('status', ['live', 'active'])
                .order('submission_deadline', { ascending: true });

            if (data) setActiveBounties(data);
            if (error) console.error(error);
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

            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
                <p style={{ color: '#00E5FF', fontSize: '11px', fontWeight: '800', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px' }}>
                    🎯 Command Center
                </p>
                <h1 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: '900', color: '#F0F4FF', fontFamily: 'Space Grotesk', marginBottom: '8px' }}>
                    War Room
                </h1>
                <p style={{ color: '#8892AA', fontSize: '15px' }}>
                    Monitor your active bounties, track hunter progress, and manage mission timelines.
                </p>
            </div>

            {activeBounties.length === 0 ? (
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    padding: '80px 20px', textAlign: 'center',
                    border: '1px dashed rgba(0,229,255,0.2)', borderRadius: '24px',
                    background: 'rgba(0,229,255,0.02)',
                }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                        <Target size={40} style={{ color: '#00E5FF' }} />
                    </div>
                    <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#F0F4FF', fontFamily: 'Space Grotesk', marginBottom: '10px' }}>No Active Missions</h2>
                    <p style={{ color: '#8892AA', maxWidth: '400px', marginBottom: '28px' }}>
                        You don't have any active bounties in the War Room. Post a bounty to start tracking missions.
                    </p>
                    <button
                        onClick={() => navigate('/payer/post-bounty')}
                        className="btn-primary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                    >
                        <Plus size={18} /> Post Your First Bounty
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {activeBounties.map((bounty, index) => (
                        <BountyTimerCard key={bounty.id} bounty={bounty} index={index} navigate={navigate} currency={currency} />
                    ))}
                </div>
            )}
        </div>
    );
}

function BountyTimerCard({ bounty, index, navigate, currency }) {
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(bounty.submission_deadline));

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft(bounty.submission_deadline));
        }, 1000);
        return () => clearInterval(timer);
    }, [bounty.submission_deadline]);

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

    const isUrgent = timeLeft.days < 1;
    const timerColor = timeLeft.total <= 0 ? '#F43F5E' : isUrgent ? '#FF6B35' : '#FFE600';
    const activeHunters = bounty.hunter_stakes?.filter(s => s.status === 'active') || [];
    const hasHunter = activeHunters.length > 0;

    // Progress: percentage of time elapsed (approximate 7-day mission)
    const totalDuration = 7 * 24 * 60 * 60 * 1000;
    const elapsed = totalDuration - timeLeft.total;
    const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));

    return (
        <div style={{
            borderRadius: '24px', overflow: 'hidden',
            background: 'rgba(23,30,46,0.9)',
            border: isUrgent ? '1px solid rgba(255,107,53,0.3)' : '1px solid rgba(255,255,255,0.07)',
            position: 'relative',
            transition: 'all 0.3s ease',
        }}>
            {/* Top status bar */}
            <div style={{
                height: '4px',
                background: 'rgba(255,255,255,0.05)',
            }}>
                <div style={{
                    height: '100%',
                    width: progress + '%',
                    background: isUrgent
                        ? 'linear-gradient(90deg, #FF6B35, #F43F5E)'
                        : 'linear-gradient(90deg, #FFE600, #FF6B35)',
                    transition: 'width 1s ease',
                }} />
            </div>

            <div style={{ padding: '28px 30px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    {/* Mission Info */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                        <div>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '10px' }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00FF94', animation: 'pulseDot 2s infinite' }} />
                                <span style={{ fontSize: '10px', fontWeight: '800', color: '#8892AA', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                                    Mission {index + 1}
                                </span>
                            </div>
                            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#F0F4FF', fontFamily: 'Space Grotesk', marginBottom: '6px' }}>
                                {bounty.title}
                            </h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#8892AA', fontSize: '13px' }}>
                                    <Users size={14} />
                                    {activeHunters.length} Hunter{activeHunters.length !== 1 ? 's' : ''} Active
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#00FF94', fontSize: '13px', fontWeight: '700', fontFamily: 'JetBrains Mono' }}>
                                    <Zap size={14} />
                                    {currency}{(bounty.reward || 0).toLocaleString()}
                                </span>
                            </div>
                        </div>

                        {/* Timer Box */}
                        <div style={{
                            padding: '20px 28px', borderRadius: '16px', textAlign: 'center',
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid ' + timerColor + '30',
                            minWidth: '220px',
                        }}>
                            <p style={{ fontSize: '10px', color: '#8892AA', fontWeight: '700', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '10px' }}>
                                {timeLeft.total <= 0 ? '🚨 Deadline Passed' : 'Time Remaining'}
                            </p>

                            {timeLeft.total <= 0 ? (
                                <div style={{ color: '#F43F5E', fontWeight: '900', fontSize: '22px', fontFamily: 'JetBrains Mono', animation: 'pulseDot 1.5s infinite' }}>
                                    OVERDUE
                                </div>
                            ) : (
                                <div>
                                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'baseline' }}>
                                        {[
                                            { val: timeLeft.days, label: 'D' },
                                            { val: timeLeft.hours, label: 'H' },
                                            { val: timeLeft.minutes, label: 'M' },
                                            { val: timeLeft.seconds, label: 'S' },
                                        ].map(({ val, label }, i) => (
                                            <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                <span style={{
                                                    fontSize: '28px', fontWeight: '900', fontFamily: 'JetBrains Mono',
                                                    color: timerColor, lineHeight: 1,
                                                    textShadow: '0 0 20px ' + timerColor + '60',
                                                }}>
                                                    {String(val).padStart(2, '0')}
                                                </span>
                                                <span style={{ fontSize: '9px', color: '#4A5568', fontWeight: '700', marginTop: '2px' }}>{label}</span>
                                            </div>
                                        )).reduce((acc, el, i, arr) => {
                                            acc.push(el);
                                            if (i < arr.length - 1) acc.push(
                                                <span key={'sep' + i} style={{ color: timerColor, fontSize: '22px', fontFamily: 'JetBrains Mono', opacity: 0.5, marginBottom: '8px' }}>:</span>
                                            );
                                            return acc;
                                        }, [])}
                                    </div>
                                    <p style={{ fontSize: '11px', color: '#4A5568', marginTop: '8px' }}>
                                        Due: {new Date(bounty.submission_deadline).toLocaleDateString()}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Hunters List */}
                    {hasHunter && (
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                            <p style={{ fontSize: '11px', color: '#4A5568', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>Assigned Hunters</p>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {activeHunters.map(stake => (
                                    <div key={stake.hunter?.id} style={{
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        padding: '6px 12px', borderRadius: '8px',
                                        background: 'rgba(0,255,148,0.08)', border: '1px solid rgba(0,255,148,0.2)',
                                    }}>
                                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(0,255,148,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '800', color: '#00FF94' }}>
                                            {stake.hunter?.username?.substring(0, 2).toUpperCase() || '??'}
                                        </div>
                                        <span style={{ color: '#F0F4FF', fontSize: '13px', fontWeight: '600' }}>{stake.hunter?.username || 'Hunter'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                        <button
                            onClick={() => navigate('/payer/bounty/' + bounty.id)}
                            className="btn-secondary"
                            style={{ flex: 1, minWidth: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 20px', fontSize: '14px' }}
                        >
                            <MessageSquare size={16} /> Manage Bounty
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
