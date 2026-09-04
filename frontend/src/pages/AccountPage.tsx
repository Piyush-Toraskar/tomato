import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { KeyRound, LogOut, MailCheck, MonitorSmartphone, ShieldCheck, UserRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { requestEmailVerification } from "../api/auth";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { getStableDeviceId } from "../lib/device";
import { shortId } from "../lib/format";
import { Button } from "../components/ui/Button";
import { LinkButton } from "../components/ui/LinkButton";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { ErrorState } from "../components/ui/ErrorState";

export function AccountPage() {
  const { user, logout, logoutAll, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [debugToken, setDebugToken] = useState<string | null>(null);

  const verificationMutation = useMutation({
    mutationFn: requestEmailVerification,
    onSuccess: (response) => {
      setDebugToken(response.debug_token ?? null);
      showToast({ title: "Verification requested", description: response.message, tone: "success" });
      void refreshProfile();
    },
  });

  const handleLogout = async (all: boolean) => {
    try {
      if (all) {
        await logoutAll();
      } else {
        await logout();
      }

      showToast({
        title: all ? "Signed out everywhere" : "Signed out",
        tone: "success",
      });
    } catch {
      showToast({
        title: "Signed out on this browser",
        description: all
          ? "The local session was cleared, but sign-out on other devices could not be confirmed."
          : "The local session was cleared, but the server could not be reached.",
        tone: "info",
      });
    } finally {
      navigate("/login", { replace: true });
    }
  };

  if (!user) {
    return null;
  }

  const workspacePath = user.role === "RESTAURANT" ? "/restaurant/manage" : user.role === "DRIVER" ? "/driver/manage" : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <p className="text-sm font-semibold text-tomato-600">Account</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-[-0.035em] text-ink sm:text-4xl">Your details</h1>

      <div className="mt-7 grid gap-6 lg:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-warm-100 text-warm-700">
              <UserRound className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-xl font-semibold text-ink">{user.name}</h2>
              <p className="mt-1 text-sm text-neutral-600">{user.email}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone="brand">{user.role}</Badge>
                <Badge tone={user.email_verified ? "success" : "warning"}>
                  {user.email_verified ? "Email verified" : "Email not verified"}
                </Badge>
              </div>
            </div>
          </div>

          {workspacePath ? (
            <LinkButton
              to={workspacePath}
              className="mt-6 w-full"
              variant="secondary"
            >
              Open {user.role.toLowerCase()} workspace
            </LinkButton>
          ) : null}
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-warm-100 text-warm-700">
              <MonitorSmartphone className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-ink">Current browser session</h2>
              <p className="mt-1 text-sm leading-6 text-neutral-600">
                Device ID: <code className="rounded bg-warm-100 px-1.5 py-0.5 text-xs">{shortId(getStableDeviceId(), 18)}...</code>
              </p>
            </div>
          </div>
          <p className="mt-5 text-sm leading-6 text-neutral-600">
            This browser keeps a stable device identifier. Signing in again here replaces only this browser's previous session, while your other devices stay signed in. Individual remote sessions are not available to view in this version.
          </p>
        </Card>
      </div>

      {!user.email_verified ? (
        <Card className="mt-6 p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <MailCheck className="h-5 w-5 text-tomato-600" />
                <h2 className="font-semibold text-ink">Verify your email</h2>
              </div>
              <p className="mt-2 text-sm leading-6 text-neutral-600">
                Request a one-time verification token. In development it may appear below; in production it must be delivered through your account support process.
              </p>
            </div>
            <Button
              variant="secondary"
              loading={verificationMutation.isPending}
              onClick={() => verificationMutation.mutate()}
            >
              Request token
            </Button>
          </div>
          {verificationMutation.isError ? <div className="mt-4"><ErrorState error={verificationMutation.error} /></div> : null}
          {debugToken ? (
            <div className="mt-4 rounded-xl bg-warm-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Development token</p>
              <code className="mt-2 block break-all text-xs text-ink">{debugToken}</code>
              <Link to={`/verify-email?token=${encodeURIComponent(debugToken)}`} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-tomato-600">
                <KeyRound className="h-4 w-4" /> Use token
              </Link>
            </div>
          ) : null}
        </Card>
      ) : null}

      <Card className="mt-6 p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-tomato-600" />
          <h2 className="font-semibold text-ink">Session controls</h2>
        </div>
        <p className="mt-2 text-sm leading-6 text-neutral-600">
          Sign out this browser only, or revoke every device session linked to the account.
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Button variant="secondary" onClick={() => void handleLogout(false)} leftIcon={<LogOut className="h-4 w-4" />}>
            Sign out this device
          </Button>
          <Button variant="danger" onClick={() => void handleLogout(true)}>
            Sign out all devices
          </Button>
        </div>
      </Card>
    </div>
  );
}
