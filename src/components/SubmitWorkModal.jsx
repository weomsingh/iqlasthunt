import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { Upload, FileText, X, AlertCircle, Send, CheckCircle } from 'lucide-react';

export default function SubmitWorkModal({ bounty, onClose, onSuccess }) {
    const { currentUser } = useAuth();
    const [submissionText, setSubmissionText] = useState('');
    const [submissionFile, setSubmissionFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);

    function handleFileChange(e) {
        const file = e.target.files[0];
        if (file) {
            // Check file size (max 50MB)
            if (file.size > 50 * 1024 * 1024) {
                setError('File must be less than 50MB');
                return;
            }
            setSubmissionFile(file);
            setError(null);
        }
    }

    async function uploadSubmissionFile() {
        if (!submissionFile) return null;

        const fileName = `${Date.now()}_${submissionFile.name.replace(/\s+/g, '_')}`;
        const filePath = `submissions/${bounty.id}/${currentUser.id}/${fileName}`;

        const { data, error } = await supabase.storage
            .from('bounty-submissions')
            .upload(filePath, submissionFile);

        if (error) throw error;

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('bounty-submissions')
            .getPublicUrl(filePath);

        return urlData.publicUrl;
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (!submissionText.trim() && !submissionFile) {
            setError('Please provide either submission notes or upload a file');
            return;
        }

        const confirmed = window.confirm(
            `Submit your work for "${bounty.title}"?`
        );

        if (!confirmed) return;

        setUploading(true);
        setError(null);

        try {
            // Upload file if provided
            let fileUrl = null;
            if (submissionFile) {
                fileUrl = await uploadSubmissionFile();
                if (!fileUrl) throw new Error('Failed to upload file');
            }

            // Submit work via RPC
            const { data, error: rpcError } = await supabase.rpc('submit_work', {
                p_bounty_id: bounty.id,
                p_hunter_id: currentUser.id,
                p_submission_text: submissionText.trim() || null,
                p_submission_file_url: fileUrl
            });

            if (rpcError) throw rpcError;

            // Simplified success check - adapt based on actual RPC response
            // Assuming if no error, it succeeded, or data has success flag
            if (data && data.success !== false) {
                alert('✅ Submission successful!\n\nYour work has been submitted for review.');
                onSuccess();
            } else if (data && data.error) {
                throw new Error(data.error);
            } else {
                // Fallback success if RPC returns void or complex object
                onSuccess();
            }
        } catch (err) {
            console.error('Submission error:', err);
            setError(err.message || 'Failed to submit work. Please try again.');
        } finally {
            setUploading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-iq-card border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative">

                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                    <div>
                        <h2 className="text-xl font-bold text-white">Submit Your Work</h2>
                        <p className="text-sm text-iq-text-secondary truncate max-w-md">{bounty.title}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-iq-text-secondary hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl flex items-center gap-3">
                            <AlertCircle size={20} />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    {/* Submission Notes */}
                    <div className="space-y-2">
                        <label htmlFor="submission_text" className="text-sm font-medium text-white flex items-center gap-2">
                            <FileText size={16} className="text-iq-primary" />
                            Submission Notes
                        </label>
                        <textarea
                            id="submission_text"
                            value={submissionText}
                            onChange={(e) => setSubmissionText(e.target.value)}
                            placeholder="Describe your solution, methodology, or include links to external resources (Github, Drive, etc.)..."
                            rows={6}
                            maxLength={2000}
                            className="w-full bg-iq-surface border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-iq-primary placeholder-white/20 resize-none"
                        />
                        <div className="text-right">
                            <small className="text-xs text-iq-text-secondary">{submissionText.length}/2000 characters</small>
                        </div>
                    </div>

                    {/* File Upload */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white flex items-center gap-2">
                            <Upload size={16} className="text-iq-primary" />
                            Upload Deliverables (Optional)
                        </label>

                        <div className="relative group">
                            <input
                                type="file"
                                id="submission_file"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                disabled={uploading}
                            />
                            <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${submissionFile
                                    ? 'border-iq-success/30 bg-iq-success/5'
                                    : 'border-white/10 bg-iq-surface group-hover:border-iq-primary/30 group-hover:bg-white/5'
                                }`}>
                                {submissionFile ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-12 h-12 rounded-full bg-iq-success/20 flex items-center justify-center text-iq-success">
                                            <FileText size={24} />
                                        </div>
                                        <span className="font-medium text-white break-all">{submissionFile.name}</span>
                                        <span className="text-xs text-iq-text-secondary">
                                            {(submissionFile.size / 1024 / 1024).toFixed(2)} MB • Ready to upload
                                        </span>
                                        <button
                                            type="button"
                                            className="text-xs text-iq-error hover:underline mt-2 z-20 relative"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSubmissionFile(null);
                                            }}
                                        >
                                            Remove File
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-iq-text-secondary">
                                        <Upload size={32} className="mb-2 opacity-50" />
                                        <span className="font-medium text-white">Click or drag file to upload</span>
                                        <span className="text-xs">PDF, ZIP, Images, Docs (Max 50MB)</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="bg-iq-primary/5 border border-iq-primary/10 rounded-xl p-4 flex gap-4">
                        <AlertCircle size={20} className="text-iq-primary shrink-0" />
                        <div className="text-xs text-iq-text-secondary space-y-1">
                            <p className="font-bold text-white">Important:</p>
                            <ul className="list-disc pl-4 space-y-0.5">
                                <li>Ensure your work meets all requirements outlined in the Mission Brief.</li>
                                <li>You can only submit <strong>once</strong>. Make it count!</li>
                                <li>Submissions are final and cannot be edited after sending.</li>
                            </ul>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={uploading}
                            className="flex-1 px-6 py-3 rounded-xl border border-white/10 text-white font-medium hover:bg-white/5 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={uploading || (!submissionText.trim() && !submissionFile)}
                            className="flex-[2] px-6 py-3 rounded-xl bg-iq-primary text-black font-bold hover:bg-iq-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-glow"
                        >
                            {uploading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <Send size={18} />
                                    Submit Work
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
