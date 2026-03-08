import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    signInWithPopup, signOut as firebaseSignOut,
    onAuthStateChanged
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { getProfile, createProfile } from '../lib/firebaseService';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(() => {
        try {
            const savedUser = localStorage.getItem('iqhunt_user');
            const expiry = localStorage.getItem('iqhunt_expiry');
            if (savedUser && expiry && Date.now() < parseInt(expiry)) {
                return JSON.parse(savedUser);
            }
            return null;
        } catch {
            return null;
        }
    });
    const [loading, setLoading] = useState(!currentUser);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                await loadProfile(firebaseUser);
            } else {
                setCurrentUser(null);
                localStorage.removeItem('iqhunt_user');
                localStorage.removeItem('iqhunt_expiry');
                setLoading(false);
            }
        });

        return unsubscribe;
    }, []);

    async function loadProfile(firebaseUser, retries = 0) {
        try {
            let profile = await getProfile(firebaseUser.uid);

            if (!profile) {
                // New user — create a basic profile
                profile = await createProfile(firebaseUser.uid, {
                    email: firebaseUser.email,
                    full_name: firebaseUser.displayName || '',
                    avatar_url: firebaseUser.photoURL || '',
                    username: firebaseUser.displayName?.split(' ')[0]?.toLowerCase() || firebaseUser.email?.split('@')[0] || 'hunter',
                    role: localStorage.getItem('intended_role') || null,
                });
                profile = { ...profile, id: firebaseUser.uid };
            }

            setCurrentUser(profile);
            localStorage.setItem('iqhunt_user', JSON.stringify(profile));
            localStorage.setItem('iqhunt_expiry', (Date.now() + 7 * 24 * 60 * 60 * 1000).toString());
        } catch (err) {
            console.error('Profile load error:', err);
            if (retries < 3) {
                setTimeout(() => loadProfile(firebaseUser, retries + 1), 1000);
                return;
            }
        } finally {
            setLoading(false);
        }
    }

    async function signInWithGoogle(intendedRole) {
        try {
            localStorage.setItem('intended_role', intendedRole);
            const result = await signInWithPopup(auth, googleProvider);
            // onAuthStateChanged will handle profile loading
            return result;
        } catch (err) {
            if (err.code === 'auth/popup-closed-by-user') return;
            console.error('Google Sign In error:', err);
            throw err;
        }
    }

    async function signOut() {
        await firebaseSignOut(auth);
        setCurrentUser(null);
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/';
    }

    async function refreshUser() {
        if (!auth.currentUser) return;
        await loadProfile(auth.currentUser);
    }

    const value = {
        currentUser,
        loading,
        signInWithGoogle,
        signOut,
        refreshUser,
        refetchProfile: refreshUser,
    };

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #050814 0%, #0a0f1e 50%, #050814 100%)',
                flexDirection: 'column',
                gap: '20px',
            }}>
                <div style={{
                    width: '60px',
                    height: '60px',
                    border: '3px solid rgba(255,107,53,0.2)',
                    borderTop: '3px solid #FF6B35',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                }} />
                <div style={{
                    fontFamily: 'Space Grotesk, sans-serif',
                    color: '#FF6B35',
                    fontSize: '16px',
                    fontWeight: '700',
                    letterSpacing: '0.1em',
                }}>INITIALIZING IQHUNT</div>
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    return useContext(AuthContext);
}
