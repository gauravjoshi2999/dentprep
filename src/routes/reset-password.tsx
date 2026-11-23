import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/reset-password")({ ssr: false, component: ResetPassword });
function ResetPassword() {
  const [recovery, setRecovery] = useState(
    () =>
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.hash.slice(1)).get("type") === "recovery",
  );
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!recovery) return;
    setPending(true);
    const { error } = await supabase.auth.updateUser({ password });
    setMessage(error ? error.message : "Password updated. You can return to your dashboard.");
    setPending(false);
  }
  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-extrabold">Choose a new password</h1>
      {recovery ? (
        <form className="mt-6 grid gap-4" onSubmit={submit}>
          <label className="grid gap-2">
            New password
            <input
              className="study-input"
              type="password"
              autoComplete="new-password"
              minLength={10}
              maxLength={128}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <Button disabled={pending} type="submit">
            Update password
          </Button>
        </form>
      ) : (
        <p className="mt-4">Open the password reset link from your email to continue.</p>
      )}
      <p role="status" className="mt-4 text-sm">
        {message}
      </p>
      <Link to="/login" className="mt-6 block text-teal underline">
        Back to sign in
      </Link>
    </main>
  );
}
