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
        setStatus('Checking access...');
        const intendedRole = localStorage.getItem('intended_role');

        // If no intended role (direct login), just route them
        if (!intendedRole) {
            routeToDashboard(profile);
            return;
        }

        // Admin override
        if (profile.role === 'admin') {
            localStorage.removeItem('intended_role');
            navigate('/admin/dashboard', { replace: true });
            return;
        }

        // Role mismatch check
        if (profile.role && profile.role !== intendedRole) {
            // Show modal logic
            setStatus('Access Denied');
            setRoleMismatch({
                actual: profile.role,
                intended: intendedRole
            });
            return;
        }

        // Onboarding check
        if (!profile.username || !profile.accepted_covenant) {
            navigate('/onboarding', { replace: true });
            return;
        }

        // Success redirect
        routeToDashboard(profile);
    }

    function routeToDashboard(profile) {
        localStorage.removeItem('intended_role');
        if (profile.role === 'hunter') {
            navigate('/hunter/dashboard', { replace: true });
        } else {
            navigate('/payer/dashboard', { replace: true });
        }
    }

    const [roleMismatch, setRoleMismatch] = useState(null);

    if (roleMismatch) {
        return (
            <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
                <div className="bg-[#111] border border-red-500/30 rounded-2xl p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Wrong Account Type</h2>
                    <p className="text-gray-400 mb-8">
                        This email is registered as a <span className="text-white font-bold uppercase">{roleMismatch.actual}</span>.
                        <br />
                        You assume the wrong role.
                    </p>

                    <div className="space-y-3">
                        <button
                            onClick={() => routeToDashboard({ role: roleMismatch.actual })}
                            className="w-full py-3 bg-[#10B981] text-black font-bold rounded-xl hover:scale-105 transition-transform"
                        >
                            Go to {roleMismatch.actual === 'hunter' ? 'Hunter Dashboard' : 'Payer Dashboard'}
                        </button>

                        <button
                            onClick={async () => {
                                await supabase.auth.signOut();
                                navigate('/');
                            }}
                            className="w-full py-3 bg-white/5 text-gray-400 font-bold rounded-xl hover:bg-white/10 transition-colors"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <LoadingScreen message={status} />
    );
}
