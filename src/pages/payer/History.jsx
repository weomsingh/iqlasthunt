import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';
import { History as HistoryIcon, CheckCircle, Trophy, TrendingUp, Calendar, ArrowRight } from 'lucide-react';

export default function PayerHistory() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [completedBounties, setCompletedBounties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalCompleted: 0,
        totalSpent: 0,
        winnersSelected: 0
    });

    useEffect(() => {
        loadHistory();
    }, [currentUser]);

    async function loadHistory() {
        try {
            // Get completed bounties
            const { data: bountiesData, error } = await supabase
                .from('bounties')
                .select(`
                    *,
                    winner:profiles!bounties_winner_id_fkey(username),
                    hunter_count:hunter_stakes(count)
                `)
                .eq('payer_id', currentUser.id)
                .eq('status', 'completed')
                .order('updated_at', { ascending: false });

            if (error) throw error;
            setCompletedBounties(bountiesData || []);

            // Calculate stats
            const totalCompleted = bountiesData?.length || 0;
            const totalSpent = bountiesData?.reduce((sum, b) => sum + b.reward, 0) || 0;
            const winnersSelected = bountiesData?.filter(b => b.winner_id).length || 0;

            setStats({ totalCompleted, totalSpent, winnersSelected });
        } catch (error) {
            console.error('Error loading history:', error);
        } finally {
            setLoading(false);
        }
    }

    const currency = currentUser?.currency === 'INR' ? '₹' : '$';

    if (loading) return (
        <div className="flex h-screen items-center justify-center">
            <div className="w-10 h-10 border-4 border-iq-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="space-y-8 pb-20 animate-fade-in text-white">
            {/* Header */}
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">History & Archives</h1>
                <p className="text-iq-text-secondary">Your completed bounties and past missions.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-iq-card border border-white/5 rounded-xl p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-iq-success/10 flex items-center justify-center text-iq-success">
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-iq-text-secondary uppercase tracking-wider font-bold">Completed</p>
                        <p className="text-xl font-bold text-white">{stats.totalCompleted}</p>
                    </div>
                </div>

                <div className="bg-iq-card border border-white/5 rounded-xl p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                        <Trophy size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-iq-text-secondary uppercase tracking-wider font-bold">Winners Awarded</p>
                        <p className="text-xl font-bold text-white">{stats.winnersSelected}</p>
                    </div>
                </div>

                <div className="bg-iq-card border border-white/5 rounded-xl p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-iq-text-secondary uppercase tracking-wider font-bold">Total Payouts</p>
                        <p className="text-xl font-bold text-white">{currency}{stats.totalSpent.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* Completed Bounties List */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <HistoryIcon size={20} /> Past Missions
                </h2>

                {completedBounties.length === 0 ? (
                    <div className="text-center py-20 border border-dashed border-white/10 rounded-xl">
                        <HistoryIcon size={48} className="mx-auto text-iq-text-secondary mb-4 opacity-50" />
                        <h3 className="text-lg font-bold text-white">No history yet</h3>
                        <p className="text-iq-text-secondary">Completed bounties will appear here.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {completedBounties.map(bounty => (
                            <div key={bounty.id} className="group bg-iq-card border border-white/5 rounded-xl p-6 hover:border-iq-primary/30 transition-all">
                                <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border bg-iq-success/10 text-iq-success border-iq-success/20">
                                                Completed
                                            </span>
                                            <span className="text-xs text-iq-text-secondary flex items-center gap-1">
                                                <Calendar size={12} /> {new Date(bounty.updated_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold text-white mb-1 group-hover:text-iq-primary transition-colors">{bounty.title}</h3>
                                        <p className="text-sm text-iq-text-secondary line-clamp-1">{bounty.description}</p>
                                    </div>

                                    <div className="flex items-center gap-6 md:gap-12 w-full md:w-auto border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                                        <div>
                                            <p className="text-xs text-iq-text-secondary mb-1">Total Paid</p>
                                            <p className="font-bold text-white">{currency}{bounty.reward.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-iq-text-secondary mb-1">Winner</p>
                                            <div className="flex items-center gap-2">
                                                <Trophy size={14} className="text-yellow-500" />
                                                <span className="font-bold text-white">{bounty.winner?.username || 'None'}</span>
                                            </div>
                                        </div>
                                        <Link to={`/payer/bounty/${bounty.id}`} className="p-2 rounded-full border border-white/10 text-iq-text-secondary hover:text-white hover:bg-white/5 ml-auto md:ml-0">
                                            <ArrowRight size={20} />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
