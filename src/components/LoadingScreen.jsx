export default function LoadingScreen() {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            background: '#0a0a0a',
            color: '#00ff9d',
        }}>
            <div style={{ textAlign: 'center' }}>
                <div className="spinner" style={{
                    width: '50px',
                    height: '50px',
                    border: '3px solid rgba(0, 255, 157, 0.2)',
                    borderTop: '3px solid #00ff9d',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 20px',
                }}></div>
                <p>Loading...</p>
            </div>
        </div>
    );
}
