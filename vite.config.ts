// Lovable's config supplies TanStack, React, Tailwind and Nitro plugins.
// Do not add duplicate plugins, change the Cloudflare preset or expose private keys.
// An explicit Vite define is needed on our external Cloudflare release: the public
// browser backend config must not depend on per-request Worker process.env vars.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv } from "vite";

// Vite loads .env files after evaluating config, so read them explicitly.
// GitHub production release passes these same VITE_* values as build env.
// Only public URL and publishable/anon key can be substituted into JS.
const mode = process.env.NODE_ENV === "development" ? "development" : "production";
const env = loadEnv(mode, process.cwd(), "VITE_SUPABASE_");
const url = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY;

function isPublicKey(value: string): boolean {
  if (value.startsWith("sb_publishable_")) return true;
  if (!value.startsWith("eyJ")) return false;
  try {
    return JSON.parse(Buffer.from(value.split(".")[1] ?? "", "base64url").toString()).role === "anon";
  } catch {
    return false;
  }
}

if (key && !isPublicKey(key)) {
  throw new Error("Only a Supabase publishable/anon key may be exposed in the browser bundle.");
}

// Define whole static expressions as literals for *all* Vite compilation
// environments, including the isomorphic TanStack client entry. Do not use
// dynamic import.meta.env[...] access or window.process.env at runtime.
const browserPublicDefines = url && key ? {
  "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(url),
  "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(key),
} : {};

export default defineConfig({
  vite: { define: browserPublicDefines },
  tanstackStart: {
    // Preserve the existing SSR error wrapper.
    server: { entry: "server" },
  },
});
