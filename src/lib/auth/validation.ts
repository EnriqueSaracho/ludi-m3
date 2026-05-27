export function sanitizeNextParam(next: string | null | undefined): string {
  if (!next) return "/";
  if (!next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
}

export function deriveUsernameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "user";
  let sanitized = local.toLowerCase().replace(/[^a-z0-9_]/g, "_");
  if (sanitized.length < 3) sanitized = `${sanitized}_ludi`;
  return sanitized.slice(0, 24);
}

export function validateUsername(username: string): string | null {
  if (!/^[a-zA-Z0-9_]{3,24}$/.test(username)) {
    return "Username must be 3–24 characters (letters, numbers, underscore).";
  }
  return null;
}
