import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;
    // allow public files, auth routes, _next, etc.
    if (
        pathname.startsWith("/api/auth") ||
        pathname.startsWith("/_next") ||
        pathname.includes(".")
    ) {
        return NextResponse.next();
    }

    const token = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
    });

    // If no token and trying to access a protected page → redirect to /login
    if (!token && pathname !== "/login" && pathname !== "/") {
        const url = req.nextUrl.clone();
        url.pathname = "/login";
        return NextResponse.redirect(url);
    }

    // If a user is authenticated and visits /login → send them to home
    if (token && pathname === "/login") {
        const url = req.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
    }

    // Role-based access control
    if (token) {
        const userRole = token.role as string;

        // Admin can't access staff routes
        if (
            userRole === "ADMIN" &&
            (pathname.startsWith("/staff") || pathname.startsWith("/api/staff"))
        ) {
            const url = req.nextUrl.clone();
            url.pathname = "/dashboard";
            return NextResponse.redirect(url);
        }

        // Staff can't access admin routes
        if (
            userRole === "STAFF" &&
            (pathname.startsWith("/admin") || pathname.startsWith("/api/admin"))
        ) {
            const url = req.nextUrl.clone();
            url.pathname = "/dashboard";
            return NextResponse.redirect(url);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
