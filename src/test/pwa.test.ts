import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import vm from "node:vm";

type WorkerEvent = {
  request: { method: string; url: string; mode: string };
  respondWith: ReturnType<typeof vi.fn>;
};
function worker() {
  const handlers: Record<string, (event: WorkerEvent) => void> = {};
  const match = vi.fn().mockResolvedValue("public offline shelf");
  const fetch = vi.fn().mockResolvedValue("network");
  const context = {
    self: {
      location: { origin: "https://dentprep.example" },
      addEventListener: (name: string, handler: (e: WorkerEvent) => void) => {
        handlers[name] = handler;
      },
    },
    caches: { match },
    URL,
    fetch,
  };
  vm.runInNewContext(readFileSync("src/pwa/service-worker.js", "utf8"), context);
  return { handlers, fetch, match };
}
describe("offline cache privacy", () => {
  it("never intercepts API, server function mutations or other origins", () => {
    const { handlers } = worker();
    for (const [method, url] of [
      ["GET", "https://api.example/rest/v1/profiles"],
      ["POST", "https://dentprep.example/_serverFn/save"],
      ["GET", "https://dentprep.example/rest/v1/interview_sessions"],
    ]) {
      const respondWith = vi.fn();
      handlers["fetch"]?.({ request: { method: method!, url: url!, mode: "cors" }, respondWith });
      expect(respondWith).not.toHaveBeenCalled();
    }
  });
  it("does not cache private navigation HTML and uses only the public offline fallback", async () => {
    const { handlers, fetch, match } = worker();
    let response: Promise<unknown> | undefined;
    const event = {
      request: { method: "GET", url: "https://dentprep.example/dashboard", mode: "navigate" },
      respondWith: vi.fn((p: Promise<unknown>) => {
        response = p;
      }),
    };
    handlers["fetch"]?.(event);
    await expect(response).resolves.toBe("network");
    expect(match).not.toHaveBeenCalled();
    fetch.mockRejectedValueOnce(new Error("offline"));
    handlers["fetch"]?.(event);
    await expect(response).resolves.toBe("public offline shelf");
    expect(match).toHaveBeenCalledWith("/offline.html");
  });
});
