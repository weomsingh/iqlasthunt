import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import AuthCallback from './pages/AuthCallback';
import OnboardingPage from './pages/OnboardingPage';

// Hunter pages
import HunterLayout from './pages/hunter/HunterLayout';
import HunterArena from './pages/hunter/Arena';
import HunterDashboard from './pages/hunter/Dashboard';
import HunterVault from './pages/hunter/Vault';
import HunterWarRoom from './pages/hunter/WarRoom';
import BountyDetails from './pages/hunter/BountyDetails';
import HunterSettings from './pages/hunter/Settings';
import HunterLeaderboard from './pages/hunter/Leaderboard';

// Payer pages
import PayerLayout from './pages/payer/PayerLayout';
import PayerDashboard from './pages/payer/Dashboard';
import PayerLiveBounties from './pages/payer/LiveBounties';
import PayerHistory from './pages/payer/History';
import PayerVault from './pages/payer/Vault';
import PayerWarRoom from './pages/payer/WarRoom';
import PostBounty from './pages/payer/PostBounty';
import PayerBountyDetails from './pages/payer/BountyDetails';
import PayerSettings from './pages/payer/Settings';
import PayerWorkReview from './pages/payer/WorkReview';

// Admin pages
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';

// Static pages
import Terms from './pages/static/Terms';
import Privacy from './pages/static/Privacy';
import Contact from './pages/static/Contact';
import Covenant from './pages/static/Covenant';
import PricingGuide from './pages/static/PricingGuide';
import Help from './pages/static/Help';
import RefundPolicy from './pages/static/RefundPolicy';

import './styles/App.css';
import './styles/WarRoom.css';
import './styles/VisualPolish.css';
import './styles/VisualPolish.css';
import './styles/PricingGuide.css';
import ProfileView from './pages/shared/ProfileView';

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />
                    <Route path="/onboarding" element={<OnboardingPage />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/covenant" element={<Covenant />} />
                    <Route path="/pricing" element={<PricingGuide />} />
                    <Route path="/help" element={<Help />} />
                    <Route path="/refund" element={<RefundPolicy />} />

                    {/* Hunter routes - PROTECTED */}
                    <Route
                        path="/hunter"
                        element={
                            <ProtectedRoute allowedRole="hunter">
                                <HunterLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<Navigate to="/hunter/dashboard" replace />} />
                        <Route path="arena" element={<HunterArena />} />
                        <Route path="dashboard" element={<HunterDashboard />} />
                        <Route path="vault" element={<HunterVault />} />
                        <Route path="war-room" element={<HunterWarRoom />} />
                        <Route path="bounty/:id" element={<BountyDetails />} />
                        <Route path="settings" element={<HunterSettings />} />
                        <Route path="profile" element={<ProfileView />} /> {/* NEW */}
                        <Route path="leaderboard" element={<HunterLeaderboard />} />
                    </Route>

                    {/* Payer routes - PROTECTED */}
                    <Route
                        path="/payer"
                        element={
                            <ProtectedRoute allowedRole="payer">
                                <PayerLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<Navigate to="/payer/dashboard" replace />} />
                        <Route path="dashboard" element={<PayerDashboard />} />
                        <Route path="post-bounty" element={<PostBounty />} />
                        <Route path="bounty/:id" element={<PayerBountyDetails />} />
                        <Route path="live-bounties" element={<PayerLiveBounties />} />
                        <Route path="history" element={<PayerHistory />} />
                        <Route path="vault" element={<PayerVault />} />
                        <Route path="war-room" element={<PayerWarRoom />} />
                        <Route path="settings" element={<PayerSettings />} />
                        <Route path="profile" element={<ProfileView />} /> {/* NEW */}
                        <Route path="bounty/:bountyId/review/:submissionId" element={<PayerWorkReview />} />
                    </Route>

                    {/* Admin routes - PROTECTED */}
                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute allowedRole="admin">
                                <AdminLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<Navigate to="/admin/dashboard" replace />} />
                        <Route path="dashboard" element={<AdminDashboard />} />
                    </Route>

                    {/* Catch all */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
