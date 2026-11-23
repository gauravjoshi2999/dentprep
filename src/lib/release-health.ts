/** Public liveness receipt only. It does not claim that content or authentication passed QA. */
export function releaseHealth(request: Request, buildRevision: unknown): Response | undefined {
  if (new URL(request.url).pathname !== "/api/health") return;
  const headers = {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    allow: "GET, HEAD",
  };
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response(null, { status: 405, headers });
  }
  const revision =
    typeof buildRevision === "string" && /^[a-f0-9]{40}$/.test(buildRevision)
      ? buildRevision
      : null;
  return new Response(
    request.method === "HEAD"
      ? null
      : JSON.stringify({
          app: "dentprep",
          status: revision ? "ok" : "unversioned",
          revision,
        }),
    { status: revision ? 200 : 503, headers },
  );
}
