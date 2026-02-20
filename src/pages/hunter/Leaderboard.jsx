import { Trophy, Target, ArrowLeft, Star, Award, Zap, TrendingUp, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';

export default function Leaderboard() {
    const { currentUser } = useAuth();
    const [topHunters, setTopHunters] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadLeaderboard();
    }, []);

    async function loadLeaderboard() {
        try {
            const { data } = await supabase
                .from('profiles')
                .select('id, username, wins, wallet_balance, expertise, currency')
                .eq('role', 'hunter')
                .order('wins', { ascending: false })
                .limit(10);

            setTopHunters(data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    const rankColors = ['#F59E0B', '#C0C0C0', '#CD7F32'];
    const rankIcons = [Crown, Award, Star];

    return (
        <div style={{ animation: 'fadeInUp 0.4s ease', paddingBottom: '80px', maxWidth: '800px', margin: '0 auto' }}>

            {/* Header */}
            <div style={{
                padding: '36px', borderRadius: '24px',
                background: 'linear-gradient(135deg, rgba(255,230,0,0.08), rgba(255,107,53,0.05))',
                border: '1px solid rgba(255,230,0,0.15)',
                marginBottom: '28px', textAlign: 'center', position: 'relative', overflow: 'hidden',
            }}>
                <div style={{ position: 'absolute', top: '-40px', left: '50%', transform: 'translateX(-50%)', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,230,0,0.05)', filter: 'blur(60px)', pointerEvents: 'none' }} />
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                    <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(255,230,0,0.12)', border: '1px solid rgba(255,230,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Trophy size={36} style={{ color: '#F59E0B' }} />
                    </div>
                </div>
                <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#F0F4FF', fontFamily: 'Space Grotesk', marginBottom: '8px' }}>Global Leaderboard</h1>
                <p style={{ color: '#8892AA', fontSize: '14px' }}>Top hunters ranked by mission wins. Rise through the ranks.</p>
            </div>

            {/* Leaderboard Table */}
            <div style={{ borderRadius: '20px', background: 'rgba(23,30,46,0.9)', border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>

                {/* Table Header */}
                <div style={{ padding: '14px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'grid', gridTemplateColumns: '60px 1fr 80px 80px', gap: '12px', background: 'rgba(255,255,255,0.02)' }}>
                    {['Rank', 'Hunter', 'Wins', 'Earnings'].map(h => (
                        <p key={h} style={{ color: '#4A5568', fontSize: '11px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{h}</p>
                    ))}
                </div>

                {loading ? (
                    <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="skeleton" style={{ height: '56px', borderRadius: '12px' }} />
                        ))}
                    </div>
                ) : topHunters.length === 0 ? (
                    <div style={{ padding: '60px', textAlign: 'center', color: '#4A5568' }}>
                        <Zap size={40} style={{ margin: '0 auto 12px' }} />
                        <p>Rankings being compiled...</p>
                    </div>
                ) : (
                    topHunters.map((hunter, i) => {
                        const isMe = hunter.id === currentUser?.id;
                        const currency = hunter.currency === 'INR' ? '₹' : '$';
                        const RankIcon = rankIcons[i] || TrendingUp;
                        return (
                            <div
                                key={hunter.id}
                                style={{
                                    padding: '18px 24px',
                                    borderBottom: i < topHunters.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                    display: 'grid', gridTemplateColumns: '60px 1fr 80px 80px',
                                    gap: '12px', alignItems: 'center',
                                    background: isMe ? 'rgba(6, 182, 212,0.04)' : 'transparent',
                                    transition: 'background 0.2s ease',
                                }}
                                onMouseOver={e => !isMe && (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                                onMouseOut={e => !isMe && (e.currentTarget.style.background = 'transparent')}
                            >
                                {/* Rank */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <RankIcon size={16} style={{ color: rankColors[i] || '#4A5568' }} />
                                    <span style={{ fontFamily: 'JetBrains Mono', fontWeight: '800', fontSize: '15px', color: rankColors[i] || '#8892AA' }}>#{i + 1}</span>
                                </div>

                                {/* Hunter */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '14px', fontWeight: '800',
                                        background: isMe ? 'linear-gradient(135deg, #06B6D4, #06B6D4)' : `rgba(255,255,255,0.06)`,
                                        color: isMe ? '#000' : '#8892AA',
                                        border: isMe ? 'none' : '1px solid rgba(255,255,255,0.1)',
                                    }}>
                                        {hunter.username?.substring(0, 2).toUpperCase() || '??'}
                                    </div>
                                    <div>
                                        <p style={{ color: '#F0F4FF', fontWeight: '700', fontSize: '14px' }}>
                                            {hunter.username || 'Anonymous'}
                                            {isMe && <span style={{ marginLeft: '8px', fontSize: '10px', color: '#06B6D4', fontWeight: '700', background: 'rgba(6, 182, 212,0.1)', padding: '2px 6px', borderRadius: '4px' }}>YOU</span>}
                                        </p>
                                        {hunter.expertise?.length > 0 && (
                                            <p style={{ color: '#4A5568', fontSize: '11px' }}>{hunter.expertise.slice(0, 2).join(', ')}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Wins */}
                                <p style={{ color: '#F59E0B', fontWeight: '800', fontFamily: 'JetBrains Mono', fontSize: '15px' }}>{hunter.wins || 0}</p>

                                {/* Earnings (wallet balance as proxy) */}
                                <p style={{ color: '#06B6D4', fontWeight: '700', fontFamily: 'JetBrains Mono', fontSize: '13px' }}>
                                    {currency}{(hunter.wallet_balance || 0).toLocaleString()}
                                </p>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Back btn */}
            <div style={{ marginTop: '28px', textAlign: 'center' }}>
                <Link to="/hunter/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#8892AA', textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s ease', minHeight: 'auto', minWidth: 'auto' }}
                    onMouseOver={e => e.currentTarget.style.color = '#F0F4FF'}
                    onMouseOut={e => e.currentTarget.style.color = '#8892AA'}
                >
                    <ArrowLeft size={16} /> Return to Base
                </Link>
            </div>
        </div>
    );
}
