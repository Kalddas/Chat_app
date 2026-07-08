import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children, requiredRole }) => {
    const { user } = useAuth();
    const location = useLocation();

    if (!user) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    if (user?.profile?.status === 'Suspended' && location.pathname !== '/suspended') {
        return <Navigate to="/suspended" replace />;
    }

    if (user?.profile?.status === 'Banned') {
        return <Navigate to="/login" replace />;
    }

    if (requiredRole && user.role !== requiredRole) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;
