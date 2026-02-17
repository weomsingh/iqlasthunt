import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import BottomNav from '../../components/BottomNav';

export default function HunterLayout() {
    return (
        <div className="flex min-h-screen bg-iq-background text-iq-text-primary">
            {/* Sidebar - Desktop */}
            <Sidebar role="hunter" />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 md:ml-64 mb-16 md:mb-0 transition-all duration-300">
                <Header />

                <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
                    <div className="max-w-7xl mx-auto w-full">
                        <Outlet />
                    </div>
                </main>

                <div className="hidden md:block">
                    <Footer />
                </div>
            </div>

            {/* Bottom Nav - Mobile */}
            <BottomNav role="hunter" />
        </div>
    );
}

