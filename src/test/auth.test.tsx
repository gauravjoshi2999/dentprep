import { useEffect, useRef, useState, type ReactNode } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "@/lib/auth";

const mock = vi.hoisted(() => ({
  listener: null as null | ((event: string, session: unknown) => void),
  getSession: vi.fn(),
  invalidate: vi.fn(),
  unsubscribe: vi.fn(),
}));
const router = { invalidate: mock.invalidate };
vi.mock("@tanstack/react-router", () => ({ useRouter: () => router }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: mock.getSession,
      onAuthStateChange: (listener: typeof mock.listener) => {
        mock.listener = listener;
        return { data: { subscription: { unsubscribe: mock.unsubscribe } } };
      },
    },
  },
}));
function Identity() {
  const { user, ready } = useAuth();
  return <p>{ready ? (user?.id ?? "signed out") : "loading"}</p>;
}
const session = (id: string) => ({ user: { id }, access_token: "test" });
function mount(children: ReactNode = <Identity />) {
  const client = new QueryClient();
  render(
    <QueryClientProvider client={client}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>,
  );
  return client;
}
describe("private auth state", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mock.listener = null;
    mock.getSession.mockResolvedValue({ data: { session: null } });
  });
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
    mock.getSession.mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );
    mount();
    await act(async () => mock.listener?.("SIGNED_OUT", null));
    await act(async () => resolve({ data: { session: session("old-user") } }));
    expect(screen.getByText("signed out")).toBeInTheDocument();
  });
  it("discards local transcript editors and runs cleanup when the account changes", async () => {
    const cleanup = vi.fn();
    function Editor() {
      const { user } = useAuth();
      const initialUser = useRef(user?.id);
      const [text, setText] = useState("");
      useEffect(() => () => cleanup(initialUser.current), [cleanup]);
      return (
        <>
          <Identity />
          <input
            aria-label="Private rehearsal"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </>
      );
    }
    mount(<Editor />);
    await screen.findByText("signed out");
    await act(async () => mock.listener?.("SIGNED_IN", session("candidate-a")));
    fireEvent.change(screen.getByLabelText("Private rehearsal"), {
      target: { value: "A private draft" },
    });
    await act(async () => mock.listener?.("SIGNED_IN", session("candidate-b")));
    expect(screen.getByText("candidate-b")).toBeInTheDocument();
    expect(screen.getByLabelText("Private rehearsal")).toHaveValue("");
    expect(cleanup).toHaveBeenCalledWith("candidate-a");
    fireEvent.change(screen.getByLabelText("Private rehearsal"), {
      target: { value: "B private draft" },
    });
    await act(async () => mock.listener?.("SIGNED_OUT", null));
    expect(screen.getByLabelText("Private rehearsal")).toHaveValue("");
    expect(cleanup).toHaveBeenCalledWith("candidate-b");
  });
  it("keeps unsaved local work across same-account token refresh", async () => {
    function Editor() {
      const [text, setText] = useState("");
      return (
        <>
          <Identity />
          <input
            aria-label="Same-account draft"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </>
      );
    }
    mount(<Editor />);
    await screen.findByText("signed out");
    await act(async () => mock.listener?.("SIGNED_IN", session("candidate-a")));
    fireEvent.change(screen.getByLabelText("Same-account draft"), {
      target: { value: "Keep this draft" },
    });
    await act(async () => mock.listener?.("TOKEN_REFRESHED", session("candidate-a")));
    expect(screen.getByLabelText("Same-account draft")).toHaveValue("Keep this draft");
  });
});
