import { act, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "@/lib/auth";

const mock = vi.hoisted(() => ({ listener: null as null | ((event: string, session: unknown) => void), getSession: vi.fn(), invalidate: vi.fn(), unsubscribe: vi.fn() }));
const router = { invalidate: mock.invalidate };
vi.mock("@tanstack/react-router", () => ({ useRouter: () => router }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: {
  getSession: mock.getSession,
  onAuthStateChange: (listener: typeof mock.listener) => { mock.listener = listener; return { data: { subscription: { unsubscribe: mock.unsubscribe } } }; },
} } }));
function Identity() { const { user, ready } = useAuth(); return <p>{ready ? user?.id ?? "signed out" : "loading"}</p>; }
const session = (id: string) => ({ user: { id }, access_token: "test" });
function mount() {
  const client = new QueryClient();
  render(<QueryClientProvider client={client}><AuthProvider><Identity /></AuthProvider></QueryClientProvider>);
  return client;
}
describe("private auth state", () => {
  beforeEach(() => { vi.clearAllMocks(); mock.listener = null; mock.getSession.mockResolvedValue({ data: { session: null } }); });
  it("clears cached private data on account switches and sign out", async () => {
    const client = mount();
    await screen.findByText("signed out");
    await act(async () => mock.listener?.("SIGNED_IN", session("candidate-a")));
    client.setQueryData(["private", "candidate-a"], { transcript: "private practice" });
    await act(async () => mock.listener?.("SIGNED_IN", session("candidate-b")));
    expect(client.getQueryData(["private", "candidate-a"])).toBeUndefined();
    client.setQueryData(["private", "candidate-b"], "private");
    await act(async () => mock.listener?.("SIGNED_OUT", null));
    expect(client.getQueryData(["private", "candidate-b"])).toBeUndefined();
    expect(screen.getByText("signed out")).toBeInTheDocument();
  });
  it("does not restore an older session after a newer sign-out event", async () => {
    let resolve: (value: unknown) => void = () => {};
    mock.getSession.mockReturnValue(new Promise(r => { resolve = r; }));
    mount();
    await act(async () => mock.listener?.("SIGNED_OUT", null));
    await act(async () => resolve({ data: { session: session("old-user") } }));
    expect(screen.getByText("signed out")).toBeInTheDocument();
  });
});
