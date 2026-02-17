import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

export default function AdminLayout() {
    return (
        <div className="flex min-h-screen bg-iq-background text-iq-text-primary">
            {/* Sidebar - Desktop */}
            <Sidebar role="admin" />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 md:ml-64 transition-all duration-300">
                <Header />

                <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
                    <div className="max-w-7xl mx-auto w-full">
                        <Outlet />
                    </div>
                </main>

                <Footer />
            </div>
        </div>
    );
}

