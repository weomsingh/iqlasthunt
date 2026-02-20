import React, { useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import {
    Target, Users, CheckCircle, ArrowRight, Shield, Zap, Lock,
    ChevronDown, Award, Star, TrendingUp, DollarSign, Flame,
    Code, Palette, PenTool, BarChart2, Globe, Brain
} from 'lucide-react';
import Footer from '../components/Footer';

export default function LandingPage() {
    const { currentUser, loading, signInWithGoogle } = useAuth();
    const navigate = useNavigate();
    const [hotBounties, setHotBounties] = React.useState([]);
    const [bountiesLoading, setBountiesLoading] = React.useState(true);
    const [roleMismatch, setRoleMismatch] = React.useState(null);
    const heroRef = useRef(null);

    useEffect(() => {
        loadTopBounties();
    }, []);

    async function loadTopBounties() {
        try {
            const { data } = await supabase
                .from('bounties')
                .select('*, profiles!bounties_payer_id_fkey(username)')
                .eq('status', 'live')
                .order('reward', { ascending: false })
                .limit(3);
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
        { icon: Code, label: 'Development', color: '#00FF94', bg: 'rgba(0,255,148,0.1)' },
        { icon: Palette, label: 'Design', color: '#A855F7', bg: 'rgba(168,85,247,0.1)' },
        { icon: PenTool, label: 'Writing', color: '#00E5FF', bg: 'rgba(0,229,255,0.1)' },
        { icon: BarChart2, label: 'Marketing', color: '#FF6B35', bg: 'rgba(255,107,53,0.1)' },
        { icon: Brain, label: 'Research', color: '#FFE600', bg: 'rgba(255,230,0,0.1)' },
        { icon: Globe, label: 'Business', color: '#6366F1', bg: 'rgba(99,102,241,0.1)' },
    ];

    return (
        <div className="min-h-screen text-white overflow-x-hidden" style={{ background: '#080B14' }}>

            {/* ===== ROLE MISMATCH MODAL ===== */}
            {roleMismatch && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                    style={{ background: 'rgba(8,11,20,0.95)', backdropFilter: 'blur(20px)' }}>
                    <div className="w-full max-w-md animate-scale-in" style={{
                        background: 'linear-gradient(135deg, rgba(23,30,46,0.95), rgba(13,18,32,0.95))',
                        border: '1px solid rgba(244,63,94,0.3)',
                        borderRadius: '24px',
                        padding: '40px',
                        boxShadow: '0 0 60px rgba(244,63,94,0.15)'
                    }}>
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-500"
                            style={{ background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.25)' }}>
                            <Shield size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2 text-center">Access Restricted</h2>
                        <p className="text-center mb-8" style={{ color: '#8892AA' }}>
                            You're logged in as a <span className="text-white font-bold uppercase">{roleMismatch.actual}</span>.
                            <br />You cannot access the <span className="text-red-400 font-bold">{roleMismatch.intended}</span> area.
                        </p>
                        <div className="space-y-3">
                            <button
                                onClick={() => {
                                    if (roleMismatch.actual === 'hunter') navigate('/hunter/dashboard');
                                    else if (roleMismatch.actual === 'payer') navigate('/payer/dashboard');
                                    else navigate('/admin/dashboard');
                                    setRoleMismatch(null);
                                }}
                                className="btn-primary w-full"
                            >
                                Go to My Dashboard <ArrowRight size={18} />
                            </button>
                            <button
                                onClick={() => setRoleMismatch(null)}
                                className="w-full py-3 text-sm font-medium transition-colors"
                                style={{ color: '#8892AA' }}
                                onMouseOver={e => e.target.style.color = '#F0F4FF'}
                                onMouseOut={e => e.target.style.color = '#8892AA'}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== FLOATING NAV ===== */}
            <header className="fixed top-0 left-0 right-0 z-50 py-4 px-4 md:px-6">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <img src="/finallandstrans.png" alt="IQHUNT" className="h-12 md:h-16 w-auto object-contain" />
                    </div>

                    {/* Nav Links */}
                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium"
                        style={{ color: '#8892AA' }}>
                        <a href="#how-it-works"
                            className="hover:text-white transition-colors hover:text-neon-green"
                            onMouseOver={e => e.target.style.color = '#00FF94'}
                            onMouseOut={e => e.target.style.color = '#8892AA'}>
                            How It Works
                        </a>
                        <a href="#bounties"
                            className="transition-colors"
                            onMouseOver={e => e.target.style.color = '#00E5FF'}
                            onMouseOut={e => e.target.style.color = '#8892AA'}>
                            Live Bounties
                        </a>
                        <a href="#testimonials"
                            className="transition-colors"
                            onMouseOver={e => e.target.style.color = '#A855F7'}
                            onMouseOut={e => e.target.style.color = '#8892AA'}>
                            Success Stories
                        </a>
                    </nav>

                    {/* CTA Buttons */}
                    <div className="flex items-center gap-3">
                        {currentUser ? (
                            <button
                                onClick={() => navigate(`/${currentUser.role}/dashboard`)}
                                className="btn-primary px-5 py-2.5 text-sm"
                                style={{ borderRadius: '12px', padding: '10px 20px', minHeight: '40px' }}>
                                My Dashboard
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={handleEnterAsHunter}
                                    className="hidden md:block px-5 py-2.5 text-sm font-semibold rounded-xl border transition-all"
                                    style={{
                                        color: '#F0F4FF',
                                        border: '1px solid rgba(255,255,255,0.15)',
                                        background: 'rgba(255,255,255,0.05)',
                                        minHeight: '40px',
                                        borderRadius: '12px'
                                    }}>
                                    Sign In
                                </button>
                                <button
                                    onClick={handleEnterAsHunter}
                                    className="btn-primary text-sm"
                                    style={{ padding: '10px 20px', minHeight: '40px', borderRadius: '12px' }}>
                                    Get Started
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* ===== HERO SECTION ===== */}
            <section ref={heroRef} className="hero-section relative min-h-screen flex items-center pt-24 pb-20 overflow-hidden">
                {/* Background Orbs */}
                <div className="absolute top-1/4 left-1/6 w-[500px] h-[500px] rounded-full pointer-events-none"
                    style={{ background: 'radial-gradient(circle, rgba(0,255,148,0.12) 0%, transparent 70%)', filter: 'blur(60px)' }} />
                <div className="absolute bottom-1/4 right-1/6 w-[400px] h-[400px] rounded-full pointer-events-none"
                    style={{ background: 'radial-gradient(circle, rgba(0,229,255,0.10) 0%, transparent 70%)', filter: 'blur(60px)' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
                    style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 70%)', filter: 'blur(80px)' }} />

                {/* Grid */}
                <div className="hero-grid absolute inset-0 pointer-events-none opacity-50" />

                <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10 w-full">
                    <div className="max-w-5xl mx-auto text-center">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full mb-8 animate-fade-in"
                            style={{
                                background: 'rgba(0,255,148,0.08)',
                                border: '1px solid rgba(0,255,148,0.2)',
                                backdropFilter: 'blur(10px)'
                            }}>
                            <span className="status-live"></span>
                            <span className="text-sm font-bold tracking-widest text-neon-green uppercase">Live Bounty Protocol Active</span>
                        </div>

                        {/* Headline */}
                        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-8 leading-[1.05] tracking-tight">
                            WHERE SKILL {' '}
                            <br className="hidden sm:block" />
                            <span style={{
                                background: 'linear-gradient(135deg, #00FF94 0%, #00E5FF 50%, #A855F7 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text'
                            }}>
                                HUNTS MONEY.
                            </span>
                        </h1>

                        {/* Subheadline */}
                        <p className="text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed"
                            style={{ color: '#8892AA' }}>
                            A private competitive arena for skilled professionals. Deploy capital,
                            stake your expertise, and{' '}
                            <span style={{ color: '#00FF94' }}>extract the reward</span>.
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                            <button onClick={handleEnterAsHunter} className="btn-primary w-full sm:w-auto text-base px-8 py-4">
                                <Target size={20} />
                                ENTER AS HUNTER
                            </button>
                            <button onClick={handlePostBounty} className="btn-secondary w-full sm:w-auto text-base px-8 py-4">
                                <DollarSign size={20} />
                                POST A BOUNTY
                            </button>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
                            {[
                                { value: '98%', label: 'Success Rate', color: '#00FF94', bg: 'rgba(0,255,148,0.08)', border: 'rgba(0,255,148,0.15)' },
                                { value: '100+', label: 'Elite Hunters', color: '#00E5FF', bg: 'rgba(0,229,255,0.08)', border: 'rgba(0,229,255,0.15)' },
                                { value: '90+', label: 'Happy Payers', color: '#A855F7', bg: 'rgba(168,85,247,0.08)', border: 'rgba(168,85,247,0.15)', colSpan: '2 md:col-span-1' },
                            ].map((stat, i) => (
                                <div key={i} className={`rounded-2xl p-5 text-center ${stat.colSpan ? 'col-span-2 md:col-span-1' : ''}`}
                                    style={{ background: stat.bg, border: `1px solid ${stat.border}`, backdropFilter: 'blur(10px)' }}>
                                    <div className="text-3xl md:text-4xl font-bold mb-1" style={{ color: stat.color, fontFamily: 'Space Grotesk' }}>
                                        {stat.value}
                                    </div>
                                    <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8892AA' }}>
                                        {stat.label}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Scroll indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce" style={{ color: '#8892AA' }}>
                    <ChevronDown size={24} />
                </div>
            </section>

            {/* ===== CATEGORIES STRIP ===== */}
            <section className="py-12 border-y" style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(13,18,32,0.6)' }}>
                <div className="max-w-7xl mx-auto px-4 md:px-6">
                    <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
                        {categories.map((cat, i) => (
                            <div key={i}
                                className="flex items-center gap-2.5 px-4 py-2.5 rounded-full cursor-pointer transition-all hover-lift"
                                style={{
                                    background: cat.bg,
                                    border: `1px solid ${cat.color}30`,
                                    minHeight: '44px'
                                }}
                                onMouseOver={e => e.currentTarget.style.boxShadow = `0 0 20px ${cat.color}25`}
                                onMouseOut={e => e.currentTarget.style.boxShadow = 'none'}>
                                <cat.icon size={16} style={{ color: cat.color }} />
                                <span className="text-sm font-semibold" style={{ color: cat.color }}>{cat.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== HOW IT WORKS ===== */}
            <section id="how-it-works" className="py-24 md:py-32 relative">
                <div className="absolute inset-0 pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse at center, rgba(0,229,255,0.04) 0%, transparent 70%)' }} />
                <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
                    <div className="text-center mb-16">
                        <span className="inline-block px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-4"
                            style={{ background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.2)', color: '#00E5FF' }}>
                            The Protocol
                        </span>
                        <h2 className="text-4xl md:text-5xl font-bold mb-4">How IQHUNT Works</h2>
                        <p style={{ color: '#8892AA' }} className="text-lg max-w-xl mx-auto">Three steps to transform skills into cash.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto relative">
                        {/* Connector line */}
                        <div className="hidden md:block absolute top-16 left-1/4 right-1/4 h-px"
                            style={{ background: 'linear-gradient(90deg, transparent, rgba(0,255,148,0.3), rgba(0,229,255,0.3), transparent)' }} />

                        {[
                            {
                                icon: Target, number: '01',
                                title: 'Post Your Bounty',
                                desc: 'Describe your task, set the reward pool, and deploy funds to escrow. Our smart system helps define the perfect brief.',
                                color: '#00FF94', shadow: 'rgba(0,255,148,0.2)', bg: 'rgba(0,255,148,0.08)', border: 'rgba(0,255,148,0.2)'
                            },
                            {
                                icon: Users, number: '02',
                                title: 'Hunters Compete',
                                desc: 'Verified expert hunters stake their own funds to participate, ensuring only serious talent applies. May the best hunter win.',
                                color: '#00E5FF', shadow: 'rgba(0,229,255,0.2)', bg: 'rgba(0,229,255,0.08)', border: 'rgba(0,229,255,0.2)'
                            },
                            {
                                icon: CheckCircle, number: '03',
                                title: 'Approve & Pay Out',
                                desc: 'Review submissions, approve the best work, and payment releases instantly from escrow. Fast, secure, and guaranteed.',
                                color: '#A855F7', shadow: 'rgba(168,85,247,0.2)', bg: 'rgba(168,85,247,0.08)', border: 'rgba(168,85,247,0.2)'
                            }
                        ].map((step, idx) => (
                            <div key={idx} className="relative group">
                                <div className="rounded-3xl p-8 h-full transition-all duration-300"
                                    style={{
                                        background: step.bg,
                                        border: `1px solid ${step.border}`,
                                        backdropFilter: 'blur(10px)'
                                    }}
                                    onMouseOver={e => e.currentTarget.style.boxShadow = `0 20px 60px ${step.shadow}`}
                                    onMouseOut={e => e.currentTarget.style.boxShadow = 'none'}>

                                    {/* Step Number */}
                                    <span className="text-sm font-black tracking-[0.2em] mb-6 block"
                                        style={{ color: `${step.color}60` }}>STEP {step.number}</span>

                                    {/* Icon */}
                                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"
                                        style={{
                                            background: `${step.color}15`,
                                            border: `1px solid ${step.color}30`,
                                            boxShadow: `0 0 30px ${step.color}15`
                                        }}>
                                        <step.icon size={28} style={{ color: step.color }} />
                                    </div>

                                    <h3 className="text-xl font-bold mb-3" style={{ color: '#F0F4FF' }}>{step.title}</h3>
                                    <p className="leading-relaxed" style={{ color: '#8892AA' }}>{step.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== LIVE BOUNTIES PREVIEW ===== */}
            {(hotBounties.length > 0 || bountiesLoading) && (
                <section id="bounties" className="py-24 relative">
                    <div className="absolute inset-0 pointer-events-none"
                        style={{ background: 'radial-gradient(ellipse at 80% 50%, rgba(168,85,247,0.05) 0%, transparent 60%)' }} />
                    <div className="max-w-7xl mx-auto px-4 md:px-6">
                        <div className="flex items-end justify-between mb-12">
                            <div>
                                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold mb-4"
                                    style={{ background: 'rgba(255,45,120,0.1)', border: '1px solid rgba(255,45,120,0.25)', color: '#FF2D78' }}>
                                    <Flame size={12} />
                                    HOT RIGHT NOW
                                </span>
                                <h2 className="text-4xl md:text-5xl font-bold">Live Bounties</h2>
                            </div>
                            <button onClick={handleEnterAsHunter}
                                className="hidden md:flex items-center gap-2 text-sm font-semibold transition-colors"
                                style={{ color: '#00FF94' }}
                                onMouseOver={e => e.currentTarget.style.color = '#00E5FF'}
                                onMouseOut={e => e.currentTarget.style.color = '#00FF94'}>
                                View All <ArrowRight size={16} />
                            </button>
                        </div>

                        {bountiesLoading ? (
                            <div className="grid md:grid-cols-3 gap-6">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="rounded-2xl p-6 space-y-4"
                                        style={{ background: 'rgba(23,30,46,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                        <div className="skeleton-line w-3/4 h-4" />
                                        <div className="skeleton-line w-full h-3" />
                                        <div className="skeleton-line w-2/3 h-3" />
                                        <div className="skeleton-line w-1/2 h-8 mt-4" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-3 gap-6">
                                {hotBounties.map((bounty, i) => {
                                    const colors = [
                                        { accent: '#00FF94', bg: 'rgba(0,255,148,0.08)', border: 'rgba(0,255,148,0.2)' },
                                        { accent: '#A855F7', bg: 'rgba(168,85,247,0.08)', border: 'rgba(168,85,247,0.2)' },
                                        { accent: '#FF6B35', bg: 'rgba(255,107,53,0.08)', border: 'rgba(255,107,53,0.2)' },
                                    ][i % 3];
                                    return (
                                        <div key={bounty.id}
                                            className="rounded-2xl p-6 transition-all duration-300 cursor-pointer hover-lift"
                                            style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
                                            onClick={handleEnterAsHunter}>
                                            <div className="flex items-start justify-between mb-4">
                                                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold"
                                                    style={{ background: `${colors.accent}15`, color: colors.accent, border: `1px solid ${colors.accent}30` }}>
                                                    LIVE
                                                </span>
                                                <span className="text-2xl font-black font-mono" style={{ color: colors.accent }}>
                                                    ₹{(bounty.reward || bounty.reward_amount || 0).toLocaleString()}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-bold mb-2" style={{ color: '#F0F4FF' }}>{bounty.title}</h3>
                                            <p className="text-sm mb-6 line-clamp-2" style={{ color: '#8892AA' }}>
                                                {bounty.description}
                                            </p>
                                            <button className="w-full py-3 rounded-xl font-bold text-sm transition-all"
                                                style={{ background: `${colors.accent}15`, color: colors.accent, border: `1px solid ${colors.accent}30` }}>
                                                View & Apply →
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
            <section className="py-24 relative border-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                <div className="absolute inset-0 pointer-events-none"
                    style={{ background: 'linear-gradient(180deg, rgba(13,18,32,0.4), rgba(13,18,32,0.8))' }} />
                <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold mb-4">Built on Trust</h2>
                        <p style={{ color: '#8892AA' }} className="text-lg">Every transaction protected. Every payment guaranteed.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {[
                            {
                                icon: Shield, title: 'Escrow Protection',
                                desc: 'Funds are held securely in escrow until work is approved. Zero risk of payment fraud.',
                                color: '#00FF94', bg: 'rgba(0,255,148,0.08)', border: 'rgba(0,255,148,0.15)'
                            },
                            {
                                icon: Zap, title: 'Fast Payouts',
                                desc: 'Winners get paid within 2-4 business hours via UPI or bank transfer. No delays.',
                                color: '#FFE600', bg: 'rgba(255,230,0,0.08)', border: 'rgba(255,230,0,0.15)'
                            },
                            {
                                icon: Lock, title: 'Verified Hunters',
                                desc: 'All hunters are skill-tested upon onboarding. No fakes, no time-wasters.',
                                color: '#A855F7', bg: 'rgba(168,85,247,0.08)', border: 'rgba(168,85,247,0.15)'
                            }
                        ].map((item, i) => (
                            <div key={i} className="flex flex-col items-center text-center p-8 rounded-3xl transition-all hover-lift"
                                style={{ background: item.bg, border: `1px solid ${item.border}` }}>
                                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
                                    style={{ background: `${item.color}15`, border: `1px solid ${item.color}25` }}>
                                    <item.icon size={28} style={{ color: item.color }} />
                                </div>
                                <h3 className="text-xl font-bold mb-3" style={{ color: '#F0F4FF' }}>{item.title}</h3>
                                <p style={{ color: '#8892AA' }} className="leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== TESTIMONIALS ===== */}
            <section id="testimonials" className="py-24 relative">
                <div className="absolute inset-0 pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse at 20% 60%, rgba(99,102,241,0.05) 0%, transparent 60%)' }} />
                <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
                    <div className="text-center mb-16">
                        <span className="inline-block px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-4"
                            style={{ background: 'rgba(255,230,0,0.1)', border: '1px solid rgba(255,230,0,0.2)', color: '#FFE600' }}>
                            Success Stories
                        </span>
                        <h2 className="text-4xl md:text-5xl font-bold">Real Results</h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {[
                            {
                                quote: "Got my logo designed in 24 hours. The quality was lightyears ahead of generic freelance sites. IQHUNT is a game changer for startups.",
                                name: "Anant Singh", company: "Founder, AMCRO INDIA",
                                initials: "AS", color: '#00FF94', bg: 'rgba(0,255,148,0.1)'
                            },
                            {
                                quote: "Excellent service by IQHunt. They delivered our product design in exact formats we needed at a very cost-effective price. Highly satisfied.",
                                name: "Niteesh Kumar", company: "Sunsprout Foods",
                                initials: "NK", color: '#A855F7', bg: 'rgba(168,85,247,0.1)'
                            }
                        ].map((t, i) => (
                            <div key={i} className="relative p-8 rounded-3xl transition-all hover-lift"
                                style={{
                                    background: 'rgba(23,30,46,0.8)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    backdropFilter: 'blur(20px)'
                                }}>
                                {/* Quote mark */}
                                <div className="text-6xl font-serif leading-none mb-4 -mt-2"
                                    style={{ color: t.color, opacity: 0.4 }}>"</div>

                                <p className="text-lg mb-6 leading-relaxed" style={{ color: '#D0D8F0' }}>{t.quote}</p>

                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm"
                                        style={{ background: t.bg, color: t.color, border: `1px solid ${t.color}30` }}>
                                        {t.initials}
                                    </div>
                                    <div>
                                        <div className="font-bold" style={{ color: '#F0F4FF' }}>{t.name}</div>
                                        <div className="text-sm" style={{ color: '#8892AA' }}>{t.company}</div>
                                    </div>
                                    <div className="ml-auto flex gap-1">
                                        {[1, 2, 3, 4, 5].map(s => (
                                            <Star key={s} size={14} fill="#FFE600" style={{ color: '#FFE600' }} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== FINAL CTA ===== */}
            <section className="py-32 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none"
                    style={{
                        background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(0,255,148,0.12) 0%, rgba(0,229,255,0.08) 30%, rgba(168,85,247,0.06) 60%, transparent 80%)'
                    }} />
                <div className="hero-grid absolute inset-0 pointer-events-none opacity-30" />
                <div className="max-w-4xl mx-auto px-4 md:px-6 relative z-10 text-center">
                    <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold mb-8"
                        style={{ background: 'rgba(0,255,148,0.1)', border: '1px solid rgba(0,255,148,0.25)', color: '#00FF94' }}>
                        <TrendingUp size={16} />
                        Ready to Compete?
                    </span>

                    <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6">
                        Join the{' '}
                        <span style={{
                            background: 'linear-gradient(135deg, #00FF94 0%, #00E5FF 50%, #A855F7 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                        }}>
                            Arena.
                        </span>
                    </h2>

                    <p className="text-xl mb-12 max-w-xl mx-auto" style={{ color: '#8892AA' }}>
                        Join 100+ hunters and clients already extracting value from the network.
                        Your next win is waiting.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button onClick={handleEnterAsHunter} className="btn-primary w-full sm:w-auto text-lg px-10 py-5">
                            <Target size={22} />
                            Hunt Your First Bounty
                        </button>
                        <button onClick={handlePostBounty} className="btn-secondary w-full sm:w-auto text-lg px-10 py-5">
                            <Users size={22} />
                            Hire Talent Now
                        </button>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
