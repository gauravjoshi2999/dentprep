import { describe, expect, it } from "vitest";
import { releaseHealth } from "../lib/release-health";

const revision = "1".repeat(40);
const request = (path = "/api/health", method = "GET") =>
  new Request(`https://dentprep.example${path}`, { method });

describe("release liveness receipt", () => {
  it("returns only a validated build revision and never caches it", async () => {
    const result = releaseHealth(request(), revision)!;
    expect(result.status).toBe(200);
    expect(result.headers.get("cache-control")).toBe("no-store");
    expect(await result.json()).toEqual({ app: "dentprep", status: "ok", revision });
  });
  it.each([undefined, "main", "secret-value", "a".repeat(41)])(
    "fails closed for an invalid revision %s",
    async (value) => {
      const result = releaseHealth(request(), value)!;
      expect(result.status).toBe(503);
      expect(await result.json()).toEqual({
        app: "dentprep",
        status: "unversioned",
        revision: null,
      });
    },
  );
  it("supports monitoring HEAD, rejects writes and leaves application routes alone", async () => {
    expect(await releaseHealth(request("/api/health", "HEAD"), revision)!.text()).toBe("");
    expect(releaseHealth(request("/api/health", "POST"), revision)!.status).toBe(405);
    expect(releaseHealth(request("/dashboard"), revision)).toBeUndefined();
  });
});
