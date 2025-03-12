import { NextResponse } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware() {
    // For Firebase authentication, we can't check auth status in middleware
    // because Firebase auth is client-side only
    // Instead, we'll handle auth redirects in the client components

    // However, we can add some basic route protection here
    // For example, redirecting from root to login if needed

    return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
}; 