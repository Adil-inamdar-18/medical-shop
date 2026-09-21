import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/signup"];

// "Admin Panel", "Dashboard" and the full customer directory - not
// accessible to non-admin users, even via direct navigation (see
// Sidebar.tsx / admin/page.tsx / app/page.tsx / app/customers/page.tsx).
const ADMIN_ONLY_PATHS = ["/", "/admin", "/customers"];

// Best-effort decode of the JWT payload to read the role for routing
// decisions. This is not signature verification - the backend still
// verifies the token on every API call it protects.
function decodeRole(token: string): string | null {
  try {
    const payload = token.split(".")[1];
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = JSON.parse(atob(normalized));
    return typeof json.role === "string" ? json.role : null;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value ?? null;

  if (PUBLIC_PATHS.includes(pathname)) {
    if (token) {
      const role = decodeRole(token);
      const destination = role === "admin" ? "/" : "/orders";
      return NextResponse.redirect(new URL(destination, request.url));
    }
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const role = decodeRole(token);

  if (ADMIN_ONLY_PATHS.includes(pathname) && role !== "admin") {
    return NextResponse.redirect(new URL("/orders", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
