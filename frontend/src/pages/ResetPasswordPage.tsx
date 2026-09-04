import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { KeyRound, LockKeyhole } from "lucide-react";
import { resetPassword } from "../api/auth";
import { AuthPanel } from "../components/auth/AuthPanel";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { ErrorState } from "../components/ui/ErrorState";
import { useToast } from "../hooks/useToast";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState(searchParams.get("token") ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const response = await resetPassword(token, password);
      showToast({ title: "Password updated", description: response.message, tone: "success" });
      navigate("/login", { replace: true });
    } catch (caught) {
      setError(caught);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthPanel
      title="Choose a new password"
      description="Choose a new password. A successful reset signs the account out on every device."
      footer={<Link className="font-semibold text-tomato-600" to="/login">Back to sign in</Link>}
    >
      <form onSubmit={submit} className="space-y-5">
        <Input
          label="Reset token"
          name="token"
          required
          value={token}
          onChange={(event) => setToken(event.target.value)}
          leadingIcon={<KeyRound className="h-4 w-4" />}
        />
        <Input
          label="New password"
          name="password"
          type="password"
          required
          minLength={8}
          maxLength={128}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          leadingIcon={<LockKeyhole className="h-4 w-4" />}
        />
        {error ? <ErrorState error={error} /> : null}
        <Button type="submit" className="w-full" loading={submitting}>
          Reset password
        </Button>
      </form>
    </AuthPanel>
  );
}
