import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Clock, Target, AlertCircle, MessageSquare, ArrowRight } from 'lucide-react';

export default function PayerWarRoom() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [activeBounties, setActiveBounties] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadActiveBounties();
    }, [currentUser]);

    const loadActiveBounties = async () => {
        try {
            const { data, error } = await supabase
                .from('bounties')
                .select(`
                    *,
                    hunter_stakes(
                        hunter:profiles(username, id)
                    )
                `)
                .eq('payer_id', currentUser.id)
                .in('status', ['live', 'active']) // Fetch only active/live
                .order('deadline', { ascending: true });

            if (data) setActiveBounties(data);
        } catch (error) {
            console.error('Error loading bounties:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex h-screen items-center justify-center">
            <div className="w-10 h-10 border-4 border-iq-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="pb-20 animate-fade-in text-white">
            <header className="mb-10">
                <h1 className="text-4xl font-bold mb-3">War Room</h1>
                <p className="text-iq-text-secondary text-lg">Track your active bounties and monitor hunter progress.</p>
            </header>

            {activeBounties.length === 0 ? (
                <div className="text-center py-20 bg-[#1A1F2E] rounded-2xl border border-dashed border-gray-700">
                    <Target className="w-20 h-20 text-gray-600 mx-auto mb-6" />
                    <h2 className="text-2xl font-bold text-white mb-2">No Active Missions</h2>
                    <p className="text-gray-400 mb-8 max-w-md mx-auto">
                        You don't have any active bounties running in the War Room. Post a bounty to see it here.
                    </p>
                    <button
                        onClick={() => navigate('/payer/post-bounty')}
                        className="bg-iq-primary text-black font-bold py-3 px-8 rounded-xl hover:scale-105 transition-transform"
                    >
                        Post Your First Bounty
                    </button>
                </div>
            ) : (
                <div className="grid gap-8">
                    {activeBounties.map((bounty, index) => (
                        <BountyTimerCard key={bounty.id} bounty={bounty} index={index} navigate={navigate} />
                    ))}
                </div>
            )}
        </div>
    );
}

function BountyTimerCard({ bounty, index, navigate }) {
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(bounty.deadline));

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft(bounty.deadline));
        }, 1000);
        return () => clearInterval(timer);
    }, [bounty.deadline]);

    function calculateTimeLeft(deadline) {
        const total = Date.parse(deadline) - Date.parse(new Date());
        if (total <= 0) return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };

        return {
            total,
            days: Math.floor(total / (1000 * 60 * 60 * 24)),
            hours: Math.floor((total / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((total / 1000 / 60) % 60),
            seconds: Math.floor((total / 1000) % 60)
        };
    }

    const urgencyColor = timeLeft.days < 1 ? 'text-red-500' : 'text-yellow-400';
    const hasHunter = bounty.hunter_stakes && bounty.hunter_stakes.length > 0;
    const hunterName = hasHunter ? bounty.hunter_stakes[0].hunter?.username : 'Waiting for Hunter...';

    // Calculate progress percentage (Mock formula: assumes 7 day standard duration if created_at missing, strictly visual)
    const mockDuration = 7 * 24 * 60 * 60 * 1000;
    const timeElapsed = mockDuration - timeLeft.total;
    const progressPercent = Math.min(100, Math.max(0, (timeElapsed / mockDuration) * 100));

    return (
        <div className="bg-[#1A1F2E] border border-white/5 rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden group hover:border-white/10 transition-colors">
            {/* Background Glow */}
            <div className={`absolute top-0 right-0 w-64 h-64 ${timeLeft.days < 1 ? 'bg-red-500/5' : 'bg-yellow-500/5'} rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none transition-colors`}></div>

            <div className="relative z-10 flex flex-col lg:flex-row gap-8 items-center">

                {/* Info Section */}
                <div className="flex-1 text-center lg:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-iq-text-secondary uppercase tracking-wider mb-4">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        Bounty {index + 1}
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">{bounty.title}</h3>
                    <p className="text-iq-text-secondary flex items-center justify-center lg:justify-start gap-2">
                        <span className="text-xs uppercase tracking-wide">Assigned Hunter:</span>
                        <span className="text-white font-medium bg-white/10 px-2 py-0.5 rounded">{hunterName}</span>
                    </p>
                </div>

                {/* Timer Section */}
                <div className={`bg-[#0A0E14] border ${timeLeft.days < 1 ? 'border-red-500/30' : 'border-yellow-500/30'} rounded-2xl p-6 md:p-8 flex-shrink-0 w-full lg:w-auto text-center min-w-[320px]`}>
                    <p className="text-xs text-iq-text-secondary uppercase tracking-widest mb-4 font-bold">Time Until Deadline</p>

                    {timeLeft.total <= 0 ? (
                        <div className="text-red-500 font-bold text-3xl animate-pulse flex items-center justify-center gap-2">
                            <AlertCircle /> DEADLINE PASSED
                        </div>
                    ) : (
                        <div>
                            <div className={`text-4xl md:text-5xl font-mono font-bold ${urgencyColor} mb-6 tabular-nums`}>
                                {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
                            </div>

                            {/* Visual Progress Bar */}
                            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden mb-3">
                                <div
                                    className={`h-full ${timeLeft.days < 1 ? 'bg-red-500' : 'bg-yellow-500'} transition-all duration-1000`}
                                    style={{ width: `${progressPercent}%` }}
                                ></div>
                            </div>

                            <p className="text-xs text-iq-text-secondary">
                                Deadline: {new Date(bounty.deadline).toLocaleDateString()}
                            </p>
                        </div>
                    )}
                </div>



            </div>
        </div>
    );
}
