"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { UnauthenticatedSidebar } from "@/components/unauthenticated-sidebar";
import { useAuth } from "@/lib/auth-context";

export default function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isClient, setIsClient] = useState(false);

    // Check if current page is the event creation page
    const isEventCreationPage = pathname === '/events/submission';
    const isEventPage = /^\/events\/[^/]+$/.test(pathname);

    useEffect(() => {
        setIsClient(true);

        // Allow access to event creation page for unauthenticated users
        if (!loading && !user && !isEventCreationPage && !isEventPage) {
            router.push("/login");
        }
    }, [user, loading, router, pathname, isEventCreationPage, isEventPage]);

    // Don't render anything on the server to prevent hydration errors
    if (!isClient) {
        console.log("isClient", isClient);
        return null;
    }

    // Show loading state while checking authentication
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen">
                <p className="text-lg">Loading...</p>
            </div>
        );
    }

    // If not authenticated and not on the events page, don't render the content (will redirect in useEffect)
    if (!user && !isEventCreationPage && !isEventPage) {
        console.log("not user");
        return null;
    }

    return (
        <SidebarProvider>
            {user ? <AppSidebar /> : <UnauthenticatedSidebar />}
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1" />
                    </div>
                </header>
                <main className={`antialiased`}>
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
} 