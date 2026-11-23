import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type AuthState = { session: Session | null; user: User | null; ready: boolean };
const AuthContext = createContext<AuthState>({ session: null, user: null, ready: false });

/** Single app-wide auth listener: keeps session state and refreshes the router on identity changes. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [state, setState] = useState<AuthState>({ session: null, user: null, ready: false });

  useEffect(() => {
    let active = true;
    let receivedEvent = false;
    let previousUserId: string | null | undefined;
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      receivedEvent = true;
      const userId = session?.user.id ?? null;
      // Remove private queries on logout/account switches, including cached drafts and transcripts.
      if (previousUserId !== undefined && previousUserId !== userId) queryClient.clear();
      previousUserId = userId;
      setState({ session, user: session?.user ?? null, ready: true });
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      queueMicrotask(() => {
        if (active) void router.invalidate();
      });
    });
    void supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active || receivedEvent) return;
        previousUserId = data.session?.user.id ?? null;
        setState({ session: data.session, user: data.session?.user ?? null, ready: true });
      })
      .catch(() => {
        if (active && !receivedEvent) setState({ session: null, user: null, ready: true });
      });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [router, queryClient]);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

/** Signed-in user id for protected pages (the _authenticated gate guarantees a session). */
export function useUserId(): string {
  const { user } = useAuth();
  return user?.id ?? "";
}
