const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const JWT_PATTERN = /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g;
const SUPABASE_URL_PATTERN = /https?:\/\/[a-z0-9-]+\.supabase\.co[^\s]*/gi;
const SECRET_KEY_PATTERN =
  /\b(service_role|anon_key|apikey|api_key|secret|password|token)\s*[:=]\s*\S+/gi;

export function sanitizeMissionPersistenceText(value: string | undefined | null): string | null {
  if (!value) return null;
  let sanitized = value
    .replace(EMAIL_PATTERN, "[redacted-email]")
    .replace(JWT_PATTERN, "[redacted-token]")
    .replace(SUPABASE_URL_PATTERN, "[redacted-url]")
    .replace(SECRET_KEY_PATTERN, "[redacted-secret]");
  sanitized = sanitized.slice(0, 500);
  return sanitized.trim() || null;
}

export function assertMissionPersistenceSafe(value: Record<string, unknown>): void {
  const forbiddenKeys = ["email", "token", "password", "service_role", "stack", "payload"];
  for (const key of forbiddenKeys) {
    if (key in value) {
      throw new Error(`Campo sensível não permitido na persistência: ${key}`);
    }
  }
}
