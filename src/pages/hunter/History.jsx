import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';
import { Home, Target, Briefcase, Clock, Trophy, User, Wallet, Settings, HelpCircle, CheckCircle, AlertCircle } from 'lucide-react';

export default function HistoryPage() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [historyBounties, setHistoryBounties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, completed, expired, cancelled

    useEffect(() => {
        if (currentUser) loadHistory();
    }, [currentUser]);

    const loadHistory = async () => {
        try {
            // Use Supabase directly as we don't have the API endpoint mentioned in instructions
            const { data, error } = await supabase
                .from('hunter_stakes')
                .select('*, bounty:bounties(*)')
                .eq('hunter_id', currentUser.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const now = new Date();
            // Process data to match prompt structure
            const history = (data || []).map(stake => {
                if (!stake.bounty) return null;
                return {
                    ...stake.bounty,
                    stake_status: stake.status,
                    stake_id: stake.id,
                    deadline: stake.bounty.submission_deadline,
                    rewardPool: stake.bounty.reward // Mapping for prompt compatibility
                };
            }).filter(b => b !== null).filter(b => {
                // Filter logic from prompt
                const isCompleted = b.status === 'completed' || b.stake_status === 'completed' || b.status === 'finished';
                const isExpired = new Date(b.deadline) <= now &&
                    (b.status === 'active' || b.status === 'live' || b.status === 'in_progress');
                const isCancelled = b.status === 'cancelled' ||
                    b.status === 'canceled' ||
                    b.status === 'deleted';
                return isCompleted || isExpired || isCancelled;
            });

            setHistoryBounties(history);
        } catch (error) {
            console.error('Error loading history:', error);
        } finally {
            setLoading(false);
        }
    };

    const getFilteredBounties = () => {
        const now = new Date();

        if (filter === 'all') return historyBounties;

        if (filter === 'completed') {
            return historyBounties.filter(b =>
                b.status === 'completed' || b.stake_status === 'completed' || b.status === 'finished'
            );
        }

        if (filter === 'expired') {
            return historyBounties.filter(b => {
                const deadline = new Date(b.deadline);
                return deadline <= now &&
                    (b.status === 'active' || b.status === 'live' || b.status === 'in_progress');
            });
        }

        if (filter === 'cancelled') {
            return historyBounties.filter(b =>
                b.status === 'cancelled' ||
                b.status === 'canceled' ||
                b.status === 'deleted'
            );
        }

        return historyBounties;
    };

    const filtered = getFilteredBounties();
    const currency = currentUser?.currency === 'INR' ? '₹' : '$';

    return (
        <div className="min-h-screen bg-iq-background pb-24 animate-fade-in">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-iq-background/95 backdrop-blur-xl border-b border-white/5">
                <div className="container h-16 flex items-center justify-between px-4">
                    <button onClick={() => navigate(-1)} className="text-iq-text-secondary hover:text-white transition-colors">
                        ← Back
                    </button>
                    <h1 className="text-xl font-bold text-white">History</h1>
                    <div className="w-8" />
                </div>
            </header>

            {/* Filter tabs */}
            <div className="container px-4 py-6">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none filter-chips">
                    {['all', 'completed', 'expired', 'cancelled'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${filter === f
                                    ? 'bg-iq-primary text-black font-bold'
                                    : 'bg-iq-card border border-white/10 text-iq-text-secondary hover:text-white'
                                }`}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Bounty list */}
            <div className="container px-4 space-y-4">
                {loading ? (
                    <div className="text-center py-12 text-iq-text-secondary flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full border-2 border-iq-primary border-t-transparent animate-spin mb-4"></div>
                        Loading...
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-12 text-iq-text-secondary border border-dashed border-white/10 rounded-xl">
                        No {filter !== 'all' ? filter : ''} bounties in history
                    </div>
                ) : (
                    filtered.map((bounty, idx) => (
                        <BountyHistoryCard key={idx} bounty={bounty} currency={currency} navigate={navigate} />
                    ))
                )}
            </div>
        </div>
    );
}

// Bounty card component for history
function BountyHistoryCard({ bounty, currency, navigate }) {
    const now = new Date();
    const deadline = new Date(bounty.deadline);
    const isExpired = deadline <= now;
    const isCompleted = bounty.status === 'completed' || bounty.stake_status === 'completed';
    const isCancelled = bounty.status === 'cancelled' ||
        bounty.status === 'canceled' ||
        bounty.status === 'deleted';

    return (
        <div className="card p-5 border border-white/5 bg-iq-card rounded-xl">
            {/* Status badge */}
            <div className="flex items-center gap-2 mb-3">
                {isCompleted && (
                    <span className="px-2 py-0.5 rounded-full bg-iq-success/10 text-iq-success border border-iq-success/20 text-xs font-bold uppercase">✓ Completed</span>
                )}
                {isExpired && !isCompleted && !isCancelled && (
                    <span className="px-2 py-0.5 rounded-full bg-iq-warning/10 text-iq-warning border border-iq-warning/20 text-xs font-bold uppercase">⏰ Expired</span>
                )}
                {isCancelled && (
                    <span className="px-2 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/10 text-xs font-bold uppercase">
                        ✕ Cancelled
                    </span>
                )}
            </div>

            {/* Title */}
            <h3 className="font-semibold text-base text-white mb-3 line-clamp-2">
                {bounty.title}
            </h3>

            {/* Details */}
            <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                <div>
                    <span className="text-iq-text-secondary text-xs">Reward</span>
                    <p className="text-iq-primary font-mono font-bold mt-0.5">{currency}{bounty.rewardPool?.toLocaleString() || bounty.reward?.toLocaleString()}</p>
                </div>
                <div>
                    <span className="text-iq-text-secondary text-xs">Deadline</span>
                    <p className="text-gray-300 mt-0.5">{deadline.toLocaleDateString()}</p>
                </div>
            </div>

            {/* View button */}
            <button
                onClick={() => navigate(`/hunter/bounty/${bounty.id}`)}
                className="w-full bg-white/5 border border-white/10 text-white py-2.5 rounded-lg hover:bg-white/10 transition-all text-sm font-medium"
            >
                View Details
            </button>
        </div>
    );
}
