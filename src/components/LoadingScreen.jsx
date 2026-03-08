export default function LoadingScreen({ message = 'Loading...' }) {
    return (
        <div style={{
            position: 'fixed', inset: 0,
            background: '#050814',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: '24px', zIndex: 999,
            backgroundImage: 'radial-gradient(ellipse at 30% 30%, rgba(255,107,53,0.06) 0%, transparent 50%), radial-gradient(ellipse at 70% 70%, rgba(67,97,238,0.06) 0%, transparent 50%)',
        }}>
            <img src="/finallandstrans.png" alt="IQHUNT"
                style={{ height: '56px', width: 'auto', objectFit: 'contain', filter: 'brightness(1.1)', marginBottom: '8px' }} />

            <div style={{
                width: '44px', height: '44px',
                border: '3px solid rgba(255,107,53,0.15)',
                borderTop: '3px solid #FF6B35',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                boxShadow: '0 0 15px rgba(255,107,53,0.2)',
            }} />

            <p style={{
                color: '#8892AA', fontSize: '13px', fontWeight: '600',
                letterSpacing: '0.12em', textTransform: 'uppercase',
                fontFamily: 'Space Grotesk, sans-serif',
            }}>
                {message}
            </p>

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
