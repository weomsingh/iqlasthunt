import { Outlet } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import BottomNav from '../../components/BottomNav';

export default function HunterLayout() {
    return (
        <div style={{ minHeight: '100vh', background: '#080B14', display: 'flex', flexDirection: 'column' }}>
            {/* Main Content Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Header />

                <main style={{
                    flex: 1,
                    padding: '24px 16px 100px',
                    maxWidth: '1280px',
                    margin: '0 auto',
                    width: '100%',
                }}>
                    {/* Responsive padding */}
                    <style>{`
                        @media (min-width: 768px) {
                            .hunter-main { padding: 32px 24px 48px !important; }
                        }
                        @media (min-width: 1024px) {
                            .hunter-main { padding: 40px 32px 60px !important; }
                        }
                    `}</style>
                    <div className="hunter-main">
                        <Outlet />
                    </div>
                </main>

                <div className="hidden md:block">
                    <Footer />
                </div>
            </div>

            {/* Bottom Nav - Mobile only */}
            <BottomNav role="hunter" />
        </div>
    );
}
