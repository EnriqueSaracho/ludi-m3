const REQUIRED_ENV = [
  "IGDB_CLIENT_ID",
  "IGDB_CLIENT_SECRET",
  "ITAD_API_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

export type RequiredEnvKey = (typeof REQUIRED_ENV)[number];

export function assertEnv(): void {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}. See .env.example.`,
    );
  }
}

export function getEnv(key: RequiredEnvKey): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}
