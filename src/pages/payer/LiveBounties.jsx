import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';
import {
    Target, Users, Clock, TrendingUp, FileText, Search, Filter,
    MoreHorizontal, ArrowRight, CheckCircle, XCircle, AlertCircle
} from 'lucide-react';

export default function MyBounties() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const [bounties, setBounties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadBounties();
    }, [currentUser]);

    async function loadBounties() {
        try {
            const { data, error } = await supabase
                .from('bounties')
                .select(`
                    *,
                    hunter_count:hunter_stakes(count),
                    submission_count:submissions(count)
                `)
                .eq('payer_id', currentUser.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setBounties(data || []);
        } catch (error) {
            console.error('Error loading bounties:', error);
        } finally {
            setLoading(false);
        }
    }

    const currency = currentUser?.currency === 'INR' ? '₹' : '$';

    // Filtering Logic
    const filteredBounties = bounties.filter(bounty => {
        // Search Filter
        const matchesSearch = bounty.title.toLowerCase().includes(searchQuery.toLowerCase());

        // Tab Filter
        if (activeTab === 'all') {
            const status = (bounty.status || '').toLowerCase();
            return matchesSearch &&
                status !== 'deleted' &&
                status !== 'cancelled' &&
                status !== 'canceled' &&
                status !== 'DELETED' &&
                status !== 'CANCELLED';
        }

        if (activeTab === 'active') {
            return matchesSearch && (
                bounty.status === 'live' ||
                bounty.status === 'active' ||
                bounty.status === 'Active' ||
                bounty.status === 'ACTIVE'
            );
        }

        if (activeTab === 'review') {
            const subCount = bounty.submission_count?.[0]?.count || 0;
            return matchesSearch && (
                (bounty.status === 'live' && subCount > 0) ||
                bounty.status === 'under_review' ||
                bounty.status === 'pending_review' ||
                bounty.status === 'in_review'
            );
        }

        if (activeTab === 'completed') {
            return matchesSearch && (
                bounty.status === 'completed' ||
                bounty.status === 'Completed' ||
                bounty.status === 'COMPLETED'
            );
        }

        if (activeTab === 'cancelled') {
            return matchesSearch && (
                bounty.status === 'deleted' ||
                bounty.status === 'cancelled' ||
                bounty.status === 'canceled' ||
                bounty.status === 'DELETED' ||
                bounty.status === 'CANCELLED'
            );
        }

        return false;
    });

    const tabs = [
        { id: 'all', label: 'All Bounties' },
        { id: 'active', label: 'Active' },
        { id: 'review', label: 'Under Review' },
        { id: 'completed', label: 'Completed' },
        { id: 'cancelled', label: 'Cancelled' }
    ];

    return (
        <div className="space-y-6 pb-20 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">My Bounties</h1>
                    <p className="text-iq-text-secondary">Manage and track all your posted missions</p>
                </div>
                <button
                    className="btn-primary flex items-center gap-2"
                    onClick={() => navigate('/payer/post-bounty')}
                >
                    <Target size={20} />
                    Post New Bounty
                </button>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-iq-card border border-white/5 p-2 rounded-xl">
                {/* Tabs */}
                <div className="flex bg-iq-surface rounded-lg p-1 overflow-x-auto max-w-full no-scrollbar w-full md:w-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id
                                ? 'bg-iq-primary text-black shadow-lg'
                                : 'text-iq-text-secondary hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-iq-text-secondary" size={16} />
                    <input
                        type="text"
                        placeholder="Search bounties..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-iq-surface border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-iq-primary/50"
                    />
                </div>
            </div>

            {/* List */}
            {loading ? (
                <div className="flex h-64 items-center justify-center">
                    <div className="w-8 h-8 rounded-full border-2 border-iq-primary border-t-transparent animate-spin"></div>
                </div>
            ) : filteredBounties.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/10 rounded-xl">
                    <div className="w-16 h-16 bg-iq-surface rounded-full flex items-center justify-center mb-4 text-iq-text-secondary">
                        <Target size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">No Bounties Found</h3>
                    <p className="text-iq-text-secondary mb-6 text-center max-w-md">
                        {searchQuery ? `No results matching "${searchQuery}"` : "You haven't posted any bounties in this category yet."}
                    </p>
                    {activeTab === 'all' && !searchQuery && (
                        <button className="btn-primary" onClick={() => navigate('/payer/post-bounty')}>
                            Create Your First Bounty
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredBounties.map(bounty => (
                        <BountyListItem key={bounty.id} bounty={bounty} currency={currency} navigate={navigate} />
                    ))}
                </div>
            )}
        </div>
    );
}

function BountyListItem({ bounty, currency, navigate }) {
    const deadline = new Date(bounty.submission_deadline);
    const isExpired = deadline < new Date();
    const daysLeft = Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24));

    // Status Logic
    let statusConfig = { color: 'text-iq-success', bg: 'bg-iq-success/10', border: 'border-iq-success/20', icon: CheckCircle };
    if (bounty.status === 'completed') statusConfig = { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: CheckCircle };
    if (bounty.status === 'cancelled') statusConfig = { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: XCircle };
    if (isExpired && bounty.status === 'live') statusConfig = { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', icon: AlertCircle };

    return (
        <div
            onClick={() => navigate(`/payer/bounty/${bounty.id}`)}
            className="group bg-iq-card border border-white/5 rounded-xl p-4 md:p-6 hover:border-iq-primary/30 transition-all cursor-pointer relative overflow-hidden"
        >
            <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

            <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                {/* Main Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border flex items-center gap-1.5 ${statusConfig.bg} ${statusConfig.color} ${statusConfig.border}`}>
                            {isExpired && bounty.status === 'live' ? 'Expired' : bounty.status}
                        </span>
                        <span className="text-xs text-iq-text-secondary">
                            Posted {new Date(bounty.created_at).toLocaleDateString()}
                        </span>
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-white mb-1 truncate group-hover:text-iq-primary transition-colors">
                        {bounty.title}
                    </h3>

                    {/* Stats Row */}
                    <div className="flex items-center gap-4 md:gap-8 mt-3 text-sm text-iq-text-secondary">
                        <div className="flex items-center gap-1.5">
                            <TrendingUp size={14} className="text-iq-primary" />
                            <span className="text-white font-medium">{currency}{bounty.reward.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Users size={14} />
                            <span>{bounty.hunter_count?.[0]?.count || 0} Hunters</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Clock size={14} />
                            <span>{isExpired ? 'Ended' : `${daysLeft}d Left`}</span>
                        </div>
                    </div>
                </div>

                {/* Action */}
                <div className="flex items-center gap-4">
                    <div className="hidden md:flex flex-col items-end gap-1">
                        <span className="text-xs text-iq-text-secondary">Submissions</span>
                        <span className="text-lg font-bold text-white">{bounty.submission_count?.[0]?.count || 0}</span>
                    </div>
                    <div className="w-px h-10 bg-white/10 hidden md:block"></div>
                    <button className="p-2 rounded-full border border-white/10 text-iq-text-secondary group-hover:bg-iq-primary group-hover:text-black group-hover:border-iq-primary transition-all">
                        <ArrowRight size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}
