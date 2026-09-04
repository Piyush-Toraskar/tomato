import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { KeyRound } from "lucide-react";
import { verifyEmail } from "../api/auth";
import { AuthPanel } from "../components/auth/AuthPanel";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { ErrorState } from "../components/ui/ErrorState";
import { Card } from "../components/ui/Card";

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState(searchParams.get("token") ?? "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const response = await verifyEmail(token);
      setMessage(response.message);
    } catch (caught) {
      setError(caught);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthPanel
      title="Verify your email"
      description="Enter the one-time token issued for your account."
      footer={<Link className="font-semibold text-tomato-600" to="/account">Back to account</Link>}
    >
      <form onSubmit={submit} className="space-y-5">
        <Input
          label="Verification token"
          name="token"
          required
          value={token}
          onChange={(event) => setToken(event.target.value)}
          leadingIcon={<KeyRound className="h-4 w-4" />}
        />
        {error ? <ErrorState error={error} /> : null}
        <Button type="submit" className="w-full" loading={submitting}>
          Verify email
        </Button>
      </form>
      {message ? <Card className="mt-5 bg-emerald-50 p-4 text-sm text-emerald-900">{message}</Card> : null}
    </AuthPanel>
  );
}
