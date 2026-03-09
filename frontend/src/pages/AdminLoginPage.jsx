import { useState } from "react";
import { LockKeyhole } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { api, setAuthToken } from "@/lib/api";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);

  const login = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await api.post("/admin/login", form);
      setAuthToken(response.data.access_token);
      toast.success("Welcome to the admin dashboard.");
      navigate("/admin");
    } catch {
      toast.error("Invalid admin credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12" data-testid="admin-login-page">
      <Card className="w-full max-w-md border-border shadow-sm">
        <CardHeader className="space-y-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary grid place-content-center" data-testid="admin-login-icon">
            <LockKeyhole size={18} />
          </div>
          <CardTitle className="text-3xl" data-testid="admin-login-heading">
            Admin Login
          </CardTitle>
          <p className="text-sm text-muted-foreground" data-testid="admin-login-subheading">
            Access review queue, underwriting rules, and override decisions.
          </p>
        </CardHeader>

        <CardContent>
          <form className="space-y-5" onSubmit={login} data-testid="admin-login-form">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={form.username}
                onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
                required
                data-testid="admin-login-username-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                required
                data-testid="admin-login-password-input"
              />
            </div>
            <Button className="w-full" type="submit" disabled={loading} data-testid="admin-login-submit-button">
              {loading ? "Signing in..." : "Sign in"}
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              type="button"
              onClick={() => navigate("/")}
              data-testid="admin-login-back-button"
            >
              Back to onboarding
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
