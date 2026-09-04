import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { LockKeyhole, Mail } from "lucide-react";
import { ApiError } from "../api/client";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { AuthPanel } from "../components/auth/AuthPanel";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { ErrorState } from "../components/ui/ErrorState";

interface LocationState {
  from?: string;
}

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [submitting, setSubmitting] = useState(false);
  const { user, login, isInitialising } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  if (!isInitialising && user) {
    return <Navigate to="/account" replace />;
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const profile = await login({ email, password });
      const requestedPath = (location.state as LocationState | null)?.from;
      const defaultPath =
        profile.role === "RESTAURANT"
          ? "/restaurant/manage"
          : profile.role === "DRIVER"
            ? "/driver/manage"
            : "/";
      showToast({
        title: `Welcome back, ${profile.name}`,
        tone: "success",
      });
      navigate(requestedPath || defaultPath, { replace: true });
    } catch (caught) {
      setError(caught);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthPanel
      title="Sign in"
      description="Sign in to order food, follow deliveries and manage your account."
      footer={
        <>
          New to Tomato?{" "}
          <Link className="font-semibold text-tomato-600 hover:text-tomato-700" to="/register">
            Create a customer account
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5">
        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          leadingIcon={<Mail className="h-4 w-4" />}
        />
        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          leadingIcon={<LockKeyhole className="h-4 w-4" />}
        />

        {error ? (
          <ErrorState
            error={
              error instanceof ApiError && error.status === 401
                ? new ApiError({ status: 401, detail: "Incorrect email or password." })
                : error
            }
            title="Sign in failed"
          />
        ) : null}

        <Button type="submit" className="w-full" size="lg" loading={submitting}>
          Sign in
        </Button>
      </form>

      <div className="mt-5 text-center">
        <Link to="/forgot-password" className="text-sm font-medium text-neutral-600 hover:text-tomato-600">
          Forgot your password?
        </Link>
      </div>
    </AuthPanel>
  );
}
