import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';
import { Trophy, CheckCircle, XCircle, AlertCircle, ArrowRight } from 'lucide-react';

export default function HistoryPage() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [historyBounties, setHistoryBounties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        if (currentUser) loadHistory();
    }, [currentUser]);

    const loadHistory = async () => {
        try {
            const { data, error } = await supabase
                .from('hunter_stakes')
                .select('*, bounty:bounties(*)')
                .eq('hunter_id', currentUser.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const now = new Date();
            const history = (data || []).map(stake => {
                if (!stake.bounty) return null;
                return {
                    ...stake.bounty,
                    stake_status: stake.status,
                    stake_id: stake.id,
                    deadline: stake.bounty.submission_deadline,
                    rewardPool: stake.bounty.reward,
                };
            }).filter(Boolean).filter(b => {
                const isCompleted = b.status === 'completed' || b.stake_status === 'completed' || b.status === 'finished';
                const isExpired = new Date(b.deadline) <= now && (b.status === 'active' || b.status === 'live' || b.status === 'in_progress');
                const isCancelled = b.status === 'cancelled' || b.status === 'canceled' || b.status === 'deleted';
                return isCompleted || isExpired || isCancelled;
            });

            setHistoryBounties(history);
        } catch (error) {
            console.error('Error loading history:', error);
        } finally {
            setLoading(false);
        }
    };

    const now = new Date();
    const getFiltered = () => {
        if (filter === 'completed') return historyBounties.filter(b => b.status === 'completed' || b.stake_status === 'completed');
        if (filter === 'expired') return historyBounties.filter(b => new Date(b.deadline) <= now && (b.status === 'active' || b.status === 'live'));
        if (filter === 'cancelled') return historyBounties.filter(b => b.status === 'cancelled' || b.status === 'canceled' || b.status === 'deleted');
        return historyBounties;
    };

    const filtered = getFiltered();
    const currency = currentUser?.currency === 'INR' ? '₹' : '$';

    const filterTabs = [
        { id: 'all', label: 'All (' + historyBounties.length + ')' },
        { id: 'completed', label: 'Completed' },
        { id: 'expired', label: 'Expired' },
        { id: 'cancelled', label: 'Cancelled' },
    ];

    return (
        <div style={{ animation: 'fadeInUp 0.4s ease', paddingBottom: '80px' }}>

            {/* Page Header */}
            <div style={{ marginBottom: '28px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#F0F4FF', fontFamily: 'Space Grotesk', marginBottom: '6px' }}>
                    Mission History
                </h1>
                <p style={{ color: '#8892AA', fontSize: '14px' }}>Your complete record of completed, expired, and cancelled hunts.</p>
            </div>

            {/* Filter Chips */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px' }}>
                {filterTabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setFilter(tab.id)}
                        style={{
                            padding: '8px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: '600',
                            whiteSpace: 'nowrap', cursor: 'pointer', transition: 'all 0.2s ease',
                            minHeight: 'auto', minWidth: 'auto',
                            background: filter === tab.id ? 'rgba(168,85,247,0.15)' : 'rgba(255,255,255,0.04)',
                            border: filter === tab.id ? '1px solid rgba(168,85,247,0.4)' : '1px solid rgba(255,255,255,0.08)',
                            color: filter === tab.id ? '#A855F7' : '#8892AA',
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[1, 2, 3].map(i => (
                        <div key={i} className="skeleton" style={{ height: '100px', borderRadius: '16px' }} />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    padding: '80px 20px', textAlign: 'center',
                    border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '20px',
                    background: 'rgba(23,30,46,0.4)',
                }}>
                    <Trophy size={48} style={{ color: '#4A5568', marginBottom: '16px' }} />
                    <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#F0F4FF', marginBottom: '8px' }}>No History Yet</h3>
                    <p style={{ color: '#8892AA', maxWidth: '320px' }}>
                        {filter !== 'all' ? 'No ' + filter + ' bounties found.' : 'Complete your first hunt to see it here!'}
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {filtered.map((bounty, i) => (
                        <BountyHistoryCard key={bounty.stake_id || i} bounty={bounty} currency={currency} navigate={navigate} />
                    ))}
                </div>
            )}
        </div>
    );
}

function BountyHistoryCard({ bounty, currency, navigate }) {
    const now = new Date();
    const deadline = new Date(bounty.deadline);
    const isCompleted = bounty.status === 'completed' || bounty.stake_status === 'completed';
    const isCancelled = bounty.status === 'cancelled' || bounty.status === 'canceled' || bounty.status === 'deleted';

    const statusConfig = isCompleted
        ? { label: 'Completed', color: '#00FF94', bg: 'rgba(0,255,148,0.1)', Icon: CheckCircle }
        : isCancelled
            ? { label: 'Cancelled', color: '#8892AA', bg: 'rgba(255,255,255,0.05)', Icon: XCircle }
            : { label: 'Expired', color: '#FFE600', bg: 'rgba(255,230,0,0.1)', Icon: AlertCircle };

    const { Icon } = statusConfig;

    return (
        <div
            onClick={() => navigate('/hunter/bounty/' + bounty.id)}
            style={{
                padding: '20px 24px', borderRadius: '16px', cursor: 'pointer',
                background: 'rgba(23,30,46,0.9)', border: '1px solid rgba(255,255,255,0.07)',
                transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
            }}
            onMouseOver={e => {
                e.currentTarget.style.borderColor = 'rgba(168,85,247,0.3)';
                e.currentTarget.style.background = 'rgba(23,30,46,1)';
            }}
            onMouseOut={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                e.currentTarget.style.background = 'rgba(23,30,46,0.9)';
            }}
        >
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700',
                        background: statusConfig.bg, color: statusConfig.color,
                        border: '1px solid ' + statusConfig.color + '40',
                    }}>
                        <Icon size={11} /> {statusConfig.label}
                    </span>
                    <span style={{ color: '#4A5568', fontSize: '12px' }}>{deadline.toLocaleDateString()}</span>
                </div>
                <h3 style={{ color: '#F0F4FF', fontWeight: '700', fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {bounty.title}
                </h3>
                <p style={{ color: '#00FF94', fontFamily: 'JetBrains Mono', fontWeight: '700', fontSize: '14px', marginTop: '4px' }}>
                    {currency}{(bounty.rewardPool || bounty.reward || 0).toLocaleString()}
                </p>
            </div>
            <ArrowRight size={18} style={{ color: '#4A5568', flexShrink: 0 }} />
        </div>
    );
}
