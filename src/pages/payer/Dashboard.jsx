import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';
import { Target, Plus, TrendingUp, Clock, Users, CheckCircle, AlertCircle, MessageSquare, Briefcase, Star, Search, Filter, MoreHorizontal, ArrowRight, Zap, AlertTriangle } from 'lucide-react';

export default function PayerDashboard() {
    const { currentUser } = useAuth();
    const [stats, setStats] = useState({
        active: 0,
        pendingReviews: 0,
        completed: 0,
        totalSpent: 0
    });
    const [activeBounties, setActiveBounties] = useState([]);
    const [pendingSubmissions, setPendingSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (currentUser) {
            loadDashboardData();
        }
    }, [currentUser]);

    async function loadDashboardData() {
        try {
            // Fetch bounties
            const { data: bounties } = await supabase
                .from('bounties')
                .select('*, submissions(*)')
                .eq('payer_id', currentUser.id);

            if (bounties) {
                const active = bounties.filter(b => b.status === 'live');
                const completed = bounties.filter(b => b.status === 'completed');
                const pending = bounties.reduce((acc, b) => {
                    return acc + (b.submissions?.filter(s => s.status === 'pending_review').length || 0);
                }, 0);

                // Get submissions that need review
                const submissions = [];
                bounties.forEach(b => {
                    if (b.submissions) {
                        b.submissions.forEach(s => {
                            if (s.status === 'pending_review') {
                                submissions.push({ ...s, bounty_title: b.title });
                            }
                        });
                    }
                });

                setActiveBounties(active.slice(0, 4)); // Show recent 4
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
            <div className="flex h-64 items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-iq-primary border-t-transparent animate-spin ml-2"></div>
                <span className="ml-2 text-iq-text-secondary">Loading Dashboard...</span>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in pb-24 md:pb-0">
            {/* Welcome Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white">
                        Welcome back, <span className="text-iq-primary">{currentUser?.username}</span>!
                    </h1>
                    <p className="text-iq-text-secondary mt-1">
                        Your bounties are getting great responses.
                    </p>
                </div>

                {/* Quick Stats */}
                <div className="flex flex-wrap md:flex-nowrap gap-3">
                    <div className="flex items-center gap-3 px-4 py-3 bg-iq-surface border border-yellow-500/20 rounded-xl">
                        <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500">
                            <Briefcase size={20} />
                        </div>
                        <div>
                            <p className="text-xl font-bold text-white leading-none">{stats.active}</p>
                            <p className="text-xs text-iq-text-secondary mt-1">Active Bounties</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 px-4 py-3 bg-iq-surface border border-orange-500/20 rounded-xl">
                        <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500">
                            <AlertCircle size={20} />
                        </div>
                        <div>
                            <p className="text-xl font-bold text-white leading-none">{stats.pendingReviews}</p>
                            <p className="text-xs text-iq-text-secondary mt-1">Pending Reviews</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 px-4 py-3 bg-iq-surface border border-iq-success/20 rounded-xl">
                        <div className="p-2 bg-iq-success/10 rounded-lg text-iq-success">
                            <CheckCircle size={20} />
                        </div>
                        <div>
                            <p className="text-xl font-bold text-white leading-none">{stats.completed}</p>
                            <p className="text-xs text-iq-text-secondary mt-1">Completed</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Active Bounties Section */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white">Your Active Bounties</h2>
                    <Link to="/payer/live-bounties" className="text-sm text-iq-primary hover:text-white transition-colors flex items-center gap-1">
                        View All <ArrowRight size={14} />
                    </Link>
                </div>

                {activeBounties.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activeBounties.map(bounty => (
                            <ActiveBountyCard key={bounty.id} bounty={bounty} currency={currency} />
                        ))}
                    </div>
                ) : (
                    <div className="p-8 border border-dashed border-white/10 rounded-xl text-center bg-iq-card/30">
                        <Briefcase size={32} className="mx-auto text-iq-text-secondary mb-3" />
                        <p className="text-white font-medium mb-1">No active bounties</p>
                        <p className="text-sm text-iq-text-secondary mb-4">Post a bounty to start finding talent</p>
                        <Link to="/payer/post-bounty" className="inline-flex items-center gap-2 px-4 py-2 bg-iq-primary text-black font-semibold rounded-lg hover:bg-iq-primary/90 transition-colors">
                            <Plus size={18} /> Post Bounty
                        </Link>
                    </div>
                )}
            </div>

            {/* Pending Reviews Section */}
            {pendingSubmissions.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            Pending Reviews <span className="px-2 py-0.5 bg-orange-500/10 text-orange-500 text-xs rounded-full">{pendingSubmissions.length}</span>
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {pendingSubmissions.map((submission, index) => (
                            <div key={index} className="bg-iq-card border border-white/5 rounded-xl p-4 hover:border-orange-500/30 transition-colors group">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-iq-surface flex items-center justify-center text-lg">H</div>
                                    <div>
                                        <p className="font-medium text-white group-hover:text-iq-primary transition-colors">Hunter #{submission.hunter_id?.substring(0, 4)}</p>
                                        <p className="text-xs text-iq-text-secondary">Submitted 2h ago</p>
                                    </div>
                                </div>
                                <p className="text-sm text-iq-text-secondary mb-4 line-clamp-1">
                                    For: <span className="text-white">{submission.bounty_title}</span>
                                </p>
                                <div className="flex gap-2 mt-auto">
                                    <button className="flex-1 py-2 text-sm font-medium bg-iq-primary text-black rounded-lg hover:bg-iq-primary/90 transition-colors">
                                        Review Now
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}



            {/* Quick Actions */}
            <div>
                <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Link to="/payer/post-bounty" className="p-6 rounded-2xl bg-gradient-to-br from-iq-primary/10 to-transparent border border-iq-primary/20 hover:border-iq-primary hover:shadow-glow transition-all group">
                        <div className="w-12 h-12 rounded-xl bg-iq-primary/20 flex items-center justify-center text-iq-primary mb-4 group-hover:scale-110 transition-transform">
                            <Plus size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1">Post New Bounty</h3>
                        <p className="text-xs text-iq-text-secondary">Create a new task for hunters</p>
                    </Link>

                    <Link to="/payer/live-bounties" className="p-6 rounded-2xl bg-iq-card border border-white/5 hover:border-white/20 hover:bg-iq-surface transition-all group">
                        <div className="w-12 h-12 rounded-xl bg-iq-surface flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform">
                            <Search size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1">Browse Bounties</h3>
                        <p className="text-xs text-iq-text-secondary">Find talent directly</p>
                    </Link>

                    <Link to="/payer/vault" className="p-6 rounded-2xl bg-iq-card border border-white/5 hover:border-white/20 hover:bg-iq-surface transition-all group">
                        <div className="w-12 h-12 rounded-xl bg-iq-surface flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform">
                            <TrendingUp size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1">My Payments</h3>
                        <p className="text-xs text-iq-text-secondary">View transaction history</p>
                    </Link>

                    <Link to="/payer/settings" className="p-6 rounded-2xl bg-iq-card border border-white/5 hover:border-white/20 hover:bg-iq-surface transition-all group">
                        <div className="w-12 h-12 rounded-xl bg-iq-surface flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform">
                            <MoreHorizontal size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1">Settings</h3>
                        <p className="text-xs text-iq-text-secondary">Profile & preferences</p>
                    </Link>
                </div>
            </div>
        </div>
    );
}

// Active Bounty Card Component
function ActiveBountyCard({ bounty, currency }) {
    const deadline = new Date(bounty.submission_deadline);
    const now = new Date();
    const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));

    // Mock counts for now as we don't have the aggregations easily in one query without joins/functions
    // In a real app, these would come from the query
    const applicationCount = 12;

    return (
        <div className="bg-iq-card border border-white/5 rounded-xl p-5 hover:border-iq-primary/30 transition-all group relative overflow-hidden">
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-iq-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-3">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-iq-success/10 text-iq-success border border-iq-success/20">
                        {bounty.status === 'live' ? 'Open' : bounty.status}
                    </span>
                    <button className="text-iq-text-secondary hover:text-white"><MoreHorizontal size={16} /></button>
                </div>

                <h3 className="text-lg font-bold text-white mb-1 line-clamp-1">{bounty.title}</h3>
                <p className="text-sm text-iq-text-secondary mb-4">Posted {new Date(bounty.created_at).toLocaleDateString()}</p>

                <div className="flex items-center gap-4 text-sm text-iq-text-secondary mb-4">
                    <div className="flex items-center gap-1.5">
                        <Users size={14} />
                        <span>{applicationCount} active</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Clock size={14} />
                        <span>{daysLeft} days left</span>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex items-center gap-1.5 text-iq-success text-xs font-medium">
                        <Zap size={12} fill="currentColor" />
                        <span>{currency}{bounty.reward.toLocaleString()} secured</span>
                    </div>

                    <div className="flex gap-2">
                        <Link to={`/payer/bounty/${bounty.id}`} className="text-sm font-medium text-white hover:text-iq-primary transition-colors">
                            View Details
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

