import { useState, type ReactNode } from "react";
import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import { BookOpen, ClipboardList, Home, MessagesSquare, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import { Brand } from "./brand";
import { EmptyState, IndependentDisclaimer, LoadingBlock } from "./common";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PwaTools } from "./pwa-tools";

const destinations = [
  ["/dashboard", "Home", Home],
  ["/library", "Study", BookOpen],
  ["/practice", "Practice", ClipboardList],
  ["/interviews", "Interview", MessagesSquare],
] as const;

export function StudyShell() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      <a
        href="#study-main"
        className="sr-only focus:not-sr-only focus:block focus:bg-white focus:p-3"
      >
        Skip to content
      </a>
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link to="/dashboard" aria-label="DentPrep home">
            <Brand />
          </Link>
          <div className="flex items-center gap-3 text-sm">
            {ready &&
              (user ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const { error } = await supabase.auth.signOut();
                    if (error) {
                      toast.error(error.message);
                      return;
                    }
                    await navigate({ to: "/" });
                  }}
                >
                  Sign out
                </Button>
              ) : (
                <Button asChild size="sm">
                  <Link to="/login">Sign in</Link>
                </Button>
              ))}
          </div>
        </div>
        <nav
          aria-label="Learning navigation"
          className="mx-auto hidden max-w-7xl gap-1 overflow-x-auto px-3 pb-3 md:flex sm:px-5"
        >
          {destinations.map(([to, label, Icon]) => (
            <Link
              key={to}
              to={to}
              activeProps={{ className: "bg-teal-soft text-secondary-foreground" }}
              className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold hover:bg-muted"
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </Link>
          ))}
          <button
            type="button"
            aria-controls="dentprep-profile-panel"
            aria-expanded={profileOpen}
            onClick={() => setProfileOpen((open) => !open)}
            className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold hover:bg-muted"
          >
            <UserRound className="h-4 w-4" aria-hidden="true" />
            Profile
          </button>
        </nav>
      </header>
      <main id="study-main" className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10">
        <Outlet />
      </main>
      {profileOpen && (
        <div
          id="dentprep-profile-panel"
          role="region"
          aria-label="Profile shortcuts"
          className="fixed inset-x-3 bottom-24 z-[60] max-h-[calc(100vh-8rem)] overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-elevated md:inset-x-auto md:bottom-auto md:right-6 md:top-24 md:w-80"
        >
          <div className="mb-3 flex items-start justify-between gap-2">
            <div>
              <p className="font-bold">Your study profile</p>
              <p className="max-w-[17rem] truncate text-sm text-muted-foreground">
                {user?.email ?? "Sign in to save progress"}
              </p>
            </div>
            <button
              type="button"
              aria-label="Close profile shortcuts"
              onClick={() => setProfileOpen(false)}
              className="rounded-lg p-2 hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-2 text-sm font-semibold">
            <Link
              to="/progress"
              onClick={() => setProfileOpen(false)}
              className="rounded-lg bg-muted px-4 py-3"
            >
              My progress
            </Link>
            <Link
              to="/saved"
              onClick={() => setProfileOpen(false)}
              className="rounded-lg bg-muted px-4 py-3"
            >
              Saved questions & lessons
            </Link>
            <Link
              to="/plan"
              onClick={() => setProfileOpen(false)}
              className="rounded-lg bg-muted px-4 py-3"
            >
              Study plan
            </Link>
            <a
              href="/#notices"
              onClick={() => setProfileOpen(false)}
              className="rounded-lg bg-muted px-4 py-3"
            >
              Official UPSC sources
            </a>
            {!user && (
              <Link
                to="/login"
                onClick={() => setProfileOpen(false)}
                className="rounded-lg bg-teal-soft px-4 py-3"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      )}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 shadow-elevated backdrop-blur md:hidden">
        <nav
          aria-label="Mobile primary navigation"
          className="grid grid-cols-5 items-center px-1 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2"
        >
          {destinations.map(([to, label, Icon]) => (
            <Link
              key={to}
              to={to}
              onClick={() => setProfileOpen(false)}
              activeProps={{ className: "text-teal" }}
              className="flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-lg text-[11px] font-semibold text-muted-foreground hover:bg-muted"
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              {label}
            </Link>
          ))}
          <button
            type="button"
            aria-controls="dentprep-profile-panel"
            aria-expanded={profileOpen}
            onClick={() => setProfileOpen((open) => !open)}
            className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-lg text-[11px] font-semibold ${profileOpen ? "text-teal" : "text-muted-foreground"}`}
          >
            <UserRound className="h-5 w-5" aria-hidden="true" />
            Profile
          </button>
        </nav>
      </div>
      <footer className="mx-auto max-w-7xl border-t border-border px-4 py-6 sm:px-6">
        <PwaTools />
        <IndependentDisclaimer />
      </footer>
    </div>
  );
}

export function RequireUser({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  if (!ready) return <LoadingBlock label="Checking your session…" />;
  if (!user)
    return (
      <EmptyState
        title="Sign in to your study space"
        action={
          <Button asChild>
            <Link to="/login">Sign in or create an account</Link>
          </Button>
        }
      >
        Your progress, plans and practice history are kept in your account.
      </EmptyState>
    );
  return children;
}
