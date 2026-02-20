import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import BountyCard from '../../components/BountyCard';
import { Search, Filter, RefreshCw, Target, X, ChevronDown } from 'lucide-react';

const CATEGORIES = ['All', 'Design', 'Development', 'Content', 'Video', 'Marketing', 'Other'];

export default function Arena() {
    const { currentUser } = useAuth();
    const [bounties, setBounties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [sortBy, setSortBy] = useState('newest');

    useEffect(() => {
        loadBounties();
    }, []);

    async function loadBounties() {
        setLoading(true);
        try {
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

            const bountiesWithCount = data.map(bounty => ({
                ...bounty,
                staked_count: bounty.stakes?.[0]?.count || 0
            }));

            setBounties(bountiesWithCount);
        } catch (error) {
            console.error('Error loading bounties:', error);
        } finally {
            setLoading(false);
        }
    }

    const filteredBounties = bounties
        .filter(bounty => {
            const matchesSearch = !searchTerm ||
                bounty.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                bounty.description?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = activeCategory === 'All' || bounty.category === activeCategory;
            return matchesSearch && matchesCategory;
        })
        .sort((a, b) => {
            if (sortBy === 'reward') return (b.reward || 0) - (a.reward || 0);
            if (sortBy === 'deadline') return new Date(a.submission_deadline) - new Date(b.submission_deadline);
            return new Date(b.created_at) - new Date(a.created_at);
        });

    const totalPool = bounties.reduce((acc, b) => acc + (b.reward || 0), 0);
    const currency = currentUser?.currency === 'INR' ? '₹' : '$';

    return (
        <div style={{ animation: 'fadeInUp 0.4s ease', paddingBottom: '80px' }}>

            {/* ===== HERO BANNER ===== */}
            <div style={{
                padding: '36px 32px',
                borderRadius: '24px',
                background: 'linear-gradient(135deg, rgba(0,255,148,0.08) 0%, rgba(0,229,255,0.06) 50%, rgba(168,85,247,0.05) 100%)',
                border: '1px solid rgba(0,255,148,0.15)',
                marginBottom: '28px',
                position: 'relative',
                overflow: 'hidden',
            }}>
                <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(0,255,148,0.06)', filter: 'blur(60px)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: '-40px', left: '20%', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(0,229,255,0.05)', filter: 'blur(50px)', pointerEvents: 'none' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', position: 'relative' }}>
                    <div>
                        <p style={{ color: '#00FF94', fontSize: '11px', fontWeight: '800', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px' }}>
                            ⚔️ Live Operations
                        </p>
                        <h1 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: '900', color: '#F0F4FF', fontFamily: 'Space Grotesk', marginBottom: '8px', lineHeight: 1.2 }}>
                            The Arena
                        </h1>
                        <p style={{ color: '#8892AA', fontSize: '15px', maxWidth: '480px' }}>
                            Welcome, <span style={{ color: '#00FF94', fontWeight: '700' }}>{currentUser?.username}</span>. Browse active operations, stake your claim, and prove your skills.
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        {[
                            { label: 'Active', value: bounties.length, color: '#00FF94' },
                            { label: 'Total Pool', value: `${currency}${totalPool.toLocaleString(undefined, { maximumFractionDigits: 0, notation: 'compact' })}`, color: '#00E5FF' },
                        ].map((stat, i) => (
                            <div key={i} style={{
                                padding: '12px 20px', borderRadius: '14px',
                                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                textAlign: 'center', minWidth: '90px',
                            }}>
                                <p style={{ fontSize: '22px', fontWeight: '900', color: stat.color, fontFamily: 'JetBrains Mono' }}>{stat.value}</p>
                                <p style={{ fontSize: '11px', color: '#8892AA', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ===== SEARCH + FILTERS ===== */}
            <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Search bar */}
                <div style={{ position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#8892AA', pointerEvents: 'none' }} />
                    <input
                        type="text"
                        placeholder="Search missions by title or keyword..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%', paddingLeft: '48px', paddingRight: searchTerm ? '44px' : '16px',
                            paddingTop: '14px', paddingBottom: '14px',
                            background: 'rgba(23,30,46,0.9)', border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '14px', color: '#F0F4FF', fontSize: '14px', outline: 'none',
                            transition: 'border-color 0.2s ease',
                            boxSizing: 'border-box',
                        }}
                        onFocus={e => e.target.style.borderColor = 'rgba(0,255,148,0.4)'}
                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#8892AA', minHeight: 'auto', minWidth: 'auto', padding: '4px' }}
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                {/* Category chips + Sort */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }} className="no-scrollbar">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                style={{
                                    padding: '7px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '600',
                                    whiteSpace: 'nowrap', cursor: 'pointer', transition: 'all 0.2s ease',
                                    minHeight: 'auto', minWidth: 'auto',
                                    background: activeCategory === cat ? 'rgba(0,255,148,0.15)' : 'rgba(255,255,255,0.04)',
                                    border: activeCategory === cat ? '1px solid rgba(0,255,148,0.4)' : '1px solid rgba(255,255,255,0.08)',
                                    color: activeCategory === cat ? '#00FF94' : '#8892AA',
                                }}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <select
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value)}
                        style={{
                            background: 'rgba(23,30,46,0.9)', border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '10px', color: '#F0F4FF', padding: '8px 12px', fontSize: '13px',
                            cursor: 'pointer', outline: 'none', minHeight: 'auto',
                        }}
                    >
                        <option value="newest">Newest First</option>
                        <option value="reward">Highest Reward</option>
                        <option value="deadline">Earliest Deadline</option>
                    </select>
                </div>
            </div>

            {/* ===== RESULTS COUNT ===== */}
            {!loading && (
                <p style={{ color: '#4A5568', fontSize: '13px', marginBottom: '20px' }}>
                    {filteredBounties.length === 0
                        ? 'No missions found'
                        : `${filteredBounties.length} mission${filteredBounties.length !== 1 ? 's' : ''} found`}
                    {searchTerm && ` for "${searchTerm}"`}
                </p>
            )}

            {/* ===== BOUNTIES GRID ===== */}
            {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                    {[1, 2, 3, 4, 5, 6].map(n => (
                        <div key={n} className="skeleton" style={{ height: '300px', borderRadius: '20px' }} />
                    ))}
                </div>
            ) : filteredBounties.length === 0 ? (
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    padding: '80px 20px', textAlign: 'center',
                    border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '24px',
                    background: 'rgba(23,30,46,0.4)',
                }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                        <Target size={36} style={{ color: '#4A5568' }} />
                    </div>
                    <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#F0F4FF', marginBottom: '8px', fontFamily: 'Space Grotesk' }}>
                        No Active Missions
                    </h3>
                    <p style={{ color: '#8892AA', maxWidth: '360px', marginBottom: '24px' }}>
                        {searchTerm ? 'No missions match your search. Try a different keyword.' : 'The arena is quiet. Check back soon for new contracts.'}
                    </p>
                    <button
                        onClick={() => { setSearchTerm(''); setActiveCategory('All'); loadBounties(); }}
                        className="btn-primary"
                        style={{ padding: '12px 24px', fontSize: '14px' }}
                    >
                        Clear Filters & Refresh
                    </button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                    {filteredBounties.map((bounty, i) => (
                        <div key={bounty.id} style={{ animation: `fadeInUp 0.4s ease ${i * 0.05}s both` }}>
                            <BountyCard bounty={bounty} userRole="hunter" />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
