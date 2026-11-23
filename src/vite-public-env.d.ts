// Explicit public client env fields make TypeScript allow Vite's static dot-property replacement.
// Only publishable values belong here; never declare a service-role/secret key.
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
}
