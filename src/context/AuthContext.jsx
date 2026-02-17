import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        // Function to check session explicitly via getSession
        const initializeAuth = async () => {
            try {
                // If we are already loading via onAuthStateChange, wait a bit
                // But generally getSession is the source of truth
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    console.error("Initial session check error:", error);
                    // Don't kill loading yet, let onAuthStateChange handle it or timeout
                }

                if (session?.user) {
                    console.log("✅ Initial session found via getSession");
                    await fetchProfile(session.user.id);
                } else {
                    // If getSession says no session, it might be right.
                    // But onAuthStateChange(INITIAL_SESSION) is the final authority.
                    // We'll let the event listener handle the "no session" state if it fires.
                    // But just in case it doesn't fire (race condition), we set a fallback.
                    console.log("ℹ️ No session found via getSession");
                }
            } catch (err) {
                console.error("Auth init exception:", err);
            }
        };

        // Initialize listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (!isMounted) return;

                console.log('Auth event:', event);

                if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
                    if (session?.user) {
                        // If we have a session, ensure profile is loaded
                        // Only fetch if ID changed to prevent loops/duplicate fetches
                        if (currentUser?.id !== session.user.id) {
                            await fetchProfile(session.user.id);
                        } else {
                            // User already loaded, ensure loading is off
                            setLoading(false);
                        }
                    } else {
                        // If INITIAL_SESSION fires with no session, user is definitely logged out
                        if (event === 'INITIAL_SESSION') {
                            setLoading(false);
                        }
                    }
                } else if (event === 'SIGNED_OUT') {
                    setCurrentUser(null);
                    setLoading(false);
                }
            }
        );

        // Run explicit check as backup
        initializeAuth();

        // Safety timeout: If nothing happens in 3 seconds, turn off loading
        const timeoutId = setTimeout(() => {
            if (loading && isMounted) {
                console.warn("⚠️ Auth timeout reached - forcing loading false");
                setLoading(false);
            }
        }, 3000);

        return () => {
            isMounted = false;
            subscription.unsubscribe();
            clearTimeout(timeoutId);
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    async function fetchProfile(userId, retryCount = 0) {
        try {
            console.log(`Fetching profile for: ${userId} (Attempt ${retryCount + 1})`);

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Profile fetch error:', error);

                // If connection error, retry
                if (retryCount < 3 && error.code !== 'PGRST116') {
                    console.log(`Retrying profile fetch in 1s...`);
                    setTimeout(() => fetchProfile(userId, retryCount + 1), 1000);
                    return;
                }

                // If profile genuinely missing (new user?)
                if (error.code === 'PGRST116') {
                    // Maybe redirect to onboarding? For now, just stop loading.
                    console.warn("Profile missing for user");
                }
            } else {
                console.log('✅ Profile loaded:', data.username);
                setCurrentUser(data);
            }
        } catch (error) {
            console.error('Profile fetch exception:', error);
        } finally {
            // ALWAYS turn off loading after an attempt
            setLoading(false);
        }
    }

    async function signInWithGoogle(intendedRole) {
        localStorage.setItem('intended_role', intendedRole);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
        if (error) throw error;
    }

    async function signOut() {
        await supabase.auth.signOut();
        setCurrentUser(null);
        localStorage.removeItem('intended_role');
        window.location.href = '/';
    }

    const value = {
        currentUser,
        loading,
        signInWithGoogle,
        signOut,
        refetchProfile: () => currentUser && fetchProfile(currentUser.id),
        refreshUser: () => currentUser && fetchProfile(currentUser.id),
    };

    // Show loading screen only for first 3 seconds max
    if (loading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                background: '#0a0a0a',
                color: '#00ff9d',
                fontSize: '1.5rem',
                flexDirection: 'column',
                gap: '1rem',
                fontFamily: 'monospace'
            }}>
                <div className="spinner"></div>
                <div>Initializing...</div>
            </div>
        );
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    return useContext(AuthContext);
}
