import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { Target, Users, CheckCircle, ArrowRight, Shield, Zap, Lock, ChevronDown, Award } from 'lucide-react';
import Footer from '../components/Footer';
import BountyCard from '../components/BountyCard';

export default function LandingPage() {
    const { currentUser, loading, signInWithGoogle } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && currentUser) {
            if (currentUser.role === 'admin') {
                navigate('/admin/dashboard', { replace: true });
            } else if (currentUser.role === 'hunter') {
                navigate('/hunter/dashboard', { replace: true });
            } else {
                navigate('/payer/dashboard', { replace: true });
            }
        }
    }, [currentUser, loading, navigate]);

    async function handleEnterAsHunter() {
        try {
            await signInWithGoogle('hunter');
        } catch (error) {
            console.error(error);
            alert(`Login failed: ${error.message}`);
        }
    }

    async function handlePostBounty() {
        try {
            await signInWithGoogle('payer');
        } catch (error) {
            console.error(error);
            alert(`Login failed: ${error.message}`);
        }
    }

    if (loading || currentUser) {
        return null; // Or a loading spinner
    }

    // State for auto-displaying bounties
    const [hotBounties, setHotBounties] = React.useState([]);
    const [bountiesLoading, setBountiesLoading] = React.useState(true);

    useEffect(() => {
        async function loadTopBounties() {
            try {
                // In a real app we'd fetch from API
                // For now, let's look for real bounties in Supabase, else fallback to empty
                const { data, error } = await supabase
                    .from('bounties')
                    .select('*, profiles!bounties_payer_id_fkey(username)')
                    .eq('status', 'active')
                    .order('reward_amount', { ascending: false })
                    .limit(3);

                if (data && data.length > 0) {
                    setHotBounties(data);
                } else {
                    setHotBounties([]);
                }
            } catch (err) {
                console.error("Failed to load bounties", err);
            } finally {
                setBountiesLoading(false);
            }
        }
        loadTopBounties();
    }, []);

    return (
        <div className="min-h-screen bg-iq-background text-white selection:bg-iq-primary selection:text-black overflow-x-hidden">
            {/* Header / Nav */}
            <header className="absolute top-0 left-0 right-0 z-50 py-6">
                <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-iq-primary font-display font-bold text-2xl">
                        <Target size={28} />
                        <span>IQHUNT</span>
                    </div>
                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-iq-text-secondary">
                        <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
                        <a href="#bounties" className="hover:text-white transition-colors">Bounties</a>
                        <a href="#testimonials" className="hover:text-white transition-colors">Success Stories</a>
                    </nav>
                    <button onClick={handleEnterAsHunter} className="hidden md:block px-5 py-2 rounded-full border border-white/10 hover:bg-white/5 transition-colors text-sm font-medium">
                        Sign In
                    </button>
                </div>
            </header>

            {/* Hero Section */}
            <section className="hero-section relative min-h-screen flex items-center pt-20 pb-20 overflow-hidden">
                {/* Background Elements */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-iq-primary/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-iq-accent/10 rounded-full blur-[120px] pointer-events-none" />

                <div className="container mx-auto px-4 md:px-6 relative z-10">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-iq-surface border border-white/5 mb-8 animate-fade-in shadow-glow">
                            <span className="w-2 h-2 rounded-full bg-iq-primary animate-pulse" />
                            <span className="text-sm font-medium text-iq-primary tracking-wide">LIVE BOUNTY PROTOCOL</span>
                        </div>

                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold leading-[1.1] mb-8 tracking-tight">
                            WHERE SKILL <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-iq-primary to-iq-accent">
                                HUNTS MONEY.
                            </span>
                        </h1>

                        <p className="text-lg md:text-xl text-iq-text-secondary max-w-2xl mx-auto mb-12 leading-relaxed">
                            A private competitive arena for skilled individuals. Deploy capital. Stake your skill. Extract the reward.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                            <button
                                onClick={handleEnterAsHunter}
                                className="btn-primary"
                            >
                                ENTER AS HUNTER <ArrowRight size={20} />
                            </button>
                            <button
                                onClick={handlePostBounty}
                                className="btn-secondary"
                            >
                                POST A BOUNTY
                            </button>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 p-6 md:p-8 rounded-2xl bg-iq-surface/30 backdrop-blur-md border border-white/5 max-w-3xl mx-auto">
                            <div className="text-center stat-wins rounded-xl p-4">
                                <div className="text-3xl md:text-4xl font-bold text-white mb-1">98%</div>
                                <div className="text-xs md:text-sm text-iq-text-secondary uppercase tracking-wider">(Success Rate)</div>
                            </div>
                            <div className="text-center stat-rate rounded-xl p-4 border-l border-white/5 md:border-none">
                                <div className="text-3xl md:text-4xl font-bold text-white mb-1">100+</div>
                                <div className="text-xs md:text-sm text-iq-text-secondary uppercase tracking-wider">Hunters</div>
                            </div>
                            <div className="col-span-2 md:col-span-1 stat-active rounded-xl p-4 text-center border-l-0 md:border-l border-white/5 pt-4 md:pt-0 border-t md:border-t-0 border-white/5 md:border-none">
                                <div className="text-3xl md:text-4xl font-bold text-iq-primary mb-1">90+</div>
                                <div className="text-xs md:text-sm text-iq-text-secondary uppercase tracking-wider">Satisfied Payers</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-iq-text-secondary">
                    <ChevronDown size={24} />
                </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" className="py-24 bg-gradient-to-b from-iq-background to-iq-surface relative">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold mb-4">How It Works</h2>
                        <p className="text-iq-text-secondary">Simple, transparent, and built for speed.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {[
                            { icon: Target, title: '1. Post Your Bounty', desc: 'Describe your task, set the reward, and our AI helps you craft the perfect brief.' },
                            { icon: Users, title: '2. Skilled Hunters Apply', desc: 'Verified experts compete for your bounty. Review portfolios and select the best.' },
                            { icon: CheckCircle, title: '3. Get Results, Pay', desc: 'Approve the work and payment is released from escrow. Fast, safe, guaranteed.' }
                        ].map((step, idx) => (
                            <div key={idx} className="card p-8 group">
                                <div className="w-16 h-16 rounded-full bg-iq-surface border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <step.icon size={32} className="text-neon-cyan" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                                <p className="text-iq-text-secondary leading-relaxed">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>



            {/* Trust Section */}
            <section className="py-24 bg-iq-surface border-y border-white/5">
                <div className="container mx-auto px-4 md:px-6 text-center">
                    <h2 className="text-3xl md:text-5xl font-bold mb-16">Built on Trust</h2>
                    <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 rounded-2xl bg-iq-primary/10 flex items-center justify-center text-iq-primary mb-6">
                                <Shield size={32} />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Escrow Protection</h3>
                            <p className="text-iq-text-secondary">Money is held securely until work is approved.</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 rounded-2xl bg-iq-primary/10 flex items-center justify-center text-iq-primary mb-6">
                                <Zap size={32} />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Instant Payouts</h3>
                            <p className="text-iq-text-secondary">Get paid in 2-4 hours via IMPS directly.</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 rounded-2xl bg-iq-primary/10 flex items-center justify-center text-iq-primary mb-6">
                                <Lock size={32} />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Verified Hunters</h3>
                            <p className="text-iq-text-secondary">All hunters are skill-tested and ID verified.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section id="testimonials" className="py-24 bg-iq-background">
                <div className="container mx-auto px-4 md:px-6">
                    <h2 className="text-3xl md:text-5xl font-bold text-center mb-16">Visitor Stories</h2>
                    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        <div className="card p-8 relative">
                            <div className="text-iq-primary text-4xl font-serif absolute top-6 left-6">"</div>
                            <p className="text-lg text-white mb-6 pt-6 relative z-10 leading-relaxed">
                                Got my logo designed in 24 hours. The quality was lightyears ahead of generic freelance sites. IQHUNT is a game changer for startups.
                            </p>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 font-bold">A</div>
                                <div>
                                    <div className="font-bold text-white">Anant Singh</div>
                                    <div className="text-sm text-iq-text-secondary">Founder, AMCRO INDIA</div>
                                </div>
                                <div className="ml-auto flex gap-1">
                                    {[1, 2, 3, 4, 5].map(i => <Award key={i} size={16} className="text-yellow-500" />)}
                                </div>
                            </div>
                        </div>

                        <div className="card p-8 relative">
                            <div className="text-iq-primary text-4xl font-serif absolute top-6 left-6">"</div>
                            <p className="text-lg text-white mb-6 pt-6 relative z-10 leading-relaxed">
                                Excellent service by IQHunt. They delivered our product design in the exact formats we needed at a very cost-effective price. Highly satisfied with the quality and support.
                            </p>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 font-bold">N</div>
                                <div>
                                    <div className="font-bold text-white">Niteesh Kumar</div>
                                    <div className="text-sm text-iq-text-secondary">Sunsprout Foods</div>
                                </div>
                                <div className="ml-auto flex gap-1">
                                    {[1, 2, 3, 4, 5].map(i => <Award key={i} size={16} className="text-yellow-500" />)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-32 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-iq-primary/20 to-iq-accent/20 opacity-30" />
                <div className="container mx-auto px-4 md:px-6 relative z-10 text-center">
                    <h2 className="text-4xl md:text-6xl font-bold mb-6">Ready to Start?</h2>
                    <p className="text-xl text-iq-text-secondary mb-12 max-w-2xl mx-auto">
                        Join 1,200+ hunters and clients already extracting value from the network.
                    </p>
                    <button
                        onClick={handleEnterAsHunter}
                        className="px-10 py-5 bg-iq-primary text-black font-bold text-xl rounded-xl hover:scale-105 transition-transform shadow-[0_0_40px_rgba(0,255,157,0.4)]"
                    >
                        Get Started Now →
                    </button>
                </div>
            </section>

            <Footer />
        </div>
    );
}

