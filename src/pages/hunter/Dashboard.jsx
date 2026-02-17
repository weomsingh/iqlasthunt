import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';
import BountyCard from '../../components/BountyCard';
import { Target, Trophy, TrendingUp, Clock, ArrowRight, Zap, CheckCircle, AlertTriangle, Wallet, Settings, MessageSquare } from 'lucide-react';

// Countdown Component
function Countdown({ targetDate }) {
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, [targetDate]);

    function calculateTimeLeft() {
        const difference = new Date(targetDate) - new Date();

        if (difference <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

        return {
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((difference / 1000 / 60) % 60),
            seconds: Math.floor((difference / 1000) % 60)
        };
    }

    return (
        <span className="font-mono tabular-nums">
            {timeLeft.days > 0 && `${timeLeft.days}d `}
            {String(timeLeft.hours).padStart(2, '0')}h {String(timeLeft.minutes).padStart(2, '0')}m {String(timeLeft.seconds).padStart(2, '0')}s
        </span>
    );
}

// Progress Bar Component
function ProgressBar({ percentage, color = 'yellow' }) {
    const colorClass = color === 'red' ? 'bg-iq-error shadow-[0_0_10px_var(--color-neon-pink)]' : 'bg-iq-warning shadow-[0_0_10px_var(--color-neon-yellow)]';
    return (
        <div className="w-full h-1.5 bg-gray-700/50 rounded-full overflow-hidden">
            <div
                className={`h-full ${colorClass} transition-all duration-1000 ease-out`}
                style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
            />
        </div>
    );
}

