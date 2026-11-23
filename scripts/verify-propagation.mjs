/**
 * A successful Wrangler deploy may propagate Worker code and static assets to
 * different Cloudflare edges at slightly different times. Verify the *whole*
 * live release again rather than accepting a successful health endpoint alone.
 * All failures remain fatal once the bounded propagation window expires.
 */
export async function verifyWithPropagationRetries(check, options = {}) {
  const intervalsMs = options.intervalsMs ?? [0, 2000, 5000, 10000, 20000, 30000];
  const sleep = options.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  const report = options.report ?? ((message) => console.warn(message));
  if (!intervalsMs.length) throw new Error("Configure at least one verification attempt.");
  for (let pass = 0; pass < intervalsMs.length; pass++) {
    if (intervalsMs[pass] > 0) await sleep(intervalsMs[pass]);
    try {
      await check(pass + 1);
      return;
    } catch (error) {
      if (pass === intervalsMs.length - 1) throw error;
      report(`Live release check ${pass + 1}/${intervalsMs.length} did not pass: ${error instanceof Error ? error.message : String(error)}. Rechecking deployment propagation.`);
    }
  }
}
