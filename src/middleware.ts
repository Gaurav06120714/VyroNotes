/**
 * Next.js Edge Middleware — rate limiting for VyroNotes.
 *
 * Runs in the Edge Runtime (no Node.js APIs, no Redis).
 * Uses the request IP stored in headers to enforce per-IP limits
 * via a simple in-memory sliding window backed by the Edge KV-like
 * `waitUntil` pattern.
 *
 * Limits applied:
 *   - /api/auth/*   → 5 requests / 15 min / IP  (brute-force protection)
 *   - /api/*        → 60 requests / min / IP     (general API protection)
 *   - Everything else passes through untouched.
 *
 * NOTE: Edge middleware runs per-request in serverless; there is no shared
 * in-process memory across instances. This implementation adds rate-limit
 * headers and blocks based on request metadata.
 * For strict enforcement across serverless replicas, swap the in-process map
 * for an Upstash Redis store using @upstash/ratelimit when available.
 */

import { NextRequest, NextResponse } from 'next/server';

// ── Config ────────────────────────────────────────────────────────────────────

const PROXY_DEPTH = parseInt(process.env.PROXY_DEPTH ?? '1', 10);

/** Routes that receive strict auth-level limiting (5 / 15 min / IP). */
const AUTH_ROUTES = ['/api/auth/'];

/** General API limit (60 / min / IP). */
const API_LIMIT = 60;
const API_WINDOW_MS = 60_000;

const AUTH_LIMIT = 5;
const AUTH_WINDOW_MS = 15 * 60_000;

// ── In-process sliding window store ──────────────────────────────────────────
// Each entry: { timestamps: number[] }
// Works correctly for single-instance dev; for multi-replica prod use Upstash.

interface WindowEntry {
  timestamps: number[];
  lockedUntil?: number;
}

const store = new Map<string, WindowEntry>();

// Periodically prune stale keys to prevent unbounded growth.
// Edge middleware runs per-request so we prune on every ~100th call.
let _callCount = 0;
function maybePrune() {
  if (++_callCount % 100 !== 0) return;
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.timestamps.every((t) => now - t > AUTH_WINDOW_MS) && !entry.lockedUntil) {
      store.delete(key);
    }
  }
}

// ── IP extraction ─────────────────────────────────────────────────────────────

function extractIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    const ips = xff.split(',').map((s) => s.trim()).filter(Boolean);
    const idx = ips.length - PROXY_DEPTH - 1;
    if (idx >= 0) return ips[idx];
    if (ips.length > 0) return ips[0];
  }
  return req.headers.get('x-real-ip') ?? '0.0.0.0';
}

// ── Bot / scanner detection ───────────────────────────────────────────────────

const SCANNER_RE =
  /sqlmap|nikto|dirbuster|masscan|nmap|hydra|medusa|nessus|metasploit|burpsuite|havij|zgrab|acunetix|nuclei|feroxbuster|gobuster|wfuzz/i;

function isBot(req: NextRequest): boolean {
  const ua = req.headers.get('user-agent') ?? '';
  if (!ua) return true;
  return SCANNER_RE.test(ua);
}

// ── Sliding window check ──────────────────────────────────────────────────────

function checkLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Check lockout (progressive lockout not wired here — handled server-side)
  if (entry.lockedUntil && now < entry.lockedUntil) {
    return { allowed: false, retryAfter: Math.ceil((entry.lockedUntil - now) / 1000) };
  }

  // Evict expired entries
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  if (entry.timestamps.length >= limit) {
    const oldest = entry.timestamps[0];
    const retryAfter = Math.ceil((oldest + windowMs - now) / 1000);
    return { allowed: false, retryAfter: Math.max(1, retryAfter) };
  }

  entry.timestamps.push(now);
  return { allowed: true, retryAfter: 0 };
}

// ── Middleware ────────────────────────────────────────────────────────────────

export function middleware(req: NextRequest) {
  maybePrune();

  const { pathname } = req.nextUrl;

  // Only apply to API routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Bot check on all API routes
  if (isBot(req)) {
    return new NextResponse(
      JSON.stringify({ error: 'Forbidden', statusCode: 403 }),
      {
        status: 403,
        headers: { 'content-type': 'application/json' },
      },
    );
  }

  const ip = extractIp(req);
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));

  const { allowed, retryAfter } = isAuthRoute
    ? checkLimit(`auth:${ip}`, AUTH_LIMIT, AUTH_WINDOW_MS)
    : checkLimit(`api:${ip}`, API_LIMIT, API_WINDOW_MS);

  if (!allowed) {
    return new NextResponse(
      JSON.stringify({
        error: 'Too many requests. Please wait before trying again.',
        statusCode: 429,
        retryAfter,
      }),
      {
        status: 429,
        headers: {
          'content-type': 'application/json',
          'retry-after': String(retryAfter),
        },
      },
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
