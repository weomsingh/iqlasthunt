import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';
import { Clock, Target, AlertCircle, Shield, Zap, Trophy, ArrowRight, Flame, CheckCircle2 } from 'lucide-react';

export default function HunterWarRoom() {
    const { currentUser } = useAuth();
    const [activeBounty, setActiveBounty] = useState(null);
    const [activeStake, setActiveStake] = useState(null);
    const [timer, setTimer] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (currentUser) {
            loadActiveBounty();
        }
    }, [currentUser]);

    async function loadActiveBounty() {
        try {
            const { data: stakeData } = await supabase
                .from('hunter_stakes')
                .select(`*, bounty:bounties(*)`)
                .eq('hunter_id', currentUser.id)
                .eq('status', 'active')
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (!stakeData) {
                setLoading(false);
                return;
            }

            setActiveBounty(stakeData.bounty);
            setActiveStake(stakeData);
        } catch (error) {
            console.error('Error loading active bounty:', error);
        } finally {
            setLoading(false);
        }
    }

    function calculateTimeRemaining(deadline) {
        const now = new Date();
        const end = new Date(deadline);
        const diff = end - now;

        if (diff <= 0) return { expired: true, display: 'EXPIRED' };

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        return { expired: false, days, hours, minutes, seconds };
    }

    useEffect(() => {
        if (!activeBounty) return;

        const interval = setInterval(() => {
            const time = calculateTimeRemaining(activeBounty.submission_deadline);
            setTimer(time);
        }, 1000);

        setTimer(calculateTimeRemaining(activeBounty.submission_deadline));
        return () => clearInterval(interval);
    }, [activeBounty]);

    const currency = currentUser?.currency === 'INR' ? '₹' : '$';

    // Progress bar calculation
    let progressPct = 100;
    let isUrgent = false;
    if (activeBounty?.submission_deadline && activeBounty?.created_at) {
        const start = new Date(activeBounty.created_at).getTime();
        const end = new Date(activeBounty.submission_deadline).getTime();
        const now = Date.now();
        const total = end - start;
        const elapsed = now - start;
        if (total > 0) progressPct = Math.max(0, Math.min(100, 100 - (elapsed / total) * 100));
        if (progressPct < 20) isUrgent = true;
    }

    if (loading) {
        return (
            <div style={{
                display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh',
                flexDirection: 'column', gap: '16px'
            }}>
                <div style={{
                    width: '56px', height: '56px', borderRadius: '50%',
                    border: '3px solid #FF6B35', borderTopColor: 'transparent',
                    animation: 'spin 1s linear infinite'
                }} />
                <p style={{ color: '#6B7A99', fontWeight: '600' }}>Loading War Room...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (!activeBounty) {
        return (
            <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', minHeight: '60vh', textAlign: 'center', gap: '28px',
                padding: '40px 20px', animation: 'fadeInUp 0.5s ease'
            }}>
                {/* Animated icon */}
                <div style={{
                    width: '120px', height: '120px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(255,107,53,0.15), rgba(245,158,11,0.1))',
                    border: '2px solid rgba(255,107,53,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 60px rgba(255,107,53,0.2)',
                    animation: 'glowPulse 3s ease-in-out infinite',
                }}>
                    <Target size={52} style={{ color: '#FF6B35' }} />
                </div>

                <div>
                    <h1 style={{
                        fontSize: '32px', fontWeight: '900', color: '#1A1F2E',
                        marginBottom: '12px', fontFamily: 'Space Grotesk'
                    }}>
                        War Room Offline
                    </h1>
                    <p style={{ color: '#6B7A99', maxWidth: '380px', lineHeight: '1.7', fontSize: '16px' }}>
                        No active mission. Browse the Arena, stake on a bounty, and unlock your War Room command center.
                    </p>
                </div>

                <button
                    className="btn-primary"
                    onClick={() => window.location.href = '/hunter/arena'}
                    style={{ padding: '16px 36px', fontSize: '16px', gap: '10px' }}
                >
                    <Target size={20} /> Browse Arena <ArrowRight size={18} />
                </button>
            </div>
        );
    }

    const timerColor = timer.expired ? '#F43F5E' : isUrgent ? '#F97316' : '#FF6B35';
    const timerBg = timer.expired ? 'rgba(244,63,94,0.08)' : isUrgent ? 'rgba(249,115,22,0.08)' : 'rgba(255,107,53,0.08)';
    const timerBorder = timer.expired ? 'rgba(244,63,94,0.3)' : isUrgent ? 'rgba(249,115,22,0.3)' : 'rgba(255,107,53,0.25)';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeInUp 0.5s ease', paddingBottom: '80px' }}>

            {/* === PAGE HEADER === */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <div style={{ width: '4px', height: '28px', borderRadius: '2px', background: 'linear-gradient(180deg, #FF6B35, #F59E0B)' }} />
                <div>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#FF6B35', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                        Command Center
                    </span>
                    <h1 style={{ fontSize: 'clamp(22px, 4vw, 36px)', fontWeight: '900', color: '#1A1F2E', fontFamily: 'Space Grotesk', letterSpacing: '-0.02em' }}>
                        War Room
                    </h1>
                </div>
            </div>

            {/* === MISSION HEADER CARD === */}
            <div style={{
                borderRadius: '28px', overflow: 'hidden',
                background: 'linear-gradient(135deg, #FF6B35 0%, #F59E0B 50%, #FF6B35 100%)',
                backgroundSize: '200% auto',
                padding: '2px',
                boxShadow: '0 20px 60px rgba(255,107,53,0.35)',
                animation: 'gradientShift 4s ease infinite',
            }}>
                <style>{`
                    @keyframes gradientShift { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
                    @keyframes glowPulse { 0%,100% { box-shadow: 0 0 30px rgba(255,107,53,0.2); } 50% { box-shadow: 0 0 60px rgba(255,107,53,0.4); } }
                    @keyframes fadeInUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
                    @keyframes timerTick { 0%,100% { transform: scale(1); } 50% { transform: scale(1.02); } }
                `}</style>
                <div style={{
                    borderRadius: '26px', padding: '32px',
                    background: 'linear-gradient(135deg, #FFFBF7 0%, #FFF7ED 100%)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                    flexWrap: 'wrap', gap: '20px',
                }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            padding: '6px 14px', borderRadius: '20px', marginBottom: '16px',
                            background: 'rgba(255,107,53,0.12)', border: '1px solid rgba(255,107,53,0.3)',
                        }}>
                            <span style={{
                                width: '8px', height: '8px', borderRadius: '50%',
                                background: '#FF6B35', display: 'inline-block',
                                animation: 'pulseDot 1.5s ease-in-out infinite',
                            }} />
                            <span style={{ color: '#FF6B35', fontWeight: '800', fontSize: '11px', letterSpacing: '0.12em' }}>
                                LIVE MISSION
                            </span>
                        </div>
                        <h2 style={{ fontSize: 'clamp(18px, 3vw, 26px)', fontWeight: '900', color: '#1A1F2E', fontFamily: 'Space Grotesk', marginBottom: '12px', lineHeight: 1.3 }}>
                            {activeBounty.title}
                        </h2>
                        <p style={{ color: '#6B7A99', fontSize: '14px', lineHeight: '1.6', maxWidth: '400px' }}>
                            {activeBounty.description?.substring(0, 120)}...
                        </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ color: '#9CA3AF', fontSize: '11px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
                            Reward Pool
                        </p>
                        <p style={{
                            fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: '900', fontFamily: 'Space Grotesk',
                            background: 'linear-gradient(135deg, #FF6B35, #F59E0B)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                        }}>
                            {currency}{activeBounty.reward?.toLocaleString()}
                        </p>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            marginTop: '8px', justifyContent: 'flex-end',
                        }}>
                            <Zap size={14} style={{ color: '#F59E0B' }} />
                            <span style={{ color: '#6B7A99', fontSize: '12px', fontWeight: '600' }}>
                                Your stake: {currency}{activeStake?.stake_amount?.toLocaleString() || '—'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* === BIG COUNTDOWN TIMER === */}
            <div style={{
                borderRadius: '28px', padding: '40px',
                background: timerBg, border: `2px solid ${timerBorder}`,
                textAlign: 'center', position: 'relative', overflow: 'hidden',
                boxShadow: timer.expired ? '0 20px 60px rgba(244,63,94,0.15)' : '0 20px 60px rgba(255,107,53,0.15)',
            }}>
                {/* Background ping effect */}
                <div style={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '300px', height: '300px', borderRadius: '50%',
                    background: `radial-gradient(circle, ${timerColor}08 0%, transparent 70%)`,
                    pointerEvents: 'none',
                }} />

                <p style={{
                    color: timerColor, fontSize: '11px', fontWeight: '800',
                    letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '28px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}>
                    <Clock size={14} /> Mission Deadline
                </p>

                {timer.expired ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                        <AlertCircle size={60} style={{ color: '#F43F5E' }} />
                        <p style={{ fontWeight: '900', fontSize: '28px', fontFamily: 'Space Grotesk', color: '#F43F5E' }}>
                            MISSION EXPIRED
                        </p>
                        <p style={{ color: '#9CA3AF' }}>The submission window has closed.</p>
                    </div>
                ) : (
                    <>
                        {/* Big timer digits */}
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
                            {[
                                { v: timer.days || 0, l: 'Days' },
                                { v: timer.hours || 0, l: 'Hours' },
                                { v: timer.minutes || 0, l: 'Mins' },
                                { v: timer.seconds || 0, l: 'Secs' },
                            ].map((seg, i) => (
                                <React.Fragment key={i}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                        <div style={{
                                            background: 'white',
                                            borderRadius: '20px', padding: '16px 20px',
                                            fontFamily: 'JetBrains Mono', fontWeight: '900',
                                            fontSize: 'clamp(36px, 6vw, 64px)',
                                            color: timerColor,
                                            minWidth: 'clamp(80px, 12vw, 120px)',
                                            textAlign: 'center',
                                            boxShadow: `0 8px 30px ${timerColor}20, inset 0 1px 0 rgba(255,255,255,0.8)`,
                                            border: `1px solid ${timerBorder}`,
                                            animation: 'timerTick 1s ease-in-out',
                                        }}>
                                            {String(seg.v).padStart(2, '0')}
                                        </div>
                                        <span style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: '700', letterSpacing: '0.05em' }}>{seg.l}</span>
                                    </div>
                                    {i < 3 && (
                                        <span style={{
                                            color: timerColor, fontSize: 'clamp(28px, 4vw, 52px)',
                                            fontWeight: '900', marginTop: '-32px', opacity: 0.6,
                                            fontFamily: 'JetBrains Mono',
                                        }}>:</span>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>

                        {/* Progress bar */}
                        <div style={{ maxWidth: '480px', margin: '0 auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ color: '#9CA3AF', fontSize: '12px', fontWeight: '600' }}>Time Remaining</span>
                                <span style={{ color: timerColor, fontSize: '12px', fontWeight: '800', fontFamily: 'JetBrains Mono' }}>
                                    {Math.round(progressPct)}%
                                </span>
                            </div>
                            <div style={{ height: '8px', background: 'rgba(0,0,0,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%', borderRadius: '4px',
                                    width: `${progressPct}%`,
                                    background: isUrgent
                                        ? 'linear-gradient(90deg, #F43F5E, #F97316)'
                                        : 'linear-gradient(90deg, #FF6B35, #F59E0B)',
                                    transition: 'width 1s ease',
                                    boxShadow: `0 0 12px ${timerColor}60`,
                                }} />
                            </div>
                        </div>

                        {/* Urgent warning */}
                        {isUrgent && (
                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: '10px',
                                marginTop: '20px', padding: '12px 24px', borderRadius: '12px',
                                background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.35)',
                                animation: 'pulseDot 1.5s ease-in-out infinite',
                            }}>
                                <AlertCircle size={18} style={{ color: '#F43F5E' }} />
                                <span style={{ color: '#F43F5E', fontWeight: '800', fontSize: '14px' }}>
                                    ⚡ Less than 20% time remaining — Push hard!
                                </span>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* === MISSION DETAILS GRID === */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>

                {/* Stake Info */}
                <div style={{
                    borderRadius: '20px', padding: '24px',
                    background: 'linear-gradient(135deg, rgba(255,107,53,0.06), rgba(245,158,11,0.04))',
                    border: '1px solid rgba(255,107,53,0.2)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,107,53,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Zap size={20} style={{ color: '#FF6B35' }} />
                        </div>
                        <h3 style={{ fontWeight: '700', color: '#1A1F2E', fontSize: '15px', fontFamily: 'Space Grotesk' }}>Your Stake</h3>
                    </div>
                    <p style={{ fontSize: '32px', fontWeight: '900', color: '#FF6B35', fontFamily: 'JetBrains Mono' }}>
                        {currency}{activeStake?.stake_amount?.toLocaleString() || '—'}
                    </p>
                    <p style={{ color: '#9CA3AF', fontSize: '13px', marginTop: '8px' }}>At risk if submission fails</p>
                </div>

                {/* Reward vs Stake */}
                <div style={{
                    borderRadius: '20px', padding: '24px',
                    background: 'linear-gradient(135deg, rgba(16,185,129,0.06), rgba(6,182,212,0.04))',
                    border: '1px solid rgba(16,185,129,0.2)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Trophy size={20} style={{ color: '#10B981' }} />
                        </div>
                        <h3 style={{ fontWeight: '700', color: '#1A1F2E', fontSize: '15px', fontFamily: 'Space Grotesk' }}>Potential Win</h3>
                    </div>
                    <p style={{ fontSize: '32px', fontWeight: '900', color: '#10B981', fontFamily: 'JetBrains Mono' }}>
                        {currency}{activeBounty.reward?.toLocaleString()}
                    </p>
                    <p style={{ color: '#9CA3AF', fontSize: '13px', marginTop: '8px' }}>Full bounty reward if approved</p>
                </div>

                {/* Deadline info */}
                <div style={{
                    borderRadius: '20px', padding: '24px',
                    background: 'linear-gradient(135deg, rgba(59,130,246,0.06), rgba(139,92,246,0.04))',
                    border: '1px solid rgba(59,130,246,0.2)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Clock size={20} style={{ color: '#3B82F6' }} />
                        </div>
                        <h3 style={{ fontWeight: '700', color: '#1A1F2E', fontSize: '15px', fontFamily: 'Space Grotesk' }}>Deadline</h3>
                    </div>
                    <p style={{ fontSize: '16px', fontWeight: '800', color: '#3B82F6', fontFamily: 'Space Grotesk' }}>
                        {new Date(activeBounty.submission_deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <p style={{ color: '#9CA3AF', fontSize: '13px', marginTop: '4px' }}>
                        {new Date(activeBounty.submission_deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>
            </div>

            {/* === MISSION RULES / TIPS === */}
            <div style={{
                borderRadius: '24px', padding: '28px',
                background: 'linear-gradient(135deg, #FFFBF7, #FFF7ED)',
                border: '1px solid rgba(255,107,53,0.2)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                    <Flame size={22} style={{ color: '#FF6B35' }} />
                    <h3 style={{ fontWeight: '800', color: '#1A1F2E', fontSize: '18px', fontFamily: 'Space Grotesk' }}>
                        Mission Briefing
                    </h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
                    {[
                        { icon: CheckCircle2, text: 'Submit your best work before the deadline', color: '#10B981' },
                        { icon: Shield, text: 'Your stake is secured until review is complete', color: '#3B82F6' },
                        { icon: Trophy, text: 'Top submission wins the full reward pool', color: '#F59E0B' },
                        { icon: Zap, text: 'Payer reviews and approves the winning entry', color: '#8B5CF6' },
                    ].map((tip, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                            <div style={{
                                width: '32px', height: '32px', borderRadius: '10px', flexShrink: 0,
                                background: `${tip.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <tip.icon size={16} style={{ color: tip.color }} />
                            </div>
                            <p style={{ color: '#4B5563', fontSize: '14px', lineHeight: '1.6', fontWeight: '500' }}>{tip.text}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* === ACTION BUTTONS === */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button
                    onClick={() => window.location.href = `/hunter/bounty/${activeBounty.id}`}
                    className="btn-primary"
                    style={{ flex: 1, minWidth: '160px', padding: '16px 24px', fontSize: '15px', gap: '10px' }}
                >
                    <Target size={20} /> View Bounty Details <ArrowRight size={16} />
                </button>
                <button
                    onClick={() => window.location.href = '/hunter/arena'}
                    className="btn-secondary"
                    style={{ padding: '16px 24px', fontSize: '15px' }}
                >
                    Browse Arena
                </button>
            </div>
        </div>
    );
}
