import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';
import {
    User, Bell, Shield, CreditCard, Lock, Save,
    Camera, Mail, Phone, MapPin, Globe, Moon, Sun
} from 'lucide-react';

export default function PayerSettings() {
    const { currentUser, refreshUser } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(false);

    // Profile Form State
    const [profileData, setProfileData] = useState({
        username: currentUser?.username || '',
        full_name: currentUser?.full_name || '',
        bio: currentUser?.bio || '',
        website: currentUser?.website || '',
        company: currentUser?.company || ''
    });

    // Preferences State (Mock)
    const [preferences, setPreferences] = useState({
        emailNotifications: true,
        pushNotifications: false,
        theme: 'dark',
        twoFactor: false
    });

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const updates = {
                username: profileData.username.trim(),
                bio: profileData.bio.trim() || null,
                website: profileData.website.trim() || null,
                company: profileData.company.trim() || null,
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', currentUser.id);

            if (error) throw error;
            await refreshUser();
            alert('Profile updated successfully!');
        } catch (error) {
            console.error('Error updating profile:', error);
            alert(`Failed to update profile: ${error.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'payment', label: 'Payment Methods', icon: CreditCard },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'preferences', label: 'Preferences', icon: Moon },
    ];

    return (
        <div className="max-w-4xl mx-auto pb-20 animate-fade-in">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-6">Settings</h1>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar Navigation */}
                <div className="w-full md:w-64 flex-shrink-0">
                    <div className="bg-iq-card border border-white/5 rounded-xl overflow-hidden sticky top-24">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${activeTab === tab.id
                                    ? 'bg-iq-primary/10 text-iq-primary border-r-2 border-iq-primary'
                                    : 'text-iq-text-secondary hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <tab.icon size={18} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1">
                    {activeTab === 'profile' && (
                        <div className="bg-iq-card border border-white/5 rounded-xl p-6 md:p-8 space-y-6">
                            <h2 className="text-xl font-bold text-white mb-4">Profile Information</h2>

                            <div className="flex items-center gap-6 pb-6 border-b border-white/5">
                                <div className="w-20 h-20 rounded-full bg-iq-surface border border-white/10 flex items-center justify-center text-iq-text-secondary overflow-hidden relative group cursor-pointer">
                                    {currentUser?.avatar_url ? (
                                        <img src={currentUser.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={32} />
                                    )}
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Camera size={20} className="text-white" />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">{currentUser?.username}</h3>
                                    <p className="text-sm text-iq-text-secondary">Payer Account</p>
                                </div>
                            </div>

                            <form onSubmit={handleProfileUpdate} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm text-iq-text-secondary">Username</label>
                                    <input
                                        type="text"
                                        value={profileData.username}
                                        onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                                        className="w-full bg-iq-surface border border-white/10 rounded-lg p-3 text-white focus:border-iq-primary focus:outline-none"
                                    />
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm text-iq-text-secondary">Company Name</label>
                                        <input
                                            type="text"
                                            value={profileData.company}
                                            onChange={(e) => setProfileData({ ...profileData, company: e.target.value })}
                                            className="w-full bg-iq-surface border border-white/10 rounded-lg p-3 text-white focus:border-iq-primary focus:outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm text-iq-text-secondary">Website</label>
                                        <input
                                            type="text"
                                            value={profileData.website}
                                            onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                                            className="w-full bg-iq-surface border border-white/10 rounded-lg p-3 text-white focus:border-iq-primary focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm text-iq-text-secondary">Bio</label>
                                    <textarea
                                        value={profileData.bio}
                                        onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                                        rows={4}
                                        className="w-full bg-iq-surface border border-white/10 rounded-lg p-3 text-white focus:border-iq-primary focus:outline-none resize-none"
                                        placeholder="Tell us about your business needs..."
                                    />
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
                                        {loading ? 'Saving...' : <><Save size={18} /> Save Changes</>}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="bg-iq-card border border-white/5 rounded-xl p-6 md:p-8 space-y-6">
                            <h2 className="text-xl font-bold text-white mb-4">Notification Preferences</h2>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-iq-surface rounded-lg border border-white/5">
                                    <div>
                                        <p className="text-white font-medium">Email Notifications</p>
                                        <p className="text-xs text-iq-text-secondary">Receive updates via email</p>
                                    </div>
                                    <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                                        <input type="checkbox" checked={preferences.emailNotifications} onChange={() => setPreferences(p => ({ ...p, emailNotifications: !p.emailNotifications }))} className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 checked:border-iq-primary" style={{ right: preferences.emailNotifications ? '0' : 'auto', left: preferences.emailNotifications ? 'auto' : '0' }} />
                                        <div className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${preferences.emailNotifications ? 'bg-iq-primary' : 'bg-gray-700'}`}></div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-iq-surface rounded-lg border border-white/5">
                                    <div>
                                        <p className="text-white font-medium">Push Notifications</p>
                                        <p className="text-xs text-iq-text-secondary">Receive updates on your device</p>
                                    </div>
                                    <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                                        {/* Mock Toggle Visual */}
                                        <div className="w-10 h-6 bg-white/10 rounded-full relative cursor-pointer">
                                            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Placeholder for other tabs */}
                    {(activeTab !== 'profile' && activeTab !== 'notifications') && (
                        <div className="bg-iq-card border border-white/5 rounded-xl p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
                            <IconForTab tabId={activeTab} />
                            <h3 className="text-xl font-bold text-white mt-4 mb-2">Coming Soon</h3>
                            <p className="text-iq-text-secondary max-w-sm">
                                This section is currently under development. Stay tuned for updates!
                            </p>
                        </div>
                    )}
                </div>
            </div >
        </div >
    );
}

function IconForTab({ tabId }) {
    if (tabId === 'payment') return <CreditCard size={48} className="text-iq-text-secondary opacity-50" />;
    if (tabId === 'security') return <Shield size={48} className="text-iq-text-secondary opacity-50" />;
    return <Moon size={48} className="text-iq-text-secondary opacity-50" />;
}
