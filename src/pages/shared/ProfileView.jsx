import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';
import { User, MapPin, Globe, Calendar, Link as LinkIcon, Building } from 'lucide-react';

export default function ProfileView() {
    const { currentUser } = useAuth();
    // In a real app, we might fetch by ID from URL params (e.g. /profile/:id)
    // For "My Profile", we just use currentUser.

    // Check role to decide what to show
    const isPayer = currentUser?.role === 'payer';

    if (!currentUser) return <div className="p-8 text-white">Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto pb-20 animate-fade-in space-y-8">
            {/* Header / Cover */}
            <div className="relative h-48 md:h-64 rounded-2xl overflow-hidden bg-gradient-to-r from-iq-primary/20 to-purple-500/20 border border-white/5">
                <div className="absolute inset-0 bg-black/20" />
            </div>

            {/* Profile Info */}
            <div className="relative px-6 md:px-10 -mt-20">
                <div className="flex flex-col md:flex-row items-end md:items-end gap-6">
                    {/* Avatar */}
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-iq-card border-4 border-iq-background flex items-center justify-center text-iq-text-secondary overflow-hidden shadow-2xl">
                        {currentUser.avatar_url ? (
                            <img src={currentUser.avatar_url} alt={currentUser.username} className="w-full h-full object-cover" />
                        ) : (
                            <User size={64} />
                        )}
                    </div>

                    {/* Name & Headline */}
                    <div className="flex-1 mb-2">
                        <h1 className="text-3xl md:text-4xl font-bold text-white">{currentUser.username}</h1>
                        <div className="flex items-center gap-3 text-iq-text-secondary mt-1">
                            <span className="capitalize px-2 py-0.5 rounded bg-white/5 border border-white/10 text-xs">
                                {currentUser.role}
                            </span>
                            {isPayer && currentUser.company && (
                                <span className="flex items-center gap-1 text-sm">
                                    <Building size={14} /> {currentUser.company}
                                </span>
                            )}
                            {currentUser.location && (
                                <span className="flex items-center gap-1 text-sm">
                                    <MapPin size={14} /> {currentUser.location || 'Global'}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Action */}
                    <div className="mb-4">
                        <button className="btn-secondary px-6">Edit Profile</button>
                    </div>
                </div>
            </div>

            {/* Details Grid */}
            <div className="grid md:grid-cols-3 gap-8 px-2">
                {/* Left Col: About */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-iq-card border border-white/5 rounded-xl p-6">
                        <h2 className="text-xl font-bold text-white mb-4">About</h2>
                        <p className="text-iq-text-secondary leading-relaxed whitespace-pre-line">
                            {currentUser.bio || "No bio provided yet."}
                        </p>
                    </div>

                    {/* Unique Section based on Role */}
                    {!isPayer && (
                        <div className="bg-iq-card border border-white/5 rounded-xl p-6">
                            <h2 className="text-xl font-bold text-white mb-4">Expertise</h2>
                            <div className="flex flex-wrap gap-2">
                                {(currentUser.expertise || currentUser.expertise_tags || ['None']).map(tag => (
                                    <span key={tag} className="px-3 py-1 bg-iq-surface text-iq-text-secondary rounded-lg text-sm border border-white/5">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Col: Stats/Info */}
                <div className="space-y-6">
                    <div className="bg-iq-card border border-white/5 rounded-xl p-6 space-y-4">
                        <h3 className="text-sm font-bold text-iq-text-secondary uppercase tracking-wider mb-2">Details</h3>

                        <div className="flex items-center gap-3 text-sm text-gray-300">
                            <Calendar size={18} className="text-iq-primary" />
                            <span>Joined {new Date(currentUser.created_at || Date.now()).toLocaleDateString()}</span>
                        </div>

                        {currentUser.website && (
                            <div className="flex items-center gap-3 text-sm text-gray-300">
                                <Globe size={18} className="text-iq-primary" />
                                <a href={currentUser.website} target="_blank" rel="noopener noreferrer" className="hover:text-iq-primary truncate">
                                    {currentUser.website}
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
