import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

/**
 * Route protection wrapper.
 * Ensures unauthenticated visitors cannot access inner pages (/dashboard, /admin),
 * redirecting them directly to the home landing page ("/").
 */
const ProtectedRoute = ({ children, requireAdmin = false }) => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    // Without login, immediately redirect to home page
    if (!token) {
        return <Navigate to="/" replace />;
    }

    // Admin-only route guard
    if (requireAdmin && role !== 'admin') {
        return <Navigate to="/dashboard" replace />;
    }

    return children ? children : <Outlet />;
};

export default ProtectedRoute;
