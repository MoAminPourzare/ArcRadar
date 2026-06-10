import { NextRequest, NextResponse } from "next/server";

const adminRealm = 'Basic realm="ArcRadar Admin", charset="UTF-8"';
const adminAuthWindowMs = 5 * 60 * 1_000;
const adminAuthMaxFailures = 10;
const adminAuthFailures = new Map<string, { count: number; resetAt: number }>();
const minimumProductionPasswordLength = 16;

export function proxy(request: NextRequest) {
  const password = process.env.ADMIN_PASSWORD;
  const clientKey = getClientKey(request);

  if (!password) {
    if (process.env.NODE_ENV === "development") {
      return withAdminSecurityHeaders(NextResponse.next());
    }

    return adminResponse("Admin access is not configured.", 503);
  }

  if (
    process.env.NODE_ENV === "production" &&
    password.length < minimumProductionPasswordLength
  ) {
    return adminResponse("Admin password is too short for production.", 503);
  }

  const credentials = getBasicAuthCredentials(
    request.headers.get("authorization"),
  );
  const username = process.env.ADMIN_USERNAME || "admin";

  if (
    credentials &&
    safeEqual(credentials.username, username) &&
    safeEqual(credentials.password, password)
  ) {
    adminAuthFailures.delete(clientKey);
    return withAdminSecurityHeaders(NextResponse.next());
  }

  const rateLimit = registerAdminAuthFailure(clientKey);

  if (!rateLimit.ok) {
    return adminResponse("Too many admin authentication attempts.", 429, {
      "Retry-After": rateLimit.retryAfterSeconds.toString(),
    });
  }

  return adminResponse("Authentication required.", 401, {
    "WWW-Authenticate": adminRealm,
  });
}

export const config = {
  matcher: "/admin/:path*",
};

function getBasicAuthCredentials(authorization: null | string) {
  if (!authorization?.startsWith("Basic ")) {
    return null;
  }

  try {
    const decoded = atob(authorization.slice("Basic ".length));
    const separatorIndex = decoded.indexOf(":");

    if (separatorIndex === -1) {
      return null;
    }

    return {
      password: decoded.slice(separatorIndex + 1),
      username: decoded.slice(0, separatorIndex),
    };
  } catch {
    return null;
  }
}

function adminResponse(
  body: string,
  status: number,
  headers: Record<string, string> = {},
) {
  return withAdminSecurityHeaders(
    new NextResponse(body, {
      headers,
      status,
    }),
  );
}

function withAdminSecurityHeaders(response: NextResponse) {
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

function getClientKey(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");

  return forwardedFor?.split(",")[0]?.trim() || realIp || "unknown";
}

function registerAdminAuthFailure(clientKey: string) {
  const now = Date.now();
  const existing = adminAuthFailures.get(clientKey);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + adminAuthWindowMs;
    adminAuthFailures.set(clientKey, {
      count: 1,
      resetAt,
    });

    return {
      ok: true as const,
    };
  }

  existing.count += 1;

  if (existing.count > adminAuthMaxFailures) {
    return {
      ok: false as const,
      retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1_000),
    };
  }

  return {
    ok: true as const,
  };
}

function safeEqual(left: string, right: string) {
  const maxLength = Math.max(left.length, right.length);
  let mismatch = left.length ^ right.length;

  for (let index = 0; index < maxLength; index += 1) {
    mismatch |=
      (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  }

  return mismatch === 0;
}
