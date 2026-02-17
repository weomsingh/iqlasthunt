import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from '../components/LoadingScreen';

export default function AuthCallback() {
    const navigate = useNavigate();
    const { currentUser, loading: authLoading } = useAuth();
    const [status, setStatus] = useState('Verifying login...');

    useEffect(() => {
        let isMounted = true;
        let timeoutId;

        // If AuthContext already has the user, we're done!
        if (currentUser) {
            handleUserRouting(currentUser);
            return;
        }

        // If AuthContext is done loading but no user found, try manual check
        if (!authLoading && !currentUser) {
            handleManualCheck(isMounted);
        }

        // If we've been waiting for AuthContext too long (e.g. 4s), try manual check anyway
        timeoutId = setTimeout(() => {
            if (isMounted && !currentUser) {
                console.warn("AuthContext slow, trying manual check in callback...");
                handleManualCheck(isMounted);
            }
        }, 4000);

        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
        };
    }, [currentUser, authLoading]);

    async function handleManualCheck(isMounted) {
        if (!isMounted) return;

        try {
            setStatus('Finalizing login...');

            // Check session directly from Supabase (this parses the URL hash)
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error) {
                console.error("Manual callback error:", error);
                throw error;
            }

            if (!session) {
                console.warn("No session found in callback, redirecting home.");
                navigate('/', { replace: true });
                return;
            }

            // Session found! Fetch profile.
            setStatus('Setting up profile...');
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            if (profileError && profileError.code !== 'PGRST116') {
                throw profileError;
            }

            if (profile) {
                handleUserRouting(profile);
            } else {
                // New user - redirect to onboarding
                navigate('/onboarding', { replace: true });
            }

        } catch (err) {
            console.error('Callback critical failure:', err);
            // Fallback: wait a bit and go home
            setTimeout(() => navigate('/', { replace: true }), 2000);
        }
    }

    function handleUserRouting(profile) {
        setStatus('Redirecting...');
        const intendedRole = localStorage.getItem('intended_role') || 'hunter';

        // Admin override
        if (profile.role === 'admin') {
            localStorage.removeItem('intended_role');
            navigate('/admin/dashboard', { replace: true });
            return;
        }

        // Role mismatch check (only if profile exists and has role)
        if (profile.role && profile.role !== intendedRole) {
            // We could alert here, but let's just log them in to avoid blocking flow
            console.warn(`Role mismatch: Expected ${intendedRole}, got ${profile.role}`);
        }

        // Onboarding check
        if (!profile.username || !profile.accepted_covenant) {
            navigate('/onboarding', { replace: true });
            return;
        }

        // Success redirect
        localStorage.removeItem('intended_role');
        if (profile.role === 'hunter') {
            navigate('/hunter/dashboard', { replace: true });
        } else {
            navigate('/payer/dashboard', { replace: true });
        }
    }

    return (
        <LoadingScreen message={status} />
    );
}
