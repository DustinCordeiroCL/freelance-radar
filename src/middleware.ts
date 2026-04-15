// Auth middleware disabled — UI protection is handled by AuthGuard in layout.tsx
// Re-enable when cookie/Edge Runtime behavior is confirmed on Vercel.
export function middleware() {
  // no-op
}

export const config = {
  matcher: [],
};
