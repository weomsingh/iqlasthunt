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
        { icon: Code, label: 'Development', color: '#06B6D4', bg: 'rgba(6, 182, 212,0.1)' },
        { icon: Palette, label: 'Design', color: '#8B5CF6', bg: 'rgba(168,85,247,0.1)' },
        { icon: PenTool, label: 'Writing', color: '#06B6D4', bg: 'rgba(139, 92, 246,0.1)' },
        { icon: BarChart2, label: 'Marketing', color: '#F97316', bg: 'rgba(255,107,53,0.1)' },
        { icon: Brain, label: 'Research', color: '#F59E0B', bg: 'rgba(255,230,0,0.1)' },
        { icon: Globe, label: 'Business', color: '#6366F1', bg: 'rgba(99,102,241,0.1)' },
    ];

    return (
        <div className="min-h-screen text-white overflow-x-hidden" style={{ background: '#090E17' }}>

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
                            onMouseOver={e => e.target.style.color = '#06B6D4'}
                            onMouseOut={e => e.target.style.color = '#8892AA'}>
                            How It Works
                        </a>
                        <a href="#bounties"
                            className="transition-colors"
                            onMouseOver={e => e.target.style.color = '#06B6D4'}
                            onMouseOut={e => e.target.style.color = '#8892AA'}>
                            Live Bounties
                        </a>
                        <a href="#testimonials"
                            className="transition-colors"
                            onMouseOver={e => e.target.style.color = '#8B5CF6'}
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
                {/* Background Orbs - Cosmopolitan & Vibrant */}
                <div className="absolute top-1/4 left-1/6 w-[600px] h-[600px] rounded-full pointer-events-none floating-element"
                    style={{ background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 60%)', filter: 'blur(80px)' }} />
                <div className="absolute bottom-1/4 right-1/6 w-[500px] h-[500px] rounded-full pointer-events-none floating-element"
                    style={{ background: 'radial-gradient(circle, rgba(6, 182, 212, 0.12) 0%, transparent 60%)', filter: 'blur(80px)', animationDelay: '2s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none floating-element"
                    style={{ background: 'radial-gradient(circle, rgba(236, 72, 153, 0.08) 0%, transparent 70%)', filter: 'blur(100px)', animationDelay: '4s' }} />

                {/* Grid */}
                <div className="hero-grid absolute inset-0 pointer-events-none opacity-40" />

                <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10 w-full">
                    <div className="max-w-5xl mx-auto text-center" style={{ perspective: '1000px' }}>
                        {/* Interactive Badge */}
                        <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full mb-8 animate-fade-in transition-all duration-300 hover:scale-105 cursor-pointer"
                            style={{
                                background: 'rgba(6, 182, 212, 0.08)',
                                border: '1px solid rgba(6, 182, 212, 0.3)',
                                backdropFilter: 'blur(12px)',
                                boxShadow: '0 0 20px rgba(6, 182, 212, 0.15)'
                            }}>
                            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                            <span className="text-sm font-bold tracking-widest uppercase" style={{ color: '#00E5FF', textShadow: '0 0 10px rgba(139, 92, 246,0.4)' }}>Live Bounty Protocol</span>
                        </div>

                        {/* Headline */}
                        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black mb-6 leading-[1.05] tracking-tight">
                            WHERE SKILL <br className="hidden sm:block" />
                            <span style={{
                                display: 'inline-block',
                                background: 'linear-gradient(135deg, #00E5FF 0%, #3B82F6 40%, #D946EF 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                                filter: 'drop-shadow(0px 10px 30px rgba(59, 130, 246, 0.2))'
                            }}>
                                HUNTS MONEY.
                            </span>
                        </h1>

                        {/* Subheadline */}
                        <p className="text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed font-medium"
                            style={{ color: '#9CA3AF' }}>
                            A private elite arena for professionals. Deploy capital, stake your expertise, and {' '}
                            <span style={{ color: '#F8FAFC', fontWeight: 'bold' }}>extract the ultimate reward</span>.
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-20 relative z-20">
                            <button onClick={handleEnterAsHunter} className="btn-primary pulse-glow-btn w-full sm:w-auto text-base px-8 py-4 flex items-center gap-3">
                                <Target size={22} className="opacity-90" />
                                <span>ENTER AS HUNTER</span>
                            </button>
                            <button onClick={handlePostBounty} className="btn-secondary w-full sm:w-auto text-base px-8 py-4 flex items-center gap-3 hover:bg-white/10"
                                style={{ borderRadius: '12px' }}>
                                <DollarSign size={22} className="opacity-90" />
                                <span>POST A BOUNTY</span>
                            </button>
                        </div>

                        {/* Stats Grid - Glassmorphism */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
                            {[
                                { value: '98%', label: 'Success Rate', color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.05)', border: 'rgba(6, 182, 212, 0.15)', glow: 'rgba(6, 182, 212, 0.2)' },
                                { value: '100+', label: 'Elite Hunters', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.05)', border: 'rgba(139, 92, 246, 0.15)', glow: 'rgba(139, 92, 246, 0.2)' },
                                { value: '90+', label: 'Active Payers', color: '#EC4899', bg: 'rgba(236, 72, 153, 0.05)', border: 'rgba(236, 72, 153, 0.15)', glow: 'rgba(236, 72, 153, 0.2)', colSpan: '2 md:col-span-1' },
                            ].map((stat, i) => (
                                <div key={i} className={`rounded-3xl p-6 text-center transition-all duration-300 hover:-translate-y-2 cursor-default ${stat.colSpan ? 'col-span-2 md:col-span-1' : ''}`}
                                    style={{
                                        background: stat.bg,
                                        border: `1px solid ${stat.border}`,
                                        backdropFilter: 'blur(16px)',
                                        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)'
                                    }}
                                    onMouseOver={e => e.currentTarget.style.boxShadow = `0 15px 40px ${stat.glow}`}
                                    onMouseOut={e => e.currentTarget.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.1)'}>
                                    <div className="text-4xl md:text-5xl font-black mb-2" style={{ color: stat.color, fontFamily: 'Space Grotesk', textShadow: `0 0 20px ${stat.glow}` }}>
                                        {stat.value}
                                    </div>
                                    <div className="text-xs font-bold uppercase tracking-[0.15em]" style={{ color: '#9CA3AF' }}>
                                        {stat.label}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Scroll indicator */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce z-10" style={{ color: '#9CA3AF', opacity: 0.6 }}>
                    <ChevronDown size={28} />
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
                    style={{ background: 'radial-gradient(ellipse at center, rgba(6, 182, 212, 0.04) 0%, transparent 70%)' }} />
                <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
                    <div className="text-center mb-16">
                        <span className="inline-block px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-4 transition-all"
                            style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)', color: '#A855F7', boxShadow: '0 0 15px rgba(139, 92, 246, 0.15)' }}>
                            The Protocol
                        </span>
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4 tracking-tight">How IQHUNT Works</h2>
                        <p style={{ color: '#9CA3AF' }} className="text-lg max-w-xl mx-auto font-medium">Three steps to transform skills into capital.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto relative">
                        {/* Connector line */}
                        <div className="hidden md:block absolute top-16 left-1/4 right-1/4 h-px"
                            style={{ background: 'linear-gradient(90deg, transparent, rgba(6, 182, 212, 0.4), rgba(139, 92, 246, 0.4), transparent)' }} />

                        {[
                            {
                                icon: Target, number: '01',
                                title: 'Post Your Bounty',
                                desc: 'Describe your task, set the reward pool, and deploy funds to escrow. Our smart system helps define the perfect brief.',
                                color: '#06B6D4', shadow: 'rgba(6, 182, 212, 0.2)', bg: 'rgba(6, 182, 212, 0.05)', border: 'rgba(6, 182, 212, 0.15)'
                            },
                            {
                                icon: Users, number: '02',
                                title: 'Hunters Compete',
                                desc: 'Verified expert hunters stake their own funds to participate, ensuring only serious talent applies. May the best hunter win.',
                                color: '#8B5CF6', shadow: 'rgba(139, 92, 246, 0.2)', bg: 'rgba(139, 92, 246, 0.05)', border: 'rgba(139, 92, 246, 0.15)'
                            },
                            {
                                icon: CheckCircle, number: '03',
                                title: 'Approve & Pay Out',
                                desc: 'Review submissions, approve the best work, and payment releases instantly from escrow. Fast, secure, and guaranteed.',
                                color: '#EC4899', shadow: 'rgba(236, 72, 153, 0.2)', bg: 'rgba(236, 72, 153, 0.05)', border: 'rgba(236, 72, 153, 0.15)'
                            }
                        ].map((step, idx) => (
                            <div key={idx} className="relative group perspective">
                                <div className="rounded-[2rem] p-8 h-full transition-all duration-500 hover:-translate-y-3 cursor-default"
                                    style={{
                                        background: 'rgba(15, 20, 35, 0.6)',
                                        border: `1px solid rgba(255, 255, 255, 0.05)`,
                                        backdropFilter: 'blur(16px)'
                                    }}
                                    onMouseOver={e => { e.currentTarget.style.borderColor = step.border; e.currentTarget.style.boxShadow = `0 25px 60px ${step.shadow}`; }}
                                    onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)'; e.currentTarget.style.boxShadow = 'none'; }}>

                                    {/* Step Number */}
                                    <span className="text-sm font-black tracking-[0.2em] mb-6 block"
                                        style={{ color: `${step.color}60` }}>STEP {step.number}</span>

                                    {/* Icon */}
                                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3"
                                        style={{
                                            background: `linear-gradient(135deg, ${step.color}20, transparent)`,
                                            border: `1px solid ${step.color}40`,
                                            boxShadow: `0 0 30px ${step.color}20`
                                        }}>
                                        <step.icon size={28} style={{ color: step.color }} />
                                    </div>

                                    <h3 className="text-2xl font-bold mb-4" style={{ color: '#F8FAFC', letterSpacing: '-0.01em' }}>{step.title}</h3>
                                    <p className="leading-relaxed font-medium" style={{ color: '#9CA3AF' }}>{step.desc}</p>
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
                        style={{ background: 'radial-gradient(ellipse at 80% 50%, rgba(139, 92, 246, 0.05) 0%, transparent 60%)' }} />
                    <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
                        <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-6 text-center md:text-left">
                            <div>
                                <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold mb-4 uppercase tracking-[0.1em]"
                                    style={{ background: 'rgba(249, 115, 22, 0.1)', border: '1px solid rgba(249, 115, 22, 0.3)', color: '#F97316', boxShadow: '0 0 15px rgba(249, 115, 22, 0.15)' }}>
                                    <Flame size={14} /> ACTIVE MISSIONS
                                </span>
                                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight">Live Bounties</h2>
                            </div>
                            <button onClick={handleEnterAsHunter}
                                className="flex items-center gap-2 text-sm font-bold transition-all px-6 py-3 rounded-xl hover:bg-white/5"
                                style={{ color: '#06B6D4', border: '1px solid rgba(6, 182, 212, 0.2)' }}
                                onMouseOver={e => e.currentTarget.style.background = 'rgba(6, 182, 212, 0.1)'}
                                onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                                VIEW ALL <ArrowRight size={16} />
                            </button>
                        </div>

                        {bountiesLoading ? (
                            <div className="grid md:grid-cols-3 gap-8">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="rounded-3xl p-8 space-y-4"
                                        style={{ background: 'rgba(15, 20, 35, 0.6)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                        <div className="animate-pulse bg-white/10 rounded w-3/4 h-6" />
                                        <div className="animate-pulse bg-white/10 rounded w-full h-4 mt-6" />
                                        <div className="animate-pulse bg-white/10 rounded w-2/3 h-4 mt-2" />
                                        <div className="animate-pulse bg-white/20 rounded-xl w-full h-12 mt-8" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-3 gap-8">
                                {hotBounties.map((bounty, i) => {
                                    const colors = [
                                        { accent: '#06B6D4', bg: 'rgba(6, 182, 212, 0.03)', border: 'rgba(6, 182, 212, 0.2)' },
                                        { accent: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.03)', border: 'rgba(139, 92, 246, 0.2)' },
                                        { accent: '#F97316', bg: 'rgba(249, 115, 22, 0.03)', border: 'rgba(249, 115, 22, 0.2)' },
                                    ][i % 3];
                                    return (
                                        <div key={bounty.id}
                                            className="rounded-3xl p-8 flex flex-col transition-all duration-500 hover:-translate-y-3 cursor-pointer group"
                                            style={{
                                                background: 'rgba(15, 20, 35, 0.6)',
                                                border: `1px solid rgba(255, 255, 255, 0.05)`,
                                                backdropFilter: 'blur(16px)'
                                            }}
                                            onMouseOver={e => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.boxShadow = `0 25px 60px ${colors.accent}20`; }}
                                            onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)'; e.currentTarget.style.boxShadow = 'none'; }}
                                            onClick={handleEnterAsHunter}>
                                            <div className="flex items-start justify-between mb-6">
                                                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider"
                                                    style={{ background: `${colors.accent}15`, color: colors.accent, border: `1px solid ${colors.accent}30` }}>
                                                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: colors.accent }}></span> LIVE
                                                </span>
                                                <span className="text-3xl font-black font-mono tracking-tight" style={{ color: colors.accent }}>
                                                    ₹{(bounty.reward || bounty.reward_amount || 0).toLocaleString()}
                                                </span>
                                            </div>
                                            <h3 className="text-2xl font-bold mb-3 leading-snug" style={{ color: '#F8FAFC' }}>{bounty.title}</h3>
                                            <p className="text-sm mb-8 line-clamp-2 leading-relaxed font-medium flex-grow" style={{ color: '#9CA3AF' }}>
                                                {bounty.description}
                                            </p>
                                            <button className="w-full py-4 rounded-xl font-bold text-sm transition-all duration-300 mt-auto"
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

            {/* ===== TRUST SECTION ====== */}
            <section className="py-24 relative border-y" style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}>
                <div className="absolute inset-0 pointer-events-none"
                    style={{ background: 'linear-gradient(180deg, rgba(10, 15, 25, 0.4), rgba(5, 8, 20, 0.8))' }} />
                <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4 tracking-tight">Built on Trust</h2>
                        <p style={{ color: '#9CA3AF' }} className="text-lg md:text-xl max-w-2xl mx-auto font-medium">Every transaction protected. Every payment guaranteed.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                        {[
                            {
                                icon: Shield, title: 'Escrow Protection',
                                desc: 'Funds are securely held until work is approved. Zero risk of fraud.',
                                color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.05)', border: 'rgba(6, 182, 212, 0.15)', shadow: 'rgba(6, 182, 212, 0.2)'
                            },
                            {
                                icon: Zap, title: 'Instant Payouts',
                                desc: 'Winners get paid instantly via UPI or transfer upon review. No delays.',
                                color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.05)', border: 'rgba(245, 158, 11, 0.15)', shadow: 'rgba(245, 158, 11, 0.2)'
                            },
                            {
                                icon: Lock, title: 'Elite Talent',
                                desc: 'All hunters are skill-tested. No fakes, no time-wasters, just execution.',
                                color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.05)', border: 'rgba(139, 92, 246, 0.15)', shadow: 'rgba(139, 92, 246, 0.2)'
                            }
                        ].map((item, i) => (
                            <div key={i} className="flex flex-col items-center text-center p-8 rounded-[2rem] transition-all duration-300 hover:-translate-y-2 cursor-pointer group"
                                style={{
                                    background: 'rgba(15, 20, 35, 0.6)',
                                    border: `1px solid rgba(255, 255, 255, 0.05)`,
                                    backdropFilter: 'blur(16px)'
                                }}
                                onMouseOver={e => { e.currentTarget.style.borderColor = item.border; e.currentTarget.style.boxShadow = `0 15px 40px ${item.shadow}`; }}
                                onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)'; e.currentTarget.style.boxShadow = 'none'; }}>
                                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12"
                                    style={{
                                        background: `linear-gradient(135deg, ${item.color}20, transparent)`,
                                        border: `1px solid ${item.color}40`,
                                        boxShadow: `0 0 20px ${item.color}20`
                                    }}>
                                    <item.icon size={28} style={{ color: item.color }} />
                                </div>
                                <h3 className="text-xl font-bold mb-3" style={{ color: '#F8FAFC' }}>{item.title}</h3>
                                <p style={{ color: '#9CA3AF' }} className="leading-relaxed font-medium">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== TESTIMONIALS ===== */}
            <section id="testimonials" className="py-24 md:py-32 relative">
                <div className="absolute inset-0 pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse at 20% 60%, rgba(139, 92, 246, 0.08) 0%, transparent 60%)' }} />
                <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
                    <div className="text-center mb-16">
                        <span className="inline-block px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-4 transition-all"
                            style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', color: '#F59E0B', boxShadow: '0 0 15px rgba(245, 158, 11, 0.15)' }}>
                            Success Stories
                        </span>
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4 tracking-tight">Real Results</h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        {[
                            {
                                quote: "Got my architecture designed in 24 hours. The quality is lightyears ahead of generic freelance sites. IQHUNT is an absolute game changer.",
                                name: "Anant Singh", company: "Founder, AMCRO INDIA",
                                initials: "AS", color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.1)', shadow: 'rgba(6, 182, 212, 0.15)'
                            },
                            {
                                quote: "Extreme velocity without compromising quality. They delivered exact formats at highly effective pricing. This protocol sets a new standard.",
                                name: "Niteesh Kumar", company: "Sunsprout Foods",
                                initials: "NK", color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)', shadow: 'rgba(139, 92, 246, 0.15)'
                            }
                        ].map((t, i) => (
                            <div key={i} className="relative p-10 rounded-[2rem] transition-all duration-300 hover:-translate-y-2 cursor-pointer group"
                                style={{
                                    background: 'rgba(15, 20, 35, 0.6)',
                                    border: '1px solid rgba(255, 255, 255, 0.05)',
                                    backdropFilter: 'blur(20px)'
                                }}
                                onMouseOver={e => { e.currentTarget.style.borderColor = `${t.color}50`; e.currentTarget.style.boxShadow = `0 20px 50px ${t.shadow}`; }}
                                onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)'; e.currentTarget.style.boxShadow = 'none'; }}>

                                {/* Geometric Quote mark background */}
                                <div className="absolute top-6 right-6 opacity-5 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-12" style={{ color: t.color }}>
                                    <svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" /></svg>
                                </div>

                                <p className="text-lg md:text-xl mb-8 leading-relaxed font-medium relative z-10" style={{ color: '#F8FAFC' }}>"{t.quote}"</p>

                                <div className="flex items-center gap-4 relative z-10 mt-auto pt-6 border-t border-white/5">
                                    <div className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg"
                                        style={{ background: t.bg, color: t.color, border: `1px solid ${t.color}40`, boxShadow: `0 0 15px ${t.shadow}` }}>
                                        {t.initials}
                                    </div>
                                    <div>
                                        <div className="font-bold text-lg" style={{ color: '#F8FAFC' }}>{t.name}</div>
                                        <div className="text-sm font-medium" style={{ color: '#9CA3AF' }}>{t.company}</div>
                                    </div>
                                    <div className="ml-auto flex gap-1 bg-yellow-500/10 p-2 rounded-full border border-yellow-500/20">
                                        {[1, 2, 3, 4, 5].map(s => (
                                            <Star key={s} size={14} fill="#F59E0B" className="text-yellow-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== FINAL CTA ===== */}
            <section className="py-32 relative overflow-hidden border-t border-white/5">
                {/* Stunning vibrant background elements */}
                <div className="absolute inset-0 pointer-events-none"
                    style={{
                        background: 'radial-gradient(ellipse 90% 80% at 50% 50%, rgba(6, 182, 212, 0.15) 0%, rgba(139, 92, 246, 0.08) 30%, rgba(236, 72, 153, 0.05) 60%, transparent 100%)'
                    }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[3px] opacity-20 pointer-events-none"
                    style={{ background: 'linear-gradient(90deg, transparent, #06B6D4, #8B5CF6, transparent)' }} />
                <div className="hero-grid absolute inset-0 pointer-events-none opacity-20" />

                <div className="max-w-4xl mx-auto px-4 md:px-6 relative z-10 text-center">
                    <span className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold mb-8 transition-all hover:scale-105 cursor-default"
                        style={{ background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.3)', color: '#06B6D4', boxShadow: '0 0 20px rgba(6, 182, 212, 0.2)' }}>
                        <TrendingUp size={18} className="animate-pulse" />
                        Ready to extract value?
                    </span>

                    <h2 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 tracking-tight">
                        Enter the{' '}
                        <span style={{
                            display: 'inline-block',
                            background: 'linear-gradient(135deg, #00E5FF 0%, #3B82F6 50%, #D946EF 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            filter: 'drop-shadow(0px 10px 30px rgba(59, 130, 246, 0.2))'
                        }}>
                            Arena.
                        </span>
                    </h2>

                    <p className="text-xl mb-14 max-w-xl mx-auto font-medium leading-relaxed" style={{ color: '#9CA3AF' }}>
                        Join thousands of top-tier professionals and clients already utilizing the ultimate execution network.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
                        <button onClick={handleEnterAsHunter} className="btn-primary pulse-glow-btn w-full sm:w-auto text-lg px-12 py-5 flex items-center justify-center gap-3">
                            <Target size={24} className="opacity-90" />
                            <span>EXECUTE BOUNTIES</span>
                        </button>
                        <button onClick={handlePostBounty} className="btn-secondary w-full sm:w-auto text-lg px-12 py-5 flex items-center justify-center gap-3 hover:bg-white/10"
                            style={{ borderRadius: '12px' }}>
                            <Users size={24} className="opacity-90" />
                            <span>DEPLOY CAPITAL</span>
                        </button>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
