import { NextRequest, NextResponse } from "next/server";

// 8KB covers the largest valid payload in this system (notes up to 2000 chars + all other fields)
const BODY_SIZE_LIMIT = 8192;

export async function middleware(req: NextRequest) {
  // Generate a per-request nonce for CSP (S9-H1)
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://www.googletagmanager.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' https://images.unsplash.com",
    "connect-src 'self' https://www.google-analytics.com https://vitals.vercel-insights.com",
    "frame-src https://www.google.com/maps/",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'",
    "form-action 'self'",
    "worker-src 'none'",
  ].join("; ");

  // Pass nonce downstream so layout/components can use it
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);

  // API-only: enforce body size limit (S9-M6: with 10s read timeout for chunked requests)
  if (req.nextUrl.pathname.startsWith("/api/")) {
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > BODY_SIZE_LIMIT) {
      return NextResponse.json({ error: "Request body too large" }, { status: 413 });
    }
    // Enforce limit for chunked requests without Content-Length
    if (!contentLength && req.body && ["POST", "PUT", "PATCH"].includes(req.method)) {
      const readWithTimeout = Promise.race([
        req.clone().text(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), 10000)
        ),
      ]);
      try {
        const bodyText = await readWithTimeout;
        if (bodyText.length > BODY_SIZE_LIMIT) {
          return NextResponse.json({ error: "Request body too large" }, { status: 413 });
        }
      } catch (e) {
        if ((e as Error).message === "timeout") {
          return NextResponse.json({ error: "Request timeout" }, { status: 408 });
        }
        throw e;
      }
    }
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  response.headers.set("Content-Security-Policy", csp);

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static assets:
     * - _next/static (static files)
     * - _next/image  (image optimization)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon\\.ico).*)",
  ],
};
