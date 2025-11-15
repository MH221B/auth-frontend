import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthProvider";

function decodeJwtPayload(token: string | null): any | null {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = parts[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

const HomePage: React.FC = () => {
  const { accessToken, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const payload = React.useMemo(() => decodeJwtPayload(accessToken), [accessToken]);
  const roles: string[] = Array.isArray(payload?.roles)
    ? payload.roles
    : payload?.roles
    ? [payload.roles]
    : [];

  const showAdmin = roles.includes("ADMIN");
  const email = payload?.username ?? payload?.sub ?? null;

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="w-full border-b bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center">
          <Link to="/" className="text-xl font-semibold">Auth</Link>
          <div className="ml-auto flex items-center gap-2">
            {showAdmin && (
              <Button asChild variant="ghost">
                <Link to="/admin">Admin</Link>
              </Button>
            )}
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="text-sm text-muted-foreground">Signed in as {email ?? 'User'}</div>
                <Button variant="outline" className="text-primary" onClick={handleLogout}>Logout</Button>
              </div>
            ) : (
              <Button asChild variant="outline">
                <Link to="/login" className="text-primary">Login</Link>
              </Button>
            )}
          </div>
        </div>
      </nav>
      <main className="flex-1" />
    </div>
  );
};

export default HomePage;