export default function HunterDashboard() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [activeStake, setActiveStake] = useState(null);
    const [recentBounties, setRecentBounties] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (currentUser) {
            loadDashboardData();
        }
    }, [currentUser]);

    async function loadDashboardData() {
        try {
            // Get active stake
            const { data: stakes } = await supabase
                .from('hunter_stakes')
                .select(`
                    *,
                    bounty:bounties(*)
                `)
                .eq('hunter_id', currentUser.id)
                .eq('status', 'active');

            // Handle array result safely
            if (stakes && stakes.length > 0) setActiveStake(stakes[0]);

            // Get recent live bounties
            const { data: bounties } = await supabase
                .from('bounties')
                .select('*')
                .eq('status', 'live')
                .order('created_at', { ascending: false })
                .limit(6);

            setRecentBounties(bounties || []);
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    }

    const currency = currentUser?.currency === 'INR' ? '₹' : '$';

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="w-10 h-10 border-4 border-iq-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    // Calculate progress for active mission
    let timeRemainingPercentage = 0;
    let isUrgent = false;

    if (activeStake?.bounty?.submission_deadline) {
        const start = new Date(activeStake.bounty.created_at).getTime();
        const end = new Date(activeStake.bounty.submission_deadline).getTime();
        const now = new Date().getTime();
        const total = end - start;
        const remaining = end - now;

        if (total > 0) {
            timeRemainingPercentage = (remaining / total) * 100;
        }

        // If less than 20% time remaining, mark urgent
        if (timeRemainingPercentage < 20) isUrgent = true;
    }

    return (
        <div className="space-y-8 animate-fade-in pb-20 md:pb-0">
            {/* Welcome Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                        Welcome back, <span className="text-iq-primary">{currentUser?.username}</span>
                    </h1>
                    <p className="text-iq-text-secondary">
                        Ready to hunt? Here's your mission report.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 rounded-xl card flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-iq-warning/10 flex items-center justify-center text-iq-warning">
                            <Trophy size={16} />
                        </div>
                        <div>
                            <p className="text-xs text-iq-text-secondary">Wins</p>
                            <p className="text-sm font-bold text-white">{currentUser?.hunts_won || 0}</p>
                        </div>
                    </div>
                    <div className="px-4 py-2 rounded-xl card flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-iq-primary/10 flex items-center justify-center text-iq-primary">
                            <Zap size={16} />
                        </div>
                        <div>
                            <p className="text-xs text-iq-text-secondary">Win Rate</p>
                            <p className="text-sm font-bold text-white">{currentUser?.success_rate?.toFixed(0) || 0}%</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-5 card relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform text-white">
                        <Wallet size={48} />
                    </div>
                    <p className="text-sm text-iq-text-secondary mb-1">Total Earnings</p>
                    <p className="text-2xl font-bold text-white">{currency}{(currentUser?.total_earnings || 0).toLocaleString()}</p>
                </div>

                <div className="p-5 card relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform text-iq-primary">
                        <Target size={48} />
                    </div>
                    <p className="text-sm text-iq-text-secondary mb-1">Active Hunts</p>
                    <p className="text-2xl font-bold text-iq-primary">{activeStake ? 1 : 0}</p>
                </div>

                <div className="p-5 card relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform text-iq-accent">
                        <CheckCircle size={48} />
                    </div>
                    <p className="text-sm text-iq-text-secondary mb-1">Completed</p>
                    <p className="text-2xl font-bold text-iq-accent">{currentUser?.hunts_completed || 0}</p>
                </div>

                <div className="p-5 card relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform text-iq-warning">
                        <Trophy size={48} />
                    </div>
                    <p className="text-sm text-iq-text-secondary mb-1">Rank</p>
                    <p className="text-2xl font-bold text-white">--</p>
                </div>
            </div>

            {/* Active Mission Card with Timer */}
            {activeStake ? (
                <div className="rounded-2xl bg-gradient-to-r from-iq-primary/20 to-iq-accent/20 p-[1px] transform transition-all hover:scale-[1.01] shadow-glow">
                    <div className="rounded-2xl card p-6 md:p-8 backdrop-blur-xl relative overflow-hidden h-full">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-iq-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                        <div className="relative z-10">
                            {/* Live Badge */}
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold badge-live mb-4">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-iq-error opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-iq-error"></span>
                                </span>
                                LIVE MISSION IN PROGRESS
                            </div>

                            <div className="flex flex-col lg:flex-row gap-8 justify-between">
                                <div className="flex-1">
                                    <h3 className="text-xl md:text-2xl font-bold text-white mb-6 leading-tight">
                                        {activeStake.bounty.title}
                                    </h3>

                                    {/* Timer Section */}
                                    <div className="bg-iq-background/50 border border-white/10 rounded-xl p-4 mb-6 max-w-xl">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-5 h-5 text-iq-warning" />
                                                <span className="text-sm text-gray-400 font-medium">Mission Deadline</span>
                                            </div>
                                            <div className="text-xl font-bold text-iq-warning">
                                                <Countdown targetDate={activeStake.bounty.submission_deadline} />
                                            </div>
                                        </div>
                                        <ProgressBar
                                            percentage={timeRemainingPercentage}
                                            color={isUrgent ? 'red' : 'yellow'}
                                        />
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div>
                                            <p className="text-sm text-gray-500 mb-1">Reward Pool</p>
                                            <p className="text-2xl font-bold text-iq-primary">{currency}{activeStake.bounty.reward.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col justify-end">
                                    <button
                                        onClick={() => navigate('/hunter/war-room')}
                                        className="btn-primary flex items-center justify-center gap-2"
                                    >
                                        Continue Mission <ArrowRight size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="rounded-2xl bg-iq-card border border-dashed border-white/10 p-8 md:p-12 text-center relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="w-16 h-16 rounded-full bg-iq-surface mx-auto flex items-center justify-center mb-4 border border-white/5">
                            <Target size={32} className="text-iq-text-secondary opacity-50" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">No Active Missions</h3>
                        <p className="text-iq-text-secondary mb-8 max-w-md mx-auto">
                            Your schedule is clear. Visit the Arena to find high-value bounties and start earning.
                        </p>
                        <Link
                            to="/hunter/arena"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-iq-surface border border-white/10 hover:bg-white/5 text-white font-medium rounded-xl transition-all"
                        >
                            Browse Arena <ArrowRight size={18} />
                        </Link>
                    </div>
                </div>
            )}

            {/* Hot Bounties Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        Hot Bounties
                    </h2>
                    <Link to="/hunter/arena" className="font-medium text-iq-primary hover:text-white transition-colors flex items-center gap-1">
                        View All <ArrowRight size={16} />
                    </Link>
                </div>

                {recentBounties.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {recentBounties.map(bounty => (
                            <div key={bounty.id} className="h-full">
                                <BountyCard bounty={bounty} userRole="hunter" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-12 text-center border border-dashed border-white/10 rounded-2xl">
                        <Target size={32} className="mx-auto text-iq-text-secondary mb-4 opacity-50" />
                        <h3 className="text-lg font-bold text-white mb-1">No Active Bounties</h3>
                        <p className="text-iq-text-secondary">Check back later for new missions.</p>
                    </div>
                )}
            </div>

            {/* Quick Actions Grid - Fixed Settings Card */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link to="/hunter/arena" className="p-6 rounded-xl card hover:border-neon-cyan/50 group">
                    <Target size={28} className="text-neon-cyan mb-4 group-hover:scale-110 transition-transform" />
                    <h3 className="font-bold text-white mb-1">Browse Arena</h3>
                    <p className="text-xs text-iq-text-secondary">Find new missions</p>
                </Link>

                <Link to="/hunter/vault" className="p-6 rounded-xl card hover:border-neon-green/50 group">
                    <TrendingUp size={28} className="text-neon-green mb-4 group-hover:scale-110 transition-transform" />
                    <h3 className="font-bold text-white mb-1">My Vault</h3>
                    <p className="text-xs text-iq-text-secondary">Check earnings</p>
                </Link>

                <Link to="/hunter/war-room" className="p-6 rounded-xl card hover:border-neon-orange/50 group">
                    <MessageSquare size={28} className="text-neon-orange mb-4 group-hover:scale-110 transition-transform" />
                    <h3 className="font-bold text-white mb-1">War Room</h3>
                    <p className="text-xs text-iq-text-secondary">Mission Comms</p>
                </Link>

                {/* Fixed: Leaderboard -> Settings */}
                <Link to="/hunter/settings" className="p-6 rounded-xl card hover:border-neon-purple/50 group">
                    <Settings size={28} className="text-neon-purple mb-4 group-hover:scale-110 transition-transform" />
                    <h3 className="font-bold text-white mb-1">Settings</h3>
                    <p className="text-xs text-iq-text-secondary">Update profile info</p>
                </Link>
            </div>
        </div>
    );
}
