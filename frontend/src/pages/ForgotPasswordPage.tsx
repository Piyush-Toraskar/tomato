import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { forgotPassword } from "../api/auth";
import { AuthPanel } from "../components/auth/AuthPanel";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { ErrorState } from "../components/ui/ErrorState";
import { Card } from "../components/ui/Card";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [debugToken, setDebugToken] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const response = await forgotPassword(email);
      setMessage(response.message);
      setDebugToken(response.debug_token ?? null);
    } catch (caught) {
      setError(caught);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthPanel
      title="Reset your password"
      description="Enter your email to request a password reset. For privacy, the response is the same whether or not an account exists."
      footer={<Link className="font-semibold text-tomato-600" to="/login">Back to sign in</Link>}
    >
      <form onSubmit={submit} className="space-y-5">
        <Input
          label="Email"
          name="email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          leadingIcon={<Mail className="h-4 w-4" />}
        />
        {error ? <ErrorState error={error} /> : null}
        <Button type="submit" className="w-full" loading={submitting}>
          Request reset token
        </Button>
      </form>

      {message ? (
        <Card className="mt-5 bg-warm-50 p-4">
          <p className="text-sm leading-6 text-neutral-700">{message}</p>
          {debugToken ? (
            <div className="mt-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Development token</p>
              <code className="mt-1 block break-all rounded-lg bg-white p-3 text-xs text-ink">{debugToken}</code>
              <Link className="mt-3 inline-block text-sm font-semibold text-tomato-600" to={`/reset-password?token=${encodeURIComponent(debugToken)}`}>
                Continue with this token
              </Link>
            </div>
          ) : (
            <p className="mt-2 text-xs leading-5 text-neutral-500">
              Email delivery is not connected in this version. Ask the account administrator for the one-time reset token.
            </p>
          )}
        </Card>
      ) : null}
    </AuthPanel>
  );
}
