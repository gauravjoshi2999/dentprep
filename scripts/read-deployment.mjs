import assert from "node:assert/strict";

export function createReleaseReader(origin, fetcher = fetch) {
  return async function read(path, format = "text") {
    const url = new URL(path, origin);
    assert.equal(url.origin, origin.origin, "Release checks must remain on the deployed origin.");
    const options = {
      redirect: "manual",
      signal: AbortSignal.timeout(20_000),
      headers: { "cache-control": "no-cache" },
    };
    let response = await fetcher(url, options);
    // Workers Static Assets canonicalizes .html pages. Permit exactly that one-hop
    // transformation; redirects to sign-in, another host, or another resource fail.
    if ([301, 302, 307, 308].includes(response.status) && path.endsWith(".html")) {
      const location = response.headers.get("location");
      assert(location, "Redirect did not specify its destination.");
      const target = new URL(location, url);
      assert.equal(
        target.href,
        new URL(path.slice(0, -5), origin).href,
        "Unexpected redirect from the deployed resource.",
      );
      response = await fetcher(target, { ...options, redirect: "error" });
    }
    assert.equal(response.status, 200, `${path} did not return HTTP 200`);
    return format === "json" ? response.json() : response.text();
  };
}
