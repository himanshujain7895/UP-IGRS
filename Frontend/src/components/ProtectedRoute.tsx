/**
 * Protected Route Component
 * Protects routes requiring authentication/admin access
 */

import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireOfficer?: boolean;
  allowOfficer?: boolean; // Allow both admin and officer
}

const LoadingSpinner: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100">
    <div className="text-center">
      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
  requireOfficer = false,
  allowOfficer = false,
}) => {
  const { user, loading, isAdmin, isOfficer, isAuthenticated, error } =
    useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to appropriate dashboard after login
  useEffect(() => {
    if (isAuthenticated) {
      if (location.pathname === "/admin" && isAdmin) {
        navigate("/admin/dashboard", { replace: true });
      } else if (location.pathname === "/officer" && isOfficer) {
        navigate("/officer", { replace: true });
      } else if (location.pathname === "/admin" && isOfficer) {
        // Officer trying to access admin - redirect to officer panel
        navigate("/officer", { replace: true });
      } else if (location.pathname === "/officer" && isAdmin) {
        // Admin trying to access officer - redirect to admin panel
        navigate("/admin/dashboard", { replace: true });
      }
    }
  }, [isAuthenticated, isAdmin, isOfficer, location.pathname, navigate]);

  // Show error toast if login fails
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user || !isAuthenticated) {
    navigate("/login", { state: { from: location.pathname }, replace: true });
    return null;
  }

  // Check role requirements
  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <CardTitle className="text-2xl font-bold">Access Denied</CardTitle>
            <CardDescription>
              You don't have admin privileges to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Current user: {user.email} ({user.role})
            </p>
            <p className="text-xs text-muted-foreground">
              Only admin users can access this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (requireOfficer && !isOfficer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <CardTitle className="text-2xl font-bold">Access Denied</CardTitle>
            <CardDescription>
              You don't have officer privileges to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Current user: {user.email} ({user.role})
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (allowOfficer && !isAdmin && !isOfficer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <CardTitle className="text-2xl font-bold">Access Denied</CardTitle>
            <CardDescription>
              You need admin or officer privileges to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Current user: {user.email} ({user.role})
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
