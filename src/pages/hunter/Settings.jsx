import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';
import { User, Shield, Mail, Wallet, Save, CheckCircle, AlertCircle, Loader } from 'lucide-react';

// Simple toast notification helper
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 z-50 flex items-center gap-3 px-6 py-4 rounded-lg shadow-2xl transform transition-all duration-300 ${type === 'success' ? 'bg-green-500 text-white' :
        type === 'error' ? 'bg-red-500 text-white' :
            type === 'warning' ? 'bg-yellow-500 text-white' :
                'bg-blue-500 text-white'
        }`;

    toast.innerHTML = `<span class="font-medium">${message}</span>`;

    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
        toast.style.opacity = '1';
    }, 10);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.transform = 'translateX(400px)';
        toast.style.opacity = '0';
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// Button Component with Loading State
function Button({
    children,
    onClick,
    type = 'button',
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    fullWidth = false,
    className = '',
    ...props
}) {
    const baseStyles = "inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 cursor-pointer";

    const variants = {
        primary: "bg-green-500 hover:bg-green-600 text-white",
        secondary: "bg-gray-700 hover:bg-gray-600 text-white",
        outline: "border-2 border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
    };

    const sizes = {
        sm: "px-4 py-2 text-sm",
        md: "px-6 py-3 text-base",
        lg: "px-8 py-4 text-lg"
    };

    const widthClass = fullWidth ? "w-full" : "";

    const disabledStyles = (disabled || loading)
        ? "opacity-50 cursor-not-allowed pointer-events-none"
        : "";

    return (
        <button
            type={type}
            onClick={!disabled && !loading ? onClick : undefined}
            disabled={disabled || loading}
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${disabledStyles} ${className}`}
            {...props}
        >
            {loading && (
                <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                    />
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                </svg>
            )}
            {children}
        </button>
    );
}

