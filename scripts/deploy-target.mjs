/**
 * Extract the canonical workers.dev origin from successful Wrangler deploy output.
 * Never accept a preview, an unrelated Worker, a custom host or a URL with a path.
 * A custom domain can instead be supplied explicitly to the release workflow.
 */
export function deployedWorkerOrigin(output, expectedWorker = "dentprep") {
  if (!/^[a-z][a-z0-9-]{0,62}$/.test(expectedWorker)) {
    throw new Error("Invalid expected Worker name");
  }
  const urls = output.match(/https:\/\/[^\\s"\x27<>]+/g) ?? [];
  const accepted = new Set();
  for (const candidate of urls) {
    let url;\n    try { url = new URL(candidate.replace(/[),;]+$/, "")); } catch { continue; }
    const suffix = ".workers.dev";
    if (!url.hostname.endsWith(suffix)) continue;
    const firstPart = url.hostname.slice(0, -suffix.length);
    const labels = firstPart.split(".");
    if (labels.length !== 2 || labels[0] !== expectedWorker || !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(labels[1])) continue;
    if (url.pathname !== "/" || url.search || url.hash || url.port || url.username || url.password) continue;
    accepted.add(url.origin);
  }
  if (accepted.size !== 1) {
    throw new Error(
      "Unable to uniquely identify the deployed dentprep workers.dev origin. Supply the verified production HTTPS URL through the workflow input.",
    );
  }
  return [...accepted][0];
}
