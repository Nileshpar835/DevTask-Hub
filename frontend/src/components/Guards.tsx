import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../context/useAuth";

export function ProtectedRoute() {
    const { user, loading } = useAuth();
    const location = useLocation();
    if (loading) return <p className="page-state">Restoring session</p>;
    if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    return <Outlet />;
}

export function RequireRole({ role }: { role: "Admin" }) {
    const { user, loading } = useAuth();
    if (loading) return <p className="page-state">Loading...</p>;
    if (!user) return <Navigate to="/login" replace />;
    if (user.role !== role) return <Navigate to="/403" replace />;
    return <Outlet />;
}