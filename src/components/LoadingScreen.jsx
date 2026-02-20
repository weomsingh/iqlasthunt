export default function LoadingScreen() {
    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: '#080B14',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '24px',
            zIndex: 999,
        }}>
            {/* Logo */}
            <img
                src="/finallandstrans.png"
                alt="IQHUNT"
                style={{ height: '64px', width: 'auto', objectFit: 'contain', marginBottom: '8px' }}
            />

            {/* Spinner */}
            <div style={{
                width: '48px', height: '48px',
                border: '3px solid rgba(0,255,148,0.15)',
                borderTop: '3px solid #00FF94',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
            }} />

            <p style={{
                color: '#8892AA',
                fontSize: '14px',
                fontWeight: '500',
                letterSpacing: '0.08em',
            }}>
                Loading...
            </p>

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