export default function HunterSettings() {
    const { currentUser, refreshUser } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Form states matching the user request
    const [formData, setFormData] = useState({
        walletId: '',
        codename: '',
        expertiseTags: '',
        operativeBio: ''
    });

    useEffect(() => {
        if (currentUser) {
            setFormData({
                walletId: currentUser.id || '',
                codename: currentUser.username || '',
                expertiseTags: currentUser.expertise ? currentUser.expertise.join(', ') : '',
                operativeBio: currentUser.bio || ''
            });
        }
    }, [currentUser]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear any previous errors
        setError('');
        setSuccess(false);
    };

    const handleSave = async (e) => {
        e.preventDefault();

        // Validate
        if (!formData.codename.trim()) {
            setError('Codename is required');
            showToast('Codename is required', 'error');
            return;
        }

        if (!formData.expertiseTags.trim()) {
            setError('At least one expertise tag is required');
            showToast('At least one expertise tag is required', 'error');
            return;
        }

        setIsLoading(true);
        setError('');
        setSuccess(false);

        try {
            // Prepare updates for Supabase
            const updates = {
                id: currentUser.id,
                username: formData.codename,
                bio: formData.operativeBio,
                expertise: formData.expertiseTags.split(',').map(s => s.trim()).filter(Boolean),
                updated_at: new Date(),
                role: 'hunter' // Added role to satisfy DB constraint
            };

            const { error: updateError } = await supabase.from('profiles').upsert(updates);

            if (updateError) throw updateError;

            await refreshUser();

            setSuccess(true);
            showToast('Profile updated successfully!', 'success');
        } catch (err) {
            console.error('Error saving profile:', err);
            setError(err.message || 'Failed to update profile.');
            showToast(err.message || 'Failed to update profile.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto pb-20 animate-fade-in px-4 md:px-0">
            {/* Header */}
            <div className="mb-8 p-8 bg-iq-card border border-white/5 rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-iq-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <h1 className="text-3xl font-bold text-white mb-2 relative z-10">Operative Profile 🛡️</h1>
                <p className="text-iq-text-secondary relative z-10">Manage your identity and security clearance.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Profile Card */}
                <div className="md:col-span-1">
                    <div className="bg-iq-card border border-white/5 rounded-2xl p-6 text-center shadow-lg relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-b from-iq-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="w-24 h-24 mx-auto bg-iq-surface rounded-full flex items-center justify-center text-iq-primary border-2 border-iq-primary/20 mb-4 shadow-glow relative z-10">
                            <User size={40} />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-1 relative z-10">{currentUser?.username || 'Hunter'}</h2>
                        <p className="text-xs text-iq-text-secondary uppercase tracking-widest mb-6 relative z-10">Tier 1 Hunter</p>

                        <div className="text-left space-y-4 relative z-10">
                            <div className="p-3 bg-iq-surface rounded-xl border border-white/5 flex items-center gap-3">
                                <Mail size={16} className="text-iq-text-secondary" />
                                <div className="overflow-hidden">
                                    <p className="text-[10px] text-iq-text-secondary uppercase">Email Encrypted</p>
                                    <p className="text-sm text-white truncate">{currentUser?.email}</p>
                                </div>
                            </div>
                            <div className="p-3 bg-iq-surface rounded-xl border border-white/5 flex items-center gap-3">
                                <Wallet size={16} className="text-iq-text-secondary" />
                                <div>
                                    <p className="text-[10px] text-iq-text-secondary uppercase">Wallet ID</p>
                                    <p className="text-xs text-white font-mono opacity-70 truncate max-w-[150px]">{currentUser?.id}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Settings Form */}
                <div className="md:col-span-2">
                    <div className="bg-iq-card border border-white/5 rounded-2xl p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <Shield className="w-6 h-6 text-green-400" />
                            <h2 className="text-2xl font-bold text-white">Profile Details</h2>
                        </div>

                        <form onSubmit={handleSave}>
                            {/* Wallet ID */}
                            <div className="mb-6">
                                <label className="block text-sm text-iq-text-secondary mb-2">Wallet ID</label>
                                <input
                                    type="text"
                                    name="walletId"
                                    value={formData.walletId}
                                    readOnly
                                    disabled
                                    className="w-full bg-[#141922] border border-gray-700 rounded-lg px-4 py-3 text-white opacity-60 cursor-not-allowed"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Your unique wallet identifier (Not editable)
                                </p>
                            </div>

                            {/* Codename (Username) */}
                            <div className="mb-6">
                                <label className="block text-sm text-iq-text-secondary mb-2">Codename (Username)</label>
                                <input
                                    type="text"
                                    name="codename"
                                    value={formData.codename}
                                    onChange={handleChange}
                                    placeholder="HunterWeom"
                                    required
                                    minLength={3}
                                    maxLength={50}
                                    className="w-full bg-[#141922] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-colors"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Your display name on the platform
                                </p>
                            </div>

                            {/* Expertise Tags */}
                            <div className="mb-6">
                                <label className="block text-sm text-iq-text-secondary mb-2">Expertise Tags (Comma separated)</label>
                                <input
                                    type="text"
                                    name="expertiseTags"
                                    value={formData.expertiseTags}
                                    onChange={handleChange}
                                    placeholder="UI/UX Design, React Development"
                                    required
                                    className="w-full bg-[#141922] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-colors"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Your skills and expertise areas
                                </p>
                            </div>

                            {/* Operative Bio */}
                            <div className="mb-6">
                                <label className="block text-sm text-iq-text-secondary mb-2">Operative Bio</label>
                                <textarea
                                    name="operativeBio"
                                    value={formData.operativeBio}
                                    onChange={handleChange}
                                    placeholder="I'm founder"
                                    rows={4}
                                    maxLength={500}
                                    className="w-full bg-[#141922] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-colors resize-none"
                                />
                                <div className="flex justify-between items-center mt-1">
                                    <p className="text-xs text-gray-500">
                                        Tell others about yourself
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {formData.operativeBio.length}/500
                                    </p>
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="mb-6 bg-red-900/20 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-semibold text-red-400">Error</p>
                                        <p className="text-sm text-red-300">{error}</p>
                                    </div>
                                </div>
                            )}

                            {/* Success Message */}
                            {success && (
                                <div className="mb-6 bg-green-900/20 border border-green-500/30 rounded-lg p-4 flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-semibold text-green-400">Success!</p>
                                        <p className="text-sm text-green-300">Profile updated successfully</p>
                                    </div>
                                </div>
                            )}

                            {/* Save Button */}
                            <div className="mt-8">
                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="lg"
                                    fullWidth
                                    disabled={isLoading}
                                    loading={isLoading}
                                    className="bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg py-4 transition-all"
                                >
                                    {isLoading ? 'Saving...' : success ? 'Saved!' : 'Save Changes'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
