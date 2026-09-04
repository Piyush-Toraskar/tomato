import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LockKeyhole, Mail, UserRound } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { AuthPanel } from "../components/auth/AuthPanel";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { ErrorState } from "../components/ui/ErrorState";

export function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const response = await register({ name, email, password });
      showToast({
        title: "Account created",
        description: response.debug_verification_token
          ? "A verification token is ready for this development environment."
          : "You can now sign in.",
        tone: "success",
      });
      navigate("/login", {
        replace: true,
        state: {
          registeredEmail: response.email,
          debugVerificationToken: response.debug_verification_token,
        },
      });
    } catch (caught) {
      setError(caught);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthPanel
      title="Create your account"
      description="Create a customer account to place and track orders. Restaurant and driver accounts are added by an administrator."
      footer={
        <>
          Already have an account?{" "}
          <Link className="font-semibold text-tomato-600 hover:text-tomato-700" to="/login">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5">
        <Input
          label="Name"
          name="name"
          autoComplete="name"
          required
          maxLength={100}
          value={name}
          onChange={(event) => setName(event.target.value)}
          leadingIcon={<UserRound className="h-4 w-4" />}
        />
        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={255}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          leadingIcon={<Mail className="h-4 w-4" />}
        />
        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={128}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          hint="Use 8 to 128 characters."
          leadingIcon={<LockKeyhole className="h-4 w-4" />}
        />
        {error ? <ErrorState error={error} title="Registration failed" /> : null}
        <Button type="submit" className="w-full" size="lg" loading={submitting}>
          Create account
        </Button>
      </form>
    </AuthPanel>
  );
}
