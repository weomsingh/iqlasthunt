import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from './LoadingScreen';

export default function ProtectedRoute({ children, allowedRole }) {
    const { currentUser, loading } = useAuth();

    if (loading) {
        return <LoadingScreen />;
    }

    if (!currentUser) {
        return <Navigate to="/" replace />;
    }

    if (currentUser.role !== allowedRole) {
        const correctPath = currentUser.role === 'hunter'
            ? '/hunter/arena'
            : '/payer/dashboard';
        return <Navigate to={correctPath} replace />;
    }

    return children;
}
