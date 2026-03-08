import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getTopBounties } from '../lib/firebaseService';
import {
    Target, Users, CheckCircle, ArrowRight, Shield, Zap, Lock,
    ChevronDown, Award, Star, TrendingUp, DollarSign, Flame,
    Code, Palette, PenTool, BarChart2, Globe, Brain, Sparkles,
    Trophy, Clock, MousePointerClick
} from 'lucide-react';
import Footer from '../components/Footer';

// Floating orb component
function Orb({ style }) {
    return (
        <div className="floating-element pointer-events-none absolute rounded-full" style={{
            filter: 'blur(80px)',
            ...style
        }} />
    );
}

export default function LandingPage() {
    const { currentUser, loading, signInWithGoogle } = useAuth();
    const navigate = useNavigate();
    const [hotBounties, setHotBounties] = useState([]);
    const [bountiesLoading, setBountiesLoading] = useState(true);
    const [roleMismatch, setRoleMismatch] = useState(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const heroRef = useRef(null);

    useEffect(() => {
        loadTopBounties();
        const handleMouseMove = (e) => setMousePos({ x: e.clientX, y: e.clientY });
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    async function loadTopBounties() {
        try {
            const data = await getTopBounties(3);
            setHotBounties(data || []);
        } catch (err) {
            console.error("Failed to load bounties", err);
        } finally {
            setBountiesLoading(false);
        }
    }

    async function handleEnterAsHunter() {
        if (currentUser) {
            if (currentUser.role === 'hunter') navigate('/hunter/dashboard');
            else setRoleMismatch({ actual: currentUser.role, intended: 'hunter' });
            return;
        }
        try { await signInWithGoogle('hunter'); }
        catch (error) { console.error(error); }
    }

    async function handlePostBounty() {
        if (currentUser) {
            if (currentUser.role === 'payer') navigate('/payer/dashboard');
            else setRoleMismatch({ actual: currentUser.role, intended: 'payer' });
            return;
        }
        try { await signInWithGoogle('payer'); }
        catch (error) { console.error(error); }
    }

    const categories = [
        { icon: Code, label: 'Development', color: '#00E5FF', glow: 'rgba(0,229,255,0.2)' },
        { icon: Palette, label: 'Design', color: '#9B5DE5', glow: 'rgba(155,93,229,0.2)' },
        { icon: PenTool, label: 'Writing', color: '#06FFA5', glow: 'rgba(6,255,165,0.2)' },
        { icon: BarChart2, label: 'Marketing', color: '#FF6B35', glow: 'rgba(255,107,53,0.2)' },
        { icon: Brain, label: 'Research', color: '#F6C90E', glow: 'rgba(246,201,14,0.2)' },
        { icon: Globe, label: 'Business', color: '#4361EE', glow: 'rgba(67,97,238,0.2)' },
    ];

    return (
        <div className="min-h-screen overflow-x-hidden" style={{ background: '#050814', color: '#F0F4FF' }}>
            {/* Cursor follower */}
            <div className="fixed pointer-events-none z-0 transition-all duration-500 ease-out" style={{
                width: '500px', height: '500px',
                background: 'radial-gradient(circle, rgba(255,107,53,0.04) 0%, transparent 70%)',
                borderRadius: '50%',
                left: mousePos.x - 250, top: mousePos.y - 250,
            }} />

            {/* ===== ROLE MISMATCH MODAL ===== */}
            {roleMismatch && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                    style={{ background: 'rgba(5,8,20,0.95)', backdropFilter: 'blur(20px)' }}>
                    <div className="w-full max-w-md animate-scale-in" style={{
                        background: 'rgba(10,15,35,0.95)',
                        border: '1px solid rgba(247,37,133,0.3)',
                        borderRadius: '24px', padding: '40px',
                        boxShadow: '0 0 80px rgba(247,37,133,0.1)'
                    }}>
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
                            style={{ background: 'rgba(247,37,133,0.1)', border: '1px solid rgba(247,37,133,0.3)', color: '#F72585' }}>
                            <Shield size={32} />
                        </div>
                        <h2 className="text-2xl font-bold mb-2 text-center" style={{ color: '#F0F4FF' }}>Access Restricted</h2>
                        <p className="text-center mb-8" style={{ color: '#8892AA' }}>
                            You're logged in as a <span style={{ color: '#FF6B35', fontWeight: 800 }}>{roleMismatch.actual}</span>.
                            <br />Cannot access the <span style={{ color: '#F72585', fontWeight: 800 }}>{roleMismatch.intended}</span> area.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <button onClick={() => {
                                if (roleMismatch.actual === 'hunter') navigate('/hunter/dashboard');
                                else if (roleMismatch.actual === 'payer') navigate('/payer/dashboard');
                                else navigate('/admin/dashboard');
                                setRoleMismatch(null);
                            }} className="btn-primary w-full">
                                Go to My Dashboard <ArrowRight size={18} />
                            </button>
                            <button onClick={() => setRoleMismatch(null)}
                                style={{ color: '#8892AA', background: 'none', border: 'none', fontSize: '14px', cursor: 'pointer', minHeight: '44px' }}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== FLOATING NAV ===== */}
            <header className="fixed top-0 left-0 right-0 z-50 py-4 px-5 md:px-8" style={{
                background: 'rgba(5,8,20,0.85)',
                backdropFilter: 'blur(24px)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                boxShadow: '0 4px 30px rgba(0,0,0,0.5)',
            }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img src="/finallandstrans.png" alt="IQHUNT" style={{ height: '44px', width: 'auto', objectFit: 'contain', filter: 'brightness(1.1)' }} />
                    </div>

                    <nav style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                        {[
                            { href: '#how-it-works', label: 'How It Works' },
                            { href: '#bounties', label: 'Live Bounties' },
                            { href: '#testimonials', label: 'Results' },
                        ].map(link => (
                            <a key={link.href} href={link.href} className="hidden md:block"
                                style={{ color: '#8892AA', fontSize: '14px', fontWeight: '500', textDecoration: 'none', transition: 'color 0.2s ease' }}
                                onMouseOver={e => e.target.style.color = '#FF6B35'}
                                onMouseOut={e => e.target.style.color = '#8892AA'}>
                                {link.label}
                            </a>
                        ))}
                    </nav>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {currentUser ? (
                            <button onClick={() => navigate(`/${currentUser.role}/dashboard`)} className="btn-primary"
                                style={{ padding: '10px 20px', minHeight: '40px', fontSize: '13px', borderRadius: '10px' }}>
                                Dashboard <ArrowRight size={15} />
                            </button>
                        ) : (
                            <>
                                <button onClick={handleEnterAsHunter} className="hidden md:flex"
                                    style={{
                                        color: '#8892AA', background: 'rgba(255,255,255,0.04)',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        borderRadius: '10px', padding: '10px 20px',
                                        fontSize: '14px', fontWeight: '600',
                                        cursor: 'pointer', minHeight: '40px',
                                        alignItems: 'center', gap: '8px',
                                        transition: 'all 0.2s ease',
                                    }}
                                    onMouseOver={e => { e.currentTarget.style.color = '#F0F4FF'; e.currentTarget.style.borderColor = 'rgba(255,107,53,0.3)'; }}
                                    onMouseOut={e => { e.currentTarget.style.color = '#8892AA'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}>
                                    Sign In
                                </button>
                                <button onClick={handleEnterAsHunter} className="btn-primary"
                                    style={{ padding: '10px 20px', minHeight: '40px', fontSize: '13px', borderRadius: '10px' }}>
                                    Get Started
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* ===== HERO SECTION ===== */}
            <section ref={heroRef} className="hero-section relative min-h-screen flex items-center pt-28 pb-20 overflow-hidden">
                {/* Grid overlay */}
                <div className="hero-grid absolute inset-0 pointer-events-none opacity-40" />

                {/* Background orbs */}
                <Orb style={{ top: '-100px', right: '-100px', width: '700px', height: '700px', background: 'radial-gradient(circle, rgba(255,107,53,0.12) 0%, transparent 60%)' }} />
                <Orb style={{ bottom: '-100px', left: '-100px', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(67,97,238,0.10) 0%, transparent 60%)', animationDelay: '2s' }} />
                <Orb style={{ top: '40%', left: '40%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(155,93,229,0.06) 0%, transparent 70%)', animationDelay: '4s' }} />

                {/* Animated lines */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div style={{
                        position: 'absolute', top: '35%', left: '-10%', right: '-10%',
                        height: '1px', background: 'linear-gradient(90deg, transparent 0%, rgba(255,107,53,0.15) 30%, rgba(155,93,229,0.15) 70%, transparent 100%)',
                        animation: 'float 8s ease-in-out infinite',
                    }} />
                </div>

                <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 10, width: '100%' }}>
                    <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>

                        {/* Live badge */}
                        <div className="animate-fade-in" style={{
                            display: 'inline-flex', alignItems: 'center', gap: '10px',
                            padding: '8px 20px', borderRadius: '100px', marginBottom: '36px',
                            background: 'rgba(255,107,53,0.08)',
                            border: '1px solid rgba(255,107,53,0.25)',
                            backdropFilter: 'blur(16px)',
                            cursor: 'default',
                        }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FF6B35', display: 'inline-block', animation: 'pulseDot 1.5s ease-in-out infinite', boxShadow: '0 0 10px rgba(255,107,53,0.6)' }} />
                            <span style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '0.18em', color: '#FF6B35', textTransform: 'uppercase' }}>Live Bounty Protocol · Now Active</span>
                            <Sparkles size={14} style={{ color: '#F6C90E', opacity: 0.8 }} />
                        </div>

                        {/* Headline */}
                        <h1 style={{
                            fontSize: 'clamp(3rem, 9vw, 7.5rem)',
                            fontWeight: '900',
                            fontFamily: 'Space Grotesk',
                            letterSpacing: '-0.03em',
                            lineHeight: '1.02',
                            marginBottom: '28px',
                            color: '#F0F4FF',
                        }}>
                            WHERE SKILL{' '}
                            <br className="hidden sm:block" />
                            <span style={{
                                display: 'inline-block',
                                background: 'linear-gradient(135deg, #FF6B35 0%, #F6C90E 40%, #06FFA5 70%, #00E5FF 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                                filter: 'drop-shadow(0px 0px 40px rgba(255,107,53,0.35))',
                            }}>
                                HUNTS MONEY.
                            </span>
                        </h1>

                        {/* Subheadline */}
                        <p style={{
                            fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
                            color: '#8892AA',
                            maxWidth: '560px',
                            margin: '0 auto 48px',
                            lineHeight: 1.7,
                            fontWeight: '500',
                        }}>
                            A private elite arena for professionals. Deploy capital, stake your expertise, and{' '}
                            <span style={{ color: '#FF6B35', fontWeight: '700' }}>extract the ultimate reward</span>.
                        </p>

                        {/* CTA buttons */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', justifyContent: 'center', marginBottom: '72px' }} className="sm:flex-row">
                            <button onClick={handleEnterAsHunter} className="btn-primary pulse-glow-btn"
                                style={{ fontSize: '15px', padding: '18px 40px', gap: '12px', borderRadius: '14px', width: '100%', maxWidth: '240px', letterSpacing: '0.06em' }}>
                                <Target size={22} />
                                ENTER AS HUNTER
                            </button>
                            <button onClick={handlePostBounty} className="btn-secondary"
                                style={{ fontSize: '15px', padding: '18px 40px', gap: '12px', borderRadius: '14px', width: '100%', maxWidth: '240px', letterSpacing: '0.06em' }}>
                                <DollarSign size={22} />
                                POST A BOUNTY
                            </button>
                        </div>

                        {/* Stats grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', maxWidth: '680px', margin: '0 auto' }} className="grid-cols-2 md:grid-cols-3">
                            {[
                                { value: '98%', label: 'Success Rate', color: '#FF6B35', glow: 'rgba(255,107,53,0.2)' },
                                { value: '100+', label: 'Elite Hunters', color: '#00E5FF', glow: 'rgba(0,229,255,0.2)' },
                                { value: '₹2Cr+', label: 'Paid Out', color: '#06FFA5', glow: 'rgba(6,255,165,0.2)' },
                            ].map((stat, i) => (
                                <div key={i} style={{
                                    padding: '24px 16px',
                                    borderRadius: '20px',
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    backdropFilter: 'blur(16px)',
                                    textAlign: 'center',
                                    transition: 'all 0.3s ease',
                                    cursor: 'default',
                                    gridColumn: i === 2 ? 'span 1' : undefined,
                                }}
                                    onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 15px 40px ${stat.glow}`; e.currentTarget.style.borderColor = stat.color + '30'; }}
                                    onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}>
                                    <div style={{ fontSize: 'clamp(28px,5vw,40px)', fontWeight: '900', fontFamily: 'Space Grotesk', color: stat.color, textShadow: `0 0 25px ${stat.glow}`, lineHeight: 1 }}>
                                        {stat.value}
                                    </div>
                                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#4B5563', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: '8px' }}>
                                        {stat.label}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Scroll indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce" style={{ color: '#4B5563' }}>
                    <ChevronDown size={24} />
                </div>
            </section>

            {/* ===== CATEGORIES STRIP ===== */}
            <section style={{ padding: '24px 0', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.02)', overflow: 'hidden' }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px' }}>
                    <div className="filter-chips" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '4px 0' }}>
                        {categories.map((cat, i) => (
                            <div key={i} style={{
                                display: 'flex', alignItems: 'center', gap: '10px',
                                padding: '10px 18px', borderRadius: '100px',
                                background: `${cat.color}08`,
                                border: `1px solid ${cat.color}20`,
                                cursor: 'pointer', whiteSpace: 'nowrap',
                                transition: 'all 0.2s ease', minHeight: '44px',
                            }}
                                onMouseOver={e => { e.currentTarget.style.boxShadow = `0 0 20px ${cat.glow}`; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = cat.color + '50'; }}
                                onMouseOut={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = cat.color + '20'; }}>
                                <cat.icon size={15} style={{ color: cat.color }} />
                                <span style={{ color: cat.color, fontSize: '13px', fontWeight: '600' }}>{cat.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== HOW IT WORKS ===== */}
            <section id="how-it-works" style={{ padding: '120px 0', position: 'relative' }}>
                <div style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none',
                    background: 'radial-gradient(ellipse at 50% 50%, rgba(155,93,229,0.05) 0%, transparent 70%)',
                }} />

                <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
                    <div style={{ textAlign: 'center', marginBottom: '72px' }}>
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            padding: '6px 16px', borderRadius: '100px', marginBottom: '20px',
                            background: 'rgba(155,93,229,0.08)',
                            border: '1px solid rgba(155,93,229,0.2)',
                            color: '#9B5DE5', fontSize: '11px', fontWeight: '800', letterSpacing: '0.15em',
                        }}>
                            <Zap size={12} /> THE PROTOCOL
                        </div>
                        <h2 style={{ fontSize: 'clamp(2rem,5vw,4rem)', fontWeight: '900', fontFamily: 'Space Grotesk', letterSpacing: '-0.02em', marginBottom: '16px', color: '#F0F4FF' }}>
                            How IQHUNT Works
                        </h2>
                        <p style={{ color: '#8892AA', fontSize: '18px', maxWidth: '440px', margin: '0 auto', fontWeight: '500' }}>
                            Three steps to transform skills into capital.
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', maxWidth: '1100px', margin: '0 auto' }} className="grid-cols-1 md:grid-cols-3">
                        {[
                            {
                                icon: Target, number: '01', title: 'Post Your Bounty',
                                desc: 'Describe your task, set the reward pool, and deploy funds to escrow. Our smart system helps define the perfect brief.',
                                color: '#00E5FF', shadow: 'rgba(0,229,255,0.15)',
                            },
                            {
                                icon: Users, number: '02', title: 'Hunters Compete',
                                desc: 'Verified expert hunters stake their own funds to participate, ensuring only serious talent applies. May the best hunter win.',
                                color: '#9B5DE5', shadow: 'rgba(155,93,229,0.15)',
                            },
                            {
                                icon: CheckCircle, number: '03', title: 'Approve & Pay Out',
                                desc: 'Review submissions, approve the best work, and payment releases instantly from escrow. Fast, secure, guaranteed.',
                                color: '#FF6B35', shadow: 'rgba(255,107,53,0.15)',
                            },
                        ].map((step, idx) => (
                            <div key={idx} style={{ position: 'relative' }}
                                onMouseOver={e => {
                                    const card = e.currentTarget.querySelector('.step-card');
                                    card.style.borderColor = `${step.color}30`;
                                    card.style.transform = 'translateY(-8px)';
                                    card.style.boxShadow = `0 30px 80px ${step.shadow}`;
                                }}
                                onMouseOut={e => {
                                    const card = e.currentTarget.querySelector('.step-card');
                                    card.style.borderColor = 'rgba(255,255,255,0.06)';
                                    card.style.transform = 'translateY(0)';
                                    card.style.boxShadow = '0 4px 30px rgba(0,0,0,0.3)';
                                }}>
                                <div className="step-card" style={{
                                    borderRadius: '28px', padding: '40px 32px',
                                    background: 'rgba(10,15,35,0.7)',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    backdropFilter: 'blur(20px)',
                                    boxShadow: '0 4px 30px rgba(0,0,0,0.3)',
                                    transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
                                    cursor: 'default', height: '100%',
                                    position: 'relative', overflow: 'hidden',
                                }}>
                                    {/* Corner glow */}
                                    <div style={{
                                        position: 'absolute', top: '-40px', right: '-40px',
                                        width: '120px', height: '120px', borderRadius: '50%',
                                        background: `radial-gradient(circle, ${step.color}15 0%, transparent 70%)`,
                                        pointerEvents: 'none',
                                    }} />
                                    <div style={{
                                        position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px',
                                        background: `linear-gradient(90deg, transparent, ${step.color}30, transparent)`,
                                    }} />

                                    <span style={{
                                        fontSize: '12px', fontWeight: '900', letterSpacing: '0.2em',
                                        color: `${step.color}50`, display: 'block', marginBottom: '24px',
                                        fontFamily: 'JetBrains Mono',
                                    }}>STEP {step.number}</span>

                                    <div style={{
                                        width: '64px', height: '64px', borderRadius: '18px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: `${step.color}12`,
                                        border: `1px solid ${step.color}30`,
                                        boxShadow: `0 0 30px ${step.color}15`,
                                        marginBottom: '28px',
                                        transition: 'transform 0.3s ease',
                                    }}>
                                        <step.icon size={28} style={{ color: step.color }} />
                                    </div>

                                    <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#F0F4FF', fontFamily: 'Space Grotesk', marginBottom: '16px', letterSpacing: '-0.01em' }}>
                                        {step.title}
                                    </h3>
                                    <p style={{ color: '#8892AA', lineHeight: 1.7, fontSize: '15px', fontWeight: '500' }}>
                                        {step.desc}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== LIVE BOUNTIES PREVIEW ===== */}
            {(hotBounties.length > 0 || bountiesLoading) && (
                <section id="bounties" style={{ padding: '120px 0', position: 'relative' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 80% 50%, rgba(255,107,53,0.05) 0%, transparent 60%)', pointerEvents: 'none' }} />
                    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '60px', flexWrap: 'wrap', gap: '24px' }}>
                            <div>
                                <div style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                                    padding: '6px 16px', borderRadius: '100px', marginBottom: '16px',
                                    background: 'rgba(255,107,53,0.08)',
                                    border: '1px solid rgba(255,107,53,0.2)',
                                    color: '#FF6B35', fontSize: '11px', fontWeight: '800', letterSpacing: '0.15em',
                                }}>
                                    <Flame size={12} /> ACTIVE MISSIONS
                                </div>
                                <h2 style={{ fontSize: 'clamp(2rem,5vw,4rem)', fontWeight: '900', fontFamily: 'Space Grotesk', letterSpacing: '-0.02em', color: '#F0F4FF', lineHeight: 1.1 }}>
                                    Live Bounties
                                </h2>
                            </div>
                            <button onClick={handleEnterAsHunter} style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                color: '#00E5FF', fontSize: '13px', fontWeight: '700',
                                background: 'rgba(0,229,255,0.06)',
                                border: '1px solid rgba(0,229,255,0.2)',
                                borderRadius: '10px', padding: '12px 20px',
                                cursor: 'pointer', minHeight: '44px',
                                transition: 'all 0.2s ease', letterSpacing: '0.04em',
                            }}
                                onMouseOver={e => { e.currentTarget.style.background = 'rgba(0,229,255,0.12)'; e.currentTarget.style.transform = 'translateX(4px)'; }}
                                onMouseOut={e => { e.currentTarget.style.background = 'rgba(0,229,255,0.06)'; e.currentTarget.style.transform = 'none'; }}>
                                VIEW ALL <ArrowRight size={16} />
                            </button>
                        </div>

                        {bountiesLoading ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                                {[1, 2, 3].map(i => (
                                    <div key={i} style={{ borderRadius: '24px', padding: '32px', background: 'rgba(10,15,35,0.5)', border: '1px solid rgba(255,255,255,0.05)', height: '300px' }}>
                                        <div className="skeleton" style={{ width: '60px', height: '24px', marginBottom: '16px' }} />
                                        <div className="skeleton" style={{ width: '80%', height: '20px', marginBottom: '12px' }} />
                                        <div className="skeleton" style={{ width: '100%', height: '16px', marginBottom: '8px' }} />
                                        <div className="skeleton" style={{ width: '70%', height: '16px', marginBottom: '32px' }} />
                                        <div className="skeleton" style={{ width: '100%', height: '48px', borderRadius: '12px' }} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }} className="grid-cols-1 md:grid-cols-3">
                                {hotBounties.map((bounty, i) => {
                                    const colors = [
                                        { accent: '#FF6B35', bg: 'rgba(255,107,53,0.06)', border: 'rgba(255,107,53,0.15)', shadow: 'rgba(255,107,53,0.15)' },
                                        { accent: '#9B5DE5', bg: 'rgba(155,93,229,0.06)', border: 'rgba(155,93,229,0.15)', shadow: 'rgba(155,93,229,0.15)' },
                                        { accent: '#00E5FF', bg: 'rgba(0,229,255,0.06)', border: 'rgba(0,229,255,0.15)', shadow: 'rgba(0,229,255,0.15)' },
                                    ][i % 3];
                                    return (
                                        <div key={bounty.id} style={{
                                            borderRadius: '24px', padding: '32px',
                                            background: 'rgba(10,15,35,0.75)',
                                            border: '1px solid rgba(255,255,255,0.06)',
                                            backdropFilter: 'blur(20px)',
                                            cursor: 'pointer',
                                            transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
                                            display: 'flex', flexDirection: 'column',
                                            position: 'relative', overflow: 'hidden',
                                        }}
                                            onMouseOver={e => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = `0 30px 80px ${colors.shadow}`; }}
                                            onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                                            onClick={handleEnterAsHunter}>
                                            <div style={{ position: 'absolute', top: 0, right: 0, width: '120px', height: '120px', background: `radial-gradient(circle, ${colors.accent}10 0%, transparent 70%)`, pointerEvents: 'none' }} />

                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 14px', borderRadius: '100px', background: `${colors.accent}12`, color: colors.accent, border: `1px solid ${colors.accent}25`, fontSize: '11px', fontWeight: '800', letterSpacing: '0.1em' }}>
                                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: colors.accent, display: 'inline-block', animation: 'pulseDot 1.5s ease-in-out infinite', boxShadow: `0 0 6px ${colors.accent}` }} />
                                                    LIVE
                                                </span>
                                                <span style={{ fontFamily: 'JetBrains Mono', fontWeight: '900', fontSize: '28px', color: colors.accent, textShadow: `0 0 20px ${colors.shadow}` }}>
                                                    ₹{(bounty.reward || 0).toLocaleString()}
                                                </span>
                                            </div>

                                            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#F0F4FF', fontFamily: 'Space Grotesk', marginBottom: '12px', lineHeight: 1.3 }}>
                                                {bounty.title}
                                            </h3>
                                            <p style={{ fontSize: '14px', color: '#8892AA', lineHeight: 1.7, flexGrow: 1, marginBottom: '28px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                {bounty.description}
                                            </p>

                                            <button style={{
                                                width: '100%', padding: '14px', borderRadius: '12px',
                                                background: `${colors.accent}0a`,
                                                color: colors.accent,
                                                border: `1px solid ${colors.accent}25`,
                                                fontWeight: '700', fontSize: '13px',
                                                cursor: 'pointer', letterSpacing: '0.04em',
                                                transition: 'all 0.2s ease',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                            }}>
                                                View & Apply <ArrowRight size={15} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* ===== TRUST SECTION ===== */}
            <section style={{ padding: '120px 0', position: 'relative', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(8,13,26,0.5), rgba(5,8,20,0.8))', pointerEvents: 'none' }} />
                <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
                    <div style={{ textAlign: 'center', marginBottom: '72px' }}>
                        <h2 style={{ fontSize: 'clamp(2rem,5vw,4rem)', fontWeight: '900', fontFamily: 'Space Grotesk', letterSpacing: '-0.02em', marginBottom: '16px', color: '#F0F4FF' }}>
                            Built on Trust
                        </h2>
                        <p style={{ color: '#8892AA', fontSize: '18px', maxWidth: '440px', margin: '0 auto', fontWeight: '500' }}>
                            Every transaction protected. Every payment guaranteed.
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', maxWidth: '1000px', margin: '0 auto' }} className="grid-cols-1 md:grid-cols-3">
                        {[
                            { icon: Shield, title: 'Escrow Protection', desc: 'Funds are securely held until work is approved. Zero risk of fraud or non-payment.', color: '#00E5FF', glow: 'rgba(0,229,255,0.15)' },
                            { icon: Zap, title: 'Instant Payouts', desc: 'Winners get paid instantly via UPI or transfer upon approval. No delays, no excuses.', color: '#F6C90E', glow: 'rgba(246,201,14,0.15)' },
                            { icon: Lock, title: 'Elite Talent', desc: 'All hunters are skill-tested. No fakes, no time-wasters – just pure execution.', color: '#9B5DE5', glow: 'rgba(155,93,229,0.15)' },
                        ].map((item, i) => (
                            <div key={i} style={{
                                padding: '40px 32px', borderRadius: '24px',
                                background: 'rgba(10,15,35,0.6)',
                                border: '1px solid rgba(255,255,255,0.06)',
                                backdropFilter: 'blur(20px)',
                                textAlign: 'center',
                                transition: 'all 0.3s ease', cursor: 'default',
                            }}
                                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = `0 20px 60px ${item.glow}`; e.currentTarget.style.borderColor = `${item.color}25`; }}
                                onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}>
                                <div style={{
                                    width: '64px', height: '64px', borderRadius: '18px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: `${item.color}10`, border: `1px solid ${item.color}25`,
                                    boxShadow: `0 0 25px ${item.color}12`,
                                    margin: '0 auto 24px',
                                    transition: 'transform 0.3s ease',
                                }}>
                                    <item.icon size={28} style={{ color: item.color }} />
                                </div>
                                <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#F0F4FF', fontFamily: 'Space Grotesk', marginBottom: '12px' }}>{item.title}</h3>
                                <p style={{ color: '#8892AA', lineHeight: 1.7, fontSize: '15px', fontWeight: '500' }}>{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== TESTIMONIALS ===== */}
            <section id="testimonials" style={{ padding: '120px 0', position: 'relative' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 20% 60%, rgba(155,93,229,0.06) 0%, transparent 60%)', pointerEvents: 'none' }} />
                <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
                    <div style={{ textAlign: 'center', marginBottom: '72px' }}>
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            padding: '6px 16px', borderRadius: '100px', marginBottom: '20px',
                            background: 'rgba(246,201,14,0.08)',
                            border: '1px solid rgba(246,201,14,0.2)',
                            color: '#F6C90E', fontSize: '11px', fontWeight: '800', letterSpacing: '0.15em',
                        }}>
                            <Star size={12} /> SUCCESS STORIES
                        </div>
                        <h2 style={{ fontSize: 'clamp(2rem,5vw,4rem)', fontWeight: '900', fontFamily: 'Space Grotesk', letterSpacing: '-0.02em', color: '#F0F4FF' }}>
                            Real Results
                        </h2>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', maxWidth: '900px', margin: '0 auto' }} className="grid-cols-1 md:grid-cols-2">
                        {[
                            {
                                quote: "Got my architecture designed in 24 hours. The quality is lightyears ahead of generic freelance sites. IQHUNT is an absolute game changer.",
                                name: "Anant Singh", company: "Founder, AMCRO INDIA",
                                initials: "AS", color: '#00E5FF', bg: 'rgba(0,229,255,0.08)', glow: 'rgba(0,229,255,0.15)',
                            },
                            {
                                quote: "Extreme velocity without compromising quality. They delivered exact formats at highly effective pricing. This protocol sets a new standard.",
                                name: "Niteesh Kumar", company: "Sunsprout Foods",
                                initials: "NK", color: '#9B5DE5', bg: 'rgba(155,93,229,0.08)', glow: 'rgba(155,93,229,0.15)',
                            },
                        ].map((t, i) => (
                            <div key={i} style={{
                                padding: '40px', borderRadius: '28px',
                                background: 'rgba(10,15,35,0.75)',
                                border: '1px solid rgba(255,255,255,0.06)',
                                backdropFilter: 'blur(20px)',
                                transition: 'all 0.3s ease', cursor: 'default',
                                position: 'relative', overflow: 'hidden',
                            }}
                                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = `0 25px 70px ${t.glow}`; e.currentTarget.style.borderColor = `${t.color}25`; }}
                                onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}>
                                <div style={{ position: 'absolute', top: '16px', right: '20px', opacity: 0.04, color: t.color }}>
                                    <svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" /></svg>
                                </div>

                                <div style={{ display: 'flex', gap: '4px', marginBottom: '20px' }}>
                                    {[1, 2, 3, 4, 5].map(s => <Star key={s} size={16} fill="#F6C90E" style={{ color: '#F6C90E' }} />)}
                                </div>

                                <p style={{ fontSize: '16px', color: '#C4CFED', lineHeight: 1.75, marginBottom: '28px', fontWeight: '500' }}>
                                    "{t.quote}"
                                </p>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{
                                        width: '48px', height: '48px', borderRadius: '50%',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: t.bg, color: t.color,
                                        border: `1px solid ${t.color}30`,
                                        boxShadow: `0 0 15px ${t.glow}`,
                                        fontWeight: '800', fontSize: '16px', fontFamily: 'Space Grotesk',
                                    }}>
                                        {t.initials}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '700', color: '#F0F4FF', fontSize: '15px' }}>{t.name}</div>
                                        <div style={{ color: '#8892AA', fontSize: '13px' }}>{t.company}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== FINAL CTA ===== */}
            <section style={{ padding: '160px 0', position: 'relative', overflow: 'hidden', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(255,107,53,0.08) 0%, rgba(155,93,229,0.04) 40%, transparent 70%)', pointerEvents: 'none' }} />
                <div className="hero-grid absolute inset-0 pointer-events-none opacity-20" />

                {/* Animated rings */}
                <div className="absolute top-1/2 left-1/2 pointer-events-none" style={{ transform: 'translate(-50%,-50%)' }}>
                    {[600, 900, 1200].map((size, i) => (
                        <div key={i} style={{
                            position: 'absolute', borderRadius: '50%',
                            border: `1px solid rgba(255,107,53,${0.06 - i * 0.015})`,
                            width: `${size}px`, height: `${size}px`,
                            transform: 'translate(-50%,-50%)',
                            animation: `orbitSpin ${20 + i * 10}s linear infinite ${i % 2 ? 'reverse' : ''}`,
                        }} />
                    ))}
                </div>

                <div style={{ maxWidth: '700px', margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1, textAlign: 'center' }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        padding: '8px 20px', borderRadius: '100px', marginBottom: '32px',
                        background: 'rgba(0,229,255,0.06)',
                        border: '1px solid rgba(0,229,255,0.2)',
                        color: '#00E5FF', fontSize: '13px', fontWeight: '700',
                    }}>
                        <TrendingUp size={16} className="animate-pulse" /> Ready to extract value?
                    </div>

                    <h2 style={{
                        fontSize: 'clamp(3rem,8vw,6rem)',
                        fontWeight: '900', fontFamily: 'Space Grotesk',
                        letterSpacing: '-0.03em', lineHeight: 1.05,
                        color: '#F0F4FF', marginBottom: '24px',
                    }}>
                        Enter the{' '}
                        <span style={{
                            display: 'inline-block',
                            background: 'linear-gradient(135deg, #FF6B35 0%, #F6C90E 50%, #06FFA5 100%)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                            filter: 'drop-shadow(0px 0px 40px rgba(255,107,53,0.4))',
                        }}>Arena.</span>
                    </h2>

                    <p style={{ fontSize: '18px', color: '#8892AA', maxWidth: '480px', margin: '0 auto 48px', lineHeight: 1.7, fontWeight: '500' }}>
                        Join thousands of top-tier professionals already utilizing the ultimate execution network.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }} className="sm:flex-row sm:justify-center">
                        <button onClick={handleEnterAsHunter} className="btn-primary pulse-glow-btn"
                            style={{ fontSize: '16px', padding: '20px 48px', gap: '12px', borderRadius: '14px', letterSpacing: '0.06em', width: '100%', maxWidth: '260px' }}>
                            <Target size={22} /> EXECUTE BOUNTIES
                        </button>
                        <button onClick={handlePostBounty} className="btn-secondary"
                            style={{ fontSize: '16px', padding: '20px 48px', gap: '12px', borderRadius: '14px', letterSpacing: '0.06em', width: '100%', maxWidth: '260px' }}>
                            <Users size={22} /> DEPLOY CAPITAL
                        </button>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
