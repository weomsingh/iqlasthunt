import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import BountyCard from '../../components/BountyCard';
import { Search, Filter, RefreshCw, Target, Globe, Zap, ShieldCheck } from 'lucide-react';

export default function Arena() {
    const { currentUser } = useAuth();
    const [bounties, setBounties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterExpertise, setFilterExpertise] = useState('all');

    useEffect(() => {
        loadBounties();
    }, []);

    async function loadBounties() {
        setLoading(true);
        try {
            // Fetch live bounties
            // Note: Ensure foreign key relationships exist for this query to work perfectly
            const { data, error } = await supabase
                .from('bounties')
                .select(`
                    *,
                    payer:profiles!bounties_payer_id_fkey(username, company_name),
                    stakes:hunter_stakes(count)
                `)
                .eq('status', 'live')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Add staked_count to each bounty
            const bountiesWithCount = data.map(bounty => ({
                ...bounty,
                // Handle different response structures for count
                staked_count: bounty.stakes?.[0]?.count || 0
            }));

            setBounties(bountiesWithCount);
        } catch (error) {
            console.error('Error loading bounties:', error);
        } finally {
            setLoading(false);
        }
    }

    const filteredBounties = bounties.filter(bounty => {
        const matchesSearch = bounty.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bounty.description.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    return (
        <div className="animate-fade-in pb-20 md:pb-0">
            {/* Header / Hero */}
            <div className="relative mb-8 py-8 px-6 md:px-10 bg-iq-card border border-white/5 rounded-3xl overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-iq-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">The Arena ⚔️</h1>
                        <p className="text-iq-text-secondary max-w-xl">
                            Welcome, <span className="text-iq-primary font-bold">{currentUser?.username}</span>.
                            Browse active operations, stake your claim, and prove your skills.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <div className="px-4 py-2 bg-iq-surface rounded-xl border border-white/10 flex flex-col items-center justify-center min-w-[80px]">
                            <span className="text-2xl font-bold text-white">{bounties.length}</span>
                            <span className="text-[10px] text-iq-text-secondary uppercase tracking-wider">Active</span>
                        </div>
                        <div className="px-4 py-2 bg-iq-surface rounded-xl border border-white/10 flex flex-col items-center justify-center min-w-[80px]">
                            <span className="text-2xl font-bold text-iq-primary">
                                {bounties.reduce((acc, b) => acc + (b.reward || 0), 0).toLocaleString(undefined, { maximumFractionDigits: 0, notation: 'compact' })}
                            </span>
                            <span className="text-[10px] text-iq-text-secondary uppercase tracking-wider">Pool</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="sticky top-20 z-30 mb-8 bg-iq-background/80 backdrop-blur-xl py-4 border-b border-white/5 -mx-4 px-4 md:mx-0 md:px-0 md:bg-transparent md:border-none md:static md:backdrop-blur-none md:py-0">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative group">
                        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-iq-text-secondary group-focus-within:text-iq-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search missions by title, keyword, or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-iq-card border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-iq-primary focus:ring-1 focus:ring-iq-primary transition-all placeholder-white/20"
                        />
                    </div>
                    <div className="flex gap-3">
                        <button
                            className="px-4 py-3 bg-iq-card border border-white/10 rounded-xl text-iq-text-secondary hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                            title="Filter (Coming Soon)"
                        >
                            <Filter size={20} />
                            <span className="hidden md:inline">Filter</span>
                        </button>
                        <button
                            className="px-4 py-3 bg-iq-card border border-white/10 rounded-xl text-iq-text-secondary hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2 active:scale-95"
                            onClick={loadBounties}
                            disabled={loading}
                        >
                            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                            <span className="hidden md:inline">Refresh</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                        <div key={n} className="h-64 bg-iq-card border border-white/5 rounded-2xl animate-pulse flex flex-col p-6 space-y-4">
                            <div className="h-6 bg-white/5 rounded w-3/4"></div>
                            <div className="h-4 bg-white/5 rounded w-full"></div>
                            <div className="h-4 bg-white/5 rounded w-2/3"></div>
                            <div className="mt-auto flex justify-between">
                                <div className="h-8 bg-white/5 rounded w-1/3"></div>
                                <div className="h-8 bg-white/5 rounded w-1/4"></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredBounties.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-white/10 rounded-3xl bg-iq-card/50">
                    <div className="w-20 h-20 bg-iq-surface rounded-full flex items-center justify-center mb-6">
                        <Target size={40} className="text-iq-text-secondary opacity-50" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">No Active Missions Found</h3>
                    <p className="text-iq-text-secondary max-w-md mx-auto mb-8">
                        {searchTerm ? "No missions match your search criteria. Try adjusting your filters." : "The arena is currently quiet. Check back later for new contracts."}
                    </p>
                    <button
                        onClick={() => { setSearchTerm(''); loadBounties(); }}
                        className="px-6 py-3 bg-iq-primary text-black font-bold rounded-xl hover:bg-iq-primary/90 transition-colors"
                    >
                        Clear Filters & Refresh
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredBounties.map(bounty => (
                        <div key={bounty.id} className="h-full animate-fade-in-up">
                            <BountyCard bounty={bounty} userRole="hunter" />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
