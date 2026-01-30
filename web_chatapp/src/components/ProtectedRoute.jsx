import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children, requiredRole }) => {
    const { user } = useAuth();
    const location = useLocation();
    const localUser = localStorage.getItem('user');
    const parsedUser = localUser ? JSON.parse(localUser) : null;
    
    if (!user && !parsedUser) {
        return <Navigate to="/login" replace />;
    }
    
    const currentUser = user || parsedUser;
    
    // Check if user is suspended - redirect to suspended page (except if already on suspended page)
    if (currentUser?.profile?.status === 'Suspended' && location.pathname !== '/suspended') {
        return <Navigate to="/suspended" replace />;
    }
    
    // If user is banned, don't allow access
    if (currentUser?.profile?.status === 'Banned') {
        return <Navigate to="/login" replace />;
    }
    
    if (requiredRole && currentUser.role !== requiredRole) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;