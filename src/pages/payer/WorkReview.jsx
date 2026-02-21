import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';
import {
    FileText, CheckCircle, XCircle, AlertCircle, Download,
    Star, MessageSquare, ArrowLeft, ShieldCheck
} from 'lucide-react';

export default function WorkReview() {
    const { bountyId, submissionId } = useParams();
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const [submission, setSubmission] = useState(null);
    const [bounty, setBounty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [reviewNotes, setReviewNotes] = useState('');
    const [rating, setRating] = useState(5);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, [bountyId, submissionId]);

    async function loadData() {
        try {
            // Load Bounty
            const { data: bData, error: bError } = await supabase
                .from('bounties')
                .select('*')
                .eq('id', bountyId)
                .single();

            if (bError) throw bError;
            setBounty(bData);

            // Load Submission
            const { data: sData, error: sError } = await supabase
                .from('submissions')
                .select(`
                    *,
                    hunter:profiles(*)
                `)
                .eq('id', submissionId)
                .single();

            if (sError) throw sError;
            setSubmission(sData);

        } catch (error) {
            console.error(error);
            navigate('/payer/dashboard');
        } finally {
            setLoading(false);
        }
    }

    const handleApprove = async () => {
        if (!window.confirm('Approve this work and release funds to the hunter?')) return;
        setIsSubmitting(true);
        try {
            // 1. Call RPC to select winner/complete bounty (if not already)
            // Ideally, this should be a focused RPC for approving work.
            // For now, we simulate 'select_winner' logic or 'complete_bounty'.
            // Assuming 'select_winner' was done BEFORE work started? 
            // OR if this IS the selection process (Contest mode):

            const { error } = await supabase.rpc('select_winner', {
                p_bounty_id: bountyId,
                p_winner_id: submission.hunter_id
            });

            if (error) throw error;

            alert('Work Approved! Funds released.');
            navigate('/payer/dashboard');
        } catch (error) {
            console.error(error);
            alert('Error approving work: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRequestChanges = () => {
        alert('Change request sent to hunter (mock)');
    };

    if (loading) return <div className="flex justify-center items-center h-screen"><div className="spinner"></div></div>;
    if (!submission || !bounty) return null;

    return (
        <div className="max-w-5xl mx-auto pb-20 animate-fade-in px-4 md:px-0">
            {/* Header */}
            <div className="py-6 flex items-center justify-between">
                <button onClick={() => navigate(-1)} className="text-iq-text-secondary hover:text-white flex items-center gap-2">
                    <ArrowLeft size={18} /> Back
                </button>
                <h1 className="text-xl font-bold text-white">Review Submission</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content: Work Display */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Submission Viewer */}
                    <div className="bg-iq-card border border-white/5 rounded-xl overflow-hidden">
                        <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
                            <h2 className="font-bold text-white flex items-center gap-2">
                                <FileText size={18} /> Submitted Work
                            </h2>
                            <a href={submission.submission_file_url} target="_blank" rel="noopener noreferrer" className="text-iq-primary text-sm hover:underline flex items-center gap-1">
                                <Download size={14} /> Download Original
                            </a>
                        </div>
                        <div className="bg-black/40 min-h-[400px] flex items-center justify-center p-8">
                            {/* Mock Preview based on file type */}
                            {submission.submission_file_url?.endsWith('.jpg') || submission.submission_file_url?.endsWith('.png') ? (
                                <img src={submission.submission_file_url} alt="Submission" className="max-w-full rounded shadow-lg" />
                            ) : (
                                <div className="text-center">
                                    <FileText size={48} className="mx-auto text-iq-text-secondary mb-4" />
                                    <p className="text-white">Document Preview Unavailable</p>
                                    <p className="text-iq-text-secondary text-sm">Please download to view</p>
                                </div>
                            )}
                        </div>
                        <div className="p-6">
                            <h3 className="text-sm font-bold text-white mb-2">Hunter's Notes</h3>
                            <p className="text-iq-text-secondary text-sm leading-relaxed">
                                {submission.submission_text || "No notes provided."}
                            </p>
                        </div>
                    </div>

                    {/* Quality Standards Banner */}
                    <div style={{
                        borderRadius: '16px',
                        padding: '20px 24px',
                        background: 'rgba(139, 92, 246, 0.06)',
                        border: '1px solid rgba(139, 92, 246, 0.2)',
                        display: 'flex',
                        gap: '16px',
                        alignItems: 'center',
                    }}>
                        <div style={{
                            width: '44px', height: '44px', borderRadius: '12px',
                            background: 'rgba(139, 92, 246, 0.15)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>
                            <ShieldCheck size={22} style={{ color: '#8B5CF6' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <h3 style={{ color: '#F0F4FF', fontWeight: '800', fontSize: '14px', marginBottom: '4px', fontFamily: 'Space Grotesk' }}>Review Guidelines</h3>
                            <p style={{ color: '#9CA3AF', fontSize: '13px', lineHeight: 1.5 }}>
                                Review the submission carefully against your brief. Check that all deliverables are included and of acceptable quality before making your decision.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Sidebar: Decision & Checklist */}
                <div className="space-y-6">
                    {/* Hunter Card */}
                    <div className="bg-iq-card border border-white/5 rounded-xl p-6 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-lg">
                            {submission.hunter.username.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <h3 className="font-bold text-white">{submission.hunter.username}</h3>
                            <p className="text-xs text-iq-text-secondary">Submitted {new Date(submission.created_at).toLocaleDateString()}</p>
                        </div>
                        <button className="ml-auto p-2 hover:bg-white/5 rounded-lg text-iq-text-secondary">
                            <MessageSquare size={18} />
                        </button>
                    </div>

                    {/* Review Checklist */}
                    <div className="bg-iq-card border border-white/5 rounded-xl p-6">
                        <h3 className="font-bold text-white mb-4">Review Checklist</h3>
                        <div className="space-y-3">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className="w-5 h-5 rounded border border-white/20 flex items-center justify-center group-hover:border-iq-primary transition-colors">
                                    <input type="checkbox" className="appearance-none" />
                                    <CheckCircle size={14} className="opacity-0 check-icon text-iq-primary" />
                                </div>
                                <span className="text-sm text-iq-text-secondary">Meets all requirements</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className="w-5 h-5 rounded border border-white/20 flex items-center justify-center group-hover:border-iq-primary transition-colors">
                                    <input type="checkbox" className="appearance-none" />
                                    <CheckCircle size={14} className="opacity-0 check-icon text-iq-primary" />
                                </div>
                                <span className="text-sm text-iq-text-secondary">Files are accessible</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className="w-5 h-5 rounded border border-white/20 flex items-center justify-center group-hover:border-iq-primary transition-colors">
                                    <input type="checkbox" className="appearance-none" />
                                    <CheckCircle size={14} className="opacity-0 check-icon text-iq-primary" />
                                </div>
                                <span className="text-sm text-iq-text-secondary">Quality is acceptable</span>
                            </label>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="bg-iq-card border border-white/5 rounded-xl p-6 space-y-4">
                        <h3 className="font-bold text-white">Decision</h3>

                        <div className="flex flex-col gap-3">
                            <textarea
                                placeholder="Add review notes (optional)..."
                                className="w-full bg-iq-surface border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-iq-primary"
                                rows={3}
                                value={reviewNotes}
                                onChange={e => setReviewNotes(e.target.value)}
                            />

                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm text-iq-text-secondary">Rating:</span>
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <Star
                                            key={s}
                                            size={16}
                                            className={`cursor-pointer ${s <= rating ? 'text-yellow-500 fill-yellow-500' : 'text-white/20'}`}
                                            onClick={() => setRating(s)}
                                        />
                                    ))}
                                </div>
                            </div>

                            <button onClick={handleApprove} disabled={isSubmitting} className="btn-primary w-full py-3 flex justify-center items-center gap-2">
                                <CheckCircle size={18} /> Approve & Release Funds
                            </button>

                            <button onClick={handleRequestChanges} className="btn-secondary w-full py-3 flex justify-center items-center gap-2 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/10">
                                <AlertCircle size={18} /> Request Changes
                            </button>
                        </div>

                        <p className="text-xs text-center text-iq-text-secondary mt-4">
                            By approving, funds in escrow will be immediately released to the hunter.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
