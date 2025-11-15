import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
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

const AdminPage: React.FC = () => {
  const { accessToken, logout } = useAuth();
  const navigate = useNavigate();

  const payload = React.useMemo(() => decodeJwtPayload(accessToken), [accessToken]);
  const roles: string[] = Array.isArray(payload?.roles) ? payload.roles : payload?.roles ? [payload.roles] : [];
  const email: string | undefined = payload?.username ?? payload?.sub ?? undefined;

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
          <div className="text-xl font-semibold">Admin</div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate('/')}>Home</Button>
            <Button onClick={handleLogout}>Logout</Button>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>

        <section className="mb-6">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Account</CardTitle>
                <CardDescription>Currently signed-in user</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <div className="text-sm text-muted-foreground">Email</div>
                  <div className="font-medium">{email ?? 'Unknown user'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Roles</div>
                  <div className="font-medium">{roles.length ? roles.join(', ') : 'None'}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <h2 className="text-lg font-semibold">Roles</h2>
          <div className="mt-2">
            {roles.length === 0 ? (
              <p>No roles present in token.</p>
            ) : (
              <ul className="list-disc pl-6">
                {roles.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminPage;
