import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';
import {
    ArrowLeft, Users, FileText, Clock, TrendingUp,
    Trophy, CheckCircle, AlertCircle, Target, MessageSquare, Settings,
    List, Calendar, DollarSign, Download, Star, Filter, ChevronRight, Share2, MoreHorizontal, X
} from 'lucide-react';

export default function PayerBountyDetails() {
    const { id } = useParams();
    const { currentUser, refreshUser } = useAuth();
    const navigate = useNavigate();

    const [bounty, setBounty] = useState(null);
    const [hunters, setHunters] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview'); // overview, hunters, submissions, activity

    useEffect(() => {
        loadBountyData();
    }, [id]);

    async function loadBountyData() {
        try {
            // Get bounty
            const { data: bountyData, error: bountyError } = await supabase
                .from('bounties')
                .select('*')
                .eq('id', id)
                .eq('payer_id', currentUser.id)
                .single();

            if (bountyError) throw bountyError;
            setBounty(bountyData);

            // Get hunters (Applications)
            const { data: huntersData } = await supabase
                .from('hunter_stakes')
                .select(`
                    *,
                    hunter:profiles(id, username, expertise_tags)
                `)
                .eq('bounty_id', id)
                .eq('status', 'active');

            setHunters(huntersData || []);

            // Get submissions
            const { data: submissionsData } = await supabase
                .from('submissions')
                .select(`
                    *,
                    hunter:profiles(username)
                `)
                .eq('bounty_id', id)
                .order('created_at', { ascending: false });

            setSubmissions(submissionsData || []);

        } catch (error) {
            console.error('Error loading bounty:', error);
            navigate('/payer/dashboard');
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

    if (!bounty) return null;

    return (
        <div className="space-y-6 pb-20 animate-fade-in relative z-0">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <Link to="/payer/dashboard" className="text-iq-text-secondary hover:text-white flex items-center gap-2 text-sm w-fit transition-colors">
                    <ArrowLeft size={16} /> Back to Dashboard
                </Link>

                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">{bounty.title}</h1>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${bounty.status === 'live'
                                ? 'bg-iq-success/10 text-iq-success border-iq-success/20'
                                : 'bg-white/10 text-white border-white/20'
                                }`}>
                                {bounty.status}
                            </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-iq-text-secondary">
                            <span className="flex items-center gap-1.5"><Clock size={14} /> Posted {new Date(bounty.created_at).toLocaleDateString()}</span>
                            <span className="flex items-center gap-1.5"><Users size={14} /> {hunters.length} Applicants</span>
                        </div>
                    </div>

                    {/* Logic Check */}
                    {(() => {
                        const deadline = new Date(bounty.submission_deadline);
                        const isExpired = deadline < new Date();
                        const hasEnrollments = hunters.length > 0;
                        const hasSubmissions = submissions.length > 0;
                        // Active if NO enrollments OR (Expired AND No Submissions)
                        const canManage = !hasEnrollments || (isExpired && !hasSubmissions);

                        return (
                            <div className="flex gap-3">
                                <button
                                    onClick={async () => {
                                        if (!confirm('Pause this bounty? Hunters will not be able to join.')) return;
                                        try {
                                            const { error } = await supabase.from('bounties').update({ status: 'paused' }).eq('id', bounty.id);
                                            if (error) throw error;
                                            loadBountyData();
                                        } catch (e) { alert(e.message); }
                                    }}
                                    disabled={!canManage}
                                    className="btn-secondary text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Clock size={16} /> Pause
                                </button>

                                <button
                                    onClick={async () => {
                                        if (!confirm('DELETE this bounty?\n\nIf no hunters have joined, your full payment will be instantly refunded to your vault.')) return;
                                        try {
                                            const { data, error } = await supabase.rpc('cancel_bounty', {
                                                p_bounty_id: bounty.id,
                                                p_payer_id: currentUser.id
                                            });

                                            if (error) throw error;
                                            if (data && !data.success) throw new Error(data.error);

                                            const refunded = data?.refunded || 0;
                                            const currency = currentUser?.currency === 'INR' ? '₹' : '$';

                                            alert(`✅ Bounty cancelled.\n\n${currency}${Number(refunded).toLocaleString()} has been instantly refunded to your vault.`);
                                            navigate('/payer/dashboard');
                                        } catch (e) { alert('Error: ' + e.message); }
                                    }}
                                    disabled={!canManage}
                                    className="bg-red-500/10 text-red-500 border border-red-500/20 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-500/20 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <X size={16} /> Cancel & Refund
                                </button>
                            </div>
                        );
                    })()}
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="sticky top-16 z-20 bg-iq-background/95 backdrop-blur-sm pt-2 -mx-4 px-4 md:-mx-0 md:px-0">
                <div className="flex overflow-x-auto border-b border-white/10 gap-6 no-scrollbar">
                    {[
                        { id: 'overview', label: 'Overview', icon: Target },
                        { id: 'hunters', label: `Hunters (${hunters.length})`, icon: Users },
                        { id: 'submissions', label: `Submissions (${submissions.length})`, icon: FileText },
                        { id: 'activity', label: 'Activity', icon: List },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 pb-3 text-sm font-medium whitespace-nowrap transition-colors relative ${activeTab === tab.id
                                ? 'text-iq-primary'
                                : 'text-iq-text-secondary hover:text-white'
                                }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                            {activeTab === tab.id && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-iq-primary" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
                {activeTab === 'overview' && <OverviewTab bounty={bounty} hunters={hunters} submissions={submissions} currency={currency} />}
                {activeTab === 'hunters' && <HuntersTab hunters={hunters} currency={currency} />}
                {activeTab === 'submissions' && <SubmissionsTab submissions={submissions} bounty={bounty} currency={currency} />}
                {activeTab === 'activity' && <ActivityTab bounty={bounty} />}
            </div>
        </div>
    );
}

// --- TAB COMPONENTS ---

function OverviewTab({ bounty, hunters, submissions, currency }) {
    const deadline = new Date(bounty.submission_deadline);
    const isExpired = deadline < new Date();
    const daysLeft = Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24));

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            {/* Left Column: Details */}
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-iq-card border border-white/5 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Description</h3>
                    <div className="prose prose-invert max-w-none text-iq-text-secondary whitespace-pre-line text-sm leading-relaxed">
                        {bounty.description}
                    </div>

                    {bounty.mission_pdf_url && (
                        <div className="mt-6 pt-6 border-t border-white/5">
                            <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><FileText size={16} /> Deliverables & Brief</h4>
                            <a href={bounty.mission_pdf_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-iq-surface rounded-lg border border-white/10 hover:border-iq-primary/50 transition-colors group">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded bg-red-500/10 flex items-center justify-center text-red-500">
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white group-hover:text-iq-primary transition-colors">Mission Brief</p>
                                        <p className="text-xs text-iq-text-secondary">Project requirements & assets</p>
                                    </div>
                                </div>
                                <Download size={18} className="text-iq-text-secondary group-hover:text-white" />
                            </a>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Column: Status Card */}
            <div className="space-y-6">
                <div className="bg-iq-card border border-white/5 rounded-xl p-6 space-y-6 sticky top-24">
                    <div className="flex items-center justify-between pb-4 border-b border-white/5">
                        <span className="text-sm text-iq-text-secondary">Status</span>
                        <span className="text-sm font-bold text-iq-success uppercase tracking-wider">{bounty.status}</span>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-iq-text-secondary text-sm flex items-center gap-2"><DollarSign size={16} /> Budget (Escrowed)</span>
                            <span className="text-white font-bold">{currency}{bounty.reward.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-iq-text-secondary text-sm flex items-center gap-2"><Clock size={16} /> Deadline</span>
                            <span className={`font-bold ${daysLeft < 3 ? 'text-red-500' : 'text-white'}`}>
                                {isExpired ? 'Expired' : `${daysLeft} days left`}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-iq-text-secondary text-sm flex items-center gap-2"><Users size={16} /> Applications</span>
                            <span className="text-white font-bold">{hunters.length}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function HuntersTab({ hunters, currency }) {
    return (
        <div className="animate-fade-in">
            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 overflow-x-auto flex gap-2 no-scrollbar">
                    <button className="px-4 py-2 rounded-full bg-iq-primary/10 text-iq-primary text-sm font-medium whitespace-nowrap border border-iq-primary/20">All Applicants</button>
                    <button className="px-4 py-2 rounded-full bg-iq-surface text-iq-text-secondary text-sm font-medium whitespace-nowrap border border-white/5 hover:bg-white/5">Recommended</button>
                    <button className="px-4 py-2 rounded-full bg-iq-surface text-iq-text-secondary text-sm font-medium whitespace-nowrap border border-white/5 hover:bg-white/5">Top Rated (4+ ⭐)</button>
                </div>
            </div>

            {hunters.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-white/10 rounded-xl">
                    <Users size={48} className="mx-auto text-iq-text-secondary mb-4 opacity-50" />
                    <h3 className="text-lg font-bold text-white">No hunters yet</h3>
                    <p className="text-iq-text-secondary">Waiting for talent to apply...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {hunters.map((stake, idx) => (
                        <div key={stake.id} className="group bg-iq-card border border-white/5 rounded-xl p-5 hover:border-iq-primary/30 transition-all flex flex-col">


                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-iq-primary to-iq-accent flex items-center justify-center text-black font-bold text-lg">
                                        {stake.hunter.username.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white">{stake.hunter.username}</h4>
                                        <div className="flex items-center gap-1 text-xs text-yellow-500">
                                            <Star size={12} fill="currentColor" /> 4.8
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 mb-6">
                                <div className="flex flex-wrap gap-1.5">
                                    {stake.hunter.expertise_tags?.slice(0, 3).map(tag => (
                                        <span key={tag} className="px-2 py-1 rounded text-[10px] bg-iq-surface text-iq-text-secondary border border-white/5">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                                <div className="flex justify-between text-xs text-iq-text-secondary pt-2 border-t border-white/5">
                                    <span>Staked: {currency}{stake.entry_fee}</span>
                                    <span>98% Success</span>
                                </div>
                            </div>

                            <div className="mt-auto flex gap-2">
                                <button className="flex-1 py-2 text-sm font-medium bg-iq-surface text-white rounded-lg hover:bg-white/10 transition-colors">
                                    View Profile
                                </button>
                                <button className="flex-1 py-2 text-sm font-medium bg-iq-primary/10 text-iq-primary rounded-lg hover:bg-iq-primary/20 transition-colors">
                                    Message
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function SubmissionsTab({ submissions, bounty, currency }) {
    return (
        <div className="animate-fade-in space-y-6">
            {submissions.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-white/10 rounded-xl">
                    <FileText size={48} className="mx-auto text-iq-text-secondary mb-4 opacity-50" />
                    <h3 className="text-lg font-bold text-white">No submissions yet</h3>
                    <p className="text-iq-text-secondary">Work will appear here for review</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {submissions.map(submission => (
                        <div key={submission.id} className="bg-iq-card border border-white/5 rounded-xl p-6 hover:border-white/10 transition-colors">
                            <div className="flex flex-col md:flex-row gap-6">
                                {/* Submission Preview (Mock) */}
                                <div className="w-full md:w-1/4 h-32 md:h-auto bg-iq-surface rounded-lg border border-white/5 flex items-center justify-center flex-shrink-0">
                                    <FileText size={32} className="text-iq-text-secondary" />
                                </div>

                                {/* Details */}
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="text-lg font-bold text-white mb-1">Submission from {submission.hunter.username}</h4>
                                            <p className="text-sm text-iq-text-secondary">Submitted on {new Date(submission.created_at).toLocaleDateString()}</p>
                                        </div>

                                    </div>

                                    <p className="text-sm text-iq-text-secondary mb-4 line-clamp-2">
                                        {submission.submission_text || 'No description provided.'}
                                    </p>

                                    <div className="flex gap-3">
                                        <Link to={`/payer/bounty/${bounty.id}/review/${submission.id}`} className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
                                            <FileText size={16} /> Review Work
                                        </Link>
                                        <button className="btn-secondary text-sm px-4 py-2">Download Files</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function ActivityTab() {
    return (
        <div className="space-y-6 animate-fade-in max-w-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Bounty Timeline</h3>
            <div className="space-y-0 relative border-l border-white/10 ml-3">
                {[
                    { title: "Bounty Posted", time: "2 days ago", type: "system" },
                    { title: "Escrow Secured", time: "2 days ago", desc: "Funds locked in vault", type: "secure" },
                    { title: "First Application", time: "1 day ago", desc: "Hunter JohnDoe applied", type: "user" },
                    { title: "Milestone Update", time: "5 hours ago", desc: "Edited deadline", type: "edit" }
                ].map((item, i) => (
                    <div key={i} className="pl-8 pb-8 relative group">
                        <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-iq-primary ring-4 ring-iq-background group-last:bg-iq-text-secondary" />
                        <h4 className="text-white font-medium text-sm">{item.title}</h4>
                        {item.desc && <p className="text-iq-text-secondary text-xs mt-0.5">{item.desc}</p>}
                        <span className="text-[10px] text-iq-text-secondary/50 block mt-1">{item.time}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
