import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROXY_DEPTH = parseInt(process.env.PROXY_DEPTH ?? "1", 10);

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/notes",
  "/graph",
  "/daily",
  "/canvas",
  "/flashcards",
  "/quizzes",
  "/assignments",
  "/calendar",
  "/exams",
  "/pdf-chat",
  "/ai-assistant",
  "/settings",
  "/timer",
  "/revision",
  "/exam-mode",
];

const AUTH_ONLY_ROUTES = ["/login", "/register", "/reset-password"];

const hasSupabase =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== "your_supabase_url";

interface WindowEntry {
  timestamps: number[];
  lockedUntil?: number;
}

const rlStore = new Map<string, WindowEntry>();
let _callCount = 0;

function maybePrune() {
  if (++_callCount % 100 !== 0) return;
  const now = Date.now();
  for (const [key, entry] of rlStore.entries()) {
    if (
      entry.timestamps.every((t) => now - t > 15 * 60_000) &&
      (!entry.lockedUntil || now >= entry.lockedUntil)
    ) {
      rlStore.delete(key);
    }
  }
}

function extractIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const ips = xff.split(",").map((s) => s.trim()).filter(Boolean);
    const idx = ips.length - PROXY_DEPTH - 1;
    return idx >= 0 ? ips[idx] : (ips[0] ?? "0.0.0.0");
  }
  return req.headers.get("x-real-ip") ?? "0.0.0.0";
}

function checkLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  let entry = rlStore.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    rlStore.set(key, entry);
  }
  if (entry.lockedUntil && now < entry.lockedUntil) {
    return { allowed: false, retryAfter: Math.ceil((entry.lockedUntil - now) / 1000) };
  }
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);
  if (entry.timestamps.length >= limit) {
    const oldest = entry.timestamps[0];
    return { allowed: false, retryAfter: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)) };
  }
  entry.timestamps.push(now);
  return { allowed: true, retryAfter: 0 };
}

const SCANNER_RE =
  /sqlmap|nikto|dirbuster|masscan|nmap|hydra|medusa|nessus|metasploit|burpsuite|havij|zgrab|acunetix|nuclei|feroxbuster|gobuster|wfuzz/i;

export async function middleware(req: NextRequest) {
  maybePrune();

  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/")) {
    const ua = req.headers.get("user-agent") ?? "";
    if (!ua || SCANNER_RE.test(ua)) {
      return new NextResponse(
        JSON.stringify({ error: "Forbidden", statusCode: 403 }),
        { status: 403, headers: { "content-type": "application/json" } }
      );
    }

    const ip = extractIp(req);
    const isAuthRoute = pathname.startsWith("/api/auth/");
    const { allowed, retryAfter } = isAuthRoute
      ? checkLimit(`auth:${ip}`, 5, 15 * 60_000)
      : checkLimit(`api:${ip}`, 60, 60_000);

    if (!allowed) {
      return new NextResponse(
        JSON.stringify({ error: "Too many requests", statusCode: 429, retryAfter }),
        {
          status: 429,
          headers: { "content-type": "application/json", "retry-after": String(retryAfter) },
        }
      );
    }
  }

  if (!hasSupabase) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            req.cookies.set(name, value)
          );
          response = NextResponse.next({ request: req });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  const isAuthenticated = !!session;

  if (isAuthenticated && AUTH_ONLY_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (!isAuthenticated && PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
