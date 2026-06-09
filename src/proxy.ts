import { NextRequest, NextResponse } from "next/server";

const adminRealm = 'Basic realm="ArcRadar Admin", charset="UTF-8"';

export function proxy(request: NextRequest) {
  const password = process.env.ADMIN_PASSWORD;

  if (!password) {
    if (process.env.NODE_ENV === "development") {
      return NextResponse.next();
    }

    return new NextResponse("Admin access is not configured.", {
      headers: {
        "Cache-Control": "no-store",
      },
      status: 503,
    });
  }

  const credentials = getBasicAuthCredentials(
    request.headers.get("authorization"),
  );
  const username = process.env.ADMIN_USERNAME || "admin";

  if (credentials?.username === username && credentials.password === password) {
    const response = NextResponse.next();
    response.headers.set("Cache-Control", "no-store");
    return response;
  }

  return new NextResponse("Authentication required.", {
    headers: {
      "Cache-Control": "no-store",
      "WWW-Authenticate": adminRealm,
    },
    status: 401,
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
