const requests = new Map<string, { count: number; resetAt: number }>();

/**
 * Simple in-memory rate limiter.
 * @param key     Identifier for the client (e.g. IP or "global")
 * @param limit   Max requests allowed within the window
 * @param windowMs Time window in milliseconds
 * @returns true if the request is allowed, false if rate-limited
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = requests.get(key);

  if (!entry || now > entry.resetAt) {
    requests.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) return false;

  entry.count++;
  return true;
}
