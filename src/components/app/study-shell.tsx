import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { isAdminQuery } from "@/lib/queries";
import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import {
  BookOpen,
  CalendarDays,
  ChartNoAxesCombined,
  ClipboardList,
  Home,
  Bookmark,
  MessagesSquare,
} from "lucide-react";
import { toast } from "sonner";
import { Brand } from "./brand";
import { EmptyState, IndependentDisclaimer, LoadingBlock } from "./common";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const destinations = [
  ["/dashboard", "Dashboard", Home],
  ["/library", "Study library", BookOpen],
  ["/practice", "Practice", ClipboardList],
  ["/plan", "Study plan", CalendarDays],
  ["/progress", "Progress", ChartNoAxesCombined],
  ["/saved", "Saved", Bookmark],
  ["/interviews", "Interview", MessagesSquare],
] as const;

export function StudyShell() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const admin = useQuery({ ...isAdminQuery(user?.id ?? ""), enabled: !!user });
  return (
    <div className="min-h-screen bg-background">
      <a
        href="#study-main"
        className="sr-only focus:not-sr-only focus:block focus:bg-white focus:p-3"
      >
        Skip to content
      </a>
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link to="/" aria-label="DentPrep home">
            <Brand />
          </Link>
          <div className="flex items-center gap-3 text-sm">
            {admin.data && (
              <Link to="/admin" className="font-semibold text-teal">
                Admin
              </Link>
            )}
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
          className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-3 pb-3 sm:px-5"
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
        </nav>
      </header>
      <main id="study-main" className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10">
        <Outlet />
      </main>
      <footer className="mx-auto max-w-7xl border-t border-border px-4 py-6 sm:px-6">
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
