// AuthCallback.jsx - With Firebase, Google auth uses popup (not redirect).
// This page handles any redirect-based flows if needed, but mainly
// just checks currentUser and routes accordingly.

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthCallback() {
    const navigate = useNavigate();
    const { currentUser, loading } = useAuth();

    useEffect(() => {
        if (loading) return;

        if (currentUser) {
            if (!currentUser.is_onboarded && !currentUser.accepted_covenant) {
                navigate('/onboarding', { replace: true });
                return;
            }
            if (currentUser.role === 'admin') navigate('/admin/dashboard', { replace: true });
            else if (currentUser.role === 'hunter') navigate('/hunter/dashboard', { replace: true });
            else if (currentUser.role === 'payer') navigate('/payer/dashboard', { replace: true });
            else navigate('/onboarding', { replace: true });
        } else {
            navigate('/', { replace: true });
        }
    }, [currentUser, loading, navigate]);

    return (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            minHeight: '100vh', background: '#050814',
            flexDirection: 'column', gap: '20px',
        }}>
            <div style={{
                width: '50px', height: '50px',
                border: '3px solid rgba(255,107,53,0.15)',
                borderTop: '3px solid #FF6B35',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
            }} />
            <p style={{ color: '#FF6B35', fontFamily: 'Space Grotesk', fontWeight: '700', letterSpacing: '0.1em', fontSize: '14px' }}>
                SETTING UP YOUR ACCOUNT
            </p>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
