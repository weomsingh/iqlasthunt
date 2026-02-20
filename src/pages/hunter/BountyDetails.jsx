import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';
import SubmitWorkModal from '../../components/SubmitWorkModal';
import {
    Target, Clock, Users, TrendingUp, Lock,
    FileText, MessageSquare, Upload, ArrowLeft,
    AlertCircle, CheckCircle, Download, ShieldCheck
} from 'lucide-react';

export default function BountyDetails() {
    const { id } = useParams();
    const { currentUser, refreshUser } = useAuth();
    const navigate = useNavigate();

    const [bounty, setBounty] = useState(null);
    const [myStake, setMyStake] = useState(null);
    const [mySubmission, setMySubmission] = useState(null);
    const [hunterCount, setHunterCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [staking, setStaking] = useState(false);
    const [showSubmitModal, setShowSubmitModal] = useState(false);

    useEffect(() => {
        loadBountyData();
    }, [id]);

    async function loadBountyData() {
        try {
            // Get bounty details
            const { data: bountyData, error: bountyError } = await supabase
                .from('bounties')
                .select('*')
                .eq('id', id)
                .single();

            if (bountyError) throw bountyError;
            setBounty(bountyData);

            // Get hunter count
            const { count } = await supabase
                .from('hunter_stakes')
                .select('*', { count: 'exact', head: true })
                .eq('bounty_id', id)
                .eq('status', 'active');

            setHunterCount(count || 0);

            // Check if I'm staked
            const { data: stakeData } = await supabase
                .from('hunter_stakes')
                .select('*')
                .eq('bounty_id', id)
                .eq('hunter_id', currentUser.id)
                .eq('status', 'active')
                .single();

            if (stakeData) setMyStake(stakeData);

            // Check if I've submitted
            const { data: submissionData } = await supabase
                .from('submissions')
                .select('*')
                .eq('bounty_id', id)
                .eq('hunter_id', currentUser.id)
                .single();

            if (submissionData) setMySubmission(submissionData);

        } catch (error) {
            console.error('Error loading bounty:', error);
            // alert('Failed to load bounty details'); // Silent fail or redirect
            // navigate('/hunter/arena');
        } finally {
            setLoading(false);
        }
    }

    async function handleStake() {
        if (!currentUser) return;

        // Check if user has enough balance
        if (currentUser.wallet_balance < (bounty.entry_fee || 0)) {
            alert(`Insufficient balance! You need ${currency}${bounty.entry_fee} to stake.\n\nGo to Vault to deposit funds.`);
            navigate('/hunter/vault');
            return;
        }

        // Confirm stake
        const confirmed = window.confirm(
            `Stake ${currency}${bounty.entry_fee} to enter this hunt?\n\n` +
            `Note: Entry fees are NON-REFUNDABLE\n` +
            `Note: You can only have ONE active stake at a time\n` +
            `Note: You will be locked until mission completion`
        );

        if (!confirmed) return;

        setStaking(true);

        try {
            const { data, error } = await supabase.rpc('stake_on_bounty', {
                p_bounty_id: id,
                p_hunter_id: currentUser.id,
                p_stake_amount: bounty.entry_fee || 0
            });

            if (error) throw error;

            if (data.success) {
                alert('Stake successful! You are now locked in.\n\nAccess the War Room to start hunting.');
                await refreshUser();
                await loadBountyData();
            } else {
                alert(data.error || 'Failed to stake');
            }
        } catch (error) {
            console.error('Stake error:', error);
            alert(`Failed to stake: ${error.message || 'Please try again.'}`);
        } finally {
            setStaking(false);
        }
    }

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="w-10 h-10 border-4 border-iq-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!bounty) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                <AlertCircle size={48} className="text-iq-error mb-4 opacity-50" />
                <h2 className="text-2xl font-bold text-white mb-2">Bounty Not Found</h2>
                <Link to="/hunter/arena" className="btn-secondary flex items-center gap-2">
                    <ArrowLeft size={16} /> Back to Arena
                </Link>
            </div>
        );
    }

    const currency = currentUser?.currency === 'INR' ? '₹' : '$';
    const deadline = new Date(bounty.submission_deadline);
    const isExpired = deadline < new Date();
    const daysLeft = Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24));
    const canStake = bounty.status === 'live' && !isExpired && !myStake;

    return (
        <div className="max-w-5xl mx-auto pb-20 animate-fade-in px-4 md:px-0">
            {/* Header */}
            <div className="py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <Link to="/hunter/arena" className="text-iq-text-secondary hover:text-white flex items-center gap-2 transition-colors">
                    <ArrowLeft size={20} />
                    Back to Arena
                </Link>
                <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${bounty.status === 'live'
                        ? 'bg-iq-success/10 text-iq-success border-iq-success/20'
                        : 'bg-white/10 text-white border-white/20'
                        }`}>
                        {bounty.status}
                    </span>
                    {myStake && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-iq-primary/10 text-iq-primary border border-iq-primary/20 flex items-center gap-1">
                            <Lock size={12} /> Staked
                        </span>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Title & Description */}
                    <div className="bg-iq-card border border-white/5 rounded-2xl p-6 md:p-8">
                        <h1 className="text-2xl md:text-3xl font-bold text-white mb-4 leading-tight">{bounty.title}</h1>
                        <div className="prose prose-invert max-w-none text-iq-text-secondary whitespace-pre-line text-sm leading-relaxed border-t border-white/5 pt-4">
                            {bounty.description}
                        </div>
                    </div>

                    {/* Mission Brief Section */}
                    <div className="bg-iq-card border border-white/5 rounded-2xl p-6 md:p-8">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <FileText size={24} className="text-iq-primary" />
                            Mission Assets
                        </h2>

                        {myStake ? (
                            <div className="bg-iq-success/5 border border-iq-success/20 rounded-xl p-6 flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
                                <div className="w-12 h-12 rounded-full bg-iq-success/10 flex items-center justify-center text-iq-success shrink-0">
                                    <CheckCircle size={24} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-white text-lg">Mission Unlocked</h3>
                                    <p className="text-sm text-iq-text-secondary opacity-80">
                                        You have successfully staked. Access the full mission brief to proceed.
                                    </p>
                                </div>
                                <a
                                    href={bounty.mission_pdf_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-primary whitespace-nowrap flex items-center gap-2"
                                >
                                    <Download size={18} /> Download Brief
                                </a>
                            </div>
                        ) : (
                            <div className="bg-iq-surface border border-white/5 rounded-xl p-8 text-center relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                                    <Lock size={120} className="text-white" />
                                </div>
                                <div className="relative z-10 flex flex-col items-center">
                                    <div className="w-16 h-16 rounded-full bg-iq-card border border-white/10 flex items-center justify-center mb-4 shadow-lg">
                                        <Lock size={32} className="text-iq-text-secondary" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Assets Locked</h3>
                                    <p className="text-iq-text-secondary mb-6 max-w-sm">
                                        Stake the entry fee to unlock the full mission brief, assets, and gain access to the War Room.
                                    </p>

                                    {canStake ? (
                                        <button
                                            className="btn-primary px-8 py-3 text-base shadow-glow flex items-center gap-2 group"
                                            onClick={handleStake}
                                            disabled={staking}
                                        >
                                            {staking ? (
                                                'Processing Transaction...'
                                            ) : (
                                                <>
                                                    <Lock size={18} className="group-hover:hidden" />
                                                    <CheckCircle size={18} className="hidden group-hover:block" />
                                                    Stake {currency}{bounty.entry_fee} & Enter Hunt
                                                </>
                                            )}
                                        </button>
                                    ) : (
                                        <div className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm font-medium">
                                            {isExpired ? 'Mission Deadline Passed' : 'Mission Currently Unavailable'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Stats & Actions */}
                <div className="space-y-6">
                    {/* Stats Card */}
                    <div className="bg-iq-card border border-white/5 rounded-2xl p-6 space-y-6">
                        <div className="space-y-1 pb-4 border-b border-white/5">
                            <p className="text-sm text-iq-text-secondary">Reward Pool</p>
                            <p className="text-3xl font-bold text-iq-primary">{currency}{bounty.reward.toLocaleString()}</p>
                            {bounty.vault_locked > 0 && (
                                <div className="flex items-center gap-1 text-xs text-iq-success mt-1">
                                    <ShieldCheck size={12} />
                                    {bounty.vault_locked}% Secured in Vault
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-iq-text-secondary text-sm">
                                    <Target size={16} /> Entry Fee
                                </div>
                                <span className="font-bold text-white">{currency}{(bounty.entry_fee || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-iq-text-secondary text-sm">
                                    <Users size={16} /> Hunters Staked
                                </div>
                                <span className="font-bold text-white">{hunterCount}/{bounty.max_hunters || '∞'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-iq-text-secondary text-sm">
                                    <Clock size={16} /> Time Left
                                </div>
                                <span className={`font-bold ${daysLeft < 3 ? 'text-red-500' : 'text-white'}`}>
                                    {daysLeft > 0 ? `${daysLeft} days` : 'Expired'}
                                </span>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-white/5">
                            <p className="text-xs text-center text-iq-text-secondary">
                                Funds held in escrow until completion.
                            </p>
                        </div>
                    </div>

                    {/* Staked Actions */}
                    {myStake && (
                        <div className="bg-gradient-to-br from-iq-primary/10 to-iq-accent/5 border border-iq-primary/20 rounded-2xl p-6 space-y-4">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <Target size={18} className="text-iq-primary" /> Active Hunt
                            </h3>

                            <Link to="/hunter/war-room" className="w-full flex items-center justify-between p-4 bg-iq-surface border border-white/10 rounded-xl hover:bg-white/5 hover:border-white/20 transition-all group">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-iq-card flex items-center justify-center text-white">
                                        <MessageSquare size={18} />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-white text-sm">War Room</p>
                                        <p className="text-xs text-iq-text-secondary">Mission Comms</p>
                                    </div>
                                </div>
                                <ArrowLeft size={16} className="rotate-180 text-iq-text-secondary group-hover:text-white transition-colors" />
                            </Link>

                            <button
                                onClick={() => setShowSubmitModal(true)}
                                disabled={isExpired}
                                className={`w-full flex items-center justify-between p-4 border rounded-xl transition-all group ${mySubmission
                                    ? 'bg-iq-success/10 border-iq-success/20'
                                    : 'bg-iq-surface border-white/10 hover:bg-iq-primary/10 hover:border-iq-primary/30'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${mySubmission ? 'bg-iq-success/20 text-iq-success' : 'bg-iq-card text-white'
                                        }`}>
                                        {mySubmission ? <CheckCircle size={18} /> : <Upload size={18} />}
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-white text-sm">{mySubmission ? 'Work Submitted' : 'Submit Work'}</p>
                                        <p className="text-xs text-iq-text-secondary">
                                            {mySubmission ? 'Under Review' : 'Upload deliverables'}
                                        </p>
                                    </div>
                                </div>
                                {!mySubmission && <ArrowLeft size={16} className="rotate-180 text-iq-text-secondary group-hover:text-white transition-colors" />}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Rules */}
            <div className="mt-8 pt-8 border-t border-white/5 text-center md:text-left">
                <h3 className="text-sm font-bold text-iq-text-secondary uppercase tracking-wider mb-4">Mission Rules</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs text-iq-text-secondary">
                    <div className="flex items-center gap-2 p-3 bg-iq-surface rounded-lg border border-white/5">
                        <div className="w-1 h-1 rounded-full bg-iq-error" /> Entry fees are non-refundable
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-iq-surface rounded-lg border border-white/5">
                        <div className="w-1 h-1 rounded-full bg-iq-primary" /> One winner takes the full reward
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-iq-surface rounded-lg border border-white/5">
                        <div className="w-1 h-1 rounded-full bg-iq-accent" /> Winner chosen by Payer review
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-iq-surface rounded-lg border border-white/5">
                        <div className="w-1 h-1 rounded-full bg-white" /> War Room chats are encrypted
                    </div>
                </div>
            </div>

            {/* Submit Work Modal */}
            {showSubmitModal && (
                <SubmitWorkModal
                    bounty={bounty}
                    onClose={() => setShowSubmitModal(false)}
                    onSuccess={() => {
                        setShowSubmitModal(false);
                        loadBountyData();
                    }}
                />
            )}
        </div>
    );
}
