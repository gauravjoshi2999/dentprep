import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Brand } from "@/components/app/brand";
import { Notice } from "@/components/app/common";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  ssr: false,
  component: Login,
  head: () => ({ meta: [{ title: "Sign in — DentPrep" }] }),
});

function Login() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "reset">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    setMessage("");
    try {
      if (mode === "reset") {
        const result = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (result.error) throw result.error;
        setMessage("If this address has an account, a password reset link will arrive by email.");
      } else if (mode === "signup") {
        const result = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: name.trim() },
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });
        if (result.error) throw result.error;
        if (result.data.session) await navigate({ to: "/dashboard" });
        else
          setMessage(
            "Check your inbox to confirm your email, then sign in. If you already have an account, use Sign in.",
          );
      } else {
        const result = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (result.error) throw result.error;
        await navigate({ to: "/dashboard" });
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Couldn't sign in. Please try again.");
    } finally {
      setPending(false);
    }
  }
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="surface w-full max-w-md p-6 sm:p-8">
        <Link to="/">
          <Brand />
        </Link>
        <h1 className="mt-8 text-2xl font-extrabold">
          {mode === "signup"
            ? "Create your study account"
            : mode === "reset"
              ? "Reset your password"
              : "Welcome back"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Save your learning progress and build a daily routine.
        </p>
        {user ? (
          <Button className="mt-6" asChild>
            <Link to="/dashboard">Open dashboard</Link>
          </Button>
        ) : (
          <form onSubmit={submit} className="mt-6 grid gap-4">
            {mode === "signup" && (
              <label className="grid gap-1.5 text-sm font-semibold">
                Full name
                <input
                  className="study-input"
                  autoComplete="name"
                  required
                  maxLength={100}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
            )}
            <label className="grid gap-1.5 text-sm font-semibold">
              Email
              <input
                className="study-input"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            {mode !== "reset" && (
              <label className="grid gap-1.5 text-sm font-semibold">
                Password
                <input
                  className="study-input"
                  type="password"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  required
                  minLength={mode === "signup" ? 10 : 1}
                  maxLength={128}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {mode === "signup" && (
                  <span className="font-normal text-muted-foreground">
                    Use at least 10 characters.
                  </span>
                )}
              </label>
            )}
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            {message && <Notice>{message}</Notice>}
            <Button disabled={pending} type="submit" size="lg">
              {pending
                ? "Please wait…"
                : mode === "signup"
                  ? "Create account"
                  : mode === "reset"
                    ? "Send reset link"
                    : "Sign in"}
            </Button>
            <div className="flex flex-wrap justify-between gap-3 text-sm">
              <button
                type="button"
                className="font-semibold text-teal"
                onClick={() => {
                  setMode(mode === "signup" ? "signin" : "signup");
                  setMessage("");
                  setError("");
                }}
              >
                {mode === "signup" ? "Sign in instead" : "Create an account"}
              </button>
              <button
                type="button"
                className="text-muted-foreground underline"
                onClick={() => {
                  setMode(mode === "reset" ? "signin" : "reset");
                  setMessage("");
                  setError("");
                }}
              >
                {mode === "reset" ? "Back to sign in" : "Forgot password?"}
              </button>
            </div>
          </form>
        )}
        <p className="mt-6 text-xs text-muted-foreground">
          Independent UPSC Dental Surgeon preparation with source-linked notes, practice and
          personal study progress.
        </p>
      </div>
    </main>
  );
}
