/** Friendly study greeting; academic honorific is presentation only, never an authorization claim. */
export function studentGreetingName(fullName: string | null | undefined): string | null {
  const normalized = fullName?.trim().replace(/\s+/g, " ") ?? "";
  const withoutTitle = normalized.replace(/^dr\.?(?:\s+|$)/i, "");
  const firstName = withoutTitle.split(" ")[0];
  if (!firstName) return null;
  return `Dr. ${firstName.charAt(0).toUpperCase()}${firstName.slice(1)}`;
}
